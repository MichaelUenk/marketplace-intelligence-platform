from urllib.parse import urlparse

import requests

from atlas.ingestors.common.base import CompanyIngestor


class GooglePlacesIngestor(CompanyIngestor):
    """Google Places API ingestor"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    def search(self, query: str, limit: int = 20) -> list[dict]:
        """Search companies"""
        resp = requests.get(
            f"{self.base_url}/textsearch/json",
            params={"query": query, "key": self.api_key},
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") != "OK":
            return []

        companies = []
        for place in data.get("results", [])[:limit]:
            detail_resp = requests.get(
                f"{self.base_url}/details/json",
                params={
                    "place_id": place["place_id"],
                    "key": self.api_key,
                    "fields": "website,name",
                },
            )
            detail = detail_resp.json().get("result", {})
            website = detail.get("website")
            domain = self._extract_domain(website)

            if not domain:
                continue

            companies.append(
                {
                    "id": f"places:{place['place_id']}",
                    "external_id": f"places:{place['place_id']}",
                    "name": place.get("name"),
                    "domain": domain,
                    "location": place.get("formatted_address") or place.get("vicinity"),
                    "rating": place.get("rating"),
                    "user_ratings_total": place.get("user_ratings_total"),
                    "types": place.get("types", []),
                    "website": website,
                }
            )

        return companies

    def _extract_domain(self, url: str) -> str | None:
        """Extract clean domain(without www prefix)"""
        if not url:
            return None
        try:
            if not url.startswith("http"):
                url = f"https://{url}"
            domain = urlparse(url).netloc
            return domain[4:] if domain.startswith("www.") else domain
        except Exception:
            return None
