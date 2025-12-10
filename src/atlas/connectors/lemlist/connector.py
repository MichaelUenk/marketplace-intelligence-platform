# src/atlas/connectors/lemlist/connector.py
"""
lemlist Connector Implementation

French cold email platform with multichannel outreach capabilities.
https://developer.lemlist.com/

Features:
- Cold email campaigns with warmup
- LinkedIn automation
- Multichannel sequences (email + LinkedIn + calls)
- 600M+ verified contact database
- GDPR-compliant consent tracking
"""

import os
from typing import Optional, List, Dict, Any
import httpx

from ..registry import (
    BaseConnector,
    ConnectorConfig,
    ConnectorType,
    AuthType,
    ConnectorRegistry,
)


LEMLIST_CONFIG = ConnectorConfig(
    id="lemlist",
    name="lemlist",
    type=ConnectorType.PEOPLE,
    auth_type=AuthType.API_KEY,
    auth_fields=["api_key"],
    base_url="https://api.lemlist.com/api",
    rate_limit=100,  # 100 requests per minute
    rate_limit_window=60,
    supports_search=True,
    supports_enrich=True,
    supports_people=True,
    supports_webhook=True,
    docs_url="https://developer.lemlist.com/",
    icon="🇫🇷",
    description="French cold email & sales engagement platform (Paris, FR)",
)


