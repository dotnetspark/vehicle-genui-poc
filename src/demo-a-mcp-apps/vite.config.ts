import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import type { Plugin } from "vite";

/**
 * After the bundle is written, compute a 16-char SHA-256 prefix of
 * dist/mcp-app.html and write dist/resource-uri.json.  The MCP server reads
 * this file at startup so the registered resource URI is content-addressed
 * and changes automatically when the bundle changes.
 */
function writeResourceUri(): Plugin {
  return {
    name: "write-resource-uri",
    closeBundle() {
      const htmlPath = path.resolve("dist", "mcp-app.html");
      if (!fs.existsSync(htmlPath)) return;
      const content = fs.readFileSync(htmlPath);
      const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);
      const uri = `ui://vehicle/chart-renderer/${hash}.html`;
      fs.writeFileSync(
        path.resolve("dist", "resource-uri.json"),
        JSON.stringify({ uri, hash, htmlFile: "mcp-app.html" }, null, 2) + "\n"
      );
      console.log(`[write-resource-uri] ${uri}`);
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