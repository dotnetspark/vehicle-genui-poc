# Implementation Plan — Feature 002 — Demo A: MCP Apps Surface

## Overview

Build the canonical MCP Apps server for Demo A under [constitution v1.1.0](../../.specify/constitution.md).
A single TypeScript MCP server exposes one tool (`query_vehicles`) and one
UI resource (`ui://vehicle/chart-renderer/mcp-app.html`). Claude Desktop reaches the
server via the `mcp-remote` shim. The iframe's bundled chart-renderer picks
the chart type from the result's column shape and degrades to a table when
no chart fits. All data comes from the schema shipped in Feature 001 — this
feature adds no DB structure.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Server pattern | Own the tool, own the resource (canonical SDK) | Wrap `mcp-postgres` and intercept | Constitution v1.1.0 requires canonical pattern |
| Transport | Streamable HTTP (`localhost:3001/mcp`) | stdio | Canonical for MCP Apps; matches official quickstart |
| Claude Desktop bridging | `npx mcp-remote http://localhost:3001/mcp` shim | direct stdio server / cloudflared tunnel | Free Claude plan works; no public URL needed |
| Postgres client | `pg` (node-postgres) | `postgres` (porsager) | Official quickstart's choice; Article III names `pg`; mature with 14k dependents |
| Read-only enforcement | dedicated `vehicles_readonly` role with `GRANT SELECT` only, connected via `DATABASE_URL_READONLY` | per-query `SET TRANSACTION READ ONLY` | Stronger guarantee — DB-layer permission rejects writes regardless of SQL Claude writes |
| UI bundling | `vite-plugin-singlefile` (single HTML, all JS/CSS inline) | separate files + CDN | CSP-friendly under any host; no external `script-src` needed |
| Chart picker location | iframe-side, on `App.ontoolresult` | server-side per-result `_meta` injection | Per-tool `_meta.ui.resourceUri` is canonical; iframe owns chart logic |
| Chart-renderer strategy | One renderer, picks chart by column shape; table fallback | three separate `ui://` resources | One UI resource matches canonical per-tool metadata pattern |
| Number of tools | 1 (`query_vehicles`) | 3 specialised query tools | Multiple tools = "bespoke query tools" (Article III v1.1.0 still forbids) |
| Error path | `isError: true` with Postgres message in `content` | throw / crash subprocess | Spec decision #3 — LLM can self-correct on retry |
| System prompt scope | Steers, doesn't dictate query templates | per-question SQL templates | Article III — schema comments are the only prompt-engineering surface |

## Data Model Changes

**None.** The schema (`dim_vehicle`, `dim_period`, `fact_registrations`,
`v_schema_summary`) shipped in Feature 001 (v0.1.0) is used as-is. Demo A
reads via `pg`; no new tables, views, or columns.

The LLM introspects the schema via `pg_catalog` queries:

```sql
-- Tables and their comments
SELECT relname, obj_description(oid) FROM pg_class WHERE relnamespace = 'public'::regnamespace;

-- Columns and their comments
SELECT a.attname, format_type(a.atttypid, a.atttypmod), col_description(a.attrelid, a.attnum)
FROM pg_attribute a WHERE a.attrelid = 'public.dim_vehicle'::regclass AND a.attnum > 0;
```

