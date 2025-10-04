"""
Tests for planet endpoints
"""
import pytest


def test_get_all_planets(client, sample_planets):
    """Test GET /planets endpoint"""
    response = client.get("/planets?page=1&page_size=10")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 10


def test_get_planet_detail(client, sample_planets):
    """Test GET /planets/{planet_id} endpoint"""
    response = client.get("/planets/1")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["id"] == 1
    assert "features" in data["data"]
    assert "coordinates_3d" in data["data"]


def test_get_planet_not_found(client, sample_planets):
    """Test GET /planets/{planet_id} with non-existent ID"""
    response = client.get("/planets/9999")
    assert response.status_code == 404

    data = response.json()
    assert data["success"] is False


def test_filter_planets_by_probability(client, sample_planets):
    """Test POST /planets/filter with probability filter"""
    filter_data = {
        "min_probability": 0.8,
        "max_probability": 1.0,
        "page": 1,
        "page_size": 50
    }

    response = client.post("/planets/filter", json=filter_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "total" in data

    # Verify all returned planets meet criteria
    for planet in data["data"]:
        assert planet["ai_probability"] >= 0.8
        assert planet["ai_probability"] <= 1.0


def test_filter_planets_by_status(client, sample_planets):
    """Test POST /planets/filter with status filter"""
    filter_data = {
        "status": ["confirmed"],
        "page": 1,
        "page_size": 50
    }

    response = client.post("/planets/filter", json=filter_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True


def test_create_planet(client, db):
    """Test POST /planets endpoint"""
    planet_data = {
        "name": "TEST-00001",
        "ra": 180.5,
        "dec": 45.2,
        "r": 50.0,
        "status": "unknown",
        "ai_probability": 0.5,
        "model_version": "v0.1",
        "features": {f"feature_{i:03d}": float(i) for i in range(300)}
    }

    response = client.post("/planets", json=planet_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "TEST-00001"


def test_create_duplicate_planet(client, sample_planets):
    """Test creating a planet with duplicate name"""
    planet_data = {
        "name": "KOI-01000",  # This should exist from sample_planets
        "ra": 180.5,
        "dec": 45.2,
        "r": 50.0,
        "status": "unknown",
        "ai_probability": 0.5,
        "model_version": "v0.1",
        "features": {f"feature_{i:03d}": float(i) for i in range(300)}
    }

    response = client.post("/planets", json=planet_data)
    assert response.status_code == 409  # Conflict
