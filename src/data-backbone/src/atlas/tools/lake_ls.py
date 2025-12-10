"""List objects in MinIO data lake"""

import argparse
import os
from datetime import datetime

from dotenv import load_dotenv
from minio import Minio

load_dotenv()


def minio_client() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    user = os.getenv("MINIO_ROOT_USER", "minioadmin")
    pwd = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    secure = os.getenv("MINIO_SECURE", "false").lower() in {"true", "1"}
    return Minio(endpoint, access_key=user, secret_key=pwd, secure=secure)


def main():
    parser = argparse.ArgumentParser(description="List MinIO data lake objects")
    parser.add_argument("--prefix", default="", help="Prefix to filter (e.g., 'apollo/raw/')")
    parser.add_argument("--limit", type=int, default=100, help="Max objects to list")
    args = parser.parse_args()

    mc = minio_client()
    bucket = os.getenv("MINIO_BUCKET", "datalake")

    objects = list(mc.list_objects(bucket, prefix=args.prefix, recursive=True))
    objects.sort(key=lambda o: o.last_modified, reverse=True)

    print(f"Found {len(objects)} objects in s3://{bucket}/{args.prefix}")
    print()

    for i, obj in enumerate(objects[: args.limit], 1):
        size_mb = obj.size / (1024 * 1024) if obj.size else 0
        mod_time = obj.last_modified.strftime("%Y-%m-%d %H:%M:%S") if obj.last_modified else "N/A"
        print(f"{i:4d}. {obj.object_name} ({size_mb:.2f} MB, {mod_time})")

    if len(objects) > args.limit:
        print(f"\n... and {len(objects) - args.limit} more")


if __name__ == "__main__":
    main()

