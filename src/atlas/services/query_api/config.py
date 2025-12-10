import os

from dotenv import load_dotenv


class Settings:
    NEO4J_URI = os.getenv("NEO4J_URI")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
    QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
    EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")


load_dotenv()
settings = Settings()
