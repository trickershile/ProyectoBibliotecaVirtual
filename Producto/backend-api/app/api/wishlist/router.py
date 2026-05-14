from fastapi import APIRouter, HTTPException, status
from typing import List
from ...core.database import mongo_db
from ...schemas.wishlist import WishlistOut, WishlistItem
from bson import ObjectId

router = APIRouter()

@router.get("/{user_id}", response_model=WishlistOut)
async def get_wishlist(user_id: int):
    wishlist = await mongo_db.wishlists.find_one({"user_id": user_id})
    if not wishlist:
        return {"user_id": user_id, "items": []}
    return wishlist

@router.post("/{user_id}/add/{book_id}", response_model=WishlistOut)
async def add_to_wishlist(user_id: int, book_id: str):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    # Verificar si el libro existe
    book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Preparar el item
    item = {
        "book_id": book_id,
        "book_title": book.get("title"),
        "book_author": book.get("author"),
        "book_image": book.get("image_url"),
        "added_at": ObjectId(book_id).generation_time # O usar datetime.utcnow()
    }
    
    # Upsert: Si no existe la lista del usuario, la crea; si existe, añade el item si no está
    await mongo_db.wishlists.update_one(
        {"user_id": user_id},
        {"$addToSet": {"items": item}},
        upsert=True
    )
    
    updated_wishlist = await mongo_db.wishlists.find_one({"user_id": user_id})
    return updated_wishlist

@router.delete("/{user_id}/remove/{book_id}", response_model=WishlistOut)
async def remove_from_wishlist(user_id: int, book_id: str):
    await mongo_db.wishlists.update_one(
        {"user_id": user_id},
        {"$pull": {"items": {"book_id": book_id}}}
    )
    
    updated_wishlist = await mongo_db.wishlists.find_one({"user_id": user_id})
    if not updated_wishlist:
        return {"user_id": user_id, "items": []}
    return updated_wishlist
