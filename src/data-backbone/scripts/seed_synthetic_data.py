#!/usr/bin/env python3
"""
Synthetic Data Generator for Data Backbone Platform
Generates 500 companies, contacts, deals, signals, and sequences
"""

import os
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json

# Try to import neo4j, provide instructions if not available
try:
    from neo4j import GraphDatabase
except ImportError:
    print("neo4j package not installed. Install with: pip install neo4j")
    print("Generating Cypher file instead...")

# =============================================================================
# CONFIGURATION
# =============================================================================

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

NUM_COMPANIES = 500
CONTACTS_PER_COMPANY = (2, 8)  # Min, max contacts per company
DEALS_PERCENTAGE = 0.4  # 40% of companies have deals
SIGNALS_PER_COMPANY = (0, 5)  # Min, max signals per company

# =============================================================================
# DATA POOLS
# =============================================================================

FIRST_NAMES = [
    "James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Sophia", "William", "Isabella",
    "Elijah", "Mia", "Lucas", "Charlotte", "Mason", "Amelia", "Ethan", "Harper", "Alexander", "Evelyn",
    "Michael", "Sarah", "Daniel", "Jessica", "David", "Emily", "Matthew", "Hannah", "Andrew", "Rachel",
    "Thomas", "Lauren", "Christopher", "Ashley", "Joshua", "Samantha", "Robert", "Katherine", "Ryan", "Amanda",
    "Jan", "Pieter", "Sophie", "Lars", "Anna", "Erik", "Maria", "Hans", "Lisa", "Klaus",
    "Pierre", "Marie", "Jean", "Isabelle", "Marco", "Giulia", "Francesco", "Elena", "Carlos", "Ana",
    "Wei", "Mei", "Yuki", "Kenji", "Priya", "Raj", "Ahmed", "Fatima", "Mohammed", "Aisha"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
    "Van der Berg", "De Vries", "Jansen", "De Jong", "Bakker", "Visser", "Smit", "Mulder", "De Boer", "Dekker",
    "Mueller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
    "Dubois", "Martin", "Bernard", "Thomas", "Robert", "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi",
    "Chen", "Wang", "Zhang", "Liu", "Yang", "Tanaka", "Yamamoto", "Suzuki", "Patel", "Kumar"
]

COMPANY_PREFIXES = [
    "Tech", "Digital", "Smart", "Global", "Advanced", "Future", "Next", "Prime", "Elite", "Pro",
    "Eco", "Green", "Sustainable", "Bio", "Clean", "Solar", "Quantum", "Cloud", "Data", "Cyber",
    "Nordic", "European", "Dutch", "German", "Swiss", "British", "French", "American", "Pacific", "Atlantic"
]

COMPANY_SUFFIXES = [
    "Solutions", "Systems", "Technologies", "Innovations", "Dynamics", "Partners", "Group", "Labs", "Works", "Hub",
    "Industries", "Enterprises", "Services", "Consulting", "Analytics", "Ventures", "Capital", "Holdings", "Global", "International",
    "BV", "GmbH", "AG", "Ltd", "Inc", "Corp", "SA", "NV", "AB", "AS"
]

COMPANY_TYPES = [
    "Software", "Platform", "Network", "Cloud", "AI", "IoT", "Blockchain", "SaaS", "Cyber", "Data"
]

INDUSTRIES = [
    ("Technology", ["Software", "Hardware", "Cloud Services", "AI/ML", "Cybersecurity"]),
    ("Healthcare", ["Hospitals", "Pharmaceuticals", "Medical Devices", "Biotech", "Health Insurance"]),
    ("Financial Services", ["Banking", "Insurance", "Investment", "Fintech", "Asset Management"]),
    ("Manufacturing", ["Automotive", "Aerospace", "Electronics", "Consumer Goods", "Industrial Equipment"]),
    ("Retail", ["E-commerce", "Grocery", "Fashion", "Consumer Electronics", "Home Improvement"]),
    ("Real Estate", ["Commercial", "Residential", "Property Management", "Construction", "REITs"]),
    ("Consulting", ["Management Consulting", "IT Consulting", "Strategy", "HR Consulting", "Legal Services"]),
    ("Hospitality", ["Hotels", "Restaurants", "Travel", "Entertainment", "Events"]),
    ("Education", ["Higher Education", "K-12", "EdTech", "Corporate Training", "Online Learning"]),
    ("Energy", ["Oil & Gas", "Renewable Energy", "Utilities", "Mining", "Clean Tech"]),
]

