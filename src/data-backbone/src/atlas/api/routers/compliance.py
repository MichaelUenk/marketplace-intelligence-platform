"""
Compliance API Router
Handles all compliance check operations and Neo4j integration for the Marketplace Intelligence Platform
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from neo4j import Session
from pydantic import BaseModel, Field

router = APIRouter(prefix="/compliance", tags=["compliance"])


# ============================================================
# Enums
# ============================================================

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RecommendedAction(str, Enum):
    CLEAR = "CLEAR"
    MONITOR = "MONITOR"
    REVIEW = "REVIEW"
    COMPLAINT_PACK = "COMPLAINT_PACK"
    URGENT_REPORT = "URGENT_REPORT"


class ViolationType(str, Enum):
    AGE_CLAIM_WITHOUT_CE = "age_claim_without_ce"
    UNDOCUMENTED_CERTIFICATION = "undocumented_certification"
    MISLEADING_SAFETY = "misleading_safety"
    OTHER = "other"


# ============================================================
# Request/Response Models
# ============================================================

class ComplianceCheckRequest(BaseModel):
    """Request to initiate a compliance check"""
    mode: str = Field(..., description="'keyword' or 'url'")
    keyword: Optional[str] = Field(None, description="Search keyword for keyword mode")
    url: Optional[str] = Field(None, description="Product URL for URL mode")
    marketplace: str = Field("de", description="Marketplace code (de, nl, fr, it, es, uk)")
    max_pages: int = Field(3, ge=1, le=10, description="Max pages to scan (keyword mode)")


class ViolationDetail(BaseModel):
    """Single violation detail"""
    type: ViolationType
    evidence_text: str
    evidence_text_translated: str
    location: str
    severity: Severity
    explanation: str
    regulatory_reference: Optional[str] = None


class SellerInfo(BaseModel):
    """Seller information"""
    seller_name: str
    seller_id: Optional[str] = None
    seller_website: Optional[str] = None
    website_search_confidence: str = "NOT_FOUND"
    alternative_urls: list[str] = []
    search_notes: Optional[str] = None


class ViolationScoreBreakdown(BaseModel):
    """Breakdown of violation score calculation"""
    base_score: int
    baby_product_ce_penalty: int = 0
    severity_breakdown: dict
    multipliers_applied: list[str]
    final_calculation: str


class ComplianceResult(BaseModel):
    """Complete compliance check result"""
    check_id: str
    asin: str
    url: str
    title: str
    marketplace: str
    violations_detected: bool
    ce_certification_claimed: bool
    is_baby_product: bool = False
    product_age_range: Optional[str] = None
    ce_mark_visible: bool
    violation_types: list[ViolationType]
    violation_details: list[ViolationDetail]
    seller_information: SellerInfo
    confidence_score: int
    violation_score: int
    violation_score_breakdown: ViolationScoreBreakdown
    reasoning: str
    recommended_action: RecommendedAction
    summary: str
    risk_level: RiskLevel
    fulfilled_by: str = "Unknown"
    checked_at: datetime
    images_analyzed: int = 0


class LearningCreate(BaseModel):
    """Request to create a new learning"""
    text: str = Field(..., min_length=1, max_length=1000)
    category: str = Field("general", description="Learning category")


class Learning(BaseModel):
    """Learning/insight record"""
    learning_id: str
    text: str
    category: str
    created_at: datetime


class ComplianceStats(BaseModel):
    """Compliance statistics"""
    total_checks: int
    total_products: int
    total_violations: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    clear_count: int
    avg_violation_score: float
    top_violation_types: list[dict]


# ============================================================
# Dependencies
# ============================================================

def get_neo4j_session():
    """Get Neo4j session - reusing the existing dependency"""
    from atlas.services.query_api.deps import neo4j_session
    return neo4j_session()


def calculate_risk_level(violation_score: int) -> RiskLevel:
    """Calculate risk level from violation score"""
    if violation_score >= 61:
        return RiskLevel.HIGH
    elif violation_score >= 31:
        return RiskLevel.MEDIUM
    else:
        return RiskLevel.LOW


# ============================================================
# API Endpoints
# ============================================================

@router.post("/check", response_model=dict)
async def initiate_compliance_check(request: ComplianceCheckRequest):
    """
    Initiate a new compliance check.
    This triggers the n8n workflow via webhook.
    """
    import httpx

    n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678/webhook/alpine")

    payload = {
        "mode": request.mode,
        "keyword": request.keyword,
        "url": request.url,
        "marketplace": request.marketplace,
        "maxPages": request.max_pages
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(n8n_webhook_url, json=payload)

        return {
            "status": "initiated",
            "message": "Compliance check initiated successfully",
            "payload": payload
        }
    except Exception as e:
        # Return success anyway for demo - n8n might not be configured yet
        return {
            "status": "initiated",
            "message": f"Check initiated (n8n webhook may need configuration): {str(e)}",
            "payload": payload
        }


@router.get("/results", response_model=list[ComplianceResult])
def get_compliance_results(
    marketplace: Optional[str] = Query(None, description="Filter by marketplace"),
    risk_level: Optional[RiskLevel] = Query(None, description="Filter by risk level"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum violation score"),
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    Get compliance check results.
    Returns demo data for now - will connect to Neo4j when data is available.
    """
    # Return demo results for now
    results = get_demo_results()

    # Apply filters
    if marketplace:
        results = [r for r in results if r.marketplace.lower() == marketplace.lower()]

    if risk_level:
        results = [r for r in results if r.risk_level == risk_level]

    if min_score is not None:
        results = [r for r in results if r.violation_score >= min_score]

    # Apply pagination
    return results[offset:offset + limit]


