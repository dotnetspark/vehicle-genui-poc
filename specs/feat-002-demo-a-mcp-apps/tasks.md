# Tasks — Feature 002 — Demo A: MCP Apps Surface

Branch: `feat/002-demo-a-mcp-apps`
Issues: #6, #7, #8 (#9 is the milestone-tag e2e gate)
Milestone: `v0.2.0`
Constitution: v1.1.0 (Article III: Schema-First, LLM-Writes-SQL)

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked (reason in notes)

---

## Phase 1 — Project skeleton

### Task 1.1 — Initialise the TypeScript / Vite project

**Acceptance:**
- `src/demo-a-mcp-apps/package.json` declares `"type": "module"` and pinned deps
  per plan §Dependencies (sdk `^1.29.0`, ext-apps `^1.6.0`, pg `^8.20.0`,
  chart.js `^4.5.1`, express `^5.0.0`, cors `^2.8.5`; devDeps include
  typescript `^5.8.0`, tsx, vite `^6.0.0`, vite-plugin-singlefile `^2.3.2`,
  matched `@types/*`).
- Scripts: `build` (`INPUT=mcp-app.html vite build`), `serve` (`tsx server.ts`),
  `start` (alias for `serve`).
- `tsconfig.json` targets ES2022, ESNext modules, `moduleResolution: bundler`,
  `strict: true`, `esModuleInterop: true`, `outDir: dist`.
- `vite.config.ts` registers `viteSingleFile()` and uses `process.env.INPUT`.
- `npm install` from `src/demo-a-mcp-apps/` resolves cleanly with no warnings
  about peer deps mismatch.
- Empty placeholder `mcp-app.html` exists so the build script doesn't fail.
- `npm run build` produces `dist/mcp-app.html` (placeholder content).

**Files:** `src/demo-a-mcp-apps/package.json`, `tsconfig.json`, `vite.config.ts`,
`mcp-app.html` (placeholder), `package-lock.json`
**Dependencies:** none
**Parallel:** No
**Notes:**
- Use `npm` (not `pnpm`) for this demo — quickstart uses npm; `pnpm` is the
  constitution's choice for the demo-b frontend (Feature 003), but switching
  registries inside one demo would just cost time. Article IV doesn't pin
  package managers.
- Verify pinned major versions match research.md exactly.

- [x] Implementation — package.json, tsconfig.json, vite.config.ts, mcp-app.html placeholder; cross-env added for Windows compat
- [x] Verification — `npm install` resolved 151 packages with 0 vulnerabilities; `npm run build` produced `dist/mcp-app.html` (194 B placeholder) via Vite 6.4.2 + vite-plugin-singlefile

---

## Phase 2 — Server (#6)

### Task 2.1 — DB role + env setup [P]

**Acceptance:**
- `src/demo-a-mcp-apps/setup-readonly-role.sql` creates the
  `vehicles_readonly` role idempotently with `GRANT SELECT` only on `public`:
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
- `.env.example` (repo root) gains:
  ```
  DATABASE_URL_READONLY=postgresql://vehicles_readonly:readonly@localhost:5432/vehicles
  ```
- Local `.env` (gitignored) gains the same line.
- Apply via:
  `docker compose exec -T db psql -U postgres -d vehicles < src/demo-a-mcp-apps/setup-readonly-role.sql`
  → exits 0; re-running is a no-op.
- Verify role: a `psql` connection as `vehicles_readonly` can `SELECT * FROM dim_vehicle LIMIT 1;`
  but a `CREATE TABLE foo(id int);` returns `ERROR: permission denied`.

**Files:** `src/demo-a-mcp-apps/setup-readonly-role.sql` (new), `.env.example`
(modified), local `.env` (modified)
**Dependencies:** Feature 001 schema must be applied (it is — main is at v0.1.0)
**Parallel:** Yes — runs alongside Task 2.2
**Notes:**
- `vehicles_readonly` is intentionally named without a demo-A prefix; Demo B
  (Feature 003) will reuse the same role.
- Default password `readonly` is fine for a local PoC; documented in the
  Demo A README.

