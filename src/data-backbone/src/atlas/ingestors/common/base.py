from abc import ABC, abstractmethod


class CompanyIngestor(ABC):
    @abstractmethod
    def search(self, query: str, limit: int = 20) -> list[dict]:
        """
        Search for companies and return standardized format:
        {
            "id": "source:unique_id",
            "name": "Company Name",
            "domain": "example.com",  # required
            "location": "City, Country",
            "website": "https://...",
            ...
        }
        """
        pass


class CompanyPeopleFinder(ABC):
    """
    Abstract base class for finding people at a company by domain.
    Takes a company domain and returns a list of people associated with that company.
    """

    @abstractmethod
    def find_by_company_domain(self, domain: str) -> list[dict]:
        """
        Find people at company domain and return standardized format:
        {
            "id": "source:unique_id",
            "full_name": "John Doe",
            "title": "CTO",
            "emails": ["john@example.com"],
            "department": "engineering",
            "seniority": "executive",
            ...
        }
        """
        pass
