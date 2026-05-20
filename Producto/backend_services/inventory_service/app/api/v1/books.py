from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from ...api.dependencies import get_current_actor, require_admin
from ...models.book import Book
from ...schemas.book_schema import BookCreate, BookRead, BookUpdate, StockDecrementRequest


router = APIRouter(prefix="/api/v1/books", tags=["books"])


def _to_read(book: Book) -> BookRead:
    data = book.model_dump()
    data["id"] = str(book.id)
    return BookRead(**data)


@router.get("/", response_model=List[BookRead])
async def list_books(
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    pickup_location: Optional[str] = Query(default=None),
    categories: Optional[List[str]] = Query(default=None),
    educational_level: Optional[str] = Query(default=None),
    sort_by: str = Query(default="date"),
    limit: int = Query(default=100, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
) -> List[BookRead]:
    query = Book.find_all()
    if search:
        query = query.find({"$or": [{"title": {"$regex": search, "$options": "i"}}, {"author": {"$regex": search, "$options": "i"}}]})
    if status_filter:
        query = query.find({"status": status_filter})
    if pickup_location and pickup_location != "all":
        query = query.find({"pickup_location": pickup_location})
    if educational_level and educational_level != "all":
        query = query.find({"educational_level": educational_level})
    if categories:
        query = query.find({"categories": {"$in": categories}})

    if sort_by == "sales":
        query = query.sort("-sales_count")
    elif sort_by == "rating":
        query = query.sort("-rating")
    else:
        query = query.sort("-publication_date")

    books = await query.skip(skip).limit(limit).to_list()
    return [_to_read(b) for b in books]


@router.post("/", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_in: BookCreate,
    actor: dict = Depends(require_admin),
) -> BookRead:
    data = book_in.model_dump()
    if data.get("price") is not None and data.get("price_physical") is None:
        data["price_physical"] = data["price"]
    if data.get("image_url") and not data.get("cover_url"):
        data["cover_url"] = data["image_url"]
    book = Book(**data, seller_id=actor["user_id"])
    await book.insert()
    return _to_read(book)


@router.get("/{book_id}", response_model=BookRead)
async def get_book(book_id: str) -> BookRead:
    book = await Book.get(PydanticObjectId(book_id))
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return _to_read(book)


@router.put("/{book_id}", response_model=BookRead)
async def update_book(book_id: str, book_in: BookUpdate, actor: dict = Depends(require_admin)) -> BookRead:
    book = await Book.get(PydanticObjectId(book_id))
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    update_data = book_in.model_dump(exclude_unset=True)
    if update_data.get("price") is not None and update_data.get("price_physical") is None:
        update_data["price_physical"] = update_data["price"]
    if update_data.get("image_url") and not update_data.get("cover_url"):
        update_data["cover_url"] = update_data["image_url"]
    for k, v in update_data.items():
        setattr(book, k, v)
    await book.save()
    return _to_read(book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: str, actor: dict = Depends(require_admin)) -> None:
    book = await Book.get(PydanticObjectId(book_id))
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    await book.delete()
    return None


@router.post("/{book_id}/decrement-stock")
async def decrement_stock(book_id: str, payload: StockDecrementRequest, actor: dict = Depends(get_current_actor)) -> dict:
    book = await Book.get(PydanticObjectId(book_id))
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    if book.stock < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

    book.stock -= payload.quantity
    await book.save()
    return {"ok": True, "stock": book.stock}
