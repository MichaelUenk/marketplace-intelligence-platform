"""
Manual ingestor for Apollo data.
For demo uses MOCK mode: generates a realistic B2B dataset.
Writes to s3://{bucket}/apollo/raw/{ISO_TS}/companies-00001.json and _meta.json
"""

import datetime
import os

from atlas.ingestors.common.s3_writer import ensure_bucket, put_json
from atlas.ingestors.common.sidecar import make_sidecar


def fetch_apollo_mock():
    # Realistic B2B dataset: 10 companies from different industries
    return {
        "companies": [
            # Tech/IT - High potential for coolers
            {
                "external_id": "apollo:techcorp",
                "id": "apollo:techcorp",
                "name": "TechCorp Solutions",
                "domain": "techcorp.com",
                "industry": "IT Services",
                "employee_count": "50-200",
                "location": "Austin",
                "people": [
                    {
                        "external_id": "apollo:u1",
                        "id": "apollo:u1",
                        "full_name": "Alex Peterson",
                        "title": "CTO",
                        "emails": ["a.peterson@techcorp.com"],
                        "department": "IT",
                    },
                    {
                        "external_id": "apollo:u2",
                        "id": "apollo:u2",
                        "full_name": "Maria Stevens",
                        "title": "HR Director",
                        "emails": ["m.stevens@techcorp.com"],
                        "department": "HR",
                    },
                ],
            },
            # Office/Facilities - Very high potential
            {
                "external_id": "apollo:officeplus",
                "id": "apollo:officeplus",
                "name": "Office Plus",
                "domain": "officeplus.com",
                "industry": "Facilities Management",
                "employee_count": "200-500",
                "location": "London",
                "people": [
                    {
                        "external_id": "apollo:u3",
                        "id": "apollo:u3",
                        "full_name": "David Brown",
                        "title": "Facilities Manager",
                        "emails": ["d.brown@officeplus.com"],
                        "department": "Facilities",
                    },
                    {
                        "external_id": "apollo:u4",
                        "id": "apollo:u4",
                        "full_name": "Emma Wilson",
                        "title": "Procurement Manager",
                        "emails": ["e.wilson@officeplus.com"],
                        "department": "Procurement",
                    },
                ],
            },
            # Restaurant/Food - High potential
            {
                "external_id": "apollo:restaurant",
                "id": "apollo:restaurant",
                "name": "Golden Dragon Restaurant",
                "domain": "golden-dragon.com",
                "industry": "Restaurant",
                "employee_count": "20-50",
                "location": "New York",
                "people": [
                    {
                        "external_id": "apollo:u5",
                        "id": "apollo:u5",
                        "full_name": "Michael Chen",
                        "title": "General Manager",
                        "emails": ["m.chen@golden-dragon.com"],
                        "department": "Management",
                    },
                    {
                        "external_id": "apollo:u6",
                        "id": "apollo:u6",
                        "full_name": "Anna Lee",
                        "title": "Head Chef",
                        "emails": ["a.lee@golden-dragon.com"],
                        "department": "Kitchen",
                    },
                ],
            },
            # Fitness/Gym - High potential
            {
                "external_id": "apollo:fitness",
                "id": "apollo:fitness",
                "name": "PowerFit Gym",
                "domain": "powerfit-gym.com",
                "industry": "Fitness",
                "employee_count": "10-50",
                "location": "Los Angeles",
                "people": [
                    {
                        "external_id": "apollo:u7",
                        "id": "apollo:u7",
                        "full_name": "James Anderson",
                        "title": "Club Director",
                        "emails": ["j.anderson@powerfit-gym.com"],
                        "department": "Management",
                    },
                    {
                        "external_id": "apollo:u8",
                        "id": "apollo:u8",
                        "full_name": "Sarah Martinez",
                        "title": "Operations Manager",
                        "emails": ["s.martinez@powerfit-gym.com"],
                        "department": "Operations",
                    },
                ],
            },
            # Manufacturing - Medium potential
            {
                "external_id": "apollo:manufacturing",
                "id": "apollo:manufacturing",
                "name": "MetalTech Industries",
                "domain": "metaltech.com",
                "industry": "Manufacturing",
                "employee_count": "500-1000",
                "location": "Chicago",
                "people": [
                    {
                        "external_id": "apollo:u9",
                        "id": "apollo:u9",
                        "full_name": "Robert Johnson",
                        "title": "Production Director",
                        "emails": ["r.johnson@metaltech.com"],
                        "department": "Production",
                    },
                    {
                        "external_id": "apollo:u10",
                        "id": "apollo:u10",
                        "full_name": "Jennifer Davis",
                        "title": "HR Manager",
                        "emails": ["j.davis@metaltech.com"],
                        "department": "HR",
                    },
                ],
            },
            # Healthcare - High potential
            {
                "external_id": "apollo:clinic",
                "id": "apollo:clinic",
                "name": "HealthPlus Medical Center",
                "domain": "healthplus-clinic.com",
                "industry": "Healthcare",
                "employee_count": "50-200",
                "location": "Boston",
                "people": [
                    {
                        "external_id": "apollo:u11",
                        "id": "apollo:u11",
                        "full_name": "Dr. William Taylor",
                        "title": "Chief Medical Officer",
                        "emails": ["dr.taylor@healthplus-clinic.com"],
                        "department": "Medical",
                    },
                    {
                        "external_id": "apollo:u12",
                        "id": "apollo:u12",
                        "full_name": "Laura Thompson",
                        "title": "Administrative Director",
                        "emails": ["l.thompson@healthplus-clinic.com"],
                        "department": "Administration",
                    },
                ],
            },
            # Education - Medium potential
            {
                "external_id": "apollo:school",
                "id": "apollo:school",
                "name": "Bright Minds Academy",
                "domain": "brightminds-academy.com",
                "industry": "Education",
                "employee_count": "20-50",
                "location": "San Francisco",
                "people": [
                    {
                        "external_id": "apollo:u13",
                        "id": "apollo:u13",
                        "full_name": "Elizabeth Moore",
                        "title": "School Principal",
                        "emails": ["e.moore@brightminds-academy.com"],
                        "department": "Management",
                    },
                    {
                        "external_id": "apollo:u14",
                        "id": "apollo:u14",
                        "full_name": "Thomas Garcia",
                        "title": "IT Coordinator",
                        "emails": ["t.garcia@brightminds-academy.com"],
                        "department": "IT",
                    },
                ],
            },
            # Retail - Medium potential
            {
                "external_id": "apollo:retail",
                "id": "apollo:retail",
                "name": "MegaMall Shopping Center",
                "domain": "megamall.com",
                "industry": "Retail",
                "employee_count": "200-500",
                "location": "Miami",
                "people": [
                    {
                        "external_id": "apollo:u15",
                        "id": "apollo:u15",
                        "full_name": "Christopher White",
                        "title": "Mall Director",
                        "emails": ["c.white@megamall.com"],
                        "department": "Management",
                    },
                    {
                        "external_id": "apollo:u16",
                        "id": "apollo:u16",
                        "full_name": "Jessica Harris",
                        "title": "Facilities Coordinator",
                        "emails": ["j.harris@megamall.com"],
                        "department": "Facilities",
                    },
                ],
            },
            # Financial Services - Low potential
            {
                "external_id": "apollo:bank",
                "id": "apollo:bank",
                "name": "FinanceInvest Bank",
                "domain": "financeinvest.com",
                "industry": "Banking",
                "employee_count": "1000+",
                "location": "New York",
                "people": [
                    {
                        "external_id": "apollo:u17",
                        "id": "apollo:u17",
                        "full_name": "Daniel Martinez",
                        "title": "IT Director",
                        "emails": ["d.martinez@financeinvest.com"],
                        "department": "IT",
                    },
                    {
                        "external_id": "apollo:u18",
                        "id": "apollo:u18",
                        "full_name": "Patricia Robinson",
                        "title": "Head of Operations",
                        "emails": ["p.robinson@financeinvest.com"],
                        "department": "Operations",
                    },
                ],
            },
            # Construction - Medium potential
            {
                "external_id": "apollo:construction",
                "id": "apollo:construction",
                "name": "BuildPro Construction",
                "domain": "buildpro.com",
                "industry": "Construction",
                "employee_count": "100-500",
                "location": "Seattle",
                "people": [
                    {
                        "external_id": "apollo:u19",
                        "id": "apollo:u19",
                        "full_name": "Matthew Clark",
                        "title": "Project Manager",
                        "emails": ["m.clark@buildpro.com"],
                        "department": "Projects",
                    },
                    {
                        "external_id": "apollo:u20",
                        "id": "apollo:u20",
                        "full_name": "Sophia Lewis",
                        "title": "Office Manager",
                        "emails": ["s.lewis@buildpro.com"],
                        "department": "Administration",
                    },
                ],
            },
        ]
    }


def main():
    bucket = os.getenv("MINIO_BUCKET", "datalake")
    ensure_bucket(bucket)
    ts = datetime.datetime.utcnow().isoformat() + "Z"
    prefix = f"apollo/raw/{ts}"
    data = fetch_apollo_mock()
    put_json(bucket, f"{prefix}/companies-00001.json", data)
    sidecar = make_sidecar("apollo.ai", count=len(data.get("companies", [])))
    put_json(bucket, f"{prefix}/_meta.json", sidecar)
    print(f"Wrote to s3://{bucket}/{prefix}")


if __name__ == "__main__":
    main()
