"""
iBood Signals Intelligence - Vector RAG System

The Learning Loop: Vector database retrieval + LLM reasoning
Automatically retrieves top 8 most relevant signals for context
"""

from __future__ import annotations

import os
import json
import uuid
from typing import Any
from dataclasses import dataclass, field
from datetime import datetime

from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue, MatchAny,
    SearchParams, ScoredPoint
)

from .signal_types import SignalType, SignalPriority, ProductCategory, SIGNAL_DEFINITIONS


SIGNALS_COLLECTION = "ibood_signals"
COMPANIES_COLLECTION = "ibood_companies"
SIGNAL_OUTCOMES_COLLECTION = "ibood_signal_outcomes"  # For learning loop

VECTOR_DIM = 384  # BGE-small-en-v1.5 dimension


@dataclass
class SignalContext:
    """Context retrieved from vector search for LLM reasoning"""
    signal_id: str
    company_name: str
    signal_type: str
    title: str
    summary: str
    confidence_score: float
    deal_potential_score: float
    similarity_score: float  # From vector search
    outcome: str | None = None  # deal_won, deal_lost, expired, etc.
    actual_discount: float | None = None
    notes: str | None = None


@dataclass
class RAGResponse:
    """Response from RAG system"""
    query: str
    similar_signals: list[SignalContext]
    llm_analysis: str | None = None
    recommended_action: str | None = None
    confidence_boost: float = 0.0  # Adjustment based on similar outcomes
    deal_potential_boost: float = 0.0


