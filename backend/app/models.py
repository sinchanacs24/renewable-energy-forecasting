"""
Steps 4, 5 and 6 of the methodology - Model Training, Evaluation and
Best Model Selection.

Four algorithms from the project specification are trained for each energy
source (solar and wind):
    * Linear Regression
    * Decision Tree
    * Random Forest
    * Support Vector Regression (SVR)

Every model is evaluated on the 20 % test data with MAE, RMSE and R2 score.
The model with the highest R2 score is selected and saved to disk with joblib.
"""
import json
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

from .config import DATASET_PATH, FEATURE_COLUMNS, MODELS_DIR, TARGET_COLUMNS
from .dataset import create_dataset_file
from .preprocessing import preprocess

METRICS_PATH = MODELS_DIR / "metrics.json"


def build_models() -> dict:
    """Each model is wrapped in a pipeline with StandardScaler (normalisation)."""
    return {
        "Linear Regression": Pipeline(
            [("scaler", StandardScaler()), ("model", LinearRegression())]
        ),
        "Decision Tree": Pipeline(
            [("scaler", StandardScaler()), ("model", DecisionTreeRegressor(max_depth=10, random_state=42))]
        ),
        "Random Forest": Pipeline(
            [("scaler", StandardScaler()), ("model", RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1))]
        ),
        "SVR": Pipeline(
            [("scaler", StandardScaler()), ("model", SVR(kernel="rbf", C=200, epsilon=0.5))]
        ),
    }


def evaluate(y_true, y_pred) -> dict:
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        "r2": round(float(r2_score(y_true, y_pred)), 4),
    }


def train_all_models() -> dict:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if not DATASET_PATH.exists():
        create_dataset_file()
    df = pd.read_csv(DATASET_PATH)

    X_train, X_test, y_train, y_test, data_summary = preprocess(df)

    report = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": FEATURE_COLUMNS,
        "data": data_summary,
        "targets": {},
    }

    for target in TARGET_COLUMNS:
        print(f"\n=== Training models for {target} ===")
        results = {}
        trained = {}
        for name, pipeline in build_models().items():
            pipeline.fit(X_train, y_train[target])
            predictions = pipeline.predict(X_test)
            results[name] = evaluate(y_test[target], predictions)
            trained[name] = pipeline
            print(f"{name:18s} MAE={results[name]['mae']:8.3f}  RMSE={results[name]['rmse']:8.3f}  R2={results[name]['r2']:.4f}")

        # Best model = highest R2 score (ties broken by lowest RMSE).
        best_name = max(results, key=lambda n: (results[n]["r2"], -results[n]["rmse"]))
        best_model = trained[best_name]
        joblib.dump(best_model, MODELS_DIR / f"{target}_model.joblib")
        print(f"Best model for {target}: {best_name}")

        # Sample of actual vs predicted values for the report charts.
        sample = X_test.head(60).copy()
        sample_pred = best_model.predict(sample)
        actual_vs_predicted = [
            {"actual": round(float(a), 2), "predicted": round(float(p), 2)}
            for a, p in zip(y_test[target].head(60), sample_pred)
        ]

        # Feature importance (only available for tree-based models).
        importance = None
        estimator = best_model.named_steps["model"]
        if hasattr(estimator, "feature_importances_"):
            importance = {
                f: round(float(v), 4) for f, v in zip(FEATURE_COLUMNS, estimator.feature_importances_)
            }

        report["targets"][target] = {
            "best_model": best_name,
            "metrics": results,
            "feature_importance": importance,
            "actual_vs_predicted": actual_vs_predicted,
        }

    with open(METRICS_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nMetrics saved to {METRICS_PATH}")
    return report


def load_metrics() -> dict:
    if not METRICS_PATH.exists():
        return train_all_models()
    with open(METRICS_PATH) as f:
        return json.load(f)


if __name__ == "__main__":
    train_all_models()
