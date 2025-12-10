"""Batch ID generation for ETL idempotency"""

from ulid import ULID


def new_batch_id() -> str:
    """Generate a new unique batch ID using ULID"""
    return str(ULID())
