from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
from typing import List, Optional
from ...core.database import mongo_db
from ...schemas.book import BookOut, BookCreate, Comment
from bson import ObjectId
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads/books"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/", response_model=List[BookOut])
async def get_books(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    delivery_type: Optional[str] = None,
    owner_type: Optional[str] = None,
    pickup_location: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    language: Optional[str] = None,
    educational_level: Optional[str] = None,
    physical_condition: Optional[str] = None,
    sort_by: str = Query("date", enum=["date", "sales", "rating"])
):
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
    if delivery_type:
        query["delivery_type"] = delivery_type
    if owner_type:
        query["owner_type"] = owner_type
    if pickup_location:
        query["pickup_location"] = pickup_location
    if categories:
        query["categories"] = {"$in": categories}
    if language:
        query["language"] = language
    if educational_level:
        query["educational_level"] = educational_level
    if physical_condition:
        query["physical_condition"] = physical_condition
        
    cursor = mongo_db.books.find(query).skip(skip).limit(limit)
    
    if sort_by == "date":
        cursor = cursor.sort("publication_date", -1)
    elif sort_by == "sales":
        cursor = cursor.sort("sales_count", -1)
    elif sort_by == "rating":
        cursor = cursor.sort("rating", -1)
        
    books = await cursor.to_list(length=limit)
    return books

@router.post("/", response_model=BookOut, status_code=status.HTTP_201_CREATED)
async def create_book(book_in: BookCreate):
    book_dict = book_in.model_dump()
    book_dict["seller_id"] = 1 # Temporary seller_id
    
    result = await mongo_db.books.insert_one(book_dict)
    new_book = await mongo_db.books.find_one({"_id": result.inserted_id})
    return new_book

@router.post("/{book_id}/comments", response_model=BookOut)
async def add_comment(book_id: str, comment: Comment):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    # Check if book exists
    book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Add comment to the list
    await mongo_db.books.update_one(
        {"_id": ObjectId(book_id)},
        {"$push": {"comments": comment.model_dump()}}
    )
    
    # Recalculate average rating
    updated_book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    comments = updated_book.get("comments", [])
    if comments:
        avg_rating = sum(c["rating"] for c in comments) / len(comments)
        await mongo_db.books.update_one(
            {"_id": ObjectId(book_id)},
            {"$set": {"rating": round(avg_rating, 1)}}
        )
    
    final_book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    return final_book

@router.post("/{book_id}/upload-image", response_model=BookOut)
async def upload_book_image(book_id: str, file: UploadFile = File(...)):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    # Check if book exists
    book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update book in DB
    image_url = f"/static/books/{file_name}"
    await mongo_db.books.update_one(
        {"_id": ObjectId(book_id)},
        {"$set": {"image_url": image_url}}
    )
    
    updated_book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    return updated_book

@router.get("/{book_id}", response_model=BookOut)
async def get_book(book_id: str):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.put("/{book_id}", response_model=BookOut)
async def update_book(book_id: str, book_in: BookCreate):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    update_data = book_in.model_dump()
    result = await mongo_db.books.update_one(
        {"_id": ObjectId(book_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
        
    updated_book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    return updated_book

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: str):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    # Opcional: Eliminar imagen física si existe
    book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
    if book and book.get("image_url"):
        # Lógica para borrar archivo si fuera necesario
        pass

    result = await mongo_db.books.delete_one({"_id": ObjectId(book_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    return None
