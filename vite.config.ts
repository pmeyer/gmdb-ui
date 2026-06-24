/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl =
    "VITE_API_BASE_URL" in env && env.VITE_API_BASE_URL.trim().length > 0
      ? env.VITE_API_BASE_URL
      : "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/graphql": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
        "/resources": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./src/test/setup.ts"],
      testTimeout: 20000,
    },
  };
});
