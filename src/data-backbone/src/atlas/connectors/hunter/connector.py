# src/atlas/connectors/hunter/connector.py
"""
Hunter.io Connector - Email finding and verification.

Hunter provides:
- Domain search (find emails at a company)
- Email finder (find specific person's email)
- Email verification

API Docs: https://hunter.io/api-documentation/v2
"""

import httpx
from typing import Optional, List, Dict, Any

from atlas.connectors.registry import (
    BaseConnector,
    ConnectorConfig,
    ConnectorType,
    AuthType,
    ConnectorRegistry,
)
from atlas.ingestors.common.base import CompanyPeopleFinder
from atlas.connectors.utils.rate_limiter import RateLimiter


HUNTER_CONFIG = ConnectorConfig(
    id="hunter",
    name="Hunter.io",
    type=ConnectorType.PEOPLE,
    auth_type=AuthType.API_KEY,
    auth_fields=["api_key"],
    base_url="https://api.hunter.io/v2",
    rate_limit=10,  # Per domain lookup
    rate_limit_window=60,
    supports_search=False,
    supports_enrich=True,
    supports_people=True,
    supports_webhook=False,
    docs_url="https://hunter.io/api-documentation/v2",
    icon="/icons/hunter.svg",
    description="Email finder and verification with 100M+ emails",
)


