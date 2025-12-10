from __future__ import annotations

import contextlib
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from neo4j import Session
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

from atlas.services.query_api.cache import cache_get, cache_set, key_of
from atlas.services.query_api.cypher_queries import (
    COMPANIES_BY_INDUSTRY,
    COMPANIES_BY_LOCATION,
    COMPANY_BY_DOMAIN,
    COMPANY_BY_ID,
    COMPANY_RELATIONSHIPS,
    INDUSTRY_STATS,
    NEIGHBORS,
    PEOPLE_BY_DEPARTMENT,
    PEOPLE_BY_NAME,
    # Deal queries
    DEALS_LIST,
    DEAL_BY_ID,
    DEALS_BY_COMPANY,
    DEALS_BY_STAGE,
    DEAL_PIPELINE_STATS,
    # Signal queries
    SIGNALS_BY_COMPANY,
    HOT_ACCOUNTS,
    SIGNAL_STATS,
    # Sequence queries
    SEQUENCES_LIST,
    SEQUENCE_BY_ID,
    ENROLLMENTS_BY_SEQUENCE,
    # Attribution queries
    TOUCHPOINTS_BY_DEAL,
    CAMPAIGN_ATTRIBUTION,
    ATTRIBUTION_JOURNEY,
    # Lead queries
    LEADS_WITH_URGENCY,
)
from atlas.services.query_api.deps import embedder, neo4j_session, qdrant_client

# Import connector router
from atlas.api.routers.connectors import router as connectors_router
# Import signals intelligence router
from atlas.api.routers.signals_intelligence import router as signals_router

app = FastAPI(title="Graph Query API", version="0.4.0")  # bumped for signals intelligence

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(connectors_router)
app.include_router(signals_router)

QDRANT_COLLECTION = "atlas_entities"


