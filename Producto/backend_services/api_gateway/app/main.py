import asyncio
import json
import logging
import os
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse, parse_qsl, urlencode

import httpx
import redis
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, WebSocket, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, make_asgi_app

"""
API Gateway (BFF / Reverse Proxy) del clúster Lectura Viva.

Decisiones arquitectónicas clave:
1) Punto único de entrada: concentra CORS, rate limiting y observabilidad para no duplicar esa lógica en cada microservicio.
2) Autenticación perimetral: valida JWT llamando al auth_service antes de reenviar peticiones sensibles.
3) Métricas y trazabilidad: expone /metrics y logs JSON para Prometheus/Grafana y centralización de logs.
4) HTTP pooling: reutiliza un AsyncClient global para evitar abrir conexiones por request.
"""

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": int(time.time() * 1000),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }
        request_id = getattr(record, "request_id", None)
        if request_id:
            payload["request_id"] = request_id
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
root_logger = logging.getLogger()
root_logger.handlers = [handler]
root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("api_gateway")

app = FastAPI(title="Lectura Viva - API Gateway", version="1.0")

# =========================
# Configuración (12-Factor)
# =========================
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://127.0.0.1:8001")
IA_SERVICE_URL = os.getenv("IA_SERVICE_URL", "ws://127.0.0.1:8002")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://127.0.0.1:8005")
CART_SERVICE_URL = os.getenv("CART_SERVICE_URL", "http://127.0.0.1:8006")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://127.0.0.1:8007")
SEARCH_SERVICE_URL = os.getenv("SEARCH_SERVICE_URL", "http://127.0.0.1:8008")
DIGITAL_DELIVERY_SERVICE_URL = os.getenv("DIGITAL_DELIVERY_SERVICE_URL", "http://127.0.0.1:8010")
REVIEWS_SERVICE_URL = os.getenv("REVIEWS_SERVICE_URL", "http://127.0.0.1:8012")

# =========================
# Clientes y pooling
# =========================
http_client = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0))

def _normalize_redis_host(value: str | None) -> str | None:
    if not value:
        return value
    raw = value.strip().strip('"').strip("'")
    if "://" in raw:
        parsed = urlparse(raw)
        return parsed.hostname or raw
    return raw

redis_client = None
if os.getenv("REDIS_HOST"):
    redis_client = redis.Redis(
        host=_normalize_redis_host(os.getenv("REDIS_HOST")),
        port=int(os.getenv("REDIS_PORT", "6379")),
        password=os.getenv("REDIS_PASSWORD"),
        decode_responses=True
    )

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"]
)

# =========================
# Observabilidad (métricas)
# =========================
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["service", "method", "path", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["service", "method", "path"]
)

app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def metrics_and_rate_limit(request: Request, call_next):
    """
    Middleware perimetral del Gateway.

    - Métricas: mide latencia y conteo de requests por ruta para Prometheus.
    - Rate limiting: protege endpoints de autenticación contra fuerza bruta usando Redis.

    Regla de negocio (seguridad):
    - /auth/login: máximo 5 intentos por minuto por IP.
    - /auth/register: máximo 3 registros por minuto por IP.
    """
    start = time.time()
    path = request.url.path
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

    if redis_client is not None:
        ip = request.client.host if request.client else "unknown"
        if path.startswith("/auth/login"):
            key = f"rl:login:{ip}"
            limit = 5
            window = 60
        elif path.startswith("/auth/register"):
            key = f"rl:register:{ip}"
            limit = 3
            window = 60
        elif path.startswith("/orders/checkout") and request.method == "POST":
            key = f"rl:orders_checkout:{ip}"
            limit = 10
            window = 60
        elif path.startswith("/payments/intents") and request.method == "POST":
            key = f"rl:payments_post:{ip}"
            limit = 10
            window = 60
        elif path.startswith("/cart/") and path.endswith("/checkout") and request.method == "POST":
            key = f"rl:cart_checkout:{ip}"
            limit = 10
            window = 60
        elif path.startswith("/notifications/contact") and request.method == "POST":
            key = f"rl:contact:{ip}"
            limit = 5
            window = 60
        else:
            key = None

        if key:
            try:
                current = redis_client.incr(key)
                if current == 1:
                    redis_client.expire(key, window)
                if current > limit:
                    raise HTTPException(status_code=429, detail="Demasiadas solicitudes. Intenta nuevamente más tarde.")
            except HTTPException:
                raise
            except Exception:
                logger.exception("rate_limit_error")

    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("api_gateway", request.method, path, str(status_code)).inc()
        REQUEST_LATENCY.labels("api_gateway", request.method, path).observe(duration)
    return response

