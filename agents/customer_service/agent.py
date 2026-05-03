import json
from typing import Any
from agents.core.base_agent import BaseAgent
from agents.customer_service.prompts import CUSTOMER_SERVICE_SYSTEM, CUSTOMER_SERVICE_USER_TEMPLATE


class CustomerServiceAgent(BaseAgent):
    name = "customer_service_agent"

    def system_prompt(self) -> str:
        return CUSTOMER_SERVICE_SYSTEM

    def user_prompt(self, input_data: dict[str, Any]) -> str:
        return CUSTOMER_SERVICE_USER_TEMPLATE.format(
            customer_message=input_data.get("message", ""),
            order_json=json.dumps(input_data.get("order", {}), ensure_ascii=False, indent=2),
        )
