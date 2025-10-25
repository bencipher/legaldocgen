"""
Field definitions for different document types.
Contains all field configurations used in document generation.
"""

from typing import Dict, List

# Document type field mappings
DOCUMENT_FIELDS = {
    "Purchase Agreement": [
        "issuer_name",
        "receiver_name",
        "date",
        "location",
        "item_description",
        "price",
        "payment_terms",
    ],
    "Rental Agreement": [
        "landlord_name",
        "tenant_name",
        "property_address",
        "rental_period",
        "monthly_rent",
        "security_deposit",
        "lease_terms",
    ],
    "Service Contract": [
        "service_provider",
        "client_name",
        "service_description",
        "start_date",
        "end_date",
        "payment_terms",
        "deliverables",
    ],
    "Employment Contract": [
        "employer_name",
        "employee_name",
        "position",
        "start_date",
        "salary",
        "benefits",
        "work_location",
        "employment_type",
    ],
    "Non-Disclosure Agreement (NDA)": [
        "disclosing_party",
        "receiving_party",
        "confidential_information",
        "effective_date",
        "duration",
        "purpose",
    ],
    "Partnership Agreement": [
        "partner_1_name",
        "partner_2_name",
        "business_name",
        "capital_contribution",
        "profit_sharing",
        "responsibilities",
    ],
    "Loan Agreement": [
        "lender_name",
        "borrower_name",
        "loan_amount",
        "interest_rate",
        "repayment_terms",
        "collateral",
        "due_date",
    ],
    "General Contract": ["party_a", "party_b", "subject", "date", "terms", "obligations", "consideration"],
}

# Keywords for document type detection
DOCUMENT_KEYWORDS = {
    "Purchase Agreement": ["buy", "purchase", "sale", "sell", "acquire", "transaction"],
    "Rental Agreement": ["rent", "lease", "rental", "tenant", "landlord", "property"],
    "Service Contract": ["service", "provide", "contract work", "consulting", "freelance"],
    "Employment Contract": ["employment", "job", "hire", "employee", "work", "position"],
    "Non-Disclosure Agreement (NDA)": ["confidentiality", "nda", "non-disclosure", "secret", "proprietary"],
    "Partnership Agreement": ["partnership", "business partnership", "joint venture", "collaborate"],
    "Loan Agreement": ["loan", "borrow", "lend", "credit", "financing"],
    "General Contract": [],  # Fallback for unclear requests
}

# Fallback field mappings for when LLM fails
FALLBACK_FIELDS = {
    "purchase": {
        "fields": ["issuer_name", "receiver_name", "date", "location", "item_description", "price", "payment_terms"],
        "document_type": "Purchase Agreement",
    },
    "rental": {
        "fields": [
            "landlord_name",
            "tenant_name",
            "property_address",
            "rental_period",
            "monthly_rent",
            "security_deposit",
        ],
        "document_type": "Rental Agreement",
    },
    "service": {
        "fields": ["service_provider", "client_name", "service_description", "start_date", "end_date", "payment_terms"],
        "document_type": "Service Contract",
    },
    "employment": {
        "fields": ["employer_name", "employee_name", "position", "start_date", "salary", "benefits"],
        "document_type": "Employment Contract",
    },
    "confidentiality": {
        "fields": ["disclosing_party", "receiving_party", "confidential_information", "effective_date", "duration"],
        "document_type": "Non-Disclosure Agreement (NDA)",
    },
    "partnership": {
        "fields": ["partner_1_name", "partner_2_name", "business_name", "capital_contribution", "profit_sharing"],
        "document_type": "Partnership Agreement",
    },
    "loan": {
        "fields": ["lender_name", "borrower_name", "loan_amount", "interest_rate", "repayment_terms"],
        "document_type": "Loan Agreement",
    },
    "general": {"fields": ["party_a", "party_b", "subject", "date", "terms"], "document_type": "General Contract"},
}


def get_fields_for_document_type(document_type: str) -> List[str]:
    """Get the required fields for a specific document type."""
    return DOCUMENT_FIELDS.get(document_type, DOCUMENT_FIELDS["General Contract"])


def get_keywords_for_document_type(document_type: str) -> List[str]:
    """Get the detection keywords for a specific document type."""
    return DOCUMENT_KEYWORDS.get(document_type, [])


def detect_document_type_by_keywords(user_prompt: str) -> str:
    """Detect document type based on keywords in user prompt."""
    prompt_lower = user_prompt.lower()

    for doc_type, keywords in DOCUMENT_KEYWORDS.items():
        if doc_type == "General Contract":
            continue  # Skip general contract, use as fallback
        if any(keyword in prompt_lower for keyword in keywords):
            return doc_type

    return "General Contract"  # Fallback
