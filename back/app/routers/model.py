"""
Model management endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.response import APIResponse
from app.schemas.model import (
    ModelVersionDetail, ModelMetrics, ModelConfig,
    TrainRequest, RetrainRequest,
    FeatureImportance, FeatureCorrelation
)
from app.services.model_service import ModelService

router = APIRouter(prefix="/model", tags=["Model Management"])


@router.post("/train", response_model=APIResponse[ModelVersionDetail])
async def train_model(
    request: TrainRequest,
    db: Session = Depends(get_db)
):
    """
    Train a new model with specified configuration

    Creates a new model version with given hyperparameters
    """
    model = ModelService.train_model(db, request)
    detail = ModelService.to_detail(model)

    return APIResponse(
        success=True,
        message=f"Model {model.version} trained successfully",
        data=detail
    )


@router.post("/retrain", response_model=APIResponse[ModelVersionDetail])
async def retrain_model(
    request: RetrainRequest,
    db: Session = Depends(get_db)
):
    """
    Retrain from existing model

    Copies base model configuration and retrains with potentially new data
    """
    model = ModelService.retrain_model(db, request)
    detail = ModelService.to_detail(model)

    return APIResponse(
        success=True,
        message=f"Model {model.version} retrained from {request.base_version}",
        data=detail
    )


@router.get("/metrics/{model_version}", response_model=APIResponse[ModelMetrics])
async def get_model_metrics(
    model_version: str,
    db: Session = Depends(get_db)
):
    """
    Get performance metrics for a specific model version

    Returns F1 score, precision, recall, accuracy, and AUC-ROC
    """
    metrics = ModelService.get_metrics(db, model_version)

    return APIResponse(
        success=True,
        message=f"Retrieved metrics for {model_version}",
        data=metrics
    )


@router.get("/features/importance/{model_version}", response_model=APIResponse[List[FeatureImportance]])
async def get_feature_importance(
    model_version: str,
    db: Session = Depends(get_db)
):
    """
    Get feature importance for a model

    Shows which features contribute most to predictions
    """
    importance = ModelService.get_feature_importance(db, model_version)

    return APIResponse(
        success=True,
        message=f"Retrieved feature importance for {model_version}",
        data=importance
    )


@router.get("/features/correlation", response_model=APIResponse[List[FeatureCorrelation]])
async def get_feature_correlation(
    db: Session = Depends(get_db)
):
    """
    Get feature correlation matrix

    Shows relationships between different features
    """
    correlations = ModelService.get_feature_correlation(db)

    return APIResponse(
        success=True,
        message="Retrieved feature correlations",
        data=correlations
    )


@router.get("/config/{model_version}", response_model=APIResponse[ModelConfig])
async def get_model_config(
    model_version: str,
    db: Session = Depends(get_db)
):
    """
    Get model configuration (hyperparameters)
    """
    config = ModelService.get_model_config(db, model_version)

    return APIResponse(
        success=True,
        message=f"Retrieved configuration for {model_version}",
        data=config
    )


@router.put("/config/{model_version}", response_model=APIResponse[ModelConfig])
async def update_model_config(
    model_version: str,
    config: ModelConfig,
    db: Session = Depends(get_db)
):
    """
    Update model configuration

    Modifies hyperparameters for a model version
    """
    updated_model = ModelService.update_model_config(db, model_version, config)

    return APIResponse(
        success=True,
        message=f"Configuration updated for {model_version}",
        data=ModelConfig(**updated_model.config)
    )


@router.get("/versions", response_model=APIResponse[List[ModelVersionDetail]])
async def get_all_model_versions(
    db: Session = Depends(get_db)
):
    """
    Get all model versions

    Returns list of all trained models with their metrics
    """
    models = ModelService.get_all_models(db)
    details = [ModelService.to_detail(m) for m in models]

    return APIResponse(
        success=True,
        message=f"Retrieved {len(details)} model versions",
        data=details
    )
