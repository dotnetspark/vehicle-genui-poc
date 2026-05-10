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

