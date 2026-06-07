import json
import logging
import os
import sys
import time
import uuid

from fastapi import FastAPI, HTTPException, status, Header, Query
from app.database import supabase
from app.models import PaymentIntentCreate, PaymentIntentResponse
import httpx
from typing import Optional, List
from prometheus_client import Counter, Histogram, make_asgi_app

"""
Payment Service (Pagos).

Objetivo:
- Registrar intentos de pago y su estado en PostgreSQL (tabla pagos).

Patrón de resiliencia:
- Circuit breaker + retries para la integración con una pasarela real (PAYMENT_PROVIDER_URL).
  Si la pasarela falla repetidamente, se abre el circuito para responder rápido y no saturar el sistema.

Decisión para entrega/examen:
- El proveedor es opcional: si PAYMENT_PROVIDER_URL está vacío, se simula OK y se mantiene el flujo.
"""

app = FastAPI(title="Lectura Viva - Payment Service", version="1.0")

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
logger = logging.getLogger("payment_service")

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def metrics_middleware(request, call_next):
    """
    Middleware de métricas (Prometheus) para pagos.
    """
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("payment_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("payment_service", request.method, request.url.path).observe(duration)
    return response

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
ORDERS_SERVICE_URL = os.getenv("ORDERS_SERVICE_URL", "http://127.0.0.1:8003")
PAYMENT_PROVIDER_URL = os.getenv("PAYMENT_PROVIDER_URL", "")
http_client = httpx.Client(timeout=5)

circuit_breaker = {"failures": 0, "open_until": 0}

def _circuit_allow() -> bool:
    return time.time() >= circuit_breaker["open_until"]

def _circuit_on_success():
    circuit_breaker["failures"] = 0
    circuit_breaker["open_until"] = 0

def _circuit_on_failure(threshold: int = 3, cooldown: int = 30):
    circuit_breaker["failures"] += 1
    if circuit_breaker["failures"] >= threshold:
        circuit_breaker["open_until"] = time.time() + cooldown

def _call_payment_provider(payload: dict):
    """
    Llama a una pasarela de pago externa con tolerancia a fallos.

    Estrategia:
    - Retries con backoff exponencial (3 intentos).
    - Circuit breaker: se abre si hay demasiadas fallas seguidas, por un cooldown.
    """
    if not PAYMENT_PROVIDER_URL:
        return {"status": "ok"}

    if not _circuit_allow():
        raise HTTPException(status_code=503, detail="Pasarela de pago temporalmente no disponible.")

    last_exc = None
    for attempt in range(1, 4):
        try:
            resp = http_client.post(PAYMENT_PROVIDER_URL, json=payload)
            if resp.status_code >= 500:
                raise RuntimeError("provider_error")
            _circuit_on_success()
            return {"status": "ok", "provider_status": resp.status_code}
        except Exception as e:
            last_exc = e
            _circuit_on_failure()
            time.sleep(min(2 ** attempt, 5))

    raise HTTPException(status_code=503, detail="Pasarela de pago no disponible.")

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
    Regla de negocio:
    - socio: solo puede ver/crear sus pagos.
    - admin: puede auditar y ejecutar reembolsos.
    """
    verification = _verify_token(authorization)
    if verification.get("id") != usuario_id and verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    return verification


@app.post("/payments/intents", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
def crear_intento_pago(data: PaymentIntentCreate, authorization: str = Header(default="")):
    """
    Crea un intento de pago (intent).

    Devuelve:
    - registro en tabla pagos con estado='pendiente'
    """
    try:
        _require_owner_or_admin(data.usuario_id, authorization)
        payload = {
            "usuario_id": data.usuario_id,
            "orden_id": data.orden_id,
            "monto": data.monto,
            "metodo_pago": data.metodo_pago,
            "estado": "pendiente"
        }
        response = supabase.table("pagos").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/payments/intents", response_model=List[PaymentIntentResponse])
def listar_pagos(usuario_id: Optional[str] = Query(default=None), authorization: str = Header(default="")):
    """
    Lista pagos.

    - Si usuario_id viene en query: dueño o admin.
    - Sin usuario_id: solo admin (auditoría).
    """
    verification = _verify_token(authorization)
    if usuario_id:
        _require_owner_or_admin(usuario_id, authorization)
        response = supabase.table("pagos").select("*").eq("usuario_id", usuario_id).execute()
        return response.data or []

    if verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    response = supabase.table("pagos").select("*").execute()
    return response.data or []


@app.post("/payments/intents/{pago_id}/confirm", response_model=PaymentIntentResponse)
def confirmar_pago(pago_id: str, authorization: str = Header(default="")):
    """
    Confirma un pago.

    En producción:
    - Esta operación sería gatillada por el resultado de la pasarela (webhook/redirect).
    """
    try:
        try:
            pago_id_int = int(pago_id)
        except Exception:
            raise HTTPException(status_code=400, detail="ID de pago inválido.")

        pago = supabase.table("pagos").select("*").eq("id", pago_id_int).single().execute().data
        if not pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        _require_owner_or_admin(pago.get("usuario_id"), authorization)

        _call_payment_provider({"pago_id": pago_id_int, "monto": pago.get("monto")})

        response = supabase.table("pagos").update({"estado": "pagado"}).eq("id", pago_id_int).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        try:
            orden_id_int = int(pago.get("orden_id"))
            supabase.table("ordenes").update({"estado_pago": "pagado"}).eq("id", orden_id_int).execute()

            orden = supabase.table("ordenes").select("*").eq("id", orden_id_int).single().execute().data
            if orden:
                detalles = supabase.table("orden_detalles").select("*").eq("orden_id", orden_id_int).execute().data or []
                tiene_fisicos = any(d.get("tipo_item") == "fisico" for d in detalles)
                if tiene_fisicos and orden.get("metodo_entrega") != "digital":
                    existing = supabase.table("despachos").select("id").eq("orden_id", orden_id_int).execute().data or []
                    if not existing:
                        codigo_tracking = f"LV-{uuid.uuid4().hex[:8].upper()}"
                        direccion = "RETIRO_BIBLIOTECA" if orden.get("metodo_entrega") == "retiro_biblioteca" else "PENDIENTE"
                        supabase.table("despachos").insert(
                            {
                                "orden_id": orden_id_int,
                                "codigo_seguimiento": codigo_tracking,
                                "direccion_destino": direccion,
                                "sucursal_retiro_id": None,
                                "estado_envio": "en_preparacion"
                            }
                        ).execute()
        except Exception:
            logger.exception("order_shipping_sync_error")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/payments/intents/{pago_id}/refund", response_model=PaymentIntentResponse)
def reembolsar_pago(pago_id: str, authorization: str = Header(default="")):
    """
    Reembolsa un pago (solo admin).

    Regla de negocio:
    - Se restringe a admin para evitar abusos.
    """
    try:
        try:
            pago_id_int = int(pago_id)
        except Exception:
            raise HTTPException(status_code=400, detail="ID de pago inválido.")

        pago = supabase.table("pagos").select("*").eq("id", pago_id_int).single().execute().data
        if not pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        verification = _require_owner_or_admin(pago.get("usuario_id"), authorization)
        if verification.get("role") != "admin":
            raise HTTPException(status_code=403, detail="No autorizado.")

        response = supabase.table("pagos").update({"estado": "reembolsado"}).eq("id", pago_id_int).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        try:
            orden_id_int = int(pago.get("orden_id"))
            http_client.post(f"{ORDERS_SERVICE_URL}/orders/{orden_id_int}/refund", headers={"Authorization": authorization})
        except Exception:
            logger.exception("refund_sync_error")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/payments/intents/{pago_id}", response_model=PaymentIntentResponse)
def obtener_pago(pago_id: str, authorization: str = Header(default="")):
    """
    Obtiene un pago por id (dueño o admin).
    """
    try:
        try:
            pago_id_int = int(pago_id)
        except Exception:
            raise HTTPException(status_code=400, detail="ID de pago inválido.")

        response = supabase.table("pagos").select("*").eq("id", pago_id_int).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")
        _require_owner_or_admin(response.data.get("usuario_id"), authorization)
        return response.data
    except Exception:
        raise HTTPException(status_code=404, detail="Pago no encontrado.")


@app.delete("/payments/intents/{pago_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pago(pago_id: str, authorization: str = Header(default="")):
    """
    Elimina un pago (solo admin).

    En producción se sugiere borrado lógico y auditoría.
    """
    verification = _verify_token(authorization)
    if verification.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    try:
        pago_id_int = int(pago_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de pago inválido.")

    existing = supabase.table("pagos").select("id").eq("id", pago_id_int).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Pago no encontrado.")

    supabase.table("pagos").delete().eq("id", pago_id_int).execute()
    return


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8005, reload=True)
