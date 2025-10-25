# Demo usage function
import asyncio
import os
from chatbot.llm import DocumentOrchestrator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MODEL = os.getenv('LLM_MODEL_NAME', 'anthropic:claude-sonnet-4-5')


async def main():
    """Demo function showing the real LLM orchestrator in action."""
    orchestrator = DocumentOrchestrator(model_name=MODEL)

    start_prompt = input("🤖: What document would you like me to generate today? ")

    # Start the flow
    await orchestrator.start(start_prompt)
    await orchestrator.record_user_input(start_prompt)

    # Collect missing information
    while orchestrator._missing_fields():
        question = await orchestrator.next_question()
        if not question:
            break
        print()
        user_input = input(f"🤖: {question}\n👤: ")
        await orchestrator.record_user_input(user_input)

    # Generate document
    print("\n" + "=" * 50)
    async for chunk in orchestrator.generate_document():
        print(chunk, end="", flush=True)
    print("\n" + "=" * 50)
    print("✅ Document generation complete!")


if __name__ == "__main__":
    asyncio.run(main())
