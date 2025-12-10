import json
import os
from io import BytesIO
from urllib.parse import urlparse

from minio import Minio


def get_client() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    access_key = os.getenv("MINIO_ROOT_USER", os.getenv("MINIO_ACCESS_KEY", "minioadmin"))
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", os.getenv("MINIO_SECRET_KEY", "minioadmin"))

    # 1) Explicit override wins (MINIO_SECURE=true/false/1/0/yes/no)
    secure_env = os.getenv("MINIO_SECURE")
    if secure_env is not None:
        secure = str(secure_env).lower() in {"1", "true", "yes"}
        # strip scheme if someone set it
        endpoint = endpoint.replace("http://", "").replace("https://", "")
        return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)

    # 2) Derive from scheme if provided; else default to HTTP (secure=False)
    if "://" in endpoint:
        parsed = urlparse(endpoint)
        secure = parsed.scheme == "https"
        hostport = parsed.netloc or parsed.path.lstrip("/")
    else:
        secure = False
        hostport = endpoint  # e.g., "minio:9000"

    return Minio(hostport, access_key=access_key, secret_key=secret_key, secure=secure)


def ensure_bucket(bucket):
    client = get_client()
    found = client.bucket_exists(bucket)
    if not found:
        client.make_bucket(bucket)


def put_json(bucket: str, key: str, obj: dict):
    client = get_client()
    data = BytesIO(json.dumps(obj, ensure_ascii=False).encode("utf-8"))
    client.put_object(
        bucket, key, data, length=len(data.getvalue()), content_type="application/json"
    )
