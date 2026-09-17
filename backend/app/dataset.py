"""
Step 1 of the methodology - Data Collection.

Creates the historical dataset used to train the models. The dataset contains
the four environmental parameters from the project specification
(temperature, humidity, wind speed, solar radiation) and the energy generated
by a reference 100 kW solar plant and a 100 kW wind turbine.

The energy values follow standard physics of PV panels and wind turbines
with random noise added, which produces the realistic non-linear patterns
that the machine learning models must learn.
A few missing values and outliers are deliberately included so that the
preprocessing step has real work to do.
"""
import numpy as np
import pandas as pd

from .config import (
    DATASET_PATH,
    DATA_DIR,
    SOLAR_PLANT_CAPACITY_KW,
    WIND_PLANT_CAPACITY_KW,
)


def solar_energy_kwh(radiation: np.ndarray, temperature: np.ndarray, humidity: np.ndarray) -> np.ndarray:
    """Energy (kWh in one hour) produced by the reference solar plant."""
    # PV output is proportional to radiation (W/m^2) relative to the 1000 W/m^2 standard.
    base = SOLAR_PLANT_CAPACITY_KW * (radiation / 1000.0)
    # Panels get hotter than the air; efficiency drops about 0.4 % per degree above 25 C.
    cell_temperature = temperature + radiation * 0.03
    temperature_factor = 1 - 0.004 * (cell_temperature - 25)
    # High humidity (haze, moisture on panels) slightly reduces output.
    humidity_factor = 1 - 0.0008 * np.clip(humidity - 40, 0, None)
    energy = base * temperature_factor * humidity_factor
    return np.clip(energy, 0, None)


def wind_energy_kwh(wind_speed: np.ndarray, temperature: np.ndarray) -> np.ndarray:
    """Energy (kWh in one hour) produced by the reference wind turbine."""
    cut_in, rated, cut_out = 3.0, 12.0, 25.0
    # Standard turbine power curve: zero below cut-in, cubic rise to rated, flat until cut-out.
    fraction = (wind_speed**3 - cut_in**3) / (rated**3 - cut_in**3)
    fraction = np.clip(fraction, 0, 1)
    fraction = np.where(wind_speed < cut_in, 0, fraction)
    fraction = np.where(wind_speed > cut_out, 0, fraction)
    # Colder air is denser and gives slightly more power.
    density_factor = 288.15 / (273.15 + temperature)
    return WIND_PLANT_CAPACITY_KW * fraction * density_factor


def generate_dataset(n_rows: int = 6000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    hour = rng.integers(0, 24, n_rows)
    # Daylight profile: radiation follows a bell shape peaking at noon.
    daylight = np.clip(np.sin(np.pi * (hour - 6) / 12), 0, None)
    cloudiness = rng.uniform(0, 1, n_rows)
    solar_radiation = 1000 * daylight * (1 - 0.75 * cloudiness) + rng.normal(0, 15, n_rows)
    solar_radiation = np.clip(solar_radiation, 0, 1100)

    temperature = 24 + 9 * daylight - 4 * cloudiness + rng.normal(0, 3, n_rows)
    humidity = np.clip(60 + 25 * cloudiness - 10 * daylight + rng.normal(0, 8, n_rows), 10, 100)
    wind_speed = np.clip(rng.weibull(2.0, n_rows) * 6.5, 0, 28)

    solar_energy = solar_energy_kwh(solar_radiation, temperature, humidity)
    wind_energy = wind_energy_kwh(wind_speed, temperature)

    # Measurement noise so that the relationship is not perfectly deterministic.
    solar_energy = np.clip(solar_energy + rng.normal(0, 2.0, n_rows), 0, None)
    wind_energy = np.clip(wind_energy + rng.normal(0, 2.0, n_rows), 0, None)

    df = pd.DataFrame(
        {
            "temperature": temperature.round(2),
            "humidity": humidity.round(2),
            "wind_speed": wind_speed.round(2),
            "solar_radiation": solar_radiation.round(2),
            "solar_energy": solar_energy.round(3),
            "wind_energy": wind_energy.round(3),
        }
    )

    # Inject imperfections that real collected data has (handled by preprocessing).
    missing_index = rng.choice(n_rows, size=int(0.01 * n_rows), replace=False)
    df.loc[missing_index, "humidity"] = np.nan
    outlier_index = rng.choice(n_rows, size=int(0.003 * n_rows), replace=False)
    df.loc[outlier_index, "wind_speed"] = 95.0  # impossible sensor reading

    return df


def create_dataset_file() -> pd.DataFrame:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = generate_dataset()
    df.to_csv(DATASET_PATH, index=False)
    print(f"Dataset written to {DATASET_PATH} ({len(df)} rows)")
    return df


if __name__ == "__main__":
    create_dataset_file()
