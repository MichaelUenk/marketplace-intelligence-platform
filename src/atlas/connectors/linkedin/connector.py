# src/atlas/connectors/linkedin/connector.py
"""
LinkedIn Connector - Professional network data via Apify scrapers.

LinkedIn data access via web scraping (Apify actors):
- Company profiles
- Employee search
- Profile enrichment

Note: Requires Apify account and optionally LinkedIn session cookie
for deeper access.

API Docs: https://apify.com/curious_coder/linkedin-company-scraper
"""

from typing import Optional, List, Dict, Any

from atlas.connectors.registry import (
    BaseConnector,
    ConnectorConfig,
    ConnectorType,
    AuthType,
    ConnectorRegistry,
)
from atlas.ingestors.common.base import CompanyIngestor, CompanyPeopleFinder
from atlas.connectors.apify.connector import ApifyConnector


LINKEDIN_CONFIG = ConnectorConfig(
    id="linkedin",
    name="LinkedIn (via Apify)",
    type=ConnectorType.SCRAPER,
    auth_type=AuthType.COOKIE,
    auth_fields=["apify_token", "li_at_cookie"],  # li_at_cookie optional
    base_url="https://api.apify.com/v2",
    rate_limit=50,  # Conservative to avoid LinkedIn restrictions
    rate_limit_window=3600,  # Per hour
    supports_search=True,
    supports_enrich=True,
    supports_people=True,
    supports_webhook=False,
    docs_url="https://apify.com/curious_coder/linkedin-company-scraper",
    icon="/icons/linkedin.svg",
    description="LinkedIn company and profile data via Apify scrapers",
)


