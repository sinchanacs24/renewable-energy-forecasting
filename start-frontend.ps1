# Starts the React frontend (run from the project root in PowerShell)
Set-Location "$PSScriptRoot\frontend"
if (-not (Test-Path "node_modules")) {
    npm install
}
npm run dev
