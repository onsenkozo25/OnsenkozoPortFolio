import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": '"production"'
  },
  build: {
    outDir: path.resolve(__dirname, "..", "public", "works-viewer"),
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, "src", "viewer.jsx"),
      name: "WorksViewer",
      formats: ["iife"],
      fileName: () => "viewer.js"
    },
    rollupOptions: {
      output: {
        assetFileNames: "viewer.[ext]"
      }
    }
  }
});
