import os

from atlas.ingestors.google_places.client import GooglePlacesIngestor
from atlas.pipelines.ingest_pipeline import IngestionPipeline


def main():
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_PLACES_API_KEY not set")
        return

    query = os.getenv("PLACES_QUERY", "restaurants in New York")
    limit = int(os.getenv("PLACES_LIMIT", "20"))

    ingestor = GooglePlacesIngestor(api_key)
    pipeline = IngestionPipeline(ingestor)
    prefix = pipeline.run(query, limit)

    print(f"Prefix: {prefix}")


if __name__ == "__main__":
    main()
