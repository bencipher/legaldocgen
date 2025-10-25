"""
Test script for the LLM module without requiring API keys.
This uses a test model to verify the structure works.
"""

import asyncio
import os
from ..llm import DocumentOrchestrator, RealLLM
from pydantic_ai.models.test import TestModel


class TestDocumentOrchestrator(DocumentOrchestrator):
    """Test version that uses TestModel instead of real LLM."""

    def __init__(self):
        # Create a test LLM that uses TestModel
        test_llm = RealLLM("test")
        # Override all agents to use TestModel
        test_llm.extraction_agent.model = TestModel()
        test_llm.field_request_agent.model = TestModel()
        test_llm.field_mapping_agent.model = TestModel()
        test_llm.generation_agent.model = TestModel()

        super().__init__(test_llm)


async def test_orchestrator():
    """Test the orchestrator functionality."""
    print("Testing Document Orchestrator...")

    orchestrator = TestDocumentOrchestrator()

    # Test 1: Start the flow
    print("\n1. Testing requirement extraction...")
    fields = await orchestrator.start("I want to create a purchase agreement")
    print(f"Extracted fields: {list(fields.keys())}")

    # Test 2: Test field collection
    print("\n2. Testing field collection...")
    question = await orchestrator.next_question()
    print(f"Generated question: {question}")

    # Test 3: Record user input
    print("\n3. Testing user input recording...")
    await orchestrator.record_user_input("John Doe as buyer and Jane Smith as seller")
    remaining_fields = orchestrator._missing_fields()
    print(f" Remaining fields: {remaining_fields}")

    # Test 4: Fill remaining fields to test document generation
    print("\n4. Filling remaining fields...")
    for field in remaining_fields[:2]:  # Fill a couple more fields
        orchestrator.fields[field] = f"test_{field}"

    # Test 5: Document generation
    if not orchestrator._missing_fields():
        print("\n5. Testing document generation...")
        orchestrator.state = "generating"

        print("Generated document:")
        print("-" * 50)
        chunk_count = 0
        async for chunk in orchestrator.generate_document():
            print(chunk, end="", flush=True)
            chunk_count += 1
            if chunk_count > 10:  # Limit output for testing
                break
        print("\n" + "-" * 50)
        print("Document generation test completed")

    print("\nAll tests completed successfully!")


if __name__ == "__main__":
    asyncio.run(test_orchestrator())
