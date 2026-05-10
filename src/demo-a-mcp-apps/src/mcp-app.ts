// Demo A — iframe entry point.
// Instantiates the MCP App client, connects to the host, and routes each
// tool-result notification to the chart renderer.
//
// Import path: "@modelcontextprotocol/ext-apps" (the "/" default export —
// no "/iframe" subpath exists in v1.6.x; see dallas-structured-content-shape.md).

import { App } from "@modelcontextprotocol/ext-apps";
import { renderFromRows } from "./chart-renderer.js";

const app = new App({ name: "Vehicle GenUI Demo A", version: "0.2.0" });

// ontoolresult receives CallToolResult directly (params of McpUiToolResultNotification).
// The server wraps rows in { rows: [...] }, so we extract from structuredContent.rows.
// tasks.md 3.1 says `result.structuredContent ?? []` — that is a stale draft;
// the server emits `structuredContent: { rows: [...] }` so the correct path is
// `result.structuredContent?.rows ?? []`.
app.ontoolresult = (result) => {
  const rows: unknown[] =
    (result.structuredContent as { rows?: unknown[] } | undefined)?.rows ?? [];
  console.log("[mcp-app] tool result:", rows.length, "rows");
  renderFromRows(rows);
};

app.connect().catch((err) => {
  console.error("[mcp-app] connect error:", err);
});
