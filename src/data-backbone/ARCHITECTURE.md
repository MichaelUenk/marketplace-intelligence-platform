# Atlas Architecture Overview

## Overview

This document outlines the technical architecture for the data-science platform. The primary objective is to create a robust and flexible system capable of ingesting data from diverse sources, transforming it into a high-value knowledge base, and exposing it for consumption by data applications, human analysts, and (critically) AI agents.

The core of this architecture is the strategic separation of concerns:

- A Data Lake for raw, immutable data storage.
- A Knowledge Graph as the flexible, schema-light "gold" layer.
- A Decoupled Service Layer to abstract data access for all consumers.
- An Orchestration Layer to manage all data flow, dependencies, and scheduling.

This approach prioritizes schema flexibility and AI-readiness over the rigidity of traditional relational (table-based) data models.

## Core Architectural Principles

- Flexibility Over Rigidity: The data schemas from sources like Apollo.ai and web crawls are complex and unpredictable. A graph database (Neo4j) is chosen as the primary "gold" data store because it allows for an emergent, flexible schema, which is superior to brittle, pre-defined tables.
- AI-First Data Model: The system is designed from the ground up to be accessed by AI agents. A graph structure is more semantically rich and easier for an LLM to traverse and query (e.g., "find all companies connected to person X") than a series of joined SQL tables.
- Raw Data Persistence (Data Lake): All raw data from ingestors is first landed in the Data Lake (MinIO). This provides a cheap, auditable, and immutable "bronze" layer. It guarantees that we can always re-run or modify ETL processes without having to re-fetch data from the source.
- Decoupled Services: Each stage of the pipeline (Ingestion, ETL, Querying) is a separate, containerized service. This allows for independent development, scaling, and maintenance.

## System Architecture Diagram

The architecture follows a staged data pipeline model.

The flow is as follows:

- Ingestors pull data from external Sources.
- Raw data is saved to the Data Lake (MinIO).
- The arrival of new data triggers an ETL Service.
- The ETL Service transforms the raw data and loads it into the Knowledge Graph (Neo4j).
- A Query API (FastAPI) provides endpoints for common queries.
- Consumers (AI Agents, Apps, Data Marts) interact with the Query API.

## Component Breakdown

### Data Sources

Triggering asynchronous, long-running jobs (e.g., POST /api/v1/enrich-companies) by creating new flow runs in the Orchestration Service.: External or internal providers of information.

**Examples:**

- apollo.ai (for company/people data)
- firecrawl (for web-crawled event data)
- internal databases.

### Ingestor Services

**Description:** A collection of standalone scripts or services responsible for fetching data from a single source.

**Technology:** A collection of Python scripts designed as Prefect tasks responsible for fetching data from a single source.

**Responsibilities:**

- Handling source-specific authentication and API logic.
- Saving data in its raw format (e.g., timestamped JSON) to the Data Lake.

### Data Lake (Bronze Layer)

**Description:** The persistent, immutable storage for all raw data ingested into the system.

**Technology:** MinIO (providing a self-hosted, S3-compatible API).

**Key Features:**

- Partitioning: Data is partitioned by source and timestamp (e.g., /apollo/raw/2025-10-15-data.json) for easy auditing and caching.
- Provenance: Data includes metadata (e.g., JSON sidecars) describing its source and fetch time.
- Triggering: the primary trigger for ETL is managed by the Orchestration Service upon successful completion of an ingest task.

### ETL (Extract, Transform, Load) Layer

**Description:** Services, designed as Prefect tasks or flows, that are triggered by the Orchestration Service. They are responsible for transforming "raw" data into "gold" knowledge.

**Technology:** Python scripts using libraries to interact with MinIO and Neo4j.

Responsibilities:

- Reading new raw files from the Data Lake.
- Parsing and cleaning the data.
- Transforming the data into a graph model (defining nodes and relationships).
- Loading this model into the Knowledge Graph (e.g., creating (Person) nodes, (Company) nodes, and [:WORKS_AT] relationships).

### Knowledge Graph (Gold Layer)

**Description:** The primary, queryable data store for the platform. This is the "single source of truth" for all consumers.

**Technology:** Neo4j

**Key Features:**

- Stores data as nodes (e.g., Person, Company, Event) and relationships (e.g., HAS_EMAIL, ATTENDED, INVESTED_IN).
- Provides the Cypher query language for complex graph traversals.

