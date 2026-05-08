# Feature 002 — Demo A: MCP Apps Surface

## GitHub Issue

Closes #6, #7, #8.
Issue #9 — the manual end-to-end test — is closed by the `v0.2.0` milestone
tag, not the spec PR.

> **Note on issue #6 wording:** the original issue title references "FastMCP
> wrapper — proxy mcp-postgres" which predates [constitution v1.1.0](../../.specify/constitution.md)
> (#10). Under the amended Article III the implementation is a TypeScript
> MCP server using `@modelcontextprotocol/ext-apps` that owns its own
> SQL-execution tool. The issue's intent — "a server that exposes our charts
> to Claude Desktop" — survives.

## Problem Statement

The PoC compares two Generative UI architectures. **Demo A** is the MCP Apps
side: Claude (in Claude Desktop) reads the schema, writes SQL, calls a single
`query_vehicles` tool, and the host renders an HTML chart in a sandboxed
iframe. The schema's `COMMENT ON` statements are the only prompt-engineering
surface (Article III).

This feature delivers, per the official MCP Apps quickstart pattern:

1. A TypeScript MCP server using `@modelcontextprotocol/sdk` and
   `@modelcontextprotocol/ext-apps` that owns one tool (`query_vehicles`)
   and one UI resource (`ui://vehicle/chart-renderer/mcp-app.html`).
2. A bundled HTML chart-renderer that picks the chart type from the result's
   column shape and degrades gracefully to a table when no chart fits.
3. Claude Desktop config and a system prompt that wire it together.

## User Stories

- **As a contributor evaluating Demo A**, I run `npm run build && npm run serve`,
  paste the bridge entry into my `claude_desktop_config.json`, restart Claude
  Desktop, and ask any of the five golden-path questions — a chart renders
  in the host UI without further setup.
- **As Claude inside Claude Desktop**, I read the schema's table/column
  comments via `pg_catalog`, write valid SQL, and call `query_vehicles`. The
  tool's `_meta.ui.resourceUri` carries the chart-renderer URI; the host
  fetches it and forwards my `structuredContent`. The renderer picks the
  chart type from the rows.
- **As the comparison-document author**, I can compare Demo A's UX, code
  size, and failure modes against Demo B side-by-side, knowing Demo A uses
  the canonical MCP Apps SDK pattern.

## Decisions baked into the spec

(Five tactical choices encoded directly. Push back below if any need flipping.)

1. **Read-only SQL via a dedicated `vehicles_readonly` Postgres role**
   (`GRANT SELECT` only on `public`). The Demo A server connects with
   `DATABASE_URL_READONLY` (separate from the ETL's `DATABASE_URL`).
   Even a hallucinated `BEGIN; UPDATE …; COMMIT;` is rejected by the DB
   with `ERROR: permission denied`, which surfaces back to the LLM as
   `isError: true` so it can self-correct.
2. **Dev workflow is `npm run build && npm run serve`.** No Docker for the
   demo server itself; it's vanilla Node + Express. Postgres still runs in
   Docker via `docker compose` from Feature 001.
3. **Errors surface as `isError: true`** with the Postgres error message in
   `content`. Lets the LLM self-correct on retry instead of crashing the
   subprocess.
4. **Chart-renderer accepts whichever result shape the LLM produces.** No
   pre-validation that the SQL "makes sense for this question" — it's the
   LLM's job to write a query that maps to one of the chart types or the
   table fallback.
5. **System prompt steers but does not constrain.** The prompt tells Claude
   what tools and resources exist, and that the schema docs SQL behaviour;
   it does **not** dictate query templates per question type.

## Acceptance Criteria

### Server (#6)

- [ ] `src/demo-a-mcp-apps/server.ts` is a TypeScript MCP server running on
      Streamable HTTP at `http://localhost:3001/mcp` using
      `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps`.
- [ ] Single tool `query_vehicles(sql: string)`:
  - Connects to Postgres via `pg` using `DATABASE_URL_READONLY` (the dedicated
    `vehicles_readonly` role) so DB-level permissions enforce read-only access
    regardless of the SQL the LLM writes
  - Executes the SQL via the pool
  - Returns rows as `structuredContent`
  - Returns a brief text summary in `content`
  - Carries `_meta.ui.resourceUri = "ui://vehicle/chart-renderer/mcp-app.html"`
- [ ] Single UI resource `ui://vehicle/chart-renderer/mcp-app.html` served via
      `registerAppResource` with `mimeType = RESOURCE_MIME_TYPE`
      (`text/html+mcp`).
- [ ] Errors return `{ isError: true, content: [text with Postgres error] }`
      so the LLM can retry.
- [ ] No NL→SQL helpers; no question-specific templates; no ORM (Article III).
- [ ] `package.json` pins direct deps to latest stable; `tsconfig.json`
      targets ES2022 / ESNext modules / bundler resolution.

### UI (#7)

- [ ] `src/demo-a-mcp-apps/mcp-app.html` is the iframe entry point.
- [ ] `src/demo-a-mcp-apps/src/mcp-app.ts` uses the `App` class from
      `@modelcontextprotocol/ext-apps` for host communication.
- [ ] On `app.ontoolresult`, the iframe inspects `structuredContent` column
      names and picks a chart type via this precedence ladder:
      1. has `period_label` OR (`year` AND `quarter`) → **line chart** (multi-series
         if a non-period categorical column is also present)
      2. has `make` + a count-like column → **horizontal bar**
      3. has `fuel` + a count-like column → **donut**
      4. else → **table fallback**
- [ ] Row-count caps prevent unreadable charts (else → table fallback):
      donut ≤ 12 slices, bar ≤ 50 rows, line ≤ 200 points × 8 series.
- [ ] Fuel chart colours: green for electric (`BATTERY ELECTRIC`,
      `FUEL CELL ELECTRIC`, `RANGE EXTENDED ELECTRIC`); blue for hybrids
      (anything matching `%HYBRID%`); grey for `PETROL` / `DIESEL`; amber
      for `GAS`; light-grey for `OTHER FUEL TYPES`.
- [ ] Chart.js 4 is an `npm` dep, bundled into the HTML via
      `vite-plugin-singlefile`. No external script sources at runtime
      (CSP-friendly under any host).

### Claude Desktop config + system prompt (#8)

- [ ] `src/demo-a-mcp-apps/claude-desktop-config.json` — drop-in entry
      contributors merge into their `claude_desktop_config.json`. Uses the
      `mcp-remote` shim to bridge Claude Desktop's stdio expectation to the
      local HTTP server:
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
- [ ] **Free Claude plan works** — manual JSON config in Claude Desktop has
      no subscription gate; no cloudflared tunnel, no custom-connector UI.
- [ ] `src/demo-a-mcp-apps/system-prompt.md`:
      - Tells Claude the schema is documented entirely via `COMMENT ON ...`
      - Steers Claude to introspect via `pg_catalog` before writing SQL
      - Names the available tool (`query_vehicles`) and the chart-renderer
        UI, plus the heuristic ladder so Claude knows what shape produces
        which chart
      - Forbids fabricated SQL — must inspect schema first
- [ ] README quick-start references the config and prompt.

### End-to-end (#9, milestone gate)

- [ ] All five golden-path queries produce a chart (or graceful table) in
      Claude Desktop:
      - Fuel breakdown for Cars in 2024 → donut
      - EV growth trend since 2015 → line
      - Top 10 makes by licensed vehicles → horizontal bar
      - Licensed vs SORN for motorcycles over time → line (multi-series)
      - Which fuel type grew fastest in last 5 years → line **or** donut
        depending on the SQL Claude writes — both are correct outcomes
- [ ] `docs/ROADMAP.md` `v0.2.0` row marked ✅
- [ ] Tag `v0.2.0` after merge

## Out of Scope

- Demo B (CopilotKit) — Feature 003.
- Authentication, multi-tenant deployment, hosted demos.
- Custom NL→SQL helpers, query templates, or ORMs (forbidden by Article III).
- Production-grade CSP / strict origin validation in the iframe. The MCP Apps
  SDK's `App` class handles the canonical envelope; threat model for a local
  PoC is minimal.
- Build-time TypeScript types generated from the Postgres schema. Out of
  scope for the PoC; the SQL surface is small.
- Cloudflared / public tunnel. The demo runs on `localhost`; Claude Desktop
  uses `mcp-remote` to reach it.

## Dependencies

- **Depends on:**
  - Feature 001 (schema + populated DB).
  - Constitution v1.1.0 (#10) — required for the canonical architecture.
- **Blocks:** Feature 004 (Comparison) — needs both demos shipped.
- **External:** Claude Desktop installed (free plan works), Node 22+, the
  user's Postgres container running.

## Constitution Compliance

- [x] **Article I — Source Layout:** all code in `src/demo-a-mcp-apps/`.
- [x] **Article II — Demo Isolation:** Demo A only consumes the shared DB
      and types from `src/shared/`; nothing crosses into Demo B.
- [x] **Article III (v1.1.0) — Schema-First, LLM-Writes-SQL:** server owns a
      generic `query_vehicles(sql)` tool. LLM writes raw SQL by reading
      `COMMENT ON ...`. No NL→SQL helpers, no question-specific templates,
      no ORM. Uses the canonical `@modelcontextprotocol/ext-apps` pattern
      as required.
- [x] **Article IV — Latest Dependencies:** TypeScript 5.8+, Node 22 LTS,
      latest stable `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`,
      `pg`, `chart.js`, `vite`, `vite-plugin-singlefile`, `express`, `cors`.
      Exact pins resolved by `/speckit.plan` research.
- [x] **Article V — Documentation-First:** spec → plan → tasks → code.
- [x] **Article VI — Mermaid-Only Diagrams:** plan and README diagrams use
      Mermaid. The chart-renderer is a Chart.js view — UI, not architecture.
- [x] **Article VII — Simplicity:** one server file, one UI HTML, one TS
      module, one bundled chart-renderer covering all chart types via the
      precedence ladder. No build pipeline beyond Vite + `vite-plugin-singlefile`.
