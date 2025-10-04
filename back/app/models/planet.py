"""
Planet database model
"""
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.planet import PlanetStatus
import enum


class Planet(Base):
    """Planet database model with all features"""
    __tablename__ = "planets"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Basic information
    name = Column(String(255), unique=True, nullable=False, index=True)

    # Coordinates
    ra = Column(Float, nullable=False, index=True)  # Right Ascension (0-360)
    dec = Column(Float, nullable=False, index=True)  # Declination (-90 to 90)
    r = Column(Float, nullable=False)  # Distance/depth for 3D visualization

    # Classification
    status = Column(
        SQLEnum(PlanetStatus),
        nullable=False,
        default=PlanetStatus.UNKNOWN,
        index=True
    )

    # AI prediction
    ai_probability = Column(Float, nullable=False, default=0.0, index=True)
    model_version = Column(String(50), nullable=False, default="v0.1", index=True)

    # Features (300 features stored as JSON)
    features = Column(JSON, nullable=False, default={})

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Planet(id={self.id}, name='{self.name}', status='{self.status}', prob={self.ai_probability:.3f})>"
