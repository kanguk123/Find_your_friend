"""
Model service - AI model management logic
"""
import random
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.model_version import ModelVersion
from app.schemas.model import (
    ModelVersionCreate, ModelVersionDetail, ModelMetrics,
    ModelConfig, TrainRequest, RetrainRequest,
    FeatureImportance, FeatureCorrelation
)
from app.config import settings
from app.exceptions import NotFoundException, AlreadyExistsException


class ModelService:
    """Service for AI model management"""

    @staticmethod
    def get_model_by_version(db: Session, version: str) -> ModelVersion:
        """
        Get model by version

        Args:
            db: Database session
            version: Model version

        Returns:
            ModelVersion instance

        Raises:
            NotFoundException: If model not found
        """
        model = db.query(ModelVersion).filter(ModelVersion.version == version).first()
        if not model:
            raise NotFoundException("Model version", version)
        return model

    @staticmethod
    def get_all_models(db: Session) -> List[ModelVersion]:
        """Get all model versions"""
        return db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()

    @staticmethod
    def get_active_model(db: Session) -> Optional[ModelVersion]:
        """Get currently active model"""
        return db.query(ModelVersion).filter(ModelVersion.is_active == True).first()

    @staticmethod
    def create_model(db: Session, model_data: ModelVersionCreate) -> ModelVersion:
        """
        Create a new model version

        Args:
            db: Database session
            model_data: Model creation data

        Returns:
            Created ModelVersion

        Raises:
            AlreadyExistsException: If version already exists
        """
        # Check if version exists
        existing = db.query(ModelVersion).filter(
            ModelVersion.version == model_data.version
        ).first()
        if existing:
            raise AlreadyExistsException("Model version", model_data.version)

        model = ModelVersion(
            version=model_data.version,
            description=model_data.description,
            parent_version=model_data.parent_version,
            config=model_data.config.model_dump(),
            is_active=False
        )

        db.add(model)
        db.commit()
        db.refresh(model)

        return model

    @staticmethod
    def train_model(db: Session, request: TrainRequest) -> ModelVersion:
        """
        Train a new model

        Args:
            db: Database session
            request: Training request

        Returns:
            Trained ModelVersion
        """
        # Create model version
        model_data = ModelVersionCreate(
            version=request.version,
            description=request.description,
            config=request.config
        )
        model = ModelService.create_model(db, model_data)

        # Simulate training (dummy metrics)
        # In production, this would actually train a model
        model.f1_score = random.uniform(0.80, 0.95)
        model.precision = random.uniform(0.78, 0.93)
        model.recall = random.uniform(0.82, 0.96)
        model.accuracy = random.uniform(0.80, 0.94)
        model.auc_roc = random.uniform(0.85, 0.98)
        model.trained_at = datetime.utcnow()

        db.commit()
        db.refresh(model)

        return model

    @staticmethod
    def retrain_model(db: Session, request: RetrainRequest) -> ModelVersion:
        """
        Retrain from existing model

        Args:
            db: Database session
            request: Retrain request

        Returns:
            New ModelVersion

        Raises:
            NotFoundException: If base model not found
        """
        # Get base model
        base_model = ModelService.get_model_by_version(db, request.base_version)

        # Use base model config if not provided
        config = request.config if request.config else ModelConfig(**base_model.config)

        # Create new model
        model_data = ModelVersionCreate(
            version=request.new_version,
            description=request.description or f"Retrained from {request.base_version}",
            config=config,
            parent_version=request.base_version
        )
        model = ModelService.create_model(db, model_data)

        # Simulate retraining with improved metrics
        base_f1 = base_model.f1_score or 0.85
        model.f1_score = min(0.99, base_f1 + random.uniform(0.01, 0.05))
        model.precision = min(0.99, (base_model.precision or 0.83) + random.uniform(0.01, 0.05))
        model.recall = min(0.99, (base_model.recall or 0.87) + random.uniform(0.01, 0.05))
        model.accuracy = min(0.99, (base_model.accuracy or 0.86) + random.uniform(0.01, 0.05))
        model.auc_roc = min(0.99, (base_model.auc_roc or 0.91) + random.uniform(0.01, 0.05))
        model.trained_at = datetime.utcnow()

        db.commit()
        db.refresh(model)

        return model

    @staticmethod
    def get_metrics(db: Session, version: str) -> ModelMetrics:
        """
        Get model performance metrics

        Args:
            db: Database session
            version: Model version

        Returns:
            ModelMetrics

        Raises:
            NotFoundException: If model not found
        """
        model = ModelService.get_model_by_version(db, version)

        return ModelMetrics(
            f1_score=model.f1_score or 0.0,
            precision=model.precision or 0.0,
            recall=model.recall or 0.0,
            accuracy=model.accuracy,
            auc_roc=model.auc_roc
        )

    @staticmethod
    def get_feature_importance(db: Session, version: str) -> List[FeatureImportance]:
        """
        Get feature importance for a model

        Args:
            db: Database session
            version: Model version

        Returns:
            List of FeatureImportance
        """
        model = ModelService.get_model_by_version(db, version)

        # Generate dummy feature importance
        # In production, this would come from the actual model
        importance_list = []
        for i in range(20):  # Top 20 features
            importance_list.append(
                FeatureImportance(
                    feature_name=f"feature_{i:03d}",
                    importance=random.uniform(0.1, 1.0) * (1 - i * 0.03),
                    rank=i + 1
                )
            )

        # Sort by importance
        importance_list.sort(key=lambda x: x.importance, reverse=True)

        return importance_list

    @staticmethod
    def get_feature_correlation(db: Session) -> List[FeatureCorrelation]:
        """
        Get feature correlation matrix

        Args:
            db: Database session

        Returns:
            List of FeatureCorrelation
        """
        # Generate dummy correlations
        # In production, this would be calculated from actual data
        correlations = []

        feature_pairs = [
            ("feature_001", "feature_002"),
            ("feature_003", "feature_005"),
            ("feature_010", "feature_015"),
            ("feature_020", "feature_025"),
            ("feature_030", "feature_035"),
        ]

        for feat1, feat2 in feature_pairs:
            corr_value = random.uniform(-1, 1)

            if abs(corr_value) >= 0.7:
                significance = "high"
            elif abs(corr_value) >= 0.4:
                significance = "medium"
            else:
                significance = "low"

            correlations.append(
                FeatureCorrelation(
                    feature1=feat1,
                    feature2=feat2,
                    correlation=corr_value,
                    significance=significance
                )
            )

        return correlations

    @staticmethod
    def get_model_config(db: Session, version: str) -> ModelConfig:
        """Get model configuration"""
        model = ModelService.get_model_by_version(db, version)
        return ModelConfig(**model.config)

    @staticmethod
    def update_model_config(db: Session, version: str, config: ModelConfig) -> ModelVersion:
        """Update model configuration"""
        model = ModelService.get_model_by_version(db, version)
        model.config = config.model_dump()
        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def to_detail(model: ModelVersion) -> ModelVersionDetail:
        """Convert ModelVersion to detail schema"""
        metrics = None
        if model.f1_score is not None:
            metrics = ModelMetrics(
                f1_score=model.f1_score,
                precision=model.precision or 0.0,
                recall=model.recall or 0.0,
                accuracy=model.accuracy,
                auc_roc=model.auc_roc
            )

        return ModelVersionDetail(
            id=model.id,
            version=model.version,
            description=model.description,
            config=ModelConfig(**model.config),
            metrics=metrics,
            parent_version=model.parent_version,
            is_active=model.is_active,
            trained_at=model.trained_at,
            created_at=model.created_at
        )
