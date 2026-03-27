from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_messages():
    return {"message": "Chat messages endpoint"}

@router.post("/send")
async def send_message():
    return {"message": "Send message endpoint"}
