"""
Step 7 and 8 of the methodology - Prediction Engine and Output Generation.

Loads the saved best models and predicts solar, wind and total energy for the
current weather and for each hour of the 24-hour forecast.
"""
import joblib
import pandas as pd

from .config import FEATURE_COLUMNS, MODELS_DIR, SOLAR_PLANT_CAPACITY_KW, WIND_PLANT_CAPACITY_KW
from .models import load_metrics, train_all_models

# Simple assumptions used for the optional cost / efficiency insights.
GRID_TARIFF_INR_PER_KWH = 7.0     # average commercial electricity tariff
CO2_KG_PER_KWH = 0.82             # grid emission factor for India
HOME_DAILY_USAGE_KWH = 10.0       # average household consumption per day

_models = {}


def load_models():
    """Load the best solar and wind models (train them first if missing)."""
    global _models
    if _models:
        return _models
    solar_path = MODELS_DIR / "solar_energy_model.joblib"
    wind_path = MODELS_DIR / "wind_energy_model.joblib"
    if not solar_path.exists() or not wind_path.exists():
        train_all_models()
    _models = {"solar": joblib.load(solar_path), "wind": joblib.load(wind_path)}
    return _models


def predict_energy(temperature: float, humidity: float, wind_speed: float, solar_radiation: float) -> dict:
    """Predict energy (kWh for one hour) for one set of weather values."""
    models = load_models()
    features = pd.DataFrame(
        [[temperature, humidity, wind_speed, solar_radiation]], columns=FEATURE_COLUMNS
    )
    solar = max(0.0, float(models["solar"].predict(features)[0]))
    wind = max(0.0, float(models["wind"].predict(features)[0]))
    # A solar plant cannot generate at night regardless of model noise.
    if solar_radiation <= 0:
        solar = 0.0
    solar, wind = round(solar, 2), round(wind, 2)
    return {
        "solar_energy": solar,
        "wind_energy": wind,
        "total_energy": round(solar + wind, 2),
    }


def predict_from_weather(weather: dict) -> dict:
    """Full output: current prediction, hourly forecast, summary and insights."""
    current = weather["current"]
    now = predict_energy(
        current["temperature"], current["humidity"], current["wind_speed"], current["solar_radiation"]
    )

    hourly = []
    for row in weather["forecast"]:
        p = predict_energy(row["temperature"], row["humidity"], row["wind_speed"], row["solar_radiation"])
        hourly.append({**row, **p})

    total_24h = round(sum(h["total_energy"] for h in hourly), 2)
    solar_24h = round(sum(h["solar_energy"] for h in hourly), 2)
    wind_24h = round(sum(h["wind_energy"] for h in hourly), 2)
    peak = max(hourly, key=lambda h: h["total_energy"]) if hourly else None
    max_possible = (SOLAR_PLANT_CAPACITY_KW + WIND_PLANT_CAPACITY_KW) * len(hourly)
    capacity_factor = round(100 * total_24h / max_possible, 1) if max_possible else 0.0

    metrics = load_metrics()
    summary = {
        "solar_energy_24h": solar_24h,
        "wind_energy_24h": wind_24h,
        "total_energy_24h": total_24h,
        "solar_share_percent": round(100 * solar_24h / total_24h, 1) if total_24h else 0.0,
        "wind_share_percent": round(100 * wind_24h / total_24h, 1) if total_24h else 0.0,
        "peak_hour": peak["time"] if peak else None,
        "peak_energy": peak["total_energy"] if peak else 0.0,
        "capacity_factor_percent": capacity_factor,
        "estimated_savings_inr": round(total_24h * GRID_TARIFF_INR_PER_KWH, 0),
        "co2_avoided_kg": round(total_24h * CO2_KG_PER_KWH, 1),
        "homes_powered": int(total_24h // HOME_DAILY_USAGE_KWH),
    }

    return {
        "weather": weather,
        "prediction": now,
        "hourly": hourly,
        "summary": summary,
        "insights": build_insights(current, now, summary),
        "models": {
            "solar": metrics["targets"]["solar_energy"]["best_model"],
            "wind": metrics["targets"]["wind_energy"]["best_model"],
        },
        "plant": {
            "solar_capacity_kw": SOLAR_PLANT_CAPACITY_KW,
            "wind_capacity_kw": WIND_PLANT_CAPACITY_KW,
        },
    }


def build_insights(current: dict, now: dict, summary: dict) -> list:
    """Plain-language recommendations for energy planning."""
    insights = []

    if current["solar_radiation"] <= 0:
        insights.append("It is night time: solar generation is zero, so the plant depends on wind alone.")
    elif current["solar_radiation"] >= 600:
        insights.append("Strong sunlight right now - solar output is near its peak. Good time to run heavy loads.")
    elif current.get("cloud_cover", 0) >= 70:
        insights.append("Heavy cloud cover is reducing solar output. Expect lower generation until skies clear.")

    if current["wind_speed"] < 3:
        insights.append("Wind speed is below the turbine cut-in speed (3 m/s), so wind generation is negligible.")
    elif current["wind_speed"] >= 12:
        insights.append("Wind speed is at or above rated speed - the turbine is producing full power.")

    if summary["capacity_factor_percent"] >= 35:
        insights.append(f"High 24-hour capacity factor ({summary['capacity_factor_percent']}%). Surplus energy can be stored or sold to the grid.")
    elif summary["capacity_factor_percent"] < 15:
        insights.append(f"Low 24-hour capacity factor ({summary['capacity_factor_percent']}%). Plan for backup or grid supply.")

    if summary["peak_hour"]:
        insights.append(f"Peak generation of {summary['peak_energy']} kWh is expected at {summary['peak_hour'][11:16]}. Schedule flexible loads around this time.")

    if summary["solar_share_percent"] > 70:
        insights.append("Solar dominates today's mix - generation will drop sharply after sunset.")
    elif summary["wind_share_percent"] > 70:
        insights.append("Wind dominates today's mix - generation is spread across day and night.")

    return insights
