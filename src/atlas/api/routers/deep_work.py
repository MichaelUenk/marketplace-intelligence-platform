"""
Deep Work API Router

API endpoints for the Intelligence & Deep Work module including:
- Reasoning Chunks management
- Knowledge Base operations
- Week Work Wednesday sessions
- AI Chat with Claude
- Audio transcription with Whisper
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Any
from datetime import datetime

from atlas.services.deep_work import (
    ReasoningChunkService,
    KnowledgeBaseService,
    WeekWorkService,
    ChatService,
    WhisperService,
    ReasoningChunkType,
    ReviewStatus,
    OutcomeStatus,
    KnowledgeType,
    KnowledgeStatus,
    PatternRuleStatus,
    SessionPhase,
    get_vector_service,
)

router = APIRouter(prefix="/deep-work", tags=["deep-work"])

# Initialize services (in production, use dependency injection)
reasoning_service = ReasoningChunkService()
knowledge_service = KnowledgeBaseService()
week_work_service = WeekWorkService(reasoning_service, knowledge_service)
chat_service = ChatService(reasoning_service, knowledge_service)
whisper_service = WhisperService()


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateReasoningChunkRequest(BaseModel):
    agent: str
    type: str
    decision_action: str
    decision_result: str
    decision_confidence: float
    input_context: dict
    reasoning_chain: list[dict]
    alternatives_considered: list[dict] | None = None
    uncertainties: list[str] | None = None
    retrieved_knowledge: list[str] | None = None
    signal_id: str | None = None
    company_id: str | None = None
    deal_id: str | None = None


class ReviewChunkRequest(BaseModel):
    status: str  # validated, corrected, rejected
    notes: str = ""
    correction: dict | None = None
    learning: str | None = None


class CloseOutcomeRequest(BaseModel):
    status: str  # deal_won, deal_lost, no_action, in_progress
    value: float | None = None
    notes: str = ""


class CreateKnowledgeEntryRequest(BaseModel):
    type: str
    title: str
    content: str
    applies_to_companies: list[str] | None = None
    applies_to_signal_types: list[str] | None = None
    applies_to_categories: list[str] | None = None


class UpdateKnowledgeEntryRequest(BaseModel):
    title: str | None = None
    content: str | None = None
    status: str | None = None


class CreatePatternRequest(BaseModel):
    name: str
    description: str
    condition: dict
    action: dict
    supporting_signals: int = 0


class ValidatePatternRequest(BaseModel):
    action: str  # validate, reject, modify
    modified_rule: dict | None = None


class CreateChatSessionRequest(BaseModel):
    session_type: str = "general"
    week_work_session_id: str | None = None


class SendMessageRequest(BaseModel):
    content: str
    chunk_id: str | None = None
    audio_transcript: str | None = None


class AddSessionNoteRequest(BaseModel):
    note: str


class AddActionItemRequest(BaseModel):
    task: str
    assignee: str
    due_date: str | None = None


# =============================================================================
# REASONING CHUNKS ENDPOINTS
# =============================================================================

@router.get("/reasoning-chunks")
def get_reasoning_chunks(
    agent: str | None = None,
    type: str | None = None,
    review_status: str | None = None,
    flagged_only: bool = False,
    company_id: str | None = None,
    signal_id: str | None = None,
    deal_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """Get reasoning chunks with optional filters"""
    chunk_type = ReasoningChunkType(type) if type else None
    status = ReviewStatus(review_status) if review_status else None

    chunks = reasoning_service.get_chunks(
        agent=agent,
        chunk_type=chunk_type,
        review_status=status,
        flagged_only=flagged_only,
        company_id=company_id,
        signal_id=signal_id,
        deal_id=deal_id,
        limit=limit,
        offset=offset,
    )

    return {
        "chunks": [c.to_dict() for c in chunks],
        "count": len(chunks),
    }


@router.get("/reasoning-chunks/flagged")
def get_flagged_chunks(limit: int = 20):
    """Get chunks flagged for human review"""
    chunks = reasoning_service.get_flagged_for_review(limit=limit)
    return {
        "chunks": [c.to_dict() for c in chunks],
        "count": len(chunks),
    }


@router.get("/reasoning-chunks/pending-outcomes")
def get_pending_outcomes(limit: int = 20):
    """Get chunks with pending outcomes"""
    chunks = reasoning_service.get_pending_outcomes(limit=limit)
    return {
        "chunks": [c.to_dict() for c in chunks],
        "count": len(chunks),
    }


@router.get("/reasoning-chunks/stats")
def get_reasoning_stats(days: int = 7):
    """Get reasoning chunk statistics"""
    return reasoning_service.get_stats(days=days)


@router.get("/reasoning-chunks/{chunk_id}")
def get_reasoning_chunk(chunk_id: str):
    """Get a specific reasoning chunk"""
    chunk = reasoning_service.get_chunk(chunk_id)
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return chunk.to_dict()


@router.post("/reasoning-chunks")
def create_reasoning_chunk(request: CreateReasoningChunkRequest):
    """Create a new reasoning chunk"""
    chunk_type = ReasoningChunkType(request.type)

    chunk = reasoning_service.create_chunk(
        agent=request.agent,
        chunk_type=chunk_type,
        decision_action=request.decision_action,
        decision_result=request.decision_result,
        decision_confidence=request.decision_confidence,
        input_context=request.input_context,
        reasoning_chain=request.reasoning_chain,
        alternatives_considered=request.alternatives_considered,
        uncertainties=request.uncertainties,
        retrieved_knowledge=request.retrieved_knowledge,
        signal_id=request.signal_id,
        company_id=request.company_id,
        deal_id=request.deal_id,
    )

    return chunk.to_dict()


@router.post("/reasoning-chunks/{chunk_id}/review")
def review_chunk(chunk_id: str, request: ReviewChunkRequest, user_id: str = "user_default"):
    """Review a reasoning chunk"""
    status = ReviewStatus(request.status)

    chunk = reasoning_service.review_chunk(
        chunk_id=chunk_id,
        status=status,
        reviewed_by=user_id,
        notes=request.notes,
        correction=request.correction,
    )

    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")

    return chunk.to_dict()


@router.post("/reasoning-chunks/{chunk_id}/close-outcome")
def close_chunk_outcome(chunk_id: str, request: CloseOutcomeRequest):
    """Close the outcome for a reasoning chunk"""
    status = OutcomeStatus(request.status)

    chunk = reasoning_service.close_outcome(
        chunk_id=chunk_id,
        status=status,
        value=request.value,
        notes=request.notes,
    )

    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")

    return chunk.to_dict()


@router.get("/reasoning-chunks/search/{query}")
def search_reasoning_chunks(query: str, limit: int = 5):
    """Search for similar reasoning chunks"""
    chunks = reasoning_service.search_similar(query, limit=limit)
    return {
        "chunks": [c.to_dict() for c in chunks],
        "count": len(chunks),
    }


# =============================================================================
# KNOWLEDGE BASE ENDPOINTS
# =============================================================================

@router.get("/knowledge-base")
def get_knowledge_entries(
    type: str | None = None,
    status: str | None = None,
    company_id: str | None = None,
    signal_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """Get knowledge entries with optional filters"""
    entry_type = KnowledgeType(type) if type else None
    entry_status = KnowledgeStatus(status) if status else None

    entries = knowledge_service.get_entries(
        entry_type=entry_type,
        status=entry_status,
        company_id=company_id,
        signal_type=signal_type,
        limit=limit,
        offset=offset,
    )

    return {
        "entries": [e.to_dict() for e in entries],
        "count": len(entries),
    }


@router.get("/knowledge-base/stats")
def get_knowledge_stats():
    """Get knowledge base statistics"""
    return knowledge_service.get_stats()


@router.get("/knowledge-base/{entry_id}")
def get_knowledge_entry(entry_id: str):
    """Get a specific knowledge entry"""
    entry = knowledge_service.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry.to_dict()


@router.post("/knowledge-base")
def create_knowledge_entry(request: CreateKnowledgeEntryRequest, user_id: str = "user_default"):
    """Create a new knowledge entry"""
    entry_type = KnowledgeType(request.type)

    entry = knowledge_service.create_entry(
        entry_type=entry_type,
        title=request.title,
        content=request.content,
        source_type="human_input",
        validated_by=user_id,
        applies_to_companies=request.applies_to_companies,
        applies_to_signal_types=request.applies_to_signal_types,
        applies_to_categories=request.applies_to_categories,
    )

    return entry.to_dict()


@router.put("/knowledge-base/{entry_id}")
def update_knowledge_entry(entry_id: str, request: UpdateKnowledgeEntryRequest):
    """Update a knowledge entry"""
    status = KnowledgeStatus(request.status) if request.status else None

    entry = knowledge_service.update_entry(
        entry_id=entry_id,
        title=request.title,
        content=request.content,
        status=status,
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    return entry.to_dict()


@router.get("/knowledge-base/search/{query}")
def search_knowledge_base(query: str, limit: int = 5):
    """Search knowledge base entries"""
    entries = knowledge_service.search(query, limit=limit)
    return {
        "entries": [e.to_dict() for e in entries],
        "count": len(entries),
    }


@router.get("/knowledge-base/context")
def get_knowledge_context(
    company_id: str | None = None,
    signal_type: str | None = None,
    query_text: str | None = None,
):
    """Get relevant context for an AI decision"""
    return knowledge_service.get_context_for_decision(
        company_id=company_id,
        signal_type=signal_type,
        query_text=query_text,
    )


# =============================================================================
# PATTERN RULES ENDPOINTS
# =============================================================================

@router.get("/patterns")
def get_patterns(status: str | None = None, limit: int = 50):
    """Get pattern rules"""
    pattern_status = PatternRuleStatus(status) if status else None
    patterns = knowledge_service.get_patterns(status=pattern_status, limit=limit)
    return {
        "patterns": [p.to_dict() for p in patterns],
        "count": len(patterns),
    }


@router.get("/patterns/{pattern_id}")
def get_pattern(pattern_id: str):
    """Get a specific pattern rule"""
    pattern = knowledge_service.get_pattern(pattern_id)
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    return pattern.to_dict()


@router.post("/patterns")
def create_pattern(request: CreatePatternRequest):
    """Create a new pattern rule (starts as proposed)"""
    pattern = knowledge_service.create_pattern(
        name=request.name,
        description=request.description,
        condition=request.condition,
        action=request.action,
        supporting_signals=request.supporting_signals,
    )
    return pattern.to_dict()


@router.post("/patterns/{pattern_id}/activate")
def activate_pattern(pattern_id: str, user_id: str = "user_default"):
    """Activate a proposed pattern"""
    pattern = knowledge_service.activate_pattern(pattern_id, user_id)
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    return pattern.to_dict()


@router.post("/patterns/{pattern_id}/deactivate")
def deactivate_pattern(pattern_id: str):
    """Deactivate a pattern"""
    pattern = knowledge_service.deactivate_pattern(pattern_id)
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    return pattern.to_dict()


# =============================================================================
# WEEK WORK WEDNESDAY ENDPOINTS
# =============================================================================

@router.get("/week-work/current")
def get_current_session(user_id: str = "user_default"):
    """Get or create the current week's session"""
    session = week_work_service.get_current_session(user_id)
    return session.to_dict()


