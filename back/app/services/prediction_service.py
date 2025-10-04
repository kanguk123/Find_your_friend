"""
Prediction service - AI model prediction logic
"""
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
from app.ml.model_wrapper import get_model


class PredictionService:
    """Service for AI prediction operations using real trained model"""

    @staticmethod
    def predict_planet(
        db: Session,
        planet_id: int,
        include_details: bool = True
    ) -> PredictionResponse:
        """
        Predict if a planet is an exoplanet using the trained RandomForest model

        Args:
            db: Database session
            planet_id: Planet ID
            include_details: Whether to include detailed analysis (feature contributions)

        Returns:
            PredictionResponse with model predictions

        Raises:
            NotFoundException: If planet not found
            AIServiceException: If model prediction fails
        """
        planet = PlanetService.get_planet_by_id(db, planet_id)

        try:
            # Get model instance
            model = get_model()

            # Run prediction
            result = model.predict(
                features=planet.features,
                threshold=0.5,
                include_contributions=include_details
            )

            # Update planet with prediction if not already predicted
            if planet.ai_probability is None:
                PlanetService.update_planet_prediction(
                    db=db,
                    planet_id=planet.id,
                    probability=result["probability"],
                    prediction_label=result["prediction"],
                    confidence=result["confidence"],
                    model_version=result["model_version"]
                )

            # Build response
            response = PredictionResponse(
                planet_id=planet.id,
                rowid=planet.rowid,
                probability=result["probability"],
                prediction=result["prediction"],
                confidence=result["confidence"],
                model_version=result["model_version"],
                feature_contributions=result.get("feature_contributions"),
                top_correlations=result.get("top_correlations")
            )

            return response

        except FileNotFoundError as e:
            raise AIServiceException(
                f"Model file not found. Please train and save the model first. Error: {str(e)}"
            )
        except Exception as e:
            raise AIServiceException(f"Prediction failed: {str(e)}")

    @staticmethod
    def predict_planet_simple(db: Session, planet_id: int) -> SimplePredictionResponse:
        """
        Simple prediction for beginners (no detailed analysis)

        Args:
            db: Database session
            planet_id: Planet ID

        Returns:
            SimplePredictionResponse

        Raises:
            NotFoundException: If planet not found
        """
        planet = PlanetService.get_planet_by_id(db, planet_id)

        try:
            # Get model instance
            model = get_model()

            # Run prediction without details
            result = model.predict(
                features=planet.features,
                threshold=0.5,
                include_contributions=False
            )

            # Update planet if needed
            if planet.ai_probability is None:
                PlanetService.update_planet_prediction(
                    db=db,
                    planet_id=planet.id,
                    probability=result["probability"],
                    prediction_label=result["prediction"],
                    confidence=result["confidence"],
                    model_version=result["model_version"]
                )

            # Build simple response
            is_confirmed = result["prediction"] == "CONFIRMED"

            return SimplePredictionResponse(
                planet_id=planet.id,
                rowid=planet.rowid,
                probability=result["probability"],
                is_confirmed=is_confirmed,
                confidence_level=result["confidence"]
            )

        except Exception as e:
            raise AIServiceException(f"Prediction failed: {str(e)}")

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
            except AIServiceException:
                # Skip planets that fail prediction
                continue

        return predictions

    @staticmethod
    def calculate_reward(db: Session, planet_id: int) -> RewardResponse:
        """
        Calculate reward for discovering an exoplanet

        Reward logic:
        - CONFIRMED with high confidence (>=0.9): 100 points
        - CONFIRMED with medium confidence (0.7-0.9): 50 points
        - CONFIRMED with low confidence (0.5-0.7): 25 points
        - FALSE POSITIVE: 0 points

        Args:
            db: Database session
            planet_id: Planet ID

        Returns:
            RewardResponse

        Raises:
            NotFoundException: If planet not found
        """
        planet = PlanetService.get_planet_by_id(db, planet_id)

        # Get prediction if not already predicted
        if planet.ai_probability is None:
            prediction = PredictionService.predict_planet(db, planet_id, include_details=False)
            probability = prediction.probability
            prediction_label = prediction.prediction
        else:
            probability = planet.ai_probability
            prediction_label = planet.prediction_label or "UNKNOWN"

        # Calculate reward based on prediction
        reward_granted = prediction_label == "CONFIRMED"

        if reward_granted:
            # CONFIRMED exoplanet - calculate reward by confidence
            if probability >= 0.9:
                points_earned = 100
                upgrade_level = 3
                message = f"🎉 Excellent! High confidence CONFIRMED exoplanet (rowid={planet.rowid}, prob={probability:.2%})"
            elif probability >= 0.7:
                points_earned = 50
                upgrade_level = 2
                message = f"🌟 Great! Medium confidence CONFIRMED exoplanet (rowid={planet.rowid}, prob={probability:.2%})"
            else:
                points_earned = 25
                upgrade_level = 1
                message = f"✨ Nice! Low confidence CONFIRMED exoplanet (rowid={planet.rowid}, prob={probability:.2%})"
        else:
            # FALSE POSITIVE or uncertain
            points_earned = 0
            upgrade_level = None
            message = f"This planet (rowid={planet.rowid}) is predicted as FALSE POSITIVE (prob={probability:.2%}). Keep searching!"

        return RewardResponse(
            planet_id=planet.id,
            planet_name=f"rowid_{planet.rowid}",
            probability=probability,
            reward_granted=reward_granted,
            points_earned=points_earned,
            message=message,
            upgrade_level=upgrade_level
        )
