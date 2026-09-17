import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { usePrediction } from "../PredictionContext.jsx";
import { EmptyState, ErrorMessage, Loading, PageTitle, formatDateTime } from "../components/ui.jsx";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setResult } = usePrediction();
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await api.getHistory());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function open(id) {
    try {
      setResult(await api.getHistoryItem(id));
      navigate("/results");
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    await api.deleteHistoryItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function clearAll() {
    if (!window.confirm("Delete all saved predictions?")) return;
    await api.clearHistory();
    setItems([]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="History" subtitle="All predictions are stored in the SQLite database." />
        {items.length > 0 && (
          <button className="btn-secondary" onClick={clearAll}>Clear history</button>
        )}
      </div>

      {loading && <Loading />}
      <ErrorMessage message={error} onRetry={load} />

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No predictions saved yet"
          text="Run a prediction and it will appear here."
          action={<Link to="/predict" className="btn-primary">Go to Prediction</Link>}
        />
      )}

      {items.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Date & time</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Temp (°C)</th>
                <th className="px-4 py-3">Humidity (%)</th>
                <th className="px-4 py-3">Wind (m/s)</th>
                <th className="px-4 py-3">Radiation (W/m²)</th>
                <th className="px-4 py-3 text-amber-600">Solar (kWh)</th>
                <th className="px-4 py-3 text-sky-600">Wind (kWh)</th>
                <th className="px-4 py-3 text-emerald-600">Total (kWh)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                  <td className="px-4 py-2">{item.location_name}</td>
                  <td className="px-4 py-2">{item.temperature}</td>
                  <td className="px-4 py-2">{item.humidity}</td>
                  <td className="px-4 py-2">{item.wind_speed}</td>
                  <td className="px-4 py-2">{item.solar_radiation}</td>
                  <td className="px-4 py-2">{item.solar_energy}</td>
                  <td className="px-4 py-2">{item.wind_energy}</td>
                  <td className="px-4 py-2 font-medium">{item.total_energy}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button className="mr-3 text-emerald-600 hover:underline" onClick={() => open(item.id)}>View</button>
                    <button className="text-red-500 hover:underline" onClick={() => remove(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
