import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Ensures Vite doesn’t switch ports automatically
  },
  optimizeDeps: {
    exclude: ["chunk-UJUSAR4Z.js"],
  },
});
