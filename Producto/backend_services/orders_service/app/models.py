from pydantic import BaseModel
from typing import List

# Representa un producto individual dentro del carrito de compras
class ItemCarrito(BaseModel):
    libro_id: str
    cantidad: int
    precio_unitario: float
    tipo_item: str  # 'fisico', 'digital' o 'prestamo'

# DTO principal para procesar el checkout del E-commerce
class CheckoutRequest(BaseModel):
    usuario_id: str
    metodo_entrega: str  # 'digital', 'despacho_domicilio', 'retiro_biblioteca'
    items: List[ItemCarrito]


class OrderStatusUpdate(BaseModel):
    estado: str