@router.get("/week-work/sessions")
def get_past_sessions(limit: int = 10):
    """Get past Week Work Wednesday sessions"""
    sessions = week_work_service.get_past_sessions(limit=limit)
    return {
        "sessions": [s.to_dict() for s in sessions],
        "count": len(sessions),
    }


@router.get("/week-work/{session_id}")
def get_session(session_id: str):
    """Get a specific session"""
    session = week_work_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


@router.get("/week-work/{session_id}/summary")
def get_session_summary(session_id: str):
    """Get session summary"""
    summary = week_work_service.get_session_summary(session_id)
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    return summary


@router.post("/week-work/{session_id}/advance-phase")
def advance_session_phase(session_id: str):
    """Advance session to next phase"""
    session = week_work_service.advance_phase(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


@router.post("/week-work/{session_id}/set-phase")
def set_session_phase(session_id: str, phase: str):
    """Set session to specific phase"""
    session_phase = SessionPhase(phase)
    session = week_work_service.set_phase(session_id, session_phase)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


@router.post("/week-work/{session_id}/review-decision")
def review_session_decision(
    session_id: str,
    chunk_id: str,
    request: ReviewChunkRequest,
):
    """Review a decision in the session"""
    result = week_work_service.review_decision(
        session_id=session_id,
        chunk_id=chunk_id,
        status=ReviewStatus(request.status),
        notes=request.notes,
        correction=request.correction,
        learning=request.learning,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/week-work/{session_id}/validate-pattern")
def validate_session_pattern(session_id: str, pattern_id: str, request: ValidatePatternRequest):
    """Validate or reject a pattern in the session"""
    result = week_work_service.validate_pattern(
        session_id=session_id,
        pattern_id=pattern_id,
        action=request.action,
        modified_rule=request.modified_rule,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/week-work/{session_id}/close-outcome")
def close_session_outcome(session_id: str, chunk_id: str, request: CloseOutcomeRequest):
    """Close an outcome in the session"""
    result = week_work_service.close_outcome(
        session_id=session_id,
        chunk_id=chunk_id,
        outcome=OutcomeStatus(request.status),
        value=request.value,
        notes=request.notes,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/week-work/{session_id}/add-note")
def add_session_note(session_id: str, request: AddSessionNoteRequest):
    """Add a note to the session"""
    session = week_work_service.add_note(session_id, request.note)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


@router.post("/week-work/{session_id}/add-action-item")
def add_session_action_item(session_id: str, request: AddActionItemRequest):
    """Add an action item to the session"""
    session = week_work_service.add_action_item(
        session_id=session_id,
        task=request.task,
        assignee=request.assignee,
        due_date=request.due_date,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


@router.post("/week-work/{session_id}/complete")
def complete_session(session_id: str):
    """Mark session as complete"""
    session = week_work_service.complete_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


# =============================================================================
# CHAT ENDPOINTS
# =============================================================================

@router.post("/chat/sessions")
def create_chat_session(request: CreateChatSessionRequest, user_id: str = "user_default"):
    """Create a new chat session"""
    session = chat_service.create_session(
        user_id=user_id,
        session_type=request.session_type,
        week_work_session_id=request.week_work_session_id,
    )
    return session.to_dict()


@router.get("/chat/sessions/{session_id}")
def get_chat_session(session_id: str):
    """Get a chat session"""
    session = chat_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session.to_dict()


@router.get("/chat/sessions/{session_id}/history")
def get_chat_history(session_id: str):
    """Get chat message history"""
    history = chat_service.get_session_history(session_id)
    return {
        "messages": history,
        "count": len(history),
    }


@router.post("/chat/sessions/{session_id}/message")
async def send_chat_message(session_id: str, request: SendMessageRequest):
    """Send a message and get AI response"""
    try:
        response = await chat_service.send_message(
            session_id=session_id,
            content=request.content,
            chunk_id=request.chunk_id,
            audio_transcript=request.audio_transcript,
        )
        return response.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/chat/sessions/{session_id}/end")
def end_chat_session(session_id: str):
    """End a chat session"""
    session = chat_service.end_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session.to_dict()


@router.get("/chat/active-sessions")
def get_active_chat_sessions(user_id: str = "user_default"):
    """Get active chat sessions for a user"""
    sessions = chat_service.get_active_sessions(user_id)
    return {
        "sessions": [s.to_dict() for s in sessions],
        "count": len(sessions),
    }


# =============================================================================
# AUDIO/WHISPER ENDPOINTS
# =============================================================================

@router.post("/audio/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    prompt: str = Form(None),
):
    """Transcribe audio file using Whisper"""
    audio_data = await audio.read()
    result = await whisper_service.transcribe_audio(
        audio_data=audio_data,
        language=language,
        prompt=prompt,
    )
    return result


@router.post("/audio/transcribe-base64")
async def transcribe_audio_base64(
    base64_audio: str,
    language: str = "en",
    prompt: str | None = None,
):
    """Transcribe base64-encoded audio"""
    result = await whisper_service.transcribe_base64(
        base64_audio=base64_audio,
        language=language,
        prompt=prompt,
    )
    return result


@router.get("/audio/history")
def get_transcription_history(limit: int = 20):
    """Get recent transcription history"""
    return {
        "transcriptions": whisper_service.get_transcription_history(limit=limit),
    }


@router.get("/audio/languages")
def get_supported_languages():
    """Get supported languages for transcription"""
    return {
        "languages": whisper_service.get_supported_languages(),
    }


# =============================================================================
# VECTOR SERVICE ENDPOINTS
# =============================================================================

@router.get("/vectors/stats")
def get_vector_stats():
    """Get vector service statistics"""
    vector_service = get_vector_service()
    return vector_service.get_stats()


@router.get("/vectors/search")
def vector_search(
    query: str,
    collection: str = "knowledge",  # "knowledge" or "reasoning"
    limit: int = 5,
    filter_type: str | None = None,
    filter_company: str | None = None,
):
    """
    Perform semantic vector search across knowledge base or reasoning chunks.

    This endpoint uses Qdrant + OpenAI embeddings for semantic similarity search.
    """
    vector_service = get_vector_service()

    if not vector_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Vector service unavailable. Ensure Qdrant and OpenAI are configured.",
        )

    if collection == "knowledge":
        results = vector_service.search_knowledge(
            query=query,
            limit=limit,
            filter_type=filter_type,
            filter_company=filter_company,
        )
    elif collection == "reasoning":
        results = vector_service.find_similar_reasoning(
            query=query,
            limit=limit,
            filter_type=filter_type,
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid collection: {collection}. Use 'knowledge' or 'reasoning'.",
        )

    return {
        "query": query,
        "collection": collection,
        "results": [
            {
                "id": r.id,
                "score": r.score,
                "payload": r.payload,
            }
            for r in results
        ],
    }


@router.get("/vectors/context")
def get_vector_context(
    query: str,
    company_id: str | None = None,
    signal_type: str | None = None,
    include_reasoning: bool = True,
    limit: int = 5,
):
    """
    Get semantically relevant context for an AI decision.

    Combines knowledge base entries and similar reasoning chunks
    based on vector similarity to the query.
    """
    vector_service = get_vector_service()

    context = vector_service.get_relevant_context(
        query=query,
        company_id=company_id,
        signal_type=signal_type,
        include_reasoning=include_reasoning,
        limit=limit,
    )

    return {
        "query": query,
        "context": context,
        "vector_available": vector_service.is_available(),
    }
