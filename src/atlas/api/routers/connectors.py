# src/atlas/api/routers/connectors.py
"""
Connector API Router - Manage data source connectors.

Provides endpoints for:
- Listing available connector types
- Testing connector credentials
- Running connector operations (search, enrich)
- Managing connector configurations
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

router = APIRouter(prefix="/api/connectors", tags=["connectors"])


# ─────────────────────────────────────────────────────────────
# Request/Response Models
# ─────────────────────────────────────────────────────────────


class TestConnectionRequest(BaseModel):
    """Request to test connector credentials"""
    connector_id: str
    auth_config: Dict[str, str]


class TestConnectionResponse(BaseModel):
    """Response from connection test"""
    status: str  # success, failed, error
    message: str
    rate_limit: Optional[Dict[str, Any]] = None


class SearchRequest(BaseModel):
    """Request to search via connector"""
    connector_id: str
    auth_config: Dict[str, str]
    query: str
    limit: int = 20
    filters: Optional[Dict[str, Any]] = None


class EnrichRequest(BaseModel):
    """Request to enrich data via connector"""
    connector_id: str
    auth_config: Dict[str, str]
    domain: Optional[str] = None
    kvk_number: Optional[str] = None
    linkedin_url: Optional[str] = None


class PeopleSearchRequest(BaseModel):
    """Request to find people at a company"""
    connector_id: str
    auth_config: Dict[str, str]
    domain: str
    limit: int = 50
    titles: Optional[List[str]] = None
    seniorities: Optional[List[str]] = None


class FileImportRequest(BaseModel):
    """Request to import from file"""
    column_mapping: Dict[str, str]
    record_type: str = "company"  # company or contact
    skip_rows: int = 0
    sheet_name: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# Registry Endpoints
# ─────────────────────────────────────────────────────────────


@router.get("/registry")
async def list_available_connectors():
    """
    List all available connector types.

    Returns connector configurations including:
    - ID, name, type
    - Authentication requirements
    - Supported capabilities (search, enrich, people)
    - Rate limits
    """
    # Import here to ensure all connectors are registered
    from atlas.connectors.registry import ConnectorRegistry

    # Import connectors to trigger registration
    try:
        from atlas.connectors import apollo  # noqa
        from atlas.connectors import hunter  # noqa
        from atlas.connectors import kvk  # noqa
        from atlas.connectors import apify  # noqa
        from atlas.connectors import linkedin  # noqa
        from atlas.connectors import file_import  # noqa
    except ImportError:
        pass

    return {
        "connectors": ConnectorRegistry.list_all(),
        "count": len(ConnectorRegistry.list_ids()),
    }


@router.get("/registry/{connector_id}")
async def get_connector_info(connector_id: str):
    """
    Get details about a specific connector type.

    Returns full configuration including auth fields and rate limits.
    """
    from atlas.connectors.registry import ConnectorRegistry

    connector_class = ConnectorRegistry.get(connector_id)
    if not connector_class:
        raise HTTPException(404, f"Connector '{connector_id}' not found")

    return connector_class.config.to_dict()


# ─────────────────────────────────────────────────────────────
# Connection Testing
# ─────────────────────────────────────────────────────────────


@router.post("/test", response_model=TestConnectionResponse)
async def test_connection(request: TestConnectionRequest):
    """
    Test connector credentials without saving.

    Verifies that the provided API keys/tokens are valid
    and the connector can communicate with the data source.
    """
    from atlas.connectors.registry import ConnectorRegistry

    connector_class = ConnectorRegistry.get(request.connector_id)
    if not connector_class:
        raise HTTPException(400, f"Unknown connector: {request.connector_id}")

    try:
        connector = connector_class(**request.auth_config)
        is_valid = await connector.test_connection()

        if is_valid:
            rate_limit = await connector.get_rate_limit_status()
            await connector.close()
            return TestConnectionResponse(
                status="success",
                message="Connection successful",
                rate_limit=rate_limit,
            )
        else:
            await connector.close()
            return TestConnectionResponse(
                status="failed",
                message="Invalid credentials or connection failed",
            )
    except Exception as e:
        return TestConnectionResponse(
            status="error",
            message=str(e),
        )


# ─────────────────────────────────────────────────────────────
# Search Operations
# ─────────────────────────────────────────────────────────────


@router.post("/search")
async def search_companies(request: SearchRequest):
    """
    Search for companies using a connector.

    Supported connectors: apollo, kvk, linkedin

    Returns list of companies in standard format.
    """
    from atlas.connectors.registry import ConnectorRegistry

    connector_class = ConnectorRegistry.get(request.connector_id)
    if not connector_class:
        raise HTTPException(400, f"Unknown connector: {request.connector_id}")

    # Check if connector supports search
    config = connector_class.config
    if not config.supports_search:
        raise HTTPException(
            400,
            f"Connector '{request.connector_id}' does not support search"
        )

    try:
        connector = connector_class(**request.auth_config)
        results = await connector.search(
            request.query,
            limit=request.limit,
            filters=request.filters,
        )
        await connector.close()

        return {
            "connector": request.connector_id,
            "query": request.query,
            "count": len(results),
            "results": results,
        }
    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")


# ─────────────────────────────────────────────────────────────
# Enrichment Operations
# ─────────────────────────────────────────────────────────────


@router.post("/enrich")
async def enrich_company(request: EnrichRequest):
    """
    Enrich company data using a connector.

    Provide one of:
    - domain: For Apollo, Hunter enrichment
    - kvk_number: For KvK enrichment
    - linkedin_url: For LinkedIn enrichment

    Returns enriched company data.
    """
    from atlas.connectors.registry import ConnectorRegistry

    connector_class = ConnectorRegistry.get(request.connector_id)
    if not connector_class:
        raise HTTPException(400, f"Unknown connector: {request.connector_id}")

    # Check if connector supports enrichment
    config = connector_class.config
    if not config.supports_enrich:
        raise HTTPException(
            400,
            f"Connector '{request.connector_id}' does not support enrichment"
        )

    try:
        connector = connector_class(**request.auth_config)

        result = None
        if request.connector_id == "kvk" and request.kvk_number:
            result = await connector.enrich_company(request.kvk_number)
        elif request.connector_id == "linkedin" and request.linkedin_url:
            result = await connector.enrich_company(request.linkedin_url)
        elif request.domain:
            if hasattr(connector, "enrich_company"):
                result = await connector.enrich_company(request.domain)
            elif hasattr(connector, "enrich_by_domain"):
                result = await connector.enrich_by_domain(request.domain)

        await connector.close()

        if result:
            return {
                "connector": request.connector_id,
                "found": True,
                "company": result,
            }
        else:
            return {
                "connector": request.connector_id,
                "found": False,
                "company": None,
            }
    except Exception as e:
        raise HTTPException(500, f"Enrichment failed: {str(e)}")


# ─────────────────────────────────────────────────────────────
# People/Contact Operations
# ─────────────────────────────────────────────────────────────


@router.post("/people")
async def find_people(request: PeopleSearchRequest):
    """
    Find people/contacts at a company.

    Supported connectors: apollo, hunter, linkedin

    Returns list of people in standard format.
    """
    from atlas.connectors.registry import ConnectorRegistry

    connector_class = ConnectorRegistry.get(request.connector_id)
    if not connector_class:
        raise HTTPException(400, f"Unknown connector: {request.connector_id}")

    # Check if connector supports people search
    config = connector_class.config
    if not config.supports_people:
        raise HTTPException(
            400,
            f"Connector '{request.connector_id}' does not support people search"
        )

    try:
        connector = connector_class(**request.auth_config)

        # Call the appropriate method based on connector
        if request.connector_id == "apollo":
            results = await connector.find_by_company_domain(
                request.domain,
                limit=request.limit,
                titles=request.titles,
                seniorities=request.seniorities,
            )
        elif request.connector_id == "hunter":
            results = await connector.find_by_company_domain(
                request.domain,
                limit=request.limit,
            )
        elif request.connector_id == "linkedin":
            results = await connector.find_by_company_domain(
                request.domain,
                limit=request.limit,
                titles=request.titles,
            )
        else:
            results = await connector.find_by_company_domain(
                request.domain,
                limit=request.limit,
            )

        await connector.close()

        return {
            "connector": request.connector_id,
            "domain": request.domain,
            "count": len(results),
            "people": results,
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"People search failed: {str(e)}")


# ─────────────────────────────────────────────────────────────
# File Import Operations
# ─────────────────────────────────────────────────────────────


@router.post("/file/preview")
async def preview_file(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
):
    """
    Preview a file for import.

    Returns:
    - Column names
    - Sample data rows
    - Auto-detected column mappings
    - Sheet names (for Excel files)
    """
    from atlas.connectors.file_import import FileImportConnector

    # Determine file type
    filename = file.filename or ""
    if filename.endswith(".csv"):
        file_type = "csv"
    elif filename.endswith(".xlsx"):
        file_type = "xlsx"
    elif filename.endswith(".xls"):
        file_type = "xls"
    else:
        raise HTTPException(400, "Unsupported file type. Use CSV or Excel.")

    try:
        content = await file.read()
        connector = FileImportConnector()
        preview = await connector.preview_file(
            content,
            file_type,
            rows=5,
            sheet_name=sheet_name,
        )
        return preview
    except Exception as e:
        raise HTTPException(500, f"Failed to preview file: {str(e)}")


@router.post("/file/import")
async def import_file(
    file: UploadFile = File(...),
    column_mapping: str = Form(...),  # JSON string
    record_type: str = Form("company"),
    skip_rows: int = Form(0),
    sheet_name: Optional[str] = Form(None),
):
    """
    Import companies or contacts from a file.

    Args:
        file: CSV or Excel file
        column_mapping: JSON string mapping source columns to target fields
        record_type: "company" or "contact"
        skip_rows: Number of header rows to skip
        sheet_name: Sheet name for Excel files
    """
    from atlas.connectors.file_import import FileImportConnector

    # Determine file type
    filename = file.filename or ""
    if filename.endswith(".csv"):
        file_type = "csv"
    elif filename.endswith(".xlsx"):
        file_type = "xlsx"
    elif filename.endswith(".xls"):
        file_type = "xls"
    else:
        raise HTTPException(400, "Unsupported file type. Use CSV or Excel.")

    try:
        mapping = json.loads(column_mapping)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid column_mapping JSON")

    try:
        content = await file.read()
        connector = FileImportConnector()

        if record_type == "company":
            records = await connector.import_companies(
                content,
                file_type,
                mapping,
                skip_rows=skip_rows,
                sheet_name=sheet_name,
            )
        elif record_type == "contact":
            records = await connector.import_contacts(
                content,
                file_type,
                mapping,
                skip_rows=skip_rows,
                sheet_name=sheet_name,
            )
        else:
            raise HTTPException(400, "record_type must be 'company' or 'contact'")

        # Validate imported data
        validation = await connector.validate_data(records, record_type)

        return {
            "filename": filename,
            "record_type": record_type,
            "imported_count": len(records),
            "validation": validation,
            "records": records[:100],  # Return first 100 records
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Failed to import file: {str(e)}")


# ─────────────────────────────────────────────────────────────
# Email Operations (Hunter)
# ─────────────────────────────────────────────────────────────


class EmailVerifyRequest(BaseModel):
    """Request to verify an email"""
    api_key: str
    email: str


class EmailFindRequest(BaseModel):
    """Request to find a specific person's email"""
    api_key: str
    domain: str
    first_name: str
    last_name: str


@router.post("/email/verify")
async def verify_email(request: EmailVerifyRequest):
    """
    Verify if an email address is deliverable.

    Uses Hunter.io email verification.
    """
    from atlas.connectors.hunter import HunterConnector

    try:
        connector = HunterConnector(api_key=request.api_key)
        result = await connector.verify_email(request.email)
        await connector.close()
        return result
    except Exception as e:
        raise HTTPException(500, f"Email verification failed: {str(e)}")


@router.post("/email/find")
async def find_email(request: EmailFindRequest):
    """
    Find a specific person's email address.

    Uses Hunter.io email finder.
    """
    from atlas.connectors.hunter import HunterConnector

    try:
        connector = HunterConnector(api_key=request.api_key)
        result = await connector.find_email(
            request.domain,
            request.first_name,
            request.last_name,
        )
        await connector.close()
        return result
    except Exception as e:
        raise HTTPException(500, f"Email finding failed: {str(e)}")
