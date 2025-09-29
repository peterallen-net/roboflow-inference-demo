import argparse
import cv2
from inference_sdk import InferenceHTTPClient
import config
import os

# Parse command-line arguments
def parse_args():
    parser = argparse.ArgumentParser(description="Run Roboflow inference on a local image.")
    parser.add_argument("--image", required=True, help="Path to the image file.")
    return parser.parse_args()

def draw_boxes(image_path, predictions, output_path):
    image = cv2.imread(image_path)
    for pred in predictions:
        x, y, w, h = pred["x"], pred["y"], pred["width"], pred["height"]
        label = pred["class"]
        conf = pred["confidence"]
        # Draw rectangle
        pt1 = (int(x - w/2), int(y - h/2))
        pt2 = (int(x + w/2), int(y + h/2))
        cv2.rectangle(image, pt1, pt2, (0, 255, 0), 2)
        # Put label
        cv2.putText(image, f"{label} {conf:.2f}", pt1, cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
    cv2.imwrite(output_path, image)
    print(f"Annotated image saved to {output_path}")

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
    import json
    predictions = []
    if isinstance(result, dict) and "predictions" in result:
        predictions = result["predictions"] if isinstance(result["predictions"], list) else result["predictions"].get("predictions", [])
    elif isinstance(result, list):
        predictions = result
    print("Predictions (JSON):")
    print(json.dumps(predictions, indent=2))
    # Save predictions to JSON file in data/output folder named after input image
    output_json_name = os.path.splitext(os.path.basename(args.image))[0] + ".json"
    output_json_path = os.path.join("data", "output", output_json_name)
    with open(output_json_path, "w") as f:
        json.dump(predictions, f, indent=2)
    # Optionally draw boxes
    valid_preds = [p for p in predictions if all(k in p for k in ("class", "confidence", "x", "y", "width", "height"))]
    if valid_preds:
        output_path = "annotated_" + args.image.split("/")[-1]
        draw_boxes(args.image, valid_preds, output_path)

if __name__ == "__main__":
    main()
