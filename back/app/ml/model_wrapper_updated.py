"""
AI Model Wrapper for Exoplanet Prediction - UPDATED for 0-100 outputs
Handles model outputs in 0-100 range and converts to 0-1 for compatibility
"""
import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ExoplanetModel:
    """
    Wrapper class for the trained exoplanet classification model

    **UPDATED**: Now handles model outputs in 0-100 range

    Model Details:
    - Algorithm: RandomForestClassifier (400 estimators, balanced class weights)
    - Output Range: 0-100 (converted to 0-1 for compatibility)
    - Preprocessing: SimpleImputer (mean strategy)
    - Features: 122 numeric features from NASA dataset
    - Labels: 0 = FALSE POSITIVE, 1 = CONFIRMED
    - Threshold: 50 (or 0.5 after normalization)
    - Performance: F1=0.93-0.94, ROC-AUC=0.984
    """

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize model wrapper

        Args:
            model_path: Path to the joblib model file. If None, uses default path.
        """
        if model_path is None:
            # Default path: back/models/exoplanet_rf.joblib
            model_path = Path(__file__).parent.parent.parent / "models" / "exoplanet_rf.joblib"

        self.model_path = Path(model_path)
        self.model = None
        self.pipeline = None
        self.feature_names = None
        self.label_map = None
        self.sklearn_version = None
        self.model_version = "v1.1"  # Updated version for 0-100 outputs

        self._load_model()

    def _load_model(self):
        """Load the trained model from disk"""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model file not found at {self.model_path}. "
                f"Please ensure the model is trained and saved."
            )

        try:
            # Load joblib artifact (contains pipeline, features, label_map)
            artifact = joblib.load(self.model_path)

            self.pipeline = artifact["model"]  # SimpleImputer + RandomForest
            self.feature_names = artifact["features"]  # 122 feature names in order
            self.label_map = artifact["label_map"]  # {"FALSE POSITIVE": 0, "CONFIRMED": 1}
            self.sklearn_version = artifact.get("sklearn_version", "unknown")

            # Extract RandomForest from pipeline
            self.model = self.pipeline.named_steps["clf"]

            logger.info(f"✅ Model loaded successfully from {self.model_path}")
            logger.info(f"📊 Features: {len(self.feature_names)}, sklearn: {self.sklearn_version}")
            logger.info(f"🔢 Model version: {self.model_version} (0-100 output support)")

        except Exception as e:
            logger.error(f"❌ Failed to load model: {str(e)}")
            raise RuntimeError(f"Failed to load model: {str(e)}")

    def _validate_probability(self, raw_output: float) -> float:
        """
        Validate and normalize model output

        Args:
            raw_output: Raw model output (expected 0-100)

        Returns:
            Normalized probability (0-1)

        Raises:
            ValueError: If output is invalid (NaN, None, or out of range)
        """
        # Check for None
        if raw_output is None:
            logger.error("❌ Model output is None")
            raise ValueError("Model output is None - prediction failed")

        # Check for NaN
        if np.isnan(raw_output):
            logger.error("❌ Model output is NaN")
            raise ValueError("Model output is NaN - invalid prediction")

        # Check for Inf
        if np.isinf(raw_output):
            logger.error(f"❌ Model output is Inf: {raw_output}")
            raise ValueError(f"Model output is Inf: {raw_output}")

        # Determine if output is in 0-100 range or 0-1 range
        if raw_output > 1.0:
            # Assume 0-100 range
            logger.debug(f"🔄 Detected 0-100 output: {raw_output}")

            # Validate range
            if raw_output < 0 or raw_output > 100:
                logger.error(f"❌ Model output out of range (0-100): {raw_output}")
                raise ValueError(f"Model output {raw_output} is outside valid range 0-100")

            # Convert to 0-1
            normalized = raw_output / 100.0
            logger.debug(f"✅ Normalized {raw_output:.2f} → {normalized:.4f}")

            return normalized
        else:
            # Already in 0-1 range
            logger.debug(f"✅ Detected 0-1 output: {raw_output}")

            # Validate range
            if raw_output < 0 or raw_output > 1:
                logger.error(f"❌ Model output out of range (0-1): {raw_output}")
                raise ValueError(f"Model output {raw_output} is outside valid range 0-1")

            return raw_output

    def _round_probability(self, probability: float, decimals: int = 4) -> float:
        """
        Round probability for consistent storage

        Args:
            probability: Probability value (0-1)
            decimals: Number of decimal places

        Returns:
            Rounded probability
        """
        return round(probability, decimals)

    def predict(
        self,
        features: Dict[str, float],
        threshold: float = 0.5,
        include_contributions: bool = False
    ) -> Dict:
        """
        Predict exoplanet classification

        Args:
            features: Dictionary of feature values (122 features)
            threshold: Classification threshold (0-1 range, default 0.5)
            include_contributions: Whether to include feature importance

        Returns:
            Dictionary with prediction results:
            {
                "probability": float,  # P(CONFIRMED) in 0-1 range
                "probability_pct": float,  # P(CONFIRMED) in 0-100 range
                "raw_output": float,  # Original model output before normalization
                "prediction": str,  # "CONFIRMED" or "FALSE POSITIVE"
                "confidence": str,  # "high", "medium", "low"
                "model_version": str,
                "feature_contributions": Optional[List],  # if include_contributions=True
                "top_correlations": Optional[Dict]
            }
        """
        logger.info(f"🔮 Starting prediction for features: {list(features.keys())[:5]}...")

        # Prepare features in correct order
        X = self._prepare_features(features)
        logger.debug(f"📊 Prepared feature matrix: shape={X.shape}")

        try:
            # Get prediction probability (raw output from model)
            proba_raw = self.pipeline.predict_proba(X)[0, 1]  # P(CONFIRMED)
            logger.info(f"🎲 Raw model output: {proba_raw}")

            # Validate and normalize
            proba_normalized = self._validate_probability(proba_raw)
            logger.info(f"✅ Validated & normalized: {proba_normalized:.4f}")

            # Round for consistency
            proba_final = self._round_probability(proba_normalized)
            logger.info(f"🔢 Final probability: {proba_final:.4f} ({proba_final*100:.2f}%)")

        except ValueError as e:
            logger.error(f"❌ Validation error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"❌ Prediction error: {str(e)}")
            raise RuntimeError(f"Model prediction failed: {str(e)}")

        # Determine prediction label
        prediction = "CONFIRMED" if proba_final >= threshold else "FALSE POSITIVE"
        logger.info(f"🏷️  Prediction: {prediction} (threshold={threshold})")

        # Determine confidence level
        confidence = self._get_confidence(proba_final)
        logger.info(f"📈 Confidence: {confidence}")

        result = {
            "probability": float(proba_final),  # Normalized 0-1
            "probability_pct": float(proba_final * 100),  # Percentage 0-100
            "raw_output": float(proba_raw),  # Original model output
            "prediction": prediction,
            "confidence": confidence,
            "model_version": self.model_version
        }

        # Add feature contributions if requested
        if include_contributions:
            logger.debug("📊 Calculating feature contributions...")
            contributions = self._get_feature_contributions(X)
            result["feature_contributions"] = contributions
            result["top_correlations"] = self._get_top_correlations(X)
            logger.debug(f"✅ Added {len(contributions)} feature contributions")

        logger.info(f"✅ Prediction complete: {prediction} @ {proba_final:.4f}")
        return result

    def batch_predict(
        self,
        features_list: List[Dict[str, float]],
        threshold: float = 0.5,
        include_contributions: bool = False
    ) -> List[Dict]:
        """
        Batch prediction for multiple planets

        Args:
            features_list: List of feature dictionaries
            threshold: Classification threshold
            include_contributions: Include feature importance

        Returns:
            List of prediction results
        """
        logger.info(f"🚀 Starting batch prediction for {len(features_list)} planets")

        results = []
        failed_count = 0

        for i, features in enumerate(features_list):
            try:
                result = self.predict(features, threshold, include_contributions)
                results.append(result)
                logger.debug(f"✅ Planet {i+1}/{len(features_list)} - Success")
            except Exception as e:
                logger.error(f"❌ Planet {i+1}/{len(features_list)} - Failed: {str(e)}")
                failed_count += 1
                # Add error result
                results.append({
                    "probability": None,
                    "prediction": "ERROR",
                    "confidence": "none",
                    "error": str(e),
                    "model_version": self.model_version
                })

        logger.info(f"✅ Batch prediction complete: {len(results)-failed_count}/{len(features_list)} successful")
        if failed_count > 0:
            logger.warning(f"⚠️  {failed_count} predictions failed")

        return results

    def _prepare_features(self, features: Dict[str, float]) -> pd.DataFrame:
        """
        Prepare features in the correct order for the model

        Args:
            features: Dictionary of feature values

        Returns:
            DataFrame with features in model's expected order
        """
        # Create feature vector in correct order
        feature_values = []
        for feature_name in self.feature_names:
            value = features.get(feature_name, np.nan)  # Use NaN if missing (imputer will handle)
            feature_values.append(value)

        # Create DataFrame (model expects this format)
        X = pd.DataFrame([feature_values], columns=self.feature_names)

        return X

    def _get_confidence(self, probability: float) -> str:
        """
        Determine confidence level based on probability

        Args:
            probability: Prediction probability (0-1 range)

        Returns:
            Confidence level: "high", "medium", or "low"
        """
        if probability >= 0.9 or probability <= 0.1:
            return "high"
        elif probability >= 0.7 or probability <= 0.3:
            return "medium"
        else:
            return "low"

    def _get_feature_contributions(self, X: pd.DataFrame) -> List[Dict]:
        """
        Get feature importance contributions

        Args:
            X: Feature DataFrame

        Returns:
            List of feature contributions sorted by importance
        """
        # Get feature importances from RandomForest
        importances = self.model.feature_importances_

        # Get imputed values
        imputer = self.pipeline.named_steps["imputer"]
        X_imputed = pd.DataFrame(
            imputer.transform(X),
            columns=self.feature_names
        )

        # Calculate contributions (importance * standardized value)
        contributions = []
        for i, feature_name in enumerate(self.feature_names):
            value = X_imputed.iloc[0, i]
            importance = importances[i]

            # Simple contribution estimate
            contribution = importance * abs(value) if not np.isnan(value) else 0

            contributions.append({
                "feature_name": feature_name,
                "value": float(value),
                "contribution": float(contribution),
                "importance": float(importance)
            })

        # Sort by importance
        contributions.sort(key=lambda x: x["importance"], reverse=True)

        # Return top 20 features
        return contributions[:20]

    def _get_top_correlations(self, X: pd.DataFrame, top_n: int = 10) -> Dict[str, float]:
        """
        Get top feature correlations (placeholder for now)

        Args:
            X: Feature DataFrame
            top_n: Number of top correlations to return

        Returns:
            Dictionary of top correlations
        """
        importances = self.model.feature_importances_

        # Get top N features by importance
        top_indices = np.argsort(importances)[-top_n:][::-1]

        correlations = {}
        for idx in top_indices:
            feature_name = self.feature_names[idx]
            # Use importance as proxy for correlation
            correlations[feature_name] = float(importances[idx])

        return correlations

    def get_model_info(self) -> Dict:
        """
        Get model metadata and information

        Returns:
            Dictionary with model information
        """
        return {
            "model_version": self.model_version,
            "model_type": "RandomForestClassifier",
            "n_estimators": self.model.n_estimators,
            "n_features": len(self.feature_names),
            "feature_names": self.feature_names,
            "label_map": self.label_map,
            "sklearn_version": self.sklearn_version,
            "model_path": str(self.model_path),
            "output_format": "0-100 (auto-normalized to 0-1)"
        }


# Singleton instance
_model_instance: Optional[ExoplanetModel] = None


def get_model() -> ExoplanetModel:
    """
    Get singleton model instance

    Returns:
        ExoplanetModel instance
    """
    global _model_instance

    if _model_instance is None:
        logger.info("🔄 Initializing model singleton...")
        _model_instance = ExoplanetModel()
        logger.info("✅ Model singleton initialized")

    return _model_instance
