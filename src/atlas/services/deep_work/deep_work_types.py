"""
Intelligence & Deep Work Types and Enums

Defines all types for reasoning chunks, knowledge entries, pattern rules,
and Week Work Wednesday sessions.
"""

from __future__ import annotations

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


# =============================================================================
# REASONING CHUNK TYPES
# =============================================================================

class ReasoningChunkType(str, Enum):
    """Types of AI reasoning that can be logged"""
    SIGNAL_CLASSIFICATION = "signal_classification"
    CONFIDENCE_SCORING = "confidence_scoring"
    DEAL_POTENTIAL = "deal_potential"
    PRIORITY_RANKING = "priority_ranking"
    CATEGORY_ASSIGNMENT = "category_assignment"
    CONTACT_RECOMMENDATION = "contact_recommendation"
    OUTREACH_TIMING = "outreach_timing"
    PATTERN_RECOGNITION = "pattern_recognition"
    COMPETITIVE_ASSESSMENT = "competitive_assessment"
    RISK_ASSESSMENT = "risk_assessment"
    BANT_SCORING = "bant_scoring"
    SPIN_ANALYSIS = "spin_analysis"
    PARANOID_TWIN = "paranoid_twin"


REASONING_TYPE_LABELS = {
    ReasoningChunkType.SIGNAL_CLASSIFICATION: {
        "label": "Signal Classification",
        "description": "Determining signal type and category",
        "icon": "tag",
    },
    ReasoningChunkType.CONFIDENCE_SCORING: {
        "label": "Confidence Scoring",
        "description": "How confidence score was calculated",
        "icon": "gauge",
    },
    ReasoningChunkType.DEAL_POTENTIAL: {
        "label": "Deal Potential",
        "description": "Assessing opportunity value",
        "icon": "trending-up",
    },
    ReasoningChunkType.PRIORITY_RANKING: {
        "label": "Priority Ranking",
        "description": "Why one signal ranks above another",
        "icon": "list-ordered",
    },
    ReasoningChunkType.CATEGORY_ASSIGNMENT: {
        "label": "Category Assignment",
        "description": "Matching signal to iBood categories",
        "icon": "folder",
    },
    ReasoningChunkType.CONTACT_RECOMMENDATION: {
        "label": "Contact Recommendation",
        "description": "Suggesting who to reach out to",
        "icon": "user-check",
    },
    ReasoningChunkType.OUTREACH_TIMING: {
        "label": "Outreach Timing",
        "description": "When to reach out",
        "icon": "clock",
    },
    ReasoningChunkType.PATTERN_RECOGNITION: {
        "label": "Pattern Recognition",
        "description": "Identifying recurring patterns",
        "icon": "activity",
    },
    ReasoningChunkType.COMPETITIVE_ASSESSMENT: {
        "label": "Competitive Assessment",
        "description": "Evaluating competitive landscape",
        "icon": "users",
    },
    ReasoningChunkType.RISK_ASSESSMENT: {
        "label": "Risk Assessment",
        "description": "Identifying potential issues",
        "icon": "alert-triangle",
    },
    ReasoningChunkType.BANT_SCORING: {
        "label": "BANT Scoring",
        "description": "Budget, Authority, Need, Timeline assessment",
        "icon": "check-square",
    },
    ReasoningChunkType.SPIN_ANALYSIS: {
        "label": "SPIN Analysis",
        "description": "Situation, Problem, Implication, Need-Payoff",
        "icon": "compass",
    },
    ReasoningChunkType.PARANOID_TWIN: {
        "label": "Paranoid Twin",
        "description": "Devil's advocate risk analysis",
        "icon": "shield-alert",
    },
}


class ReviewStatus(str, Enum):
    """Status of human review for a reasoning chunk"""
    PENDING = "pending"       # Not yet reviewed
    VALIDATED = "validated"   # Human confirmed AI was correct
    CORRECTED = "corrected"   # Human corrected the AI decision
    REJECTED = "rejected"     # Human rejected the reasoning entirely
    DEFERRED = "deferred"     # Deferred to next session


class OutcomeStatus(str, Enum):
    """Outcome status for tracked decisions"""
    PENDING = "pending"       # Outcome not yet known
    DEAL_WON = "deal_won"     # Signal led to successful deal
    DEAL_LOST = "deal_lost"   # Deal was lost
    NO_ACTION = "no_action"   # No action was taken
    IN_PROGRESS = "in_progress"  # Deal still in progress


