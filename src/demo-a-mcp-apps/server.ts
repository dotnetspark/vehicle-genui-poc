// Demo A MCP server — Tasks 2.2 / 2.3 / 2.4.
//
// Boots an MCP server on http://localhost:3001/mcp using the canonical
// Express + StreamableHTTPServerTransport pattern from the MCP Apps quickstart.
// Registers the generic `query_vehicles` SQL-execution tool (Task 2.3) and
// the embedded HTML resource (Task 2.4) per Constitution Article III v1.1.0.
//
// Run: npm run serve

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { Pool, DatabaseError } from "pg";
import { z } from "zod";

const PORT = 3001;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_READONLY });

// Load the shared schema-first system prompt at boot. Surfacing it via the
// MCP `instructions` field means clients (Claude Desktop, Inspector, etc.)
// receive it automatically on `initialize` and prepend it to the conversation
// — no manual "paste into Custom Instructions" step required.
const SYSTEM_INSTRUCTIONS = await fs.readFile(
  path.join(import.meta.dirname, "..", "shared", "system-prompt.md"),
  "utf8"
);

// Build a fresh McpServer per request — required by the stateless StreamableHTTP
// pattern (sessionIdGenerator: undefined). A shared McpServer cannot be connected
// to multiple transports concurrently and would throw "Already connected to a
// transport" on the 2nd request, silently 500ing every subsequent tool call.
function buildServer(): McpServer {
  const server = new McpServer(
    {
      name: "Vehicle GenUI Demo A",
      version: "0.2.0",
    },
    { instructions: SYSTEM_INSTRUCTIONS }
  );

  // Task 2.3 — Generic SQL-execution tool (Constitution Article III v1.1.0).
  // The LLM supplies raw SQL; this tool runs it and returns rows. No NL→SQL,
  // no templates, no intent introspection.
  registerAppTool(
    server,
    "query_vehicles",
    {
      description:
        "Run a raw SQL SELECT query against the vehicles PostgreSQL database and return all rows as structured data. " +
        "The database schema is documented via COMMENT ON statements. " +
        "Pass the complete SQL string; the tool executes it against the read-only pool and returns the result rows.",
      inputSchema: {
        sql: z.string().describe("A raw SQL query to execute against the vehicles database"),
      },
      _meta: { ui: { resourceUri: "ui://vehicle/chart-renderer/mcp-app.html" } },
    },
    async ({ sql }) => {
      try {
        const result = await pool.query(sql);
        // Echo the rows back in the `text` content so the LLM can reason
        // about results in follow-up turns. MCP Apps clients (e.g. Claude
        // Desktop) may render the linked UI resource and hide the
        // structuredContent rows from the model — without this echo the
        // LLM only sees a row-count and cannot answer follow-up questions
        // like "what was the top fuel type?". Truncated to keep context
        // bounded on large result sets.
        const MAX_ROWS_IN_TEXT = 50;
        const preview = result.rows.slice(0, MAX_ROWS_IN_TEXT);
        const truncatedNote =
          result.rows.length > MAX_ROWS_IN_TEXT
            ? `\n… (${result.rows.length - MAX_ROWS_IN_TEXT} more rows omitted from text; full set available in structuredContent.rows and rendered in the UI)`
            : "";
        const text =
          `Returned ${result.rows.length} rows.\n\n` +
          "```json\n" +
          JSON.stringify(preview, null, 2) +
          "\n```" +
          truncatedNote;
        return {
          content: [{ type: "text" as const, text }],
          structuredContent: { rows: result.rows },
          isError: false,
        };
      } catch (err) {
        if (err instanceof DatabaseError) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: err.message }],
          };
        }
        throw err;
      }
    }
  );

  // Task 2.4 — Embedded HTML resource for the chart-renderer UI.
  // The handler reads the file at request time so it always serves the latest build.
  registerAppResource(
    server,
    "Vehicle chart renderer",
    "ui://vehicle/chart-renderer/mcp-app.html",
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const htmlPath = path.join(import.meta.dirname, "dist", "mcp-app.html");
      try {
        const text = await fs.readFile(htmlPath, "utf8");
        return {
          contents: [
            {
              uri: "ui://vehicle/chart-renderer/mcp-app.html",
              mimeType: RESOURCE_MIME_TYPE,
              text,
            },
          ],
        };
      } catch {
        return { contents: [], isError: true };
      }
    }
  );

  return server;
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Error handling /mcp request:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(
    `Demo A MCP server listening on http://localhost:${PORT}/mcp`
  );
});
