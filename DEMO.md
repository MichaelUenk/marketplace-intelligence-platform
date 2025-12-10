# 🚀 Atlas Graph MVP - Demo Guide

## 📊 What is this?

**Atlas Graph MVP** - B2B customer discovery and analysis system built on Neo4j graph database.

### Business Value (example: water cooler sales company):
- 🔍 **Finds potential customers** by industry (restaurants, fitness, offices)
- 👥 **Identifies decision makers** (directors, procurement managers)
- 📈 **Analyzes markets** by industry and location
- 🎯 **Prioritizes customers** by company size and industry

---

## ⚡ Quick Start

### 1. Launch System
```bash
docker compose up -d --build
```
**Wait time**: ~30 seconds (Neo4j takes time to start)

### 2. Load Test Data (10 companies)
```bash
docker compose exec query_api python -m ingestors.apollo.apollo_fetch
```
**Result**: Data loaded to MinIO  
**Format**: `s3://datalake/apollo/raw/2025-10-27T08:41:16.501922Z`

### 3. ETL Processing (replace PREFIX!)
```bash
# ⚠️ Use PREFIX from previous command!
docker compose exec query_api python -m etl.apollo_to_graph.etl_apollo --prefix apollo/raw/2025-10-27T08:41:16.501922Z
```
**Result**: Data loaded to Neo4j (graph built)

---

## 🧪 API Testing

### Basic Endpoints

#### Health Check
```bash
curl 'http://localhost:8000/healthz'
```

#### Find Company by Domain
```bash
curl 'http://localhost:8000/companies?domain=techcorp.com' | python3 -m json.tool
```
**Returns**: Company + employees + emails

#### Search People by Name
```bash
curl 'http://localhost:8000/people?q=Alex' | python3 -m json.tool
```

---

## 🎯 B2B Endpoints (new!)

### 1. Industry Analytics
```bash
curl 'http://localhost:8000/analytics/industries' | python3 -m json.tool
```
**Benefit**: See which industries have the most companies

**Example Response**:
```json
[
  {
    "industry": "Restaurant",
    "company_count": 1,
    "companies": [
      {
        "name": "Golden Dragon Restaurant",
        "domain": "golden-dragon.com",
        "location": "New York"
      }
    ]
  }
]
```

### 2. Find Companies by Industry
```bash
curl 'http://localhost:8000/companies/by-industry?industry=Fitness' | python3 -m json.tool
```
**Benefit**: Find all fitness clubs for water cooler sales

**Example Response**:
```json
[
  {
    "company": {
      "id": "apollo:fitness",
      "name": "PowerFit Gym",
      "industry": "Fitness",
      "employee_count": "10-50",
      "location": "Los Angeles"
    },
    "people_count": 2
  }
]
```

### 3. Find Companies by Location
```bash
curl 'http://localhost:8000/companies/by-location?location=London' | python3 -m json.tool
```
**Benefit**: All companies in a specific city

### 4. Find People by Department
```bash
curl 'http://localhost:8000/people/by-department?department=Management' | python3 -m json.tool
```
**Benefit**: Find all executives (decision makers)

**Example Response**:
```json
[
  {
    "person": {
      "id": "apollo:u5",
      "full_name": "Michael Chen",
      "title": "General Manager",
      "department": "Management"
    },
    "companies": [
      {
        "name": "Golden Dragon Restaurant",
        "industry": "Restaurant"
      }
    ],
    "emails": ["m.chen@golden-dragon.com"]
  }
]
```

### 5. Graph Connections (node neighbors)
```bash
curl 'http://localhost:8000/neighbors?id=apollo:u1&depth=2' | python3 -m json.tool
```
**Benefit**: See who is connected to whom (colleagues, partners)

---

## 📂 Test Data (10 companies)

| Company | Industry | Location | Employees | Water Cooler Potential |
|---------|----------|----------|-----------|------------------------|
| TechCorp Solutions | IT Services | Austin | 50-200 | 🟢 High (office) |
| Office Plus | Facilities Management | London | 200-500 | 🟢 Very High |
| Golden Dragon Restaurant | Restaurant | New York | 20-50 | 🟢 High |
| PowerFit Gym | Fitness | Los Angeles | 10-50 | 🟢 High |
| MetalTech Industries | Manufacturing | Chicago | 500-1000 | 🟡 Medium |
| HealthPlus Medical Center | Healthcare | Boston | 50-200 | 🟢 High |
| Bright Minds Academy | Education | San Francisco | 20-50 | 🟡 Medium |
| MegaMall Shopping Center | Retail | Miami | 200-500 | 🟡 Medium |
| FinanceInvest Bank | Banking | New York | 1000+ | 🔴 Low |
| BuildPro Construction | Construction | Seattle | 100-500 | 🟡 Medium |

