#!/usr/bin/env python3
"""
iBood Signals Intelligence - Demo Data Generator

Generates comprehensive demo data for the signals intelligence platform:
- Companies (consumer goods suppliers)
- Signals (detected opportunities)
- Historical outcomes (for the learning loop)
- Vector embeddings (for RAG retrieval)

This creates a realistic demo environment with the learning loop fully operational.
"""

import os
import sys
import uuid
import random
from datetime import datetime, timedelta
from typing import Any

# Add the src path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "data-backbone", "src"))

from neo4j import GraphDatabase

# ============================================================================
# DEMO DATA
# ============================================================================

DEMO_COMPANIES = [
    {
        "id": "comp_philips",
        "name": "Philips Consumer Lifestyle",
        "country": "Netherlands",
        "revenue_eur": 6800000000,
        "categories": ["consumer_electronics", "health_beauty", "home_appliances"],
        "status": "active_supplier",
        "website": "https://www.philips.com",
        "past_gmv": 2400000,
        "has_contact": True,
    },
    {
        "id": "comp_xiaomi",
        "name": "Xiaomi",
        "country": "China",
        "revenue_eur": 32000000000,
        "categories": ["consumer_electronics", "home_appliances"],
        "status": "new",
        "website": "https://www.mi.com",
        "past_gmv": 0,
        "has_contact": False,
    },
    {
        "id": "comp_seb",
        "name": "Groupe SEB (Tefal, Krups, Rowenta)",
        "country": "France",
        "revenue_eur": 8100000000,
        "categories": ["home_appliances"],
        "status": "contacted",
        "website": "https://www.groupeseb.com",
        "past_gmv": 850000,
        "has_contact": True,
    },
    {
        "id": "comp_dyson",
        "name": "Dyson",
        "country": "United Kingdom",
        "revenue_eur": 7200000000,
        "categories": ["home_appliances"],
        "status": "watching",
        "website": "https://www.dyson.com",
        "past_gmv": 0,
        "has_contact": False,
    },
    {
        "id": "comp_sony",
        "name": "Sony Consumer Electronics",
        "country": "Japan",
        "revenue_eur": 85000000000,
        "categories": ["consumer_electronics"],
        "status": "active_supplier",
        "website": "https://www.sony.com",
        "past_gmv": 1200000,
        "has_contact": True,
    },
    {
        "id": "comp_bosch",
        "name": "Bosch Home Appliances",
        "country": "Germany",
        "revenue_eur": 14000000000,
        "categories": ["home_appliances"],
        "status": "contacted",
        "website": "https://www.bosch-home.com",
        "past_gmv": 450000,
        "has_contact": True,
    },
    {
        "id": "comp_garmin",
        "name": "Garmin",
        "country": "United States",
        "revenue_eur": 4500000000,
        "categories": ["consumer_electronics", "sports_fitness"],
        "status": "watching",
        "website": "https://www.garmin.com",
        "past_gmv": 320000,
        "has_contact": True,
    },
    {
        "id": "comp_lg",
        "name": "LG Electronics",
        "country": "South Korea",
        "revenue_eur": 56000000000,
        "categories": ["consumer_electronics", "home_appliances"],
        "status": "active_supplier",
        "website": "https://www.lg.com",
        "past_gmv": 1800000,
        "has_contact": True,
    },
    {
        "id": "comp_loreal",
        "name": "L'Oréal Consumer Products",
        "country": "France",
        "revenue_eur": 38000000000,
        "categories": ["health_beauty"],
        "status": "contacted",
        "website": "https://www.loreal.com",
        "past_gmv": 680000,
        "has_contact": True,
    },
    {
        "id": "comp_beiersdorf",
        "name": "Beiersdorf (Nivea)",
        "country": "Germany",
        "revenue_eur": 9000000000,
        "categories": ["health_beauty"],
        "status": "new",
        "website": "https://www.beiersdorf.com",
        "past_gmv": 0,
        "has_contact": False,
    },
    {
        "id": "comp_stanley",
        "name": "Stanley Black & Decker",
        "country": "United States",
        "revenue_eur": 15000000000,
        "categories": ["diy_tools", "garden_outdoor"],
        "status": "watching",
        "website": "https://www.stanleyblackanddecker.com",
        "past_gmv": 220000,
        "has_contact": True,
    },
    {
        "id": "comp_husqvarna",
        "name": "Husqvarna Group",
        "country": "Sweden",
        "revenue_eur": 5200000000,
        "categories": ["garden_outdoor", "diy_tools"],
        "status": "new",
        "website": "https://www.husqvarnagroup.com",
        "past_gmv": 0,
        "has_contact": False,
    },
    {
        "id": "comp_samsonite",
        "name": "Samsonite",
        "country": "United States",
        "revenue_eur": 3400000000,
        "categories": ["fashion_accessories"],
        "status": "contacted",
        "website": "https://www.samsonite.com",
        "past_gmv": 180000,
        "has_contact": True,
    },
    {
        "id": "comp_decathlon",
        "name": "Decathlon",
        "country": "France",
        "revenue_eur": 15000000000,
        "categories": ["sports_fitness"],
        "status": "watching",
        "website": "https://www.decathlon.com",
        "past_gmv": 0,
        "has_contact": False,
    },
    {
        "id": "comp_brabantia",
        "name": "Brabantia",
        "country": "Netherlands",
        "revenue_eur": 450000000,
        "categories": ["home_living", "household_nonfood"],
        "status": "active_supplier",
        "website": "https://www.brabantia.com",
        "past_gmv": 520000,
        "has_contact": True,
    },
]

