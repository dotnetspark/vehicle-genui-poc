# Tasks — Feature 003 (Demo B / CopilotKit)

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked (reason in notes)

`[P]` after a task title = can run in parallel with sibling `[P]` tasks
in the same phase.

## Phase 1 — Workspace scaffold

### Task 1.1 — Create pnpm workspace and demo root README
**Acceptance:** `pnpm-workspace.yaml` lists `frontend` and `runtime`.
`src/demo-b-copilotkit/README.md` documents the two-process model
(`pnpm --filter runtime start`, `pnpm --filter frontend dev`),
required env vars (`ANTHROPIC_API_KEY`, `DATABASE_URL`,
`VITE_COPILOT_RUNTIME_URL`), and the five golden-path queries.
`pnpm install` from `src/demo-b-copilotkit/` resolves with no errors
(empty installs at this stage are fine).
**Files:** `src/demo-b-copilotkit/pnpm-workspace.yaml`,
`src/demo-b-copilotkit/README.md`,
`src/demo-b-copilotkit/.gitignore`
**Dependencies:** none
**Parallel:** No (root for everything else)
- [ ] Implementation
- [ ] `pnpm install` succeeds

### Task 1.2 — Frontend package skeleton [P]
**Acceptance:** `src/demo-b-copilotkit/frontend/package.json` declares
all deps from plan's frontend table at the resolved versions
(CopilotKit 1.57.1, React 19.2.6, Vite 8, TS 6, Tailwind v4,
Recharts 3.8). `tsconfig.json`, `vite.config.ts` (with React plugin
and `@tailwindcss/vite`), `index.html`, `src/main.tsx` (renders
`<App />`), `src/App.tsx` (returns `null`), `src/styles.css`
(Tailwind v4 entry), `.env.example`. `pnpm --filter frontend build`
succeeds.
**Files:** `src/demo-b-copilotkit/frontend/{package.json,
tsconfig.json, vite.config.ts, index.html, .env.example}`,
`src/demo-b-copilotkit/frontend/src/{main.tsx, App.tsx, styles.css}`
**Dependencies:** 1.1
**Parallel:** Yes (with 1.3)
- [ ] Implementation
- [ ] `pnpm --filter frontend build` produces a `dist/`

### Task 1.3 — Runtime package skeleton [P]
**Acceptance:** `src/demo-b-copilotkit/runtime/package.json` declares
all deps from plan's runtime table at resolved versions
(`@copilotkit/runtime` 1.57.1, `@anthropic-ai/sdk` latest, Express 5,
`pg` 8.20, `lru-cache` 11, dotenv 17, tsx 4.21, TS 6).
`tsconfig.json`, `src/index.ts` (Express server listening on
`PORT || 4001`, `GET /health` returns `{ ok: true }`), `.env.example`.
`pnpm --filter runtime start` boots and `curl localhost:4001/health`
returns `{ ok: true }`.
**Files:** `src/demo-b-copilotkit/runtime/{package.json,
tsconfig.json, .env.example}`,
`src/demo-b-copilotkit/runtime/src/index.ts`
**Dependencies:** 1.1
**Parallel:** Yes (with 1.2)
- [ ] Implementation
- [ ] `/health` returns 200

## Phase 2 — Database layer

### Task 2.1 — `pg.Pool` against `vehicles_readonly`
**Acceptance:** `runtime/src/db/pool.ts` exports a singleton
`pg.Pool` configured from `DATABASE_URL` env. A short script
`runtime/scripts/db-smoke.ts` runs `SELECT current_user, current_database()`
and prints `vehicles_readonly` and `vehicles`. Pool is reused
across requests.
**Files:** `src/demo-b-copilotkit/runtime/src/db/pool.ts`,
`src/demo-b-copilotkit/runtime/scripts/db-smoke.ts`
**Dependencies:** 1.3
**Parallel:** No
- [ ] Implementation
- [ ] `pnpm tsx scripts/db-smoke.ts` prints expected user/db

