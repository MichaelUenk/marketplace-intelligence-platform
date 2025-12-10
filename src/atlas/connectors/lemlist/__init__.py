# src/atlas/connectors/lemlist/__init__.py
"""
lemlist Connector - French cold email and sales engagement platform.

lemlist (https://lemlist.com) is a Paris-based sales engagement platform
offering email outreach, LinkedIn automation, and multichannel sequences.

GDPR Compliant: Yes (EU headquarters, EU data processing)
Headquarters: Paris, France 🇫🇷
"""

from .connector import LemlistConnector

__all__ = ["LemlistConnector"]
