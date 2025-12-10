from __future__ import annotations

import argparse
import os
from datetime import datetime, timezone
from typing import Iterable, List, Optional, Tuple

from minio import Minio
from dotenv import load_dotenv

def _bool_env(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return str(v).lower() in {"1", "true", "yes", "on"}


def minio_client() -> Minio:
    """
    Dev defaults: http, local compose.
    Honors:
      MINIO_ENDPOINT (default: minio:9000)
      MINIO_ACCESS_KEY / MINIO_ROOT_USER
      MINIO_SECRET_KEY / MINIO_ROOT_PASSWORD
      MINIO_SECURE (true/false)  -> default False
    """
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    access_key = os.getenv("MINIO_ACCESS_KEY", os.getenv("MINIO_ROOT_USER", "minioadmin"))
    secret_key = os.getenv("MINIO_SECRET_KEY", os.getenv("MINIO_ROOT_PASSWORD", "minioadmin"))
    secure = _bool_env("MINIO_SECURE", False)
    # Minio SDK expects host[:port] without scheme if secure is given explicitly
    endpoint = endpoint.replace("http://", "").replace("https://", "")
    return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)


def list_keys(
    client: Minio,
    bucket: str,
    prefix: str,
    limit: int,
) -> List[Tuple[str, int, Optional[datetime]]]:
    objs = client.list_objects(bucket, prefix=prefix, recursive=True)
    out: List[Tuple[str, int, Optional[datetime]]] = []
    for o in objs:
        # Only list "files"
        if not o.object_name.endswith("/"):
            out.append((o.object_name, getattr(o, "size", 0), getattr(o, "last_modified", None)))
    # Sort by last_modified desc if available
    out.sort(key=lambda x: (x[2] or datetime.fromtimestamp(0, tz=timezone.utc)), reverse=True)
    return out[:limit]


def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="List MinIO (Data Lake) content")
    parser.add_argument("--bucket", default=os.getenv("MINIO_BUCKET", "datalake"))
    parser.add_argument("--prefix", default=os.getenv("LAKE_PREFIX", "apollo/raw/"))
    parser.add_argument("--limit", type=int, default=int(os.getenv("LAKE_LIMIT", "100")))
    args = parser.parse_args()

    mc = minio_client()

    # Print buckets for quick context
    buckets = mc.list_buckets()
    print("# Buckets:")
    for b in buckets:
        print(f"- {b.name}")

    print(f"\n# Listing: s3://{args.bucket}/{args.prefix} (limit={args.limit})\n")

    try:
        rows = list_keys(mc, args.bucket, args.prefix, args.limit)
    except Exception as e:
        print(f"ERROR: {e}")
        return

    if not rows:
        print("(no objects)")
        return

    for key, size, lm in rows:
        ts = lm.astimezone().isoformat(timespec="seconds") if lm else "-"
        print(f"{ts}  {size:>10}  {key}")


if __name__ == "__main__":
    main()
