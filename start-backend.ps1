# Starts the FastAPI backend (run from the project root in PowerShell)
Set-Location "$PSScriptRoot\backend"
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
if (-not (Test-Path "models\solar_energy_model.joblib")) {
    python train.py
}
python run.py
