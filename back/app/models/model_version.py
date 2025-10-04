"""
Model version database model
"""
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base


class ModelVersion(Base):
    """Model version tracking with configuration and metrics"""
    __tablename__ = "model_versions"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Version information
    version = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(500))
    parent_version = Column(String(50), index=True)  # For tracking model lineage

    # Configuration (hyperparameters)
    config = Column(JSON, nullable=False, default={})

    # Metrics
    f1_score = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    accuracy = Column(Float)
    auc_roc = Column(Float)

    # Status
    is_active = Column(Boolean, default=False, index=True)

    # Timestamps
    trained_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<ModelVersion(version='{self.version}', f1={self.f1_score}, active={self.is_active})>"
