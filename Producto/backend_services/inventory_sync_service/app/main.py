import json
import logging
import os
import sys
import time

from fastapi import FastAPI, HTTPException, status, Header
import httpx
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from app.models import AjusteStock, CargaMasivaInventario
from prometheus_client import Counter, Histogram, make_asgi_app

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

"""
Inventory Sync Service (Inventario + Auditoría).

Responsabilidad:
- Registrar movimientos de inventario (logs_inventario) y ejecutar reabastecimientos coordinados con el catálogo.

Decisión arquitectónica:
- El stock vive en catalog_service (single source of truth del producto).
- Este servicio audita y orquesta: registra log y llama a /catalog/books/{id}/action (reabastecimiento).

Regla de negocio:
- Solo admin puede reabastecer.
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
logger = logging.getLogger("inventory_sync_service")

app = FastAPI(title="Lectura Viva - Inventory Sync Service", version="1.0")

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
        REQUEST_COUNT.labels("inventory_sync_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("inventory_sync_service", request.method, request.url.path).observe(duration)
    return response

# Cliente de Supabase para registrar la auditoría de movimientos físicos
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# URL interna para pegarle al catálogo si necesitamos alterar o revisar stock
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://127.0.0.1:8001")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
http_client = httpx.Client(timeout=5)

def _verify_admin(authorization: str):
    """
    Control de acceso:
    - Inventario físico y auditoría son funciones administrativas.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Falta el token de autorización.")
    try:
        response = http_client.get(f"{AUTH_SERVICE_URL}/auth/verify", headers={"Authorization": authorization})
    except Exception:
        raise HTTPException(status_code=503, detail="Auth service no disponible.")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    data = response.json()
    if data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")
    return data

# --- ALERTA DE STOCK CRÍTICO ---
@app.get("/inventory/check-low-stock/{libro_id}")
async def verificar_stock_critico(libro_id: str, stock_actual: int):
    """
    Monitorea si un libro físico está por agotarse.

    Regla de negocio:
    - Si stock_actual <= 3 => se considera "stock crítico" y se debería notificar.

    Devuelve:
    - alerta=true/false + mensaje.
    """
    LIMITE_CRITICO = 3
    if stock_actual <= LIMITE_CRITICO:
        # Aquí simularíamos un envío de alerta al servicio de notificaciones
        return {
            "alerta": True,
            "message": f"ALERTA: El libro con ID {libro_id} alcanzó stock crítico ({stock_actual} unidades). Se sugiere reabastecer."
        }
    return {"alerta": False, "message": "Nivel de stock seguro."}


# --- CARGA MASIVA / REABASTECIMIENTO (CU7 - Uso de Administrador) ---
@app.post("/inventory/bulk-upload", status_code=status.HTTP_200_OK)
async def carga_masiva_inventario(carga: CargaMasivaInventario, authorization: str = Header(default="")):
    """
    Caso de uso (Admin): carga masiva/reabastecimiento.

    Proceso:
    1) Registra cada movimiento en logs_inventario (auditoría).
    2) Llama a catalog_service para aplicar reabastecimiento (+stock).

    Devuelve:
    - resumen con detalle por libro (sincronizado/error).
    """
    try:
        verification = _verify_admin(authorization)
        if verification.get("id") != carga.admin_id:
            raise HTTPException(status_code=403, detail="No autorizado.")

        resultados = []
        
        # Abrimos un cliente HTTP asíncrono para actualizar el stock en el catálogo NoSQL
        async with httpx.AsyncClient() as client:
            for item in carga.libros:
                
                # 1. Registramos el movimiento en el historial relacional de Supabase (Logs)
                log_data = {
                    "libro_id": item.libro_id,
                    "cantidad_ingresada": item.cantidad,
                    "motivo": item.motivo,
                    "usuario_admin_id": carga.admin_id
                }
                supabase.table("logs_inventario").insert(log_data).execute()
                
                # 2. Le avisamos al catalog_service que incremente el stock real en MongoDB Atlas.
                # Reutilizamos el endpoint de acciones atómicas de tu catálogo ($inc positivo)
                payload_catalogo = {
                    "usuario_id": carga.admin_id,
                    "tipo_operacion": "reabastecimiento",
                    "cantidad": item.cantidad
                }
                
                respuesta_catalogo = await client.post(
                    f"{CATALOG_SERVICE_URL}/catalog/books/{item.libro_id}/action",
                    json=payload_catalogo,
                    headers={"Authorization": authorization}
                )
                
                if respuesta_catalogo.status_code >= 400:
                    resultados.append({
                        "libro_id": item.libro_id,
                        "status": "error",
                        "cantidad_añadida": item.cantidad,
                        "detail": respuesta_catalogo.text
                    })
                else:
                    resultados.append({
                        "libro_id": item.libro_id,
                        "status": "sincronizado",
                        "cantidad_añadida": item.cantidad
                    })
                
        return {
            "status": "success",
            "message": f"Procesados {len(carga.libros)} ítems de inventario masivo.",
            "detalles": resultados
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Levantamos este microservicio en el PUERTO 8009
    uvicorn.run("app.main:app", host="127.0.0.1", port=8009, reload=True)
