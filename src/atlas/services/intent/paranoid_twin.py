"""
Paranoid Twin AI - Devil's Advocate Risk Analyzer

The Paranoid Twin actively looks for reasons a deal will fail.
Mindset: "This deal will fail unless proven otherwise."
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from .intent_types import (
    BuyerPersona,
    DealRisk,
    PersonaType,
    EngagementLevel,
    RiskSeverity,
    RiskCategory,
    RiskStatus,
    ParanoidVerdict,
    PARANOID_TRIGGERS,
    RISK_CATEGORY_DEFINITIONS,
)


@dataclass
class ParanoidRisk:
    """A risk identified by the Paranoid Twin"""
    id: str
    title: str
    description: str
    category: RiskCategory
    severity: RiskSeverity
    probability: int  # 0-100
    why_kills_deal: str
    counter_evidence_needed: list[str]
    questions_to_ask: list[str]


@dataclass
class ParanoidAnalysis:
    """Complete Paranoid Twin analysis"""
    deal_id: str
    deal_name: str
    deal_value: float
    deal_stage: str
    bant_score: int
    spin_score: int

    critical_risks: list[ParanoidRisk] = field(default_factory=list)
    significant_risks: list[ParanoidRisk] = field(default_factory=list)
    mitigated_risks: list[str] = field(default_factory=list)

    verdict: ParanoidVerdict = ParanoidVerdict.HOLD
    failure_probability: int = 50
    recommendation: str = ""

    analyzed_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "deal_id": self.deal_id,
            "deal_name": self.deal_name,
            "deal_value": self.deal_value,
            "deal_stage": self.deal_stage,
            "bant_score": self.bant_score,
            "spin_score": self.spin_score,
            "critical_risks": [
                {
                    "id": r.id,
                    "title": r.title,
                    "description": r.description,
                    "category": r.category.value,
                    "severity": r.severity.value,
                    "probability": r.probability,
                    "why_kills_deal": r.why_kills_deal,
                    "counter_evidence_needed": r.counter_evidence_needed,
                    "questions_to_ask": r.questions_to_ask,
                }
                for r in self.critical_risks
            ],
            "significant_risks": [
                {
                    "id": r.id,
                    "title": r.title,
                    "description": r.description,
                    "category": r.category.value,
                    "severity": r.severity.value,
                    "probability": r.probability,
                    "why_kills_deal": r.why_kills_deal,
                    "counter_evidence_needed": r.counter_evidence_needed,
                    "questions_to_ask": r.questions_to_ask,
                }
                for r in self.significant_risks
            ],
            "mitigated_risks": self.mitigated_risks,
            "verdict": self.verdict.value,
            "failure_probability": self.failure_probability,
            "recommendation": self.recommendation,
            "analyzed_at": self.analyzed_at.isoformat(),
        }


class ParanoidTwin:
    """
    Paranoid Twin AI Risk Analyzer

    The paranoid twin takes the opposite view on every deal.
    While the buyer naturally advocates for the deal, the paranoid
    twin actively seeks reasons it will fail.

    Core Philosophy: "This deal will fail unless proven otherwise."
    """

    def __init__(self):
        self.triggers = PARANOID_TRIGGERS
        self.risk_definitions = RISK_CATEGORY_DEFINITIONS

    def analyze(
        self,
        deal_id: str,
        deal_name: str,
        deal_value: float,
        deal_stage: str,
        close_date: datetime | None,
        bant_score: int,
        spin_score: int,
        personas: list[BuyerPersona],
        deal_data: dict,
        existing_risks: list[DealRisk] | None = None,
    ) -> ParanoidAnalysis:
        """
        Perform Paranoid Twin analysis on a deal.

        Args:
            deal_id: Deal identifier
            deal_name: Name of the deal
            deal_value: Deal value in currency
            deal_stage: Current stage (discovery, qualification, proposal, negotiation, commit)
            close_date: Expected close date
            bant_score: Current BANT score (0-100)
            spin_score: Current SPIN score (0-100)
            personas: List of identified buyer personas
            deal_data: Additional deal metadata
            existing_risks: Previously identified risks

        Returns:
            Complete ParanoidAnalysis with risks and verdict
        """
        analysis = ParanoidAnalysis(
            deal_id=deal_id,
            deal_name=deal_name,
            deal_value=deal_value,
            deal_stage=deal_stage,
            bant_score=bant_score,
            spin_score=spin_score,
        )

        # Run all risk checks
        self._check_authority_risks(analysis, personas, deal_data)
        self._check_blocker_risks(analysis, personas)
        self._check_timeline_risks(analysis, deal_data, close_date)
        self._check_competitive_risks(analysis, deal_data)
        self._check_champion_risks(analysis, personas)
        self._check_engagement_risks(analysis, personas, deal_data)
        self._check_qualification_risks(analysis, bant_score, spin_score)
        self._check_close_date_risks(analysis, close_date, deal_stage)

        # Check for mitigated risks
        if existing_risks:
            for risk in existing_risks:
                if risk.status in [RiskStatus.MITIGATED, RiskStatus.ACCEPTED]:
                    analysis.mitigated_risks.append(
                        f"{risk.title} — {risk.status.value}"
                    )

        # Calculate overall failure probability
        analysis.failure_probability = self._calculate_failure_probability(analysis)

        # Determine verdict
        analysis.verdict = self._determine_verdict(analysis)

        # Generate recommendation
        analysis.recommendation = self._generate_recommendation(analysis)

        return analysis

    def _check_authority_risks(
        self,
        analysis: ParanoidAnalysis,
        personas: list[BuyerPersona],
        deal_data: dict,
    ):
        """Check for authority-related risks"""
        economic_buyer = next(
            (p for p in personas if p.persona_type == PersonaType.ECONOMIC_BUYER),
            None
        )

        if not economic_buyer:
            analysis.critical_risks.append(ParanoidRisk(
                id=str(uuid.uuid4()),
                title="No Economic Buyer Identified",
                description="We haven't identified who controls the budget and has authority to approve this deal.",
                category=RiskCategory.AUTHORITY_GAPS,
                severity=RiskSeverity.CRITICAL,
                probability=70,
                why_kills_deal="Without an economic buyer, we don't know if budget exists or who can sign off.",
                counter_evidence_needed=[
                    "Identify the CFO or finance authority",
                    "Confirm budget approval process",
                ],
                questions_to_ask=[
                    "Who needs to approve this deal financially?",
                    "What is the budget approval process?",
                ],
            ))
        elif economic_buyer.engagement_level == EngagementLevel.SILENT:
            days_silent = 0
            if economic_buyer.last_engagement_date:
                days_silent = (datetime.now() - economic_buyer.last_engagement_date).days

            if days_silent >= 5:
                analysis.critical_risks.append(ParanoidRisk(
                    id=str(uuid.uuid4()),
                    title=f"CFO Has Gone Silent ({days_silent} days)",
                    description=f"{economic_buyer.contact_name} ({economic_buyer.contact_title}) hasn't engaged in {days_silent} days. We're relying on intermediaries.",
                    category=RiskCategory.AUTHORITY_GAPS,
                    severity=RiskSeverity.CRITICAL,
                    probability=35,
                    why_kills_deal="Economic buyers who go silent often have competing priorities or have been overruled internally.",
                    counter_evidence_needed=[
                        f"Direct email/call with {economic_buyer.contact_name} confirming commitment",
                        f"Calendar invite for contract signing with {economic_buyer.contact_name} attending",
                        "Champion confirming they spoke with economic buyer in last 48 hours",
                    ],
                    questions_to_ask=[
                        f"When did you last speak with {economic_buyer.contact_name}?",
                        "Is there anything holding up the budget approval?",
                    ],
                ))

    def _check_blocker_risks(
        self,
        analysis: ParanoidAnalysis,
        personas: list[BuyerPersona],
    ):
        """Check for blocker-related risks"""
        blockers = [p for p in personas if p.persona_type == PersonaType.BLOCKER]

        for blocker in blockers:
            if blocker.engagement_level == EngagementLevel.BLOCKING:
                probability = 60 if blocker.can_veto else 40

                analysis.critical_risks.append(ParanoidRisk(
                    id=str(uuid.uuid4()),
                    title=f"The Blocker is Still Blocking",
                    description=f"{blocker.contact_name} ({blocker.contact_title}) has not been neutralized. {'They have veto power.' if blocker.can_veto else ''}",
                    category=RiskCategory.BLOCKER_POWER,
                    severity=RiskSeverity.CRITICAL,
                    probability=probability,
                    why_kills_deal=f"{'Marketing/Brand teams' if 'marketing' in blocker.contact_title.lower() else 'Stakeholders'} often block discount channels at the last minute. {blocker.contact_name} hasn't engaged once.",
                    counter_evidence_needed=[
                        f"Direct confirmation from {blocker.contact_name} or their team",
                        "Written approval of brand guidelines",
                        f"Champion confirming {blocker.contact_name} has been overruled",
                    ],
                    questions_to_ask=[
                        f"Has {blocker.contact_name} approved this deal?",
                        f"What are {blocker.contact_name}'s concerns?",
                        f"Can {blocker.contact_name} actually block this?",
                    ],
                ))
            elif blocker.engagement_level == EngagementLevel.SILENT:
                analysis.significant_risks.append(ParanoidRisk(
                    id=str(uuid.uuid4()),
                    title=f"Blocker Identified But Not Engaged",
                    description=f"{blocker.contact_name} ({blocker.contact_title}) is identified as a potential blocker but hasn't been engaged.",
                    category=RiskCategory.BLOCKER_POWER,
                    severity=RiskSeverity.MEDIUM,
                    probability=30,
                    why_kills_deal="Unengaged blockers can surface objections late in the process.",
                    counter_evidence_needed=[
                        f"Meeting with {blocker.contact_name} scheduled",
                        "Understanding of their concerns documented",
                    ],
                    questions_to_ask=[
                        f"What does {blocker.contact_name} think about this deal?",
                        "Should we proactively address their concerns?",
                    ],
                ))

    def _check_timeline_risks(
        self,
        analysis: ParanoidAnalysis,
        deal_data: dict,
        close_date: datetime | None,
    ):
        """Check for timeline-related risks"""
        if deal_data.get("timeline_slipped"):
            original_date = deal_data.get("original_close_date")
            analysis.significant_risks.append(ParanoidRisk(
                id=str(uuid.uuid4()),
                title="Timeline Already Slipped Once",
                description=f"Original close date was {original_date}. Now {close_date.strftime('%b %d') if close_date else 'unknown'}. What changed?",
                category=RiskCategory.TIMELINE_SLIPPAGE,
                severity=RiskSeverity.MEDIUM,
                probability=40,
                why_kills_deal="Timeline slippage is often a signal of internal friction or deprioritization. If it slipped once, it can slip again.",
                counter_evidence_needed=[
                    "Explanation for the timeline change",
                    "Confirmation new date is firm",
                ],
                questions_to_ask=[
                    "What caused the timeline to move?",
                    "Is the new date firm, or could it slip further?",
                    "What happens if we miss this date?",
                ],
            ))

    def _check_competitive_risks(
        self,
        analysis: ParanoidAnalysis,
        deal_data: dict,
    ):
        """Check for competitive risks"""
        if deal_data.get("competitor_mentioned"):
            competitors = deal_data.get("competitors", ["other players"])
            analysis.significant_risks.append(ParanoidRisk(
                id=str(uuid.uuid4()),
                title="Competitor May Be Circling",
                description=f"Deal signal may be public. {', '.join(competitors)} likely aware. No confirmation we're exclusive or preferred.",
                category=RiskCategory.COMPETITIVE_THREAT,
                severity=RiskSeverity.MEDIUM,
                probability=25,
                why_kills_deal="Supplier may be running a competitive process. Champion's enthusiasm could be sales technique to get best price.",
                counter_evidence_needed=[
                    "Confirmation we are preferred partner",
                    "Understanding of competitive position",
                    "Exclusive or first-right agreement",
                ],
                questions_to_ask=[
                    "Are you talking to other partners for this?",
                    "What would make us your first choice?",
                    "Is there an incumbent we need to displace?",
                ],
            ))

    def _check_champion_risks(
        self,
        analysis: ParanoidAnalysis,
        personas: list[BuyerPersona],
    ):
        """Check for champion-related risks"""
        champion = next(
            (p for p in personas if p.persona_type == PersonaType.CHAMPION),
            None
        )

        # Check if champion is only contact
        engaged_personas = [
            p for p in personas
            if p.engagement_level == EngagementLevel.ENGAGED
            and p.persona_type != PersonaType.GATEKEEPER
        ]

        if champion and len(engaged_personas) == 1 and engaged_personas[0] == champion:
            analysis.significant_risks.append(ParanoidRisk(
                id=str(uuid.uuid4()),
                title="Single Point of Contact Risk",
                description=f"All communication goes through {champion.contact_name}. No direct engagement with other stakeholders.",
                category=RiskCategory.CHAMPION_WEAKNESS,
                severity=RiskSeverity.MEDIUM,
                probability=25,
                why_kills_deal=f"If {champion.contact_name} gets sick, goes on vacation, or loses influence, the deal stalls. We also only have their perspective on internal dynamics.",
                counter_evidence_needed=[
                    "Direct engagement with economic buyer",
                    "Meeting with technical buyer",
                    "Multiple stakeholder buy-in",
                ],
                questions_to_ask=[
                    "Can we meet with other stakeholders directly?",
                    "Who else needs to be involved in this decision?",
                ],
            ))

    def _check_engagement_risks(
        self,
        analysis: ParanoidAnalysis,
        personas: list[BuyerPersona],
        deal_data: dict,
    ):
        """Check for engagement pattern risks"""
        # Check for declining response times
        for persona in personas:
            if persona.persona_type in [PersonaType.ECONOMIC_BUYER, PersonaType.CHAMPION]:
                if persona.response_time_avg_hours and persona.response_time_avg_hours > 72:
                    analysis.significant_risks.append(ParanoidRisk(
                        id=str(uuid.uuid4()),
                        title=f"Response Time Deteriorating",
                        description=f"{persona.contact_name}'s average response time is {persona.response_time_avg_hours} hours. This may indicate declining priority.",
                        category=RiskCategory.HIDDEN_AGENDA,
                        severity=RiskSeverity.MEDIUM,
                        probability=20,
                        why_kills_deal="Slowing response times often precede deal stalls or losses.",
                        counter_evidence_needed=[
                            "Explanation for slower responses",
                            "Reconfirmation of timeline commitment",
                        ],
                        questions_to_ask=[
                            "Is everything still on track?",
                            "Has anything changed on your end?",
                        ],
                    ))

    def _check_qualification_risks(
        self,
        analysis: ParanoidAnalysis,
        bant_score: int,
        spin_score: int,
    ):
        """Check for qualification-related risks"""
        if analysis.deal_stage in ["commit", "negotiation"] and bant_score < 70:
            analysis.critical_risks.append(ParanoidRisk(
                id=str(uuid.uuid4()),
                title="BANT Score Below Threshold for Stage",
                description=f"BANT score is {bant_score}/100 but deal is in {analysis.deal_stage} stage. Minimum 70 required.",
                category=RiskCategory.NEED_INFLATION,
                severity=RiskSeverity.CRITICAL,
                probability=45,
                why_kills_deal="Deals with low qualification scores in late stages have high failure rates.",
                counter_evidence_needed=[
                    "Improved BANT scores with evidence",
                    "Clear explanation why qualification is stronger than score suggests",
                ],
                questions_to_ask=[
                    "What evidence do we have for budget?",
                    "Have we confirmed authority and timeline?",
                ],
            ))

    def _check_close_date_risks(
        self,
        analysis: ParanoidAnalysis,
        close_date: datetime | None,
        deal_stage: str,
    ):
        """Check for risks related to approaching close date"""
        if close_date:
            days_to_close = (close_date - datetime.now()).days

            if days_to_close <= 7 and deal_stage == "commit":
                if analysis.critical_risks:
                    analysis.critical_risks.insert(0, ParanoidRisk(
                        id=str(uuid.uuid4()),
                        title="Critical Risks Unresolved Before Commit",
                        description=f"Close date is in {days_to_close} days but {len(analysis.critical_risks)} critical risks remain unaddressed.",
                        category=RiskCategory.AUTHORITY_GAPS,
                        severity=RiskSeverity.CRITICAL,
                        probability=50,
                        why_kills_deal="Rushing to close with unresolved critical risks leads to last-minute failures.",
                        counter_evidence_needed=[
                            "All critical risks addressed or formally accepted",
                            "Contingency plan if risks materialize",
                        ],
                        questions_to_ask=[
                            "Can we address these risks in time?",
                            "Should we delay close to de-risk?",
                        ],
                    ))

    def _calculate_failure_probability(self, analysis: ParanoidAnalysis) -> int:
        """Calculate overall probability of deal failure"""
        if not analysis.critical_risks and not analysis.significant_risks:
            return 10  # Always some uncertainty

        # Weight critical risks more heavily
        critical_prob = 0
        for risk in analysis.critical_risks:
            # Use a combining formula (not simple addition)
            critical_prob = critical_prob + risk.probability * (1 - critical_prob / 100)

        significant_prob = 0
        for risk in analysis.significant_risks:
            significant_prob = significant_prob + risk.probability * 0.5 * (1 - significant_prob / 100)

        # Combine probabilities
        total_prob = critical_prob + significant_prob * (1 - critical_prob / 100)

        # Cap at 85% (never 100% certain of failure)
        return min(85, max(10, int(total_prob)))

    def _determine_verdict(self, analysis: ParanoidAnalysis) -> ParanoidVerdict:
        """Determine the Paranoid Twin verdict"""
        if len(analysis.critical_risks) >= 2:
            return ParanoidVerdict.BLOCK
        elif len(analysis.critical_risks) >= 1:
            return ParanoidVerdict.HOLD
        elif analysis.failure_probability > 40:
            return ParanoidVerdict.HOLD
        elif len(analysis.significant_risks) >= 3:
            return ParanoidVerdict.HOLD
        else:
            return ParanoidVerdict.READY

    def _generate_recommendation(self, analysis: ParanoidAnalysis) -> str:
        """Generate actionable recommendation"""
        if analysis.verdict == ParanoidVerdict.READY:
            return f"Deal can proceed to commit. {len(analysis.mitigated_risks)} risks mitigated. Monitor {len(analysis.significant_risks)} remaining risks."

        if analysis.verdict == ParanoidVerdict.BLOCK:
            risk_titles = [r.title for r in analysis.critical_risks[:2]]
            return f"NOT READY FOR COMMIT. {len(analysis.critical_risks)} critical risks: {', '.join(risk_titles)}. Combined failure probability: {analysis.failure_probability}%. Return to negotiation stage and address risks."

        # HOLD verdict
        if analysis.critical_risks:
            top_risk = analysis.critical_risks[0]
            return f"Delay commit by 3-5 days to address: {top_risk.title}. Get: {', '.join(top_risk.counter_evidence_needed[:2])}."

        return f"Review {len(analysis.significant_risks)} significant risks before proceeding. Failure probability: {analysis.failure_probability}%."

    def convert_to_deal_risks(self, analysis: ParanoidAnalysis) -> list[DealRisk]:
        """Convert ParanoidRisks to DealRisk objects for the risk register"""
        deal_risks = []

        for paranoid_risk in analysis.critical_risks + analysis.significant_risks:
            deal_risk = DealRisk(
                id=paranoid_risk.id,
                deal_id=analysis.deal_id,
                title=paranoid_risk.title,
                description=paranoid_risk.description,
                category=paranoid_risk.category,
                severity=paranoid_risk.severity,
                probability=paranoid_risk.probability,
                impact=paranoid_risk.why_kills_deal,
                source="paranoid_twin",
                status=RiskStatus.OPEN,
                counter_evidence_needed=paranoid_risk.counter_evidence_needed,
            )
            deal_risks.append(deal_risk)

        return deal_risks
