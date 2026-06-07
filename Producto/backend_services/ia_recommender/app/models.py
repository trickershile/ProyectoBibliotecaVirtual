from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class MensajeChat(BaseModel):
    """
    Mensaje individual dentro del historial del chat.

    Se guarda en MongoDB como un objeto dentro del arreglo "historial" del documento de sesión.
    """

    rol: str
    contenido: str
    fecha: datetime


class HistorialChatDocument(BaseModel):
    """
    Documento de sesión del chat almacenado en MongoDB (colección chats_ia).

    Decisión:
    - Se modela como documento NoSQL porque el flujo conversacional es flexible (arreglo de mensajes con roles),
      y cambia con facilidad sin forzar migraciones SQL ni impactar el rendimiento de Supabase/PostgreSQL.

    Nota:
    - El campo Python se llama "mensajes" pero en MongoDB se persiste como "historial" para reflejar el JSON final.
    """

    model_config = ConfigDict(populate_by_name=True)

    sesion_id: str
    usuario_id: str
    last_activity_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    mensajes: List[MensajeChat] = Field(default_factory=list, alias="historial")
