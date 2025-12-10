"""
Intent Analysis Types and Enums

Defines all types for buyer personas, BANT, SPIN, risks, and the Paranoid Twin.
"""

from __future__ import annotations

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


# =============================================================================
# BUYER PERSONA TYPES
# =============================================================================

class PersonaType(str, Enum):
    """Types of buyer personas in B2B deals"""
    ECONOMIC_BUYER = "economic_buyer"      # Controls budget (CFO, Finance Director)
    TECHNICAL_BUYER = "technical_buyer"    # Evaluates fit (Product Manager, Supply Chain)
    USER_BUYER = "user_buyer"              # Lives with decision (Sales Director, Brand Manager)
    CHAMPION = "champion"                   # Internal advocate
    BLOCKER = "blocker"                     # May oppose deal
    GATEKEEPER = "gatekeeper"              # Controls access
    UNKNOWN = "unknown"                     # Not yet categorized


PERSONA_DEFINITIONS = {
    PersonaType.ECONOMIC_BUYER: {
        "label": "Economic Buyer",
        "role": "Controls budget",
        "examples": ["CFO", "Finance Director", "VP Finance"],
        "key_questions": ["Is this in budget?", "What's the ROI?"],
        "intent_signals": ["Budget approval", "Signing authority"],
    },
    PersonaType.TECHNICAL_BUYER: {
        "label": "Technical Buyer",
        "role": "Evaluates fit",
        "examples": ["Product Manager", "Supply Chain Director", "Operations"],
        "key_questions": ["Does this work for our inventory?", "What's the logistics?"],
        "intent_signals": ["Product specs shared", "Logistics discussed"],
    },
    PersonaType.USER_BUYER: {
        "label": "User Buyer",
        "role": "Lives with decision",
        "examples": ["Sales Director", "Brand Manager", "Marketing"],
        "key_questions": ["Will this damage our brand?", "How will sales react?"],
        "intent_signals": ["Channel concerns addressed", "Brand guidelines shared"],
    },
    PersonaType.CHAMPION: {
        "label": "Champion",
        "role": "Internal advocate",
        "examples": ["Project sponsor", "Deal champion"],
        "key_questions": ["How do I sell this internally?"],
        "intent_signals": ["Shares internal politics", "Coaches on process"],
    },
    PersonaType.BLOCKER: {
        "label": "Blocker",
        "role": "May oppose deal",
        "examples": ["Competing department head", "Risk-averse executive"],
        "key_questions": ["Why not use existing channels?"],
        "intent_signals": ["Delays", "Objections", "Silence"],
    },
    PersonaType.GATEKEEPER: {
        "label": "Gatekeeper",
        "role": "Controls access",
        "examples": ["Executive assistant", "Procurement"],
        "key_questions": ["Who should you talk to?"],
        "intent_signals": ["Meeting access", "Information flow"],
    },
}


class EngagementLevel(str, Enum):
    """Engagement levels for buyer personas"""
    ENGAGED = "engaged"          # Active, responsive, supportive
    CAUTIOUS = "cautious"        # Engaged but has concerns
    BLOCKING = "blocking"        # Actively opposing
    SILENT = "silent"            # Not responding
    UNKNOWN = "unknown"          # Not yet assessed


# =============================================================================
# BANT QUALIFICATION
# =============================================================================

class BANTCriterion(str, Enum):
    """BANT qualification criteria"""
    BUDGET = "budget"        # Is money allocated?
    AUTHORITY = "authority"  # Are we talking to decision-makers?
    NEED = "need"           # Is there a genuine, urgent need?
    TIMELINE = "timeline"   # Is there a real deadline?


BANT_SCORING_RUBRIC = {
    BANTCriterion.BUDGET: {
        25: "Budget confirmed, PO ready",
        20: "Budget exists, approval process clear",
        15: "Budget likely, process unclear",
        10: "Budget possible, not confirmed",
        5: "Budget uncertain",
        0: "No budget identified",
    },
    BANTCriterion.AUTHORITY: {
        25: "Decision-maker engaged, no blockers",
        20: "Decision-maker engaged, blockers manageable",
        15: "Decision-maker identified, limited engagement",
        10: "Decision-maker unclear, working with influencer",
        5: "No access to decision-maker",
        0: "Don't know who decides",
    },
    BANTCriterion.NEED: {
        25: "Critical, quantified, urgent need",
        20: "Strong need, mostly quantified",
        15: "Clear need, not fully quantified",
        10: "Need exists but not urgent",
        5: "Vague or assumed need",
        0: "No clear need identified",
    },
    BANTCriterion.TIMELINE: {
        25: "Hard deadline, event-driven, immovable",
        20: "Clear deadline, strong drivers",
        15: "Target date, some flexibility",
        10: "Vague timeline, 'this quarter'",
        5: "No urgency, 'when budget allows'",
        0: "No timeline discussed",
    },
}


