# src/atlas/connectors/registry.py
"""
Connector Registry - Central registry for all data source connectors.

This module provides the base classes and registry for managing
connections to external data sources (Apollo, Hunter, KvK, etc.)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any, Type, List
from abc import ABC, abstractmethod


class ConnectorType(Enum):
    """Categories of data connectors"""
    COMPANY = "company"      # Company firmographics
    PEOPLE = "people"        # Contact/person data
    INTENT = "intent"        # Buyer intent signals
    CRM = "crm"              # CRM systems
    SCRAPER = "scraper"      # Web scraping platforms
    FILE = "file"            # File import (CSV, Excel)


class AuthType(Enum):
    """Authentication methods supported by connectors"""
    API_KEY = "api_key"      # Simple API key
    OAUTH2 = "oauth2"        # OAuth 2.0 flow
    BASIC = "basic"          # Basic auth (username/password)
    COOKIE = "cookie"        # Cookie-based (e.g., LinkedIn)
    NONE = "none"            # No authentication required


@dataclass
class ConnectorConfig:
    """Configuration schema for a connector"""
    id: str                          # Unique identifier (e.g., "apollo")
    name: str                        # Display name (e.g., "Apollo.io")
    type: ConnectorType              # Category
    auth_type: AuthType              # Authentication method
    auth_fields: List[str]           # Required auth fields ["api_key"] or ["client_id", "client_secret"]
    base_url: str                    # API base URL
    rate_limit: int                  # Requests per minute
    rate_limit_window: int = 60      # Window in seconds (default 60)
    supports_search: bool = False    # Can search for companies
    supports_enrich: bool = False    # Can enrich existing records
    supports_people: bool = False    # Can find contacts
    supports_webhook: bool = False   # Has webhook capability
    docs_url: str = ""               # Link to API documentation
    icon: str = ""                   # Icon path or URL
    description: str = ""            # Short description

    def to_dict(self) -> dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value,
            "auth_type": self.auth_type.value,
            "auth_fields": self.auth_fields,
            "base_url": self.base_url,
            "rate_limit": self.rate_limit,
            "rate_limit_window": self.rate_limit_window,
            "supports_search": self.supports_search,
            "supports_enrich": self.supports_enrich,
            "supports_people": self.supports_people,
            "supports_webhook": self.supports_webhook,
            "docs_url": self.docs_url,
            "icon": self.icon,
            "description": self.description,
        }


class BaseConnector(ABC):
    """
    Abstract base class for all data source connectors.

    All connectors must implement:
    - test_connection(): Verify credentials are valid
    - get_rate_limit_status(): Return current rate limit usage
    - source_prefix: Property returning the source ID prefix
    """

    config: ConnectorConfig

    @abstractmethod
    async def test_connection(self) -> bool:
        """
        Test if credentials are valid and connection works.

        Returns:
            True if connection successful, False otherwise
        """
        pass

    @abstractmethod
    async def get_rate_limit_status(self) -> dict:
        """
        Return current rate limit usage.

        Returns:
            Dict with keys: limit, remaining, reset (timestamp)
        """
        pass

    @property
    @abstractmethod
    def source_prefix(self) -> str:
        """
        Prefix for IDs from this source (e.g., 'apollo', 'kvk').
        Used to create unique IDs like 'apollo:123456'.
        """
        pass

    async def close(self):
        """Clean up resources (override if needed)"""
        pass

    def make_id(self, external_id: str) -> str:
        """Create a namespaced ID for this source"""
        return f"{self.source_prefix}:{external_id}"


class ConnectorRegistry:
    """
    Central registry for all connectors.

    Usage:
        # Register a connector
        @ConnectorRegistry.register("apollo")
        class ApolloConnector(BaseConnector):
            ...

        # Get a connector class
        connector_class = ConnectorRegistry.get("apollo")

        # List all registered connectors
        configs = ConnectorRegistry.list_all()
    """

    _connectors: Dict[str, Type[BaseConnector]] = {}

    @classmethod
    def register(cls, connector_id: str):
        """
        Decorator to register a connector class.

        Args:
            connector_id: Unique identifier for this connector

        Example:
            @ConnectorRegistry.register("apollo")
            class ApolloConnector(BaseConnector):
                config = APOLLO_CONFIG
                ...
        """
        def decorator(connector_class: Type[BaseConnector]):
            if connector_id in cls._connectors:
                raise ValueError(f"Connector '{connector_id}' already registered")
            cls._connectors[connector_id] = connector_class
            return connector_class
        return decorator

    @classmethod
    def get(cls, connector_id: str) -> Optional[Type[BaseConnector]]:
        """
        Get a connector class by ID.

        Args:
            connector_id: The connector identifier

        Returns:
            The connector class, or None if not found
        """
        return cls._connectors.get(connector_id)

    @classmethod
    def get_instance(cls, connector_id: str, **auth_kwargs) -> Optional[BaseConnector]:
        """
        Create an instance of a connector with authentication.

        Args:
            connector_id: The connector identifier
            **auth_kwargs: Authentication parameters (api_key, etc.)

        Returns:
            An initialized connector instance, or None if not found
        """
        connector_class = cls.get(connector_id)
        if connector_class:
            return connector_class(**auth_kwargs)
        return None

    @classmethod
    def list_all(cls) -> List[dict]:
        """
        List all registered connectors with their configs.

        Returns:
            List of connector config dictionaries
        """
        configs = []
        for connector_class in cls._connectors.values():
            if hasattr(connector_class, "config"):
                configs.append(connector_class.config.to_dict())
        return configs

    @classmethod
    def list_ids(cls) -> List[str]:
        """Get list of all registered connector IDs"""
        return list(cls._connectors.keys())

    @classmethod
    def is_registered(cls, connector_id: str) -> bool:
        """Check if a connector is registered"""
        return connector_id in cls._connectors
