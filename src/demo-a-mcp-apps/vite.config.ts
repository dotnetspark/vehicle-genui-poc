import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Vite plugin: after the bundle is written, SHA-256 hash `dist/mcp-app.html`
 * and persist the content-addressed URI to `dist/resource-uri.json`.
 *
 * The server reads this manifest at boot so every server restart
 * automatically picks up a fresh content-addressed URI for the latest build.
 */
function writeResourceUri(): Plugin {
  return {
    name: "write-resource-uri",
    apply: "build",
    closeBundle() {
      const outDir = join(process.cwd(), "dist");
      const htmlPath = join(outDir, "mcp-app.html");
      let hash: string;
      try {
        const html = readFileSync(htmlPath);
        hash = createHash("sha256").update(html).digest("hex").slice(0, 12);
      } catch {
        // If the file doesn't exist yet (e.g., non-HTML entry point), skip.
        return;
      }
      const resourceUri = `ui://vehicle/chart-renderer/mcp-app.${hash}.html`;
      writeFileSync(
        join(outDir, "resource-uri.json"),
        JSON.stringify({ resourceUri }, null, 2) + "\n",
        "utf8"
      );
      console.log(`[write-resource-uri] wrote ${resourceUri}`);
    },
  };
}

export default defineConfig({
  plugins: [viteSingleFile(), writeResourceUri()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: process.env.INPUT,
    },
  },
});
