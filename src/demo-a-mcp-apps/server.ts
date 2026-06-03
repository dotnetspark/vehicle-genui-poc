// Demo A MCP server -- Tasks 2.2 / 2.3 / 2.4.
//
// Boots an MCP server on http://localhost:3001/mcp using the canonical
// Express + StreamableHTTPServerTransport pattern from the MCP Apps quickstart.
// Registers the generic `query_vehicles` SQL-execution tool (Task 2.3) and
// the embedded HTML resource (Task 2.4) per Constitution Article III v1.1.0.
//
// Run: npm run serve
//
// Runtime env vars:
//   DATABASE_URL_READONLY -- pg connection string (read-only role)
//   CACHE_MAX             -- LRU cache max entries (default: 100)
//   CACHE_TTL             -- LRU cache TTL in ms   (default: 300000 = 5 min)
//   ENABLE_STREAMING      -- set to "true" to register query_vehicles_chunked
//                            cursor-based pagination tool (default: off)

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
import { resolveResourceUri } from "./resource-uri.ts";

const PORT = 3001;

// Feature flag -- set ENABLE_STREAMING=true to register query_vehicles_chunked.
const ENABLE_STREAMING = process.env.ENABLE_STREAMING === "true";

const pool = new Pool({ connectionString: process.env.DATABASE_URL_READONLY });

// Module-level so both the cache path and the live path share the same limit.
const MAX_ROWS_IN_TEXT = 50;

// ---------------------------------------------------------------------------
// Content-addressed resource URI
// ---------------------------------------------------------------------------

const RESOURCE_URI = await resolveResourceUri();

// ---------------------------------------------------------------------------
// Schema cheatsheet helpers
// ---------------------------------------------------------------------------

interface ColumnMeta {
  attname: string;
  data_type: string;
  not_null: boolean;
  doc: string | null;
  constraint_desc: string | null;
}

/**
 * Query pg_attribute + pg_constraint for every column of a public table.
 * Constraint type codes: p=PK, u=UNIQUE, f=FK, c=CHECK.
 * NOT NULL comes from pg_attribute.attnotnull, not pg_constraint.
 */
async function fetchColumnMeta(tableName: string): Promise<ColumnMeta[]> {
  const res = await pool.query<ColumnMeta>(
    `SELECT
        a.attname,
        format_type(a.atttypid, a.atttypmod)  AS data_type,
        a.attnotnull                           AS not_null,
        col_description(a.attrelid, a.attnum)  AS doc,
        (
          SELECT string_agg(label, ', ' ORDER BY label)
          FROM (
            SELECT DISTINCT
              CASE c2.contype
                WHEN 'p' THEN 'PK'
                WHEN 'u' THEN 'UNIQUE'
                WHEN 'c' THEN pg_get_constraintdef(c2.oid)
                WHEN 'f' THEN 'FK -> ' || (
                  SELECT cl2.relname || '.' || a2.attname
                  FROM   pg_class     cl2
                  JOIN   pg_attribute a2  ON a2.attrelid = cl2.oid
                    AND  a2.attnum = c2.confkey[
                           array_position(c2.conkey, a.attnum)
                         ]
                  WHERE  cl2.oid = c2.confrelid
                  LIMIT  1
                )
              END AS label
            FROM pg_constraint c2
            WHERE c2.conrelid = a.attrelid
              AND a.attnum    = ANY(c2.conkey)
              AND c2.contype  IN ('p','u','f','c')
          ) sub
          WHERE label IS NOT NULL
        ) AS constraint_desc
      FROM pg_attribute a
      JOIN pg_class     c  ON c.oid = a.attrelid
      JOIN pg_namespace n  ON n.oid = c.relnamespace
     WHERE n.nspname   = 'public'
       AND c.relname   = $1
       AND a.attnum    > 0
       AND NOT a.attisdropped
     ORDER BY a.attnum`,
    [tableName]
  );
  return res.rows;
}

/**
 * Return distinct values for a column when pg_stats reports low cardinality.
 * Returns null for high-cardinality, unanalysed, or non-text/integer columns.
 */
