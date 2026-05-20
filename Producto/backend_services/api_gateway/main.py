from __future__ import annotations

from typing import Iterable, Optional

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, status
import json
import time
from urllib.request import urlopen

from jose import JWTError, jwk, jwt
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    SUPABASE_URL: str | None = None

    AUTH_SERVICE_URL: str = "http://auth_service:8001"
    INVENTORY_SERVICE_URL: str = "http://inventory_service:8002"
    ORDERS_SALES_SERVICE_URL: str = "http://orders_sales_service:8003"
    C2C_CHAT_SERVICE_URL: str = "http://c2c_chat_service:8004"

    @property
    def SUPABASE_ISSUER(self) -> str | None:
        if not self.SUPABASE_URL:
            return None
        return f"{self.SUPABASE_URL}/auth/v1"

    @property
    def SUPABASE_JWKS_URL(self) -> str | None:
        if not self.SUPABASE_URL:
            return None
        return f"{self.SUPABASE_URL}/auth/v1/keys"


settings = Settings()

app = FastAPI(title="API Gateway")

_jwks_cache: dict = {"jwks": None, "ts": 0}
_jwks_cache_ttl_seconds = 60 * 60


def _is_public_path(path: str) -> bool:
    if path.startswith("/api/v1/auth/login"):
        return True
    if path.startswith("/api/v1/auth/register"):
        return True
    if path.startswith("/docs") or path.startswith("/openapi.json"):
        return True
    if path.startswith("/health"):
        return True
    return False


def _decode_token(token: str) -> dict:
    if settings.SUPABASE_JWKS_URL and settings.SUPABASE_ISSUER:
        try:
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            if kid:
                jwks = _load_supabase_jwks()
                key_dict = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
                if key_dict:
                    public_key = jwk.construct(key_dict)
                    return jwt.decode(
                        token,
                        public_key.to_pem().decode("utf-8"),
                        algorithms=[key_dict.get("alg", "RS256")],
                        audience="authenticated",
                        issuer=settings.SUPABASE_ISSUER,
                    )
        except Exception:
            pass
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc


def _load_supabase_jwks() -> dict:
    now = time.time()
    if _jwks_cache["jwks"] and (now - _jwks_cache["ts"] < _jwks_cache_ttl_seconds):
        return _jwks_cache["jwks"]

    if not settings.SUPABASE_JWKS_URL:
        raise RuntimeError("SUPABASE_URL is not configured")

    with urlopen(settings.SUPABASE_JWKS_URL) as response:
        jwks = json.loads(response.read().decode("utf-8"))

    _jwks_cache["jwks"] = jwks
    _jwks_cache["ts"] = now
    return jwks


def _extract_bearer_token(request: Request) -> Optional[str]:
    auth = request.headers.get("authorization")
    if not auth:
        return None
    parts = auth.split(" ", 1)
    if len(parts) != 2:
        return None
    if parts[0].lower() != "bearer":
        return None
    return parts[1].strip()


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if _is_public_path(request.url.path):
        return await call_next(request)

    token = _extract_bearer_token(request)
    if not token:
        return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Unauthorized")

    try:
        claims = _decode_token(token)
    except JWTError:
        return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Unauthorized")
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Unauthorized")
        raise

    request.state.user_id = str(claims.get("sub") or "")
    request.state.role = str(claims.get("role") or "cliente")
    return await call_next(request)


def _route_target(path: str) -> str:
    if path.startswith("/api/v1/auth/"):
        return settings.AUTH_SERVICE_URL
    if path.startswith("/api/v1/books/"):
        return settings.INVENTORY_SERVICE_URL
    if path.startswith("/api/v1/orders/"):
        return settings.ORDERS_SALES_SERVICE_URL
    if path.startswith("/api/v1/chat/"):
        return settings.C2C_CHAT_SERVICE_URL
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")


def _filter_request_headers(headers: Iterable[tuple[str, str]]) -> dict:
    blocked = {"host", "content-length"}
    result: dict[str, str] = {}
    for k, v in headers:
        lk = k.lower()
        if lk in blocked:
            continue
        result[k] = v
    return result


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(full_path: str, request: Request):
    path = "/" + full_path
    target_base = _route_target(path)

    upstream_url = httpx.URL(target_base).join(path)
    if request.url.query:
        upstream_url = upstream_url.copy_with(query=request.url.query.encode("utf-8"))

    headers = _filter_request_headers(request.headers.items())
    user_id = getattr(request.state, "user_id", None)
    role = getattr(request.state, "role", None)
    if user_id:
        headers["X-User-Id"] = user_id
    if role:
        headers["X-User-Role"] = role

    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0) as client:
        upstream_response = await client.request(
            method=request.method,
            url=str(upstream_url),
            headers=headers,
            content=body,
        )

    resp_headers = dict(upstream_response.headers)
    resp_headers.pop("content-encoding", None)
    resp_headers.pop("transfer-encoding", None)
    resp_headers.pop("connection", None)

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=resp_headers,
        media_type=upstream_response.headers.get("content-type"),
    )
