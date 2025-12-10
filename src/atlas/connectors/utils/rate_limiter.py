# src/atlas/connectors/utils/rate_limiter.py
"""
Rate limiting utilities for API connectors.

Implements token bucket algorithm with Redis backend for distributed rate limiting.
"""

import asyncio
import time
from typing import Optional
import os

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class RateLimiter:
    """
    Token bucket rate limiter with optional Redis backend.

    Supports:
    - Per-connector rate limiting
    - Distributed rate limiting via Redis
    - Fallback to in-memory limiting
    - Automatic retry with backoff
    """

    def __init__(
        self,
        connector_id: str,
        limit: int,
        window: int = 60,
        redis_url: Optional[str] = None
    ):
        """
        Initialize rate limiter.

        Args:
            connector_id: Unique identifier for this connector
            limit: Maximum requests per window
            window: Window size in seconds (default 60)
            redis_url: Redis URL for distributed limiting (optional)
        """
        self.connector_id = connector_id
        self.limit = limit
        self.window = window
        self.redis_url = redis_url or os.getenv("REDIS_URL")

        # In-memory fallback
        self._tokens = limit
        self._last_update = time.time()

        # Redis client
        self._redis: Optional["redis.Redis"] = None
        if REDIS_AVAILABLE and self.redis_url:
            try:
                self._redis = redis.from_url(self.redis_url)
                self._redis.ping()
            except Exception:
                self._redis = None

    @property
    def _key(self) -> str:
        """Redis key for this rate limiter"""
        return f"rate_limit:{self.connector_id}"

    def _refill_tokens(self):
        """Refill tokens based on elapsed time (in-memory)"""
        now = time.time()
        elapsed = now - self._last_update
        refill = int(elapsed * self.limit / self.window)
        self._tokens = min(self.limit, self._tokens + refill)
        self._last_update = now

    async def acquire(self, tokens: int = 1) -> bool:
        """
        Acquire tokens for a request.

        Args:
            tokens: Number of tokens to acquire (default 1)

        Returns:
            True if tokens acquired, False if rate limited
        """
        if self._redis:
            return await self._acquire_redis(tokens)
        return await self._acquire_memory(tokens)

    async def _acquire_memory(self, tokens: int = 1) -> bool:
        """In-memory token acquisition"""
        self._refill_tokens()
        if self._tokens >= tokens:
            self._tokens -= tokens
            return True
        return False

    async def _acquire_redis(self, tokens: int = 1) -> bool:
        """Redis-based token acquisition using sliding window"""
        if not self._redis:
            return await self._acquire_memory(tokens)

        try:
            now = time.time()
            pipe = self._redis.pipeline()

            # Remove old entries outside the window
            pipe.zremrangebyscore(self._key, 0, now - self.window)

            # Count current requests in window
            pipe.zcard(self._key)

            # Add current request
            pipe.zadd(self._key, {str(now): now})

            # Set expiry on the key
            pipe.expire(self._key, self.window + 1)

            results = pipe.execute()
            current_count = results[1]

            if current_count < self.limit:
                return True

            # Over limit, remove the request we just added
            self._redis.zrem(self._key, str(now))
            return False

        except Exception:
            # Fallback to memory on Redis error
            return await self._acquire_memory(tokens)

    async def wait_and_acquire(self, tokens: int = 1, max_wait: float = 30.0) -> bool:
        """
        Wait for tokens to become available.

        Args:
            tokens: Number of tokens to acquire
            max_wait: Maximum seconds to wait

        Returns:
            True if tokens acquired within timeout, False otherwise
        """
        start = time.time()
        while time.time() - start < max_wait:
            if await self.acquire(tokens):
                return True
            # Wait before retry (exponential backoff)
            wait_time = min(1.0, (time.time() - start) / 10 + 0.1)
            await asyncio.sleep(wait_time)
        return False

    def get_status(self) -> dict:
        """
        Get current rate limit status.

        Returns:
            Dict with limit, remaining, reset_in
        """
        if self._redis:
            try:
                now = time.time()
                self._redis.zremrangebyscore(self._key, 0, now - self.window)
                current = self._redis.zcard(self._key)
                return {
                    "limit": self.limit,
                    "remaining": max(0, self.limit - current),
                    "reset_in": self.window,
                    "window": self.window,
                }
            except Exception:
                pass

        # In-memory status
        self._refill_tokens()
        return {
            "limit": self.limit,
            "remaining": self._tokens,
            "reset_in": self.window,
            "window": self.window,
        }


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded"""

    def __init__(self, connector_id: str, retry_after: int = 60):
        self.connector_id = connector_id
        self.retry_after = retry_after
        super().__init__(
            f"Rate limit exceeded for {connector_id}. Retry after {retry_after}s"
        )
