import os
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv
import redis
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

"""
Conexiones de infraestructura usadas por IA Recommender.

Decisión: MongoDB para historial conversacional
- El flujo del chat es semiestructurado y evoluciona (mensajes, metadatos, roles, timestamps).
- MongoDB permite guardar el historial como un documento con un arreglo (historial) sin migraciones frecuentes.
- Evitamos cargar la base relacional (Supabase/PostgreSQL) con escrituras de alta frecuencia del chat.
"""

# Redis: útil como cache/TTL para datos efímeros (no reemplaza el historial persistente)
def _normalize_redis_host(value: str | None) -> str | None:
    if not value:
        return value
    raw = value.strip().strip('"').strip("'")
    if "://" in raw:
        parsed = urlparse(raw)
        return parsed.hostname or raw
    return raw

REDIS_HOST = _normalize_redis_host(os.getenv("REDIS_HOST"))
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

cache_client = redis.Redis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    password=REDIS_PASSWORD, 
    decode_responses=True
)

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = AsyncIOMotorClient(MONGO_URI) if MONGO_URI else None
mongo_db = mongo_client["lecturaviva"] if mongo_client else None
chats_collection = mongo_db["chats_ia"] if mongo_db else None

async def close_mongo_client():
    """
    Cierra el cliente de MongoDB.

    Esto es importante en contenedores para liberar sockets al hacer shutdown/restart.
    """
    if mongo_client:
        mongo_client.close()
