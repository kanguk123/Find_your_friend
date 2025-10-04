"""
AI Model Wrapper for Exoplanet Prediction
Wraps the trained RandomForest model from NASA_FINAL.ipynb
"""
import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class ExoplanetModel:
    """
    Wrapper class for the trained exoplanet classification model

    Model Details:
    - Algorithm: RandomForestClassifier (400 estimators, balanced class weights)
    - Preprocessing: SimpleImputer (mean strategy)
    - Features: 122 numeric features from NASA dataset
    - Labels: 0 = FALSE POSITIVE, 1 = CONFIRMED
    - Threshold: 0.5
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
        self.model_version = "v1.0"

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

            print(f"[INFO] Model loaded successfully from {self.model_path}")
            print(f"[INFO] Features: {len(self.feature_names)}, sklearn: {self.sklearn_version}")

        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")

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
            threshold: Classification threshold (default 0.5)
            include_contributions: Whether to include feature importance

        Returns:
            Dictionary with prediction results:
            {
                "probability": float,  # P(CONFIRMED)
                "prediction": str,  # "CONFIRMED" or "FALSE POSITIVE"
                "confidence": str,  # "high", "medium", "low"
                "model_version": str,
                "feature_contributions": Optional[List],  # if include_contributions=True
                "top_correlations": Optional[Dict]
            }
        """
        # Prepare features in correct order
        X = self._prepare_features(features)

        # Get prediction probability
        proba = self.pipeline.predict_proba(X)[0, 1]  # P(CONFIRMED)

        # Determine prediction label
        prediction = "CONFIRMED" if proba >= threshold else "FALSE POSITIVE"

        # Determine confidence level
        confidence = self._get_confidence(proba)

        result = {
            "probability": float(proba),
            "prediction": prediction,
            "confidence": confidence,
            "model_version": self.model_version
        }

        # Add feature contributions if requested
        if include_contributions:
            contributions = self._get_feature_contributions(X)
            result["feature_contributions"] = contributions
            result["top_correlations"] = self._get_top_correlations(X)

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
        results = []
        for features in features_list:
            result = self.predict(features, threshold, include_contributions)
            results.append(result)

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
            probability: Prediction probability

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

        In production, this would use pre-computed correlations from training data.
        For now, we return feature importances as proxy.

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
            "model_path": str(self.model_path)
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
        _model_instance = ExoplanetModel()

    return _model_instance
