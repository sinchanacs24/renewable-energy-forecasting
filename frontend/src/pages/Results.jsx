import { Link } from "react-router-dom";
import { EnergyMixChart, HourlyEnergyChart } from "../components/EnergyCharts.jsx";
import { EmptyState, Loading, PageTitle, StatCard, formatDateTime, hourLabel } from "../components/ui.jsx";
import { downloadFile, hourlyToCsv, useLatestResult } from "../useLatestResult.js";

export default function Results() {
  const { result, loading } = useLatestResult();

  if (loading) return <Loading text="Loading results..." />;
  if (!result) {
    return (
      <EmptyState
        title="No prediction yet"
        text="Run a prediction to see the results here."
        action={<Link to="/predict" className="btn-primary">Go to Prediction</Link>}
      />
    );
  }

  const { weather, prediction, summary, insights, models } = result;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Results"
        subtitle={`Prediction for ${weather.location.name}${result.created_at ? " · " + formatDateTime(result.created_at) : ""}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Solar Energy (now)" value={prediction.solar_energy} unit="kWh" icon="☀️" color="text-amber-600" />
        <StatCard label="Wind Energy (now)" value={prediction.wind_energy} unit="kWh" icon="🌬️" color="text-sky-600" />
        <StatCard label="Total Energy (now)" value={prediction.total_energy} unit="kWh" icon="⚡" color="text-emerald-600" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Weather inputs used</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <p>🌡️ Temperature: <b>{weather.current.temperature} °C</b></p>
          <p>💧 Humidity: <b>{weather.current.humidity} %</b></p>
          <p>🌬️ Wind speed: <b>{weather.current.wind_speed} m/s</b></p>
          <p>☀️ Solar radiation: <b>{weather.current.solar_radiation} W/m²</b></p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Models used - Solar: {models.solar} · Wind: {models.wind} · Values are hourly energy for a 100 kW solar + 100 kW wind reference plant.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card min-w-0 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Next 24 hours - predicted generation</h2>
          <HourlyEnergyChart hourly={result.hourly} />
        </div>
        <div className="card min-w-0">
          <h2 className="mb-3 font-semibold">24-hour energy mix</h2>
          <EnergyMixChart summary={summary} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total (24 h)" value={summary.total_energy_24h} unit="kWh" icon="⚡" />
        <StatCard label="Peak hour" value={summary.peak_hour ? hourLabel(summary.peak_hour) : "-"} icon="📈" />
        <StatCard label="Peak generation" value={summary.peak_energy} unit="kWh" icon="🔝" />
        <StatCard label="Capacity factor" value={summary.capacity_factor_percent} unit="%" icon="🏭" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Insights & recommendations</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {insights.map((text) => (
            <li key={text} className="flex gap-2">
              <span>💡</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/report" className="btn-primary">View Detailed Report</Link>
        <button className="btn-secondary" onClick={() => downloadFile("forecast_24h.csv", hourlyToCsv(result.hourly), "text/csv")}>
          Download CSV
        </button>
        <button className="btn-secondary" onClick={() => downloadFile("prediction.json", JSON.stringify(result, null, 2), "application/json")}>
          Download JSON
        </button>
        <Link to="/predict" className="btn-secondary">Run again</Link>
      </div>
    </div>
  );
}
