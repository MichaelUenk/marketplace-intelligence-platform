"""
Whisper Transcription Service

Integrates with OpenAI Whisper API for audio transcription.
Supports voice input for Week Work Wednesday sessions and chat interactions.
"""

from __future__ import annotations

import os
import uuid
import base64
from datetime import datetime
from typing import BinaryIO
import tempfile


class WhisperService:
    """Service for audio transcription using OpenAI Whisper"""

    def __init__(self):
        self._api_key = os.environ.get("OPENAI_API_KEY")
        self._model = "whisper-1"
        self._transcription_history: list[dict] = []

    async def transcribe_audio(
        self,
        audio_data: bytes | BinaryIO,
        language: str = "en",
        prompt: str | None = None,
    ) -> dict:
        """
        Transcribe audio data using Whisper API.

        Args:
            audio_data: Audio bytes or file-like object
            language: Language code (e.g., 'en', 'nl', 'de')
            prompt: Optional prompt to guide transcription

        Returns:
            Dictionary with transcription result
        """
        transcription_id = f"tr_{str(uuid.uuid4())[:8]}"
        started_at = datetime.now()

        try:
            import openai
        except ImportError:
            # Return mock transcription if openai not installed
            return self._get_mock_transcription(transcription_id, started_at)

        if not self._api_key:
            return self._get_mock_transcription(transcription_id, started_at)

        try:
            client = openai.OpenAI(api_key=self._api_key)

            # Handle bytes vs file-like object
            if isinstance(audio_data, bytes):
                # Write to temp file for API
                with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                    tmp.write(audio_data)
                    tmp_path = tmp.name

                with open(tmp_path, "rb") as audio_file:
                    response = client.audio.transcriptions.create(
                        model=self._model,
                        file=audio_file,
                        language=language,
                        prompt=prompt or "Week Work Wednesday session, reviewing AI decisions for iBood.",
                        response_format="verbose_json",
                    )

                # Clean up temp file
                os.unlink(tmp_path)
            else:
                response = client.audio.transcriptions.create(
                    model=self._model,
                    file=audio_data,
                    language=language,
                    prompt=prompt or "Week Work Wednesday session, reviewing AI decisions for iBood.",
                    response_format="verbose_json",
                )

            result = {
                "id": transcription_id,
                "success": True,
                "text": response.text,
                "language": response.language,
                "duration_seconds": response.duration,
                "segments": [
                    {
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text,
                    }
                    for seg in (response.segments or [])
                ],
                "transcribed_at": datetime.now().isoformat(),
            }

            self._transcription_history.append(result)
            return result

        except Exception as e:
            return {
                "id": transcription_id,
                "success": False,
                "error": str(e),
                "transcribed_at": datetime.now().isoformat(),
            }

    def _get_mock_transcription(
        self,
        transcription_id: str,
        started_at: datetime,
    ) -> dict:
        """Generate mock transcription when Whisper API is not available"""
        mock_texts = [
            "I think this decision looks correct. The reasoning chain is solid and the confidence score matches the evidence we have.",
            "Let's validate this one. The AI correctly identified the inventory surplus signal and the timing recommendation makes sense.",
            "I want to add a correction here. The contact recommendation should include the CFO given the deal size.",
            "Can you show me more details about this pattern? I want to understand why the AI flagged it.",
            "Let's move on to the next decision. I'll mark this one as validated.",
            "This is an interesting insight. I agree we should prioritize inventory signals with year-end mentions.",
        ]

        import random
        mock_text = random.choice(mock_texts)

        result = {
            "id": transcription_id,
            "success": True,
            "text": mock_text,
            "language": "en",
            "duration_seconds": len(mock_text.split()) * 0.4,  # Rough estimate
            "segments": [
                {
                    "start": 0.0,
                    "end": len(mock_text.split()) * 0.4,
                    "text": mock_text,
                }
            ],
            "transcribed_at": datetime.now().isoformat(),
            "is_mock": True,
        }

        self._transcription_history.append(result)
        return result

    async def transcribe_base64(
        self,
        base64_audio: str,
        language: str = "en",
        prompt: str | None = None,
    ) -> dict:
        """
        Transcribe base64-encoded audio data.

        Args:
            base64_audio: Base64-encoded audio string
            language: Language code
            prompt: Optional prompt

        Returns:
            Transcription result
        """
        try:
            audio_bytes = base64.b64decode(base64_audio)
            return await self.transcribe_audio(audio_bytes, language, prompt)
        except Exception as e:
            return {
                "id": f"tr_{str(uuid.uuid4())[:8]}",
                "success": False,
                "error": f"Failed to decode base64 audio: {str(e)}",
                "transcribed_at": datetime.now().isoformat(),
            }

    def get_transcription_history(self, limit: int = 20) -> list[dict]:
        """Get recent transcription history"""
        return self._transcription_history[-limit:]

    def get_supported_languages(self) -> list[dict]:
        """Get list of supported languages"""
        return [
            {"code": "en", "name": "English"},
            {"code": "nl", "name": "Dutch"},
            {"code": "de", "name": "German"},
            {"code": "fr", "name": "French"},
            {"code": "es", "name": "Spanish"},
            {"code": "it", "name": "Italian"},
            {"code": "pt", "name": "Portuguese"},
            {"code": "ja", "name": "Japanese"},
            {"code": "ko", "name": "Korean"},
            {"code": "zh", "name": "Chinese"},
        ]


class AudioRecorder:
    """
    Helper class for browser-based audio recording.
    This is primarily used on the frontend, but we provide
    configuration and format specifications here.
    """

    SUPPORTED_FORMATS = [
        "audio/webm",
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/flac",
    ]

    RECOMMENDED_SETTINGS = {
        "sample_rate": 16000,  # Hz - optimal for speech
        "channels": 1,        # Mono is sufficient
        "bits_per_sample": 16,
        "format": "audio/webm;codecs=opus",  # Best browser support + compression
    }

    MAX_DURATION_SECONDS = 300  # 5 minutes max per recording
    MIN_DURATION_SECONDS = 0.5  # Minimum for transcription

    @classmethod
    def get_media_constraints(cls) -> dict:
        """Get MediaRecorder constraints for frontend"""
        return {
            "audio": {
                "sampleRate": cls.RECOMMENDED_SETTINGS["sample_rate"],
                "channelCount": cls.RECOMMENDED_SETTINGS["channels"],
                "echoCancellation": True,
                "noiseSuppression": True,
                "autoGainControl": True,
            },
            "video": False,
        }

    @classmethod
    def get_recorder_options(cls) -> dict:
        """Get MediaRecorder options for frontend"""
        return {
            "mimeType": cls.RECOMMENDED_SETTINGS["format"],
            "audioBitsPerSecond": 128000,
        }
