# Demo B — CopilotKit Static GenUI Dashboard

Vite + React 19 dashboard backed by a standalone Node + Express CopilotKit
Runtime. Demonstrates the **CopilotKit Static AG-UI** pattern: the LLM
calls pre-registered React components as tools instead of emitting UI.

Counterpart to Demo A (MCP Apps). Both demos query the same PostgreSQL
database via the same `vehicles_readonly` role and answer the same five
golden-path questions, so `docs/COMPARISON.md` can rate them like-for-like.

## Prerequisites

- Postgres 16 running (`docker compose up -d` from repo root)
- Feature 001 ETL has loaded data into `public.{dim_vehicle, dim_period,
  fact_registrations, v_schema_summary}`
- `vehicles_readonly` role created and hardened (run
  `src/demo-a-mcp-apps/setup-readonly-role.sql` once)
- Node 22+ and pnpm 9+
- An Anthropic API key

## Install

```powershell
cd src\demo-b-copilotkit
pnpm install
```

## Configure

Two `.env` files (one per process), copied from `.env.example`:

```powershell
Copy-Item runtime\.env.example runtime\.env
Copy-Item frontend\.env.example frontend\.env
```

Then edit `runtime\.env`:

```env
DATABASE_URL=postgresql://vehicles_readonly:readonly@localhost:5432/vehicles
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
PORT=4001
ALLOWED_ORIGIN=http://localhost:5173
```

`frontend\.env` only needs:

```env
VITE_COPILOT_RUNTIME_URL=http://localhost:4001/api/copilotkit
```

## Run (two processes)

```powershell
# Terminal 1 — runtime (Anthropic adapter + query_vehicles action)
pnpm --filter runtime start

# Terminal 2 — frontend (Vite dev server)
pnpm --filter frontend dev
```

Open `http://localhost:5173`.

## Five golden-path queries

These chips appear in the dashboard and constitute the acceptance test:

1. Fuel breakdown for Cars in 2024 → donut
2. EV growth trend since 2015 → line
3. Top 10 makes by licensed vehicles → horizontal bar
4. Licensed vs SORN for motorcycles over time → multi-series line
5. Which fuel type grew fastest in the last 5 years? → line or donut

## Architecture

See `specs/feat-003-demo-b-copilotkit/plan.md` for the full architecture.

In short:

- Frontend: Vite + React 19 + Tailwind v4 + Recharts + CopilotKit React.
  Three `useFrontendTool` registrations render charts into a 12-column
  dashboard grid.
- Runtime: Express + `@copilotkit/runtime` + Anthropic adapter. One server
  action `query_vehicles({ sql })` executes raw SQL via `pg` against the
  read-only role, wrapped in an LRU cache.
- Schema discovery: the LLM introspects `pg_catalog` at runtime via
  `query_vehicles`. The shared system prompt at
  `src/shared/system-prompt.md` is injected via `useCopilotReadable`.

## Performance notes

The runtime's `query_vehicles` action wraps `pg.query` in an LRU cache
(`max: 200`, `ttl: 1h`) keyed by the trimmed SQL string. Identical
follow-up queries return `{ cached: true }` and skip Postgres.

## Troubleshooting

- **Runtime won't start with `role-hardening check failed`** — re-run
  `src/demo-a-mcp-apps/setup-readonly-role.sql`.
- **`401 unauthorized` from Anthropic** — `ANTHROPIC_API_KEY` not set or
  invalid in `runtime\.env`.
- **CORS error in browser** — `ALLOWED_ORIGIN` in `runtime\.env` does not
  match the frontend dev URL.
