"""Redis cache for query API"""

import contextlib
import json
import os
from typing import Any

import redis

# Redis client singleton
r = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    decode_responses=True,
)


def key_of(prefix: str, **kwargs) -> str:
    """Generate cache key from prefix and kwargs"""
    parts = [prefix]
    for k, v in sorted(kwargs.items()):
        parts.append(f"{k}:{v}")
    return ":".join(parts)


def cache_get(key: str) -> Any | None:
    """Get value from cache"""
    try:
        val = r.get(key)
        if val is None:
            return None
        return json.loads(val)
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    """Set value in cache with TTL"""
    with contextlib.suppress(Exception):
        r.setex(key, ttl, json.dumps(value))  # Fail silently if Redis is unavailable
