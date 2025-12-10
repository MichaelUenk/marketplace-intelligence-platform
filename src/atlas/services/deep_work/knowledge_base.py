"""
Knowledge Base Service

Manages validated learnings, pattern rules, and context retrieval.
Dual-layer storage: vector (semantic) + structured (relational).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any

from .deep_work_types import (
    KnowledgeEntry,
    KnowledgeType,
    KnowledgeStatus,
    PatternRule,
    PatternRuleStatus,
    KNOWLEDGE_TYPE_LABELS,
)
from .vector_service import get_vector_service, VectorService


class KnowledgeBaseService:
    """Service for managing the knowledge base"""

    def __init__(self):
        # In-memory storage for demo (would be PostgreSQL in production)
        self._entries: dict[str, KnowledgeEntry] = {}
        self._patterns: dict[str, PatternRule] = {}
        # Vector service for semantic search (uses Qdrant)
        self._vector_service: VectorService = get_vector_service()
        self._initialize_demo_data()

    def _initialize_demo_data(self):
        """Initialize with demo knowledge entries"""
        now = datetime.now()

        # Signal Rule 1
        entry1 = KnowledgeEntry(
            id="kb_001",
            created_at=now - timedelta(days=30),
            updated_at=now - timedelta(days=2),
            type=KnowledgeType.SIGNAL_RULE,
            title="Elevated Inventory Language Rule",
            content="When a company mentions 'elevated inventory' or 'excess stock' in an official earnings document, classify as INVENTORY_SURPLUS with minimum 80% confidence.",
            source_type="validated_reasoning",
            source_chunk_ids=["rc_historical_001", "rc_historical_002"],
            validated_by="user_hugo",
            applies_to_signal_types=["INVENTORY_SURPLUS"],
            times_retrieved=156,
            times_helpful=142,
            accuracy_rate=0.91,
            last_used_at=now - timedelta(hours=2),
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry1.id] = entry1

        # Company Intelligence
        entry2 = KnowledgeEntry(
            id="kb_002",
            created_at=now - timedelta(days=60),
            updated_at=now - timedelta(days=4),
            type=KnowledgeType.COMPANY_INTEL,
            title="Philips Consumer Lifestyle",
            content="""Key contact: Jan de Vries (Sales Director Benelux)
Decision process: 2-3 weeks typical
Communication preference: Email first, then call
Note: CFO involved when inventory > €50M
Previous deals: 5 successful, €1.2M total
Best timing: End of quarter, especially Q4
Avoid: Direct cold calls to C-suite""",
            source_type="human_input",
            validated_by="user_hugo",
            applies_to_companies=["company_philips"],
            times_retrieved=89,
            times_helpful=78,
            accuracy_rate=0.88,
            last_used_at=now - timedelta(hours=4),
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry2.id] = entry2

        # Pattern
        entry3 = KnowledgeEntry(
            id="kb_003",
            created_at=now - timedelta(days=20),
            updated_at=now - timedelta(days=1),
            type=KnowledgeType.PATTERN,
            title="Q4 Year-End Pressure Pattern",
            content="""Companies mentioning year-end inventory targets in Nov-Dec have 2.3x higher deal conversion rate.

Recommendation:
- Increase priority for INVENTORY_SURPLUS signals with year-end mentions
- Faster outreach (within 1 week vs. standard 2 weeks)
- More aggressive pricing can work due to urgency

Evidence: 34 signals analyzed, 87% confidence
Active period: November 1 - December 31""",
            source_type="pattern_detection",
            source_chunk_ids=["rc_pattern_001"],
            validated_by="user_hugo",
            applies_to_signal_types=["INVENTORY_SURPLUS", "WAREHOUSE_CLEARANCE"],
            times_retrieved=45,
            times_helpful=38,
            accuracy_rate=0.87,
            last_used_at=now - timedelta(hours=1),
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry3.id] = entry3

        # Timing Insight
        entry4 = KnowledgeEntry(
            id="kb_004",
            created_at=now - timedelta(days=45),
            updated_at=now - timedelta(days=10),
            type=KnowledgeType.TIMING_INSIGHT,
            title="Optimal Outreach Window for Earnings Signals",
            content="""Best outreach timing for signals from earnings calls:
- Within 2-3 days of earnings release for hot signals
- Before analyst reports digest the news
- Early morning (8-9 AM) or late afternoon (4-5 PM) for emails
- Avoid Mondays and Fridays

