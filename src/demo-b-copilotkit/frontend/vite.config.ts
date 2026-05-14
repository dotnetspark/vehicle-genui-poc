import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    fs: {
      // Allow serving files from src/shared (one level up from src/demo-b-copilotkit/frontend)
      allow: [".", "../../shared", "../"],
    },
  },
});
