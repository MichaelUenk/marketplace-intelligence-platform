"""
Intent Analysis Engine

Central orchestrator for intent analysis, combining:
- Buyer Persona Mapping
- BANT Scoring
- SPIN Analysis
- Paranoid Twin Risk Assessment
- Risk Register Management
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .intent_types import (
    BuyerPersona,
    DealIntent,
    DealRisk,
    IntentSignal,
    PersonaType,
    EngagementLevel,
    RiskSeverity,
    RiskStatus,
    ParanoidVerdict,
    IntentSignalType,
    PERSONA_DEFINITIONS,
)
from .bant_scorer import BANTScorer, BANTScore
from .spin_analyzer import SPINAnalyzer, SPINAnalysis
from .paranoid_twin import ParanoidTwin, ParanoidAnalysis


@dataclass
class RiskMitigationAction:
    """Action item for risk mitigation"""
    id: str
    description: str
    due_date: datetime | None
    status: str  # pending, in_progress, done, contingency
    owner: str | None = None


@dataclass
class CommitGateResult:
    """Result of commit stage gate check"""
    passed: bool
    blocking_items: list[str]
    warning_items: list[str]
    requirements: dict
    recommendation: str


class IntentEngine:
    """
    Intent Analysis Engine

    Orchestrates all intent analysis components:
    1. Buyer Persona Management
    2. BANT Qualification Scoring
    3. SPIN Analysis
    4. Paranoid Twin Risk Assessment
    5. Risk Register & Mitigation
    6. Commit Stage Gate
    """

    def __init__(self):
        self.bant_scorer = BANTScorer()
        self.spin_analyzer = SPINAnalyzer()
        self.paranoid_twin = ParanoidTwin()

        # In-memory storage (in production, use database)
        self._intents: dict[str, DealIntent] = {}
        self._personas: dict[str, BuyerPersona] = {}
        self._risks: dict[str, DealRisk] = {}

    # =========================================================================
    # DEAL INTENT MANAGEMENT
    # =========================================================================

    def create_deal_intent(
        self,
        deal_id: str,
        deal_name: str,
        deal_value: float,
        deal_stage: str,
        close_date: datetime | None = None,
    ) -> DealIntent:
        """Create a new deal intent analysis"""
        intent = DealIntent(
            id=str(uuid.uuid4()),
            deal_id=deal_id,
            deal_name=deal_name,
            deal_value=deal_value,
            deal_stage=deal_stage,
            close_date=close_date,
        )
        self._intents[deal_id] = intent
        return intent

    def get_deal_intent(self, deal_id: str) -> DealIntent | None:
        """Get deal intent by deal ID"""
        return self._intents.get(deal_id)

    def update_deal_intent(
        self,
        deal_id: str,
        updates: dict,
    ) -> DealIntent | None:
        """Update deal intent with new data"""
        intent = self._intents.get(deal_id)
        if not intent:
            return None

        for key, value in updates.items():
            if hasattr(intent, key):
                setattr(intent, key, value)

        intent.updated_at = datetime.now()
        return intent

    # =========================================================================
    # BUYER PERSONA MANAGEMENT
    # =========================================================================

    def add_persona(
        self,
        deal_id: str,
        contact_name: str,
        contact_title: str,
        persona_type: PersonaType,
        contact_email: str | None = None,
        contact_id: str | None = None,
        engagement_level: EngagementLevel = EngagementLevel.UNKNOWN,
        influence_score: int = 50,
        can_veto: bool = False,
        can_approve: bool = False,
        motivations: list[str] | None = None,
        concerns: list[str] | None = None,
    ) -> BuyerPersona:
        """Add a buyer persona to a deal"""
        persona = BuyerPersona(
            id=str(uuid.uuid4()),
            deal_id=deal_id,
            contact_id=contact_id,
            contact_name=contact_name,
            contact_title=contact_title,
            contact_email=contact_email,
            persona_type=persona_type,
            engagement_level=engagement_level,
            influence_score=influence_score,
            can_veto=can_veto,
            can_approve=can_approve,
            motivations=motivations or [],
            concerns=concerns or [],
        )

        self._personas[persona.id] = persona

        # Add to deal intent if exists
        intent = self._intents.get(deal_id)
        if intent:
            intent.personas.append(persona)
            intent.updated_at = datetime.now()

        return persona

    def update_persona(
        self,
        persona_id: str,
        updates: dict,
    ) -> BuyerPersona | None:
        """Update a buyer persona"""
        persona = self._personas.get(persona_id)
        if not persona:
            return None

        for key, value in updates.items():
            if hasattr(persona, key):
                setattr(persona, key, value)

        persona.updated_at = datetime.now()
        return persona

    def record_persona_engagement(
        self,
        persona_id: str,
        engagement_type: str,
        notes: str | None = None,
    ) -> BuyerPersona | None:
        """Record an engagement with a persona"""
        persona = self._personas.get(persona_id)
        if not persona:
            return None

        persona.last_engagement_date = datetime.now()
        if engagement_type == "positive":
            persona.engagement_level = EngagementLevel.ENGAGED
        elif engagement_type == "concerning":
            persona.engagement_level = EngagementLevel.CAUTIOUS

        persona.updated_at = datetime.now()
        return persona

    def get_personas_for_deal(self, deal_id: str) -> list[BuyerPersona]:
        """Get all personas for a deal"""
        return [p for p in self._personas.values() if p.deal_id == deal_id]

    def analyze_persona_coverage(self, deal_id: str) -> dict:
        """Analyze persona coverage for a deal"""
        personas = self.get_personas_for_deal(deal_id)

        coverage = {}
        for persona_type in PersonaType:
            matching = [p for p in personas if p.persona_type == persona_type]
            if matching:
                persona = matching[0]
                status = "engaged" if persona.engagement_level == EngagementLevel.ENGAGED else \
                        "cautious" if persona.engagement_level == EngagementLevel.CAUTIOUS else \
                        "blocking" if persona.engagement_level == EngagementLevel.BLOCKING else \
                        "identified"
                coverage[persona_type.value] = {
                    "status": status,
                    "contact": persona.contact_name,
                    "title": persona.contact_title,
                    "influence_score": persona.influence_score,
                }
            else:
                coverage[persona_type.value] = {"status": "missing"}

        # Check for critical gaps
        gaps = []
        if coverage.get(PersonaType.ECONOMIC_BUYER.value, {}).get("status") == "missing":
            gaps.append("No Economic Buyer identified")
        if coverage.get(PersonaType.CHAMPION.value, {}).get("status") == "missing":
            gaps.append("No Champion identified")
        if coverage.get(PersonaType.BLOCKER.value, {}).get("status") == "blocking":
            blocker = next(
                (p for p in personas if p.persona_type == PersonaType.BLOCKER),
                None
            )
            if blocker:
                gaps.append(f"Blocker ({blocker.contact_name}) not neutralized")

        return {
            "coverage": coverage,
            "gaps": gaps,
            "complete": len(gaps) == 0,
        }

    # =========================================================================
    # BANT SCORING
    # =========================================================================

    def score_bant(
        self,
        deal_id: str,
        deal_data: dict | None = None,
    ) -> BANTScore:
        """Score a deal on BANT criteria"""
        personas = self.get_personas_for_deal(deal_id)
        intent = self._intents.get(deal_id)

        # Merge deal data
        data = deal_data or {}
        if intent:
            data.setdefault("close_date", intent.close_date)

        score = self.bant_scorer.score_deal(deal_id, personas, data)

        # Update intent with BANT scores
        if intent:
            intent.bant_budget_score = score.budget.score
            intent.bant_budget_evidence = "; ".join(score.budget.evidence)
            intent.bant_authority_score = score.authority.score
            intent.bant_authority_evidence = "; ".join(score.authority.evidence)
            intent.bant_need_score = score.need.score
            intent.bant_need_evidence = "; ".join(score.need.evidence)
            intent.bant_timeline_score = score.timeline.score
            intent.bant_timeline_evidence = "; ".join(score.timeline.evidence)
            intent.updated_at = datetime.now()

        return score

    # =========================================================================
    # SPIN ANALYSIS
    # =========================================================================

    def analyze_spin(
        self,
        deal_id: str,
        situation: dict | None = None,
        problem: dict | None = None,
        implication: dict | None = None,
        need_payoff: dict | None = None,
    ) -> SPINAnalysis:
        """Perform SPIN analysis on a deal"""
        analysis = self.spin_analyzer.analyze(
            deal_id=deal_id,
            situation=situation,
            problem=problem,
            implication=implication,
            need_payoff=need_payoff,
        )

        # Update intent with SPIN data
        intent = self._intents.get(deal_id)
        if intent:
            if situation:
                intent.spin_situation = situation.get("content", "")
                intent.spin_situation_confidence = situation.get("confidence", 0)
            if problem:
                intent.spin_problem = problem.get("content", "")
                intent.spin_problem_confidence = problem.get("confidence", 0)
            if implication:
                intent.spin_implication = implication.get("content", "")
                intent.spin_implication_confidence = implication.get("confidence", 0)
            if need_payoff:
                intent.spin_need_payoff = need_payoff.get("content", "")
                intent.spin_need_payoff_confidence = need_payoff.get("confidence", 0)
            intent.updated_at = datetime.now()

        return analysis

    # =========================================================================
    # PARANOID TWIN ANALYSIS
    # =========================================================================

    def run_paranoid_twin(
        self,
        deal_id: str,
        deal_data: dict | None = None,
    ) -> ParanoidAnalysis:
        """Run Paranoid Twin analysis on a deal"""
        intent = self._intents.get(deal_id)
        if not intent:
            raise ValueError(f"No intent found for deal {deal_id}")

        personas = self.get_personas_for_deal(deal_id)
        existing_risks = [r for r in self._risks.values() if r.deal_id == deal_id]

        analysis = self.paranoid_twin.analyze(
            deal_id=deal_id,
            deal_name=intent.deal_name,
            deal_value=intent.deal_value,
            deal_stage=intent.deal_stage,
            close_date=intent.close_date,
            bant_score=intent.bant_total_score,
            spin_score=intent.spin_score,
            personas=personas,
            deal_data=deal_data or {},
            existing_risks=existing_risks,
        )

        # Update intent with paranoid twin results
        intent.paranoid_analysis = analysis.to_dict()
        intent.paranoid_verdict = analysis.verdict
        intent.paranoid_failure_probability = analysis.failure_probability
        intent.paranoid_reviewed_at = datetime.now()
        intent.total_risk_score = analysis.failure_probability
        intent.updated_at = datetime.now()

        # Create risk entries from paranoid twin
        new_risks = self.paranoid_twin.convert_to_deal_risks(analysis)
        for risk in new_risks:
            self._risks[risk.id] = risk
            intent.risks.append(risk)

        return analysis

    # =========================================================================
    # RISK REGISTER MANAGEMENT
    # =========================================================================

    def add_risk(
        self,
        deal_id: str,
        title: str,
        description: str,
        category: str,
        severity: str,
        probability: int,
        impact: str,
        source: str = "manual",
    ) -> DealRisk:
        """Add a risk to the risk register"""
        from .intent_types import RiskCategory, RiskSeverity

        risk = DealRisk(
            id=str(uuid.uuid4()),
            deal_id=deal_id,
            title=title,
            description=description,
            category=RiskCategory(category),
            severity=RiskSeverity(severity),
            probability=probability,
            impact=impact,
            source=source,
        )

        self._risks[risk.id] = risk

        # Add to deal intent
        intent = self._intents.get(deal_id)
        if intent:
            intent.risks.append(risk)
            intent.updated_at = datetime.now()

        return risk

    def update_risk_status(
        self,
        risk_id: str,
        status: str,
        notes: str | None = None,
    ) -> DealRisk | None:
        """Update risk status"""
        risk = self._risks.get(risk_id)
        if not risk:
            return None

        risk.status = RiskStatus(status)
        if status in ["mitigated", "accepted"]:
            risk.resolved_at = datetime.now()

        risk.updated_at = datetime.now()
        return risk

    def add_mitigation_action(
        self,
        risk_id: str,
        description: str,
        due_date: datetime | None = None,
        owner: str | None = None,
    ) -> DealRisk | None:
        """Add a mitigation action to a risk"""
        risk = self._risks.get(risk_id)
        if not risk:
            return None

        action = {
            "id": str(uuid.uuid4()),
            "description": description,
            "due_date": due_date.isoformat() if due_date else None,
            "owner": owner,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
        }

        risk.mitigation_actions.append(action)
        risk.status = RiskStatus.MITIGATING
        risk.updated_at = datetime.now()

        return risk

    def get_risk_register(self, deal_id: str) -> dict:
        """Get complete risk register for a deal"""
        risks = [r for r in self._risks.values() if r.deal_id == deal_id]

        critical = [r for r in risks if r.severity == RiskSeverity.CRITICAL and r.status == RiskStatus.OPEN]
        medium = [r for r in risks if r.severity == RiskSeverity.MEDIUM and r.status == RiskStatus.OPEN]
        low = [r for r in risks if r.severity == RiskSeverity.LOW and r.status == RiskStatus.OPEN]
        mitigated = [r for r in risks if r.status in [RiskStatus.MITIGATED, RiskStatus.ACCEPTED]]

        # Calculate risk score
        total_score = sum(r.probability for r in critical) * 1.5 + \
                     sum(r.probability for r in medium) + \
                     sum(r.probability for r in low) * 0.5

        return {
            "deal_id": deal_id,
            "total_risks": len(risks),
            "open_risks": len(critical) + len(medium) + len(low),
            "mitigated_risks": len(mitigated),
            "risk_score": min(100, int(total_score / max(1, len(risks)))),
            "commit_threshold": 30,
            "critical_risks": [self._risk_to_dict(r) for r in critical],
            "medium_risks": [self._risk_to_dict(r) for r in medium],
            "low_risks": [self._risk_to_dict(r) for r in low],
            "mitigated_risks": [self._risk_to_dict(r) for r in mitigated],
        }

    def _risk_to_dict(self, risk: DealRisk) -> dict:
        return {
            "id": risk.id,
            "title": risk.title,
            "description": risk.description,
            "category": risk.category.value,
            "severity": risk.severity.value,
            "probability": risk.probability,
            "impact": risk.impact,
            "status": risk.status.value,
            "source": risk.source,
            "mitigation_actions": risk.mitigation_actions,
            "counter_evidence_needed": risk.counter_evidence_needed,
            "created_at": risk.created_at.isoformat(),
        }

    # =========================================================================
    # COMMIT STAGE GATE
    # =========================================================================

    def check_commit_gate(self, deal_id: str) -> CommitGateResult:
        """Check if deal passes commit stage gate requirements"""
        intent = self._intents.get(deal_id)
        if not intent:
            return CommitGateResult(
                passed=False,
                blocking_items=["Deal intent not found"],
                warning_items=[],
                requirements={},
                recommendation="Create deal intent analysis first",
            )

        personas = self.get_personas_for_deal(deal_id)
        risks = [r for r in self._risks.values() if r.deal_id == deal_id]

        blocking = []
        warnings = []

        # PERSONA REQUIREMENTS
        economic_buyer = next(
            (p for p in personas if p.persona_type == PersonaType.ECONOMIC_BUYER),
            None
        )
        champion = next(
            (p for p in personas if p.persona_type == PersonaType.CHAMPION),
            None
        )
        blockers = [p for p in personas if p.persona_type == PersonaType.BLOCKER]
        active_blockers = [p for p in blockers if p.engagement_level == EngagementLevel.BLOCKING]

        persona_reqs = {
            "economic_buyer_identified": economic_buyer is not None,
            "economic_buyer_engaged": economic_buyer and economic_buyer.engagement_level == EngagementLevel.ENGAGED,
            "champion_identified": champion is not None,
            "blockers_neutralized": len(active_blockers) == 0,
        }

        if not persona_reqs["economic_buyer_identified"]:
            blocking.append("No Economic Buyer identified")
        elif not persona_reqs["economic_buyer_engaged"]:
            warnings.append("Economic Buyer not fully engaged")

        if not persona_reqs["champion_identified"]:
            warnings.append("No Champion identified")

        if not persona_reqs["blockers_neutralized"]:
            blocking.append(f"{len(active_blockers)} active blocker(s) not neutralized")

        # SPIN REQUIREMENTS
        spin_reqs = {
            "situation_complete": bool(intent.spin_situation),
            "problem_complete": bool(intent.spin_problem),
            "implication_complete": bool(intent.spin_implication),
            "need_payoff_complete": bool(intent.spin_need_payoff),
            "score_threshold": intent.spin_score >= 70,
        }

        missing_spin = []
        if not spin_reqs["situation_complete"]:
            missing_spin.append("Situation")
        if not spin_reqs["problem_complete"]:
            missing_spin.append("Problem")
        if not spin_reqs["implication_complete"]:
            missing_spin.append("Implication")
        if not spin_reqs["need_payoff_complete"]:
            missing_spin.append("Need-Payoff")

        if missing_spin:
            warnings.append(f"SPIN incomplete: {', '.join(missing_spin)}")

        if not spin_reqs["score_threshold"]:
            warnings.append(f"SPIN score {intent.spin_score} below 70")

        # BANT REQUIREMENTS
        bant_reqs = {
            "score_threshold": intent.bant_total_score >= 70,
        }

        if not bant_reqs["score_threshold"]:
            blocking.append(f"BANT score {intent.bant_total_score} below 70 threshold")

        # PARANOID TWIN REQUIREMENTS
        paranoid_reqs = {
            "reviewed": intent.paranoid_reviewed_at is not None,
            "no_critical_risks": not any(
                r.severity == RiskSeverity.CRITICAL and r.status == RiskStatus.OPEN
                for r in risks
            ),
            "risk_score_threshold": intent.total_risk_score <= 30,
        }

        if not paranoid_reqs["reviewed"]:
            warnings.append("Paranoid Twin review not completed")

        critical_open = [r for r in risks if r.severity == RiskSeverity.CRITICAL and r.status == RiskStatus.OPEN]
        if critical_open:
            blocking.append(f"{len(critical_open)} critical risk(s) unaddressed")

        if not paranoid_reqs["risk_score_threshold"]:
            blocking.append(f"Risk score {intent.total_risk_score} above 30 threshold")

        # BUILD RESULT
        passed = len(blocking) == 0

        if passed:
            recommendation = "Deal passes commit gate. Proceed to close."
        elif len(blocking) <= 2:
            recommendation = f"Address {len(blocking)} blocking item(s) before commit: {', '.join(blocking[:2])}"
        else:
            recommendation = f"Not ready for commit. {len(blocking)} blocking items and {len(warnings)} warnings. Return to negotiation."

        return CommitGateResult(
            passed=passed,
            blocking_items=blocking,
            warning_items=warnings,
            requirements={
                "personas": persona_reqs,
                "spin": spin_reqs,
                "bant": bant_reqs,
                "paranoid_twin": paranoid_reqs,
            },
            recommendation=recommendation,
        )

    # =========================================================================
    # COMPLETE ANALYSIS
    # =========================================================================

    def get_complete_analysis(self, deal_id: str) -> dict:
        """Get complete intent analysis for a deal"""
        intent = self._intents.get(deal_id)
        if not intent:
            return {"error": "Deal intent not found"}

        personas = self.get_personas_for_deal(deal_id)
        persona_coverage = self.analyze_persona_coverage(deal_id)
        risk_register = self.get_risk_register(deal_id)
        commit_gate = self.check_commit_gate(deal_id)

        return {
            "deal": {
                "id": intent.deal_id,
                "name": intent.deal_name,
                "value": intent.deal_value,
                "stage": intent.deal_stage,
                "close_date": intent.close_date.isoformat() if intent.close_date else None,
            },
            "bant": {
                "total_score": intent.bant_total_score,
                "budget": {"score": intent.bant_budget_score, "evidence": intent.bant_budget_evidence},
                "authority": {"score": intent.bant_authority_score, "evidence": intent.bant_authority_evidence},
                "need": {"score": intent.bant_need_score, "evidence": intent.bant_need_evidence},
                "timeline": {"score": intent.bant_timeline_score, "evidence": intent.bant_timeline_evidence},
                "commit_ready": intent.bant_total_score >= 70,
            },
            "spin": {
                "score": intent.spin_score,
                "situation": {"content": intent.spin_situation, "confidence": intent.spin_situation_confidence},
                "problem": {"content": intent.spin_problem, "confidence": intent.spin_problem_confidence},
                "implication": {"content": intent.spin_implication, "confidence": intent.spin_implication_confidence},
                "need_payoff": {"content": intent.spin_need_payoff, "confidence": intent.spin_need_payoff_confidence},
            },
            "personas": {
                "list": [
                    {
                        "id": p.id,
                        "name": p.contact_name,
                        "title": p.contact_title,
                        "type": p.persona_type.value,
                        "engagement": p.engagement_level.value,
                        "influence_score": p.influence_score,
                        "can_veto": p.can_veto,
                        "motivations": p.motivations,
                        "concerns": p.concerns,
                    }
                    for p in personas
                ],
                "coverage": persona_coverage,
            },
            "paranoid_twin": {
                "verdict": intent.paranoid_verdict.value,
                "failure_probability": intent.paranoid_failure_probability,
                "reviewed_at": intent.paranoid_reviewed_at.isoformat() if intent.paranoid_reviewed_at else None,
                "analysis": intent.paranoid_analysis,
            },
            "risk_register": risk_register,
            "commit_gate": {
                "passed": commit_gate.passed,
                "blocking_items": commit_gate.blocking_items,
                "warning_items": commit_gate.warning_items,
                "recommendation": commit_gate.recommendation,
            },
            "commit_ready": intent.commit_ready,
            "updated_at": intent.updated_at.isoformat(),
        }
