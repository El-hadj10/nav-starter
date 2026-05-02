import json
from typing import Any
from agents.core.base_agent import BaseAgent
from agents.copywriter.prompts import COPYWRITER_SYSTEM, COPYWRITER_USER_TEMPLATE


class CopywriterAgent(BaseAgent):
    name = "copywriter_agent"

    def system_prompt(self) -> str:
        return COPYWRITER_SYSTEM

    def user_prompt(self, input_data: dict[str, Any]) -> str:
        return COPYWRITER_USER_TEMPLATE.format(
            product_json=json.dumps(input_data.get("product", {}), ensure_ascii=False, indent=2),
            keywords=", ".join(input_data.get("keywords", [])),
        )
