# src/atlas/connectors/kvk/sbi_mapping.py
"""
SBI (Standard Business Classification) code mapping for Dutch companies.

SBI codes are used by the KvK to classify businesses by their primary activity.
This module maps SBI codes to standardized industry categories.

Reference: https://sbi.cbs.nl/
"""

from typing import Optional, Dict, List

# Top-level SBI code mapping to industry categories
SBI_TO_INDUSTRY: Dict[str, str] = {
    # Agriculture, forestry and fishing (01-03)
    "01": "Agriculture",
    "02": "Forestry",
    "03": "Fishing",

    # Mining and quarrying (05-09)
    "05": "Mining",
    "06": "Mining",
    "07": "Mining",
    "08": "Mining",
    "09": "Mining",

    # Manufacturing (10-33)
    "10": "Food & Beverage",
    "11": "Food & Beverage",
    "12": "Tobacco",
    "13": "Textiles",
    "14": "Apparel",
    "15": "Leather",
    "16": "Wood Products",
    "17": "Paper Products",
    "18": "Printing",
    "19": "Petroleum",
    "20": "Chemicals",
    "21": "Pharmaceuticals",
    "22": "Plastics & Rubber",
    "23": "Building Materials",
    "24": "Metals",
    "25": "Metal Products",
    "26": "Electronics",
    "27": "Electrical Equipment",
    "28": "Machinery",
    "29": "Automotive",
    "30": "Transportation Equipment",
    "31": "Furniture",
    "32": "Manufacturing",
    "33": "Equipment Repair",

    # Energy (35)
    "35": "Utilities",

    # Water & Waste (36-39)
    "36": "Water Supply",
    "37": "Sewerage",
    "38": "Waste Management",
    "39": "Environmental Services",

    # Construction (41-43)
    "41": "Construction",
    "42": "Civil Engineering",
    "43": "Construction",

    # Wholesale & Retail Trade (45-47)
    "45": "Automotive Retail",
    "46": "Wholesale",
    "47": "Retail",

    # Transportation & Storage (49-53)
    "49": "Transportation",
    "50": "Water Transport",
    "51": "Air Transport",
    "52": "Logistics",
    "53": "Postal Services",

    # Hospitality (55-56)
    "55": "Hospitality",
    "56": "Food Service",

    # Information & Communication (58-63)
    "58": "Publishing",
    "59": "Media Production",
    "60": "Broadcasting",
    "61": "Telecommunications",
    "62": "IT Services",
    "63": "IT Services",

    # Financial Services (64-66)
    "64": "Financial Services",
    "65": "Insurance",
    "66": "Financial Services",

    # Real Estate (68)
    "68": "Real Estate",

    # Professional Services (69-75)
    "69": "Legal Services",
    "70": "Management Consulting",
    "71": "Architecture & Engineering",
    "72": "Research & Development",
    "73": "Advertising & Marketing",
    "74": "Professional Services",
    "75": "Veterinary",

    # Administrative Services (77-82)
    "77": "Rental & Leasing",
    "78": "Employment Services",
    "79": "Travel & Tourism",
    "80": "Security Services",
    "81": "Facility Services",
    "82": "Business Support",

    # Public Administration (84)
    "84": "Government",

    # Education (85)
    "85": "Education",

    # Healthcare (86-88)
    "86": "Healthcare",
    "87": "Residential Care",
    "88": "Social Work",

    # Arts & Recreation (90-93)
    "90": "Arts & Entertainment",
    "91": "Cultural Institutions",
    "92": "Gambling",
    "93": "Sports & Recreation",

    # Other Services (94-96)
    "94": "Membership Organizations",
    "95": "Repair Services",
    "96": "Personal Services",

    # Households (97-98)
    "97": "Household Services",
    "98": "Household Production",

    # International Organizations (99)
    "99": "International Organizations",
}

