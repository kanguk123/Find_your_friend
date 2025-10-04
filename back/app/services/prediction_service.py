"""
Prediction service - AI model prediction logic
"""
import random
import numpy as np
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.planet import Planet
from app.schemas.planet import (
    PredictionResponse, SimplePredictionResponse,
    FeatureContribution, BatchPredictionRequest
)
from app.schemas.model import RewardResponse
from app.config import settings
from app.exceptions import NotFoundException, AIServiceException
from app.services.planet_service import PlanetService


class PredictionService:
    """Service for AI prediction operations"""

    @staticmethod
    def _generate_dummy_prediction(planet: Planet, include_details: bool = True) -> PredictionResponse:
        """
        Generate dummy prediction for development/testing

        Args:
            planet: Planet to predict
            include_details: Whether to include feature contributions

        Returns:
            PredictionResponse with dummy data
        """
        probability = planet.ai_probability

        # Determine prediction
        prediction = "exoplanet" if probability >= 0.5 else "not_exoplanet"

        # Determine confidence
        if probability >= 0.9 or probability <= 0.1:
            confidence = "high"
        elif probability >= 0.7 or probability <= 0.3:
            confidence = "medium"
        else:
            confidence = "low"

        # Generate feature contributions if requested
        feature_contributions = None
        top_correlations = None

        if include_details:
            # Select top 10 most important features
            feature_contributions = []
            feature_names = list(planet.features.keys())[:10]

            for i, feature_name in enumerate(feature_names):
                contribution = FeatureContribution(
                    feature_name=feature_name,
                    value=planet.features[feature_name],
                    contribution=random.uniform(-0.3, 0.3),
                    importance=1.0 - (i * 0.05)  # Decreasing importance
                )
                feature_contributions.append(contribution)

            # Generate top correlations
            top_correlations = {
                feature_names[i]: random.uniform(-1, 1)
                for i in range(min(5, len(feature_names)))
            }

        return PredictionResponse(
            planet_id=planet.id,
            planet_name=planet.name,
            probability=probability,
            prediction=prediction,
            confidence=confidence,
            model_version=planet.model_version,
            feature_contributions=feature_contributions,
            top_correlations=top_correlations
        )

    @staticmethod
    def predict_planet(
        db: Session,
        planet_id: int,
        include_details: bool = True
    ) -> PredictionResponse:
        """
        Predict if a planet is an exoplanet

        Args:
            db: Database session
            planet_id: Planet ID
            include_details: Whether to include detailed analysis

        Returns:
            PredictionResponse

        Raises:
            NotFoundException: If planet not found
        """
        planet = PlanetService.get_planet_by_id(db, planet_id)

        # For now, use dummy predictions
        # When AI service is ready, replace this with actual API call
        if settings.USE_DUMMY_DATA:
            return PredictionService._generate_dummy_prediction(planet, include_details)
        else:
            # TODO: Call actual AI service
            # response = await ai_client.predict(planet.features)
            raise AIServiceException("AI service integration not yet implemented")

    @staticmethod
    def predict_planet_simple(db: Session, planet_id: int) -> SimplePredictionResponse:
        """
        Simple prediction for beginners (no detailed analysis)

        Args:
            db: Database session
            planet_id: Planet ID

        Returns:
            SimplePredictionResponse
        """
        planet = PlanetService.get_planet_by_id(db, planet_id)

        probability = planet.ai_probability
        is_exoplanet = probability >= 0.5

        # Determine confidence level
        if probability >= 0.9 or probability <= 0.1:
            confidence_level = "high"
        elif probability >= 0.7 or probability <= 0.3:
            confidence_level = "medium"
        else:
            confidence_level = "low"

        return SimplePredictionResponse(
            planet_id=planet.id,
            planet_name=planet.name,
            probability=probability,
            is_exoplanet=is_exoplanet,
            confidence_level=confidence_level
        )

    @staticmethod
    def batch_predict(
        db: Session,
        request: BatchPredictionRequest
    ) -> List[PredictionResponse]:
        """
        Predict multiple planets at once

        Args:
            db: Database session
            request: Batch prediction request

        Returns:
            List of PredictionResponse
        """
        predictions = []

        for planet_id in request.planet_ids:
            try:
                prediction = PredictionService.predict_planet(
                    db,
                    planet_id,
                    include_details=request.include_details
                )
                predictions.append(prediction)
            except NotFoundException:
                # Skip planets that don't exist
                continue

        return predictions

    @staticmethod
    def calculate_reward(db: Session, planet_id: int) -> RewardResponse:
        """
        Calculate reward for discovering an exoplanet

        Args:
            db: Database session
            planet_id: Planet ID

        Returns:
            RewardResponse

        Raises:
            NotFoundException: If planet not found
        """
        planet = PlanetService.get_planet_by_id(db, planet_id)

        probability = planet.ai_probability
        reward_granted = probability >= 0.9

        if reward_granted:
            # High confidence exoplanet discovery
            points_earned = 100
            message = f"Congratulations! You discovered a confirmed exoplanet: {planet.name}"

            # Determine upgrade level based on probability
            if probability >= 0.99:
                upgrade_level = 3  # Highest tier
            elif probability >= 0.95:
                upgrade_level = 2
            else:
                upgrade_level = 1
        else:
            points_earned = 0
            message = f"Planet {planet.name} has a {probability*100:.1f}% chance of being an exoplanet. Keep searching!"
            upgrade_level = None

        return RewardResponse(
            planet_id=planet.id,
            planet_name=planet.name,
            probability=probability,
            reward_granted=reward_granted,
            points_earned=points_earned,
            message=message,
            upgrade_level=upgrade_level
        )