- [x] Implementation — applied via docker exec; idempotent on second run
- [x] Verification — SELECT dim_vehicle returned FORD 10740 / VAUXHALL 8173 / MERCEDES 7904; CREATE TABLE rejected "permission denied for schema public"

### Task 2.2 — Server scaffolding [P]

**Acceptance:**
- `src/demo-a-mcp-apps/server.ts` imports `McpServer`, `StreamableHTTPServerTransport`,
  `registerAppTool`, `registerAppResource`, `RESOURCE_MIME_TYPE`, `express`,
  `cors`, `Pool` (from `pg`), `fs/promises`, `path`.
- Creates `McpServer({ name: "Vehicle GenUI Demo A", version: "0.2.0" })`.
- Express app with `cors()`, `express.json()`, single POST `/mcp` route per
  the official quickstart pattern.
- `app.listen(3001)` with a startup log line.
- `tsx server.ts` runs; the process listens on 3001 even before the tool /
  resource are wired (returns empty `tools/list` response).

**Files:** `src/demo-a-mcp-apps/server.ts` (new)
**Dependencies:** Task 1.1 (deps installed)
**Parallel:** Yes — runs alongside Task 2.1
**Notes:**
- Mirror the quickstart's `server.ts` shape.
- The Pool, tool, and resource come in Tasks 2.3 / 2.4.

- [x] Implementation — server.ts scaffolded per quickstart pattern (already merged in repo)
- [x] Verification — Boot log "Demo A MCP server listening on http://localhost:3001/mcp" confirmed; POST /mcp with empty body returned 406 JSON-RPC error (route mounted)

### Task 2.3 — Tool: `query_vehicles`

**Acceptance:**
- Postgres `Pool` initialised from `process.env.DATABASE_URL_READONLY`.
- Tool registered via `registerAppTool` with:
  - name: `query_vehicles`
  - description: explains it runs raw SQL against the vehicles DB and returns rows
  - inputSchema: `{ type: "object", properties: { sql: { type: "string" } }, required: ["sql"] }`
  - `_meta: { ui: { resourceUri: "ui://vehicle/chart-renderer/mcp-app.html" } }`
- Handler runs `await pool.query(sql)`, returns:
  ```ts
  {
    content: [{ type: "text", text: `Returned ${rows.length} rows.` }],
    structuredContent: rows,
    isError: false
  }
  ```
- On `pg.DatabaseError`, returns `{ isError: true, content: [{ type: "text", text: err.message }] }`.

**Files:** `src/demo-a-mcp-apps/server.ts` (modified)
**Dependencies:** 2.1 (readonly role + env), 2.2 (server scaffolding)
**Parallel:** No
**Notes:**
- DB layer enforces read-only — we don't wrap queries in transactions.
- Catching only `pg` errors keeps unexpected errors visible (they crash the
  request, which is what we want during development).

- [x] Implementation — Pool wired to DATABASE_URL_READONLY; `query_vehicles` registered via `registerAppTool` with Zod inputSchema `{ sql }`, `_meta.ui.resourceUri`, returns `{ content, structuredContent: { rows }, isError }`, catches only `DatabaseError`
- [ ] Verification (`tools/list` shows `query_vehicles`; `tools/call` with `SELECT 1::int AS one;` returns rows; with a `CREATE TABLE …` returns `isError: true` and the permission-denied message)

### Task 2.4 — Resource: `ui://vehicle/chart-renderer/mcp-app.html`

**Acceptance:**
- `registerAppResource` registered with:
  - URI: `ui://vehicle/chart-renderer/mcp-app.html`
  - name: `Vehicle chart renderer`
  - options: `{ mimeType: RESOURCE_MIME_TYPE }`
  - handler: reads `path.join(import.meta.dirname, "dist", "mcp-app.html")` at request time
- If `dist/mcp-app.html` is missing, the handler returns a clear error
  (`{ contents: [], isError: true }`) rather than crashing.

**Files:** `src/demo-a-mcp-apps/server.ts` (modified)
**Dependencies:** 2.2
**Parallel:** No
**Notes:**
- At this task's time `dist/mcp-app.html` is just the empty placeholder from
  Task 1.1. Phase 3 will produce the real bundled UI; the resource handler
  doesn't change between then.

