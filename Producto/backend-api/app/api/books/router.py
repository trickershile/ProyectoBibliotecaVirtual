from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models.book import Book
from ...schemas.book import BookOut, BookCreate

router = APIRouter()

@router.get("/", response_model=List[BookOut])
async def get_books(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    delivery_type: Optional[str] = None,
    owner_type: Optional[str] = None,
    pickup_location: Optional[str] = None,
    category: Optional[str] = None,
    language: Optional[str] = None,
    educational_level: Optional[str] = None,
    physical_condition: Optional[str] = None,
    sort_by: str = Query("date", enum=["date", "sales", "rating"])
):
    query = db.query(Book)
    
    if search:
        query = query.filter(
            (Book.title.ilike(f"%{search}%")) | (Book.author.ilike(f"%{search}%"))
        )
    
    if status:
        query = query.filter(Book.status == status)
    if delivery_type:
        query = query.filter(Book.delivery_type == delivery_type)
    if owner_type:
        query = query.filter(Book.owner_type == owner_type)
    if pickup_location:
        query = query.filter(Book.pickup_location == pickup_location)
    if category:
        query = query.filter(Book.category == category)
    if language:
        query = query.filter(Book.language == language)
    if educational_level:
        query = query.filter(Book.educational_level == educational_level)
    if physical_condition:
        query = query.filter(Book.physical_condition == physical_condition)
        
    if sort_by == "date":
        query = query.order_by(Book.publication_date.desc())
    elif sort_by == "sales":
        query = query.order_by(Book.sales_count.desc())
    elif sort_by == "rating":
        query = query.order_by(Book.rating.desc())
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=BookOut)
async def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    # Basic create logic - later we'll add user authentication to set seller_id
    new_book = Book(**book_in.model_dump(), seller_id=1) # Temporary seller_id
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book
