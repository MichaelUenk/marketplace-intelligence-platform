"""
iBood Signals Intelligence - Signal Detection Engine

NLP-powered signal detection and classification.
Integrates with Neo4j for storage and Qdrant for vector search.
"""

from __future__ import annotations

import re
import os
import uuid
from datetime import datetime, timedelta
from typing import Any
from dataclasses import dataclass, field

from neo4j import Session

from .signal_types import (
    SignalType, SignalPriority, SignalStatus, ProductCategory,
    SIGNAL_DEFINITIONS, CATEGORY_TAXONOMY
)
from .confidence_scorer import ConfidenceScorer
from .vector_rag import SignalVectorRAG


@dataclass
class DetectedSignal:
    """A detected signal from text analysis"""
    id: str
    company_id: str
    company_name: str
    company_country: str
    signal_type: SignalType
    signal_priority: SignalPriority
    title: str
    summary: str
    confidence_score: float
    deal_potential_score: float
    source_url: str | None = None
    source_type: str = "unknown"
    source_date: datetime | None = None
    detected_at: datetime = field(default_factory=datetime.now)
    expires_at: datetime | None = None
    status: SignalStatus = SignalStatus.NEW
    categories: list[ProductCategory] = field(default_factory=list)
    evidence: dict = field(default_factory=dict)
    ai_analysis: dict = field(default_factory=dict)
    estimated_value: float | None = None
    likely_discount_range: str | None = None
    competition_level: str | None = None
    timing_recommendation: str | None = None

    def to_dict(self) -> dict:
        """Convert to dictionary for storage"""
        return {
            "id": self.id,
            "company_id": self.company_id,
            "company_name": self.company_name,
            "company_country": self.company_country,
            "signal_type": self.signal_type.value,
            "signal_priority": self.signal_priority.value,
            "title": self.title,
            "summary": self.summary,
            "confidence_score": self.confidence_score,
            "deal_potential_score": self.deal_potential_score,
            "source_url": self.source_url,
            "source_type": self.source_type,
            "source_date": self.source_date.isoformat() if self.source_date else None,
            "detected_at": self.detected_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "status": self.status.value,
            "categories": [c.value for c in self.categories],
            "evidence": self.evidence,
            "ai_analysis": self.ai_analysis,
            "estimated_value": self.estimated_value,
            "likely_discount_range": self.likely_discount_range,
            "competition_level": self.competition_level,
            "timing_recommendation": self.timing_recommendation,
        }


