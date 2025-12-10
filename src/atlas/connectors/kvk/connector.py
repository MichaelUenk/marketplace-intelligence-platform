# src/atlas/connectors/kvk/connector.py
"""
KvK (Kamer van Koophandel) Connector - Dutch Chamber of Commerce.

KvK provides:
- Company search by name, KvK number, location
- Company details (basisprofiel)
- Location/branch information (vestigingen)
- SBI codes (industry classification)

API Docs: https://developers.kvk.nl/documentation
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
from atlas.ingestors.common.base import CompanyIngestor
from atlas.connectors.utils.rate_limiter import RateLimiter
from atlas.connectors.kvk.sbi_mapping import (
    sbi_to_industry,
    get_industries_for_sbi_codes,
    translate_rechtsvorm,
)


KVK_CONFIG = ConnectorConfig(
    id="kvk",
    name="KvK (Dutch Chamber of Commerce)",
    type=ConnectorType.COMPANY,
    auth_type=AuthType.API_KEY,
    auth_fields=["api_key"],
    base_url="https://api.kvk.nl/api/v1",
    rate_limit=10,
    rate_limit_window=1,  # 10 requests per second
    supports_search=True,
    supports_enrich=True,
    supports_people=False,  # KvK doesn't provide contact data
    supports_webhook=False,
    docs_url="https://developers.kvk.nl/documentation",
    icon="/icons/kvk.svg",
    description="Official Dutch company registry with 2M+ businesses",
)


@ConnectorRegistry.register("kvk")
class KvKConnector(BaseConnector, CompanyIngestor):
    """
    KvK (Dutch Chamber of Commerce) API connector.

    Provides access to official Dutch company registry data including:
    - Company search and lookup
    - Legal information (rechtsvorm)
    - Industry classification (SBI codes)
    - Location data (vestigingen)
    """

    config = KVK_CONFIG

    def __init__(self, api_key: str):
        """
        Initialize KvK connector.

        Args:
            api_key: KvK API key from https://developers.kvk.nl
        """
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=self.config.base_url,
            headers={
                "apikey": api_key,
                "Accept": "application/json",
            },
            timeout=30.0,
        )
        self.rate_limiter = RateLimiter(
            connector_id="kvk",
            limit=self.config.rate_limit,
            window=self.config.rate_limit_window,
        )

    @property
    def source_prefix(self) -> str:
        return "kvk"

    async def test_connection(self) -> bool:
        """Test if API key is valid"""
        try:
            # Use a minimal search to test credentials
            response = await self.client.get(
                "/zoeken",
                params={"naam": "test", "resultatenPerPagina": 1},
            )
            return response.status_code in [200, 404]  # 404 is ok if no results
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
        Search Dutch companies.

        Args:
            query: Company name or keyword
            limit: Maximum results (max 100)
            filters: Optional filters
                - kvk_number: Exact KvK number
                - city: City name (plaats)
                - postal_code: Postal code
                - type: "hoofdvestiging" | "nevenvestiging" | "rechtspersoon"

        Returns:
            List of company records in standard format
        """
        await self.rate_limiter.wait_and_acquire()

        params: Dict[str, Any] = {
            "naam": query,
            "pagina": 1,
            "resultatenPerPagina": min(limit, 100),
        }

        if filters:
            if "kvk_number" in filters:
                params["kvkNummer"] = filters["kvk_number"]
            if "city" in filters:
                params["plaats"] = filters["city"]
            if "postal_code" in filters:
                params["postcode"] = filters["postal_code"]
            if "type" in filters:
                params["type"] = filters["type"]

        response = await self.client.get("/zoeken", params=params)
        response.raise_for_status()
        data = response.json()

        companies = []
        for item in data.get("resultaten", []):
            companies.append(self._transform_search_result(item))

        return companies

    async def get_by_kvk_number(self, kvk_number: str) -> Optional[Dict[str, Any]]:
        """
        Get company details by KvK number.

        Args:
            kvk_number: 8-digit KvK number

        Returns:
            Company details in standard format, or None if not found
        """
        await self.rate_limiter.wait_and_acquire()

        response = await self.client.get(f"/basisprofielen/{kvk_number}")

        if response.status_code == 404:
            return None

        response.raise_for_status()
        return self._transform_basisprofiel(response.json())

    async def get_vestigingen(self, kvk_number: str) -> List[Dict[str, Any]]:
        """
        Get all locations/branches for a company.

        Args:
            kvk_number: 8-digit KvK number

        Returns:
            List of location records
        """
        await self.rate_limiter.wait_and_acquire()

        response = await self.client.get(f"/vestigingsprofielen/{kvk_number}")

        if response.status_code == 404:
            return []

        response.raise_for_status()
        data = response.json()

        locations = []
        for vestiging in data.get("vestigingen", []):
            locations.append(self._transform_vestiging(vestiging))

        return locations

    async def enrich_company(self, kvk_number: str) -> Optional[Dict[str, Any]]:
        """
        Enrich company with full details from KvK.

        Combines basisprofiel and vestigingen data.

        Args:
            kvk_number: 8-digit KvK number

        Returns:
            Full company details, or None if not found
        """
        company = await self.get_by_kvk_number(kvk_number)
        if not company:
            return None

        # Get locations
        locations = await self.get_vestigingen(kvk_number)
        company["locations"] = locations

        # Find headquarters
        headquarters = next(
            (loc for loc in locations if loc.get("is_hoofdvestiging")),
            locations[0] if locations else None,
        )

        if headquarters:
            company["website"] = headquarters.get("website")
            company["phone"] = headquarters.get("phone")
            company["email"] = headquarters.get("email")
            company["address"] = headquarters.get("address")

        return company

    # ─────────────────────────────────────────────────────────────
    # Transform Methods
    # ─────────────────────────────────────────────────────────────

    def _transform_search_result(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Transform search result to standard format"""
        kvk_number = item.get("kvkNummer", "")

        return {
            "id": self.make_id(kvk_number),
            "kvk_number": kvk_number,
            "name": item.get("naam"),
            "trade_names": item.get("handelsnamen", []),
            "location": item.get("plaats"),
            "city": item.get("plaats"),
            "street": item.get("straatnaam"),
            "postal_code": item.get("postcode"),
            "country": "Netherlands",
            "type": item.get("type"),  # hoofdvestiging, nevenvestiging, rechtspersoon
            "legal_form": None,  # Not in search results
            "industry": None,    # Need to map SBI codes from basisprofiel
            "employee_count": None,
            "website": None,
            "domain": None,
            "_source": "kvk",
            "_raw": item,
        }

    def _transform_basisprofiel(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform basisprofiel to standard format"""
        kvk_number = data.get("kvkNummer", "")

        # Extract SBI codes and map to industry
        sbi_activities = data.get("sbiActiviteiten", [])
        sbi_codes = [sbi.get("sbiCode") for sbi in sbi_activities if sbi.get("sbiCode")]
        industries = get_industries_for_sbi_codes(sbi_codes)
        primary_industry = industries[0] if industries else None

        # Translate legal form
        rechtsvorm = data.get("rechtsvorm", "")
        legal_form_en = translate_rechtsvorm(rechtsvorm)

        return {
            "id": self.make_id(kvk_number),
            "kvk_number": kvk_number,
            "rsin": data.get("rsin"),
            "name": data.get("naam"),
            "legal_form": legal_form_en,
            "legal_form_nl": rechtsvorm,
            "founding_date": data.get("datumOprichting"),
            "registration_date": data.get("datumRegistratie"),
            "sbi_codes": [
                {
                    "code": sbi.get("sbiCode"),
                    "description": sbi.get("sbiOmschrijving"),
                    "industry": sbi_to_industry(sbi.get("sbiCode", "")),
                }
                for sbi in sbi_activities
            ],
            "industry": primary_industry,
            "industries": industries,
            "employee_count": data.get("totaalWerkzamePersonen"),
            "is_active": data.get("indNonMailing") != "Ja",
            "country": "Netherlands",
            "_source": "kvk",
            "_raw": data,
        }

    def _transform_vestiging(self, vestiging: Dict[str, Any]) -> Dict[str, Any]:
        """Transform vestiging (location/branch) to standard format"""
        vestigingsnummer = vestiging.get("vestigingsnummer", "")

        # Format addresses
        bezoekadres = vestiging.get("bezoekadres", {})
        postadres = vestiging.get("postadres", {})

        # Get first website if available
        websites = vestiging.get("websites", [])
        website = websites[0] if websites else None

        # Extract domain from website
        domain = None
        if website:
            domain = website.lower().replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

        return {
            "id": self.make_id(vestigingsnummer),
            "vestigingsnummer": vestigingsnummer,
            "is_hoofdvestiging": vestiging.get("indHoofdvestiging") == "Ja",
            "name": vestiging.get("eersteHandelsnaam"),
            "trade_names": vestiging.get("handelsnamen", []),
            "address": self._format_address(bezoekadres),
            "postal_address": self._format_address(postadres),
            "city": bezoekadres.get("plaats"),
            "postal_code": bezoekadres.get("postcode"),
            "country": "Netherlands",
            "phone": vestiging.get("telefoonnummer"),
            "email": vestiging.get("emailadres"),
            "website": website,
            "domain": domain,
            "sbi_codes": vestiging.get("sbiActiviteiten", []),
            "employees": vestiging.get("totaalWerkzamePersonen"),
        }

    def _format_address(self, addr: Dict[str, Any]) -> Optional[str]:
        """Format address dict to string"""
        if not addr:
            return None

        parts = []

        # Street with house number
        if addr.get("straatnaam"):
            street = addr["straatnaam"]
            if addr.get("huisnummer"):
                street += f" {addr['huisnummer']}"
            if addr.get("huisnummertoevoeging"):
                street += addr["huisnummertoevoeging"]
            parts.append(street)

        # Postal code and city
        if addr.get("postcode"):
            parts.append(addr["postcode"])
        if addr.get("plaats"):
            parts.append(addr["plaats"])

        return ", ".join(parts) if parts else None

    # ─────────────────────────────────────────────────────────────
    # Sync methods for compatibility
    # ─────────────────────────────────────────────────────────────

    def search_sync(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Synchronous search wrapper"""
        import asyncio
        return asyncio.get_event_loop().run_until_complete(self.search(query, limit))
