# Project Context

- **Owner:** Yadel Lopez
- **Project:** vehicle-genui-poc — generative UI comparison PoC. I own the rendering surfaces for both demos.
- **Stack:** Vite 6 + `vite-plugin-singlefile` 2.3.2 + Chart.js 4.5.1 (Demo A); React 19 + TypeScript 5.8 + Tailwind v4 + Recharts 2.15+ + CopilotKit (Demo B, future)
- **Created:** 2026-05-08

## Learnings

- Demo A's HTML is a single-file Chart.js page bundled by Vite. Build command: `INPUT=mcp-app.html vite build` (cross-env wired for Windows). Output: `dist/mcp-app.html`.
- Phase 1 placeholder `mcp-app.html` exists; the real chart UI is built in Feature 002 Phase 3 (post-server).
- Article VI: all diagrams in README/docs/specs use Mermaid. No ASCII. No image files for diagrams.

## 2026-05-08 — Phase 3 (Tasks 3.1–3.3)

### Import paths

- `@modelcontextprotocol/ext-apps` v1.6.x has **no `/iframe` subpath**. Correct import: `import { App } from "@modelcontextprotocol/ext-apps"`.
- `App` constructor: `new App({ name, version })`, then `app.connect()` (async).
- `ontoolresult` callback receives `CallToolResult` directly (the `params` of `McpUiToolResultNotification`), typed as `Record<string, unknown> | undefined` for `structuredContent`.

### structuredContent shape

- `server.ts` emits `structuredContent: { rows: result.rows }` — an object with a `rows` key, **not** a bare array.
- tasks.md 3.1 draft said `result.structuredContent ?? []` (stale). Correct: `result.structuredContent?.rows ?? []`.
- Decision filed: `.squad/decisions/inbox/dallas-structured-content-shape.md`.

### Bundle

- `npm run build` → `dist/mcp-app.html` **509.6 KB** (gzip: 143.9 KB).
- Spec target was 150–400 KB; overshoot caused by zod v4 (transitive from ext-apps). Gzip is fine.
- Zero external `<script src="https://...">` references — fully inlined by `vite-plugin-singlefile`.
- `npx tsc --noEmit` clean.

### Ladder branch verifications (Node.js)

| Input shape | Expected | Actual | Pass |
|---|---|---|---|
| `[{period_label, make, reg_count}]` | `"line"` | `"line"` | ✓ |
| `[{year, quarter, reg_count}]` | `"line"` | `"line"` | ✓ |
| `[{make, reg_count}]` | `"bar"` | `"bar"` | ✓ |
| `[{fuel, reg_count}]` | `"donut"` | `"donut"` | ✓ |
| `[{region, category}]` | `"table"` | `"table"` | ✓ |
| `[]` | `"table"` | `"table"` | ✓ |

### Files created/modified

- `src/demo-a-mcp-apps/mcp-app.html` — replaced placeholder with `<div id="root">` + module script tag
- `src/demo-a-mcp-apps/src/mcp-app.ts` — App wiring + ontoolresult → renderFromRows
- `src/demo-a-mcp-apps/src/chart-renderer.ts` — pickChartType + renderFromRows + Chart.js renderers
- `specs/feat-002-demo-a-mcp-apps/tasks.md` — 3.1/3.2/3.3 checkboxes marked done with evidence
- `.squad/decisions/inbox/dallas-structured-content-shape.md` — deviation record

## 2026-06-03 — feat/demo-b/frontend-improvements (Quick Wins)

Requested by: Yadel Lopez. Three improvements to Demo B's frontend.

### 1. Zod-validated tool parameter schemas

- Created `src/demo-b-copilotkit/frontend/src/schemas/toolSchemas.ts` with:
  - Primitive schemas: `ZFuelDatum`, `ZSeriesPoint`, `ZSeries`, `ZMakeDatum`
  - Tool-level schemas: `ZShowFuelBreakdownArgs`, `ZShowTrendArgs`, `ZShowTopMakesArgs`
- All three `useCopilotAction` handlers rewritten to call `schema.safeParse(rawArgs)`;
  return `{ ok: false, error: "Validation failed: …" }` on failure.
- Naming convention filed as `.squad/decisions/inbox/dallas-zod-schema-naming.md`.
- Zod `^3.25.76` added as explicit dependency (was transitive-only before).

### 2. Progressive rendering states

- Created `ProgressPanel` component: renders `pending | inProgress | executing`
  states with a colour-coded badge (`slate / amber / blue`) overlay on top of either
  a skeleton or a partial chart (if `args` already has data mid-stream).
- All three tool `render` callbacks updated from the binary `status !== "complete" → skeleton`
  pattern to the three-state `ProgressPanel`.
- Partial data path: if `args.data.length > 0` (or `series` points > 0) while
  streaming, the real chart renders immediately with the badge overlay.

### 3. Error boundaries and graceful fallbacks

- Created `PanelErrorBoundary` class component: per-panel isolation, Retry resets
  state, "View raw data" collapses raw args JSON in a `<pre>` block.
- `Dashboard` updated to wrap each panel child in `PanelErrorBoundary`.
- Added `{ kind: "error"; title; message; rawArgs? }` to `PanelDescriptor` union for
  future server-side failure surfacing.
- App-level `ErrorBoundary` rewritten with Tailwind classes, Retry button, and
  collapsible stack-trace `<details>` (replaces legacy inline `style={}`).

### Build verification

- `pnpm run build` in `src/demo-b-copilotkit/frontend` → exit 0, no type errors.
- Chunk-size warnings are pre-existing (CopilotKit transitive deps); not introduced here.

### Files created/modified

| File | Action |
|------|--------|
| `src/demo-b-copilotkit/frontend/src/schemas/toolSchemas.ts` | Created |
| `src/demo-b-copilotkit/frontend/src/components/ProgressPanel.tsx` | Created |
| `src/demo-b-copilotkit/frontend/src/components/PanelErrorBoundary.tsx` | Created |
| `src/demo-b-copilotkit/frontend/src/tools/useShowFuelBreakdown.tsx` | Rewritten |
| `src/demo-b-copilotkit/frontend/src/tools/useShowTrend.tsx` | Rewritten |
| `src/demo-b-copilotkit/frontend/src/tools/useShowTopMakes.tsx` | Rewritten |
| `src/demo-b-copilotkit/frontend/src/state/usePanels.ts` | Added `error` kind |
| `src/demo-b-copilotkit/frontend/src/components/Dashboard.tsx` | Wrap panels with boundary |
| `src/demo-b-copilotkit/frontend/src/ErrorBoundary.tsx` | Tailwind + Retry |
| `src/demo-b-copilotkit/frontend/package.json` | Added `zod ^3.25.76` |
| `CHANGELOG.md` | Updated |
| `.squad/decisions/inbox/dallas-zod-schema-naming.md` | Filed |
