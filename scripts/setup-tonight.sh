#!/bin/bash
# Setup script for tonight's implementation session (02:30 CET)
# Run this manually or via: at 02:30 < scripts/setup-tonight.sh

set -e

PROJECT_DIR="/Users/michaeluenk/Downloads/data-backbone-main"
cd "$PROJECT_DIR"

echo "🚀 Starting iBood Implementation Setup - $(date)"
echo "================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Start n8n (German workflow automation)
echo -e "\n${YELLOW}Step 1: Starting n8n (German workflow automation 🇩🇪)${NC}"
docker compose up -d n8n
echo -e "${GREEN}✓ n8n started at http://localhost:5678${NC}"

# Step 2: Verify all services are running
echo -e "\n${YELLOW}Step 2: Checking all services${NC}"
docker compose ps

# Step 3: Check if lemlist connector is properly registered
echo -e "\n${YELLOW}Step 3: Testing connectors${NC}"
curl -s http://localhost:8000/api/connectors/registry | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('Registered connectors:')
for c in data:
    flag = '🇫🇷' if c['id'] == 'lemlist' else ''
    print(f\"  - {c['id']}: {c['name']} {flag}\")
" || echo "API not ready yet, will be available after rebuild"

# Step 4: Rebuild backend with new connectors
echo -e "\n${YELLOW}Step 4: Rebuilding backend with European connectors${NC}"
docker compose build query_api
docker compose up -d query_api
echo -e "${GREEN}✓ Backend rebuilt with lemlist connector${NC}"

# Step 5: Display quick access URLs
echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}Setup Complete! Quick Access:${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo "  📊 Frontend:      http://localhost:3000"
echo "  🔌 API:           http://localhost:8000/docs"
echo "  🔄 n8n Workflows: http://localhost:5678"
echo "  📈 Neo4j Browser: http://localhost:7474"
echo ""
echo "European Services to Configure:"
echo "  🇫🇷 lemlist:  https://app.lemlist.com/settings/api"
echo "  🇫🇷 Mistral:  https://console.mistral.ai/api-keys"
echo "  🇫🇷 Aircall:  https://dashboard.aircall.io/integrations"
echo "  🇬🇧 Cognism:  https://app.cognism.com/settings/api"
echo ""
echo "Next: Run 'claude' and ask to implement Phase 1"
