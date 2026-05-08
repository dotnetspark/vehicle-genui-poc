# Research — Feature 002 — Demo A: MCP Apps Surface

Research conducted on 2026-05-08, as required by `/speckit.plan` and Article IV
(Latest Dependencies). All versions are the latest stable releases on the
date of research. Constitution v1.1.0 (#10) governs the architecture: own the
tool, canonical SDK, HTTP transport.

---

## Node — `22 LTS`

- **Source:** Constitution table, [Node.js LTS schedule](https://nodejs.org/en/about/previous-releases).
- **Decision:** target **Node 22 LTS** (matches Demo B and `package.json` `engines.node`).
- **Compatibility check:** all listed npm deps support Node 22; no transitive
  Node 18+ requirement issues.

## TypeScript — `^5.8`

- **Source:** Constitution table; latest 5.x at the time of research (5.8.x line).
- **Decision:** pin `typescript` to `^5.8.0` in devDependencies.
- **`tsconfig.json`:** `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`,
  `strict: true`, `esModuleInterop: true` — matches the official quickstart.

## `@modelcontextprotocol/sdk` — `1.29.0`

- **Source:** [npmjs.com/package/@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- **Status:** stable. Production-recommended v1.x line; v2 anticipated Q1 2026
  (i.e. before now); the canonical guide still references v1, npm latest is 1.29.0.
- **Decision:** pin `@modelcontextprotocol/sdk` to `^1.29.0`.
- **What we use:**
  - `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`

## `@modelcontextprotocol/ext-apps` — `1.6.0`

- **Source:** [npmjs.com/package/@modelcontextprotocol/ext-apps](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)
- **Status:** stable. Latest published ~6 days before research date; tracks the
  ratified MCP Apps specification.
- **Decision:** pin `@modelcontextprotocol/ext-apps` to `^1.6.0`.
- **What we use:**
  - Server: `registerAppTool`, `registerAppResource`, `RESOURCE_MIME_TYPE`
    (the `text/html+mcp` constant) from `@modelcontextprotocol/ext-apps/server`
  - Client: `App` class from `@modelcontextprotocol/ext-apps` with
    `connect()`, `ontoolresult`, `callServerTool()`

## `pg` — `8.20.0` (node-postgres)

- **Source:** [npmjs.com/package/pg](https://www.npmjs.com/package/pg)
- **Status:** stable, mature; ~14k npm dependents.
- **Decision:** pin `pg` to `^8.20.0`. Use `Pool` for connection management.
  Read-only enforcement is via a dedicated `vehicles_readonly` Postgres role
  (`GRANT SELECT` only) connected via `DATABASE_URL_READONLY` env var (decision
  #1 in spec). DB-layer permission rejects any write attempt regardless of SQL
  syntax — stronger than per-query transaction modes.
- **Constitution check:** Article III v1.1.0 explicitly approves `pg` for
  Demo A. No ORM. Parameterised queries throughout.

## `chart.js` — `4.5.1`

- **Source:** [chart.js npm versions](https://www.npmjs.com/package/chart.js?activeTab=versions),
  [github.com/chartjs/Chart.js/releases](https://github.com/chartjs/Chart.js/releases)
- **Status:** latest 4.x; published 2025-10-13. No 4.6.x line yet.
- **Decision:** pin `chart.js` to `^4.5.1`. Bundled into the iframe HTML via
  `vite-plugin-singlefile` per spec acceptance criteria (#7).

## `vite` — `^6.0`

- **Source:** Constitution table requires Vite 6+; latest 6.x.
- **Decision:** pin `vite` to `^6.0.0` in devDependencies.

## `vite-plugin-singlefile` — `2.3.2`

- **Source:** [github.com/richardtallent/vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile),
  [npmjs.com/package/vite-plugin-singlefile](https://www.npmjs.com/package/vite-plugin-singlefile)
- **Status:** stable; peer-dep range covers Vite 5.4+, 6.x, 7.x, 8.x.
- **Decision:** pin `vite-plugin-singlefile` to `^2.3.2` in devDependencies.
- **What it does:** inlines all JS and CSS into a single HTML file at build
  time. Avoids the CSP/external-URL problem entirely — no `<script src=…>`
  references to anything outside the bundled HTML.

## `express` — `^5.0`

- **Source:** Latest major release line; mature, well-supported.
- **Decision:** pin `express` to `^5.0.0`. Used by the canonical quickstart
  to expose the `StreamableHTTPServerTransport` over HTTP. Single POST route:
  `/mcp`.

## `cors` — `^2.8`

- **Source:** Latest stable.
- **Decision:** pin `cors` to `^2.8.5`. Permits the basic-host (different
  origin) and any future cross-origin host to call our server during testing.

## `mcp-remote` — latest (rolling)

- **Source:** [npmjs.com/package/mcp-remote](https://www.npmjs.com/package/mcp-remote)
- **Status:** rolling release. Bridges Claude Desktop's stdio expectation to
  a remote (or local-HTTP) MCP server. As of April 2026, Streamable HTTP is
  Claude's official transport (MCP protocol 2025-11-25).
- **Decision:** **do not pin** in `package.json` — `mcp-remote` is invoked
  by Claude Desktop's `npx` invocation, not as a project dep. Document the
  `npx mcp-remote http://localhost:3001/mcp` line in the Claude Desktop
  config and let `npx` resolve to the latest published version.

## Type packages (devDependencies)

| Package | Version | Why |
|---|---|---|
| `@types/node` | `^22` | matches Node 22 runtime |
| `@types/express` | `^5` | matches Express 5 |
| `@types/cors` | `^2` | matches `cors@^2.8` |
| `@types/pg` | `^8` | matches `pg@^8.20` |
| `tsx` | latest | `npm run serve` shim — runs TypeScript directly |

---

## Summary table — what gets pinned where

| Dep | Where | Pin |
|---|---|---|
| `@modelcontextprotocol/sdk` | `package.json` dependencies | `^1.29.0` |
| `@modelcontextprotocol/ext-apps` | dependencies | `^1.6.0` |
| `pg` | dependencies | `^8.20.0` |
| `chart.js` | dependencies | `^4.5.1` |
| `express` | dependencies | `^5.0.0` |
| `cors` | dependencies | `^2.8.5` |
| `vite` | devDependencies | `^6.0.0` |
| `vite-plugin-singlefile` | devDependencies | `^2.3.2` |
| `typescript` | devDependencies | `^5.8.0` |
| `tsx` | devDependencies | latest |
| `@types/node`, `@types/express`, `@types/cors`, `@types/pg` | devDependencies | matched majors |
| `mcp-remote` | NOT pinned (invoked via npx by Claude Desktop) | latest at runtime |

## Patterns the SDK provides

Captured here so the implementation tasks reference exact API shapes:

### Server side

```ts
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE }
  from "@modelcontextprotocol/ext-apps/server";

registerAppTool(server, "query_vehicles", {
  description: "...",
  inputSchema: { type: "object", properties: { sql: { type: "string" } }, required: ["sql"] },
  _meta: { ui: { resourceUri: "ui://vehicle/chart-renderer/mcp-app.html" } },
}, async ({ sql }) => {
  const rows = await runReadOnly(sql);
  return {
    content: [{ type: "text", text: `Returned ${rows.length} rows.` }],
    structuredContent: rows,
    isError: false,
  };
});

registerAppResource(server, "ui://vehicle/chart-renderer/mcp-app.html",
  "Vehicle chart renderer",
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({ contents: [{ uri: "...", mimeType: RESOURCE_MIME_TYPE, text: bundledHtml }] })
);
```

### Iframe side

```ts
import { App } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "Vehicle GenUI Demo A", version: "0.2.0" });
app.connect();

app.ontoolresult = (result) => {
  const rows = result.structuredContent ?? [];
  renderChartFromRows(rows);   // local function: precedence ladder + Chart.js
};
```

No raw postMessage handlers needed — the SDK's `App` class wraps the JSON-RPC
envelope (`ui/notifications/tool-result`) on the iframe side.
