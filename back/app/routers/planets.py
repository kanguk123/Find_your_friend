"""
Planet endpoints - CRUD operations for planets
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
import math

from app.database import get_db
from app.schemas.response import APIResponse, PaginatedResponse
from app.schemas.planet import (
    PlanetListItem, PlanetDetail, PlanetFilterRequest,
    PlanetCreate
)
from app.services.planet_service import PlanetService

router = APIRouter(prefix="/planets", tags=["Planets"])


@router.get("", response_model=APIResponse[List[PlanetListItem]])
async def get_all_planets(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get all planets with pagination

    Returns basic planet information with 3D coordinates for visualization
    """
    skip = (page - 1) * page_size
    planets, total = PlanetService.get_all_planets(db, skip=skip, limit=page_size)

    planet_list = [PlanetService.to_list_item(p) for p in planets]

    return APIResponse(
        success=True,
        message=f"Retrieved {len(planet_list)} planets",
        data=planet_list
    )


@router.get("/{planet_id}", response_model=APIResponse[PlanetDetail])
async def get_planet_detail(
    planet_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific planet

    Includes all 300 features and complete metadata
    """
    planet = PlanetService.get_planet_by_id(db, planet_id)
    detail = PlanetService.to_detail(planet)

    return APIResponse(
        success=True,
        message=f"Retrieved planet {planet.name}",
        data=detail
    )


@router.post("/filter", response_model=PaginatedResponse[PlanetListItem])
async def filter_planets(
    filters: PlanetFilterRequest,
    db: Session = Depends(get_db)
):
    """
    Filter planets based on various criteria

    Supports filtering by:
    - AI probability range
    - Planet status (unknown, candidate, confirmed)
    - Coordinate ranges (RA, Dec, r)
    """
    planets, total = PlanetService.filter_planets(db, filters)

    planet_list = [PlanetService.to_list_item(p) for p in planets]
    total_pages = math.ceil(total / filters.page_size)

    return PaginatedResponse(
        success=True,
        message=f"Found {total} planets matching filters",
        data=planet_list,
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        total_pages=total_pages
    )


@router.post("", response_model=APIResponse[PlanetDetail])
async def create_planet(
    planet_data: PlanetCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new planet entry

    Useful for adding manually curated planets or test data
    """
    planet = PlanetService.create_planet(db, planet_data)
    detail = PlanetService.to_detail(planet)

    return APIResponse(
        success=True,
        message=f"Planet {planet.name} created successfully",
        data=detail
    )
