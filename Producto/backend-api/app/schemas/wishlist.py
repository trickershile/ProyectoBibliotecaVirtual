from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WishlistItem(BaseModel):
    book_id: str # ID de MongoDB del libro
    book_title: str
    book_author: str
    book_image: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)

class WishlistOut(BaseModel):
    user_id: int
    items: List[WishlistItem] = []
