
import argparse
import cv2
from inference_sdk import InferenceHTTPClient
import config
import os
import json
import base64
from datetime import datetime

# Parse command-line arguments
def parse_args():
    parser = argparse.ArgumentParser(description="Run Roboflow inference on a local image.")
    parser.add_argument("--image", required=True, help="Path to the image file.")
    return parser.parse_args()

def draw_boxes(image_path, predictions, output_path):
    image = cv2.imread(image_path)
    print(f"[DEBUG] Loaded image from {image_path}: type={type(image)}, shape={getattr(image, 'shape', None)}")
    if image is None:
        print(f"[ERROR] Failed to load image: {image_path}")
        return
    if not predictions or not isinstance(predictions, list):
        print("[ERROR] No predictions to draw.")
        return
    print(f"[DEBUG] Drawing {len(predictions)} predictions on image.")
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
    success = cv2.imwrite(output_path, image)
    print(f"[DEBUG] Attempted to save annotated image to {output_path}, success={success}")
    if success:
        print(f"Annotated image saved to {output_path}")
    else:
        print(f"[ERROR] Failed to save annotated image to {output_path}")

def main():
    args = parse_args()
    client = InferenceHTTPClient(
        api_url=config.API_URL,
        api_key=config.API_KEY
    )
    result = client.run_workflow(
        workspace_name=config.WORKSPACE_NAME,
        workflow_id=config.WORKFLOW_ID,
        images={"image": args.image},
        use_cache=True
    )
    
    print("Predictions (JSON):")
    print(json.dumps(result, indent=2))

    # Prepare output directories
    output_dir = os.path.join("data", "output_json")
    annotated_dir = os.path.join("data", "annotated_images")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(annotated_dir, exist_ok=True)

    # Prepare unique filenames using timestamp
    base_name = os.path.splitext(os.path.basename(args.image))[0]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_json_name = f"{base_name}_{timestamp}.json"
    output_json_path = os.path.join(output_dir, output_json_name)
    annotated_img_name = f"{base_name}_{timestamp}.jpg"
    annotated_img_path = os.path.join(annotated_dir, annotated_img_name)

    # Save full result to JSON
    with open(output_json_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"JSON output saved to {output_json_path}")

    # Extract and save annotated image from API response
    annotated_image_saved = False
    
    # Handle the new API response structure
    if isinstance(result, list) and len(result) > 0:
        first_result = result[0]
        if isinstance(first_result, dict) and "output_image" in first_result:
            # The API provides a base64-encoded annotated image
            try:
                # Decode base64 image data
                image_data = base64.b64decode(first_result["output_image"])
                
                # Save the decoded image
                with open(annotated_img_path, "wb") as f:
                    f.write(image_data)
                
                print(f"Annotated image saved to {annotated_img_path}")
                annotated_image_saved = True
                
            except Exception as e:
                print(f"[ERROR] Failed to decode and save annotated image: {e}")
    
    # Fallback: try to create our own annotations if no pre-annotated image was available
    if not annotated_image_saved:
        # Extract predictions for manual annotation
        predictions = []
        if isinstance(result, list) and len(result) > 0:
            first_result = result[0]
            if isinstance(first_result, dict) and "predictions" in first_result:
                pred_data = first_result["predictions"]
                if isinstance(pred_data, dict) and "predictions" in pred_data:
                    predictions = pred_data["predictions"]
        
        if isinstance(predictions, list) and len(predictions) > 0:
            valid_preds = [p for p in predictions if all(k in p for k in ("class", "confidence", "x", "y", "width", "height"))]
            print(f"[DEBUG] Number of valid predictions for manual annotation: {len(valid_preds)}")
            if valid_preds:
                draw_boxes(args.image, valid_preds, annotated_img_path)
            else:
                print("No valid predictions to annotate manually (all predictions missing required keys).")
        else:
            print("No predictions found for manual annotation.")

if __name__ == "__main__":
    main()