# =============================================================================
# SPIN ANALYSIS
# =============================================================================

class SPINQuadrant(str, Enum):
    """SPIN analysis quadrants"""
    SITUATION = "situation"      # Current state and context
    PROBLEM = "problem"          # Pain points and challenges
    IMPLICATION = "implication"  # Consequences of not solving
    NEED_PAYOFF = "need_payoff"  # Value of solving the problem


SPIN_QUESTIONS = {
    SPINQuadrant.SITUATION: [
        "How much inventory are we talking about specifically?",
        "What's the current warehouse capacity situation?",
        "Who else have you worked with on clearance deals?",
        "What's the timeline for your Q1 product launch?",
    ],
    SPINQuadrant.PROBLEM: [
        "What happens if this inventory isn't cleared by year-end?",
        "How has excess inventory impacted your division before?",
        "What challenges have you faced with other clearance channels?",
        "Why hasn't traditional retail been able to absorb this?",
    ],
    SPINQuadrant.IMPLICATION: [
        "If the write-down happens, how does that affect your targets?",
        "What's the cost of delayed Q1 launch?",
        "How is the board viewing the working capital situation?",
        "What happens to the team if Q4 targets are missed?",
    ],
    SPINQuadrant.NEED_PAYOFF: [
        "If we could clear 200K units by Dec 20, what would that mean for you?",
        "How valuable would an ongoing clearance channel be for future situations?",
        "What would hitting your Q4 target mean for you personally?",
        "How would the CFO react if working capital improved before year-end?",
    ],
}


# =============================================================================
# RISK MANAGEMENT
# =============================================================================

class RiskSeverity(str, Enum):
    """Risk severity levels"""
    CRITICAL = "critical"  # Deal killers
    MEDIUM = "medium"      # Deal delayers
    LOW = "low"           # Minor concerns


class RiskCategory(str, Enum):
    """Categories of deal risks"""
    AUTHORITY_GAPS = "authority_gaps"        # Missing or silent decision-makers
    BUDGET_UNCERTAINTY = "budget_uncertainty" # Unconfirmed or competing budget
    TIMELINE_SLIPPAGE = "timeline_slippage"  # Dates moving or vague
    COMPETITIVE_THREAT = "competitive_threat" # Other players in the deal
    CHAMPION_WEAKNESS = "champion_weakness"  # Over-reliance on one person
    BLOCKER_POWER = "blocker_power"          # Unaddressed opposition
    NEED_INFLATION = "need_inflation"        # Overstated urgency
    HIDDEN_AGENDA = "hidden_agenda"          # Unstated motivations
    HISTORICAL_PATTERNS = "historical_patterns" # Past deal failures
    EXTERNAL_FACTORS = "external_factors"    # Market, regulatory, economic


RISK_CATEGORY_DEFINITIONS = {
    RiskCategory.AUTHORITY_GAPS: {
        "description": "Missing or silent decision-makers",
        "question": "Who can say no that we haven't talked to?",
    },
    RiskCategory.BUDGET_UNCERTAINTY: {
        "description": "Unconfirmed or competing budget",
        "question": "Is the money actually there?",
    },
    RiskCategory.TIMELINE_SLIPPAGE: {
        "description": "Dates moving or vague",
        "question": "Why did the date slip? Will it slip again?",
    },
    RiskCategory.COMPETITIVE_THREAT: {
        "description": "Other players in the deal",
        "question": "Are we really their first choice?",
    },
    RiskCategory.CHAMPION_WEAKNESS: {
        "description": "Over-reliance on one person",
        "question": "What if our champion gets sick or leaves?",
    },
    RiskCategory.BLOCKER_POWER: {
        "description": "Unaddressed opposition",
        "question": "Can the blocker actually kill this?",
    },
    RiskCategory.NEED_INFLATION: {
        "description": "Overstated urgency",
        "question": "Is the pain really that bad?",
    },
    RiskCategory.HIDDEN_AGENDA: {
        "description": "Unstated motivations",
        "question": "What aren't they telling us?",
    },
    RiskCategory.HISTORICAL_PATTERNS: {
        "description": "Past deal failures",
        "question": "Why did our last deal with them fall through?",
    },
    RiskCategory.EXTERNAL_FACTORS: {
        "description": "Market, regulatory, economic factors",
        "question": "What if the market shifts?",
    },
}


class RiskStatus(str, Enum):
    """Risk status in mitigation workflow"""
    OPEN = "open"             # Not yet addressed
    MITIGATING = "mitigating" # Actions in progress
    MITIGATED = "mitigated"   # Successfully addressed
    ACCEPTED = "accepted"     # Acknowledged but not mitigated


# =============================================================================
# PARANOID TWIN
# =============================================================================

