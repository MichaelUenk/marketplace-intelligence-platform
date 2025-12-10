"""
iBood Signals Intelligence API Router

Full API for deal sourcing signal intelligence with:
- Signal detection and classification
- Vector RAG with top-8 retrieval (learning loop)
- Confidence scoring
- Company database
- Outcome recording for learning
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, HTTPException, Body
from pydantic import BaseModel, Field
from neo4j import Session

from atlas.services.query_api.deps import neo4j_session, qdrant_client
from atlas.services.signals import (
    SignalType, SignalPriority, SignalStatus, ProductCategory,
    SIGNAL_DEFINITIONS, CATEGORY_TAXONOMY,
    SignalDetectionEngine, ConfidenceScorer, SignalVectorRAG,
)


router = APIRouter(prefix="/signals-intelligence", tags=["Signals Intelligence"])


# Pydantic Models
class SignalCreate(BaseModel):
    """Request to create/detect a signal"""
    company_id: str
    company_name: str
    company_country: str = ""
    text: str = Field(..., description="Source text to analyze for signals")
    source_type: str = "unknown"
    source_url: str | None = None
    source_date: datetime | None = None
    categories: list[str] | None = None


class SignalManual(BaseModel):
    """Manually create a signal (bypass detection)"""
    company_id: str
    company_name: str
    company_country: str = ""
    signal_type: str
    title: str
    summary: str
    source_type: str = "manual"
    source_url: str | None = None
    categories: list[str] = []
    estimated_value: float | None = None
    likely_discount_range: str | None = None
    competition_level: str | None = None


class SignalOutcome(BaseModel):
    """Record signal outcome for learning loop"""
    signal_id: str
    outcome: str = Field(..., description="deal_won, deal_lost, expired, dismissed")
    actual_discount: float | None = None
    deal_value: float | None = None
    notes: str | None = None


class SignalSearch(BaseModel):
    """Search for similar signals"""
    query: str | None = None
    signal_type: str | None = None
    signal_priority: str | None = None
    categories: list[str] | None = None
    k: int = 8


class CompanyCreate(BaseModel):
    """Create/update a company"""
    id: str
    name: str
    country: str = ""
    revenue_eur: float | None = None
    categories: list[str] = []
    status: str = "new"
    website: str | None = None


# Dependencies
def get_signal_engine(s: Annotated[Session, Depends(neo4j_session)]) -> SignalDetectionEngine:
    return SignalDetectionEngine(neo4j_session=s)


def get_rag() -> SignalVectorRAG:
    return SignalVectorRAG()


def get_scorer() -> ConfidenceScorer:
    return ConfidenceScorer()


# ============================================================================
# SIGNAL ENDPOINTS
# ============================================================================

@router.get("/")
def get_dashboard_stats(s: Annotated[Session, Depends(neo4j_session)]):
    """
    Get dashboard statistics for signals intelligence.
    Returns counts by priority, status, and category.
    """
    rag = get_rag()

    # Get signal counts from Neo4j
    query = """
    MATCH (sig:Signal)
    WITH sig
    RETURN
        count(sig) as total_signals,
        count(CASE WHEN sig.signal_priority = 'hot' THEN 1 END) as hot_signals,
        count(CASE WHEN sig.signal_priority = 'strategic' THEN 1 END) as strategic_signals,
        count(CASE WHEN sig.signal_priority = 'market' THEN 1 END) as market_signals,
        count(CASE WHEN sig.signal_priority = 'relationship' THEN 1 END) as relationship_signals,
        count(CASE WHEN sig.status = 'new' THEN 1 END) as new_signals,
        count(CASE WHEN sig.status = 'actioned' AND sig.outcome = 'deal_won' THEN 1 END) as deals_won
    """

    try:
        result = s.run(query).single()
        neo4j_stats = dict(result) if result else {}
    except Exception:
        neo4j_stats = {}

    # Get vector stats
    vector_stats = rag.get_collection_stats()

    return {
        "signals": neo4j_stats,
        "vector_index": vector_stats,
        "signal_types": len(SignalType),
        "categories": len(ProductCategory),
    }


@router.post("/detect")
def detect_signals(
    request: SignalCreate,
    engine: Annotated[SignalDetectionEngine, Depends(get_signal_engine)],
):
    """
    Detect signals from source text using NLP.

    The detection pipeline:
    1. Analyze text for signal keywords
    2. Classify signal types
    3. Score confidence and deal potential
    4. Enrich with RAG context (top 8 similar signals)
    5. Store in Neo4j and vector database
    """
    categories = None
    if request.categories:
        categories = [ProductCategory(c) for c in request.categories if c in ProductCategory.__members__.values()]

    # Detect signals from text
    signals = engine.detect_signals(
        text=request.text,
        company_id=request.company_id,
        company_name=request.company_name,
        company_country=request.company_country,
        source_type=request.source_type,
        source_url=request.source_url,
        source_date=request.source_date,
        categories=categories,
    )

    # Enrich each signal with RAG context
    enriched = []
    for signal in signals:
        signal = engine.enrich_with_rag(signal)
        engine.save_to_neo4j(signal)
        enriched.append(signal.to_dict())

    return {
        "detected": len(enriched),
        "signals": enriched,
    }


@router.post("/manual")
def create_manual_signal(
    request: SignalManual,
    engine: Annotated[SignalDetectionEngine, Depends(get_signal_engine)],
    scorer: Annotated[ConfidenceScorer, Depends(get_scorer)],
):
    """
    Manually create a signal (for signals discovered outside the system).
    """
    import uuid
    from atlas.services.signals.signal_engine import DetectedSignal

    try:
        signal_type = SignalType(request.signal_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid signal type: {request.signal_type}")

    signal_def = SIGNAL_DEFINITIONS.get(signal_type, {})

    # Score the signal
    confidence, _ = scorer.score(
        signal_type=signal_type,
        source_type=request.source_type,
    )
    deal_potential = scorer.score_deal_potential(signal_type)

    categories = [ProductCategory(c) for c in request.categories if c in [e.value for e in ProductCategory]]

    signal = DetectedSignal(
        id=str(uuid.uuid4()),
        company_id=request.company_id,
        company_name=request.company_name,
        company_country=request.company_country,
        signal_type=signal_type,
        signal_priority=signal_def.get("priority", SignalPriority.RELATIONSHIP),
        title=request.title,
        summary=request.summary,
        confidence_score=confidence,
        deal_potential_score=deal_potential,
        source_type=request.source_type,
        source_url=request.source_url,
        categories=categories,
        estimated_value=request.estimated_value,
        likely_discount_range=request.likely_discount_range,
        competition_level=request.competition_level,
    )

    # Enrich and save
    signal = engine.enrich_with_rag(signal)
    engine.save_to_neo4j(signal)

    return signal.to_dict()


@router.post("/outcome")
def record_signal_outcome(
    request: SignalOutcome,
    engine: Annotated[SignalDetectionEngine, Depends(get_signal_engine)],
):
    """
    Record the outcome of a signal for the learning loop.

    This is critical for improving future predictions.
    Valid outcomes: deal_won, deal_lost, expired, dismissed
    """
    valid_outcomes = ["deal_won", "deal_lost", "expired", "dismissed", "actioned"]
    if request.outcome not in valid_outcomes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid outcome. Must be one of: {valid_outcomes}"
        )

    success = engine.record_outcome(
        signal_id=request.signal_id,
        outcome=request.outcome,
        actual_discount=request.actual_discount,
        deal_value=request.deal_value,
        notes=request.notes,
    )

    return {
        "success": success,
        "signal_id": request.signal_id,
        "outcome": request.outcome,
        "message": "Outcome recorded for learning loop" if success else "Failed to record outcome",
    }


@router.get("/list")
def list_signals(
    s: Annotated[Session, Depends(neo4j_session)],
    priority: str | None = Query(None, description="Filter by priority: hot, strategic, market, relationship"),
    status: str | None = Query(None, description="Filter by status: new, viewed, actioned"),
    limit: int = Query(50, ge=1, le=200),
):
    """List signals with optional filters"""
    conditions = []
    params = {"limit": limit}

    if priority:
        conditions.append("sig.signal_priority = $priority")
        params["priority"] = priority
    if status:
        conditions.append("sig.status = $status")
        params["status"] = status

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
    MATCH (sig:Signal)-[:DETECTED_FOR]->(c:Company)
    {where_clause}
    RETURN sig, c
    ORDER BY sig.detected_at DESC
    LIMIT $limit
    """

    results = s.run(query, params).data()

    signals = []
    for r in results:
        sig = dict(r["sig"])
        sig["company"] = dict(r["c"])
        signals.append(sig)

    return {"signals": signals, "count": len(signals)}


