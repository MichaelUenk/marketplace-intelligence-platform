#!/usr/bin/env python3
"""
Atlas CLI - Unified data pipeline runner

Usage:
    # Full pipeline: Search + Enrich + Load
    python -m atlas.cli ingest "tech companies in Austin" --limit 10 --enrich --load

    # Just search (no enrichment)
    python -m atlas.cli ingest "restaurants NYC" --limit 5

    # Load existing data to Neo4j/Qdrant
    python -m atlas.cli etl enriched/raw/2025-11-03T... --qdrant
"""

import argparse
import os
import sys

from dotenv import load_dotenv

from atlas.ingestors.google_places.client import GooglePlacesIngestor
from atlas.ingestors.hunter.client import HunterPeopleFinder
from atlas.pipelines.etl_pipeline import ETLPipeline, get_minio_client, get_neo4j_driver
from atlas.pipelines.ingest_pipeline import IngestionPipeline

load_dotenv()  # noqa: E402


def cmd_ingest(args):
    places_key = os.getenv("GOOGLE_PLACES_API_KEY")
    hunter_key = os.getenv("HUNTER_API_KEY")

    if not places_key:
        print("ERROR: GOOGLE_PLACES_API_KEY not set")
        sys.exit(1)

    company_ingestor = GooglePlacesIngestor(places_key)
    people_finder = HunterPeopleFinder(hunter_key) if args.enrich and hunter_key else None

    if args.enrich and not hunter_key:
        print("WARNING: --enrich requires HUNTER_API_KEY")

    pipeline = IngestionPipeline(company_ingestor, people_finder)
    prefix = pipeline.run(args.query, args.limit)

    if args.load:
        print("\nLoading to Neo4j...")
        mc = get_minio_client()
        neo4j = get_neo4j_driver()
        etl = ETLPipeline(mc, neo4j)
        batch_id = etl.run(prefix, load_to_qdrant=args.qdrant)

        # Clear Redis cache to show fresh data immediately
        try:
            from atlas.services.query_api.cache import r

            r.flushdb()
            print("Cache cleared after data ingestion")
        except Exception as e:
            print(f"Warning: Could not clear cache: {e}")

        print(f"\nComplete! Batch: {batch_id}")
        print("Neo4j Browser: http://localhost:7474")
    else:
        print("\nData saved. To load to Neo4j:")
        print(f"   python -m atlas.cli etl {prefix}")


def cmd_etl(args):
    mc = get_minio_client()
    neo4j = get_neo4j_driver()

    etl = ETLPipeline(mc, neo4j)
    batch_id = etl.run(args.prefix, load_to_qdrant=args.qdrant)

    # Clear Redis cache to show fresh data immediately
    try:
        from atlas.services.query_api.cache import r

        r.flushdb()
        print("Cache cleared after data ingestion")
    except Exception as e:
        print(f"Warning: Could not clear cache: {e}")

    print(f"\nETL complete! Batch: {batch_id}")
    print("Neo4j Browser: http://localhost:7474")


def main():
    parser = argparse.ArgumentParser(description="Atlas Data Pipeline CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    ingest_parser = subparsers.add_parser("ingest", help="Search and ingest companies")
    ingest_parser.add_argument("query", help="Search query (e.g., 'tech companies Austin')")
    ingest_parser.add_argument("--limit", type=int, default=10, help="Max companies")
    ingest_parser.add_argument(
        "--enrich", action="store_true", help="Enrich with people data (Hunter.io)"
    )
    ingest_parser.add_argument("--load", action="store_true", help="Load to Neo4j immediately")
    ingest_parser.add_argument("--qdrant", action="store_true", help="Also load to Qdrant")

    etl_parser = subparsers.add_parser("etl", help="Load existing data to Neo4j/Qdrant")
    etl_parser.add_argument("prefix", help="MinIO prefix (e.g., enriched/raw/2025...)")
    etl_parser.add_argument("--qdrant", action="store_true", help="Also load to Qdrant")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "ingest":
        cmd_ingest(args)
    elif args.command == "etl":
        cmd_etl(args)


if __name__ == "__main__":
    main()
