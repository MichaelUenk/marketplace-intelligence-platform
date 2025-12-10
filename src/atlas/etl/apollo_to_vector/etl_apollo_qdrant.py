"""
Reads raw Apollo batch from MinIO and upserts embeddings into Qdrant (Vector DB).

Primary embedder: OpenAI (text-embedding-3-*)
Fallback embedder: FastEmbed (BAAI/bge-small-en-v1.5)

Collection: atlas_entities (COSINE distance)

Env (examples):
  MINIO_ENDPOINT=minio:9000
  MINIO_ROOT_USER=minioadmin
  MINIO_ROOT_PASSWORD=minioadmin
  MINIO_BUCKET=datalake

  QDRANT_URL=http://qdrant:6333

  # Primary (OpenAI)
  OPENAI_API_KEY=sk-...
  OPENAI_EMBED_MODEL=text-embedding-3-small  # or text-embedding-3-large

  # Fallback (FastEmbed)
  EMBED_MODEL=BAAI/bge-small-en-v1.5
"""

from __future__ import annotations

import argparse
import json
import os
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any
from uuid import UUID, uuid5

from dotenv import load_dotenv
from minio import Minio
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

# ----------------------------
# Embedding backends
# ----------------------------


class _BaseEmbedder:
    embedding_dimension: int | None = None

    def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError


class OpenAIEmbedder(_BaseEmbedder):
    """
    Uses OpenAI Embeddings API (openai>=1.x).
    """

    def __init__(self, model: str, api_key: str):
        from openai import OpenAI  # import here so fallback is cheap if pkg missing

        self.model = model
        self.client = OpenAI(api_key=api_key)

    def embed(self, texts: list[str]) -> list[list[float]]:
        # Batch call; OpenAI returns one vector per input
        resp = self.client.embeddings.create(model=self.model, input=texts)
        vecs = [d.embedding for d in resp.data]
        # set dimension on first call
        if self.embedding_dimension is None and vecs:
            self.embedding_dimension = len(vecs[0])
        return vecs


class FastEmbedder(_BaseEmbedder):
    """
    CPU-friendly fallback using fastembed (BAAI/bge-small-en-v1.5 by default).
    """

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        from fastembed import TextEmbedding

        self.model_name = model_name
        self.embedding_dimension = self._emb.embedding_dimension
        self._emb = TextEmbedding(model_name=model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        # fastembed yields numpy arrays; convert to lists
        return [v.tolist() for v in self._emb.embed(texts)]


def build_embedder() -> _BaseEmbedder:
    """
    Prefer OpenAI if key present & package available; otherwise fallback to FastEmbed.
    If OpenAI call fails at runtime, we fall back for the whole run.
    """
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
    if api_key:
        try:
            # Ensure openai package is available
            import importlib

            importlib.import_module("openai")
            print(f"[embed] Using OpenAI model: {model}")
            return OpenAIEmbedder(model=model, api_key=api_key)
        except Exception as e:
            print(f"[embed] OpenAI unavailable ({e}); falling back to FastEmbed.")
    # Fallback
    fb_model = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
    print(f"[embed] Using FastEmbed model: {fb_model}")
    return FastEmbedder(model_name=fb_model)


# ----------------------------
# MinIO / Qdrant clients
# ----------------------------


def minio_client() -> Minio:
    # Dev defaults to HTTP (secure=False). If you enable TLS, adjust accordingly.
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    user = os.getenv("MINIO_ROOT_USER", "minioadmin")
    pwd = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    # MinIO SDK expects host[:port] without scheme when secure is provided explicitly.
    endpoint = endpoint.replace("http://", "").replace("https://", "")
    return Minio(endpoint, access_key=user, secret_key=pwd, secure=False)


def qdrant_client() -> QdrantClient:
    url = os.getenv("QDRANT_URL", "http://qdrant:6333")
    return QdrantClient(url=url)


# ----------------------------
# IO helpers
# ----------------------------


def list_json_keys(mc: Minio, bucket: str, prefix: str) -> list[str]:
    objs = mc.list_objects(bucket, prefix=prefix, recursive=True)
    return [o.object_name for o in objs if o.object_name.endswith(".json")]


def read_json(mc: Minio, bucket: str, key: str) -> dict:
    data = mc.get_object(bucket, key).read()
    return json.loads(data.decode("utf-8"))


# ----------------------------
# Text builders
# ----------------------------


def build_company_text(c: dict[str, Any]) -> str:
    return " | ".join(
        str(x)
        for x in [
            c.get("name") or "",
            f"domain {c.get('domain') or ''}",
            c.get("industry") or "",
            f"employees {c.get('employee_count') or ''}",
            c.get("location") or "",
        ]
        if x
    )


def build_person_text(p: dict[str, Any], company: dict[str, Any]) -> str:
    return " | ".join(
        str(x)
        for x in [
            p.get("full_name") or "",
            p.get("title") or "",
            p.get("department") or "",
            f"company {company.get('name') or ''} ({company.get('domain') or ''})",
        ]
        if x
    )


# ----------------------------
# Qdrant upsert
# ----------------------------

COLLECTION = "atlas_entities"
DISTANCE = Distance.COSINE

# Deterministic UUID namespace for mapping external IDs to Qdrant point IDs
_QDRANT_NS = UUID("8f1c3ffc-9b83-4a2e-93a1-0a5d9a9e3b2b")


@dataclass
class Entity:
    id: str  # human-readable / external id (e.g., "company:<id>" or "person:<id>")
    text: str  # text to embed
    payload: dict  # JSON payload


def ensure_collection(client: QdrantClient, vector_size: int) -> None:
    existing = client.get_collections()
    names = {c.name for c in existing.collections}
    if COLLECTION not in names:
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=vector_size, distance=DISTANCE),
        )


