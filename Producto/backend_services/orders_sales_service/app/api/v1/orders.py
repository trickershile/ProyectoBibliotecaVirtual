from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_actor
from ...core.database import get_db
from ...schemas.order_schema import OrderCreate, OrderRead
from ...services.orders_service import OrdersService


router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    actor: dict = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    service = OrdersService()
    order = await service.create_order(db, actor["user_id"], order_in, actor_role=actor["role"])
    return order


@router.get("/me", response_model=List[OrderRead])
async def list_my_orders(actor: dict = Depends(get_current_actor), db: AsyncSession = Depends(get_db)) -> List[OrderRead]:
    service = OrdersService()
    return await service.list_my_orders(db, actor["user_id"])