class ParanoidVerdict(str, Enum):
    """Paranoid Twin verdict on deal readiness"""
    READY = "ready"   # Deal can proceed to commit
    HOLD = "hold"     # Address risks before proceeding
    BLOCK = "block"   # Not ready for commit stage


# Paranoid Twin trigger conditions
PARANOID_TRIGGERS = {
    "decision_maker_silent": {
        "condition": "Decision-maker hasn't engaged in 5+ days",
        "warning": "Economic buyer has gone silent",
        "severity": RiskSeverity.CRITICAL,
    },
    "timeline_changed": {
        "condition": "Timeline has changed",
        "warning": "Timeline slippage detected",
        "severity": RiskSeverity.MEDIUM,
    },
    "blocker_unengaged": {
        "condition": "Blocker identified but not engaged",
        "warning": "Blocker remains unaddressed",
        "severity": RiskSeverity.CRITICAL,
    },
    "single_contact": {
        "condition": "Champion is only contact",
        "warning": "Single point of contact risk",
        "severity": RiskSeverity.MEDIUM,
    },
    "bant_dropped": {
        "condition": "BANT score dropped",
        "warning": "Qualification weakening",
        "severity": RiskSeverity.MEDIUM,
    },
    "competitor_mentioned": {
        "condition": "Competitor mentioned",
        "warning": "Competitive process likely",
        "severity": RiskSeverity.MEDIUM,
    },
    "deal_value_increased": {
        "condition": "Deal value increased",
        "warning": "Scope creep — is budget still valid?",
        "severity": RiskSeverity.LOW,
    },
    "close_date_approaching": {
        "condition": "Close date within 7 days, risks open",
        "warning": "Critical risks unresolved before commit",
        "severity": RiskSeverity.CRITICAL,
    },
}


# =============================================================================
# INTENT SIGNALS
# =============================================================================

class IntentSignalType(str, Enum):
    """Types of intent signals from buyer behavior"""
    RESPONSE_TIME = "response_time"          # Speed of replies
    INFORMATION_SHARING = "information_sharing"  # Proactive vs reluctant
    ACCESS_GRANTING = "access_granting"      # Introduces to others vs guards
    MEETING_ATTENDANCE = "meeting_attendance" # Shows up vs reschedules
    QUESTIONS_ASKED = "questions_asked"      # Implementation vs exploring
    INTERNAL_ADVOCACY = "internal_advocacy"  # Mentions selling internally
    URGENCY_LANGUAGE = "urgency_language"    # "Need to move fast" vs "revisit next quarter"
    COMPETITOR_MENTIONS = "competitor_mentions"  # "You're preferred" vs "talking to X"


INTENT_SIGNAL_INDICATORS = {
    IntentSignalType.RESPONSE_TIME: {
        "positive": "<24 hours",
        "negative": ">3 days or declining",
    },
    IntentSignalType.INFORMATION_SHARING: {
        "positive": "Proactive, detailed",
        "negative": "Vague, reluctant",
    },
    IntentSignalType.ACCESS_GRANTING: {
        "positive": "Introduces to others",
        "negative": "Guards access",
    },
    IntentSignalType.MEETING_ATTENDANCE: {
        "positive": "Shows up, prepared",
        "negative": "Reschedules, distracted",
    },
    IntentSignalType.QUESTIONS_ASKED: {
        "positive": "Implementation-focused",
        "negative": "Still exploring options",
    },
    IntentSignalType.INTERNAL_ADVOCACY: {
        "positive": "Mentions selling internally",
        "negative": "Silent about internal process",
    },
    IntentSignalType.URGENCY_LANGUAGE: {
        "positive": "We need to move fast",
        "negative": "Let's revisit next quarter",
    },
    IntentSignalType.COMPETITOR_MENTIONS: {
        "positive": "You're our preferred",
        "negative": "We're also talking to X",
    },
}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class BuyerPersona:
    """Represents a buyer persona in a deal"""
    id: str
    deal_id: str
    contact_id: str | None
    contact_name: str
    contact_title: str
    contact_email: str | None = None
    persona_type: PersonaType = PersonaType.UNKNOWN
    engagement_level: EngagementLevel = EngagementLevel.UNKNOWN
    last_engagement_date: datetime | None = None
    response_time_avg_hours: int | None = None
    influence_score: int = 50  # 0-100
    can_veto: bool = False
    can_approve: bool = False
    motivations: list[str] = field(default_factory=list)
    concerns: list[str] = field(default_factory=list)
    intent_signals: list[dict] = field(default_factory=list)
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class DealRisk:
    """Represents a risk identified in a deal"""
    id: str
    deal_id: str
    title: str
    description: str
    category: RiskCategory
    severity: RiskSeverity
    probability: int  # 0-100
    impact: str
    source: str  # paranoid_twin, manual, system
    status: RiskStatus = RiskStatus.OPEN
    owner_id: str | None = None
    mitigation_actions: list[dict] = field(default_factory=list)
    success_criteria: str = ""
    counter_evidence_needed: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    resolved_at: datetime | None = None


