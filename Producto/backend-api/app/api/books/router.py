from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
from typing import List, Optional
from ...core.database import mongo_db
from ...core.security import require_admin
from ...schemas.book import BookOut, BookCreate, Comment
from bson import ObjectId
from pymongo.errors import PyMongoError
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads/books"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

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
        
    try:
        cursor = mongo_db.books.find(query).skip(skip).limit(limit)
        
        if sort_by == "date":
            cursor = cursor.sort("publication_date", -1)
        elif sort_by == "sales":
            cursor = cursor.sort("sales_count", -1)
        elif sort_by == "rating":
            cursor = cursor.sort("rating", -1)
            
        books = await cursor.to_list(length=limit)
        return books
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.post("/", response_model=BookOut, status_code=status.HTTP_201_CREATED)
async def create_book(book_in: BookCreate, profile=Depends(require_admin)):
    try:
        book_dict = book_in.model_dump()
        book_dict["seller_id"] = 1 # Temporary seller_id
        
        result = await mongo_db.books.insert_one(book_dict)
        new_book = await mongo_db.books.find_one({"_id": result.inserted_id})
        return new_book
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating book: {str(e)}"
        )

@router.post("/{book_id}/comments", response_model=BookOut)
async def add_comment(book_id: str, comment: Comment):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    try:
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
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding comment: {str(e)}"
        )

@router.post("/{book_id}/upload-image", response_model=BookOut)
async def upload_book_image(book_id: str, file: UploadFile = File(...), profile=Depends(require_admin)):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    # 1. Validation: File type (MIME)
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 2. Validation: Extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file extension")

    try:
        # Check if book exists
        book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")

        # 3. Validation: Size (using seek/tell to check size without reading everything into memory)
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large (Max 5MB)")

        # Save file
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
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during upload: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading image: {str(e)}"
        )

@router.get("/{book_id}", response_model=BookOut)
async def get_book(book_id: str):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    try:
        book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        return book
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.put("/{book_id}", response_model=BookOut)
async def update_book(book_id: str, book_in: BookCreate, profile=Depends(require_admin)):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    try:
        update_data = book_in.model_dump()
        result = await mongo_db.books.update_one(
            {"_id": ObjectId(book_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Book not found")
            
        updated_book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
        return updated_book
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating book: {str(e)}"
        )

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: str, profile=Depends(require_admin)):
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    try:
        # Opcional: Eliminar imagen física si existe
        book = await mongo_db.books.find_one({"_id": ObjectId(book_id)})
        if book and book.get("image_url"):
            # Lógica para borrar archivo si fuera necesario
            file_name = book["image_url"].split("/")[-1]
            file_path = os.path.join(UPLOAD_DIR, file_name)
            if os.path.exists(file_path):
                os.remove(file_path)

        result = await mongo_db.books.delete_one({"_id": ObjectId(book_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Book not found")
        return None
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting book: {str(e)}"
        )
