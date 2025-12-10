# syntax=docker/dockerfile:1

FROM python:3.11-slim AS query_api

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PYTHON=3.11

WORKDIR /app

# uv for lockfile-driven installs
RUN pip install --no-cache-dir uv

# Copy metadata *and* README first so build backends can read them
COPY pyproject.toml uv.lock README.md ./

# Copy the source now so uv can install the project (src layout)
COPY src/ ./src/

# Make the venv commands available on PATH
ENV PATH="/app/.venv/bin:${PATH}"

# Install deps + project (from lock) with the API extra
# --frozen ensures we respect uv.lock during builds
RUN uv sync --frozen --extra api

EXPOSE 8000
CMD ["uvicorn", "atlas.services.query_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
