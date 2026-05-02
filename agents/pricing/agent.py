from typing import Any
from agents.core.base_agent import BaseAgent
from agents.pricing.prompts import PRICING_SYSTEM, PRICING_USER_TEMPLATE


class PricingAgent(BaseAgent):
    name = "pricing_agent"

    def system_prompt(self) -> str:
        return PRICING_SYSTEM

    def user_prompt(self, input_data: dict[str, Any]) -> str:
        return PRICING_USER_TEMPLATE.format(
            source_price=input_data.get("source_price", 0),
            shipping_cost=input_data.get("shipping_cost", 0),
            fees_pct=input_data.get("fees_pct", 5),
            competitor_min=input_data.get("competitor_min", "N/A"),
            competitor_avg=input_data.get("competitor_avg", "N/A"),
            min_margin_pct=input_data.get("min_margin_pct", 15),
        )