- [x] Implementation — `registerAppResource` wired with `(server, name, uri, { mimeType }, handler)`; handler reads `dist/mcp-app.html` at request time via `import.meta.dirname`; missing file returns `{ contents: [], isError: true }`
- [ ] Verification (`resources/read uri=ui://vehicle/chart-renderer/mcp-app.html` returns the placeholder HTML body)

### Task 2.5 — Phase 2 smoke test

**Acceptance:**
- `npm run serve` starts cleanly.
- `tools/list` returns `query_vehicles`.
- `tools/call query_vehicles { sql: "SELECT make, COUNT(*)::int FROM dim_vehicle GROUP BY make ORDER BY 2 DESC LIMIT 5" }`
  returns rows in `structuredContent`, `_meta.ui.resourceUri` set, `isError: false`.
- `tools/call query_vehicles { sql: "CREATE TABLE rogue(x int);" }` returns
  `isError: true` with `permission denied for schema public` (or similar).
- `resources/read uri=ui://vehicle/chart-renderer/mcp-app.html` returns the
  placeholder HTML body with the SDK's mimeType.

**Files:** none (verification only)
**Dependencies:** 2.3, 2.4
**Parallel:** No

- [x] Implementation — `npm run serve` started cleanly; MCP server listening on http://localhost:3001/mcp
- [x] Verification:
  - **tools/list**: query_vehicles present; `_meta.ui.resourceUri` = "ui://vehicle/chart-renderer/mcp-app.html" ✓
  - **tools/call (SELECT)**: isError=false; structuredContent.rows=[{make:"FORD",count:10740}, {make:"VAUXHALL",count:8173}, {make:"MERCEDES",count:7904}, {make:"RENAULT",count:7311}, {make:"VOLKSWAGEN",count:7156}] ✓
  - **tools/call (CREATE TABLE)**: isError=true; content="permission denied for schema public" ✓
  - **resources/list**: ui://vehicle/chart-renderer/mcp-app.html present; mimeType="text/html;profile=mcp-app" ✓
  - **resources/read**: Returns placeholder HTML body with DOCTYPE, title, and root div (Phase 3 will replace with bundled UI) ✓

---

## Phase 3 — UI (#7)

### Task 3.1 — UI entry point and `App` wiring

**Acceptance:**
- `src/demo-a-mcp-apps/mcp-app.html` contains a single `<div id="root"></div>`
  and `<script type="module" src="/src/mcp-app.ts"></script>`.
- `src/demo-a-mcp-apps/src/mcp-app.ts` instantiates
  `new App({ name: "Vehicle GenUI Demo A", version: "0.2.0" })`,
  calls `app.connect()`, and sets `app.ontoolresult` to delegate to
  `renderFromRows(result.structuredContent ?? [])`.
- A stub `renderFromRows` exists that just logs `rows.length` and renders
  `[N rows]` text — proves the wiring before the real renderer arrives.
- `npm run build` produces a non-empty `dist/mcp-app.html` (~20–50 KB; just
  the wiring + App class, before Chart.js).

**Files:** `src/demo-a-mcp-apps/mcp-app.html` (replaces placeholder),
`src/demo-a-mcp-apps/src/mcp-app.ts` (new)
**Dependencies:** Task 1.1
**Parallel:** No
**Notes:**
- The `App` class wraps the JSON-RPC envelope (`ui/notifications/tool-result`)
  on the iframe side. Don't write raw `window.addEventListener("message", …)`.

- [ ] Implementation
- [ ] Verification (open `dist/mcp-app.html` in a browser; `App.connect()` logs an init message; `window.postMessage(...)` with a synthetic tool-result payload triggers the stub)

### Task 3.2 — Chart renderer (column-shape ladder + Chart.js + table fallback)

