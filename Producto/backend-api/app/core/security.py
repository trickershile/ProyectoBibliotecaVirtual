from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from jose import jwk, jwt
from jose.exceptions import JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from urllib.request import urlopen
import json
import time
import uuid
from .config import settings

from .database import get_db
from ..models.user import Profile
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


_jwks_cache: Dict[str, Any] = {"jwks": None, "ts": 0}
_jwks_cache_ttl_seconds = 60 * 60
_bearer_scheme = HTTPBearer(auto_error=False)


def _load_supabase_jwks() -> Dict[str, Any]:
    if not settings.SUPABASE_JWKS_URL:
        raise RuntimeError("SUPABASE_URL no está configurado en el backend")

    now = time.time()
    if _jwks_cache["jwks"] and (now - _jwks_cache["ts"] < _jwks_cache_ttl_seconds):
        return _jwks_cache["jwks"]

    with urlopen(settings.SUPABASE_JWKS_URL) as response:
        jwks = json.loads(response.read().decode("utf-8"))

    _jwks_cache["jwks"] = jwks
    _jwks_cache["ts"] = now
    return jwks


def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    if not settings.SUPABASE_ISSUER:
        raise RuntimeError("SUPABASE_URL no está configurado en el backend")

    try:
        header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido: {str(e)}")

    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido: falta kid")

    jwks = _load_supabase_jwks()
    key_dict = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key_dict:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido: clave no encontrada")

    public_key = jwk.construct(key_dict)

    try:
        payload = jwt.decode(
            token,
            public_key.to_pem().decode("utf-8"),
            algorithms=[key_dict.get("alg", "RS256")],
            audience="authenticated",
            issuer=settings.SUPABASE_ISSUER,
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido: {str(e)}")


def get_current_profile(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> Profile:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")

    payload = decode_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido: falta sub")

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido: sub no es UUID")

    profile = db.query(Profile).filter(Profile.id == user_uuid).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil no encontrado")
    return profile


def require_admin(profile: Profile = Depends(get_current_profile)) -> Profile:
    if profile.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    return profile
