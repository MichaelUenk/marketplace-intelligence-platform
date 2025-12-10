# ==== Config ====
SHELL := /bin/bash
APP := atlas
SRC_DIR := src
API_SERVICE := query_api
COMPOSE := docker compose

PREFIX ?= $(shell [ -f .last_prefix ] && cat .last_prefix || echo "")
OPENAI_API_KEY ?=
OPENAI_FLAG := $(if $(OPENAI_API_KEY),-e OPENAI_API_KEY=$(OPENAI_API_KEY),)

# For lake listing
LAKE_PREFIX ?= apollo/raw/
LAKE_LIMIT  ?= 100

# For new pipeline
QUERY ?= tech companies in Austin
LIMIT ?= 10

# ==== Help ====

.PHONY: help
help:
	@echo ""
	@echo "Targets:"
	@echo "  fmt                 - Ruff code formatter (applies changes)"
	@echo "  lint                - Ruff lint + autofix (safe fixes)"
	@echo "  compose.up          - Build and start all services"
	@echo "  compose.rebuild     - Rebuild query_api image (no cache) and restart it"
	@echo "  compose.down        - Stop and remove containers (keep volumes)"
	@echo "  compose.clean       - Stop everything and remove volumes"
	@echo "  logs                - Tail query_api logs"
	@echo "  minio.ready         - Check MinIO readiness endpoint"
	@echo "  qdrant.collections  - List Qdrant collections"
	@echo "  qdrant.clean        - Drop 'atlas_entities' collection"
	@echo "  lake.ls             - List Data Lake content (MinIO) via host Python"
	@echo "  lake.ls.docker      - List Data Lake content via query_api container"
	@echo "  etl.mock            - Generate mock Apollo data in MinIO and record prefix"
	@echo "  etl.graph           - Run Apollo -> Neo4j ETL   (uses PREFIX or .last_prefix)"
	@echo "  etl.vector          - Run Apollo -> Qdrant ETL (uses PREFIX or .last_prefix; OpenAI if key present)"
	@echo "  etl.vector.fast     - Force FastEmbed fallback (ignores OpenAI)"
	@echo "  endpoints.test      - Run test_all_endpoints.sh"
	@echo ""
	@echo "Real Data Pipeline (Google Places + Hunter.io):"
	@echo "  pipeline.run        - Search real companies and load everything (QUERY, LIMIT)"
	@echo "  pipeline.search     - Search only (no enrichment)"
	@echo "  pipeline.clean      - Clean all data (MinIO, Neo4j, Qdrant)"
	@echo "  pipeline.demo       - Full demo: clean + run + show results"
	@echo ""

# ==== Code Quality (Ruff via uvx – zero install for you) ====

.PHONY: fmt
fmt:
	uvx ruff format $(SRC_DIR)

.PHONY: lint
lint:
	uvx ruff check . --fix

# ==== Docker Compose ====

.PHONY: compose.up
compose.up:
	$(COMPOSE) up -d --build

.PHONY: compose.rebuild
compose.rebuild:
	$(COMPOSE) build --no-cache $(API_SERVICE)
	$(COMPOSE) up -d $(API_SERVICE)

.PHONY: compose.down
compose.down:
	$(COMPOSE) down

.PHONY: compose.clean
compose.clean:
	$(COMPOSE) down -v

.PHONY: logs
logs:
	$(COMPOSE) logs -f $(API_SERVICE)

# ==== Ops helpers ====

.PHONY: minio.ready
minio.ready:
	@echo "Checking MinIO readiness..."
	@curl -sf http://localhost:9000/minio/health/ready && echo "  ✓ MinIO ready"

.PHONY: qdrant.collections
qdrant.collections:
	@curl -s http://localhost:6333/collections | jq

.PHONY: qdrant.clean
qdrant.clean:
	curl -s -X DELETE http://localhost:6333/collections/atlas_entities >/dev/null || true
	@echo "Dropped collection 'atlas_entities' (if it existed)."

