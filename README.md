# AI-Driven Renewable Energy Generation Forecasting using Machine Learning Techniques

Final-year project, Department of CSE, East West College of Engineering (VTU).

The system predicts **solar, wind and total energy generation** for the user's
current location. The browser detects the location automatically, live weather
(temperature, humidity, wind speed, solar radiation) is fetched from a weather
API, and trained scikit-learn models predict the energy output. Nothing is
entered manually.

## Tech stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS + Recharts                |
| Backend   | Python 3.10+ + FastAPI + Uvicorn                        |
| ML        | scikit-learn (Linear Regression, Decision Tree, Random Forest, SVR), pandas, NumPy |
| Database  | SQLite (prediction history)                             |
| Weather   | Open-Meteo API (free, no API key required)               |

## Project structure

```
renewable-energy-forecasting/
├── backend/
│   ├── app/
│   │   ├── config.py         # paths and constants
│   │   ├── dataset.py        # 1. Data collection (creates the training dataset)
│   │   ├── preprocessing.py  # 2-3. Cleaning, feature selection, 80/20 split
│   │   ├── models.py         # 4-6. Train 4 algorithms, evaluate (MAE/RMSE/R2), save best
│   │   ├── weather.py        # Weather API integration (Open-Meteo)
│   │   ├── predictor.py      # 7-8. Prediction engine + output/insights
│   │   ├── database.py       # SQLite history
│   │   └── main.py           # FastAPI endpoints
│   ├── data/                 # dataset CSV + predictions.db (created automatically)
│   ├── models/               # saved models + metrics.json (created by train.py)
│   ├── tests/test_api.py     # backend tests (pytest)
│   ├── train.py              # run once to train the models
│   ├── run.py                # start the API server
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/            # Home, LiveWeather, Prediction, Results, DetailedReport, History
    │   ├── components/       # Layout, charts, small UI pieces
    │   ├── api.js            # all backend calls
    │   ├── useGeolocation.js # browser geolocation hook
    │   └── App.jsx           # routes
    ├── index.html
    ├── vite.config.js        # proxies /api -> http://127.0.0.1:8000
    └── package.json
```

## How to run (Windows / VS Code)

Requirements: Python 3.10 or newer, Node.js 18 or newer.

### 1. Backend (terminal 1)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train.py        # creates the dataset, trains and evaluates the models (~15 s)
python run.py          # starts the API at http://localhost:8000
```

API documentation: http://localhost:8000/docs

### 2. Frontend (terminal 2)

```powershell
cd frontend
npm install
npm run dev            # opens http://localhost:5173
```

Open http://localhost:5173 in the browser and **allow location access** when
asked. Then go to **Prediction → Predict Energy Generation**.

On Linux/macOS use `source venv/bin/activate` instead of the Activate.ps1 line.

### Run the backend tests

```powershell
cd backend
pytest
```

## How it works (methodology from the project report)

1. **Data collection** – `dataset.py` builds a 6000-row historical dataset of the
   four environmental parameters and the energy produced by a reference
   100 kW solar plant and 100 kW wind turbine (physics-based with noise).
   Live inputs come from the Open-Meteo weather API.
2. **Data preprocessing** – missing values and impossible sensor readings are
   removed; features are scaled with `StandardScaler` inside each model pipeline.
3. **Feature selection** – temperature, humidity, wind speed, solar radiation.
4. **Model training** – Linear Regression, Decision Tree, Random Forest and SVR
   are trained on 80 % of the data, separately for solar and wind energy.
5. **Model evaluation** – MAE, RMSE and R² on the 20 % test data.
6. **Best model selection** – the model with the highest R² is saved with joblib.
7. **Prediction** – the saved models predict solar, wind and total kWh for the
   current weather and for each of the next 24 hours.
8. **Web integration** – FastAPI serves the predictions; the React app displays
   them with charts, insights, a detailed report and history.

## API endpoints

| Method | Endpoint                  | Description                                  |
|--------|---------------------------|----------------------------------------------|
| GET    | /api/health               | Server status                                |
| GET    | /api/weather?lat=&lon=    | Live weather + 24 h forecast for coordinates |
| POST   | /api/predict              | `{latitude, longitude}` → full prediction    |
| GET    | /api/models/metrics       | Model evaluation report                      |
| GET    | /api/history              | Saved predictions                            |
| GET    | /api/history/{id}         | One saved prediction                         |
| DELETE | /api/history/{id}         | Delete one prediction                        |
| DELETE | /api/history              | Clear history                                |

## Screens

- **Home** – overview, how it works, backend status.
- **Live Weather** – current values and 24 h weather charts for your location.
- **Prediction** – one button; runs the whole pipeline.
- **Results** – solar / wind / total now, 24 h generation chart, energy mix, insights, CSV/JSON download.
- **Detailed Report** – summary, cost & CO₂ insights, inputs, hourly table, model comparison (MAE/RMSE/R²), actual-vs-predicted, feature importance; printable.
- **History** – every prediction stored in SQLite; view or delete.

## Notes

- Predicted energy is in kWh per hour for the reference plant (100 kW solar + 100 kW wind). Change the capacities in `backend/app/config.py` and re-run `python train.py` to model a different plant.
- If the browser blocks location access, allow it in the address-bar site settings and press "Try again".
