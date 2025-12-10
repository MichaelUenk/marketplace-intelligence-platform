# src/atlas/services/ai_agent/personalization_agent.py
"""
Personalization Agent - AI-powered email and message personalization.

Uses Mistral AI (France 🇫🇷) for generating personalized sales content.
All data processing stays within EU for GDPR compliance.
"""

import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import json

from .mistral_client import MistralClient
from .research_agent import ResearchResult


@dataclass
class PersonalizedEmail:
    """Generated personalized email."""
    subject: str
    body: str
    personalization_points: List[str]
    tone: str
    word_count: int


@dataclass
class SubjectLineVariants:
    """A/B test subject line variants."""
    variants: List[str]
    recommended: str
    reasoning: str


class PersonalizationAgent:
    """
    AI-powered personalization agent for sales outreach.

    Uses Mistral AI (Paris, France) for content generation.
    All data processing stays within EU for GDPR compliance.

    Features:
    - Email personalization based on research
    - Subject line A/B variant generation
    - LinkedIn message personalization
    - Call script generation
    - Follow-up recommendations

    Usage:
        agent = PersonalizationAgent()

        # Personalize an email template
        email = await agent.personalize_email(
            template="Hi {{first_name}}, I noticed {{company}} is expanding...",
            prospect_data={
                "first_name": "John",
                "company": "Acme Corp",
                "title": "VP Sales"
            },
            research_result=research  # From ResearchAgent
        )

        # Generate subject line variants
        variants = await agent.generate_subject_lines(
            email_context="Introducing our sales automation platform",
            prospect_name="John",
            company_name="Acme Corp",
            num_variants=4
        )
    """

    PERSONALIZATION_SYSTEM_PROMPT = """You are an expert B2B sales copywriter specializing in personalized outreach.

Your writing style:
- Professional but conversational
- Concise and value-focused
- Personalized without being creepy
- Clear call-to-action
- Avoids spam triggers and clichés

Guidelines:
- Never use "Hope this email finds you well" or similar clichés
- Lead with value or relevance, not introduction
- Reference specific details about the prospect/company
- Keep emails under 150 words for cold outreach
- Use the prospect's industry terminology
- Be respectful of GDPR and include easy opt-out mindset"""

    def __init__(
        self,
        mistral_client: Optional[MistralClient] = None,
        model: str = "mistral-medium-latest",
    ):
        """
        Initialize personalization agent.

        Args:
            mistral_client: Mistral client instance (creates new if not provided)
            model: Model to use (mistral-medium for balance of speed/quality)
        """
        self.client = mistral_client or MistralClient()
        self.model = model

    async def close(self):
        """Close resources."""
        await self.client.close()

    async def personalize_email(
        self,
        template: str,
        prospect_data: Dict[str, Any],
        research_result: Optional[ResearchResult] = None,
        tone: str = "professional",
        max_words: int = 150,
    ) -> PersonalizedEmail:
        """
        Personalize an email template for a specific prospect.

        Args:
            template: Email template with {{placeholders}}
            prospect_data: Prospect information (first_name, company, title, etc.)
            research_result: Research data for deeper personalization
            tone: Desired tone (professional, casual, formal)
            max_words: Maximum word count

        Returns:
            PersonalizedEmail with subject and body
        """
        # Build context
        context_parts = [f"Prospect data: {json.dumps(prospect_data, indent=2)}"]

        if research_result:
            context_parts.append(f"""
Research insights:
- Company: {research_result.company_name}
- Summary: {research_result.company_summary}
- Pain points: {', '.join(research_result.pain_points[:3])}
- Recent news: {', '.join(research_result.recent_news[:2])}
- Personalization hooks: {', '.join(research_result.personalization_hooks[:3])}
- Recommended approach: {research_result.recommended_approach}
""")

        context = "\n".join(context_parts)

        prompt = f"""Personalize this email template for the prospect:

TEMPLATE:
{template}

CONTEXT:
{context}

REQUIREMENTS:
- Tone: {tone}
- Maximum words: {max_words}
- Replace all {{{{placeholders}}}} with relevant content
- Add personalized touches based on research
- Keep it concise and value-focused

Return JSON with:
{{
    "subject": "Personalized subject line",
    "body": "Full personalized email body",
    "personalization_points": ["List of personalization elements used"]
}}"""

        response = await self.client.chat(
            messages=[
                {"role": "system", "content": self.PERSONALIZATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0.7,
        )

        # Parse response
        try:
            content = response.content
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(content[start:end])
            else:
                data = {"subject": "Follow up", "body": template, "personalization_points": []}
        except json.JSONDecodeError:
            data = {"subject": "Follow up", "body": response.content, "personalization_points": []}

        body = data.get("body", template)

        return PersonalizedEmail(
            subject=data.get("subject", "Following up"),
            body=body,
            personalization_points=data.get("personalization_points", []),
            tone=tone,
            word_count=len(body.split()),
        )

    async def generate_subject_lines(
        self,
        email_context: str,
        prospect_name: Optional[str] = None,
        company_name: Optional[str] = None,
        num_variants: int = 4,
        style: str = "mixed",  # "question", "benefit", "curiosity", "mixed"
    ) -> SubjectLineVariants:
        """
        Generate A/B test subject line variants.

        Args:
            email_context: Brief description of email content/purpose
            prospect_name: Prospect's name for personalization
            company_name: Company name for personalization
            num_variants: Number of variants to generate (2-6)
            style: Subject line style preference

        Returns:
            SubjectLineVariants with options and recommendation
        """
        style_guidance = {
            "question": "Use questions that spark curiosity",
            "benefit": "Lead with clear value/benefit",
            "curiosity": "Create intrigue without being clickbait",
            "mixed": "Mix of questions, benefits, and curiosity",
        }

        prompt = f"""Generate {num_variants} subject line variants for A/B testing.

Email context: {email_context}
Prospect name: {prospect_name or 'Not specified'}
Company: {company_name or 'Not specified'}
Style: {style_guidance.get(style, style_guidance['mixed'])}

Requirements:
- Under 50 characters each (for mobile)
- No spam trigger words (free, urgent, act now, etc.)
- Personalize where appropriate
- Test different approaches

Return JSON:
{{
    "variants": ["subject 1", "subject 2", ...],
    "recommended": "The best variant",
    "reasoning": "Why this variant is recommended"
}}"""

        response = await self.client.chat(
            messages=[
                {"role": "system", "content": "You are an email marketing expert who optimizes subject lines for B2B sales."},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0.8,  # Higher for creativity
        )

        try:
            content = response.content
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(content[start:end])
            else:
                data = {"variants": [], "recommended": "", "reasoning": ""}
        except json.JSONDecodeError:
            data = {"variants": [], "recommended": "", "reasoning": ""}

        variants = data.get("variants", [])
        recommended = data.get("recommended", variants[0] if variants else "")

        return SubjectLineVariants(
            variants=variants,
            recommended=recommended,
            reasoning=data.get("reasoning", ""),
        )

    async def personalize_linkedin_message(
        self,
        message_type: str,  # "connection", "inmail", "follow_up"
        prospect_data: Dict[str, Any],
        research_result: Optional[ResearchResult] = None,
        context: Optional[str] = None,
    ) -> str:
        """
        Generate personalized LinkedIn message.

        Args:
            message_type: Type of message (connection, inmail, follow_up)
            prospect_data: Prospect information
            research_result: Research data
            context: Additional context

        Returns:
            Personalized LinkedIn message
        """
        type_guidance = {
            "connection": "Short connection request (under 300 chars). Focus on common ground.",
            "inmail": "Professional InMail (under 1000 chars). Lead with value.",
            "follow_up": "Follow-up to previous interaction. Reference past touchpoint.",
        }

        research_context = ""
        if research_result:
            research_context = f"""
Research:
- Company: {research_result.company_name}
- Pain points: {', '.join(research_result.pain_points[:2])}
- Hooks: {', '.join(research_result.personalization_hooks[:2])}
"""

        prompt = f"""Write a personalized LinkedIn {message_type} message.

Prospect: {json.dumps(prospect_data, indent=2)}
{research_context}
Additional context: {context or 'None'}

Message type: {type_guidance.get(message_type, type_guidance['connection'])}

Write the message directly, no JSON needed. Be conversational and authentic."""

        response = await self.client.complete(
            prompt=prompt,
            system="You are a LinkedIn outreach expert. Write authentic, non-salesy messages.",
            model=self.model,
            temperature=0.7,
        )

        return response.strip()

    async def generate_call_script(
        self,
        prospect_data: Dict[str, Any],
        research_result: Optional[ResearchResult] = None,
        call_objective: str = "discovery",
        product_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a call script for sales calls.

        Args:
            prospect_data: Prospect information
            research_result: Research data
            call_objective: Objective (discovery, demo, follow_up)
            product_context: Product/service description

        Returns:
            Call script with opener, talking points, questions, objection handlers
        """
        research_context = ""
        if research_result:
            research_context = f"""
Research:
- Company summary: {research_result.company_summary}
- Pain points: {', '.join(research_result.pain_points)}
- Recent news: {', '.join(research_result.recent_news[:2])}
- Recommended approach: {research_result.recommended_approach}
"""

        prompt = f"""Create a call script for a {call_objective} call.

Prospect: {json.dumps(prospect_data, indent=2)}
{research_context}
Product context: {product_context or 'B2B solution'}

Return JSON with:
{{
    "opener": "Opening line (reference something specific)",
    "talking_points": ["Key points to cover"],
    "discovery_questions": ["Questions to ask"],
    "objection_handlers": {{"objection": "response"}},
    "closing": "How to end the call",
    "voicemail_script": "Brief voicemail if they don't answer"
}}"""

        response = await self.client.chat(
            messages=[
                {"role": "system", "content": "You are a sales call coach. Create natural, conversational scripts."},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0.6,
        )

        try:
            content = response.content
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
        except json.JSONDecodeError:
            pass

        return {"opener": "", "talking_points": [], "discovery_questions": []}

    async def suggest_follow_up(
        self,
        previous_interactions: List[Dict[str, Any]],
        days_since_last: int,
        prospect_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Suggest optimal follow-up timing and content.

        Args:
            previous_interactions: List of past interactions
            days_since_last: Days since last interaction
            prospect_data: Prospect information

        Returns:
            Follow-up suggestion with timing, channel, and content
        """
        prompt = f"""Based on these previous interactions, suggest the best follow-up approach:

Previous interactions:
{json.dumps(previous_interactions, indent=2)}

Days since last contact: {days_since_last}
Prospect: {json.dumps(prospect_data, indent=2)}

Return JSON with:
{{
    "recommended_channel": "email/linkedin/call",
    "suggested_timing": "When to follow up",
    "urgency": "low/medium/high",
    "message_angle": "What angle to take",
    "sample_opener": "Example opening line"
}}"""

        response = await self.client.chat(
            messages=[
                {"role": "system", "content": "You are a sales cadence expert who optimizes follow-up timing."},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0.5,
        )

        try:
            content = response.content
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
        except json.JSONDecodeError:
            pass

        return {"recommended_channel": "email", "urgency": "medium"}
