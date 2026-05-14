from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .book import BookOut

class OrderItem(BaseModel):
    book_id: str
    title: str
    price: float
    pickup_location: str

class OrderCreate(BaseModel):
    user_id: int
    items: List[OrderItem]
    total_amount: float

class OrderOut(BaseModel):
    id: str = Field(alias="_id")
    user_id: int
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"
    created_at: datetime
    receipt_url: Optional[str] = None

    class Config:
        populate_by_name = True
