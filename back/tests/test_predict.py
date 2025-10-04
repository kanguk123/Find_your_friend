"""
Tests for prediction endpoints

Note: These tests mock the AI model to avoid dependency on model file.
Integration tests with real model should be run separately.
"""
import pytest
from unittest.mock import patch, MagicMock


@pytest.fixture
def mock_model():
    """Mock the AI model for testing"""
    with patch('app.services.prediction_service.get_model') as mock:
        # Create mock model instance
        model_instance = MagicMock()

        # Mock predict method
        def mock_predict(features, threshold=0.5, include_contributions=False):
            # Return realistic prediction result
            prob = 0.85
            result = {
                "probability": prob,
                "prediction": "CONFIRMED" if prob >= threshold else "FALSE POSITIVE",
                "confidence": "high" if prob >= 0.9 else "medium",
                "model_version": "v1.0"
            }

            if include_contributions:
                result["feature_contributions"] = [
                    {
                        "feature_name": "koi_feature_000",
                        "value": 1.0,
                        "contribution": 0.15,
                        "importance": 0.95
                    }
                ]
                result["top_correlations"] = {"koi_feature_000": 0.82}

            return result

        model_instance.predict = mock_predict
        mock.return_value = model_instance
        yield mock


def test_predict_planet(client, sample_planets, mock_model):
    """Test GET /predict/{planet_id} endpoint"""
    response = client.get("/predict/1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    prediction = data["data"]
    assert "planet_id" in prediction
    assert "rowid" in prediction
    assert "probability" in prediction
    assert "prediction" in prediction
    assert "confidence" in prediction
    assert "feature_contributions" in prediction


def test_predict_planet_simple(client, sample_planets, mock_model):
    """Test GET /predict/simple/{planet_id} endpoint"""
    response = client.get("/predict/simple/1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    prediction = data["data"]
    assert "planet_id" in prediction
    assert "rowid" in prediction
    assert "probability" in prediction
    assert "is_confirmed" in prediction
    assert "confidence_level" in prediction
    assert "feature_contributions" not in prediction  # Should not include details


def test_predict_nonexistent_planet(client, sample_planets, mock_model):
    """Test prediction for non-existent planet"""
    response = client.get("/predict/9999")
    assert response.status_code == 404


def test_batch_predict(client, sample_planets, mock_model):
    """Test POST /predict/batch endpoint"""
    batch_request = {
        "planet_ids": [1, 2, 3],
        "include_details": True
    }

    response = client.post("/predict/batch", json=batch_request)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    batch_response = data["data"]
    assert "predictions" in batch_response
    assert len(batch_response["predictions"]) == 3
    assert batch_response["total_processed"] == 3


def test_batch_predict_without_details(client, sample_planets, mock_model):
    """Test batch prediction without detailed analysis"""
    batch_request = {
        "planet_ids": [1, 2],
        "include_details": False
    }

    response = client.post("/predict/batch", json=batch_request)
    assert response.status_code == 200

    data = response.json()
    predictions = data["data"]["predictions"]

    # Verify no feature contributions included
    for prediction in predictions:
        assert prediction["feature_contributions"] is None or len(prediction["feature_contributions"]) == 0


def test_predict_updates_planet(client, sample_candidate_planets, mock_model, db):
    """Test that prediction updates planet record"""
    from app.models.planet import Planet

    # sample_candidate_planets creates planets with IDs starting from 11
    # But we need to get the actual ID from the first candidate planet
    first_candidate = sample_candidate_planets[0]
    planet_id = db.query(Planet).filter(Planet.rowid == first_candidate.rowid).first().id

    # Get prediction for CANDIDATE planet (no prediction yet)
    response = client.get(f"/predict/simple/{planet_id}")
    assert response.status_code == 200

    # Verify planet was updated in database
    planet = db.query(Planet).filter(Planet.id == planet_id).first()
    if planet:
        # Planet should now have prediction data
        assert planet.ai_probability is not None
        assert planet.prediction_label is not None
        assert planet.model_version is not None


def test_batch_predict_skips_invalid(client, sample_planets, mock_model):
    """Test batch prediction skips invalid planet IDs"""
    batch_request = {
        "planet_ids": [1, 9999, 2],  # 9999 doesn't exist
        "include_details": False
    }

    response = client.post("/predict/batch", json=batch_request)
    assert response.status_code == 200

    data = response.json()
    # Should successfully predict 2 planets (1 and 2), skip 9999
    assert data["data"]["total_processed"] == 2
