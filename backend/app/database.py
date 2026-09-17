"""
SQLite database used to store every prediction (History screen).
"""
import json
import sqlite3
from datetime import datetime, timezone

from .config import DATABASE_PATH, DATA_DIR


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                location_name TEXT,
                latitude REAL,
                longitude REAL,
                temperature REAL,
                humidity REAL,
                wind_speed REAL,
                solar_radiation REAL,
                solar_energy REAL,
                wind_energy REAL,
                total_energy REAL,
                details_json TEXT
            )
            """
        )


def save_prediction(result: dict) -> int:
    """Store a full prediction result and return its database id."""
    weather = result["weather"]["current"]
    location = result["weather"]["location"]
    prediction = result["prediction"]
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO predictions (
                created_at, location_name, latitude, longitude,
                temperature, humidity, wind_speed, solar_radiation,
                solar_energy, wind_energy, total_energy, details_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                location["name"],
                location["latitude"],
                location["longitude"],
                weather["temperature"],
                weather["humidity"],
                weather["wind_speed"],
                weather["solar_radiation"],
                prediction["solar_energy"],
                prediction["wind_energy"],
                prediction["total_energy"],
                json.dumps(result),
            ),
        )
        return cursor.lastrowid


def list_predictions(limit: int = 50) -> list:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, location_name, latitude, longitude,
                   temperature, humidity, wind_speed, solar_radiation,
                   solar_energy, wind_energy, total_energy
            FROM predictions ORDER BY id DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_prediction(prediction_id: int):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, created_at, details_json FROM predictions WHERE id = ?", (prediction_id,)
        ).fetchone()
    if row is None:
        return None
    details = json.loads(row["details_json"])
    details["id"] = row["id"]
    details["created_at"] = row["created_at"]
    return details


def delete_prediction(prediction_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
        return cursor.rowcount > 0


def clear_predictions():
    with get_connection() as conn:
        conn.execute("DELETE FROM predictions")
