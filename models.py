"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class StatusEnum(str, Enum):
    """Analysis status enumeration"""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ErrorTypeEnum(str, Enum):
    """Error type enumeration"""
    VALIDATION_ERROR = "validation_error"
    PROCESSING_ERROR = "processing_error"
    NOT_FOUND = "not_found"
    INTERNAL_ERROR = "internal_error"


# Request Models

class AnalyzeImageURLRequest(BaseModel):
    """Request model for analyzing image from URL"""
    image_url: str = Field(..., description="Valid URL to image file")
    user_id: Optional[str] = Field(None, description="Optional user identifier")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")

    @validator('image_url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('image_url must be a valid HTTP/HTTPS URL')
        return v


# Response Models

class BoundingBox(BaseModel):
    """Bounding box coordinates"""
    x: float = Field(..., description="Center X coordinate")
    y: float = Field(..., description="Center Y coordinate")
    width: float = Field(..., description="Box width")
    height: float = Field(..., description="Box height")


class Prediction(BaseModel):
    """Single object detection prediction"""
    id: str = Field(..., description="Unique prediction identifier")
    class_name: str = Field(..., alias="class", description="Object class name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    bounding_box: BoundingBox = Field(..., description="Bounding box coordinates")

    class Config:
        populate_by_name = True


class AnalysisResult(BaseModel):
    """Complete analysis result"""
    result_id: str = Field(..., description="Unique result identifier (UUID)")
    filename: str = Field(..., description="Original filename")
    created_at: datetime = Field(..., description="Creation timestamp")
    user_id: Optional[str] = Field(None, description="User identifier")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")
    predictions: List[Prediction] = Field(default_factory=list, description="List of predictions")
    prediction_count: int = Field(..., description="Total number of predictions")
    model_version: Optional[str] = Field(None, description="Model version used")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")
    image_url: Optional[str] = Field(None, description="URL to annotated image")
    status: StatusEnum = Field(..., description="Analysis status")


class AnalysisResponse(BaseModel):
    """Response for single analysis operation"""
    success: bool = Field(..., description="Operation success status")
    result: AnalysisResult = Field(..., description="Analysis result")
    message: Optional[str] = Field(None, description="Optional message")


class AnalysisResultSummary(BaseModel):
    """Simplified result for list operations"""
    result_id: str
    filename: str
    created_at: datetime
    user_id: Optional[str] = None
    prediction_count: int
    status: StatusEnum


class ResultsListResponse(BaseModel):
    """Response for listing multiple results"""
    success: bool = Field(..., description="Operation success status")
    results: List[AnalysisResultSummary] = Field(default_factory=list, description="List of results")
    total_count: int = Field(..., description="Total number of results")
    limit: int = Field(..., description="Results per page limit")
    offset: int = Field(..., description="Current offset")
    has_more: bool = Field(..., description="Whether more results exist")


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = Field(False, description="Always false for errors")
    error: ErrorTypeEnum = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error context")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(..., description="Current server time")
    database_status: Optional[str] = Field(None, description="Database connection status")


class DeleteResponse(BaseModel):
    """Response for delete operations"""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Confirmation message")
    deleted_result_id: str = Field(..., description="ID of deleted result")