async function fetchSampleValues(
  tableName: string,
  colName: string,
  dataType: string,
  maxDistinct = 30,
  limit = 30
): Promise<string[] | null> {
  const sampleableTypes = ["text", "smallint", "integer", "bigint", "boolean"];
  if (!sampleableTypes.some((t) => dataType.startsWith(t))) return null;
  const statsRes = await pool.query<{ n_distinct: number }>(
    `SELECT n_distinct FROM pg_stats
      WHERE schemaname = 'public' AND tablename = $1 AND attname = $2`,
    [tableName, colName]
  );
  const nDistinct = statsRes.rows[0]?.n_distinct ?? 0;
  // n_distinct < 0 = fractional (high cardinality). 0 = ANALYZE not run. Both skip.
  if (nDistinct <= 0 || nDistinct > maxDistinct) return null;
  const safeTable = tableName.replace(/[^a-z0-9_]/gi, "");
  const safeCol   = colName.replace(/[^a-z0-9_]/gi, "");
  const sampRes = await pool.query<{ v: unknown }>(
    `SELECT DISTINCT "${safeCol}" AS v FROM "${safeTable}" ORDER BY 1 LIMIT $1`,
    [limit]
  );
  return sampRes.rows.map((r) => String(r.v ?? ""));
}

// ---------------------------------------------------------------------------
// System prompt assembly
// ---------------------------------------------------------------------------

const STATIC_PROMPT = await fs.readFile(
  path.join(import.meta.dirname, "..", "shared", "system-prompt.md"),
  "utf8"
);

/**
 * Build a Markdown schema cheatsheet from COMMENT ON metadata, pg_constraint,
 * and live pg_stats sample values. Each column row includes a `constraints`
 * cell, and low-cardinality columns get a "Sample values" list appended.
 */
async function buildSchemaCheatsheet(): Promise<string> {
  const tablesRes = await pool.query<{ relname: string; relkind: string; doc: string | null }>(
    `SELECT c.relname, c.relkind, obj_description(c.oid, 'pg_class') AS doc
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v')
      ORDER BY c.relkind DESC, c.relname`
  );
  const sections: string[] = [];
  for (const t of tablesRes.rows) {
    const isBaseTable = t.relkind === "r";
    const cols = await fetchColumnMeta(t.relname);
    const lines: string[] = ["### `" + t.relname + "`"];
    if (t.doc) lines.push(t.doc.trim(), "");
    lines.push("| column | type | constraints | doc |", "|---|---|---|---|");
    const sampleCandidates: Array<{ attname: string; samples: string[] }> = [];
    for (const col of cols) {
      const doc = (col.doc ?? "").replace(/\n/g, " ").trim();
      const parts: string[] = [];
      if (col.not_null) parts.push("NOT NULL");
      if (col.constraint_desc) parts.push(col.constraint_desc);
      const constraints = parts.join(", ");
      lines.push("| `" + col.attname + "` | `" + col.data_type + "` | " + constraints + " | " + doc + " |");
      if (isBaseTable) {
        const samples = await fetchSampleValues(t.relname, col.attname, col.data_type);
        if (samples && samples.length > 0) sampleCandidates.push({ attname: col.attname, samples });
      }
    }
    if (sampleCandidates.length > 0) {
      lines.push("", "**Sample values** (live from DB, low-cardinality columns only):");
      for (const { attname, samples } of sampleCandidates) {
        lines.push("- `" + attname + "`: " + samples.map((v) => "'" + v + "'").join(", "));
      }
    }
    sections.push(lines.join("\n"));
  }
  return [
    "## Schema cheatsheet (auto-generated from `COMMENT ON` at server boot)",
    "",
    "These are the **only** tables and columns. Use them verbatim.",
    "",
    sections.join("\n\n"),
  ].join("\n");
}

const cheatsheet = await buildSchemaCheatsheet();
const ROUTING_BANNER =
  "# TOOL ROUTING -- READ FIRST\n\n" +
  "For ANY question about UK vehicles, registrations, makes, models, fuel types,\n" +
  "body types, licence status, SORN, or DVLA data -- at any time period -- ALWAYS\n" +
  "call the `query_vehicles` MCP tool first. Do NOT use web search.\n\n";
const SCHEMA_BANNER =
  "# AUTHORITATIVE SCHEMA -- read this BEFORE writing any SQL\n\n" +
  "The PostgreSQL database has **exactly three tables and one view**.\n" +
  "Never invent tables or columns not listed below.\n\n";
const SYSTEM_INSTRUCTIONS = ROUTING_BANNER + SCHEMA_BANNER + cheatsheet + "\n\n---\n\n" + STATIC_PROMPT;
console.log(
  `Schema cheatsheet built (${cheatsheet.length} chars); total instructions: ${SYSTEM_INSTRUCTIONS.length} chars.`
);
if (ENABLE_STREAMING) {
  console.log("ENABLE_STREAMING=true -- query_vehicles_chunked tool registered.");
}

