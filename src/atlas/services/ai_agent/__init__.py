# src/atlas/services/ai_agent/__init__.py
"""
AI Agent Service - European AI-powered sales intelligence.

Uses Mistral AI (Paris, France 🇫🇷) for:
- Prospect research and summarization
- Email personalization
- Subject line generation
- Smart recommendations

GDPR Compliant: Yes (EU headquarters, EU data processing)
No US CLOUD Act exposure.
"""

from .mistral_client import MistralClient
from .research_agent import ResearchAgent
from .personalization_agent import PersonalizationAgent

__all__ = ["MistralClient", "ResearchAgent", "PersonalizationAgent"]
