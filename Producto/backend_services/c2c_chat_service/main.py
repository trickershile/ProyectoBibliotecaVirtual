from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="C2C Chat Service")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    return ChatResponse(reply=f"I received your message: {payload.message}")
