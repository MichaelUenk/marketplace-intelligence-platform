#!/usr/bin/env python3
"""
Direct loader for contacts - regenerates and loads contact data with combined Cypher
"""

import urllib.request
import json
import base64
import random
import uuid
from datetime import datetime, timedelta

NEO4J_HTTP = "http://localhost:7474/db/neo4j/tx/commit"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "neo4jpass"

FIRST_NAMES = [
    "James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Sophia", "William", "Isabella",
    "Elijah", "Mia", "Lucas", "Charlotte", "Mason", "Amelia", "Ethan", "Harper", "Alexander", "Evelyn",
    "Michael", "Sarah", "Daniel", "Jessica", "David", "Emily", "Matthew", "Hannah", "Andrew", "Rachel",
    "Jan", "Pieter", "Sophie", "Lars", "Anna", "Erik", "Maria", "Hans", "Lisa", "Klaus",
    "Pierre", "Marie", "Jean", "Isabelle", "Marco", "Giulia", "Wei", "Mei", "Priya", "Raj"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Martinez", "Anderson",
    "Van der Berg", "De Vries", "Jansen", "Bakker", "Visser", "Smit", "Mulder", "De Boer",
    "Mueller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
    "Dubois", "Martin", "Bernard", "Rossi", "Russo", "Chen", "Wang", "Tanaka", "Patel", "Kumar"
]

JOB_TITLES = [
    "CEO", "CFO", "CTO", "COO", "CMO", "VP of Operations", "VP of Sales", "VP of Marketing",
    "Director of Operations", "Director of Facilities", "Director of HR", "Director of IT",
    "Operations Manager", "Facilities Manager", "Office Manager", "HR Manager", "Procurement Manager",
    "Senior Engineer", "Business Analyst", "Account Executive", "Marketing Specialist"
]

DEPARTMENTS = ["Operations", "Facilities", "HR", "Finance", "IT", "Marketing", "Sales", "Engineering"]

BUYER_PERSONAS = [
    "Champion", "Economic Buyer", "Technical Evaluator", "User Buyer",
    "Influencer", "Coach", "Procurement", "Executive Sponsor"
]

SENIORITIES = ["C-Level", "VP", "Director", "Manager", "Individual Contributor"]


def run_cypher(statements):
    """Execute Cypher statements via HTTP"""
    auth = base64.b64encode(f"{NEO4J_USER}:{NEO4J_PASSWORD}".encode()).decode()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {auth}"
    }

    payload = {"statements": [{"statement": stmt} for stmt in statements]}

    req = urllib.request.Request(
        NEO4J_HTTP,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=120) as response:
        return json.loads(response.read().decode())


def main():
    import time

    print("Fetching companies from Neo4j...")

    # Get companies without contacts
    result = run_cypher(["""
        MATCH (c:Company)
        WHERE NOT EXISTS { MATCH (:Person)-[:WORKS_AT]->(c) }
        RETURN c.id as id, c.domain as domain, c.name as name
    """])
    companies = result['results'][0]['data']

    print(f"Found {len(companies)} companies without contacts")

    if len(companies) == 0:
        print("All companies have contacts. Exiting.")
        return

    # Generate and load contacts in batches
    batch_size = 10  # Smaller batch size
    total_contacts = 0

    for batch_start in range(0, len(companies), batch_size):
        batch = companies[batch_start:batch_start + batch_size]
        statements = []

        for company_row in batch:
            company_id = company_row['row'][0]
            domain = company_row['row'][1]
            company_name = company_row['row'][2]

            # Generate 3-8 contacts per company
            num_contacts = random.randint(3, 8)

            for _ in range(num_contacts):
                contact_id = str(uuid.uuid4())
                first = random.choice(FIRST_NAMES)
                last = random.choice(LAST_NAMES)
                email = f"{first.lower()}.{last.lower()}@{domain}"
                title = random.choice(JOB_TITLES)
                dept = random.choice(DEPARTMENTS)
                seniority = random.choice(SENIORITIES)
                persona = random.choice(BUYER_PERSONAS)

                # Combined Cypher for contact creation
                stmt = f"""
                MERGE (p:Person {{id: '{contact_id}'}})
                SET p.full_name = '{first} {last}',
                    p.first_name = '{first}',
                    p.last_name = '{last}',
                    p.email = '{email}',
                    p.title = '{title}',
                    p.department = '{dept}',
                    p.seniority = '{seniority}',
                    p.buyer_persona_type = '{persona}',
                    p.buyer_persona_confidence = {round(random.uniform(0.6, 0.99), 2)},
                    p.decision_maker_score = {random.randint(20, 100)}
                WITH p
                MATCH (c:Company {{id: '{company_id}'}})
                MERGE (p)-[:WORKS_AT]->(c)
                WITH p
                MERGE (e:Email {{address: '{email}'}})
                MERGE (p)-[:HAS_EMAIL]->(e)
                """
                statements.append(stmt)
                total_contacts += 1

        # Execute batch with retry
        max_retries = 3
        for retry in range(max_retries):
            try:
                result = run_cypher(statements)
                errors = result.get('errors', [])
                if errors:
                    print(f"  Batch {batch_start}: {len(errors)} errors")
                else:
                    print(f"  Loaded contacts for companies {batch_start+1}-{batch_start+len(batch)}")
                break
            except Exception as e:
                if "429" in str(e) and retry < max_retries - 1:
                    print(f"  Rate limited, waiting 3s...")
                    time.sleep(3)
                else:
                    print(f"  Batch {batch_start} error: {e}")
                    break

        # Small delay between batches
        time.sleep(0.5)

    print(f"\nTotal contacts created: {total_contacts}")

    # Verify
    result = run_cypher(["MATCH (p:Person) RETURN count(p) as count"])
    count = result['results'][0]['data'][0]['row'][0]
    print(f"Person nodes in database: {count}")


if __name__ == "__main__":
    main()
