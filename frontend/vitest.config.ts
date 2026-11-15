import { defineConfig } from "vitest/config";

// Unit tests run without the React Router Vite plugin.
export default defineConfig({
  test: { include: ["test/**/*.test.ts"], environment: "node" },
});
