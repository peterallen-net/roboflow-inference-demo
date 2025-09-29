# Roboflow Inference Demo

A simple Python CLI tool to run Roboflow model inference on a local image, print predictions, and optionally save an annotated image with bounding boxes.

## Setup

1. **Clone or download this repo.**
2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Edit `config.py` and set:
- `API_KEY` to your Roboflow API key
- `WORKSPACE_NAME` to your workspace name
- `WORKFLOW_ID` to your workflow/model ID

## Usage

Run the script with:
```bash
python main.py --image path_to_image.jpg
```

- Predictions will be printed in the console.
- If predictions are found, an annotated image will be saved as `annotated_path_to_image.jpg` in the current directory.

## Notes
- No database or web frontend is included.
- This is a local command-line tool only.
