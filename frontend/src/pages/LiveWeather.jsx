import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api.js";
import { useGeolocation } from "../useGeolocation.js";
import { ErrorMessage, Loading, PageTitle, StatCard, hourLabel } from "../components/ui.jsx";

export default function LiveWeather() {
  const geo = useGeolocation();
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadWeather = useCallback(async () => {
    if (!geo.position) return;
    setLoading(true);
    setError("");
    try {
      setWeather(await api.getWeather(geo.position.latitude, geo.position.longitude));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [geo.position]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const chartData = weather?.forecast.map((h) => ({ ...h, hour: hourLabel(h.time) })) || [];

  return (
    <div>
      <PageTitle
        title="Live Weather"
        subtitle="Real-time weather at your current location. These values are the inputs to the ML models."
      />

      {geo.loading && <Loading text="Detecting your location..." />}
      <ErrorMessage message={geo.error} onRetry={geo.locate} />
      {loading && <Loading text="Fetching weather data..." />}
      <ErrorMessage message={error} onRetry={loadWeather} />

      {weather && !loading && (
        <div className="space-y-6">
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Location</p>
              <p className="text-lg font-semibold">📍 {weather.location.name}</p>
              <p className="text-xs text-slate-500">
                {weather.location.latitude.toFixed(3)}, {weather.location.longitude.toFixed(3)} · {weather.location.timezone} ·
                Updated {hourLabel(weather.current.time)} · Source: {weather.source}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={loadWeather}>Refresh</button>
              <Link to="/predict" className="btn-primary">Predict Energy</Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Temperature" value={weather.current.temperature} unit="°C" icon="🌡️" />
            <StatCard label="Humidity" value={weather.current.humidity} unit="%" icon="💧" />
            <StatCard label="Wind Speed" value={weather.current.wind_speed} unit="m/s" icon="🌬️" />
            <StatCard label="Solar Radiation" value={weather.current.solar_radiation} unit="W/m²" icon="☀️" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Cloud Cover" value={weather.current.cloud_cover} unit="%" icon="☁️" />
            <StatCard label="Daylight" value={weather.current.is_day ? "Day" : "Night"} icon={weather.current.is_day ? "🌤️" : "🌙"} />
          </div>

          <div className="card">
            <h2 className="mb-4 font-semibold">Next 24 hours - Temperature & Wind Speed</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#ef4444" dot={false} />
                <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="wind_speed" name="Wind speed (m/s)" stroke="#0ea5e9" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="mb-4 font-semibold">Next 24 hours - Solar Radiation & Humidity</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="solar_radiation" name="Solar radiation (W/m²)" stroke="#f59e0b" dot={false} />
                <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#6366f1" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
