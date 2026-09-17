import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { usePrediction } from "../PredictionContext.jsx";
import { useGeolocation } from "../useGeolocation.js";
import { ErrorMessage, Loading, PageTitle } from "../components/ui.jsx";

const pipeline = [
  "Detect location via browser geolocation",
  "Fetch live weather (temperature, humidity, wind speed, solar radiation)",
  "Pre-process and scale the inputs",
  "Run the trained solar and wind models",
  "Generate 24-hour forecast, summary and insights",
  "Save the result to the history database",
];

export default function Prediction() {
  const geo = useGeolocation();
  const { setResult } = usePrediction();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function runPrediction() {
    if (!geo.position) return;
    setRunning(true);
    setError("");
    try {
      const result = await api.predict(geo.position.latitude, geo.position.longitude);
      setResult(result);
      navigate("/results");
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        title="Prediction"
        subtitle="One click: the system collects live weather for your location and runs the ML models."
      />

      <div className="card space-y-5">
        <div>
          <p className="text-sm text-slate-500">Your location</p>
          {geo.loading && <Loading text="Detecting your location..." />}
          <ErrorMessage message={geo.error} onRetry={geo.locate} />
          {geo.position && (
            <p className="mt-1 font-medium">
              📍 {geo.position.latitude}, {geo.position.longitude}
              <span className="ml-2 text-xs text-slate-500">(accuracy ≈ {geo.position.accuracy} m)</span>
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-500">What happens when you press Predict</p>
          <ol className="space-y-1 text-sm text-slate-700">
            {pipeline.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-semibold text-emerald-600">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>

        <ErrorMessage message={error} />

        <button className="btn-primary w-full" onClick={runPrediction} disabled={!geo.position || running}>
          {running ? "Running prediction..." : "⚡ Predict Energy Generation"}
        </button>

        <p className="text-xs text-slate-500">
          Predictions are for a reference plant of 100 kW solar + 100 kW wind capacity. Weather values are never
          entered manually - they come directly from the weather API.
        </p>
      </div>
    </div>
  );
}
