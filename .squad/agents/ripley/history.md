# Project Context

- **Owner:** Yadel Lopez
- **Project:** vehicle-genui-poc — research PoC comparing two Generative UI approaches (MCP Apps SEP-1865 vs CopilotKit Static AG-UI) over UK DVLA VEH0120 vehicle registration data. Deliverable is a community-facing comparison doc, not a production app.
- **Stack:** Python 3.13+ / uv (ETL) · TypeScript 5.8+ / Node 22 LTS / npm (Demo A) · Vite 6 + React 19 + Tailwind v4 + Recharts + CopilotKit (Demo B) · PostgreSQL 16 via docker compose · Mermaid-only diagrams · Spec Kit SDD workflow
- **Created:** 2026-05-08

## 2026-05-08 — Task 5.2 system prompt

- **File:** `src/demo-a-mcp-apps/system-prompt.md` — 79 lines
- **Design note:** Prompt is structured as three operational sections (inspect → constraints → rendering contract) plus four rules; the only SQL present is the two generic `pg_catalog` introspection queries, keeping all analytical query authorship with the LLM per Constitution Article III v1.1.0.

## 2026-05-08 — Task 5.3 READMEs

- **Files authored/modified:**
  - `src/demo-a-mcp-apps/README.md` — new, 108 lines, 7 sections (Title + summary, Prerequisites,
    One-time setup, Run, Wire up Claude Desktop, Try it, Troubleshooting)
  - `README.md` — Quick Start step 6 expanded with full sub-steps (a–e); Demos table added to
    Project Navigation section with Demo A row (v0.2.0 — in progress) and Demo B placeholder row
- **Tension noticed:** `setup-readonly-role.sql` has a comment showing `docker compose exec -T db`
  idiom, while CLAUDE.md specifies `docker exec -i vehicle-agui-poc-db-1`. Used the CLAUDE.md
  idiom (pipe to `docker exec -i`) as authoritative — it names the actual container and works on
  Windows without relying on `compose exec` TTY allocation.
- **No architecture diagrams added** — prose only, per Constitution Article VI and task brief.



## 2026-06-03 — 5 Demo A quick-win features (issues #32–#36)

### What was done

Created 5 independent feature branches off `main`, each with a focused PR:

| Branch | PR | Issue | Target files |
|---|---|---|---|
| `feat/demo-a/lru-query-cache` | #38 | #32 | `server.ts`, `query-cache.ts`, `query-cache.test.ts`, `package.json` |
| `feat/demo-a/content-hash-uri` | #40 | #33 | `server.ts`, `vite.config.ts` |
| `feat/demo-a/render-telemetry` | #41 | #34 | `src/chart-renderer.ts` |
| `feat/demo-a/line-chart-heuristics` | #42 | #35 | `src/chart-renderer.ts` |
| `feat/demo-a/progressive-render` | #43 | #36 | `src/chart-renderer.ts` |

### Key implementation notes

- **LRU cache** (`query-cache.ts`): standalone module, `lru-cache v11`; `normalizeSQL` collapses whitespace + lowercases; singleton `queryCache`; `CACHE_MAX`/`CACHE_TTL` env vars. 11 unit tests with Node 22 built-in runner. Cache is populated only on successful queries (not errors).
- **Content-hash URI**: Vite `write-resource-uri` plugin writes `dist/resource-uri.json` at build time. `resolveResourceUri()` has 3-level fallback: manifest → runtime SHA-256 → legacy URI. Both `registerAppTool` and `registerAppResource` consume `RESOURCE_URI`.
- **Render telemetry**: `performance.now()` wraps the render call; `[telemetry]` log + `CustomEvent("chart-render")` dispatched on `document` for integration test hooks.
- **Line chart heuristics**: Added rule 2 (`month`/`date`/`year_quarter` cols) and rule 3 (year-only + numeric + >1 row). `renderLine` xLabel resolver handles 5 temporal shapes.
- **Progressive render**: `PROGRESSIVE_THRESHOLD=200`, `CHUNK_SIZE=150`; DOM structure mounted sync for instant first paint; `requestAnimationFrame` chain streams tbody rows for large sets.

### Git confusion encountered

Working on Windows, `git checkout` sometimes silently remained on `feat/demo-a/backend-cache` (pre-existing WIP branch) when switching branches. Symptoms: `HEAD` points to unexpected commit; `git branch --show-current` is the authoritative check. Always verify branch before committing.

### Stash hygiene

`stash@{0}` (ripley-save-all-wip) and `stash@{1}` (wip-demo-a-quick-wins) from the previous session were left in place. They combine features 1+2 together and should NOT be `git stash pop`d — they will corrupt clean feature branches.

