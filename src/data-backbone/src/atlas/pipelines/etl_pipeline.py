"""
Unified ETL pipeline: MinIO → Neo4j + Qdrant
Loads enriched company data into graph and vector stores.
"""

import json
import os

from minio import Minio
from neo4j import GraphDatabase

from atlas.etl.common.idempotency import new_batch_id


class ETLPipeline:
    """ETL: MinIO → Neo4j + Qdrant"""

    def __init__(self, minio_client: Minio, neo4j_driver: GraphDatabase.driver):
        self.mc = minio_client
        self.neo4j = neo4j_driver

    def run(self, prefix: str, bucket: str = "datalake", load_to_qdrant: bool = False):
        print(f"Reading from s3://{bucket}/{prefix}/companies.json")

        obj = self.mc.get_object(bucket, f"{prefix}/companies.json")
        data = json.loads(obj.read().decode("utf-8"))
        companies = data.get("companies", [])

        if not companies:
            raise ValueError("No companies found")

        total_people = sum(len(c.get("people", [])) for c in companies)
        print(f"Loaded {len(companies)} companies, {total_people} people")

        batch_id = new_batch_id()
        print(f"Loading to Neo4j (batch: {batch_id})")

        with self.neo4j.session() as sess:
            sess.execute_write(self._cypher_upsert, companies, batch_id)

        print("Neo4j loaded successfully")

        if load_to_qdrant:
            print("Loading to Qdrant...")
            try:
                self._load_to_qdrant(companies)
                print("Qdrant loaded successfully")
            except Exception as e:
                error_msg = str(e)
                # Check if it's a connection error (Qdrant not available)
                if (
                    "Name or service not known" in error_msg
                    or "Connection" in error_msg
                    or "ConnectError" in error_msg
                ):
                    print(f"WARNING: Qdrant is not available (connection error): {error_msg[:100]}")
                    print("Data is still available in Neo4j and MinIO")
                    # Don't re-raise connection errors - data is saved in Neo4j
                else:
                    import traceback

                    print(f"ERROR: Qdrant load failed: {e}")
                    print(traceback.format_exc())
                    print("Data is still available in Neo4j and MinIO")
                    # Don't re-raise - return batch_id anyway so data is visible

        return batch_id

    def _cypher_upsert(self, tx, companies, batch_id):
        tx.run(
            """
UNWIND $companies AS c
MERGE (co:Company {domain: c.domain})
  ON CREATE SET 
    co.id=c.id, co.name=c.name, co.location=c.location,
    co.rating=c.rating, co.website=c.website, co.types=c.types,
    co.industry=c.industry,
    co.created_at=timestamp()
  ON MATCH SET 
    co.name=c.name, co.location=c.location, co.industry=c.industry, co.updated_at=timestamp()
WITH c, co
UNWIND COALESCE(c.people, []) AS p
MERGE (pe:Person {id: p.id})
  ON CREATE SET 
    pe.full_name=p.full_name, pe.title=p.title, pe.department=p.department,
    pe.seniority=p.seniority, pe.linkedin=p.linkedin, pe.confidence=p.confidence,
    pe.created_at=timestamp()
  ON MATCH SET 
    pe.full_name=p.full_name, pe.title=p.title, pe.updated_at=timestamp()
MERGE (pe)-[:WORKS_AT]->(co)
WITH p, pe
UNWIND COALESCE(p.emails, []) AS em
MERGE (e:Email {address: em})
MERGE (pe)-[:HAS_EMAIL]->(e)
""",
            companies=companies,
            batch_id=batch_id,
        )

    def _load_to_qdrant(self, companies):
        try:
            from atlas.etl.apollo_to_vector.etl_apollo_qdrant import (
                build_embedder,
                ensure_collection,
                iter_entities,
                qdrant_client,
                upsert_entities,
            )

            # Convert companies list to dict format expected by iter_entities
            apollo_doc = {"companies": companies}

            # Get Qdrant client and embedder
            qc = qdrant_client()
            embedder = build_embedder()

            # Iterate entities and upsert
            entities = list(iter_entities(apollo_doc))
            if not entities:
                print("Warning: No entities to load to Qdrant")
                return

            # Ensure collection exists (will be created on first upsert if needed)
            if entities:
                # Get embedding dimension from first embed
                sample_texts = [entities[0].text]
                sample_vectors = embedder.embed(sample_texts)
                if embedder.embedding_dimension is None and sample_vectors:
                    embedder.embedding_dimension = len(sample_vectors[0])
                if embedder.embedding_dimension:
                    ensure_collection(qc, embedder.embedding_dimension)

            # Upsert all entities
            total = upsert_entities(qc, embedder, entities)
            print(f"Loaded {total} entities to Qdrant")
        except ImportError as e:
            print(f"WARNING: Qdrant load skipped - Missing dependency: {e}")
            print("  Install: pip install fastembed qdrant-client")
            raise  # Re-raise but will be caught in run()
        except Exception as e:
            print(f"WARNING: Qdrant load failed: {e}")
            raise  # Re-raise but will be caught in run()


def get_minio_client() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    user = os.getenv("MINIO_ROOT_USER", "minioadmin")
    pwd = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    secure = os.getenv("MINIO_SECURE", "false").lower() in {"true", "1"}
    return Minio(endpoint, access_key=user, secret_key=pwd, secure=secure)


def get_neo4j_driver() -> GraphDatabase.driver:
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    pwd = os.getenv("NEO4J_PASSWORD", "neo4jpass")
    driver = GraphDatabase.driver(uri, auth=(user, pwd))
    # Wait for Neo4j to be ready (max 60 seconds)
    import time

    max_wait = 60
    start = time.time()
    while time.time() - start < max_wait:
        try:
            driver.verify_connectivity()
            return driver
        except Exception:
            time.sleep(2)
    # If still not ready, return driver anyway (will fail with clear error)
    return driver
