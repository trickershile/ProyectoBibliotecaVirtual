import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, status
from prometheus_client import Counter, Histogram, make_asgi_app

from app.database import supabase
from app.models import ReviewCreate, ReviewModeration, ReviewResponse, ReviewUpdate

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

"""
Reviews Service (Reseñas + Ratings + Moderación).

Objetivo:
- Permitir que socios califiquen libros y dejen reseñas, con un flujo de moderación (admin).

Justificación arquitectónica:
- Se separa del catalog_service para que:
  1) el catálogo no se vuelva un monolito (productos + búsqueda + reseñas + moderación),
  2) la lectura del catálogo siga siendo liviana,
  3) la moderación/admin pueda evolucionar sin tocar el core de inventario/ventas.

Reglas de negocio:
- Un usuario puede crear como máximo 1 reseña por libro (unique usuario_id + libro_id).
- Las reseñas visibles al público son solo las aprobadas (estado='approved').
- Cada cambio de moderación recalcula books.calificacion_promedio para mantener el catálogo consistente.
"""

app = FastAPI(title="Lectura Viva - Reviews Service", version="1.0")


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
logger = logging.getLogger("reviews_service")


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
        REQUEST_COUNT.labels("reviews_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("reviews_service", request.method, request.url.path).observe(duration)
    return response


AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
http_client = httpx.Client(timeout=5)


def _verify_token(authorization: str) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Falta el token de autorización.")
    try:
        response = http_client.get(f"{AUTH_SERVICE_URL}/auth/verify", headers={"Authorization": authorization})
    except Exception:
        raise HTTPException(status_code=503, detail="Auth service no disponible.")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    return response.json()


def _require_admin(authorization: str) -> dict:
    identity = _verify_token(authorization)
    if identity.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    return identity


def _book_id_to_int(book_id: str) -> int:
    try:
        return int(book_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de libro inválido.")


def _recompute_book_rating(book_id_int: int):
    try:
        reviews = (
            supabase.table("reviews")
            .select("rating")
            .eq("libro_id", book_id_int)
            .eq("estado", "approved")
            .execute()
            .data
            or []
        )
        if not reviews:
            supabase.table("books").update({"calificacion_promedio": 0}).eq("id", book_id_int).execute()
            return

        avg = sum(int(r.get("rating") or 0) for r in reviews) / max(len(reviews), 1)
        supabase.table("books").update({"calificacion_promedio": round(avg, 2)}).eq("id", book_id_int).execute()
    except Exception as e:
        logger.error("Error recalculando rating para libro %s: %s", book_id_int, e)


@app.get("/reviews/health")
def health():
    """
    Healthcheck del servicio.
    """
    return {"status": "ok"}


@app.get("/reviews/books/{book_id}", response_model=List[ReviewResponse])
def list_book_reviews(
    book_id: str,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0, le=500),
):
    """
    Caso de uso (Público): listar reseñas aprobadas de un libro.

    Devuelve:
    - reseñas con estado='approved' para consumo directo del frontend.
    """
    book_id_int = _book_id_to_int(book_id)
    try:
        response = (
            supabase.table("reviews")
            .select("*")
            .eq("libro_id", book_id_int)
            .eq("estado", "approved")
            .order("id", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reviews/books/{book_id}", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(book_id: str, data: ReviewCreate, authorization: str = Header(default="")):
    """
    Caso de uso (Socio): crear reseña.

    Seguridad:
    - Se toma el usuario_id desde el JWT validado (auth_service), no desde el body.
    """
    identity = _verify_token(authorization)
    book_id_int = _book_id_to_int(book_id)

    try:
        book = supabase.table("books").select("id").eq("id", book_id_int).single().execute().data
        if not book:
            raise HTTPException(status_code=404, detail="Libro no encontrado.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    payload = {
        "libro_id": book_id_int,
        "usuario_id": identity.get("id"),
        "rating": data.rating,
        "comentario": data.comentario,
        "estado": "pending",
        "motivo": None,
    }
    try:
        inserted = supabase.table("reviews").insert(payload).execute()
        if not inserted.data:
            raise HTTPException(status_code=400, detail="No se pudo crear la reseña.")
        return inserted.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.patch("/reviews/{review_id}", response_model=ReviewResponse)
def update_review(review_id: str, data: ReviewUpdate, authorization: str = Header(default="")):
    """
    Caso de uso (Socio): editar su reseña.

    Regla de negocio:
    - Si la reseña está aprobada, el cambio vuelve a estado 'pending' para re-moderación.
    """
    identity = _verify_token(authorization)
    try:
        review_id_int = int(review_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de reseña inválido.")

    try:
        current = supabase.table("reviews").select("*").eq("id", review_id_int).single().execute().data
        if not current:
            raise HTTPException(status_code=404, detail="Reseña no encontrada.")
        if identity.get("role") != "admin" and current.get("usuario_id") != identity.get("id"):
            raise HTTPException(status_code=403, detail="No autorizado.")

        payload = data.model_dump(exclude_none=True)
        if not payload:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar.")

        if current.get("estado") == "approved" and identity.get("role") != "admin":
            payload["estado"] = "pending"
            payload["motivo"] = None

        updated = supabase.table("reviews").update(payload).eq("id", review_id_int).execute()
        if not updated.data:
            raise HTTPException(status_code=404, detail="Reseña no encontrada.")

        if current.get("estado") == "approved" and payload.get("estado") == "pending":
            _recompute_book_rating(int(current.get("libro_id")))

        return updated.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: str, authorization: str = Header(default="")):
    """
    Caso de uso: eliminar reseña (dueño o admin).
    """
    identity = _verify_token(authorization)
    try:
        review_id_int = int(review_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de reseña inválido.")

    try:
        current = supabase.table("reviews").select("*").eq("id", review_id_int).single().execute().data
        if not current:
            raise HTTPException(status_code=404, detail="Reseña no encontrada.")
        if identity.get("role") != "admin" and current.get("usuario_id") != identity.get("id"):
            raise HTTPException(status_code=403, detail="No autorizado.")

        supabase.table("reviews").delete().eq("id", review_id_int).execute()
        if current.get("estado") == "approved":
            _recompute_book_rating(int(current.get("libro_id")))
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reviews/moderation/pending", response_model=List[ReviewResponse])
def list_pending_reviews(authorization: str = Header(default="")):
    """
    Caso de uso (Admin): ver cola de moderación.
    """
    _require_admin(authorization)
    try:
        response = (
            supabase.table("reviews")
            .select("*")
            .eq("estado", "pending")
            .order("id", desc=True)
            .limit(100)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/reviews/{review_id}/moderate", response_model=ReviewResponse)
def moderate_review(review_id: str, data: ReviewModeration, authorization: str = Header(default="")):
    """
    Caso de uso (Admin): aprobar/rechazar reseña.

    Regla de negocio:
    - Al aprobar/rechazar, se recalcula la calificación promedio del libro para mantener el catálogo coherente.
    """
    _require_admin(authorization)
    try:
        review_id_int = int(review_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de reseña inválido.")

    try:
        current = supabase.table("reviews").select("*").eq("id", review_id_int).single().execute().data
        if not current:
            raise HTTPException(status_code=404, detail="Reseña no encontrada.")

        payload = {"estado": data.estado, "motivo": data.motivo}
        updated = supabase.table("reviews").update(payload).eq("id", review_id_int).execute()
        if not updated.data:
            raise HTTPException(status_code=404, detail="Reseña no encontrada.")

        _recompute_book_rating(int(current.get("libro_id")))
        return updated.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8012, reload=True)

