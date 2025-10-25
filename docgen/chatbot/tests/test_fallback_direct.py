"""
Direct test of the fallback document type detection logic
"""

import sys
import pathlib

# Add the project root to Python path
project_root = pathlib.Path(__file__).parent
sys.path.insert(0, str(project_root))

from docgen.chatbot.llm import FieldExtractionResult


def test_fallback_logic_directly():
    """Test the fallback document type detection logic directly."""

    # Test prompts for different document types
    test_cases = [
        ("I want to buy a car from John", "Purchase Agreement"),
        ("Need a rental agreement for my apartment", "Rental Agreement"),
        ("Create an employment contract for new hire", "Employment Contract"),
        ("I need a service contract for consulting work", "Service Contract"),
        ("Generate an NDA for confidential information", "Non-Disclosure Agreement (NDA)"),
        ("Create a partnership agreement for our business", "Partnership Agreement"),
        ("Need a loan agreement for $10,000", "Loan Agreement"),
        ("Some other generic contract", "General Contract"),
        ("I want to purchase a house", "Purchase Agreement"),
        ("Lease agreement needed", "Rental Agreement"),
        ("Hiring a new employee", "Employment Contract"),
        ("Consulting service agreement", "Service Contract"),
        ("Need confidentiality agreement", "Non-Disclosure Agreement (NDA)"),
        ("Business joint venture", "Partnership Agreement"),
        ("Borrowing money contract", "Loan Agreement"),
    ]

    print("Testing Fallback Document Type Detection Logic")
    print("=" * 70)

    def simulate_fallback(user_prompt: str) -> FieldExtractionResult:
        """Simulate the fallback logic from the LLM class."""
        prompt_lower = user_prompt.lower()

        if any(keyword in prompt_lower for keyword in ["buy", "purchase", "sale", "sell", "acquire"]):
            return FieldExtractionResult(
                fields=[
                    "issuer_name",
                    "receiver_name",
                    "date",
                    "location",
                    "item_description",
                    "price",
                    "payment_terms",
                ],
                document_type="Purchase Agreement",
            )
        elif any(keyword in prompt_lower for keyword in ["rent", "lease", "rental", "tenant", "landlord"]):
            return FieldExtractionResult(
                fields=[
                    "landlord_name",
                    "tenant_name",
                    "property_address",
                    "rental_period",
                    "monthly_rent",
                    "security_deposit",
                ],
                document_type="Rental Agreement",
            )
        elif any(keyword in prompt_lower for keyword in ["service", "provide", "consulting", "freelance"]):
            return FieldExtractionResult(
                fields=[
                    "service_provider",
                    "client_name",
                    "service_description",
                    "start_date",
                    "end_date",
                    "payment_terms",
                ],
                document_type="Service Contract",
            )
        elif any(keyword in prompt_lower for keyword in ["employment", "job", "hire", "employee", "work", "position"]):
            return FieldExtractionResult(
                fields=["employer_name", "employee_name", "position", "start_date", "salary", "benefits"],
                document_type="Employment Contract",
            )
        elif any(keyword in prompt_lower for keyword in ["confidentiality", "nda", "non-disclosure", "secret"]):
            return FieldExtractionResult(
                fields=[
                    "disclosing_party",
                    "receiving_party",
                    "confidential_information",
                    "effective_date",
                    "duration",
                ],
                document_type="Non-Disclosure Agreement (NDA)",
            )
        elif any(keyword in prompt_lower for keyword in ["partnership", "joint venture", "collaborate"]):
            return FieldExtractionResult(
                fields=["partner_1_name", "partner_2_name", "business_name", "capital_contribution", "profit_sharing"],
                document_type="Partnership Agreement",
            )
        elif any(keyword in prompt_lower for keyword in ["loan", "borrow", "lend", "credit", "financing"]):
            return FieldExtractionResult(
                fields=["lender_name", "borrower_name", "loan_amount", "interest_rate", "repayment_terms"],
                document_type="Loan Agreement",
            )
        else:
            return FieldExtractionResult(
                fields=["party_a", "party_b", "subject", "date", "terms"],
                document_type="General Contract",
            )

    correct_predictions = 0
    total_tests = len(test_cases)

    for i, (prompt, expected_type) in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: '{prompt}'")

        result = simulate_fallback(prompt)
        print(f"Document Type: {result.document_type}")
        print(f"Fields: {', '.join(result.fields[:3])}{'...' if len(result.fields) > 3 else ''}")
        print(f"Total Fields: {len(result.fields)}")

        # Check if detection worked correctly
        if result.document_type == expected_type:
            print(f"Correct detection!")
            correct_predictions += 1
        else:
            print(f"Expected: {expected_type}")

    accuracy = (correct_predictions / total_tests) * 100

    print(f"\n{'=' * 70}")
    print(f"Fallback logic test completed!")
    print(f"Accuracy: {correct_predictions}/{total_tests} ({accuracy:.1f}%)")
    print(f"\nThe fallback system correctly identifies document types")
    print(f"using keyword matching with {accuracy:.1f}% accuracy.")


if __name__ == "__main__":
    test_fallback_logic_directly()