@dataclass
class IntentSignal:
    """Represents an intent signal detected from buyer behavior"""
    id: str
    deal_id: str
    persona_id: str | None
    signal_type: IntentSignalType
    signal_value: str  # positive, negative, neutral
    description: str
    evidence: str
    detected_at: datetime = field(default_factory=datetime.now)
    source: str = "manual"  # manual, email_analysis, meeting_notes, system


@dataclass
class DealIntent:
    """Complete intent analysis for a deal"""
    id: str
    deal_id: str
    deal_name: str
    deal_value: float
    deal_stage: str
    close_date: datetime | None

    # BANT Scores (each 0-25)
    bant_budget_score: int = 0
    bant_budget_evidence: str = ""
    bant_authority_score: int = 0
    bant_authority_evidence: str = ""
    bant_need_score: int = 0
    bant_need_evidence: str = ""
    bant_timeline_score: int = 0
    bant_timeline_evidence: str = ""

    # SPIN Analysis
    spin_situation: str = ""
    spin_situation_confidence: int = 0
    spin_problem: str = ""
    spin_problem_confidence: int = 0
    spin_implication: str = ""
    spin_implication_confidence: int = 0
    spin_need_payoff: str = ""
    spin_need_payoff_confidence: int = 0

    # Paranoid Twin
    paranoid_analysis: dict = field(default_factory=dict)
    paranoid_verdict: ParanoidVerdict = ParanoidVerdict.HOLD
    paranoid_failure_probability: int = 50
    paranoid_reviewed_at: datetime | None = None

    # Risk tracking
    total_risk_score: int = 50
    commit_ready: bool = False

    # Personas and risks (relationships)
    personas: list[BuyerPersona] = field(default_factory=list)
    risks: list[DealRisk] = field(default_factory=list)
    intent_signals: list[IntentSignal] = field(default_factory=list)

    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    @property
    def bant_total_score(self) -> int:
        """Calculate total BANT score (0-100)"""
        return (
            self.bant_budget_score +
            self.bant_authority_score +
            self.bant_need_score +
            self.bant_timeline_score
        )

    @property
    def spin_score(self) -> int:
        """Calculate SPIN score based on completeness and confidence"""
        if not any([self.spin_situation, self.spin_problem,
                    self.spin_implication, self.spin_need_payoff]):
            return 0

        # Weight by confidence
        total = 0
        count = 0
        if self.spin_situation:
            total += self.spin_situation_confidence
            count += 1
        if self.spin_problem:
            total += self.spin_problem_confidence
            count += 1
        if self.spin_implication:
            total += self.spin_implication_confidence
            count += 1
        if self.spin_need_payoff:
            total += self.spin_need_payoff_confidence
            count += 1

        return total // count if count > 0 else 0

    @property
    def commit_gate_status(self) -> dict:
        """Check commit stage gate requirements"""
        requirements = {
            "personas": {
                "economic_buyer": any(p.persona_type == PersonaType.ECONOMIC_BUYER
                                     and p.engagement_level == EngagementLevel.ENGAGED
                                     for p in self.personas),
                "champion": any(p.persona_type == PersonaType.CHAMPION for p in self.personas),
                "blockers_neutralized": not any(
                    p.persona_type == PersonaType.BLOCKER
                    and p.engagement_level == EngagementLevel.BLOCKING
                    for p in self.personas
                ),
            },
            "spin": {
                "situation": bool(self.spin_situation),
                "problem": bool(self.spin_problem),
                "implication": bool(self.spin_implication),
                "need_payoff": bool(self.spin_need_payoff),
                "score_threshold": self.spin_score >= 70,
            },
            "bant": {
                "score_threshold": self.bant_total_score >= 70,
            },
            "paranoid_twin": {
                "reviewed": self.paranoid_reviewed_at is not None,
                "no_critical_risks": not any(
                    r.severity == RiskSeverity.CRITICAL and r.status == RiskStatus.OPEN
                    for r in self.risks
                ),
                "risk_score_threshold": self.total_risk_score <= 30,
            },
        }

        # Determine blocking items
        blocking = []
        if not requirements["personas"]["blockers_neutralized"]:
            blocking.append("Blockers not neutralized")
        if not requirements["bant"]["score_threshold"]:
            blocking.append("BANT score below 70")
        if not requirements["paranoid_twin"]["no_critical_risks"]:
            blocking.append("Critical risks unaddressed")
        if not requirements["paranoid_twin"]["risk_score_threshold"]:
            blocking.append("Risk score above threshold")

        return {
            "requirements": requirements,
            "blocking_items": blocking,
            "passed": len(blocking) == 0,
        }
