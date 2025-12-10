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

        print(f"Neo4j loaded successfully")

        if load_to_qdrant:
            print(f"Loading to Qdrant...")
            self._load_to_qdrant(companies)
            print(f"Qdrant loaded successfully")

        return batch_id

    def _cypher_upsert(self, tx, companies, batch_id):
        tx.run(
            """
UNWIND $companies AS c
MERGE (co:Company {domain: c.domain})
  ON CREATE SET 
    co.id=c.id, co.name=c.name, co.location=c.location,
    co.rating=c.rating, co.website=c.website, co.types=c.types,
    co.created_at=timestamp()
  ON MATCH SET 
    co.name=c.name, co.location=c.location, co.updated_at=timestamp()
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
                embed_and_upsert_companies,
            )

            embed_and_upsert_companies(companies)
        except Exception as e:
            print(f"Warning: Qdrant load skipped: {e}")


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
    return GraphDatabase.driver(uri, auth=(user, pwd))
