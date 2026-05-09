# Project Context

- **Owner:** Yadel Lopez
- **Project:** vehicle-genui-poc — research PoC comparing two Generative UI approaches (MCP Apps SEP-1865 vs CopilotKit Static AG-UI) over UK DVLA VEH0120 vehicle registration data. Deliverable is a community-facing comparison doc, not a production app.
- **Stack:** Python 3.13+ / uv (ETL) · TypeScript 5.8+ / Node 22 LTS / npm (Demo A) · Vite 6 + React 19 + Tailwind v4 + Recharts + CopilotKit (Demo B) · PostgreSQL 16 via docker compose · Mermaid-only diagrams · Spec Kit SDD workflow
- **Created:** 2026-05-08

## Learnings

- Constitution v1.1.0 is in force. Article III was amended on 2026-05-08 (issue #10): each demo owns its own generic SQL-execution tool via the canonical SDK; original "must use `@modelcontextprotocol/server-postgres`" requirement was replaced with "Demo A uses `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps` + `pg` over Streamable HTTP".
- Currently on branch `feat/002-demo-a-mcp-apps`. Phase 1 of Feature 002 complete (skeleton: package.json, tsconfig, vite.config, mcp-app.html placeholder). Phase 2 (Server, issue #6) is the active work.
