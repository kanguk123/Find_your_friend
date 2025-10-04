"""
Dummy data generation for testing and development
"""
import random
import numpy as np
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.planet import Planet
from app.models.model_version import ModelVersion
from app.schemas.planet import PlanetStatus
from app.config import settings


def generate_planet_features(feature_count: int = 300) -> Dict[str, float]:
    """
    Generate random planet features

    Args:
        feature_count: Number of features to generate

    Returns:
        Dictionary of feature names to values
    """
    features = {}
    for i in range(feature_count):
        # Generate realistic feature names
        feature_name = f"feature_{i:03d}"

        # Generate random values with some patterns
        if i < 50:
            # Transit-related features
            value = random.uniform(0.8, 1.2)
        elif i < 100:
            # Flux features
            value = random.uniform(-0.5, 0.5)
        elif i < 150:
            # Period-related features
            value = random.uniform(1.0, 100.0)
        elif i < 200:
            # Depth-related features
            value = random.uniform(0.0001, 0.01)
        elif i < 250:
            # Signal-to-noise ratio features
            value = random.uniform(5.0, 50.0)
        else:
            # Other statistical features
            value = random.normalvariate(0, 1)

        features[feature_name] = value

    return features


def generate_dummy_planets(count: int = 500, model_version: str = "v0.1") -> List[Planet]:
    """
    Generate dummy planet data

    Args:
        count: Number of planets to generate
        model_version: Model version to assign

    Returns:
        List of Planet model instances
    """
    planets = []
    statuses = list(PlanetStatus)

    for i in range(count):
        # Generate coordinates
        ra = random.uniform(0, 360)
        dec = random.uniform(-90, 90)
        r = random.uniform(10, 100)  # Distance for 3D visualization

        # Generate AI probability with weighted distribution
        # More planets with low probability, fewer with high probability
        if random.random() < 0.7:
            # 70% of planets have low probability (not exoplanets)
            ai_probability = random.betavariate(2, 5)  # Skewed toward 0
        else:
            # 30% of planets have higher probability
            ai_probability = random.betavariate(5, 2)  # Skewed toward 1

        # Assign status based on probability
        if ai_probability >= 0.9:
            status = PlanetStatus.CONFIRMED
        elif ai_probability >= 0.7:
            status = PlanetStatus.CANDIDATE
        else:
            status = random.choice(statuses)

        # Generate features
        features = generate_planet_features()

        # Create planet instance
        planet = Planet(
            rowid=1000 + i,  # Use rowid instead of name
            ra=ra,
            dec=dec,
            r=r,
            disposition=status,  # Use disposition instead of status
            ai_probability=ai_probability,
            model_version=model_version,
            features=features
        )

        planets.append(planet)

    return planets


def create_default_model_version(db: Session, version: str = "v0.1") -> ModelVersion:
    """
    Create default model version for dummy data

    Args:
        db: Database session
        version: Model version identifier

    Returns:
        Created ModelVersion instance
    """
    # Check if already exists
    existing = db.query(ModelVersion).filter(ModelVersion.version == version).first()
    if existing:
        return existing

    config = {
        "model_type": "RandomForest",
        "hyperparameters": {
            "n_estimators": 100,
            "max_depth": 10,
            "min_samples_split": 2,
            "min_samples_leaf": 1,
            "random_state": 42
        }
    }

    model_version = ModelVersion(
        version=version,
        description="Default model version for dummy data",
        config=config,
        f1_score=0.85,
        precision=0.83,
        recall=0.87,
        accuracy=0.86,
        auc_roc=0.91,
        is_active=True
    )

    db.add(model_version)
    db.commit()
    db.refresh(model_version)

    return model_version


def initialize_dummy_data(db: Session, force: bool = False) -> Dict[str, int]:
    """
    Initialize database with dummy data

    Args:
        db: Database session
        force: If True, clear existing data first

    Returns:
        Dictionary with counts of created records
    """
    # Check if data already exists
    existing_count = db.query(Planet).count()
    if existing_count > 0 and not force:
        return {
            "planets": existing_count,
            "model_versions": db.query(ModelVersion).count(),
            "message": "Data already exists. Use force=True to recreate."
        }

    # Clear existing data if force is True
    if force:
        db.query(Planet).delete()
        db.query(ModelVersion).delete()
        db.commit()

    # Create default model version
    model_version = create_default_model_version(db, settings.DEFAULT_MODEL_VERSION)

    # Generate and insert dummy planets
    planets = generate_dummy_planets(
        count=settings.DUMMY_PLANET_COUNT,
        model_version=model_version.version
    )

    db.bulk_save_objects(planets)
    db.commit()

    return {
        "planets": len(planets),
        "model_versions": 1,
        "message": "Dummy data initialized successfully"
    }


def get_random_planet_features() -> Dict[str, float]:
    """Get random planet features for testing"""
    return generate_planet_features()
