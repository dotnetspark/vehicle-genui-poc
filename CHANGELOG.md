# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
