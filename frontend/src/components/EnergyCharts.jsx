import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { hourLabel } from "./ui.jsx";

const COLORS = { solar: "#f59e0b", wind: "#0ea5e9", total: "#10b981" };

// Stacked area chart of the predicted solar + wind energy for the next 24 hours.
export function HourlyEnergyChart({ hourly }) {
  const data = hourly.map((h) => ({ ...h, hour: hourLabel(h.time) }));
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={280}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="hour" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(v) => `${v} kWh`} />
        <Legend />
        <Area isAnimationActive={false} type="monotone" dataKey="solar_energy" name="Solar" stackId="1" stroke={COLORS.solar} fill={COLORS.solar} fillOpacity={0.6} />
        <Area isAnimationActive={false} type="monotone" dataKey="wind_energy" name="Wind" stackId="1" stroke={COLORS.wind} fill={COLORS.wind} fillOpacity={0.6} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Pie chart of the solar vs wind share over 24 hours.
export function EnergyMixChart({ summary }) {
  const data = [
    { name: "Solar", value: summary.solar_energy_24h, color: COLORS.solar },
    { name: "Wind", value: summary.wind_energy_24h, color: COLORS.wind },
  ];
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={240}>
      <PieChart>
        <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v} kWh`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Bar chart comparing the R2 score of the four algorithms.
export function ModelComparisonChart({ metrics }) {
  const data = Object.entries(metrics).map(([name, m]) => ({ name, r2: m.r2, rmse: m.rmse }));
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis domain={[0, 1]} fontSize={12} />
        <Tooltip />
        <Bar isAnimationActive={false} dataKey="r2" name="R² score" fill={COLORS.total} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Actual vs predicted values on the test data for the selected best model.
export function ActualVsPredictedChart({ points, color }) {
  const data = points.map((p, i) => ({ index: i + 1, ...p }));
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="index" fontSize={12} label={{ value: "Test sample", position: "insideBottom", offset: -2, fontSize: 12 }} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar isAnimationActive={false} dataKey="actual" name="Actual" fill="#94a3b8" />
        <Bar isAnimationActive={false} dataKey="predicted" name="Predicted" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Horizontal bars of feature importance (tree-based models only).
export function FeatureImportanceChart({ importance }) {
  const labels = { temperature: "Temperature", humidity: "Humidity", wind_speed: "Wind speed", solar_radiation: "Solar radiation" };
  const data = Object.entries(importance).map(([f, v]) => ({ name: labels[f] || f, value: Math.round(v * 1000) / 10 }));
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" unit="%" fontSize={12} />
        <YAxis type="category" dataKey="name" width={110} fontSize={12} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar isAnimationActive={false} dataKey="value" name="Importance" fill="#6366f1" />
      </BarChart>
    </ResponsiveContainer>
  );
}
