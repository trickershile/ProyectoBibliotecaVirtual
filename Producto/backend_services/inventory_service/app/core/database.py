from typing import Sequence

from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings


mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
_default_db = mongo_client.get_default_database()
mongo_db = _default_db or mongo_client["inventory"]


async def init_beanie_database(document_models: Sequence[type]) -> None:
    from beanie import init_beanie

    await init_beanie(database=mongo_db, document_models=list(document_models))
