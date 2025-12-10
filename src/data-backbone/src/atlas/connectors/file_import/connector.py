# src/atlas/connectors/file_import/connector.py
"""
File Import Connector - CSV and Excel data import.

Supports:
- CSV files
- Excel files (xlsx, xls)
- Column mapping to standard schema
- Data preview before import
- Validation and cleaning

No external API - processes local files.
"""

import io
from typing import Optional, List, Dict, Any
from datetime import datetime

from atlas.connectors.registry import (
    BaseConnector,
    ConnectorConfig,
    ConnectorType,
    AuthType,
    ConnectorRegistry,
)
from atlas.connectors.utils.transforms import FieldTransformer

# Try to import pandas, provide fallback message if not available
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


FILE_IMPORT_CONFIG = ConnectorConfig(
    id="file_import",
    name="CSV/Excel Import",
    type=ConnectorType.FILE,
    auth_type=AuthType.NONE,
    auth_fields=[],
    base_url="",
    rate_limit=0,  # No rate limit for file imports
    rate_limit_window=0,
    supports_search=False,
    supports_enrich=False,
    supports_people=False,
    supports_webhook=False,
    docs_url="",
    icon="/icons/csv.svg",
    description="Import companies and contacts from CSV or Excel files",
)


@ConnectorRegistry.register("file_import")
class FileImportConnector(BaseConnector):
    """
    CSV/Excel file import connector.

    Provides:
    - File preview with column detection
    - Column mapping to standard schema
    - Data validation and cleaning
    - Batch import for companies and contacts
    """

    config = FILE_IMPORT_CONFIG

    def __init__(self):
        """Initialize file import connector"""
        if not PANDAS_AVAILABLE:
            raise ImportError(
                "pandas is required for file imports. Install with: pip install pandas openpyxl"
            )
        self._batch_counter = 0

    @property
    def source_prefix(self) -> str:
        return "import"

    async def test_connection(self) -> bool:
        """File import always available if pandas is installed"""
        return PANDAS_AVAILABLE

    async def get_rate_limit_status(self) -> dict:
        """No rate limits for file imports"""
        return {"limit": 0, "remaining": 0, "reset_in": 0}

    # ─────────────────────────────────────────────────────────────
    # File Preview
    # ─────────────────────────────────────────────────────────────

    async def preview_file(
        self,
        file_content: bytes,
        file_type: str,
        rows: int = 5,
        sheet_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Preview file contents for mapping UI.

        Args:
            file_content: Raw file bytes
            file_type: "csv", "xlsx", or "xls"
            rows: Number of sample rows to return
            sheet_name: Sheet name for Excel files

        Returns:
            Preview with columns and sample data
        """
        df = self._read_file(file_content, file_type, nrows=rows, sheet_name=sheet_name)

        # Get sheets list for Excel files
        sheets = []
        if file_type in ["xlsx", "xls"]:
            excel = pd.ExcelFile(io.BytesIO(file_content))
            sheets = excel.sheet_names

        return {
            "columns": list(df.columns),
            "sample_data": df.to_dict(orient="records"),
            "row_count": len(df),
            "total_rows": self._count_rows(file_content, file_type),
            "sheets": sheets,
            "detected_mappings": self._auto_detect_mappings(list(df.columns)),
        }

    def _read_file(
        self,
        file_content: bytes,
        file_type: str,
        nrows: Optional[int] = None,
        skip_rows: int = 0,
        sheet_name: Optional[str] = None,
    ) -> "pd.DataFrame":
        """Read file into DataFrame"""
        buffer = io.BytesIO(file_content)

        if file_type == "csv":
            return pd.read_csv(buffer, skiprows=skip_rows, nrows=nrows)
        elif file_type in ["xlsx", "xls"]:
            return pd.read_excel(
                buffer,
                skiprows=skip_rows,
                nrows=nrows,
                sheet_name=sheet_name or 0,
            )
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def _count_rows(self, file_content: bytes, file_type: str) -> int:
        """Count total rows in file"""
        try:
            df = self._read_file(file_content, file_type)
            return len(df)
        except Exception:
            return 0

    def _auto_detect_mappings(self, columns: List[str]) -> Dict[str, str]:
        """Auto-detect column mappings based on common names"""
        mappings = {}

        # Common variations for each field
        field_aliases = {
            "name": ["name", "company_name", "companyname", "company", "organisation", "organization", "bedrijfsnaam"],
            "domain": ["domain", "website_domain", "primary_domain", "url_domain"],
            "website": ["website", "url", "website_url", "site", "homepage"],
            "industry": ["industry", "sector", "branch", "branche"],
            "employee_count": ["employees", "employee_count", "num_employees", "company_size", "size", "medewerkers"],
            "location": ["location", "city", "plaats", "headquarters"],
            "country": ["country", "land"],
            "phone": ["phone", "telephone", "tel", "telefoon"],
            "email": ["email", "e-mail", "company_email"],
            "full_name": ["full_name", "fullname", "name", "contact_name"],
            "first_name": ["first_name", "firstname", "voornaam"],
            "last_name": ["last_name", "lastname", "achternaam"],
            "title": ["title", "job_title", "position", "functie"],
            "department": ["department", "afdeling"],
            "linkedin_url": ["linkedin", "linkedin_url", "li_url"],
        }

        columns_lower = {c.lower().replace(" ", "_").replace("-", "_"): c for c in columns}

        for target_field, aliases in field_aliases.items():
            for alias in aliases:
                if alias in columns_lower:
                    mappings[columns_lower[alias]] = target_field
                    break

        return mappings

    # ─────────────────────────────────────────────────────────────
    # Company Import
    # ─────────────────────────────────────────────────────────────

    async def import_companies(
        self,
        file_content: bytes,
        file_type: str,
        column_mapping: Dict[str, str],  # {"source_col": "target_field"}
        skip_rows: int = 0,
        sheet_name: Optional[str] = None,
        batch_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Import companies from file.

        Args:
            file_content: Raw file bytes
            file_type: "csv", "xlsx", or "xls"
            column_mapping: Mapping from source columns to target fields
            skip_rows: Number of header rows to skip
            sheet_name: Sheet name for Excel files
            batch_id: Optional batch ID for tracking

        Required mapping targets:
            - name (required)
            - domain (recommended)

        Returns:
            List of company records in standard format
        """
        # Validate required mappings
        if "name" not in column_mapping.values():
            raise ValueError("Column mapping must include 'name' field")

        df = self._read_file(file_content, file_type, skip_rows=skip_rows, sheet_name=sheet_name)

        # Generate batch ID if not provided
        if not batch_id:
            self._batch_counter += 1
            batch_id = f"import_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{self._batch_counter}"

        # Reverse mapping for lookup
        reverse_map = {v: k for k, v in column_mapping.items()}

        companies = []
        for idx, row in df.iterrows():
            company = {
                "id": self.make_id(f"{batch_id}:{idx}"),
                "_batch_id": batch_id,
                "_source": "import",
                "_imported_at": datetime.utcnow().isoformat(),
            }

            for target_field, source_col in reverse_map.items():
                if source_col in row.index:
                    value = row[source_col]
                    # Handle NaN
                    if pd.isna(value):
                        company[target_field] = None
                    else:
                        company[target_field] = str(value).strip()

            # Clean and normalize domain
            if company.get("domain"):
                company["domain"] = FieldTransformer.transform(
                    company["domain"], "clean_domain", {}
                )
            elif company.get("website"):
                # Extract domain from website if not provided
                company["domain"] = FieldTransformer.transform(
                    company["website"], "clean_domain", {}
                )

            # Clean phone
            if company.get("phone"):
                company["phone"] = FieldTransformer.transform(
                    company["phone"], "clean_phone", {"keep_format": True}
                )

            # Parse employee count
            if company.get("employee_count"):
                company["employee_count"] = FieldTransformer.transform(
                    company["employee_count"], "to_int", {}
                )

            companies.append(company)

        return companies

    # ─────────────────────────────────────────────────────────────
    # Contact Import
    # ─────────────────────────────────────────────────────────────

    async def import_contacts(
        self,
        file_content: bytes,
        file_type: str,
        column_mapping: Dict[str, str],
        skip_rows: int = 0,
        sheet_name: Optional[str] = None,
        batch_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Import contacts from file.

        Args:
            file_content: Raw file bytes
            file_type: "csv", "xlsx", or "xls"
            column_mapping: Mapping from source columns to target fields
            skip_rows: Number of header rows to skip
            sheet_name: Sheet name for Excel files
            batch_id: Optional batch ID for tracking

        Required mapping targets:
            - full_name OR (first_name AND last_name)

        Optional targets:
            - email, phone, title, department, company_name, company_domain

        Returns:
            List of contact records in standard format
        """
        has_full_name = "full_name" in column_mapping.values()
        has_first_last = "first_name" in column_mapping.values() and "last_name" in column_mapping.values()

        if not has_full_name and not has_first_last:
            raise ValueError(
                "Column mapping must include 'full_name' or both 'first_name' and 'last_name'"
            )

        df = self._read_file(file_content, file_type, skip_rows=skip_rows, sheet_name=sheet_name)

        # Generate batch ID if not provided
        if not batch_id:
            self._batch_counter += 1
            batch_id = f"import_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{self._batch_counter}"

        reverse_map = {v: k for k, v in column_mapping.items()}

        contacts = []
        for idx, row in df.iterrows():
            contact = {
                "id": self.make_id(f"{batch_id}:{idx}"),
                "_batch_id": batch_id,
                "_source": "import",
                "_imported_at": datetime.utcnow().isoformat(),
            }

            for target_field, source_col in reverse_map.items():
                if source_col in row.index:
                    value = row[source_col]
                    if pd.isna(value):
                        contact[target_field] = None
                    else:
                        contact[target_field] = str(value).strip()

            # Generate full_name if not provided
            if not contact.get("full_name"):
                parts = []
                if contact.get("first_name"):
                    parts.append(contact["first_name"])
                if contact.get("last_name"):
                    parts.append(contact["last_name"])
                contact["full_name"] = " ".join(parts)

            # Parse first/last from full_name if not provided
            if contact.get("full_name") and not contact.get("first_name"):
                name_parts = contact["full_name"].split()
                if name_parts:
                    contact["first_name"] = name_parts[0]
                    if len(name_parts) > 1:
                        contact["last_name"] = " ".join(name_parts[1:])

            # Clean email (lowercase, trim)
            if contact.get("email"):
                contact["email"] = contact["email"].lower().strip()

            # Clean phone
            if contact.get("phone"):
                contact["phone"] = FieldTransformer.transform(
                    contact["phone"], "clean_phone", {"keep_format": True}
                )

            # Clean company domain
            if contact.get("company_domain"):
                contact["company_domain"] = FieldTransformer.transform(
                    contact["company_domain"], "clean_domain", {}
                )

            contacts.append(contact)

        return contacts

    # ─────────────────────────────────────────────────────────────
    # Validation
    # ─────────────────────────────────────────────────────────────

    async def validate_data(
        self,
        records: List[Dict[str, Any]],
        record_type: str,  # "company" or "contact"
    ) -> Dict[str, Any]:
        """
        Validate imported data.

        Args:
            records: List of records to validate
            record_type: "company" or "contact"

        Returns:
            Validation report with errors and warnings
        """
        errors = []
        warnings = []
        valid_count = 0

        for idx, record in enumerate(records):
            record_errors = []
            record_warnings = []

            if record_type == "company":
                # Required: name
                if not record.get("name"):
                    record_errors.append("Missing company name")

                # Recommended: domain
                if not record.get("domain"):
                    record_warnings.append("Missing domain")

            elif record_type == "contact":
                # Required: name
                if not record.get("full_name"):
                    record_errors.append("Missing name")

                # Recommended: email
                if not record.get("email"):
                    record_warnings.append("Missing email")

                # Validate email format
                if record.get("email"):
                    email = record["email"]
                    if "@" not in email or "." not in email:
                        record_errors.append(f"Invalid email format: {email}")

            if record_errors:
                errors.append({"row": idx + 1, "errors": record_errors, "record": record})
            elif record_warnings:
                warnings.append({"row": idx + 1, "warnings": record_warnings})
                valid_count += 1
            else:
                valid_count += 1

        return {
            "total_records": len(records),
            "valid_count": valid_count,
            "error_count": len(errors),
            "warning_count": len(warnings),
            "errors": errors[:50],  # Limit to first 50 errors
            "warnings": warnings[:50],
        }
