import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// ✅ Bible Quest for Kids — unified config for MAUI + WebView integration
export default defineConfig({
  plugins: [react()],
  root: ".", // project root for npm run build
  base: "./", // ensures relative paths work inside MAUI wwwroot
  build: {
    outDir: "dist", // must match workflow path
    emptyOutDir: true,
    assetsDir: "assets",
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