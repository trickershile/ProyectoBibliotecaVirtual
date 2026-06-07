from pydantic import BaseModel
from typing import List


class AjusteStock(BaseModel):
    libro_id: str
    cantidad: int
    motivo: str


class CargaMasivaInventario(BaseModel):
    admin_id: str
    libros: List[AjusteStock]