### Orchestration Service

**Description:** The central scheduler and workflow manager responsible for all data pipelines, dependencies, and large-scale batch jobs.

**Technology:** Prefect

**Responsibilities:**

- Scheduling: Running flows on a schedule (e.g., nightly ingest jobs).
- Task Dependencies: Ensuring tasks run in the correct order (e.g., run_etl_flow after run_ingest_flow succeeds).
- Concurrency & Rate Limiting: Managing large fan-out jobs (e.g., "only enrich 10 companies at a time") to control CPU load and respect API limits.
- Observability & Retries: Providing a UI to see failures, logs, and re-run jobs.
- Parameterization: Passing data (like filenames or IDs) between tasks and flows.

### Query & Service Layer

**Description:** An API layer that decouples end-consumers from the underlying database.

**Technology:** FastAPI (Python).

Responsibilities:

- Exposing a set of standardized, pre-defined Cypher queries as simple REST API endpoints (e.g., GET /api/v1/company/{id}/employees).
- Handling authentication and authorization for data access.
- Serving as the endpoint for AI-generated Cypher queries.
- Triggering asynchronous, long-running jobs (e.g., POST /api/v1/enrich-companies) by creating new flow runs in the Orchestration Service.

### Consumers

**Description:** Any user, service, or application that needs data from the platform.

**Examples:**

- AI Agents: LLM-based tools that query the graph to answer natural language questions.
- Internal Applications: Dashboards, maps, and other high-level features.

## Data Flow & Automation

The system is orchestration-driven, managed by Prefect.

### Standard Pipeline Flow (e.g., Nightly Ingest)

- A Prefect Flow (e.g., apollo_nightly_sync) is triggered on a schedule (e.g., "every day at 1 AM").
- The flow calls the apollo_ingest_task.
- The task fetches data from the Apollo.ai API and writes apollo-TIMESTAMP.json to the minio/apollo/raw/ bucket.
- Upon successful task completion, the same Prefect flow calls the apollo_etl_task, passing the new file's path as a parameter.
- The ETL task reads that specific JSON file, connects to Neo4j, and executes a Cypher query to create or update the relevant nodes and relationships.
- The flow completes and reports its status (success/failure) to the Prefect UI.

### Fan-out Job Example (Enrichment)

This describes the use case of enriching a large list of entities.

- A user or service makes an API call: POST /api/v1/enrich-companies with a list of 10,000 company IDs.
- The FastAPI service immediately triggers a new Prefect flow (enrich_company_flow), passing the 10,000 IDs, and returns a 202 Accepted response with the flow run ID.
- The enrich_company_flow maps the list to an enrich_one_company_task, which is configured to run with a specific concurrency (e.g., concurrency=10).
- Prefect's workers (agents) execute these tasks in parallel, respecting the 10-task limit, handling retries on individual failures, and logging all outcomes.

## Deployment & Operations

- Containerization: All components (MinIO, Neo4j, Ingestors, ETL, FastAPI) are containerized using Docker and defined in a docker-compose.yml for a "one-click" development start.
- Monorepo: The codebase is managed in a single Git monorepo with clear directory separation (e.g., /ingestors, /etl, /services).
- Observability: Initial observability is achieved through structured text logging for all services.

## Future-State & Expansion ("Agentification")

The current architecture is the foundation for a more advanced, AI-driven system. Key roadmap items include:

- Agent-based Querying: Developing a service that uses an LLM (e.g., via OpenAI's SDK) to translate a natural language question (e.g., "Which companies in Japan did we contact last week?") into a Cypher query, execute it, and return the answer.
- Caching Layer: Implementing a Redis cache for the Query Service API to reduce load on Neo4j for expensive or frequently repeated queries.
- Expanding Sources: The decoupled nature makes it simple to add new pipelines (e.g., for Firecrawl) by adding a new ingestor and ETL service without modifying existing ones.

## Key Decisions & Open Questions

- Knowledge Graph Technology: Neo4j is Plan A due to its maturity and strong ecosystem. NebulaGraph is a potential alternative to investigate if high-scale sharding becomes a requirement that Neo4j's Fabric cannot meet.
- Hybrid Model: A hybrid approach (e.g., Postgres tables + Neo4j graph) was considered for performance. This is deferred to keep the initial prototype simple. The Query Service's caching layer (Phase N) is the first step to address performance bottlenecks.