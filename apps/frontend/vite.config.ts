import path from "node:path";

import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner())
        ]
      : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});
