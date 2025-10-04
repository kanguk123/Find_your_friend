"""
File upload and dataset processing endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
import io
from typing import Dict, Any

from app.database import get_db
from app.schemas.response import APIResponse
from app.schemas.model import UploadDatasetResponse
from app.utils.preprocessing import (
    handle_missing_values, remove_outliers,
    DataPreprocessor
)
from app.config import settings

router = APIRouter(prefix="/upload", tags=["Data Upload"])


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
