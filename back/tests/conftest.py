"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.planet import Planet
from app.models.model_version import ModelVersion
from app.schemas.planet import PlanetStatus

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database dependency override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def sample_planets(db):
    """Create sample planets for testing (realistic NASA data structure)"""
    # Sample planets with realistic NASA-like features
    planets = []

    for i in range(1, 11):
        # Generate sample features (122 features like in real data)
        features = {}
        for j in range(122):
            features[f"koi_feature_{j:03d}"] = float(i * 0.1 + j * 0.01)

        planet = Planet(
            rowid=1000 + i,
            ra=float(i * 30.0 % 360),  # 0-360
            dec=float(i * 15.0 - 45),  # -90 to 90
            r=1.0 + (i * 0.1),  # 1.0 to 2.0
            disposition=PlanetStatus.CONFIRMED if i % 2 == 0 else PlanetStatus.FALSE_POSITIVE,
            ai_probability=0.5 + (i * 0.05),  # 0.55 to 1.0
            prediction_label="CONFIRMED" if i % 2 == 0 else "FALSE POSITIVE",
            confidence="high" if i > 7 else "medium" if i > 4 else "low",
            model_version="v1.0",
            features=features
        )
        planets.append(planet)

    db.bulk_save_objects(planets)
    db.commit()

    return planets


@pytest.fixture(scope="function")
def sample_model(db):
    """Create sample model version for testing"""
    model = ModelVersion(
        version="v1.0",
        description="Test RandomForest model",
        f1_score=0.93,
        precision=0.94,
        recall=0.93,
        auc_roc=0.984,
        config={
            "n_estimators": 400,
            "max_features": "sqrt",
            "class_weight": "balanced"
        },
        is_active=True
    )
    db.add(model)
    db.commit()
    db.refresh(model)

    return model


@pytest.fixture(scope="function")
def sample_candidate_planets(db):
    """Create sample CANDIDATE planets (not yet classified)"""
    planets = []

    for i in range(1, 6):
        features = {}
        for j in range(122):
            features[f"koi_feature_{j:03d}"] = float(i * 0.2 + j * 0.01)

        planet = Planet(
            rowid=2000 + i,
            ra=float(i * 40.0 % 360),
            dec=float(i * 20.0 - 60),
            r=0.5 + (i * 0.2),  # 0.7 to 1.5
            disposition=PlanetStatus.CANDIDATE,
            features=features
        )
        planets.append(planet)

    db.bulk_save_objects(planets)
    db.commit()

    return planets
