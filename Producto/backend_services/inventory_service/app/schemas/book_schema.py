from typing import List, Optional

from pydantic import BaseModel, Field


class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    image_url: Optional[str] = None
    categories: List[str] = Field(default_factory=list)

    price_physical: Optional[float] = None
    price_digital: Optional[float] = None
    price: Optional[float] = None

    stock: int = 0
    file_url: Optional[str] = None
    format_digital: Optional[str] = None

    pickup_location: str = "Plaza de Maipú"
    educational_level: str = "General"
    status: str = "available"
    is_new: bool = True


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    image_url: Optional[str] = None
    categories: Optional[List[str]] = None

    price_physical: Optional[float] = None
    price_digital: Optional[float] = None
    price: Optional[float] = None

    stock: Optional[int] = None
    file_url: Optional[str] = None
    format_digital: Optional[str] = None

    pickup_location: Optional[str] = None
    educational_level: Optional[str] = None
    status: Optional[str] = None
    is_new: Optional[bool] = None


class BookRead(BookBase):
    id: str
    seller_id: str


class StockDecrementRequest(BaseModel):
    quantity: int = Field(ge=1, default=1)
