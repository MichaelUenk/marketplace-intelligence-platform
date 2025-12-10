from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

from atlas.services.query_api.cache import cache_get, cache_set, key_of
from atlas.services.query_api.cypher_queries import (
    COMPANIES_BY_INDUSTRY,
    COMPANIES_BY_LOCATION,
    COMPANY_BY_DOMAIN,
    INDUSTRY_STATS,
    NEIGHBORS,
    PEOPLE_BY_DEPARTMENT,
    PEOPLE_BY_NAME,
)
from atlas.services.query_api.deps import embedder, neo4j_session, qdrant_client
from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from neo4j import Session
from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

app = FastAPI(title="Graph Query API", version="0.6.0")  # bumped for intent analysis

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
from atlas.api.routers.connectors import router as connectors_router
from atlas.api.routers.thought_leadership import router as thought_leadership_router
from atlas.api.routers.data import router as data_router
from atlas.api.routers.signals_intelligence import router as signals_router
from atlas.api.routers.intent_analysis import router as intent_router
from atlas.api.routers.deep_work import router as deep_work_router
app.include_router(connectors_router)
app.include_router(thought_leadership_router)
app.include_router(data_router)
app.include_router(signals_router)
app.include_router(intent_router)
app.include_router(deep_work_router)

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
    """Find companies by industry (e.g., 'Restaurant', 'Fitness', 'IT Services')"""
    key = key_of("companies_by_industry", industry=industry)
    if v := cache_get(key):
        return v
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

    hits = qc.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=vec,
        limit=k,
        query_filter=qfilter,
        with_payload=True,
        with_vectors=False,
    )

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
