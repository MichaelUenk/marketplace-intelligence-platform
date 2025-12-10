# src/atlas/connectors/apify/connector.py
"""
Apify Connector - Web scraping platform.

Apify provides:
- Actor execution (pre-built scrapers)
- LinkedIn company/people scraping
- Google Maps scraping
- Website contact extraction
- Custom scraping workflows

API Docs: https://docs.apify.com/api/v2
"""

import httpx
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime

from atlas.connectors.registry import (
    BaseConnector,
    ConnectorConfig,
    ConnectorType,
    AuthType,
    ConnectorRegistry,
)
from atlas.connectors.utils.rate_limiter import RateLimiter


APIFY_CONFIG = ConnectorConfig(
    id="apify",
    name="Apify",
    type=ConnectorType.SCRAPER,
    auth_type=AuthType.API_KEY,
    auth_fields=["api_token"],
    base_url="https://api.apify.com/v2",
    rate_limit=1000,
    rate_limit_window=60,
    supports_search=False,
    supports_enrich=False,
    supports_people=False,
    supports_webhook=True,
    docs_url="https://docs.apify.com/api/v2",
    icon="/icons/apify.svg",
    description="Web scraping platform with 1000+ pre-built actors",
)

# Pre-configured Actors for common tasks
APIFY_ACTORS = {
    "linkedin_company": "curious_coder/linkedin-company-scraper",
    "linkedin_people": "curious_coder/linkedin-profile-scraper",
    "linkedin_employees": "curious_coder/linkedin-company-employees-scraper",
    "linkedin_jobs": "hMvNSpz3JnHgl5jkh",
    "google_maps": "nwua9Gu5YrADL7ZDj",
    "google_search": "apify/google-search-scraper",
    "website_content": "apify/website-content-crawler",
    "contact_extractor": "vdrmota/contact-info-scraper",
}


