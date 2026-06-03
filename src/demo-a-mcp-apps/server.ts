// Demo A MCP server — Tasks 2.2 / 2.3 / 2.4.
//
// Boots an MCP server on http://localhost:3001/mcp using the canonical
// Express + StreamableHTTPServerTransport pattern from the MCP Apps quickstart.
// Registers the generic `query_vehicles` SQL-execution tool (Task 2.3) and
// the embedded HTML resource (Task 2.4) per Constitution Article III v1.1.0.
//
// Run: npm run serve
//
// Runtime env vars:
//   DATABASE_URL_READONLY — pg connection string (read-only role)
//   CACHE_MAX             — LRU cache max entries (default: 100)
//   CACHE_TTL             — LRU cache TTL in ms   (default: 300000 = 5 min)

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
import { queryCache } from "./query-cache.ts";

const PORT = 3001;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_READONLY });

// Load the shared schema-first system prompt at boot. Surfacing it via the
// MCP `instructions` field means clients (Claude Desktop, Inspector, etc.)
// receive it automatically on `initialize` and prepend it to the conversation
// — no manual "paste into Custom Instructions" step required.
const STATIC_PROMPT = await fs.readFile(
  path.join(import.meta.dirname, "..", "shared", "system-prompt.md"),
  "utf8"
);

/**
 * Read every public table + column + COMMENT ON at boot and format a compact
 * Markdown cheatsheet. Without this the LLM still has to introspect via
 * pg_catalog before writing any SQL — and it routinely guesses non-existent
 * tables (vehicles, makes, sales, …) or columns (registration_count, fuel_type)
 * before getting around to introspection.
 *
 * Constitution Article VI is preserved: schema documentation lives ONLY in
 * Postgres COMMENT ON statements. This function just reads those comments and
 * surfaces them through the MCP `instructions` channel — no hand-written
 * schema docs in TypeScript, no NL→SQL helpers.
 */
async function buildSchemaCheatsheet(): Promise<string> {
  const tablesRes = await pool.query<{ relname: string; doc: string | null }>(
    `SELECT c.relname, obj_description(c.oid, 'pg_class') AS doc
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'v')
      ORDER BY c.relkind DESC, c.relname`
  );

  const sections: string[] = [];
  for (const t of tablesRes.rows) {
    const colsRes = await pool.query<{
      attname: string;
      data_type: string;
      doc: string | null;
    }>(
      `SELECT a.attname,
              format_type(a.atttypid, a.atttypmod) AS data_type,
              col_description(a.attrelid, a.attnum) AS doc
         FROM pg_attribute a
         JOIN pg_class     c ON c.oid = a.attrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = $1
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum`,
      [t.relname]
    );

    const lines: string[] = [`### \`${t.relname}\``];
    if (t.doc) lines.push(t.doc.trim(), "");
    lines.push("| column | type | doc |", "|---|---|---|");
    for (const col of colsRes.rows) {
      const doc = (col.doc ?? "").replace(/\n/g, " ").trim();
      lines.push(`| \`${col.attname}\` | \`${col.data_type}\` | ${doc} |`);
    }
    sections.push(lines.join("\n"));
  }

  return [
    "## Schema cheatsheet (auto-generated from `COMMENT ON` at server boot)",
    "",
    "These are the **only** tables and columns. Use them verbatim — do not invent",
    "alternative names like `vehicles`, `makes`, `sales`, `registration_count`,",
    "`fuel_type`, etc. Read the column docs before composing analytical SQL.",
    "",
    sections.join("\n\n"),
  ].join("\n");
}

