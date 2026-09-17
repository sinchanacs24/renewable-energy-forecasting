import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Requests starting with /api are forwarded to the FastAPI backend,
// so the frontend code can simply call fetch("/api/...").
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
