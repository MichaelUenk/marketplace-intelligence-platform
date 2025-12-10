#!/bin/bash
# Load seed data into Neo4j
# Usage: ./load_seed_data.sh [neo4j_uri] [username] [password]

NEO4J_URI="${1:-bolt://localhost:7687}"
NEO4J_USER="${2:-neo4j}"
NEO4J_PASSWORD="${3:-password}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_FILE="$SCRIPT_DIR/../infra/neo4j/init.cypher"
SEED_FILE="$SCRIPT_DIR/../infra/neo4j/seed_data.cypher"

echo "============================================================"
echo "NEO4J SEED DATA LOADER"
echo "============================================================"
echo ""
echo "Neo4j URI: $NEO4J_URI"
echo "User: $NEO4J_USER"
echo ""

# Check if cypher-shell is available
if command -v cypher-shell &> /dev/null; then
    echo "Using cypher-shell..."

    # Load init schema first
    if [ -f "$INIT_FILE" ]; then
        echo "Loading schema from init.cypher..."
        cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" < "$INIT_FILE"
        echo "Schema loaded."
    fi

    # Load seed data
    if [ -f "$SEED_FILE" ]; then
        echo "Loading seed data (this may take a few minutes)..."
        cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" < "$SEED_FILE"
        echo "Seed data loaded."
    else
        echo "Seed data file not found. Run seed_synthetic_data.py first."
        exit 1
    fi

elif command -v docker &> /dev/null; then
    echo "Using docker exec..."

    # Find neo4j container
    CONTAINER=$(docker ps --filter "name=neo4j" --format "{{.Names}}" | head -1)

    if [ -z "$CONTAINER" ]; then
        echo "No neo4j container found. Make sure Neo4j is running."
        exit 1
    fi

    echo "Found container: $CONTAINER"

    # Copy files to container
    docker cp "$INIT_FILE" "$CONTAINER:/var/lib/neo4j/import/init.cypher"
    docker cp "$SEED_FILE" "$CONTAINER:/var/lib/neo4j/import/seed_data.cypher"

    # Load init schema
    echo "Loading schema..."
    docker exec "$CONTAINER" cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" < "$INIT_FILE"

    # Load seed data
    echo "Loading seed data (this may take a few minutes)..."
    docker exec "$CONTAINER" cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" < "$SEED_FILE"

else
    echo "Neither cypher-shell nor docker found."
    echo ""
    echo "Options to load the data:"
    echo ""
    echo "1. Using Neo4j Browser:"
    echo "   - Open http://localhost:7474"
    echo "   - Copy and paste contents of init.cypher first"
    echo "   - Then copy and paste contents of seed_data.cypher"
    echo ""
    echo "2. Using Python neo4j driver:"
    echo "   pip install neo4j"
    echo "   python seed_synthetic_data.py --load"
    echo ""
    echo "3. Install cypher-shell:"
    echo "   brew install cypher-shell  # macOS"
    echo "   apt install cypher-shell   # Ubuntu/Debian"
    exit 1
fi

echo ""
echo "============================================================"
echo "DATA LOAD COMPLETE"
echo "============================================================"
echo ""
echo "Verify by running:"
echo "  MATCH (n) RETURN labels(n) as type, count(*) as count"
echo ""