@router.get("/hot")
def get_hot_signals(
    s: Annotated[Session, Depends(neo4j_session)],
    limit: int = Query(20, ge=1, le=100),
):
    """Get hot (high-priority) signals requiring immediate action"""
    query = """
    MATCH (sig:Signal)-[:DETECTED_FOR]->(c:Company)
    WHERE sig.signal_priority = 'hot' AND sig.status IN ['new', 'viewed']
    RETURN sig, c
    ORDER BY sig.confidence_score DESC, sig.detected_at DESC
    LIMIT $limit
    """

    results = s.run(query, {"limit": limit}).data()

    signals = []
    for r in results:
        sig = dict(r["sig"])
        sig["company"] = dict(r["c"])
        signals.append(sig)

    return {"signals": signals, "count": len(signals)}


@router.get("/{signal_id}")
def get_signal_detail(
    signal_id: str,
    s: Annotated[Session, Depends(neo4j_session)],
    engine: Annotated[SignalDetectionEngine, Depends(get_signal_engine)],
):
    """Get full signal details including similar historical signals"""
    query = """
    MATCH (sig:Signal {id: $signal_id})-[:DETECTED_FOR]->(c:Company)
    RETURN sig, c
    """

    result = s.run(query, {"signal_id": signal_id}).single()
    if not result:
        raise HTTPException(status_code=404, detail="Signal not found")

    sig = dict(result["sig"])
    sig["company"] = dict(result["c"])

    # Get similar signals from vector database
    rag = get_rag()
    similar = rag.search_similar_signals(
        query_text=f"{sig.get('title', '')} {sig.get('summary', '')}",
        k=8,
    )

    sig["similar_signals"] = [
        {
            "signal_id": s.signal_id,
            "company_name": s.company_name,
            "signal_type": s.signal_type,
            "title": s.title,
            "similarity_score": s.similarity_score,
            "outcome": s.outcome,
            "actual_discount": s.actual_discount,
        }
        for s in similar
        if s.signal_id != signal_id  # Exclude self
    ]

    return sig


# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@router.post("/search")
def search_signals(
    request: SignalSearch,
    rag: Annotated[SignalVectorRAG, Depends(get_rag)],
):
    """
    Semantic search for similar signals using vector embeddings.

    This is the core of the learning loop - finds top K similar historical signals.
    """
    signal_types = [request.signal_type] if request.signal_type else None
    categories = request.categories

    similar = rag.search_similar_signals(
        query_text=request.query,
        k=request.k,
        signal_types=signal_types,
        categories=categories,
    )

    return {
        "query": request.query,
        "k": request.k,
        "results": [
            {
                "signal_id": s.signal_id,
                "company_name": s.company_name,
                "signal_type": s.signal_type,
                "title": s.title,
                "summary": s.summary,
                "confidence_score": s.confidence_score,
                "deal_potential_score": s.deal_potential_score,
                "similarity_score": s.similarity_score,
                "outcome": s.outcome,
                "actual_discount": s.actual_discount,
            }
            for s in similar
        ],
    }


@router.get("/search/quick")
def quick_search(
    q: str = Query(..., description="Search query"),
    k: int = Query(8, ge=1, le=50),
    rag: Annotated[SignalVectorRAG, Depends(get_rag)] = None,
):
    """Quick semantic search endpoint"""
    similar = rag.search_similar_signals(query_text=q, k=k)

    return {
        "query": q,
        "results": [
            {
                "signal_id": s.signal_id,
                "company_name": s.company_name,
                "signal_type": s.signal_type,
                "title": s.title,
                "similarity_score": s.similarity_score,
                "outcome": s.outcome,
            }
            for s in similar
        ],
    }


# ============================================================================
# COMPANY ENDPOINTS
# ============================================================================

