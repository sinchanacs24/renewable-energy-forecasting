"""
Run this file once to create the dataset, train all models, evaluate them
and save the best model for solar and wind energy.

    python train.py
"""
from app.models import train_all_models

if __name__ == "__main__":
    train_all_models()
