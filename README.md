# Marketplace Intelligence Platform

First version of the marketplace intelligence platform - created for ambitious organisations with big growth potential.

A modern marketplace intelligence platform with pipeline visualization, MEDDPICC scoring, signal tracking, and outreach automation.

## Overview

Marketplace Intelligence Platform is a full-stack application designed for B2B sales teams. It provides:

- **Pipeline Management** - Visual bowtie funnel with deal tracking
- **MEDDPICC Scoring** - Comprehensive deal qualification methodology
- **Signal Intelligence** - Track buying signals and intent data
- **Contact Management** - Buying committee mapping and engagement tracking
- **Outreach Sequences** - Automated multi-channel campaigns
- **Analytics Dashboard** - Performance metrics and insights

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Lucide React** for icons
- **CSS Custom Properties** for theming (dark/light mode)

### Backend
- **FastAPI** (Python 3.11) - REST API
- **Neo4j 5.18** - Graph database for relationship data
- **Qdrant** - Vector database for semantic search
- **Redis 7** - Caching layer
- **MinIO** - S3-compatible object storage (data lake)

### Infrastructure
- **Docker & Docker Compose** - Container orchestration
- All services containerized for consistent deployment

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### 1. Clone and Configure
```bash
git clone https://github.com/MichaelUenk/Sales_Intelligence_Platform_Dec25.git
cd Sales_Intelligence_Platform_Dec25

# Configure environment
cp .env.example .env
# Edit .env and add your API keys:
#   GOOGLE_PLACES_API_KEY=your_key
#   HUNTER_API_KEY=your_key
#   OPENAI_API_KEY=your_key (optional, for AI features)
```

### 2. Start All Services
```bash
docker compose up -d
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Neo4j Browser**: http://localhost:7474 (neo4j/neo4jpass)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### Default Login
Password: `demo` (configurable via `VITE_APP_PASSWORD`)

## Project Structure

```
Sales_Intelligence_Platform_Dec25/
├── docker-compose.yml              # Service orchestration
├── .env.example                    # Environment template
├── Dockerfile                      # Backend container
├── src/
│   ├── atlas/                      # Backend application
│   │   ├── cli.py                  # CLI tools
│   │   ├── ingestors/              # Data source connectors
│   │   ├── etl/                    # ETL pipelines
│   │   └── services/
│   │       └── query_api/          # FastAPI application
│   │           ├── main.py
│   │           ├── routers/
│   │           └── ...
│   └── data-backbone/
│       └── frontend/               # React frontend
│           ├── Dockerfile
│           ├── package.json
│           ├── src/
│           │   ├── App.tsx
│           │   ├── components/
│           │   │   ├── layout/     # AppLayout, Header
│           │   │   ├── bowtie/     # Pipeline visualization
│           │   │   ├── deals/      # Deal detail, MEDDPICC
│           │   │   ├── signals/    # Signal intelligence
│           │   │   ├── leads/      # Lead management
│           │   │   ├── outreach/   # Sequence builder
│           │   │   └── ui/         # Base components
│           │   ├── context/        # React contexts
│           │   ├── services/       # API client
│           │   └── index.css       # Design system
│           └── ...
├── infra/                          # Infrastructure configs
└── Makefile                        # Common commands
```

## Features

### Pipeline (Bowtie) View
- 8-stage sales funnel visualization
- Drag-and-drop deal management
- Stage conversion metrics
- Deal health indicators

### MEDDPICC Scorecard
- **M**etrics - Quantifiable business outcomes
- **E**conomic Buyer - Budget authority identification
- **D**ecision Criteria - How they will decide
- **D**ecision Process - Steps to make decision
- **P**aper Process - Legal/procurement workflow
- **I**dentify Pain - Business problem to solve
- **C**hampion - Internal advocate
- **C**ompetition - Competitive landscape

### Signal Intelligence
- News and event tracking
- Intent data monitoring
- Engagement scoring
- Hot account identification

### Outreach Sequences
- Multi-channel campaigns (Email, LinkedIn, Phone)
- Template personalization with tokens
- A/B testing support
- Performance analytics

## Development

### Frontend Development
```bash
cd src/data-backbone/frontend
npm install
npm run dev
```

### Backend Development
```bash
pip install -r requirements.txt
export PYTHONPATH=$(pwd)/src
uvicorn atlas.services.query_api.main:app --reload
```

### Run Tests
```bash
# Backend tests
pytest

# Frontend type check
cd src/data-backbone/frontend
npx tsc --noEmit
```

## API Endpoints

### Health & Status
- `GET /healthz` - Health check

### Companies
- `GET /companies?domain=` - Find by domain
- `GET /companies/by-industry?industry=` - Filter by industry
- `GET /companies/by-location?location=` - Filter by location

### People
- `GET /people?q=` - Search by name
- `GET /people/by-department?department=` - Filter by department

### Graph
- `GET /neighbors?id=&depth=` - Graph connections

### Deals
- `GET /deals` - List deals
- `GET /deals/pipeline-stats` - Pipeline statistics

### Ingestion
- `POST /ingest` - Trigger data ingestion

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:8000 |
| `VITE_APP_PASSWORD` | Login password | demo |
| `NEO4J_URI` | Neo4j connection | bolt://neo4j:7687 |
| `NEO4J_PASSWORD` | Neo4j password | neo4jpass |
| `REDIS_URL` | Redis connection | redis://redis:6379/0 |
| `MINIO_ENDPOINT` | MinIO endpoint | minio:9000 |
| `GOOGLE_PLACES_API_KEY` | Google Places API | - |
| `HUNTER_API_KEY` | Hunter.io API | - |
| `OPENAI_API_KEY` | OpenAI API (optional) | - |

## License

MIT

## Support

Contact: michael@ai-kip.com
