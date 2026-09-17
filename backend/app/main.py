"""
FastAPI application - the web integration layer (methodology step 8).

Endpoints
    GET  /api/health                 -> server status
    GET  /api/weather?lat=&lon=      -> live weather for the user's location
    POST /api/predict                -> weather + ML prediction, saved to history
    GET  /api/models/metrics         -> model evaluation report (MAE, RMSE, R2)
    GET  /api/history                -> previous predictions
    GET  /api/history/{id}           -> one saved prediction in full
    DELETE /api/history/{id}         -> delete one prediction
    DELETE /api/history              -> clear history
"""
from contextlib import asynccontextmanager

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import database
from .models import load_metrics
from .predictor import load_models, predict_from_weather
from .weather import fetch_weather

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts: create the database and load the models.
    database.init_db()
    load_models()
    yield


app = FastAPI(
    title="AI-Driven Renewable Energy Generation Forecasting",
    description="Predicts solar, wind and total energy generation from live weather using machine learning.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React development server to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/weather")
def weather(lat: float, lon: float):
    try:
        return fetch_weather(lat, lon)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Weather service unavailable: {exc}")


@app.post("/api/predict")
def predict(coords: Coordinates):
    try:
        weather_data = fetch_weather(coords.latitude, coords.longitude)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Weather service unavailable: {exc}")
    result = predict_from_weather(weather_data)
    result["id"] = database.save_prediction(result)
    return result


@app.get("/api/models/metrics")
def model_metrics():
    return load_metrics()


@app.get("/api/history")
def history(limit: int = 50):
    return database.list_predictions(limit)


@app.get("/api/history/{prediction_id}")
def history_item(prediction_id: int):
    item = database.get_prediction(prediction_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return item


@app.delete("/api/history/{prediction_id}")
def delete_history_item(prediction_id: int):
    if not database.delete_prediction(prediction_id):
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"deleted": prediction_id}


@app.delete("/api/history")
def clear_history():
    database.clear_predictions()
    return {"cleared": True}