# Signals with source texts that simulate real news/earnings
DEMO_SIGNALS = [
    {
        "company_id": "comp_philips",
        "signal_type": "inventory_surplus",
        "source_type": "earnings_call",
        "source_text": """
        Q3 2024 Earnings Call Transcript - Philips

        CFO: "We continue to work through elevated inventory levels in our Personal Health segment,
        with approximately €120 million in excess stock primarily in grooming and oral care categories.
        We are exploring all channels to optimize inventory levels before year-end, including
        promotional partnerships with key retail partners."

        Analyst: "Can you quantify the expected write-down?"
        CFO: "We anticipate a €15-20 million inventory adjustment this quarter."
        """,
        "title": "Q3 Inventory Surplus Alert",
        "estimated_value": 120000000,
        "likely_discount_range": "40-60%",
        "competition_level": "high",
    },
    {
        "company_id": "comp_xiaomi",
        "signal_type": "european_market_entry",
        "source_type": "press_release",
        "source_text": """
        PRESS RELEASE - Xiaomi Corporation

        Xiaomi Announces Major European Expansion

        BEIJING, December 8, 2024 - Xiaomi Corporation today announced plans to expand its direct
        retail presence to 12 additional EU countries by Q2 2025, including Netherlands, Belgium,
        Austria, and 9 other markets.

        "We are actively seeking strategic retail and e-commerce partners to accelerate our
        European expansion," said Lu Weibing, President of Xiaomi. "Our smart home, wearables,
        and smartphone categories are seeing strong demand in Western Europe."

        The expansion will include opening flagship stores and establishing distribution partnerships.
        """,
        "title": "EU Expansion to 12 Countries",
        "estimated_value": None,
        "likely_discount_range": "Launch pricing negotiable",
        "competition_level": "medium",
    },
    {
        "company_id": "comp_seb",
        "signal_type": "product_discontinuation",
        "source_type": "industry_publication",
        "source_text": """
        Industry Insider Report - Home Appliances Weekly

        Groupe SEB to Phase Out Three Cookware Lines

        Sources at Groupe SEB have confirmed the company will discontinue three cookware product
        lines under the Tefal brand. The discontinuation affects approximately 50,000 units
        currently in European warehouses.

        "The company is looking to clear inventory before Q1 2025 to make room for new product
        launches," said an industry analyst. "This represents a significant clearance opportunity
        for deal-focused retailers."

        The affected lines include non-stick frying pans and cookware sets from the 2022 range.
        """,
        "title": "Cookware Line Phase-Out",
        "estimated_value": 2500000,
        "likely_discount_range": "50-70%",
        "competition_level": "medium",
    },
    {
        "company_id": "comp_dyson",
        "signal_type": "new_factory",
        "source_type": "news",
        "source_text": """
        Financial Times - December 5, 2024

        Dyson Opens New Malaysian Manufacturing Facility

        Dyson has opened a new €150 million manufacturing facility in Johor, Malaysia,
        which is expected to increase the company's production capacity by 40%.

        Industry analysts note that such capacity increases often lead to temporary
        oversupply during the ramp-up phase, typically occurring 3-6 months after opening.

        "We expect to see Dyson seeking additional distribution channels as production
        scales up," noted a Morgan Stanley analyst.
        """,
        "title": "Malaysia Factory Expansion",
        "estimated_value": None,
        "likely_discount_range": "TBD",
        "competition_level": "low",
    },
    {
        "company_id": "comp_sony",
        "signal_type": "earnings_miss",
        "source_type": "earnings_transcript",
        "source_text": """
        Sony Q3 FY2024 Earnings Report

        Consumer electronics division reported revenue of ¥2.1 trillion, down 12% YoY,
        significantly below analyst expectations of ¥2.4 trillion.

        CEO Kenichiro Yoshida: "We acknowledge the disappointing results in our consumer
        electronics segment. We are implementing restructuring measures including inventory
        optimization across all product categories."

        The company announced plans to reduce inventory levels by 25% over the next two quarters.
        """,
        "title": "Consumer Electronics Division -12%",
        "estimated_value": None,
        "likely_discount_range": "30-50%",
        "competition_level": "high",
    },
    {
        "company_id": "comp_bosch",
        "signal_type": "trade_show_attendance",
        "source_type": "trade_show_calendar",
        "source_text": """
        IFA Berlin 2025 - Confirmed Exhibitors

        Bosch Home Appliances - Hall 2, Stand 201

        Bosch will showcase its latest innovations in smart home appliances, including
        new energy-efficient washing machines and connected kitchen solutions.

        The company has requested meetings with major European retailers during the show.
        """,
        "title": "IFA Berlin 2025 Exhibitor",
        "estimated_value": None,
        "likely_discount_range": None,
        "competition_level": "low",
    },
    {
        "company_id": "comp_garmin",
        "signal_type": "category_oversupply",
        "source_type": "analyst_report",
        "source_text": """
        IDC Market Research Report - Wearables Q3 2024

        The global fitness wearables market is experiencing significant oversupply,
        with inventory levels 15% above optimal across major brands including Garmin,
        Fitbit, and Xiaomi.

        "We expect aggressive promotional activity in Q4 as brands work to clear
        elevated inventory before year-end," noted IDC analyst Jitesh Ubrani.

        Garmin specifically holds approximately 2 months excess inventory in European
        distribution centers.
        """,
        "title": "Fitness Tracker Market Oversupply",
        "estimated_value": None,
        "likely_discount_range": "25-40%",
        "competition_level": "medium",
    },
    {
        "company_id": "comp_lg",
        "signal_type": "warehouse_clearance",
        "source_type": "news",
        "source_text": """
        Reuters - December 3, 2024

        LG Electronics to Consolidate European Distribution

        LG Electronics announced plans to consolidate its European distribution network,
        closing two warehouses in Belgium and moving operations to a new centralized
        facility in Poland.

        The transition, scheduled for Q1 2025, will require clearing existing inventory
        at the closing locations. Industry sources estimate approximately €80 million
        in product will need to be moved or liquidated.
        """,
        "title": "Belgium Warehouse Closure",
        "estimated_value": 80000000,
        "likely_discount_range": "35-55%",
        "competition_level": "medium",
    },
    {
        "company_id": "comp_loreal",
        "signal_type": "seasonal_clearance",
        "source_type": "news",
        "source_text": """
        Beauty Industry News - December 7, 2024

        L'Oréal Prepares for Post-Holiday Clearance

        With the holiday season in full swing, L'Oréal is already planning its post-season
        clearance strategy. The company typically offers significant discounts on gift sets
        and limited edition products starting January 2nd.

        "We expect larger than usual clearance volumes this year due to conservative
        holiday purchasing by retailers," noted a company spokesperson.
        """,
        "title": "Post-Holiday Gift Set Clearance",
        "estimated_value": 15000000,
        "likely_discount_range": "40-60%",
        "competition_level": "high",
    },
    {
        "company_id": "comp_stanley",
        "signal_type": "leadership_change",
        "source_type": "press_release",
        "source_text": """
        Stanley Black & Decker Announces New CFO

        HARTFORD, CT - December 1, 2024 - Stanley Black & Decker today announced the
        appointment of Sarah Mitchell as Chief Financial Officer, effective January 1, 2025.

        Ms. Mitchell, previously CFO of a major consumer goods company, is known for her
        focus on working capital optimization and inventory management.

        "I look forward to implementing best-in-class inventory practices across our
        global operations," said Mitchell.
        """,
        "title": "New CFO Appointment",
        "estimated_value": None,
        "likely_discount_range": None,
        "competition_level": "low",
    },
    {
        "company_id": "comp_beiersdorf",
        "signal_type": "new_product_announcement",
        "source_type": "press_release",
        "source_text": """
        Beiersdorf Launches NIVEA Sustainable Line

        Hamburg, December 6, 2024 - Beiersdorf AG today unveiled a new sustainable
        product line under the NIVEA brand, featuring recyclable packaging and
        natural ingredients.

        The "NIVEA Nature" range will launch across 15 European markets in Q1 2025,
        with initial production of 5 million units.
        """,
        "title": "NIVEA Sustainable Product Launch",
        "estimated_value": None,
        "likely_discount_range": None,
        "competition_level": "low",
    },
    {
        "company_id": "comp_brabantia",
        "signal_type": "distribution_change",
        "source_type": "industry_publication",
        "source_text": """
        Retail Gazette - December 4, 2024

        Brabantia Shifts to Direct Distribution Model

        Dutch housewares brand Brabantia is transitioning from its traditional
        distributor network to a direct-to-retail model in several European markets.

        The transition is expected to create short-term inventory availability
        as the company seeks new retail partnerships to replace outgoing distributors.

        "We're open to discussing partnership opportunities with retailers of all sizes,"
        said Brabantia's commercial director.
        """,
        "title": "Direct Distribution Transition",
        "estimated_value": 5000000,
        "likely_discount_range": "30-45%",
        "competition_level": "low",
    },
]

