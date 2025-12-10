# src/atlas/api/routers/data.py
"""
Data API Router - Serves synthetic data from Neo4j for the frontend.

Provides endpoints for:
- Companies and contacts
- Deals and pipeline
- Signals and intent data
- Activities
- Dashboard metrics
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import json

from neo4j import GraphDatabase

router = APIRouter(prefix="/api", tags=["data"])

# Neo4j connection
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4jpass")


def get_neo4j_driver():
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def record_to_dict(record) -> dict:
    """Convert Neo4j record to dictionary"""
    result = {}
    for key in record.keys():
        value = record[key]
        if hasattr(value, 'items'):  # Node
            result[key] = dict(value.items())
        else:
            result[key] = value
    return result


# =============================================================================
# Companies
# =============================================================================

@router.get("/companies")
async def get_companies(
    industry: Optional[str] = None,
    country: Optional[str] = None,
    size: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0
):
    """Get list of companies"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            # Build query with filters
            filters = []
            params = {"limit": limit, "offset": offset}

            if industry:
                filters.append("c.industry = $industry")
                params["industry"] = industry
            if country:
                filters.append("c.country = $country")
                params["country"] = country
            if size:
                filters.append("c.size = $size")
                params["size"] = size

            where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

            query = f"""
                MATCH (c:Company)
                {where_clause}
                OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
                OPTIONAL MATCH (d:Deal)-[:BELONGS_TO]->(c)
                WITH c, count(DISTINCT p) as contact_count, count(DISTINCT d) as deal_count
                RETURN c, contact_count, deal_count
                ORDER BY c.name
                SKIP $offset
                LIMIT $limit
            """

            result = session.run(query, params)
            companies = []
            for record in result:
                company = dict(record["c"].items())
                company["contact_count"] = record["contact_count"]
                company["deal_count"] = record["deal_count"]
                companies.append(company)

            # Get total count
            count_query = f"MATCH (c:Company) {where_clause} RETURN count(c) as total"
            count_result = session.run(count_query, params)
            total = count_result.single()["total"]

            return {"companies": companies, "total": total}
    finally:
        driver.close()


@router.get("/companies/{company_id}")
async def get_company(company_id: str):
    """Get company details with contacts and deals"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            # Get company
            result = session.run("""
                MATCH (c:Company {id: $id})
                RETURN c
            """, id=company_id)
            record = result.single()
            if not record:
                raise HTTPException(status_code=404, detail="Company not found")

            company = dict(record["c"].items())

            # Get contacts
            contacts_result = session.run("""
                MATCH (p:Person)-[:WORKS_AT]->(c:Company {id: $id})
                RETURN p
                ORDER BY p.seniority, p.full_name
            """, id=company_id)
            company["contacts"] = [dict(r["p"].items()) for r in contacts_result]

            # Get deals
            deals_result = session.run("""
                MATCH (d:Deal)-[:BELONGS_TO]->(c:Company {id: $id})
                RETURN d
                ORDER BY d.created_at DESC
            """, id=company_id)
            company["deals"] = [dict(r["d"].items()) for r in deals_result]

            # Get signals
            signals_result = session.run("""
                MATCH (s:Signal)-[:ABOUT]->(c:Company {id: $id})
                RETURN s
                ORDER BY s.detected_at DESC
                LIMIT 10
            """, id=company_id)
            company["signals"] = [dict(r["s"].items()) for r in signals_result]

            return company
    finally:
        driver.close()


# =============================================================================
# Contacts / People
# =============================================================================

@router.get("/contacts")
async def get_contacts(
    company_id: Optional[str] = None,
    seniority: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0
):
    """Get list of contacts"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            filters = []
            params = {"limit": limit, "offset": offset}

            if company_id:
                filters.append("c.id = $company_id")
                params["company_id"] = company_id
            if seniority:
                filters.append("p.seniority = $seniority")
                params["seniority"] = seniority

            where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

            query = f"""
                MATCH (p:Person)-[:WORKS_AT]->(c:Company)
                {where_clause}
                RETURN p, c.name as company_name, c.id as company_id
                ORDER BY p.full_name
                SKIP $offset
                LIMIT $limit
            """

            result = session.run(query, params)
            contacts = []
            for record in result:
                contact = dict(record["p"].items())
                contact["company_name"] = record["company_name"]
                contact["company_id"] = record["company_id"]
                contacts.append(contact)

            return {"contacts": contacts, "total": len(contacts)}
    finally:
        driver.close()


