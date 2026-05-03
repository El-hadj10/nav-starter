from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class PricingInput(BaseModel):
    source_price: float
    shipping_cost: float
    fees_pct: float
    competitor_min: float | None = None
    competitor_avg: float | None = None
    min_margin_pct: float = 15.0


class PricingOutput(BaseModel):
    sale_price: float
    expected_margin_pct: float
    strategy: str
    confidence: float


@router.post("/compute", response_model=PricingOutput)
async def compute_price(payload: PricingInput):
    """
    Calcule le prix de vente optimal.
    Délègue à l'agent Pricing Dynamique.
    """
    from agents.pricing.agent import PricingAgent
    result = await PricingAgent().run(payload.model_dump())
    return result