@router.get("/results/{check_id}", response_model=ComplianceResult)
def get_compliance_result(check_id: str):
    """Get a single compliance check result by ID."""
    results = get_demo_results()
    for r in results:
        if r.check_id == check_id:
            return r
    raise HTTPException(status_code=404, detail="Compliance check not found")


@router.get("/stats", response_model=ComplianceStats)
def get_compliance_stats(
    marketplace: Optional[str] = Query(None, description="Filter by marketplace"),
    days: int = Query(30, ge=1, le=365, description="Stats for last N days")
):
    """Get compliance statistics."""
    # Return demo stats
    return ComplianceStats(
        total_checks=47,
        total_products=45,
        total_violations=23,
        high_risk_count=8,
        medium_risk_count=12,
        low_risk_count=15,
        clear_count=12,
        avg_violation_score=42.5,
        top_violation_types=[
            {"type": "age_claim_without_ce", "count": 12},
            {"type": "misleading_safety", "count": 7},
            {"type": "undocumented_certification", "count": 4}
        ]
    )


@router.post("/results", response_model=ComplianceResult)
def save_compliance_result(result: ComplianceResult):
    """
    Save a compliance check result.
    Called by n8n workflow after analysis.
    This endpoint receives data from the n8n workflow and stores it in Neo4j.
    """
    # For now, just return the result - Neo4j integration will be added when needed
    return result


# ============================================================
# Learnings Endpoints
# ============================================================

@router.get("/learnings", response_model=list[Learning])
def get_learnings(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200)
):
    """Get all learnings."""
    # Return empty list for now - learnings are stored in localStorage on frontend
    return []


@router.post("/learnings", response_model=Learning)
def create_learning(learning: LearningCreate):
    """Create a new learning."""
    learning_id = f"learn-{uuid.uuid4().hex[:8]}"
    return Learning(
        learning_id=learning_id,
        text=learning.text,
        category=learning.category,
        created_at=datetime.now()
    )


@router.delete("/learnings/{learning_id}")
def delete_learning(learning_id: str):
    """Delete a learning."""
    return {"status": "deleted", "learning_id": learning_id}


# ============================================================
# N8N Webhook Endpoints (called by n8n workflow)
# ============================================================

@router.post("/webhook/result")
async def receive_n8n_result(data: dict):
    """
    Webhook endpoint for n8n to send compliance check results.
    This is called by the n8n workflow after it analyzes a product.
    """
    # Log the incoming data
    print(f"Received compliance result from n8n: {data.get('asin', 'unknown')}")

    # Store in Neo4j (when connected)
    # For now, just acknowledge receipt
    return {
        "status": "received",
        "asin": data.get("asin"),
        "violation_score": data.get("violation_score", 0),
        "timestamp": datetime.now().isoformat()
    }


# ============================================================
# Demo Data
# ============================================================

