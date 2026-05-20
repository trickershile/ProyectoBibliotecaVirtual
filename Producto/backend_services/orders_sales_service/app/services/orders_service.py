from typing import Any, List, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.pg_models import Coupon, Order, OrderItem
from ..schemas.order_schema import BookFormat, OrderCreate
from .inventory_client import InventoryClient


class OrdersService:
    def __init__(self) -> None:
        self._inventory = InventoryClient()

    async def create_order(
        self,
        db: AsyncSession,
        user_id,
        order_in: OrderCreate,
        actor_role: str,
    ) -> Order:
        inventory_rows: List[Tuple[str, int, BookFormat, float, str | None]] = []
        physical_decrements: List[Tuple[str, int]] = []

        for item in order_in.items:
            book = await self._inventory.get_book(item.book_id)
            fmt = item.format

            if fmt == "physical":
                price = book.get("price_physical", None)
                if price is None:
                    price = book.get("price", None)
                if price is None:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Physical price is not set for this book")
                stock = book.get("stock", None)
                if isinstance(stock, int) and stock < item.quantity:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")
                physical_decrements.append((item.book_id, item.quantity))
                download_url = None
            else:
                price = book.get("price_digital", None)
                if price is None:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Digital price is not set for this book")
                download_url = book.get("file_url")

            inventory_rows.append((item.book_id, item.quantity, fmt, float(price), download_url))

        subtotal = sum(qty * unit_price for _, qty, _, unit_price, _ in inventory_rows)
        shipping_cost = 0.0

        discount = 0.0
        coupon_code = (order_in.coupon_code or "").strip() or None
        if coupon_code:
            res = await db.execute(select(Coupon).where(Coupon.code == coupon_code))
            coupon = res.scalar_one_or_none()
            if not coupon or not coupon.is_active:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid coupon")
            discount = subtotal * (float(coupon.discount_percent) / 100.0)

        total = max(0.0, subtotal + shipping_cost - discount)

        order = Order(
            user_id=user_id,
            total_amount=total,
            status="pending",
            shipping_lat=order_in.shipping_lat,
            shipping_lng=order_in.shipping_lng,
            shipping_cost=shipping_cost,
            coupon_code=coupon_code,
        )
        db.add(order)
        await db.flush()

        for book_id, quantity, fmt, unit_price, _download_url in inventory_rows:
            db.add(
                OrderItem(
                    order_id=order.id,
                    book_id=book_id,
                    quantity=quantity,
                    unit_price=unit_price,
                    format=fmt,
                )
            )

        await db.commit()

        for book_id, quantity in physical_decrements:
            try:
                await self._inventory.decrement_stock(book_id, quantity, user_id=str(user_id), role=actor_role)
            except HTTPException as exc:
                order.status = "failed"
                await db.commit()
                raise exc

        result = await db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order.id)
        )
        return result.scalar_one()

    async def list_my_orders(self, db: AsyncSession, user_id) -> List[Order]:
        result = await db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.user_id == user_id).order_by(Order.created_at.desc())
        )
        return list(result.scalars().all())