@ConnectorRegistry.register("linkedin")
class LinkedInConnector(BaseConnector, CompanyIngestor, CompanyPeopleFinder):
    """
    LinkedIn data connector via Apify scrapers.

    Provides company and people search/enrichment through Apify's
    LinkedIn scrapers. Some features require a LinkedIn session cookie.
    """

    config = LINKEDIN_CONFIG

    def __init__(
        self,
        apify_token: str,
        li_at_cookie: Optional[str] = None,
    ):
        """
        Initialize LinkedIn connector.

        Args:
            apify_token: Apify API token
            li_at_cookie: LinkedIn session cookie (optional, needed for some features)
        """
        self.apify = ApifyConnector(apify_token)
        self.li_at_cookie = li_at_cookie

    @property
    def source_prefix(self) -> str:
        return "linkedin"

    async def test_connection(self) -> bool:
        """Test if Apify connection is valid"""
        return await self.apify.test_connection()

    async def get_rate_limit_status(self) -> dict:
        """Get rate limit status from Apify"""
        return await self.apify.get_rate_limit_status()

    async def close(self):
        """Close connections"""
        await self.apify.close()

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
        Search LinkedIn companies via Google.

        Uses Google search to find LinkedIn company URLs, then scrapes them.

        Args:
            query: Company name or keyword
            limit: Maximum results

        Returns:
            List of company records
        """
        # Use Google to find LinkedIn company URLs
        google_query = f'site:linkedin.com/company "{query}"'

        result = await self.apify.run_actor(
            "google_search",
            {
                "queries": google_query,
                "maxPagesPerQuery": 1,
                "resultsPerPage": limit * 2,  # Get extra in case some aren't company pages
            },
        )

        items = await self.apify.get_dataset_items(result["dataset_id"])

        # Extract LinkedIn company URLs
        linkedin_urls = []
        for item in items:
            url = item.get("url", "")
            if "linkedin.com/company/" in url and len(linkedin_urls) < limit:
                linkedin_urls.append(url)

        if not linkedin_urls:
            return []

        # Scrape each company page
        companies = []
        for url in linkedin_urls[:limit]:
            try:
                company = await self.apify.scrape_linkedin_company(url)
                if company:
                    # Update source prefix
                    company["id"] = self.make_id(company["id"].split(":", 1)[-1])
                    company["_source"] = "linkedin"
                    companies.append(company)
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")

        return companies

    async def enrich_company(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        """
        Enrich company data from LinkedIn URL.

        Args:
            linkedin_url: LinkedIn company page URL

        Returns:
            Enriched company data
        """
        try:
            company = await self.apify.scrape_linkedin_company(linkedin_url)
            if company:
                company["id"] = self.make_id(company["id"].split(":", 1)[-1])
                company["_source"] = "linkedin"
            return company
        except Exception:
            return None

    async def enrich_by_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Find and enrich company by domain.

        Args:
            domain: Company website domain

        Returns:
            Enriched company data or None
        """
        # Search Google for LinkedIn page
        google_query = f'site:linkedin.com/company {domain}'

        result = await self.apify.run_actor(
            "google_search",
            {
                "queries": google_query,
                "maxPagesPerQuery": 1,
                "resultsPerPage": 5,
            },
        )

        items = await self.apify.get_dataset_items(result["dataset_id"])

        # Find first LinkedIn company URL
        linkedin_url = None
        for item in items:
            url = item.get("url", "")
            if "linkedin.com/company/" in url:
                linkedin_url = url
                break

        if not linkedin_url:
            return None

        return await self.enrich_company(linkedin_url)

    # ─────────────────────────────────────────────────────────────
    # CompanyPeopleFinder Implementation
    # ─────────────────────────────────────────────────────────────

    async def find_by_company_domain(
        self,
        domain: str,
        limit: int = 50,
        titles: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Find employees of a company on LinkedIn.

        Requires li_at cookie for employee search.

        Args:
            domain: Company domain
            limit: Maximum employees
            titles: Filter by titles (applied post-scrape)

        Returns:
            List of employee profiles
        """
        if not self.li_at_cookie:
            raise ValueError("LinkedIn cookie required for people search")

        # First, find the company's LinkedIn URL
        google_query = f'site:linkedin.com/company {domain}'
        result = await self.apify.run_actor(
            "google_search",
            {
                "queries": google_query,
                "maxPagesPerQuery": 1,
                "resultsPerPage": 3,
            },
        )

        items = await self.apify.get_dataset_items(result["dataset_id"])

        company_url = None
        for item in items:
            url = item.get("url", "")
            if "linkedin.com/company/" in url:
                company_url = url
                break

        if not company_url:
            return []

        # Scrape employees
        try:
            employees = await self.apify.scrape_company_employees(
                company_url,
                self.li_at_cookie,
                limit=limit,
            )
        except Exception as e:
            print(f"Failed to scrape employees: {e}")
            return []

        # Update source and add company domain
        for person in employees:
            person["id"] = self.make_id(person["id"].split(":", 1)[-1])
            person["company_domain"] = domain
            person["_source"] = "linkedin"

        # Filter by titles if specified
        if titles:
            employees = [
                p for p in employees
                if any(t.lower() in (p.get("title") or "").lower() for t in titles)
            ]

        return employees

    async def find_by_linkedin_url(
        self,
        company_url: str,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Find employees by LinkedIn company URL.

        Args:
            company_url: LinkedIn company page URL
            limit: Maximum employees

        Returns:
            List of employee profiles
        """
        if not self.li_at_cookie:
            raise ValueError("LinkedIn cookie required for people search")

        try:
            employees = await self.apify.scrape_company_employees(
                company_url,
                self.li_at_cookie,
                limit=limit,
            )

            for person in employees:
                person["id"] = self.make_id(person["id"].split(":", 1)[-1])
                person["_source"] = "linkedin"

            return employees
        except Exception as e:
            print(f"Failed to scrape employees: {e}")
            return []

    async def enrich_person(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        """
        Enrich person data from LinkedIn profile URL.

        Args:
            linkedin_url: LinkedIn profile URL

        Returns:
            Enriched person data
        """
        try:
            people = await self.apify.scrape_linkedin_people([linkedin_url])
            if people:
                person = people[0]
                person["id"] = self.make_id(person["id"].split(":", 1)[-1])
                person["_source"] = "linkedin"
                return person
            return None
        except Exception:
            return None

    # ─────────────────────────────────────────────────────────────
    # Sync methods for compatibility
    # ─────────────────────────────────────────────────────────────

    def search_sync(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Synchronous search wrapper"""
        import asyncio
        return asyncio.get_event_loop().run_until_complete(self.search(query, limit))

    def find_by_company_domain_sync(self, domain: str) -> List[Dict[str, Any]]:
        """Synchronous people finder wrapper"""
        import asyncio
        return asyncio.get_event_loop().run_until_complete(
            self.find_by_company_domain(domain)
        )
