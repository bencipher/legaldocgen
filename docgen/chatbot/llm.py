"""
Real LLM implementation using Pydantic AI for document generation.
Replaces the mock orchestrator with actual LLM functionality.
"""

import asyncio
import os
from time import perf_counter
from typing import Dict, List, Optional, AsyncGenerator, Set, Union, cast

from pydantic_ai import Agent, RunContext, ModelRetry
from retry import retry
from .models import FieldExtractionResult, FieldRequest, FieldMapping, DocumentContext
from dotenv import load_dotenv
from .constants.fields import (
    get_fields_for_document_type,
    detect_document_type_by_keywords,
)
from .constants.prompts import (
    REQUIREMENT_EXTRACTION_PROMPT,
    FIELD_INFORMATION_PROMPT,
    FIELD_MAPPING_PROMPT,
    DOCUMENT_GENERATION_PROMPT,
    format_field_request_prompt,
)

# Load environment variables from .env file
load_dotenv()

# User input tracking for acknowledgments (similar to mock)
USER_INPUT_HISTORY: Set[str] = set()


class RealLLM:
    """Real LLM implementation using Pydantic AI for document generation."""

    def __init__(self, model_name: str = "openai:gpt-4.1"):
        """
        Initialize the real LLM with specified model.

        Args:
            model_name: Model identifier (default: openai:gpt-4.1)

        Raises:
            ValueError: If API key is not available for the specified model
        """
        self.model_name = model_name

        # Agent for extracting required fields
        self.extraction_agent = Agent(
            model_name,
            output_type=FieldExtractionResult,
            instructions=REQUIREMENT_EXTRACTION_PROMPT,
        )

        # Agent for asking for missing fields
        self.field_request_agent = Agent(
            model_name,
            output_type=FieldRequest,
            instructions=FIELD_INFORMATION_PROMPT,
        )

        # Agent for mapping user input to fields
        self.field_mapping_agent = Agent(
            model_name,
            output_type=List[FieldMapping],
            instructions=FIELD_MAPPING_PROMPT,
        )

        # Agent for document generation, set system prompt and parameters later
        self.generation_agent = Agent(
            model_name,
            output_type=str,
            instructions=DOCUMENT_GENERATION_PROMPT,
            model_settings={"max_tokens": 15000, "temperature": 0.7},
        )

    @retry(tries=3, delay=1, backoff=2, max_delay=30, logger=None)
    async def run_completion(self, agent, prompt: str, stream: bool = False, **kwargs):
        """
        Generic method to run agent completion with retry logic.

        Args:
            agent: The Pydantic AI agent to use
            prompt: The prompt to send to the agent
            stream: Whether to use streaming mode (default: False)
            **kwargs: Additional arguments for the agent

        Returns:
            For stream=False: The agent's output result
            For stream=True: AsyncGenerator of text chunks from the streaming response
        """
        if stream:
            return self._run_completion_streaming_impl(agent, prompt, **kwargs)
        else:
            return await self._run_completion_complete_impl(agent, prompt, **kwargs)

    async def _run_completion_streaming_impl(self, agent, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Implementation for streaming completion."""
        async with agent.run_stream(prompt, **kwargs) as result:
            async for text_chunk in result.stream_text(delta=True):
                yield text_chunk

    async def _run_completion_complete_impl(self, agent, prompt: str, **kwargs) -> str:
        """Implementation for non-streaming completion."""
        result = await agent.run(prompt, **kwargs)
        return result.output

    async def extract_requirements(self, user_prompt: str) -> List[str]:
        """
        Extract required fields from user prompt using LLM with retry logic.

        Args:
            user_prompt: The user's initial request

        Returns:
            List of required field names
        """
        try:
            print(f"Extracting requirements with retry logic (max 3 attempts)...")
            result = await self.run_completion(
                self.extraction_agent, f"Analyze this request and determine required fields: {user_prompt}"
            )
            # Type cast for clarity - we know extraction_agent returns FieldExtractionResult
            extraction_result = cast(FieldExtractionResult, result)
            return extraction_result.fields
        except Exception as e:
            print(f"All LLM extraction attempts failed: {str(e)}")
            print("Using fallback constants-based extraction...")
            # Fallback using constants if all LLM attempts fail
            document_type = detect_document_type_by_keywords(user_prompt)
            return get_fields_for_document_type(document_type)

    async def extract_requirements_with_type(self, user_prompt: str) -> FieldExtractionResult:
        """
        Extract required fields and document type from user prompt using LLM with retry logic.

        Args:
            user_prompt: The user's initial request

        Returns:
            FieldExtractionResult containing fields and document type
        """
        try:
            print(f"Extracting requirements with type using retry logic (max 3 attempts)...")
            result = await self.run_completion(self.extraction_agent, f"Here is the user input: '{user_prompt}'")
            # Type cast for clarity - we know extraction_agent returns FieldExtractionResult
            return cast(FieldExtractionResult, result)
        except Exception as e:
            print(f"All LLM extraction attempts failed: {str(e)}")
            print("Using fallback constants-based extraction...")
            # Fallback using constants if all LLM attempts fail
            document_type = detect_document_type_by_keywords(user_prompt)
            fields = get_fields_for_document_type(document_type)

            return FieldExtractionResult(
                fields=fields,
                document_type=document_type,
            )

    async def ask_for_field(
        self,
        missing_fields: List[str],
        fields_to_request: List[str],
        user_last_action: str = "",
        greet_user: bool = False,
        user_goal: str = "",
    ) -> str:
        """
        Generate a question asking for missing fields with acknowledgment.

        Args:
            missing_fields: List of fields still needed
            user_last_action: Description of user's recent actions for acknowledgment

        Returns:
            Question string asking for the missing fields
        """
        # Take only 1-2 fields at a time to avoid overwhelming the user
        greet_instr = (
            f"You are a legal practitioner, and the user is seeking your assistance to generate a legal document. to acheive this goal {user_goal} Greet the user warmly and reassure them that you are here to help! "
            if greet_user
            else ""
        )
        prompt = f"""
        The user is generating a document and we need more information.
        
        Missing fields needed: {missing_fields}
        Fields to request in this interaction: {fields_to_request}
        User's recent actions: {user_last_action}
        
        Generate a polite question asking for the specific fields: {', '.join(fields_to_request)}
        If the user provided recent input, acknowledge it first.
        """
        greet_instr = (
            f"You are a legal practitioner, and the user is seeking your assistance to generate a legal document. "
            f"To achieve this goal — {user_goal}. Greet the user warmly in the response. "
            f"Start with a short sentence that begins like this or similar phrases: 'I am glad to be of assistance in helping you craft your {user_goal} (summarize the user goal, do not return verbatim). "
            f"To proceed I will be needing the following information:' "
            f"IMPORTANT: ALWAYS return the following to the user as a numbered list `{', '.join(missing_fields)}.` "
            if greet_user
            else ""
        )

        system_message = f"""
        {greet_instr}

        The user is generating a document and we need more information.

        Missing fields needed: {missing_fields}
        Fields to request in this interaction: {fields_to_request}
        User's recent actions: {user_last_action}
        
        GREET_USER: {greet_user}
        
        Your task:
        1. ALWAYS: If the user just recently saved some information saving actions as listed in the User's recent actions, briefly acknowledge or thank them before asking your next questions.
        2. After the list, generate a polite sentence requesting those fields in plain language.
        3. Maintain a friendly, professional, and helpful legal tone — warm but clear.
        4. IMPORTANT: be very brief, concise, and to the point.
        """
        end = ""
        if greet_user:
            end = "5. ALWAYS: End this section of the message with something like:  You can proceed to provide all the fields at once, or go at your own pace. (or something similar, be creative - the goal is to suggest to the user to give all the info at once if they feel like it)"
        elif not greet_user and len(missing_fields) <= 2:
            end = "5. ALWAYS: end the conversation with phrases like finally, to wrap up, last but not least, in conclusion, etc., to indicate that the user is nearing completion of the information gathering process."

        try:
            print(f"Requesting fields with retry logic (max 3 attempts)...")
            result = await self.run_completion(self.field_request_agent, system_message + end)
            # Type cast for clarity - we know field_request_agent returns FieldRequest
            field_request = cast(FieldRequest, result)
            return field_request.question
        except Exception as e:
            print(f"All LLM field request attempts failed: {str(e)}")
            print("Using fallback field request prompt...")
            # Fallback using format_field_request_prompt
            return format_field_request_prompt("document", fields_to_request)

    async def map_user_input_to_fields(self, user_input: str, missing_fields: List[str]) -> Dict[str, str]:
        """
        Map user input to document fields using LLM.

        Args:
            user_input: The user's response
            missing_fields: List of fields that need to be filled

        Returns:
            Dictionary mapping field names to values
        """
        prompt = f"""
        User input: "{user_input}"
        Missing fields: {missing_fields}
        
        Extract information from the user input and map it to the appropriate fields.
        Only map fields you are confident about.
        """

        try:
            print(f"Mapping user input with retry logic (max 3 attempts)...")
            result = await self.run_completion(self.field_mapping_agent, prompt)
            # Type cast for clarity - we know field_mapping_agent returns List[FieldMapping]
            mappings = cast(List[FieldMapping], result)

            field_dict = {}
            for mapping in mappings:
                if mapping.confidence > 0.7:  # Only use high-confidence mappings
                    field_dict[mapping.field_name] = mapping.field_value

            return field_dict
        except Exception as e:
            print(f"All LLM mapping attempts failed: {str(e)}")
            print("Using fallback simple mapping...")
            # Fallback: simple mapping to first missing fields
            return {missing_fields[0]: user_input} if missing_fields else {}

    async def thank_user(self, field_name: str, value: str) -> str:
        """
        Generate a thank you message for user input.

        Args:
            field_name: Name of the field that was filled
            value: Value that was provided

        Returns:
            Thank you message
        """
        # Add to history for future acknowledgments
        USER_INPUT_HISTORY.add(f"User saved {field_name} as '{value}'")
        return f"Thanks! I've recorded {field_name} as '{value}'."

    async def generate_document(self, context: DocumentContext, recovery: bool = False) -> AsyncGenerator[str, None]:
        """
        Generate document content in streaming chunks.

        Args:
            context: Document context containing all required fields

        Yields:
            Document content chunks
        """
        prompt = f"""
        Generate a {context.document_type} document with the following information:
        
        Document type: {context.document_type}
        User goal: {context.user_goal}
        
        Fields:
        """

        for field, value in context.fields.items():
            prompt += f"- {field}: {value}\n"

        prompt += """
        
        Create a complete, professional legal document with:
        1. Proper header and title
        2. All necessary clauses and sections
        3. Clear terms and conditions
        4. Signature lines
        5. Date and location information
        
        ALWAYS: Ensure all the subheadings, sections, fit within 10
        Make it legally sound and professionally formatted.
        """

        try:
            print(f"Starting document generation...")
            start_time = perf_counter()

            # Stream each chunk as it's generated
            chunk_count = 0
            async for chunk in self._run_completion_streaming_impl(self.generation_agent, prompt):
                chunk_count += 1
                yield chunk

            end_time = perf_counter()
            generation_time = end_time - start_time
            print(f"Document generation completed in {generation_time:.2f} seconds")
            print(f"Streamed {chunk_count} chunks successfully")

        except Exception as e:
            print(f"LLM document generation failed: {str(e)}")
            print(f"Using fallback document generation...")

            # Fallback to simple document generation
            doc_text = f"""
            {context.document_type.upper()}
            
            This document is generated for {context.fields.get('party_a', 'Party A')} 
            and {context.fields.get('party_b', 'Party B')}.
            
            Details:
            """

            for field, value in context.fields.items():
                doc_text += f"{field.replace('_', ' ').title()}: {value}\n"

            doc_text += """
            
            This document constitutes a binding agreement between the parties.
            
            Signatures:
            _______________________  _______________________
            Party A                   Party B
            
            Date: ______________
            """

            # Simulate streaming by yielding chunks
            words = doc_text.split()
            print(f"📄 Streaming {len(words)//3 + 1} fallback chunks to frontend...")
            for i in range(0, len(words), 3):  # Yield 3 words at a time
                chunk = " ".join(words[i : i + 3]) + " "
                yield chunk
                await asyncio.sleep(0.1)  # Simulate processing delay

            print(f"All fallback chunks sent successfully")


class DocumentOrchestrator:
    """
    Real document orchestrator using Pydantic AI for LLM interactions.
    Manages the multi-phase conversational flow for document generation.
    """

    def __init__(self, llm: Optional[RealLLM] = None, model_name: str = "openai:gpt-4.1"):
        """
        Initialize the orchestrator.

        Args:
            llm: Custom LLM instance (optional)
            model_name: Model name if creating default LLM
        """
        self.llm = llm or RealLLM(model_name)
        self.fields: Dict[str, Optional[str]] = {}
        self.state = "idle"
        self.document_type = ""
        self.user_goal = ""
        self.user_greeted = False

    async def start(self, user_prompt: str) -> Dict[str, Optional[str]]:
        """
        Start the document generation flow by extracting requirements.

        Args:
            user_prompt: The user's initial request

        Returns:
            Dictionary of required fields initialized to None
        """
        # self.state = "extracting"
        self.user_goal = (
            user_prompt if not self.user_goal else self.user_goal
        )  # set goal for first message (to be replaced with llm call)

        print(f"Extracting requirements for: '{user_prompt}'")

        # Extract required fields and document type using LLM
        extraction_result = await self.llm.extract_requirements_with_type(user_prompt)
        field_list = extraction_result.fields
        self.document_type = extraction_result.document_type
        self.fields = {field: None for field in field_list}

        self.state = "collecting"
        await self.record_user_input(user_prompt)

    def _missing_fields(self) -> List[str]:
        """Get list of fields that still need values."""
        return [k for k, v in self.fields.items() if not v]

    async def next_question(self) -> Optional[str]:
        """
        Generate the next question for missing fields.

        Returns:
            Question string or None if all fields are filled
        """
        missing = self._missing_fields()
        if not missing:
            self.state = "generating"
            return None

        # Get user action history for acknowledgment
        user_last_action = ", ".join(list(USER_INPUT_HISTORY))
        USER_INPUT_HISTORY.clear()
        fields_to_request = missing[:2]
        if self.user_greeted:
            should_greet = False
        else:
            should_greet = True
        self.user_greeted = True
        return await self.llm.ask_for_field(
            missing, fields_to_request, user_last_action, greet_user=should_greet, user_goal=self.user_goal
        )

    async def record_user_input(self, user_response: str):
        """
        Process user input and map it to document fields.

        Args:
            user_response: The user's response to field requests
        """
        self._ensure_state("collecting", "Cannot record user input before starting collection.")

        missing = self._missing_fields()
        if not missing:
            return

        # Use LLM to map user input to fields
        field_mappings = await self.llm.map_user_input_to_fields(user_response, missing)

        # Update fields and generate thank you messages
        for field_name, field_value in field_mappings.items():
            if field_name in self.fields and not self.fields[field_name]:
                self.fields[field_name] = field_value
                await self.llm.thank_user(field_name, field_value)
        if not self._missing_fields():
            self.state = "generating"

    async def generate_document(self, recovery: bool = False) -> AsyncGenerator[str, None]:
        """
        Generate the final document in streaming chunks.

        Yields:
            Document content chunks
        """
        self._ensure_state("generating", "Cannot generate document before collecting all fields.")

        print("Generating document...")

        # Create document context
        context = DocumentContext(
            fields={k: v for k, v in self.fields.items() if v is not None},
            document_type=self.document_type,
            user_goal=self.user_goal,
        )

        if recovery:
            print("Generating document in recovery mode...")
            # add extra context needed so llm can continue from failure maybe ToC and last good chunk
        # Stream document generation
        async for chunk in self.llm.generate_document(context):
            yield chunk

    async def get_user_goal(self, initial_msg: str) -> str:
        """
        Analyze and confirm user intent.

        Args:
            initial_msg: User's initial message

        Returns:
            Confirmed goal description
        """
        # Could be enhanced with LLM classification
        if "agreement" in initial_msg.lower():
            goal = f"Generate a {self.document_type} document"
        elif "contract" in initial_msg.lower():
            goal = f"Generate a {self.document_type} document"
        else:
            goal = f"Generate a {self.document_type} document"

        print(f"Understood your goal: {goal}")
        return goal

    def _ensure_state(self, expected: str, error_msg: str = ""):
        """Verify orchestrator is in expected state."""
        if not error_msg:
            error_msg = f"Invalid state: expected {expected}, got {self.state}"
        if self.state != expected:
            raise RuntimeError(error_msg)
