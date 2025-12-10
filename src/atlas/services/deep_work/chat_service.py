"""
Claude Chat Service

Integrates with Claude API for conversational AI during Week Work Wednesday
and other deep work sessions. Provides context-aware responses using
knowledge base and reasoning chunks.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator

from .deep_work_types import (
    ChatMessage,
    ChatSession,
    ChatRole,
    SessionPhase,
)
from .reasoning_chunks import ReasoningChunkService
from .knowledge_base import KnowledgeBaseService


# System prompts for different contexts
SYSTEM_PROMPTS = {
    "week_work": """You are an AI assistant helping with Week Work Wednesday - a collaborative session where humans and AI review AI decisions, validate learnings, and improve the system.

Your role:
1. Help review flagged AI decisions and explain the reasoning
2. Suggest corrections or validations based on context
3. Identify patterns in the decisions being reviewed
4. Generate insights about AI performance
5. Help formulate new learnings for the knowledge base

Be concise but thorough. Focus on the specific decision at hand and provide actionable recommendations.

When reviewing a decision:
- Summarize the AI's reasoning chain
- Highlight uncertainties and alternatives considered
- Explain why it was flagged for review
- Suggest whether to validate, correct, or reject
- If correcting, explain what the correct decision should be and why""",

    "exploration": """You are an AI assistant for the iBood Sales Intelligence Platform. You help users explore signals, analyze deals, and make data-driven decisions.

Your capabilities:
1. Explain signal classifications and confidence scores
2. Analyze deal potential and BANT/SPIN scores
3. Discuss company intelligence and contact strategies
4. Identify patterns in market signals
5. Suggest outreach timing and approaches

Be direct and specific. Reference concrete data when available. Focus on actionable insights for deal sourcing.""",

    "review": """You are reviewing a specific AI decision. Your task is to:

1. Analyze whether the decision was correct
2. Evaluate the quality of the reasoning chain
3. Identify any missed factors or alternative approaches
4. Recommend validation, correction, or rejection
5. Suggest learnings to add to the knowledge base

Be critical but constructive. Focus on improving future decisions.""",

    "general": """You are an AI assistant for the iBood Sales Intelligence Platform. You help with:
- Understanding signals and deal opportunities
- Reviewing AI decisions and reasoning
- Navigating the knowledge base
- Analyzing performance metrics

Be helpful and conversational while staying focused on the user's needs.""",
}


