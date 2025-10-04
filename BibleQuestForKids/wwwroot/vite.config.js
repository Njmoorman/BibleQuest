import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",             // same directory as index.html
  base: "./",            // relative paths for MAUI embedding
  build: {
    outDir: "dist",
    emptyOutDir: true,
    manifest: true,      // 👈 required for index.html manifest lookup
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js"
      }
    }
  },
  server: {
    port: 5173,
    open: false
  },
  preview: {
    port: 4173
  }
});