# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Demo A -- schema cheatsheet constraint + sample-value columns.**
  `buildSchemaCheatsheet()` now includes a `constraints` cell per column
  (NOT NULL, PK, UNIQUE, FK->table.col, CHECK) sourced from `pg_constraint` +
  `pg_attribute.attnotnull`, plus a "Sample values" list for low-cardinality
  TEXT/integer columns (<=30 distinct values per `pg_stats`).

- **Demo A -- `query_vehicles_chunked` streaming tool (feature-flagged).**
  Set `ENABLE_STREAMING=true` to register a cursor-based pagination tool.
  Returns `{ rows, has_more, next_cursor, chunk_size, cursor }`.

- **Demo A -- `query-cache.ts` LRU query cache.**
  `queryCache` singleton wired into `query_vehicles`; 11 unit tests pass.
  `GET /cache-stats` debug endpoint. Configurable via `CACHE_MAX`/`CACHE_TTL`.

- **Demo A -- chunked envelope support in client.**
  `chart-renderer.ts` exports `ChunkedEnvelope`, `isChunkedEnvelope`,
  `renderFromChunked`. `mcp-app.ts` accumulates rows across chunked tool results.

- **Demo A -- `examples/streaming-consumer.ts`.**
  Standalone TypeScript example for consuming `query_vehicles_chunked`.

- **Demo A -- content-addressed resource URI.**
  `vite.config.ts` `write-resource-uri` plugin writes `dist/resource-uri.json`;
  `server.ts` reads it at startup.

- **Tests/CI — Demo A node:test suite.**
  `resource-uri.ts` extracted from `server.ts` with `FsAdapter` seam (18 tests).
  `query-cache.ts` extended with `createQueryCache` factory; LRU eviction +
  key-normalisation suites added (9 new tests on top of existing 11, 20 total).

- **Tests/CI — Demo B Vitest frontend suite (63 tests, 7 files).**
  New components: `PanelErrorBoundary`, `ProgressPanel`, `toolSchemas` (Zod).
  `Dashboard` wraps panels in `PanelErrorBoundary`; `usePanels` adds error panel kind.

- **Tests/CI — `scripts/run-tests.sh` + `scripts/run-tests.ps1`.**
  Unified runner covering Demo A (node:test) + Demo B (Vitest); exits non-zero on failure.

- **CI — `.github/workflows/ci.yml`.**
  GitHub Actions running the full test suite on every push/PR to main (Node 22 + pnpm 9).


### Changed

- **Demo A system prompt — MCP-first routing + comparison-shape hint.**
  Strengthened `src/shared/system-prompt.md` and added a `# TOOL ROUTING — READ
  FIRST` banner to the MCP `instructions` field in
  `src/demo-a-mcp-apps/server.ts` so Claude Desktop reaches for
  `query_vehicles` instead of web search for vehicle questions, and so
  "compare A vs B" prompts settle on a stable grouped-chart shape across
  repeated runs. No bundle change; users must re-paste
  `src/shared/system-prompt.md` into Claude Desktop → Settings → Profile →
  Custom Instructions and restart Claude Desktop to pick it up.

## [1.0.0] — 2026-05-14

### Added

- **Feature 004 — `docs/COMPARISON.md` (the headline deliverable).** A
  six-section, evidence-backed comparison of the two demos:
  (1) what you had to build (file inventory + line counts per category),
  (2) control-model table across seven concerns,
  (3) developer-experience notes (objective fixes captured from the
      v0.2.0–v0.3.0 history; subjective subsections marked
      `[FILL IN: human observations]`),
  (4) overlap analysis with a Mermaid diagram showing the database +
      shared system prompt as the only shared surfaces,
  (5) "when to use which" with concrete scenarios per demo,
  (6) a 200-word community recommendation framing the two as answers to
      different questions, not competitors.
- **README — `## Demo Script` section.** Step-by-step walkthrough for
  showing both demos to an audience: prerequisites, four timed steps,
  per-question talking points reusing the golden-path query set,
  troubleshooting cheatsheet for the failure modes most likely to
  surface during a live demo.
