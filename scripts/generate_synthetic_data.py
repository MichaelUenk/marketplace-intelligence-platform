#!/usr/bin/env python3
"""
Synthetic Data Generator for iBood Sales Intelligence Platform

Generates realistic data across all databases:
- Neo4j: Companies, People, Deals, Relationships
- Qdrant: Vector embeddings for semantic search
- Redis: Cache and session data

Designed for Dutch/European market focus (iBood e-commerce context)
"""

import os
import sys
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
import hashlib

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import redis
import numpy as np

# Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4jpass")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Seed for reproducibility
random.seed(42)
np.random.seed(42)


# =============================================================================
# Dutch/European Company Data
# =============================================================================

DUTCH_COMPANIES = [
    {"name": "Efteling BV", "industry": "Theme Parks & Entertainment", "size": "large", "region": "Noord-Brabant"},
    {"name": "Walibi Holland", "industry": "Theme Parks & Entertainment", "size": "medium", "region": "Flevoland"},
    {"name": "Madurodam", "industry": "Tourism & Attractions", "size": "medium", "region": "Zuid-Holland"},
    {"name": "Keukenhof Gardens", "industry": "Tourism & Attractions", "size": "medium", "region": "Zuid-Holland"},
    {"name": "Toverland", "industry": "Theme Parks & Entertainment", "size": "medium", "region": "Limburg"},
    {"name": "Beekse Bergen", "industry": "Wildlife & Safari Parks", "size": "medium", "region": "Noord-Brabant"},
    {"name": "Blijdorp Zoo Rotterdam", "industry": "Zoos & Wildlife", "size": "large", "region": "Zuid-Holland"},
    {"name": "ARTIS Amsterdam", "industry": "Zoos & Wildlife", "size": "large", "region": "Noord-Holland"},
    {"name": "Schiphol Group", "industry": "Aviation & Transport", "size": "enterprise", "region": "Noord-Holland"},
    {"name": "NS Dutch Railways", "industry": "Transport & Logistics", "size": "enterprise", "region": "Utrecht"},
    {"name": "KLM Royal Dutch Airlines", "industry": "Aviation", "size": "enterprise", "region": "Noord-Holland"},
    {"name": "Booking.com", "industry": "Travel Technology", "size": "enterprise", "region": "Noord-Holland"},
    {"name": "TUI Nederland", "industry": "Travel & Tourism", "size": "large", "region": "Noord-Brabant"},
    {"name": "Corendon Hotels", "industry": "Hospitality", "size": "medium", "region": "Noord-Holland"},
    {"name": "Van der Valk Hotels", "industry": "Hospitality", "size": "large", "region": "Diverse"},
    {"name": "Center Parcs Europe", "industry": "Holiday Parks", "size": "large", "region": "Utrecht"},
    {"name": "Landal GreenParks", "industry": "Holiday Parks", "size": "large", "region": "Noord-Holland"},
    {"name": "Roompot Vakanties", "industry": "Holiday Parks", "size": "large", "region": "Zeeland"},
    {"name": "ANWB", "industry": "Travel & Mobility", "size": "large", "region": "Den Haag"},
    {"name": "Holland Casino", "industry": "Entertainment & Gaming", "size": "large", "region": "Diverse"},
    {"name": "Pathé Cinemas", "industry": "Entertainment", "size": "large", "region": "Noord-Holland"},
    {"name": "Kinepolis Nederland", "industry": "Entertainment", "size": "medium", "region": "Utrecht"},
    {"name": "Ziggo Dome", "industry": "Events & Venues", "size": "medium", "region": "Noord-Holland"},
    {"name": "AFAS Live", "industry": "Events & Venues", "size": "medium", "region": "Noord-Holland"},
    {"name": "RAI Amsterdam", "industry": "Events & Conventions", "size": "large", "region": "Noord-Holland"},
    {"name": "Jaarbeurs Utrecht", "industry": "Events & Conventions", "size": "large", "region": "Utrecht"},
    {"name": "Rotterdam Ahoy", "industry": "Events & Venues", "size": "large", "region": "Zuid-Holland"},
    {"name": "SnowWorld", "industry": "Sports & Recreation", "size": "medium", "region": "Limburg"},
    {"name": "Sportcity Amsterdam", "industry": "Sports & Fitness", "size": "medium", "region": "Noord-Holland"},
    {"name": "Basic-Fit", "industry": "Fitness & Health", "size": "enterprise", "region": "Noord-Holland"},
]

