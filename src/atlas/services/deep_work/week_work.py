"""
Week Work Wednesday Service

Manages weekly human-AI collaboration sessions for reviewing AI decisions,
validating learnings, and improving the system.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any

from .deep_work_types import (
    WeekWorkSession,
    SessionReviewItem,
    SessionPhase,
    ReviewStatus,
    OutcomeStatus,
    PatternRuleStatus,
)
from .reasoning_chunks import ReasoningChunkService
from .knowledge_base import KnowledgeBaseService


class WeekWorkService:
    """Service for managing Week Work Wednesday sessions"""

    def __init__(
        self,
        reasoning_service: ReasoningChunkService | None = None,
        knowledge_service: KnowledgeBaseService | None = None,
    ):
        self._sessions: dict[str, WeekWorkSession] = {}
        self._reasoning = reasoning_service or ReasoningChunkService()
        self._knowledge = knowledge_service or KnowledgeBaseService()
        self._initialize_demo_data()

    def _initialize_demo_data(self):
        """Initialize with demo session data"""
        now = datetime.now()

        # Past session (completed)
        session1 = WeekWorkSession(
            id="ww_2024_49",
            session_date=now - timedelta(days=7),
            user_id="user_hugo",
            decisions_total=42,
            decisions_flagged=6,
            decisions_reviewed=6,
            validations=4,
            corrections=2,
            rejections=0,
            patterns_reviewed=2,
            patterns_activated=1,
            outcomes_closed=8,
            knowledge_entries_added=5,
            session_notes="Good progress on Q4 patterns. Sony correction added to knowledge base.",
            action_items=[
                {"task": "Follow up on Bosch signal", "assignee": "hugo", "due": "2024-12-10"},
                {"task": "Update Philips contact info", "assignee": "hugo", "due": "2024-12-09"},
            ],
            insights=[
                "Conversion rate improved from 12% to 18% after adding company relationship history to context",
                "3 signals were missed that competitors acted on. Common factor: All from industry publications, not financial filings.",
            ],
            started_at=now - timedelta(days=7, hours=2),
            completed_at=now - timedelta(days=7),
            current_phase=SessionPhase.SUMMARY,
        )
        self._sessions[session1.id] = session1

    def create_session(self, user_id: str) -> WeekWorkSession:
        """Create a new Week Work Wednesday session"""
        # Get current week number
        now = datetime.now()
        week_num = now.isocalendar()[1]
        session_id = f"ww_{now.year}_{week_num}"

        # Check if session already exists
        if session_id in self._sessions:
            return self._sessions[session_id]

        # Gather stats from last week
        chunk_stats = self._reasoning.get_stats(days=7)
        kb_stats = self._knowledge.get_stats()

        # Get items for review
        flagged_chunks = self._reasoning.get_flagged_for_review(limit=20)
        review_items = [
            SessionReviewItem(
                chunk_id=chunk.id,
                chunk=chunk,
                priority=self._calculate_review_priority(chunk),
                review_reason=chunk.flag_reason,
            )
            for chunk in flagged_chunks
        ]
        review_items.sort(key=lambda x: x.priority, reverse=True)

        # Get pending outcomes
        pending_outcomes = self._reasoning.get_pending_outcomes(limit=20)

        # Get proposed patterns
        proposed_patterns = self._knowledge.get_patterns(status=PatternRuleStatus.PROPOSED)

        # Generate insights
        insights = self._generate_insights(chunk_stats, kb_stats)

        session = WeekWorkSession(
            id=session_id,
            session_date=now,
            user_id=user_id,
            decisions_total=chunk_stats["total"],
            decisions_flagged=chunk_stats["flagged"],
            review_items=review_items,
            pending_outcomes=pending_outcomes,
            emerging_patterns=proposed_patterns,
            insights=insights,
            started_at=now,
            current_phase=SessionPhase.OVERVIEW,
        )

        self._sessions[session.id] = session
        return session

    def _calculate_review_priority(self, chunk) -> int:
        """Calculate priority for reviewing a chunk"""
        priority = 0

        # Low confidence = high priority
        if chunk.decision_confidence < 0.5:
            priority += 5
        elif chunk.decision_confidence < 0.7:
            priority += 3

        # Novel situation = high priority
        if chunk.is_novel_situation:
            priority += 4

        # Conflicts with knowledge = critical
        if chunk.conflicts_with_knowledge:
            priority += 5

        # Complex reasoning needs review
        if len(chunk.reasoning_chain) > 7:
            priority += 2

        return priority

    def _generate_insights(self, chunk_stats: dict, kb_stats: dict) -> list[str]:
        """Generate AI insights for the session"""
        insights = []

        # Correction rate insight
        if chunk_stats["correction_rate"] > 0.2:
            insights.append(
                f"Correction rate is {chunk_stats['correction_rate']:.0%} this week. "
                "Consider reviewing knowledge base for outdated rules."
            )

        # Knowledge base usage
        if kb_stats["total_retrievals"] > 100:
            insights.append(
                f"Knowledge base retrieved {kb_stats['total_retrievals']} times this week "
                f"with {kb_stats['average_accuracy']:.0%} accuracy rate."
            )

        # Proposed patterns
        if kb_stats["proposed_patterns"] > 0:
            insights.append(
                f"{kb_stats['proposed_patterns']} new patterns detected, pending validation."
            )

        # Default insights if none generated
        if not insights:
            insights = [
                "System is performing within normal parameters.",
                "Consider adding company-specific learnings for frequently encountered accounts.",
            ]

        return insights

    def get_session(self, session_id: str) -> WeekWorkSession | None:
        """Get a session by ID"""
        return self._sessions.get(session_id)

    def get_current_session(self, user_id: str) -> WeekWorkSession | None:
        """Get or create the current week's session"""
        now = datetime.now()
        week_num = now.isocalendar()[1]
        session_id = f"ww_{now.year}_{week_num}"

        if session_id in self._sessions:
            return self._sessions[session_id]

        return self.create_session(user_id)

    def get_past_sessions(self, limit: int = 10) -> list[WeekWorkSession]:
        """Get past sessions"""
        sessions = list(self._sessions.values())
        sessions.sort(key=lambda s: s.session_date, reverse=True)
        return sessions[:limit]

    def advance_phase(self, session_id: str) -> WeekWorkSession | None:
        """Advance session to next phase"""
        session = self._sessions.get(session_id)
        if not session:
            return None

        phase_order = [
            SessionPhase.OVERVIEW,
            SessionPhase.DECISIONS_REVIEW,
            SessionPhase.PATTERNS_REVIEW,
            SessionPhase.OUTCOME_CLOSURE,
            SessionPhase.INSIGHTS,
            SessionPhase.SUMMARY,
        ]

        current_idx = phase_order.index(session.current_phase)
        if current_idx < len(phase_order) - 1:
            session.current_phase = phase_order[current_idx + 1]

        return session

    def set_phase(self, session_id: str, phase: SessionPhase) -> WeekWorkSession | None:
        """Set session to specific phase"""
        session = self._sessions.get(session_id)
        if not session:
            return None

        session.current_phase = phase
        return session

    def review_decision(
        self,
        session_id: str,
        chunk_id: str,
        status: ReviewStatus,
        notes: str = "",
        correction: dict | None = None,
        learning: str | None = None,
    ) -> dict:
        """Review a decision in the session"""
        session = self._sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}

        # Update the reasoning chunk
        chunk = self._reasoning.review_chunk(
            chunk_id=chunk_id,
            status=status,
            reviewed_by=session.user_id,
            notes=notes,
            correction=correction,
        )

        if not chunk:
            return {"error": "Chunk not found"}

        # Update session stats
        session.decisions_reviewed += 1
        if status == ReviewStatus.VALIDATED:
            session.validations += 1
        elif status == ReviewStatus.CORRECTED:
            session.corrections += 1
        elif status == ReviewStatus.REJECTED:
            session.rejections += 1

        # Add learning to knowledge base if provided
        if learning and status in [ReviewStatus.VALIDATED, ReviewStatus.CORRECTED]:
            entry = self._knowledge.create_entry(
                entry_type="signal_rule" if status == ReviewStatus.VALIDATED else "negative_learning",
                title=f"Learning from {chunk.type.value}",
                content=learning,
                source_type="validated_reasoning",
                validated_by=session.user_id,
                source_chunk_ids=[chunk_id],
            )
            session.knowledge_entries_added += 1
            return {"success": True, "chunk": chunk.to_dict(), "learning_id": entry.id}

        return {"success": True, "chunk": chunk.to_dict()}

    def validate_pattern(
        self,
        session_id: str,
        pattern_id: str,
        action: str,  # validate, reject, modify
        modified_rule: dict | None = None,
    ) -> dict:
        """Validate or reject an emerging pattern"""
        session = self._sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}

        session.patterns_reviewed += 1

        if action == "validate":
            pattern = self._knowledge.activate_pattern(pattern_id, session.user_id)
            if pattern:
                session.patterns_activated += 1
                return {"success": True, "pattern": pattern.to_dict()}
        elif action == "reject":
            pattern = self._knowledge.deactivate_pattern(pattern_id)
            if pattern:
                return {"success": True, "pattern": pattern.to_dict()}
        elif action == "modify" and modified_rule:
            # Create new pattern with modifications
            pattern = self._knowledge.create_pattern(
                name=modified_rule.get("name", "Modified Pattern"),
                description=modified_rule.get("description", ""),
                condition=modified_rule.get("condition", {}),
                action=modified_rule.get("action", {}),
            )
            # Activate immediately since human modified it
            self._knowledge.activate_pattern(pattern.id, session.user_id)
            session.patterns_activated += 1
            return {"success": True, "pattern": pattern.to_dict()}

        return {"error": "Invalid action or pattern not found"}

    def close_outcome(
        self,
        session_id: str,
        chunk_id: str,
        outcome: OutcomeStatus,
        value: float | None = None,
        notes: str = "",
    ) -> dict:
        """Close an outcome for a reasoning chunk"""
        session = self._sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}

        chunk = self._reasoning.close_outcome(
            chunk_id=chunk_id,
            status=outcome,
            value=value,
            notes=notes,
        )

        if not chunk:
            return {"error": "Chunk not found"}

        session.outcomes_closed += 1
        return {"success": True, "chunk": chunk.to_dict()}

    def add_note(self, session_id: str, note: str) -> WeekWorkSession | None:
        """Add a note to the session"""
        session = self._sessions.get(session_id)
        if not session:
            return None

        session.session_notes += f"\n{note}" if session.session_notes else note
        return session

    def add_action_item(
        self,
        session_id: str,
        task: str,
        assignee: str,
        due_date: str | None = None,
    ) -> WeekWorkSession | None:
        """Add an action item to the session"""
        session = self._sessions.get(session_id)
        if not session:
            return None

        session.action_items.append({
            "task": task,
            "assignee": assignee,
            "due": due_date,
            "created_at": datetime.now().isoformat(),
        })
        return session

    def complete_session(self, session_id: str) -> WeekWorkSession | None:
        """Mark session as complete"""
        session = self._sessions.get(session_id)
        if not session:
            return None

        session.completed_at = datetime.now()
        session.current_phase = SessionPhase.SUMMARY
        return session

    def get_session_summary(self, session_id: str) -> dict:
        """Get a summary of the session"""
        session = self._sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}

        duration = None
        if session.started_at and session.completed_at:
            duration = (session.completed_at - session.started_at).total_seconds() / 60  # minutes

        return {
            "session": session.to_dict(),
            "duration_minutes": round(duration, 1) if duration else None,
            "completion_rate": (
                session.decisions_reviewed / session.decisions_flagged * 100
                if session.decisions_flagged > 0
                else 100
            ),
            "accuracy_rate": (
                session.validations / session.decisions_reviewed * 100
                if session.decisions_reviewed > 0
                else 0
            ),
            "impact": {
                "knowledge_added": session.knowledge_entries_added,
                "patterns_activated": session.patterns_activated,
                "outcomes_closed": session.outcomes_closed,
            },
        }