- **README architecture diagram refreshed** to match the as-shipped
  v0.3.0 stack (no more `mcp-postgres`, no more `FastMCP`; Demo B's two
  processes now drawn explicitly).

### Changed

- **README "Demos" table** — both demos now marked ✅ with their shipped
  versions instead of "in progress" / "planned".
- **`docs/ROADMAP.md`** — v1.0.0 milestone marked ✅; comparison
  document, demo script, and tag verification all checked off.

### Notes

- Section 3 of `docs/COMPARISON.md` contains `[FILL IN: human
  observations]` markers in the two subsections that require lived
  author experience (rough time spent, what surprised you). All
  objective subsections are filled.
- No `src/` changes. This release is documentation + release bookkeeping
  only.

## [0.3.0] — 2026-05-14

### Added

- **Demo A — schema cheatsheet auto-embedded in MCP `instructions`.** The server
  now reads every public table/view + column + `COMMENT ON` doc string at boot
  and appends a Markdown cheatsheet to the `instructions` field. The cheatsheet
  is placed at the **top** of `instructions` behind a hard
  `# AUTHORITATIVE SCHEMA` banner that explicitly forbids common wrong guesses
  (`vehicles`, `makes`, `sales`, `registration_count`, `fuel_type`, …).
  Eliminates the trial-and-error introspection round-trips where Claude would
  guess non-existent tables before landing on the real schema. Constitution
  Article VI is preserved: `COMMENT ON` remains the sole source of truth —
  the cheatsheet is just a read of those comments.
- **Demo A — HITL suggestion chips beneath every chart.** A `Try next:` strip of
  3 contextual quick-prompt pills appears under every rendered chart. Clicking
  one calls `app.sendMessage()` from `@modelcontextprotocol/ext-apps` with a
  user-role text message, which Claude treats as a fresh user turn. Suggestions
  are tailored per chart type and the bar variant references the top-row make
  by name (e.g. "Show the quarterly trend for TOYOTA").
- **Demo A — modern light chart theme.** Renderer now uses an indigo / violet /
  cyan / emerald "AI" palette on a clean white canvas with subtle radial
  indigo/violet glow, gradient bar fills, area-fill line charts with smooth
  curves, a 62 %-cutout donut, light slate table surface with uppercase
  indigo-700 headers, and Inter typography throughout.

### Fixed

- **Demo A — Claude Desktop cached old chart UI by URI.** Resources are cached
  by URI; rebuilds with the same `ui://vehicle/chart-renderer/mcp-app.html`
  URI did not refetch in Claude Desktop. Bumped the URI through `v2`, `v3`,
  `v4` as new builds shipped to bust the cache. Long-term, version the URI on
  every UI release.
- **Demo A — aggregated queries silently fell back to TABLE.** `node-postgres`
  returns Postgres `BIGINT` (and any aggregate over `BIGINT` such as
  `SUM(count)` or `COUNT(*)`) as JavaScript **strings** to preserve precision.
  The chart-renderer's `countKey` heuristic required `typeof v === "number"`
  and so picked TABLE for every aggregated query. Added a `toNumber()` helper
  that coerces numeric strings, applied across all four renderers.
- **ETL — `v_schema_summary` exceeded `statement_timeout`.** The view did
  `COUNT(*) FROM fact_registrations` against ~19.6 M rows, blowing the 10 s
  timeout on the `vehicles_readonly` role. Switched to
  `pg_class.reltuples::BIGINT` (planner row estimate from `ANALYZE`) which
  returns instantly. Acceptable for a "schema summary" view; the comment on
  the view explains the trade-off.

- **Demo A — `Already connected to a transport` regression**
  (`src/demo-a-mcp-apps/server.ts`). The module-level `McpServer` singleton
  could only be connected to one `StreamableHTTPServerTransport`; every
  `/mcp` POST after the first 500ed silently. This caused two visible
  symptoms in Claude Desktop: the iframe showing "There was a problem
  displaying content from vehicle-genui-demo-a" (the `resources/read`
  follow-up failed) and a flood of repeated tool calls (the LLM retrying
  failed requests). Refactored to a `buildServer()` factory invoked per
  request — fresh `McpServer` + transport per POST, matching the canonical
  stateless StreamableHTTP pattern. Verified locally: 3 sequential POSTs
  all return 200.

