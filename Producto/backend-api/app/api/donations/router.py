from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_donations():
    return {"message": "Get donations endpoint"}

@router.post("/")
async def create_donation():
    return {"message": "Create donation endpoint"}
