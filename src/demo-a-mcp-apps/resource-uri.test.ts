/**
 * Unit + integration tests for resource-uri.ts.
 *
 * All unit tests inject an in-memory FsAdapter so no real filesystem
 * access or network calls are needed.
 *
 * Run: node --import tsx/esm --test resource-uri.test.ts
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveResourceUri,
  FALLBACK_URI,
  type FsAdapter,
} from "./resource-uri.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFs(
  manifest: string | null,
  htmlContent: Buffer | null,
): FsAdapter {
  return {
    readText: async (p: string) => {
      if (p.endsWith("resource-uri.json")) {
        if (manifest !== null) return manifest;
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }
      throw Object.assign(new Error(`unexpected readText: ${p}`), { code: "ENOENT" });
    },
    readBuf: async (p: string) => {
      if (p.endsWith("mcp-app.html")) {
        if (htmlContent !== null) return htmlContent;
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }
      throw Object.assign(new Error(`unexpected readBuf: ${p}`), { code: "ENOENT" });
    },
  };
}

// ---------------------------------------------------------------------------
// Unit tests — manifest path
// ---------------------------------------------------------------------------

describe("resolveResourceUri — manifest path", () => {
  it("returns the uri field from dist/resource-uri.json when readable", async () => {
    const expectedUri = "ui://vehicle/chart-renderer/abcdef1234567890.html";
    const fs = makeFs(JSON.stringify({ resourceUri: expectedUri }), null);
    const uri = await resolveResourceUri("/fake/base", fs);
    assert.equal(uri, expectedUri);
  });

  it("returns the uri even when manifest contains extra fields", async () => {
    const expected = "ui://vehicle/chart-renderer/deadbeef01234567.html";
    const payload = JSON.stringify({ resourceUri: expected, hash: "deadbeef01234567", htmlFile: "mcp-app.html" });
    const fs = makeFs(payload, null);
    const uri = await resolveResourceUri("/fake/base", fs);
    assert.equal(uri, expected);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — runtime hash path
// ---------------------------------------------------------------------------

describe("resolveResourceUri — runtime hash path", () => {
  it("falls back to SHA-256 hash of mcp-app.html when manifest is missing", async () => {
    const htmlContent = Buffer.from("<html>test content</html>");
    const expected = createHash("sha256").update(htmlContent).digest("hex").slice(0, 12);
    const fs = makeFs(null, htmlContent);
    const uri = await resolveResourceUri("/fake/base", fs);
    assert.equal(uri, `ui://vehicle/chart-renderer/${expected}.html`);
  });

  it("hash segment is exactly 12 lowercase hex characters", async () => {
    const htmlContent = Buffer.from("any html content here");
    const fs = makeFs(null, htmlContent);
    const uri = await resolveResourceUri("/fake/base", fs);
    const match = uri.match(/\/([a-f0-9]+)\.html$/);
    assert.ok(match, "URI should end with .<hex>.html");
    assert.equal(match![1].length, 12, `expected 12-char hash, got "${match![1]}"`);
  });

  it("different html content produces different URIs", async () => {
    const fsA = makeFs(null, Buffer.from("content A"));
    const fsB = makeFs(null, Buffer.from("content B"));
    const uriA = await resolveResourceUri("/fake/base", fsA);
    const uriB = await resolveResourceUri("/fake/base", fsB);
    assert.notEqual(uriA, uriB);
  });

  it("same html content always produces the same URI (deterministic)", async () => {
    const content = Buffer.from("stable html content");
    const fs1 = makeFs(null, content);
    const fs2 = makeFs(null, content);
    const uri1 = await resolveResourceUri("/fake/base", fs1);
    const uri2 = await resolveResourceUri("/fake/base", fs2);
    assert.equal(uri1, uri2);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — fallback path
// ---------------------------------------------------------------------------

describe("resolveResourceUri — fallback path", () => {
  it("returns FALLBACK_URI when both manifest and html are missing", async () => {
    const fs = makeFs(null, null);
    const uri = await resolveResourceUri("/fake/base", fs);
    assert.equal(uri, FALLBACK_URI);
  });

  it("FALLBACK_URI matches the expected legacy format", () => {
    assert.match(FALLBACK_URI, /^ui:\/\/vehicle\/chart-renderer\/mcp-app\.v4\.html$/);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — URI format invariants
// ---------------------------------------------------------------------------

describe("resolveResourceUri — URI format", () => {
  it("all resolved URIs start with ui://vehicle/chart-renderer/", async () => {
    const cases: FsAdapter[] = [
      makeFs(JSON.stringify({ resourceUri: "ui://vehicle/chart-renderer/abc1234567890123.html" }), null),
      makeFs(null, Buffer.from("<html/>")),
      makeFs(null, null),
    ];
    for (const fs of cases) {
      const uri = await resolveResourceUri("/fake/base", fs);
      assert.match(uri, /^ui:\/\/vehicle\/chart-renderer\//,
        `URI should start with ui://vehicle/chart-renderer/, got: ${uri}`);
    }
  });

  it("manifest path is preferred over runtime hash when both would succeed", async () => {
    const manifestUri = "ui://vehicle/chart-renderer/from-manifest.html";
    const fs = makeFs(
      JSON.stringify({ resourceUri: manifestUri }),
      Buffer.from("<html>some content</html>"),
    );
    const uri = await resolveResourceUri("/fake/base", fs);
    assert.equal(uri, manifestUri, "manifest should win over runtime hash");
  });
});

// ---------------------------------------------------------------------------
// Integration test — reads the actual committed dist/resource-uri.json.
// Skipped when the dist/ build artefact is not present (e.g. clean CI checkout).
// ---------------------------------------------------------------------------

describe("resolveResourceUri — integration (actual dist/resource-uri.json)", () => {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const manifestPath = path.join(moduleDir, "dist", "resource-uri.json");

  let distExists = false;
  before(async () => {
    try {
      await (await import("node:fs/promises")).default.access(manifestPath);
      distExists = true;
    } catch {
      distExists = false;
    }
  });

  it("returns a URI that matches the format in dist/resource-uri.json", async (t) => {
    // Uses the default baseDir (= this module's directory = src/demo-a-mcp-apps)
    // and the real filesystem. dist/resource-uri.json is committed to the repo.
    if (!distExists) { t.skip("dist/resource-uri.json not built"); return; }
    const uri = await resolveResourceUri(moduleDir);
    assert.match(uri, /^ui:\/\/vehicle\/chart-renderer\//,
      `Expected ui://vehicle/chart-renderer/ prefix; got: ${uri}`);
  });

  it("URI from resolveResourceUri() matches the uri field in dist/resource-uri.json", async (t) => {
    if (!distExists) { t.skip("dist/resource-uri.json not built"); return; }
    const { default: fs } = await import("node:fs/promises");
    const raw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as { resourceUri: string };
    const resolved = await resolveResourceUri(moduleDir);
    assert.equal(resolved, manifest.resourceUri,
      "resolveResourceUri() must return exactly the resourceUri from dist/resource-uri.json");
  });
});