### Changed

- **Demo A documentation — Claude Desktop wiring on Windows**
  (`src/demo-a-mcp-apps/README.md`, `src/demo-a-mcp-apps/claude-desktop-config.json`):
  - Added "Install `mcp-remote` globally" step (`npm install -g mcp-remote`)
    to avoid Claude Desktop's 60-second initialisation timeout on the
    first `npx` cold-download.
  - Documented the Microsoft Store / MSIX build's sandboxed config path
    (`%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\…`);
    the plain `%APPDATA%` location is silently ignored by that build.
  - Updated the `command` field from `npx` to `npx.cmd` — Claude Desktop
    spawns commands directly without a shell on Windows, so the `.cmd`
    extension is required.
  - Expanded troubleshooting with the "Could not attach to MCP server"
    diagnosis (cold `npx` exceeded init budget) and the MSIX log path.

- **Demo A + Demo B loading state — visual skeletons**:
  - Demo A `mcp-app.html` now shows an inline-CSS shimmer skeleton inside
    the iframe immediately on render (cleared by the existing `clearRoot()`
    on first `ontoolresult`). Bundled into `dist/mcp-app.html` via
    `vite-plugin-singlefile`.
  - Demo B `ChartSkeleton.tsx` replaces the "Loading chart…" text with a
    bar-chart-shaped placeholder (5 pulsing bars + title bars) while the
    `useCopilotAction` tool call is streaming.

- **Demo B — Static GenUI tool registration fix**
  (`src/demo-b-copilotkit/frontend/src/tools/useShow{FuelBreakdown,Trend,TopMakes}.tsx`).
  The three `useCopilotAction` hooks declared `available: "frontend"`,
  which routes them to `useRenderToolCall` — render-only, never registered
  as a callable tool the LLM can invoke. Removed `available: "frontend"`
  so each hook falls through to `useFrontendTool`. Charts now render in
  response to the LLM's `show_*` tool calls.

### Added

- **Feature 003 — Demo B (CopilotKit Static AG-UI dashboard)**:
  - `src/demo-b-copilotkit/` pnpm workspace with two packages:
    - `frontend/` — Vite 7 + React 19 + Tailwind v4 + Recharts 3 dashboard
      with a `<CopilotKit>` provider, a 12-column grid, three Generative-UI
      panels (`FuelBreakdownChart` donut, `TrendChart` line/multi-series,
      `TopMakesTable` horizontal bar), a `<CopilotPopup>` chat surface, and
      a chip-bar for the five golden-path queries.
    - `runtime/` — Express 5 + `@copilotkit/runtime` 1.57 + Anthropic
      adapter (Claude Sonnet 4.5). Exposes `POST /api/copilotkit` and a
      `GET /health` probe. Owns a single generic server action
      `query_vehicles({ sql })` (Constitution Article III v1.1.0) backed by
      an LRU cache (`max=200`, `ttl=1h`) keyed by trimmed SQL.
  - **Hardened `vehicles_readonly` Postgres role** (shared with Demo A,
    `src/demo-a-mcp-apps/setup-readonly-role.sql`):
    - `default_transaction_read_only = on`, `statement_timeout = 10s`,
    - allow-list `SELECT` on exactly four relations
      (`dim_vehicle`, `dim_period`, `fact_registrations`, `v_schema_summary`)
      — no blanket `GRANT ALL`, so future tables are not auto-exposed.
  - **Startup role-hardening verifier** (`runtime/src/verify-role.ts`):
    fails the runtime process at boot unless all three guarantees hold.
  - **Shared system prompt** moved from `src/demo-a-mcp-apps/system-prompt.md`
    to `src/shared/system-prompt.md` (Constitution Article II — sharing
    only via `src/shared/` or the database). Demo B prepends a small header
    describing its three frontend tools (`show_fuel_breakdown`, `show_trend`,
    `show_top_makes`) and consumes the rest byte-for-byte via Vite `?raw`.
  - Three `useCopilotAction` registrations in `frontend/src/tools/` render
    `<ChartSkeleton />` while the tool call is streaming and the matching
    chart component on completion. Each writes to a tiny
    `useSyncExternalStore`-backed panel store with replace-by-id semantics
    (no panel stacking).
  - `src/demo-b-copilotkit/README.md` documents the two-process model,
    required env vars (`ANTHROPIC_API_KEY`, `DATABASE_URL`,
    `VITE_COPILOT_RUNTIME_URL`), and the manual Phase 7 verification
    checklist (the five golden-path queries).

