"""
BANT Qualification Scoring System

Budget, Authority, Need, Timeline - each scored 0-25 points for 100 total.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .intent_types import (
    BANTCriterion,
    BANT_SCORING_RUBRIC,
    BuyerPersona,
    PersonaType,
    EngagementLevel,
)


@dataclass
class BANTCriterionScore:
    """Score for a single BANT criterion"""
    criterion: BANTCriterion
    score: int  # 0-25
    confidence: int  # 0-100
    evidence: list[str] = field(default_factory=list)
    gaps: list[str] = field(default_factory=list)
    rubric_match: str = ""


@dataclass
class BANTScore:
    """Complete BANT score for a deal"""
    deal_id: str
    budget: BANTCriterionScore
    authority: BANTCriterionScore
    need: BANTCriterionScore
    timeline: BANTCriterionScore
    total_score: int = 0
    interpretation: str = ""
    commit_ready: bool = False
    calculated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        self.total_score = (
            self.budget.score +
            self.authority.score +
            self.need.score +
            self.timeline.score
        )
        self._set_interpretation()

    def _set_interpretation(self):
        if self.total_score >= 90:
            self.interpretation = "Strong commit candidate"
            self.commit_ready = True
        elif self.total_score >= 70:
            self.interpretation = "Good opportunity, minor gaps"
            self.commit_ready = True
        elif self.total_score >= 50:
            self.interpretation = "Needs work before commit"
            self.commit_ready = False
        else:
            self.interpretation = "Not ready for commit stage"
            self.commit_ready = False

    def to_dict(self) -> dict:
        return {
            "deal_id": self.deal_id,
            "total_score": self.total_score,
            "interpretation": self.interpretation,
            "commit_ready": self.commit_ready,
            "budget": {
                "score": self.budget.score,
                "max": 25,
                "confidence": self.budget.confidence,
                "evidence": self.budget.evidence,
                "gaps": self.budget.gaps,
                "rubric_match": self.budget.rubric_match,
            },
            "authority": {
                "score": self.authority.score,
                "max": 25,
                "confidence": self.authority.confidence,
                "evidence": self.authority.evidence,
                "gaps": self.authority.gaps,
                "rubric_match": self.authority.rubric_match,
            },
            "need": {
                "score": self.need.score,
                "max": 25,
                "confidence": self.need.confidence,
                "evidence": self.need.evidence,
                "gaps": self.need.gaps,
                "rubric_match": self.need.rubric_match,
            },
            "timeline": {
                "score": self.timeline.score,
                "max": 25,
                "confidence": self.timeline.confidence,
                "evidence": self.timeline.evidence,
                "gaps": self.timeline.gaps,
                "rubric_match": self.timeline.rubric_match,
            },
            "calculated_at": self.calculated_at.isoformat(),
        }


class BANTScorer:
    """
    BANT Qualification Scoring Engine

    Scores deals on Budget, Authority, Need, Timeline criteria.
    Each criterion is scored 0-25 points based on evidence and engagement.
    """

    def __init__(self):
        self.rubric = BANT_SCORING_RUBRIC

    def score_deal(
        self,
        deal_id: str,
        personas: list[BuyerPersona],
        deal_data: dict,
    ) -> BANTScore:
        """
        Score a deal on all BANT criteria.

        Args:
            deal_id: The deal identifier
            personas: List of buyer personas identified
            deal_data: Deal metadata including budget, timeline, etc.

        Returns:
            Complete BANTScore with all criteria
        """
        budget_score = self._score_budget(deal_data, personas)
        authority_score = self._score_authority(personas)
        need_score = self._score_need(deal_data)
        timeline_score = self._score_timeline(deal_data)

        return BANTScore(
            deal_id=deal_id,
            budget=budget_score,
            authority=authority_score,
            need=need_score,
            timeline=timeline_score,
        )

    def _score_budget(
        self,
        deal_data: dict,
        personas: list[BuyerPersona],
    ) -> BANTCriterionScore:
        """Score Budget criterion (0-25)"""
        evidence = []
        gaps = []
        score = 0
        confidence = 50

        # Check for budget confirmation
        budget_confirmed = deal_data.get("budget_confirmed", False)
        budget_amount = deal_data.get("budget_amount")
        po_ready = deal_data.get("po_ready", False)
        approval_process_clear = deal_data.get("budget_approval_process_clear", False)

        # Find economic buyer
        economic_buyer = next(
            (p for p in personas if p.persona_type == PersonaType.ECONOMIC_BUYER),
            None
        )

        if po_ready and budget_confirmed:
            score = 25
            evidence.append("Budget confirmed, PO ready")
            confidence = 95
        elif budget_confirmed and approval_process_clear:
            score = 20
            evidence.append("Budget exists, approval process clear")
            if economic_buyer and economic_buyer.engagement_level == EngagementLevel.ENGAGED:
                evidence.append(f"CFO/Finance ({economic_buyer.contact_name}) engaged")
                confidence = 85
            else:
                confidence = 75
        elif budget_confirmed:
            score = 15
            evidence.append("Budget likely")
            gaps.append("Approval process not fully mapped")
            confidence = 65
        elif budget_amount:
            score = 10
            evidence.append(f"Budget possible: {budget_amount}")
            gaps.append("Budget not confirmed")
            confidence = 50
        elif economic_buyer:
            score = 5
            evidence.append(f"Economic buyer identified: {economic_buyer.contact_name}")
            gaps.append("Budget uncertain")
            confidence = 35
        else:
            score = 0
            gaps.append("No budget identified")
            gaps.append("No economic buyer engaged")
            confidence = 20

        # Get rubric match
        rubric_match = self._get_rubric_match(BANTCriterion.BUDGET, score)

        return BANTCriterionScore(
            criterion=BANTCriterion.BUDGET,
            score=score,
            confidence=confidence,
            evidence=evidence,
            gaps=gaps,
            rubric_match=rubric_match,
        )

    def _score_authority(self, personas: list[BuyerPersona]) -> BANTCriterionScore:
        """Score Authority criterion (0-25)"""
        evidence = []
        gaps = []
        score = 0
        confidence = 50

        # Identify key personas
        economic_buyer = next(
            (p for p in personas if p.persona_type == PersonaType.ECONOMIC_BUYER),
            None
        )
        champion = next(
            (p for p in personas if p.persona_type == PersonaType.CHAMPION),
            None
        )
        blockers = [p for p in personas if p.persona_type == PersonaType.BLOCKER]
        active_blockers = [
            p for p in blockers
            if p.engagement_level == EngagementLevel.BLOCKING
        ]

        # Score based on decision-maker access and blocker status
        if economic_buyer and economic_buyer.engagement_level == EngagementLevel.ENGAGED:
            if not active_blockers:
                score = 25
                evidence.append(f"Decision-maker ({economic_buyer.contact_name}) engaged")
                evidence.append("No active blockers")
                confidence = 90
            else:
                score = 20
                evidence.append(f"Decision-maker ({economic_buyer.contact_name}) engaged")
                gaps.append(f"Active blocker: {active_blockers[0].contact_name}")
                confidence = 72
        elif economic_buyer:
            score = 15
            evidence.append(f"Decision-maker identified: {economic_buyer.contact_name}")
            gaps.append("Limited engagement with decision-maker")
            confidence = 60
        elif champion:
            score = 10
            evidence.append(f"Working with influencer: {champion.contact_name}")
            gaps.append("Decision-maker unclear or not engaged")
            confidence = 45
        elif personas:
            score = 5
            evidence.append(f"{len(personas)} contacts identified")
            gaps.append("No access to decision-maker")
            confidence = 30
        else:
            score = 0
            gaps.append("Don't know who decides")
            confidence = 15

        # Additional penalty for unengaged blockers
        for blocker in blockers:
            if blocker.engagement_level in [EngagementLevel.BLOCKING, EngagementLevel.SILENT]:
                if blocker.can_veto:
                    gaps.append(f"Blocker with veto power: {blocker.contact_name}")
                    score = max(0, score - 5)

        rubric_match = self._get_rubric_match(BANTCriterion.AUTHORITY, score)

        return BANTCriterionScore(
            criterion=BANTCriterion.AUTHORITY,
            score=min(25, max(0, score)),
            confidence=confidence,
            evidence=evidence,
            gaps=gaps,
            rubric_match=rubric_match,
        )

    def _score_need(self, deal_data: dict) -> BANTCriterionScore:
        """Score Need criterion (0-25)"""
        evidence = []
        gaps = []
        score = 0
        confidence = 50

        need_critical = deal_data.get("need_critical", False)
        need_quantified = deal_data.get("need_quantified", False)
        need_urgent = deal_data.get("need_urgent", False)
        need_description = deal_data.get("need_description", "")
        personal_stakes = deal_data.get("personal_stakes", [])

        if need_critical and need_quantified and need_urgent:
            score = 25
            evidence.append("Critical, quantified, urgent need")
            if need_description:
                evidence.append(need_description)
            if personal_stakes:
                evidence.extend([f"Personal stake: {s}" for s in personal_stakes[:2]])
            confidence = 96
        elif need_critical and (need_quantified or need_urgent):
            score = 20
            evidence.append("Strong need")
            if need_quantified:
                evidence.append("Need quantified")
            if need_urgent:
                evidence.append("Need is urgent")
            if not need_quantified:
                gaps.append("Need not fully quantified")
            confidence = 82
        elif need_critical or need_quantified:
            score = 15
            evidence.append("Clear need identified")
            if not need_quantified:
                gaps.append("Need not fully quantified")
            if not need_urgent:
                gaps.append("Urgency not established")
            confidence = 68
        elif need_description:
            score = 10
            evidence.append(f"Need exists: {need_description[:100]}")
            gaps.append("Not urgent")
            confidence = 50
        else:
            score = 5
            gaps.append("Vague or assumed need")
            confidence = 30

        rubric_match = self._get_rubric_match(BANTCriterion.NEED, score)

        return BANTCriterionScore(
            criterion=BANTCriterion.NEED,
            score=score,
            confidence=confidence,
            evidence=evidence,
            gaps=gaps,
            rubric_match=rubric_match,
        )

    def _score_timeline(self, deal_data: dict) -> BANTCriterionScore:
        """Score Timeline criterion (0-25)"""
        evidence = []
        gaps = []
        score = 0
        confidence = 50

        close_date = deal_data.get("close_date")
        deadline_hard = deal_data.get("deadline_hard", False)
        deadline_event_driven = deal_data.get("deadline_event_driven", False)
        deadline_driver = deal_data.get("deadline_driver", "")
        timeline_slipped = deal_data.get("timeline_slipped", False)
        original_close_date = deal_data.get("original_close_date")

        if deadline_hard and deadline_event_driven:
            score = 25
            evidence.append("Hard deadline, event-driven")
            if deadline_driver:
                evidence.append(f"Driver: {deadline_driver}")
            confidence = 95
        elif close_date and (deadline_hard or deadline_event_driven):
            score = 20
            evidence.append(f"Clear deadline: {close_date}")
            if deadline_driver:
                evidence.append(f"Driver: {deadline_driver}")
            confidence = 80
        elif close_date:
            score = 15
            evidence.append(f"Target date: {close_date}")
            gaps.append("Some flexibility in timeline")
            confidence = 65

        # Penalize timeline slippage
        if timeline_slipped:
            score = max(0, score - 5)
            gaps.append(f"Timeline slipped from {original_close_date}")
            gaps.append("Risk of further slippage")
            confidence = max(30, confidence - 15)

        if score == 0:
            if deal_data.get("timeline_vague"):
                score = 10
                gaps.append("Vague timeline")
                confidence = 40
            else:
                score = 5
                gaps.append("No urgency")
                confidence = 25

        rubric_match = self._get_rubric_match(BANTCriterion.TIMELINE, score)

        return BANTCriterionScore(
            criterion=BANTCriterion.TIMELINE,
            score=min(25, max(0, score)),
            confidence=confidence,
            evidence=evidence,
            gaps=gaps,
            rubric_match=rubric_match,
        )

    def _get_rubric_match(self, criterion: BANTCriterion, score: int) -> str:
        """Get the rubric description matching the score"""
        rubric = self.rubric[criterion]
        # Find the closest score level
        score_levels = sorted(rubric.keys(), reverse=True)
        for level in score_levels:
            if score >= level:
                return rubric[level]
        return rubric[0]

    def get_scoring_suggestions(self, bant_score: BANTScore) -> list[dict]:
        """Generate suggestions to improve BANT score"""
        suggestions = []

        # Budget suggestions
        if bant_score.budget.score < 20:
            suggestions.append({
                "criterion": "Budget",
                "current_score": bant_score.budget.score,
                "suggestion": "Confirm budget with economic buyer and map approval process",
                "potential_gain": 20 - bant_score.budget.score,
            })

        # Authority suggestions
        if bant_score.authority.score < 20:
            if bant_score.authority.gaps:
                if any("blocker" in g.lower() for g in bant_score.authority.gaps):
                    suggestions.append({
                        "criterion": "Authority",
                        "current_score": bant_score.authority.score,
                        "suggestion": "Neutralize or address blockers before proceeding",
                        "potential_gain": 25 - bant_score.authority.score,
                    })
                else:
                    suggestions.append({
                        "criterion": "Authority",
                        "current_score": bant_score.authority.score,
                        "suggestion": "Engage directly with decision-maker",
                        "potential_gain": 20 - bant_score.authority.score,
                    })

        # Need suggestions
        if bant_score.need.score < 20:
            suggestions.append({
                "criterion": "Need",
                "current_score": bant_score.need.score,
                "suggestion": "Quantify the need and establish urgency with concrete metrics",
                "potential_gain": 20 - bant_score.need.score,
            })

        # Timeline suggestions
        if bant_score.timeline.score < 20:
            suggestions.append({
                "criterion": "Timeline",
                "current_score": bant_score.timeline.score,
                "suggestion": "Confirm hard deadline and identify event-driven drivers",
                "potential_gain": 20 - bant_score.timeline.score,
            })

        return suggestions