@router.get("/companies")
def list_companies(
    s: Annotated[Session, Depends(neo4j_session)],
    status: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """List companies with signal intelligence"""
    conditions = ["c.is_supplier = true OR EXISTS((sig:Signal)-[:DETECTED_FOR]->(c))"]
    params = {"limit": limit}

    if status:
        conditions.append("c.status = $status")
        params["status"] = status
    if category:
        conditions.append("$category IN c.categories")
        params["category"] = category

    where_clause = f"WHERE {' AND '.join(conditions)}"

    query = f"""
    MATCH (c:Company)
    {where_clause}
    OPTIONAL MATCH (sig:Signal)-[:DETECTED_FOR]->(c)
    WITH c, count(sig) as signal_count,
         count(CASE WHEN sig.signal_priority = 'hot' THEN 1 END) as hot_count
    RETURN c, signal_count, hot_count
    ORDER BY hot_count DESC, signal_count DESC
    LIMIT $limit
    """

    results = s.run(query, params).data()

    companies = []
    for r in results:
        company = dict(r["c"])
        company["active_signals"] = r["signal_count"]
        company["hot_signals"] = r["hot_count"]
        companies.append(company)

    return {"companies": companies, "count": len(companies)}


@router.post("/companies")
def create_company(
    request: CompanyCreate,
    s: Annotated[Session, Depends(neo4j_session)],
):
    """Create or update a company"""
    query = """
    MERGE (c:Company {id: $id})
    SET c.name = $name,
        c.country = $country,
        c.revenue_eur = $revenue_eur,
        c.categories = $categories,
        c.status = $status,
        c.website = $website,
        c.is_supplier = true,
        c.updated_at = datetime()
    RETURN c
    """

    result = s.run(query, {
        "id": request.id,
        "name": request.name,
        "country": request.country,
        "revenue_eur": request.revenue_eur,
        "categories": request.categories,
        "status": request.status,
        "website": request.website,
    }).single()

    return dict(result["c"]) if result else {"error": "Failed to create company"}


@router.get("/companies/{company_id}/signals")
def get_company_signals(
    company_id: str,
    s: Annotated[Session, Depends(neo4j_session)],
    limit: int = Query(20, ge=1, le=100),
):
    """Get all signals for a specific company"""
    query = """
    MATCH (sig:Signal)-[:DETECTED_FOR]->(c:Company {id: $company_id})
    RETURN sig
    ORDER BY sig.detected_at DESC
    LIMIT $limit
    """

    results = s.run(query, {"company_id": company_id, "limit": limit}).data()

    return {
        "company_id": company_id,
        "signals": [dict(r["sig"]) for r in results],
        "count": len(results),
    }


# ============================================================================
# REFERENCE DATA ENDPOINTS
# ============================================================================

@router.get("/types")
def get_signal_types():
    """Get all signal types with definitions"""
    return {
        signal_type.value: {
            "label": definition["label"],
            "priority": definition["priority"].value,
            "description": definition["description"],
            "why_matters": definition["why_matters"],
            "urgency_days": definition["urgency_days"],
        }
        for signal_type, definition in SIGNAL_DEFINITIONS.items()
    }


@router.get("/categories")
def get_categories():
    """Get all product categories with taxonomy"""
    return {
        category.value: {
            "label": info["label"],
            "subcategories": info["subcategories"],
            "keywords": info["keywords"],
        }
        for category, info in CATEGORY_TAXONOMY.items()
    }


@router.get("/priorities")
def get_priorities():
    """Get signal priority levels"""
    return {
        "hot": {
            "label": "Hot",
            "icon": "🔥",
            "description": "Immediate action required - motivated sellers",
            "color": "#EF4444",
        },
        "strategic": {
            "label": "Strategic",
            "icon": "⭐",
            "description": "Worth monitoring for upcoming deals",
            "color": "#F59E0B",
        },
        "market": {
            "label": "Market Intel",
            "icon": "📊",
            "description": "Broader market trends and opportunities",
            "color": "#3B82F6",
        },
        "relationship": {
            "label": "Nurture",
            "icon": "🤝",
            "description": "Long-term partnership opportunities",
            "color": "#10B981",
        },
    }


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics/performance")
def get_signal_performance(
    s: Annotated[Session, Depends(neo4j_session)],
    days: int = Query(30, ge=1, le=365),
):
    """Get signal performance analytics"""
    query = """
    MATCH (sig:Signal)
    WHERE sig.detected_at > datetime() - duration({days: $days})
    WITH sig
    RETURN
        sig.signal_type as signal_type,
        count(sig) as total,
        count(CASE WHEN sig.outcome = 'deal_won' THEN 1 END) as won,
        count(CASE WHEN sig.outcome = 'deal_lost' THEN 1 END) as lost,
        avg(sig.confidence_score) as avg_confidence,
        avg(sig.deal_potential_score) as avg_potential
    """

    results = s.run(query, {"days": days}).data()

    # Calculate success rates
    performance = []
    for r in results:
        actioned = (r["won"] or 0) + (r["lost"] or 0)
        success_rate = r["won"] / actioned if actioned > 0 else None

        performance.append({
            "signal_type": r["signal_type"],
            "total": r["total"],
            "won": r["won"] or 0,
            "lost": r["lost"] or 0,
            "success_rate": success_rate,
            "avg_confidence": r["avg_confidence"],
            "avg_potential": r["avg_potential"],
        })

    return {
        "days": days,
        "performance_by_type": performance,
    }


@router.get("/analytics/learning")
def get_learning_stats(
    rag: Annotated[SignalVectorRAG, Depends(get_rag)],
):
    """Get learning loop statistics"""
    stats = rag.get_collection_stats()

    return {
        "vector_index": stats,
        "learning_status": "active" if stats.get("outcomes_recorded", 0) > 0 else "collecting_data",
        "message": (
            f"Learning from {stats.get('outcomes_recorded', 0)} recorded outcomes"
            if stats.get("outcomes_recorded", 0) > 0
            else "Start recording outcomes to improve predictions"
        ),
    }