### Added

- **Feature 002 — Phase 6 verification (v0.2.0 milestone gate)**:
  - Five golden-path queries executed end-to-end in **Claude for Windows v1.6608**
    (UWP / Microsoft Store build) via a `cloudflared` quick tunnel exposing the
    local MCP server. All five charts rendered inline.
  - `src/demo-a-mcp-apps/README.md` — new "Alternative — remote testing via
    cloudflared (Claude.ai web / Connectors)" section documenting the tunnel
    workflow plus the Claude Desktop remote-URL connector form (no
    `mcp-remote` stdio shim).
  - Repo `.gitignore` — added `.copilot/` (Copilot CLI session state).

### Changed

- **Constitution v1.1.0** — Article III amended from "No Custom Query Tools"
  to "Schema-First, LLM-Writes-SQL". The original requirement that all DB
  access go through `@modelcontextprotocol/server-postgres` is dropped; each
  demo now uses the canonical server SDK for its rendering surface and owns
  a generic SQL-execution tool. Intent preserved: schema `COMMENT ON`
  statements are the LLM's only prompt-engineering surface; LLM writes raw
  SQL; no NL→SQL helpers; no ORMs. Tech-stack table updated: `FastMCP` row
  removed; `@modelcontextprotocol/ext-apps` + `@modelcontextprotocol/sdk` and
  `pg` rows added. `CLAUDE.md` hard-constraints, project-layout, and
  tech-stack sections updated to match. Closes #10.

### Added

- **Feature 002 — Demo A MCP Apps client wiring (Phases 3–5)**:
  - `src/demo-a-mcp-apps/mcp-app.html` + `src/mcp-app.ts` — bundled iframe
    entry that wires the `@modelcontextprotocol/ext-apps` `App` to the chart
    renderer and routes tool results into the DOM.
  - `src/demo-a-mcp-apps/src/chart-renderer.ts` — pure `pickChartType` ladder
    (line / bar / donut / table) plus a Chart.js 4 renderer with the
    fuel-colour palette (electric green, hybrid blue, petrol/diesel grey,
    gas amber, other light grey) and an HTML-table fallback (including a
    "No data" message for empty result sets).
  - `vite-plugin-singlefile` build emits a single `dist/mcp-app.html`
    (~510 KB; over the original ~400 KB target due to `zod` pulled in by
    `ext-apps` — documented in `.squad/decisions.md`).
  - End-to-end `resources/read` confirmed: Phase 2's resource handler now
    serves the bundled HTML body (`mimeType: text/html;profile=mcp-app`,
    Chart.js detected in payload).
  - `src/demo-a-mcp-apps/claude-desktop-config.json` — `mcpServers` snippet
    (`npx mcp-remote http://localhost:3001/mcp`) for contributors to merge
    into their own `claude_desktop_config.json`.
  - `src/demo-a-mcp-apps/system-prompt.md` — schema-first system prompt
    paste-target for Claude Desktop → Settings → Profile → Custom
    instructions; covers `pg_catalog` schema introspection, the
    `query_vehicles({ sql })` contract, the renderer column ladder, and an
    explicit no-fabrication rule. No per-question SQL templates
    (Article III v1.1.0).
  - `src/demo-a-mcp-apps/README.md` + root `README.md` Quick Start update —
    one-time readonly-role setup, build/serve, Claude Desktop wiring, the
    five golden-path questions, and a short troubleshooting section.