# =============================================================================
# Deals / Pipeline
# =============================================================================

@router.get("/deals")
async def get_deals(
    stage: Optional[str] = None,
    company_id: Optional[str] = None,
    owner: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0
):
    """Get list of deals"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            filters = []
            params = {"limit": limit, "offset": offset}

            if stage:
                filters.append("d.stage = $stage")
                params["stage"] = stage
            if company_id:
                filters.append("c.id = $company_id")
                params["company_id"] = company_id
            if owner:
                filters.append("d.owner = $owner")
                params["owner"] = owner

            where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

            query = f"""
                MATCH (d:Deal)-[:BELONGS_TO]->(c:Company)
                {where_clause}
                OPTIONAL MATCH (d)-[:PRIMARY_CONTACT]->(p:Person)
                RETURN d, c.name as company_name, c.id as company_id, p.full_name as contact_name
                ORDER BY d.value DESC
                SKIP $offset
                LIMIT $limit
            """

            result = session.run(query, params)
            deals = []
            for record in result:
                deal = dict(record["d"].items())
                deal["company_name"] = record["company_name"]
                deal["company_id"] = record["company_id"]
                deal["contact_name"] = record["contact_name"]
                # Parse competitors from JSON
                if "competitors_json" in deal:
                    deal["competitors"] = json.loads(deal.pop("competitors_json"))
                deals.append(deal)

            return {"deals": deals, "total": len(deals)}
    finally:
        driver.close()


@router.get("/deals/pipeline-stats")
async def get_pipeline_stats():
    """Get pipeline statistics for dashboard"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (d:Deal)
                WITH d.stage as stage, count(d) as count, sum(d.value) as value
                RETURN stage, count, value
                ORDER BY
                    CASE stage
                        WHEN 'Discovery' THEN 1
                        WHEN 'Qualification' THEN 2
                        WHEN 'Proposal' THEN 3
                        WHEN 'Negotiation' THEN 4
                        WHEN 'Closed Won' THEN 5
                        WHEN 'Closed Lost' THEN 6
                    END
            """)

            stages = []
            total_value = 0
            total_count = 0
            weighted_value = 0

            for record in result:
                stage_data = {
                    "stage": record["stage"],
                    "count": record["count"],
                    "value": record["value"]
                }
                stages.append(stage_data)
                total_count += record["count"]
                total_value += record["value"]

                # Calculate weighted value
                prob = {"Discovery": 0.1, "Qualification": 0.25, "Proposal": 0.5,
                       "Negotiation": 0.75, "Closed Won": 1.0, "Closed Lost": 0}.get(record["stage"], 0)
                weighted_value += record["value"] * prob

            return {
                "stages": stages,
                "total_count": total_count,
                "total_value": total_value,
                "weighted_value": int(weighted_value),
                "currency": "EUR"
            }
    finally:
        driver.close()


@router.get("/deals/{deal_id}")
async def get_deal(deal_id: str):
    """Get deal details with activities"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (d:Deal {id: $id})-[:BELONGS_TO]->(c:Company)
                OPTIONAL MATCH (d)-[:PRIMARY_CONTACT]->(p:Person)
                RETURN d, c, p
            """, id=deal_id)
            record = result.single()
            if not record:
                raise HTTPException(status_code=404, detail="Deal not found")

            deal = dict(record["d"].items())
            deal["company"] = dict(record["c"].items())
            if record["p"]:
                deal["primary_contact"] = dict(record["p"].items())

            # Parse competitors
            if "competitors_json" in deal:
                deal["competitors"] = json.loads(deal.pop("competitors_json"))

            # Get activities
            activities_result = session.run("""
                MATCH (a:Activity)-[:RELATED_TO]->(d:Deal {id: $id})
                RETURN a
                ORDER BY a.performed_at DESC
                LIMIT 20
            """, id=deal_id)
            deal["activities"] = [dict(r["a"].items()) for r in activities_result]

            return deal
    finally:
        driver.close()


# =============================================================================
# Signals
# =============================================================================

@router.get("/signals")
async def get_signals(
    signal_type: Optional[str] = None,
    impact: Optional[str] = None,
    company_id: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0
):
    """Get list of signals"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            filters = []
            params = {"limit": limit, "offset": offset}

            if signal_type:
                filters.append("s.type = $type")
                params["type"] = signal_type
            if impact:
                filters.append("s.impact = $impact")
                params["impact"] = impact
            if company_id:
                filters.append("c.id = $company_id")
                params["company_id"] = company_id
            if is_read is not None:
                filters.append("s.is_read = $is_read")
                params["is_read"] = is_read

            where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

            query = f"""
                MATCH (s:Signal)-[:ABOUT]->(c:Company)
                {where_clause}
                RETURN s, c.name as company_name, c.id as company_id
                ORDER BY s.detected_at DESC
                SKIP $offset
                LIMIT $limit
            """

            result = session.run(query, params)
            signals = []
            for record in result:
                signal = dict(record["s"].items())
                signal["company_name"] = record["company_name"]
                signal["company_id"] = record["company_id"]
                signals.append(signal)

            return {"signals": signals, "total": len(signals)}
    finally:
        driver.close()