class SignalVectorRAG:
    """
    Vector RAG system for signal intelligence.

    The Learning Loop:
    1. New signal detected → embed signal text
    2. Search for top 8 similar historical signals
    3. Analyze outcomes of similar signals
    4. Adjust confidence/deal potential based on historical success
    5. Generate LLM analysis with context
    6. Record outcome when deal closes → improves future predictions
    """

    def __init__(
        self,
        qdrant_url: str | None = None,
        embed_fn: callable | None = None,
        llm_fn: callable | None = None,
    ):
        self.qdrant_url = qdrant_url or os.getenv("QDRANT_URL", "http://localhost:6333")
        self.client = QdrantClient(url=self.qdrant_url)
        self._embed_fn = embed_fn
        self._llm_fn = llm_fn
        self._ensure_collections()

    def _ensure_collections(self):
        """Ensure required collections exist"""
        collections = [name.name for name in self.client.get_collections().collections]

        if SIGNALS_COLLECTION not in collections:
            self.client.create_collection(
                collection_name=SIGNALS_COLLECTION,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
            )

        if COMPANIES_COLLECTION not in collections:
            self.client.create_collection(
                collection_name=COMPANIES_COLLECTION,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
            )

        if SIGNAL_OUTCOMES_COLLECTION not in collections:
            self.client.create_collection(
                collection_name=SIGNAL_OUTCOMES_COLLECTION,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
            )

    def _get_embedder(self):
        """Get or initialize embedding function"""
        if self._embed_fn is None:
            try:
                from fastembed import TextEmbedding
                model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
                self._embed_fn = lambda texts: list(model.embed(texts))
            except ImportError:
                # Fallback to simple hash-based pseudo-embeddings for demo
                import hashlib
                import numpy as np

                def simple_embed(texts):
                    embeddings = []
                    for text in texts:
                        # Create deterministic pseudo-embedding from text hash
                        h = hashlib.sha256(text.encode()).digest()
                        # Expand hash to vector dimension
                        np.random.seed(int.from_bytes(h[:4], 'big'))
                        vec = np.random.randn(VECTOR_DIM).astype(np.float32)
                        vec = vec / np.linalg.norm(vec)  # Normalize
                        embeddings.append(vec.tolist())
                    return embeddings

                self._embed_fn = simple_embed
        return self._embed_fn

    def _embed(self, texts: list[str]) -> list[list[float]]:
        """Embed texts using the embedding function"""
        embedder = self._get_embedder()
        return embedder(texts)

    def _create_signal_text(self, signal_data: dict) -> str:
        """Create searchable text from signal data"""
        parts = [
            signal_data.get("company_name", ""),
            signal_data.get("title", ""),
            signal_data.get("summary", ""),
            signal_data.get("signal_type", ""),
            " ".join(signal_data.get("categories", [])),
            signal_data.get("source_type", ""),
        ]
        # Add evidence quotes if available
        evidence = signal_data.get("evidence", {})
        if evidence and evidence.get("quotes"):
            parts.extend(evidence["quotes"][:3])  # Top 3 quotes

        return " ".join(filter(None, parts))

    def index_signal(self, signal_id: str, signal_data: dict) -> bool:
        """
        Index a signal in the vector database.

        Args:
            signal_id: Unique signal identifier
            signal_data: Signal data dict with company_name, title, summary, etc.

        Returns:
            True if indexed successfully
        """
        text = self._create_signal_text(signal_data)
        vector = self._embed([text])[0]

        payload = {
            "signal_id": signal_id,
            "company_id": signal_data.get("company_id"),
            "company_name": signal_data.get("company_name"),
            "company_country": signal_data.get("company_country"),
            "signal_type": signal_data.get("signal_type"),
            "signal_priority": signal_data.get("signal_priority"),
            "title": signal_data.get("title"),
            "summary": signal_data.get("summary"),
            "confidence_score": signal_data.get("confidence_score", 0),
            "deal_potential_score": signal_data.get("deal_potential_score", 0),
            "categories": signal_data.get("categories", []),
            "source_type": signal_data.get("source_type"),
            "detected_at": signal_data.get("detected_at", datetime.now().isoformat()),
            "status": signal_data.get("status", "new"),
            "indexed_at": datetime.now().isoformat(),
        }

        self.client.upsert(
            collection_name=SIGNALS_COLLECTION,
            points=[PointStruct(id=signal_id, vector=vector, payload=payload)],
        )
        return True

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

        This is the feedback that improves future predictions.

        Args:
            signal_id: The signal that led to this outcome
            outcome: deal_won, deal_lost, expired, dismissed, etc.
            actual_discount: Actual discount achieved (if deal won)
            deal_value: Final deal value
            notes: Any notes about the outcome
        """
        # Get the original signal
        try:
            results = self.client.retrieve(
                collection_name=SIGNALS_COLLECTION,
                ids=[signal_id],
                with_payload=True,
                with_vectors=True,
            )
            if not results:
                return False

            original = results[0]
            vector = original.vector
            payload = original.payload.copy()

            # Add outcome data
            payload.update({
                "outcome": outcome,
                "actual_discount": actual_discount,
                "deal_value": deal_value,
                "outcome_notes": notes,
                "outcome_recorded_at": datetime.now().isoformat(),
            })

            # Store in outcomes collection (preserves history)
            # Use proper UUID for Qdrant point ID
            outcome_id = str(uuid.uuid4())
            payload["original_signal_id"] = signal_id  # Track which signal this outcome belongs to
            self.client.upsert(
                collection_name=SIGNAL_OUTCOMES_COLLECTION,
                points=[PointStruct(id=outcome_id, vector=vector, payload=payload)],
            )

            # Update original signal status
            self.client.set_payload(
                collection_name=SIGNALS_COLLECTION,
                payload={"status": "actioned", "outcome": outcome},
                points=[signal_id],
            )

            return True
        except Exception as e:
            print(f"Error recording outcome: {e}")
            return False

    def search_similar_signals(
        self,
        query_text: str | None = None,
        signal_data: dict | None = None,
        k: int = 8,
        signal_types: list[str] | None = None,
        categories: list[str] | None = None,
        include_outcomes: bool = True,
    ) -> list[SignalContext]:
        """
        Search for top K similar signals (default 8 for LLM context).

        The core of the learning loop - finds historical signals
        similar to the current one to inform analysis.

        Args:
            query_text: Free-text query
            signal_data: Signal data dict to find similar signals
            k: Number of results (default 8 for optimal LLM context)
            signal_types: Filter by signal types
            categories: Filter by product categories
            include_outcomes: Include signals with recorded outcomes

        Returns:
            List of SignalContext with similarity scores
        """
        # Create embedding from query or signal data
        if signal_data:
            text = self._create_signal_text(signal_data)
        elif query_text:
            text = query_text
        else:
            raise ValueError("Must provide query_text or signal_data")

        vector = self._embed([text])[0]

        # Build filter conditions
        must_conditions = []
        if signal_types:
            must_conditions.append(
                FieldCondition(key="signal_type", match=MatchAny(any=signal_types))
            )
        if categories:
            must_conditions.append(
                FieldCondition(key="categories", match=MatchAny(any=categories))
            )

        query_filter = Filter(must=must_conditions) if must_conditions else None

        # Search signals collection
        signal_results = self.client.search(
            collection_name=SIGNALS_COLLECTION,
            query_vector=vector,
            limit=k,
            query_filter=query_filter,
            with_payload=True,
        )

        # Also search outcomes collection for learning context
        outcome_results = []
        if include_outcomes:
            try:
                outcome_results = self.client.search(
                    collection_name=SIGNAL_OUTCOMES_COLLECTION,
                    query_vector=vector,
                    limit=k,
                    query_filter=query_filter,
                    with_payload=True,
                )
            except Exception:
                pass  # Outcomes collection might be empty

        # Merge and deduplicate results
        seen_signals = set()
        contexts = []

        for hit in signal_results + outcome_results:
            signal_id = hit.payload.get("signal_id")
            if signal_id in seen_signals:
                continue
            seen_signals.add(signal_id)

            contexts.append(SignalContext(
                signal_id=signal_id,
                company_name=hit.payload.get("company_name", ""),
                signal_type=hit.payload.get("signal_type", ""),
                title=hit.payload.get("title", ""),
                summary=hit.payload.get("summary", ""),
                confidence_score=hit.payload.get("confidence_score", 0),
                deal_potential_score=hit.payload.get("deal_potential_score", 0),
                similarity_score=hit.score,
                outcome=hit.payload.get("outcome"),
                actual_discount=hit.payload.get("actual_discount"),
                notes=hit.payload.get("outcome_notes"),
            ))

        # Sort by similarity and return top K
        contexts.sort(key=lambda x: x.similarity_score, reverse=True)
        return contexts[:k]

    def analyze_with_context(
        self,
        signal_data: dict,
        k: int = 8,
    ) -> RAGResponse:
        """
        Analyze a signal with RAG context from similar historical signals.

        The Learning Loop in action:
        1. Find top K similar historical signals
        2. Analyze their outcomes
        3. Adjust confidence based on historical success rates
        4. Generate recommended action

        Args:
            signal_data: The signal to analyze
            k: Number of context signals to retrieve (default 8)

        Returns:
            RAGResponse with analysis and recommendations
        """
        # Find similar signals
        similar = self.search_similar_signals(
            signal_data=signal_data,
            k=k,
            include_outcomes=True,
        )

        # Calculate learning-based adjustments
        confidence_boost = 0.0
        deal_potential_boost = 0.0
        successful_outcomes = 0
        total_outcomes = 0

        for ctx in similar:
            if ctx.outcome:
                total_outcomes += 1
                if ctx.outcome == "deal_won":
                    successful_outcomes += 1
                    # Boost confidence based on similarity
                    confidence_boost += ctx.similarity_score * 5
                    deal_potential_boost += ctx.similarity_score * 5
                elif ctx.outcome == "deal_lost":
                    confidence_boost -= ctx.similarity_score * 2
                    deal_potential_boost -= ctx.similarity_score * 3

        # Normalize boosts
        if total_outcomes > 0:
            success_rate = successful_outcomes / total_outcomes
            confidence_boost = min(max(confidence_boost, -15), 15)
            deal_potential_boost = min(max(deal_potential_boost, -15), 15)
        else:
            confidence_boost = 0
            deal_potential_boost = 0

        # Generate analysis text
        analysis = self._generate_analysis(signal_data, similar, success_rate if total_outcomes > 0 else None)
        action = self._generate_action_recommendation(signal_data, similar)

        return RAGResponse(
            query=self._create_signal_text(signal_data),
            similar_signals=similar,
            llm_analysis=analysis,
            recommended_action=action,
            confidence_boost=confidence_boost,
            deal_potential_boost=deal_potential_boost,
        )

    def _generate_analysis(
        self,
        signal_data: dict,
        similar_signals: list[SignalContext],
        success_rate: float | None,
    ) -> str:
        """Generate analysis text (placeholder for LLM integration)"""
        signal_type = signal_data.get("signal_type", "")
        company = signal_data.get("company_name", "Unknown")
        signal_def = SIGNAL_DEFINITIONS.get(SignalType(signal_type) if signal_type else None, {})

        analysis_parts = [
            f"**Signal Analysis: {signal_def.get('label', signal_type)}**",
            f"Company: {company}",
            "",
            f"**Why This Matters:** {signal_def.get('why_matters', 'N/A')}",
            "",
        ]

        # Add historical context
        if similar_signals:
            analysis_parts.append(f"**Historical Context:** Found {len(similar_signals)} similar signals")
            if success_rate is not None:
                analysis_parts.append(f"Historical success rate: {success_rate:.0%}")

            # Highlight most relevant similar cases
            top_similar = [s for s in similar_signals if s.outcome][:3]
            if top_similar:
                analysis_parts.append("\n**Similar Past Signals:**")
                for s in top_similar:
                    analysis_parts.append(
                        f"- {s.company_name}: {s.title} → {s.outcome}"
                        + (f" ({s.actual_discount:.0%} discount)" if s.actual_discount else "")
                    )

        return "\n".join(analysis_parts)

    def _generate_action_recommendation(
        self,
        signal_data: dict,
        similar_signals: list[SignalContext],
    ) -> str:
        """Generate action recommendation"""
        signal_type = signal_data.get("signal_type", "")
        priority = signal_data.get("signal_priority", "")
        signal_def = SIGNAL_DEFINITIONS.get(SignalType(signal_type) if signal_type else None, {})

        urgency = signal_def.get("urgency_days", 30)

        if priority == "hot":
            return f"🔥 HIGH PRIORITY: Contact within {min(urgency, 14)} days. This is a motivated seller opportunity."
        elif priority == "strategic":
            return f"⭐ MONITOR: Set reminder for {urgency} days. Potential deal opportunity developing."
        elif priority == "market":
            return f"📊 INTELLIGENCE: Track market conditions. Multiple suppliers may be affected."
        else:
            return f"🤝 NURTURE: Build relationship over next {urgency} days."

    def get_collection_stats(self) -> dict:
        """Get statistics about indexed signals"""
        try:
            signals_info = self.client.get_collection(SIGNALS_COLLECTION)
            outcomes_info = self.client.get_collection(SIGNAL_OUTCOMES_COLLECTION)

            return {
                "signals_indexed": signals_info.points_count,
                "outcomes_recorded": outcomes_info.points_count,
                "vector_dimension": VECTOR_DIM,
                "collections": [SIGNALS_COLLECTION, SIGNAL_OUTCOMES_COLLECTION],
            }
        except Exception as e:
            return {"error": str(e)}

    def clear_all(self):
        """Clear all indexed signals (use with caution!)"""
        for collection in [SIGNALS_COLLECTION, COMPANIES_COLLECTION, SIGNAL_OUTCOMES_COLLECTION]:
            try:
                self.client.delete_collection(collection)
            except Exception:
                pass
        self._ensure_collections()