# Historical outcomes for the learning loop
HISTORICAL_OUTCOMES = [
    {
        "company_name": "Samsung Electronics",
        "signal_type": "inventory_surplus",
        "title": "Q2 TV Inventory Surplus",
        "summary": "Samsung reported excess TV inventory requiring liquidation.",
        "confidence_score": 88,
        "deal_potential_score": 82,
        "outcome": "deal_won",
        "actual_discount": 0.45,
        "deal_value": 1200000,
        "notes": "Closed deal for 5000 units of 55\" TVs at 45% discount.",
    },
    {
        "company_name": "Panasonic",
        "signal_type": "earnings_miss",
        "title": "Q1 Revenue Decline",
        "summary": "Panasonic consumer electronics division underperformed.",
        "confidence_score": 75,
        "deal_potential_score": 70,
        "outcome": "deal_won",
        "actual_discount": 0.38,
        "deal_value": 450000,
        "notes": "Secured camera inventory at good margins.",
    },
    {
        "company_name": "Whirlpool",
        "signal_type": "warehouse_clearance",
        "title": "Distribution Center Closure",
        "summary": "Whirlpool closing Netherlands distribution center.",
        "confidence_score": 92,
        "deal_potential_score": 88,
        "outcome": "deal_won",
        "actual_discount": 0.52,
        "deal_value": 800000,
        "notes": "Excellent deal on washing machines and dryers.",
    },
    {
        "company_name": "Braun (P&G)",
        "signal_type": "product_discontinuation",
        "title": "Shaver Line Discontinuation",
        "summary": "Braun discontinuing older shaver models.",
        "confidence_score": 85,
        "deal_potential_score": 80,
        "outcome": "deal_lost",
        "actual_discount": None,
        "deal_value": None,
        "notes": "Competitor (Veepee) secured exclusive deal.",
    },
    {
        "company_name": "Oral-B (P&G)",
        "signal_type": "seasonal_clearance",
        "title": "Post-Holiday Clearance",
        "summary": "Oral-B gift sets clearance post-holidays.",
        "confidence_score": 80,
        "deal_potential_score": 75,
        "outcome": "deal_won",
        "actual_discount": 0.55,
        "deal_value": 320000,
        "notes": "Great margins on electric toothbrush gift sets.",
    },
    {
        "company_name": "Harman (Samsung)",
        "signal_type": "european_market_entry",
        "title": "JBL Direct Europe Launch",
        "summary": "JBL launching direct retail in Benelux.",
        "confidence_score": 78,
        "deal_potential_score": 72,
        "outcome": "deal_won",
        "actual_discount": 0.25,
        "deal_value": 280000,
        "notes": "Secured launch partnership for portable speakers.",
    },
    {
        "company_name": "Tefal",
        "signal_type": "product_discontinuation",
        "title": "Actifry Range Update",
        "summary": "Old Actifry models being phased out.",
        "confidence_score": 90,
        "deal_potential_score": 85,
        "outcome": "deal_won",
        "actual_discount": 0.48,
        "deal_value": 520000,
        "notes": "Strong customer response to air fryer deals.",
    },
    {
        "company_name": "Kenwood",
        "signal_type": "inventory_surplus",
        "title": "Kitchen Machine Oversupply",
        "summary": "Kenwood with excess kitchen machine inventory.",
        "confidence_score": 82,
        "deal_potential_score": 78,
        "outcome": "deal_lost",
        "actual_discount": None,
        "deal_value": None,
        "notes": "Terms didn't meet our margin requirements.",
    },
    {
        "company_name": "Fitbit (Google)",
        "signal_type": "category_oversupply",
        "title": "Wearables Market Correction",
        "summary": "Industry-wide fitness tracker oversupply.",
        "confidence_score": 72,
        "deal_potential_score": 68,
        "outcome": "deal_won",
        "actual_discount": 0.42,
        "deal_value": 180000,
        "notes": "Good deal but category is competitive.",
    },
    {
        "company_name": "Nespresso",
        "signal_type": "new_product_announcement",
        "title": "New Vertuo Machine Launch",
        "summary": "Nespresso launching new Vertuo line.",
        "confidence_score": 70,
        "deal_potential_score": 65,
        "outcome": "expired",
        "actual_discount": None,
        "deal_value": None,
        "notes": "No clearance opportunity materialized.",
    },
]