# =============================================================================
# KNOWLEDGE BASE TYPES
# =============================================================================

class KnowledgeType(str, Enum):
    """Types of knowledge entries"""
    SIGNAL_RULE = "signal_rule"           # Rules for signal classification
    COMPANY_INTEL = "company_intel"       # Company-specific intelligence
    PATTERN = "pattern"                    # Recognized patterns
    TIMING_INSIGHT = "timing_insight"     # Timing-related learnings
    CONTACT_PREFERENCE = "contact_preference"  # Contact/outreach preferences
    COMPETITIVE_INTEL = "competitive_intel"    # Competitive intelligence
    NEGATIVE_LEARNING = "negative_learning"    # What NOT to do


KNOWLEDGE_TYPE_LABELS = {
    KnowledgeType.SIGNAL_RULE: {
        "label": "Signal Rule",
        "description": "Rules for classifying and scoring signals",
        "icon": "book-open",
    },
    KnowledgeType.COMPANY_INTEL: {
        "label": "Company Intelligence",
        "description": "Company-specific knowledge and preferences",
        "icon": "building",
    },
    KnowledgeType.PATTERN: {
        "label": "Pattern",
        "description": "Recognized patterns in signals or behavior",
        "icon": "activity",
    },
    KnowledgeType.TIMING_INSIGHT: {
        "label": "Timing Insight",
        "description": "When to act on signals or reach out",
        "icon": "calendar",
    },
    KnowledgeType.CONTACT_PREFERENCE: {
        "label": "Contact Preference",
        "description": "How to approach specific contacts or companies",
        "icon": "user",
    },
    KnowledgeType.COMPETITIVE_INTEL: {
        "label": "Competitive Intelligence",
        "description": "Information about competitors",
        "icon": "users",
    },
    KnowledgeType.NEGATIVE_LEARNING: {
        "label": "Negative Learning",
        "description": "What to avoid based on past failures",
        "icon": "x-circle",
    },
}


class KnowledgeStatus(str, Enum):
    """Status of knowledge entries"""
    ACTIVE = "active"         # Currently in use
    INACTIVE = "inactive"     # Temporarily disabled
    DEPRECATED = "deprecated"  # No longer valid


class PatternRuleStatus(str, Enum):
    """Status of pattern rules"""
    PROPOSED = "proposed"     # AI detected, needs validation
    ACTIVE = "active"         # Validated and active
    INACTIVE = "inactive"     # Temporarily disabled


# =============================================================================
# WEEK WORK WEDNESDAY TYPES
# =============================================================================

class SessionPhase(str, Enum):
    """Phases of a Week Work Wednesday session"""
    OVERVIEW = "overview"             # Session overview and stats
    DECISIONS_REVIEW = "decisions_review"  # Review flagged decisions
    PATTERNS_REVIEW = "patterns_review"    # Review emerging patterns
    OUTCOME_CLOSURE = "outcome_closure"    # Close outcomes from past signals
    INSIGHTS = "insights"             # AI-generated insights and discussion
    SUMMARY = "summary"               # Session summary and action items


# =============================================================================
# CHAT TYPES
# =============================================================================

