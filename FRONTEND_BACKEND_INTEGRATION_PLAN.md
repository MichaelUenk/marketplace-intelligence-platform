# Frontend-Backend Integration Plan

## Current State Analysis

### Backend (API) - Available Endpoints
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/healthz` | GET | ✅ Working | Health check |
| `/companies` | GET | ✅ Working | Get company by domain |
| `/companies/by-industry` | GET | ✅ Working | Filter companies by industry |
| `/companies/by-location` | GET | ✅ Working | Filter companies by location |
| `/people` | GET | ✅ Working | Search people by name |
| `/people/by-department` | GET | ✅ Working | Filter people by department |
| `/neighbors` | GET | ✅ Working | Get graph neighbors |
| `/analytics/industries` | GET | ✅ Working | Industry statistics |
| `/search` | GET | ✅ Working | Semantic vector search |
| `/search/companies` | GET | ✅ Working | Semantic search for companies |
| `/search/people` | GET | ✅ Working | Semantic search for people |
| `/search/hybrid` | GET | ✅ Working | Hybrid vector + graph search |

### Neo4j Data Model
- **Company**: id, name, domain, industry, location, employee_count, created_at
- **Person**: id, full_name, title, department, created_at
- **Email**: (linked to Person)
- **Relationships**: Person -[WORKS_AT]-> Company, Person -[HAS_EMAIL]-> Email

### Frontend Components - Status Overview

| Component | Page | Status | Issue |
|-----------|------|--------|-------|
| **HealthStatus** | Settings | ✅ Working | Uses `/healthz` |
| **CompanyList** | Deals | ✅ Working | Uses `/analytics/industries`, `/companies/by-industry`, `/companies/by-location` |
| **PeopleList** | Contacts | ⚠️ Partial | `/analytics/departments` endpoint missing |
| **Search** | Settings | ✅ Working | Uses `/search` |
| **BowtieDashboard** | Dashboard/Pipeline | ⚠️ Mock Data | `/deals`, `/deals/pipeline-stats` endpoints missing |
| **LeadsDashboard** | Leads | ⚠️ Mock Data | `/leads` endpoint missing |
| **SignalsDashboard** | Signals/Intent | ⚠️ Mock Data | `/signals/*` endpoints missing |
| **OutreachSequences** | Sequences | ⚠️ Mock Data | `/sequences` endpoint missing |
| **DealDetail** | Deal Detail | ⚠️ Mock Data | `/deals/:id` endpoint missing |

---

## Missing Backend Endpoints

### Priority 1: Core Sales Features (High Impact)

#### 1. Deals/Pipeline Management
```
GET  /deals                          - List all deals
GET  /deals/:id                      - Get deal details with MEDDPICC
GET  /deals/pipeline-stats           - Pipeline stage statistics
GET  /deals/by-company/:companyId    - Deals for a company
GET  /deals/by-stage/:stage          - Deals by pipeline stage
POST /deals                          - Create new deal
PATCH /deals/:id                     - Update deal
PATCH /deals/:id/stage               - Update deal stage
```

**Required Neo4j Node: Deal**
```cypher
(:Deal {
  id: string,
  company_id: string,
  name: string,
  amount: float,
  stage: string,  // identified, qualified, engaged, pipeline, proposal, negotiation, committed, closed_won, closed_lost
  probability: int,
  expected_close_date: date,
  owner_id: string,
  champion_id: string,

  // MEDDPICC Scores (0-10 each)
  meddpicc_metrics: int,
  meddpicc_economic_buyer: int,
  meddpicc_decision_criteria: int,
  meddpicc_decision_process: int,
  meddpicc_paper_process: int,
  meddpicc_identify_pain: int,
  meddpicc_champion: int,
  meddpicc_competition: int,
  meddpicc_total_score: int,

  deal_health: string,  // strong, moderate, at_risk
  days_in_pipeline: int,
  created_at: datetime,
  updated_at: datetime
})
```

#### 2. Leads Management
```
GET   /leads                         - List leads (new companies needing attention)
GET   /leads/:companyId              - Get lead details
PATCH /leads/:companyId/status       - Update lead status
```

**Approach**: Leads can be derived from Company nodes with:
- No associated Deal
- `lead_status` property (new, contacted, qualified, converted, lost)
- `created_at` within response window (4 hours for urgency)

**Required Company property additions:**
```cypher
// Add to Company node
lead_status: string,      // new, contacted, qualified, converted, lost
intent_score: int,        // 0-100
first_contact_at: datetime,
last_contact_at: datetime
```

### Priority 2: Intelligence Features (Medium Impact)

#### 3. Signals/Intent Data
```
GET  /signals/hot-accounts           - Companies with high intent scores
GET  /signals/company/:companyId     - Signals for a company
GET  /signals/stats                  - Signal statistics over time
```

**Required Neo4j Node: Signal**
```cypher
(:Signal {
  id: string,
  company_id: string,
  type: string,           // news, hiring, funding, expansion, technology, partnership
  category: string,       // direct_engagement, sustainability, growth, workplace, wellbeing
  strength: string,       // high, medium, low
  description: string,
  source_url: string,
  detected_at: datetime
})

// Relationship
(:Company)-[:HAS_SIGNAL]->(:Signal)
```

**Hot Accounts Query**: Companies with intent_score >= threshold, ordered by score

#### 4. Analytics/Departments
```
GET  /analytics/departments          - Department statistics
```

**Implementation**: Simple aggregation query on Person.department

### Priority 3: Engagement Features (Lower Impact)

#### 5. Outreach Sequences
```
GET   /sequences                     - List all sequences
GET   /sequences/:id                 - Sequence details with enrollments
POST  /sequences                     - Create sequence
POST  /sequences/:id/enroll          - Enroll contact in sequence
```

**Required Neo4j Nodes:**
```cypher
(:OutreachSequence {
  id: string,
  name: string,
  description: string,
  status: string,         // active, paused, draft, archived
  steps: json,            // Array of step definitions
  created_by: string,
  created_at: datetime
})

(:SequenceEnrollment {
  id: string,
  sequence_id: string,
  employee_id: string,
  company_id: string,
  status: string,         // active, completed, replied, bounced, unsubscribed
  current_step: int,
  enrolled_at: datetime
})
```

#### 6. Attribution
```
GET  /attribution/deal/:dealId       - Touchpoints for a deal
GET  /attribution/campaigns          - Campaign performance
GET  /attribution/journey/:companyId - Customer journey
```

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 days)
**Goal**: Get existing data working better

1. **Add `/analytics/departments` endpoint**
   - Simple aggregation on Person.department
   - Fixes PeopleList component

2. **Enhance Company node with lead fields**
   - Add `lead_status`, `intent_score` properties
   - Create `/leads` endpoint as filtered company query

3. **Add hot accounts query**
   - Filter companies by `intent_score >= 70`
   - Fixes SignalsDashboard hot accounts section

### Phase 2: Core Sales Pipeline (3-5 days)
**Goal**: Enable deal tracking

1. **Create Deal node in Neo4j**
   - Add schema with MEDDPICC fields
   - Link to Company and Person (champion, owner)

2. **Implement Deal endpoints**
   - CRUD operations
   - Pipeline stats aggregation
   - Stage-based filtering

3. **Seed sample deal data**
   - Create 10-20 demo deals across stages

### Phase 3: Intelligence Layer (3-5 days)
**Goal**: Enable signals and intent tracking

1. **Create Signal node in Neo4j**
   - Link to Company
   - Categories and strength levels

2. **Implement Signal endpoints**
   - Hot accounts (high intent companies)
   - Signal stats over time
   - Company-specific signals

3. **Create signal data pipeline**
   - Manual entry or simulated signals

### Phase 4: Engagement Features (Optional, 2-3 days)
**Goal**: Enable sequence tracking

1. **Create OutreachSequence and Enrollment nodes**
2. **Implement sequence endpoints**
3. **Link to Person and Company**

---

## Recommended Approach: Start with Phase 1

The quickest path to a working demo:

### Step 1: Add `/analytics/departments` (30 min)
```python
# In main.py
@app.get("/analytics/departments")
def department_analytics(s: Neo4jDep):
    query = """
    MATCH (p:Person)
    WHERE p.department IS NOT NULL
    RETURN p.department as department, count(*) as person_count
    ORDER BY person_count DESC
    """
    return s.run(query).data()
```

### Step 2: Add lead properties to Company (1 hour)
```cypher
// Update existing companies with lead data
MATCH (c:Company)
SET c.lead_status = 'new',
    c.intent_score = toInteger(rand() * 100),
    c.first_contact_at = datetime()
```

### Step 3: Add `/leads` endpoint (30 min)
```python
@app.get("/leads")
def get_leads(s: Neo4jDep, limit: int = 50):
    query = """
    MATCH (c:Company)
    WHERE c.lead_status IS NOT NULL
    OPTIONAL MATCH (c)<-[:WORKS_AT]-(p:Person)
    WITH c, collect(p)[0] as contact
    RETURN {
      company: c,
      contact: contact
    } as lead
    ORDER BY c.intent_score DESC
    LIMIT $limit
    """
    return s.run(query, limit=limit).data()
```

### Step 4: Add `/signals/hot-accounts` (30 min)
```python
@app.get("/signals/hot-accounts")
def hot_accounts(s: Neo4jDep, min_score: int = 70, limit: int = 20):
    query = """
    MATCH (c:Company)
    WHERE c.intent_score >= $min_score
    OPTIONAL MATCH (c)<-[:WORKS_AT]-(p:Person)
    WITH c, collect(p)[0] as champion
    RETURN {
      company: c,
      champion_name: champion.full_name,
      champion_title: champion.title,
      signal_count: toInteger(rand() * 10)
    } as account
    ORDER BY c.intent_score DESC
    LIMIT $limit
    """
    return s.run(query, min_score=min_score, limit=limit).data()
```

---

## Summary

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Analytics/Departments | 30 min | Fixes Contacts page |
| 1 | Leads endpoint | 1 hour | Enables Leads page |
| 1 | Hot accounts | 30 min | Enables Signals hot section |
| 2 | Deal CRUD | 3-5 days | Enables full pipeline |
| 2 | Pipeline stats | 1 day | Enables Bowtie visualization |
| 3 | Signals CRUD | 2-3 days | Full signals intelligence |
| 4 | Sequences | 2-3 days | Outreach tracking |

**Recommended Next Step**: Implement Phase 1 (Quick Wins) to get most frontend components working with real data.
