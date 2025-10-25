from dataclasses import dataclass
from pydantic import BaseModel, Field
from typing import Dict, List, Optional


class FieldExtractionResult(BaseModel):
    """Result of extracting required fields from user prompt."""

    fields: List[str] = Field(..., description="List of required field names for the document")
    document_type: str = Field(..., description="Type of document being generated")


class FieldRequest(BaseModel):
    """Request for missing fields with acknowledgment."""

    acknowledgment: Optional[str] = Field(None, description="Acknowledgment of user's recent input")
    question: str = Field(..., description="Model-generated response")
    fields_requested: List[str] = Field(..., description="Names of fields being requested")


class FieldMapping(BaseModel):
    """Mapping of user input to document fields."""

    field_name: str = Field(..., description="Name of the field")
    field_value: str = Field(..., description="Value extracted from user input")
    confidence: float = Field(..., description="Confidence level (0-1) in the extraction")


class DocumentChunk(BaseModel):
    """A chunk of generated document content."""

    content: str = Field(..., description="Document content chunk")
    is_final: bool = Field(False, description="Whether this is the final chunk")


@dataclass
class DocumentContext:
    """Context for document generation containing all required fields."""

    fields: Dict[str, str]
    document_type: str
    user_goal: str
