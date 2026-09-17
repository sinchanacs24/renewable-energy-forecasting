import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { PredictionProvider } from "./PredictionContext.jsx";
import Home from "./pages/Home.jsx";
import LiveWeather from "./pages/LiveWeather.jsx";
import Prediction from "./pages/Prediction.jsx";
import Results from "./pages/Results.jsx";
import DetailedReport from "./pages/DetailedReport.jsx";
import History from "./pages/History.jsx";

export default function App() {
  return (
    <PredictionProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/weather" element={<LiveWeather />} />
          <Route path="/predict" element={<Prediction />} />
          <Route path="/results" element={<Results />} />
          <Route path="/report" element={<DetailedReport />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Routes>
    </PredictionProvider>
  );
}
