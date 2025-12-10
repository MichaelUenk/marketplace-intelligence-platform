from datetime import UTC, datetime

from ulid import ULID


def make_sidecar(source: str, count: int, schema_version: str = "v0") -> dict:
    return {
        "source": source,
        "fetched_at": datetime.now(UTC).isoformat(),
        "ingest_id": str(ULID()),
        "batch_id": str(ULID()),
        "schema_version": schema_version,
        "count": count,
    }