GERMAN_COMPANIES = [
    {"name": "Europa-Park", "industry": "Theme Parks & Entertainment", "size": "enterprise", "region": "Baden-Württemberg"},
    {"name": "Phantasialand", "industry": "Theme Parks & Entertainment", "size": "large", "region": "Nordrhein-Westfalen"},
    {"name": "Movie Park Germany", "industry": "Theme Parks & Entertainment", "size": "medium", "region": "Nordrhein-Westfalen"},
    {"name": "Heide Park", "industry": "Theme Parks & Entertainment", "size": "medium", "region": "Niedersachsen"},
    {"name": "LEGOLAND Deutschland", "industry": "Theme Parks & Entertainment", "size": "large", "region": "Bayern"},
    {"name": "Tropical Islands", "industry": "Indoor Water Parks", "size": "large", "region": "Brandenburg"},
    {"name": "Therme Erding", "industry": "Wellness & Spa", "size": "large", "region": "Bayern"},
    {"name": "Zoo Berlin", "industry": "Zoos & Wildlife", "size": "large", "region": "Berlin"},
    {"name": "Hagenbeck Zoo", "industry": "Zoos & Wildlife", "size": "medium", "region": "Hamburg"},
    {"name": "TUI Group", "industry": "Travel & Tourism", "size": "enterprise", "region": "Niedersachsen"},
    {"name": "Lufthansa Group", "industry": "Aviation", "size": "enterprise", "region": "Hessen"},
    {"name": "Deutsche Bahn", "industry": "Transport & Logistics", "size": "enterprise", "region": "Berlin"},
    {"name": "Steigenberger Hotels", "industry": "Hospitality", "size": "large", "region": "Hessen"},
    {"name": "Maritim Hotels", "industry": "Hospitality", "size": "large", "region": "Nordrhein-Westfalen"},
    {"name": "Messe Frankfurt", "industry": "Events & Conventions", "size": "large", "region": "Hessen"},
]

BELGIAN_COMPANIES = [
    {"name": "Plopsaland", "industry": "Theme Parks & Entertainment", "size": "large", "region": "West-Vlaanderen"},
    {"name": "Bellewaerde Park", "industry": "Theme Parks & Entertainment", "size": "medium", "region": "West-Vlaanderen"},
    {"name": "Bobbejaanland", "industry": "Theme Parks & Entertainment", "size": "medium", "region": "Antwerpen"},
    {"name": "Walibi Belgium", "industry": "Theme Parks & Entertainment", "size": "medium", "region": "Waals-Brabant"},
    {"name": "Pairi Daiza", "industry": "Zoos & Wildlife", "size": "large", "region": "Henegouwen"},
    {"name": "ZOO Antwerpen", "industry": "Zoos & Wildlife", "size": "medium", "region": "Antwerpen"},
    {"name": "Brussels Airlines", "industry": "Aviation", "size": "large", "region": "Brussel"},
    {"name": "NMBS/SNCB", "industry": "Transport & Logistics", "size": "enterprise", "region": "Brussel"},
]

UK_COMPANIES = [
    {"name": "Merlin Entertainments", "industry": "Theme Parks & Entertainment", "size": "enterprise", "region": "UK-Wide"},
    {"name": "Alton Towers", "industry": "Theme Parks & Entertainment", "size": "large", "region": "Staffordshire"},
    {"name": "Thorpe Park", "industry": "Theme Parks & Entertainment", "size": "large", "region": "Surrey"},
    {"name": "LEGOLAND Windsor", "industry": "Theme Parks & Entertainment", "size": "large", "region": "Berkshire"},
    {"name": "Chester Zoo", "industry": "Zoos & Wildlife", "size": "large", "region": "Cheshire"},
    {"name": "London Zoo", "industry": "Zoos & Wildlife", "size": "large", "region": "London"},
    {"name": "British Airways", "industry": "Aviation", "size": "enterprise", "region": "London"},
    {"name": "EasyJet", "industry": "Aviation", "size": "large", "region": "London"},
]

ALL_COMPANIES = DUTCH_COMPANIES + GERMAN_COMPANIES + BELGIAN_COMPANIES + UK_COMPANIES

# Dutch first names
DUTCH_FIRST_NAMES = [
    "Jan", "Pieter", "Willem", "Henk", "Klaas", "Dirk", "Jeroen", "Michiel", "Bas", "Sander",
    "Anne", "Eva", "Sophie", "Emma", "Lotte", "Fleur", "Marieke", "Ingrid", "Anouk", "Lisa",
    "Thomas", "Lars", "Daan", "Bram", "Stijn", "Joost", "Frank", "Erik", "Marco", "Vincent",
    "Julia", "Sarah", "Femke", "Nina", "Kim", "Linda", "Michelle", "Esther", "Caroline", "Petra"
]

DUTCH_LAST_NAMES = [
    "de Jong", "Jansen", "de Vries", "van den Berg", "van Dijk", "Bakker", "Janssen", "Visser",
    "Smit", "Meijer", "de Boer", "Mulder", "de Groot", "Bos", "Vos", "Peters", "Hendriks",
    "van Leeuwen", "Dekker", "Brouwer", "de Wit", "Dijkstra", "Smits", "de Graaf", "van der Meer"
]

JOB_TITLES = {
    "C-Level": ["CEO", "CFO", "COO", "CTO", "CMO", "Chief Digital Officer", "Chief Experience Officer"],
    "VP": ["VP of Sales", "VP of Marketing", "VP of Operations", "VP of Business Development", "VP of Partnerships"],
    "Director": ["Director of Sales", "Director of Marketing", "Director of Operations", "Director of Guest Experience",
                 "Director of Digital", "Director of Revenue Management", "Director of Partnerships"],
    "Manager": ["Sales Manager", "Marketing Manager", "Operations Manager", "Account Manager", "Partnership Manager",
                "Business Development Manager", "Digital Marketing Manager", "Revenue Manager"],
    "Specialist": ["Sales Executive", "Marketing Specialist", "Business Analyst", "Account Executive",
                   "Partnership Coordinator", "Digital Specialist"]
}

DEAL_STAGES = ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]

