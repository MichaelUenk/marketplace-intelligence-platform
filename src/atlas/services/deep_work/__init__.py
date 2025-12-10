"""
Intelligence & Deep Work Module

This module implements the learning flywheel system where:
1. AI agents make decisions and log their reasoning (Reasoning Chunks)
2. Outcomes are tracked (did the signal lead to a deal?)
3. Humans review and validate reasoning weekly ("Week Work Wednesday")
4. Validated learnings feed back into the AI, improving future decisions

Components:
- deep_work_types: Type definitions for reasoning chunks, knowledge entries, etc.
- reasoning_chunks: Service for logging and retrieving AI reasoning
- knowledge_base: Service for storing and retrieving validated learnings
- week_work: Service for managing Week Work Wednesday sessions
- chat_service: Claude API integration for conversational AI
- whisper_service: Audio transcription via OpenAI Whisper
"""

from .deep_work_types import (
    ReasoningChunkType,
    ReviewStatus,
    OutcomeStatus,
    KnowledgeType,
    KnowledgeStatus,
    PatternRuleStatus,
    SessionPhase,
    ReasoningChunk,
    KnowledgeEntry,
    PatternRule,
    WeekWorkSession,
    SessionReviewItem,
    ChatMessage,
    ChatSession,
)

from .reasoning_chunks import ReasoningChunkService
from .knowledge_base import KnowledgeBaseService
from .week_work import WeekWorkService
from .chat_service import ChatService
from .whisper_service import WhisperService
from .vector_service import VectorService, get_vector_service

__all__ = [
    # Types
    "ReasoningChunkType",
    "ReviewStatus",
    "OutcomeStatus",
    "KnowledgeType",
    "KnowledgeStatus",
    "PatternRuleStatus",
    "SessionPhase",
    "ReasoningChunk",
    "KnowledgeEntry",
    "PatternRule",
    "WeekWorkSession",
    "SessionReviewItem",
    "ChatMessage",
    "ChatSession",
    # Services
    "ReasoningChunkService",
    "KnowledgeBaseService",
    "WeekWorkService",
    "ChatService",
    "WhisperService",
    "VectorService",
    "get_vector_service",
]