@ConnectorRegistry.register("lemlist")
class LemlistConnector(BaseConnector):
    """
    Connector for lemlist - French sales engagement platform.

    lemlist is headquartered in Paris, France and is fully GDPR compliant.
    All data is processed within the EU.

    API Documentation: https://developer.lemlist.com/

    Features:
    - Campaign management (create, update, pause, resume)
    - Lead management (add, update, remove from campaigns)
    - Email tracking (opens, clicks, replies)
    - LinkedIn automation integration
    - Webhook support for real-time events

    Usage:
        connector = LemlistConnector(api_key="your-api-key")

        # Test connection
        if await connector.test_connection():
            # List campaigns
            campaigns = await connector.list_campaigns()

            # Add lead to campaign
            await connector.add_lead_to_campaign(
                campaign_id="camp_123",
                email="john@example.com",
                first_name="John",
                last_name="Doe",
                company_name="Acme Inc"
            )
    """

    config = LEMLIST_CONFIG

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize lemlist connector.

        Args:
            api_key: lemlist API key. If not provided, reads from LEMLIST_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("LEMLIST_API_KEY")
        if not self.api_key:
            raise ValueError("lemlist API key is required (set LEMLIST_API_KEY or pass api_key)")

        self.base_url = LEMLIST_CONFIG.base_url
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def source_prefix(self) -> str:
        return "lemlist"

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with authentication."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Content-Type": "application/json",
                },
                auth=("", self.api_key),  # lemlist uses basic auth with empty username
                timeout=30.0,
            )
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def test_connection(self) -> bool:
        """Test if API key is valid by fetching team info."""
        try:
            client = await self._get_client()
            response = await client.get("/team")
            return response.status_code == 200
        except Exception:
            return False

    async def get_rate_limit_status(self) -> dict:
        """
        Get current rate limit status.

        Note: lemlist doesn't expose rate limit headers, so we return config values.
        """
        return {
            "limit": self.config.rate_limit,
            "remaining": self.config.rate_limit,  # Not tracked by API
            "reset": 60,
            "window": self.config.rate_limit_window,
        }

    # =====================
    # Campaign Management
    # =====================

    async def list_campaigns(self) -> List[Dict[str, Any]]:
        """
        List all campaigns.

        Returns:
            List of campaign objects with id, name, status, etc.
        """
        client = await self._get_client()
        response = await client.get("/campaigns")
        response.raise_for_status()
        return response.json()

    async def get_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """
        Get campaign details by ID.

        Args:
            campaign_id: The campaign identifier

        Returns:
            Campaign details including steps, settings, stats
        """
        client = await self._get_client()
        response = await client.get(f"/campaigns/{campaign_id}")
        response.raise_for_status()
        return response.json()

    async def create_campaign(self, name: str, **kwargs) -> Dict[str, Any]:
        """
        Create a new campaign.

        Args:
            name: Campaign name
            **kwargs: Additional campaign settings

        Returns:
            Created campaign object
        """
        client = await self._get_client()
        payload = {"name": name, **kwargs}
        response = await client.post("/campaigns", json=payload)
        response.raise_for_status()
        return response.json()

    async def pause_campaign(self, campaign_id: str) -> bool:
        """Pause a running campaign."""
        client = await self._get_client()
        response = await client.post(f"/campaigns/{campaign_id}/pause")
        return response.status_code == 200

    async def resume_campaign(self, campaign_id: str) -> bool:
        """Resume a paused campaign."""
        client = await self._get_client()
        response = await client.post(f"/campaigns/{campaign_id}/start")
        return response.status_code == 200

    # =====================
    # Lead Management
    # =====================

    async def add_lead_to_campaign(
        self,
        campaign_id: str,
        email: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        company_name: Optional[str] = None,
        phone: Optional[str] = None,
        linkedin_url: Optional[str] = None,
        custom_fields: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Add a lead to a campaign.

        Args:
            campaign_id: Target campaign ID
            email: Lead's email address (required)
            first_name: Lead's first name
            last_name: Lead's last name
            company_name: Lead's company
            phone: Lead's phone number
            linkedin_url: Lead's LinkedIn profile URL
            custom_fields: Additional custom fields

        Returns:
            Created lead object
        """
        client = await self._get_client()

        payload = {"email": email}
        if first_name:
            payload["firstName"] = first_name
        if last_name:
            payload["lastName"] = last_name
        if company_name:
            payload["companyName"] = company_name
        if phone:
            payload["phone"] = phone
        if linkedin_url:
            payload["linkedinUrl"] = linkedin_url
        if custom_fields:
            payload.update(custom_fields)

        response = await client.post(
            f"/campaigns/{campaign_id}/leads/{email}",
            json=payload
        )
        response.raise_for_status()
        return response.json()

    async def get_lead(self, campaign_id: str, email: str) -> Dict[str, Any]:
        """Get lead details from a campaign."""
        client = await self._get_client()
        response = await client.get(f"/campaigns/{campaign_id}/leads/{email}")
        response.raise_for_status()
        return response.json()

    async def update_lead(
        self,
        campaign_id: str,
        email: str,
        **fields
    ) -> Dict[str, Any]:
        """Update lead fields in a campaign."""
        client = await self._get_client()
        response = await client.patch(
            f"/campaigns/{campaign_id}/leads/{email}",
            json=fields
        )
        response.raise_for_status()
        return response.json()

    async def remove_lead(self, campaign_id: str, email: str) -> bool:
        """Remove a lead from a campaign."""
        client = await self._get_client()
        response = await client.delete(f"/campaigns/{campaign_id}/leads/{email}")
        return response.status_code == 200

    async def mark_lead_as_interested(self, campaign_id: str, email: str) -> bool:
        """Mark a lead as interested (positive reply)."""
        client = await self._get_client()
        response = await client.post(
            f"/campaigns/{campaign_id}/leads/{email}/interested"
        )
        return response.status_code == 200

    async def mark_lead_as_not_interested(self, campaign_id: str, email: str) -> bool:
        """Mark a lead as not interested."""
        client = await self._get_client()
        response = await client.post(
            f"/campaigns/{campaign_id}/leads/{email}/notInterested"
        )
        return response.status_code == 200

    # =====================
    # Activity & Analytics
    # =====================

    async def get_campaign_stats(self, campaign_id: str) -> Dict[str, Any]:
        """Get campaign statistics (opens, clicks, replies, etc.)."""
        client = await self._get_client()
        response = await client.get(f"/campaigns/{campaign_id}/export")
        response.raise_for_status()
        return response.json()

    async def list_activities(
        self,
        campaign_id: Optional[str] = None,
        activity_type: Optional[str] = None,  # emailsOpened, emailsClicked, emailsReplied, emailsBounced
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        List recent activities.

        Args:
            campaign_id: Filter by campaign (optional)
            activity_type: Filter by type (emailsOpened, emailsClicked, etc.)
            limit: Maximum results to return

        Returns:
            List of activity objects
        """
        client = await self._get_client()
        params = {"limit": limit}
        if campaign_id:
            params["campaignId"] = campaign_id
        if activity_type:
            params["type"] = activity_type

        response = await client.get("/activities", params=params)
        response.raise_for_status()
        return response.json()

    # =====================
    # Unsubscribe Management (GDPR)
    # =====================

    async def add_to_unsubscribe_list(self, email: str) -> bool:
        """
        Add email to global unsubscribe list (GDPR compliance).

        Args:
            email: Email address to unsubscribe

        Returns:
            True if successful
        """
        client = await self._get_client()
        response = await client.post(
            "/unsubscribes",
            json={"email": email}
        )
        return response.status_code == 200

    async def remove_from_unsubscribe_list(self, email: str) -> bool:
        """Remove email from unsubscribe list."""
        client = await self._get_client()
        response = await client.delete(f"/unsubscribes/{email}")
        return response.status_code == 200

    async def is_unsubscribed(self, email: str) -> bool:
        """Check if email is on unsubscribe list."""
        client = await self._get_client()
        response = await client.get(f"/unsubscribes/{email}")
        return response.status_code == 200

    # =====================
    # Webhook Management
    # =====================

    async def list_hooks(self) -> List[Dict[str, Any]]:
        """List all registered webhooks."""
        client = await self._get_client()
        response = await client.get("/hooks")
        response.raise_for_status()
        return response.json()

    async def create_hook(
        self,
        target_url: str,
        event: str,  # emailsSent, emailsOpened, emailsClicked, emailsReplied, emailsBounced, emailsUnsubscribed
    ) -> Dict[str, Any]:
        """
        Create a webhook for email events.

        Args:
            target_url: URL to receive webhook events
            event: Event type to subscribe to

        Returns:
            Created webhook object
        """
        client = await self._get_client()
        response = await client.post(
            "/hooks",
            json={"targetUrl": target_url, "event": event}
        )
        response.raise_for_status()
        return response.json()

    async def delete_hook(self, hook_id: str) -> bool:
        """Delete a webhook."""
        client = await self._get_client()
        response = await client.delete(f"/hooks/{hook_id}")
        return response.status_code == 200

    # =====================
    # Search (Lead Database)
    # =====================

    async def search_leads(
        self,
        query: Optional[str] = None,
        company: Optional[str] = None,
        title: Optional[str] = None,
        location: Optional[str] = None,
        limit: int = 25,
    ) -> List[Dict[str, Any]]:
        """
        Search lemlist's lead database (600M+ contacts).

        Note: This requires lemlist's database access plan.

        Args:
            query: General search query
            company: Company name filter
            title: Job title filter
            location: Location filter
            limit: Maximum results

        Returns:
            List of matching leads
        """
        client = await self._get_client()
        params = {"limit": limit}
        if query:
            params["query"] = query
        if company:
            params["company"] = company
        if title:
            params["title"] = title
        if location:
            params["location"] = location

        response = await client.get("/database/search", params=params)
        response.raise_for_status()
        return response.json()
