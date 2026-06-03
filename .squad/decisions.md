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

## Phase 6 — Demo B Frontend + Demo A Caching

### 2026-06-03 — Zod Schema Naming Conventions for Demo B Tool Parameters

**Author:** Dallas

Adding Zod runtime validation to the three `useCopilotAction` handler functions in `src/demo-b-copilotkit/frontend/src/tools/`. Convention: Zod schema objects use `Z` prefix + PascalCase (e.g., `ZShowFuelBreakdownArgs`), inferred types use bare PascalCase with no prefix (e.g., `ShowFuelBreakdownArgs`). Single schema file: `src/demo-b-copilotkit/frontend/src/schemas/toolSchemas.ts`. The `Z` prefix is idiomatic in Zod-heavy codebases and distinguishes runtime schema objects from plain TypeScript interfaces at a glance.

**Rationale:** Consistency and clarity in Demo B tool schema organization. If Demo B grows beyond ~10 tools, split by tool family (e.g., `chartSchemas.ts`, `filterSchemas.ts`).

**Impact:** Demo B frontend only; no cross-demo impact.

**References:** `src/demo-b-copilotkit/frontend/src/schemas/toolSchemas.ts` (new file).

---

### 2026-06-03 — LRU Cache and Content-Hash URI Strategy for Demo A (consolidated)

**By:** Parker, Ripley

**Part A — Cache key normalisation:**
Normalise SQL by (1) collapsing all whitespace runs to a single space and (2) lower-casing before storing in the LRU map. The LLM often varies indentation and keyword casing across requests for the same query. Full SQL parsing to a canonical AST would be correct but is heavyweight for a PoC. Whitespace + case normalisation catches the dominant variation patterns with zero external dependencies.

**Part B — Content-hash URI strategy (Parker's initial design + Ripley's refinements):**

**Choice:** Compute SHA-256 of `dist/mcp-app.html`, take first 12 hex chars (Ripley's refinement; Parker proposed 16), and use `ui://vehicle/chart-renderer/{hash}.html` as the resource URI.

**Three resolution paths (Ripley's decision):**
1. **Build-time (preferred):** Vite `write-resource-uri` plugin writes `dist/resource-uri.json`. Server reads it at startup.
2. **Runtime fallback:** Server computes the hash from the bundle on startup when the manifest is absent (dev workflow, first run).
3. **Legacy fallback:** If the bundle does not exist, falls back to the existing static `mcp-app.v4.html` URI so the server still boots.

**Rationale:** Storing the URI in the dist manifest decouples the build and runtime; the server does not need to compute hashes on every request. The 12-char prefix (Ripley) is sufficient for uniqueness within this PoC (48 bits, negligible collision probability).

**Alternative rejected:** Always compute at runtime on every request — adds I/O per request and the URI would change if the file changes between requests.

**Part C — Additional Ripley refinements:**
- **Progressive table render threshold:** `PROGRESSIVE_THRESHOLD = 200`, `CHUNK_SIZE = 150`. The `MAX_ROWS_IN_TEXT = 50` server-side limit means real-world result sets rarely exceed 50–100 rows. 150 rows/frame keeps each frame budget under ~16 ms.
- **Render telemetry:** `document.dispatchEvent(new CustomEvent("chart-render", ...))` rather than `window.dispatchEvent`. MCP Apps UIs run inside an iframe; `document` is always the frame's own document, making the event reliably catchable by integration tests.

**Impact:** Demo A MCP server and UI only; no cross-demo impact.

**References:** `src/demo-a-mcp-apps/server.ts`; `src/demo-a-mcp-apps/query-cache.ts` (new module, Demo A only); Vite build pipeline.

---

### 2026-06-03 — LRU Cache Module Location (Demo A isolation)

**Author:** Ripley

**Decision:** `query-cache.ts` and its tests live under `src/demo-a-mcp-apps/` rather than `src/shared/`.

**Rationale:** The constitution states "Demo A and Demo B share only the database — no cross-demo code." The LRU cache wraps Demo A's `query_vehicles` Postgres pool; if Demo B ever needs a cache it will use its own implementation. Keeping it in Demo A avoids premature abstraction and respects the isolation constraint.

---

### 2026-06-03 — Test Infrastructure and Content-Hash URI Validation (Ash)

**Author:** Ash

Test validation of Demo A content-hash URI changes and Demo B frontend improvements across two draft PRs. Comprehensive test suites written and passing:

- **Demo A (node:test):** 32 tests covering `resource-uri.ts` (12 tests) and `query-cache.ts` extensions (20 tests). Validates: manifest-first URI resolution, runtime hash fallback, LRU cache eviction, key normalisation (whitespace + case).
- **Demo B (Vitest + RTL):** 63 tests covering new `PanelErrorBoundary`, `ProgressPanel`, `usePanels` module-level store, and Zod `toolSchemas`. Validates: error recovery, state management, schema validation, component lifecycle.
- **Total:** 95/95 tests passing, no blocking issues.
- **CI scripts:** `scripts/run-tests.sh` and `scripts/run-tests.ps1` committed for GitHub Actions integration.
- **Non-blocking cosmetic note:** Dashboard tests emit React `act()` warnings from CopilotKit subscription events; not production bugs.

**Recommendations:**
1. Merge `feat/demo-a/content-hash-uri` and `feat/demo-b/frontend-improvements` before or alongside PR #44.
2. After `feat/demo-a/content-hash-uri` merges, update `resource-uri.ts` field name (`uri` → `resourceUri`) and hash length (16 → 12 chars).
3. Add GitHub Actions job: `scripts/run-tests.sh` on Node 22 + pnpm 9.

**References:** PR #44 (https://github.com/dotnetspark/vehicle-genui-poc/pull/44); `src/demo-a-mcp-apps/query-cache.ts`; `src/demo-a-mcp-apps/resource-uri.ts`; `src/demo-b-copilotkit/frontend/src/schemas/toolSchemas.ts`.

## Active Decisions

No new active decisions as of 2026-06-03.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
