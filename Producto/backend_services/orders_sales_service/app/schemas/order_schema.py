from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


BookFormat = Literal["physical", "digital"]
DeliveryType = Literal["pickup", "delivery"]


class OrderItemCreate(BaseModel):
    book_id: str
    quantity: int = Field(ge=1, default=1)
    format: BookFormat


class OrderBase(BaseModel):
    coupon_code: Optional[str] = None
    delivery_type: DeliveryType = "pickup"
    shipping_lat: Optional[float] = None
    shipping_lng: Optional[float] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(min_length=1)


class OrderItemRead(BaseModel):
    id: int
    book_id: str
    quantity: int
    unit_price: float
    format: BookFormat
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: str
    user_id: str
    net_price: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    shipping_cost: float = 0.0
    status: str
    created_at: datetime
    shipping_lat: Optional[float] = None
    shipping_lng: Optional[float] = None
    coupon_code: Optional[str] = None
    items: List[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)


OrderRead = OrderResponse
