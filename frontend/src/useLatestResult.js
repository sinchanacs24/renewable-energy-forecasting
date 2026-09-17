import { useEffect, useState } from "react";
import { api } from "./api.js";
import { usePrediction } from "./PredictionContext.jsx";

// Returns the prediction to display on the Results / Detailed Report screens.
// Uses the result from the current session; if there is none (e.g. page was
// refreshed) it loads the most recent prediction from the history database.
export function useLatestResult() {
  const { result, setResult } = usePrediction();
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (result) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await api.getHistory();
        if (history.length > 0 && !cancelled) {
          setResult(await api.getHistoryItem(history[0].id));
        }
      } catch {
        // backend offline or empty history - the page shows an empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result, setResult]);

  return { result, loading };
}

// Downloads any text as a file from the browser.
export function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function hourlyToCsv(hourly) {
  const header = "time,temperature,humidity,wind_speed,solar_radiation,solar_energy,wind_energy,total_energy";
  const rows = hourly.map((h) =>
    [h.time, h.temperature, h.humidity, h.wind_speed, h.solar_radiation, h.solar_energy, h.wind_energy, h.total_energy].join(",")
  );
  return [header, ...rows].join("\n");
}
