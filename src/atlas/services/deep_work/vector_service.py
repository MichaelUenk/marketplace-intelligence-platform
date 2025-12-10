"""
Vector Embedding Service

Provides vector embedding and similarity search capabilities
using Qdrant for storage and OpenAI/local models for embeddings.
"""

from __future__ import annotations

import os
import uuid
import hashlib
from typing import Any
from dataclasses import dataclass

# Optional imports - graceful fallback if not available
try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models as qdrant_models
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


@dataclass
class VectorSearchResult:
    """Result from a vector similarity search"""
    id: str
    score: float
    payload: dict[str, Any]


class VectorService:
    """Service for vector embeddings and similarity search"""

    # Collection names
    KNOWLEDGE_COLLECTION = "deep_work_knowledge"
    REASONING_COLLECTION = "deep_work_reasoning"

    # Embedding dimensions
    OPENAI_SMALL_DIM = 1536  # text-embedding-3-small
    BGE_SMALL_DIM = 384  # BAAI/bge-small-en-v1.5

    def __init__(self):
        self._qdrant: QdrantClient | None = None
        self._openai_client: openai.OpenAI | None = None
        self._embed_model: str | None = None
        self._embed_dim: int = self.OPENAI_SMALL_DIM
        self._initialized = False
        self._cache: dict[str, list[float]] = {}  # Simple embedding cache

    def initialize(self) -> bool:
        """Initialize connections to Qdrant and embedding service"""
        if self._initialized:
            return True

        # Initialize Qdrant
        if QDRANT_AVAILABLE:
            qdrant_url = os.environ.get("QDRANT_URL", "http://localhost:6333")
            try:
                self._qdrant = QdrantClient(url=qdrant_url, timeout=10)
                # Test connection
                self._qdrant.get_collections()
                print(f"[VectorService] Connected to Qdrant at {qdrant_url}")
            except Exception as e:
                print(f"[VectorService] Qdrant connection failed: {e}")
                self._qdrant = None

        # Initialize OpenAI for embeddings
        if OPENAI_AVAILABLE:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                try:
                    self._openai_client = openai.OpenAI(api_key=api_key)
                    self._embed_model = os.environ.get("OPENAI_EMBED_MODEL", "text-embedding-3-small")
                    self._embed_dim = self.OPENAI_SMALL_DIM
                    print(f"[VectorService] Using OpenAI embeddings: {self._embed_model}")
                except Exception as e:
                    print(f"[VectorService] OpenAI initialization failed: {e}")
                    self._openai_client = None

        # Create collections if Qdrant is available
        if self._qdrant:
            self._ensure_collections()

        self._initialized = True
        return self._qdrant is not None

    def _ensure_collections(self):
        """Create Qdrant collections if they don't exist"""
        if not self._qdrant or not QDRANT_AVAILABLE:
            return

        for collection_name in [self.KNOWLEDGE_COLLECTION, self.REASONING_COLLECTION]:
            try:
                self._qdrant.get_collection(collection_name)
            except Exception:
                # Collection doesn't exist, create it
                try:
                    self._qdrant.create_collection(
                        collection_name=collection_name,
                        vectors_config=qdrant_models.VectorParams(
                            size=self._embed_dim,
                            distance=qdrant_models.Distance.COSINE,
                        ),
                    )
                    print(f"[VectorService] Created collection: {collection_name}")
                except Exception as e:
                    print(f"[VectorService] Failed to create collection {collection_name}: {e}")

    def _get_embedding(self, text: str) -> list[float] | None:
        """Get embedding vector for text"""
        if not text:
            return None

        # Check cache first
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]

        # Try OpenAI
        if self._openai_client and self._embed_model:
            try:
                response = self._openai_client.embeddings.create(
                    model=self._embed_model,
                    input=text[:8000],  # Truncate to avoid token limits
                )
                embedding = response.data[0].embedding
                self._cache[cache_key] = embedding
                return embedding
            except Exception as e:
                print(f"[VectorService] OpenAI embedding failed: {e}")

        # Fallback: return None (will use keyword search)
        return None

    def is_available(self) -> bool:
        """Check if vector service is fully operational"""
        return self._qdrant is not None and self._openai_client is not None

    # Knowledge Base Vector Operations

    def index_knowledge_entry(
        self,
        entry_id: str,
        title: str,
        content: str,
        metadata: dict[str, Any],
    ) -> bool:
        """Index a knowledge entry for vector search"""
        if not self._qdrant:
            return False

        # Create combined text for embedding
        text_to_embed = f"{title}\n\n{content}"
        embedding = self._get_embedding(text_to_embed)

        if not embedding:
            return False

        try:
            self._qdrant.upsert(
                collection_name=self.KNOWLEDGE_COLLECTION,
                points=[
                    qdrant_models.PointStruct(
                        id=entry_id,
                        vector=embedding,
                        payload={
                            "entry_id": entry_id,
                            "title": title,
                            "content_preview": content[:500],
                            **metadata,
                        },
                    )
                ],
            )
            return True
        except Exception as e:
            print(f"[VectorService] Failed to index knowledge entry: {e}")
            return False

    def search_knowledge(
        self,
        query: str,
        limit: int = 5,
        filter_type: str | None = None,
        filter_company: str | None = None,
    ) -> list[VectorSearchResult]:
        """Search knowledge base by semantic similarity"""
        if not self._qdrant:
            return []

        query_embedding = self._get_embedding(query)
        if not query_embedding:
            return []

        # Build filter conditions
        must_conditions = []
        if filter_type:
            must_conditions.append(
                qdrant_models.FieldCondition(
                    key="type",
                    match=qdrant_models.MatchValue(value=filter_type),
                )
            )
        if filter_company:
            must_conditions.append(
                qdrant_models.FieldCondition(
                    key="applies_to_companies",
                    match=qdrant_models.MatchAny(any=[filter_company]),
                )
            )

        query_filter = None
        if must_conditions:
            query_filter = qdrant_models.Filter(must=must_conditions)

        try:
            results = self._qdrant.search(
                collection_name=self.KNOWLEDGE_COLLECTION,
                query_vector=query_embedding,
                query_filter=query_filter,
                limit=limit,
            )

            return [
                VectorSearchResult(
                    id=str(r.id),
                    score=r.score,
                    payload=r.payload or {},
                )
                for r in results
            ]
        except Exception as e:
            print(f"[VectorService] Knowledge search failed: {e}")
            return []

    def delete_knowledge_entry(self, entry_id: str) -> bool:
        """Delete a knowledge entry from the vector index"""
        if not self._qdrant:
            return False

        try:
            self._qdrant.delete(
                collection_name=self.KNOWLEDGE_COLLECTION,
                points_selector=qdrant_models.PointIdsList(points=[entry_id]),
            )
            return True
        except Exception as e:
            print(f"[VectorService] Failed to delete knowledge entry: {e}")
            return False

    # Reasoning Chunk Vector Operations

    def index_reasoning_chunk(
        self,
        chunk_id: str,
        decision_type: str,
        result: str,
        reasoning_text: str,
        metadata: dict[str, Any],
    ) -> bool:
        """Index a reasoning chunk for vector search"""
        if not self._qdrant:
            return False

        # Create combined text for embedding
        text_to_embed = f"Type: {decision_type}\nResult: {result}\n\nReasoning: {reasoning_text}"
        embedding = self._get_embedding(text_to_embed)

        if not embedding:
            return False

        try:
            self._qdrant.upsert(
                collection_name=self.REASONING_COLLECTION,
                points=[
                    qdrant_models.PointStruct(
                        id=chunk_id,
                        vector=embedding,
                        payload={
                            "chunk_id": chunk_id,
                            "decision_type": decision_type,
                            "result_preview": result[:200],
                            **metadata,
                        },
                    )
                ],
            )
            return True
        except Exception as e:
            print(f"[VectorService] Failed to index reasoning chunk: {e}")
            return False

    def find_similar_reasoning(
        self,
        query: str,
        limit: int = 5,
        filter_type: str | None = None,
    ) -> list[VectorSearchResult]:
        """Find similar reasoning chunks by semantic similarity"""
        if not self._qdrant:
            return []

        query_embedding = self._get_embedding(query)
        if not query_embedding:
            return []

        query_filter = None
        if filter_type:
            query_filter = qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="decision_type",
                        match=qdrant_models.MatchValue(value=filter_type),
                    )
                ]
            )

        try:
            results = self._qdrant.search(
                collection_name=self.REASONING_COLLECTION,
                query_vector=query_embedding,
                query_filter=query_filter,
                limit=limit,
            )

            return [
                VectorSearchResult(
                    id=str(r.id),
                    score=r.score,
                    payload=r.payload or {},
                )
                for r in results
            ]
        except Exception as e:
            print(f"[VectorService] Reasoning search failed: {e}")
            return []

    # Context Building

    def get_relevant_context(
        self,
        query: str,
        company_id: str | None = None,
        signal_type: str | None = None,
        include_reasoning: bool = True,
        limit: int = 5,
    ) -> dict[str, list[dict]]:
        """Get relevant context from both knowledge and reasoning vectors"""
        context = {
            "knowledge": [],
            "similar_reasoning": [],
        }

        # Search knowledge base
        knowledge_results = self.search_knowledge(
            query=query,
            limit=limit,
            filter_company=company_id,
        )
        context["knowledge"] = [
            {
                "id": r.id,
                "score": r.score,
                "title": r.payload.get("title", ""),
                "content": r.payload.get("content_preview", ""),
                "type": r.payload.get("type", ""),
            }
            for r in knowledge_results
        ]

        # Search similar reasoning
        if include_reasoning:
            reasoning_results = self.find_similar_reasoning(
                query=query,
                limit=limit,
                filter_type=signal_type,
            )
            context["similar_reasoning"] = [
                {
                    "id": r.id,
                    "score": r.score,
                    "type": r.payload.get("decision_type", ""),
                    "result": r.payload.get("result_preview", ""),
                }
                for r in reasoning_results
            ]

        return context

    def get_stats(self) -> dict:
        """Get vector service statistics"""
        stats = {
            "qdrant_available": self._qdrant is not None,
            "openai_available": self._openai_client is not None,
            "embed_model": self._embed_model,
            "embed_dimension": self._embed_dim,
            "knowledge_count": 0,
            "reasoning_count": 0,
            "cache_size": len(self._cache),
        }

        if self._qdrant:
            try:
                knowledge_info = self._qdrant.get_collection(self.KNOWLEDGE_COLLECTION)
                stats["knowledge_count"] = knowledge_info.points_count
            except Exception:
                pass

            try:
                reasoning_info = self._qdrant.get_collection(self.REASONING_COLLECTION)
                stats["reasoning_count"] = reasoning_info.points_count
            except Exception:
                pass

        return stats


# Singleton instance
_vector_service: VectorService | None = None


def get_vector_service() -> VectorService:
    """Get or create the vector service singleton"""
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
        _vector_service.initialize()
    return _vector_service
