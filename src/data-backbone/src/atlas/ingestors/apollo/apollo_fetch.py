"""Mock Apollo data generator - creates sample companies and people in MinIO"""

import os
from datetime import UTC, datetime

from atlas.ingestors.common.s3_writer import put_json


def generate_mock_companies(count: int = 10) -> list[dict]:
    """Generate mock company data"""
    companies = []
    for i in range(1, count + 1):
        companies.append(
            {
                "id": f"apollo:c{i}",
                "external_id": f"apollo:c{i}",
                "name": f"TechCorp {i}",
                "domain": f"techcorp{i}.com",
                "industry": "IT Services",
                "employee_count": 50 + i * 10,
                "location": "San Francisco",
                "people": [
                    {
                        "id": f"apollo:u{i}-1",
                        "external_id": f"apollo:u{i}-1",
                        "full_name": f"John Doe {i}",
                        "title": "CEO",
                        "department": "Management",
                        "emails": [f"john{i}@techcorp{i}.com"],
                    },
                    {
                        "id": f"apollo:u{i}-2",
                        "external_id": f"apollo:u{i}-2",
                        "full_name": f"Jane Smith {i}",
                        "title": "CTO",
                        "department": "IT",
                        "emails": [f"jane{i}@techcorp{i}.com"],
                    },
                ],
            }
        )
    return companies


def main():
    """Generate mock Apollo data and save to MinIO"""
    bucket = os.getenv("MINIO_BUCKET", "datalake")
    timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    prefix = f"apollo/raw/{timestamp}"

    companies = generate_mock_companies(count=10)
    data = {"companies": companies}

    key = f"{prefix}/companies-00001.json"
    put_json(bucket, key, data)

    print(f"Generated {len(companies)} companies")
    print(f"Saved to s3://{bucket}/{key}")
    print(f"Prefix: {prefix}")


if __name__ == "__main__":
    main()
