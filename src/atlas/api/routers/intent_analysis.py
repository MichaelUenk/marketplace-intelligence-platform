"""
Intent Analysis API Router

Endpoints for deal qualification, buyer intent, and risk assessment.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from atlas.services.intent import (
    IntentEngine,
    PersonaType,
    EngagementLevel,
    RiskSeverity,
    RiskCategory,
)

router = APIRouter(prefix="/intent-analysis", tags=["Intent Analysis"])

# Global engine instance (in production, use dependency injection)
_engine: IntentEngine | None = None


def get_engine() -> IntentEngine:
    """Get or create the intent engine instance"""
    global _engine
    if _engine is None:
        _engine = IntentEngine()
    return _engine


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class CreateDealIntentRequest(BaseModel):
    deal_id: str
    deal_name: str
    deal_value: float
    deal_stage: str = "discovery"
    close_date: str | None = None


class AddPersonaRequest(BaseModel):
    contact_name: str
    contact_title: str
    persona_type: str
    contact_email: str | None = None
    contact_id: str | None = None
    engagement_level: str = "unknown"
    influence_score: int = 50
    can_veto: bool = False
    can_approve: bool = False
    motivations: list[str] = []
    concerns: list[str] = []


class UpdatePersonaRequest(BaseModel):
    engagement_level: str | None = None
    influence_score: int | None = None
    motivations: list[str] | None = None
    concerns: list[str] | None = None
    notes: str | None = None


class UpdateBANTRequest(BaseModel):
    budget_confirmed: bool = False
    budget_amount: float | None = None
    po_ready: bool = False
    budget_approval_process_clear: bool = False
    need_critical: bool = False
    need_quantified: bool = False
    need_urgent: bool = False
    need_description: str = ""
    personal_stakes: list[str] = []
    deadline_hard: bool = False
    deadline_event_driven: bool = False
    deadline_driver: str = ""
    timeline_slipped: bool = False
    original_close_date: str | None = None


class UpdateSPINRequest(BaseModel):
    situation: dict | None = None
    problem: dict | None = None
    implication: dict | None = None
    need_payoff: dict | None = None


class AddRiskRequest(BaseModel):
    title: str
    description: str
    category: str
    severity: str
    probability: int = Field(ge=0, le=100)
    impact: str


class UpdateRiskStatusRequest(BaseModel):
    status: str
    notes: str | None = None


class AddMitigationActionRequest(BaseModel):
    description: str
    due_date: str | None = None
    owner: str | None = None


class RunParanoidTwinRequest(BaseModel):
    timeline_slipped: bool = False
    original_close_date: str | None = None
    competitor_mentioned: bool = False
    competitors: list[str] = []


# =============================================================================
# DEAL INTENT ENDPOINTS
# =============================================================================

@router.post("/deals")
def create_deal_intent(request: CreateDealIntentRequest):
    """Create a new deal intent analysis"""
    engine = get_engine()

    close_date = None
    if request.close_date:
        close_date = datetime.fromisoformat(request.close_date)

    intent = engine.create_deal_intent(
        deal_id=request.deal_id,
        deal_name=request.deal_name,
        deal_value=request.deal_value,
        deal_stage=request.deal_stage,
        close_date=close_date,
    )

    return {
        "success": True,
        "deal_id": intent.deal_id,
        "message": f"Intent analysis created for {request.deal_name}",
    }


@router.get("/deals/{deal_id}")
def get_deal_intent(deal_id: str):
    """Get complete intent analysis for a deal"""
    engine = get_engine()
    analysis = engine.get_complete_analysis(deal_id)

    if "error" in analysis:
        raise HTTPException(status_code=404, detail=analysis["error"])

    return analysis


@router.get("/deals")
def list_deal_intents():
    """List all deal intents with summary"""
    engine = get_engine()

    deals = []
    for deal_id, intent in engine._intents.items():
        commit_gate = engine.check_commit_gate(deal_id)
        deals.append({
            "deal_id": deal_id,
            "deal_name": intent.deal_name,
            "deal_value": intent.deal_value,
            "deal_stage": intent.deal_stage,
            "bant_score": intent.bant_total_score,
            "spin_score": intent.spin_score,
            "paranoid_verdict": intent.paranoid_verdict.value,
            "failure_probability": intent.paranoid_failure_probability,
            "commit_ready": commit_gate.passed,
            "blocking_items": len(commit_gate.blocking_items),
            "close_date": intent.close_date.isoformat() if intent.close_date else None,
        })

    # Sort by deal value descending
    deals.sort(key=lambda x: x["deal_value"], reverse=True)

    return {
        "deals": deals,
        "total": len(deals),
        "commit_ready_count": sum(1 for d in deals if d["commit_ready"]),
    }


# =============================================================================
# PERSONA ENDPOINTS
# =============================================================================

@router.post("/deals/{deal_id}/personas")
def add_persona(deal_id: str, request: AddPersonaRequest):
    """Add a buyer persona to a deal"""
    engine = get_engine()

    # Verify deal exists
    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    persona = engine.add_persona(
        deal_id=deal_id,
        contact_name=request.contact_name,
        contact_title=request.contact_title,
        persona_type=PersonaType(request.persona_type),
        contact_email=request.contact_email,
        contact_id=request.contact_id,
        engagement_level=EngagementLevel(request.engagement_level),
        influence_score=request.influence_score,
        can_veto=request.can_veto,
        can_approve=request.can_approve,
        motivations=request.motivations,
        concerns=request.concerns,
    )

    return {
        "success": True,
        "persona_id": persona.id,
        "message": f"Added {request.contact_name} as {request.persona_type}",
    }


@router.get("/deals/{deal_id}/personas")
def get_personas(deal_id: str):
    """Get all personas for a deal with coverage analysis"""
    engine = get_engine()

    personas = engine.get_personas_for_deal(deal_id)
    coverage = engine.analyze_persona_coverage(deal_id)

    return {
        "personas": [
            {
                "id": p.id,
                "contact_name": p.contact_name,
                "contact_title": p.contact_title,
                "contact_email": p.contact_email,
                "persona_type": p.persona_type.value,
                "engagement_level": p.engagement_level.value,
                "influence_score": p.influence_score,
                "can_veto": p.can_veto,
                "can_approve": p.can_approve,
                "motivations": p.motivations,
                "concerns": p.concerns,
                "last_engagement": p.last_engagement_date.isoformat() if p.last_engagement_date else None,
            }
            for p in personas
        ],
        "coverage": coverage,
    }


@router.patch("/personas/{persona_id}")
def update_persona(persona_id: str, request: UpdatePersonaRequest):
    """Update a persona"""
    engine = get_engine()

    updates = {}
    if request.engagement_level:
        updates["engagement_level"] = EngagementLevel(request.engagement_level)
    if request.influence_score is not None:
        updates["influence_score"] = request.influence_score
    if request.motivations is not None:
        updates["motivations"] = request.motivations
    if request.concerns is not None:
        updates["concerns"] = request.concerns
    if request.notes is not None:
        updates["notes"] = request.notes

    persona = engine.update_persona(persona_id, updates)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")

    return {"success": True, "message": "Persona updated"}


@router.post("/personas/{persona_id}/engagement")
def record_engagement(persona_id: str, engagement_type: str = "positive", notes: str | None = None):
    """Record an engagement with a persona"""
    engine = get_engine()

    persona = engine.record_persona_engagement(persona_id, engagement_type, notes)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")

    return {"success": True, "message": f"Engagement recorded for {persona.contact_name}"}


# =============================================================================
# BANT ENDPOINTS
# =============================================================================

@router.post("/deals/{deal_id}/bant")
def score_bant(deal_id: str, request: UpdateBANTRequest):
    """Score BANT criteria for a deal"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    deal_data = request.model_dump()
    score = engine.score_bant(deal_id, deal_data)

    return {
        "success": True,
        "bant_score": score.to_dict(),
        "suggestions": engine.bant_scorer.get_scoring_suggestions(score),
    }


