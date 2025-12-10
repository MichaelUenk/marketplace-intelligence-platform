# Atlas Data Connectors
# Multi-source data ingestion framework
#
# European-first connector strategy for GDPR compliance:
# - lemlist (🇫🇷 France) - Cold email
# - Cognism (🇬🇧 UK) - Data enrichment
# - Aircall (🇫🇷 France) - VoIP dialer
# - Gladia (🇫🇷 France) - Transcription
# - Zeeg (🇩🇪 Germany) - Scheduling

from atlas.connectors.registry import (
    BaseConnector,
    ConnectorConfig,
    ConnectorRegistry,
    ConnectorType,
    AuthType,
)

# Import existing connectors to register them
from atlas.connectors.apollo import ApolloConnector
from atlas.connectors.hunter import HunterConnector
from atlas.connectors.kvk import KvKConnector
from atlas.connectors.apify import ApifyConnector
from atlas.connectors.linkedin import LinkedInConnector
from atlas.connectors.file_import import FileImportConnector

# Import new European connectors
from atlas.connectors.lemlist import LemlistConnector

__all__ = [
    # Base classes
    "BaseConnector",
    "ConnectorConfig",
    "ConnectorRegistry",
    "ConnectorType",
    "AuthType",
    # Existing connectors
    "ApolloConnector",
    "HunterConnector",
    "KvKConnector",
    "ApifyConnector",
    "LinkedInConnector",
    "FileImportConnector",
    # European connectors
    "LemlistConnector",
]
