import uuid

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    shipping_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    shipping_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    shipping_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    coupon_code: Mapped[str | None] = mapped_column(String, nullable=True)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    despacho_fisico: Mapped["DespachoFisico" | None] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )
    boleta: Mapped["Boleta" | None] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), index=True, nullable=False)
    book_id: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    format: Mapped[str] = mapped_column(String, nullable=False, default="physical")

    order: Mapped[Order] = relationship(back_populates="items")


class DespachoFisico(Base):
    __tablename__ = "physical_dispatches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    delivery_method: Mapped[str] = mapped_column(String, nullable=False, default="pickup")
    pickup_branch: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    shipping_lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    order: Mapped[Order] = relationship(back_populates="despacho_fisico")


class Boleta(Base):
    __tablename__ = "receipts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    subtotal_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    iva_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.19)
    iva_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    order: Mapped[Order] = relationship(back_populates="boleta")


class Coupon(Base):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    discount_percent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