// ---------------------------------------------------------------------------
// MCP server factory
// ---------------------------------------------------------------------------

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "Vehicle GenUI Demo A", version: "0.2.0" },
    { instructions: SYSTEM_INSTRUCTIONS }
  );

  registerAppTool(
    server,
    "query_vehicles",
    {
      description:
        "Run a raw SQL SELECT query against the vehicles PostgreSQL database and return all rows as structured data. " +
        "Pass the complete SQL string; the tool executes it against the read-only pool and returns the result rows.",
      inputSchema: {
        sql: z.string().describe("A raw SQL query to execute against the vehicles database"),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async ({ sql }) => {
      const cached = queryCache.get(sql);
      if (cached) {
        const preview = cached.rows.slice(0, MAX_ROWS_IN_TEXT);
        const truncNote =
          cached.rows.length > MAX_ROWS_IN_TEXT
            ? "\n... (" + (cached.rows.length - MAX_ROWS_IN_TEXT) + " more rows omitted; full set in structuredContent.rows)"
            : "";
        return {
          content: [{ type: "text" as const, text: "Returned " + cached.rows.length + " rows (cached).\n\n```json\n" + JSON.stringify(preview, null, 2) + "\n```" + truncNote }],
          structuredContent: { rows: cached.rows },
          isError: false,
        };
      }
      try {
        const result = await pool.query(sql);
        const preview = result.rows.slice(0, MAX_ROWS_IN_TEXT);
        const truncNote =
          result.rows.length > MAX_ROWS_IN_TEXT
            ? "\n... (" + (result.rows.length - MAX_ROWS_IN_TEXT) + " more rows omitted from text; full set in structuredContent.rows)"
            : "";
        queryCache.set(sql, { rows: result.rows });
        return {
          content: [{ type: "text" as const, text: "Returned " + result.rows.length + " rows.\n\n```json\n" + JSON.stringify(preview, null, 2) + "\n```" + truncNote }],
          structuredContent: { rows: result.rows },
          isError: false,
        };
      } catch (err) {
        if (err instanceof DatabaseError) {
          return { isError: true, content: [{ type: "text" as const, text: err.message }] };
        }
        throw err;
      }
    }
  );

  if (ENABLE_STREAMING) {
    registerAppTool(
      server,
      "query_vehicles_chunked",
      {
        description:
          "Stream a large SQL SELECT query in cursor-based chunks. " +
          "Pass the complete SQL in `sql`; optionally `cursor` (row offset, default 0) and " +
          "`chunk_size` (rows per page, default 500, max 2000). " +
          "Returns `has_more: true` when more rows are available -- call again with `cursor = next_cursor`.",
        inputSchema: {
          sql: z.string().describe("A raw SQL SELECT query to execute against the vehicles database"),
          cursor: z.number().int().min(0).optional().describe("Row offset (default: 0)"),
          chunk_size: z.number().int().min(1).max(2000).optional().describe("Rows per chunk (default: 500)"),
        },
        _meta: { ui: { resourceUri: RESOURCE_URI } },
      },
      async ({ sql, cursor = 0, chunk_size = 500 }) => {
        // Wrap in CTE; fetch chunk_size+1 to detect has_more without COUNT(*).
        const paginatedSql =
          "WITH __base AS (\n" + sql + "\n)\nSELECT * FROM __base LIMIT " +
          (chunk_size + 1) + " OFFSET " + cursor;
        try {
          const result = await pool.query(paginatedSql);
          const has_more = result.rows.length > chunk_size;
          const rows = has_more ? result.rows.slice(0, chunk_size) : result.rows;
          const next_cursor: number | null = has_more ? cursor + chunk_size : null;
          const text =
            "Chunk: " + rows.length + " rows (offset=" + cursor + ", has_more=" + has_more + ")." +
            (has_more ? " Call again with cursor=" + next_cursor + "." : " Final chunk.");
          return {
            content: [{ type: "text" as const, text }],
            structuredContent: { rows, has_more, next_cursor, chunk_size, cursor },
            isError: false,
          };
        } catch (err) {
          if (err instanceof DatabaseError) {
            return { isError: true, content: [{ type: "text" as const, text: err.message }] };
          }
          throw err;
        }
      }
    );
  }

  registerAppResource(
    server,
    "Vehicle chart renderer",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const htmlPath = path.join(import.meta.dirname, "dist", "mcp-app.html");
      try {
        const text = await fs.readFile(htmlPath, "utf8");
        return { contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text }] };
      } catch {
        return { contents: [], isError: true };
      }
    }
  );

  return server;
}

// ---------------------------------------------------------------------------
// Express HTTP server
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

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
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Error handling /mcp request:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Demo A MCP server listening on http://localhost:${PORT}/mcp`);
});
