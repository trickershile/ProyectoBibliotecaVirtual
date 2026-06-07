import json
import logging
import os
import sys
import time

from fastapi import FastAPI, HTTPException, status, Header
import httpx
from app.database import supabase
from app.models import CartItemCreate, CartItemUpdate, CartItemResponse, CartCheckoutRequest
from prometheus_client import Counter, Histogram, make_asgi_app

"""
Cart Service (Carrito).

Responsabilidad:
- Mantener una selección temporal de items por usuario antes del checkout.

Reglas de negocio:
- El carrito es privado: solo el dueño (usuario_id) puede leer/modificar (admin puede auditar).
- Si el usuario agrega el mismo libro y tipo_item, se acumula cantidad (unique key).
- El checkout delega la creación de orden al Orders Service y luego vacía el carrito.
"""

app = FastAPI(title="Lectura Viva - Cart Service", version="1.0")

class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": int(time.time() * 1000),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
root_logger = logging.getLogger()
root_logger.handlers = [handler]
root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("cart_service")

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def metrics_middleware(request, call_next):
    """
    Middleware de métricas (Prometheus).
    """
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("cart_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("cart_service", request.method, request.url.path).observe(duration)
    return response

ORDERS_SERVICE_URL = os.getenv("ORDERS_SERVICE_URL", "http://127.0.0.1:8003")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
http_client = httpx.Client(timeout=5)

def _verify_token(authorization: str):
    """
    Verifica JWT consultando auth_service.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Falta el token de autorización.")
    try:
        response = http_client.get(f"{AUTH_SERVICE_URL}/auth/verify", headers={"Authorization": authorization})
    except Exception:
        raise HTTPException(status_code=503, detail="Auth service no disponible.")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    return response.json()


def _require_owner_or_admin(usuario_id: str, authorization: str):
    """
    Regla de negocio (privacidad):
    - socio solo puede operar su propio carrito.
    - admin puede operar/inspeccionar (útil para soporte).
    """
    verification = _verify_token(authorization)
    if verification.get("id") != usuario_id and verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    return verification


@app.get("/cart/{usuario_id}/items")
def get_cart_items(usuario_id: str, authorization: str = Header(default="")):
    """
    Lista items del carrito de un usuario.
    """
    _require_owner_or_admin(usuario_id, authorization)
    response = supabase.table("cart_items").select("*").eq("usuario_id", usuario_id).execute()
    return response.data or []


@app.post("/cart/{usuario_id}/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_cart_item(usuario_id: str, item: CartItemCreate, authorization: str = Header(default="")):
    """
    Agrega un ítem al carrito.

    Regla de negocio:
    - Si ya existe (usuario_id, libro_id, tipo_item), se suma cantidad.
    """
    _require_owner_or_admin(usuario_id, authorization)
    if item.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0.")

    existing = (
        supabase.table("cart_items")
        .select("*")
        .match({"usuario_id": usuario_id, "libro_id": item.libro_id, "tipo_item": item.tipo_item})
        .execute()
    )

    if existing.data:
        current = existing.data[0]
        nuevo_valor = int(current.get("cantidad", 0)) + item.cantidad
        updated = (
            supabase.table("cart_items")
            .update({"cantidad": nuevo_valor, "precio_unitario": item.precio_unitario})
            .eq("id", current["id"])
            .execute()
        )
        return updated.data[0]

    payload = item.model_dump()
    payload["usuario_id"] = usuario_id
    inserted = supabase.table("cart_items").insert(payload).execute()
    if not inserted.data:
        raise HTTPException(status_code=400, detail="No se pudo agregar el ítem al carrito.")
    return inserted.data[0]


@app.put("/cart/{usuario_id}/items/{item_id}", response_model=CartItemResponse)
def update_cart_item(usuario_id: str, item_id: str, update: CartItemUpdate, authorization: str = Header(default="")):
    """
    Actualiza la cantidad de un ítem del carrito.
    """
    _require_owner_or_admin(usuario_id, authorization)
    if update.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0.")

    try:
        item_id_int = int(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de ítem inválido.")

    current = supabase.table("cart_items").select("*").eq("id", item_id_int).single().execute().data
    if not current or current.get("usuario_id") != usuario_id:
        raise HTTPException(status_code=404, detail="Ítem no encontrado.")

    updated = supabase.table("cart_items").update({"cantidad": update.cantidad}).eq("id", item_id_int).execute()
    if not updated.data:
        raise HTTPException(status_code=404, detail="Ítem no encontrado.")
    return updated.data[0]


@app.delete("/cart/{usuario_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart_item(usuario_id: str, item_id: str, authorization: str = Header(default="")):
    """
    Elimina un ítem del carrito.
    """
    _require_owner_or_admin(usuario_id, authorization)
    try:
        item_id_int = int(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de ítem inválido.")

    current = supabase.table("cart_items").select("*").eq("id", item_id_int).single().execute().data
    if not current or current.get("usuario_id") != usuario_id:
        raise HTTPException(status_code=404, detail="Ítem no encontrado.")

    supabase.table("cart_items").delete().eq("id", item_id_int).execute()
    return


@app.delete("/cart/{usuario_id}/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(usuario_id: str, authorization: str = Header(default="")):
    """
    Vacía el carrito completo del usuario.
    """
    _require_owner_or_admin(usuario_id, authorization)
    supabase.table("cart_items").delete().eq("usuario_id", usuario_id).execute()
    return


@app.post("/cart/{usuario_id}/checkout")
async def checkout_cart(usuario_id: str, data: CartCheckoutRequest, authorization: str = Header(default="")):
    """
    Caso de uso: checkout desde carrito.

    Proceso:
    1) Lee items del carrito.
    2) Llama a Orders Service /orders/checkout.
    3) Si la orden se crea, borra los items del carrito.
    """
    _require_owner_or_admin(usuario_id, authorization)
    items_response = supabase.table("cart_items").select("*").eq("usuario_id", usuario_id).execute()
    items = items_response.data or []
    if not items:
        raise HTTPException(status_code=400, detail="El carrito está vacío.")

    payload = {
        "usuario_id": usuario_id,
        "metodo_entrega": data.metodo_entrega,
        "items": [
            {
                "libro_id": str(i["libro_id"]),
                "cantidad": i["cantidad"],
                "precio_unitario": float(i["precio_unitario"]),
                "tipo_item": i["tipo_item"]
            }
            for i in items
        ]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ORDERS_SERVICE_URL}/orders/checkout",
            json=payload,
            headers={"Authorization": authorization}
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=400, detail=response.text)

    supabase.table("cart_items").delete().eq("usuario_id", usuario_id).execute()
    return response.json()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8006, reload=True)
