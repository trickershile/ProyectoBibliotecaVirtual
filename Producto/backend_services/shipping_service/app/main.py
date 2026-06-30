import json
import logging
import os
import sys
import time
import uuid
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status, Header
from supabase import create_client, Client
from app.models import DespachoCreate, StatusUpdate
import httpx
from prometheus_client import Counter, Histogram, make_asgi_app

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

"""
Shipping Service (Despachos + Geolocalización).

Responsabilidad:
- Gestionar tracking de despachos (tabla despachos) y sucursales (sucursales_biblioteca).

Reglas de negocio:
- crear/actualizar/eliminar tracking: solo admin.
- consultar tracking por código: público (el usuario solo necesita su código).
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
logger = logging.getLogger("shipping_service")

app = FastAPI(title="Lectura Viva - Shipping & Geolocation Service", version="1.0")

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
        REQUEST_COUNT.labels("shipping_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("shipping_service", request.method, request.url.path).observe(duration)
    return response

# Conector relacional para el registro de rutas y auditorías
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8000")
http_client = httpx.Client(timeout=5)

def _verify_admin(authorization: str):
    """
    Control de acceso:
    - Este servicio permite acciones administrativas sobre tracking, por eso exige role=admin.
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

# --- CASO DE USO 6: OBTENER PUNTOS DE RETIRO EN EL MAPA ---
@app.get("/shipping/libraries-locations")
def get_libraries_locations():
    """
    Retorna las coordenadas geográficas reales (Latitud y Longitud) de las bibliotecas.
    Este JSON es consumido directamente por el módulo 'Maps_Module' en React para pintar los pines.
    """
    try:
        response = supabase.table("sucursales_biblioteca").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- CREAR GUÍA DE DESPACHO / SEGUIMIENTO ---
@app.post("/shipping/tracking", status_code=status.HTTP_201_CREATED)
def crear_guia_despacho(data: DespachoCreate, authorization: str = Header(default="")):
    """
    Caso de uso (Admin): crear guía de despacho (tracking).

    Devuelve:
    - código_seguimiento de la forma LV-XXXXXXXX (simple y memorizable para el socio).
    """
    try:
        _verify_admin(authorization)
        # Generamos un código de seguimiento alfanumérico único para el tracking del e-commerce
        codigo_tracking = f"LV-{uuid.uuid4().hex[:8].upper()}"
        
        envio_data = {
            "orden_id": data.orden_id,
            "codigo_seguimiento": codigo_tracking,
            "direccion_destino": data.direccion_destino,
            "sucursal_retiro_id": data.sucursal_retiro_id,
            "estado_envio": "en_preparacion"
        }
        
        response = supabase.table("despachos").insert(envio_data).execute()
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- BUSCAR ESTADO DE UN PAQUETE (Para uso del Socio) ---
@app.get("/shipping/tracking/{codigo}")
def obtener_estado_despacho(codigo: str):
    """
    Caso de uso (Socio): consultar estado del despacho por código.
    """
    try:
        response = supabase.table("despachos").select("*").eq("codigo_seguimiento", codigo).single().execute()
        return response.data
    except Exception:
        raise HTTPException(status_code=404, detail="Código de seguimiento no encontrado.")


@app.patch("/shipping/tracking/{codigo}")
def actualizar_estado_despacho(codigo: str, data: StatusUpdate, authorization: str = Header(default="")):
    """
    Caso de uso (Admin): actualizar estado_envio.
    """
    _verify_admin(authorization)
    if not data.nuevo_estado:
        raise HTTPException(status_code=400, detail="Estado inválido.")
    try:
        response = supabase.table("despachos").update({"estado_envio": data.nuevo_estado}).eq("codigo_seguimiento", codigo).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Código de seguimiento no encontrado.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/shipping/trackings")
def listar_despachos(authorization: str = Header(default="")):
    """
    Lista todos los despachos (solo admin).
    """
    _verify_admin(authorization)
    response = supabase.table("despachos").select("*").execute()
    return response.data or []


@app.delete("/shipping/tracking/{codigo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_despacho(codigo: str, authorization: str = Header(default="")):
    """
    Elimina un despacho (solo admin).
    """
    _verify_admin(authorization)
    existing = supabase.table("despachos").select("id").eq("codigo_seguimiento", codigo).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Código de seguimiento no encontrado.")
    supabase.table("despachos").delete().eq("codigo_seguimiento", codigo).execute()
    return

if __name__ == "__main__":
    import uvicorn
    # Levantamos este nuevo microservicio en el PUERTO 8004
    uvicorn.run("app.main:app", host="127.0.0.1", port=8004, reload=True)
