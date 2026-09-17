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

export const api = {
  health: () => request("/api/health"),

  getWeather: (latitude, longitude) =>
    request(`/api/weather?lat=${latitude}&lon=${longitude}`),

  predict: (latitude, longitude) =>
    request("/api/predict", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }),

  getModelMetrics: () => request("/api/models/metrics"),

  getHistory: () => request("/api/history"),

  getHistoryItem: (id) => request(`/api/history/${id}`),

  deleteHistoryItem: (id) => request(`/api/history/${id}`, { method: "DELETE" }),

  clearHistory: () => request("/api/history", { method: "DELETE" }),
};
