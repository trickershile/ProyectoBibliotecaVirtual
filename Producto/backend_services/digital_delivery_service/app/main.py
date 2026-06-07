import json
import logging
import os
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, status
from prometheus_client import Counter, Histogram, make_asgi_app

from app.database import supabase
from app.models import SignedUrlResponse

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

"""
Digital Delivery Service (Supabase Storage + URLs firmadas).

Objetivo:
- Entregar archivos digitales (PDF/EPUB/Audiolibro) de forma segura sin exponer el bucket como público.

Decisiones arquitectónicas:
- Se usa Supabase Storage con signed URLs para que el archivo se descargue desde el storage, no desde FastAPI.
  Esto reduce carga (CPU/ram/ancho de banda) en el clúster y permite escalar almacenamiento por separado.
- El servicio valida autorización contra auth_service y valida elegibilidad revisando compras (orden_detalles).

Reglas de negocio (control de acceso):
- socio: solo puede descargar si existe al menos un item digital/prestamo del libro en una orden pagada del usuario.
- admin: puede generar signed URLs para soporte/auditoría.
"""

app = FastAPI(title="Lectura Viva - Digital Delivery Service", version="1.0")


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": int(time.time() * 1000),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
root_logger = logging.getLogger()
root_logger.handlers = [handler]
root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("digital_delivery_service")


REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())


@app.middleware("http")
async def metrics_middleware(request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("digital_delivery_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("digital_delivery_service", request.method, request.url.path).observe(duration)
    return response


AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
DIGITAL_BUCKET = os.getenv("DIGITAL_BUCKET", "digital-books")
SIGNED_URL_EXPIRES_SECONDS = int(os.getenv("SIGNED_URL_EXPIRES_SECONDS", "600"))
http_client = httpx.Client(timeout=5)


def _verify_token(authorization: str):
    """
    Verifica JWT consultando auth_service.

    Se centraliza el estándar de autenticación del clúster en auth_service y se evita duplicar JWT parsing
    en cada microservicio.
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


def _book_id_to_int(book_id: str) -> int:
    try:
        return int(book_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de libro inválido.")


def _is_entitled(user_id: str, book_id_int: int) -> bool:
    detalles = supabase.table("orden_detalles").select("orden_id,tipo_item").eq("libro_id", book_id_int).execute().data or []
    if not detalles:
        return False

    order_ids = sorted({int(d["orden_id"]) for d in detalles if d.get("orden_id") is not None})
    if not order_ids:
        return False

    ordenes = (
        supabase.table("ordenes")
        .select("id,usuario_id,estado_pago")
        .eq("usuario_id", user_id)
        .eq("estado_pago", "pagado")
        .execute()
        .data
        or []
    )
    orden_ids_pagadas = {int(o["id"]) for o in ordenes if o.get("id") is not None}
    if not orden_ids_pagadas:
        return False

    for d in detalles:
        try:
            oid = int(d.get("orden_id") or 0)
        except Exception:
            continue
        if oid not in orden_ids_pagadas:
            continue
        if d.get("tipo_item") in {"digital", "prestamo"}:
            return True

    return False


def _resolve_storage_path(book_row: dict, kind: str) -> str:
    field = "url_digital_preview" if kind == "preview" else "url_libro_completo"
    value = (book_row or {}).get(field)
    if not value:
        raise HTTPException(status_code=404, detail="El libro no tiene archivo digital configurado.")
    if "://" in str(value):
        raise HTTPException(status_code=400, detail="Se esperaba un path de Storage (no un URL público).")
    return str(value)


@app.get("/delivery/health")
def health():
    """
    Healthcheck del servicio.
    """
    return {"status": "ok"}


@app.get("/delivery/books/{book_id}/signed-url", response_model=SignedUrlResponse)
def get_signed_url(
    book_id: str,
    kind: str = Query(default="full", pattern="^(full|preview)$"),
    expires_in: int = Query(default=SIGNED_URL_EXPIRES_SECONDS, ge=60, le=86400),
    authorization: str = Header(default=""),
):
    """
    Caso de uso: obtener un enlace firmado (signed URL) para descargar/leer un libro digital.

    Recibe:
    - book_id: ID del libro.
    - kind: full (libro completo) o preview (muestra).
    - expires_in: segundos de validez del URL firmado.
    - Authorization: Bearer <JWT>

    Devuelve:
    - signed_url temporal generado por Supabase Storage.
    """
    identity = _verify_token(authorization)
    book_id_int = _book_id_to_int(book_id)

    book = supabase.table("books").select("id,url_digital_preview,url_libro_completo").eq("id", book_id_int).single().execute().data
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado.")

    if identity.get("role") != "admin":
        if not _is_entitled(identity.get("id"), book_id_int):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a este contenido digital.")

    storage_path = _resolve_storage_path(book, "preview" if kind == "preview" else "full")

    try:
        result = supabase.storage.from_(DIGITAL_BUCKET).create_signed_url(storage_path, expires_in)
        signed_url = result.get("signedURL") or result.get("signed_url") or result.get("signedUrl")
        if not signed_url:
            raise RuntimeError("signed_url_not_returned")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"signed_url": signed_url, "expires_in": expires_in, "book_id": book_id_int, "kind": kind}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8010, reload=True)

