"""
Train exoplanet classification model from NASA_FINAL.ipynb
"""
import os
import sys
import numpy as np
import pandas as pd
import joblib
import sklearn

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score


def load_data(csv_path: str) -> pd.DataFrame:
    """Load CSV data"""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    print(f"[INFO] Loading CSV from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"[INFO] Loaded {len(df)} rows, {len(df.columns)} columns")

    # Validate required columns
    if "disposition" not in df.columns:
        raise ValueError("CSV must contain 'disposition' column")

    return df


def prepare_data(df: pd.DataFrame):
    """Prepare training and test data"""
    # Normalize disposition
    df["disposition"] = df["disposition"].astype(str).str.strip().str.upper()

    # Split train/valid (CONFIRMED & FALSE POSITIVE) vs test (CANDIDATE)
    mask_trainvalid = df["disposition"].isin(["CONFIRMED", "FALSE POSITIVE"])
    df_trainvalid = df.loc[mask_trainvalid].copy()
    df_test = df.loc[df["disposition"] == "CANDIDATE"].copy()

    print(f"[INFO] train/valid rows: {len(df_trainvalid)}")
    print(f"[INFO] test(CANDIDATE) rows: {len(df_test)}")

    # Prepare labels
    label_map = {"FALSE POSITIVE": 0, "CONFIRMED": 1}
    y = df_trainvalid["disposition"].map(label_map).astype(int)

    # Extract features (numeric only, exclude metadata)
    id_like_cols = [c for c in ["rowid"] if c in df_trainvalid.columns]
    drop_cols = ["disposition"] + id_like_cols

    num_cols = df_trainvalid.select_dtypes(include=[np.number]).columns.tolist()
    X_cols = [c for c in num_cols if c not in drop_cols]

    if len(X_cols) == 0:
        raise ValueError("No numeric features found")

    X = df_trainvalid[X_cols].copy()
    X_test = df_test[X_cols].copy() if len(df_test) > 0 else pd.DataFrame(columns=X_cols)

    print(f"[INFO] #features used: {len(X_cols)}")

    return X, y, X_test, df_test, X_cols, label_map


def train_model(X, y):
    """Train RandomForest model"""
    # Train/validation split
    X_train, X_valid, y_train, y_valid = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"[INFO] train: {len(X_train)}, valid: {len(X_valid)}")

    # Build pipeline
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("clf", RandomForestClassifier(
            n_estimators=400,
            max_features="sqrt",
            random_state=42,
            class_weight="balanced"
        ))
    ])

    print("[INFO] Training model...")
    pipe.fit(X_train, y_train)

    # Validation
    valid_proba = pipe.predict_proba(X_valid)[:, 1]
    valid_pred = (valid_proba >= 0.5).astype(int)

    print("\n=== Validation Confusion Matrix ===")
    cm = confusion_matrix(y_valid, valid_pred)
    print(cm)

    print("\n=== Validation Report (threshold=0.5) ===")
    print(classification_report(
        y_valid, valid_pred,
        target_names=["FALSE POSITIVE", "CONFIRMED"]
    ))

    auc = roc_auc_score(y_valid, valid_proba)
    print(f"Validation ROC-AUC: {auc:.6f}")

    return pipe, cm, auc


def save_model(pipe, X_cols, label_map, output_path: str):
    """Save model artifact"""
    artifact = {
        "model": pipe,
        "features": X_cols,
        "label_map": label_map,
        "sklearn_version": sklearn.__version__
    }

    joblib.dump(artifact, output_path)
    print(f"\n[INFO] Model saved to {output_path}")

    # Save metadata
    import json
    meta_path = output_path.replace(".joblib", "_meta.json")
    with open(meta_path, "w") as f:
        json.dump({
            "features": X_cols,
            "label_map": label_map,
            "sklearn_version": sklearn.__version__
        }, f, ensure_ascii=False, indent=2)

    print(f"[INFO] Metadata saved to {meta_path}")


def predict_candidates(pipe, X_test, df_test, X_cols, output_path: str):
    """Predict CANDIDATE planets"""
    if len(df_test) == 0:
        print("\n[INFO] No CANDIDATE planets to predict")
        return

    print(f"\n[INFO] Predicting {len(df_test)} CANDIDATE planets...")

    test_proba = pipe.predict_proba(X_test)[:, 1]
    test_pred = np.where(test_proba >= 0.5, "CONFIRMED", "FALSE POSITIVE")

    # Prepare output
    keep_id_cols = [c for c in ["rowid", "ra", "dec"] if c in df_test.columns]

    out = pd.DataFrame({
        "pred_confirmed_prob": test_proba,
        "pred_label": test_pred
    })

    for c in keep_id_cols:
        out[c] = df_test[c].values

    out.to_csv(output_path, index=False)
    print(f"[INFO] Predictions saved to {output_path}")
    print("\nSample predictions:")
    print(out.head(10))


def main():
    """Main training pipeline"""
    import argparse

    parser = argparse.ArgumentParser(description="Train exoplanet classification model")
    parser.add_argument(
        "--csv",
        type=str,
        default="all_test_validation.csv",
        help="Path to CSV file"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="exoplanet_rf.joblib",
        help="Output model path"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("NASA Exoplanet Model Training")
    print("=" * 60)

    # Load data
    df = load_data(args.csv)

    # Prepare data
    X, y, X_test, df_test, X_cols, label_map = prepare_data(df)

    # Train model
    pipe, cm, auc = train_model(X, y)

    # Save model
    save_model(pipe, X_cols, label_map, args.output)

    # Predict candidates
    pred_output = args.output.replace(".joblib", "_predictions.csv")
    predict_candidates(pipe, X_test, df_test, X_cols, pred_output)

    print("\n" + "=" * 60)
    print("Training completed successfully!")
    print(f"Model: {args.output}")
    print(f"ROC-AUC: {auc:.6f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
