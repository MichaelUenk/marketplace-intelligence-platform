# src/atlas/services/thought_leadership/knowledge_engine.py
"""
Knowledge Engine - Transcript indexing, insight extraction, and semantic search.

Capabilities:
- Index meeting transcripts to Qdrant vector DB
- Extract insights using AI (pain points, buying signals, etc.)
- Semantic search across all knowledge
- Content generation from accumulated knowledge
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import uuid
import os

# Import dependencies
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        PointStruct,
        VectorParams,
        Distance,
        Filter,
        FieldCondition,
        MatchValue,
        Range
    )
except ImportError:
    QdrantClient = None

try:
    from atlas.services.ai_agent.mistral_client import MistralClient
except ImportError:
    MistralClient = None


class InsightType(str, Enum):
    """Types of insights extracted from conversations"""
    PAIN_POINT = "pain_point"
    BUYING_SIGNAL = "buying_signal"
    OBJECTION = "objection"
    COMPETITOR_MENTION = "competitor_mention"
    BUDGET_INFO = "budget_info"
    TIMELINE_INFO = "timeline_info"
    STAKEHOLDER_INFO = "stakeholder_info"
    SUCCESS_CRITERIA = "success_criteria"
    USE_CASE = "use_case"
    TECHNICAL_REQUIREMENT = "technical_requirement"


@dataclass
class TranscriptChunk:
    """A chunk of transcript text with metadata"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    text: str = ""
    meeting_id: str = ""
    company_id: str = ""
    contact_ids: List[str] = field(default_factory=list)
    date: datetime = field(default_factory=datetime.now)
    topics: List[str] = field(default_factory=list)
    entities: List[str] = field(default_factory=list)
    sentiment: Optional[str] = None
    speaker: Optional[str] = None


@dataclass
class Insight:
    """Customer insight extracted from conversations"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: InsightType = InsightType.PAIN_POINT
    content: str = ""
    quote: Optional[str] = None
    company_id: str = ""
    contact_id: Optional[str] = None
    meeting_id: Optional[str] = None
    confidence: float = 0.0
    actionability: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class SearchResult:
    """Result from knowledge base search"""
    chunks: List[TranscriptChunk] = field(default_factory=list)
    insights: List[Insight] = field(default_factory=list)
    total_count: int = 0


class KnowledgeEngine:
    """
    Knowledge Engine for the Thought Leadership Agent.

    Handles:
    - Transcript ingestion and chunking
    - Vector embedding and indexing
    - Insight extraction with AI
    - Semantic search across all knowledge
    - Knowledge graph updates
    """

    # Collection names in Qdrant
    TRANSCRIPTS_COLLECTION = "meeting_transcripts"
    INSIGHTS_COLLECTION = "customer_insights"
    CONTENT_COLLECTION = "content_library"
    TONE_COLLECTION = "tone_of_voice"

    # Chunking parameters
    CHUNK_SIZE = 512  # tokens
    CHUNK_OVERLAP = 50  # tokens

    # Insight extraction prompt
    INSIGHT_EXTRACTION_PROMPT = """Analyze this sales conversation excerpt and extract key insights.

Transcript:
{transcript}

For each insight found, identify:
- Type (one of: pain_point, buying_signal, objection, competitor_mention, budget_info, timeline_info, stakeholder_info, success_criteria, use_case, technical_requirement)
- Content (the specific insight in 1-2 sentences)
- Quote (the exact quote from the transcript, if applicable)
- Confidence (0.0 to 1.0)
- Actionability (what should be done with this insight)

Format your response as JSON with an "insights" array."""

    TOPIC_EXTRACTION_PROMPT = """Extract the main topics discussed in this conversation excerpt.

Text:
{text}

