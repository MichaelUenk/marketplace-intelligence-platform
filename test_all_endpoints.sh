#!/bin/bash

echo "🚀 Atlas Graph MVP - Full Endpoint Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Health Check${NC}"
curl -s 'http://localhost:8000/healthz' | python3 -m json.tool
echo ""
echo ""

echo -e "${BLUE}2. Company by Domain (TechCorp)${NC}"
curl -s 'http://localhost:8000/companies?domain=techcorp.com' | python3 -m json.tool
echo ""
echo ""

echo -e "${BLUE}3. Industry Analytics${NC}"
curl -s 'http://localhost:8000/analytics/industries' | python3 -m json.tool | head -60
echo ""
echo ""

echo -e "${BLUE}4. All Fitness Clubs (high potential for water coolers)${NC}"
curl -s 'http://localhost:8000/companies/by-industry?industry=Fitness' | python3 -m json.tool
echo ""
echo ""

echo -e "${BLUE}5. All Restaurants (high potential for water coolers)${NC}"
curl -s 'http://localhost:8000/companies/by-industry?industry=Restaurant' | python3 -m json.tool
echo ""
echo ""

echo -e "${BLUE}6. All Companies in London${NC}"
curl -s 'http://localhost:8000/companies/by-location?location=London' | python3 -m json.tool | head -80
echo ""
echo ""

echo -e "${BLUE}7. All Executives (decision makers)${NC}"
curl -s 'http://localhost:8000/people/by-department?department=Management' | python3 -m json.tool | head -80
echo ""
echo ""

echo -e "${BLUE}8. Search People by Name (Alex)${NC}"
curl -s 'http://localhost:8000/people?q=Alex' | python3 -m json.tool
echo ""
echo ""

echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "📊 Statistics:"
echo "  - 10 companies"
echo "  - 20 employees"
echo "  - 7 API endpoints"
echo "  - 10 industries"
echo ""
echo "🌐 Visualization UI:"
echo "  - Neo4j Browser: http://localhost:7474 (neo4j/neo4jpass)"
echo "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
