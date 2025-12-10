import requests

from atlas.ingestors.common.base import CompanyPeopleFinder


class HunterPeopleFinder(CompanyPeopleFinder):
    """Hunter.io API people finder"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.hunter.io/v2"

    def find_by_company_domain(self, domain: str) -> list[dict]:
        """Find people at domain via Hunter.io API"""
        try:
            resp = requests.get(
                f"{self.base_url}/domain-search",
                params={"domain": domain, "api_key": self.api_key, "limit": 10},
                timeout=10,
            )

            if resp.status_code != 200:
                # Log error for debugging
                error_data = (
                    resp.json()
                    if resp.headers.get("content-type", "").startswith("application/json")
                    else {}
                )
                error_msg = (
                    error_data.get("errors", [{}])[0].get("details", "Unknown error")
                    if error_data.get("errors")
                    else resp.text[:100]
                )
                print(
                    f"    Warning: Hunter.io API error for {domain}: {resp.status_code} - {error_msg}"
                )
                return []

            data = resp.json().get("data", {})
            emails = data.get("emails", [])
        except Exception as e:
            print(f"    Warning: Hunter.io request failed for {domain}: {e}")
            return []

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
