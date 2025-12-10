import hashlib
import json
import os

import redis

r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))


def cache_get(key):
    v = r.get(key)
    return json.loads(v) if v else None


def cache_set(key, obj, ttl=60):
    r.setex(key, ttl, json.dumps(obj))


def key_of(prefix, **params):
    h = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]
    return f"{prefix}:{h}"