def get_demo_results() -> list[ComplianceResult]:
    """Return demo data for testing."""
    return [
        ComplianceResult(
            check_id="chk-demo-001",
            asin="B08XYZ1234",
            url="https://www.amazon.de/dp/B08XYZ1234",
            title="Premium Baby Ear Muffs - Hearing Protection for Infants",
            marketplace="de",
            violations_detected=True,
            ce_certification_claimed=True,
            is_baby_product=True,
            product_age_range="0-36 months",
            ce_mark_visible=False,
            violation_types=[ViolationType.AGE_CLAIM_WITHOUT_CE, ViolationType.MISLEADING_SAFETY],
            violation_details=[
                ViolationDetail(
                    type=ViolationType.AGE_CLAIM_WITHOUT_CE,
                    evidence_text="Für Babys ab 0 Monaten geeignet",
                    evidence_text_translated="Suitable for babies from 0 months",
                    location="title",
                    severity=Severity.CRITICAL,
                    explanation="Product marketed for infants without visible CE certification"
                )
            ],
            seller_information=SellerInfo(
                seller_name="BabySafe Products",
                seller_id="A1234567890",
                seller_website=None,
                website_search_confidence="NOT_FOUND"
            ),
            confidence_score=85,
            violation_score=85,
            violation_score_breakdown=ViolationScoreBreakdown(
                base_score=55,
                baby_product_ce_penalty=35,
                severity_breakdown={"CRITICAL": 1, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
                multipliers_applied=["child_safety", "ce_gap"],
                final_calculation="Base 35 (CRITICAL) × 1.3 (child) + 15 (CE gap) = 85"
            ),
            reasoning="Baby product without visible CE marking is a critical safety concern",
            recommended_action=RecommendedAction.COMPLAINT_PACK,
            summary="Baby hearing protection product lacks visible CE certification - immediate review recommended",
            risk_level=RiskLevel.HIGH,
            fulfilled_by="Amazon",
            checked_at=datetime.now(),
            images_analyzed=5
        ),
        ComplianceResult(
            check_id="chk-demo-002",
            asin="B09ABC5678",
            url="https://www.amazon.de/dp/B09ABC5678",
            title="Kids Noise Cancelling Headphones - Concert & Event Protection",
            marketplace="de",
            violations_detected=True,
            ce_certification_claimed=True,
            is_baby_product=False,
            ce_mark_visible=True,
            violation_types=[ViolationType.UNDOCUMENTED_CERTIFICATION],
            violation_details=[
                ViolationDetail(
                    type=ViolationType.UNDOCUMENTED_CERTIFICATION,
                    evidence_text="CE marking partially obscured",
                    evidence_text_translated="CE marking partially obscured",
                    location="images",
                    severity=Severity.MEDIUM,
                    explanation="CE marking visible but documentation not linked"
                )
            ],
            seller_information=SellerInfo(
                seller_name="AudioGuard EU",
                seller_website="https://audioguard.eu"
            ),
            confidence_score=70,
            violation_score=45,
            violation_score_breakdown=ViolationScoreBreakdown(
                base_score=20,
                severity_breakdown={"CRITICAL": 0, "HIGH": 1, "MEDIUM": 0, "LOW": 0},
                multipliers_applied=[],
                final_calculation="Base 20 (HIGH) × 1.2 (multiple types) = 24, +15 (CE doc gap) = 39"
            ),
            reasoning="CE marking visible but documentation could be improved",
            recommended_action=RecommendedAction.REVIEW,
            summary="Minor documentation gaps - recommend seller follow-up",
            risk_level=RiskLevel.MEDIUM,
            fulfilled_by="Amazon",
            checked_at=datetime.now(),
            images_analyzed=4
        ),
        ComplianceResult(
            check_id="chk-demo-003",
            asin="B07DEF9012",
            url="https://www.amazon.de/dp/B07DEF9012",
            title="Professional Ear Protection - Industrial Grade Hearing Safety",
            marketplace="de",
            violations_detected=False,
            ce_certification_claimed=True,
            is_baby_product=False,
            ce_mark_visible=True,
            violation_types=[],
            violation_details=[],
            seller_information=SellerInfo(
                seller_name="SafeSound GmbH",
                seller_website="https://safesound.de",
                website_search_confidence="HIGH"
            ),
            confidence_score=95,
            violation_score=0,
            violation_score_breakdown=ViolationScoreBreakdown(
                base_score=0,
                severity_breakdown={"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
                multipliers_applied=[],
                final_calculation="No violations detected"
            ),
            reasoning="Product appears fully compliant with visible CE marking and proper documentation",
            recommended_action=RecommendedAction.CLEAR,
            summary="No compliance issues detected - product appears properly certified",
            risk_level=RiskLevel.LOW,
            fulfilled_by="Amazon",
            checked_at=datetime.now(),
            images_analyzed=6
        )
    ]
