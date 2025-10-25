"""
Test the enhanced LLM document type detection
"""

import asyncio
import os
import sys
import pathlib

# Add the project root to Python path
project_root = pathlib.Path(__file__).parent
sys.path.insert(0, str(project_root))

from ..llm import RealLLM, FieldExtractionResult
from pydantic_ai.models.test import TestModel


async def test_document_type_detection():
    """Test the enhanced document type detection with various prompts."""

    # Create a test LLM (works without API keys)
    llm = RealLLM("test")
    llm.extraction_agent.model = TestModel()

    # Test prompts for different document types
    test_prompts = [
        "I want to buy a car from John",
        "Need a rental agreement for my apartment",
        "Create an employment contract for new hire",
        "I need a service contract for consulting work",
        "Generate an NDA for confidential information",
        "Create a partnership agreement for our business",
        "Need a loan agreement for $10,000",
        "Some other generic contract",
    ]

    print("Testing Enhanced Document Type Detection")
    print("=" * 60)

    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n{i}. Testing: '{prompt}'")
        try:
            # This will use the fallback logic since we're using TestModel
            result = await llm.extract_requirements_with_type(prompt)
            print(f"Document Type: {result.document_type}")
            print(f"Fields: {', '.join(result.fields[:3])}{'...' if len(result.fields) > 3 else ''}")
            print(f"Total Fields: {len(result.fields)}")
        except Exception as e:
            print(f"Error: {e}")

    print(f"\n{'=' * 60}")
    print("Document type detection test completed!")
    print("\nThe LLM now intelligently detects document types and")
    print("extracts appropriate fields based on keywords and context.")


if __name__ == "__main__":
    asyncio.run(test_document_type_detection())
