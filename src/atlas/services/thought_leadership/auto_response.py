# src/atlas/services/thought_leadership/auto_response.py
"""
Auto-Response Agent - AI-powered message response system.

Capabilities:
- Message intent classification
- Knowledge-based response generation
- Confidence scoring
- Tone matching based on AE's style
- Auto-send, draft, or escalate routing
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import uuid
import os

try:
    from atlas.services.ai_agent.mistral_client import MistralClient
except ImportError:
    MistralClient = None

try:
    from atlas.services.thought_leadership.knowledge_engine import KnowledgeEngine
except ImportError:
    KnowledgeEngine = None


class MessageChannel(str, Enum):
    """Supported message channels"""
    EMAIL = "email"
    LINKEDIN = "linkedin"
    SLACK = "slack"
    WHATSAPP = "whatsapp"


class MessageIntent(str, Enum):
    """Classified message intents"""
    QUESTION = "question"
    REQUEST = "request"
    FOLLOW_UP = "follow_up"
    OBJECTION = "objection"
    SCHEDULING = "scheduling"
    DOCUMENT_REQUEST = "document_request"
    PRICING_INQUIRY = "pricing_inquiry"
    GENERAL = "general"
    URGENT = "urgent"


class ResponseAction(str, Enum):
    """Possible actions for a response"""
    AUTO_SEND = "auto_send"
    DRAFT_FOR_REVIEW = "draft_for_review"
    ESCALATE = "escalate"


@dataclass
class IncomingMessage:
    """Incoming message from any channel"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    channel: MessageChannel = MessageChannel.EMAIL
    sender_email: str = ""
    sender_name: Optional[str] = None
    company_id: Optional[str] = None
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    subject: Optional[str] = None
    content: str = ""
    thread_id: Optional[str] = None
    received_at: datetime = field(default_factory=datetime.now)


@dataclass
class ClassifiedMessage:
    """Message with classified intent"""
    message: IncomingMessage
    intent: MessageIntent
    urgency: str = "normal"  # low, normal, high, urgent
    complexity: str = "simple"  # simple, moderate, complex
    requires_knowledge: bool = False
    key_topics: List[str] = field(default_factory=list)


@dataclass
class SuggestedResponse:
    """AI-generated response suggestion"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    message_id: str = ""
    suggested_text: str = ""
    confidence: float = 0.0
    action: ResponseAction = ResponseAction.DRAFT_FOR_REVIEW
    knowledge_sources: List[str] = field(default_factory=list)
    reasoning: Optional[str] = None
    generated_at: datetime = field(default_factory=datetime.now)


@dataclass
class ToneProfile:
    """AE's learned communication style"""
    ae_id: str = ""
    greeting_style: str = "Professional"
    closing_style: str = "Best regards"
    formality_level: int = 3  # 1-5
    emoji_usage: bool = False
    humor_level: str = "none"  # none, occasional, frequent
    avg_sentence_length: int = 15
    vocabulary_complexity: str = "business-professional"
    personal_touches: List[str] = field(default_factory=list)


