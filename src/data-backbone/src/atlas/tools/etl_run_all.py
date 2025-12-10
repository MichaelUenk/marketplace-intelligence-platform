from __future__ import annotations

import argparse
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime, date, timezone
from typing import Iterable, List, Optional, Set, Tuple

from minio import Minio

from dotenv import load_dotenv
# ---------- MinIO helpers ----------

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
    endpoint = endpoint.replace("http://", "").replace("https://", "")
    return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)


# ---------- Prefix discovery ----------

def _extract_batch_prefix(object_key: str) -> Optional[str]:
    """
    Input: 'apollo/raw/2025-10-28T16:56:34.804420Z/companies-00001.json'
    Output: 'apollo/raw/2025-10-28T16:56:34.804420Z'
    """
    if not object_key.startswith("apollo/raw/"):
        return None
    parts = object_key.split("/")
    if len(parts) < 3:
        return None
    return "/".join(parts[:3])


def _parse_ts_from_prefix(prefix: str) -> Optional[datetime]:
    # prefix like 'apollo/raw/2025-10-28T16:56:34.804420Z'
    try:
        ts = prefix.split("/", 2)[2]  # 2025-10-28T16:56:34.804420Z
        # Normalize Z → +00:00 for fromisoformat
        ts_norm = ts.replace("Z", "+00:00")
        return datetime.fromisoformat(ts_norm)
    except Exception:
        return None


def discover_batch_prefixes(mc: Minio, bucket: str, base_prefix: str = "apollo/raw/") -> List[str]:
    """
    Returns unique batch prefixes (no trailing slash), sorted ascending by timestamp.
    """
    seen: Set[str] = set()
    for obj in mc.list_objects(bucket, prefix=base_prefix, recursive=True):
        p = _extract_batch_prefix(obj.object_name)
        if p:
            seen.add(p)
    # sort by parsed timestamp (fallback to string)
    prefixes = list(seen)
    prefixes.sort(key=lambda p: _parse_ts_from_prefix(p) or p)
    return prefixes


# ---------- ETL runners ----------

@dataclass
class EtlStats:
    total: int = 0
    graph_ok: int = 0
    vector_ok: int = 0
    graph_fail: int = 0
    vector_fail: int = 0


def _run(cmd: List[str]) -> int:
    """
    Run a subprocess, stream output, return exit code.
    """
    print(f"+ {' '.join(cmd)}", flush=True)
    return subprocess.call(cmd)


def run_graph(prefix: str) -> bool:
    code = _run(["python", "-m", "atlas.etl.apollo_to_graph.etl_apollo", "--prefix", prefix])
    return code == 0


def run_vector(prefix: str) -> bool:
    code = _run(["python", "-m", "atlas.etl.apollo_to_vector.etl_apollo_qdrant", "--prefix", prefix])
    return code == 0


# ---------- CLI ----------
def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="Run ETL (graph/vector) for all discovered Apollo batches.")
    parser.add_argument("--bucket", default=os.getenv("MINIO_BUCKET", "datalake"))
    parser.add_argument("--base-prefix", default="apollo/raw/", help="Base path to scan for batches")
    parser.add_argument("--since", type=str, default=None, help="ISO date (YYYY-MM-DD) to include from")
    parser.add_argument("--max", type=int, default=0, help="Max number of batches to process (0 = all)")
    parser.add_argument("--graph-only", action="store_true", help="Run only graph ETL")
    parser.add_argument("--vector-only", action="store_true", help="Run only vector ETL")
    args = parser.parse_args()

    if args.graph_only and args.vector_only:
        print("Both --graph-only and --vector-only set; nothing to do.")
        return

    mc = minio_client()
    prefixes = discover_batch_prefixes(mc, args.bucket, base_prefix=args.base_prefix)

    # Filter by --since
    if args.since:
        try:
            since_date = date.fromisoformat(args.since)
        except ValueError:
            raise SystemExit(f"Invalid --since date: {args.since} (expected YYYY-MM-DD)")
        filtered = []
        for p in prefixes:
            ts = _parse_ts_from_prefix(p)
            if ts and ts.date() >= since_date:
                filtered.append(p)
        prefixes = filtered

    # Apply --max (take the newest N)
    if args.max and args.max > 0:
        # pick latest N by timestamp
        prefixes.sort(key=lambda p: _parse_ts_from_prefix(p) or p, reverse=True)
        prefixes = prefixes[: args.max]
        prefixes.sort(key=lambda p: _parse_ts_from_prefix(p) or p)  # back to ascending

    if not prefixes:
        print("(no batches to process)")
        return

    print(f"Discovered {len(prefixes)} batch(es):")
    for p in prefixes:
        print(f" - {p}")
    print()

    stats = EtlStats(total=len(prefixes))
    for p in prefixes:
        print(f"=== Processing: {p} ===")
        if not args.vector_only:
            ok = run_graph(p)
            stats.graph_ok += int(ok)
            stats.graph_fail += int(not ok)
        if not args.graph_only:
            ok = run_vector(p)
            stats.vector_ok += int(ok)
            stats.vector_fail += int(not ok)
        print()

    print("=== Summary ===")
    print(f"batches:      {stats.total}")
    print(f"graph ok:     {stats.graph_ok}  | fail: {stats.graph_fail}")
    print(f"vector ok:    {stats.vector_ok} | fail: {stats.vector_fail}")


if __name__ == "__main__":
    main()
