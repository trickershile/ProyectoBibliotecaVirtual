from pydantic import BaseModel
from typing import Optional


class CartItemCreate(BaseModel):
    libro_id: int
    cantidad: int
    precio_unitario: float
    tipo_item: str


class CartItemUpdate(BaseModel):
    cantidad: int


class CartItemResponse(BaseModel):
    id: int
    usuario_id: str
    libro_id: int
    cantidad: int
    precio_unitario: float
    tipo_item: str
    created_at: Optional[str] = None


class CartCheckoutRequest(BaseModel):
    metodo_entrega: str
