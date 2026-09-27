// All calls to the FastAPI backend live here.
// In development Vite forwards "/api" to http://127.0.0.1:8000 (see vite.config.js).

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.detail) message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Live weather is fetched directly from the user's browser (Open-Meteo allows
// this and needs no key). The raw response is sent to the backend, which does
// the processing and ML prediction. Cloud servers share IP addresses, so the
// free API often rate-limits them (HTTP 429); the browser does not have that
// problem. If the browser request fails, the backend fetches the weather itself.
// ---------------------------------------------------------------------------
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

async function fetchWeatherInBrowser(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,cloud_cover,is_day",
    hourly: "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation",
    wind_speed_unit: "ms",
    timezone: "auto",
    forecast_days: "2",
  });
  try {
    const response = await fetch(`${OPEN_METEO_URL}?${params}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function fetchPlaceName(latitude, longitude) {
  try {
    const params = new URLSearchParams({ latitude, longitude, localityLanguage: "en" });
    const response = await fetch(`${REVERSE_GEOCODE_URL}?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    const parts = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

async function weatherPayload(latitude, longitude) {
  const [raw_weather, place] = await Promise.all([
    fetchWeatherInBrowser(latitude, longitude),
    fetchPlaceName(latitude, longitude),
  ]);
  return JSON.stringify({ latitude, longitude, raw_weather, place });
}

export const api = {
  health: () => request("/api/health"),

  getWeather: async (latitude, longitude) =>
    request("/api/weather", { method: "POST", body: await weatherPayload(latitude, longitude) }),

  predict: async (latitude, longitude) =>
    request("/api/predict", { method: "POST", body: await weatherPayload(latitude, longitude) }),

  getModelMetrics: () => request("/api/models/metrics"),

  getHistory: () => request("/api/history"),

  getHistoryItem: (id) => request(`/api/history/${id}`),

  deleteHistoryItem: (id) => request(`/api/history/${id}`, { method: "DELETE" }),

  clearHistory: () => request("/api/history", { method: "DELETE" }),
};
