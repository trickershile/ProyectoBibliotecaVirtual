from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth.router import router as auth_router
from app.api.books.router import router as books_router
from app.api.chat.router import router as chat_router
from app.api.donations.router import router as donations_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, usa una lista específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(books_router, prefix=f"{settings.API_V1_STR}/books", tags=["books"])
app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(donations_router, prefix=f"{settings.API_V1_STR}/donations", tags=["donations"])

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de la Biblioteca Virtual", "docs": "/docs"}
