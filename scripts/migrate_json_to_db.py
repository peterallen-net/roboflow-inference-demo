#!/usr/bin/env python3
"""
Data Migration Script: JSON to PostgreSQL
Migrates existing JSON analysis results to the PostgreSQL database
"""
import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from database import SessionLocal
from db_models import StatusEnum
import crud


def parse_timestamp(timestamp_str):
    """Parse various timestamp formats"""
    formats = [
        "%Y%m%d_%H%M%S",  # 20250929_123130
        "%Y-%m-%dT%H:%M:%S.%f",  # ISO format with microseconds
        "%Y-%m-%dT%H:%M:%S",  # ISO format without microseconds
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(timestamp_str, fmt)
        except ValueError:
            continue
    
    # If all formats fail, return current time
    print(f"Warning: Could not parse timestamp '{timestamp_str}', using current time")
    return datetime.utcnow()


def extract_timestamp_from_filename(filename):
    """Extract timestamp from filename like 'image_20250929_123130.json'"""
    parts = filename.replace('.json', '').split('_')
    
    # Look for date pattern (YYYYMMDD_HHMMSS)
    for i, part in enumerate(parts):
        if len(part) == 8 and part.isdigit():
            if i + 1 < len(parts) and len(parts[i + 1]) == 6 and parts[i + 1].isdigit():
                timestamp_str = f"{part}_{parts[i + 1]}"
                return parse_timestamp(timestamp_str)
    
    return None


def migrate_json_file(json_path, db):
    """Migrate a single JSON file to database"""
    try:
        with open(json_path, 'r') as f:
            raw_data = json.load(f)
        
        # Handle both array format and object format
        if isinstance(raw_data, list) and len(raw_data) > 0:
            data = raw_data[0]
        else:
            data = raw_data
        
        # Extract filename from the JSON path since these are API results
        filename = os.path.basename(json_path).replace('.json', '') + '.jpg'
        
        # Extract or derive timestamp
        created_at = None
        if 'timestamp' in data:
            if isinstance(data['timestamp'], (int, float)):
                created_at = datetime.fromtimestamp(data['timestamp'])
            elif isinstance(data['timestamp'], str):
                created_at = parse_timestamp(data['timestamp'])
        
        if not created_at:
            # Try to extract from filename
            created_at = extract_timestamp_from_filename(os.path.basename(json_path))
        
        if not created_at:
            # Use file modification time as last resort
            created_at = datetime.fromtimestamp(os.path.getmtime(json_path))
        
        # Extract predictions - handle nested structure
        predictions = []
        if 'predictions' in data:
            pred_data = data['predictions']
            if isinstance(pred_data, dict) and 'predictions' in pred_data:
                predictions = pred_data['predictions']
            elif isinstance(pred_data, list):
                predictions = pred_data
        
        # Convert predictions to expected format
        predictions_data = []
        for pred in predictions:
            predictions_data.append({
                'class_name': pred.get('class', pred.get('class_name', 'unknown')),
                'confidence': pred.get('confidence', 0.0),
                'bounding_box': {
                    'x': pred.get('x', 0),
                    'y': pred.get('y', 0),
                    'width': pred.get('width', 0),
                    'height': pred.get('height', 0)
                }
            })
        
        # Find corresponding annotated image
        image_path = None
        base_name = os.path.splitext(os.path.basename(json_path))[0]
        
        # Check for annotated image in data/annotated_images/
        annotated_dir = os.path.join(os.path.dirname(os.path.dirname(json_path)), 'annotated_images')
        possible_image_paths = [
            os.path.join(annotated_dir, f"{base_name}.jpg"),
            os.path.join(annotated_dir, f"{base_name}.jpeg"),
            os.path.join(annotated_dir, f"{base_name}.png"),
        ]
        
        for path in possible_image_paths:
            if os.path.exists(path):
                image_path = path
                break
        
        # Extract metadata
        metadata = {}
        if 'metadata' in data:
            metadata = data['metadata']
        
        # Create analysis result in database
        db_result = crud.create_analysis_result(
            db=db,
            filename=filename,
            predictions_data=predictions_data,
            user_id=data.get('user_id'),
            metadata=metadata if metadata else None,
            model_version=data.get('model_version'),
            processing_time_ms=data.get('processing_time_ms'),
            image_path=image_path,
            source_url=data.get('source_url'),
            status=StatusEnum.COMPLETED
        )
        
        # Override created_at timestamp
        db_result.created_at = created_at
        db.commit()
        
        return True, db_result.id, len(predictions_data)
        
    except Exception as e:
        print(f"Error migrating {json_path}: {str(e)}")
        return False, None, 0


def main():
    """Main migration function"""
    print("=" * 60)
    print("JSON to PostgreSQL Migration Script")
    print("=" * 60)
    print()
    
    # Path to JSON files
    json_dir = os.path.join('data', 'output_json')
    
    if not os.path.exists(json_dir):
        print(f"Error: Directory '{json_dir}' not found")
        return 1
    
    # Get all JSON files
    json_files = [f for f in os.listdir(json_dir) if f.endswith('.json')]
    
    if not json_files:
        print(f"No JSON files found in '{json_dir}'")
        return 0
    
    print(f"Found {len(json_files)} JSON files to migrate")
    print()
    
    # Confirm migration
    response = input("Proceed with migration? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("Migration cancelled")
        return 0
    
    print()
    print("Starting migration...")
    print("-" * 60)
    
    # Create database session
    db = SessionLocal()
    
    try:
        migrated = 0
        failed = 0
        total_predictions = 0
        
        for i, json_file in enumerate(json_files, 1):
            json_path = os.path.join(json_dir, json_file)
            
            print(f"[{i}/{len(json_files)}] Migrating {json_file}...", end=' ')
            
            success, result_id, pred_count = migrate_json_file(json_path, db)
            
            if success:
                migrated += 1
                total_predictions += pred_count
                print(f"✓ (ID: {result_id}, {pred_count} predictions)")
            else:
                failed += 1
                print("✗ FAILED")
        
        print("-" * 60)
        print()
        print("Migration Summary:")
        print(f"  Total files:        {len(json_files)}")
        print(f"  Successfully migrated: {migrated}")
        print(f"  Failed:             {failed}")
        print(f"  Total predictions:  {total_predictions}")
        print()
        
        if migrated > 0:
            print("✓ Migration completed successfully!")
            print()
            print("You can verify the migrated data with:")
            print("  curl http://localhost:8000/api/v1/results | jq")
        
        return 0 if failed == 0 else 1
        
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
