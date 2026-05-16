from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ...core.database import mongo_db
from ...core.security import get_current_profile
from ...schemas.wishlist import WishlistOut, WishlistItem
from bson import ObjectId
from pymongo.errors import PyMongoError

router = APIRouter()

@router.get("/me", response_model=WishlistOut)
async def get_my_wishlist(profile=Depends(get_current_profile)):
    try:
        user_id = str(profile.id)
        wishlist = await mongo_db.wishlists.find_one({"user_id": user_id})
        if not wishlist:
            return {"user_id": user_id, "items": []}
        return wishlist
    except PyMongoError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")

@router.post("/me/add/{book_id}", response_model=WishlistOut)
async def add_to_my_wishlist(book_id: str, profile=Depends(get_current_profile)):
    return await add_to_wishlist(str(profile.id), book_id, profile)

@router.delete("/me/remove/{book_id}", response_model=WishlistOut)
async def remove_from_my_wishlist(book_id: str, profile=Depends(get_current_profile)):
    return await remove_from_wishlist(str(profile.id), book_id, profile)

@router.get("/{user_id}", response_model=WishlistOut)
async def get_wishlist(user_id: str, profile=Depends(get_current_profile)):
    if profile.role != "admin" and user_id != str(profile.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

    try:
        wishlist = await mongo_db.wishlists.find_one({"user_id": user_id})
        if not wishlist:
            return {"user_id": user_id, "items": []}
        return wishlist
    except PyMongoError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")

@router.post("/{user_id}/add/{book_id}", response_model=WishlistOut)
async def add_to_wishlist(user_id: str, book_id: str, profile=Depends(get_current_profile)):
    if profile.role != "admin" and user_id != str(profile.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    try:
        book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        item = {
            "book_id": book_id,
            "book_title": book.get("title"),
            "book_author": book.get("author"),
            "book_image": book.get("image_url"),
            "added_at": ObjectId(book_id).generation_time
        }
        
        await mongo_db.wishlists.update_one(
            {"user_id": user_id},
            {"$addToSet": {"items": item}},
            upsert=True
        )
        
        updated_wishlist = await mongo_db.wishlists.find_one({"user_id": user_id})
        return updated_wishlist
    except PyMongoError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")

@router.delete("/{user_id}/remove/{book_id}", response_model=WishlistOut)
async def remove_from_wishlist(user_id: str, book_id: str, profile=Depends(get_current_profile)):
    if profile.role != "admin" and user_id != str(profile.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

    try:
        await mongo_db.wishlists.update_one(
            {"user_id": user_id},
            {"$pull": {"items": {"book_id": book_id}}}
        )
        
        updated_wishlist = await mongo_db.wishlists.find_one({"user_id": user_id})
        if not updated_wishlist:
            return {"user_id": user_id, "items": []}
        return updated_wishlist
    except PyMongoError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")
