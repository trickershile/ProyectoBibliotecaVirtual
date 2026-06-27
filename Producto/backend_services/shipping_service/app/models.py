from pydantic import BaseModel
from typing import Optional

# DTO para crear una nueva guía de despacho al procesar un checkout
class DespachoCreate(BaseModel):
    orden_id: int
    direccion_destino: Optional[str] = None
    sucursal_retiro_id: Optional[int] = None

# DTO para actualizar el estado del camión repartidor o del retiro
class StatusUpdate(BaseModel):
    nuevo_estado: str  # 'despachado', 'en_ruta', 'entregado'