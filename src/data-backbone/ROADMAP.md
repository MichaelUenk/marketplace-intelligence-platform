# Project Roadmap & Task Checklist

Use this checklist to track the progress of the data infrastructure project. Mark items as complete by changing `[ ]` to `[x]`.

---

### Phase 1: The Foundation 🏗️

- [ ] **P1-T1:** Onboarding, setting up repos.
- [ ] **P1-T2:** Setup Data Lake: Deploy MinIO instance via Docker and create initial bucket/directory structure.
- [ ] **P1-T3:** Setup Knowledge Graph: Deploy Neo4j instance via Docker and confirm UI access.
- [ ] **P1-T4:** Project Scaffolding: Set up the Git monorepo with directories for `/ingestors`, `/etl`, `/services`.

1 week

---

### Phase 2: The First End-to-End (Manual) Pipeline 🔗

- [ ] **P2-T1:** Build Apollo Ingestor: Create a script to fetch data from Apollo and save it as timestamped JSON to MinIO.
- [ ] **P2-T2:** Build Graph ETL for Apollo: Create a script to read a raw file from MinIO, transform it, and load it into Neo4j as nodes and
relationships.
- [ ] **P2-T3:** Show and document how to inspect the graph using Neo4j own tools.

1 wekk

---


### Phase 3: Building the First "Product" & Automation 🚀

- [ ] **P3-T1:** Create a Query Service API: Set up FastAPI server and build enpoints to expose standard Cypher queries as endpoints.
- [ ] **P3-T2:** Integrate with n8n: Update an existing n8n workflow to call the new query API.
- [ ] **P3-T3:** Automate ETL Trigger: Use MinIO webhooks or a similar mechanism to automatically run the ETL when a new file arrives.

1 week

---

### Phase 4: Making System Deployment-Ready

- [ ] **P4-T1:** Make sure system can be started "one click" - everything is containerized, example config files are provided.
- [ ] **P4-T2:** Initial observavility: text logging.

1 week

---

The below is tenative, will be updated as we progress with 1-2-3.
Primarily the roadmap would be updated to align with selected concrete use-case.

### Phase N: Expansion and "Agentification" 🤖

- [ ] **PN-T1:** Add Firecrawl Pipeline: Build a new ingestor and ETL process for the Firecrawl data source.
- [ ] **PN-T2:** Implement Caching Layer: Add a Redis cache to the Query Service API for expensive queries.
- [ ] **PN-T3:** Agent Tooling PoC: Develop a function that uses an LLM to translate a natural language question into a Cypher query and execute it.
