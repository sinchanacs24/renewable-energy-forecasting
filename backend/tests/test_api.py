"""
Backend tests. Run from the backend folder with:  pytest

The weather API call is replaced with a sample Open-Meteo response so the
tests run without internet access.
"""
import pytest
from fastapi.testclient import TestClient

from app import database, weather
from app.main import app
from app.predictor import predict_energy

SAMPLE_OPEN_METEO = {
    "latitude": 12.97,
    "longitude": 77.59,
    "timezone": "Asia/Kolkata",
    "current": {
        "time": "2026-09-17T12:00",
        "temperature_2m": 29.5,
        "relative_humidity_2m": 55,
        "wind_speed_10m": 6.2,
        "shortwave_radiation": 720.0,
        "cloud_cover": 20,
        "is_day": 1,
    },
    "hourly": {
        "time": [f"2026-09-17T{h:02d}:00" for h in range(24)] + [f"2026-09-18T{h:02d}:00" for h in range(24)],
        "temperature_2m": [25 + (h % 24) * 0.2 for h in range(48)],
        "relative_humidity_2m": [60 for _ in range(48)],
        "wind_speed_10m": [4 + (h % 12) * 0.5 for h in range(48)],
        "shortwave_radiation": [max(0, 800 * __import__("math").sin(3.1416 * ((h % 24) - 6) / 12)) for h in range(48)],
    },
}


class FakeResponse:
    def __init__(self, data):
        self._data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self._data


@pytest.fixture(autouse=True)
def mock_weather_api(monkeypatch):
    def fake_get(url, params=None, timeout=None):
        if "open-meteo" in url:
            return FakeResponse(SAMPLE_OPEN_METEO)
        return FakeResponse({"city": "Bengaluru", "principalSubdivision": "Karnataka", "countryName": "India"})

    monkeypatch.setattr(weather.requests, "get", fake_get)


@pytest.fixture
def client():
    database.init_db()
    database.clear_predictions()
    with TestClient(app) as c:
        yield c


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_weather_endpoint(client):
    data = client.get("/api/weather", params={"lat": 12.97, "lon": 77.59}).json()
    assert data["current"]["temperature"] == 29.5
    assert data["location"]["name"] == "Bengaluru, Karnataka, India"
    assert len(data["forecast"]) == 24
    assert data["forecast"][0]["time"] == "2026-09-17T12:00"


def test_prediction_is_physically_sensible():
    night = predict_energy(temperature=22, humidity=70, wind_speed=1.0, solar_radiation=0)
    assert night["solar_energy"] == 0
    assert night["wind_energy"] < 5

    sunny_windy = predict_energy(temperature=28, humidity=40, wind_speed=12, solar_radiation=900)
    assert sunny_windy["solar_energy"] > 60
    assert sunny_windy["wind_energy"] > 80
    assert sunny_windy["total_energy"] == round(sunny_windy["solar_energy"] + sunny_windy["wind_energy"], 2)


def test_predict_endpoint_and_history(client):
    response = client.post("/api/predict", json={"latitude": 12.97, "longitude": 77.59})
    assert response.status_code == 200
    result = response.json()
    assert result["prediction"]["total_energy"] > 0
    assert len(result["hourly"]) == 24
    assert result["summary"]["total_energy_24h"] > 0
    assert result["models"]["solar"] in {"Linear Regression", "Decision Tree", "Random Forest", "SVR"}
    assert isinstance(result["insights"], list)

    history = client.get("/api/history").json()
    assert len(history) == 1
    assert history[0]["id"] == result["id"]

    item = client.get(f"/api/history/{result['id']}").json()
    assert item["prediction"] == result["prediction"]

    assert client.delete(f"/api/history/{result['id']}").status_code == 200
    assert client.get("/api/history").json() == []
    assert client.get(f"/api/history/{result['id']}").status_code == 404


def test_invalid_coordinates(client):
    assert client.post("/api/predict", json={"latitude": 200, "longitude": 0}).status_code == 422


def test_metrics_report(client):
    report = client.get("/api/models/metrics").json()
    for target in ("solar_energy", "wind_energy"):
        metrics = report["targets"][target]["metrics"]
        assert set(metrics) == {"Linear Regression", "Decision Tree", "Random Forest", "SVR"}
        for m in metrics.values():
            assert {"mae", "rmse", "r2"} <= set(m)
        assert report["targets"][target]["metrics"][report["targets"][target]["best_model"]]["r2"] > 0.9