**Acceptance:**
- `src/demo-a-mcp-apps/src/chart-renderer.ts` exports:
  - `pickChartType(rows: any[]): "line" | "bar" | "donut" | "table"` —
    implements the precedence ladder from spec acceptance criteria #7:
    1. has `period_label` OR (`year` AND `quarter`) → `"line"` (capped at 200×8 series)
    2. has `make` + count-like → `"bar"` (capped at 50)
    3. has `fuel` + count-like → `"donut"` (capped at 12)
    4. else → `"table"`
  - `renderFromRows(rows: any[]): void` — picks chart type, mounts the right
    Chart.js chart on `#root`, OR renders an HTML table for `"table"`.
- Fuel colour map per spec:
  - electric (BATTERY ELECTRIC, FUEL CELL ELECTRIC, RANGE EXTENDED ELECTRIC) → green
  - hybrid (anything matching `%HYBRID%`) → blue
  - PETROL / DIESEL → grey
  - GAS → amber
  - OTHER FUEL TYPES → light grey
- Empty `rows` (zero results) → `pickChartType` returns `"table"`, and the
  table renderer shows a `"No data"` message (not a blank `<div>`).
- `mcp-app.ts` updated to call `renderFromRows` (replacing the stub).

**Files:** `src/demo-a-mcp-apps/src/chart-renderer.ts` (new),
`src/demo-a-mcp-apps/src/mcp-app.ts` (modified)
**Dependencies:** 3.1
**Parallel:** No
**Notes:**
- `pickChartType` should be a pure function — easy to unit-test by
  hand-feeding row arrays in the browser console.
- Chart.js 4 supports tree-shaking; importing only the chart types we need
  keeps the bundle smaller (`Chart, LineElement, PointElement, BarElement,
  ArcElement, …`).
- Don't fight Chart.js defaults too hard — the comparison-document reader
  cares about mechanics, not pixel polish.

- [ ] Implementation
- [ ] Verification (in-browser smoke test with synthetic payloads for all four ladder branches)

### Task 3.3 — Verify the bundle

**Acceptance:**
- `npm run build` produces a single `dist/mcp-app.html` containing all JS
  and CSS inline (no `<script src="https://...">` references).
- Bundle size between ~150 KB and ~400 KB (Chart.js 4 minified ≈ 200 KB).
- Opening `dist/mcp-app.html` in a browser and posting a synthetic
  `ui/notifications/tool-result` message renders the corresponding chart
  for each of the four ladder branches.

**Files:** none (verification only)
**Dependencies:** 3.2
**Parallel:** No

- [ ] Implementation (run build, inspect bundle)
- [ ] Verification (4 in-browser smoke tests covering line, bar, donut, table paths)

---

## Phase 4 — Server reads built HTML (#7 finalised)

### Task 4.1 — End-to-end resource fetch

**Acceptance:**
- With `npm run build` having produced the bundled `dist/mcp-app.html`
  (Task 3.3 done), `npm run serve` starts the server.
- A JSON-RPC `resources/read uri=ui://vehicle/chart-renderer/mcp-app.html`
  returns the bundled HTML body in the `text` field with the SDK's mimeType.
- The HTML body contains substring `Chart` (or another reliable Chart.js
  symbol) — confirms the actual bundle is being served, not the placeholder.

**Files:** none (verification only — Task 2.4 already wired the handler)
**Dependencies:** 2.4, 3.3
**Parallel:** No

- [ ] Implementation (`npm run build && npm run serve`; curl the resource)
- [ ] Verification (substring check confirms bundled body)

---

## Phase 5 — Claude Desktop wiring (#8)

### Task 5.1 — Claude Desktop config snippet [P]

**Acceptance:**
- `src/demo-a-mcp-apps/claude-desktop-config.json` has the `mcpServers` entry:
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
- File is JSON-valid (parses cleanly with `node -e "JSON.parse(require('fs').readFileSync('...'))"`).

**Files:** `src/demo-a-mcp-apps/claude-desktop-config.json` (new)
**Dependencies:** none (independent file authoring)
**Parallel:** Yes — runs alongside Task 5.2
**Notes:**
- The contributor merges this entry into their own `claude_desktop_config.json`
  on Windows (`%APPDATA%\Claude\…`) or macOS (`~/Library/Application Support/Claude/…`).
- Free Claude plan works with manual JSON config; no custom-connector UI.

