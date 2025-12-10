# Data Ingestion Capabilities - iBood Sales Intelligence Platform

## Executive Summary

The iBood platform ("Atlas") implements a modern data ingestion and ETL pipeline for B2B Sales Intelligence. The architecture separates data ingestion, transformation (ETL), and retrieval into distinct layers, designed for extensibility and new data source integrations.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL DATA SOURCES                          │
│  Currently: Google Places, Hunter.io                            │
│  Planned: Apollo.io, Apify, LinkedIn, CRM systems               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              INGESTION LAYER                                      │
│  • CompanyIngestor (abstract) - Search for companies             │
│  • CompanyPeopleFinder (abstract) - Enrich with contacts         │
│  • IngestionPipeline - Orchestrates search + enrichment          │
│  • Metadata sidecars with ULID batch tracking                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              DATA LAKE (MinIO S3-Compatible)                      │
│  Structure:                                                       │
│  └─ {source}/raw/{timestamp}/                                    │
│      ├─ companies.json        (raw data)                         │
│      └─ _meta.json            (provenance metadata)              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐
│  GRAPH ETL (Neo4j)  │  │  VECTOR ETL (Qdrant)│
│  • Company nodes    │  │  • Semantic search  │
│  • Person nodes     │  │  • OpenAI embeddings│
│  • Email nodes      │  │  • FastEmbed fallbck│
│  • Relationships    │  │  • Similarity match │
└─────────────────────┘  └─────────────────────┘
           │                       │
           └───────────┬───────────┘
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              QUERY & RETRIEVAL LAYER                              │
│  • FastAPI REST endpoints                                        │
│  • Redis caching                                                 │
│  • Graph traversal + semantic search                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Currently Implemented Data Sources

### 2.1 Google Places API

**Location:** `src/atlas/ingestors/google_places/`

**Capabilities:**
- Text-based company/place search
- Multi-field extraction: name, domain, location, rating, industry, website
- Advanced industry classification from Google Places types
- City extraction from international addresses

**Authentication:** API Key (`GOOGLE_PLACES_API_KEY`)

**Output Schema:**
```json
{
  "id": "places:ChIJ...",
  "name": "TechCorp Solutions",
  "domain": "techcorp.com",
  "industry": "IT Services",
  "location": "Austin, TX",
  "rating": 4.5,
  "website": "https://techcorp.com",
  "employee_count": null
}
```

**Industry Normalization:**
- Maps 100+ Google Places types to 9 industry categories
- Fallback keyword extraction from company names
- Examples: software_company → "IT Services", restaurant → "Restaurant"

### 2.2 Hunter.io

**Location:** `src/atlas/ingestors/hunter/`

**Capabilities:**
- Find people at a company by domain
- Extract email addresses with confidence scores
- Extract professional details: title, department, seniority, LinkedIn

**Authentication:** API Key (`HUNTER_API_KEY`)

**Output Schema:**
```json
{
  "id": "hunter:p123",
  "full_name": "John Smith",
  "title": "CEO",
  "department": "Management",
  "seniority": "executive",
  "emails": ["john@example.com"],
  "linkedin": "https://linkedin.com/in/johnsmith",
  "confidence": 95
}
```

### 2.3 Apollo (Mock/Template)

**Location:** `src/atlas/ingestors/apollo/`

**Status:** Mock implementation for testing

**Purpose:** Template for Apollo.io integration - generates sample data

---

## 3. Ingestor Interface (For New Integrations)

### 3.1 CompanyIngestor (Abstract Base Class)

```python
from abc import ABC, abstractmethod

class CompanyIngestor(ABC):
    """Base class for all company data sources"""

    @abstractmethod
    def search(self, query: str, limit: int = 20) -> list[dict]:
        """
        Search for companies matching query.

        Args:
            query: Search string (e.g., "tech companies in Austin")
            limit: Maximum results to return

        Returns:
            List of company dicts with standardized fields:
            - id: str (required) - Unique identifier
            - name: str (required) - Company name
            - domain: str (required) - Primary website domain
            - industry: str (optional) - Industry category
            - location: str (optional) - City/region
            - employee_count: int (optional) - Employee count
            - website: str (optional) - Full URL
            - [additional source-specific fields]
        """
        pass
```

### 3.2 CompanyPeopleFinder (Abstract Base Class)

