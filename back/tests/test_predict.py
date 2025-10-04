"""
Tests for prediction endpoints
"""
import pytest


def test_predict_planet(client, sample_planets):
    """Test GET /predict/{planet_id} endpoint"""
    response = client.get("/predict/1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    prediction = data["data"]
    assert "planet_id" in prediction
    assert "probability" in prediction
    assert "prediction" in prediction
    assert "confidence" in prediction
    assert "feature_contributions" in prediction


def test_predict_planet_simple(client, sample_planets):
    """Test GET /predict/simple/{planet_id} endpoint"""
    response = client.get("/predict/simple/1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    prediction = data["data"]
    assert "planet_id" in prediction
    assert "probability" in prediction
    assert "is_exoplanet" in prediction
    assert "confidence_level" in prediction
    assert "feature_contributions" not in prediction  # Should not include details


def test_predict_nonexistent_planet(client, sample_planets):
    """Test prediction for non-existent planet"""
    response = client.get("/predict/9999")
    assert response.status_code == 404


def test_batch_predict(client, sample_planets):
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


def test_batch_predict_without_details(client, sample_planets):
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
        assert prediction["feature_contributions"] is None