# ==== Data Lake listing ====
.PHONY: lake.ls.docker
lake.ls.docker:
	# Container-side listing (no host deps)
	$(COMPOSE) exec -T $(API_SERVICE) python -m $(APP).tools.lake_ls --prefix "$(LAKE_PREFIX)" --limit $(LAKE_LIMIT)

# ==== ETL Pipeline ====

# 1) Generate mock Apollo data in MinIO and capture the resulting prefix into .last_prefix
.PHONY: etl.mock
etl.mock:
	@echo "Generating mock Apollo data..."
	@$(COMPOSE) exec -T $(API_SERVICE) python -m $(APP).ingestors.apollo.apollo_fetch | tee .last_ingest.log
	@PREFIX=$$(sed -n 's#.*s3://[^/]*/\([^"]*\).*#\1#p' .last_ingest.log | tail -1); \
	if [[ -z "$$PREFIX" ]]; then \
		echo "ERROR: Could not detect prefix in output. Check .last_ingest.log"; exit 1; \
	fi; \
	echo $$PREFIX > .last_prefix; \
	echo "Recorded PREFIX=$$PREFIX"

# 2) ETL to Neo4j (requires PREFIX)
.PHONY: etl.graph
etl.graph:
	@if [[ -z "$(PREFIX)" ]]; then \
		echo "ERROR: PREFIX is empty. Run 'make etl.mock' first or provide PREFIX=apollo/raw/.."; exit 1; \
	fi
	@echo "Running Apollo -> Neo4j ETL with PREFIX=$(PREFIX)"
	@$(COMPOSE) exec -T $(API_SERVICE) \
		python -m $(APP).etl.apollo_to_graph.etl_apollo --prefix "$(PREFIX)"

# 3) ETL to Qdrant (uses OpenAI if OPENAI_API_KEY provided; otherwise falls back to FastEmbed)
.PHONY: etl.vector
etl.vector:
	@if [[ -z "$(PREFIX)" ]]; then \
		echo "ERROR: PREFIX is empty. Run 'make etl.mock' first or provide PREFIX=apollo/raw/..."; exit 1; \
	fi
	@echo "Running Apollo -> Qdrant ETL with PREFIX=$(PREFIX)"
	@$(COMPOSE) exec -T $(OPENAI_FLAG) $(API_SERVICE) \
		python -m $(APP).etl.apollo_to_vector.etl_apollo_qdrant --prefix "$(PREFIX)"

# 3b) Force FastEmbed fallback (ignore OpenAI even if present)
.PHONY: etl.vector.fast
etl.vector.fast:
	@if [[ -z "$(PREFIX)" ]]; then \
		echo "ERROR: PREFIX is empty. Run 'make etl.mock' first or provide PREFIX=apollo/raw/..."; exit 1; \
	fi
	@echo "Running Apollo -> Qdrant ETL with PREFIX=$(PREFIX) [FastEmbed forced]"
	@$(COMPOSE) exec -T -e OPENAI_API_KEY= $(API_SERVICE) \
		python -m $(APP).etl.apollo_to_vector.etl_apollo_qdrant --prefix "$(PREFIX)"

# ==== Endpoint smoke tests ====

.PHONY: endpoints.test
endpoints.test:
	bash test_all_endpoints.sh

# ==== Real Data Pipeline (Google Places + Hunter.io) ====