```python
class CompanyPeopleFinder(ABC):
    """Base class for contact/people enrichment sources"""

    @abstractmethod
    def find_by_company_domain(self, domain: str) -> list[dict]:
        """
        Find people at a company by domain.

        Args:
            domain: Company domain (e.g., "example.com")

        Returns:
            List of person dicts with standardized fields:
            - id: str (required) - Unique identifier
            - full_name: str (required) - Full name
            - title: str (optional) - Job title
            - department: str (optional) - Department
            - seniority: str (optional) - Seniority level
            - emails: list[str] (optional) - Email addresses
            - linkedin: str (optional) - LinkedIn URL
            - confidence: float (optional) - Data quality score
        """
        pass
```

---

## 4. Pipeline Architecture

### 4.1 IngestionPipeline

**Location:** `src/atlas/pipelines/ingest_pipeline.py`

**Workflow:**
```
1. Initialize with ingestor + optional people_finder
2. Execute search query via ingestor
3. [Optional] Enrich each company with people
4. Generate ULID batch ID for tracking
5. Create metadata sidecar
6. Save to MinIO data lake
7. Return prefix for downstream ETL
```

**Usage Example:**
```python
from atlas.pipelines.ingest_pipeline import IngestionPipeline
from atlas.ingestors.google_places.client import GooglePlacesIngestor
from atlas.ingestors.hunter.client import HunterPeopleFinder

# Initialize
ingestor = GooglePlacesIngestor(api_key=GOOGLE_KEY)
enricher = HunterPeopleFinder(api_key=HUNTER_KEY)
pipeline = IngestionPipeline(ingestor, enricher)

# Run ingestion
prefix = pipeline.run(
    query="HR companies in Austin",
    limit=20
)
# Returns: "enriched/raw/2025-10-28T16:56:34Z"
# Data saved to MinIO at this prefix
```

### 4.2 ETLPipeline

**Location:** `src/atlas/pipelines/etl_pipeline.py`

**Workflow:**
```
1. Read raw JSON from MinIO prefix
2. Load to Neo4j (graph ETL)
   - MERGE Company nodes
   - MERGE Person nodes
   - CREATE relationships
3. [Optional] Load to Qdrant (vector ETL)
   - Generate embeddings
   - Upsert to vector store
4. Return batch_id for tracking
```

---

## 5. Data Models

### 5.1 Neo4j Graph Schema

```
┌─────────────┐         ┌─────────────┐
│   Company   │◄────────│   Person    │
│             │ WORKS_AT│             │
│  id         │         │  id         │
│  name       │         │  full_name  │
│  domain     │         │  title      │
│  industry   │         │  department │
│  location   │         │  seniority  │
│  employee_  │         └──────┬──────┘
│    count    │                │
└─────────────┘                │ HAS_EMAIL
                               ▼
                        ┌─────────────┐
                        │    Email    │
                        │  address    │
                        └─────────────┘
```

**Company Node Properties:**
| Property | Type | Description |
|----------|------|-------------|
| id | String | Primary key (e.g., "places:ChIJ...") |
| name | String | Company name |
| domain | String | Primary domain |
| industry | String | Industry category |
| location | String | City/region |
| employee_count | Integer | Employee count |
| rating | Float | Rating (from Google) |
| website | String | Full URL |
| created_at | Timestamp | First ingestion |
| updated_at | Timestamp | Last update |

**Person Node Properties:**
| Property | Type | Description |
|----------|------|-------------|
| id | String | Primary key |
| full_name | String | Full name |
| title | String | Job title |
| department | String | Department |
| seniority | String | Seniority level |
| linkedin | String | LinkedIn URL |
| confidence | Float | Data quality score |
| created_at | Timestamp | First ingestion |

### 5.2 Qdrant Vector Schema

**Collection:** `atlas_entities`

**Point Structure:**
```json
{
  "id": "UUID v5 (deterministic from external ID)",
  "vector": [0.123, 0.456, ...],
  "payload": {
    "type": "company" | "person",
    "id": "places:ChIJ...",
    "ext_id": "company:places:ChIJ...",
    "name": "TechCorp",
    "domain": "techcorp.com",
    "industry": "IT Services",
    "location": "Austin"
  }
}
```

