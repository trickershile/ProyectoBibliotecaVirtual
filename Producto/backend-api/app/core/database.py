from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# Postgres
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# MongoDB
mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
mongo_db = mongo_client.get_database("biblioteca_virtual")

# Redis (Opcional si usas redis-py)
# import redis
# redis_client = redis.from_url(settings.REDIS_URL)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
