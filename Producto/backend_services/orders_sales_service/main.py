from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.orders import router as orders_router
from app.core.database import Base, engine
from app.models import pg_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Orders & Sales Service", lifespan=lifespan)
app.include_router(orders_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
