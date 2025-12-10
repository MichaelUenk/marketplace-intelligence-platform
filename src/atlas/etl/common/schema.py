from pydantic import BaseModel


class Person(BaseModel):
    id: str
    external_id: str
    full_name: str
    title: str | None = None
    department: str | None = None
    emails: list[str] = []


class Company(BaseModel):
    id: str
    external_id: str
    name: str
    domain: str | None = None
    industry: str | None = None
    employee_count: str | None = None
    location: str | None = None
    people: list[Person] = []