const cheatsheet = await buildSchemaCheatsheet();
// Two banners precede the schema cheatsheet. LLMs weight the start of system
// prompts the most heavily — putting the routing rule first ensures Claude
// reaches for `query_vehicles` instead of web search even before reading
// the schema.
const ROUTING_BANNER = `# TOOL ROUTING — READ FIRST

For ANY question about UK vehicles, registrations, makes, models, fuel types,
body types, licence status, SORN, or DVLA data — at any time period — ALWAYS
call the \`query_vehicles\` MCP tool first.

Do NOT use web search for these questions. The data lives in the connected
PostgreSQL database, not on the public web. Web search returns stale or
incorrect figures and wastes a turn. If \`query_vehicles\` errors, surface
the error — do not silently fall back to web search.

`;
// Schema cheatsheet goes second — LLMs weight the start of system prompts more
// heavily, and Claude was still guessing `vehicles`/`makes`/`registration_count`
// even after the cheatsheet was appended at the end. The static prompt
// (rendering contract, SQL constraints, rules) follows.
const SCHEMA_BANNER = `# AUTHORITATIVE SCHEMA — read this BEFORE writing any SQL

The PostgreSQL database has **exactly three tables and one view**, listed below.
Use these names verbatim. **Never** invent tables or columns. Common wrong
guesses that DO NOT EXIST: \`vehicles\`, \`makes\`, \`models\`, \`sales\`,
\`registrations\`, \`registration_count\`, \`fuel_type\`, \`vehicle_type\`,
\`make_name\`. The real names are listed in the cheatsheet immediately below.

`;
const SYSTEM_INSTRUCTIONS = `${ROUTING_BANNER}${SCHEMA_BANNER}${cheatsheet}\n\n---\n\n${STATIC_PROMPT}`;
console.log(
  `Schema cheatsheet built (${cheatsheet.length} chars); total instructions: ${SYSTEM_INSTRUCTIONS.length} chars.`
);

// Shared constant — used in both the cache-hit path and the live-query path.
const MAX_ROWS_IN_TEXT = 50;

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
      _meta: { ui: { resourceUri: "ui://vehicle/chart-renderer/mcp-app.v4.html" } },
    },
    async ({ sql }) => {
      // Check cache first — avoids a round-trip to Postgres for repeated queries.
      const cached = queryCache.get(sql);
      if (cached) {
        console.log(`[cache] hit rows=${cached.rows.length} key="${sql.trim().slice(0, 80)}"`);
        const text =
          `Returned ${cached.rows.length} rows (cached).\n\n` +
          "```json\n" +
          JSON.stringify(cached.rows.slice(0, MAX_ROWS_IN_TEXT), null, 2) +
          "\n```" +
          (cached.rows.length > MAX_ROWS_IN_TEXT
            ? `\n… (${cached.rows.length - MAX_ROWS_IN_TEXT} more rows omitted from text; full set available in structuredContent.rows and rendered in the UI)`
            : "");
        return {
          content: [{ type: "text" as const, text }],
          structuredContent: { rows: cached.rows },
          isError: false,
        };
      }

      try {
        const result = await pool.query(sql);
        // Echo the rows back in the `text` content so the LLM can reason
        // about results in follow-up turns. MCP Apps clients (e.g. Claude
        // Desktop) may render the linked UI resource and hide the
        // structuredContent rows from the model — without this echo the
        // LLM only sees a row-count and cannot answer follow-up questions
        // like "what was the top fuel type?". Truncated to keep context
        // bounded on large result sets.
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
        // Populate cache so identical queries skip Postgres on subsequent calls.
        queryCache.set(sql, { rows: result.rows });
        console.log(`[cache] miss — stored rows=${result.rows.length}`);
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
    "ui://vehicle/chart-renderer/mcp-app.v4.html",
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const htmlPath = path.join(import.meta.dirname, "dist", "mcp-app.html");
      try {
        const text = await fs.readFile(htmlPath, "utf8");
        return {
          contents: [
            {
              uri: "ui://vehicle/chart-renderer/mcp-app.v4.html",
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

// Debug endpoint — returns LRU cache stats (size, max, TTL).
// Not part of the MCP protocol; safe to expose on localhost only.
app.get("/cache-stats", (_req, res) => {
  res.json(queryCache.stats());
});
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
