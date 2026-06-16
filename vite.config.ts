import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Gym Tracker",
        short_name: "Gym",
        description: "Особистий трекер тренувань",
        theme_color: "#0C0C0E",
        background_color: "#0C0C0E",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        lang: "uk",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return
          if (id.includes("/react/") || id.includes("/react-dom/")) {
            return "react"
          }
          if (id.includes("@supabase")) return "supabase"
          if (id.includes("recharts") || id.includes("d3-")) return "charts"
          if (
            id.includes("framer-motion") ||
            id.includes("@radix-ui") ||
            id.includes("@dnd-kit") ||
            id.includes("lucide-react")
          ) {
            return "ui"
          }
          return "vendor"
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
  },
})
