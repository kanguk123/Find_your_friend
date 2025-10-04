"""
Planet database model
"""
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.planet import PlanetStatus
import enum


class Planet(Base):
    """Planet database model with all features from NASA dataset"""
    __tablename__ = "planets"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Original NASA dataset ID
    rowid = Column(Integer, unique=True, nullable=False, index=True)

    # Coordinates
    ra = Column(Float, nullable=False, index=True)  # Right Ascension
    dec = Column(Float, nullable=False, index=True)  # Declination
    r = Column(Float, nullable=False)  # Distance for 3D visualization (random 0.5-2.0)

    # Classification (original NASA disposition)
    disposition = Column(
        SQLEnum(PlanetStatus),
        nullable=False,
        index=True
    )

    # AI prediction results
    ai_probability = Column(Float, nullable=True, index=True)
    prediction_label = Column(String(50), nullable=True)  # CONFIRMED or FALSE POSITIVE
    confidence = Column(String(20), nullable=True)  # high, medium, low
    model_version = Column(String(50), nullable=True, index=True)

    # Features (122 numeric features from NASA dataset stored as JSON)
    features = Column(JSON, nullable=False, default={})

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Planet(id={self.id}, rowid={self.rowid}, disposition='{self.disposition}', prob={self.ai_probability})>"
