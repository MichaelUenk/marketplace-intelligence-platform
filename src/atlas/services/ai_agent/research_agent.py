# src/atlas/services/ai_agent/research_agent.py
"""
Research Agent - AI-powered prospect and company research.

Uses Mistral AI (France 🇫🇷) for intelligent research synthesis.
Combines data from multiple European sources for GDPR compliance.
"""

import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime
import json

from .mistral_client import MistralClient


@dataclass
class ResearchResult:
    """Structured research output."""
    prospect_id: str
    company_name: Optional[str] = None
    company_summary: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    recent_news: List[str] = field(default_factory=list)
    key_initiatives: List[str] = field(default_factory=list)
    pain_points: List[str] = field(default_factory=list)
    competitors: List[str] = field(default_factory=list)
    decision_makers: List[Dict[str, str]] = field(default_factory=list)
    recommended_approach: Optional[str] = None
    personalization_hooks: List[str] = field(default_factory=list)
    confidence_score: float = 0.0
    sources: List[str] = field(default_factory=list)
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    raw_data: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "prospect_id": self.prospect_id,
            "company_name": self.company_name,
            "company_summary": self.company_summary,
            "industry": self.industry,
            "company_size": self.company_size,
            "recent_news": self.recent_news,
            "key_initiatives": self.key_initiatives,
            "pain_points": self.pain_points,
            "competitors": self.competitors,
            "decision_makers": self.decision_makers,
            "recommended_approach": self.recommended_approach,
            "personalization_hooks": self.personalization_hooks,
            "confidence_score": self.confidence_score,
            "sources": self.sources,
            "generated_at": self.generated_at,
        }


