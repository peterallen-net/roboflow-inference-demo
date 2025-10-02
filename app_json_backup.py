"""
Roboflow Inference Demo API - Phase 1 & 2 Implementation
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import cv2
import numpy as np
from inference_sdk import InferenceHTTPClient
import config
import os
import json
import base64
from datetime import datetime
import tempfile
import uvicorn
import uuid
import time
import requests
from typing import Optional
from models import (
    AnalyzeImageURLRequest,
    AnalysisResponse,
    ResultsListResponse,
    HealthResponse,
    DeleteResponse,
    ErrorResponse,
    AnalysisResult,
    AnalysisResultSummary,
    Prediction,
    BoundingBox,
    StatusEnum,
    ErrorTypeEnum
)

# API Version
API_VERSION = "1.0.0"

app = FastAPI(
    title="Roboflow Inference Demo API",
    version=API_VERSION,
    description="AI-powered image analysis API using Roboflow"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Roboflow client
client = InferenceHTTPClient(
    api_url=config.API_URL,
    api_key=config.API_KEY
)

# Data directories
OUTPUT_DIR = os.path.join("data", "output_json")
ANNOTATED_DIR = os.path.join("data", "annotated_images")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ANNOTATED_DIR, exist_ok=True)


def draw_boxes(image, predictions):
    """Draw bounding boxes on image"""
    if not predictions or not isinstance(predictions, list):
        return image
        
    for pred in predictions:
        x, y, w, h = pred["x"], pred["y"], pred["width"], pred["height"]
        label = pred["class"]
        conf = pred["confidence"]
        
        # Draw rectangle
        pt1 = (int(x - w/2), int(y - h/2))
        pt2 = (int(x + w/2), int(y + h/2))
        cv2.rectangle(image, pt1, pt2, (0, 255, 0), 2)
        
        # Put label above the box
        label_text = f"{label} {conf:.2f}"
        (text_width, text_height), baseline = cv2.getTextSize(
            label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
        )
        label_pt = (
            pt1[0], 
            pt1[1] - 10 if pt1[1] - 10 > text_height else pt1[1] + text_height + 2
        )
        cv2.rectangle(
            image, 
            (label_pt[0], label_pt[1] - text_height - baseline), 
            (label_pt[0] + text_width, label_pt[1] + baseline), 
            (0, 255, 0), 
            cv2.FILLED
        )
        cv2.putText(
            image, label_text, (label_pt[0], label_pt[1]), 
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2
        )
    
    return image


def process_predictions(raw_predictions) -> list:
    """Convert raw predictions to Prediction model format"""
    predictions = []
    for i, pred in enumerate(raw_predictions):
        predictions.append({
            "id": f"pred_{i}_{uuid.uuid4().hex[:8]}",
            "class": pred.get("class", "unknown"),
            "confidence": pred.get("confidence", 0.0),
            "bounding_box": {
                "x": pred.get("x", 0),
                "y": pred.get("y", 0),
                "width": pred.get("width", 0),
                "height": pred.get("height", 0)
            }
        })
    return predictions


def save_result_metadata(result_id: str, result_data: dict):
    """Save result metadata to JSON file"""
    json_path = os.path.join(OUTPUT_DIR, f"{result_id}.json")
    with open(json_path, "w") as f:
        json.dump(result_data, f, indent=2, default=str)
    return json_path


def load_result_metadata(result_id: str) -> Optional[dict]:
    """Load result metadata from JSON file"""
    json_path = os.path.join(OUTPUT_DIR, f"{result_id}.json")
    if not os.path.exists(json_path):
        return None
    try:
        with open(json_path, 'r') as f:
            return json.load(f)
    except Exception:
        return None


def delete_result_files(result_id: str) -> bool:
    """Delete all files associated with a result"""
    try:
        # Delete JSON metadata
        json_path = os.path.join(OUTPUT_DIR, f"{result_id}.json")
        if os.path.exists(json_path):
            os.remove(json_path)
        
        # Delete annotated image
        img_path = os.path.join(ANNOTATED_DIR, f"{result_id}.jpg")
        if os.path.exists(img_path):
            os.remove(img_path)
        
        return True
    except Exception:
        return False


# ============================================================================
# PHASE 1 ENDPOINTS
# ============================================================================

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=API_VERSION,
        timestamp=datetime.utcnow()
    )


@app.post("/api/v1/analyze", response_model=AnalysisResponse, status_code=201)
async def analyze_image(
    image: UploadFile = File(...),
    user_id: Optional[str] = None,
    metadata: Optional[str] = None
):
    """
    Analyze uploaded image using Roboflow model
    
    - **image**: Image file to analyze (JPEG, PNG)
    - **user_id**: Optional user identifier
    - **metadata**: Optional JSON string with additional metadata
    """
    start_time = time.time()
    result_id = str(uuid.uuid4())
    
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG)"
            )
        
        # Parse metadata if provided
        parsed_metadata = {}
        if metadata:
            try:
                parsed_metadata = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid JSON in metadata field"
                )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=os.path.splitext(image.filename)[1]
        ) as temp_file:
            content = await image.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Run inference
            result = client.run_workflow(
                workspace_name=config.WORKSPACE_NAME,
                workflow_id=config.WORKFLOW_ID,
                images={"image": temp_file_path},
                use_cache=True
            )
            
            # Process annotated image and predictions
            annotated_image_base64 = None
            raw_predictions = []
            
            if isinstance(result, list) and len(result) > 0:
                first_result = result[0]
                
                if isinstance(first_result, dict) and "output_image" in first_result:
                    # Save API-provided annotated image
                    try:
                        image_data = base64.b64decode(first_result["output_image"])
                        img_path = os.path.join(ANNOTATED_DIR, f"{result_id}.jpg")
                        with open(img_path, "wb") as f:
                            f.write(image_data)
                        annotated_image_base64 = first_result["output_image"]
                    except Exception as e:
                        print(f"Error processing API annotated image: {e}")
                
                # Extract predictions
                if "predictions" in first_result:
                    pred_data = first_result["predictions"]
                    if isinstance(pred_data, dict) and "predictions" in pred_data:
                        raw_predictions = pred_data["predictions"]
            
            # Create our own annotated image if none from API
            if not annotated_image_base64 and raw_predictions:
                original_image = cv2.imread(temp_file_path)
                if original_image is not None:
                    annotated_image = draw_boxes(original_image.copy(), raw_predictions)
                    img_path = os.path.join(ANNOTATED_DIR, f"{result_id}.jpg")
                    cv2.imwrite(img_path, annotated_image)
                    _, buffer = cv2.imencode('.jpg', annotated_image)
                    annotated_image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Process predictions into structured format
            predictions = process_predictions(raw_predictions)
            
            # Calculate processing time
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Create result object
            analysis_result = AnalysisResult(
                result_id=result_id,
                filename=image.filename,
                created_at=datetime.utcnow(),
                user_id=user_id,
                metadata=parsed_metadata if parsed_metadata else None,
                predictions=[Prediction(**p) for p in predictions],
                prediction_count=len(predictions),
                model_version=config.WORKFLOW_ID,
                processing_time_ms=processing_time_ms,
                image_url=f"/api/v1/results/{result_id}/image",
                status=StatusEnum.COMPLETED
            )
            
            # Save metadata
            save_result_metadata(result_id, {
                "result_id": result_id,
                "filename": image.filename,
                "created_at": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "metadata": parsed_metadata,
                "predictions": predictions,
                "prediction_count": len(predictions),
                "model_version": config.WORKFLOW_ID,
                "processing_time_ms": processing_time_ms,
                "status": "completed",
                "raw_result": result
            })
            
            return AnalysisResponse(
                success=True,
                result=analysis_result,
                message="Image analyzed successfully"
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


@app.get("/api/v1/results", response_model=ResultsListResponse)
async def list_results(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    List analysis results with optional filtering and pagination
    
    - **user_id**: Filter results by user ID
    - **limit**: Maximum number of results to return (1-100)
    - **offset**: Number of results to skip
    """
    try:
        all_results = []
        
        # Load all result metadata files
        for filename in os.listdir(OUTPUT_DIR):
            if filename.endswith('.json'):
                json_path = os.path.join(OUTPUT_DIR, filename)
                try:
                    with open(json_path, 'r') as f:
                        data = json.load(f)
                    
                    # Handle old format (array with single object)
                    if isinstance(data, list) and len(data) > 0:
                        data = data[0]
                        # Old format doesn't have these fields
                        prediction_count = data.get('count_objects', 0)
                        result_id = filename.replace('.json', '')
                        file_timestamp = os.path.getmtime(json_path)
                        created_at = datetime.fromtimestamp(file_timestamp)
                    else:
                        # New format
                        prediction_count = data.get('prediction_count', 0)
                        result_id = data.get('result_id', filename.replace('.json', ''))
                        created_at = datetime.fromisoformat(
                            data.get('created_at', datetime.utcnow().isoformat())
                        )
                    
                    # Filter by user_id if provided
                    if user_id and data.get('user_id') != user_id:
                        continue
                    
                    all_results.append(AnalysisResultSummary(
                        result_id=result_id,
                        filename=data.get('filename', 'unknown'),
                        created_at=created_at,
                        user_id=data.get('user_id'),
                        prediction_count=prediction_count,
                        status=StatusEnum(data.get('status', 'completed'))
                    ))
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
                    continue
        
        # Sort by created_at (newest first)
        all_results.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        total_count = len(all_results)
        paginated_results = all_results[offset:offset + limit]
        has_more = (offset + limit) < total_count
        
        return ResultsListResponse(
            success=True,
            results=paginated_results,
            total_count=total_count,
            limit=limit,
            offset=offset,
            has_more=has_more
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving results: {str(e)}"
        )


