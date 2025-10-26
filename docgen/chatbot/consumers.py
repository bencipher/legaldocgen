import asyncio
import os
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.exceptions import StopConsumer
from .llm import DocumentOrchestrator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

MODEL = os.getenv('LLM_MODEL_NAME', 'anthropic:claude-sonnet-4-5')


class DocumentAgentConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer managing multiple user conversations
    for document generation via the DocumentOrchestrator.
    """

    async def connect(self):
        user = self.scope.get("user")
        self.user_id = user.id if user and user.is_authenticated else self.channel_name

        # Store multiple orchestrators per conversation
        self.orchestrators = {}  # conversation_id -> DocumentOrchestrator
        self.current_conversation_id = None
        await self.accept()

        # No connection message - frontend will show connection status in UI

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection and cleanup resources."""
        logger.info(f"WebSocket disconnected with code {close_code} for user {self.user_id}")

        # Cleanup orchestrators and any ongoing operations
        if hasattr(self, 'orchestrators'):
            for conversation_id, orchestrator in self.orchestrators.items():
                if orchestrator.state == "generating":
                    logger.info(f"Stopping generation for conversation {conversation_id}")
                    orchestrator.state = "idle"  # Reset state

            # Clear orchestrators
            self.orchestrators.clear()

        # Call parent disconnect
        await super().disconnect(close_code)

    async def receive_json(self, content, **kwargs):
        """
        Handles messages from the frontend.
        The flow:
        1. First message — start extraction
        2. Intermediate messages — fill missing fields
        3. When complete — stream the document generation
        """
        msg_type = content.get("type", "user_message")
        user_message = content.get("content", "").strip()
        conversation_id = content.get("conversation_id", "default")

        # Switch to the specified conversation
        if conversation_id != self.current_conversation_id:
            self.current_conversation_id = conversation_id
            if conversation_id not in self.orchestrators:
                # Create new orchestrator for this conversation
                self.orchestrators[conversation_id] = DocumentOrchestrator(model_name=MODEL)

        if msg_type == "user_message":
            await self.handle_user_message(user_message)
        elif msg_type == "switch_conversation":
            # Handle conversation switching
            await self.send_json({"type": "conversation_switched", "conversation_id": conversation_id})
        elif msg_type == "stop_generation":
            await self.handle_stop_generation()

    def get_current_orchestrator(self):
        """Get the orchestrator for the current conversation."""
        if self.current_conversation_id not in self.orchestrators:
            self.orchestrators[self.current_conversation_id] = DocumentOrchestrator(model_name=MODEL)
        return self.orchestrators[self.current_conversation_id]

    async def handle_user_message(self, message: str):
        """Handle user message with proper error handling for disconnections."""
        try:
            orchestrator = self.get_current_orchestrator()

            # === If no active state yet, start with goal + extraction ===
            if orchestrator.state == "idle":
                await orchestrator.start(message)
                await orchestrator.record_user_input(message)  # record inputs from initial prompt

                next_q = await orchestrator.next_question()
                await self.send_json({"type": "assistant_message", "content": next_q})
                return

            # === If collecting fields ===
            elif orchestrator.state == "collecting":
                await orchestrator.record_user_input(message)

                next_q = await orchestrator.next_question()
                if next_q:
                    try:
                        await self.send_json({"type": "assistant_message", "content": next_q})
                    except Exception:
                        return
                else:
                    try:
                        await self.send_json(
                            {
                                "type": "assistant_message",
                                "content": "Great! I have all the info I need. Generating your document...",
                            }
                        )
                    except Exception:
                        return
                    asyncio.create_task(self.stream_document())  # start async streaming
                return

            # === Ignore messages during generation ===
            elif orchestrator.state == "generating":
                try:
                    await self.send_json(
                        {"type": "assistant_message", "content": "Please hold on, your document is being generated..."}
                    )
                except Exception:
                    return

            # === Handle continue requests for incomplete documents ===
            elif message.lower().strip() in ["continue", "continue document", "complete document", "finish document"]:
                # Reset state to allow continuation
                orchestrator.state = "generating"
                await self.send_json(
                    {
                        "type": "assistant_message",
                        "content": "Continuing document generation...",
                    }
                )
                asyncio.create_task(self.stream_document(recovery=True))  # start async streaming

        except Exception as e:
            # Log the error and handle client disconnections gracefully
            if "ClientDisconnected" in str(e) or "ConnectionClosedError" in str(e):
                logger.info(f"Client disconnected during message handling: {e}")
                # Don't try to send error message if client is disconnected
                raise StopConsumer()
            else:
                logger.error(f"Error handling user message: {e}")
                try:
                    await self.send_json(
                        {
                            "type": "system_message",
                            "content": "An error occurred while processing your message. Please try again.",
                        }
                    )
                except:
                    # If we can't send the error message, client is likely disconnected
                    raise StopConsumer()

    async def stream_document(self, recovery: bool = False):
        """Streams generated document chunks to the frontend in real-time with pagination markers."""
        try:
            orchestrator = self.get_current_orchestrator()
            full_document = ""
            chunk_count = 0

            async for chunk in orchestrator.generate_document():
                # Check if WebSocket is still connected before sending
                if self.channel_layer is None:
                    logger.info("WebSocket connection lost, stopping document streaming")
                    return

                full_document += chunk
                chunk_count += 1

                # Send smaller chunks for better typewriter effect
                try:
                    await self.send_json({"type": "generate_document", "chunk": chunk, "chunk_index": chunk_count})
                    logger.debug(f"Sent chunk {chunk_count} with length {len(chunk)}")
                    # Add a small delay for better streaming experience
                    await asyncio.sleep(0.05)  # 50ms delay between chunks
                except Exception as e:
                    if (
                        "ClientDisconnected" in str(e)
                        or "ConnectionClosedError" in str(e)
                        or "websocket.send" in str(e)
                    ):
                        logger.info(f"Client disconnected during document streaming at chunk {chunk_count}")
                        return  # Exit gracefully without error
                    else:
                        raise  # Re-raise other exceptions

            # Check if document seems incomplete and try to continue
            if self.is_document_incomplete(full_document):
                # Check connection before continuing
                if self.channel_layer is None:
                    logger.info("WebSocket connection lost, cannot continue generation")
                    return

                try:
                    await self.send_json(
                        {
                            "type": "assistant_message",
                            "content": "🔄 Document appears incomplete. Continuing generation...",
                        }
                    )

                    # Continue generation with a continuation prompt
                    continuation = await self.continue_document_generation(full_document)
                    if continuation:
                        full_document += "\n" + continuation
                except Exception as e:
                    if (
                        "ClientDisconnected" in str(e)
                        or "ConnectionClosedError" in str(e)
                        or "websocket.send" in str(e)
                    ):
                        logger.info("Client disconnected during continuation")
                        return
                    else:
                        raise

            # Post-process the complete document to add pagination
            paginated_document = self.add_pagination_markers(full_document)

            # Final connection check before sending completion message
            if self.channel_layer is None:
                logger.info("WebSocket connection lost, cannot send completion message")
                return

            try:
                await self.send_json(
                    {
                        "type": "generation_complete",
                        "content": "✅ Document generation completed successfully!",
                        "full_document": paginated_document,
                    }
                )
            except Exception as e:
                if "ClientDisconnected" in str(e) or "ConnectionClosedError" in str(e) or "websocket.send" in str(e):
                    logger.info("Client disconnected before completion message could be sent")
                    return
                else:
                    raise

            orchestrator.state = "idle"

        except Exception as e:
            if "ClientDisconnected" in str(e) or "ConnectionClosedError" in str(e) or "websocket.send" in str(e):
                logger.info(f"Client disconnected during document streaming: {e}")
                return  # Exit gracefully
            else:
                logger.error(f"Error during document streaming: {e}")
                # Check connection before sending error message
                if self.channel_layer is not None:
                    try:
                        await self.send_json(
                            {"type": "system_message", "content": f"⚠️ Document generation failed: {str(e)}"}
                        )
                    except:
                        # If we can't send error message, client is disconnected
                        logger.info("Could not send error message - client likely disconnected")

    def is_document_incomplete(self, document: str) -> bool:
        """Check if the document seems incomplete."""
        # can be handled by llm too
        lines = document.strip().split('\n')
        if not lines:
            return True

        last_line = lines[-1].strip()

        # Check for incomplete patterns
        incomplete_indicators = [
            # Incomplete sentences
            last_line.endswith('...'),
            last_line.endswith(','),
            last_line.endswith('and'),
            last_line.endswith('or'),
            last_line.endswith('but'),
            last_line.endswith('the'),
            last_line.endswith('a'),
            last_line.endswith('an'),
            # Incomplete sections
            '## ' in last_line and len(last_line) < 50,
            '### ' in last_line and len(last_line) < 50,
            # Document too short (less than 8 pages estimated)
            len(document.split('\n')) < 200,  # ~25 lines per page * 8 pages
            # Ends abruptly without proper conclusion
            not any(
                keyword in document.lower()
                for keyword in ['signature', 'executed', 'agreed', 'concluded', 'effective date']
            ),
        ]

        return any(incomplete_indicators)

    async def continue_document_generation(self, partial_document: str) -> str:
        """Continue generating the document from where it left off."""
        orchestrator = self.get_current_orchestrator()

        try:
            continuation_prompt = f"""
            The following legal document was partially generated but appears incomplete:

            {partial_document[-1000:]}  # Last 1000 characters for context

            Please continue and complete this document. Focus on:
            1. Completing any incomplete sentences or sections
            2. Adding any missing standard legal clauses
            3. Including proper signature blocks and execution provisions
            4. Ensuring the document meets professional legal standards
            5. Adding final sections like governing law, dispute resolution, etc.

            Continue exactly where the document left off, maintaining the same style and format.
            """

            # Create a simple continuation context
            from .models import DocumentContext

            continuation_context = DocumentContext(
                fields={k: v for k, v in orchestrator.fields.items() if v is not None},
                document_type=orchestrator.document_type,
                user_goal=f"Continue and complete the following document: {orchestrator.user_goal}",
            )

            # Use the LLM's generate_document method with continuation context
            continuation_chunks = []
            async for chunk in orchestrator.llm.generate_document(continuation_context):
                # Check connection before sending chunks
                if self.channel_layer is None:
                    logger.info("WebSocket connection lost during continuation, stopping")
                    break

                continuation_chunks.append(chunk)
                # Also stream the continuation
                try:
                    await self.send_json(
                        {
                            "type": "generate_document",
                            "chunk": chunk,
                            "chunk_index": 999999,  # High number to indicate continuation
                        }
                    )
                    await asyncio.sleep(0.05)
                except Exception as e:
                    if (
                        "ClientDisconnected" in str(e)
                        or "ConnectionClosedError" in str(e)
                        or "websocket.send" in str(e)
                    ):
                        logger.info("Client disconnected during continuation streaming")
                        break
                    else:
                        raise

            return ''.join(continuation_chunks)
        except Exception as e:
            logger.error(f"Error in continuation: {e}")
            return ""

    def add_pagination_markers(self, document: str) -> str:
        """Add intelligent page break markers to the document for better pagination."""
        lines = document.split('\n')
        paginated_lines = []
        line_count = 0
        lines_per_page = 30  # Slightly fewer lines per page for better readability

        for i, line in enumerate(lines):
            # Smart page breaks based on content structure
            should_break = False

            # Force page break for major sections (H1, H2 headers) after some content
            if line.startswith('# ') and line_count > 15:
                should_break = True
            elif line.startswith('## ') and line_count > 20:
                should_break = True
            # Regular page breaks based on line count
            elif line_count >= lines_per_page:
                should_break = True
            # Break before signature sections
            elif 'signature' in line.lower() and line_count > 10:
                should_break = True

            if should_break and line_count > 0:
                paginated_lines.append('\n---PAGE_BREAK---\n')
                line_count = 0

            paginated_lines.append(line)

            # Count substantial lines (not just empty lines)
            if line.strip() and not line.startswith('---PAGE_BREAK---'):
                line_count += 1

        return '\n'.join(paginated_lines)

    async def handle_stop_generation(self):
        """Handle stop generation request from frontend."""
        orchestrator = self.get_current_orchestrator()

        # Reset orchestrator state
        orchestrator.state = "idle"

        # Send confirmation to frontend
        await self.send_json({"type": "system_message", "content": "🛑 Document generation stopped by user."})