class ResearchAgent:
    """
    AI-powered research agent for prospect and company intelligence.

    Uses Mistral AI (Paris, France) for synthesis and analysis.
    All data processing stays within EU for GDPR compliance.

    Features:
    - Company research and summarization
    - Industry analysis
    - Pain point identification
    - Personalization hook generation
    - Competitive intelligence

    Usage:
        agent = ResearchAgent()

        # Research a prospect
        result = await agent.research_prospect(
            prospect_id="123",
            company_name="Acme Corp",
            company_domain="acme.com",
            person_name="John Doe",
            person_title="VP of Sales"
        )

        print(result.company_summary)
        print(result.personalization_hooks)
    """

    RESEARCH_SYSTEM_PROMPT = """You are an expert B2B sales research analyst specializing in European markets.
Your role is to analyze company and prospect data to help sales teams personalize their outreach.

Guidelines:
- Focus on actionable insights that can be used in sales conversations
- Identify specific pain points and challenges the company might face
- Find personalization hooks (recent news, initiatives, hiring patterns)
- Be concise but thorough
- Always cite your reasoning
- Consider GDPR and European business context

Output structured JSON following the provided schema."""

    def __init__(
        self,
        mistral_client: Optional[MistralClient] = None,
        model: str = "mistral-large-latest",
    ):
        """
        Initialize research agent.

        Args:
            mistral_client: Mistral client instance (creates new if not provided)
            model: Model to use for research (default: mistral-large for quality)
        """
        self.client = mistral_client or MistralClient()
        self.model = model

    async def close(self):
        """Close resources."""
        await self.client.close()

    async def research_prospect(
        self,
        prospect_id: str,
        company_name: Optional[str] = None,
        company_domain: Optional[str] = None,
        person_name: Optional[str] = None,
        person_title: Optional[str] = None,
        person_linkedin: Optional[str] = None,
        additional_context: Optional[str] = None,
        enrichment_data: Optional[Dict[str, Any]] = None,
    ) -> ResearchResult:
        """
        Research a prospect and their company.

        Args:
            prospect_id: Unique identifier for the prospect
            company_name: Company name
            company_domain: Company website domain
            person_name: Contact person's name
            person_title: Contact person's job title
            person_linkedin: LinkedIn profile URL
            additional_context: Any additional context to consider
            enrichment_data: Pre-gathered data from enrichment sources (Cognism, etc.)

        Returns:
            ResearchResult with synthesized intelligence
        """
        # Build context from available data
        context_parts = []

        if company_name:
            context_parts.append(f"Company: {company_name}")
        if company_domain:
            context_parts.append(f"Website: {company_domain}")
        if person_name:
            context_parts.append(f"Contact: {person_name}")
        if person_title:
            context_parts.append(f"Title: {person_title}")
        if person_linkedin:
            context_parts.append(f"LinkedIn: {person_linkedin}")
        if additional_context:
            context_parts.append(f"Additional context: {additional_context}")

        if enrichment_data:
            context_parts.append(f"Enrichment data:\n{json.dumps(enrichment_data, indent=2)}")

        context = "\n".join(context_parts)

        # Define output schema
        schema = {
            "company_summary": "Brief company description (2-3 sentences)",
            "industry": "Primary industry",
            "company_size": "Company size estimate",
            "recent_news": ["List of recent news/events"],
            "key_initiatives": ["Current strategic initiatives"],
            "pain_points": ["Likely pain points and challenges"],
            "competitors": ["Key competitors"],
            "recommended_approach": "Suggested outreach approach",
            "personalization_hooks": ["Specific hooks for personalization"],
            "confidence_score": "0.0-1.0 confidence in research quality"
        }

        prompt = f"""Research the following prospect and company. Synthesize all available information
into actionable sales intelligence.

{context}

Provide your analysis as JSON matching this schema:
{json.dumps(schema, indent=2)}

Focus on:
1. Understanding the company's current situation and challenges
2. Identifying specific personalization opportunities
3. Finding recent triggers (news, funding, hiring, initiatives)
4. Recommending the best approach for outreach"""

        # Get AI analysis
        response = await self.client.chat(
            messages=[
                {"role": "system", "content": self.RESEARCH_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0.3,  # Lower for more consistent output
        )

        # Parse response
        try:
            # Extract JSON from response
            content = response.content
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(content[start:end])
            else:
                data = {}
        except json.JSONDecodeError:
            data = {"raw_response": response.content}

        # Build result
        return ResearchResult(
            prospect_id=prospect_id,
            company_name=company_name,
            company_summary=data.get("company_summary"),
            industry=data.get("industry"),
            company_size=data.get("company_size"),
            recent_news=data.get("recent_news", []),
            key_initiatives=data.get("key_initiatives", []),
            pain_points=data.get("pain_points", []),
            competitors=data.get("competitors", []),
            recommended_approach=data.get("recommended_approach"),
            personalization_hooks=data.get("personalization_hooks", []),
            confidence_score=float(data.get("confidence_score", 0.5)),
            sources=["mistral-ai-analysis"],
            raw_data={"enrichment_data": enrichment_data} if enrichment_data else {},
        )

    async def research_company(
        self,
        company_name: str,
        company_domain: Optional[str] = None,
        enrichment_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Research a company without a specific prospect.

        Args:
            company_name: Company name
            company_domain: Company website
            enrichment_data: Pre-gathered enrichment data

        Returns:
            Company intelligence dictionary
        """
        result = await self.research_prospect(
            prospect_id=f"company:{company_name}",
            company_name=company_name,
            company_domain=company_domain,
            enrichment_data=enrichment_data,
        )
        return result.to_dict()

    async def identify_pain_points(
        self,
        company_name: str,
        industry: str,
        company_size: Optional[str] = None,
        additional_context: Optional[str] = None,
    ) -> List[str]:
        """
        Identify likely pain points for a company.

        Args:
            company_name: Company name
            industry: Company's industry
            company_size: Company size (startup, SMB, enterprise)
            additional_context: Additional context

        Returns:
            List of identified pain points
        """
        prompt = f"""Identify the most likely pain points and challenges for this company:

Company: {company_name}
Industry: {industry}
Size: {company_size or 'Unknown'}
Context: {additional_context or 'None'}

List 5-7 specific, actionable pain points that a sales rep could address.
Format as a JSON array of strings."""

        response = await self.client.complete(
            prompt=prompt,
            system="You are a B2B sales strategist who identifies company challenges.",
            model=self.model,
            temperature=0.4,
        )

        try:
            # Parse JSON array
            start = response.find("[")
            end = response.rfind("]") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass

        return []

    async def generate_talking_points(
        self,
        research_result: ResearchResult,
        product_context: Optional[str] = None,
    ) -> List[str]:
        """
        Generate talking points based on research.

        Args:
            research_result: Previous research result
            product_context: Description of your product/service

        Returns:
            List of talking points for sales conversation
        """
        context = f"""Based on this research about {research_result.company_name}:

Summary: {research_result.company_summary}
Industry: {research_result.industry}
Pain Points: {', '.join(research_result.pain_points)}
Recent News: {', '.join(research_result.recent_news[:3])}
Key Initiatives: {', '.join(research_result.key_initiatives[:3])}

Product/Service Context: {product_context or 'General B2B solution'}

Generate 5 specific talking points for a sales conversation.
Each point should connect their challenges to potential solutions.
Format as a JSON array of strings."""

        response = await self.client.complete(
            prompt=context,
            system="You are an expert sales coach who crafts compelling talking points.",
            model=self.model,
            temperature=0.5,
        )

        try:
            start = response.find("[")
            end = response.rfind("]") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass

        return []