@app.on_event("shutdown")
async def shutdown_event():
    """
    Cierre limpio del pool HTTP.

    Esto evita warnings por sockets abiertos y asegura liberación de recursos al detener contenedores.
    """
    await http_client.aclose()

async def validar_token_jwt(request: Request):
    """
    Valida el JWT del cliente consultando auth_service.

    Por qué se hace en el Gateway:
    - El Gateway es el "escudo" perimetral: si el token es inválido, se corta antes de saturar microservicios internos.
    - Permite centralizar el estándar de errores 401/503.

    Recibe:
    - Request con header Authorization: Bearer <token>

    Devuelve:
    - JSON con identidad y rol (según profiles.role en PostgreSQL/Supabase).
    """
    authorization = request.headers.get("authorization") or request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Falta el token de autorización.")

    try:
        response = await http_client.get(
            f"{AUTH_SERVICE_URL}/auth/verify",
            headers={"Authorization": authorization}
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth service no disponible.")

    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado.")

    return response.json()

async def validar_token_jwt_ws(websocket: WebSocket):
    authorization = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
    if not authorization:
        token = websocket.query_params.get("token") or websocket.query_params.get("access_token")
        if token:
            authorization = token if token.lower().startswith("bearer ") else f"Bearer {token}"
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Falta el token de autorización.")

    try:
        response = await http_client.get(
            f"{AUTH_SERVICE_URL}/auth/verify",
            headers={"Authorization": authorization}
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth service no disponible.")

    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado.")

    return response.json(), authorization


@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_auth(request: Request, path: str):
    """
    Reverse proxy del Auth Service.

    Motivo:
    - El frontend habla con un solo host (Gateway).
    - Rate limiting y CORS se aplican aquí, no en cada servicio.
    """
    url_destino = f"{AUTH_SERVICE_URL}/auth/{path}"
    body = await request.body()
    req = http_client.build_request(
        method=request.method,
        url=url_destino,
        headers=request.headers.raw,
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Auth service no disponible: {e}")


# =========================
# Proxies HTTP (servicios)
# =========================
@app.api_route("/catalog/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_catalog(request: Request, path: str):
    """
    Reverse proxy del Catalog Service (producto/categorías).

    Nota:
    - La lectura del catálogo puede ser pública (según RLS/policies).
    - Escrituras y acciones sensibles se controlan por JWT en el propio servicio y/o por el Gateway.
    """
    # Construimos la URL real del microservicio de destino
    url_destino = f"{CATALOG_SERVICE_URL}/catalog/{path}"
    
    # Extraemos el cuerpo de la petición (JSON) si es que existe (en POST o PUT)
    body = await request.body()
    
    # Preparamos la petición idéntica para reenviarla internamente (Bypass / Reverse Proxy)
    # Equivale a la lógica de un Zuul Gateway o Spring Cloud Gateway en Java
    req = http_client.build_request(
        method=request.method,
        url=url_destino,
        headers=request.headers.raw,
        content=body
    )
    
    try:
        # Enviamos la petición de manera asíncrona al catalog_service
        response = await http_client.send(req, stream=True)
        # Devolvemos la respuesta tal cual la entregó el microservicio al Frontend
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=response.headers
        )
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Catalog service no disponible: {e}")


@app.api_route("/search/{path:path}", methods=["GET"])
async def route_search(request: Request, path: str):
    url_destino = f"{SEARCH_SERVICE_URL}/search/{path}"
    req = http_client.build_request(
        method=request.method,
        url=url_destino,
        headers=request.headers.raw,
        params=request.query_params
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Search service no disponible: {e}")


# =========================
# Proxy WebSocket (IA)
# =========================
@app.websocket("/ia/chat/{usuario_id}")
async def route_ia_websocket(websocket: WebSocket, usuario_id: str):
    """
    Puente WebSocket bidireccional entre frontend y ia_recommender.

    Decisión:
    - Mantener el endpoint público del chat en el Gateway para que el frontend no conozca la red interna.
    - El Gateway reenvía mensajes a ia_recommender y devuelve sus respuestas.
    """
    try:
        identity, auth_header = await validar_token_jwt_ws(websocket)
        if identity.get("id") != usuario_id and identity.get("role") != "admin":
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    if redis_client is not None:
        ip = websocket.client.host if websocket.client else "unknown"
        key = f"rl:ws_conn:{ip}"
        try:
            current = redis_client.incr(key)
            if current == 1:
                redis_client.expire(key, 60)
            if current > 20:
                await websocket.close(code=1013)
                return
        except Exception:
            logger.exception("ws_rate_limit_error")
    await websocket.accept()
    
    # Conectamos el Gateway internamente con el microservicio de IA real en el puerto 8002
    params = [(k, v) for (k, v) in parse_qsl(websocket.url.query, keep_blank_values=True) if k not in {"token", "access_token"}]
    query = urlencode(params)
    url_websocket_destino = f"{IA_SERVICE_URL}/ia/chat/{usuario_id}" + (f"?{query}" if query else "")
    
    # Usamos websockets del framework para entrelazar los dos canales en un puente bidireccional
    import websockets  # Importación local para esta tarea específica
    
    try:
        async with websockets.connect(url_websocket_destino, extra_headers=[("Authorization", auth_header)]) as target_ws:
            # Creamos dos tareas en paralelo: una escucha al cliente y otra escucha al microservicio
            async def forward_to_client():
                async for message in target_ws:
                    await websocket.send_text(str(message))

            async def forward_to_service():
                while True:
                    message = await websocket.receive_text()
                    if redis_client is not None:
                        ip = websocket.client.host if websocket.client else "unknown"
                        key = f"rl:ws_msg:{ip}"
                        try:
                            current = redis_client.incr(key)
                            if current == 1:
                                redis_client.expire(key, 60)
                            if current > 60:
                                await websocket.close(code=1013)
                                return
                        except Exception:
                            logger.exception("ws_rate_limit_error")
                    await target_ws.send(message)

            # Corremos ambas tareas concurrentemente (Bucle de eventos asíncrono de Python)
            await asyncio.gather(forward_to_client(), forward_to_service())
            
    except Exception:
        await websocket.close()

@app.api_route("/orders/{path:path}", methods=["POST", "GET", "PATCH", "DELETE"])
async def route_ecommerce_orders(request: Request, path: str):
    """
    Reverse proxy del Orders Service.

    Regla de negocio:
    - Operaciones comerciales se consideran sensibles: requieren JWT válido.
    """
    # Validamos el token JWT de Supabase antes de permitir operaciones comerciales
    await validar_token_jwt(request) 
    
    body = await request.body()
    req = http_client.build_request(
        method=request.method, 
        url=f"{os.getenv('ORDERS_SERVICE_URL', 'http://127.0.0.1:8003')}/orders/{path}", 
        headers=request.headers.raw, 
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Orders service no disponible: {e}")

@app.api_route("/shipping/{path:path}", methods=["GET", "POST", "PATCH", "DELETE"])
async def route_shipping_and_maps(request: Request, path: str):
    """
    Reverse proxy del Shipping Service.

    Nota:
    - endpoints de mapa pueden ser públicos (depende de tu decisión de producto),
      pero tracking y administración suelen requerir JWT/rol admin.
    """
    # Nota: El endpoint de localizaciones de bibliotecas puede ser público para que se renderice el mapa al inicio, 
    # pero las acciones de tracking sí pueden exigir validar_token_jwt(request) si lo deseas.
    
    body = await request.body()
    req = http_client.build_request(
        method=request.method, 
        url=f"{os.getenv('SHIPPING_SERVICE_URL', 'http://127.0.0.1:8004')}/shipping/{path}", 
        headers=request.headers.raw, 
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Shipping service no disponible: {e}")

@app.api_route("/inventory/{path:path}", methods=["GET", "POST"])
async def route_inventory_sync(request: Request, path: str):
    """
    Reverse proxy del Inventory Sync Service.

    Regla de negocio:
    - Reabastecimiento y auditoría de inventario deben ser solo admin.
    - Aquí se valida JWT y el servicio valida rol admin.
    """
    # Idealmente, aquí validarías que el rol extraído del JWT sea estrictamente 'admin' (CU16)
    await validar_token_jwt(request) 
    
    body = await request.body()
    req = http_client.build_request(
        method=request.method, 
        url=f"{os.getenv('INVENTORY_SYNC_SERVICE_URL', 'http://127.0.0.1:8009')}/inventory/{path}", 
        headers=request.headers.raw, 
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Inventory service no disponible: {e}")

@app.api_route("/payments/{path:path}", methods=["GET", "POST", "DELETE"])
async def route_payments(request: Request, path: str):
    """
    Reverse proxy del Payment Service.

    Regla de negocio:
    - Pagos y reembolsos deben estar autenticados (y reembolso típicamente solo admin).
    """
    await validar_token_jwt(request)
    
    body = await request.body()
    req = http_client.build_request(
        method=request.method,
        url=f"{PAYMENT_SERVICE_URL}/payments/{path}",
        headers=request.headers.raw,
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Payment service no disponible: {e}")

@app.api_route("/cart/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def route_cart(request: Request, path: str):
    """
    Reverse proxy del Cart Service.

    Regla de negocio:
    - El carrito siempre es privado (dueño del usuario o admin).
    """
    await validar_token_jwt(request)
    
    body = await request.body()
    req = http_client.build_request(
        method=request.method,
        url=f"{CART_SERVICE_URL}/cart/{path}",
        headers=request.headers.raw,
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Cart service no disponible: {e}")


@app.api_route("/wishlist/{path:path}", methods=["GET", "POST", "DELETE"])
async def route_wishlist(request: Request, path: str):
    """
    Reverse proxy de favoritos/wishlist.

    Se resuelve dentro de catalog_service para evitar otro microservicio cuando solo se requiere una tabla
    relacional simple contra books.
    """
    await validar_token_jwt(request)

    body = await request.body()
    req = http_client.build_request(
        method=request.method,
        url=f"{CATALOG_SERVICE_URL}/wishlist/{path}",
        headers=request.headers.raw,
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Catalog service no disponible: {e}")

@app.api_route("/notifications/{path:path}", methods=["GET", "POST"])
async def route_notifications(request: Request, path: str):
    url_destino = f"{NOTIFICATION_SERVICE_URL}/notifications/{path}"
    body = await request.body()
    req = http_client.build_request(
        method=request.method,
        url=url_destino,
        headers=request.headers.raw,
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Notification service no disponible: {e}")


@app.api_route("/delivery/{path:path}", methods=["GET"])
async def route_delivery(request: Request, path: str):
    """
    Reverse proxy del Digital Delivery Service.

    Regla de negocio:
    - La entrega digital siempre es privada: requiere JWT válido.
    """
    await validar_token_jwt(request)
    url_destino = f"{DIGITAL_DELIVERY_SERVICE_URL}/delivery/{path}"
    req = http_client.build_request(
        method=request.method,
        url=url_destino,
        headers=request.headers.raw
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Delivery service no disponible: {e}")


@app.api_route("/reviews/{path:path}", methods=["GET", "POST", "PATCH", "DELETE"])
async def route_reviews(request: Request, path: str):
    """
    Reverse proxy del Reviews Service.

    Nota de seguridad:
    - GET /reviews/books/{id} es público (solo reseñas aprobadas).
    - Cualquier otra operación requiere JWT válido.
    """
    if not (request.method == "GET" and path.startswith("books/")):
        await validar_token_jwt(request)

    url_destino = f"{REVIEWS_SERVICE_URL}/reviews/{path}"
    body = await request.body()
    req = http_client.build_request(
        method=request.method,
        url=url_destino,
        headers=request.headers.raw,
        content=body
    )
    try:
        response = await http_client.send(req, stream=True)
        return StreamingResponse(response.aiter_raw(), status_code=response.status_code, headers=response.headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Reviews service no disponible: {e}")
if __name__ == "__main__":
    import uvicorn
    # El API Gateway corre en el puerto principal 8080 (La entrada pública del sistema)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8080, reload=True)
