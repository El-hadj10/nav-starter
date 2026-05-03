import json
import logging
from abc import ABC, abstractmethod
from typing import Any
from agents.core.llm_client import LLMClient

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    name: str = "base_agent"

    def __init__(self, provider: str = "openai", model: str = "gpt-4o"):
        self.llm = LLMClient(provider=provider, model=model)

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        system = self.system_prompt()
        user = self.user_prompt(input_data)
        logger.info("[%s] INPUT: %s", self.name, json.dumps(input_data)[:200])
        result = await self.llm.chat(system, user)
        logger.info("[%s] OUTPUT: %s | confidence=%.2f",
                    self.name, result.get("decision", "?"), result.get("confidence", 0))
        return result

    @abstractmethod
    def system_prompt(self) -> str:
        """Retourne le prompt système de l'agent."""

    @abstractmethod
    def user_prompt(self, input_data: dict[str, Any]) -> str:
        """Construit le prompt utilisateur à partir des données."""
