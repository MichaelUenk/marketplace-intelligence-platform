# Atlas Data Backbone

Modern B2B data pipeline: **Search → Enrich → Graph → Query**

Pluggable data sources (Google Places, Hunter.io, Apollo) → Data Lake (MinIO) → Graph (Neo4j) + Vector (Qdrant) → REST API (FastAPI)

## Quick Start

### 1. Initial Setup (one time)
```bash
# Install dependencies
pip install minio neo4j requests python-ulid

# Configure API keys
cp .env.example .env
# Edit .env and add your keys:
#   GOOGLE_PLACES_API_KEY=your_key
#   HUNTER_API_KEY=your_key

# Start infrastructure
docker compose up -d
```

### 2. Run Pipeline (simple)
```bash
# One command - does everything automatically:
# - Search companies
# - Enrich with people data
# - Save to MinIO, Neo4j, Qdrant

make pipeline.run QUERY="tech companies in Austin" LIMIT=10
```

### 3. View Results
```bash
# Neo4j Browser (graph)
open http://localhost:7474

# Qdrant Dashboard (vectors)
open http://localhost:6333/dashboard

# MinIO Console (raw data)
open http://localhost:9001
```

---

## Architecture

```
Data Sources          Data Lake        Databases          API
┌──────────────┐     ┌────────┐     ┌──────────┐     ┌─────────┐
│Google Places │────▶│        │────▶│  Neo4j   │────▶│FastAPI  │
│  Hunter.io   │     │ MinIO  │     │ (Graph)  │     │+ Redis  │
│ (Apollo.io)  │     │  (S3)  │     │  Qdrant  │     │ Cache   │
└──────────────┘     └────────┘     │ (Vector) │     └─────────┘
                                    └──────────┘
```

---

## Usage Examples

### Make Commands (Recommended)
```bash
# Tech companies
make pipeline.run QUERY="tech companies in Austin" LIMIT=10

# Restaurants
make pipeline.run QUERY="restaurants in New York" LIMIT=20
```

### Advanced CLI (Manual)
```bash
export PYTHONPATH=$(pwd)/src

# Search only (no enrichment)
python -m atlas.cli ingest "restaurants NYC" --limit 5

# Full pipeline
python -m atlas.cli ingest "query" --limit 10 --enrich --load --qdrant

# Load existing data
python -m atlas.cli etl enriched/raw/2025-11-03T... --qdrant
```

---

## Legacy Endpoints (Apollo Mock)

### Ingest Mock Data
```bash
docker compose exec query_api python -m atlas.ingestors.apollo.apollo_fetch
```

### ETL to Graph
```bash
docker compose exec query_api python -m atlas.etl.apollo_to_graph.etl_apollo \
  --prefix apollo/raw/2025-10-26T14:22:11Z
```

### ETL to Vector
```bash
docker compose exec query_api python -m atlas.etl.apollo_to_vector.etl_apollo_qdrant \
  --prefix apollo/raw/2025-10-26T14:22:11Z
```

### Queries
```bash
curl 'http://localhost:8000/healthz'
curl 'http://localhost:8000/companies?domain=techcorp.com'
curl 'http://localhost:8000/people?q=Alex'
curl 'http://localhost:8000/neighbors?id=apollo:u1&depth=2'
```

### List Data Lake content (MinIO)

See recent objects without opening the MinIO console:

```bash
# Most recent objects under apollo/raw/ (default)
make lake.ls

# Drill into a specific ingest prefix (use the timestamped value you saw earlier)
make lake.ls LAKE_PREFIX=apollo/raw/2025-10-26T14:22:11Z

# Limit number of lines (default 100)
make lake.ls LAKE_LIMIT=20
```
## UI Access

- **Neo4j Browser**: http://localhost:7474 (neo4j/neo4jpass)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **API Docs**: http://localhost:8000/docs

## Architecture

```
Apollo Mock → MinIO (S3) → ETL → Neo4j → FastAPI + Redis Cache
```

### Components:
- **MinIO**: Data Lake for storing raw data
- **Neo4j**: Graph database with APOC plugin
- **Redis**: Query caching
- **FastAPI**: Query API with 7 endpoints

### Endpoints:

#### Basic:
- `GET /healthz` - health check
- `GET /companies?domain=` - find company by domain
- `GET /people?q=` - search people by name
- `GET /neighbors?id=&depth=` - graph connections

#### B2B Extensions:
- `GET /analytics/industries` - industry analytics
- `GET /companies/by-industry?industry=` - filter by industry
- `GET /companies/by-location?location=` - filter by location
- `GET /people/by-department?department=` - search by department

## Project Structure

```
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment variables template
├── requirements.txt            # Python dependencies
├── infra/
│   ├── neo4j/init.cypher      # Neo4j constraints
│   └── minio/                 # MinIO setup scripts
├── ingestors/
│   ├── common/
│   │   ├── sidecar.py         # Metadata generation
│   │   └── s3_writer.py       # MinIO writer
│   └── apollo/
│       └── apollo_fetch.py    # Mock data generator
├── etl/
│   ├── common/
│   │   ├── schema.py          # Pydantic schemas
│   │   └── idempotency.py     # Batch ID generation
│   └── apollo_to_graph/
│       └── etl_apollo.py      # Apollo → Neo4j ETL
└── services/
    └── query_api/
        ├── main.py            # FastAPI application
        ├── deps.py            # Dependencies
        ├── config.py          # Settings
        ├── cache.py           # Redis cache
        └── cypher_queries.py  # Neo4j queries
```

## Data Model

### Graph Schema:
```cypher
(:Company {id, name, domain, industry, employee_count, location})
(:Person {id, full_name, title, department})
(:Email {address})

(:Person)-[:WORKS_AT]->(:Company)
(:Person)-[:HAS_EMAIL]->(:Email)
```

## Development

### Run Tests
```bash
bash test_all_endpoints.sh
```

### Clear Neo4j Data
```bash
docker compose exec query_api python -c "
from neo4j import GraphDatabase
driver = GraphDatabase.driver('bolt://neo4j:7687', auth=('neo4j', 'neo4jpass'))
with driver.session() as s:
    s.run('MATCH (n) DETACH DELETE n')
"
```

### View Logs
```bash
docker compose logs -f query_api
docker compose logs -f neo4j
```

## Test Data

10 companies from various industries:
- TechCorp Solutions (IT Services, Austin)
- Office Plus (Facilities Management, London)
- Golden Dragon Restaurant (Restaurant, New York)
- PowerFit Gym (Fitness, Los Angeles)
- MetalTech Industries (Manufacturing, Chicago)
- HealthPlus Medical Center (Healthcare, Boston)
- Bright Minds Academy (Education, San Francisco)
- MegaMall Shopping Center (Retail, Miami)
- FinanceInvest Bank (Banking, New York)
- BuildPro Construction (Construction, Seattle)

Total: 10 companies, 20 employees, 20 emails

## Technologies

- **Python 3.11**: Main language
- **FastAPI 0.115**: Web framework
- **Neo4j 5.21**: Graph database
- **MinIO**: S3-compatible object storage
- **Redis 7**: In-memory cache
- **Docker Compose**: Container orchestration
- **Pydantic 2.9**: Data validation

## Documentation

- `DEMO.md` - Complete demo guide and API reference
- `SUMMARY.md` - Final status and overview
- `PRESENTATION.md` - Management presentation with ROI
- `test_all_endpoints.sh` - Automated endpoint testing

## Troubleshooting

### Neo4j not starting
```bash
docker compose logs neo4j
# Wait 30 seconds and retry
```

### Connection refused
```bash
# Neo4j not ready yet
sleep 20
docker compose exec query_api python -m etl.apollo_to_graph.etl_apollo --prefix <PREFIX>
```

### Port already in use
```bash
# Stop existing services
docker compose down
# Check ports
lsof -i :7474
lsof -i :9000
```

## Roadmap

### Week 2-3:
- AI classification for customer scoring
- CSV export for CRM systems

### Month 1-2:
- Apollo.io integration for real data
- Web interface (React + Neo4j visualization)
- Automated email campaigns

### Month 3+:
- CRM integration (Salesforce, HubSpot)
- LinkedIn data scraping
- Predictive analytics with ML

## License

MIT

## Status

✅ **MVP Ready for Demonstration**

Developed by: 1 Full-stack developer  
Development time: 1 week  
Next step: Management presentation