- [ ] Implementation
- [ ] Verification (JSON parses; comment header documents the file paths)

### Task 5.2 — System prompt [P]

**Acceptance:**
- `src/demo-a-mcp-apps/system-prompt.md` contains the system prompt covering:
  - "The schema is documented in PostgreSQL `COMMENT ON ...` statements"
  - "Inspect via `pg_catalog`: tables (`pg_class` + `obj_description`),
    columns (`pg_attribute` + `col_description`)"
  - "Call `query_vehicles({ sql })` with raw SQL only — read-only is enforced
    at the DB layer, so writes will fail with `permission denied`"
  - "The chart renderer at `ui://vehicle/chart-renderer/mcp-app.html` picks
    line / bar / donut / table based on the columns you return; the
    ladder favours time series when present"
  - "Do not fabricate column names — always inspect the schema first"
- No per-question SQL templates (Article III v1.1.0).

**Files:** `src/demo-a-mcp-apps/system-prompt.md` (new)
**Dependencies:** none
**Parallel:** Yes — runs alongside Task 5.1
**Notes:**
- The prompt is short and steers; it does not constrain (decision #5 in spec).

- [ ] Implementation
- [ ] Verification (skim-read for tone — confirm no per-question templates)

### Task 5.3 — Demo A README + root README quick-start

**Acceptance:**
- `src/demo-a-mcp-apps/README.md` documents:
  - prerequisites (Feature 001 done; Postgres up; ETL ran once)
  - one-time `setup-readonly-role.sql` apply step
  - `npm install && npm run build && npm run serve`
  - paste/merge `claude-desktop-config.json` into Claude Desktop's config file
    (Windows: `%APPDATA%\Claude\claude_desktop_config.json`; macOS:
    `~/Library/Application Support/Claude/claude_desktop_config.json`)
  - paste contents of `system-prompt.md` into **Claude Desktop → Settings →
    Profile → Custom instructions** (user-level; applies across all
    conversations) — confirms the LLM uses the schema-first SQL workflow
  - restart Claude Desktop, ask any of the five golden-path questions
- Root `README.md` Quick Start section adds a Demo A step pointing at
  `src/demo-a-mcp-apps/README.md`.

**Files:** `src/demo-a-mcp-apps/README.md` (new), `README.md` (modified)
**Dependencies:** 5.1, 5.2
**Parallel:** No

- [ ] Implementation
- [ ] Verification (fresh-clone walkthrough by a contributor would succeed)

---

## Phase 6 — End-to-end test (#9, milestone gate)

### Task 6.1 — Five golden-path queries in Claude Desktop

**Acceptance:**
With the server running, Claude Desktop config merged, and Claude Desktop
restarted, run each of the five queries from the system prompt and confirm:

- [ ] "Fuel breakdown for Cars in 2024" → donut chart renders
- [ ] "EV growth trend since 2015" → line chart renders
- [ ] "Top 10 makes by licensed vehicles" → horizontal bar renders
- [ ] "Licensed vs SORN for motorcycles over time" → line chart (multi-series) renders
- [ ] "Which fuel type grew fastest in last 5 years?" → line OR donut renders
      (both correct; whichever shape Claude's SQL produces)

Capture screenshots or row counts for each.

**Files:** none (manual verification — possibly screenshots committed under
`docs/screenshots/v0.2.0/` if you want them in the comparison document later)
**Dependencies:** 4.1, 5.3
**Parallel:** No
**Notes:**
- Each query may need 1–3 attempts as Claude refines the SQL based on schema
  introspection; that's fine and is data for the comparison document.

- [ ] Implementation (run all five queries)
- [ ] Verification (chart visible for each; screenshots captured)

---

## Phase 7 — Release plumbing

### Task 7.1 — Update CHANGELOG and close roadmap item

**Acceptance:** CHANGELOG.md has an entry under [Unreleased] describing this feature.
docs/ROADMAP.md item for this feature is marked ✅.

**Files:** `CHANGELOG.md`, `docs/ROADMAP.md`
**Dependencies:** All previous tasks complete

- [ ] CHANGELOG entry written
- [ ] Roadmap item marked done
