/**
 * Content-addressed resource URI resolution for Demo A.
 *
 * Priority:
 *   1. dist/resource-uri.json  — written by the `write-resource-uri` Vite plugin
 *      at build time; most accurate.
 *   2. Runtime SHA-256 of dist/mcp-app.html — used when the server is started
 *      without a fresh build.
 *   3. Legacy static fallback URI.
 *
 * The FsAdapter seam allows unit tests to inject in-memory stubs without
 * touching the filesystem.
 */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export interface FsAdapter {
  readText(p: string): Promise<string>;
  readBuf(p: string): Promise<Buffer>;
}

const defaultFs: FsAdapter = {
  readText: (p) => fs.readFile(p, "utf8"),
  readBuf: (p) => fs.readFile(p),
};

export const FALLBACK_URI = "ui://vehicle/chart-renderer/mcp-app.v4.html";

/**
 * Resolves the registered resource URI.
 *
 * @param baseDir   Directory that contains the `dist/` folder.
 *                  Defaults to the module's own directory (src/demo-a-mcp-apps).
 * @param fsAdapter Injectable filesystem adapter (swap out in tests).
 */
export async function resolveResourceUri(
  baseDir: string = import.meta.dirname,
  fsAdapter: FsAdapter = defaultFs,
): Promise<string> {
  const jsonPath = path.join(baseDir, "dist", "resource-uri.json");
  try {
    const raw = await fsAdapter.readText(jsonPath);
    const manifest = JSON.parse(raw) as { uri: string };
    console.log(`UI resource URI (manifest): ${manifest.uri}`);
    return manifest.uri;
  } catch {
    // No manifest — try runtime hash.
  }

  const htmlPath = path.join(baseDir, "dist", "mcp-app.html");
  try {
    const content = await fsAdapter.readBuf(htmlPath);
    const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);
    const uri = `ui://vehicle/chart-renderer/${hash}.html`;
    console.log(`UI resource URI (runtime hash): ${uri}`);
    return uri;
  } catch {
    console.warn(`dist/mcp-app.html not found; falling back to ${FALLBACK_URI}`);
    return FALLBACK_URI;
  }
}