Worst timing: Week after earnings when company is handling investor queries""",
            source_type="validated_reasoning",
            validated_by="user_hugo",
            times_retrieved=67,
            times_helpful=58,
            accuracy_rate=0.87,
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry4.id] = entry4

        # Negative Learning
        entry5 = KnowledgeEntry(
            id="kb_005",
            created_at=now - timedelta(days=15),
            updated_at=now - timedelta(days=15),
            type=KnowledgeType.NEGATIVE_LEARNING,
            title="Restructuring Company Warning",
            content="""Companies actively in restructuring have 80% deal failure rate.

Signs to watch:
- CEO transition announced
- Major layoffs (>20% workforce)
- Bankruptcy proceedings mentioned
- Investment bank hired for 'strategic options'

Recommendation: Flag as low priority, monitor for 3-6 months before outreach.""",
            source_type="validated_reasoning",
            source_chunk_ids=["rc_failed_001", "rc_failed_002"],
            validated_by="user_hugo",
            times_retrieved=23,
            times_helpful=21,
            accuracy_rate=0.91,
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry5.id] = entry5

        # Sony-specific learning (from the spec example)
        entry6 = KnowledgeEntry(
            id="kb_006",
            created_at=now - timedelta(days=7),
            updated_at=now - timedelta(days=7),
            type=KnowledgeType.COMPANY_INTEL,
            title="Sony Warehouse Announcements",
            content="""Sony warehouse announcements = logistics change, not inventory pressure.

Context: Sony reducing EU warehouses is about logistics optimization (shifting to 3PL model), not inventory clearance. Different from consumer electronics peers.

Correct classification: DISTRIBUTION_CHANGE, not INVENTORY_SURPLUS
Accuracy since correction: 100% (2/2 signals)""",
            source_type="validated_reasoning",
            source_chunk_ids=["rc_sony_correction_001"],
            validated_by="user_hugo",
            applies_to_companies=["company_sony"],
            times_retrieved=3,
            times_helpful=3,
            accuracy_rate=1.0,
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry6.id] = entry6

        # Contact Preference
        entry7 = KnowledgeEntry(
            id="kb_007",
            created_at=now - timedelta(days=25),
            updated_at=now - timedelta(days=5),
            type=KnowledgeType.CONTACT_PREFERENCE,
            title="Premium Brand Outreach Strategy",
            content="""Premium brands (Dyson, Miele, Bang & Olufsen) need different approach:

- Never mention 'discount' or 'clearance' in first contact
- Frame as 'exclusive partnership' or 'channel expansion'
- Contact Marketing/Brand first, not Sales
- Emphasize customer demographics and brand alignment
- Longer sales cycle (6-8 weeks vs. 2-3 weeks)
- Higher margin expectations (they care less about volume)""",
            source_type="human_input",
            validated_by="user_hugo",
            applies_to_companies=["company_dyson", "company_miele"],
            times_retrieved=12,
            times_helpful=10,
            accuracy_rate=0.83,
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry7.id] = entry7

        # Competitive Intelligence
        entry8 = KnowledgeEntry(
            id="kb_008",
            created_at=now - timedelta(days=40),
            updated_at=now - timedelta(days=3),
            type=KnowledgeType.COMPETITIVE_INTEL,
            title="Veepee Response Patterns",
            content="""Veepee (competitor) response patterns:

- Typically responds to inventory signals within 48 hours
- Strong relationships with French brands
- Less active in Home Appliances category
- Aggressive on Consumer Electronics
- Usually offers 5-10% better margin than iBood initial offer

