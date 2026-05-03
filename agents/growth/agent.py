import json
from typing import Any
from agents.core.base_agent import BaseAgent
from agents.growth.prompts import GROWTH_SYSTEM, GROWTH_USER_TEMPLATE


class GrowthAgent(BaseAgent):
    name = "growth_agent"

    def system_prompt(self) -> str:
        return GROWTH_SYSTEM

    def user_prompt(self, input_data: dict[str, Any]) -> str:
        return GROWTH_USER_TEMPLATE.format(
            kpi_json=json.dumps(input_data.get("kpi", {}), ensure_ascii=False, indent=2),
            prev_kpi_json=json.dumps(input_data.get("prev_kpi", {}), ensure_ascii=False, indent=2),
        )
