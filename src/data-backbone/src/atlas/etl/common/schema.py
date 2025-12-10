"""Pydantic models for ETL data validation"""

from pydantic import BaseModel


class Company(BaseModel):
    """Company model for Apollo ETL"""

    id: str
    name: str
    domain: str
    industry: str | None = None
    employee_count: int | None = None
    location: str | None = None
    people: list[dict] | None = None
