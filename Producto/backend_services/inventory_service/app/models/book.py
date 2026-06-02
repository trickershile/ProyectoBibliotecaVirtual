from datetime import datetime
from typing import List, Optional

from beanie import Document
from pydantic import Field


class Book(Document):
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
    publication_date: datetime = Field(default_factory=datetime.utcnow)
    sales_count: int = 0
    rating: float = 0.0

    seller_id: str

    class Settings:
        name = "books"


class Categoria(Document):
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "categories"


class ResenaProducto(Document):
    book_id: str
    user_id: str
    rating: float = Field(ge=0, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "product_reviews"
