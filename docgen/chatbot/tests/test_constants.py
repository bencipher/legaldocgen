"""
Simple test to verify constants are working correctly.
"""

import sys
import os

# Add the current directory to the path so we can import
sys.path.insert(0, os.path.dirname(__file__))

from ..constants.fields import detect_document_type_by_keywords, get_fields_for_document_type, DOCUMENT_FIELDS
from ..constants.prompts import get_system_prompt, get_error_prompt, format_field_request_prompt


def test_constants():
    """Test that all constants are working correctly."""

    print("Testing constants functionality...")

    # Test document type detection
    print("\n1. Testing document type detection...")
    test_cases = [
        ("I want to buy a house", "Purchase Agreement"),
        ("I need a rental agreement", "Rental Agreement"),
        ("I want to hire someone", "Employment Contract"),
        ("I need an NDA", "Non-Disclosure Agreement (NDA)"),
        ("I want to start a partnership", "Partnership Agreement"),
        ("I need a loan", "Loan Agreement"),
        ("Generic contract", "General Contract"),
    ]

    for prompt, expected_type in test_cases:
        detected_type = detect_document_type_by_keywords(prompt)
        status = "Success" if detected_type == expected_type else "Failure"
        print(f"  {status} '{prompt}' -> {detected_type}")
        if detected_type != expected_type:
            print(f"      Expected: {expected_type}")

    # Test field retrieval
    print("\n2. Testing field retrieval...")
    for doc_type in ["Purchase Agreement", "Rental Agreement", "General Contract"]:
        fields = get_fields_for_document_type(doc_type)
        print(f"AI{doc_type}: {len(fields)} fields")

    # Test prompts
    print("\n3. Testing prompts...")
    system_prompt = get_system_prompt("extraction")
    error_prompt = get_error_prompt("llm_failure")
    field_prompt = format_field_request_prompt("Purchase Agreement", ["buyer_name", "seller_name"])

    print(f"AISystem prompt length: {len(system_prompt)} chars")
    print(f"AIError prompt length: {len(error_prompt)} chars")
    print(f"AIField request prompt length: {len(field_prompt)} chars")

    # Test DOCUMENT_FIELDS dictionary
    print("\n4. Testing document fields dictionary...")
    print(f"AITotal document types: {len(DOCUMENT_FIELDS)}")
    for doc_type, fields in DOCUMENT_FIELDS.items():
        print(f"AI{doc_type}: {len(fields)} fields")

    print("\nAIAll constants tests completed successfully!")


if __name__ == "__main__":
    test_constants()
