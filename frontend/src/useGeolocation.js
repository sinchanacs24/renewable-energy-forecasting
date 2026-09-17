import { useCallback, useEffect, useState } from "react";

// Asks the browser for the user's current position. No manual input needed.
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLoading(false);
      },
      (err) => {
        const messages = {
          1: "Location permission was denied. Please allow location access in your browser and try again.",
          2: "Your location could not be determined right now.",
          3: "Finding your location took too long. Please try again.",
        };
        setError(messages[err.code] || err.message);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { position, error, loading, locate };
}
