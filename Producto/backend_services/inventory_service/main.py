from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.books import router as books_router
from app.core.database import init_beanie_database
from app.models.book import Book, Categoria, ResenaProducto


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_beanie_database(document_models=[Book, Categoria, ResenaProducto])
    yield


app = FastAPI(title="Inventory Service", lifespan=lifespan)
app.include_router(books_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
