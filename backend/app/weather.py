"""
Weather API integration (Data Collection from a real-time API).

Uses Open-Meteo (https://open-meteo.com) which is free and needs no API key.
Given a latitude/longitude from the browser's geolocation, it returns the
current weather and a 24-hour hourly forecast for the four parameters used
by the models.
"""
import requests

from .config import REVERSE_GEOCODE_URL, WEATHER_API_URL

CURRENT_VARIABLES = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",
    "cloud_cover",
    "is_day",
]
HOURLY_VARIABLES = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",
]


def get_location_name(latitude: float, longitude: float) -> str:
    """Convert coordinates to a readable place name (best effort)."""
    try:
        response = requests.get(
            REVERSE_GEOCODE_URL,
            params={"latitude": latitude, "longitude": longitude, "localityLanguage": "en"},
            timeout=6,
        )
        response.raise_for_status()
        data = response.json()
        parts = [data.get("city") or data.get("locality"), data.get("principalSubdivision"), data.get("countryName")]
        name = ", ".join(p for p in parts if p)
        if name:
            return name
    except requests.RequestException:
        pass
    return f"{latitude:.3f}, {longitude:.3f}"


def fetch_weather(latitude: float, longitude: float) -> dict:
    """Return current weather + 24 hourly forecast rows for the coordinates."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ",".join(CURRENT_VARIABLES),
        "hourly": ",".join(HOURLY_VARIABLES),
        "wind_speed_unit": "ms",
        "timezone": "auto",
        "forecast_days": 2,
    }
    response = requests.get(WEATHER_API_URL, params=params, timeout=10)
    response.raise_for_status()
    raw = response.json()

    current = raw["current"]
    hourly = raw["hourly"]

    # Keep the next 24 hours starting from the current hour.
    current_time = current["time"][:13]  # "YYYY-MM-DDTHH"
    times = hourly["time"]
    start = next((i for i, t in enumerate(times) if t[:13] >= current_time), 0)
    end = start + 24

    forecast = []
    for i in range(start, min(end, len(times))):
        forecast.append(
            {
                "time": times[i],
                "temperature": _num(hourly["temperature_2m"][i]),
                "humidity": _num(hourly["relative_humidity_2m"][i]),
                "wind_speed": _num(hourly["wind_speed_10m"][i]),
                "solar_radiation": _num(hourly["shortwave_radiation"][i]),
            }
        )

    return {
        "location": {
            "latitude": raw.get("latitude", latitude),
            "longitude": raw.get("longitude", longitude),
            "timezone": raw.get("timezone", ""),
            "name": get_location_name(latitude, longitude),
        },
        "current": {
            "time": current["time"],
            "temperature": _num(current["temperature_2m"]),
            "humidity": _num(current["relative_humidity_2m"]),
            "wind_speed": _num(current["wind_speed_10m"]),
            "solar_radiation": _num(current["shortwave_radiation"]),
            "cloud_cover": _num(current.get("cloud_cover")),
            "is_day": bool(current.get("is_day", 1)),
        },
        "forecast": forecast,
        "source": "Open-Meteo",
    }


def _num(value) -> float:
    """Missing values in the API are None; treat them as 0."""
    return round(float(value), 1) if value is not None else 0.0