### Task 2.2 — Startup role-hardening verification
**Acceptance:** `runtime/src/verify-role.ts` runs at server bootstrap
and *fails the process* if any of:
`current_setting('transaction_read_only') != 'on'`,
`current_setting('statement_timeout')` is not `'10s'` (or `'10000'`),
or the role has any non-`SELECT` table privilege. On success, logs
`role=vehicles_readonly read_only=on statement_timeout=10s grants=4`.
Wired into `index.ts` before Express `listen()`.
**Files:** `src/demo-b-copilotkit/runtime/src/verify-role.ts`,
`src/demo-b-copilotkit/runtime/src/index.ts` (wire-in)
**Dependencies:** 2.1
**Parallel:** No
- [ ] Implementation
- [ ] Server refuses to start when run against a non-hardened role
      (manually verified by temporarily resetting `statement_timeout`)

## Phase 3 — `query_vehicles` action

### Task 3.1 — Action with LRU cache, no CopilotKit yet
**Acceptance:** `runtime/src/actions/queryVehicles.ts` exports
`async function queryVehicles({ sql }: { sql: string }):
Promise<{ rows: unknown[]; cached: boolean }>` that:
- trims the SQL string for the cache key,
- consults `lru-cache` (`max: 200`, `ttl: 1h`) before hitting `pg`,
- returns `{ rows, cached: true }` on hit, `{ rows, cached: false }`
  on miss,
- propagates Postgres errors verbatim.
A second smoke script `runtime/scripts/query-smoke.ts` runs
the `pg_class` introspection SQL twice and asserts `cached: false`
then `cached: true`.
**Files:** `src/demo-b-copilotkit/runtime/src/actions/queryVehicles.ts`,
`src/demo-b-copilotkit/runtime/scripts/query-smoke.ts`
**Dependencies:** 2.2
**Parallel:** No
- [ ] Implementation
- [ ] Smoke script passes both assertions

### Task 3.2 — CopilotKit Runtime + Anthropic adapter wiring
**Acceptance:** `runtime/src/copilotkit.ts` constructs a
`CopilotRuntime` with one server `Action` named `query_vehicles`
(parameter `sql: string`, handler delegates to Task 3.1) and an
`AnthropicAdapter` (model `claude-sonnet-4-5` or latest sonnet,
key from `ANTHROPIC_API_KEY`). `index.ts` mounts the handler at
`POST /api/copilotkit` with CORS allowing
`http://localhost:5173`. A `curl` against `/api/copilotkit/info`
(or equivalent runtime health endpoint) returns 200.
**Files:** `src/demo-b-copilotkit/runtime/src/copilotkit.ts`,
`src/demo-b-copilotkit/runtime/src/index.ts` (mount + CORS)
**Dependencies:** 3.1
**Parallel:** No
- [ ] Implementation
- [ ] Runtime boots, role check passes, endpoint reachable

## Phase 4 — Frontend chart components (isolated)

### Task 4.1 — `ChartSkeleton` + `Panel` chrome [P]
**Acceptance:** `Panel.tsx` renders title, optional caption, and
children inside a Tailwind card. `ChartSkeleton.tsx` renders an
animated placeholder. Both viewable on a temporary
`/playground` route added to `App.tsx`.
**Files:** `frontend/src/components/{Panel.tsx, ChartSkeleton.tsx}`,
`frontend/src/App.tsx` (playground route)
**Dependencies:** 1.2
**Parallel:** Yes (with 4.2, 4.3, 4.4)
- [ ] Implementation
- [ ] Visible at `/playground`

### Task 4.2 — `FuelBreakdownChart` [P]
**Acceptance:** Renders Recharts donut from prop
`data: { fuel: string; count: number; percentage: number }[]`.
Fuel-colour palette matches Demo A (electric green `#10b981`,
hybrid blue `#3b82f6`, petrol `#6b7280`, diesel `#374151`,
gas `#f59e0b`, other `#d1d5db`). Renders correctly with hardcoded
6-row sample on `/playground`.
**Files:** `frontend/src/components/FuelBreakdownChart.tsx`
**Dependencies:** 4.1
**Parallel:** Yes (with 4.3, 4.4)
- [ ] Implementation
- [ ] Donut visible on `/playground`

