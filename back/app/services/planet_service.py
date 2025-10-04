"""
Planet service - Business logic for planet operations
"""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.planet import Planet
from app.schemas.planet import (
    PlanetCreate, PlanetListItem, PlanetDetail,
    PlanetFilterRequest, PlanetStatus, Coordinates3D
)
from app.utils.coordinates import ra_dec_to_xyz
from app.exceptions import NotFoundException, AlreadyExistsException
import math


class PlanetService:
    """Service for planet-related operations"""

    @staticmethod
    def get_all_planets(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Planet], int]:
        """
        Get all planets with pagination

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (list of planets, total count)
        """
        query = db.query(Planet)
        total = query.count()
        planets = query.offset(skip).limit(limit).all()
        return planets, total

    @staticmethod
    def get_planet_by_id(db: Session, planet_id: int) -> Planet:
        """
        Get planet by ID

        Args:
            db: Database session
            planet_id: Planet ID

        Returns:
            Planet instance

        Raises:
            NotFoundException: If planet not found
        """
        planet = db.query(Planet).filter(Planet.id == planet_id).first()
        if not planet:
            raise NotFoundException("Planet", planet_id)
        return planet

    @staticmethod
    def get_planet_by_name(db: Session, name: str) -> Optional[Planet]:
        """Get planet by name"""
        return db.query(Planet).filter(Planet.name == name).first()

    @staticmethod
    def create_planet(db: Session, planet_data: PlanetCreate) -> Planet:
        """
        Create a new planet

        Args:
            db: Database session
            planet_data: Planet creation data

        Returns:
            Created planet instance

        Raises:
            AlreadyExistsException: If planet with same name exists
        """
        # Check if planet already exists
        existing = PlanetService.get_planet_by_name(db, planet_data.name)
        if existing:
            raise AlreadyExistsException("Planet", planet_data.name)

        # Create new planet
        planet = Planet(
            name=planet_data.name,
            ra=planet_data.ra,
            dec=planet_data.dec,
            r=planet_data.r,
            status=planet_data.status,
            ai_probability=planet_data.ai_probability,
            model_version=planet_data.model_version,
            features=planet_data.features
        )

        db.add(planet)
        db.commit()
        db.refresh(planet)

        return planet

    @staticmethod
    def filter_planets(
        db: Session,
        filters: PlanetFilterRequest
    ) -> Tuple[List[Planet], int]:
        """
        Filter planets based on criteria

        Args:
            db: Database session
            filters: Filter criteria

        Returns:
            Tuple of (filtered planets, total count)
        """
        query = db.query(Planet)

        # Apply filters
        if filters.min_probability is not None:
            query = query.filter(Planet.ai_probability >= filters.min_probability)

        if filters.max_probability is not None:
            query = query.filter(Planet.ai_probability <= filters.max_probability)

        if filters.status:
            query = query.filter(Planet.status.in_(filters.status))

        if filters.min_ra is not None:
            query = query.filter(Planet.ra >= filters.min_ra)

        if filters.max_ra is not None:
            query = query.filter(Planet.ra <= filters.max_ra)

        if filters.min_dec is not None:
            query = query.filter(Planet.dec >= filters.min_dec)

        if filters.max_dec is not None:
            query = query.filter(Planet.dec <= filters.max_dec)

        if filters.min_r is not None:
            query = query.filter(Planet.r >= filters.min_r)

        if filters.max_r is not None:
            query = query.filter(Planet.r <= filters.max_r)

        # Get total count
        total = query.count()

        # Apply pagination
        skip = (filters.page - 1) * filters.page_size
        planets = query.offset(skip).limit(filters.page_size).all()

        return planets, total

    @staticmethod
    def to_list_item(planet: Planet) -> PlanetListItem:
        """
        Convert Planet model to PlanetListItem schema

        Args:
            planet: Planet model instance

        Returns:
            PlanetListItem schema
        """
        coordinates_3d = ra_dec_to_xyz(planet.ra, planet.dec, planet.r)

        return PlanetListItem(
            id=planet.id,
            name=planet.name,
            ra=planet.ra,
            dec=planet.dec,
            r=planet.r,
            status=planet.status,
            ai_probability=planet.ai_probability,
            coordinates_3d=coordinates_3d
        )

    @staticmethod
    def to_detail(planet: Planet) -> PlanetDetail:
        """
        Convert Planet model to PlanetDetail schema

        Args:
            planet: Planet model instance

        Returns:
            PlanetDetail schema
        """
        coordinates_3d = ra_dec_to_xyz(planet.ra, planet.dec, planet.r)

        return PlanetDetail(
            id=planet.id,
            name=planet.name,
            ra=planet.ra,
            dec=planet.dec,
            r=planet.r,
            status=planet.status,
            ai_probability=planet.ai_probability,
            model_version=planet.model_version,
            features=planet.features,
            coordinates_3d=coordinates_3d,
            created_at=planet.created_at.isoformat() if planet.created_at else None,
            updated_at=planet.updated_at.isoformat() if planet.updated_at else None
        )

    @staticmethod
    def update_planet_prediction(
        db: Session,
        planet_id: int,
        probability: float,
        model_version: str
    ) -> Planet:
        """
        Update planet prediction

        Args:
            db: Database session
            planet_id: Planet ID
            probability: New AI probability
            model_version: Model version used

        Returns:
            Updated planet

        Raises:
            NotFoundException: If planet not found
        """
        planet = PlanetService.get_planet_by_id(db, planet_id)

        planet.ai_probability = probability
        planet.model_version = model_version

        # Update status based on probability
        if probability >= 0.9:
            planet.status = PlanetStatus.CONFIRMED
        elif probability >= 0.7:
            planet.status = PlanetStatus.CANDIDATE
        else:
            planet.status = PlanetStatus.UNKNOWN

        db.commit()
        db.refresh(planet)

        return planet