These return the `COMMENT ON ...` text written in [Feature 001's schema.sql](../../src/etl/schema.sql).

## Directory Changes

```
src/demo-a-mcp-apps/
  package.json                    (new — npm deps + scripts)
  tsconfig.json                   (new)
  vite.config.ts                  (new — singlefile plugin)
  server.ts                       (new — MCP server + tool + resource)
  setup-readonly-role.sql         (new — creates vehicles_readonly DB role, idempotent)
  mcp-app.html                    (new — UI entry point, root mount node)
  src/
    mcp-app.ts                    (new — App class init, ontoolresult, calls renderer)
    chart-renderer.ts             (new — precedence ladder, Chart.js integration, table fallback)
  claude-desktop-config.json      (new — mcp-remote bridge entry)
  system-prompt.md                (new — Claude steering doc)
  README.md                       (new — Demo A specific run notes)

README.md                         (updated — Demo A quick-start step)
CHANGELOG.md                      (updated — [Unreleased] entry)
docs/ROADMAP.md                   (updated — v0.2.0 marked ✅)
.env.example                      (updated — adds DATABASE_URL_READONLY)
```

No source files outside `src/`. Compose / `.env.example` already at root from
Feature 001 (no changes needed; Demo A reads `DATABASE_URL` from the same `.env`).

## Dependencies to Add

| Package | Version | Layer | Reason |
|---|---|---|---|
| `@modelcontextprotocol/sdk` | `^1.29.0` | `dependencies` | Core MCP server (McpServer, transport) |
| `@modelcontextprotocol/ext-apps` | `^1.6.0` | `dependencies` | App SDK (registerAppTool, App class, RESOURCE_MIME_TYPE) |
| `pg` | `^8.20.0` | `dependencies` | Postgres client (Pool + parameterised queries) |
| `chart.js` | `^4.5.1` | `dependencies` | Bundled into iframe HTML by Vite |
| `express` | `^5.0.0` | `dependencies` | HTTP transport host |
| `cors` | `^2.8.5` | `dependencies` | CORS for cross-origin host testing |
| `typescript` | `^5.8.0` | `devDependencies` | TS compiler |
| `tsx` | latest | `devDependencies` | Run TS directly during `npm run serve` |
| `vite` | `^6.0.0` | `devDependencies` | Build tool for the iframe HTML |
| `vite-plugin-singlefile` | `^2.3.2` | `devDependencies` | Inline JS/CSS into one HTML |
| `@types/node`, `@types/express`, `@types/cors`, `@types/pg` | matched majors | `devDependencies` | Type defs |
| `mcp-remote` | (NOT pinned) | invoked by Claude Desktop via `npx` | stdio↔HTTP bridge |

See [research.md](research.md) for version verification.

## Implementation Sequence

Order is dependency-driven; each task gates the next.

### Phase 1 — Project skeleton

1. `package.json` with `"type": "module"`, scripts (`build`, `serve`, `start`),
   pinned deps from the table above.
2. `tsconfig.json` — `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`,
   `strict: true`, `esModuleInterop: true`, `outDir: dist`.
3. `vite.config.ts` with `viteSingleFile()` plugin and `INPUT` env var pointing at
   `mcp-app.html`.
4. `npm install` — verify all packages resolve cleanly.
5. **Verification:** `npm run build` (with empty HTML) produces `dist/mcp-app.html`.

### Phase 2 — Server

6. `server.ts` skeleton — imports, `McpServer({...})`, `StreamableHTTPServerTransport`,
   Express app, POST `/mcp` route per the [official quickstart](https://modelcontextprotocol.io/extensions/apps/build).
7. **DB role setup** — author `src/demo-a-mcp-apps/setup-readonly-role.sql`:
   ```sql
   DO $$ BEGIN
       IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vehicles_readonly') THEN
           CREATE ROLE vehicles_readonly LOGIN PASSWORD 'readonly';
       END IF;
   END $$;
   GRANT CONNECT ON DATABASE vehicles TO vehicles_readonly;
   GRANT USAGE ON SCHEMA public TO vehicles_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO vehicles_readonly;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
       GRANT SELECT ON TABLES TO vehicles_readonly;
   ```
   Idempotent. Apply once via
   `docker compose exec -T db psql -U postgres -d vehicles < src/demo-a-mcp-apps/setup-readonly-role.sql`.
8. **Update `.env.example`** at repo root — add
   `DATABASE_URL_READONLY=postgresql://vehicles_readonly:readonly@localhost:5432/vehicles`.
   The ETL's existing `DATABASE_URL` (postgres superuser) is unchanged.
9. Postgres `Pool` in `server.ts` initialised from `DATABASE_URL_READONLY`. The DB
   layer enforces read-only — any `INSERT` / `UPDATE` / `DELETE` / `CREATE` / `DROP`
   from a hallucinated SQL is rejected with `ERROR: permission denied`. Handler
   surfaces that as `{ isError: true, content: [Postgres error message] }`, letting
   the LLM self-correct without crashing.
10. `registerAppTool(server, "query_vehicles", { description, inputSchema, _meta }, handler)` —
    handler runs `await pool.query(sql)`, returns `{ content, structuredContent, _meta, isError }`.
11. `registerAppResource(server, "ui://vehicle/chart-renderer/mcp-app.html", "Vehicle chart renderer",
   { mimeType: RESOURCE_MIME_TYPE }, async () => fs.readFile("dist/mcp-app.html"))`.
12. `app.listen(3001)`.
13. **Verification:** start the server (`npm run serve`); from another shell:
    `curl -X POST http://localhost:3001/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'` — confirms `query_vehicles` is listed.
    Then call `tools/call` with a simple SQL — confirms rows come back. Try a
    write (e.g. `CREATE TABLE foo(...)`) — confirms `permission denied` from
    the `vehicles_readonly` role.

### Phase 3 — UI

14. `mcp-app.html` — minimal HTML with `<div id="root"></div>` and a `<script type="module" src="/src/mcp-app.ts">`.
15. `src/mcp-app.ts` — instantiate `new App({...})`, `app.connect()`, set `app.ontoolresult`
    to call `renderFromRows(result.structuredContent)`.
16. `src/chart-renderer.ts`:
    - `pickChartType(rows): "line" | "bar" | "donut" | "table"` — implements the spec's
      precedence ladder + row-count caps.
    - `renderFromRows(rows)` — picks type, mounts the right Chart.js chart on `#root`,
      or renders an HTML table if `pickChartType` returns `"table"`.
    - Fuel colour map per spec.
17. **Verification:** `npm run build` produces a single `dist/mcp-app.html` containing
    all JS and CSS inline (verify file size is non-trivial; grep for `chart.js` symbols
    inside the bundle).

### Phase 4 — Server reads built HTML

18. `registerAppResource` handler reads from `dist/mcp-app.html` via
    `fs.readFile(path.join(import.meta.dirname, "dist", "mcp-app.html"))`.
19. **Verification:** `curl POST .../mcp` for `resources/read uri=ui://vehicle/chart-renderer/mcp-app.html`
    — returns the bundled HTML body with `Content-Type: text/html+mcp` (or whatever the
    SDK encodes).

### Phase 5 — Claude Desktop wiring

20. `claude-desktop-config.json` (snippet):
    ```json
    {
      "mcpServers": {
        "vehicle-genui-demo-a": {
          "command": "npx",
          "args": ["mcp-remote", "http://localhost:3001/mcp"]
        }
      }
    }
    ```
21. `system-prompt.md` — see acceptance criteria #8 in spec.md for required content.
22. **Demo A README** (`src/demo-a-mcp-apps/README.md`) — local run instructions
    (build, serve, paste config, restart Claude Desktop). Includes the
    one-time `setup-readonly-role.sql` apply step.
23. Root README quick-start updated to point at the Demo A README.

### Phase 6 — End-to-end test (#9, manual)

24. With Postgres + ETL loaded (Feature 001 already done), the readonly role
    applied, `npm run serve` running, Claude Desktop config merged and Claude
    Desktop restarted, run all five golden-path questions and verify each
    renders a chart (or graceful table).
25. Capture screenshots / row counts for the eventual PR description.

### Phase 7 — Release plumbing

26. `CHANGELOG.md` `[Unreleased]` entry describing Demo A.
27. `docs/ROADMAP.md` `v0.2.0` row marked ✅.
28. Open PR, squash-merge, tag `v0.2.0`.

## Testing Approach

Per-task acceptance is in `tasks.md`. High-level:

- **Server smoke test:** `curl tools/list` + `curl tools/call` with a hand-crafted
  SQL → confirms wiring.
- **UI standalone test:** `npm run build` produces the bundle; open it directly
  in a browser and `window.postMessage(...)` an `ui/notifications/tool-result`
  envelope per the SDK's pattern → confirms the renderer.
- **End-to-end:** Phase 6's five golden-path queries.
- **Idempotency / re-runs:** server restarts fast; no DB state changes between
  runs (the `vehicles_readonly` role enforces this at the DB layer).

No unit tests. The codebase is ~300 lines split across 4 TS files plus glue.
Article VII (Simplicity).

## Architecture Diagram

```mermaid
flowchart TD
    User[User question]
    CD[Claude Desktop<br/>LLM]
    Shim[npx mcp-remote<br/>stdio ↔ HTTP bridge]
    Server[server.ts<br/>localhost:3001/mcp<br/>Streamable HTTP]
    Pool[pg.Pool<br/>vehicles_readonly role]
    DB[(Postgres 16<br/>vehicles)]
    Bundle[dist/mcp-app.html<br/>bundled UI + Chart.js]
    Iframe[Sandboxed iframe<br/>App class<br/>chart-renderer.ts]

    User --> CD
    CD -->|introspect via pg_catalog| Shim
    CD -->|tools/call query_vehicles| Shim
    Shim <-->|JSON-RPC| Server
    Server --> Pool --> DB
    Server -->|content + structuredContent<br/>+ _meta.ui.resourceUri| Shim
    Shim --> CD
    CD -->|resources/read ui://vehicle/chart-renderer/mcp-app.html| Server
    Server -->|HTML body| CD
    CD -->|render in sandboxed iframe| Bundle
    Bundle --> Iframe
    Iframe -->|column-shape ladder<br/>donut / bar / line / table| User
```

## Constitution Compliance Check

- [x] **Article I — Source Layout:** all code in `src/demo-a-mcp-apps/`.
- [x] **Article II — Demo Isolation:** Demo A only consumes the shared DB
      and types from `src/shared/`; nothing crosses into `src/demo-b-copilotkit/`.
- [x] **Article III v1.1.0 — Schema-First, LLM-Writes-SQL:** server owns one
      generic `query_vehicles(sql)` tool. LLM writes raw SQL by reading
      schema comments via `pg_catalog`. No NL→SQL helpers. No
      question-specific templates. No ORM. Uses canonical
      `@modelcontextprotocol/ext-apps` SDK as required.
- [x] **Article IV — Latest Dependencies:** all deps verified as latest stable
      on 2026-05-08 in [research.md](research.md).
- [x] **Article V — Documentation-First:** spec → plan → tasks → code.
- [x] **Article VI — Mermaid-Only Diagrams:** the architecture diagram above
      is Mermaid; charts in the iframe are Chart.js (UI, not architecture).
- [x] **Article VII — Simplicity:** four TS files, one bundled HTML, one
      JSON config, one Markdown system prompt. No build pipeline beyond Vite
      with one plugin. No unit tests.
- [x] **CHANGELOG entry planned** in implementation step 25.