List 3-5 main topics as a comma-separated list."""

    def __init__(
        self,
        qdrant_url: Optional[str] = None,
        qdrant_api_key: Optional[str] = None,
        mistral_api_key: Optional[str] = None,
        neo4j_driver=None,
        embedding_model: str = "mistral-embed"
    ):
        """
        Initialize the Knowledge Engine.

        Args:
            qdrant_url: Qdrant server URL
            qdrant_api_key: Qdrant API key
            mistral_api_key: Mistral AI API key
            neo4j_driver: Neo4j driver for knowledge graph
            embedding_model: Model to use for embeddings
        """
        self.qdrant_url = qdrant_url or os.getenv("QDRANT_URL", "http://localhost:6333")
        self.qdrant_api_key = qdrant_api_key or os.getenv("QDRANT_API_KEY")
        self.mistral_api_key = mistral_api_key or os.getenv("MISTRAL_API_KEY")
        self.neo4j_driver = neo4j_driver
        self.embedding_model = embedding_model

        # Initialize Qdrant client
        if QdrantClient:
            self.qdrant = QdrantClient(
                url=self.qdrant_url,
                api_key=self.qdrant_api_key
            )
        else:
            self.qdrant = None

        # Initialize Mistral client
        if MistralClient and self.mistral_api_key:
            self.llm = MistralClient(api_key=self.mistral_api_key)
        else:
            self.llm = None

    async def initialize_collections(self):
        """Create Qdrant collections if they don't exist"""
        if not self.qdrant:
            return

        collections = [
            (self.TRANSCRIPTS_COLLECTION, 1024),  # Mistral embed dimension
            (self.INSIGHTS_COLLECTION, 1024),
            (self.CONTENT_COLLECTION, 1024),
            (self.TONE_COLLECTION, 1024),
        ]

        existing = {c.name for c in self.qdrant.get_collections().collections}

        for name, dim in collections:
            if name not in existing:
                self.qdrant.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(
                        size=dim,
                        distance=Distance.COSINE
                    )
                )

    async def index_transcript(
        self,
        meeting_id: str,
        transcript_text: str,
        company_id: str,
        contact_ids: List[str],
        meeting_date: datetime,
        meeting_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Index a meeting transcript to the knowledge base.

        Args:
            meeting_id: Unique meeting identifier
            transcript_text: Full transcript text
            company_id: Company ID
            contact_ids: List of participant contact IDs
            meeting_date: Meeting date
            meeting_type: Type of meeting

        Returns:
            Indexing result with chunk count and extracted insights
        """
        # 1. Chunk the transcript
        chunks = self._chunk_text(
            text=transcript_text,
            meeting_id=meeting_id,
            company_id=company_id,
            contact_ids=contact_ids,
            date=meeting_date
        )

        # 2. Extract topics and entities for each chunk
        for chunk in chunks:
            chunk.topics = await self._extract_topics(chunk.text)
            chunk.sentiment = await self._analyze_sentiment(chunk.text)

        # 3. Generate embeddings
        embeddings = await self._embed_texts([c.text for c in chunks])

        # 4. Index to Qdrant
        if self.qdrant and embeddings:
            points = [
                PointStruct(
                    id=chunk.id,
                    vector=emb,
                    payload={
                        "text": chunk.text,
                        "meeting_id": chunk.meeting_id,
                        "company_id": chunk.company_id,
                        "contact_ids": chunk.contact_ids,
                        "date": chunk.date.isoformat(),
                        "topics": chunk.topics,
                        "sentiment": chunk.sentiment,
                        "meeting_type": meeting_type
                    }
                )
                for chunk, emb in zip(chunks, embeddings)
            ]

            self.qdrant.upsert(
                collection_name=self.TRANSCRIPTS_COLLECTION,
                points=points
            )

        # 5. Extract insights
        insights = await self.extract_insights(transcript_text, company_id, meeting_id)

        # 6. Index insights
        if insights:
            await self._index_insights(insights)

        # 7. Update knowledge graph
        await self._update_knowledge_graph(meeting_id, company_id, contact_ids, insights)

        return {
            "meeting_id": meeting_id,
            "chunks_indexed": len(chunks),
            "insights_extracted": len(insights),
            "topics": list(set(t for c in chunks for t in c.topics))
        }

    async def extract_insights(
        self,
        transcript_text: str,
        company_id: str,
        meeting_id: Optional[str] = None
    ) -> List[Insight]:
        """
        Extract insights from transcript text using AI.

        Args:
            transcript_text: Full or partial transcript
            company_id: Company ID for context
            meeting_id: Optional meeting ID

        Returns:
            List of extracted insights
        """
        if not self.llm:
            return self._generate_mock_insights(company_id, meeting_id)

        # Split into chunks for processing
        chunks = self._chunk_text(
            text=transcript_text,
            meeting_id=meeting_id or "",
            company_id=company_id,
            contact_ids=[],
            date=datetime.now()
        )

        all_insights = []

        for chunk in chunks[:5]:  # Process first 5 chunks to avoid API limits
            prompt = self.INSIGHT_EXTRACTION_PROMPT.format(transcript=chunk.text)

            try:
                response = await self.llm.chat_async([
                    {"role": "user", "content": prompt}
                ])

                # Parse JSON response
                insights = self._parse_insights_response(response, company_id, meeting_id)
                all_insights.extend(insights)
            except Exception as e:
                # Log error and continue
                print(f"Error extracting insights: {e}")

        return all_insights

    async def search(
        self,
        query: str,
        company_id: Optional[str] = None,
        contact_id: Optional[str] = None,
        insight_types: Optional[List[InsightType]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 10
    ) -> SearchResult:
        """
        Semantic search across knowledge base.

        Args:
            query: Search query
            company_id: Filter by company
            contact_id: Filter by contact
            insight_types: Filter by insight types
            date_from: Filter by date range
            date_to: Filter by date range
            limit: Maximum results

        Returns:
            SearchResult with matching chunks and insights
        """
        if not self.qdrant or not self.llm:
            return self._generate_mock_search_result(query)

        # Generate query embedding
        query_embedding = await self._embed_texts([query])
        if not query_embedding:
            return SearchResult()

        # Build filter
        filter_conditions = []

        if company_id:
            filter_conditions.append(
                FieldCondition(key="company_id", match=MatchValue(value=company_id))
            )

        if contact_id:
            filter_conditions.append(
                FieldCondition(key="contact_ids", match=MatchValue(value=contact_id))
            )

        search_filter = Filter(must=filter_conditions) if filter_conditions else None

        # Search transcripts
        transcript_results = self.qdrant.search(
            collection_name=self.TRANSCRIPTS_COLLECTION,
            query_vector=query_embedding[0],
            limit=limit,
            query_filter=search_filter
        )

        # Search insights
        insight_results = self.qdrant.search(
            collection_name=self.INSIGHTS_COLLECTION,
            query_vector=query_embedding[0],
            limit=limit,
            query_filter=search_filter
        )

        # Convert to result objects
        chunks = [
            TranscriptChunk(
                id=r.id,
                text=r.payload.get("text", ""),
                meeting_id=r.payload.get("meeting_id", ""),
                company_id=r.payload.get("company_id", ""),
                topics=r.payload.get("topics", [])
            )
            for r in transcript_results
        ]

        insights = [
            Insight(
                id=r.id,
                type=InsightType(r.payload.get("type", "pain_point")),
                content=r.payload.get("content", ""),
                company_id=r.payload.get("company_id", ""),
                confidence=r.payload.get("confidence", 0.0)
            )
            for r in insight_results
        ]

        return SearchResult(
            chunks=chunks,
            insights=insights,
            total_count=len(chunks) + len(insights)
        )

    async def get_company_knowledge(self, company_id: str) -> Dict[str, Any]:
        """
        Get aggregated knowledge about a company.

        Returns:
            Dictionary with company knowledge summary
        """
        if not self.qdrant:
            return self._generate_mock_company_knowledge(company_id)

        # Count transcripts for company
        transcript_count = self.qdrant.count(
            collection_name=self.TRANSCRIPTS_COLLECTION,
            count_filter=Filter(
                must=[FieldCondition(key="company_id", match=MatchValue(value=company_id))]
            )
        )

        # Count insights for company
        insight_count = self.qdrant.count(
            collection_name=self.INSIGHTS_COLLECTION,
            count_filter=Filter(
                must=[FieldCondition(key="company_id", match=MatchValue(value=company_id))]
            )
        )

        # Get recent insights
        recent_insights = await self.search(
            query="",
            company_id=company_id,
            limit=10
        )

        # Get topics
        topics = set()
        for chunk in recent_insights.chunks:
            topics.update(chunk.topics)

        return {
            "company_id": company_id,
            "transcript_count": transcript_count.count,
            "insight_count": insight_count.count,
            "recent_insights": [
                {"type": i.type.value, "content": i.content}
                for i in recent_insights.insights[:5]
            ],
            "top_topics": list(topics)[:10]
        }

    async def generate_content(
        self,
        content_type: str,
        topic: str,
        company_id: Optional[str] = None,
        meeting_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate content from knowledge base.

        Args:
            content_type: Type of content (blog_post, case_study, etc.)
            topic: Content topic
            company_id: Focus on specific company
            meeting_ids: Use specific meetings as sources

        Returns:
            Generated content with metadata
        """
        if not self.llm:
            return self._generate_mock_content(content_type, topic)

        # Search for relevant knowledge
        search_results = await self.search(
            query=topic,
            company_id=company_id,
            limit=20
        )

        # Build context from search results
        context = "\n\n".join([
            f"From meeting: {chunk.text}"
            for chunk in search_results.chunks[:10]
        ])

        insights_context = "\n".join([
            f"- {insight.type.value}: {insight.content}"
            for insight in search_results.insights[:10]
        ])

        prompt = f"""Generate a {content_type} about "{topic}" based on customer conversations.

Context from meetings:
{context}

Key insights:
{insights_context}

Write a compelling {content_type} that incorporates these real customer experiences and insights.
Keep it professional but engaging."""

        response = await self.llm.chat_async([
            {"role": "user", "content": prompt}
        ])

        return {
            "type": content_type,
            "topic": topic,
            "content": response,
            "source_chunks": len(search_results.chunks),
            "source_insights": len(search_results.insights),
            "generated_at": datetime.now().isoformat()
        }

    # ─────────────────────────────────────────────────────────────
    # Private Helper Methods
    # ─────────────────────────────────────────────────────────────

    def _chunk_text(
        self,
        text: str,
        meeting_id: str,
        company_id: str,
        contact_ids: List[str],
        date: datetime
    ) -> List[TranscriptChunk]:
        """Split text into chunks with overlap"""
        # Simple word-based chunking
        words = text.split()
        chunks = []

        # Approximate tokens as words * 1.3
        words_per_chunk = int(self.CHUNK_SIZE / 1.3)
        overlap_words = int(self.CHUNK_OVERLAP / 1.3)

        i = 0
        while i < len(words):
            chunk_words = words[i:i + words_per_chunk]
            chunk_text = " ".join(chunk_words)

            chunks.append(TranscriptChunk(
                id=str(uuid.uuid4()),
                text=chunk_text,
                meeting_id=meeting_id,
                company_id=company_id,
                contact_ids=contact_ids,
                date=date
            ))

            i += words_per_chunk - overlap_words

        return chunks

    async def _extract_topics(self, text: str) -> List[str]:
        """Extract main topics from text"""
        if not self.llm:
            return ["general"]

        try:
            prompt = self.TOPIC_EXTRACTION_PROMPT.format(text=text[:1000])
            response = await self.llm.chat_async([
                {"role": "user", "content": prompt}
            ])
            return [t.strip() for t in response.split(",")]
        except Exception:
            return ["general"]

    async def _analyze_sentiment(self, text: str) -> str:
        """Analyze sentiment of text"""
        if not self.llm:
            return "neutral"

        try:
            response = await self.llm.chat_async([
                {"role": "user", "content": f"Classify the sentiment of this text as positive, negative, or neutral. Reply with just one word.\n\nText: {text[:500]}"}
            ])
            sentiment = response.strip().lower()
            if sentiment in ["positive", "negative", "neutral"]:
                return sentiment
            return "neutral"
        except Exception:
            return "neutral"

    async def _embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for texts"""
        if not self.llm:
            return []

        try:
            embeddings = await self.llm.embeddings_async(texts)
            return embeddings
        except Exception:
            return []

    async def _index_insights(self, insights: List[Insight]):
        """Index insights to Qdrant"""
        if not self.qdrant or not insights:
            return

        # Generate embeddings for insight content
        embeddings = await self._embed_texts([i.content for i in insights])
        if not embeddings:
            return

        points = [
            PointStruct(
                id=insight.id,
                vector=emb,
                payload={
                    "type": insight.type.value,
                    "content": insight.content,
                    "quote": insight.quote,
                    "company_id": insight.company_id,
                    "contact_id": insight.contact_id,
                    "meeting_id": insight.meeting_id,
                    "confidence": insight.confidence,
                    "created_at": insight.created_at.isoformat()
                }
            )
            for insight, emb in zip(insights, embeddings)
        ]

        self.qdrant.upsert(
            collection_name=self.INSIGHTS_COLLECTION,
            points=points
        )

    async def _update_knowledge_graph(
        self,
        meeting_id: str,
        company_id: str,
        contact_ids: List[str],
        insights: List[Insight]
    ):
        """Update Neo4j knowledge graph with meeting data"""
        if not self.neo4j_driver:
            return

        with self.neo4j_driver.session() as session:
            # Create meeting node
            session.run("""
                MERGE (m:Meeting {id: $meeting_id})
                SET m.company_id = $company_id,
                    m.indexed_at = datetime()
            """, meeting_id=meeting_id, company_id=company_id)

            # Link to company
            session.run("""
                MATCH (m:Meeting {id: $meeting_id})
                MATCH (c:Company {id: $company_id})
                MERGE (m)-[:ABOUT]->(c)
            """, meeting_id=meeting_id, company_id=company_id)

            # Link to contacts
            for contact_id in contact_ids:
                session.run("""
                    MATCH (m:Meeting {id: $meeting_id})
                    MATCH (p:Person {id: $contact_id})
                    MERGE (p)-[:ATTENDED]->(m)
                """, meeting_id=meeting_id, contact_id=contact_id)

            # Create insight nodes
            for insight in insights:
                session.run("""
                    MERGE (i:Insight {id: $insight_id})
                    SET i.type = $type,
                        i.content = $content,
                        i.confidence = $confidence,
                        i.created_at = datetime()
                    WITH i
                    MATCH (m:Meeting {id: $meeting_id})
                    MERGE (m)-[:GENERATED]->(i)
                    WITH i
                    MATCH (c:Company {id: $company_id})
                    MERGE (i)-[:ABOUT]->(c)
                """,
                    insight_id=insight.id,
                    type=insight.type.value,
                    content=insight.content,
                    confidence=insight.confidence,
                    meeting_id=meeting_id,
                    company_id=company_id
                )

    def _parse_insights_response(
        self,
        response: str,
        company_id: str,
        meeting_id: Optional[str]
    ) -> List[Insight]:
        """Parse AI response into Insight objects"""
        insights = []

        try:
            import json
            data = json.loads(response)
            for item in data.get("insights", []):
                insight_type = item.get("type", "pain_point")
                if insight_type in [t.value for t in InsightType]:
                    insights.append(Insight(
                        type=InsightType(insight_type),
                        content=item.get("content", ""),
                        quote=item.get("quote"),
                        company_id=company_id,
                        meeting_id=meeting_id,
                        confidence=float(item.get("confidence", 0.7)),
                        actionability=item.get("actionability")
                    ))
        except (json.JSONDecodeError, KeyError):
            pass

        return insights

    # ─────────────────────────────────────────────────────────────
    # Mock Data Generation
    # ─────────────────────────────────────────────────────────────

    def _generate_mock_insights(
        self,
        company_id: str,
        meeting_id: Optional[str]
    ) -> List[Insight]:
        """Generate mock insights for testing"""
        return [
            Insight(
                type=InsightType.BUYING_SIGNAL,
                content="Mentioned Q1 budget allocation for sales tools",
                company_id=company_id,
                meeting_id=meeting_id,
                confidence=0.92
            ),
            Insight(
                type=InsightType.PAIN_POINT,
                content="Struggling with manual data entry taking 3+ hours daily",
                company_id=company_id,
                meeting_id=meeting_id,
                confidence=0.88
            )
        ]

    def _generate_mock_search_result(self, query: str) -> SearchResult:
        """Generate mock search result"""
        return SearchResult(
            chunks=[
                TranscriptChunk(
                    text=f"Sample transcript mentioning {query}...",
                    meeting_id="m1",
                    company_id="c1",
                    topics=["sales", "implementation"]
                )
            ],
            insights=[
                Insight(
                    type=InsightType.PAIN_POINT,
                    content=f"Related to {query}: Customer facing challenges",
                    company_id="c1",
                    confidence=0.85
                )
            ],
            total_count=2
        )

    def _generate_mock_company_knowledge(self, company_id: str) -> Dict[str, Any]:
        """Generate mock company knowledge"""
        return {
            "company_id": company_id,
            "transcript_count": 5,
            "insight_count": 12,
            "recent_insights": [
                {"type": "buying_signal", "content": "Budget approved for Q1"},
                {"type": "pain_point", "content": "Manual processes slowing down team"}
            ],
            "top_topics": ["pricing", "integration", "support", "implementation"]
        }

    def _generate_mock_content(self, content_type: str, topic: str) -> Dict[str, Any]:
        """Generate mock content"""
        return {
            "type": content_type,
            "topic": topic,
            "content": f"# {topic}\n\nThis is a generated {content_type} about {topic}...",
            "source_chunks": 10,
            "source_insights": 5,
            "generated_at": datetime.now().isoformat()
        }
