"""
Prediction service - AI model prediction logic (UPDATED for 0-100 outputs)
Enhanced with comprehensive logging and validation
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
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        logger.info(f"🔮 Predicting planet_id={planet_id}, include_details={include_details}")

        planet = PlanetService.get_planet_by_id(db, planet_id)
        logger.info(f"📊 Planet found: rowid={planet.rowid}, disposition={planet.disposition}")

        try:
            # Get model instance
            model = get_model()
            logger.debug(f"✅ Model loaded: version={model.model_version}")

            # Run prediction
            logger.info(f"🚀 Running prediction...")
            result = model.predict(
                features=planet.features,
                threshold=0.5,
                include_contributions=include_details
            )
            logger.info(f"✅ Prediction complete: {result['prediction']} @ {result['probability']:.4f}")

            # Log transformation details
            logger.info(f"📈 Probability details:")
            logger.info(f"  - Raw output: {result.get('raw_output', 'N/A')}")
            logger.info(f"  - Normalized (0-1): {result['probability']:.4f}")
            logger.info(f"  - Percentage (0-100): {result.get('probability_pct', result['probability']*100):.2f}%")
            logger.info(f"  - Confidence: {result['confidence']}")

            # Update planet with prediction if not already predicted
            if planet.ai_probability is None:
                logger.info(f"💾 Storing prediction in database...")
                PlanetService.update_planet_prediction(
                    db=db,
                    planet_id=planet.id,
                    probability=result["probability"],  # Stored as 0-1
                    prediction_label=result["prediction"],
                    confidence=result["confidence"],
                    model_version=result["model_version"]
                )
                logger.info(f"✅ Prediction stored: ai_probability={result['probability']:.4f}")
            else:
                logger.info(f"ℹ️  Planet already has prediction: {planet.ai_probability:.4f}")

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

            logger.info(f"✅ Response built successfully for planet_id={planet_id}")
            return response

        except FileNotFoundError as e:
            logger.error(f"❌ Model file not found: {str(e)}")
            raise AIServiceException(
                f"Model file not found. Please train and save the model first. Error: {str(e)}"
            )
        except ValueError as e:
            # Validation errors from model wrapper
            logger.error(f"❌ Validation error: {str(e)}")
            raise AIServiceException(f"Invalid model output: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Prediction failed: {str(e)}", exc_info=True)
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
        logger.info(f"🔮 Simple prediction for planet_id={planet_id}")

        planet = PlanetService.get_planet_by_id(db, planet_id)

        try:
            # Get model instance
            model = get_model()

            # Run prediction without details
            logger.info(f"🚀 Running simple prediction...")
            result = model.predict(
                features=planet.features,
                threshold=0.5,
                include_contributions=False
            )
            logger.info(f"✅ Simple prediction: {result['prediction']} @ {result['probability']:.4f}")

            # Update planet if needed
            if planet.ai_probability is None:
                logger.info(f"💾 Storing simple prediction...")
                PlanetService.update_planet_prediction(
                    db=db,
                    planet_id=planet.id,
                    probability=result["probability"],
                    prediction_label=result["prediction"],
                    confidence=result["confidence"],
                    model_version=result["model_version"]
                )
                logger.info(f"✅ Stored: {result['probability']:.4f}")

            # Build simple response
            is_confirmed = result["prediction"] == "CONFIRMED"

            response = SimplePredictionResponse(
                planet_id=planet.id,
                rowid=planet.rowid,
                probability=result["probability"],
                is_confirmed=is_confirmed,
                confidence_level=result["confidence"]
            )

            logger.info(f"✅ Simple response built for planet_id={planet_id}")
            return response

        except ValueError as e:
            logger.error(f"❌ Validation error: {str(e)}")
            raise AIServiceException(f"Invalid model output: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Simple prediction failed: {str(e)}", exc_info=True)
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
        logger.info(f"🚀 Batch prediction for {len(request.planet_ids)} planets")

        predictions = []
        failed_count = 0

        for i, planet_id in enumerate(request.planet_ids):
            try:
                logger.info(f"📊 Processing planet {i+1}/{len(request.planet_ids)} (id={planet_id})")
                prediction = PredictionService.predict_planet(
                    db,
                    planet_id,
                    include_details=request.include_details
                )
                predictions.append(prediction)
                logger.info(f"✅ Planet {i+1} - Success")
            except NotFoundException as e:
                logger.warning(f"⚠️  Planet {i+1} (id={planet_id}) - Not found: {str(e)}")
                failed_count += 1
                # Skip planets that don't exist
                continue
            except AIServiceException as e:
                logger.error(f"❌ Planet {i+1} (id={planet_id}) - Prediction failed: {str(e)}")
                failed_count += 1
                # Skip planets that fail prediction
                continue

        logger.info(f"✅ Batch prediction complete: {len(predictions)}/{len(request.planet_ids)} successful")
        if failed_count > 0:
            logger.warning(f"⚠️  {failed_count} predictions failed or skipped")

        return predictions

    @staticmethod
    def calculate_reward(db: Session, planet_id: int) -> RewardResponse:
        """
        Calculate reward for discovering an exoplanet

        Reward logic (based on 0-1 normalized probability):
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
        logger.info(f"🎁 Calculating reward for planet_id={planet_id}")

        planet = PlanetService.get_planet_by_id(db, planet_id)
        logger.info(f"📊 Planet: rowid={planet.rowid}, disposition={planet.disposition}")

        # Get prediction if not already predicted
        if planet.ai_probability is None:
            logger.info(f"🔮 No existing prediction - running prediction...")
            prediction = PredictionService.predict_planet(db, planet_id, include_details=False)
            probability = prediction.probability
            prediction_label = prediction.prediction
            logger.info(f"✅ New prediction: {prediction_label} @ {probability:.4f}")
        else:
            probability = planet.ai_probability
            prediction_label = planet.prediction_label or "UNKNOWN"
            logger.info(f"ℹ️  Using existing prediction: {prediction_label} @ {probability:.4f}")

        # Validate probability is in correct range (should be 0-1 after normalization)
        if probability < 0 or probability > 1:
            logger.error(f"❌ Invalid probability in database: {probability}")
            raise AIServiceException(f"Invalid probability value: {probability}. Expected 0-1 range.")

        # Calculate reward based on prediction
        reward_granted = prediction_label == "CONFIRMED"

        if reward_granted:
            # CONFIRMED exoplanet - calculate reward by confidence
            if probability >= 0.9:
                points_earned = 100
                upgrade_level = 3
                message = f"🎉 Excellent! High confidence CONFIRMED exoplanet (rowid={planet.rowid}, prob={probability:.2%})"
                logger.info(f"🏆 HIGH reward: {points_earned} points (prob={probability:.4f} >= 0.9)")
            elif probability >= 0.7:
                points_earned = 50
                upgrade_level = 2
                message = f"🌟 Great! Medium confidence CONFIRMED exoplanet (rowid={planet.rowid}, prob={probability:.2%})"
                logger.info(f"🥈 MEDIUM reward: {points_earned} points (prob={probability:.4f} >= 0.7)")
            else:
                points_earned = 25
                upgrade_level = 1
                message = f"✨ Nice! Low confidence CONFIRMED exoplanet (rowid={planet.rowid}, prob={probability:.2%})"
                logger.info(f"🥉 LOW reward: {points_earned} points (prob={probability:.4f} >= 0.5)")
        else:
            # FALSE POSITIVE or uncertain
            points_earned = 0
            upgrade_level = None
            message = f"This planet (rowid={planet.rowid}) is predicted as FALSE POSITIVE (prob={probability:.2%}). Keep searching!"
            logger.info(f"❌ NO reward: FALSE POSITIVE (prob={probability:.4f})")

        response = RewardResponse(
            planet_id=planet.id,
            planet_name=f"rowid_{planet.rowid}",
            probability=probability,
            reward_granted=reward_granted,
            points_earned=points_earned,
            message=message,
            upgrade_level=upgrade_level
        )

        logger.info(f"✅ Reward calculated: {points_earned} points (granted={reward_granted})")
        return response