@router.get("/signals/summary")
async def get_signals_summary():
    """Get signals summary for dashboard"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (s:Signal)
                WITH s.type as type, s.impact as impact, count(s) as count
                RETURN type, impact, count
                ORDER BY count DESC
            """)

            by_type = {}
            by_impact = {"high": 0, "medium": 0, "low": 0}
            total = 0

            for record in result:
                sig_type = record["type"]
                impact = record["impact"]
                count = record["count"]

                by_type[sig_type] = by_type.get(sig_type, 0) + count
                by_impact[impact] = by_impact.get(impact, 0) + count
                total += count

            # Get unread count
            unread_result = session.run("""
                MATCH (s:Signal {is_read: false})
                RETURN count(s) as unread
            """)
            unread = unread_result.single()["unread"]

            return {
                "total": total,
                "unread": unread,
                "by_type": by_type,
                "by_impact": by_impact
            }
    finally:
        driver.close()


# =============================================================================
# Meetings
# =============================================================================

@router.get("/meetings")
async def get_meetings(
    upcoming_only: bool = True,
    limit: int = Query(default=20, le=100)
):
    """Get meetings list"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            now = datetime.now().isoformat()

            if upcoming_only:
                query = """
                    MATCH (m:Meeting)-[:WITH]->(c:Company)
                    WHERE m.start_time >= $now
                    OPTIONAL MATCH (m)-[:FOR_DEAL]->(d:Deal)
                    RETURN m, c.name as company_name, c.id as company_id, d.name as deal_name
                    ORDER BY m.start_time ASC
                    LIMIT $limit
                """
            else:
                query = """
                    MATCH (m:Meeting)-[:WITH]->(c:Company)
                    OPTIONAL MATCH (m)-[:FOR_DEAL]->(d:Deal)
                    RETURN m, c.name as company_name, c.id as company_id, d.name as deal_name
                    ORDER BY m.start_time DESC
                    LIMIT $limit
                """

            result = session.run(query, now=now, limit=limit)
            meetings = []
            for record in result:
                meeting = dict(record["m"].items())
                meeting["company_name"] = record["company_name"]
                meeting["company_id"] = record["company_id"]
                meeting["deal_name"] = record["deal_name"]
                # Parse attendees
                if "attendees_json" in meeting:
                    meeting["attendees"] = json.loads(meeting.pop("attendees_json"))
                meetings.append(meeting)

            return {"meetings": meetings, "total": len(meetings)}
    finally:
        driver.close()


# =============================================================================
# Dashboard / Metrics
# =============================================================================

@router.get("/dashboard/metrics")
async def get_dashboard_metrics():
    """Get dashboard overview metrics"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            # Get counts - use separate queries for reliability
            companies_result = session.run("MATCH (c:Company) RETURN count(c) as count")
            companies = companies_result.single()["count"]

            contacts_result = session.run("MATCH (p:Person) RETURN count(p) as count")
            contacts = contacts_result.single()["count"]

            deals_result = session.run("""
                MATCH (d:Deal)
                WHERE NOT d.stage IN ['Closed Won', 'Closed Lost']
                RETURN count(d) as count, sum(d.value) as value
            """)
            deals_record = deals_result.single()
            open_deals = deals_record["count"]
            pipeline_value = deals_record["value"] or 0

            signals_result = session.run("MATCH (s:Signal) WHERE s.is_read = false RETURN count(s) as count")
            unread_signals = signals_result.single()["count"]

            meetings_result = session.run("MATCH (m:Meeting) RETURN count(m) as count")
            upcoming_meetings = meetings_result.single()["count"]

            # Get recent activities
            activities_result = session.run("""
                MATCH (a:Activity)
                RETURN a.type as type, count(a) as count
            """)
            activity_counts = {r["type"]: r["count"] for r in activities_result}

            # Get won deals this month
            won_result = session.run("""
                MATCH (d:Deal {stage: 'Closed Won'})
                RETURN count(d) as won_count, sum(d.value) as won_value
            """)
            won = won_result.single()

            return {
                "companies": companies,
                "contacts": contacts,
                "open_deals": open_deals,
                "pipeline_value": pipeline_value,
                "unread_signals": unread_signals,
                "upcoming_meetings": upcoming_meetings,
                "won_deals": won["won_count"] if won else 0,
                "won_value": won["won_value"] if won else 0,
                "activity_counts": activity_counts,
                "currency": "EUR"
            }
    finally:
        driver.close()