def neo4j_to_dict(obj):
    """Convert Neo4j Node/Relationship objects to dictionaries"""
    if hasattr(obj, "items"):
        return {k: neo4j_to_dict(v) for k, v in obj.items()}
    elif hasattr(obj, "__iter__") and not isinstance(obj, str | bytes):
        return [neo4j_to_dict(item) for item in obj]
    return obj


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/clear")
def clear_all_data(
    s: Annotated[Session, Depends(neo4j_session)],
    qc: Annotated[QdrantClient, Depends(qdrant_client)],
):
    """
    Clear all data from Neo4j, Qdrant, and Redis.
    WARNING: This will delete all companies, people, and search indexes!
    """
    try:
        # Clear Neo4j
        s.run("MATCH (n) DETACH DELETE n")

        # Clear Qdrant collection
        with contextlib.suppress(Exception):
            # Collection might not exist, that's okay
            qc.delete_collection(QDRANT_COLLECTION)

        # Clear Redis cache
        from atlas.services.query_api.cache import r

        r.flushdb()

        return {
            "success": True,
            "message": "All data cleared successfully",
            "cleared": {
                "neo4j": True,
                "qdrant": True,
                "redis": True,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


class IngestRequest(BaseModel):
    query: str
    limit: int = 10
    use_google: bool = True
    use_hunter: bool = False
    load_to_neo4j: bool = True
    load_to_qdrant: bool = True


@app.post("/ingest")
def ingest_companies(request: IngestRequest):
    """
    Ingest companies from Google Places API with optional Hunter.io enrichment.
    Returns job status and batch ID.
    """
    import os

    from atlas.ingestors.google_places.client import GooglePlacesIngestor
    from atlas.ingestors.hunter.client import HunterPeopleFinder
    from atlas.pipelines.etl_pipeline import ETLPipeline, get_minio_client, get_neo4j_driver
    from atlas.pipelines.ingest_pipeline import IngestionPipeline

    try:
        if not request.use_google:
            return {"error": "Google Places is required for company search"}

        places_key = os.getenv("GOOGLE_PLACES_API_KEY")
        if not places_key:
            return {"error": "GOOGLE_PLACES_API_KEY not configured"}

        # Initialize ingestors
        company_ingestor = GooglePlacesIngestor(places_key)
        people_finder = None
        if request.use_hunter:
            hunter_key = os.getenv("HUNTER_API_KEY")
            if hunter_key:
                people_finder = HunterPeopleFinder(hunter_key)
            else:
                return {"error": "HUNTER_API_KEY not configured"}

        # Run ingestion pipeline
        pipeline = IngestionPipeline(company_ingestor, people_finder)
        prefix = pipeline.run(request.query, request.limit)

        batch_id = None
        qdrant_error = None
        if request.load_to_neo4j:
            mc = get_minio_client()
            neo4j = get_neo4j_driver()
            etl = ETLPipeline(mc, neo4j)
            try:
                batch_id = etl.run(prefix, load_to_qdrant=request.load_to_qdrant)
            except Exception as e:
                error_str = str(e)
                # Check if this is a Qdrant-specific error
                if (
                    "Qdrant" in error_str
                    or "fastembed" in error_str.lower()
                    or "Missing dependency" in error_str
                ):
                    qdrant_error = error_str
                    import traceback

                    print(f"WARNING: Qdrant load failed but Neo4j succeeded: {e}")
                    print(traceback.format_exc())
                    # batch_id should still be returned from etl.run() even if Qdrant fails
                    # But if it's None, generate one
                    if batch_id is None:
                        from atlas.etl.common.idempotency import new_batch_id

                        batch_id = new_batch_id()
                        print(f"Generated batch_id after Qdrant error: {batch_id}")
                else:
                    raise  # Re-raise other errors (Neo4j failures, etc.)

            # Clear Redis cache to show fresh data immediately
            from atlas.services.query_api.cache import r

            r.flushdb()
            print("Cache cleared after data ingestion")

        result = {
            "success": True,
            "batch_id": batch_id,
            "prefix": prefix,
            "companies_found": request.limit,  # Approximate
            "enriched": request.use_hunter,
            "loaded_to_neo4j": request.load_to_neo4j,
            "loaded_to_qdrant": request.load_to_qdrant and qdrant_error is None,
        }
        if qdrant_error:
            result["qdrant_warning"] = qdrant_error
        return result
    except ValueError as e:
        import traceback

        print(f"ValueError in ingest: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "success": False}
    except Exception as e:
        import traceback

        print(f"Exception in ingest: {e}")
        print(traceback.format_exc())
        return {"error": f"Failed to ingest: {str(e)}", "success": False}


@app.get("/companies")
def company_by_domain(domain: str, s: Annotated[Session, Depends(neo4j_session)]):
    key = key_of("companies", domain=domain)
    if v := cache_get(key):
        return v
    res = s.run(COMPANY_BY_DOMAIN, domain=domain).single()
    if res:
        out = {"company": res["company"], "people": res["people"], "emails": res["emails"]}
        cache_set(key, out, ttl=60)
        return out
    return {"company": None, "people": [], "emails": []}


@app.get("/people")
def people(q: str, s: Annotated[Session, Depends(neo4j_session)]):
    key = key_of("people", q=q)
    if v := cache_get(key):
        return v
    records = s.run(PEOPLE_BY_NAME, q=q).data()
    cache_set(key, records, ttl=60)
    return records


@app.get("/neighbors")
def neighbors(id: str, s: Annotated[Session, Depends(neo4j_session)], depth: int = 2):
    key = key_of("neighbors", id=id, depth=depth)
    if v := cache_get(key):
        return v
    rows = s.run(NEIGHBORS, id=id, depth=depth).data()
    cache_set(key, rows, ttl=30)
    return rows


@app.get("/companies/by-industry")
def companies_by_industry(industry: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Find companies by industry (e.g., 'Restaurant', 'Fitness', 'IT Services'). Use '__NULL__' for unclassified."""
    key = key_of("companies_by_industry", industry=industry)
    if v := cache_get(key):
        return v
    # Special handling for unclassified companies
    if industry == "__NULL__":
        query = """
        MATCH (c:Company)
        WHERE c.industry IS NULL
        OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
        RETURN 
          {id: c.id, name: c.name, domain: c.domain, industry: c.industry, employee_count: c.employee_count, location: c.location} as company,
          count(p) as people_count
        ORDER BY people_count DESC
        """
        records = s.run(query).data()
    else:
        records = s.run(COMPANIES_BY_INDUSTRY, industry=industry).data()
    cache_set(key, records, ttl=60)
    return records


@app.get("/companies/by-location")
def companies_by_location(location: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Find companies by location (e.g., 'Moscow')"""
    key = key_of("companies_by_location", location=location)
    if v := cache_get(key):
        return v
    records = s.run(COMPANIES_BY_LOCATION, location=location).data()
    cache_set(key, records, ttl=60)
    return records


@app.get("/people/by-department")
def people_by_department(department: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Find people by department (e.g., 'Management', 'IT', 'Facilities')"""
    key = key_of("people_by_department", department=department)
    if v := cache_get(key):
        return v
    records = s.run(PEOPLE_BY_DEPARTMENT, department=department).data()
    cache_set(key, records, ttl=60)
    return records


@app.get("/analytics/departments")
def department_analytics(s: Annotated[Session, Depends(neo4j_session)]):
    """Get list of all departments with person counts"""
    key = key_of("department_analytics")
    if v := cache_get(key):
        return v
    query = """
    MATCH (p:Person)
    WHERE p.department IS NOT NULL
    RETURN p.department as department, count(p) as person_count
    ORDER BY person_count DESC
    """
    records = s.run(query).data()
    cache_set(key, records, ttl=60)  # Reduced to 1 minute
    return records


@app.get("/analytics/industries")
def industry_analytics(s: Annotated[Session, Depends(neo4j_session)]):
    """Get industry statistics and company distribution"""
    key = key_of("industry_analytics")
    if v := cache_get(key):
        return v
    records = s.run(INDUSTRY_STATS).data()
    cache_set(key, records, ttl=300)  # Cache for 5 minutes
    return records


# Dependency types (inline Annotated keeps Pylance & Ruff happy)
EmbedFn = Annotated[Callable[[list[str]], list[list[float]]], Depends(embedder)]
QdrantDep = Annotated[QdrantClient, Depends(qdrant_client)]
Neo4jDep = Annotated[Session, Depends(neo4j_session)]


@app.get("/search")
def semantic_search(
    q: str = Query(..., description="Free text, e.g., 'CTO healthcare Boston'"),
    types: str = Query("company,person", description="Comma-separated: company,person"),
    k: int = Query(5, ge=1, le=50),
    qc: QdrantDep = None,
    embed: EmbedFn = None,
):
    """
    Vector search over Qdrant with OpenAI embeddings (FastEmbed fallback).
    Returns payloads + scores directly from the vector store.
    """
    key = key_of("semantic_search", q=q, types=types, k=k)
    if v := cache_get(key):
        return v

    vec = embed([q])[0]
    type_list = [t.strip() for t in types.split(",") if t.strip()]
    qfilter = None
    if type_list:
        # OR filter across requested types
        qfilter = Filter(
            should=[FieldCondition(key="type", match=MatchValue(value=t)) for t in type_list]
        )

    try:
        hits = qc.search(
            collection_name=QDRANT_COLLECTION,
            query_vector=vec,
            limit=k,
            query_filter=qfilter,
            with_payload=True,
            with_vectors=False,
        )
    except Exception as e:
        error_msg = str(e)
        if "doesn't exist" in error_msg or "not found" in error_msg.lower():
            return {
                "error": "Vector collection not found. Please load data first.",
                "message": "The search index is empty. Data needs to be imported into the system.",
            }
        raise

    out = [
        {
            "score": float(h.score),
            "id": h.id,  # Qdrant UUID (from ETL)
            **(h.payload or {}),
            # expose original human id if present
            "ext_id": (h.payload or {}).get("ext_id"),
        }
        for h in hits
    ]
    cache_set(key, out, ttl=30)
    return out


@app.get("/search/companies")
def semantic_companies(
    q: str,
    k: int = Query(5, ge=1, le=50),
    qc: QdrantDep = None,
    embed: EmbedFn = None,
):
    return semantic_search(q=q, types="company", k=k, qc=qc, embed=embed)


@app.get("/search/people")
def semantic_people(
    q: str,
    k: int = Query(5, ge=1, le=50),
    qc: QdrantDep = None,
    embed: EmbedFn = None,
):
    return semantic_search(q=q, types="person", k=k, qc=qc, embed=embed)


@app.get("/search/hybrid")
def semantic_then_graph(
    q: str,
    k: int = Query(5, ge=1, le=50),
    depth: int = Query(1, ge=0, le=3),
    s: Neo4jDep = None,
    qc: QdrantDep = None,
    embed: EmbedFn = None,
):
    """
    1) Vector search for top-k entities (company/person).
    2) Expand graph context from Neo4j:
       - company → /companies (domain-based) + optional neighbors(depth)
       - person  → returns the payload as-is (has company_domain/company_id)
    """
    base = semantic_search(q=q, types="company,person", k=k, qc=qc, embed=embed)

    def expand_company_by_domain(domain: str | None):
        if not domain:
            return None
        res = s.run(COMPANY_BY_DOMAIN, domain=domain).single()
        if not res:
            return None
        company = res["company"]
        neigh = s.run(NEIGHBORS, id=company["id"], depth=depth).data() if depth else []
        return {"company": company, "neighbors": neigh}

    expanded = []
    for r in base:
        if r.get("type") == "company":
            expanded.append(
                {
                    "score": r["score"],
                    "type": "company",
                    "payload": expand_company_by_domain(r.get("domain")),
                }
            )
        else:
            # Person payload already contains company link hints
            expanded.append(
                {
                    "score": r["score"],
                    "type": "person",
                    "payload": {
                        "person": {
                            "id": r.get("id"),
                            "ext_id": r.get("ext_id"),
                            "full_name": r.get("full_name"),
                            "title": r.get("title"),
                            "department": r.get("department"),
                            "company_id": r.get("company_id"),
                            "company_domain": r.get("company_domain"),
                        }
                    },
                }
            )

    return expanded


# ============================================================================
# COMPANY ENDPOINTS (Extended)
# ============================================================================


@app.get("/companies/{company_id}")
def company_by_id(company_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get company by ID with full details including locations and people"""
    key = key_of("company_by_id", company_id=company_id)
    if v := cache_get(key):
        return v
    res = s.run(COMPANY_BY_ID, id=company_id).single()
    if res:
        out = neo4j_to_dict({
            "company": res["company"],
            "industry_name": res["industry_name"],
            "locations": res["locations"],
            "people": res["people"],
        })
        cache_set(key, out, ttl=60)
        return out
    return {"company": None, "locations": [], "people": []}


@app.get("/companies/{company_id}/relationships")
def company_relationships(company_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get company relationships: competitors, partners, similar companies"""
    key = key_of("company_relationships", company_id=company_id)
    if v := cache_get(key):
        return v
    res = s.run(COMPANY_RELATIONSHIPS, company_id=company_id).single()
    if res:
        out = neo4j_to_dict({
            "competitors": res["competitors"],
            "partners": res["partners"],
            "similar_companies": res["similar_companies"],
        })
        cache_set(key, out, ttl=120)
        return out
    return {"competitors": [], "partners": [], "similar_companies": []}


# ============================================================================
# DEAL ENDPOINTS (MEDDPICC)
# ============================================================================


@app.get("/deals")
def list_deals(s: Annotated[Session, Depends(neo4j_session)]):
    """List all deals with company and owner info"""
    key = key_of("deals_list")
    if v := cache_get(key):
        return v
    records = s.run(DEALS_LIST).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


@app.get("/deals/pipeline-stats")
def deal_pipeline_stats(s: Annotated[Session, Depends(neo4j_session)]):
    """Get pipeline statistics by stage"""
    key = key_of("deal_pipeline_stats")
    if v := cache_get(key):
        return v
    records = s.run(DEAL_PIPELINE_STATS).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


@app.get("/deals/by-stage/{stage}")
def deals_by_stage(stage: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get deals filtered by stage"""
    key = key_of("deals_by_stage", stage=stage)
    if v := cache_get(key):
        return v
    records = s.run(DEALS_BY_STAGE, stage=stage).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


@app.get("/deals/by-company/{company_id}")
def deals_by_company(company_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get all deals for a specific company"""
    key = key_of("deals_by_company", company_id=company_id)
    if v := cache_get(key):
        return v
    records = s.run(DEALS_BY_COMPANY, company_id=company_id).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


@app.get("/deals/{deal_id}")
def deal_by_id(deal_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get deal by ID with full MEDDPICC details"""
    key = key_of("deal_by_id", deal_id=deal_id)
    if v := cache_get(key):
        return v
    res = s.run(DEAL_BY_ID, id=deal_id).single()
    if res:
        out = neo4j_to_dict({
            "deal": res["deal"],
            "company": res["company"],
            "owner": res["owner"],
            "champion": res["champion"],
            "economic_buyer": res["economic_buyer"],
            "location": res["location"],
            "contacts": res["contacts"],
        })
        cache_set(key, out, ttl=30)
        return out
    return {"deal": None}


# ============================================================================
# SIGNAL ENDPOINTS
# ============================================================================


@app.get("/signals/company/{company_id}")
def signals_by_company(
    company_id: str,
    limit: int = Query(20, ge=1, le=100),
    s: Annotated[Session, Depends(neo4j_session)] = None,
):
    """Get signals detected for a specific company"""
    key = key_of("signals_by_company", company_id=company_id, limit=limit)
    if v := cache_get(key):
        return v
    records = s.run(SIGNALS_BY_COMPANY, company_id=company_id, limit=limit).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


@app.get("/signals/hot-accounts")
def hot_accounts(
    min_score: int = Query(70, ge=0, le=100),
    limit: int = Query(20, ge=1, le=100),
    s: Annotated[Session, Depends(neo4j_session)] = None,
):
    """Get hot accounts based on intent score"""
    key = key_of("hot_accounts", min_score=min_score, limit=limit)
    if v := cache_get(key):
        return v
    records = s.run(HOT_ACCOUNTS, min_score=min_score, limit=limit).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=60)
    return out


@app.get("/signals/stats")
def signal_stats(
    days: int = Query(30, ge=1, le=365),
    s: Annotated[Session, Depends(neo4j_session)] = None,
):
    """Get signal statistics for the last N days"""
    key = key_of("signal_stats", days=days)
    if v := cache_get(key):
        return v
    records = s.run(SIGNAL_STATS, days=days).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=120)
    return out


# ============================================================================
# OUTREACH & SEQUENCE ENDPOINTS
# ============================================================================


@app.get("/sequences")
def list_sequences(s: Annotated[Session, Depends(neo4j_session)]):
    """List all outreach sequences with stats"""
    key = key_of("sequences_list")
    if v := cache_get(key):
        return v
    records = s.run(SEQUENCES_LIST).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


@app.get("/sequences/{sequence_id}")
def sequence_by_id(sequence_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get sequence by ID with enrollments"""
    key = key_of("sequence_by_id", sequence_id=sequence_id)
    if v := cache_get(key):
        return v
    res = s.run(SEQUENCE_BY_ID, id=sequence_id).single()
    if res:
        out = neo4j_to_dict({
            "sequence": res["sequence"],
            "created_by": res["created_by"],
            "channels": res["channels"],
            "enrollments": res["enrollments"],
        })
        cache_set(key, out, ttl=30)
        return out
    return {"sequence": None}


@app.get("/sequences/{sequence_id}/enrollments")
def sequence_enrollments(sequence_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get all enrollments for a sequence"""
    key = key_of("sequence_enrollments", sequence_id=sequence_id)
    if v := cache_get(key):
        return v
    records = s.run(ENROLLMENTS_BY_SEQUENCE, sequence_id=sequence_id).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


# ============================================================================
# ATTRIBUTION ENDPOINTS
# ============================================================================


@app.get("/attribution/deal/{deal_id}")
def touchpoints_by_deal(deal_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get all touchpoints attributed to a deal"""
    key = key_of("touchpoints_by_deal", deal_id=deal_id)
    if v := cache_get(key):
        return v
    records = s.run(TOUCHPOINTS_BY_DEAL, deal_id=deal_id).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=60)
    return out


@app.get("/attribution/campaigns")
def campaign_attribution(s: Annotated[Session, Depends(neo4j_session)]):
    """Get attribution stats for all campaigns"""
    key = key_of("campaign_attribution")
    if v := cache_get(key):
        return v
    records = s.run(CAMPAIGN_ATTRIBUTION).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=120)
    return out


@app.get("/attribution/journey/{company_id}")
def attribution_journey(company_id: str, s: Annotated[Session, Depends(neo4j_session)]):
    """Get the attribution journey for a company"""
    key = key_of("attribution_journey", company_id=company_id)
    if v := cache_get(key):
        return v
    records = s.run(ATTRIBUTION_JOURNEY, company_id=company_id).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=60)
    return out


# ============================================================================
# LEAD ENDPOINTS
# ============================================================================


@app.get("/leads")
def list_leads(
    limit: int = Query(50, ge=1, le=200),
    s: Annotated[Session, Depends(neo4j_session)] = None,
):
    """Get prospect leads with urgency info"""
    key = key_of("leads_list", limit=limit)
    if v := cache_get(key):
        return v
    records = s.run(LEADS_WITH_URGENCY, limit=limit).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=30)
    return out


# ============================================================================
# ANALYTICS ENDPOINTS (Extended)
# ============================================================================


@app.get("/analytics/bowtie")
def bowtie_metrics(s: Annotated[Session, Depends(neo4j_session)]):
    """Get bowtie funnel metrics by stage"""
    key = key_of("bowtie_metrics")
    if v := cache_get(key):
        return v

    # Count companies at each stage
    query = """
    MATCH (c:Company)
    WHERE c.is_prospect = true
    OPTIONAL MATCH (d:Deal)-[:FOR_COMPANY]->(c)
    WITH c, d
    RETURN
      count(DISTINCT CASE WHEN d IS NULL THEN c END) as awareness,
      count(DISTINCT CASE WHEN d.stage IN ['identified', 'qualified'] THEN c END) as interest,
      count(DISTINCT CASE WHEN d.stage IN ['engaged', 'pipeline'] THEN c END) as consideration,
      count(DISTINCT CASE WHEN d.stage IN ['proposal', 'negotiation'] THEN c END) as intent,
      count(DISTINCT CASE WHEN d.stage = 'committed' THEN c END) as evaluation,
      count(DISTINCT CASE WHEN d.stage = 'closed_won' THEN c END) as purchase,
      count(DISTINCT CASE WHEN d.stage = 'closed_won' AND d.deal_type = 'expansion' THEN c END) as loyalty,
      count(DISTINCT CASE WHEN d.stage = 'closed_won' AND d.deal_type = 'upsell' THEN c END) as advocacy
    """
    res = s.run(query).single()
    if res:
        out = {
            "awareness": res["awareness"],
            "interest": res["interest"],
            "consideration": res["consideration"],
            "intent": res["intent"],
            "evaluation": res["evaluation"],
            "purchase": res["purchase"],
            "loyalty": res["loyalty"],
            "advocacy": res["advocacy"],
        }
        cache_set(key, out, ttl=120)
        return out
    return {}


@app.get("/analytics/funnel")
def conversion_funnel(s: Annotated[Session, Depends(neo4j_session)]):
    """Get conversion funnel with rates"""
    key = key_of("conversion_funnel")
    if v := cache_get(key):
        return v

    # Get deal counts by stage with conversion tracking
    query = """
    MATCH (d:Deal)-[:FOR_COMPANY]->(c:Company)
    WITH d.stage as stage, count(d) as count
    ORDER BY
      CASE stage
        WHEN 'identified' THEN 1
        WHEN 'qualified' THEN 2
        WHEN 'engaged' THEN 3
        WHEN 'pipeline' THEN 4
        WHEN 'proposal' THEN 5
        WHEN 'negotiation' THEN 6
        WHEN 'committed' THEN 7
        WHEN 'closed_won' THEN 8
        WHEN 'closed_lost' THEN 9
      END
    RETURN stage, count
    """
    records = s.run(query).data()
    out = neo4j_to_dict(records)
    cache_set(key, out, ttl=60)
    return out