### Task 4.3 — `TrendChart` [P]
**Acceptance:** Renders Recharts `LineChart` from prop
`{ title: string; series: { name: string; points: { x: string|number; y: number }[] }[] }`.
Supports 1–4 series. Renders 2-series sample on `/playground`.
**Files:** `frontend/src/components/TrendChart.tsx`
**Dependencies:** 4.1
**Parallel:** Yes (with 4.2, 4.4)
- [ ] Implementation
- [ ] Multi-series line visible on `/playground`

### Task 4.4 — `TopMakesTable` (horizontal bar) [P]
**Acceptance:** Renders Recharts horizontal `BarChart` from prop
`data: { make: string; count: number }[]`, top-N sorted desc.
Renders 10-row sample on `/playground`.
**Files:** `frontend/src/components/TopMakesTable.tsx`
**Dependencies:** 4.1
**Parallel:** Yes (with 4.2, 4.3)
- [ ] Implementation
- [ ] Horizontal bar visible on `/playground`

## Phase 5 — Dashboard layout

### Task 5.1 — Panel state store
**Acceptance:** `frontend/src/state/usePanels.ts` exports a hook with
`{ panels: Record<string, PanelDescriptor>; setPanel(id, desc); clearAll() }`
where `PanelDescriptor` is a discriminated union over the three
chart kinds plus their typed data. Replacing a panel by id
overwrites; never stacks.
**Files:** `frontend/src/state/usePanels.ts`
**Dependencies:** 4.2, 4.3, 4.4
**Parallel:** No
- [ ] Implementation
- [ ] Vitest-free unit test via temporary playground button: setPanel
      twice with same id renders only the latest

### Task 5.2 — `Dashboard` 12-column grid + panel router
**Acceptance:** `Dashboard.tsx` reads `usePanels` and renders each
panel into a CSS grid cell with column-span chosen by chart kind
(donut → 4, bar → 6, line → 8, table → 12). Empty state shows
"Ask a question or pick a chip below" placeholder.
**Files:** `frontend/src/components/Dashboard.tsx`
**Dependencies:** 5.1
**Parallel:** No
- [ ] Implementation
- [ ] Verified by toggling 3 panels via playground buttons

### Task 5.3 — `PromptInput` and `QueryChips` (inert UI shell) [P]
**Acceptance:** `PromptInput.tsx` is a single Tailwind text input
with placeholder *"Ask about UK vehicle registrations…"*.
`QueryChips.tsx` renders 5 horizontally scrollable chips matching
the v0.2.0 golden-path queries. Both wired into `App.tsx` above
`Dashboard`. Click handlers are no-ops at this stage.
**Files:** `frontend/src/components/{PromptInput.tsx, QueryChips.tsx}`,
`frontend/src/App.tsx`
**Dependencies:** 5.2
**Parallel:** Yes (with 5.4)
- [ ] Implementation
- [ ] Layout matches spec.md

### Task 5.4 — Tailwind v4 final styling pass [P]
**Acceptance:** Theme tokens (background, surface, border, accent)
defined in `styles.css`. Dashboard, panels, chips, and chat popup
use consistent spacing. Desktop-only (no mobile breakpoints needed).
**Files:** `frontend/src/styles.css`,
`frontend/src/components/*.tsx` (className tweaks only)
**Dependencies:** 5.3
**Parallel:** Yes (with 5.3 final pass)
- [ ] Implementation
- [ ] Visual review against spec.md layout requirements

## Phase 6 — CopilotKit wiring

### Task 6.1 — Shared system prompt loader
**Acceptance:** `frontend/src/prompt/system-prompt.ts` imports
`../../../shared/system-prompt.md?raw` (Vite raw import — file lives
in `src/shared/` per Constitution Article II) and exports the string
as `SYSTEM_PROMPT`. A short header explains
that the three frontend tools (`show_fuel_breakdown`, `show_trend`,
`show_top_makes`) are how the LLM renders results in this demo;
the rest is byte-identical to Demo A.
**Files:** `frontend/src/prompt/system-prompt.ts`,
`frontend/vite.config.ts` (verify `?raw` works across workspace)
**Dependencies:** 5.4
**Parallel:** No
- [ ] Implementation
- [ ] String contains the `pg_class` introspection SQL from Demo A

