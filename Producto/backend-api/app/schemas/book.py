from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    is_new: bool = True
    status: str = "available"
    location: str = "Plaza de Maipú"
    price: Optional[float] = None
    delivery_type: str = "Retiro en biblioteca"
    owner_type: str = "Municipalidad de Maipú"
    pickup_location: str = "Plaza de Maipú"
    category: Optional[str] = None
    language: str = "Español"
    educational_level: str = "General"
    physical_condition: str = "Nuevo"
    publication_date: Optional[datetime] = None
    sales_count: int = 0
    rating: float = 0.0

class BookCreate(BookBase):
    pass

class BookOut(BookBase):
    id: int
    seller_id: int

    class Config:
        from_attributes = True
