import openai
import anthropic
import json
from typing import Any
from agents.core.constitution import CONSTITUTION


class LLMClient:
    """Wrapper unifié OpenAI / Anthropic avec fallback."""

    def __init__(self, provider: str = "openai", model: str = "gpt-4o"):
        self.provider = provider
        self.model = model
        if provider == "openai":
            self._client = openai.AsyncOpenAI()
        elif provider == "anthropic":
            self._client = anthropic.AsyncAnthropic()
        else:
            raise ValueError(f"Provider inconnu : {provider}")

    async def chat(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        """Envoie un prompt et retourne un dict JSON parsé."""
        full_system = f"{CONSTITUTION}\n\n{system_prompt}"

        if self.provider == "openai":
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": full_system},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            return json.loads(response.choices[0].message.content)

        elif self.provider == "anthropic":
            response = await self._client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=full_system,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return json.loads(response.content[0].text)