### Task 6.2 — `CopilotKit` provider + `useCopilotReadable`
**Acceptance:** `App.tsx` wraps the page in
`<CopilotKit runtimeUrl={import.meta.env.VITE_COPILOT_RUNTIME_URL}>`
and registers `useCopilotReadable({ description: "system",
value: SYSTEM_PROMPT })` once at mount. Browser network tab shows
GraphQL handshake to runtime succeeds.
**Files:** `frontend/src/App.tsx`
**Dependencies:** 6.1, 3.2
**Parallel:** No
- [ ] Implementation
- [ ] Handshake 200 in network tab

### Task 6.3 — Three `useFrontendTool` registrations
**Acceptance:** Three hooks (`useShowFuelBreakdown`,
`useShowTrend`, `useShowTopMakes`) register frontend tools whose
`render` returns `<ChartSkeleton />` while `status === "inProgress"`
and the matching chart component otherwise. Each tool calls
`usePanels.setPanel` with the supplied panel id and data.
Argument schemas match spec.md exactly.
**Files:** `frontend/src/tools/{useShowFuelBreakdown.ts,
useShowTrend.ts, useShowTopMakes.ts}`,
`frontend/src/App.tsx` (call all three at top level)
**Dependencies:** 6.2
**Parallel:** No (single `App.tsx` edit)
- [ ] Implementation
- [ ] Manual test: paste a tool-call JSON via Anthropic console
      style or trigger from `CopilotPopup` chat: panel renders

### Task 6.4 — `CopilotPopup` (collapsed by default) and chip wiring
**Acceptance:** `<CopilotPopup defaultOpen={false} />` mounted
bottom-right. Clicking a chip in `QueryChips` dispatches the
question into the CopilotKit chat (via
`useCopilotChat().appendMessage`) and opens the popup. Spinner
visible while a tool call is in flight.
**Files:** `frontend/src/App.tsx`,
`frontend/src/components/QueryChips.tsx`
**Dependencies:** 6.3
**Parallel:** No
- [ ] Implementation
- [ ] Chip click triggers a chat round-trip

### Task 6.5 — Remove `/playground` route
**Acceptance:** `/playground` and any sample-data scaffolding
deleted; `App.tsx` shows only the production layout.
**Files:** `frontend/src/App.tsx`,
delete any temporary `Playground.tsx` if introduced
**Dependencies:** 6.4
**Parallel:** No
- [ ] Implementation
- [ ] No "playground" string in `frontend/src/`

## Phase 7 — End-to-end verification

### Task 7.1 — Five golden-path queries
**Acceptance:** With Postgres up, runtime started, and frontend
running, each of these chip clicks renders the expected panel
end-to-end (LLM picks the right tool unaided):
1. *"Fuel breakdown for Cars in 2024"* → donut
2. *"EV growth trend since 2015"* → line
3. *"Top 10 makes by licensed vehicles"* → bar
4. *"Licensed vs SORN for motorcycles over time"* → multi-series line
5. *"Which fuel type grew fastest in the last 5 years?"* → line OR donut

If any query fails, refine **only** the system prompt — never add
per-question helpers.
**Files:** `src/demo-a-mcp-apps/system-prompt.md` (only if a refinement is
needed and applies to both demos)
**Dependencies:** 6.5
**Parallel:** No
- [ ] All 5 queries pass

### Task 7.2 — Cache-hit observation
**Acceptance:** Re-running the same chip a second time returns
`cached: true` in the runtime logs. Documented in
`src/demo-b-copilotkit/README.md` under a *Performance notes* heading.
**Files:** `src/demo-b-copilotkit/README.md`
**Dependencies:** 7.1
**Parallel:** No
- [ ] Cache-hit verified
- [ ] README updated

## Phase 8 — Release plumbing

### Task 8.1 — Update CHANGELOG and close roadmap item
**Acceptance:** `CHANGELOG.md` has an entry under `[Unreleased]`
describing Feature 003 (Demo B / CopilotKit Static GenUI dashboard,
runtime, three frontend tools, role hardening, LRU cache).
`docs/ROADMAP.md` v0.3.0 row marked ✅ with the actual scope
shipped (note any deviations from the original v0.3.0 row).
**Files:** `CHANGELOG.md`, `docs/ROADMAP.md`
**Dependencies:** All previous tasks complete
- [ ] CHANGELOG entry written
- [ ] Roadmap item marked done
