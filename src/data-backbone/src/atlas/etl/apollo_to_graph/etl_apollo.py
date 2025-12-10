"""
Reads raw Apollo batch from MinIO and upserts into Neo4j.
Creates Company, Person, and Email nodes with relationships.
Usage: python -m etl.apollo_to_graph.etl_apollo --prefix apollo/raw/TIMESTAMP
"""

import argparse
import json
import os

from minio import Minio
from neo4j import GraphDatabase

from atlas.etl.common.idempotency import new_batch_id
from atlas.etl.common.schema import Company


def minio_client():
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    user = os.getenv("MINIO_ROOT_USER", "minioadmin")
    pwd = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    secure = False
    return Minio(endpoint, access_key=user, secret_key=pwd, secure=secure)


def read_json(mc: Minio, bucket: str, key: str) -> dict:
    data = mc.get_object(bucket, key).read()
    return json.loads(data.decode("utf-8"))


def cypher_upsert(tx, companies, batch_id):
    tx.run(
        """
UNWIND $companies AS c
MERGE (co:Company {id: c.id})
  ON CREATE SET 
    co.name=c.name, 
    co.domain=c.domain, 
    co.industry=c.industry,
    co.employee_count=c.employee_count,
    co.location=c.location,
    co.created_at=timestamp()
  ON MATCH  SET 
    co.name=c.name, 
    co.domain=c.domain, 
    co.industry=c.industry,
    co.employee_count=c.employee_count,
    co.location=c.location,
    co.updated_at=timestamp()
WITH c, co
UNWIND c.people AS p
MERGE (pe:Person {id: p.id})
  ON CREATE SET 
    pe.full_name=p.full_name, 
    pe.title=p.title, 
    pe.department=p.department,
    pe.created_at=timestamp()
  ON MATCH  SET 
    pe.full_name=p.full_name, 
    pe.title=p.title, 
    pe.department=p.department,
    pe.updated_at=timestamp()
MERGE (pe)-[r:WORKS_AT]->(co)
  ON CREATE SET r.batch_id=$batch_id
WITH p, pe
UNWIND p.emails AS em
MERGE (e:Email {address: em})
MERGE (pe)-[:HAS_EMAIL]->(e)
""",
        companies=companies,
        batch_id=batch_id,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prefix", help="like apollo/raw/2025-10-26T14:22:11Z", required=True)
    args = parser.parse_args()
    bucket = os.getenv("MINIO_BUCKET", "datalake")
    mc = minio_client()
    # read one json file
    data = read_json(mc, bucket, f"{args.prefix}/companies-00001.json")
    companies = [Company(**c).model_dump() for c in data["companies"]]
    batch_id = new_batch_id()
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    pwd = os.getenv("NEO4J_PASSWORD")
    driver = GraphDatabase.driver(uri, auth=(user, pwd))
    with driver.session() as sess:
        sess.execute_write(cypher_upsert, companies, batch_id)
    print("ETL done, batch:", batch_id)


if __name__ == "__main__":
    main()
