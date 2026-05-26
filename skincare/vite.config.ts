import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const BASE = "/summer/skincare/";

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  server: {
    proxy: {
      [`${BASE}api`]: {
        target: "http://localhost:8787",
        rewrite: (path) => path.replace(BASE, "/"),
      },
    },
  },
});