class SignalDetectionEngine:
    """
    NLP-powered signal detection engine.

    Processing Pipeline:
    Data Sources → Ingestion → NLP Processing → Signal Classification →
    Confidence Scoring → Deduplication → Alert Generation → User Delivery
    """

    def __init__(
        self,
        neo4j_session: Session | None = None,
        qdrant_url: str | None = None,
    ):
        self.neo4j = neo4j_session
        self.scorer = ConfidenceScorer()
        self.rag = SignalVectorRAG(qdrant_url=qdrant_url)

    def detect_signals(
        self,
        text: str,
        company_id: str,
        company_name: str,
        company_country: str = "",
        source_type: str = "unknown",
        source_url: str | None = None,
        source_date: datetime | None = None,
        categories: list[ProductCategory] | None = None,
    ) -> list[DetectedSignal]:
        """
        Detect signals from text using NLP.

        Args:
            text: Source text to analyze
            company_id: Company identifier
            company_name: Company name
            company_country: Company country
            source_type: Type of source (e.g., 'earnings_call', 'news')
            source_url: URL of the source
            source_date: Publication date
            categories: Product categories to filter

        Returns:
            List of detected signals
        """
        detected = []
        text_lower = text.lower()

        # Check each signal type
        for signal_type, definition in SIGNAL_DEFINITIONS.items():
            keywords = definition.get("keywords", [])

            # Count keyword matches
            matches = sum(1 for kw in keywords if kw.lower() in text_lower)

            if matches >= 2:  # At least 2 keyword matches
                # Extract relevant quote
                quote = self._extract_quote(text, keywords)

                # Calculate confidence
                confidence, factors = self.scorer.score(
                    signal_type=signal_type,
                    source_type=source_type,
                    source_date=source_date,
                    evidence_strength=min(100, matches * 20),  # More matches = stronger
                )

                # Calculate deal potential
                deal_potential = self.scorer.score_deal_potential(signal_type)

                # Calculate expiry
                urgency_days = definition.get("urgency_days", 30)
                expires_at = datetime.now() + timedelta(days=urgency_days)

                signal = DetectedSignal(
                    id=str(uuid.uuid4()),
                    company_id=company_id,
                    company_name=company_name,
                    company_country=company_country,
                    signal_type=signal_type,
                    signal_priority=definition["priority"],
                    title=f"{company_name}: {definition['label']}",
                    summary=self._generate_summary(text, definition, matches),
                    confidence_score=confidence,
                    deal_potential_score=deal_potential,
                    source_url=source_url,
                    source_type=source_type,
                    source_date=source_date or datetime.now(),
                    expires_at=expires_at,
                    categories=categories or self._detect_categories(text),
                    evidence={"quotes": [quote] if quote else [], "keyword_matches": matches},
                    timing_recommendation=self._generate_timing(definition["priority"], urgency_days),
                )

                detected.append(signal)

        return detected

    def _extract_quote(self, text: str, keywords: list[str]) -> str | None:
        """Extract the most relevant quote containing keywords"""
        sentences = re.split(r'[.!?]', text)

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:
                continue

            matches = sum(1 for kw in keywords if kw.lower() in sentence.lower())
            if matches >= 1:
                # Truncate if too long
                if len(sentence) > 200:
                    sentence = sentence[:200] + "..."
                return f'"{sentence}"'

        return None

    def _generate_summary(self, text: str, definition: dict, matches: int) -> str:
        """Generate a summary of the detected signal"""
        label = definition.get("label", "Signal")
        why = definition.get("why_matters", "")

        # Take first few relevant sentences
        sentences = re.split(r'[.!?]', text)
        relevant = []
        for s in sentences:
            s = s.strip()
            if len(s) > 30:
                # Check if sentence contains any keywords
                keywords = definition.get("keywords", [])
                if any(kw.lower() in s.lower() for kw in keywords):
                    relevant.append(s)
                    if len(relevant) >= 2:
                        break

        if relevant:
            return ". ".join(relevant) + "."
        else:
            return f"{label} detected. {why}"

    def _generate_timing(self, priority: SignalPriority, urgency_days: int) -> str:
        """Generate timing recommendation"""
        if priority == SignalPriority.HOT:
            if urgency_days <= 14:
                return f"Urgent: Act within {urgency_days} days"
            else:
                return f"Priority: Contact within {urgency_days} days"
        elif priority == SignalPriority.STRATEGIC:
            return f"Monitor: Set reminder for {urgency_days} days"
        elif priority == SignalPriority.MARKET:
            return f"Intelligence: Track over next {urgency_days} days"
        else:
            return f"Nurture: Build relationship over {urgency_days} days"

    def _detect_categories(self, text: str) -> list[ProductCategory]:
        """Detect product categories from text"""
        detected = []
        text_lower = text.lower()

        for category, info in CATEGORY_TAXONOMY.items():
            keywords = info.get("keywords", [])
            subcats = info.get("subcategories", [])

            # Check category keywords
            matches = sum(1 for kw in keywords if kw.lower() in text_lower)

            # Check subcategory mentions
            for subcat in subcats:
                if subcat.lower() in text_lower:
                    matches += 1

            if matches >= 2:
                detected.append(category)

        return detected

    def enrich_with_rag(self, signal: DetectedSignal) -> DetectedSignal:
        """
        Enrich signal with RAG context from similar historical signals.

        This is the learning loop - uses past signals to improve predictions.
        """
        signal_data = signal.to_dict()

        # Get RAG analysis
        rag_response = self.rag.analyze_with_context(signal_data, k=8)

        # Apply confidence adjustments from learning loop
        signal.confidence_score = min(100, max(0,
            signal.confidence_score + rag_response.confidence_boost
        ))
        signal.deal_potential_score = min(100, max(0,
            signal.deal_potential_score + rag_response.deal_potential_boost
        ))

        # Add AI analysis
        signal.ai_analysis = {
            "rag_analysis": rag_response.llm_analysis,
            "recommended_action": rag_response.recommended_action,
            "similar_signals_count": len(rag_response.similar_signals),
            "confidence_adjustment": rag_response.confidence_boost,
            "deal_potential_adjustment": rag_response.deal_potential_boost,
        }

        # Store in vector database for future learning
        self.rag.index_signal(signal.id, signal_data)

        return signal

    def save_to_neo4j(self, signal: DetectedSignal) -> bool:
        """Save signal to Neo4j database"""
        if not self.neo4j:
            return False

        query = """
        MERGE (c:Company {id: $company_id})
        SET c.name = $company_name

        CREATE (s:Signal {
            id: $signal_id,
            signal_type: $signal_type,
            signal_priority: $signal_priority,
            title: $title,
            summary: $summary,
            confidence_score: $confidence_score,
            deal_potential_score: $deal_potential_score,
            source_url: $source_url,
            source_type: $source_type,
            source_date: $source_date,
            detected_at: $detected_at,
            expires_at: $expires_at,
            status: $status,
            categories: $categories,
            estimated_value: $estimated_value,
            likely_discount_range: $likely_discount_range,
            competition_level: $competition_level,
            timing_recommendation: $timing_recommendation
        })

        MERGE (s)-[:DETECTED_FOR]->(c)

        RETURN s.id as signal_id
        """

        data = signal.to_dict()
        try:
            result = self.neo4j.run(query, {
                "company_id": data["company_id"],
                "company_name": data["company_name"],
                "signal_id": data["id"],
                "signal_type": data["signal_type"],
                "signal_priority": data["signal_priority"],
                "title": data["title"],
                "summary": data["summary"],
                "confidence_score": data["confidence_score"],
                "deal_potential_score": data["deal_potential_score"],
                "source_url": data["source_url"],
                "source_type": data["source_type"],
                "source_date": data["source_date"],
                "detected_at": data["detected_at"],
                "expires_at": data["expires_at"],
                "status": data["status"],
                "categories": data["categories"],
                "estimated_value": data["estimated_value"],
                "likely_discount_range": data["likely_discount_range"],
                "competition_level": data["competition_level"],
                "timing_recommendation": data["timing_recommendation"],
            })
            return result.single() is not None
        except Exception as e:
            print(f"Error saving signal to Neo4j: {e}")
            return False

    def record_outcome(
        self,
        signal_id: str,
        outcome: str,
        actual_discount: float | None = None,
        deal_value: float | None = None,
        notes: str | None = None,
    ) -> bool:
        """
        Record the outcome of a signal for the learning loop.

        This feedback improves future signal predictions.
        """
        # Update Neo4j
        if self.neo4j:
            query = """
            MATCH (s:Signal {id: $signal_id})
            SET s.status = 'actioned',
                s.outcome = $outcome,
                s.actual_discount = $actual_discount,
                s.deal_value = $deal_value,
                s.outcome_notes = $notes,
                s.outcome_recorded_at = datetime()
            RETURN s.id
            """
            try:
                self.neo4j.run(query, {
                    "signal_id": signal_id,
                    "outcome": outcome,
                    "actual_discount": actual_discount,
                    "deal_value": deal_value,
                    "notes": notes,
                })
            except Exception as e:
                print(f"Error updating Neo4j: {e}")

        # Record in vector database for learning
        return self.rag.record_outcome(
            signal_id=signal_id,
            outcome=outcome,
            actual_discount=actual_discount,
            deal_value=deal_value,
            notes=notes,
        )

    def get_similar_signals(
        self,
        signal: DetectedSignal,
        k: int = 8,
    ) -> list[dict]:
        """Get similar historical signals"""
        similar = self.rag.search_similar_signals(
            signal_data=signal.to_dict(),
            k=k,
        )
        return [
            {
                "signal_id": s.signal_id,
                "company_name": s.company_name,
                "signal_type": s.signal_type,
                "title": s.title,
                "summary": s.summary,
                "similarity_score": s.similarity_score,
                "outcome": s.outcome,
                "actual_discount": s.actual_discount,
            }
            for s in similar
        ]