**Total**: 10 companies, 20 employees, 20 emails

---

## 🎬 Demo Scenario for Management

### Scenario 1: Find Customers for Water Coolers

1. **Market Analysis**:
   ```bash
   curl 'http://localhost:8000/analytics/industries' | python3 -m json.tool
   ```
   → See restaurants, fitness clubs, offices

2. **Find All Fitness Clubs**:
   ```bash
   curl 'http://localhost:8000/companies/by-industry?industry=Fitness' | python3 -m json.tool
   ```
   → Find "PowerFit Gym" (Los Angeles) with 2 contacts

3. **Find Decision Makers**:
   ```bash
   curl 'http://localhost:8000/people/by-department?department=Management' | python3 -m json.tool
   ```
   → Get James Anderson (Club Director) + email j.anderson@powerfit-gym.com

**Result**: Found target customer with contact info in 30 seconds!

---

## 🛠️ Visualization UI

### Neo4j Browser
```
http://localhost:7474
User: neo4j
Password: neo4jpass
```

**Useful Queries**:
```cypher
// All companies and employees
MATCH (c:Company)<-[:WORKS_AT]-(p:Person)
RETURN c, p

// Companies by industry
MATCH (c:Company)
WHERE c.industry = 'Fitness'
RETURN c

// Graph connections around a person
MATCH path = (p:Person {id: 'apollo:u1'})-[*1..2]-(n)
RETURN path
```

### MinIO Console
```
http://localhost:9001
User: minioadmin
Password: minioadmin
```
View raw data in `datalake` bucket

---

## 📈 What's Next? (Roadmap)

### Week 2-3:
- ✅ **Realistic Data** (10 companies) ← DONE
- 🔄 **AI Classification**: "suitable for coolers" (probability 0-100%)
- 🔄 **CSV Export** for CRM systems

### Month 1-2:
- 🔄 **Apollo.io Integration** (real data)
- 🔄 **Web Interface** (React + tables + graphs)
- 🔄 **Email Campaigns** (automated outreach)

### Month 3+:
- 🔄 **CRM Integration** (Salesforce, HubSpot)
- 🔄 **LinkedIn Scraping** (additional data)
- 🔄 **Predictive Analytics** (who is more likely to buy)

---

## 🎯 Business Value

### Before Atlas:
- ⏱️ **1-2 weeks** for manual customer search on Google
- 📝 **10-20 companies** in Excel spreadsheet
- ❌ No connections between people
- ❌ No market analysis

### With Atlas:
- ⚡ **30 seconds** for database search
- 📊 **1000+ companies** in graph (future)
- ✅ See who makes decisions
- ✅ Analytics by industry and location
- ✅ Ready lists for outreach

**ROI**: Save 80+ hours of manager work per month

---

## 🔧 Technical Architecture

```
┌─────────────┐
│  Mock Data  │ (10 companies, 20 people)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   MinIO     │ (S3-compatible Data Lake)
│  (bucket:   │
│  datalake)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ETL Layer  │ (Python + Pydantic schemas)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Neo4j     │ (Graph DB with APOC)
│  (Company,  │
│   Person,   │
│   Email)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FastAPI    │ (7 endpoints + Redis cache)
└─────────────┘
```

**Technologies**:
- **Backend**: Python 3.11, FastAPI, Pydantic
- **Graph DB**: Neo4j 5.21 + APOC
- **Data Lake**: MinIO (S3-compatible)
- **Cache**: Redis
- **Containerization**: Docker Compose

---

## 🐛 Troubleshooting

### Neo4j Not Starting
```bash
docker compose logs neo4j
# Wait 30 seconds and retry ETL
```

### "Connection refused" Error
```bash
# Neo4j not ready yet, wait:
sleep 20
docker compose exec query_api python -m etl.apollo_to_graph.etl_apollo --prefix <PREFIX>
```

### Clear Data
```bash
docker compose exec query_api python -c "
from neo4j import GraphDatabase
driver = GraphDatabase.driver('bolt://neo4j:7687', auth=('neo4j', 'neo4jpass'))
with driver.session() as s:
    s.run('MATCH (n) DETACH DELETE n')
"
```

---

## ✅ Acceptance Criteria (completed)

- ✅ `docker-compose up -d` launches all services
- ✅ Ingest writes to MinIO with metadata
- ✅ ETL creates Company/Person/Email nodes + relationships
- ✅ GET `/companies?domain=techcorp.com` returns data
- ✅ New B2B endpoints work
- ✅ Redis caching works
- ✅ No traces of Postgres/Supabase
- ✅ Healthz = `{"ok": true}`

---

## 📞 Contact

**Developer**: 1 Full-stack developer  
**Development Time**: 1 week  
**Status**: MVP ready for demonstration ✅