@router.get("/deals/{deal_id}/bant")
def get_bant_score(deal_id: str):
    """Get current BANT score for a deal"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    return {
        "total_score": intent.bant_total_score,
        "budget": {
            "score": intent.bant_budget_score,
            "max": 25,
            "evidence": intent.bant_budget_evidence,
        },
        "authority": {
            "score": intent.bant_authority_score,
            "max": 25,
            "evidence": intent.bant_authority_evidence,
        },
        "need": {
            "score": intent.bant_need_score,
            "max": 25,
            "evidence": intent.bant_need_evidence,
        },
        "timeline": {
            "score": intent.bant_timeline_score,
            "max": 25,
            "evidence": intent.bant_timeline_evidence,
        },
        "commit_ready": intent.bant_total_score >= 70,
        "interpretation": (
            "Strong commit candidate" if intent.bant_total_score >= 90 else
            "Good opportunity, minor gaps" if intent.bant_total_score >= 70 else
            "Needs work before commit" if intent.bant_total_score >= 50 else
            "Not ready for commit stage"
        ),
    }


# =============================================================================
# SPIN ENDPOINTS
# =============================================================================

@router.post("/deals/{deal_id}/spin")
def analyze_spin(deal_id: str, request: UpdateSPINRequest):
    """Update SPIN analysis for a deal"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    analysis = engine.analyze_spin(
        deal_id=deal_id,
        situation=request.situation,
        problem=request.problem,
        implication=request.implication,
        need_payoff=request.need_payoff,
    )

    return {
        "success": True,
        "spin_analysis": analysis.to_dict(),
        "suggested_questions": engine.spin_analyzer.get_suggested_questions(analysis),
        "commit_readiness": engine.spin_analyzer.check_commit_readiness(analysis),
    }


