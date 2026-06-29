import os  # Biblioteca nativa para interactuar con el sistema operativo
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv  # Carga las variables desde el archivo .env
import redis  # Cliente oficial para conectar con la caché de Redis
from supabase import create_client, Client

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Error: Faltan las credenciales de Supabase en el archivo .env")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# --- CONFIGURACIÓN DE UPSTASH REDIS (FastLookup) ---
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
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")  # Capturamos el password que te dio Upstash

# Instanciamos la conexión a Redis. Equivale al RedisTemplate de Spring Data Redis.
# 'decode_responses=True' le dice a Python que devuelva las cadenas de texto limpias en lugar de bytes binarios.
cache_client = redis.Redis(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    password=REDIS_PASSWORD, 
    decode_responses=True
)
