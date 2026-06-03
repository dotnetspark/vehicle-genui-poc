// Demo A — Example: consuming `query_vehicles_chunked` via raw MCP HTTP.
//
// Demonstrates cursor-based pagination against the `query_vehicles_chunked`
// tool introduced in feat/demo-a/schema-and-streaming.  Run with:
//
//   cd src/demo-a-mcp-apps
//   ENABLE_STREAMING=true npm run serve &
//   npx tsx examples/streaming-consumer.ts
//
// The script iterates until `has_more` is false, then prints a summary of all
// accumulated rows.  Pass a custom SQL as a CLI argument:
//
//   npx tsx examples/streaming-consumer.ts "SELECT * FROM fact_registrations"

const MCP_ENDPOINT = process.env.MCP_ENDPOINT ?? "http://localhost:3001/mcp";
const DEFAULT_SQL = "SELECT * FROM fact_registrations ORDER BY period_id, make";
const CHUNK_SIZE = 500;

// ---------------------------------------------------------------------------
// MCP JSON-RPC helpers (minimal — no SDK dependency)
// ---------------------------------------------------------------------------

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface ChunkedResult {
  rows: Record<string, unknown>[];
  has_more: boolean;
  next_cursor: number | null;
  chunk_size: number;
  cursor: number;
}

async function jsonRpc(
  method: string,
  params: unknown,
  id: number
): Promise<JsonRpcResponse> {
  const body: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };
  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as JsonRpcResponse;
}

// ---------------------------------------------------------------------------
// Initialize an MCP session and return the negotiated server info
// ---------------------------------------------------------------------------

async function initialize(): Promise<unknown> {
  const r = await jsonRpc(
    "initialize",
    {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "streaming-consumer-example", version: "0.1.0" },
    },
    1
  );
  if (r.error) throw new Error(`initialize: ${r.error.message}`);
  return r.result;
}

// ---------------------------------------------------------------------------
// Call query_vehicles_chunked iteratively until has_more=false
// ---------------------------------------------------------------------------

async function streamAll(
  sql: string,
  chunkSize: number = CHUNK_SIZE
): Promise<Record<string, unknown>[]> {
  const allRows: Record<string, unknown>[] = [];
  let cursor = 0;
  let reqId = 2;
  let chunkIndex = 0;

  while (true) {
    const r = await jsonRpc(
      "tools/call",
      {
        name: "query_vehicles_chunked",
        arguments: { sql, cursor, chunk_size: chunkSize },
      },
      reqId++
    );

    if (r.error) {
      throw new Error(`tools/call error at cursor ${cursor}: ${r.error.message}`);
    }

    const toolResult = r.result as {
      structuredContent?: ChunkedResult;
      isError?: boolean;
      content?: Array<{ type: string; text?: string }>;
    };

    if (toolResult.isError) {
      const msg = toolResult.content?.find((c) => c.type === "text")?.text ?? "unknown";
      throw new Error(`Tool returned error: ${msg}`);
    }

    const envelope = toolResult.structuredContent;
    if (!envelope) throw new Error("No structuredContent in response");

    allRows.push(...envelope.rows);
    chunkIndex++;

    process.stdout.write(
      `  chunk ${chunkIndex}: ${envelope.rows.length} rows (total ${allRows.length}, has_more=${envelope.has_more})\n`
    );

    if (!envelope.has_more) break;
    if (envelope.next_cursor === null) break;
    cursor = envelope.next_cursor;
  }

  return allRows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const sql = process.argv[2] ?? DEFAULT_SQL;

console.log(`\nStreaming consumer — endpoint: ${MCP_ENDPOINT}`);
console.log(`SQL: ${sql.slice(0, 120)}${sql.length > 120 ? "..." : ""}`);
console.log(`Chunk size: ${CHUNK_SIZE}\n`);

console.log("Initializing MCP session...");
await initialize();
console.log("Session ready.\n");

console.log("Fetching chunks:");
const t0 = performance.now();
const rows = await streamAll(sql);
const elapsed = ((performance.now() - t0) / 1000).toFixed(2);

console.log(`\nDone! ${rows.length} total rows in ${elapsed}s.`);

if (rows.length > 0) {
  console.log("\nFirst row sample:");
  console.log(JSON.stringify(rows[0], null, 2));
  console.log("\nColumn names:", Object.keys(rows[0]).join(", "));
}