.PHONY: pipeline.check
pipeline.check:
	@echo "Checking services..."
	@if ! curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then \
		echo "Services not running. Starting..."; \
		$(COMPOSE) up -d; \
		echo "Waiting 90 seconds for services to initialize..."; \
		sleep 90; \
		echo "Verifying Neo4j readiness..."; \
		for attempt in 1 2 3; do \
			echo "  Attempt $$attempt/3: checking Neo4j HTTP port..."; \
			if curl -sf http://localhost:7474 > /dev/null 2>&1; then \
				echo "  Neo4j ready!"; \
				break; \
			else \
				if [ $$attempt -lt 3 ]; then \
					echo "  Not ready yet. Waiting additional 30 seconds..."; \
					sleep 30; \
				else \
					echo "ERROR: Neo4j still not ready after 3 attempts"; \
					echo "Check logs: docker compose logs neo4j"; \
					exit 1; \
				fi; \
			fi; \
		done; \
		echo "All services ready."; \
	fi

.PHONY: pipeline.run
pipeline.run: pipeline.check
	@if [ ! -f .env ]; then \
		echo "ERROR: .env file not found. Run: cp .env.example .env"; exit 1; \
	fi
	@echo "Running pipeline: $(QUERY) (limit: $(LIMIT))"
	@export $$(cat .env | grep -v '^#' | xargs) && \
	export PYTHONPATH=$(SRC_DIR) && \
	python3 -m atlas.cli ingest "$(QUERY)" --limit $(LIMIT) --enrich --load --qdrant

.PHONY: pipeline.search
pipeline.search: pipeline.check
	@if [ ! -f .env ]; then \
		echo "ERROR: .env file not found. Run: cp .env.example .env"; exit 1; \
	fi
	@export $$(cat .env | grep -v '^#' | xargs) && \
	export PYTHONPATH=$(SRC_DIR) && \
	python3 -m atlas.cli ingest "$(QUERY)" --limit $(LIMIT)

.PHONY: pipeline.clean
pipeline.clean:
	@echo "Cleaning all data..."
	@echo "1. Stopping services..."
	@$(COMPOSE) down
	@echo "2. Removing volumes (MinIO, Neo4j, Qdrant data)..."
	@docker volume rm -f data-backbone_minio_data data-backbone_neo4j_data data-backbone_qdrant_data 2>/dev/null || true
	@echo "3. Restarting services..."
	@$(COMPOSE) up -d
	@echo "Waiting 90 seconds for services to initialize..."
	@sleep 90
	@echo "Verifying Neo4j readiness..."
	@for attempt in 1 2 3; do \
		echo "  Attempt $$attempt/3: checking Neo4j HTTP port..."; \
		if curl -sf http://localhost:7474 > /dev/null 2>&1; then \
			echo "  Neo4j ready!"; \
			break; \
		else \
			if [ $$attempt -lt 3 ]; then \
				echo "  Not ready yet. Waiting additional 30 seconds..."; \
				sleep 30; \
			else \
				echo "ERROR: Neo4j still not ready after 3 attempts"; \
				echo "Check logs: docker compose logs neo4j"; \
				exit 1; \
			fi; \
		fi; \
	done
	@echo "Done! All data cleared and services ready."

.PHONY: pipeline.demo
pipeline.demo: pipeline.clean
	@echo ""
	@echo "=========================================="
	@echo "DEMO: Atlas Data Pipeline"
	@echo "=========================================="
	@echo "Query: $(QUERY)"
	@echo "Limit: $(LIMIT)"
	@echo "=========================================="
	@echo ""
	@if [ ! -f .env ]; then \
		echo "ERROR: .env file not found. Run: cp .env.example .env"; exit 1; \
	fi
	@export $$(cat .env | grep -v '^#' | xargs) && \
	export PYTHONPATH=$(SRC_DIR) && \
	python3 -m atlas.cli ingest "$(QUERY)" --limit $(LIMIT) --enrich --load --qdrant
	@echo ""
	@echo "=========================================="
	@echo "Demo Complete! View results:"
	@echo "=========================================="
	@echo "Neo4j:  http://localhost:7474  (neo4j/neo4jpass)"
	@echo "Qdrant: http://localhost:6333/dashboard"
	@echo "MinIO:  http://localhost:9001  (minioadmin/minioadmin)"
	@echo ""
