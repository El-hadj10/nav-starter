import json
from typing import Any
from agents.core.base_agent import BaseAgent
from agents.scoring.prompts import SCORING_SYSTEM, SCORING_USER_TEMPLATE


class ScoringAgent(BaseAgent):
    name = "scoring_agent"

    def system_prompt(self) -> str:
        return SCORING_SYSTEM

    def user_prompt(self, input_data: dict[str, Any]) -> str:
        return SCORING_USER_TEMPLATE.format(
            product_json=json.dumps(input_data.get("product", {}), ensure_ascii=False, indent=2),
            market_json=json.dumps(input_data.get("market", {}), ensure_ascii=False, indent=2),
        )
