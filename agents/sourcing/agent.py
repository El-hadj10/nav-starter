import json
from typing import Any
from agents.core.base_agent import BaseAgent
from agents.sourcing.prompts import SOURCING_SYSTEM, SOURCING_USER_TEMPLATE


class SourcingAgent(BaseAgent):
    name = "sourcing_agent"

    def system_prompt(self) -> str:
        return SOURCING_SYSTEM

    def user_prompt(self, input_data: dict[str, Any]) -> str:
        return SOURCING_USER_TEMPLATE.format(
            source_name=input_data.get("source_name", "Inconnu"),
            products_json=json.dumps(input_data.get("products", []), ensure_ascii=False, indent=2),
            min_margin_pct=input_data.get("min_margin_pct", 15.0),
        )
