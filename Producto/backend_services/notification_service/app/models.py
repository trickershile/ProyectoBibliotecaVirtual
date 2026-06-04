from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class ContactMessageIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    email: EmailStr
    telefono: Optional[str] = Field(default=None, max_length=40)
    asunto: str = Field(min_length=1, max_length=200)
    mensaje: str = Field(min_length=1, max_length=5000)


class ChannelResult(BaseModel):
    canal: str
    status: str
    detalle: Optional[str] = None


class ContactMessageResponse(BaseModel):
    status: str
    message_id: int
    canales: List[ChannelResult]


class NotificationSendRequest(BaseModel):
    tipo: str = Field(default="generic")
    to_email: Optional[EmailStr] = None
    to_whatsapp: Optional[str] = None
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=5000)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class NotificationSendResponse(BaseModel):
    status: str
    notification_id: int
    canales: List[ChannelResult]


class NotificationLogRow(BaseModel):
    id: Optional[int] = None
    tipo: str
    canal: str
    to_email: Optional[str] = None
    to_whatsapp: Optional[str] = None
    subject: str
    body: str
    status: str
    error: Optional[str] = None
    created_at: Optional[datetime] = None
