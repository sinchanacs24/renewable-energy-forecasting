import { createContext, useContext, useState } from "react";

// Shares the latest prediction result between the Prediction, Results and
// Detailed Report screens.
const PredictionContext = createContext(null);

export function PredictionProvider({ children }) {
  const [result, setResult] = useState(null);
  return (
    <PredictionContext.Provider value={{ result, setResult }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  return useContext(PredictionContext);
}