Counter-strategy: Move faster, emphasize Benelux market knowledge""",
            source_type="human_input",
            validated_by="user_hugo",
            times_retrieved=34,
            times_helpful=28,
            accuracy_rate=0.82,
            status=KnowledgeStatus.ACTIVE,
        )
        self._entries[entry8.id] = entry8

        # Pattern Rules
        pattern1 = PatternRule(
            id="pr_001",
            created_at=now - timedelta(days=20),
            name="Q4 Year-End Pressure",
            description="Increase priority for INVENTORY_SURPLUS signals in Nov-Dec that mention year-end deadlines",
            condition={
                "signal_type": "INVENTORY_SURPLUS",
                "date_range": {"month_start": 11, "month_end": 12},
                "keywords": ["year-end", "Q4", "fiscal year", "annual target"],
            },
            action={
                "priority_boost": 1.5,
                "confidence_boost": 0.05,
                "outreach_timing": "urgent",
            },
            supporting_signals=34,
            accuracy_rate=0.87,
            status=PatternRuleStatus.ACTIVE,
            activated_at=now - timedelta(days=18),
            validated_by="user_hugo",
        )
        self._patterns[pattern1.id] = pattern1

        # Proposed pattern (needs validation)
        pattern2 = PatternRule(
            id="pr_002",
            created_at=now - timedelta(days=2),
            name="CFO Involvement Threshold",
            description="When inventory signal value > €50M, CFO is typically involved in decision",
            condition={
                "signal_type": "INVENTORY_SURPLUS",
                "estimated_value_min": 50000000,
            },
            action={
                "contact_recommendation": "include_cfo",
                "decision_timeline": "extended",
            },
            supporting_signals=8,
            accuracy_rate=None,
            status=PatternRuleStatus.PROPOSED,
        )
        self._patterns[pattern2.id] = pattern2

    def create_entry(
        self,
        entry_type: KnowledgeType,
        title: str,
        content: str,
        source_type: str,
        validated_by: str | None = None,
        source_chunk_ids: list[str] | None = None,
        applies_to_companies: list[str] | None = None,
        applies_to_signal_types: list[str] | None = None,
        applies_to_categories: list[str] | None = None,
    ) -> KnowledgeEntry:
        """Create a new knowledge entry"""
        entry_id = f"kb_{str(uuid.uuid4())[:8]}"
        now = datetime.now()

        entry = KnowledgeEntry(
            id=entry_id,
            created_at=now,
            updated_at=now,
            type=entry_type,
            title=title,
            content=content,
            source_type=source_type,
            source_chunk_ids=source_chunk_ids or [],
            validated_by=validated_by,
            applies_to_companies=applies_to_companies or [],
            applies_to_signal_types=applies_to_signal_types or [],
            applies_to_categories=applies_to_categories or [],
            status=KnowledgeStatus.ACTIVE,
        )

        self._entries[entry.id] = entry

        # Index in vector store for semantic search
        self._index_entry(entry)

        return entry

    def _index_entry(self, entry: KnowledgeEntry) -> bool:
        """Index an entry in the vector store"""
        return self._vector_service.index_knowledge_entry(
            entry_id=entry.id,
            title=entry.title,
            content=entry.content,
            metadata={
                "type": entry.type.value,
                "source_type": entry.source_type,
                "applies_to_companies": entry.applies_to_companies,
                "applies_to_signal_types": entry.applies_to_signal_types,
                "status": entry.status.value,
            },
        )

    def get_entry(self, entry_id: str) -> KnowledgeEntry | None:
        """Get a knowledge entry by ID"""
        return self._entries.get(entry_id)

    def get_entries(
        self,
        entry_type: KnowledgeType | None = None,
        status: KnowledgeStatus | None = None,
        company_id: str | None = None,
        signal_type: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[KnowledgeEntry]:
        """Get knowledge entries with optional filters"""
        entries = list(self._entries.values())

        # Apply filters
        if entry_type:
            entries = [e for e in entries if e.type == entry_type]
        if status:
            entries = [e for e in entries if e.status == status]
        if company_id:
            entries = [e for e in entries if company_id in e.applies_to_companies or not e.applies_to_companies]
        if signal_type:
            entries = [e for e in entries if signal_type in e.applies_to_signal_types or not e.applies_to_signal_types]

        # Sort by times_retrieved descending (most used first)
        entries.sort(key=lambda e: e.times_retrieved, reverse=True)

        # Apply pagination
        return entries[offset:offset + limit]

    def update_entry(
        self,
        entry_id: str,
        title: str | None = None,
        content: str | None = None,
        status: KnowledgeStatus | None = None,
    ) -> KnowledgeEntry | None:
        """Update a knowledge entry"""
        entry = self._entries.get(entry_id)
        if not entry:
            return None

        if title:
            entry.title = title
        if content:
            entry.content = content
        if status:
            entry.status = status

        entry.updated_at = datetime.now()
        return entry

    def record_retrieval(self, entry_id: str, was_helpful: bool = False):
        """Record that an entry was retrieved during a decision"""
        entry = self._entries.get(entry_id)
        if entry:
            entry.times_retrieved += 1
            if was_helpful:
                entry.times_helpful += 1
            entry.last_used_at = datetime.now()
            # Recalculate accuracy
            if entry.times_retrieved > 0:
                entry.accuracy_rate = entry.times_helpful / entry.times_retrieved

    def search(
        self,
        query: str,
        limit: int = 5,
        entry_type: KnowledgeType | None = None,
        company_id: str | None = None,
    ) -> list[KnowledgeEntry]:
        """
        Search knowledge entries using vector similarity.
        Falls back to keyword search if vector service is unavailable.
        """
        # Try vector search first
        if self._vector_service.is_available():
            results = self._vector_service.search_knowledge(
                query=query,
                limit=limit,
                filter_type=entry_type.value if entry_type else None,
                filter_company=company_id,
            )

            # Map results back to full entries
            entries = []
            for result in results:
                entry = self._entries.get(result.id)
                if entry and entry.status == KnowledgeStatus.ACTIVE:
                    entries.append(entry)
            return entries

        # Fallback: keyword search
        return self._keyword_search(query, limit, entry_type, company_id)

    def _keyword_search(
        self,
        query: str,
        limit: int = 5,
        entry_type: KnowledgeType | None = None,
        company_id: str | None = None,
    ) -> list[KnowledgeEntry]:
        """Fallback keyword-based search"""
        query_lower = query.lower()
        scored = []

        for entry in self._entries.values():
            if entry.status != KnowledgeStatus.ACTIVE:
                continue
            if entry_type and entry.type != entry_type:
                continue
            if company_id and company_id not in entry.applies_to_companies:
                continue

            score = 0
            # Check in title
            if query_lower in entry.title.lower():
                score += 3
            # Check in content
            if query_lower in entry.content.lower():
                score += 2
            # Boost by usage
            score += min(entry.times_retrieved / 100, 1)

            if score > 0:
                scored.append((score, entry))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [e for _, e in scored[:limit]]

    def get_context_for_decision(
        self,
        company_id: str | None = None,
        signal_type: str | None = None,
        query_text: str | None = None,
    ) -> dict:
        """
        Get relevant context for an AI decision.
        Uses vector similarity search when available for semantic matching.
        """
        context = {
            "company_intel": [],
            "signal_rules": [],
            "patterns": [],
            "timing_insights": [],
            "negative_learnings": [],
            "vector_matches": [],  # Additional semantically similar entries
        }

        # Get company-specific intelligence
        if company_id:
            for entry in self._entries.values():
                if entry.status != KnowledgeStatus.ACTIVE:
                    continue
                if company_id in entry.applies_to_companies:
                    if entry.type == KnowledgeType.COMPANY_INTEL:
                        context["company_intel"].append(entry.content)
                        self.record_retrieval(entry.id)

        # Get signal-type rules
        if signal_type:
            for entry in self._entries.values():
                if entry.status != KnowledgeStatus.ACTIVE:
                    continue
                if signal_type in entry.applies_to_signal_types or not entry.applies_to_signal_types:
                    if entry.type == KnowledgeType.SIGNAL_RULE:
                        context["signal_rules"].append(entry.content)
                        self.record_retrieval(entry.id)
                    elif entry.type == KnowledgeType.PATTERN:
                        context["patterns"].append(entry.content)
                        self.record_retrieval(entry.id)
                    elif entry.type == KnowledgeType.TIMING_INSIGHT:
                        context["timing_insights"].append(entry.content)
                        self.record_retrieval(entry.id)
                    elif entry.type == KnowledgeType.NEGATIVE_LEARNING:
                        context["negative_learnings"].append(entry.content)
                        self.record_retrieval(entry.id)

        # Use vector search for semantic similarity when query text is provided
        if query_text:
            # Try vector search first
            if self._vector_service.is_available():
                vector_context = self._vector_service.get_relevant_context(
                    query=query_text,
                    company_id=company_id,
                    signal_type=signal_type,
                    include_reasoning=False,
                    limit=5,
                )
                # Add vector matches with scores
                for match in vector_context.get("knowledge", []):
                    entry_id = match.get("id")
                    entry = self._entries.get(entry_id)
                    if entry and entry.status == KnowledgeStatus.ACTIVE:
                        # Add to appropriate category if not already present
                        key = {
                            KnowledgeType.SIGNAL_RULE: "signal_rules",
                            KnowledgeType.COMPANY_INTEL: "company_intel",
                            KnowledgeType.PATTERN: "patterns",
                            KnowledgeType.TIMING_INSIGHT: "timing_insights",
                            KnowledgeType.NEGATIVE_LEARNING: "negative_learnings",
                        }.get(entry.type)
                        if key and entry.content not in context.get(key, []):
                            context[key].append(entry.content)
                            self.record_retrieval(entry.id)
                        # Also add to vector_matches with score
                        context["vector_matches"].append({
                            "id": entry.id,
                            "title": entry.title,
                            "type": entry.type.value,
                            "score": match.get("score", 0),
                            "content_preview": entry.content[:200],
                        })
            else:
                # Fallback to keyword search
                similar = self._keyword_search(query_text, limit=3)
                for entry in similar:
                    key = {
                        KnowledgeType.SIGNAL_RULE: "signal_rules",
                        KnowledgeType.COMPANY_INTEL: "company_intel",
                        KnowledgeType.PATTERN: "patterns",
                        KnowledgeType.TIMING_INSIGHT: "timing_insights",
                        KnowledgeType.NEGATIVE_LEARNING: "negative_learnings",
                    }.get(entry.type)
                    if key and entry.content not in context.get(key, []):
                        context[key].append(entry.content)

        return context

    # Pattern Rule Methods
    def create_pattern(
        self,
        name: str,
        description: str,
        condition: dict,
        action: dict,
        supporting_signals: int = 0,
    ) -> PatternRule:
        """Create a new pattern rule (starts as proposed)"""
        pattern_id = f"pr_{str(uuid.uuid4())[:8]}"

        pattern = PatternRule(
            id=pattern_id,
            created_at=datetime.now(),
            name=name,
            description=description,
            condition=condition,
            action=action,
            supporting_signals=supporting_signals,
            status=PatternRuleStatus.PROPOSED,
        )

        self._patterns[pattern.id] = pattern
        return pattern

    def get_pattern(self, pattern_id: str) -> PatternRule | None:
        """Get a pattern rule by ID"""
        return self._patterns.get(pattern_id)

    def get_patterns(
        self,
        status: PatternRuleStatus | None = None,
        limit: int = 50,
    ) -> list[PatternRule]:
        """Get pattern rules with optional filter"""
        patterns = list(self._patterns.values())

        if status:
            patterns = [p for p in patterns if p.status == status]

        patterns.sort(key=lambda p: p.created_at, reverse=True)
        return patterns[:limit]

    def activate_pattern(self, pattern_id: str, validated_by: str) -> PatternRule | None:
        """Activate a proposed pattern rule"""
        pattern = self._patterns.get(pattern_id)
        if not pattern:
            return None

        pattern.status = PatternRuleStatus.ACTIVE
        pattern.activated_at = datetime.now()
        pattern.validated_by = validated_by
        return pattern

    def deactivate_pattern(self, pattern_id: str) -> PatternRule | None:
        """Deactivate a pattern rule"""
        pattern = self._patterns.get(pattern_id)
        if not pattern:
            return None

        pattern.status = PatternRuleStatus.INACTIVE
        return pattern

    def get_stats(self) -> dict:
        """Get knowledge base statistics"""
        active_entries = [e for e in self._entries.values() if e.status == KnowledgeStatus.ACTIVE]

        by_type = {}
        for entry in active_entries:
            type_key = entry.type.value
            by_type[type_key] = by_type.get(type_key, 0) + 1

        total_retrievals = sum(e.times_retrieved for e in active_entries)
        avg_accuracy = (
            sum(e.accuracy_rate or 0 for e in active_entries if e.accuracy_rate)
            / len([e for e in active_entries if e.accuracy_rate])
            if any(e.accuracy_rate for e in active_entries)
            else 0
        )

        active_patterns = len([p for p in self._patterns.values() if p.status == PatternRuleStatus.ACTIVE])
        proposed_patterns = len([p for p in self._patterns.values() if p.status == PatternRuleStatus.PROPOSED])

        return {
            "total_entries": len(active_entries),
            "by_type": by_type,
            "total_retrievals": total_retrievals,
            "average_accuracy": round(avg_accuracy, 2),
            "active_patterns": active_patterns,
            "proposed_patterns": proposed_patterns,
        }
