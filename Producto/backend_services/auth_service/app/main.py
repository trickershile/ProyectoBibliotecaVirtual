import json
import logging
import os
import sys
import time

import anyio
from fastapi import FastAPI, HTTPException, status, Header  # Importamos componentes del núcleo de FastAPI para rutas y errores
from app.database import supabase  # Importamos el cliente de base de datos relacional (PostgreSQL) [cite: 13, 33, 34]
from app.models import UserRegister, UserLogin, UserUpdate, UserResponse, RefreshTokenRequest  # Importamos los DTOs que creamos en models.py
from prometheus_client import Counter, Histogram, make_asgi_app

"""
Auth Service (Identidad y Roles).

Objetivo:
- Registrar usuarios y autenticar credenciales vía Supabase Auth.
- Mantener un perfil extendido en PostgreSQL (tabla profiles) para reglas de negocio: role, nombre, teléfono, etc.

Decisión arquitectónica:
- El JWT lo emite Supabase (evita implementar crypto/tokenization manual).
- El rol real del sistema se controla en profiles.role para poder aplicar RLS y autorización (admin vs socio).
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
logger = logging.getLogger("auth_service")

# Instanciamos la aplicación de FastAPI.
# Esto equivale exactamente a la clase principal de Java anotada con @SpringBootApplication.
app = FastAPI(title="Lectura Viva - Auth Service", version="1.0")

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["service", "method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency in seconds", ["service", "method", "path"])
app.mount("/metrics", make_asgi_app())

@app.middleware("http")
async def metrics_middleware(request, call_next):
    """
    Middleware de métricas (Prometheus).

    Se usa en producción para saber:
    - latencia real por endpoint
    - volumen de tráfico
    - picos de error (4xx/5xx)
    """
    start = time.time()
    try:
        response = await call_next(request)
    finally:
        duration = time.time() - start
        status_code = getattr(locals().get("response", None), "status_code", 500)
        REQUEST_COUNT.labels("auth_service", request.method, request.url.path, str(status_code)).inc()
        REQUEST_LATENCY.labels("auth_service", request.method, request.url.path).observe(duration)
    return response


# =========================
# Endpoints públicos
# =========================
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister):
    """
    Caso de uso: Registrarse (socio).

    Recibe:
    - email, password, nombre_completo

    Proceso:
    1) Crea la cuenta en Supabase Auth (donde se guarda la contraseña de forma segura).
    2) Crea el perfil extendido en PostgreSQL (tabla profiles) con role='socio'.

    Devuelve:
    - Perfil creado (sin exponer password).
    """
    user_id = None
    try:
        auth_response = await anyio.to_thread.run_sync(
            lambda: supabase.auth.sign_up({"email": user_data.email, "password": user_data.password})
        )
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="No se pudo registrar la cuenta en el sistema de autenticación.")

        user_id = auth_response.user.id
        profile_data = {
            "id": user_id,
            "email": user_data.email,
            "nombre_completo": user_data.nombre_completo,
            "role": "socio"
        }
        if user_data.direccion:
            profile_data["direccion"] = user_data.direccion
        profile_response = await anyio.to_thread.run_sync(
            lambda: supabase.table("profiles").insert(profile_data).execute()
        )
        if not profile_response.data:
            raise HTTPException(status_code=400, detail="No se pudo crear el perfil del usuario.")
        return profile_response.data[0]
    except HTTPException:
        if user_id:
            try:
                await anyio.to_thread.run_sync(lambda: supabase.auth.admin.delete_user(user_id))
            except Exception:
                logger.exception("auth_user_cleanup_failed")
        raise
    except Exception as e:
        if user_id:
            try:
                await anyio.to_thread.run_sync(lambda: supabase.auth.admin.delete_user(user_id))
            except Exception:
                logger.exception("auth_user_cleanup_failed")
        raise HTTPException(status_code=400, detail=str(e))


# --- CASO DE USO 1: INICIAR SESIÓN ---
# @app.post() equivale a un @PostMapping("/auth/login") en Spring Boot[cite: 41].
@app.post("/auth/login")
async def login_user(credentials: UserLogin):
    """
    Caso de uso: Iniciar sesión.

    Recibe:
    - email, password

    Devuelve:
    - access_token (JWT) para consumir el resto del sistema
    - datos del perfil extendido desde PostgreSQL (profiles)
    """
    try:
        session_response = await anyio.to_thread.run_sync(
            lambda: supabase.auth.sign_in_with_password({"email": credentials.email, "password": credentials.password})
        )
        user_id = session_response.user.id
        profile = await anyio.to_thread.run_sync(
            lambda: supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        )
        return {
            "access_token": session_response.session.access_token,
            "token_type": "bearer",
            "refresh_token": session_response.session.refresh_token,
            "expires_at": getattr(session_response.session, "expires_at", None),
            "user": profile.data
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas o inicio de sesión fallido.")


@app.post("/auth/refresh")
async def refresh_user_session(data: RefreshTokenRequest):
    """
    Renueva la sesión usando un refresh_token emitido por Supabase Auth.
    """
    try:
        refreshed = await anyio.to_thread.run_sync(
            lambda: supabase.auth.refresh_session(data.refresh_token)
        )
        if not refreshed or not getattr(refreshed, "session", None):
            raise HTTPException(status_code=401, detail="No se pudo renovar la sesión.")

        user_id = refreshed.user.id
        profile = await anyio.to_thread.run_sync(
            lambda: supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        )
        return {
            "access_token": refreshed.session.access_token,
            "token_type": "bearer",
            "refresh_token": refreshed.session.refresh_token,
            "expires_at": getattr(refreshed.session, "expires_at", None),
            "user": profile.data
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado.")


@app.post("/auth/logout")
def logout_user(authorization: str = Header(default="")):
    """
    Cierra la sesión lógica del cliente.

    Nota:
    - En este backend la invalidación fuerte del JWT se delega a Supabase/Auth lifetime.
    - El frontend debe eliminar access_token y refresh_token locales.
    """
    verify_token(authorization)
    return {"status": "ok", "message": "Sesión cerrada en cliente."}


@app.get("/auth/verify") 
def verify_token(authorization: str = Header(default="")):
    """
    Verifica un JWT (usado por el API Gateway y microservicios internos).

    Por qué existe:
    - Centraliza el estándar de validación del token.
    - Enriquecemos el token con el rol real del negocio (profiles.role), no solo el rol de Supabase.

    Devuelve:
    - id, email, aud y role (role viene de profiles si existe).
    """
    try:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Token JWT faltante o inválido.")

        token = authorization.split(" ", 1)[1].strip()
        if not token:
            raise HTTPException(status_code=401, detail="Token JWT faltante o inválido.")

        auth = supabase.auth
        user_response = None
        if hasattr(auth, "get_user"):
            try:
                user_response = auth.get_user(token)
            except TypeError:
                user_response = auth.get_user(jwt=token)

        if not user_response or not getattr(user_response, "user", None):
            raise HTTPException(status_code=401, detail="Token inválido o expirado.")

        user = user_response.user
        profile_role = None
        try:
            profile = supabase.table("profiles").select("role").eq("id", getattr(user, "id", None)).single().execute()
            profile_role = (profile.data or {}).get("role")
        except Exception:
            profile_role = None

        return {
            "id": getattr(user, "id", None),
            "email": getattr(user, "email", None),
            "aud": getattr(user, "aud", None),
            "role": profile_role or getattr(user, "role", None)
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
@app.get("/auth/profile")
def get_my_profile(authorization: str = Header(default="")):
    """
    Obtiene el perfil del usuario autenticado.

    Regla de negocio:
    - Solo el dueño del perfil puede leerlo (RLS recomendado).
    """
    verification = verify_token(authorization)
    user_id = verification.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    try:
        profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Perfil no encontrado.")
        return profile.data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Perfil no encontrado.")


@app.patch("/auth/profile")
def update_my_profile(data: UserUpdate, authorization: str = Header(default="")):
    """
    Actualiza campos del perfil del usuario autenticado.

    Recibe:
    - payload parcial (ej. nombre_completo, telefono)

    Devuelve:
    - perfil actualizado
    """
    verification = verify_token(authorization)
    user_id = verification.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    payload = data.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar.")

    try:
        response = supabase.table("profiles").update(payload).eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Perfil no encontrado.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
