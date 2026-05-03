from pydantic import BaseModel
from typing import Optional


class ProductSchema(BaseModel):
    id: str
    slug: str
    title: str
    brand: Optional[str] = None
    category: str
    sale_price: float
    margin_pct: float
    stock_status: str
    images: list[str] = []
    short_description: str = ""
    seo_score: int = 0


class OrderItemSchema(BaseModel):
    product_id: str
    qty: int
    unit_price: float


class OrderSchema(BaseModel):
    id: str
    customer_id: str
    items: list[OrderItemSchema]
    paid_amount: float
    commission_amount: float
    status: str
