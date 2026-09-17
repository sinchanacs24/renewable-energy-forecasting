"""
Central place for paths and constants used across the backend.
"""
from pathlib import Path

# Folder layout: backend/app/config.py -> backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BACKEND_DIR / "data"
MODELS_DIR = BACKEND_DIR / "models"
DATABASE_PATH = DATA_DIR / "predictions.db"
DATASET_PATH = DATA_DIR / "renewable_energy_dataset.csv"

# The four environmental parameters defined in the project specification.
FEATURE_COLUMNS = ["temperature", "humidity", "wind_speed", "solar_radiation"]

# Two prediction targets (kWh generated in one hour by the reference plant).
TARGET_COLUMNS = ["solar_energy", "wind_energy"]

# Reference plant capacity used when generating the training dataset.
SOLAR_PLANT_CAPACITY_KW = 100.0   # 100 kW solar plant
WIND_PLANT_CAPACITY_KW = 100.0    # 100 kW wind turbine

# Weather API (Open-Meteo is free and needs no API key).
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"
REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client"
