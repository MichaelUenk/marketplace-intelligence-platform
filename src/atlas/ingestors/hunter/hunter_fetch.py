import json
import os

from atlas.ingestors.common.s3_writer import get_client
from atlas.ingestors.hunter.client import HunterPeopleFinder
from atlas.pipelines.ingest_pipeline import IngestionPipeline


class DummyIngestor:
    def __init__(self, places_prefix: str):
        self.prefix = places_prefix

    def search(self, query: str, limit: int = 20) -> list[dict]:
        bucket = os.getenv("MINIO_BUCKET", "datalake")
        mc = get_client()
        obj = mc.get_object(bucket, f"{self.prefix}/companies.json")
        data = json.loads(obj.read().decode("utf-8"))
        return data.get("companies", [])


def main():
    hunter_key = os.getenv("HUNTER_API_KEY")
    places_prefix = os.getenv("PLACES_PREFIX")

    if not hunter_key or not places_prefix:
        print("ERROR: HUNTER_API_KEY and PLACES_PREFIX required")
        return

    ingestor = DummyIngestor(places_prefix)
    enricher = HunterPeopleFinder(hunter_key)
    pipeline = IngestionPipeline(ingestor, enricher)

    prefix = pipeline.run("", limit=999)
    print(f"Prefix: {prefix}")


if __name__ == "__main__":
    main()