CITIES = [
    ("Amsterdam", "Netherlands", "NL"), ("Rotterdam", "Netherlands", "NL"), ("Utrecht", "Netherlands", "NL"),
    ("The Hague", "Netherlands", "NL"), ("Eindhoven", "Netherlands", "NL"), ("Groningen", "Netherlands", "NL"),
    ("Berlin", "Germany", "DE"), ("Munich", "Germany", "DE"), ("Frankfurt", "Germany", "DE"), ("Hamburg", "Germany", "DE"),
    ("London", "United Kingdom", "GB"), ("Manchester", "United Kingdom", "GB"), ("Edinburgh", "United Kingdom", "GB"),
    ("Paris", "France", "FR"), ("Lyon", "France", "FR"), ("Marseille", "France", "FR"),
    ("Milan", "Italy", "IT"), ("Rome", "Italy", "IT"), ("Madrid", "Spain", "ES"), ("Barcelona", "Spain", "ES"),
    ("Stockholm", "Sweden", "SE"), ("Copenhagen", "Denmark", "DK"), ("Oslo", "Norway", "NO"), ("Helsinki", "Finland", "FI"),
    ("Zurich", "Switzerland", "CH"), ("Geneva", "Switzerland", "CH"), ("Vienna", "Austria", "AT"), ("Brussels", "Belgium", "BE"),
    ("Dublin", "Ireland", "IE"), ("Lisbon", "Portugal", "PT"), ("Warsaw", "Poland", "PL"), ("Prague", "Czech Republic", "CZ"),
    ("New York", "United States", "US"), ("San Francisco", "United States", "US"), ("Boston", "United States", "US"),
    ("Chicago", "United States", "US"), ("Austin", "United States", "US"), ("Seattle", "United States", "US"),
    ("Singapore", "Singapore", "SG"), ("Tokyo", "Japan", "JP"), ("Sydney", "Australia", "AU"), ("Toronto", "Canada", "CA"),
]

JOB_TITLES = {
    "C-Level": [
        "CEO", "CFO", "CTO", "COO", "CMO", "CHRO", "CIO", "Chief Digital Officer",
        "Chief Sustainability Officer", "Chief People Officer"
    ],
    "VP": [
        "VP of Operations", "VP of Sales", "VP of Marketing", "VP of Engineering",
        "VP of HR", "VP of Finance", "VP of Product", "VP of Business Development",
        "VP of Facilities", "VP of Procurement"
    ],
    "Director": [
        "Director of Operations", "Director of Facilities", "Director of Sustainability",
        "Director of HR", "Director of IT", "Director of Procurement", "Director of Finance",
        "Director of Marketing", "Director of Sales", "Director of Product"
    ],
    "Manager": [
        "Operations Manager", "Facilities Manager", "Office Manager", "HR Manager",
        "Procurement Manager", "Project Manager", "Product Manager", "Marketing Manager",
        "Sales Manager", "Account Manager"
    ],
    "Individual Contributor": [
        "Senior Engineer", "Software Developer", "Data Analyst", "Business Analyst",
        "Account Executive", "Sales Representative", "Marketing Specialist", "HR Specialist",
        "Financial Analyst", "Operations Specialist"
    ]
}

DEPARTMENTS = [
    "Operations", "Facilities", "HR", "Finance", "IT", "Marketing", "Sales",
    "Product", "Engineering", "Procurement", "Legal", "Executive"
]

BUYER_PERSONAS = [
    "Champion", "Economic Buyer", "Technical Evaluator", "User Buyer", "Blocker",
    "Influencer", "Coach", "Legal", "Procurement", "Executive Sponsor"
]

DEAL_STAGES = [
    ("identified", 0.15),
    ("qualified", 0.12),
    ("engaged", 0.15),
    ("pipeline", 0.20),
    ("proposal", 0.10),
    ("negotiation", 0.08),
    ("committed", 0.05),
    ("closed_won", 0.10),
    ("closed_lost", 0.05),
]

DEAL_TYPES = ["new_business", "expansion", "renewal", "upsell", "cross_sell"]

SIGNAL_TYPES = [
    ("sustainability", ["esg_initiative", "carbon_reduction", "plastic_free_pledge", "bcorp_certification", "sustainability_hire"]),
    ("workplace_experience", ["office_redesign", "hybrid_work_policy", "employee_perks", "workplace_award", "culture_initiative"]),
    ("employee_wellbeing", ["wellness_program", "mental_health_focus", "fitness_benefits", "health_insurance"]),
    ("growth_expansion", ["office_opening", "funding_round", "revenue_milestone", "employee_growth", "geographic_expansion"]),
    ("direct_engagement", ["website_visit", "pricing_page_view", "demo_request", "content_download", "webinar_registration"]),
]