def create_neo4j_data(driver):
    """Create companies and signals in Neo4j"""
    print("Creating companies in Neo4j...")

    with driver.session() as session:
        # Clear existing signal-related data
        session.run("""
            MATCH (s:Signal) DETACH DELETE s
        """)

        # Create companies
        for company in DEMO_COMPANIES:
            session.run("""
                MERGE (c:Company {id: $id})
                SET c.name = $name,
                    c.country = $country,
                    c.revenue_eur = $revenue_eur,
                    c.categories = $categories,
                    c.status = $status,
                    c.website = $website,
                    c.past_gmv = $past_gmv,
                    c.has_contact = $has_contact,
                    c.is_supplier = true,
                    c.updated_at = datetime()
            """, company)
            print(f"  Created: {company['name']}")

        print(f"\nCreated {len(DEMO_COMPANIES)} companies")


def create_signals_and_index(driver, rag):
    """Create signals in Neo4j and index in vector database"""
    print("\nCreating and indexing signals...")

    # Initialize scorer
    from atlas.services.signals import ConfidenceScorer, SIGNAL_DEFINITIONS, SignalType, SignalPriority

    scorer = ConfidenceScorer()

    with driver.session() as session:
        for signal_data in DEMO_SIGNALS:
            signal_id = str(uuid.uuid4())
            signal_type = signal_data["signal_type"]
            signal_def = SIGNAL_DEFINITIONS.get(SignalType(signal_type), {})

            # Score the signal
            confidence, _ = scorer.score(
                signal_type=signal_type,
                source_type=signal_data["source_type"],
                source_date=datetime.now() - timedelta(hours=random.randint(1, 72)),
            )
            deal_potential = scorer.score_deal_potential(signal_type)

            # Get company data
            company = next((c for c in DEMO_COMPANIES if c["id"] == signal_data["company_id"]), {})

            # Create signal in Neo4j
            neo4j_data = {
                "signal_id": signal_id,
                "company_id": signal_data["company_id"],
                "signal_type": signal_type,
                "signal_priority": signal_def.get("priority", SignalPriority.RELATIONSHIP).value,
                "title": signal_data["title"],
                "summary": signal_data["source_text"][:500].strip(),
                "confidence_score": confidence,
                "deal_potential_score": deal_potential,
                "source_type": signal_data["source_type"],
                "detected_at": (datetime.now() - timedelta(hours=random.randint(1, 96))).isoformat(),
                "status": "new",
                "categories": company.get("categories", []),
                "estimated_value": signal_data.get("estimated_value"),
                "likely_discount_range": signal_data.get("likely_discount_range"),
                "competition_level": signal_data.get("competition_level"),
            }

            session.run("""
                MATCH (c:Company {id: $company_id})
                CREATE (s:Signal {
                    id: $signal_id,
                    signal_type: $signal_type,
                    signal_priority: $signal_priority,
                    title: $title,
                    summary: $summary,
                    confidence_score: $confidence_score,
                    deal_potential_score: $deal_potential_score,
                    source_type: $source_type,
                    detected_at: $detected_at,
                    status: $status,
                    categories: $categories,
                    estimated_value: $estimated_value,
                    likely_discount_range: $likely_discount_range,
                    competition_level: $competition_level
                })
                MERGE (s)-[:DETECTED_FOR]->(c)
            """, neo4j_data)

            # Index in vector database
            vector_data = {
                "company_id": signal_data["company_id"],
                "company_name": company.get("name", ""),
                "company_country": company.get("country", ""),
                "signal_type": signal_type,
                "signal_priority": signal_def.get("priority", SignalPriority.RELATIONSHIP).value,
                "title": signal_data["title"],
                "summary": signal_data["source_text"][:500].strip(),
                "confidence_score": confidence,
                "deal_potential_score": deal_potential,
                "source_type": signal_data["source_type"],
                "categories": company.get("categories", []),
            }
            rag.index_signal(signal_id, vector_data)

            print(f"  Created & indexed: {signal_data['title']}")

        print(f"\nCreated and indexed {len(DEMO_SIGNALS)} signals")


