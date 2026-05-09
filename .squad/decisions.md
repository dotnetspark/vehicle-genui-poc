# Squad Decisions

## Phase 2 — Demo A MCP server

### 2026-05-08 — `query_vehicles` implemented as a generic SQL runner

**Author:** Parker

Context: Feature 002 (Demo A MCP Apps) required a tool querying the `vehicles` PostgreSQL database. Constitution Article III v1.1.0 is explicit: the demo's SQL-execution tool is generic, accepting SQL strings from the LLM and returning rows. No NL→SQL translation, templates, or intent introspection.

Decision: `query_vehicles` is a pure SQL pass-through with `inputSchema: { sql: z.string() }`. Handler calls `pool.query(sql)` directly and returns structured rows. The `vehicles_readonly` Postgres role enforces read-only access at the DB layer; write attempts are rejected by Postgres and surfaced as `{ isError: true }`, allowing the LLM to self-correct. Schema `COMMENT ON` statements (applied by the ETL) remain the only prompt-engineering surface. If the LLM generates invalid SQL or a permission-denied query, the tool returns the Postgres error so the model can retry.

References: Constitution Article III v1.1.0; `src/demo-a-mcp-apps/server.ts`; `specs/feat-002-demo-a-mcp-apps/tasks.md` Task 2.3.

## Phase 3-5 — Demo A UI + wiring

### 2026-05-08 — MCP End-to-End Smoke Test Protocol

**Author:** Ash

Verifying MCP server implementations requires: client connection, StreamableHTTP transport (Accept/Content-Type headers, session-id management), tool calls with arguments, error handling, resource endpoints. Decision: **use MCP SDK `Client` + `StreamableHTTPClientTransport` for all e2e smoke tests**, not raw HTTP. SDK handles JSON-RPC handshake, session-ids, streaming transparently; single `.mjs` file (Node.js ESM) can be created, run, deleted without build overhead. Type safety and reusability across demos. Implementation: create `smoke-test.mjs` in server root; import SDK client; instantiate; connect via transport; run assertions. Task 4.1 (2026-05-08) validated protocol: server bootstrap, query_vehicles tool metadata (resourceUri set), structured response rows, permission denial on mutation, resource read. **Adoption: use this pattern for all MCP server e2e tests in Phase 2–5.**

### 2026-05-08 — Structured Content Shape and Import Path Corrections

**Author:** Dallas

Three corrections to Phase 3 (Tasks 3.1–3.3):

1. **`structuredContent` envelope shape:** tasks.md draft said `result.structuredContent ?? []` (bare array). Reality: `server.ts` emits `{ rows: result.rows }` (object with `rows` key). Correct client pattern: `result.structuredContent?.rows ?? []`. `server.ts` is correct and unchanged; only client access pattern needed updating.

2. **Import path for `App`:** tasks.md said `import { App } from "@modelcontextprotocol/ext-apps/iframe"`. Reality: v1.6.x exports map has no `/iframe` subpath. **Correct import:** `import { App } from "@modelcontextprotocol/ext-apps"`.

3. **Bundle size:** Spec target 150–400 KB; actual 509.6 KB (gzip: 143.9 KB). Overshoot caused by zod v4 transitive dependency. Gzip is within practical limits; no action needed.

## Active Decisions

No new active decisions.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