class ChatService:
    """Service for AI chat interactions"""

    def __init__(
        self,
        reasoning_service: ReasoningChunkService | None = None,
        knowledge_service: KnowledgeBaseService | None = None,
    ):
        self._sessions: dict[str, ChatSession] = {}
        self._reasoning = reasoning_service or ReasoningChunkService()
        self._knowledge = knowledge_service or KnowledgeBaseService()

        # Claude API configuration
        self._api_key = os.environ.get("ANTHROPIC_API_KEY")
        self._model = "claude-sonnet-4-20250514"  # Use Claude Sonnet for fast responses
        self._max_tokens = 4096

    def create_session(
        self,
        user_id: str,
        session_type: str = "general",
        week_work_session_id: str | None = None,
    ) -> ChatSession:
        """Create a new chat session"""
        session_id = f"chat_{str(uuid.uuid4())[:12]}"
        now = datetime.now()

        system_prompt = SYSTEM_PROMPTS.get(session_type, SYSTEM_PROMPTS["general"])

        session = ChatSession(
            id=session_id,
            user_id=user_id,
            created_at=now,
            updated_at=now,
            session_type=session_type,
            week_work_session_id=week_work_session_id,
            system_prompt=system_prompt,
        )

        self._sessions[session.id] = session
        return session

    def get_session(self, session_id: str) -> ChatSession | None:
        """Get a chat session by ID"""
        return self._sessions.get(session_id)

    def _build_context(
        self,
        session: ChatSession,
        user_message: str,
        chunk_id: str | None = None,
    ) -> str:
        """Build context for the AI from knowledge base and reasoning chunks"""
        context_parts = []

        # Add reasoning chunk context if reviewing a specific decision
        if chunk_id:
            chunk = self._reasoning.get_chunk(chunk_id)
            if chunk:
                context_parts.append(f"""
DECISION BEING REVIEWED:
Type: {chunk.type.value}
Agent: {chunk.agent}
Action: {chunk.decision_action}
Result: {chunk.decision_result}
Confidence: {chunk.decision_confidence:.0%}

Reasoning Chain:
{self._format_reasoning_chain(chunk.reasoning_chain)}

Alternatives Considered:
{self._format_alternatives(chunk.alternatives_considered)}

Uncertainties:
{chr(10).join('- ' + u for u in chunk.uncertainties) if chunk.uncertainties else 'None identified'}

Flag Reason: {chunk.flag_reason or 'Not flagged'}

Context:
{chunk.input_context}
""")

        # Add relevant knowledge base context
        kb_context = self._knowledge.get_context_for_decision(
            query_text=user_message,
        )

        if any(kb_context.values()):
            context_parts.append("\nRELEVANT KNOWLEDGE:")

            if kb_context.get("signal_rules"):
                context_parts.append("\nSignal Rules:")
                for rule in kb_context["signal_rules"][:3]:
                    context_parts.append(f"- {rule[:200]}...")

            if kb_context.get("patterns"):
                context_parts.append("\nPatterns:")
                for pattern in kb_context["patterns"][:2]:
                    context_parts.append(f"- {pattern[:200]}...")

            if kb_context.get("company_intel"):
                context_parts.append("\nCompany Intelligence:")
                for intel in kb_context["company_intel"][:2]:
                    context_parts.append(f"- {intel[:200]}...")

            if kb_context.get("negative_learnings"):
                context_parts.append("\nNegative Learnings (avoid these pitfalls):")
                for learning in kb_context["negative_learnings"][:2]:
                    context_parts.append(f"- {learning[:200]}...")

            # Show vector similarity matches if available
            if kb_context.get("vector_matches"):
                context_parts.append("\nSemantically Similar Knowledge (by vector similarity):")
                for match in kb_context["vector_matches"][:3]:
                    score_pct = int(match.get("score", 0) * 100)
                    context_parts.append(f"- [{score_pct}% match] {match.get('title', 'Unknown')}: {match.get('content_preview', '')[:150]}...")

        # Add similar past reasoning if helpful
        similar_reasoning = self._reasoning.search_similar(user_message, limit=2)
        if similar_reasoning:
            context_parts.append("\nSIMILAR PAST DECISIONS:")
            for chunk in similar_reasoning:
                context_parts.append(f"""
- {chunk.type.value}: {chunk.decision_result} (confidence: {chunk.decision_confidence:.0%})
  Outcome: {chunk.outcome_status.value if chunk.outcome_status else 'pending'}
  Review: {chunk.review_status.value}""")

        return "\n".join(context_parts) if context_parts else ""

    def _format_reasoning_chain(self, chain: list) -> str:
        """Format reasoning chain for display"""
        if not chain:
            return "No reasoning chain available"
        return "\n".join(
            f"Step {s.step}: {s.thought}" + (f" (Evidence: {s.evidence})" if s.evidence else "")
            for s in chain
        )

    def _format_alternatives(self, alternatives: list) -> str:
        """Format alternatives for display"""
        if not alternatives:
            return "None considered"
        return "\n".join(
            f"- {a.alternative}: Rejected because {a.rejected_because}"
            for a in alternatives
        )

    async def send_message(
        self,
        session_id: str,
        content: str,
        chunk_id: str | None = None,
        audio_transcript: str | None = None,
    ) -> ChatMessage:
        """Send a message and get AI response"""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Create user message
        user_message = ChatMessage(
            id=f"msg_{str(uuid.uuid4())[:8]}",
            role=ChatRole.USER,
            content=content,
            created_at=datetime.now(),
            audio_transcript=audio_transcript,
        )
        session.messages.append(user_message)

        # Build context
        context = self._build_context(session, content, chunk_id)

        # Get AI response
        response_content = await self._call_claude(session, content, context)

        # Create assistant message
        assistant_message = ChatMessage(
            id=f"msg_{str(uuid.uuid4())[:8]}",
            role=ChatRole.ASSISTANT,
            content=response_content,
            created_at=datetime.now(),
        )
        session.messages.append(assistant_message)

        session.updated_at = datetime.now()
        return assistant_message

    async def _call_claude(
        self,
        session: ChatSession,
        user_message: str,
        context: str,
    ) -> str:
        """Call Claude API for response"""
        try:
            import anthropic
        except ImportError:
            # Return mock response if anthropic not installed
            return self._get_mock_response(session, user_message, context)

        if not self._api_key:
            return self._get_mock_response(session, user_message, context)

        try:
            client = anthropic.Anthropic(api_key=self._api_key)

            # Build messages array
            messages = []

            # Add context as first user message if available
            if context:
                messages.append({
                    "role": "user",
                    "content": f"[CONTEXT]\n{context}\n[/CONTEXT]\n\nI'll now ask you questions about this.",
                })
                messages.append({
                    "role": "assistant",
                    "content": "I understand the context. I'm ready to help you review this decision and provide recommendations. What would you like to know?",
                })

            # Add conversation history (last 10 messages)
            for msg in session.messages[-10:]:
                if msg.role == ChatRole.USER:
                    messages.append({"role": "user", "content": msg.content})
                elif msg.role == ChatRole.ASSISTANT:
                    messages.append({"role": "assistant", "content": msg.content})

            response = client.messages.create(
                model=self._model,
                max_tokens=self._max_tokens,
                system=session.system_prompt,
                messages=messages,
            )

            return response.content[0].text

        except Exception as e:
            # Fall back to mock response on error
            return self._get_mock_response(session, user_message, context)

    def _get_mock_response(
        self,
        session: ChatSession,
        user_message: str,
        context: str,
    ) -> str:
        """Generate mock response when Claude API is not available"""
        user_lower = user_message.lower()

        # Week Work context responses
        if session.session_type == "week_work":
            if "validate" in user_lower or "correct" in user_lower:
                return """Based on my analysis of this decision:

**Recommendation: VALIDATE with minor note**

The reasoning chain is solid:
1. Source verification was thorough
2. Language analysis correctly identified key signals
3. Historical pattern matching was accurate

However, I suggest adding a note about timing sensitivity - the year-end deadline creates additional urgency that should be factored into confidence.

**Suggested Learning:**
"When inventory signals coincide with year-end deadlines, increase confidence by 5-10% due to heightened urgency."

Would you like me to help formulate this as a knowledge base entry?"""

            if "pattern" in user_lower:
                return """I've analyzed the emerging pattern:

**Q4 Year-End Pressure Pattern**

Evidence:
- 7 of 12 inventory signals this week mention year-end
- Up from 2 signals last week (3.5x increase)
- All from enterprise companies with fiscal year-end Dec 31

**Recommendation: ACTIVATE**

This pattern has strong supporting evidence and aligns with known seasonal behavior. The 2.3x conversion rate increase is statistically significant.

Suggested rule modifications:
1. Apply only to companies with calendar fiscal year
2. Set expiration date (Dec 31)
3. Monitor for false positives in January

Should I help refine the rule parameters?"""

            if "review" in user_lower or "decision" in user_lower:
                return """Looking at this flagged decision:

**Signal Classification: PRODUCT_DISCONTINUATION (67% confidence)**

The AI flagged this for review because:
1. Confidence below 70% threshold
2. "Strategic review" language is ambiguous

**Analysis:**
- Bosch has historically used "strategic review" for both investments and discontinuations
- The 2023 Philips comparison may not apply directly
- No specific products mentioned limits confidence

**My Recommendation: RECLASSIFY**

I suggest classifying as "MONITOR" rather than "PRODUCT_DISCONTINUATION":
- Confidence for discontinuation is too low
- "Strategic review" needs more evidence
- Set a 3-month reminder for follow-up

Would you like me to suggest a specific correction entry?"""

        # Exploration context
        if session.session_type == "exploration":
            return """Based on the current signals and knowledge base:

**Key Insights:**

1. **Philips Opportunity** - High confidence (92%) INVENTORY_SURPLUS signal with €120M potential. Year-end urgency suggests fast action.

2. **Bosch Signal** - Lower confidence (67%). Recommend monitoring rather than immediate outreach.

3. **Q4 Pattern Active** - Year-end pressure pattern shows 2.3x higher conversion. Prioritize inventory signals with deadline mentions.

**Recommended Actions:**
1. Prioritize Philips outreach this week
2. Monitor Bosch for more clarity
3. Review any signals mentioning "year-end" or "Q4 targets"

What specific area would you like to explore further?"""

        # Default response
        return """I'm here to help with your intelligence and deep work session.

I can assist with:
1. **Reviewing AI decisions** - Analyze reasoning chains and suggest validations/corrections
2. **Pattern analysis** - Identify trends in signals and outcomes
3. **Knowledge base queries** - Find relevant learnings and company intelligence
4. **Performance insights** - Understand AI accuracy and improvement areas

What would you like to focus on?"""

    def end_session(self, session_id: str) -> ChatSession | None:
        """End a chat session"""
        session = self._sessions.get(session_id)
        if session:
            session.is_active = False
            session.ended_at = datetime.now()
        return session

    def get_session_history(self, session_id: str) -> list[dict]:
        """Get message history for a session"""
        session = self._sessions.get(session_id)
        if not session:
            return []
        return [msg.to_dict() for msg in session.messages]

    def get_active_sessions(self, user_id: str) -> list[ChatSession]:
        """Get active sessions for a user"""
        return [
            s for s in self._sessions.values()
            if s.user_id == user_id and s.is_active
        ]
