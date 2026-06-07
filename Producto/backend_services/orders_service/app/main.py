import json
import logging
import sys
import time

from fastapi import FastAPI, HTTPException, status, Header
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from app.models import CheckoutRequest, OrderStatusUpdate
import httpx  # Para comunicarnos internamente con el catálogo y bajar el stock
from prometheus_client import Counter, Histogram, make_asgi_app

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

"""
Orders Service (Órdenes + OrderItems).

Responsabilidad:
- Persistir la compra final (ordenes) y sus ítems (orden_detalles).
- Mantener trazabilidad contable básica (total, método de entrega, estado).

Decisiones de arquitectura:
- PostgreSQL vía Supabase para integrarse con RLS y auditoría.
- Descuento de stock se delega al catalog_service (single source of truth del inventario).

Reglas de negocio:
- Checkout calcula total = sum(cantidad * precio_unitario).
- Si el item es físico, descuenta stock mediante /catalog/books/{id}/action.
- Autorización: el usuario del token debe coincidir con usuario_id (o ser admin).
"""

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
logger = logging.getLogger("orders_service")

app = FastAPI(title="Lectura Viva - Orders & E-commerce Service", version="1.0")

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def metrics_middleware(request, call_next):
    """
    Middleware de métricas (Prometheus) para endpoints de e-commerce.
    """
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("orders_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("orders_service", request.method, request.url.path).observe(duration)
    return response

# Inyección del cliente relacional para auditoría de cajas y boletas
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://127.0.0.1:8001")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "")
http_client = httpx.Client(timeout=5)

def _verify_token(authorization: str):
    """
    Valida JWT llamando a auth_service y entrega identidad/rol.
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

async def _restock_physical_items(orden_id_int: int, usuario_id: str, authorization: str):
    detalles = supabase.table("orden_detalles").select("*").eq("orden_id", orden_id_int).execute().data or []
    async with httpx.AsyncClient(timeout=5) as client:
        for d in detalles:
            if d.get("tipo_item") != "fisico":
                continue
            cantidad = int(d.get("cantidad") or 0)
            if cantidad <= 0:
                continue
            payload_catalogo = {
                "usuario_id": usuario_id,
                "tipo_operacion": "reabastecimiento",
                "cantidad": cantidad
            }
            await client.post(
                f"{CATALOG_SERVICE_URL}/catalog/books/{d.get('libro_id')}/action",
                json=payload_catalogo,
                headers={"Authorization": authorization, "X-Internal-Token": INTERNAL_SERVICE_TOKEN}
            )

@app.post("/orders/checkout")
async def procesar_compra_ecommerce(pedido: CheckoutRequest, authorization: str = Header(default="")):
    """
    Caso de uso: Checkout (crear orden y sus items).

    Recibe:
    - usuario_id, metodo_entrega, items[{libro_id,cantidad,precio_unitario,tipo_item}]

    Devuelve:
    - orden_id y total_pagado.

    Nota:
    - En el checkout se crea la orden con estado_pago='pendiente'. La confirmación posterior se hace en Payment Service.
    """
    try:
        verification = _verify_token(authorization)
        if verification.get("id") != pedido.usuario_id and verification.get("role") != "admin":
            raise HTTPException(status_code=403, detail="No autorizado.")

        # 1. Calculamos el total de la orden barriendo la lista (programación funcional básica)
        total_orden = sum(item.cantidad * item.precio_unitario for item in pedido.items)
        
        # 2. Insertamos la orden principal en Supabase (Equivale a guardar la cabecera en JPA)
        orden_data = {
            "usuario_id": pedido.usuario_id,
            "total": total_orden,
            "metodo_entrega": pedido.metodo_entrega,
            "estado_pago": "pendiente"
        }
        res_orden = supabase.table("ordenes").insert(orden_data).execute()
        orden_id = res_orden.data[0]["id"]
        
        # 3. Guardamos los detalles del carrito e interactuamos con el catálogo en paralelo
        async with httpx.AsyncClient() as client:
            for item in pedido.items:
                # Insertamos el registro de auditoría de venta
                detalle_data = {
                    "orden_id": orden_id,
                    "libro_id": item.libro_id,
                    "cantidad": item.cantidad,
                    "precio_unitario": item.precio_unitario,
                    "tipo_item": item.tipo_item
                }
                supabase.table("orden_detalles").insert(detalle_data).execute()
                
                if item.tipo_item == "fisico":
                    payload_catalogo = {
                        "usuario_id": pedido.usuario_id,
                        "tipo_operacion": "compra_fisica",
                        "cantidad": item.cantidad
                    }
                    await client.post(
                        f"{CATALOG_SERVICE_URL}/catalog/books/{item.libro_id}/action",
                        json=payload_catalogo,
                        headers={"Authorization": authorization}
                    )
        
        return {
            "status": "success",
            "message": "Orden de e-commerce procesada y stock sincronizado.",
            "orden_id": orden_id,
            "total_pagado": total_orden
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/orders/{orden_id}")
def get_order(orden_id: str, authorization: str = Header(default="")):
    """
    Obtiene una orden por id.

    Regla de negocio (privacidad):
    - socio: solo puede ver sus propias órdenes.
    - admin: puede ver todas.
    """
    verification = _verify_token(authorization)
    try:
        orden_id_int = int(orden_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de orden inválido.")

    try:
        orden = supabase.table("ordenes").select("*").eq("id", orden_id_int).single().execute().data
        if not orden:
            raise HTTPException(status_code=404, detail="Orden no encontrada.")

        if verification.get("role") != "admin" and orden.get("usuario_id") != verification.get("id"):
            raise HTTPException(status_code=403, detail="No autorizado.")

        detalles = supabase.table("orden_detalles").select("*").eq("orden_id", orden_id_int).execute().data or []
        return {"orden": orden, "items": detalles}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Orden no encontrada.")


@app.get("/orders/user/{usuario_id}")
def get_orders_by_user(usuario_id: str, authorization: str = Header(default="")):
    """
    Lista órdenes por usuario.
    """
    verification = _verify_token(authorization)
    if verification.get("id") != usuario_id and verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    response = supabase.table("ordenes").select("*").eq("usuario_id", usuario_id).execute()
    return response.data or []

@app.get("/orders")
def get_all_orders(authorization: str = Header(default="")):
    """
    Lista todas las órdenes (solo admin).
    """
    verification = _verify_token(authorization)
    if verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    response = supabase.table("ordenes").select("*").execute()
    return response.data or []


@app.patch("/orders/{orden_id}/status")
def update_order_status(orden_id: str, data: OrderStatusUpdate, authorization: str = Header(default="")):
    """
    Actualiza estado de una orden (solo admin).

    Nota:
    - Por simplicidad se reutiliza el campo estado_pago.
    - En producción se recomienda separar: estado_pago y estado_envio/estado_orden.
    """
    verification = _verify_token(authorization)
    if verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    if not data.estado:
        raise HTTPException(status_code=400, detail="Estado inválido.")

    try:
        orden_id_int = int(orden_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de orden inválido.")

    response = supabase.table("ordenes").update({"estado_pago": data.estado}).eq("id", orden_id_int).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada.")
    return response.data[0]


@app.patch("/orders/{orden_id}/cancel")
async def cancel_order(orden_id: str, authorization: str = Header(default="")):
    """
    Cancela una orden (dueño o admin).

    Nota:
    - Para un flujo completo, aquí también se coordina reembolso y reposición de stock.
    """
    verification = _verify_token(authorization)
    try:
        orden_id_int = int(orden_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de orden inválido.")

    orden = supabase.table("ordenes").select("*").eq("id", orden_id_int).single().execute().data
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada.")

    if verification.get("role") != "admin" and orden.get("usuario_id") != verification.get("id"):
        raise HTTPException(status_code=403, detail="No autorizado.")

    if orden.get("estado_pago") == "pagado":
        raise HTTPException(status_code=400, detail="La orden ya está pagada. Solicita reembolso.")

    response = supabase.table("ordenes").update({"estado_pago": "cancelado"}).eq("id", orden_id_int).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada.")

    await _restock_physical_items(orden_id_int, str(orden.get("usuario_id")), authorization)
    supabase.table("despachos").delete().eq("orden_id", orden_id_int).execute()
    return response.data[0]


@app.post("/orders/{orden_id}/refund")
async def refund_order(orden_id: str, authorization: str = Header(default="")):
    verification = _verify_token(authorization)
    if verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")

    try:
        orden_id_int = int(orden_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de orden inválido.")

    orden = supabase.table("ordenes").select("*").eq("id", orden_id_int).single().execute().data
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada.")

    response = supabase.table("ordenes").update({"estado_pago": "reembolsado"}).eq("id", orden_id_int).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada.")

    await _restock_physical_items(orden_id_int, str(orden.get("usuario_id")), authorization)
    supabase.table("despachos").delete().eq("orden_id", orden_id_int).execute()
    return response.data[0]


@app.delete("/orders/{orden_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(orden_id: str, authorization: str = Header(default="")):
    """
    Elimina una orden (solo admin).

    En producción normalmente es borrado lógico y auditoría obligatoria.
    """
    verification = _verify_token(authorization)
    if verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")

    try:
        orden_id_int = int(orden_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de orden inválido.")

    existing = supabase.table("ordenes").select("id").eq("id", orden_id_int).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada.")

    supabase.table("ordenes").delete().eq("id", orden_id_int).execute()
    return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8003, reload=True)