def iter_entities(apollo_doc: dict[str, Any]) -> Iterable[Entity]:
    for c in apollo_doc.get("companies", []):
        c_id = str(c["id"])
        yield Entity(
            id=f"company:{c_id}",
            text=build_company_text(c),
            payload={
                "type": "company",
                "id": c_id,
                "name": c.get("name"),
                "domain": c.get("domain"),
                "industry": c.get("industry"),
                "employee_count": c.get("employee_count"),
                "location": c.get("location"),
            },
        )
        for p in c.get("people", []):
            p_id = str(p["id"])
            yield Entity(
                id=f"person:{p_id}",
                text=build_person_text(p, c),
                payload={
                    "type": "person",
                    "id": p_id,
                    "full_name": p.get("full_name"),
                    "title": p.get("title"),
                    "department": p.get("department"),
                    "company_id": c_id,
                    "company_domain": c.get("domain"),
                },
            )


def _qdrant_point_id(raw: str) -> str:
    """
    Qdrant point IDs must be unsigned integers or UUIDs.
    We deterministically map external string IDs to UUIDv5.
    """
    return str(uuid5(_QDRANT_NS, raw))


def upsert_entities(
    client: QdrantClient,
    embedder: _BaseEmbedder,
    entities: list[Entity],
    batch_size: int = 128,
) -> int:
    total = 0
    # Embed in batches to respect API limits (OpenAI) and keep RAM low (FastEmbed)
    for i in range(0, len(entities), batch_size):
        chunk = entities[i : i + batch_size]
        texts = [e.text for e in chunk]
        try:
            vectors = embedder.embed(texts)  # type: ignore[assignment]
        except Exception as e:
            # If OpenAI failed mid-run, fallback to FastEmbed for the rest
            if not isinstance(embedder, FastEmbedder):
                print(f"[embed] OpenAI failed ({e}); switching to FastEmbed for remaining batches.")
                embedder = FastEmbedder(os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5"))
                vectors = embedder.embed(texts)
            else:
                raise

        if embedder.embedding_dimension is None and vectors:
            embedder.embedding_dimension = len(vectors[0])

        if i == 0:
            ensure_collection(client, embedder.embedding_dimension or len(vectors[0]))

        points = [
            PointStruct(
                id=_qdrant_point_id(e.id),  # UUIDv5 ID
                vector=v,
                payload={**e.payload, "ext_id": e.id},  # keep original external id
            )
            for e, v in zip(chunk, vectors, strict=False)
        ]
        client.upsert(collection_name=COLLECTION, points=points, wait=True)
        total += len(points)
    return total


# ----------------------------
# Main
# ----------------------------


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prefix", required=True, help="like apollo/raw/2025-10-26T14:22:11Z")
    parser.add_argument("--bucket", default=os.getenv("MINIO_BUCKET", "datalake"))
    args = parser.parse_args()

    mc = minio_client()
    qc = qdrant_client()
    embedder = build_embedder()

    keys = list_json_keys(mc, args.bucket, args.prefix)
    if not keys:
        print(f"No JSON files found under s3://{args.bucket}/{args.prefix}")
        return

    total_files = 0
    total_points = 0
    for key in keys:
        doc = read_json(mc, args.bucket, key)
        ents = list(iter_entities(doc))
        if not ents:
            continue
        upserted = upsert_entities(qc, embedder, ents)
        total_files += 1
        total_points += upserted
        print(f"Upserted {upserted} points from {key}")

    print(f"Vector ETL done: files={total_files}, points={total_points}, collection={COLLECTION}")


if __name__ == "__main__":
    main()