@router.get("/dashboard/activity-feed")
async def get_activity_feed(limit: int = Query(default=20, le=50)):
    """Get recent activity feed"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (a:Activity)-[:RELATED_TO]->(d:Deal)-[:BELONGS_TO]->(c:Company)
                RETURN a, d.name as deal_name, c.name as company_name
                ORDER BY a.performed_at DESC
                LIMIT $limit
            """, limit=limit)

            activities = []
            for record in result:
                activity = dict(record["a"].items())
                activity["deal_name"] = record["deal_name"]
                activity["company_name"] = record["company_name"]
                activities.append(activity)

            return {"activities": activities}
    finally:
        driver.close()


# =============================================================================
# Search
# =============================================================================

@router.get("/search")
async def search(
    q: str = Query(..., min_length=2),
    entity_type: Optional[str] = None
):
    """Search across companies, contacts, and deals"""
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            results = {"companies": [], "contacts": [], "deals": []}
            search_term = f"(?i).*{q}.*"

            if not entity_type or entity_type == "companies":
                company_result = session.run("""
                    MATCH (c:Company)
                    WHERE c.name =~ $term OR c.industry =~ $term
                    RETURN c
                    LIMIT 10
                """, term=search_term)
                results["companies"] = [dict(r["c"].items()) for r in company_result]

            if not entity_type or entity_type == "contacts":
                contact_result = session.run("""
                    MATCH (p:Person)-[:WORKS_AT]->(c:Company)
                    WHERE p.full_name =~ $term OR p.job_title =~ $term
                    RETURN p, c.name as company_name
                    LIMIT 10
                """, term=search_term)
                results["contacts"] = [{**dict(r["p"].items()), "company_name": r["company_name"]} for r in contact_result]

            if not entity_type or entity_type == "deals":
                deal_result = session.run("""
                    MATCH (d:Deal)-[:BELONGS_TO]->(c:Company)
                    WHERE d.name =~ $term OR d.product =~ $term
                    RETURN d, c.name as company_name
                    LIMIT 10
                """, term=search_term)
                results["deals"] = [{**dict(r["d"].items()), "company_name": r["company_name"]} for r in deal_result]

            return results
    finally:
        driver.close()