# ============================================================================
# PHASE 2 ENDPOINTS
# ============================================================================

@app.post("/api/v1/analyze/url", response_model=AnalysisResponse, status_code=201)
async def analyze_image_url(request: AnalyzeImageURLRequest):
    """
    Analyze image from URL using Roboflow model
    
    - **image_url**: Valid HTTP/HTTPS URL to image
    - **user_id**: Optional user identifier
    - **metadata**: Optional additional metadata
    """
    start_time = time.time()
    result_id = str(uuid.uuid4())
    temp_file_path = None
    
    try:
        # Download image from URL
        response = requests.get(request.image_url, timeout=30)
        response.raise_for_status()
        
        # Validate content type
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail=f"URL does not point to an image. Content-Type: {content_type}"
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name
        
        # Run inference
        result = client.run_workflow(
            workspace_name=config.WORKSPACE_NAME,
            workflow_id=config.WORKFLOW_ID,
            images={"image": temp_file_path},
            use_cache=True
        )
        
        # Process results (similar to analyze_image)
        annotated_image_base64 = None
        raw_predictions = []
        
        if isinstance(result, list) and len(result) > 0:
            first_result = result[0]
            
            if isinstance(first_result, dict) and "output_image" in first_result:
                try:
                    image_data = base64.b64decode(first_result["output_image"])
                    img_path = os.path.join(ANNOTATED_DIR, f"{result_id}.jpg")
                    with open(img_path, "wb") as f:
                        f.write(image_data)
                    annotated_image_base64 = first_result["output_image"]
                except Exception as e:
                    print(f"Error processing API annotated image: {e}")
            
            if "predictions" in first_result:
                pred_data = first_result["predictions"]
                if isinstance(pred_data, dict) and "predictions" in pred_data:
                    raw_predictions = pred_data["predictions"]
        
        if not annotated_image_base64 and raw_predictions:
            original_image = cv2.imread(temp_file_path)
            if original_image is not None:
                annotated_image = draw_boxes(original_image.copy(), raw_predictions)
                img_path = os.path.join(ANNOTATED_DIR, f"{result_id}.jpg")
                cv2.imwrite(img_path, annotated_image)
                _, buffer = cv2.imencode('.jpg', annotated_image)
                annotated_image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        predictions = process_predictions(raw_predictions)
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Extract filename from URL
        filename = request.image_url.split('/')[-1].split('?')[0] or 'url_image.jpg'
        
        analysis_result = AnalysisResult(
            result_id=result_id,
            filename=filename,
            created_at=datetime.utcnow(),
            user_id=request.user_id,
            metadata=request.metadata,
            predictions=[Prediction(**p) for p in predictions],
            prediction_count=len(predictions),
            model_version=config.WORKFLOW_ID,
            processing_time_ms=processing_time_ms,
            image_url=f"/api/v1/results/{result_id}/image",
            status=StatusEnum.COMPLETED
        )
        
        # Save metadata
        save_result_metadata(result_id, {
            "result_id": result_id,
            "filename": filename,
            "source_url": request.image_url,
            "created_at": datetime.utcnow().isoformat(),
            "user_id": request.user_id,
            "metadata": request.metadata,
            "predictions": predictions,
            "prediction_count": len(predictions),
            "model_version": config.WORKFLOW_ID,
            "processing_time_ms": processing_time_ms,
            "status": "completed",
            "raw_result": result
        })
        
        return AnalysisResponse(
            success=True,
            result=analysis_result,
            message="Image from URL analyzed successfully"
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to download image from URL: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image from URL: {str(e)}"
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@app.get("/api/v1/results/{result_id}", response_model=AnalysisResponse)
async def get_result(result_id: str):
    """
    Get detailed information about a specific analysis result
    
    - **result_id**: UUID of the analysis result
    """
    try:
        # Load result metadata
        metadata = load_result_metadata(result_id)
        
        if not metadata:
            raise HTTPException(
                status_code=404,
                detail=f"Result with ID {result_id} not found"
            )
        
        # Parse predictions
        predictions = [Prediction(**p) for p in metadata.get('predictions', [])]
        
        # Create result object
        analysis_result = AnalysisResult(
            result_id=metadata.get('result_id', result_id),
            filename=metadata.get('filename', 'unknown'),
            created_at=datetime.fromisoformat(metadata.get('created_at', datetime.utcnow().isoformat())),
            user_id=metadata.get('user_id'),
            metadata=metadata.get('metadata'),
            predictions=predictions,
            prediction_count=metadata.get('prediction_count', 0),
            model_version=metadata.get('model_version'),
            processing_time_ms=metadata.get('processing_time_ms'),
            image_url=f"/api/v1/results/{result_id}/image",
            status=StatusEnum(metadata.get('status', 'completed'))
        )
        
        return AnalysisResponse(
            success=True,
            result=analysis_result,
            message="Result retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving result: {str(e)}"
        )


@app.get("/api/v1/results/{result_id}/image")
async def get_result_image(result_id: str):
    """
    Get the annotated image for a specific result
    
    - **result_id**: UUID of the analysis result
    """
    img_path = os.path.join(ANNOTATED_DIR, f"{result_id}.jpg")
    
    if not os.path.exists(img_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image for result {result_id} not found"
        )
    
    return FileResponse(
        img_path,
        media_type="image/jpeg",
        filename=f"{result_id}.jpg"
    )


@app.delete("/api/v1/results/{result_id}", response_model=DeleteResponse)
async def delete_result(result_id: str):
    """
    Delete a specific analysis result and its associated files
    
    - **result_id**: UUID of the analysis result to delete
    """
    try:
        # Check if result exists
        if not load_result_metadata(result_id):
            raise HTTPException(
                status_code=404,
                detail=f"Result with ID {result_id} not found"
            )
        
        # Delete files
        success = delete_result_files(result_id)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete result files"
            )
        
        return DeleteResponse(
            success=True,
            message=f"Result {result_id} deleted successfully",
            deleted_result_id=result_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting result: {str(e)}"
        )


# ============================================================================
# LEGACY ENDPOINTS (for backward compatibility)
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - redirects to health check"""
    return {
        "message": "Roboflow Inference Demo API",
        "version": API_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


# Keep old endpoints for backward compatibility (deprecated)
@app.post("/analyze")
async def analyze_image_legacy(image: UploadFile = File(...)):
    """DEPRECATED: Use /api/v1/analyze instead"""
    # Call the new endpoint
    response = await analyze_image(image=image)
    # Convert to old format for compatibility
    result = response.result
    return {
        "success": True,
        "filename": result.filename,
        "timestamp": result.created_at.isoformat(),
        "predictions": [
            {
                "id": p.id,
                "class": p.class_name,
                "confidence": p.confidence,
                **p.bounding_box.dict()
            } for p in result.predictions
        ],
        "prediction_count": result.prediction_count,
        "result_id": result.result_id
    }


@app.get("/history")
async def get_analysis_history_legacy():
    """DEPRECATED: Use /api/v1/results instead"""
    response = await list_results()
    return {
        "history": [
            {
                "result_id": r.result_id,
                "filename": r.filename,
                "timestamp": r.created_at.timestamp(),
                "prediction_count": r.prediction_count
            } for r in response.results
        ]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
