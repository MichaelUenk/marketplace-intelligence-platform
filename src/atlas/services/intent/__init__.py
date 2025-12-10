"""
iBood Intent Analysis - Deal Qualification & Risk Assessment

Core Components:
- Buyer Persona Mapping (Economic, Technical, User, Champion, Blocker, Gatekeeper)
- SPIN Analysis (Situation, Problem, Implication, Need-Payoff)
- BANT Qualification (Budget, Authority, Need, Timeline - each 0-25 points)
- Paranoid Twin AI (Devil's advocate risk analyzer)
- Risk Register with mitigation tracking
"""

from .intent_types import (
    PersonaType,
    EngagementLevel,
    BANTCriterion,
    RiskSeverity,
    RiskCategory,
    RiskStatus,
    ParanoidVerdict,
    IntentSignalType,
)
from .bant_scorer import BANTScorer, BANTScore
from .spin_analyzer import SPINAnalyzer, SPINAnalysis
from .paranoid_twin import ParanoidTwin, ParanoidAnalysis
from .intent_engine import IntentEngine

__all__ = [
    # Types
    "PersonaType",
    "EngagementLevel",
    "BANTCriterion",
    "RiskSeverity",
    "RiskCategory",
    "RiskStatus",
    "ParanoidVerdict",
    "IntentSignalType",
    # Components
    "BANTScorer",
    "BANTScore",
    "SPINAnalyzer",
    "SPINAnalysis",
    "ParanoidTwin",
    "ParanoidAnalysis",
    "IntentEngine",
]
