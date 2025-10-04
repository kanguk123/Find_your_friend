"""
Data preprocessing utilities
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer


class DataPreprocessor:
    """Data preprocessing pipeline for exoplanet features"""

    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='median')
        self.feature_names = None
        self.is_fitted = False

    def fit(self, df: pd.DataFrame) -> 'DataPreprocessor':
        """
        Fit the preprocessor on training data

        Args:
            df: DataFrame with features

        Returns:
            Self for chaining
        """
        self.feature_names = df.columns.tolist()

        # Fit imputer and scaler
        imputed = self.imputer.fit_transform(df)
        self.scaler.fit(imputed)
        self.is_fitted = True

        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transform data using fitted preprocessor

        Args:
            df: DataFrame with features

        Returns:
            Preprocessed DataFrame
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor must be fitted before transform")

        # Impute missing values
        imputed = self.imputer.transform(df)

        # Scale features
        scaled = self.scaler.transform(imputed)

        return pd.DataFrame(scaled, columns=df.columns, index=df.index)

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fit and transform in one step"""
        return self.fit(df).transform(df)


def remove_outliers(df: pd.DataFrame, n_std: float = 3.0) -> Tuple[pd.DataFrame, int]:
    """
    Remove outliers using standard deviation method

    Args:
        df: Input DataFrame
        n_std: Number of standard deviations for outlier threshold

    Returns:
        Tuple of (cleaned DataFrame, number of outliers removed)
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    # Calculate z-scores
    z_scores = np.abs((df[numeric_cols] - df[numeric_cols].mean()) / df[numeric_cols].std())

    # Keep rows where all features are within threshold
    mask = (z_scores < n_std).all(axis=1)
    cleaned_df = df[mask].copy()

    outliers_removed = len(df) - len(cleaned_df)

    return cleaned_df, outliers_removed


def handle_missing_values(df: pd.DataFrame, strategy: str = 'median') -> Tuple[pd.DataFrame, Dict[str, int]]:
    """
    Handle missing values in DataFrame

    Args:
        df: Input DataFrame
        strategy: Imputation strategy ('mean', 'median', 'mode', 'drop')

    Returns:
        Tuple of (processed DataFrame, dict of missing counts per column)
    """
    missing_counts = df.isnull().sum().to_dict()
    missing_counts = {k: v for k, v in missing_counts.items() if v > 0}

    if strategy == 'drop':
        result_df = df.dropna()
    else:
        imputer = SimpleImputer(strategy=strategy)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
        result_df = df

    return result_df, missing_counts


def validate_features(features: Dict[str, float], expected_count: int = 300) -> Dict[str, Any]:
    """
    Validate feature dictionary

    Args:
        features: Dictionary of feature names to values
        expected_count: Expected number of features

    Returns:
        Validation result dictionary
    """
    validation_result = {
        "valid": True,
        "errors": [],
        "warnings": []
    }

    # Check feature count
    if len(features) != expected_count:
        validation_result["errors"].append(
            f"Expected {expected_count} features, got {len(features)}"
        )
        validation_result["valid"] = False

    # Check for missing values
    missing_features = [k for k, v in features.items() if v is None or np.isnan(v)]
    if missing_features:
        validation_result["warnings"].append(
            f"Found {len(missing_features)} features with missing values"
        )

    # Check for infinite values
    infinite_features = [k for k, v in features.items() if np.isinf(v)]
    if infinite_features:
        validation_result["errors"].append(
            f"Found {len(infinite_features)} features with infinite values"
        )
        validation_result["valid"] = False

    return validation_result


def normalize_features(features: Dict[str, float]) -> Dict[str, float]:
    """
    Normalize features to standard scale

    Args:
        features: Dictionary of feature values

    Returns:
        Normalized feature dictionary
    """
    if not features:
        return features

    values = np.array(list(features.values()))
    mean = np.mean(values)
    std = np.std(values)

    if std == 0:
        return features

    normalized = {
        k: float((v - mean) / std)
        for k, v in features.items()
    }

    return normalized
