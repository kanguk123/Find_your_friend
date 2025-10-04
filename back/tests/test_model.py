"""
Tests for model management endpoints
"""
import pytest


def test_get_model_metrics(client, sample_model):
    """Test GET /model/metrics/{model_version} endpoint"""
    response = client.get("/model/metrics/v1.0")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    metrics = data["data"]
    assert "f1_score" in metrics or "metrics" in metrics
    # NASA model has F1 ~0.93, Precision ~0.94, Recall ~0.93


def test_get_feature_importance(client, sample_model):
    """Test GET /model/features/importance/{model_version} endpoint"""
    response = client.get("/model/features/importance/v1.0")
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
    # Correlation data structure depends on implementation


def test_get_model_config(client, sample_model):
    """Test GET /model/config/{model_version} endpoint"""
    response = client.get("/model/config/v1.0")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data

    config = data["data"]
    assert "model_type" in config
    # RandomForest with 400 estimators


def test_get_model_not_found(client):
    """Test getting non-existent model version"""
    response = client.get("/model/metrics/v999.0")
    assert response.status_code == 404


def test_get_all_model_versions(client, sample_model):
    """Test GET /model/versions endpoint"""
    response = client.get("/model/versions")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1

    # Verify structure
    if len(data["data"]) > 0:
        model = data["data"][0]
        assert "version" in model
        assert "description" in model or "config" in model
        assert "is_active" in model


def test_get_active_model(client, sample_model):
    """Test GET /model/active endpoint"""
    response = client.get("/model/active")

    # Should return active model or 404 if none
    if response.status_code == 200:
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert data["data"]["status"] == "active"
    else:
        assert response.status_code == 404
