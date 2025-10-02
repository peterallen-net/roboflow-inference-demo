"""
CRUD (Create, Read, Update, Delete) operations for database
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
import uuid
from datetime import datetime

from db_models import AnalysisResult, Prediction, StatusEnum
from models import BoundingBox


def create_analysis_result(
    db: Session,
    filename: str,
    predictions_data: List[dict],
    user_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    model_version: Optional[str] = None,
    processing_time_ms: Optional[int] = None,
    image_path: Optional[str] = None,
    source_url: Optional[str] = None,
    status: StatusEnum = StatusEnum.COMPLETED
) -> AnalysisResult:
    """
    Create a new analysis result with predictions
    
    Args:
        db: Database session
        filename: Original filename
        predictions_data: List of prediction dictionaries with class_name, confidence, and bounding_box
        user_id: Optional user identifier
        metadata: Optional metadata dictionary
        model_version: Model version used
        processing_time_ms: Processing time in milliseconds
        image_path: Path to annotated image
        source_url: Source URL if from URL upload
        status: Analysis status
    
    Returns:
        Created AnalysisResult object
    """
    # Create analysis result
    result_id = uuid.uuid4()
    analysis_result = AnalysisResult(
        id=result_id,
        filename=filename,
        created_at=datetime.utcnow(),
        user_id=user_id,
        user_metadata=metadata,
        prediction_count=len(predictions_data),
        model_version=model_version,
        processing_time_ms=processing_time_ms,
        image_path=image_path,
        source_url=source_url,
        status=status
    )
    
    db.add(analysis_result)
    
    # Create predictions
    for pred_data in predictions_data:
        bbox = pred_data.get('bounding_box', {})
        prediction = Prediction(
            id=uuid.uuid4(),
            analysis_result_id=result_id,
            class_name=pred_data.get('class_name', pred_data.get('class', 'unknown')),
            confidence=pred_data.get('confidence', 0.0),
            bbox_x=bbox.get('x', 0),
            bbox_y=bbox.get('y', 0),
            bbox_width=bbox.get('width', 0),
            bbox_height=bbox.get('height', 0)
        )
        db.add(prediction)
    
    db.commit()
    db.refresh(analysis_result)
    
    return analysis_result


def get_analysis_result(db: Session, result_id: uuid.UUID) -> Optional[AnalysisResult]:
    """
    Get analysis result by ID
    
    Args:
        db: Database session
        result_id: UUID of the result
    
    Returns:
        AnalysisResult object or None if not found
    """
    return db.query(AnalysisResult).filter(AnalysisResult.id == result_id).first()


def list_analysis_results(
    db: Session,
    user_id: Optional[str] = None,
    status: Optional[StatusEnum] = None,
    limit: int = 20,
    offset: int = 0
) -> tuple[List[AnalysisResult], int]:
    """
    List analysis results with optional filtering and pagination
    
    Args:
        db: Database session
        user_id: Optional user ID filter
        status: Optional status filter
        limit: Maximum number of results
        offset: Number of results to skip
    
    Returns:
        Tuple of (list of results, total count)
    """
    query = db.query(AnalysisResult)
    
    # Apply filters
    if user_id:
        query = query.filter(AnalysisResult.user_id == user_id)
    if status:
        query = query.filter(AnalysisResult.status == status)
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply sorting and pagination
    results = query.order_by(desc(AnalysisResult.created_at)).limit(limit).offset(offset).all()
    
    return results, total_count


def delete_analysis_result(db: Session, result_id: uuid.UUID) -> bool:
    """
    Delete analysis result and its predictions (cascade)
    
    Args:
        db: Database session
        result_id: UUID of the result to delete
    
    Returns:
        True if deleted, False if not found
    """
    result = db.query(AnalysisResult).filter(AnalysisResult.id == result_id).first()
    
    if not result:
        return False
    
    db.delete(result)
    db.commit()
    
    return True


def update_analysis_result_status(
    db: Session,
    result_id: uuid.UUID,
    status: StatusEnum
) -> Optional[AnalysisResult]:
    """
    Update the status of an analysis result
    
    Args:
        db: Database session
        result_id: UUID of the result
        status: New status
    
    Returns:
        Updated AnalysisResult or None if not found
    """
    result = db.query(AnalysisResult).filter(AnalysisResult.id == result_id).first()
    
    if not result:
        return None
    
    result.status = status
    db.commit()
    db.refresh(result)
    
    return result


def get_predictions_for_result(db: Session, result_id: uuid.UUID) -> List[Prediction]:
    """
    Get all predictions for a specific analysis result
    
    Args:
        db: Database session
        result_id: UUID of the analysis result
    
    Returns:
        List of Prediction objects
    """
    return db.query(Prediction).filter(Prediction.analysis_result_id == result_id).all()


def get_statistics(db: Session, user_id: Optional[str] = None) -> dict:
    """
    Get statistics about analysis results
    
    Args:
        db: Database session
        user_id: Optional user ID filter
    
    Returns:
        Dictionary with statistics
    """
    query = db.query(AnalysisResult)
    
    if user_id:
        query = query.filter(AnalysisResult.user_id == user_id)
    
    total_analyses = query.count()
    total_predictions = db.query(func.sum(AnalysisResult.prediction_count))
    
    if user_id:
        total_predictions = total_predictions.filter(AnalysisResult.user_id == user_id)
    
    total_predictions = total_predictions.scalar() or 0
    
    # Status counts
    status_counts = {}
    for status in StatusEnum:
        count_query = query.filter(AnalysisResult.status == status)
        status_counts[status.value] = count_query.count()
    
    return {
        "total_analyses": total_analyses,
        "total_predictions": int(total_predictions),
        "status_counts": status_counts
    }