PRODUCTS_SERVICES = [
    {"name": "Enterprise Ticketing Platform", "category": "Software", "base_price": 150000},
    {"name": "Guest Experience Suite", "category": "Software", "base_price": 200000},
    {"name": "Revenue Management System", "category": "Software", "base_price": 175000},
    {"name": "Digital Marketing Package", "category": "Services", "base_price": 75000},
    {"name": "CRM Integration", "category": "Integration", "base_price": 50000},
    {"name": "Mobile App Development", "category": "Development", "base_price": 125000},
    {"name": "Analytics Dashboard", "category": "Software", "base_price": 80000},
    {"name": "Loyalty Program Platform", "category": "Software", "base_price": 100000},
    {"name": "Queue Management System", "category": "Hardware+Software", "base_price": 90000},
    {"name": "Digital Signage Network", "category": "Hardware+Software", "base_price": 60000},
]

SIGNAL_TYPES = [
    {"type": "funding_round", "category": "Financial", "impact": "high"},
    {"type": "leadership_change", "category": "Organizational", "impact": "high"},
    {"type": "expansion_announcement", "category": "Growth", "impact": "high"},
    {"type": "new_attraction", "category": "Product", "impact": "medium"},
    {"type": "partnership_announcement", "category": "Strategic", "impact": "medium"},
    {"type": "technology_investment", "category": "Digital", "impact": "medium"},
    {"type": "sustainability_initiative", "category": "ESG", "impact": "low"},
    {"type": "award_recognition", "category": "Brand", "impact": "low"},
    {"type": "visitor_milestone", "category": "Growth", "impact": "medium"},
    {"type": "renovation_project", "category": "Infrastructure", "impact": "medium"},
]

INTENT_TOPICS = [
    "ticketing software comparison",
    "guest experience management",
    "theme park analytics",
    "mobile app for attractions",
    "queue management solutions",
    "revenue optimization parks",
    "CRM for hospitality",
    "digital marketing tourism",
    "loyalty program platforms",
    "visitor analytics tools",
]


# =============================================================================
# Data Generator Classes
# =============================================================================

