# src/atlas/connectors/apollo/connector.py
"""
Apollo.io Connector - Company and contact data enrichment.

Apollo provides:
- Company search by name, industry, location
- Company enrichment by domain
- People/contact search
- Email finding and verification

API Docs: https://apolloio.github.io/apollo-api-docs/
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
from atlas.ingestors.common.base import CompanyIngestor, CompanyPeopleFinder
from atlas.connectors.utils.rate_limiter import RateLimiter


APOLLO_CONFIG = ConnectorConfig(
    id="apollo",
    name="Apollo.io",
    type=ConnectorType.COMPANY,
    auth_type=AuthType.API_KEY,
    auth_fields=["api_key"],
    base_url="https://api.apollo.io/v1",
    rate_limit=100,
    rate_limit_window=60,
    supports_search=True,
    supports_enrich=True,
    supports_people=True,
    supports_webhook=False,
    docs_url="https://apolloio.github.io/apollo-api-docs/",
    icon="/icons/apollo.svg",
    description="B2B company and contact database with 270M+ contacts",
)


@ConnectorRegistry.register("apollo")
class ApolloConnector(BaseConnector, CompanyIngestor, CompanyPeopleFinder):
    """
    Apollo.io connector for company and people data.

    Provides company search, enrichment, and contact finding capabilities.
    """

    config = APOLLO_CONFIG

    def __init__(self, api_key: str):
        """
        Initialize Apollo connector.

        Args:
            api_key: Apollo.io API key
        """
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=self.config.base_url,
            headers={
                "X-Api-Key": api_key,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
        self.rate_limiter = RateLimiter(
            connector_id="apollo",
            limit=self.config.rate_limit,
            window=self.config.rate_limit_window,
        )

    @property
    def source_prefix(self) -> str:
        return "apollo"

    async def test_connection(self) -> bool:
        """Test if API key is valid"""
        try:
            # Apollo doesn't have a dedicated health endpoint
            # Use a minimal search to verify credentials
            response = await self.client.post(
                "/mixed_companies/search",
                json={"q_organization_name": "test", "per_page": 1},
            )
            return response.status_code == 200
        except Exception:
            return False

    async def get_rate_limit_status(self) -> dict:
        """Get current rate limit status"""
        return self.rate_limiter.get_status()

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    # ─────────────────────────────────────────────────────────────
    # CompanyIngestor Implementation
    # ─────────────────────────────────────────────────────────────

    async def search(
        self,
        query: str,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for companies.

        Args:
            query: Company name or keyword
            limit: Maximum results (max 100 per page)
            filters: Optional filters
                - employee_ranges: ["1,10", "11,50", "51,200", "201,500", "501,1000", "1001,5000", "5001,10000", "10001+"]
                - locations: ["Netherlands", "Germany", "Belgium"]
                - industries: ["software", "manufacturing", "retail"]

        Returns:
            List of company records in standard format
        """
        await self.rate_limiter.wait_and_acquire()

        payload: Dict[str, Any] = {
            "q_organization_name": query,
            "per_page": min(limit, 100),
            "page": 1,
        }

        if filters:
            if "employee_ranges" in filters:
                payload["organization_num_employees_ranges"] = filters["employee_ranges"]
            if "locations" in filters:
                payload["organization_locations"] = filters["locations"]
            if "industries" in filters:
                payload["organization_industry_tag_ids"] = filters["industries"]

        response = await self.client.post("/mixed_companies/search", json=payload)
        response.raise_for_status()
        data = response.json()

        companies = []
        for org in data.get("organizations", []):
            companies.append(self._transform_company(org))

        return companies

    async def enrich_company(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Enrich a company by domain.

        Args:
            domain: Company website domain

        Returns:
            Enriched company data or None if not found
        """
        await self.rate_limiter.wait_and_acquire()

        payload = {"domain": domain}
        response = await self.client.post("/organizations/enrich", json=payload)

        if response.status_code == 404:
            return None

        response.raise_for_status()
        org = response.json().get("organization")
        return self._transform_company(org) if org else None

    def _transform_company(self, org: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Apollo organization to standard format"""
        return {
            "id": self.make_id(org.get("id", "")),
            "name": org.get("name"),
            "domain": org.get("primary_domain"),
            "website": org.get("website_url"),
            "industry": org.get("industry"),
            "sub_industry": org.get("subindustry"),
            "location": org.get("city"),
            "city": org.get("city"),
            "country": org.get("country"),
            "postal_code": org.get("postal_code"),
            "address": self._format_address(org),
            "employee_count": org.get("estimated_num_employees"),
            "employee_range": org.get("employee_count_range"),
            "annual_revenue": org.get("annual_revenue"),
            "revenue_range": org.get("revenue_range"),
            "founded_year": org.get("founded_year"),
            "linkedin_url": org.get("linkedin_url"),
            "twitter_url": org.get("twitter_url"),
            "facebook_url": org.get("facebook_url"),
            "phone": org.get("phone"),
            "keywords": org.get("keywords", []),
            "technologies": org.get("technologies", []),
            "description": org.get("seo_description"),
            "_source": "apollo",
            "_raw": org,
        }

    def _format_address(self, org: Dict[str, Any]) -> Optional[str]:
        """Format address from organization data"""
        parts = []
        if org.get("street_address"):
            parts.append(org["street_address"])
        if org.get("city"):
            parts.append(org["city"])
        if org.get("state"):
            parts.append(org["state"])
        if org.get("postal_code"):
            parts.append(org["postal_code"])
        if org.get("country"):
            parts.append(org["country"])
        return ", ".join(parts) if parts else None

    # ─────────────────────────────────────────────────────────────
    # CompanyPeopleFinder Implementation
    # ─────────────────────────────────────────────────────────────

    async def find_by_company_domain(
        self,
        domain: str,
        limit: int = 50,
        titles: Optional[List[str]] = None,
        seniorities: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Find people at a company.

        Args:
            domain: Company domain
            limit: Max results (max 100)
            titles: Filter by titles ["CEO", "HR Director", "Office Manager"]
            seniorities: Filter by level ["owner", "c_suite", "vp", "director", "manager"]

        Returns:
            List of people in standard format
        """
        await self.rate_limiter.wait_and_acquire()

        payload: Dict[str, Any] = {
            "q_organization_domains": domain,
            "per_page": min(limit, 100),
            "page": 1,
        }

        if titles:
            payload["person_titles"] = titles
        if seniorities:
            payload["person_seniorities"] = seniorities

        response = await self.client.post("/mixed_people/search", json=payload)
        response.raise_for_status()
        data = response.json()

        people = []
        for person in data.get("people", []):
            people.append(self._transform_person(person, domain))

        return people

    async def enrich_person(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Enrich a person by email.

        Args:
            email: Person's email address

        Returns:
            Enriched person data or None if not found
        """
        await self.rate_limiter.wait_and_acquire()

        payload = {"email": email}
        response = await self.client.post("/people/enrich", json=payload)

        if response.status_code == 404:
            return None

        response.raise_for_status()
        person = response.json().get("person")
        return self._transform_person(person) if person else None

    async def search_people(
        self,
        query: str,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for people across all companies.

        Args:
            query: Name or keyword
            limit: Max results
            filters: Optional filters (titles, seniorities, locations)

        Returns:
            List of people
        """
        await self.rate_limiter.wait_and_acquire()

        payload: Dict[str, Any] = {
            "q_person_name": query,
            "per_page": min(limit, 100),
            "page": 1,
        }

        if filters:
            if "titles" in filters:
                payload["person_titles"] = filters["titles"]
            if "seniorities" in filters:
                payload["person_seniorities"] = filters["seniorities"]
            if "locations" in filters:
                payload["person_locations"] = filters["locations"]

        response = await self.client.post("/mixed_people/search", json=payload)
        response.raise_for_status()
        data = response.json()

        return [self._transform_person(p) for p in data.get("people", [])]

    def _transform_person(
        self,
        person: Dict[str, Any],
        company_domain: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Transform Apollo person to standard format"""
        org = person.get("organization", {}) or {}

        # Get phone number from phone_numbers array
        phone = None
        phone_numbers = person.get("phone_numbers", [])
        if phone_numbers and isinstance(phone_numbers, list):
            first_phone = phone_numbers[0] if phone_numbers else {}
            phone = first_phone.get("sanitized_number") if isinstance(first_phone, dict) else None

        # Get department from departments array
        departments = person.get("departments", [])
        department = departments[0] if departments else None

        return {
            "id": self.make_id(person.get("id", "")),
            "full_name": person.get("name"),
            "first_name": person.get("first_name"),
            "last_name": person.get("last_name"),
            "title": person.get("title"),
            "headline": person.get("headline"),
            "department": department,
            "seniority": person.get("seniority"),
            "email": person.get("email"),
            "email_status": person.get("email_status"),  # verified, guessed, unavailable
            "phone": phone,
            "linkedin_url": person.get("linkedin_url"),
            "twitter_url": person.get("twitter_url"),
            "city": person.get("city"),
            "country": person.get("country"),
            "location": f"{person.get('city', '')}, {person.get('country', '')}".strip(", "),
            "company_id": self.make_id(person.get("organization_id", "")) if person.get("organization_id") else None,
            "company_name": org.get("name"),
            "company_domain": company_domain or org.get("primary_domain"),
            "_source": "apollo",
            "_raw": person,
        }

    # ─────────────────────────────────────────────────────────────
    # Sync method for compatibility with existing ingestor interface
    # ─────────────────────────────────────────────────────────────

    def search_sync(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Synchronous search wrapper for CompanyIngestor interface"""
        import asyncio
        return asyncio.get_event_loop().run_until_complete(self.search(query, limit))

    def find_by_company_domain_sync(self, domain: str) -> List[Dict[str, Any]]:
        """Synchronous people finder wrapper"""
        import asyncio
        return asyncio.get_event_loop().run_until_complete(
            self.find_by_company_domain(domain)
        )
