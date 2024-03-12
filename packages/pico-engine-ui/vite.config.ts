import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

const publicFolder = path.resolve(__dirname, "..", "pico-engine/public");
const picoEngineBaseUrl = "http://localhost:3000";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: publicFolder,
  server: {
    port: 8080,
    proxy: {
      "/api": picoEngineBaseUrl,
      "/c": picoEngineBaseUrl,
      "/sky": picoEngineBaseUrl,
    },
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "pico-engine-ui.js",
        assetFileNames: "pico-engine-ui.[ext]",
      },
    },
  },
});
