// Demo A — iframe entry point.
// Instantiates the MCP App client, connects to the host, and routes each
// tool-result notification to the chart renderer.
//
// Import path: "@modelcontextprotocol/ext-apps" (the "/" default export —
// no "/iframe" subpath exists in v1.6.x; see dallas-structured-content-shape.md).

import { App } from "@modelcontextprotocol/ext-apps";
import {
  renderFromRows,
  renderFromChunked,
  isChunkedEnvelope,
  setHostBridge,
} from "./chart-renderer.js";

const app = new App({ name: "Vehicle GenUI Demo A", version: "0.2.0" });

// Hand the chart renderer a callback it can use to push follow-up user
// prompts back into the chat (powers the suggestion chips below each chart).
setHostBridge({
  sendUserPrompt: async (text: string) => {
    try {
      await app.sendMessage({
        role: "user",
        content: [{ type: "text", text }],
      });
    } catch (err) {
      console.error("[mcp-app] sendMessage failed:", err);
    }
  },
});

// ontoolresult receives CallToolResult directly (params of McpUiToolResultNotification).
// The server wraps rows in { rows: [...] }, so we extract from structuredContent.rows.
// tasks.md 3.1 says `result.structuredContent ?? []` — that is a stale draft;
// the server emits `structuredContent: { rows: [...] }` so the correct path is
// `result.structuredContent?.rows ?? []`.
// Accumulates rows across chunked tool calls (query_vehicles_chunked).
// Reset to [] at the start of each new streaming call (cursor === 0).
let accumulatedRows: unknown[] = [];

app.ontoolresult = (result) => {
  const sc = result.structuredContent as unknown;
  if (isChunkedEnvelope(sc)) {
    if (sc.cursor === 0) accumulatedRows = [];
    accumulatedRows = accumulatedRows.concat(sc.rows);
    console.log(
      `[mcp-app] chunk cursor=${sc.cursor} rows=${sc.rows.length} total=${accumulatedRows.length} has_more=${sc.has_more}`
    );
    renderFromChunked(accumulatedRows, sc);
    return;
  }
  accumulatedRows = [];
  const rows: unknown[] = (sc as { rows?: unknown[] } | undefined)?.rows ?? [];
  console.log("[mcp-app] tool result:", rows.length, "rows");
  renderFromRows(rows);
};

app.connect().catch((err) => {
  console.error("[mcp-app] connect error:", err);
});
