from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    source_id: str
    source: str = "unknown"
    title: str
    brand: Optional[str] = None
    category: str = "general"
    attributes: dict = {}
    source_price: float
    shipping_cost: float = 0.0
    stock: int = 0
    images: list[str] = []
    # Champs remplis par les agents
    meta_description: Optional[str] = None
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    bullets: list[str] = []
    affiliate_url: Optional[str] = None
    sale_price: Optional[float] = None
    score: Optional[int] = None
    risk_level: Optional[str] = None


class ProductOut(BaseModel):
    id: str
    slug: str
    title: str
    brand: Optional[str]
    category: str
    sale_price: float
    margin_pct: float
    stock_status: str
    images: list[str]
    short_description: str
    seo_score: int
    published_at: Optional[datetime]

    class Config:
        from_attributes = True
