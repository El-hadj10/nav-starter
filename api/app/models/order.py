from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrderItem(BaseModel):
    product_id: str
    qty: int
    unit_price: float


class OrderCreate(BaseModel):
    customer_id: str
    items: list[OrderItem]
    stripe_payment_intent_id: str


class OrderOut(BaseModel):
    id: str
    customer_id: str
    items: list[OrderItem]
    paid_amount: float
    commission_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