class SyntheticDataGenerator:
    def __init__(self):
        self.neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        self.qdrant_client = QdrantClient(url=QDRANT_URL)
        self.redis_client = redis.from_url(REDIS_URL)

        self.companies = []
        self.people = []
        self.deals = []
        self.activities = []
        self.signals = []
        self.meetings = []

    def close(self):
        self.neo4j_driver.close()

    def clear_all_data(self):
        """Clear existing data from all databases"""
        print("Clearing existing data...")

        # Clear Neo4j
        with self.neo4j_driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        print("  - Neo4j cleared")

        # Clear Qdrant collections
        try:
            collections = self.qdrant_client.get_collections().collections
            for col in collections:
                self.qdrant_client.delete_collection(col.name)
            print("  - Qdrant cleared")
        except Exception as e:
            print(f"  - Qdrant clear warning: {e}")

        # Clear Redis
        self.redis_client.flushdb()
        print("  - Redis cleared")

    def generate_company_id(self, name: str) -> str:
        """Generate deterministic company ID"""
        return hashlib.md5(name.encode()).hexdigest()[:12]

    def generate_person_id(self, name: str, company: str) -> str:
        """Generate deterministic person ID"""
        return hashlib.md5(f"{name}_{company}".encode()).hexdigest()[:12]

    def generate_companies(self):
        """Generate company nodes"""
        print("\nGenerating companies...")

        for company_data in ALL_COMPANIES:
            company = {
                "id": self.generate_company_id(company_data["name"]),
                "name": company_data["name"],
                "industry": company_data["industry"],
                "size": company_data["size"],
                "region": company_data["region"],
                "country": self._get_country(company_data),
                "website": self._generate_website(company_data["name"]),
                "linkedin_url": f"https://linkedin.com/company/{company_data['name'].lower().replace(' ', '-')}",
                "employee_count": self._get_employee_count(company_data["size"]),
                "annual_revenue": self._get_annual_revenue(company_data["size"]),
                "founded_year": random.randint(1950, 2015),
                "description": f"{company_data['name']} is a leading {company_data['industry'].lower()} company in {company_data['region']}.",
                "health_score": random.randint(40, 100),
                "engagement_score": random.randint(20, 100),
                "icp_fit_score": random.randint(50, 100),
                "created_at": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat(),
                "last_activity_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
            }
            self.companies.append(company)

        print(f"  Generated {len(self.companies)} companies")
        return self.companies

    def _get_country(self, company_data: dict) -> str:
        if company_data in DUTCH_COMPANIES:
            return "Netherlands"
        elif company_data in GERMAN_COMPANIES:
            return "Germany"
        elif company_data in BELGIAN_COMPANIES:
            return "Belgium"
        else:
            return "United Kingdom"

    def _generate_website(self, name: str) -> str:
        domain = name.lower().replace(" ", "").replace("-", "")
        return f"https://www.{domain}.com"

    def _get_employee_count(self, size: str) -> int:
        ranges = {
            "small": (10, 50),
            "medium": (50, 500),
            "large": (500, 5000),
            "enterprise": (5000, 50000)
        }
        return random.randint(*ranges.get(size, (100, 1000)))

    def _get_annual_revenue(self, size: str) -> int:
        ranges = {
            "small": (1000000, 10000000),
            "medium": (10000000, 100000000),
            "large": (100000000, 1000000000),
            "enterprise": (1000000000, 10000000000)
        }
        return random.randint(*ranges.get(size, (10000000, 100000000)))

    def generate_people(self):
        """Generate people/contacts for each company"""
        print("\nGenerating people...")

        for company in self.companies:
            # Generate 3-10 contacts per company based on size
            num_contacts = {
                "small": random.randint(2, 4),
                "medium": random.randint(3, 6),
                "large": random.randint(5, 8),
                "enterprise": random.randint(6, 10)
            }.get(company["size"], 4)

            # Ensure we have at least one C-level and one Director
            roles_to_assign = ["C-Level", "Director"]
            roles_to_assign.extend(random.choices(["VP", "Director", "Manager", "Specialist"], k=num_contacts-2))

            for role in roles_to_assign:
                first_name = random.choice(DUTCH_FIRST_NAMES)
                last_name = random.choice(DUTCH_LAST_NAMES)
                full_name = f"{first_name} {last_name}"
                job_title = random.choice(JOB_TITLES[role])

                person = {
                    "id": self.generate_person_id(full_name, company["name"]),
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": full_name,
                    "email": f"{first_name.lower()}.{last_name.lower().replace(' ', '')}@{company['name'].lower().replace(' ', '')}.com",
                    "phone": f"+31 6 {random.randint(10000000, 99999999)}",
                    "job_title": job_title,
                    "seniority": role,
                    "department": self._get_department(job_title),
                    "company_id": company["id"],
                    "company_name": company["name"],
                    "linkedin_url": f"https://linkedin.com/in/{first_name.lower()}-{last_name.lower().replace(' ', '-')}",
                    "is_decision_maker": role in ["C-Level", "VP", "Director"],
                    "engagement_score": random.randint(10, 100),
                    "last_contacted_at": (datetime.now() - timedelta(days=random.randint(0, 60))).isoformat() if random.random() > 0.3 else None,
                    "created_at": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat(),
                }
                self.people.append(person)

        print(f"  Generated {len(self.people)} people")
        return self.people

    def _get_department(self, job_title: str) -> str:
        if any(word in job_title.lower() for word in ["sales", "business development", "account"]):
            return "Sales"
        elif any(word in job_title.lower() for word in ["marketing", "digital"]):
            return "Marketing"
        elif any(word in job_title.lower() for word in ["operations", "experience", "guest"]):
            return "Operations"
        elif any(word in job_title.lower() for word in ["revenue", "finance", "cfo"]):
            return "Finance"
        elif any(word in job_title.lower() for word in ["technology", "cto", "it"]):
            return "Technology"
        else:
            return "Executive"

    def generate_deals(self):
        """Generate deals/opportunities"""
        print("\nGenerating deals...")

        # Select ~60% of companies to have active deals
        companies_with_deals = random.sample(self.companies, int(len(self.companies) * 0.6))

        for company in companies_with_deals:
            # 1-3 deals per company
            num_deals = random.randint(1, 3)

            for _ in range(num_deals):
                product = random.choice(PRODUCTS_SERVICES)
                stage = random.choice(DEAL_STAGES)

                # Calculate deal value with some variance
                base_value = product["base_price"]
                value = int(base_value * random.uniform(0.7, 1.5))

                # Get a contact from this company as the primary contact
                company_contacts = [p for p in self.people if p["company_id"] == company["id"]]
                primary_contact = random.choice(company_contacts) if company_contacts else None

                # Set dates based on stage
                created_days_ago = random.randint(14, 180)
                created_at = datetime.now() - timedelta(days=created_days_ago)

                if stage in ["Closed Won", "Closed Lost"]:
                    close_date = datetime.now() - timedelta(days=random.randint(0, created_days_ago - 7))
                else:
                    close_date = datetime.now() + timedelta(days=random.randint(14, 90))

                deal = {
                    "id": str(uuid.uuid4())[:12],
                    "name": f"{company['name']} - {product['name']}",
                    "company_id": company["id"],
                    "company_name": company["name"],
                    "primary_contact_id": primary_contact["id"] if primary_contact else None,
                    "primary_contact_name": primary_contact["full_name"] if primary_contact else None,
                    "product": product["name"],
                    "product_category": product["category"],
                    "stage": stage,
                    "value": value,
                    "currency": "EUR",
                    "probability": self._get_probability(stage),
                    "expected_close_date": close_date.isoformat(),
                    "created_at": created_at.isoformat(),
                    "last_activity_at": (datetime.now() - timedelta(days=random.randint(0, 14))).isoformat(),
                    "owner": random.choice(["Daan van der Berg", "Sophie de Vries", "Michiel Jansen"]),
                    "next_step": self._get_next_step(stage),
                    "competitors": random.sample(["Competitor A", "Competitor B", "Competitor C", "Internal Solution"], k=random.randint(0, 2)),
                    "loss_reason": self._get_loss_reason() if stage == "Closed Lost" else None,
                }
                self.deals.append(deal)

        print(f"  Generated {len(self.deals)} deals")
        return self.deals

    def _get_probability(self, stage: str) -> int:
        probabilities = {
            "Discovery": 10,
            "Qualification": 25,
            "Proposal": 50,
            "Negotiation": 75,
            "Closed Won": 100,
            "Closed Lost": 0
        }
        return probabilities.get(stage, 50)

    def _get_next_step(self, stage: str) -> str:
        steps = {
            "Discovery": "Schedule discovery call",
            "Qualification": "Send qualification questionnaire",
            "Proposal": "Prepare and send proposal",
            "Negotiation": "Final contract review",
            "Closed Won": "Begin implementation",
            "Closed Lost": "Schedule post-mortem"
        }
        return steps.get(stage, "Follow up")

    def _get_loss_reason(self) -> str:
        reasons = [
            "Budget constraints",
            "Lost to competitor",
            "Project postponed",
            "No decision made",
            "Requirements changed",
            "Internal solution preferred"
        ]
        return random.choice(reasons)

    def generate_signals(self):
        """Generate buying signals and intent data"""
        print("\nGenerating signals...")

        # Generate signals for ~70% of companies
        companies_with_signals = random.sample(self.companies, int(len(self.companies) * 0.7))

        for company in companies_with_signals:
            # 1-5 signals per company
            num_signals = random.randint(1, 5)

            for _ in range(num_signals):
                signal_type = random.choice(SIGNAL_TYPES)
                days_ago = random.randint(0, 90)

                signal = {
                    "id": str(uuid.uuid4())[:12],
                    "company_id": company["id"],
                    "company_name": company["name"],
                    "type": signal_type["type"],
                    "category": signal_type["category"],
                    "impact": signal_type["impact"],
                    "title": self._generate_signal_title(signal_type["type"], company["name"]),
                    "description": self._generate_signal_description(signal_type["type"], company),
                    "source": random.choice(["News API", "LinkedIn", "Company Website", "Press Release", "Industry Report"]),
                    "source_url": f"https://example.com/news/{str(uuid.uuid4())[:8]}",
                    "confidence_score": random.randint(60, 100),
                    "detected_at": (datetime.now() - timedelta(days=days_ago)).isoformat(),
                    "is_read": random.choice([True, False]),
                    "is_actionable": signal_type["impact"] in ["high", "medium"],
                }
                self.signals.append(signal)

        # Generate intent signals
        for company in random.sample(self.companies, int(len(self.companies) * 0.5)):
            for topic in random.sample(INTENT_TOPICS, random.randint(1, 3)):
                intent_signal = {
                    "id": str(uuid.uuid4())[:12],
                    "company_id": company["id"],
                    "company_name": company["name"],
                    "type": "intent_signal",
                    "category": "Intent",
                    "impact": "high",
                    "title": f"{company['name']} showing interest in {topic}",
                    "description": f"Multiple employees from {company['name']} have been researching {topic} over the past 30 days.",
                    "source": "Intent Data Provider",
                    "topic": topic,
                    "intent_score": random.randint(50, 100),
                    "trend": random.choice(["rising", "stable", "declining"]),
                    "confidence_score": random.randint(70, 95),
                    "detected_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
                    "is_read": random.choice([True, False]),
                    "is_actionable": True,
                }
                self.signals.append(intent_signal)

        print(f"  Generated {len(self.signals)} signals")
        return self.signals

    def _generate_signal_title(self, signal_type: str, company_name: str) -> str:
        titles = {
            "funding_round": f"{company_name} announces new funding round",
            "leadership_change": f"New executive appointed at {company_name}",
            "expansion_announcement": f"{company_name} announces expansion plans",
            "new_attraction": f"{company_name} unveils new attraction",
            "partnership_announcement": f"{company_name} forms strategic partnership",
            "technology_investment": f"{company_name} invests in digital transformation",
            "sustainability_initiative": f"{company_name} launches sustainability program",
            "award_recognition": f"{company_name} receives industry award",
            "visitor_milestone": f"{company_name} celebrates visitor milestone",
            "renovation_project": f"{company_name} announces major renovation",
        }
        return titles.get(signal_type, f"Update from {company_name}")

    def _generate_signal_description(self, signal_type: str, company: dict) -> str:
        descriptions = {
            "funding_round": f"{company['name']} has secured additional funding to support growth initiatives in the {company['industry']} sector.",
            "leadership_change": f"{company['name']} has appointed a new executive to lead their digital transformation efforts.",
            "expansion_announcement": f"{company['name']} plans to expand operations in {company['region']} with new facilities.",
            "new_attraction": f"{company['name']} has announced a major new attraction opening next season.",
            "partnership_announcement": f"{company['name']} has entered into a strategic partnership to enhance guest experiences.",
            "technology_investment": f"{company['name']} is investing significantly in new technology platforms.",
            "sustainability_initiative": f"{company['name']} has launched a comprehensive sustainability and ESG program.",
            "award_recognition": f"{company['name']} has been recognized for excellence in the {company['industry']} industry.",
            "visitor_milestone": f"{company['name']} has announced reaching a significant visitor milestone.",
            "renovation_project": f"{company['name']} has begun a major renovation and modernization project.",
        }
        return descriptions.get(signal_type, f"New development at {company['name']}")

    def generate_activities(self):
        """Generate activity history"""
        print("\nGenerating activities...")

        activity_types = ["email", "call", "meeting", "note", "task"]

        for deal in self.deals:
            # 3-15 activities per deal
            num_activities = random.randint(3, 15)

            for i in range(num_activities):
                days_ago = random.randint(0, 90)
                activity_type = random.choice(activity_types)

                activity = {
                    "id": str(uuid.uuid4())[:12],
                    "type": activity_type,
                    "deal_id": deal["id"],
                    "company_id": deal["company_id"],
                    "contact_id": deal["primary_contact_id"],
                    "subject": self._generate_activity_subject(activity_type),
                    "description": self._generate_activity_description(activity_type, deal),
                    "outcome": random.choice(["positive", "neutral", "negative"]) if activity_type in ["call", "meeting"] else None,
                    "duration_minutes": random.randint(15, 60) if activity_type in ["call", "meeting"] else None,
                    "performed_by": deal["owner"],
                    "performed_at": (datetime.now() - timedelta(days=days_ago)).isoformat(),
                    "created_at": (datetime.now() - timedelta(days=days_ago)).isoformat(),
                }
                self.activities.append(activity)

        print(f"  Generated {len(self.activities)} activities")
        return self.activities

    def _generate_activity_subject(self, activity_type: str) -> str:
        subjects = {
            "email": ["Follow-up on proposal", "Introduction email", "Pricing discussion", "Next steps", "Thank you"],
            "call": ["Discovery call", "Demo call", "Negotiation call", "Check-in call", "Technical review"],
            "meeting": ["On-site demo", "Executive presentation", "Contract review", "Kickoff meeting", "Requirements workshop"],
            "note": ["Meeting notes", "Call summary", "Important update", "Action items", "Stakeholder feedback"],
            "task": ["Send proposal", "Schedule demo", "Follow up", "Prepare presentation", "Review contract"],
        }
        return random.choice(subjects.get(activity_type, ["Activity"]))

    def _generate_activity_description(self, activity_type: str, deal: dict) -> str:
        return f"{activity_type.capitalize()} regarding {deal['product']} opportunity with {deal['company_name']}."

    def generate_meetings(self):
        """Generate meetings for thought leadership"""
        print("\nGenerating meetings...")

        meeting_types = ["Discovery Call", "Product Demo", "Executive Briefing", "Contract Review", "Kickoff Meeting"]

        for deal in self.deals:
            if deal["stage"] not in ["Closed Won", "Closed Lost"]:
                # Create 1-2 upcoming meetings
                for _ in range(random.randint(1, 2)):
                    days_ahead = random.randint(1, 30)

                    # Get contacts from this company
                    company_contacts = [p for p in self.people if p["company_id"] == deal["company_id"]]
                    attendees = random.sample(company_contacts, min(random.randint(1, 3), len(company_contacts)))

                    meeting = {
                        "id": str(uuid.uuid4())[:12],
                        "title": f"{random.choice(meeting_types)} - {deal['company_name']}",
                        "deal_id": deal["id"],
                        "company_id": deal["company_id"],
                        "company_name": deal["company_name"],
                        "start_time": (datetime.now() + timedelta(days=days_ahead, hours=random.randint(9, 16))).isoformat(),
                        "end_time": (datetime.now() + timedelta(days=days_ahead, hours=random.randint(10, 17))).isoformat(),
                        "location": random.choice(["Virtual - Zoom", "Virtual - Teams", f"{deal['company_name']} HQ", "Our Office"]),
                        "attendees": [{"id": a["id"], "name": a["full_name"], "email": a["email"]} for a in attendees],
                        "prep_status": random.choice(["not_started", "in_progress", "completed"]),
                        "prep_brief": None,  # Will be generated
                        "owner": deal["owner"],
                        "created_at": datetime.now().isoformat(),
                    }
                    self.meetings.append(meeting)

        print(f"  Generated {len(self.meetings)} meetings")
        return self.meetings

    def save_to_neo4j(self):
        """Save all generated data to Neo4j"""
        print("\nSaving to Neo4j...")

        with self.neo4j_driver.session() as session:
            # Create indexes
            print("  Creating indexes...")
            session.run("CREATE INDEX company_id IF NOT EXISTS FOR (c:Company) ON (c.id)")
            session.run("CREATE INDEX person_id IF NOT EXISTS FOR (p:Person) ON (p.id)")
            session.run("CREATE INDEX deal_id IF NOT EXISTS FOR (d:Deal) ON (d.id)")
            session.run("CREATE INDEX signal_id IF NOT EXISTS FOR (s:Signal) ON (s.id)")
            session.run("CREATE INDEX activity_id IF NOT EXISTS FOR (a:Activity) ON (a.id)")
            session.run("CREATE INDEX meeting_id IF NOT EXISTS FOR (m:Meeting) ON (m.id)")

            # Create Companies
            print("  Creating companies...")
            for company in self.companies:
                session.run("""
                    CREATE (c:Company $props)
                """, props=company)

            # Create People with relationships to Companies
            print("  Creating people...")
            for person in self.people:
                session.run("""
                    MATCH (c:Company {id: $company_id})
                    CREATE (p:Person $props)
                    CREATE (p)-[:WORKS_AT]->(c)
                """, company_id=person["company_id"], props={k: v for k, v in person.items() if k not in ["company_id", "company_name"]})

            # Create Deals with relationships
            print("  Creating deals...")
            for deal in self.deals:
                # Convert competitors list to JSON string
                deal_props = {k: v for k, v in deal.items() if k not in ["company_id", "company_name", "primary_contact_id", "primary_contact_name", "competitors"]}
                deal_props["competitors_json"] = json.dumps(deal.get("competitors", []))
                session.run("""
                    MATCH (c:Company {id: $company_id})
                    CREATE (d:Deal $props)
                    CREATE (d)-[:BELONGS_TO]->(c)
                """, company_id=deal["company_id"], props=deal_props)

                # Link to primary contact if exists
                if deal["primary_contact_id"]:
                    session.run("""
                        MATCH (d:Deal {id: $deal_id})
                        MATCH (p:Person {id: $person_id})
                        CREATE (d)-[:PRIMARY_CONTACT]->(p)
                    """, deal_id=deal["id"], person_id=deal["primary_contact_id"])

            # Create Signals
            print("  Creating signals...")
            for signal in self.signals:
                session.run("""
                    MATCH (c:Company {id: $company_id})
                    CREATE (s:Signal $props)
                    CREATE (s)-[:ABOUT]->(c)
                """, company_id=signal["company_id"], props={k: v for k, v in signal.items() if k not in ["company_id", "company_name"]})

            # Create Activities
            print("  Creating activities...")
            for activity in self.activities:
                session.run("""
                    MATCH (d:Deal {id: $deal_id})
                    CREATE (a:Activity $props)
                    CREATE (a)-[:RELATED_TO]->(d)
                """, deal_id=activity["deal_id"], props={k: v for k, v in activity.items() if k not in ["deal_id", "company_id", "contact_id"]})

            # Create Meetings
            print("  Creating meetings...")
            for meeting in self.meetings:
                # Convert attendees to JSON string for Neo4j storage
                meeting_props = {k: v for k, v in meeting.items() if k not in ["company_id", "company_name", "deal_id", "attendees"]}
                meeting_props["attendees_json"] = json.dumps(meeting.get("attendees", []))
                session.run("""
                    MATCH (c:Company {id: $company_id})
                    CREATE (m:Meeting $props)
                    CREATE (m)-[:WITH]->(c)
                """, company_id=meeting["company_id"], props=meeting_props)

                if meeting.get("deal_id"):
                    session.run("""
                        MATCH (m:Meeting {id: $meeting_id})
                        MATCH (d:Deal {id: $deal_id})
                        CREATE (m)-[:FOR_DEAL]->(d)
                    """, meeting_id=meeting["id"], deal_id=meeting["deal_id"])

            # Create some cross-company relationships (partnerships, competitors)
            print("  Creating company relationships...")
            for company in random.sample(self.companies, len(self.companies) // 3):
                partner = random.choice([c for c in self.companies if c["id"] != company["id"]])
                session.run("""
                    MATCH (c1:Company {id: $id1})
                    MATCH (c2:Company {id: $id2})
                    CREATE (c1)-[:PARTNERS_WITH]->(c2)
                """, id1=company["id"], id2=partner["id"])

        print("  Neo4j save complete!")

    def setup_qdrant_collections(self):
        """Create Qdrant collections for vector search"""
        print("\nSetting up Qdrant collections...")

        # Company embeddings collection
        self.qdrant_client.create_collection(
            collection_name="companies",
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

        # People embeddings collection
        self.qdrant_client.create_collection(
            collection_name="people",
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

        # Signal embeddings collection
        self.qdrant_client.create_collection(
            collection_name="signals",
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

        # Knowledge base collection
        self.qdrant_client.create_collection(
            collection_name="knowledge",
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

        print("  Qdrant collections created!")

    def generate_embeddings(self):
        """Generate mock embeddings for vector search"""
        print("\nGenerating embeddings...")

        # Generate company embeddings
        print("  Generating company embeddings...")
        company_points = []
        for i, company in enumerate(self.companies):
            # Create mock embedding based on company attributes
            vector = np.random.randn(384).astype(np.float32).tolist()
            company_points.append(PointStruct(
                id=i,
                vector=vector,
                payload={
                    "id": company["id"],
                    "name": company["name"],
                    "industry": company["industry"],
                    "size": company["size"],
                    "country": company["country"],
                }
            ))
        self.qdrant_client.upsert(collection_name="companies", points=company_points)

        # Generate people embeddings
        print("  Generating people embeddings...")
        people_points = []
        for i, person in enumerate(self.people):
            vector = np.random.randn(384).astype(np.float32).tolist()
            people_points.append(PointStruct(
                id=i,
                vector=vector,
                payload={
                    "id": person["id"],
                    "name": person["full_name"],
                    "title": person["job_title"],
                    "company": person["company_name"],
                    "seniority": person["seniority"],
                }
            ))
        self.qdrant_client.upsert(collection_name="people", points=people_points)

        # Generate signal embeddings
        print("  Generating signal embeddings...")
        signal_points = []
        for i, signal in enumerate(self.signals):
            vector = np.random.randn(384).astype(np.float32).tolist()
            signal_points.append(PointStruct(
                id=i,
                vector=vector,
                payload={
                    "id": signal["id"],
                    "title": signal["title"],
                    "type": signal["type"],
                    "company": signal["company_name"],
                    "impact": signal["impact"],
                }
            ))
        self.qdrant_client.upsert(collection_name="signals", points=signal_points)

        # Generate knowledge base entries
        print("  Generating knowledge embeddings...")
        knowledge_entries = self._generate_knowledge_base()
        knowledge_points = []
        for i, entry in enumerate(knowledge_entries):
            vector = np.random.randn(384).astype(np.float32).tolist()
            knowledge_points.append(PointStruct(
                id=i,
                vector=vector,
                payload=entry
            ))
        self.qdrant_client.upsert(collection_name="knowledge", points=knowledge_points)

        print("  Embeddings generated!")

    def _generate_knowledge_base(self) -> List[Dict]:
        """Generate knowledge base entries from meeting transcripts and notes"""
        knowledge = []

        # Industry insights
        industries = list(set(c["industry"] for c in self.companies))
        for industry in industries:
            knowledge.append({
                "type": "industry_insight",
                "title": f"{industry} Market Overview",
                "content": f"The {industry} sector continues to grow in Europe with digital transformation driving innovation.",
                "source": "Market Research",
                "date": datetime.now().isoformat(),
            })

        # Company-specific knowledge
        for company in random.sample(self.companies, len(self.companies) // 2):
            knowledge.append({
                "type": "company_note",
                "title": f"Notes on {company['name']}",
                "content": f"{company['name']} is a key player in {company['industry']}. They are focused on guest experience and digital innovation.",
                "company_id": company["id"],
                "company_name": company["name"],
                "date": datetime.now().isoformat(),
            })

        # Best practices
        best_practices = [
            "Theme park operators are increasingly adopting mobile-first ticketing solutions",
            "Revenue management systems show 15-20% revenue uplift when properly implemented",
            "Guest experience scores correlate strongly with repeat visit rates",
            "Queue management systems can reduce perceived wait times by up to 30%",
            "Loyalty programs drive 40% higher spend per visit when gamified",
        ]
        for practice in best_practices:
            knowledge.append({
                "type": "best_practice",
                "title": practice[:50] + "...",
                "content": practice,
                "source": "Industry Analysis",
                "date": datetime.now().isoformat(),
            })

        return knowledge

    def populate_redis_cache(self):
        """Populate Redis with cache data"""
        print("\nPopulating Redis cache...")

        # Cache pipeline stats
        pipeline_stats = {
            "total_deals": len(self.deals),
            "total_value": sum(d["value"] for d in self.deals),
            "by_stage": {},
            "updated_at": datetime.now().isoformat()
        }
        for deal in self.deals:
            stage = deal["stage"]
            if stage not in pipeline_stats["by_stage"]:
                pipeline_stats["by_stage"][stage] = {"count": 0, "value": 0}
            pipeline_stats["by_stage"][stage]["count"] += 1
            pipeline_stats["by_stage"][stage]["value"] += deal["value"]

        self.redis_client.set("pipeline:stats", json.dumps(pipeline_stats))

        # Cache signal counts
        signal_counts = {}
        for signal in self.signals:
            sig_type = signal["type"]
            signal_counts[sig_type] = signal_counts.get(sig_type, 0) + 1
        self.redis_client.set("signals:counts", json.dumps(signal_counts))

        # Cache recent activity
        recent_activities = sorted(self.activities, key=lambda x: x["performed_at"], reverse=True)[:50]
        self.redis_client.set("activities:recent", json.dumps(recent_activities))

        # Cache user session data (mock)
        user_session = {
            "user_id": "daan_van_der_berg",
            "name": "Daan van der Berg",
            "role": "Sales Director",
            "last_login": datetime.now().isoformat(),
            "preferences": {
                "language": "en",
                "timezone": "Europe/Amsterdam",
                "notifications": True
            }
        }
        self.redis_client.set("session:hugo_van_der_berg", json.dumps(user_session))

        print("  Redis cache populated!")

    def print_summary(self):
        """Print summary of generated data"""
        print("\n" + "="*60)
        print("SYNTHETIC DATA GENERATION COMPLETE")
        print("="*60)
        print(f"\nGenerated Data Summary:")
        print(f"  - Companies: {len(self.companies)}")
        print(f"  - People/Contacts: {len(self.people)}")
        print(f"  - Deals: {len(self.deals)}")
        print(f"  - Signals: {len(self.signals)}")
        print(f"  - Activities: {len(self.activities)}")
        print(f"  - Meetings: {len(self.meetings)}")

        # Deal statistics
        total_value = sum(d["value"] for d in self.deals)
        won_deals = [d for d in self.deals if d["stage"] == "Closed Won"]
        open_deals = [d for d in self.deals if d["stage"] not in ["Closed Won", "Closed Lost"]]

        print(f"\nPipeline Statistics:")
        print(f"  - Total Pipeline Value: €{total_value:,.0f}")
        print(f"  - Open Deals: {len(open_deals)} (€{sum(d['value'] for d in open_deals):,.0f})")
        print(f"  - Won Deals: {len(won_deals)} (€{sum(d['value'] for d in won_deals):,.0f})")

        print(f"\nCompany Distribution:")
        countries = {}
        for c in self.companies:
            countries[c["country"]] = countries.get(c["country"], 0) + 1
        for country, count in sorted(countries.items(), key=lambda x: -x[1]):
            print(f"  - {country}: {count}")

        print("\n" + "="*60)


def main():
    print("="*60)
    print("DUINRELL SALES INTELLIGENCE PLATFORM")
    print("Synthetic Data Generator")
    print("="*60)

    generator = SyntheticDataGenerator()

    try:
        # Clear existing data
        generator.clear_all_data()

        # Generate all data
        generator.generate_companies()
        generator.generate_people()
        generator.generate_deals()
        generator.generate_signals()
        generator.generate_activities()
        generator.generate_meetings()

        # Save to databases
        generator.save_to_neo4j()
        generator.setup_qdrant_collections()
        generator.generate_embeddings()
        generator.populate_redis_cache()

        # Print summary
        generator.print_summary()

    finally:
        generator.close()

    print("\nData generation complete! You can now explore the platform.")


if __name__ == "__main__":
    main()
