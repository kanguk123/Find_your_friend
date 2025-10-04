"""
Model management schemas
"""
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ModelMetrics(BaseModel):
    """Model performance metrics"""
    f1_score: float = Field(..., ge=0.0, le=1.0)
    precision: float = Field(..., ge=0.0, le=1.0)
    recall: float = Field(..., ge=0.0, le=1.0)
    accuracy: Optional[float] = Field(None, ge=0.0, le=1.0)
    auc_roc: Optional[float] = Field(None, ge=0.0, le=1.0)


class ModelConfig(BaseModel):
    """Model hyperparameters configuration"""
    model_type: str = Field(default="RandomForest", description="Type of ML model")
    hyperparameters: Dict[str, Any] = Field(
        default_factory=lambda: {
            "n_estimators": 100,
            "max_depth": 10,
            "min_samples_split": 2,
            "min_samples_leaf": 1,
            "random_state": 42
        },
        description="Model hyperparameters"
    )

    model_config = {"protected_namespaces": ()}


class ModelVersionBase(BaseModel):
    """Base model version schema"""
    version: str = Field(..., pattern=r"^v\d+\.\d+$", description="Model version (e.g., v0.1)")
    description: Optional[str] = None


class ModelVersionCreate(ModelVersionBase):
    """Schema for creating a new model version"""
    config: ModelConfig
    parent_version: Optional[str] = None


class ModelVersionDetail(ModelVersionBase):
    """Detailed model version information"""
    id: int
    config: ModelConfig
    metrics: Optional[ModelMetrics] = None
    parent_version: Optional[str] = None
    is_active: bool
    trained_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"protected_namespaces": (), "from_attributes": True}


class TrainRequest(BaseModel):
    """Request schema for training a new model"""
    version: str = Field(..., pattern=r"^v\d+\.\d+$")
    config: ModelConfig
    description: Optional[str] = None


class RetrainRequest(BaseModel):
    """Request schema for retraining from existing model"""
    base_version: str = Field(..., description="Base model version to copy from")
    new_version: str = Field(..., pattern=r"^v\d+\.\d+$", description="New version identifier")
    config: Optional[ModelConfig] = None
    description: Optional[str] = None


class FeatureImportance(BaseModel):
    """Feature importance for a model"""
    feature_name: str
    importance: float
    rank: int


class FeatureCorrelation(BaseModel):
    """Feature correlation information"""
    feature1: str
    feature2: str
    correlation: float
    significance: str  # "high", "medium", "low"


class UploadDatasetResponse(BaseModel):
    """Response after uploading and preprocessing dataset"""
    success: bool
    message: str
    records_processed: int
    records_valid: int
    records_invalid: int
    preprocessing_summary: Dict[str, Any]
    new_model_version: Optional[str] = None
    metrics: Optional[ModelMetrics] = None


class RewardResponse(BaseModel):
    """Response for reward system"""
    planet_id: int
    planet_name: str
    probability: float
    reward_granted: bool
    points_earned: int
    message: str
    upgrade_level: Optional[int] = None
