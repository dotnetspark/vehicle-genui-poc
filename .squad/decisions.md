# Squad Decisions

## Phase 2 — Demo A MCP server

### 2026-05-08 — `query_vehicles` implemented as a generic SQL runner

**Author:** Parker

Context: Feature 002 (Demo A MCP Apps) required a tool querying the `vehicles` PostgreSQL database. Constitution Article III v1.1.0 is explicit: the demo's SQL-execution tool is generic, accepting SQL strings from the LLM and returning rows. No NL→SQL translation, templates, or intent introspection.

Decision: `query_vehicles` is a pure SQL pass-through with `inputSchema: { sql: z.string() }`. Handler calls `pool.query(sql)` directly and returns structured rows. The `vehicles_readonly` Postgres role enforces read-only access at the DB layer; write attempts are rejected by Postgres and surfaced as `{ isError: true }`, allowing the LLM to self-correct. Schema `COMMENT ON` statements (applied by the ETL) remain the only prompt-engineering surface. If the LLM generates invalid SQL or a permission-denied query, the tool returns the Postgres error so the model can retry.

References: Constitution Article III v1.1.0; `src/demo-a-mcp-apps/server.ts`; `specs/feat-002-demo-a-mcp-apps/tasks.md` Task 2.3.

## Active Decisions

No new active decisions.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
