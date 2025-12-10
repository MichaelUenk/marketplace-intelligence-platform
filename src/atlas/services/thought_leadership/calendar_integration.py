# src/atlas/services/thought_leadership/calendar_integration.py
"""
Calendar Integration - Google and Outlook calendar sync.

Capabilities:
- OAuth2 authentication for Google/Outlook
- Calendar event sync
- External meeting detection
- Webhook handling for real-time updates
- Prep task scheduling
"""

from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import uuid
import os
import httpx


class CalendarProvider(str, Enum):
    """Supported calendar providers"""
    GOOGLE = "google"
    OUTLOOK = "outlook"


@dataclass
class CalendarCredentials:
    """OAuth credentials for calendar access"""
    provider: CalendarProvider
    access_token: str
    refresh_token: str
    expires_at: datetime
    user_id: str


@dataclass
class CalendarEvent:
    """Calendar event from any provider"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    external_id: str = ""
    provider: CalendarProvider = CalendarProvider.GOOGLE
    title: str = ""
    description: Optional[str] = None
    start_time: datetime = field(default_factory=datetime.now)
    end_time: datetime = field(default_factory=datetime.now)
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    attendees: List[Dict[str, str]] = field(default_factory=list)
    organizer: Optional[str] = None
    is_external: bool = False
    is_cancelled: bool = False
    recurrence: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class CalendarIntegration:
    """
    Calendar Integration Service.

    Handles:
    - OAuth2 flows for Google and Outlook
    - Event synchronization
    - Webhook setup for real-time updates
    - External meeting detection
    """

    # OAuth endpoints
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

    OUTLOOK_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    OUTLOOK_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    OUTLOOK_GRAPH_API = "https://graph.microsoft.com/v1.0"

    # Scopes
    GOOGLE_SCOPES = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly"
    ]
    OUTLOOK_SCOPES = [
        "Calendars.Read",
        "User.Read"
    ]

    def __init__(
        self,
        google_client_id: Optional[str] = None,
        google_client_secret: Optional[str] = None,
        microsoft_client_id: Optional[str] = None,
        microsoft_client_secret: Optional[str] = None,
        webhook_base_url: Optional[str] = None,
        on_meeting_detected: Optional[Callable] = None
    ):
        """
        Initialize Calendar Integration.

        Args:
            google_client_id: Google OAuth client ID
            google_client_secret: Google OAuth client secret
            microsoft_client_id: Microsoft OAuth client ID
            microsoft_client_secret: Microsoft OAuth client secret
            webhook_base_url: Base URL for webhook callbacks
            on_meeting_detected: Callback for new meeting detection
        """
        self.google_client_id = google_client_id or os.getenv("GOOGLE_CLIENT_ID")
        self.google_client_secret = google_client_secret or os.getenv("GOOGLE_CLIENT_SECRET")
        self.microsoft_client_id = microsoft_client_id or os.getenv("MICROSOFT_CLIENT_ID")
        self.microsoft_client_secret = microsoft_client_secret or os.getenv("MICROSOFT_CLIENT_SECRET")
        self.webhook_base_url = webhook_base_url or os.getenv("WEBHOOK_BASE_URL", "http://localhost:8000")
        self.on_meeting_detected = on_meeting_detected

        # Credentials store (in production, use secure storage)
        self._credentials: Dict[str, CalendarCredentials] = {}

        # HTTP client
        self.client = httpx.AsyncClient()

    async def get_auth_url(
        self,
        provider: CalendarProvider,
        redirect_uri: str,
        state: Optional[str] = None
    ) -> str:
        """
        Get OAuth authorization URL.

        Args:
            provider: Calendar provider
            redirect_uri: OAuth redirect URI
            state: State parameter for CSRF protection

        Returns:
            Authorization URL
        """
        if provider == CalendarProvider.GOOGLE:
            params = {
                "client_id": self.google_client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": " ".join(self.GOOGLE_SCOPES),
                "access_type": "offline",
                "prompt": "consent"
            }
            if state:
                params["state"] = state
            return f"{self.GOOGLE_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

        elif provider == CalendarProvider.OUTLOOK:
            params = {
                "client_id": self.microsoft_client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": " ".join(self.OUTLOOK_SCOPES),
                "response_mode": "query"
            }
            if state:
                params["state"] = state
            return f"{self.OUTLOOK_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

        raise ValueError(f"Unknown provider: {provider}")

    async def exchange_code(
        self,
        provider: CalendarProvider,
        code: str,
        redirect_uri: str,
        user_id: str
    ) -> CalendarCredentials:
        """
        Exchange authorization code for tokens.

        Args:
            provider: Calendar provider
            code: Authorization code from OAuth callback
            redirect_uri: OAuth redirect URI
            user_id: User ID to associate credentials with

        Returns:
            CalendarCredentials
        """
        if provider == CalendarProvider.GOOGLE:
            response = await self.client.post(
                self.GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.google_client_id,
                    "client_secret": self.google_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code"
                }
            )
        elif provider == CalendarProvider.OUTLOOK:
            response = await self.client.post(
                self.OUTLOOK_TOKEN_URL,
                data={
                    "client_id": self.microsoft_client_id,
                    "client_secret": self.microsoft_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code"
                }
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")

        data = response.json()

        if "error" in data:
            raise Exception(f"OAuth error: {data.get('error_description', data['error'])}")

        credentials = CalendarCredentials(
            provider=provider,
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token", ""),
            expires_at=datetime.now() + timedelta(seconds=data.get("expires_in", 3600)),
            user_id=user_id
        )

        self._credentials[user_id] = credentials

        # Set up webhook for real-time updates
        await self._setup_webhook(user_id, credentials)

        return credentials

    async def refresh_tokens(self, user_id: str) -> CalendarCredentials:
        """
        Refresh expired tokens.

        Args:
            user_id: User ID

        Returns:
            Updated CalendarCredentials
        """
        credentials = self._credentials.get(user_id)
        if not credentials:
            raise ValueError(f"No credentials found for user {user_id}")

        if credentials.provider == CalendarProvider.GOOGLE:
            response = await self.client.post(
                self.GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.google_client_id,
                    "client_secret": self.google_client_secret,
                    "refresh_token": credentials.refresh_token,
                    "grant_type": "refresh_token"
                }
            )
        elif credentials.provider == CalendarProvider.OUTLOOK:
            response = await self.client.post(
                self.OUTLOOK_TOKEN_URL,
                data={
                    "client_id": self.microsoft_client_id,
                    "client_secret": self.microsoft_client_secret,
                    "refresh_token": credentials.refresh_token,
                    "grant_type": "refresh_token"
                }
            )
        else:
            raise ValueError(f"Unknown provider: {credentials.provider}")

        data = response.json()

        credentials.access_token = data["access_token"]
        credentials.expires_at = datetime.now() + timedelta(seconds=data.get("expires_in", 3600))

        if "refresh_token" in data:
            credentials.refresh_token = data["refresh_token"]

        self._credentials[user_id] = credentials
        return credentials

    async def sync_events(
        self,
        user_id: str,
        days_ahead: int = 14
    ) -> List[CalendarEvent]:
        """
        Sync calendar events for a user.

        Args:
            user_id: User ID
            days_ahead: Number of days to look ahead

        Returns:
            List of CalendarEvents
        """
        credentials = self._credentials.get(user_id)
        if not credentials:
            raise ValueError(f"No credentials found for user {user_id}")

        # Refresh if expired
        if credentials.expires_at <= datetime.now():
            credentials = await self.refresh_tokens(user_id)

        now = datetime.now()
        time_max = now + timedelta(days=days_ahead)

        events = []

        if credentials.provider == CalendarProvider.GOOGLE:
            events = await self._fetch_google_events(credentials, now, time_max)
        elif credentials.provider == CalendarProvider.OUTLOOK:
            events = await self._fetch_outlook_events(credentials, now, time_max)

        # Detect external meetings and trigger callbacks
        for event in events:
            if event.is_external and self.on_meeting_detected:
                await self.on_meeting_detected(event)

        return events

    async def _fetch_google_events(
        self,
        credentials: CalendarCredentials,
        time_min: datetime,
        time_max: datetime
    ) -> List[CalendarEvent]:
        """Fetch events from Google Calendar"""
        response = await self.client.get(
            f"{self.GOOGLE_CALENDAR_API}/calendars/primary/events",
            headers={"Authorization": f"Bearer {credentials.access_token}"},
            params={
                "timeMin": time_min.isoformat() + "Z",
                "timeMax": time_max.isoformat() + "Z",
                "singleEvents": "true",
                "orderBy": "startTime"
            }
        )

        data = response.json()
        events = []

        for item in data.get("items", []):
            # Get attendees
            attendees = []
            has_external = False

            for attendee in item.get("attendees", []):
                email = attendee.get("email", "")
                attendees.append({
                    "email": email,
                    "name": attendee.get("displayName", email),
                    "status": attendee.get("responseStatus", "needsAction"),
                    "organizer": attendee.get("organizer", False)
                })

                # Check if external (not same domain as organizer)
                organizer_email = item.get("organizer", {}).get("email", "")
                if organizer_email and "@" in email and "@" in organizer_email:
                    if email.split("@")[1] != organizer_email.split("@")[1]:
                        has_external = True

            # Parse start/end times
            start = item.get("start", {})
            end = item.get("end", {})

            start_time = datetime.fromisoformat(
                start.get("dateTime", start.get("date", "")).replace("Z", "+00:00")
            )
            end_time = datetime.fromisoformat(
                end.get("dateTime", end.get("date", "")).replace("Z", "+00:00")
            )

            events.append(CalendarEvent(
                external_id=item.get("id", ""),
                provider=CalendarProvider.GOOGLE,
                title=item.get("summary", ""),
                description=item.get("description"),
                start_time=start_time,
                end_time=end_time,
                location=item.get("location"),
                meeting_link=item.get("hangoutLink"),
                attendees=attendees,
                organizer=item.get("organizer", {}).get("email"),
                is_external=has_external,
                is_cancelled=item.get("status") == "cancelled",
                recurrence=item.get("recurrence", [None])[0] if item.get("recurrence") else None
            ))

        return events

    async def _fetch_outlook_events(
        self,
        credentials: CalendarCredentials,
        time_min: datetime,
        time_max: datetime
    ) -> List[CalendarEvent]:
        """Fetch events from Outlook Calendar"""
        response = await self.client.get(
            f"{self.OUTLOOK_GRAPH_API}/me/calendarview",
            headers={"Authorization": f"Bearer {credentials.access_token}"},
            params={
                "startDateTime": time_min.isoformat(),
                "endDateTime": time_max.isoformat(),
                "$orderby": "start/dateTime"
            }
        )

        data = response.json()
        events = []

        for item in data.get("value", []):
            # Get attendees
            attendees = []
            has_external = False
            organizer_email = item.get("organizer", {}).get("emailAddress", {}).get("address", "")

            for attendee in item.get("attendees", []):
                email = attendee.get("emailAddress", {}).get("address", "")
                attendees.append({
                    "email": email,
                    "name": attendee.get("emailAddress", {}).get("name", email),
                    "status": attendee.get("status", {}).get("response", "none")
                })

                # Check if external
                if organizer_email and "@" in email and "@" in organizer_email:
                    if email.split("@")[1] != organizer_email.split("@")[1]:
                        has_external = True

            # Parse times
            start_time = datetime.fromisoformat(
                item.get("start", {}).get("dateTime", "").replace("Z", "+00:00")
            )
            end_time = datetime.fromisoformat(
                item.get("end", {}).get("dateTime", "").replace("Z", "+00:00")
            )

            # Get meeting link
            meeting_link = item.get("onlineMeeting", {}).get("joinUrl")

            events.append(CalendarEvent(
                external_id=item.get("id", ""),
                provider=CalendarProvider.OUTLOOK,
                title=item.get("subject", ""),
                description=item.get("bodyPreview"),
                start_time=start_time,
                end_time=end_time,
                location=item.get("location", {}).get("displayName"),
                meeting_link=meeting_link,
                attendees=attendees,
                organizer=organizer_email,
                is_external=has_external,
                is_cancelled=item.get("isCancelled", False),
                recurrence=item.get("recurrence", {}).get("pattern", {}).get("type")
            ))

        return events

    async def _setup_webhook(self, user_id: str, credentials: CalendarCredentials):
        """Set up webhook for real-time calendar updates"""
        if credentials.provider == CalendarProvider.GOOGLE:
            # Google uses push notifications via watch
            webhook_url = f"{self.webhook_base_url}/webhooks/google-calendar/{user_id}"

            try:
                response = await self.client.post(
                    f"{self.GOOGLE_CALENDAR_API}/calendars/primary/events/watch",
                    headers={"Authorization": f"Bearer {credentials.access_token}"},
                    json={
                        "id": str(uuid.uuid4()),
                        "type": "web_hook",
                        "address": webhook_url
                    }
                )
                # Handle response...
            except Exception as e:
                print(f"Failed to setup Google webhook: {e}")

        elif credentials.provider == CalendarProvider.OUTLOOK:
            # Microsoft uses subscriptions
            webhook_url = f"{self.webhook_base_url}/webhooks/outlook-calendar/{user_id}"

            try:
                response = await self.client.post(
                    f"{self.OUTLOOK_GRAPH_API}/subscriptions",
                    headers={"Authorization": f"Bearer {credentials.access_token}"},
                    json={
                        "changeType": "created,updated,deleted",
                        "notificationUrl": webhook_url,
                        "resource": "/me/events",
                        "expirationDateTime": (datetime.now() + timedelta(days=3)).isoformat() + "Z"
                    }
                )
                # Handle response...
            except Exception as e:
                print(f"Failed to setup Outlook webhook: {e}")

    async def handle_webhook(
        self,
        provider: CalendarProvider,
        user_id: str,
        payload: Dict[str, Any]
    ):
        """
        Handle incoming webhook notification.

        Args:
            provider: Calendar provider
            user_id: User ID
            payload: Webhook payload
        """
        # Re-sync events on webhook notification
        await self.sync_events(user_id, days_ahead=14)

    def is_connected(self, user_id: str) -> bool:
        """Check if user has connected calendar"""
        return user_id in self._credentials

    def get_provider(self, user_id: str) -> Optional[CalendarProvider]:
        """Get user's connected calendar provider"""
        credentials = self._credentials.get(user_id)
        return credentials.provider if credentials else None

    async def disconnect(self, user_id: str):
        """Disconnect user's calendar"""
        if user_id in self._credentials:
            del self._credentials[user_id]