def create_historical_outcomes(rag):
    """Create historical outcomes for the learning loop"""
    print("\nCreating historical outcomes for learning loop...")

    from atlas.services.signals import SIGNAL_DEFINITIONS, SignalType, SignalPriority

    for outcome_data in HISTORICAL_OUTCOMES:
        signal_id = str(uuid.uuid4())
        signal_type = outcome_data["signal_type"]
        signal_def = SIGNAL_DEFINITIONS.get(SignalType(signal_type), {})

        # Create the signal data
        signal_data = {
            "company_id": f"historical_{signal_id[:8]}",
            "company_name": outcome_data["company_name"],
            "company_country": "Various",
            "signal_type": signal_type,
            "signal_priority": signal_def.get("priority", SignalPriority.RELATIONSHIP).value,
            "title": outcome_data["title"],
            "summary": outcome_data["summary"],
            "confidence_score": outcome_data["confidence_score"],
            "deal_potential_score": outcome_data["deal_potential_score"],
            "source_type": "historical",
            "categories": [],
        }

        # Index the signal
        rag.index_signal(signal_id, signal_data)

        # Record the outcome
        rag.record_outcome(
            signal_id=signal_id,
            outcome=outcome_data["outcome"],
            actual_discount=outcome_data.get("actual_discount"),
            deal_value=outcome_data.get("deal_value"),
            notes=outcome_data.get("notes"),
        )

        outcome_emoji = "✅" if outcome_data["outcome"] == "deal_won" else "❌" if outcome_data["outcome"] == "deal_lost" else "⏱️"
        print(f"  {outcome_emoji} {outcome_data['company_name']}: {outcome_data['outcome']}")

    print(f"\nCreated {len(HISTORICAL_OUTCOMES)} historical outcomes")


