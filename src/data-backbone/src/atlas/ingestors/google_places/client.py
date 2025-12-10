import re
from urllib.parse import urlparse

import requests

from atlas.ingestors.common.base import CompanyIngestor


class GooglePlacesIngestor(CompanyIngestor):
    """Google Places API ingestor"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    def _normalize_industry(self, industry: str) -> str:
        """Normalize industry name to standard format"""
        if not industry:
            return industry

        # Standardize common variations
        normalization_map = {
            "it services": "IT Services",
            "it": "IT Services",
            "technology": "IT Services",
            "tech": "IT Services",
            "software": "IT Services",
            "hr": "Human Resources",
            "human resources": "Human Resources",
            "recruiting": "Human Resources",
            "staffing": "Human Resources",
            "healthcare": "Healthcare",
            "health care": "Healthcare",
            "medical": "Healthcare",
            "restaurant": "Restaurant",
            "food": "Restaurant",
            "dining": "Restaurant",
            "retail": "Retail",
            "shopping": "Retail",
            "education": "Education",
            "school": "Education",
            "banking": "Banking",
            "finance": "Banking",
            "financial": "Banking",
            "construction": "Construction",
            "manufacturing": "Manufacturing",
            "fitness": "Fitness",
            "gym": "Fitness",
        }

        normalized = industry.lower().strip()
        return normalization_map.get(normalized, industry.title())

    def _extract_industry_from_types(self, types: list[str]) -> str | None:
        """Extract industry from Google Places types"""
        if not types:
            return None

        # Comprehensive mapping of Google Places types to industries
        # Based on official Google Places API types
        type_to_industry = {
            # Technology & IT
            "software_company": "IT Services",
            "computer_store": "IT Services",
            "electronics_store": "IT Services",
            "internet_cafe": "IT Services",
            "technology": "IT Services",
            # Human Resources & Staffing
            "employment_agency": "Human Resources",
            "recruiting_agency": "Human Resources",
            "staffing_agency": "Human Resources",
            "hr_consultant": "Human Resources",
            "human_resources": "Human Resources",
            # Food & Dining
            "restaurant": "Restaurant",
            "cafe": "Restaurant",
            "food": "Restaurant",
            "meal_takeaway": "Restaurant",
            "meal_delivery": "Restaurant",
            "bakery": "Restaurant",
            "bar": "Restaurant",
            # Healthcare
            "hospital": "Healthcare",
            "doctor": "Healthcare",
            "dentist": "Healthcare",
            "pharmacy": "Healthcare",
            "physiotherapist": "Healthcare",
            "veterinary_care": "Healthcare",
            "health": "Healthcare",
            # Fitness & Sports
            "gym": "Fitness",
            "spa": "Fitness",
            "beauty_salon": "Fitness",
            # Retail
            "store": "Retail",
            "shopping_mall": "Retail",
            "clothing_store": "Retail",
            "supermarket": "Retail",
            "convenience_store": "Retail",
            # Education
            "school": "Education",
            "university": "Education",
            "library": "Education",
            # Finance
            "bank": "Banking",
            "atm": "Banking",
            "accounting": "Banking",
            "insurance_agency": "Banking",
            # Construction & Real Estate
            "construction": "Construction",
            "general_contractor": "Construction",
            "real_estate_agency": "Construction",
            # Manufacturing
            "factory": "Manufacturing",
            "industrial": "Manufacturing",
            # Legal
            "lawyer": "Legal",
            "law_firm": "Legal",
            # Marketing & Advertising
            "advertising_agency": "Marketing",
            "marketing_agency": "Marketing",
            # Consulting
            "consulting": "Consulting",
            "business_consultant": "Consulting",
            # Transportation
            "car_dealer": "Automotive",
            "car_rental": "Automotive",
            "gas_station": "Automotive",
        }

        # Filter out generic types
        generic_types = {
            "establishment",
            "point_of_interest",
            "locality",
            "political",
            "route",
            "street_address",
            "premise",
            "subpremise",
            "postal_code",
        }

        # Check types in order (most specific first)
        for place_type in types:
            if place_type in generic_types:
                continue

            # Direct match
            if place_type in type_to_industry:
                return self._normalize_industry(type_to_industry[place_type])

            # Partial match (e.g., "hr_consultant" contains "hr")
            for mapped_type, industry in type_to_industry.items():
                if mapped_type in place_type or place_type in mapped_type:
                    return self._normalize_industry(industry)

        # If no match found, try to infer from meaningful types
        meaningful_types = [t for t in types if t not in generic_types]
        if meaningful_types:
            # Try to format the first meaningful type
            first_type = meaningful_types[0]
            formatted = first_type.replace("_", " ").title()
            return self._normalize_industry(formatted)

        return None

    def _infer_industry_from_name(self, name: str) -> str | None:
        """Infer industry from company name when Google Places types are too generic"""
        if not name:
            return None

        name_lower = name.lower()

        # Keywords mapping for common industries
        industry_keywords = {
            "Human Resources": [
                "hr",
                "human resources",
                "recruiting",
                "staffing",
                "talent",
                "peopleworks",
                "employment",
            ],
            "IT Services": [
                "tech",
                "technology",
                "software",
                "it",
                "digital",
                "systems",
                "solutions",
                "cyber",
            ],
            "Healthcare": [
                "health",
                "medical",
                "hospital",
                "clinic",
                "care",
                "wellness",
                "physician",
            ],
            "Legal": ["law", "attorney", "legal", "lawyer", "law firm", "justice"],
            "Marketing": ["marketing", "advertising", "branding", "media", "agency", "creative"],
            "Construction": ["construction", "build", "contractor", "remodel", "renovation"],
            "Restaurant": ["restaurant", "cafe", "dining", "food", "bistro", "grill", "kitchen"],
            "Retail": ["store", "shop", "retail", "market", "mall"],
            "Education": ["school", "academy", "university", "college", "education", "learning"],
            "Banking": ["bank", "finance", "financial", "credit", "lending", "capital"],
            "Fitness": ["gym", "fitness", "health", "wellness", "training", "athletic"],
        }

        for industry, keywords in industry_keywords.items():
            for keyword in keywords:
                if keyword in name_lower:
                    return industry

        return None

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

            types = place.get("types", [])
            name = place.get("name", "")

            # Extract industry from Google Places types
            industry = self._extract_industry_from_types(types)

            # If types are too generic, try to infer from company name
            if not industry:
                industry = self._infer_industry_from_name(name)

            # Extract and normalize city from full address
            full_address = place.get("formatted_address") or place.get("vicinity")
            city = self._extract_city_from_address(full_address) if full_address else None

            companies.append(
                {
                    "id": f"places:{place['place_id']}",
                    "external_id": f"places:{place['place_id']}",
                    "name": place.get("name"),
                    "domain": domain,
                    "location": city
                    or full_address,  # Use city if extracted, otherwise full address
                    "rating": place.get("rating"),
                    "user_ratings_total": place.get("user_ratings_total"),
                    "types": types,
                    "industry": industry,  # Add extracted industry
                    "website": website,
                }
            )

        return companies

    def _normalize_city(self, city: str) -> str:
        """Normalize city name to standard format"""
        if not city:
            return city

        # Remove common suffixes and normalize
        city = city.strip()

        # Remove state abbreviations (e.g., "Austin TX" -> "Austin")
        # US states are typically 2 letters
        parts = city.split()
        if len(parts) > 1 and len(parts[-1]) == 2 and parts[-1].isupper():
            city = " ".join(parts[:-1])

        # Remove ZIP codes (e.g., "Austin 78701" -> "Austin")
        # Also remove Russian postal codes (6 digits)
        parts = city.split()
        if parts and (parts[-1].isdigit() or (len(parts[-1]) == 6 and parts[-1][:3].isdigit())):
            city = " ".join(parts[:-1])

        # Remove building numbers and codes (e.g., "30C11", "35Бк2", "39")
        # These are often at the start
        city = re.sub(r"^\d+[A-Za-zА-Яа-я]?\d*", "", city).strip()
        city = re.sub(
            r"^стр\.?\s*\d+", "", city, flags=re.IGNORECASE
        ).strip()  # стр = Russian "building"
        city = re.sub(
            r"^этаж\s*\d+", "", city, flags=re.IGNORECASE
        ).strip()  # этаж = Russian "floor"

        # Standardize common city name variations
        city_normalization = {
            "new york city": "New York",
            "nyc": "New York",
            "san francisco": "San Francisco",
            "sf": "San Francisco",
            "los angeles": "Los Angeles",
            "la": "Los Angeles",
            "washington dc": "Washington",
            "washington d.c.": "Washington",
            "dc": "Washington",
            "moscow": "Moscow",
            "москва": "Moscow",  # Russian spelling
        }

        normalized = city.lower().strip()
        if normalized in city_normalization:
            return city_normalization[normalized]

        # Title case for consistency
        return city.title()

    def _extract_city_from_address(self, address: str) -> str | None:
        """Extract city from full Google Places address and normalize it"""
        if not address:
            return None
        try:
            # Google Places addresses format varies:
            # US: "Street, City, State ZIP, Country"
            # RU: "Street, City, Country, Postal Code" or "Street, City, Postal Code, Country"
            # Example US: "1817 Camino Viejo, Austin, TX 78758, United States"
            # Example RU: "Krasnoproletarskaya Ulitsa, 36, Moscow, Russia, 123001"

            parts = [p.strip() for p in address.split(",")]

            if len(parts) >= 2:
                # Find city by looking for it before country or postal code
                # US format: "Street, City, State ZIP, Country"
                # RU format: "Street, Number, City, Country, Postal" or "Street, City, Country, Postal"

                # First, find position of country
                country_idx = None
                for i, part in enumerate(parts):
                    part_lower = part.lower()
                    if part_lower in [
                        "united states",
                        "usa",
                        "russia",
                        "россия",
                        "russian federation",
                    ]:  # россия = Russian "Russia"
                        country_idx = i
                        break

                # If country found, city is usually right before it
                if country_idx is not None and country_idx > 0:
                    city_candidate = parts[country_idx - 1].strip()
                    # Check if it's not a number or postal code
                    is_digit = city_candidate.isdigit()
                    is_postal = len(city_candidate) == 6 and city_candidate[:3].isdigit()
                    if not is_digit and not is_postal:
                        normalized = self._normalize_city(city_candidate)
                        if normalized and len(normalized) > 2:
                            return normalized

                # Try to find postal code, city is usually before it
                for i, part in enumerate(parts):
                    # Check if it's a postal code (6 digits for RU, 5 digits for US)
                    if (
                        (part.isdigit() and (len(part) == 6 or len(part) == 5))
                        or (len(part) == 6 and part[:3].isdigit())
                    ) and i > 0:
                        city_candidate = parts[i - 1]
                        # Skip if it's a state abbreviation (2 uppercase letters)
                        if not (len(city_candidate) == 2 and city_candidate.isupper()):
                            normalized = self._normalize_city(city_candidate)
                            if normalized and len(normalized) > 2:
                                return normalized

                # Fallback: try parts[1] or parts[2] (common positions)
                for idx in [1, 2]:
                    if len(parts) > idx:
                        candidate = parts[idx]
                        # Skip numbers, state abbreviations, countries
                        candidate_lower = candidate.lower()
                        if (
                            not candidate.isdigit()
                            and not (len(candidate) == 2 and candidate.isupper())
                            and candidate_lower
                            not in [
                                "united states",
                                "usa",
                                "russia",
                                "россия",
                                "russian federation",
                            ]
                        ):  # россия = Russian "Russia"
                            normalized = self._normalize_city(candidate)
                            if normalized and len(normalized) > 2 and not normalized.isdigit():
                                return normalized

            # Last resort: try to find city-like words in the address
            # Common city patterns
            city_patterns = [
                r"\b(Moscow|Moscow City|Moskva|Москва)\b",  # Москва = Russian "Moscow"
                r"\b(Austin|San Francisco|New York|Los Angeles|Boston|Seattle|Chicago|Miami)\b",
                r"\b(London|Paris|Berlin|Tokyo|Sydney)\b",
            ]
            for pattern in city_patterns:
                match = re.search(pattern, address, re.IGNORECASE)
                if match:
                    return self._normalize_city(match.group(1))

            return None
        except Exception:
            # If parsing fails, return None (don't use full address)
            return None

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
