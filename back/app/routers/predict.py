"""
Prediction endpoints - AI model predictions
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.response import APIResponse
from app.schemas.planet import (
    PredictionResponse, SimplePredictionResponse,
    BatchPredictionRequest, BatchPredictionResponse
)
from app.services.prediction_service import PredictionService
from app.config import settings

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.get("/{planet_id}", response_model=APIResponse[PredictionResponse])
async def predict_planet(
    planet_id: int,
    db: Session = Depends(get_db)
):
    """
    Predict exoplanet probability with detailed analysis

    For researchers: Includes feature contributions and correlations
    """
    prediction = PredictionService.predict_planet(
        db,
        planet_id,
        include_details=True
    )

    return APIResponse(
        success=True,
        message="Prediction completed successfully",
        data=prediction
    )


@router.get("/simple/{planet_id}", response_model=APIResponse[SimplePredictionResponse])
async def predict_planet_simple(
    planet_id: int,
    db: Session = Depends(get_db)
):
    """
    Simple prediction for beginners

    Returns only essential information: probability and confidence level
    """
    prediction = PredictionService.predict_planet_simple(db, planet_id)

    return APIResponse(
        success=True,
        message="Prediction completed",
        data=prediction
    )


@router.post("/batch", response_model=APIResponse[BatchPredictionResponse])
async def batch_predict(
    request: BatchPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Predict multiple planets at once

    Useful for bulk analysis (max 100 planets per request)
    """
    predictions = PredictionService.batch_predict(db, request)

    response_data = BatchPredictionResponse(
        predictions=predictions,
        total_processed=len(predictions),
        model_version=settings.DEFAULT_MODEL_VERSION
    )

    return APIResponse(
        success=True,
        message=f"Processed {len(predictions)} predictions",
        data=response_data
    )
