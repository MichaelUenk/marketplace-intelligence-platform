# src/atlas/services/ai_agent/mistral_client.py
"""
Mistral AI Client - French LLM Provider

Mistral AI (https://mistral.ai) is a Paris-based AI company that provides
large language models with EU data residency and no US CLOUD Act exposure.

Features:
- Mistral Large: Most capable model for complex reasoning
- Mistral Medium: Balanced performance and cost
- Mistral Small: Fast and efficient for simple tasks
- All models process data exclusively in European infrastructure

Pricing (as of 2024):
- Mistral Small: €0.2/M input, €0.6/M output
- Mistral Medium: €2.7/M input, €8.1/M output
- Mistral Large: €8/M input, €24/M output
"""

import os
from typing import Optional, List, Dict, Any, AsyncGenerator
from dataclasses import dataclass
import httpx
import json


@dataclass
class ChatMessage:
    """A message in the chat conversation."""
    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class MistralResponse:
    """Response from Mistral API."""
    content: str
    model: str
    usage: Dict[str, int]  # prompt_tokens, completion_tokens, total_tokens
    finish_reason: str


class MistralClient:
    """
    Client for Mistral AI API.

    Mistral AI is headquartered in Paris, France and processes all data
    within EU infrastructure. This ensures GDPR compliance and avoids
    US CLOUD Act exposure.

    Documentation: https://docs.mistral.ai/

    Usage:
        client = MistralClient(api_key="your-api-key")

        # Simple completion
        response = await client.chat(
            messages=[{"role": "user", "content": "Hello!"}],
            model="mistral-medium-latest"
        )

        # With system prompt
        response = await client.chat(
            messages=[
                {"role": "system", "content": "You are a sales research analyst."},
                {"role": "user", "content": "Research Acme Corp."}
            ]
        )
    """

    # Available models
    MODELS = {
        "mistral-small-latest": "Fast, efficient for simple tasks",
        "mistral-medium-latest": "Balanced performance and cost",
        "mistral-large-latest": "Most capable for complex reasoning",
        "open-mistral-7b": "Open-weight 7B model",
        "open-mixtral-8x7b": "Open-weight Mixture of Experts",
        "open-mixtral-8x22b": "Largest open-weight model",
    }

    DEFAULT_MODEL = "mistral-medium-latest"

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.mistral.ai/v1",
        default_model: Optional[str] = None,
        timeout: float = 60.0,
    ):
        """
        Initialize Mistral client.

        Args:
            api_key: Mistral API key. If not provided, reads from MISTRAL_API_KEY env var.
            base_url: API base URL (default: https://api.mistral.ai/v1)
            default_model: Default model to use (default: mistral-medium-latest)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("Mistral API key is required (set MISTRAL_API_KEY or pass api_key)")

        self.base_url = base_url
        self.default_model = default_model or self.DEFAULT_MODEL
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=self.timeout,
            )
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        top_p: float = 1.0,
        random_seed: Optional[int] = None,
        safe_prompt: bool = False,
    ) -> MistralResponse:
        """
        Send a chat completion request.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (default: mistral-medium-latest)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            random_seed: Seed for reproducibility
            safe_prompt: Enable safe mode (guardrails)

        Returns:
            MistralResponse with content, usage stats, etc.
        """
        client = await self._get_client()

        payload = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "safe_prompt": safe_prompt,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens
        if random_seed is not None:
            payload["random_seed"] = random_seed

        response = await client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()

        return MistralResponse(
            content=data["choices"][0]["message"]["content"],
            model=data["model"],
            usage=data["usage"],
            finish_reason=data["choices"][0]["finish_reason"],
        )

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion response.

        Args:
            messages: List of message dicts
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens

        Yields:
            Content chunks as they arrive
        """
        client = await self._get_client()

        payload = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        async with client.stream("POST", "/chat/completions", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk["choices"][0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]
                    except json.JSONDecodeError:
                        continue

    async def generate_embeddings(
        self,
        texts: List[str],
        model: str = "mistral-embed",
    ) -> List[List[float]]:
        """
        Generate text embeddings.

        Args:
            texts: List of texts to embed
            model: Embedding model (default: mistral-embed)

        Returns:
            List of embedding vectors
        """
        client = await self._get_client()

        payload = {
            "model": model,
            "input": texts,
        }

        response = await client.post("/embeddings", json=payload)
        response.raise_for_status()
        data = response.json()

        return [item["embedding"] for item in data["data"]]

    # =====================
    # Convenience Methods
    # =====================

    async def complete(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Simple completion with optional system prompt.

        Args:
            prompt: User prompt
            system: Optional system prompt
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens

        Returns:
            Generated text content
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self.chat(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.content

    async def analyze(
        self,
        content: str,
        task: str,
        model: Optional[str] = None,
    ) -> str:
        """
        Analyze content with a specific task.

        Args:
            content: Content to analyze
            task: Analysis task description
            model: Model to use

        Returns:
            Analysis result
        """
        system = "You are an expert analyst. Provide clear, structured analysis."
        prompt = f"Task: {task}\n\nContent to analyze:\n{content}"

        return await self.complete(
            prompt=prompt,
            system=system,
            model=model or "mistral-large-latest",  # Use large for analysis
            temperature=0.3,  # Lower for more consistent output
        )

    async def summarize(
        self,
        content: str,
        style: str = "concise",
        model: Optional[str] = None,
    ) -> str:
        """
        Summarize content.

        Args:
            content: Content to summarize
            style: Summary style (concise, detailed, bullets)
            model: Model to use

        Returns:
            Summary
        """
        style_instructions = {
            "concise": "Provide a concise 2-3 sentence summary.",
            "detailed": "Provide a detailed summary covering all key points.",
            "bullets": "Summarize as bullet points, one per key point.",
        }

        system = f"You are a summarization expert. {style_instructions.get(style, style_instructions['concise'])}"

        return await self.complete(
            prompt=f"Summarize this content:\n\n{content}",
            system=system,
            model=model,
            temperature=0.3,
        )

    async def extract_json(
        self,
        content: str,
        schema: Dict[str, Any],
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract structured JSON from content.

        Args:
            content: Content to extract from
            schema: JSON schema describing expected output
            model: Model to use

        Returns:
            Extracted JSON object
        """
        system = """You are a data extraction expert. Extract information from the content
        and return it as valid JSON matching the provided schema. Only return JSON, no other text."""

        prompt = f"""Schema:
{json.dumps(schema, indent=2)}

Content:
{content}

Extract the information as JSON:"""

        response = await self.complete(
            prompt=prompt,
            system=system,
            model=model or "mistral-large-latest",
            temperature=0.1,  # Very low for consistent extraction
        )

        # Parse JSON from response
        try:
            # Try to find JSON in response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
            return json.loads(response)
        except json.JSONDecodeError:
            return {"raw_response": response, "error": "Failed to parse JSON"}