SEQUENCE_NAMES = [
    "Enterprise Outreach Q1", "SMB Nurture Campaign", "Event Follow-up", "Sustainability Champions",
    "Tech Leaders Outreach", "Hospitality Vertical", "Healthcare Decision Makers", "Finance Executives",
    "Renewal Campaign", "Win-back Sequence", "Cold Outreach - DACH", "Cold Outreach - Nordics",
    "Post-Demo Follow-up", "Trial Conversion", "Expansion Opportunity"
]

CHANNELS = ["email", "li_invite", "li_chat", "li_inmail", "whatsapp", "phone_task", "sms"]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_id() -> str:
    return str(uuid.uuid4())

def generate_domain(company_name: str) -> str:
    """Generate a realistic domain from company name"""
    clean_name = company_name.lower().replace(" ", "").replace(",", "").replace(".", "")
    clean_name = clean_name.replace("&", "and")[:20]
    tlds = [".com", ".io", ".co", ".nl", ".de", ".eu", ".tech", ".ai"]
    return f"{clean_name}{random.choice(tlds)}"

def generate_email(first_name: str, last_name: str, domain: str) -> str:
    formats = [
        f"{first_name.lower()}.{last_name.lower()}@{domain}",
        f"{first_name[0].lower()}{last_name.lower()}@{domain}",
        f"{first_name.lower()}@{domain}",
    ]
    return random.choice(formats)

def random_date(start_days_ago: int, end_days_ago: int = 0) -> datetime:
    days_ago = random.randint(end_days_ago, start_days_ago)
    return datetime.now() - timedelta(days=days_ago)

def generate_linkedin_url(first_name: str, last_name: str) -> str:
    suffix = random.randint(100, 99999)
    return f"https://linkedin.com/in/{first_name.lower()}-{last_name.lower()}-{suffix}"

def weighted_choice(choices_with_weights: List[tuple]) -> Any:
    choices, weights = zip(*choices_with_weights)
    return random.choices(choices, weights=weights)[0]


# =============================================================================
# DATA GENERATORS
# =============================================================================