def main():
    """Main entry point"""
    print("=" * 60)
    print("iBood Signals Intelligence - Demo Data Generator")
    print("=" * 60)

    # Get configuration from environment
    neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password = os.getenv("NEO4J_PASSWORD", "neo4jpass")
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")

    print(f"\nConnecting to:")
    print(f"  Neo4j: {neo4j_uri}")
    print(f"  Qdrant: {qdrant_url}")

    # Initialize connections
    try:
        driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        driver.verify_connectivity()
        print("  ✓ Neo4j connected")
    except Exception as e:
        print(f"  ✗ Neo4j connection failed: {e}")
        sys.exit(1)

    try:
        from atlas.services.signals import SignalVectorRAG
        rag = SignalVectorRAG(qdrant_url=qdrant_url)
        print("  ✓ Qdrant connected")
    except Exception as e:
        print(f"  ✗ Qdrant connection failed: {e}")
        sys.exit(1)

    print("\n" + "-" * 60)

    # Generate data
    try:
        # Clear existing vector data
        print("\nClearing existing vector data...")
        rag.clear_all()
        print("  ✓ Vector collections cleared")

        # Create companies
        create_neo4j_data(driver)

        # Create signals
        create_signals_and_index(driver, rag)

        # Create historical outcomes (learning loop data)
        create_historical_outcomes(rag)

        # Print summary
        stats = rag.get_collection_stats()
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Companies created: {len(DEMO_COMPANIES)}")
        print(f"Active signals: {len(DEMO_SIGNALS)}")
        print(f"Historical outcomes: {len(HISTORICAL_OUTCOMES)}")
        print(f"Signals indexed: {stats.get('signals_indexed', 0)}")
        print(f"Outcomes recorded: {stats.get('outcomes_recorded', 0)}")
        print("\n✅ Demo data generation complete!")
        print("\nThe learning loop is now active with historical outcomes.")
        print("New signals will be scored based on similar past signals.")

    except Exception as e:
        print(f"\n❌ Error generating data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        driver.close()


if __name__ == "__main__":
    main()
