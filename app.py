from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

app = FastAPI(title="Roboflow Inference Demo API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # Vite dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Roboflow client
client = InferenceHTTPClient(
    api_url=config.API_URL,
    api_key=config.API_KEY
)

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
        (text_width, text_height), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        label_pt = (pt1[0], pt1[1] - 10 if pt1[1] - 10 > text_height else pt1[1] + text_height + 2)
        cv2.rectangle(image, (label_pt[0], label_pt[1] - text_height - baseline), (label_pt[0] + text_width, label_pt[1] + baseline), (0, 255, 0), cv2.FILLED)
        cv2.putText(image, label_text, (label_pt[0], label_pt[1]), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    return image

@app.get("/")
async def root():
    return {"message": "Roboflow Inference Demo API", "status": "running"}

@app.post("/analyze")
async def analyze_image(image: UploadFile = File(...)):
    """Analyze uploaded image using Roboflow model"""
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as temp_file:
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
            
            # Prepare output directories
            output_dir = os.path.join("data", "output_json")
            annotated_dir = os.path.join("data", "annotated_images")
            os.makedirs(output_dir, exist_ok=True)
            os.makedirs(annotated_dir, exist_ok=True)
            
            # Create unique filenames
            base_name = os.path.splitext(image.filename)[0]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_json_name = f"{base_name}_{timestamp}.json"
            output_json_path = os.path.join(output_dir, output_json_name)
            annotated_img_name = f"{base_name}_{timestamp}.jpg"
            annotated_img_path = os.path.join(annotated_dir, annotated_img_name)
            
            # Save full result to JSON
            with open(output_json_path, "w") as f:
                json.dump(result, f, indent=2)
            
            # Process annotated image
            annotated_image_base64 = None
            predictions = []
            
            # Check for pre-annotated image from API
            if isinstance(result, list) and len(result) > 0:
                first_result = result[0]
                if isinstance(first_result, dict) and "output_image" in first_result:
                    # Save the API-provided annotated image
                    try:
                        image_data = base64.b64decode(first_result["output_image"])
                        with open(annotated_img_path, "wb") as f:
                            f.write(image_data)
                        annotated_image_base64 = first_result["output_image"]
                    except Exception as e:
                        print(f"Error processing API annotated image: {e}")
                
                # Extract predictions
                if "predictions" in first_result:
                    pred_data = first_result["predictions"]
                    if isinstance(pred_data, dict) and "predictions" in pred_data:
                        predictions = pred_data["predictions"]
            
            # Create our own annotated image if none from API
            if not annotated_image_base64 and predictions:
                # Load original image
                original_image = cv2.imread(temp_file_path)
                if original_image is not None:
                    # Draw boxes on image
                    annotated_image = draw_boxes(original_image.copy(), predictions)
                    
                    # Save annotated image
                    cv2.imwrite(annotated_img_path, annotated_image)
                    
                    # Convert to base64 for response
                    _, buffer = cv2.imencode('.jpg', annotated_image)
                    annotated_image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Prepare response
            response_data = {
                "success": True,
                "filename": image.filename,
                "timestamp": timestamp,
                "predictions": predictions,
                "prediction_count": len(predictions) if predictions else 0,
                "annotated_image": annotated_image_base64,
                "json_output_path": output_json_path,
                "annotated_image_path": annotated_img_path,
                "raw_result": result
            }
            
            return JSONResponse(content=response_data)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/history")
async def get_analysis_history():
    """Get list of previous analyses"""
    try:
        output_dir = os.path.join("data", "output_json")
        annotated_dir = os.path.join("data", "annotated_images")
        
        if not os.path.exists(output_dir):
            return {"history": []}
        
        history = []
        for filename in os.listdir(output_dir):
            if filename.endswith('.json'):
                json_path = os.path.join(output_dir, filename)
                with open(json_path, 'r') as f:
                    data = json.load(f)
                
                # Try to find corresponding annotated image
                base_name = os.path.splitext(filename)[0]
                annotated_path = os.path.join(annotated_dir, f"{base_name}.jpg")
                has_annotated_image = os.path.exists(annotated_path)
                
                history.append({
                    "filename": filename,
                    "json_path": json_path,
                    "annotated_image_path": annotated_path if has_annotated_image else None,
                    "has_annotated_image": has_annotated_image,
                    "timestamp": os.path.getmtime(json_path)
                })
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return {"history": history}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