# More detailed mapping for specific industries (3-digit level)
SBI_DETAILED: Dict[str, str] = {
    # IT Services detailed
    "620": "IT Services",
    "621": "Software Publishing",
    "622": "IT Consulting",
    "623": "Data Processing",
    "629": "Other IT Services",

    # Professional Services detailed
    "691": "Legal Services",
    "692": "Accounting",
    "701": "Head Offices",
    "702": "Management Consulting",
    "711": "Architecture",
    "712": "Engineering",
    "721": "Natural Sciences R&D",
    "722": "Social Sciences R&D",

    # Healthcare detailed
    "861": "Hospitals",
    "862": "Medical Practices",
    "869": "Other Healthcare",

    # Manufacturing detailed
    "281": "Industrial Machinery",
    "282": "Special Purpose Machinery",
    "283": "Agricultural Machinery",
    "289": "Other Machinery",
}


def sbi_to_industry(sbi_code: str) -> str:
    """
    Map SBI code to industry category.

    Args:
        sbi_code: SBI code (can be 2-5 digits)

    Returns:
        Industry category name, or "Other" if not found
    """
    if not sbi_code:
        return "Other"

    # Clean the code
    sbi_code = str(sbi_code).strip()

    # Try 3-digit first for more specificity
    if len(sbi_code) >= 3:
        prefix3 = sbi_code[:3]
        if prefix3 in SBI_DETAILED:
            return SBI_DETAILED[prefix3]

    # Fall back to 2-digit
    if len(sbi_code) >= 2:
        prefix2 = sbi_code[:2]
        if prefix2 in SBI_TO_INDUSTRY:
            return SBI_TO_INDUSTRY[prefix2]

    return "Other"


def get_sbi_category(sbi_code: str) -> Dict[str, str]:
    """
    Get full SBI category information.

    Args:
        sbi_code: SBI code

    Returns:
        Dict with code, industry, and category info
    """
    industry = sbi_to_industry(sbi_code)

    # Determine broad category
    if not sbi_code:
        category = "Unknown"
    else:
        code_int = int(sbi_code[:2]) if sbi_code[:2].isdigit() else 0
        if code_int <= 3:
            category = "Primary"
        elif code_int <= 43:
            category = "Secondary"
        else:
            category = "Tertiary"

    return {
        "sbi_code": sbi_code,
        "industry": industry,
        "category": category,
    }


def get_industries_for_sbi_codes(sbi_codes: List[str]) -> List[str]:
    """
    Get unique industries for a list of SBI codes.

    Args:
        sbi_codes: List of SBI codes

    Returns:
        List of unique industry names
    """
    industries = set()
    for code in sbi_codes:
        industry = sbi_to_industry(code)
        if industry != "Other":
            industries.add(industry)

    return list(industries) if industries else ["Other"]


# Common Dutch business types mapped to English
RECHTSVORM_MAPPING: Dict[str, str] = {
    "Besloten Vennootschap": "Private Limited Company (BV)",
    "B.V.": "Private Limited Company (BV)",
    "Naamloze Vennootschap": "Public Limited Company (NV)",
    "N.V.": "Public Limited Company (NV)",
    "Eenmanszaak": "Sole Proprietorship",
    "Vennootschap onder firma": "General Partnership (VOF)",
    "V.O.F.": "General Partnership (VOF)",
    "Commanditaire Vennootschap": "Limited Partnership (CV)",
    "C.V.": "Limited Partnership (CV)",
    "Maatschap": "Partnership",
    "Stichting": "Foundation",
    "Vereniging": "Association",
    "Cooperatie": "Cooperative",
    "Coöperatie": "Cooperative",
}


def translate_rechtsvorm(rechtsvorm: str) -> str:
    """Translate Dutch legal form to English"""
    if not rechtsvorm:
        return "Unknown"

    # Check exact match
    if rechtsvorm in RECHTSVORM_MAPPING:
        return RECHTSVORM_MAPPING[rechtsvorm]

    # Check partial match
    for dutch, english in RECHTSVORM_MAPPING.items():
        if dutch.lower() in rechtsvorm.lower():
            return english

    return rechtsvorm  # Return original if no translation found
