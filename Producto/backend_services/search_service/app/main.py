import json
import logging
import os
import sys
import time

from fastapi import FastAPI, HTTPException, Query
from prometheus_client import Counter, Histogram, make_asgi_app

from app.database import supabase

"""
Search Service (PostgreSQL Full-Text Search + Autocomplete).

Objetivo:
- Exponer endpoints de búsqueda sin sobrecargar el catalog_service con lógica de ranking/consulta avanzada.
- Apoyarse en PostgreSQL (Supabase) para FTS (índices GIN + tsvector) sin infraestructura extra.
"""

app = FastAPI(title="Lectura Viva - Search Service", version="1.0")


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
logger = logging.getLogger("search_service")


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
        REQUEST_COUNT.labels("search_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("search_service", request.method, request.url.path).observe(duration)
    return response


@app.get("/search/health")
def health():
    return {"status": "ok"}


@app.get("/search/books")
def search_books(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0, le=500),
):
    try:
        resp = supabase.rpc("search_books", {"q": q, "limit_n": limit, "offset_n": offset}).execute()
        return resp.data or []
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/search/suggest")
def suggest_books(
    q: str = Query(min_length=1, max_length=100),
    limit: int = Query(default=10, ge=1, le=20),
):
    try:
        like = f"%{q}%"
        resp = (
            supabase.table("books")
            .select("id,titulo,autor,isbn,precio_fisico,precio_digital,categoria_id,imagenes,calificacion_promedio")
            .or_(f"titulo.ilike.{like},autor.ilike.{like},isbn.ilike.{like}")
            .limit(limit)
            .execute()
        )
        return resp.data or []
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8008, reload=True)
