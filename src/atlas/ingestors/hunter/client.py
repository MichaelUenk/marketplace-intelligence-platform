import requests

from atlas.ingestors.common.base import CompanyPeopleFinder


class HunterPeopleFinder(CompanyPeopleFinder):
    """Hunter.io API people finder"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.hunter.io/v2"

    def find_by_company_domain(self, domain: str) -> list[dict]:
        """Find people at domain via Hunter.io API"""
        resp = requests.get(
            f"{self.base_url}/domain-search",
            params={"domain": domain, "api_key": self.api_key, "limit": 10},
        )

        if resp.status_code != 200:
            return []

        data = resp.json().get("data", {})
        emails = data.get("emails", [])

        people = []
        for email_obj in emails:
            people.append(
                {
                    "id": f"hunter:{email_obj.get('value', '')}",
                    "external_id": f"hunter:{email_obj.get('value', '')}",
                    "full_name": f"{email_obj.get('first_name', '')} {email_obj.get('last_name', '')}".strip(),
                    "title": email_obj.get("position"),
                    "department": email_obj.get("department"),
                    "seniority": email_obj.get("seniority"),
                    "emails": [email_obj.get("value")],
                    "linkedin": email_obj.get("linkedin"),
                    "confidence": email_obj.get("confidence"),
                }
            )

        return people
