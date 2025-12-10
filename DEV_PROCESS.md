# Development Process & Guiding Principles

This document outlines the development process for the project.
Given our lean team, we are prioritizing an incremental and iterative approach to quickly validate our architecture.

## Guiding Principles

1.  **Focus on One Vertical Slice:** We will prove the end-to-end flow for a single data source (Apollo) before generalizing or adding others. This helps us build momentum and uncover challenges early.
2.  **Manual Before Automated:** Every step of the data pipeline (ingestion, ETL) will be built as a manually triggered script first. Automation will be layered on top only after the core logic is confirmed to be working correctly.
3.  **Keep it Simple:** We will use tools (like Docker Compose for local services) and avoid premature optimization or over-engineering. The goal is to build a solid prototype that can be scaled later.

## Phased Development Plan

The project is broken down into four distinct phases, each with a clear goal and deliverable.

* **Phase 1: The Foundation 🏗️**
    * **Goal:** Set up the core, empty infrastructure. This includes the data lake (MinIO) and the knowledge graph (Neo4j). No data will be flowing yet.

* **Phase 2: The First End-to-End Pipeline 🔗**
    * **Goal:** Build the first complete, manually-triggered data pipeline. This will involve creating an ingestor for Apollo data and an ETL script to populate the knowledge graph.

* **Phase 3: Building the First "Product" & Automation 🚀**
    * **Goal:** Make the data useful and automate the pipeline. This involves creating a query API, integrating it with an existing tool like n8n, and automating the ETL triggers.

* **Phase 4: Expansion and "Agentification" 🤖**
    * **Goal:** Prove the architecture's reusability by adding a second data source (Firecrawl) and building a Proof-of-Concept for the agentic query layer.

## Development Workflow

* **Tasks:** For not all work will be tracked in `PROJECT_ROADMAP.md`.
* **Communication:** We will have brief daily check-ins to discuss progress and blockers. Call if needed to discuss, messages to Telegram group otherwise.

* **Code Quality:** All code will be submitted via pull requests for review to ensure it aligns with the architecture. Aim for small PRs!

* **Documentation:** Each service will have a `README.md` explaining its purpose and how to run it.

## Design / Architecutre

While @undertherain is responsible for high-level architecture and technical direction, this is a collaborative process.
Everybody's insights and suggestions are not just welcome—they are crucial.

If you have an idea for an improvement, a different approach, or a concern about the current architecture, please follow this process:

- Open an "Issue" in our Git repository with a title like [Suggestion] Improve X or [Discussion] Alternative for Y.

- Briefly describe your idea and the problem it solves or the benefit it provides.

- We will use that issue as a space to discuss the trade-offs and decide on the best path forward together. For smaller ideas, feel free to bring them up in our daily check-in.