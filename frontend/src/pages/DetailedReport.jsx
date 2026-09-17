import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import {
  ActualVsPredictedChart, FeatureImportanceChart, HourlyEnergyChart, ModelComparisonChart,
} from "../components/EnergyCharts.jsx";
import { EmptyState, ErrorMessage, Loading, PageTitle, StatCard, formatDateTime, hourLabel } from "../components/ui.jsx";
import { useLatestResult } from "../useLatestResult.js";

const targetInfo = {
  solar_energy: { title: "Solar energy model", color: "#f59e0b" },
  wind_energy: { title: "Wind energy model", color: "#0ea5e9" },
};

export default function DetailedReport() {
  const { result, loading } = useLatestResult();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getModelMetrics().then(setMetrics).catch((e) => setError(e.message));
  }, []);

  if (loading) return <Loading text="Loading report..." />;
  if (!result) {
    return (
      <EmptyState
        title="No prediction to report"
        text="Run a prediction first, then come back for the detailed report."
        action={<Link to="/predict" className="btn-primary">Go to Prediction</Link>}
      />
    );
  }

  const { weather, prediction, summary, insights, models, hourly } = result;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Detailed Report"
          subtitle={`${weather.location.name}${result.created_at ? " · " + formatDateTime(result.created_at) : ""}`}
        />
        <button className="btn-secondary print:hidden" onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* 1. Summary */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">1. Summary of results</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Solar (now)" value={prediction.solar_energy} unit="kWh" color="text-amber-600" />
          <StatCard label="Wind (now)" value={prediction.wind_energy} unit="kWh" color="text-sky-600" />
          <StatCard label="Total (now)" value={prediction.total_energy} unit="kWh" color="text-emerald-600" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Solar (24 h)" value={summary.solar_energy_24h} unit="kWh" />
          <StatCard label="Wind (24 h)" value={summary.wind_energy_24h} unit="kWh" />
          <StatCard label="Total (24 h)" value={summary.total_energy_24h} unit="kWh" />
          <StatCard label="Capacity factor" value={summary.capacity_factor_percent} unit="%" />
        </div>
      </section>

      {/* 2. Cost / efficiency insights */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">2. Cost & efficiency insights</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Estimated grid cost saved (24 h)" value={`₹${summary.estimated_savings_inr}`} icon="💰" />
          <StatCard label="CO₂ emissions avoided (24 h)" value={summary.co2_avoided_kg} unit="kg" icon="🌱" />
          <StatCard label="Homes powered for a day" value={summary.homes_powered} icon="🏠" />
        </div>
        <p className="text-xs text-slate-500">
          Assumptions: grid tariff ₹7/kWh, emission factor 0.82 kg CO₂/kWh, household use 10 kWh/day.
        </p>
      </section>

      {/* 3. Inputs */}
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">3. Input parameters (from weather API)</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b"><td className="py-2 text-slate-500">Location</td><td className="py-2 font-medium">{weather.location.name} ({weather.location.latitude.toFixed(3)}, {weather.location.longitude.toFixed(3)})</td></tr>
            <tr className="border-b"><td className="py-2 text-slate-500">Weather time</td><td className="py-2 font-medium">{weather.current.time.replace("T", " ")} ({weather.location.timezone})</td></tr>
            <tr className="border-b"><td className="py-2 text-slate-500">Temperature</td><td className="py-2 font-medium">{weather.current.temperature} °C</td></tr>
            <tr className="border-b"><td className="py-2 text-slate-500">Humidity</td><td className="py-2 font-medium">{weather.current.humidity} %</td></tr>
            <tr className="border-b"><td className="py-2 text-slate-500">Wind speed</td><td className="py-2 font-medium">{weather.current.wind_speed} m/s</td></tr>
            <tr className="border-b"><td className="py-2 text-slate-500">Solar radiation</td><td className="py-2 font-medium">{weather.current.solar_radiation} W/m²</td></tr>
            <tr><td className="py-2 text-slate-500">Data source</td><td className="py-2 font-medium">{weather.source}</td></tr>
          </tbody>
        </table>
      </section>

      {/* 4. Forecast chart + table */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">4. 24-hour forecast</h2>
        <div className="card">
          <HourlyEnergyChart hourly={hourly} />
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Hour</th><th>Temp (°C)</th><th>Humidity (%)</th><th>Wind (m/s)</th><th>Radiation (W/m²)</th>
                <th className="text-amber-600">Solar (kWh)</th><th className="text-sky-600">Wind (kWh)</th><th className="text-emerald-600">Total (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {hourly.map((h) => (
                <tr key={h.time} className="border-t">
                  <td className="py-1.5">{hourLabel(h.time)}</td><td>{h.temperature}</td><td>{h.humidity}</td><td>{h.wind_speed}</td><td>{h.solar_radiation}</td>
                  <td>{h.solar_energy}</td><td>{h.wind_energy}</td><td className="font-medium">{h.total_energy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Model evaluation */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">5. Model evaluation (MAE, RMSE, R²)</h2>
        <ErrorMessage message={error} />
        {!metrics && !error && <Loading text="Loading model metrics..." />}
        {metrics && (
          <>
            <p className="text-sm text-slate-600">
              Dataset: {metrics.data.rows_collected} rows collected, {metrics.data.rows_removed} removed during cleaning,
              {" "}{metrics.data.training_rows} used for training (80 %) and {metrics.data.test_rows} for testing (20 %).
              Best model is selected by the highest R² score.
            </p>
            {Object.entries(metrics.targets).map(([target, info]) => (
              <div key={target} className="card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{targetInfo[target].title}</h3>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                    Best model: {info.best_model}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr><th className="py-2">Algorithm</th><th>MAE</th><th>RMSE</th><th>R²</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(info.metrics).map(([name, m]) => (
                      <tr key={name} className={`border-t ${name === info.best_model ? "bg-emerald-50 font-medium" : ""}`}>
                        <td className="py-1.5">{name}</td><td>{m.mae}</td><td>{m.rmse}</td><td>{m.r2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="min-w-0">
                    <p className="mb-2 text-sm font-medium text-slate-600">R² comparison</p>
                    <ModelComparisonChart metrics={info.metrics} />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-2 text-sm font-medium text-slate-600">Actual vs predicted (test data, {info.best_model})</p>
                    <ActualVsPredictedChart points={info.actual_vs_predicted.slice(0, 25)} color={targetInfo[target].color} />
                  </div>
                </div>
                {info.feature_importance && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-600">Feature importance</p>
                    <FeatureImportanceChart importance={info.feature_importance} />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </section>

      {/* 6. Insights */}
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">6. Insights & recommendations</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {insights.map((text) => (
            <li key={text} className="flex gap-2"><span>💡</span><span>{text}</span></li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Models in use - Solar: {models.solar} · Wind: {models.wind}. Trained on {metrics ? new Date(metrics.trained_at).toLocaleDateString() : "..."}.
        </p>
      </section>
    </div>
  );
}
