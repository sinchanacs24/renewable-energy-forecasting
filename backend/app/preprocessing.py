"""
Step 2 and 3 of the methodology - Data Preprocessing and Feature Selection.

* Remove missing values.
* Remove inconsistent / outlier readings (physically impossible values).
* Keep the four selected features that influence energy generation.
* Split into 80 % training and 20 % test data.

Scaling (normalisation) is done inside each model pipeline in models.py so
that the exact same scaling is applied at prediction time.
"""
import pandas as pd
from sklearn.model_selection import train_test_split

from .config import FEATURE_COLUMNS, TARGET_COLUMNS

# Physically valid ranges for the collected parameters.
VALID_RANGES = {
    "temperature": (-30, 60),      # degrees Celsius
    "humidity": (0, 100),          # percent
    "wind_speed": (0, 40),         # metres per second
    "solar_radiation": (0, 1400),  # watts per square metre
}


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Remove rows with missing values and out-of-range readings."""
    cleaned = df.dropna()
    for column, (low, high) in VALID_RANGES.items():
        cleaned = cleaned[(cleaned[column] >= low) & (cleaned[column] <= high)]
    return cleaned.reset_index(drop=True)


def select_features(df: pd.DataFrame):
    """Return the feature matrix X and the target table y."""
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMNS]
    return X, y


def split_data(X, y, test_size: float = 0.2, seed: int = 42):
    """80 % training / 20 % testing split as shown in the system architecture."""
    return train_test_split(X, y, test_size=test_size, random_state=seed)


def preprocess(df: pd.DataFrame):
    cleaned = clean_data(df)
    X, y = select_features(cleaned)
    X_train, X_test, y_train, y_test = split_data(X, y)
    summary = {
        "rows_collected": int(len(df)),
        "rows_after_cleaning": int(len(cleaned)),
        "rows_removed": int(len(df) - len(cleaned)),
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
    }
    return X_train, X_test, y_train, y_test, summary