**Embedding Options:**
- Primary: OpenAI `text-embedding-3-small` (1536 dimensions)
- Fallback: FastEmbed `BAAI/bge-small-en-v1.5` (384 dimensions)

### 5.3 Metadata Sidecar

**File:** `_meta.json` (stored alongside data files)

```json
{
  "source": "ingestion_pipeline",
  "fetched_at": "2025-10-28T16:56:34.804420Z",
  "ingest_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "batch_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "schema_version": "v0",
  "count": 10
}
```

---

## 6. Environment Configuration

```bash
# Data Source API Keys
GOOGLE_PLACES_API_KEY=AIzaSy...
HUNTER_API_KEY=f215df...
APOLLO_API_KEY=           # For future Apollo integration
APIFY_API_TOKEN=          # For future Apify integration

# MinIO (Data Lake)
MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=datalake
MINIO_SECURE=false

# Neo4j (Graph Database)
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4jpass

# Qdrant (Vector Database)
QDRANT_URL=http://qdrant:6333

# Redis (Cache)
REDIS_URL=redis://redis:6379/0

# OpenAI (Embeddings - Optional)
OPENAI_API_KEY=sk-...
OPENAI_EMBED_MODEL=text-embedding-3-small

# FastEmbed (Fallback Embeddings)
EMBED_MODEL=BAAI/bge-small-en-v1.5
```

---

## 7. CLI Commands

### Ingestion Commands

```bash
# Google Places search
python -m atlas.ingestors.google_places.places_search \
  --query "tech companies in Austin" \
  --limit 20

# Hunter enrichment
python -m atlas.ingestors.hunter.hunter_fetch

# Apollo mock data
python -m atlas.ingestors.apollo.apollo_fetch
```

### ETL Commands

```bash
# Run ETL on specific prefix
python -m atlas.etl.apollo_to_graph.etl_apollo \
  --prefix apollo/raw/2025-10-28T14:22:11Z

# Run vector ETL
python -m atlas.etl.apollo_to_vector.etl_apollo_qdrant \
  --prefix apollo/raw/2025-10-28T14:22:11Z

# Batch ETL (all prefixes)
python -m atlas.tools.etl_run_all --since 2025-10-26
python -m atlas.tools.etl_run_all --max 5
python -m atlas.tools.etl_run_all --graph-only
```

### Data Lake Commands

```bash
# List data lake contents
python -m atlas.tools.lake_ls
```

---

## 8. Integration Pattern for New Data Sources

### Step 1: Create Ingestor Module

```
src/atlas/ingestors/{source_name}/
├── __init__.py
├── client.py           # Ingestor class
└── {source}_fetch.py   # CLI entry point
```

### Step 2: Implement Ingestor Class

```python
# src/atlas/ingestors/apollo/client.py
from atlas.ingestors.common.base import CompanyIngestor

class ApolloIngestor(CompanyIngestor):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.apollo.io/v1"

    def search(self, query: str, limit: int = 20) -> list[dict]:
        # Call Apollo API
        response = requests.post(
            f"{self.base_url}/mixed_companies/search",
            headers={"X-Api-Key": self.api_key},
            json={"q_organization_name": query, "per_page": limit}
        )

        # Transform to standard format
        companies = []
        for org in response.json()["organizations"]:
            companies.append({
                "id": f"apollo:{org['id']}",
                "name": org["name"],
                "domain": org["primary_domain"],
                "industry": org.get("industry"),
                "location": org.get("city"),
                "employee_count": org.get("estimated_num_employees"),
                "website": org.get("website_url"),
            })
        return companies
```

### Step 3: Create People Finder (Optional)

```python
# src/atlas/ingestors/apollo/people_finder.py
from atlas.ingestors.common.base import CompanyPeopleFinder

class ApolloPeopleFinder(CompanyPeopleFinder):
    def find_by_company_domain(self, domain: str) -> list[dict]:
        # Call Apollo People API
        response = requests.post(
            f"{self.base_url}/mixed_people/search",
            headers={"X-Api-Key": self.api_key},
            json={"q_organization_domains": domain}
        )

        # Transform to standard format
        people = []
        for person in response.json()["people"]:
            people.append({
                "id": f"apollo:{person['id']}",
                "full_name": person["name"],
                "title": person.get("title"),
                "department": person.get("departments", [None])[0],
                "seniority": person.get("seniority"),
                "emails": [person["email"]] if person.get("email") else [],
                "linkedin": person.get("linkedin_url"),
            })
        return people
```

