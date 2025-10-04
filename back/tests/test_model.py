"""
Tests for model management endpoints
"""
import pytest


def test_get_model_metrics(client, sample_model):
    """Test GET /model/metrics/{model_version} endpoint"""
    response = client.get("/model/metrics/v0.1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    metrics = data["data"]
    assert "f1_score" in metrics
    assert "precision" in metrics
    assert "recall" in metrics


def test_get_feature_importance(client, sample_model):
    """Test GET /model/features/importance/{model_version} endpoint"""
    response = client.get("/model/features/importance/v0.1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)

    # Verify structure
    if len(data["data"]) > 0:
        feature = data["data"][0]
        assert "feature_name" in feature
        assert "importance" in feature
        assert "rank" in feature


def test_get_feature_correlation(client, sample_model):
    """Test GET /model/features/correlation endpoint"""
    response = client.get("/model/features/correlation")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


def test_get_model_config(client, sample_model):
    """Test GET /model/config/{model_version} endpoint"""
    response = client.get("/model/config/v0.1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    config = data["data"]
    assert "model_type" in config
    assert "hyperparameters" in config


def test_train_new_model(client, db):
    """Test POST /model/train endpoint"""
    train_request = {
        "version": "v0.2",
        "config": {
            "model_type": "RandomForest",
            "hyperparameters": {
                "n_estimators": 200,
                "max_depth": 15
            }
        },
        "description": "Test model v0.2"
    }

    response = client.post("/model/train", json=train_request)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["data"]["version"] == "v0.2"
    assert "metrics" in data["data"]


def test_retrain_model(client, sample_model):
    """Test POST /model/retrain endpoint"""
    retrain_request = {
        "base_version": "v0.1",
        "new_version": "v0.3",
        "description": "Retrained from v0.1"
    }

    response = client.post("/model/retrain", json=retrain_request)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["data"]["version"] == "v0.3"
    assert data["data"]["parent_version"] == "v0.1"


def test_get_all_model_versions(client, sample_model):
    """Test GET /model/versions endpoint"""
    response = client.get("/model/versions")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1