class ChatRole(str, Enum):
    """Roles in a chat conversation"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class ReasoningStep:
    """A single step in a reasoning chain"""
    step: int
    thought: str
    evidence: str = ""
    confidence: int = 100  # 0-100


@dataclass
class Alternative:
    """An alternative considered but rejected"""
    alternative: str
    rejected_because: str


@dataclass
class ReasoningChunk:
    """A discrete unit of AI reasoning that can be logged and reviewed"""
    id: str
    created_at: datetime
    agent: str  # signal_classifier, confidence_scorer, etc.
    type: ReasoningChunkType

    # Decision details
    decision_action: str
    decision_result: str
    decision_confidence: float  # 0-1

    # Context
    input_context: dict = field(default_factory=dict)
    retrieved_knowledge: list[str] = field(default_factory=list)

    # Reasoning
    reasoning_chain: list[ReasoningStep] = field(default_factory=list)
    alternatives_considered: list[Alternative] = field(default_factory=list)
    uncertainties: list[str] = field(default_factory=list)

    # Flags
    flagged_for_review: bool = False
    flag_reason: str = ""
    is_novel_situation: bool = False
    conflicts_with_knowledge: bool = False

    # Review
    review_status: ReviewStatus = ReviewStatus.PENDING
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    review_notes: str = ""
    correction: dict | None = None

    # Outcome tracking
    outcome_status: OutcomeStatus = OutcomeStatus.PENDING
    outcome_value: float | None = None
    outcome_notes: str = ""
    outcome_closed_at: datetime | None = None

    # Relationships
    signal_id: str | None = None
    company_id: str | None = None
    deal_id: str | None = None

    # Embedding (stored separately in vector DB)
    embedding_id: str | None = None

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "agent": self.agent,
            "type": self.type.value,
            "decision": {
                "action": self.decision_action,
                "result": self.decision_result,
                "confidence": self.decision_confidence,
            },
            "context": {
                "input": self.input_context,
                "retrieved_knowledge": self.retrieved_knowledge,
            },
            "reasoning": {
                "chain": [
                    {"step": s.step, "thought": s.thought, "evidence": s.evidence}
                    for s in self.reasoning_chain
                ],
                "alternatives": [
                    {"alternative": a.alternative, "rejected_because": a.rejected_because}
                    for a in self.alternatives_considered
                ],
                "uncertainties": self.uncertainties,
            },
            "flags": {
                "flagged_for_review": self.flagged_for_review,
                "flag_reason": self.flag_reason,
                "is_novel_situation": self.is_novel_situation,
                "conflicts_with_knowledge": self.conflicts_with_knowledge,
            },
            "review": {
                "status": self.review_status.value,
                "reviewed_by": self.reviewed_by,
                "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
                "notes": self.review_notes,
                "correction": self.correction,
            },
            "outcome": {
                "status": self.outcome_status.value,
                "value": self.outcome_value,
                "notes": self.outcome_notes,
                "closed_at": self.outcome_closed_at.isoformat() if self.outcome_closed_at else None,
            },
            "relationships": {
                "signal_id": self.signal_id,
                "company_id": self.company_id,
                "deal_id": self.deal_id,
            },
        }


@dataclass
class KnowledgeEntry:
    """A validated piece of knowledge in the knowledge base"""
    id: str
    created_at: datetime
    updated_at: datetime

    type: KnowledgeType
    title: str
    content: str

    # Source tracking
    source_type: str  # human_input, validated_reasoning, pattern_detection
    source_chunk_ids: list[str] = field(default_factory=list)
    validated_by: str | None = None

    # Applicability
    applies_to_companies: list[str] = field(default_factory=list)  # Company IDs
    applies_to_signal_types: list[str] = field(default_factory=list)
    applies_to_categories: list[str] = field(default_factory=list)

    # Performance tracking
    times_retrieved: int = 0
    times_helpful: int = 0
    accuracy_rate: float | None = None
    last_used_at: datetime | None = None

    # Status
    status: KnowledgeStatus = KnowledgeStatus.ACTIVE

    # Embedding
    embedding_id: str | None = None

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "type": self.type.value,
            "title": self.title,
            "content": self.content,
            "source": {
                "type": self.source_type,
                "chunk_ids": self.source_chunk_ids,
                "validated_by": self.validated_by,
            },
            "applicability": {
                "companies": self.applies_to_companies,
                "signal_types": self.applies_to_signal_types,
                "categories": self.applies_to_categories,
            },
            "performance": {
                "times_retrieved": self.times_retrieved,
                "times_helpful": self.times_helpful,
                "accuracy_rate": self.accuracy_rate,
                "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            },
            "status": self.status.value,
        }


@dataclass
class PatternRule:
    """A pattern-based rule for AI decisions"""
    id: str
    created_at: datetime

    name: str
    description: str

    # Rule definition
    condition: dict  # When to apply
    action: dict     # What to do

    # Evidence
    supporting_signals: int = 0
    accuracy_rate: float | None = None

    # Status
    status: PatternRuleStatus = PatternRuleStatus.PROPOSED
    activated_at: datetime | None = None
    validated_by: str | None = None

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "name": self.name,
            "description": self.description,
            "condition": self.condition,
            "action": self.action,
            "supporting_signals": self.supporting_signals,
            "accuracy_rate": self.accuracy_rate,
            "status": self.status.value,
            "activated_at": self.activated_at.isoformat() if self.activated_at else None,
            "validated_by": self.validated_by,
        }


@dataclass
class SessionReviewItem:
    """An item to review during a Week Work Wednesday session"""
    chunk_id: str
    chunk: ReasoningChunk
    priority: int  # Higher = more important to review
    review_reason: str
    suggested_action: str | None = None


@dataclass
class WeekWorkSession:
    """A Week Work Wednesday session"""
    id: str
    session_date: datetime
    user_id: str

    # Session stats
    decisions_total: int = 0
    decisions_flagged: int = 0
    decisions_reviewed: int = 0
    validations: int = 0
    corrections: int = 0
    rejections: int = 0
    patterns_reviewed: int = 0
    patterns_activated: int = 0
    outcomes_closed: int = 0
    knowledge_entries_added: int = 0

    # Session content
    review_items: list[SessionReviewItem] = field(default_factory=list)
    emerging_patterns: list[PatternRule] = field(default_factory=list)
    pending_outcomes: list[ReasoningChunk] = field(default_factory=list)
    insights: list[str] = field(default_factory=list)

    # Notes and actions
    session_notes: str = ""
    action_items: list[dict] = field(default_factory=list)

    # Timing
    started_at: datetime | None = None
    completed_at: datetime | None = None
    current_phase: SessionPhase = SessionPhase.OVERVIEW

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "session_date": self.session_date.isoformat(),
            "user_id": self.user_id,
            "stats": {
                "decisions_total": self.decisions_total,
                "decisions_flagged": self.decisions_flagged,
                "decisions_reviewed": self.decisions_reviewed,
                "validations": self.validations,
                "corrections": self.corrections,
                "rejections": self.rejections,
                "patterns_reviewed": self.patterns_reviewed,
                "patterns_activated": self.patterns_activated,
                "outcomes_closed": self.outcomes_closed,
                "knowledge_entries_added": self.knowledge_entries_added,
            },
            "timing": {
                "started_at": self.started_at.isoformat() if self.started_at else None,
                "completed_at": self.completed_at.isoformat() if self.completed_at else None,
                "current_phase": self.current_phase.value,
            },
            "session_notes": self.session_notes,
            "action_items": self.action_items,
            "insights": self.insights,
        }


@dataclass
class ChatMessage:
    """A message in a chat conversation"""
    id: str
    role: ChatRole
    content: str
    created_at: datetime

    # Audio support
    audio_transcript: str | None = None
    audio_duration_seconds: float | None = None

    # Context
    context_chunks: list[str] = field(default_factory=list)  # Reasoning chunk IDs
    knowledge_used: list[str] = field(default_factory=list)  # Knowledge entry IDs

    # Metadata
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "role": self.role.value,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "audio": {
                "transcript": self.audio_transcript,
                "duration_seconds": self.audio_duration_seconds,
            } if self.audio_transcript else None,
            "context": {
                "chunks": self.context_chunks,
                "knowledge": self.knowledge_used,
            },
            "metadata": self.metadata,
        }


@dataclass
class ChatSession:
    """A chat session with the AI agent"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    # Session context
    session_type: str  # week_work, exploration, review, general
    week_work_session_id: str | None = None

    # Messages
    messages: list[ChatMessage] = field(default_factory=list)

    # System context
    system_prompt: str = ""
    context_summary: str = ""

    # Active state
    is_active: bool = True
    ended_at: datetime | None = None

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "session_type": self.session_type,
            "week_work_session_id": self.week_work_session_id,
            "messages": [m.to_dict() for m in self.messages],
            "is_active": self.is_active,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }


# =============================================================================
# FLAG CONDITIONS
# =============================================================================

FLAG_CONDITIONS = {
    "low_confidence": {
        "threshold": 0.70,
        "description": "AI confidence below 70%",
        "priority": 1,
    },
    "novel_situation": {
        "description": "No similar cases in knowledge base",
        "priority": 2,
    },
    "conflicting_knowledge": {
        "description": "Past learnings suggest different decision",
        "priority": 1,
    },
    "high_stakes": {
        "threshold_value": 100000,  # €100k+ deal value
        "description": "Large deal value or strategic importance",
        "priority": 1,
    },
    "emerging_pattern": {
        "description": "AI detected new pattern needing validation",
        "priority": 2,
    },
    "complex_reasoning": {
        "threshold_steps": 7,
        "description": "Reasoning chain > 7 steps",
        "priority": 3,
    },
    "outcome_mismatch": {
        "description": "Previous similar reasoning led to bad outcome",
        "priority": 1,
    },
    "human_escalation": {
        "description": "Manually flagged for review",
        "priority": 1,
    },
}
