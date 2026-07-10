/// <reference types="vitest" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em dev a API é servida same-origin (/api) — cookie de sessão vira
    // first-party e sobrevive a reload em localhost E 127.0.0.1.
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: false },
      "/media": { target: "http://127.0.0.1:8000", changeOrigin: false },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa vendors estáveis do código do app — cache de longo prazo melhor.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["gsap", "lenis"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
        "src/design/**",
        "src/**/README.md",
      ],
      thresholds: {
        statements: 95,
        lines: 95,
        functions: 85,
        branches: 80,
      },
    },
  },
});
