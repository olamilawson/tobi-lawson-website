// The owner's desk: the personal agent's page, served at tobilawson.com/desk/.
// Source lives here (agent/ui, which nginx never serves); `npm run build` writes
// the page to ../../desk, which is committed and served as static files.
// In development the API runs on 127.0.0.1:8200 and the dev server forwards
// /api/agent/ to it, the same path nginx uses in production.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/desk/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "../../desk", emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      "/api/agent": {
        target: "http://127.0.0.1:8200",
        rewrite: (path) => path.replace(/^\/api\/agent/, ""),
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api/agent": {
        target: "http://127.0.0.1:8200",
        rewrite: (path) => path.replace(/^\/api\/agent/, ""),
      },
    },
  },
});
