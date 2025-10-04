"""
Planet-related Pydantic schemas for validation and serialization
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class PlanetStatus(str, Enum):
    """Planet classification status"""
    UNKNOWN = "unknown"
    CANDIDATE = "candidate"
    CONFIRMED = "confirmed"


class Coordinates3D(BaseModel):
    """3D coordinates for visualization"""
    x: float
    y: float
    z: float


class PlanetBase(BaseModel):
    """Base planet schema with essential fields"""
    name: str = Field(..., description="Planet identifier/name")
    ra: float = Field(..., ge=0, le=360, description="Right Ascension (0-360 degrees)")
    dec: float = Field(..., ge=-90, le=90, description="Declination (-90 to 90 degrees)")
    r: float = Field(..., ge=0, description="Distance/depth for 3D visualization")


class PlanetCreate(PlanetBase):
    """Schema for creating a new planet"""
    features: Dict[str, float] = Field(default_factory=dict, description="300 planet features")
    status: PlanetStatus = PlanetStatus.UNKNOWN
    ai_probability: float = Field(default=0.0, ge=0.0, le=1.0, description="AI prediction probability")
    model_version: str = Field(default="v0.1", description="Model version used for prediction")

    model_config = {"protected_namespaces": ()}


class PlanetListItem(PlanetBase):
    """Simplified planet schema for list view"""
    id: int
    status: PlanetStatus
    ai_probability: float
    coordinates_3d: Coordinates3D

    class Config:
        from_attributes = True


class PlanetDetail(PlanetBase):
    """Detailed planet schema with all features"""
    id: int
    status: PlanetStatus
    ai_probability: float
    model_version: str
    features: Dict[str, float]
    coordinates_3d: Coordinates3D
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"protected_namespaces": (), "from_attributes": True}


class PlanetFilterRequest(BaseModel):
    """Request schema for filtering planets"""
    min_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    status: Optional[List[PlanetStatus]] = None
    min_ra: Optional[float] = Field(None, ge=0, le=360)
    max_ra: Optional[float] = Field(None, ge=0, le=360)
    min_dec: Optional[float] = Field(None, ge=-90, le=90)
    max_dec: Optional[float] = Field(None, ge=-90, le=90)
    min_r: Optional[float] = Field(None, ge=0)
    max_r: Optional[float] = Field(None, ge=0)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=500)

    @field_validator('max_probability')
    @classmethod
    def validate_probability_range(cls, v, info):
        if v is not None and info.data.get('min_probability') is not None:
            if v < info.data.get('min_probability'):
                raise ValueError('max_probability must be >= min_probability')
        return v


class FeatureContribution(BaseModel):
    """Feature contribution for prediction explanation"""
    feature_name: str
    value: float
    contribution: float
    importance: float


class PredictionResponse(BaseModel):
    """Prediction response with detailed information"""
    planet_id: int
    planet_name: str
    probability: float
    prediction: str  # "exoplanet" or "not_exoplanet"
    confidence: str  # "high", "medium", "low"
    model_version: str
    feature_contributions: Optional[List[FeatureContribution]] = None
    top_correlations: Optional[Dict[str, float]] = None

    model_config = {"protected_namespaces": ()}

    @field_validator('confidence', mode='before')
    @classmethod
    def determine_confidence(cls, v, info):
        if v is not None:
            return v
        prob = info.data.get('probability', 0)
        if prob >= 0.9 or prob <= 0.1:
            return "high"
        elif prob >= 0.7 or prob <= 0.3:
            return "medium"
        return "low"


class SimplePredictionResponse(BaseModel):
    """Simplified prediction response for beginners"""
    planet_id: int
    planet_name: str
    probability: float
    is_exoplanet: bool
    confidence_level: str

    @field_validator('is_exoplanet', mode='before')
    @classmethod
    def determine_exoplanet(cls, v, info):
        if v is not None:
            return v
        return info.data.get('probability', 0) >= 0.5


class BatchPredictionRequest(BaseModel):
    """Request schema for batch prediction"""
    planet_ids: List[int] = Field(..., min_length=1, max_length=100)
    include_details: bool = Field(default=False, description="Include feature contributions")


class BatchPredictionResponse(BaseModel):
    """Response schema for batch prediction"""
    predictions: List[PredictionResponse]
    total_processed: int
    model_version: str

    model_config = {"protected_namespaces": ()}
