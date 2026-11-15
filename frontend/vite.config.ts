import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: process.env.API_PROXY ?? "http://localhost:8080", changeOrigin: false },
      "/tiles": {
        target: "https://tiles.openfreemap.org",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tiles/, ""),
      },
    },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1200,
  },
});
