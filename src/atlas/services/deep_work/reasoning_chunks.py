"""
Reasoning Chunks Service

Handles logging, storing, and retrieving AI reasoning chunks.
Integrates with vector database for semantic search.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any

from .deep_work_types import (
    ReasoningChunk,
    ReasoningStep,
    Alternative,
    ReasoningChunkType,
    ReviewStatus,
    OutcomeStatus,
    FLAG_CONDITIONS,
)
from .vector_service import get_vector_service, VectorService


class ReasoningChunkService:
    """Service for managing reasoning chunks"""

    def __init__(self):
        # In-memory storage for demo (would be PostgreSQL in production)
        self._chunks: dict[str, ReasoningChunk] = {}
        # Vector service for semantic search (uses Qdrant)
        self._vector_service: VectorService = get_vector_service()
        self._initialize_demo_data()

    def _initialize_demo_data(self):
        """Initialize with demo reasoning chunks"""
        now = datetime.now()

        # Demo chunk 1: Signal Classification (validated)
        chunk1 = ReasoningChunk(
            id="rc_2024120901_001",
            created_at=now - timedelta(hours=2),
            agent="signal_classifier",
            type=ReasoningChunkType.SIGNAL_CLASSIFICATION,
            decision_action="classify_signal",
            decision_result="INVENTORY_SURPLUS",
            decision_confidence=0.92,
            input_context={
                "source": "Q3 2024 Earnings Call Transcript",
                "company": "Philips",
                "date": "2024-12-08",
                "relevant_text": "We continue to work through elevated inventory levels in our Personal Health division, with approximately €120M in excess stock...",
            },
            retrieved_knowledge=[
                "kb_001: Philips had similar inventory issue in Q1 2023, led to successful iBood deal",
                "kb_042: 'Elevated inventory' language historically correlates with 70%+ deal conversion",
            ],
            reasoning_chain=[
                ReasoningStep(1, "Source is official earnings call transcript → high reliability", "SEC filing, verified source"),
                ReasoningStep(2, "Language 'elevated inventory levels' is explicit admission of overstock", "Direct quote from CEO"),
                ReasoningStep(3, "€120M figure quantifies the opportunity", "Specific number mentioned"),
                ReasoningStep(4, "Personal Health segment matches iBood categories", "Category mapping: grooming → Personal Care"),
                ReasoningStep(5, "Year-end timing creates urgency", "'Before year-end' mentioned in transcript"),
            ],
            alternatives_considered=[
                Alternative("EARNINGS_MISS", "Inventory is the actionable signal, not the earnings miss itself"),
                Alternative("PRODUCT_DISCONTINUATION", "No mention of discontinuing products, just clearing excess"),
            ],
            uncertainties=["Exact product mix in inventory", "Whether Philips will prioritize iBood vs. other channels"],
            flagged_for_review=False,
            review_status=ReviewStatus.VALIDATED,
            reviewed_by="user_hugo",
            reviewed_at=now - timedelta(hours=1),
            review_notes="Correct classification. Good reasoning chain.",
            signal_id="sig_philips_001",
            company_id="company_philips",
        )
        self._chunks[chunk1.id] = chunk1

        # Demo chunk 2: Signal Classification (needs review)
        chunk2 = ReasoningChunk(
            id="rc_2024120901_002",
            created_at=now - timedelta(hours=1),
            agent="signal_classifier",
            type=ReasoningChunkType.SIGNAL_CLASSIFICATION,
            decision_action="classify_signal",
            decision_result="PRODUCT_DISCONTINUATION",
            decision_confidence=0.67,
            input_context={
                "source": "Industry News Article",
                "company": "Bosch Home Appliances",
                "date": "2024-12-09",
                "relevant_text": "Bosch announces strategic review of small appliances division...",
            },
            retrieved_knowledge=[
                "kb_015: Similar language from Philips in 2023 led to clearance opportunity",
            ],
            reasoning_chain=[
                ReasoningStep(1, "'Strategic review' often precedes discontinuation", "Industry pattern"),
                ReasoningStep(2, "Small appliances is low-margin for Bosch", "Historical data", 70),
                ReasoningStep(3, "Similar language from Philips led to clearance", "Knowledge base match", 80),
            ],
            alternatives_considered=[
                Alternative("RESTRUCTURING", "'Strategic review' could mean investment, not discontinuation"),
                Alternative("PARTNERSHIP", "Could be seeking manufacturing partner"),
            ],
            uncertainties=[
                "'Strategic review' could also mean investment, not discontinuation",
                "No specific products mentioned",
                "Bosch historically keeps divisions longer",
            ],
            flagged_for_review=True,
            flag_reason="Confidence below 70% threshold",
            is_novel_situation=False,
            signal_id="sig_bosch_001",
            company_id="company_bosch",
        )
        self._chunks[chunk2.id] = chunk2

        # Demo chunk 3: Confidence Scoring
        chunk3 = ReasoningChunk(
            id="rc_2024120901_003",
            created_at=now - timedelta(minutes=45),
            agent="confidence_scorer",
            type=ReasoningChunkType.CONFIDENCE_SCORING,
            decision_action="score_confidence",
            decision_result="92%",
            decision_confidence=0.92,
            input_context={
                "signal_id": "sig_philips_001",
                "signal_type": "INVENTORY_SURPLUS",
                "company": "Philips",
            },
            reasoning_chain=[
                ReasoningStep(1, "Official source (earnings call)", "+25%"),
                ReasoningStep(2, "Clear language ('elevated inventory')", "+25%"),
                ReasoningStep(3, "Recent (within 48 hours)", "+20%"),
                ReasoningStep(4, "No conflicting information", "+15%"),
                ReasoningStep(5, "Historical pattern match", "+7%"),
            ],
            signal_id="sig_philips_001",
            company_id="company_philips",
            review_status=ReviewStatus.VALIDATED,
        )
        self._chunks[chunk3.id] = chunk3

        # Demo chunk 4: Contact Recommendation (corrected)
        chunk4 = ReasoningChunk(
            id="rc_2024120901_004",
            created_at=now - timedelta(days=2),
            agent="contact_recommender",
            type=ReasoningChunkType.CONTACT_RECOMMENDATION,
            decision_action="recommend_contact",
            decision_result="Sales Director Benelux",
            decision_confidence=0.85,
            input_context={
                "signal_id": "sig_sony_001",
                "company": "Sony",
                "signal_type": "INVENTORY_SURPLUS",
            },
            reasoning_chain=[
                ReasoningStep(1, "Sales Director typically handles clearance deals", "Role pattern"),
                ReasoningStep(2, "Previous iBood contact was Sales team", "Historical data"),
                ReasoningStep(3, "LinkedIn shows Sales Director active", "Social data"),
            ],
            signal_id="sig_sony_001",
            company_id="company_sony",
            review_status=ReviewStatus.CORRECTED,
            reviewed_by="user_hugo",
            reviewed_at=now - timedelta(days=1),
            review_notes="CFO involved due to inventory write-down threshold",
            correction={
                "original_result": "Sales Director Benelux",
                "corrected_result": "CFO (for deals > €50M)",
                "learning": "Sony CFO involved when inventory value exceeds €50M threshold",
            },
            outcome_status=OutcomeStatus.DEAL_WON,
            outcome_value=125000,
            outcome_notes="Deal closed successfully after CFO engagement",
            outcome_closed_at=now - timedelta(hours=12),
        )
        self._chunks[chunk4.id] = chunk4

        # Demo chunk 5: Priority Ranking
        chunk5 = ReasoningChunk(
            id="rc_2024120901_005",
            created_at=now - timedelta(minutes=30),
            agent="priority_ranker",
            type=ReasoningChunkType.PRIORITY_RANKING,
            decision_action="rank_priority",
            decision_result="Philips > Sony (relationship + timing)",
            decision_confidence=0.88,
            input_context={
                "signals": ["sig_philips_001", "sig_sony_001"],
            },
            reasoning_chain=[
                ReasoningStep(1, "Philips signal is confirmed vs Sony rumored", "Confirmation level"),
                ReasoningStep(2, "iBood has existing Philips relationship", "Relationship data"),
                ReasoningStep(3, "Philips timing is urgent (year-end)", "Timeline analysis"),
            ],
            review_status=ReviewStatus.VALIDATED,
        )
        self._chunks[chunk5.id] = chunk5

        # Demo chunk 6: BANT Scoring
        chunk6 = ReasoningChunk(
            id="rc_2024120901_006",
            created_at=now - timedelta(minutes=15),
            agent="bant_scorer",
            type=ReasoningChunkType.BANT_SCORING,
            decision_action="score_bant",
            decision_result="78/100",
            decision_confidence=0.82,
            input_context={
                "deal_id": "deal_philips_001",
                "company": "Philips",
            },
            reasoning_chain=[
                ReasoningStep(1, "Budget: 20/25 - Budget exists, approval process clear", "Email confirmation"),
                ReasoningStep(2, "Authority: 18/25 - Decision-maker engaged, some blockers", "Meeting notes"),
                ReasoningStep(3, "Need: 22/25 - Strong need, quantified €120M", "Earnings call"),
                ReasoningStep(4, "Timeline: 18/25 - Clear deadline (year-end)", "Transcript"),
            ],
            deal_id="deal_philips_001",
            company_id="company_philips",
        )
        self._chunks[chunk6.id] = chunk6

        # Demo chunk 7: Pattern Recognition (emerging pattern)
        chunk7 = ReasoningChunk(
            id="rc_2024120901_007",
            created_at=now - timedelta(hours=3),
            agent="pattern_detector",
            type=ReasoningChunkType.PATTERN_RECOGNITION,
            decision_action="detect_pattern",
            decision_result="Q4 Year-End Pressure Pattern",
            decision_confidence=0.87,
            input_context={
                "signals_analyzed": 12,
                "time_period": "last_7_days",
            },
            reasoning_chain=[
                ReasoningStep(1, "7 of 12 signals mention 'year-end' or 'Q4 targets'", "Frequency analysis"),
                ReasoningStep(2, "Up from 2 signals last week", "Trend comparison"),
                ReasoningStep(3, "All from enterprise companies", "Segment analysis"),
            ],
            flagged_for_review=True,
            flag_reason="Emerging pattern needs validation",
            is_novel_situation=True,
        )
        self._chunks[chunk7.id] = chunk7

        # Demo chunk 8: Paranoid Twin Analysis
        chunk8 = ReasoningChunk(
            id="rc_2024120901_008",
            created_at=now - timedelta(minutes=5),
            agent="paranoid_twin",
            type=ReasoningChunkType.PARANOID_TWIN,
            decision_action="assess_risks",
            decision_result="HOLD - Address 2 critical risks",
            decision_confidence=0.91,
            input_context={
                "deal_id": "deal_philips_001",
                "stage": "commit",
            },
            reasoning_chain=[
                ReasoningStep(1, "Economic buyer hasn't responded in 5 days", "Critical risk"),
                ReasoningStep(2, "Blocker (Brand Manager) not engaged", "Critical risk"),
                ReasoningStep(3, "Timeline pressure may lead to shortcuts", "Medium risk"),
            ],
            uncertainties=[
                "Economic buyer silence could be vacation or internal politics",
                "Blocker may not have veto power",
            ],
            deal_id="deal_philips_001",
            company_id="company_philips",
        )
        self._chunks[chunk8.id] = chunk8

    def create_chunk(
        self,
        agent: str,
        chunk_type: ReasoningChunkType,
        decision_action: str,
        decision_result: str,
        decision_confidence: float,
        input_context: dict,
        reasoning_chain: list[dict],
        alternatives_considered: list[dict] | None = None,
        uncertainties: list[str] | None = None,
        retrieved_knowledge: list[str] | None = None,
        signal_id: str | None = None,
        company_id: str | None = None,
        deal_id: str | None = None,
    ) -> ReasoningChunk:
        """Create a new reasoning chunk"""
        chunk_id = f"rc_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"

        # Convert reasoning chain
        chain = [
            ReasoningStep(
                step=r.get("step", i + 1),
                thought=r["thought"],
                evidence=r.get("evidence", ""),
                confidence=r.get("confidence", 100),
            )
            for i, r in enumerate(reasoning_chain)
        ]

        # Convert alternatives
        alts = []
        if alternatives_considered:
            alts = [
                Alternative(a["alternative"], a["rejected_because"])
                for a in alternatives_considered
            ]

        chunk = ReasoningChunk(
            id=chunk_id,
            created_at=datetime.now(),
            agent=agent,
            type=chunk_type,
            decision_action=decision_action,
            decision_result=decision_result,
            decision_confidence=decision_confidence,
            input_context=input_context,
            retrieved_knowledge=retrieved_knowledge or [],
            reasoning_chain=chain,
            alternatives_considered=alts,
            uncertainties=uncertainties or [],
            signal_id=signal_id,
            company_id=company_id,
            deal_id=deal_id,
        )

        # Check if should be flagged
        self._apply_flag_rules(chunk)

        self._chunks[chunk.id] = chunk

        # Index in vector store for semantic search
        self._index_chunk(chunk)

        return chunk

    def _index_chunk(self, chunk: ReasoningChunk) -> bool:
        """Index a reasoning chunk in the vector store"""
        # Build reasoning text from chain
        reasoning_text = "\n".join([
            f"Step {step.step}: {step.thought}"
            for step in chunk.reasoning_chain
        ])

        return self._vector_service.index_reasoning_chunk(
            chunk_id=chunk.id,
            decision_type=chunk.type.value,
            result=chunk.decision_result,
            reasoning_text=reasoning_text,
            metadata={
                "agent": chunk.agent,
                "confidence": chunk.decision_confidence,
                "flagged": chunk.flagged_for_review,
                "review_status": chunk.review_status.value,
                "company_id": chunk.company_id,
                "signal_id": chunk.signal_id,
            },
        )

    def _apply_flag_rules(self, chunk: ReasoningChunk):
        """Apply flagging rules to determine if chunk needs human review"""
        reasons = []

        # Low confidence
        if chunk.decision_confidence < FLAG_CONDITIONS["low_confidence"]["threshold"]:
            reasons.append(FLAG_CONDITIONS["low_confidence"]["description"])

        # Complex reasoning
        if len(chunk.reasoning_chain) > FLAG_CONDITIONS["complex_reasoning"]["threshold_steps"]:
            reasons.append(FLAG_CONDITIONS["complex_reasoning"]["description"])

        # Novel situation (check if retrieved knowledge is empty)
        if not chunk.retrieved_knowledge:
            chunk.is_novel_situation = True
            reasons.append(FLAG_CONDITIONS["novel_situation"]["description"])

        if reasons:
            chunk.flagged_for_review = True
            chunk.flag_reason = "; ".join(reasons)

    def get_chunk(self, chunk_id: str) -> ReasoningChunk | None:
        """Get a reasoning chunk by ID"""
        return self._chunks.get(chunk_id)

    def get_chunks(
        self,
        agent: str | None = None,
        chunk_type: ReasoningChunkType | None = None,
        review_status: ReviewStatus | None = None,
        flagged_only: bool = False,
        company_id: str | None = None,
        signal_id: str | None = None,
        deal_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ReasoningChunk]:
        """Get reasoning chunks with optional filters"""
        chunks = list(self._chunks.values())

        # Apply filters
        if agent:
            chunks = [c for c in chunks if c.agent == agent]
        if chunk_type:
            chunks = [c for c in chunks if c.type == chunk_type]
        if review_status:
            chunks = [c for c in chunks if c.review_status == review_status]
        if flagged_only:
            chunks = [c for c in chunks if c.flagged_for_review]
        if company_id:
            chunks = [c for c in chunks if c.company_id == company_id]
        if signal_id:
            chunks = [c for c in chunks if c.signal_id == signal_id]
        if deal_id:
            chunks = [c for c in chunks if c.deal_id == deal_id]

        # Sort by created_at descending
        chunks.sort(key=lambda c: c.created_at, reverse=True)

        # Apply pagination
        return chunks[offset:offset + limit]

    def get_flagged_for_review(self, limit: int = 20) -> list[ReasoningChunk]:
        """Get chunks flagged for human review"""
        return self.get_chunks(
            review_status=ReviewStatus.PENDING,
            flagged_only=True,
            limit=limit,
        )

    def review_chunk(
        self,
        chunk_id: str,
        status: ReviewStatus,
        reviewed_by: str,
        notes: str = "",
        correction: dict | None = None,
    ) -> ReasoningChunk | None:
        """Record human review of a reasoning chunk"""
        chunk = self._chunks.get(chunk_id)
        if not chunk:
            return None

        chunk.review_status = status
        chunk.reviewed_by = reviewed_by
        chunk.reviewed_at = datetime.now()
        chunk.review_notes = notes
        if correction:
            chunk.correction = correction

        return chunk

    def close_outcome(
        self,
        chunk_id: str,
        status: OutcomeStatus,
        value: float | None = None,
        notes: str = "",
    ) -> ReasoningChunk | None:
        """Close the outcome for a reasoning chunk"""
        chunk = self._chunks.get(chunk_id)
        if not chunk:
            return None

        chunk.outcome_status = status
        chunk.outcome_value = value
        chunk.outcome_notes = notes
        chunk.outcome_closed_at = datetime.now()

        return chunk

    def get_pending_outcomes(self, limit: int = 20) -> list[ReasoningChunk]:
        """Get chunks with pending outcomes"""
        chunks = [
            c for c in self._chunks.values()
            if c.outcome_status == OutcomeStatus.PENDING
            and c.review_status in [ReviewStatus.VALIDATED, ReviewStatus.CORRECTED]
        ]
        chunks.sort(key=lambda c: c.created_at)
        return chunks[:limit]

    def get_stats(self, days: int = 7) -> dict:
        """Get statistics for reasoning chunks"""
        cutoff = datetime.now() - timedelta(days=days)
        recent = [c for c in self._chunks.values() if c.created_at >= cutoff]

        total = len(recent)
        flagged = len([c for c in recent if c.flagged_for_review])
        validated = len([c for c in recent if c.review_status == ReviewStatus.VALIDATED])
        corrected = len([c for c in recent if c.review_status == ReviewStatus.CORRECTED])
        rejected = len([c for c in recent if c.review_status == ReviewStatus.REJECTED])
        pending_review = len([c for c in recent if c.review_status == ReviewStatus.PENDING and c.flagged_for_review])

        # By type
        by_type = {}
        for chunk in recent:
            type_key = chunk.type.value
            by_type[type_key] = by_type.get(type_key, 0) + 1

        # By agent
        by_agent = {}
        for chunk in recent:
            by_agent[chunk.agent] = by_agent.get(chunk.agent, 0) + 1

        return {
            "period_days": days,
            "total": total,
            "flagged": flagged,
            "validated": validated,
            "corrected": corrected,
            "rejected": rejected,
            "pending_review": pending_review,
            "by_type": by_type,
            "by_agent": by_agent,
            "correction_rate": corrected / (validated + corrected) if (validated + corrected) > 0 else 0,
        }

    def search_similar(
        self,
        query: str,
        limit: int = 5,
        chunk_type: ReasoningChunkType | None = None,
    ) -> list[ReasoningChunk]:
        """
        Search for similar reasoning chunks using vector similarity.
        Falls back to keyword search if vector service is unavailable.
        """
        # Try vector search first
        if self._vector_service.is_available():
            results = self._vector_service.find_similar_reasoning(
                query=query,
                limit=limit,
                filter_type=chunk_type.value if chunk_type else None,
            )

            # Map results back to full chunks
            chunks = []
            for result in results:
                chunk = self._chunks.get(result.id)
                if chunk:
                    chunks.append(chunk)
            return chunks

        # Fallback: keyword search
        return self._keyword_search_chunks(query, limit, chunk_type)

    def _keyword_search_chunks(
        self,
        query: str,
        limit: int = 5,
        chunk_type: ReasoningChunkType | None = None,
    ) -> list[ReasoningChunk]:
        """Fallback keyword-based search for reasoning chunks"""
        query_lower = query.lower()
        scored = []

        for chunk in self._chunks.values():
            if chunk_type and chunk.type != chunk_type:
                continue

            score = 0
            # Check in decision result
            if query_lower in chunk.decision_result.lower():
                score += 2
            # Check in reasoning chain
            for step in chunk.reasoning_chain:
                if query_lower in step.thought.lower():
                    score += 1
            # Check in context
            context_str = str(chunk.input_context).lower()
            if query_lower in context_str:
                score += 1

            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:limit]]