@ConnectorRegistry.register("hunter")
class HunterConnector(BaseConnector, CompanyPeopleFinder):
    """
    Hunter.io connector for email finding and verification.

    Features:
    - Find emails at a company domain
    - Find specific person's email
    - Verify email deliverability
    """

    config = HUNTER_CONFIG

    def __init__(self, api_key: str):
        """
        Initialize Hunter connector.

        Args:
            api_key: Hunter.io API key
        """
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=30.0,
        )
        self.rate_limiter = RateLimiter(
            connector_id="hunter",
            limit=self.config.rate_limit,
            window=self.config.rate_limit_window,
        )

    @property
    def source_prefix(self) -> str:
        return "hunter"

    async def test_connection(self) -> bool:
        """Test if API key is valid"""
        try:
            response = await self.client.get(
                "/account",
                params={"api_key": self.api_key},
            )
            return response.status_code == 200
        except Exception:
            return False

    async def get_rate_limit_status(self) -> dict:
        """Get current rate limit and account status"""
        try:
            response = await self.client.get(
                "/account",
                params={"api_key": self.api_key},
            )
            if response.status_code == 200:
                data = response.json().get("data", {})
                return {
                    "limit": data.get("requests", {}).get("searches", {}).get("available", 0),
                    "remaining": data.get("requests", {}).get("searches", {}).get("available", 0)
                                - data.get("requests", {}).get("searches", {}).get("used", 0),
                    "reset_in": 3600,  # Hunter resets hourly
                }
        except Exception:
            pass
        return self.rate_limiter.get_status()

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    # ─────────────────────────────────────────────────────────────
    # CompanyPeopleFinder Implementation
    # ─────────────────────────────────────────────────────────────

    async def find_by_company_domain(
        self,
        domain: str,
        limit: int = 50,
        department: Optional[str] = None,
        seniority: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Find emails at a domain.

        Args:
            domain: Company domain
            limit: Max results (max 100)
            department: Filter by department (executive, it, finance, management, etc.)
            seniority: Filter by seniority (junior, senior, executive)

        Returns:
            List of people with emails in standard format
        """
        await self.rate_limiter.wait_and_acquire()

        params: Dict[str, Any] = {
            "domain": domain,
            "api_key": self.api_key,
            "limit": min(limit, 100),
        }

        if department:
            params["department"] = department
        if seniority:
            params["seniority"] = seniority

        response = await self.client.get("/domain-search", params=params)
        response.raise_for_status()
        data = response.json().get("data", {})

        people = []
        for email_data in data.get("emails", []):
            people.append(self._transform_person(email_data, domain, data))

        return people

    def _transform_person(
        self,
        email_data: Dict[str, Any],
        domain: str,
        domain_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Transform Hunter email result to standard format"""
        # Create unique ID from email
        email = email_data.get("value", "")
        unique_id = email.replace("@", "_at_").replace(".", "_")

        first_name = email_data.get("first_name", "")
        last_name = email_data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()

        return {
            "id": self.make_id(unique_id),
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "email_confidence": email_data.get("confidence"),
            "email_type": email_data.get("type"),  # personal, generic
            "title": email_data.get("position"),
            "department": email_data.get("department"),
            "seniority": email_data.get("seniority"),
            "linkedin_url": email_data.get("linkedin"),
            "twitter_url": email_data.get("twitter"),
            "phone": email_data.get("phone_number"),
            "company_domain": domain,
            "company_name": domain_data.get("organization"),
            "_sources": email_data.get("sources", []),
            "_source": "hunter",
            "_raw": email_data,
        }

    # ─────────────────────────────────────────────────────────────
    # Email Verification
    # ─────────────────────────────────────────────────────────────

    async def verify_email(self, email: str) -> Dict[str, Any]:
        """
        Verify if an email is deliverable.

        Args:
            email: Email address to verify

        Returns:
            Verification result with status and details
        """
        await self.rate_limiter.wait_and_acquire()

        params = {"email": email, "api_key": self.api_key}
        response = await self.client.get("/email-verifier", params=params)
        response.raise_for_status()
        data = response.json().get("data", {})

        return {
            "email": email,
            "status": data.get("status"),  # valid, invalid, accept_all, webmail, disposable, unknown
            "score": data.get("score"),    # 0-100
            "deliverable": data.get("status") == "valid",
            "disposable": data.get("disposable"),
            "webmail": data.get("webmail"),
            "mx_records": data.get("mx_records"),
            "smtp_check": data.get("smtp_check"),
            "accept_all": data.get("accept_all"),
            "block": data.get("block"),
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "sources": data.get("sources", []),
        }

    async def find_email(
        self,
        domain: str,
        first_name: str,
        last_name: str,
    ) -> Dict[str, Any]:
        """
        Find a specific person's email.

        Args:
            domain: Company domain
            first_name: Person's first name
            last_name: Person's last name

        Returns:
            Email finding result with confidence score
        """
        await self.rate_limiter.wait_and_acquire()

        params = {
            "domain": domain,
            "first_name": first_name,
            "last_name": last_name,
            "api_key": self.api_key,
        }
        response = await self.client.get("/email-finder", params=params)
        response.raise_for_status()
        data = response.json().get("data", {})

        return {
            "email": data.get("email"),
            "confidence": data.get("score"),
            "domain": domain,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": f"{first_name} {last_name}",
            "position": data.get("position"),
            "linkedin_url": data.get("linkedin"),
            "twitter_url": data.get("twitter"),
            "phone": data.get("phone_number"),
            "sources": data.get("sources", []),
            "verification": data.get("verification"),
        }

    # ─────────────────────────────────────────────────────────────
    # Email Pattern Detection
    # ─────────────────────────────────────────────────────────────

    async def get_email_pattern(self, domain: str) -> Dict[str, Any]:
        """
        Get the email pattern used by a company.

        Args:
            domain: Company domain

        Returns:
            Email pattern information
        """
        await self.rate_limiter.wait_and_acquire()

        params = {"domain": domain, "api_key": self.api_key}
        response = await self.client.get("/domain-search", params=params)
        response.raise_for_status()
        data = response.json().get("data", {})

        return {
            "domain": domain,
            "pattern": data.get("pattern"),  # e.g., "{first}.{last}", "{f}{last}"
            "organization": data.get("organization"),
            "total_emails_found": len(data.get("emails", [])),
        }

    # ─────────────────────────────────────────────────────────────
    # Sync methods for compatibility
    # ─────────────────────────────────────────────────────────────

    def find_by_company_domain_sync(self, domain: str) -> List[Dict[str, Any]]:
        """Synchronous wrapper for CompanyPeopleFinder interface"""
        import asyncio
        return asyncio.get_event_loop().run_until_complete(
            self.find_by_company_domain(domain)
        )
