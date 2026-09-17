import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const steps = [
  { n: 1, title: "Detect location", text: "Your browser shares your current position automatically." },
  { n: 2, title: "Collect live weather", text: "Temperature, humidity, wind speed and solar radiation are fetched from a weather API." },
  { n: 3, title: "Run ML models", text: "Trained Random Forest / SVR / Decision Tree / Linear Regression models predict generation." },
  { n: 4, title: "View results", text: "See solar, wind and total energy with charts, insights and a detailed report." },
];

const features = [
  { icon: "☀️", title: "Solar Forecasting", text: "Predicts photovoltaic output from solar radiation, temperature and humidity." },
  { icon: "🌬️", title: "Wind Forecasting", text: "Predicts turbine output from wind speed using a learned power curve." },
  { icon: "📊", title: "Visualisation", text: "Interactive 24-hour charts, model comparison and actual-vs-predicted plots." },
  { icon: "🗄️", title: "History", text: "Every prediction is stored in SQLite so results can be reviewed later." },
];

export default function Home() {
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    api.health().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
  }, []);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 p-8 text-white">
        <p className="text-sm uppercase tracking-wide text-emerald-100">Final Year Project · Dept. of CSE, EWCE</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          AI-Driven Renewable Energy Generation Forecasting
        </h1>
        <p className="mt-3 max-w-2xl text-emerald-50">
          Predict solar, wind and total energy generation for your location using machine learning and
          real-time weather data. No manual data entry needed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/predict" className="btn-primary bg-white text-emerald-700 hover:bg-emerald-50">
            Start Prediction
          </Link>
          <Link to="/weather" className="btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20">
            View Live Weather
          </Link>
        </div>
        <p className="mt-4 text-sm text-emerald-100">
          Backend status:{" "}
          {backendOnline === null ? "checking..." : backendOnline ? "🟢 online" : "🔴 offline (start the FastAPI server)"}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="card">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="card flex gap-4">
              <span className="text-3xl">{f.icon}</span>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-900">Problem statement</h2>
        <p className="mt-2 text-slate-600">
          Renewable energy generation is unpredictable due to changing weather conditions. Accurate prediction
          is needed for efficient energy planning and management. This system uses environmental parameters -
          temperature, humidity, wind speed and solar radiation - to forecast generation, helping reduce energy
          wastage and operational costs.
        </p>
      </section>
    </div>
  );
}