@ConnectorRegistry.register("apify")
class ApifyConnector(BaseConnector):
    """
    Apify web scraping platform connector.

    Provides access to pre-built scrapers (actors) for:
    - LinkedIn company and profile scraping
    - Google Maps and search scraping
    - Website contact extraction
    - Custom scraping workflows
    """

    config = APIFY_CONFIG

    def __init__(self, api_token: str):
        """
        Initialize Apify connector.

        Args:
            api_token: Apify API token
        """
        self.api_token = api_token
        self.client = httpx.AsyncClient(
            base_url=self.config.base_url,
            headers={"Authorization": f"Bearer {api_token}"},
            timeout=120.0,  # Long timeout for scraping jobs
        )
        self.rate_limiter = RateLimiter(
            connector_id="apify",
            limit=self.config.rate_limit,
            window=self.config.rate_limit_window,
        )

    @property
    def source_prefix(self) -> str:
        return "apify"

    async def test_connection(self) -> bool:
        """Test if API token is valid"""
        try:
            response = await self.client.get("/users/me")
            return response.status_code == 200
        except Exception:
            return False

    async def get_rate_limit_status(self) -> dict:
        """Get current rate limit and account status"""
        try:
            response = await self.client.get("/users/me")
            if response.status_code == 200:
                data = response.json().get("data", {})
                return {
                    "limit": self.config.rate_limit,
                    "remaining": data.get("limits", {}).get("computeUnits", {}).get("available", 0),
                    "reset_in": 3600,
                }
        except Exception:
            pass
        return self.rate_limiter.get_status()

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    # ─────────────────────────────────────────────────────────────
    # Actor Execution
    # ─────────────────────────────────────────────────────────────

    async def run_actor(
        self,
        actor_id: str,
        input_data: Dict[str, Any],
        wait_for_finish: bool = True,
        max_wait_secs: int = 300,
    ) -> Dict[str, Any]:
        """
        Run an Apify actor.

        Args:
            actor_id: Actor ID or alias from APIFY_ACTORS
            input_data: Actor-specific input
            wait_for_finish: Block until completion
            max_wait_secs: Max wait time

        Returns:
            Run result with dataset ID
        """
        await self.rate_limiter.wait_and_acquire()

        # Resolve actor alias
        resolved_actor = APIFY_ACTORS.get(actor_id, actor_id)

        # Start the run
        response = await self.client.post(
            f"/acts/{resolved_actor}/runs",
            json=input_data,
            params={"waitForFinish": max_wait_secs if wait_for_finish else 0},
        )
        response.raise_for_status()
        run_data = response.json().get("data", {})

        return {
            "run_id": run_data.get("id"),
            "status": run_data.get("status"),
            "dataset_id": run_data.get("defaultDatasetId"),
            "key_value_store_id": run_data.get("defaultKeyValueStoreId"),
            "started_at": run_data.get("startedAt"),
            "finished_at": run_data.get("finishedAt"),
        }

    async def get_run_status(self, run_id: str) -> Dict[str, Any]:
        """Get status of a running actor"""
        response = await self.client.get(f"/actor-runs/{run_id}")
        response.raise_for_status()
        data = response.json().get("data", {})

        return {
            "run_id": data.get("id"),
            "status": data.get("status"),
            "finished_at": data.get("finishedAt"),
        }

    async def wait_for_run(
        self,
        run_id: str,
        max_wait_secs: int = 300,
        poll_interval: float = 5.0,
    ) -> Dict[str, Any]:
        """Wait for an actor run to complete"""
        start_time = datetime.utcnow()

        while True:
            status = await self.get_run_status(run_id)

            if status["status"] in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
                return status

            elapsed = (datetime.utcnow() - start_time).total_seconds()
            if elapsed >= max_wait_secs:
                return {"run_id": run_id, "status": "TIMEOUT", "finished_at": None}

            await asyncio.sleep(poll_interval)

    async def get_dataset_items(
        self,
        dataset_id: str,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get items from a dataset"""
        response = await self.client.get(
            f"/datasets/{dataset_id}/items",
            params={"limit": limit, "offset": offset},
        )
        response.raise_for_status()
        return response.json()

    # ─────────────────────────────────────────────────────────────
    # LinkedIn Scraping
    # ─────────────────────────────────────────────────────────────

    async def scrape_linkedin_company(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape a LinkedIn company page.

        Args:
            linkedin_url: LinkedIn company URL

        Returns:
            Company data in standard format
        """
        result = await self.run_actor(
            "linkedin_company",
            {"startUrls": [{"url": linkedin_url}]},
        )

        if result["status"] != "SUCCEEDED":
            raise Exception(f"Actor failed: {result['status']}")

        items = await self.get_dataset_items(result["dataset_id"], limit=1)
        if not items:
            return None

        data = items[0]
        return self._transform_linkedin_company(data, linkedin_url)

    async def scrape_linkedin_companies(
        self,
        linkedin_urls: List[str],
    ) -> List[Dict[str, Any]]:
        """Scrape multiple LinkedIn company pages"""
        result = await self.run_actor(
            "linkedin_company",
            {"startUrls": [{"url": url} for url in linkedin_urls]},
        )

        if result["status"] != "SUCCEEDED":
            raise Exception(f"Actor failed: {result['status']}")

        items = await self.get_dataset_items(result["dataset_id"])
        return [self._transform_linkedin_company(item) for item in items]

    async def scrape_linkedin_people(
        self,
        linkedin_urls: List[str],
    ) -> List[Dict[str, Any]]:
        """
        Scrape LinkedIn profile pages.

        Args:
            linkedin_urls: List of LinkedIn profile URLs

        Returns:
            List of people data in standard format
        """
        result = await self.run_actor(
            "linkedin_people",
            {"startUrls": [{"url": url} for url in linkedin_urls]},
        )

        if result["status"] != "SUCCEEDED":
            raise Exception(f"Actor failed: {result['status']}")

        items = await self.get_dataset_items(result["dataset_id"])
        return [self._transform_linkedin_person(item) for item in items]

    async def scrape_company_employees(
        self,
        company_url: str,
        li_at_cookie: str,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Scrape employees of a LinkedIn company.

        Requires LinkedIn session cookie for authentication.

        Args:
            company_url: LinkedIn company URL
            li_at_cookie: LinkedIn li_at session cookie
            limit: Maximum employees to scrape

        Returns:
            List of employee profiles
        """
        result = await self.run_actor(
            "linkedin_employees",
            {
                "companyUrls": [company_url],
                "cookie": {"li_at": li_at_cookie},
                "maxEmployees": limit,
            },
        )

        if result["status"] != "SUCCEEDED":
            raise Exception(f"Actor failed: {result['status']}")

        items = await self.get_dataset_items(result["dataset_id"])
        return [self._transform_linkedin_person(item) for item in items]

    # ─────────────────────────────────────────────────────────────
    # Website Scraping
    # ─────────────────────────────────────────────────────────────

    async def scrape_website_contacts(self, url: str) -> Dict[str, Any]:
        """
        Extract contact information from a website.

        Args:
            url: Website URL to scrape

        Returns:
            Contact information (emails, phones, social links)
        """
        result = await self.run_actor(
            "contact_extractor",
            {"startUrls": [{"url": url}], "maxDepth": 2},
        )

        if result["status"] != "SUCCEEDED":
            raise Exception(f"Actor failed: {result['status']}")

        items = await self.get_dataset_items(result["dataset_id"])

        # Aggregate contacts from all pages
        emails = set()
        phones = set()
        social: Dict[str, str] = {}

        for item in items:
            emails.update(item.get("emails", []))
            phones.update(item.get("phones", []))
            for platform, link in item.get("socialLinks", {}).items():
                if link:
                    social[platform] = link

        return {
            "url": url,
            "emails": list(emails),
            "phones": list(phones),
            "social_links": social,
        }

    async def scrape_google_maps(
        self,
        query: str,
        location: str = "Netherlands",
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Scrape businesses from Google Maps.

        Args:
            query: Search query (e.g., "restaurants in Amsterdam")
            location: Location context
            limit: Maximum results

        Returns:
            List of business data
        """
        result = await self.run_actor(
            "google_maps",
            {
                "searchStrings": [query],
                "locationQuery": location,
                "maxCrawledPlaces": limit,
            },
        )

        if result["status"] != "SUCCEEDED":
            raise Exception(f"Actor failed: {result['status']}")

        items = await self.get_dataset_items(result["dataset_id"])
        return [self._transform_google_maps_result(item) for item in items]

    # ─────────────────────────────────────────────────────────────
    # Transform Methods
    # ─────────────────────────────────────────────────────────────

    def _transform_linkedin_company(
        self,
        data: Dict[str, Any],
        linkedin_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Transform LinkedIn company data to standard format"""
        company_id = data.get("companyId") or data.get("universalName", "")

        # Extract domain from website
        website = data.get("website")
        domain = None
        if website:
            domain = website.lower().replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

        return {
            "id": self.make_id(f"linkedin:{company_id}"),
            "name": data.get("name"),
            "linkedin_url": linkedin_url or data.get("url"),
            "tagline": data.get("tagline"),
            "description": data.get("description"),
            "website": website,
            "domain": domain,
            "industry": data.get("industry"),
            "company_size": data.get("companySize"),
            "employee_range": data.get("employeesOnLinkedIn"),
            "headquarters": data.get("headquarters"),
            "location": data.get("headquarters"),
            "founded_year": data.get("founded"),
            "specialties": data.get("specialties", []),
            "logo_url": data.get("logo"),
            "followers": data.get("followerCount"),
            "_source": "apify:linkedin",
            "_raw": data,
        }

    def _transform_linkedin_person(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform LinkedIn profile data to standard format"""
        profile_id = data.get("profileId") or data.get("publicIdentifier", "")

        # Get current company from experience
        experience = data.get("experience", [])
        current_company = experience[0].get("company") if experience else None

        return {
            "id": self.make_id(f"linkedin:{profile_id}"),
            "full_name": data.get("fullName"),
            "first_name": data.get("firstName"),
            "last_name": data.get("lastName"),
            "headline": data.get("headline"),
            "title": data.get("headline"),  # Parse title from headline
            "location": data.get("location"),
            "linkedin_url": data.get("profileUrl"),
            "connections": data.get("connectionsCount"),
            "about": data.get("about"),
            "experience": experience,
            "education": data.get("education", []),
            "skills": data.get("skills", []),
            "company_name": current_company,
            "_source": "apify:linkedin",
            "_raw": data,
        }

    def _transform_google_maps_result(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Google Maps result to standard format"""
        place_id = data.get("placeId", "")

        # Extract domain from website
        website = data.get("website")
        domain = None
        if website:
            domain = website.lower().replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

        return {
            "id": self.make_id(f"gmaps:{place_id}"),
            "name": data.get("title"),
            "website": website,
            "domain": domain,
            "phone": data.get("phone"),
            "address": data.get("address"),
            "city": data.get("city"),
            "postal_code": data.get("postalCode"),
            "country": data.get("country"),
            "location": data.get("address"),
            "latitude": data.get("location", {}).get("lat"),
            "longitude": data.get("location", {}).get("lng"),
            "rating": data.get("totalScore"),
            "review_count": data.get("reviewsCount"),
            "category": data.get("categoryName"),
            "categories": data.get("categories", []),
            "opening_hours": data.get("openingHours"),
            "_source": "apify:gmaps",
            "_raw": data,
        }