class AutoResponseAgent:
    """
    AI-powered auto-response agent.

    Routes incoming messages through:
    1. Intent classification
    2. Knowledge base search
    3. Response generation with tone matching
    4. Confidence scoring
    5. Action determination (auto-send, draft, escalate)
    """

    # Confidence thresholds
    AUTO_SEND_THRESHOLD = 0.85
    DRAFT_THRESHOLD = 0.60

    # Intent classification prompt
    INTENT_PROMPT = """Classify the intent of this message.

Message:
From: {sender_name} ({sender_email})
Subject: {subject}
Content: {content}

Classify into one of these intents:
- question: Asking for information
- request: Asking for action
- follow_up: Continuing previous conversation
- objection: Expressing concern or hesitation
- scheduling: About meeting times
- document_request: Asking for materials
- pricing_inquiry: About pricing or costs
- urgent: Time-sensitive matter
- general: General correspondence

Also assess:
- Urgency: low, normal, high, urgent
- Complexity: simple, moderate, complex
- Key topics mentioned

Respond in JSON format with fields: intent, urgency, complexity, topics"""

    # Response generation prompt
    RESPONSE_PROMPT = """Generate a response to this message using the provided context.

Original Message:
From: {sender_name}
Subject: {subject}
Content: {content}

Intent: {intent}

Relevant Knowledge:
{knowledge_context}

Tone Guidelines:
- Formality: {formality_level}/5
- Greeting style: {greeting_style}
- Closing style: {closing_style}
- {tone_notes}

Generate a helpful, professional response that:
1. Directly addresses the sender's intent
2. Uses information from the knowledge context when relevant
3. Matches the specified tone
4. Includes clear next steps if applicable

Do not include a greeting or closing - I'll add those based on the tone profile."""

    CONFIDENCE_PROMPT = """Rate the quality and appropriateness of this response.

Original message: {original}
Generated response: {response}
Intent: {intent}
Knowledge sources available: {has_knowledge}

Rate confidence from 0.0 to 1.0 based on:
- Relevance to the question (0.3 weight)
- Accuracy of information (0.3 weight)
- Appropriateness of tone (0.2 weight)
- Completeness of answer (0.2 weight)

Reply with just the confidence score as a decimal number."""

    def __init__(
        self,
        mistral_api_key: Optional[str] = None,
        knowledge_engine: Optional['KnowledgeEngine'] = None,
        neo4j_driver=None
    ):
        """
        Initialize the Auto-Response Agent.

        Args:
            mistral_api_key: Mistral AI API key
            knowledge_engine: KnowledgeEngine instance for context
            neo4j_driver: Neo4j driver for contact/deal lookup
        """
        self.mistral_api_key = mistral_api_key or os.getenv("MISTRAL_API_KEY")
        self.knowledge_engine = knowledge_engine
        self.neo4j_driver = neo4j_driver

        # Initialize Mistral client
        if MistralClient and self.mistral_api_key:
            self.llm = MistralClient(api_key=self.mistral_api_key)
        else:
            self.llm = None

        # Cache for tone profiles
        self._tone_cache: Dict[str, ToneProfile] = {}

    async def process_message(
        self,
        message: IncomingMessage,
        ae_id: str
    ) -> SuggestedResponse:
        """
        Process incoming message and generate response suggestion.

        Args:
            message: Incoming message to process
            ae_id: Account Executive ID for tone matching

        Returns:
            SuggestedResponse with suggested text and action
        """
        # 1. Classify intent
        classified = await self.classify_intent(message)

        # 2. Get contact/deal context
        context = await self._get_message_context(message)

        # 3. Search knowledge base
        knowledge = []
        if classified.requires_knowledge and self.knowledge_engine:
            search_results = await self.knowledge_engine.search(
                query=message.content,
                company_id=message.company_id,
                limit=5
            )
            knowledge = [
                {"type": "transcript", "content": c.text}
                for c in search_results.chunks
            ] + [
                {"type": "insight", "content": f"{i.type.value}: {i.content}"}
                for i in search_results.insights
            ]

        # 4. Get AE's tone profile
        tone = await self.get_tone_profile(ae_id)

        # 5. Generate response
        response_text = await self.generate_response(
            message=message,
            classified=classified,
            context=context,
            knowledge=knowledge,
            tone=tone
        )

        # 6. Score confidence
        confidence = await self.score_confidence(
            message=message,
            response=response_text,
            classified=classified,
            has_knowledge=len(knowledge) > 0
        )

        # 7. Determine action
        action = self._determine_action(confidence, classified)

        return SuggestedResponse(
            message_id=message.id,
            suggested_text=response_text,
            confidence=confidence,
            action=action,
            knowledge_sources=[k.get("type", "unknown") for k in knowledge],
            reasoning=f"Intent: {classified.intent.value}, Confidence: {confidence:.2f}"
        )

    async def classify_intent(self, message: IncomingMessage) -> ClassifiedMessage:
        """
        Classify message intent and complexity.

        Args:
            message: Incoming message

        Returns:
            ClassifiedMessage with intent analysis
        """
        if not self.llm:
            return self._classify_mock(message)

        prompt = self.INTENT_PROMPT.format(
            sender_name=message.sender_name or message.sender_email,
            sender_email=message.sender_email,
            subject=message.subject or "(No subject)",
            content=message.content[:1000]
        )

        try:
            response = await self.llm.chat_async([
                {"role": "user", "content": prompt}
            ])

            # Parse JSON response
            import json
            data = json.loads(response)

            intent = MessageIntent(data.get("intent", "general"))
            urgency = data.get("urgency", "normal")
            complexity = data.get("complexity", "simple")
            topics = data.get("topics", [])

            return ClassifiedMessage(
                message=message,
                intent=intent,
                urgency=urgency,
                complexity=complexity,
                requires_knowledge=intent in [
                    MessageIntent.QUESTION,
                    MessageIntent.PRICING_INQUIRY,
                    MessageIntent.DOCUMENT_REQUEST
                ],
                key_topics=topics
            )
        except Exception:
            return self._classify_mock(message)

    async def generate_response(
        self,
        message: IncomingMessage,
        classified: ClassifiedMessage,
        context: Dict[str, Any],
        knowledge: List[Dict[str, Any]],
        tone: ToneProfile
    ) -> str:
        """
        Generate response text using AI.

        Args:
            message: Original message
            classified: Classified message with intent
            context: Contact/deal context
            knowledge: Relevant knowledge from KB
            tone: AE's tone profile

        Returns:
            Generated response text
        """
        if not self.llm:
            return self._generate_mock_response(message, classified, tone)

        # Format knowledge context
        knowledge_context = "\n".join([
            f"- {k['type']}: {k['content'][:200]}"
            for k in knowledge[:5]
        ]) or "No specific knowledge available."

        # Tone notes
        tone_notes = ""
        if tone.emoji_usage:
            tone_notes += "May use occasional emojis. "
        if tone.humor_level != "none":
            tone_notes += f"Light humor is acceptable ({tone.humor_level}). "

        prompt = self.RESPONSE_PROMPT.format(
            sender_name=message.sender_name or message.sender_email.split("@")[0],
            subject=message.subject or "(No subject)",
            content=message.content,
            intent=classified.intent.value,
            knowledge_context=knowledge_context,
            formality_level=tone.formality_level,
            greeting_style=tone.greeting_style,
            closing_style=tone.closing_style,
            tone_notes=tone_notes
        )

        try:
            response_body = await self.llm.chat_async([
                {"role": "user", "content": prompt}
            ])

            # Add greeting and closing based on tone
            sender_first_name = (message.sender_name or message.sender_email.split("@")[0]).split()[0]

            if tone.formality_level >= 4:
                greeting = f"Dear {sender_first_name},"
            else:
                greeting = f"Hi {sender_first_name},"

            full_response = f"{greeting}\n\n{response_body.strip()}\n\n{tone.closing_style}"

            return full_response
        except Exception as e:
            return self._generate_mock_response(message, classified, tone)

    async def score_confidence(
        self,
        message: IncomingMessage,
        response: str,
        classified: ClassifiedMessage,
        has_knowledge: bool
    ) -> float:
        """
        Score confidence in generated response.

        Args:
            message: Original message
            response: Generated response
            classified: Classified message
            has_knowledge: Whether KB was used

        Returns:
            Confidence score 0.0-1.0
        """
        if not self.llm:
            # Heuristic scoring without LLM
            base_score = 0.7

            # Adjust based on complexity
            if classified.complexity == "simple":
                base_score += 0.15
            elif classified.complexity == "complex":
                base_score -= 0.15

            # Adjust based on knowledge
            if has_knowledge:
                base_score += 0.1

            # Adjust based on intent
            if classified.intent in [MessageIntent.SCHEDULING, MessageIntent.GENERAL]:
                base_score += 0.1
            elif classified.intent in [MessageIntent.PRICING_INQUIRY, MessageIntent.URGENT]:
                base_score -= 0.1

            return min(max(base_score, 0.0), 1.0)

        prompt = self.CONFIDENCE_PROMPT.format(
            original=message.content[:500],
            response=response[:500],
            intent=classified.intent.value,
            has_knowledge="Yes" if has_knowledge else "No"
        )

        try:
            score_str = await self.llm.chat_async([
                {"role": "user", "content": prompt}
            ])
            return float(score_str.strip())
        except Exception:
            return 0.7

    async def get_tone_profile(self, ae_id: str) -> ToneProfile:
        """
        Get or create tone profile for an AE.

        Args:
            ae_id: Account Executive ID

        Returns:
            ToneProfile for the AE
        """
        if ae_id in self._tone_cache:
            return self._tone_cache[ae_id]

        # Try to load from database
        if self.neo4j_driver:
            with self.neo4j_driver.session() as session:
                result = session.run("""
                    MATCH (u:User {id: $ae_id})-[:HAS_TONE_PROFILE]->(t:ToneProfile)
                    RETURN t {.*} as profile
                """, ae_id=ae_id).single()

                if result:
                    profile_data = result["profile"]
                    profile = ToneProfile(
                        ae_id=ae_id,
                        greeting_style=profile_data.get("greeting_style", "Hi"),
                        closing_style=profile_data.get("closing_style", "Best"),
                        formality_level=profile_data.get("formality_level", 3),
                        emoji_usage=profile_data.get("emoji_usage", False),
                        humor_level=profile_data.get("humor_level", "none"),
                        avg_sentence_length=profile_data.get("avg_sentence_length", 15),
                        vocabulary_complexity=profile_data.get("vocabulary_complexity", "professional"),
                        personal_touches=profile_data.get("personal_touches", [])
                    )
                    self._tone_cache[ae_id] = profile
                    return profile

        # Return default profile
        default = ToneProfile(ae_id=ae_id)
        self._tone_cache[ae_id] = default
        return default

    async def learn_tone(self, ae_id: str, sent_messages: List[Dict[str, str]]) -> ToneProfile:
        """
        Learn tone profile from AE's sent messages.

        Args:
            ae_id: Account Executive ID
            sent_messages: List of sent messages with 'subject' and 'body'

        Returns:
            Updated ToneProfile
        """
        if not self.llm or not sent_messages:
            return await self.get_tone_profile(ae_id)

        # Analyze messages
        sample_texts = "\n---\n".join([
            f"Subject: {m.get('subject', '')}\n{m.get('body', '')}"
            for m in sent_messages[:20]
        ])

        prompt = f"""Analyze these email samples and extract the writing style characteristics.

Emails:
{sample_texts}

Identify:
1. Greeting style (e.g., "Hi", "Dear", "Hello")
2. Closing style (e.g., "Best", "Thanks", "Cheers")
3. Formality level (1-5, where 1=very casual, 5=very formal)
4. Emoji usage (true/false)
5. Humor level (none, occasional, frequent)
6. Average sentence length (words)
7. Vocabulary complexity (simple, professional, technical)
8. Personal touches (list of patterns)

Respond in JSON format."""

        try:
            response = await self.llm.chat_async([
                {"role": "user", "content": prompt}
            ])

            import json
            data = json.loads(response)

            profile = ToneProfile(
                ae_id=ae_id,
                greeting_style=data.get("greeting_style", "Hi"),
                closing_style=data.get("closing_style", "Best"),
                formality_level=data.get("formality_level", 3),
                emoji_usage=data.get("emoji_usage", False),
                humor_level=data.get("humor_level", "none"),
                avg_sentence_length=data.get("avg_sentence_length", 15),
                vocabulary_complexity=data.get("vocabulary_complexity", "professional"),
                personal_touches=data.get("personal_touches", [])
            )

            # Cache and store
            self._tone_cache[ae_id] = profile
            await self._store_tone_profile(ae_id, profile)

            return profile
        except Exception:
            return await self.get_tone_profile(ae_id)

    # ─────────────────────────────────────────────────────────────
    # Private Helper Methods
    # ─────────────────────────────────────────────────────────────

    def _determine_action(
        self,
        confidence: float,
        classified: ClassifiedMessage
    ) -> ResponseAction:
        """Determine response action based on confidence and intent"""
        # Never auto-send urgent or complex messages
        if classified.urgency == "urgent" or classified.complexity == "complex":
            return ResponseAction.DRAFT_FOR_REVIEW

        # Escalate pricing inquiries for review
        if classified.intent == MessageIntent.PRICING_INQUIRY:
            return ResponseAction.DRAFT_FOR_REVIEW

        # Auto-send if high confidence
        if confidence >= self.AUTO_SEND_THRESHOLD:
            return ResponseAction.AUTO_SEND

        # Draft for review if moderate confidence
        if confidence >= self.DRAFT_THRESHOLD:
            return ResponseAction.DRAFT_FOR_REVIEW

        # Escalate if low confidence
        return ResponseAction.ESCALATE

    async def _get_message_context(self, message: IncomingMessage) -> Dict[str, Any]:
        """Get context about message sender and related deal"""
        context = {
            "sender": message.sender_name or message.sender_email,
            "company": None,
            "deal": None
        }

        if not self.neo4j_driver:
            return context

        with self.neo4j_driver.session() as session:
            # Get contact and company info
            if message.contact_id:
                result = session.run("""
                    MATCH (p:Person {id: $contact_id})
                    OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
                    OPTIONAL MATCH (c)-[:HAS_DEAL]->(d:Deal)
                    RETURN p {.*} as person, c {.*} as company, d {.*} as deal
                """, contact_id=message.contact_id).single()

                if result:
                    context["sender"] = result["person"]
                    context["company"] = result["company"]
                    context["deal"] = result["deal"]

        return context

    async def _store_tone_profile(self, ae_id: str, profile: ToneProfile):
        """Store tone profile in database"""
        if not self.neo4j_driver:
            return

        with self.neo4j_driver.session() as session:
            session.run("""
                MATCH (u:User {id: $ae_id})
                MERGE (u)-[:HAS_TONE_PROFILE]->(t:ToneProfile)
                SET t.greeting_style = $greeting_style,
                    t.closing_style = $closing_style,
                    t.formality_level = $formality_level,
                    t.emoji_usage = $emoji_usage,
                    t.humor_level = $humor_level,
                    t.avg_sentence_length = $avg_sentence_length,
                    t.vocabulary_complexity = $vocabulary_complexity,
                    t.personal_touches = $personal_touches,
                    t.learned_at = datetime()
            """,
                ae_id=ae_id,
                greeting_style=profile.greeting_style,
                closing_style=profile.closing_style,
                formality_level=profile.formality_level,
                emoji_usage=profile.emoji_usage,
                humor_level=profile.humor_level,
                avg_sentence_length=profile.avg_sentence_length,
                vocabulary_complexity=profile.vocabulary_complexity,
                personal_touches=profile.personal_touches
            )

    # ─────────────────────────────────────────────────────────────
    # Mock Methods for Testing
    # ─────────────────────────────────────────────────────────────

    def _classify_mock(self, message: IncomingMessage) -> ClassifiedMessage:
        """Mock intent classification"""
        content_lower = message.content.lower()

        if "?" in message.content:
            intent = MessageIntent.QUESTION
        elif "pricing" in content_lower or "cost" in content_lower:
            intent = MessageIntent.PRICING_INQUIRY
        elif "meeting" in content_lower or "schedule" in content_lower:
            intent = MessageIntent.SCHEDULING
        elif "urgent" in content_lower or "asap" in content_lower:
            intent = MessageIntent.URGENT
        else:
            intent = MessageIntent.GENERAL

        return ClassifiedMessage(
            message=message,
            intent=intent,
            urgency="normal",
            complexity="simple",
            requires_knowledge=intent == MessageIntent.QUESTION
        )

    def _generate_mock_response(
        self,
        message: IncomingMessage,
        classified: ClassifiedMessage,
        tone: ToneProfile
    ) -> str:
        """Generate mock response"""
        sender_name = (message.sender_name or message.sender_email.split("@")[0]).split()[0]

        if classified.intent == MessageIntent.SCHEDULING:
            body = "I'd be happy to schedule some time to connect. What times work best for you this week?"
        elif classified.intent == MessageIntent.QUESTION:
            body = "Thank you for your question. Let me look into this and get back to you with a detailed response."
        elif classified.intent == MessageIntent.PRICING_INQUIRY:
            body = "I'd be happy to discuss pricing with you. Our packages are tailored to each organization's needs. Could we schedule a quick call to understand your requirements better?"
        else:
            body = "Thank you for reaching out. I'll review your message and get back to you shortly."

        greeting = "Hi" if tone.formality_level < 4 else "Dear"
        return f"{greeting} {sender_name},\n\n{body}\n\n{tone.closing_style}"
