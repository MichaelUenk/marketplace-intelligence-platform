#!/usr/bin/env python3
"""
Batch loader for Neo4j seed data
Loads data in smaller batches for better performance
"""

import os
import re
import sys

# Neo4j connection settings
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4jpass")

BATCH_SIZE = 50  # Number of statements per batch


def split_cypher_statements(content: str) -> list:
    """Split Cypher content into individual statements"""
    # Remove comments
    lines = []
    for line in content.split('\n'):
        stripped = line.strip()
        if stripped and not stripped.startswith('//'):
            lines.append(line)

    content = '\n'.join(lines)

    # Split on semicolons followed by newlines (end of statement)
    statements = []
    current = []

    for line in content.split('\n'):
        current.append(line)
        if line.strip().endswith(';'):
            stmt = '\n'.join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []

    # Handle any remaining content
    if current:
        stmt = '\n'.join(current).strip()
        if stmt:
            statements.append(stmt)

    return statements


def load_with_http(statements: list):
    """Load data using HTTP API"""
    import urllib.request
    import json
    import base64

    url = "http://localhost:7474/db/neo4j/tx/commit"
    auth = base64.b64encode(f"{NEO4J_USER}:{NEO4J_PASSWORD}".encode()).decode()

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {auth}"
    }

    total = len(statements)
    loaded = 0
    errors = 0

    print(f"Loading {total} statements via HTTP...")

    for i in range(0, total, BATCH_SIZE):
        batch = statements[i:i + BATCH_SIZE]

        # Create transaction payload
        payload = {
            "statements": [{"statement": stmt.rstrip(';')} for stmt in batch]
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method='POST'
            )

            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode())

                if result.get('errors'):
                    for err in result['errors']:
                        print(f"  Error: {err.get('message', 'Unknown')[:100]}")
                        errors += 1

            loaded += len(batch)

            if (i + BATCH_SIZE) % 500 == 0 or i + BATCH_SIZE >= total:
                print(f"  Loaded {min(i + BATCH_SIZE, total)}/{total} statements...")

        except Exception as e:
            print(f"  Batch error at {i}: {str(e)[:100]}")
            errors += len(batch)

    return loaded, errors


def main():
    seed_file = os.path.join(
        os.path.dirname(__file__),
        "..", "infra", "neo4j", "seed_data.cypher"
    )

    if not os.path.exists(seed_file):
        print(f"Seed file not found: {seed_file}")
        print("Run seed_synthetic_data.py first to generate the data.")
        sys.exit(1)

    print("=" * 60)
    print("NEO4J BATCH DATA LOADER")
    print("=" * 60)
    print(f"\nReading seed file: {seed_file}")

    with open(seed_file, 'r') as f:
        content = f.read()

    print("Parsing Cypher statements...")
    statements = split_cypher_statements(content)
    print(f"Found {len(statements)} statements")

    print(f"\nLoading data to Neo4j at {NEO4J_URI}...")
    loaded, errors = load_with_http(statements)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total statements: {len(statements)}")
    print(f"Loaded: {loaded}")
    print(f"Errors: {errors}")

    if errors == 0:
        print("\nData loaded successfully!")
    else:
        print(f"\nCompleted with {errors} errors.")


if __name__ == "__main__":
    main()
