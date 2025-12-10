# src/atlas/connectors/utils/transforms.py
"""
Field transformation utilities for connector data mapping.

Supports various transformations:
- Case conversion (lowercase, uppercase)
- Trimming whitespace
- Regex extraction
- Default values
- Lookup tables
"""

import re
from typing import Any, Optional, Dict, List, Callable


class FieldTransformer:
    """
    Transform field values during data mapping.

    Supports multiple transformation types that can be chained together.
    """

    @staticmethod
    def transform(
        value: Any,
        transform_type: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Apply a transformation to a value.

        Args:
            value: The value to transform
            transform_type: Type of transformation
            config: Optional configuration for the transform

        Returns:
            Transformed value
        """
        config = config or {}

        transformers = {
            "none": lambda v, c: v,
            "lowercase": lambda v, c: v.lower() if isinstance(v, str) else v,
            "uppercase": lambda v, c: v.upper() if isinstance(v, str) else v,
            "trim": lambda v, c: v.strip() if isinstance(v, str) else v,
            "regex": FieldTransformer._regex_extract,
            "default": FieldTransformer._default_value,
            "lookup": FieldTransformer._lookup,
            "split": FieldTransformer._split,
            "join": FieldTransformer._join,
            "to_int": FieldTransformer._to_int,
            "to_float": FieldTransformer._to_float,
            "clean_domain": FieldTransformer._clean_domain,
            "clean_phone": FieldTransformer._clean_phone,
        }

        transformer = transformers.get(transform_type, lambda v, c: v)
        return transformer(value, config)

    @staticmethod
    def _regex_extract(value: Any, config: Dict[str, Any]) -> Any:
        """Extract using regex pattern"""
        if not isinstance(value, str):
            return value

        pattern = config.get("pattern", "")
        group = config.get("group", 0)
        default = config.get("default")

        try:
            match = re.search(pattern, value)
            if match:
                return match.group(group)
            return default
        except Exception:
            return default

    @staticmethod
    def _default_value(value: Any, config: Dict[str, Any]) -> Any:
        """Return default if value is None or empty"""
        default = config.get("value")
        if value is None or value == "":
            return default
        return value

    @staticmethod
    def _lookup(value: Any, config: Dict[str, Any]) -> Any:
        """Look up value in a mapping table"""
        mapping = config.get("mapping", {})
        default = config.get("default", value)

        if isinstance(value, str):
            value = value.lower()

        return mapping.get(value, default)

    @staticmethod
    def _split(value: Any, config: Dict[str, Any]) -> List[str]:
        """Split string into list"""
        if not isinstance(value, str):
            return [value] if value else []

        separator = config.get("separator", ",")
        return [item.strip() for item in value.split(separator) if item.strip()]

    @staticmethod
    def _join(value: Any, config: Dict[str, Any]) -> str:
        """Join list into string"""
        if not isinstance(value, list):
            return str(value) if value else ""

        separator = config.get("separator", ", ")
        return separator.join(str(item) for item in value if item)

    @staticmethod
    def _to_int(value: Any, config: Dict[str, Any]) -> Optional[int]:
        """Convert to integer"""
        default = config.get("default")
        try:
            if value is None or value == "":
                return default
            return int(float(str(value).replace(",", "")))
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _to_float(value: Any, config: Dict[str, Any]) -> Optional[float]:
        """Convert to float"""
        default = config.get("default")
        try:
            if value is None or value == "":
                return default
            return float(str(value).replace(",", ""))
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _clean_domain(value: Any, config: Dict[str, Any]) -> Optional[str]:
        """Clean and normalize domain"""
        if not isinstance(value, str) or not value:
            return None

        domain = value.lower().strip()

        # Remove protocol
        for prefix in ["https://", "http://", "www."]:
            if domain.startswith(prefix):
                domain = domain[len(prefix):]

        # Remove path and query string
        domain = domain.split("/")[0].split("?")[0]

        return domain if domain else None

    @staticmethod
    def _clean_phone(value: Any, config: Dict[str, Any]) -> Optional[str]:
        """Clean phone number, keeping only digits and +"""
        if not isinstance(value, str) or not value:
            return None

        # Keep only digits, plus sign, and optionally spaces/dashes
        keep_format = config.get("keep_format", False)
        if keep_format:
            return re.sub(r"[^\d\s\-+()]", "", value).strip()
        else:
            # Only digits and leading +
            digits = re.sub(r"[^\d+]", "", value)
            return digits if digits else None


class FieldMapper:
    """
    Map fields from source to target schema with transformations.
    """

    def __init__(self, mappings: List[Dict[str, Any]]):
        """
        Initialize mapper with field mappings.

        Args:
            mappings: List of mapping definitions
                [
                    {
                        "source_field": "companyName",
                        "target_field": "name",
                        "transform_type": "trim",
                        "transform_config": {}
                    },
                    ...
                ]
        """
        self.mappings = mappings

    def map_record(self, source: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map a single record from source to target schema.

        Args:
            source: Source record dictionary

        Returns:
            Mapped target record
        """
        target = {}

        for mapping in self.mappings:
            source_field = mapping.get("source_field")
            target_field = mapping.get("target_field")
            transform_type = mapping.get("transform_type", "none")
            transform_config = mapping.get("transform_config", {})

            # Get source value (supports nested paths like "organization.name")
            value = self._get_nested(source, source_field)

            # Apply transformation
            transformed = FieldTransformer.transform(
                value, transform_type, transform_config
            )

            # Set target value
            target[target_field] = transformed

        return target

    def map_records(self, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map multiple records"""
        return [self.map_record(source) for source in sources]

    @staticmethod
    def _get_nested(data: Dict[str, Any], path: str) -> Any:
        """Get value from nested dict using dot notation path"""
        if not path:
            return None

        parts = path.split(".")
        value = data

        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            elif isinstance(value, list) and part.isdigit():
                idx = int(part)
                value = value[idx] if idx < len(value) else None
            else:
                return None

        return value


# Standard field mappings for common data sources
COMPANY_STANDARD_FIELDS = [
    "id", "name", "domain", "website", "industry", "sub_industry",
    "location", "city", "country", "postal_code", "address",
    "employee_count", "employee_range", "annual_revenue", "revenue_range",
    "founded_year", "legal_form", "phone", "email",
    "linkedin_url", "twitter_url", "facebook_url",
    "description", "keywords", "technologies",
]

PERSON_STANDARD_FIELDS = [
    "id", "full_name", "first_name", "last_name",
    "title", "headline", "department", "seniority",
    "email", "email_status", "phone", "mobile",
    "linkedin_url", "twitter_url",
    "city", "country", "location",
    "company_id", "company_name", "company_domain",
]