def generate_company(index: int) -> Dict[str, Any]:
    """Generate a single company with realistic attributes"""

    # Generate company name
    if random.random() < 0.3:
        # Some companies have type-based names
        name = f"{random.choice(COMPANY_PREFIXES)}{random.choice(COMPANY_TYPES)} {random.choice(COMPANY_SUFFIXES)}"
    else:
        name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)}"

    # Ensure unique names by adding index if needed
    if random.random() < 0.1:
        name = f"{name} {index}"

    domain = generate_domain(name)
    industry, sub_industries = random.choice(INDUSTRIES)
    city, country, country_iso = random.choice(CITIES)

    # Company size affects various attributes
    size_category = weighted_choice([
        ("small", 0.40),      # 10-50 employees
        ("medium", 0.35),     # 50-500 employees
        ("large", 0.20),      # 500-5000 employees
        ("enterprise", 0.05)  # 5000+ employees
    ])

    employee_ranges = {
        "small": (10, 50),
        "medium": (50, 500),
        "large": (500, 5000),
        "enterprise": (5000, 50000)
    }

    employee_count = random.randint(*employee_ranges[size_category])

    # Revenue correlates with size
    revenue_multiplier = {"small": 5000, "medium": 20000, "large": 100000, "enterprise": 500000}
    annual_revenue = employee_count * revenue_multiplier[size_category] * random.uniform(0.5, 2.0)

    # ICP tier based on size and other factors
    icp_weights = {
        "small": [(1, 0.1), (2, 0.3), (3, 0.6)],
        "medium": [(1, 0.3), (2, 0.4), (3, 0.3)],
        "large": [(1, 0.5), (2, 0.35), (3, 0.15)],
        "enterprise": [(1, 0.7), (2, 0.25), (3, 0.05)]
    }
    icp_tier = weighted_choice(icp_weights[size_category])

    # Intent and other scores
    intent_score = random.randint(20, 100) if random.random() < 0.7 else random.randint(0, 40)

    return {
        "id": generate_id(),
        "name": name,
        "domain": domain,
        "industry": industry,
        "sub_industry": random.choice(sub_industries),
        "employee_count": employee_count,
        "office_count": random.randint(1, max(1, employee_count // 200)),
        "hq_city": city,
        "hq_country": country,
        "hq_country_iso": country_iso,
        "location": f"{city}, {country}",
        "annual_revenue": round(annual_revenue, -3),
        "founded_year": random.randint(1950, 2023),
        "linkedin_url": f"https://linkedin.com/company/{domain.split('.')[0]}",
        "website": f"https://www.{domain}",
        "is_prospect": random.random() < 0.7,
        "is_partner": random.random() < 0.05,
        "is_competitor": random.random() < 0.02,
        "intent_score": intent_score,
        "sustainability_score": random.randint(0, 100),
        "wellbeing_score": random.randint(0, 100),
        "growth_score": random.randint(0, 100),
        "workplace_score": random.randint(0, 100),
        "icp_tier": icp_tier,
        "classification": weighted_choice([("TAM", 0.5), ("SAM", 0.35), ("SOM", 0.15)]),
        "rating": random.randint(1, 5),
        "created_at": random_date(365, 30).isoformat(),
        "updated_at": random_date(30, 0).isoformat(),
        "_size_category": size_category  # Internal use
    }


def generate_contacts(company: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate contacts for a company"""

    # Number of contacts based on company size
    size_multipliers = {"small": 1, "medium": 1.5, "large": 2, "enterprise": 3}
    multiplier = size_multipliers.get(company.get("_size_category", "medium"), 1)

    min_contacts, max_contacts = CONTACTS_PER_COMPANY
    num_contacts = random.randint(
        int(min_contacts * multiplier),
        int(max_contacts * multiplier)
    )

    contacts = []
    used_names = set()

    for i in range(num_contacts):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)

        # Avoid duplicate names
        while f"{first_name} {last_name}" in used_names:
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
        used_names.add(f"{first_name} {last_name}")

        # Seniority distribution
        seniority = weighted_choice([
            ("C-Level", 0.05),
            ("VP", 0.10),
            ("Director", 0.20),
            ("Manager", 0.35),
            ("Individual Contributor", 0.30)
        ])

        job_title = random.choice(JOB_TITLES[seniority])
        department = random.choice(DEPARTMENTS)

        # Buyer persona - higher seniority = higher chance of key personas
        if seniority in ["C-Level", "VP"]:
            buyer_persona = weighted_choice([
                ("Economic Buyer", 0.30), ("Champion", 0.25), ("Executive Sponsor", 0.20),
                ("Influencer", 0.15), ("Blocker", 0.10)
            ])
        elif seniority == "Director":
            buyer_persona = weighted_choice([
                ("Champion", 0.30), ("Technical Evaluator", 0.25), ("Influencer", 0.20),
                ("User Buyer", 0.15), ("Blocker", 0.10)
            ])
        else:
            buyer_persona = weighted_choice([
                ("User Buyer", 0.35), ("Technical Evaluator", 0.25), ("Influencer", 0.20),
                ("Coach", 0.15), ("Blocker", 0.05)
            ])

        contact = {
            "id": generate_id(),
            "company_id": company["id"],
            "full_name": f"{first_name} {last_name}",
            "first_name": first_name,
            "last_name": last_name,
            "email": generate_email(first_name, last_name, company["domain"]),
            "phone": f"+{random.randint(1,99)} {random.randint(100,999)} {random.randint(100,999)} {random.randint(1000,9999)}",
            "job_title": job_title,
            "title": job_title,
            "department": department,
            "seniority": seniority,
            "linkedin_url": generate_linkedin_url(first_name, last_name),
            "linkedin_headline": f"{job_title} at {company['name']}",
            "city": company["hq_city"],
            "country": company["hq_country"],
            "buyer_persona_type": buyer_persona,
            "buyer_persona_confidence": round(random.uniform(0.6, 0.99), 2),
            "decision_maker_score": random.randint(30, 100) if seniority in ["C-Level", "VP", "Director"] else random.randint(10, 50),
            "created_at": company["created_at"],
            "updated_at": random_date(30, 0).isoformat(),
        }
        contacts.append(contact)

    return contacts


def generate_deal(company: Dict[str, Any], contacts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a deal for a company"""

    stage = weighted_choice(DEAL_STAGES)
    deal_type = random.choice(DEAL_TYPES)

    # Deal value based on company size
    size_multipliers = {"small": 15000, "medium": 50000, "large": 150000, "enterprise": 500000}
    base_value = size_multipliers.get(company.get("_size_category", "medium"), 50000)
    amount = round(base_value * random.uniform(0.3, 3.0), -2)

    # Probability based on stage
    stage_probabilities = {
        "identified": 10, "qualified": 20, "engaged": 30, "pipeline": 40,
        "proposal": 50, "negotiation": 60, "committed": 80, "closed_won": 100, "closed_lost": 0
    }
    probability = stage_probabilities.get(stage, 50)

    # MEDDPICC scores
    meddpicc_scores = {
        "metrics": random.randint(0, 10),
        "economic_buyer": random.randint(0, 10),
        "decision_criteria": random.randint(0, 10),
        "decision_process": random.randint(0, 10),
        "paper_process": random.randint(0, 10),
        "pain": random.randint(0, 10),
        "champion": random.randint(0, 10),
        "competition": random.randint(0, 10),
    }
    meddpicc_total = sum(meddpicc_scores.values())

    # Deal health based on MEDDPICC
    if meddpicc_total >= 60:
        deal_health = "strong"
    elif meddpicc_total >= 40:
        deal_health = "on_track"
    elif meddpicc_total >= 25:
        deal_health = "needs_attention"
    else:
        deal_health = "at_risk"

    # Find champion and economic buyer from contacts
    champion = next((c for c in contacts if c["buyer_persona_type"] == "Champion"), None)
    economic_buyer = next((c for c in contacts if c["buyer_persona_type"] == "Economic Buyer"), None)

    created_at = random_date(180, 30)
    stage_entered = random_date(60, 5)
    expected_close = datetime.now() + timedelta(days=random.randint(14, 180))

    return {
        "id": generate_id(),
        "deal_name": f"{company['name']} - {deal_type.replace('_', ' ').title()}",
        "deal_type": deal_type,
        "company_id": company["id"],
        "stage": stage,
        "stage_entered_at": stage_entered.isoformat(),
        "owner_user_id": "demo-user-1",
        "amount": amount,
        "currency": "EUR",
        "recurring_amount": round(amount * 0.8, -2) if deal_type in ["new_business", "renewal"] else None,
        "one_time_amount": round(amount * 0.2, -2) if deal_type in ["new_business", "renewal"] else amount,
        "probability": probability,
        "weighted_amount": round(amount * probability / 100, -2),
        "expected_close_date": expected_close.isoformat(),
        "actual_close_date": datetime.now().isoformat() if stage in ["closed_won", "closed_lost"] else None,
        "days_in_pipeline": (datetime.now() - created_at).days,
        "meddpicc_metrics_score": meddpicc_scores["metrics"],
        "meddpicc_economic_buyer_score": meddpicc_scores["economic_buyer"],
        "meddpicc_decision_criteria_score": meddpicc_scores["decision_criteria"],
        "meddpicc_decision_process_score": meddpicc_scores["decision_process"],
        "meddpicc_paper_process_score": meddpicc_scores["paper_process"],
        "meddpicc_pain_score": meddpicc_scores["pain"],
        "meddpicc_champion_score": meddpicc_scores["champion"],
        "meddpicc_competition_score": meddpicc_scores["competition"],
        "meddpicc_total_score": meddpicc_total,
        "economic_buyer_id": economic_buyer["id"] if economic_buyer else None,
        "champion_id": champion["id"] if champion else None,
        "deal_health": deal_health,
        "source_channel": random.choice(["organic", "paid", "referral", "event", "outbound"]),
        "created_at": created_at.isoformat(),
        "updated_at": random_date(14, 0).isoformat(),
    }


def generate_signals(company: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate signals for a company"""

    num_signals = random.randint(*SIGNALS_PER_COMPANY)
    if company["intent_score"] > 70:
        num_signals = max(num_signals, 3)

    signals = []
    for _ in range(num_signals):
        category, signal_types = random.choice(SIGNAL_TYPES)
        signal_type = random.choice(signal_types)

        detected_at = random_date(60, 1)

        signal = {
            "id": generate_id(),
            "entity_type": "company",
            "company_id": company["id"],
            "signal_type": signal_type,
            "signal_category": category,
            "base_weight": random.randint(5, 20),
            "current_score": random.randint(10, 50),
            "title": f"{signal_type.replace('_', ' ').title()} detected",
            "description": f"Signal detected for {company['name']}",
            "data_source": random.choice(["scraper", "api", "webhook", "manual"]),
            "status": "active" if random.random() < 0.8 else "expired",
            "detected_at": detected_at.isoformat(),
            "expires_at": (detected_at + timedelta(days=30)).isoformat(),
            "created_at": detected_at.isoformat(),
        }
        signals.append(signal)

    return signals


def generate_sequences() -> List[Dict[str, Any]]:
    """Generate outreach sequences"""

    sequences = []
    for name in SEQUENCE_NAMES:
        status = weighted_choice([("active", 0.5), ("paused", 0.2), ("draft", 0.2), ("archived", 0.1)])

        created_at = random_date(180, 30)

        sequence = {
            "id": generate_id(),
            "name": name,
            "description": f"Automated outreach sequence: {name}",
            "status": status,
            "created_by_user_id": "demo-user-1",
            "total_enrolled": random.randint(50, 500) if status in ["active", "paused"] else 0,
            "total_completed": random.randint(20, 200) if status in ["active", "paused"] else 0,
            "total_replied": random.randint(10, 80) if status in ["active", "paused"] else 0,
            "total_meetings": random.randint(5, 30) if status in ["active", "paused"] else 0,
            "reply_rate": round(random.uniform(5, 25), 1),
            "channels": random.sample(CHANNELS, random.randint(2, 5)),
            "created_at": created_at.isoformat(),
            "activated_at": (created_at + timedelta(days=random.randint(1, 14))).isoformat() if status != "draft" else None,
        }
        sequences.append(sequence)

    return sequences


# =============================================================================
# CYPHER GENERATION
# =============================================================================

def escape_cypher_string(s: str) -> str:
    """Escape special characters for Cypher"""
    if s is None:
        return "null"
    return s.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"')


def generate_company_cypher(company: Dict[str, Any]) -> str:
    """Generate Cypher for creating a company"""
    return f"""
MERGE (c:Company {{id: '{company['id']}'}})
SET c.name = '{escape_cypher_string(company['name'])}',
    c.domain = '{company['domain']}',
    c.industry = '{company['industry']}',
    c.sub_industry = '{company['sub_industry']}',
    c.employee_count = {company['employee_count']},
    c.office_count = {company['office_count']},
    c.hq_city = '{escape_cypher_string(company['hq_city'])}',
    c.hq_country = '{escape_cypher_string(company['hq_country'])}',
    c.hq_country_iso = '{company['hq_country_iso']}',
    c.location = '{escape_cypher_string(company['location'])}',
    c.annual_revenue = {company['annual_revenue']},
    c.founded_year = {company['founded_year']},
    c.linkedin_url = '{company['linkedin_url']}',
    c.website = '{company['website']}',
    c.is_prospect = {str(company['is_prospect']).lower()},
    c.is_partner = {str(company['is_partner']).lower()},
    c.is_competitor = {str(company['is_competitor']).lower()},
    c.intent_score = {company['intent_score']},
    c.sustainability_score = {company['sustainability_score']},
    c.wellbeing_score = {company['wellbeing_score']},
    c.growth_score = {company['growth_score']},
    c.workplace_score = {company['workplace_score']},
    c.icp_tier = {company['icp_tier']},
    c.classification = '{company['classification']}',
    c.rating = {company['rating']},
    c.created_at = datetime('{company['created_at']}'),
    c.updated_at = datetime('{company['updated_at']}');
"""


def generate_contact_cypher(contact: Dict[str, Any]) -> str:
    """Generate Cypher for creating a contact"""
    return f"""
MERGE (p:Person {{id: '{contact['id']}'}})
SET p.full_name = '{escape_cypher_string(contact['full_name'])}',
    p.first_name = '{escape_cypher_string(contact['first_name'])}',
    p.last_name = '{escape_cypher_string(contact['last_name'])}',
    p.email = '{contact['email']}',
    p.phone = '{contact['phone']}',
    p.title = '{escape_cypher_string(contact['job_title'])}',
    p.department = '{contact['department']}',
    p.seniority = '{contact['seniority']}',
    p.linkedin_url = '{contact['linkedin_url']}',
    p.linkedin_headline = '{escape_cypher_string(contact['linkedin_headline'])}',
    p.city = '{escape_cypher_string(contact['city'])}',
    p.country = '{escape_cypher_string(contact['country'])}',
    p.buyer_persona_type = '{contact['buyer_persona_type']}',
    p.buyer_persona_confidence = {contact['buyer_persona_confidence']},
    p.decision_maker_score = {contact['decision_maker_score']},
    p.created_at = datetime('{contact['created_at']}'),
    p.updated_at = datetime('{contact['updated_at']}');

MATCH (p:Person {{id: '{contact['id']}'}}), (c:Company {{id: '{contact['company_id']}'}})
MERGE (p)-[:WORKS_AT]->(c);

MERGE (e:Email {{address: '{contact['email']}'}})
MERGE (p:Person {{id: '{contact['id']}'}})-[:HAS_EMAIL]->(e);
"""


def generate_deal_cypher(deal: Dict[str, Any]) -> str:
    """Generate Cypher for creating a deal"""
    cypher = f"""
MERGE (d:Deal {{id: '{deal['id']}'}})
SET d.deal_name = '{escape_cypher_string(deal['deal_name'])}',
    d.deal_type = '{deal['deal_type']}',
    d.stage = '{deal['stage']}',
    d.stage_entered_at = datetime('{deal['stage_entered_at']}'),
    d.amount = {deal['amount']},
    d.currency = '{deal['currency']}',
    d.probability = {deal['probability']},
    d.weighted_amount = {deal['weighted_amount']},
    d.expected_close_date = datetime('{deal['expected_close_date']}'),
    d.days_in_pipeline = {deal['days_in_pipeline']},
    d.meddpicc_metrics_score = {deal['meddpicc_metrics_score']},
    d.meddpicc_economic_buyer_score = {deal['meddpicc_economic_buyer_score']},
    d.meddpicc_decision_criteria_score = {deal['meddpicc_decision_criteria_score']},
    d.meddpicc_decision_process_score = {deal['meddpicc_decision_process_score']},
    d.meddpicc_paper_process_score = {deal['meddpicc_paper_process_score']},
    d.meddpicc_pain_score = {deal['meddpicc_pain_score']},
    d.meddpicc_champion_score = {deal['meddpicc_champion_score']},
    d.meddpicc_competition_score = {deal['meddpicc_competition_score']},
    d.meddpicc_total_score = {deal['meddpicc_total_score']},
    d.deal_health = '{deal['deal_health']}',
    d.source_channel = '{deal['source_channel']}',
    d.created_at = datetime('{deal['created_at']}'),
    d.updated_at = datetime('{deal['updated_at']}');

MATCH (d:Deal {{id: '{deal['id']}'}}), (c:Company {{id: '{deal['company_id']}'}})
MERGE (d)-[:FOR_COMPANY]->(c);

MATCH (d:Deal {{id: '{deal['id']}'}}), (u:User {{id: '{deal['owner_user_id']}'}})
MERGE (d)-[:OWNED_BY]->(u);
"""

    if deal.get('champion_id'):
        cypher += f"""
MATCH (d:Deal {{id: '{deal['id']}'}}), (p:Person {{id: '{deal['champion_id']}'}})
MERGE (d)-[:HAS_CHAMPION]->(p);
"""

    if deal.get('economic_buyer_id'):
        cypher += f"""
MATCH (d:Deal {{id: '{deal['id']}'}}), (p:Person {{id: '{deal['economic_buyer_id']}'}})
MERGE (d)-[:HAS_ECONOMIC_BUYER]->(p);
"""

    return cypher


def generate_signal_cypher(signal: Dict[str, Any]) -> str:
    """Generate Cypher for creating a signal"""
    return f"""
MERGE (s:Signal {{id: '{signal['id']}'}})
SET s.entity_type = '{signal['entity_type']}',
    s.signal_type = '{signal['signal_type']}',
    s.category = '{signal['signal_category']}',
    s.base_weight = {signal['base_weight']},
    s.current_score = {signal['current_score']},
    s.title = '{escape_cypher_string(signal['title'])}',
    s.description = '{escape_cypher_string(signal['description'])}',
    s.data_source = '{signal['data_source']}',
    s.status = '{signal['status']}',
    s.detected_at = datetime('{signal['detected_at']}'),
    s.expires_at = datetime('{signal['expires_at']}'),
    s.created_at = datetime('{signal['created_at']}');

MATCH (s:Signal {{id: '{signal['id']}'}}), (c:Company {{id: '{signal['company_id']}'}})
MERGE (s)-[:DETECTED_FOR]->(c);
"""


def generate_sequence_cypher(sequence: Dict[str, Any]) -> str:
    """Generate Cypher for creating a sequence"""
    channels_str = str(sequence['channels']).replace("'", '"')
    return f"""
MERGE (seq:Sequence {{id: '{sequence['id']}'}})
SET seq.name = '{escape_cypher_string(sequence['name'])}',
    seq.description = '{escape_cypher_string(sequence['description'])}',
    seq.status = '{sequence['status']}',
    seq.total_enrolled = {sequence['total_enrolled']},
    seq.total_completed = {sequence['total_completed']},
    seq.total_replied = {sequence['total_replied']},
    seq.total_meetings = {sequence['total_meetings']},
    seq.reply_rate = {sequence['reply_rate']},
    seq.channels = {channels_str},
    seq.created_at = datetime('{sequence['created_at']}');

MATCH (seq:Sequence {{id: '{sequence['id']}'}}), (u:User {{id: '{sequence['created_by_user_id']}'}})
MERGE (seq)-[:CREATED_BY]->(u);
"""


# =============================================================================
# MAIN GENERATION
# =============================================================================

def generate_all_data():
    """Generate all synthetic data"""

    print("=" * 60)
    print("SYNTHETIC DATA GENERATOR")
    print("=" * 60)

    all_companies = []
    all_contacts = []
    all_deals = []
    all_signals = []

    print(f"\nGenerating {NUM_COMPANIES} companies...")
    for i in range(NUM_COMPANIES):
        company = generate_company(i)
        all_companies.append(company)

        # Generate contacts
        contacts = generate_contacts(company)
        all_contacts.extend(contacts)

        # Generate deal (40% chance)
        if random.random() < DEALS_PERCENTAGE and company["is_prospect"]:
            deal = generate_deal(company, contacts)
            all_deals.append(deal)

        # Generate signals
        signals = generate_signals(company)
        all_signals.extend(signals)

        if (i + 1) % 100 == 0:
            print(f"  Generated {i + 1} companies...")

    # Generate sequences
    print("\nGenerating sequences...")
    all_sequences = generate_sequences()

    print(f"\n{'=' * 60}")
    print("SUMMARY")
    print(f"{'=' * 60}")
    print(f"Companies:  {len(all_companies)}")
    print(f"Contacts:   {len(all_contacts)}")
    print(f"Deals:      {len(all_deals)}")
    print(f"Signals:    {len(all_signals)}")
    print(f"Sequences:  {len(all_sequences)}")

    return all_companies, all_contacts, all_deals, all_signals, all_sequences


def write_cypher_file(companies, contacts, deals, signals, sequences, output_file: str):
    """Write all data to a Cypher file"""

    print(f"\nWriting Cypher file: {output_file}")

    with open(output_file, 'w') as f:
        f.write("// ============================================================================\n")
        f.write("// SYNTHETIC DATA - Auto-generated\n")
        f.write(f"// Generated: {datetime.now().isoformat()}\n")
        f.write(f"// Companies: {len(companies)}, Contacts: {len(contacts)}, Deals: {len(deals)}\n")
        f.write("// ============================================================================\n\n")

        # Companies
        f.write("// ============================================================================\n")
        f.write("// COMPANIES\n")
        f.write("// ============================================================================\n\n")
        for company in companies:
            f.write(generate_company_cypher(company))
            f.write("\n")

        # Contacts
        f.write("\n// ============================================================================\n")
        f.write("// CONTACTS\n")
        f.write("// ============================================================================\n\n")
        for contact in contacts:
            f.write(generate_contact_cypher(contact))
            f.write("\n")

        # Deals
        f.write("\n// ============================================================================\n")
        f.write("// DEALS\n")
        f.write("// ============================================================================\n\n")
        for deal in deals:
            f.write(generate_deal_cypher(deal))
            f.write("\n")

        # Signals
        f.write("\n// ============================================================================\n")
        f.write("// SIGNALS\n")
        f.write("// ============================================================================\n\n")
        for signal in signals:
            f.write(generate_signal_cypher(signal))
            f.write("\n")

        # Sequences
        f.write("\n// ============================================================================\n")
        f.write("// SEQUENCES\n")
        f.write("// ============================================================================\n\n")
        for sequence in sequences:
            f.write(generate_sequence_cypher(sequence))
            f.write("\n")

    print(f"Cypher file written successfully!")


def load_to_neo4j(companies, contacts, deals, signals, sequences):
    """Load data directly to Neo4j"""

    print("\nConnecting to Neo4j...")

    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        with driver.session() as session:
            print("Loading companies...")
            for company in companies:
                session.run(generate_company_cypher(company))

            print("Loading contacts...")
            for contact in contacts:
                session.run(generate_contact_cypher(contact))

            print("Loading deals...")
            for deal in deals:
                session.run(generate_deal_cypher(deal))

            print("Loading signals...")
            for signal in signals:
                session.run(generate_signal_cypher(signal))

            print("Loading sequences...")
            for sequence in sequences:
                session.run(generate_sequence_cypher(sequence))

        driver.close()
        print("Data loaded to Neo4j successfully!")

    except Exception as e:
        print(f"Error loading to Neo4j: {e}")
        print("Writing to Cypher file instead...")
        return False

    return True


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Generate synthetic data for Data Backbone')
    parser.add_argument('--output', '-o', default='seed_data.cypher', help='Output Cypher file')
    parser.add_argument('--load', '-l', action='store_true', help='Load directly to Neo4j')
    parser.add_argument('--companies', '-c', type=int, default=500, help='Number of companies to generate')

    args = parser.parse_args()

    global NUM_COMPANIES
    NUM_COMPANIES = args.companies

    # Generate data
    companies, contacts, deals, signals, sequences = generate_all_data()

    # Output
    if args.load:
        success = load_to_neo4j(companies, contacts, deals, signals, sequences)
        if not success:
            write_cypher_file(companies, contacts, deals, signals, sequences, args.output)
    else:
        write_cypher_file(companies, contacts, deals, signals, sequences, args.output)

    print("\nDone!")


if __name__ == "__main__":
    main()