@router.get("/deals/{deal_id}/spin")
def get_spin_analysis(deal_id: str):
    """Get current SPIN analysis for a deal"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    return {
        "score": intent.spin_score,
        "situation": {
            "content": intent.spin_situation,
            "confidence": intent.spin_situation_confidence,
        },
        "problem": {
            "content": intent.spin_problem,
            "confidence": intent.spin_problem_confidence,
        },
        "implication": {
            "content": intent.spin_implication,
            "confidence": intent.spin_implication_confidence,
        },
        "need_payoff": {
            "content": intent.spin_need_payoff,
            "confidence": intent.spin_need_payoff_confidence,
        },
    }


# =============================================================================
# PARANOID TWIN ENDPOINTS
# =============================================================================

@router.post("/deals/{deal_id}/paranoid-twin")
def run_paranoid_twin(deal_id: str, request: RunParanoidTwinRequest):
    """Run Paranoid Twin analysis on a deal"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    deal_data = request.model_dump()
    analysis = engine.run_paranoid_twin(deal_id, deal_data)

    return {
        "success": True,
        "paranoid_analysis": analysis.to_dict(),
    }


@router.get("/deals/{deal_id}/paranoid-twin")
def get_paranoid_analysis(deal_id: str):
    """Get Paranoid Twin analysis results"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    return {
        "verdict": intent.paranoid_verdict.value,
        "failure_probability": intent.paranoid_failure_probability,
        "reviewed_at": intent.paranoid_reviewed_at.isoformat() if intent.paranoid_reviewed_at else None,
        "analysis": intent.paranoid_analysis,
    }


# =============================================================================
# RISK REGISTER ENDPOINTS
# =============================================================================

@router.get("/deals/{deal_id}/risks")
def get_risk_register(deal_id: str):
    """Get complete risk register for a deal"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    return engine.get_risk_register(deal_id)


