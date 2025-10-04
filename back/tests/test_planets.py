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

    # Verify structure
    planet = data["data"][0]
    assert "id" in planet
    assert "rowid" in planet
    assert "ra" in planet
    assert "dec" in planet
    assert "disposition" in planet
    assert "coordinates_3d" in planet


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
    assert "rowid" in data["data"]
    assert "disposition" in data["data"]


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
        if planet.get("ai_probability") is not None:
            assert planet["ai_probability"] >= 0.8
            assert planet["ai_probability"] <= 1.0


def test_filter_planets_by_disposition(client, sample_planets):
    """Test POST /planets/filter with disposition filter"""
    filter_data = {
        "disposition": ["CONFIRMED"],
        "page": 1,
        "page_size": 50
    }

    response = client.post("/planets/filter", json=filter_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True

    # Verify all returned planets are CONFIRMED
    for planet in data["data"]:
        assert planet["disposition"] == "CONFIRMED"


def test_create_planet(client, db):
    """Test POST /planets endpoint"""
    planet_data = {
        "rowid": 99999,
        "ra": 180.5,
        "dec": 45.2,
        "r": 1.5,
        "disposition": "CANDIDATE",
        "features": {f"koi_feature_{i:03d}": float(i) for i in range(122)}
    }

    response = client.post("/planets", json=planet_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["data"]["rowid"] == 99999
    assert data["data"]["disposition"] == "CANDIDATE"
    assert data["data"]["r"] == 1.5


def test_create_duplicate_planet(client, sample_planets):
    """Test creating a planet with duplicate rowid"""
    planet_data = {
        "rowid": 1001,  # This rowid exists from sample_planets
        "ra": 180.5,
        "dec": 45.2,
        "r": 1.0,
        "disposition": "CANDIDATE",
        "features": {f"koi_feature_{i:03d}": float(i) for i in range(122)}
    }

    response = client.post("/planets", json=planet_data)
    assert response.status_code == 409  # Conflict


def test_filter_by_coordinates(client, sample_planets):
    """Test filtering planets by RA/Dec coordinates"""
    filter_data = {
        "min_ra": 0,
        "max_ra": 180,
        "min_dec": -45,
        "max_dec": 45,
        "page": 1,
        "page_size": 50
    }

    response = client.post("/planets/filter", json=filter_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True

    # Verify coordinates are within range
    for planet in data["data"]:
        assert 0 <= planet["ra"] <= 180
        assert -45 <= planet["dec"] <= 45
