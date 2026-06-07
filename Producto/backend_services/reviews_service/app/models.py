from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """
    Payload para crear reseña.

    Nota de seguridad:
    - No se recibe usuario_id desde el cliente; se obtiene desde el JWT verificado por auth_service.
    """

    rating: int = Field(ge=1, le=5)
    comentario: str = Field(min_length=1, max_length=2000)


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comentario: Optional[str] = Field(default=None, min_length=1, max_length=2000)


class ReviewModeration(BaseModel):
    estado: str = Field(pattern="^(approved|rejected)$")
    motivo: Optional[str] = Field(default=None, max_length=500)


class ReviewResponse(BaseModel):
    id: int
    libro_id: int
    usuario_id: str
    rating: int
    comentario: str
    estado: str
    motivo: Optional[str] = None
    created_at: Optional[datetime] = None