- **Feature 002 — Demo A MCP Apps server (Phase 2)**:
  - `src/demo-a-mcp-apps/setup-readonly-role.sql` — idempotent DDL creating
    the `vehicles_readonly` Postgres role with `SELECT`-only on `public`.
    Verified: `SELECT` succeeds, `CREATE TABLE` is rejected with
    `permission denied for schema public`.
  - `src/demo-a-mcp-apps/server.ts` — Express 5 + MCP `StreamableHTTPServerTransport`
    on `POST /mcp` (port 3001). Registers a generic `query_vehicles` tool
    via `registerAppTool` (Zod `{ sql: string }` input, returns rows under
    `structuredContent.rows`, `_meta.ui.resourceUri` linked to the bundled
    UI). Registers the `ui://vehicle/chart-renderer/mcp-app.html` resource
    via `registerAppResource` — handler reads `dist/mcp-app.html` at request
    time and returns `isError: true` if the bundle has not been built yet.
  - End-to-end smoke test verified: `tools/list` advertises `query_vehicles`
    with the `_meta.ui` linkage; a `SELECT` over `fact_registrations` returns
    the top makes (FORD, VAUXHALL, MERCEDES, RENAULT, VOLKSWAGEN);
    a `CREATE TABLE` is rejected with `isError: true`; `resources/read`
    returns the placeholder bundle (real UI lands in Phase 3).

- **Feature 001 — ETL + Postgres schema foundation** (#1, #2, #3, #4):
  - `docker-compose.yml` runs Postgres 16 (Alpine) on `localhost:5432` with
    a named `pgdata` volume and a `pg_isready` healthcheck. pgAdmin
    intentionally omitted — connect any local pgAdmin / psql to the
    exposed port.
  - `.env.example` documents `POSTGRES_USER/PASSWORD/DB`, `DATABASE_URL`,
    and `VEH0120_CSV`.
  - `src/etl/schema.sql`: star schema (`dim_vehicle`, `dim_period`,
    `fact_registrations`) plus `v_schema_summary` view. Every table and
    every column carries a `COMMENT ON …` written for LLM consumption —
    enumerations include all 6 body types, all 11 fuel types, and the 2
    licence statuses (Licensed, SORN) sampled from the CSV. Four
    verification queries appear as trailing SQL comments.
  - `src/etl/etl.py`: idempotent ETL. Dim inserts via
    `psycopg2.extras.execute_values` (page_size=5000). Fact inserts via
    chunked `pandas.melt` → `DataFrame.to_csv` → `COPY FROM` into a TEMP
    staging table → server-side `INSERT … SELECT … JOIN dim_vehicle`
    to resolve `vehicle_id` without per-row Python work. A fast-skip
    short-circuits re-runs on a populated DB in ~3 s; run
    `TRUNCATE fact_registrations` to force a reload.
  - `src/etl/requirements.txt`: pinned `psycopg2-binary==2.9.12`,
    `pandas==3.0.2`, `python-dotenv==1.2.2` (latest stable on 2026-05-07).

### Notes

- Initial load row counts: `dim_vehicle=139,553`, `dim_period=82`,
  `fact_registrations=19,666,224`. Period coverage 1994 Q4 → 2025 Q2 (no
  provisional quarters in the source data).
- First-run timing on Docker Desktop / Windows is approximately 35 minutes
  due to WSL2 volume I/O and Postgres index maintenance at the 19.7M-row
  fact scale. This is a one-time onboarding cost — re-runs are < 5 s via
  fast-skip. See `specs/feat-001-etl-schema-foundation/spec.md` for the
  full discussion.

## [0.0.1] — 2026-05-07

### Added

- Spec Kit SDD scaffold: `.specify/constitution.md`, templates, slash
  commands under `.claude/commands/`.
- Empty source tree under `src/` with placeholders for `shared/`, `etl/`,
  `demo-a-mcp-apps/`, and `demo-b-copilotkit/frontend/`.
- Repository documentation: `README.md`, `docs/PRD.md`, `docs/ROADMAP.md`.
- GitHub issue and pull request templates under `.github/`.
- Root `.gitignore` covering Python, Node, environment files, and raw CSV data.
- `data/README.md` documenting where the user must place the DVLA VEH0120 CSV.
