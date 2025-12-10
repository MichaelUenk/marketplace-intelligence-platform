import datetime
import os

from atlas.ingestors.common.base import CompanyIngestor, CompanyPeopleFinder
from atlas.ingestors.common.s3_writer import ensure_bucket, put_json
from atlas.ingestors.common.sidecar import make_sidecar


class IngestionPipeline:
    """
    Unified ingestion pipeline that orchestrates company search and optional people enrichment.

    High-level flow:
    1. Search for companies using a CompanyIngestor (e.g., Google Places)
    2. Optionally enrich each company with people data using a CompanyPeopleFinder (e.g., Hunter.io)
    3. Save the results to MinIO data lake with metadata

    Returns a MinIO prefix that can be used for subsequent ETL processing.
    """

    def __init__(
        self,
        company_ingestor: CompanyIngestor,
        people_finder: CompanyPeopleFinder | None = None,
    ):
        self.company_ingestor = company_ingestor
        self.people_finder = people_finder

    def run(self, query: str, limit: int = 20) -> str:
        """
        Run full pipeline: search → enrich → save to MinIO
        Returns: MinIO prefix for ETL
        """
        bucket = os.getenv("MINIO_BUCKET", "datalake")
        ensure_bucket(bucket)

        # Step 1: Search companies
        print(f"Searching: {query}")
        companies = self.company_ingestor.search(query, limit)
        print(f"Found {len(companies)} companies")

        if not companies:
            raise ValueError("No companies found")

        # Step 2: Enrich with people (optional)
        if self.people_finder:
            print("Enriching with people data...")
            for i, company in enumerate(companies, 1):
                domain = company.get("domain")
                print(f"  {i}/{len(companies)} {company['name']} ({domain})")
                people = self.people_finder.find_by_company_domain(domain)
                company["people"] = people
                print(f"    Found {len(people)} people")

        # Step 3: Save to MinIO
        ts = datetime.datetime.utcnow().isoformat() + "Z"
        source = "enriched" if self.people_finder else "companies"
        prefix = f"{source}/raw/{ts}"

        data = {"companies": companies}
        put_json(bucket, f"{prefix}/companies.json", data)

        sidecar = make_sidecar("ingestion_pipeline", count=len(companies))
        put_json(bucket, f"{prefix}/_meta.json", sidecar)

        print(f"\nSaved to s3://{bucket}/{prefix}")
        return prefix
