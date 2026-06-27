import json
import logging
import os
import sys
import time
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.chain import consultar_asesor_literario
from app.database import chats_collection, close_mongo_client
from app.models import HistorialChatDocument, MensajeChat
from prometheus_client import Counter, Histogram, make_asgi_app

"""
IA Recommender (Chat + Recomendaciones).

Decisiones:
- WebSocket para conversación en tiempo real.
- Historial en MongoDB: flexibilidad de esquema para conversación no estructurada (arreglo de mensajes con roles).
- Se evita bloquear la base relacional (Supabase/PostgreSQL) con escrituras de alta frecuencia del chat.
- Resiliencia en chain.py: retries + circuit breaker para Groq y consulta a catálogo.
"""

app = FastAPI(title="Lectura Viva - IA Recommender", version="1.0")

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
logger = logging.getLogger("ia_recommender")

@app.on_event("startup")
async def _startup():
    if chats_collection is None:
        return
    try:
        await chats_collection.create_index([("sesion_id", 1)], unique=True, name="uniq_sesion_id")
        await chats_collection.create_index([("last_activity_at", 1)], expireAfterSeconds=60 * 60 * 24 * 30, name="ttl_last_activity_30d")
    except Exception:
        logger.exception("mongo_index_error")

@app.on_event("shutdown")
async def _shutdown():
    """
    Cierre limpio de conexiones externas.
    """
    await close_mongo_client()
<<<<<<< HEAD
    from app.database import cache_client
    cache_client.close()
=======
>>>>>>> d92f6350cb9d40ed38561f8ea49b8482c32fc335

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def metrics_middleware(request, call_next):
<<<<<<< HEAD
    start = time.time()
    response = None
    try:
        response = await call_next(request)
        return response
    finally:
        duration = time.time() - start
        status_code = response.status_code if response else 500
        REQUEST_COUNT.labels("ia_recommender", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("ia_recommender", request.method, request.url.path).observe(duration)
=======
    """
    Middleware de métricas (Prometheus).
    """
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("ia_recommender", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("ia_recommender", request.method, request.url.path).observe(duration)
    return response
>>>>>>> d92f6350cb9d40ed38561f8ea49b8482c32fc335


@app.get("/ia/health")
async def health():
    """
    Healthcheck del servicio.
    """
    return {"status": "ok"}


@app.websocket("/ia/chat/{usuario_id}")
async def ia_chat(websocket: WebSocket, usuario_id: str):
    """
    Canal WebSocket del asistente literario.

    Recibe:
    - mensajes de texto del usuario

    Devuelve:
    - respuesta del asesor (LLM) usando contexto del catálogo.

    Persistencia:
    - Se almacena el historial en MongoDB (colección chats_ia) porque el chat es información no estructurada
      y puede crecer/variar sin migraciones. Así se evita sobrecargar Supabase/PostgreSQL con escrituras constantes.

    Sesión:
    - El cliente puede enviar ?sesion_id=... para separar conversaciones por usuario.
    - Si no se envía, se usa usuario_id como sesion_id (una sesión por usuario).
    """
    await websocket.accept()
    if chats_collection is None:
        await websocket.close(code=1011)
        return

    try:
        while True:
            mensaje_usuario = await websocket.receive_text()
            sesion_id = websocket.query_params.get("sesion_id") or usuario_id

            doc = await chats_collection.find_one({"sesion_id": sesion_id})
            if not doc:
                now = datetime.now(timezone.utc)
                base_doc = HistorialChatDocument(sesion_id=sesion_id, usuario_id=usuario_id, last_activity_at=now).model_dump(by_alias=True)
                await chats_collection.insert_one(base_doc)
                doc = base_doc

            historial_arr = doc.get("historial") or []
            historial_texto = ""
            for m in historial_arr[-20:]:
                rol = (m.get("rol") or "").lower()
                pref = "Usuario" if rol in {"user", "usuario", "socio"} else "Asesor"
                historial_texto += f"\n{pref}: {m.get('contenido', '')}"
            historial_texto = historial_texto.strip()

            respuesta = await consultar_asesor_literario(historial_texto, mensaje_usuario)

            now = datetime.now(timezone.utc)
            mensaje_user = MensajeChat(rol="user", contenido=mensaje_usuario, fecha=now).model_dump()
            mensaje_ai = MensajeChat(rol="assistant", contenido=respuesta, fecha=now).model_dump()

            await chats_collection.update_one(
                {"sesion_id": sesion_id},
                {
                    "$setOnInsert": {"sesion_id": sesion_id, "usuario_id": usuario_id},
                    "$set": {"last_activity_at": now},
                    "$push": {"historial": {"$each": [mensaje_user, mensaje_ai]}}
                },
                upsert=True
            )

            await websocket.send_text(respuesta)
    except WebSocketDisconnect:
        return
    except Exception:
        try:
            await websocket.close()
        except Exception:
            return


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8002, reload=True)
