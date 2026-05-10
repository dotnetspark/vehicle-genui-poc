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



- Constitution v1.1.0 is in force. Article III was amended on 2026-05-08 (issue #10): each demo owns its own generic SQL-execution tool via the canonical SDK; original "must use `@modelcontextprotocol/server-postgres`" requirement was replaced with "Demo A uses `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps` + `pg` over Streamable HTTP".
- Currently on branch `feat/002-demo-a-mcp-apps`. Phase 1 of Feature 002 complete (skeleton: package.json, tsconfig, vite.config, mcp-app.html placeholder). Phase 2 (Server, issue #6) is the active work.
