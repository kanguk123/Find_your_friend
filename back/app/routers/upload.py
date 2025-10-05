"""
File upload and dataset processing endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
import logging
from typing import Dict, Any

from app.database import get_db
from app.schemas.response import APIResponse
from app.schemas.model import UploadDatasetResponse
from app.utils.preprocessing import (
    handle_missing_values, remove_outliers,
    DataPreprocessor
)
from app.config import settings
from app.ml.model_wrapper import get_model
from app.exceptions import AIServiceException

router = APIRouter(prefix="/upload", tags=["Data Upload"])
logger = logging.getLogger(__name__)


async def process_csv_file(file: UploadFile) -> pd.DataFrame:
    """
    Read and parse CSV file

    Args:
        file: Uploaded CSV file

    Returns:
        Pandas DataFrame
    """
    contents = await file.read()
    df = pd.DataFrame(pd.read_csv(io.StringIO(contents.decode('utf-8'))))
    return df


@router.post("/csv", response_model=APIResponse[UploadDatasetResponse])
async def upload_csv_dataset(
    file: UploadFile = File(..., description="CSV file with planet features"),
    auto_retrain: bool = False,
    new_model_version: str = None,
    db: Session = Depends(get_db)
):
    """
    Upload CSV dataset for processing and optional retraining

    Steps:
    1. Parse CSV file
    2. Preprocess data (handle missing values, remove outliers, standardize)
    3. Optionally retrain model with new data
    4. Return processing summary and metrics

    CSV should contain planet features as columns
    """
    # Read CSV
    df = await process_csv_file(file)
    total_records = len(df)

    # Handle missing values
    df_clean, missing_info = handle_missing_values(df, strategy='median')

    # Remove outliers
    df_final, outliers_removed = remove_outliers(df_clean, n_std=3.0)

    # Preprocessing
    preprocessor = DataPreprocessor()
    df_processed = preprocessor.fit_transform(df_final)

    valid_records = len(df_processed)
    invalid_records = total_records - valid_records

    preprocessing_summary = {
        "total_records": total_records,
        "valid_records": valid_records,
        "invalid_records": invalid_records,
        "outliers_removed": outliers_removed,
        "missing_values_filled": sum(missing_info.values()),
        "features_count": len(df_processed.columns)
    }

    # Optional: Retrain model
    retrained_version = None
    metrics = None

    if auto_retrain and new_model_version:
        # TODO: Implement actual retraining when AI service is ready
        # For now, just simulate
        from app.schemas.model import TrainRequest, ModelConfig
        from app.services.model_service import ModelService

        train_req = TrainRequest(
            version=new_model_version,
            config=ModelConfig(),
            description=f"Trained on uploaded dataset ({valid_records} records)"
        )

        model = ModelService.train_model(db, train_req)
        retrained_version = model.version
        metrics = ModelService.get_metrics(db, model.version)

    response_data = UploadDatasetResponse(
        success=True,
        message="Dataset uploaded and processed successfully",
        records_processed=total_records,
        records_valid=valid_records,
        records_invalid=invalid_records,
        preprocessing_summary=preprocessing_summary,
        new_model_version=retrained_version,
        metrics=metrics
    )

    return APIResponse(
        success=True,
        message="Dataset processed successfully",
        data=response_data
    )


@router.post("/identify-planets")
async def identify_planets_from_csv(
    file: UploadFile = File(..., description="CSV file with planet features for identification")
):
    """
    Upload a CSV file containing planet data and get AI predictions for each row

    Steps:
    1. Validate that the uploaded file is a CSV
    2. Read the CSV file
    3. Process each row through the AI model
    4. Append prediction columns: 'ai_probability', 'ai_prediction', 'ai_confidence'
    5. Return the modified CSV file for download

    Error Handling:
    - Returns 400 if file is not CSV
    - Skips rows with invalid/missing data and logs them
    - Continues processing if AI model fails for specific rows
    - Adds error information in prediction columns for failed rows

    Returns:
        StreamingResponse: Modified CSV file with predictions
    """
    # ============================================
    # 1. VALIDATE FILE TYPE
    # ============================================
    logger.info(f"[UPLOAD] Received file: {file.filename}")

    if not file.filename.endswith('.csv'):
        logger.error(f"[ERROR] Invalid file type: {file.filename}. Expected CSV.")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Expected CSV file, got: {file.filename}"
        )

    logger.debug(f"[VALIDATION] File type validated: {file.filename}")

    # ============================================
    # 2. READ CSV FILE
    # ============================================
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        logger.info(f"[CSV READ] Successfully read CSV with {len(df)} rows and {len(df.columns)} columns")
        logger.debug(f"[CSV COLUMNS] {list(df.columns)}")
    except Exception as e:
        logger.error(f"[ERROR] Failed to read CSV: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse CSV file: {str(e)}"
        )

    if len(df) == 0:
        logger.warning("[WARNING] CSV file is empty")
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty"
        )

    # ============================================
    # 3. LOAD AI MODEL
    # ============================================
    try:
        model = get_model()
        logger.info(f"[MODEL] AI model loaded successfully: {model.model_version}")
    except FileNotFoundError as e:
        logger.error(f"[ERROR] Model file not found: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="AI model not available. Please ensure the model is trained and saved."
        )
    except Exception as e:
        logger.error(f"[ERROR] Failed to load AI model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load AI model: {str(e)}"
        )

    # ============================================
    # 4. PROCESS EACH ROW WITH AI MODEL
    # ============================================
    predictions = []
    confidence_levels = []
    probabilities = []

    successful_predictions = 0
    failed_predictions = 0
    skipped_rows = 0

    logger.info(f"[PROCESSING] Starting AI prediction for {len(df)} rows...")

    for idx, row in df.iterrows():
        row_num = idx + 1  # 1-indexed for user-friendly logging

        try:
            # Convert row to features dictionary
            features = row.to_dict()

            # Check if row has sufficient data (at least some non-null values)
            non_null_count = row.notna().sum()
            if non_null_count == 0:
                logger.warning(f"[ROW {row_num}] Skipped - all values are null")
                predictions.append("SKIPPED")
                probabilities.append(None)
                confidence_levels.append("N/A")
                skipped_rows += 1
                continue

            # Run AI prediction
            logger.debug(f"[ROW {row_num}] Running AI prediction...")
            result = model.predict(
                features=features,
                threshold=0.5,
                include_contributions=False
            )

            # Extract prediction results
            probability = result["probability"]
            prediction = result["prediction"]
            confidence = result["confidence"]

            predictions.append(prediction)
            probabilities.append(probability)
            confidence_levels.append(confidence)

            successful_predictions += 1
            logger.debug(
                f"[ROW {row_num}] ✓ Prediction: {prediction}, "
                f"Probability: {probability:.4f}, Confidence: {confidence}"
            )

        except Exception as e:
            # Log error but continue processing
            logger.error(f"[ROW {row_num}] ✗ Prediction failed: {str(e)}")
            predictions.append("ERROR")
            probabilities.append(None)
            confidence_levels.append("N/A")
            failed_predictions += 1

    # ============================================
    # 5. APPEND PREDICTIONS TO DATAFRAME
    # ============================================
    df['ai_prediction'] = predictions
    df['ai_probability'] = probabilities
    df['ai_confidence'] = confidence_levels

    logger.info(
        f"[SUMMARY] Processing complete: "
        f"{successful_predictions} successful, "
        f"{failed_predictions} failed, "
        f"{skipped_rows} skipped"
    )

    # ============================================
    # 6. GENERATE CSV FOR DOWNLOAD
    # ============================================
    try:
        # Convert DataFrame to CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        # Create streaming response
        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=planet_predictions_{file.filename}"
            }
        )

        logger.info(f"[DOWNLOAD] CSV file generated successfully: planet_predictions_{file.filename}")
        logger.info(f"[COMPLETE] Total rows: {len(df)}, Columns: {len(df.columns)}")

        return response

    except Exception as e:
        logger.error(f"[ERROR] Failed to generate CSV: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate CSV file: {str(e)}"
        )
