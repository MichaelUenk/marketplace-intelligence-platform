from ulid import ULID


def new_batch_id() -> str:
    return str(ULID())