@router.post("/deals/{deal_id}/risks")
def add_risk(deal_id: str, request: AddRiskRequest):
    """Add a manual risk to the register"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    risk = engine.add_risk(
        deal_id=deal_id,
        title=request.title,
        description=request.description,
        category=request.category,
        severity=request.severity,
        probability=request.probability,
        impact=request.impact,
        source="manual",
    )

    return {
        "success": True,
        "risk_id": risk.id,
        "message": f"Risk '{request.title}' added to register",
    }


@router.patch("/risks/{risk_id}/status")
def update_risk_status(risk_id: str, request: UpdateRiskStatusRequest):
    """Update risk status"""
    engine = get_engine()

    risk = engine.update_risk_status(risk_id, request.status, request.notes)
    if not risk:
        raise HTTPException(status_code=404, detail=f"Risk {risk_id} not found")

    return {"success": True, "message": f"Risk status updated to {request.status}"}


@router.post("/risks/{risk_id}/mitigation")
def add_mitigation_action(risk_id: str, request: AddMitigationActionRequest):
    """Add a mitigation action to a risk"""
    engine = get_engine()

    due_date = None
    if request.due_date:
        due_date = datetime.fromisoformat(request.due_date)

    risk = engine.add_mitigation_action(
        risk_id=risk_id,
        description=request.description,
        due_date=due_date,
        owner=request.owner,
    )

    if not risk:
        raise HTTPException(status_code=404, detail=f"Risk {risk_id} not found")

    return {"success": True, "message": "Mitigation action added"}


# =============================================================================
# COMMIT GATE ENDPOINT
# =============================================================================

@router.get("/deals/{deal_id}/commit-gate")
def check_commit_gate(deal_id: str):
    """Check commit stage gate requirements"""
    engine = get_engine()

    intent = engine.get_deal_intent(deal_id)
    if not intent:
        raise HTTPException(status_code=404, detail=f"Deal {deal_id} not found")

    result = engine.check_commit_gate(deal_id)

    return {
        "passed": result.passed,
        "blocking_items": result.blocking_items,
        "warning_items": result.warning_items,
        "requirements": result.requirements,
        "recommendation": result.recommendation,
    }


# =============================================================================
# DASHBOARD ENDPOINTS
# =============================================================================

@router.get("/dashboard/commit-stage")
def get_commit_stage_dashboard():
    """Get commit stage dashboard with all deals in commit"""
    engine = get_engine()

    commit_deals = []
    for deal_id, intent in engine._intents.items():
        if intent.deal_stage == "commit":
            commit_gate = engine.check_commit_gate(deal_id)
            risks = engine.get_risk_register(deal_id)

            commit_deals.append({
                "deal_id": deal_id,
                "deal_name": intent.deal_name,
                "deal_value": intent.deal_value,
                "bant_score": intent.bant_total_score,
                "spin_score": intent.spin_score,
                "paranoid_verdict": intent.paranoid_verdict.value,
                "open_critical_risks": len(risks["critical_risks"]),
                "close_date": intent.close_date.isoformat() if intent.close_date else None,
                "commit_ready": commit_gate.passed,
            })

    # Sort by close date
    commit_deals.sort(
        key=lambda x: x["close_date"] if x["close_date"] else "9999",
    )

    total_value = sum(d["deal_value"] for d in commit_deals)
    ready_count = sum(1 for d in commit_deals if d["commit_ready"])

    return {
        "deals": commit_deals,
        "summary": {
            "total_deals": len(commit_deals),
            "total_value": total_value,
            "ready_to_close": ready_count,
            "needs_attention": len(commit_deals) - ready_count,
        },
    }


@router.get("/dashboard/stats")
def get_intent_stats():
    """Get overall intent analysis statistics"""
    engine = get_engine()

    total_deals = len(engine._intents)
    total_value = sum(i.deal_value for i in engine._intents.values())

    # BANT distribution
    bant_distribution = {
        "strong": 0,  # 90+
        "good": 0,    # 70-89
        "needs_work": 0,  # 50-69
        "not_ready": 0,   # <50
    }

    # Paranoid verdicts
    verdicts = {"ready": 0, "hold": 0, "block": 0}

    for intent in engine._intents.values():
        # BANT
        score = intent.bant_total_score
        if score >= 90:
            bant_distribution["strong"] += 1
        elif score >= 70:
            bant_distribution["good"] += 1
        elif score >= 50:
            bant_distribution["needs_work"] += 1
        else:
            bant_distribution["not_ready"] += 1

        # Verdicts
        verdicts[intent.paranoid_verdict.value] += 1

    return {
        "total_deals": total_deals,
        "total_value": total_value,
        "bant_distribution": bant_distribution,
        "paranoid_verdicts": verdicts,
        "avg_bant_score": sum(i.bant_total_score for i in engine._intents.values()) / max(1, total_deals),
        "avg_failure_probability": sum(i.paranoid_failure_probability for i in engine._intents.values()) / max(1, total_deals),
    }
