from __future__ import annotations

from collections.abc import Callable
from functools import lru_cache
from typing import TypeAlias

from atlas.services.query_api.config import settings
from neo4j import GraphDatabase, Session
from qdrant_client import QdrantClient

# ---------------------------
# Neo4j
# ---------------------------

_driver = GraphDatabase.driver(
    settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
)


def neo4j_session() -> Session:
    """
    FastAPI dependency that yields a Neo4j session and closes it after the request.
    """
    with _driver.session() as s:
        yield s


# ---------------------------
# Qdrant (Vector DB)
# ---------------------------


@lru_cache(maxsize=1)
def _qdrant_cached() -> QdrantClient:
    """
    Cached Qdrant client reused across requests.
    """
    return QdrantClient(url=settings.QDRANT_URL)


def qdrant_client() -> QdrantClient:
    """
    FastAPI dependency for Qdrant client.
    """
    return _qdrant_cached()


# ---------------------------
# Embeddings (OpenAI → FastEmbed fallback)
# ---------------------------


class _BaseEmbedder:
    embedding_dimension: int | None = None

    def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError


class _OpenAIEmbedder(_BaseEmbedder):
    def __init__(self, model: str, api_key: str):
        # Lazy import so fallback path doesn't require the package
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key)
        self._model = model

    def embed(self, texts: list[str]) -> list[list[float]]:
        resp = self._client.embeddings.create(model=self._model, input=texts)
        vecs = [d.embedding for d in resp.data]
        if self.embedding_dimension is None and vecs:
            self.embedding_dimension = len(vecs[0])
        return vecs


class _FastEmbedder(_BaseEmbedder):
    def __init__(self, model_name: str):
        from fastembed import TextEmbedding

        self._emb = TextEmbedding(model_name=model_name)
        self.embedding_dimension = self._emb.embedding_dimension

    def embed(self, texts: list[str]) -> list[list[float]]:
        # fastembed yields numpy arrays; convert to lists
        return [v.tolist() for v in self._emb.embed(texts)]


@lru_cache(maxsize=1)
def _build_embedder() -> _BaseEmbedder:
    """
    Prefer OpenAI if configured; otherwise use FastEmbed.
    If OpenAI import/init fails, fall back to FastEmbed.
    """
    if settings.OPENAI_API_KEY:
        try:
            __import__("openai")
            return _OpenAIEmbedder(
                model=settings.OPENAI_EMBED_MODEL,
                api_key=settings.OPENAI_API_KEY,
            )
        except Exception as e:
            print(f"[embed] OpenAI unavailable ({e}); falling back to FastEmbed.")

    return _FastEmbedder(model_name=settings.EMBED_MODEL)


EmbedFn: TypeAlias = Callable[[list[str]], list[list[float]]]


def embedder() -> EmbedFn:
    """
    FastAPI dependency that returns a callable:
      embedder(texts: List[str]) -> List[List[float]]
    """
    return _build_embedder().embed