### Step 4: Create CLI Entry Point

```python
# src/atlas/ingestors/apollo/apollo_fetch.py
from atlas.pipelines.ingest_pipeline import IngestionPipeline
from atlas.ingestors.apollo.client import ApolloIngestor
from atlas.ingestors.apollo.people_finder import ApolloPeopleFinder
import os

def main():
    api_key = os.environ["APOLLO_API_KEY"]

    ingestor = ApolloIngestor(api_key)
    people_finder = ApolloPeopleFinder(api_key)
    pipeline = IngestionPipeline(ingestor, people_finder)

    prefix = pipeline.run(
        query="HR companies in Austin",
        limit=50
    )
    print(f"Data saved to: {prefix}")

if __name__ == "__main__":
    main()
```

### Step 5: Run ETL

The existing ETL pipeline can process the new data:

```bash
# Graph ETL (creates Neo4j nodes/relationships)
python -m atlas.etl.apollo_to_graph.etl_apollo --prefix apollo/raw/2025-...

# Vector ETL (creates Qdrant embeddings)
python -m atlas.etl.apollo_to_vector.etl_apollo_qdrant --prefix apollo/raw/2025-...
```

---

## 9. Recommended New Integrations

### Priority 1: Apollo.io
- **Type:** Company + People data
- **API:** REST API with API key auth
- **Data:** Company firmographics, contacts, emails, intent signals
- **Effort:** 1-2 days (template exists)

### Priority 2: Apify
- **Type:** Web scraping platform
- **API:** Actor-based API with API token
- **Use Cases:** LinkedIn scraping, website crawling, custom scrapers
- **Effort:** 2-3 days

### Priority 3: LinkedIn (via Apify or Phantombuster)
- **Type:** Professional network data
- **API:** Through scraping tools (no official API for sales)
- **Data:** Company pages, employee lists, job postings
- **Effort:** 3-5 days

### Priority 4: CRM Integration (HubSpot/Salesforce)
- **Type:** Existing customer data
- **API:** OAuth 2.0 based
- **Data:** Deals, contacts, activities, notes
- **Effort:** 3-5 days per CRM

### Priority 5: Intent Data Providers
- **Examples:** Bombora, G2, TrustRadius
- **Type:** Buyer intent signals
- **Data:** Topic interest, comparison shopping, review activity
- **Effort:** 2-3 days per provider

---

## 10. Technical Considerations for New Integrations

### Rate Limiting
- Implement exponential backoff
- Use batch endpoints where available
- Consider async/parallel processing for high-volume sources

### Data Quality
- Add confidence scores where available
- Validate email formats
- Normalize industry/department values to match existing taxonomy

### Deduplication
- Use domain as primary key for companies
- Use email as secondary identifier for people
- MERGE operations in Neo4j handle duplicates

### Error Handling
- Graceful fallback for missing data
- Log errors with batch_id for debugging
- Retry logic for transient failures

### Compliance
- Respect data source terms of service
- Handle GDPR/CCPA data deletion requests
- Track data provenance via metadata sidecars

---

## 11. Current Limitations

1. **Single-threaded ingestion** - Companies processed sequentially
2. **API rate limits** - Hunter (10/domain), Google Places (quota-based)
3. **No real-time sync** - Batch-based, not event-driven
4. **Manual scheduling** - No automated recurring jobs

## 12. Future Enhancements (Roadmap)

1. **Async ingestors** - Parallel API calls for faster ingestion
2. **Kafka/RabbitMQ** - Event-driven ETL triggers
3. **Airflow/Prefect** - Scheduled workflow orchestration
4. **Webhooks** - Real-time updates from CRMs
5. **Data quality scoring** - Automated freshness/completeness metrics
6. **ML pipelines** - Predictive lead scoring, ICP matching

---

## Contact & Support

For questions about extending the data ingestion layer, refer to:
- **Codebase:** `src/atlas/ingestors/` for ingestor implementations
- **Pipeline:** `src/atlas/pipelines/` for orchestration logic
- **ETL:** `src/atlas/etl/` for transformation logic
- **API:** `src/atlas/services/query_api/` for retrieval endpoints
