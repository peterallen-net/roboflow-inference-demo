"""
SQLAlchemy ORM models for database tables
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime
import enum


class StatusEnum(str, enum.Enum):
    """Analysis status enumeration"""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalysisResult(Base):
    """
    Analysis result table - stores metadata about each image analysis
    """
    __tablename__ = "analysis_results"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic information
    filename = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    user_id = Column(String(255), nullable=True, index=True)
    
    # User metadata (renamed to avoid SQLAlchemy reserved name)
    user_metadata = Column(JSONB, nullable=True)
    
    # Analysis results
    prediction_count = Column(Integer, nullable=False, default=0)
    model_version = Column(String(255), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    
    # File paths
    image_path = Column(String(512), nullable=True)  # Path to annotated image
    source_url = Column(Text, nullable=True)  # Original URL if from URL upload
    
    # Status
    status = Column(SQLEnum(StatusEnum), nullable=False, default=StatusEnum.COMPLETED, index=True)
    
    # Relationships
    predictions = relationship("Prediction", back_populates="analysis_result", cascade="all, delete-orphan")
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
        Index('idx_status_created', 'status', 'created_at'),
    )

    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, filename={self.filename}, status={self.status})>"


class Prediction(Base):
    """
    Prediction table - stores individual object detection predictions
    """
    __tablename__ = "predictions"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to analysis result
    analysis_result_id = Column(UUID(as_uuid=True), ForeignKey('analysis_results.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Detection information
    class_name = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    
    # Bounding box coordinates
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_width = Column(Float, nullable=False)
    bbox_height = Column(Float, nullable=False)
    
    # Relationships
    analysis_result = relationship("AnalysisResult", back_populates="predictions")
    
    def __repr__(self):
        return f"<Prediction(id={self.id}, class={self.class_name}, confidence={self.confidence:.2f})>"
