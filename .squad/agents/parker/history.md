# Project Context

- **Owner:** Yadel Lopez
- **Project:** vehicle-genui-poc — comparing MCP Apps vs CopilotKit on UK DVLA VEH0120 vehicle data. Demo A (mine) is the MCP Apps surface.
- **Stack:** Node 22 LTS · TypeScript 5.8+ · `@modelcontextprotocol/sdk` `^1.29.0` · `@modelcontextprotocol/ext-apps` `^1.6.0` · `pg` `^8.20.0` · `express` `^5.0.0` · `cors` `^2.8.5` · Streamable HTTP transport · PostgreSQL 16
- **Created:** 2026-05-08

## Learnings

- Demo A lives in `src/demo-a-mcp-apps/`. Uses `npm` (not `pnpm`); Article IV doesn't pin package managers and the quickstart uses npm. `cross-env` was added for Windows compat.
- Vite build is invoked with `INPUT=mcp-app.html vite build` and produces `dist/mcp-app.html` via `vite-plugin-singlefile` — the single-file HTML is what the MCP server registers as the embedded resource.
- The DB role is `vehicles_readonly` with `GRANT SELECT` only on `public`. The SQL tool MUST connect as this role.
- Constitution Article III (amended v1.1.0): the SQL tool is generic — accepts a SQL string, returns rows. No NL→SQL, no templates, no intent introspection. Schema `COMMENT ON` is the only prompt surface.
- **Tasks 2.3 / 2.4 (2026-05-08):** `registerAppTool` signature is `(server, name, config, handler)`. The `config.inputSchema` must be `ZodRawShapeCompat` (i.e., `{ fieldName: z.ZodType }`) not a plain JSON schema object — passing a raw `{ type: "object", properties: ... }` object fails tsc.
- **`structuredContent` gotcha:** The MCP SDK types `structuredContent` as `{ [key: string]: unknown }` (a record), NOT an array. Returning `rows` directly fails tsc; wrap it as `{ rows: result.rows }`. The UI client reads `structuredContent.rows`.
- **`registerAppResource` argument order:** The correct signature is `(server, name, uri, config, handler)` — name before URI. The plan.md had the arguments transposed; the type declaration examples are authoritative.
- **`import.meta.dirname` on Node 22:** Works natively (available since Node 21.2.0). No `fileURLToPath(import.meta.url)` dance needed. The tsconfig must have `"module": "ESNext"` or `"NodeNext"` (already set in the scaffold).
- **`DatabaseError` import:** Exported directly from `"pg"` — `import { Pool, DatabaseError } from "pg"` works. Use `instanceof DatabaseError` in the catch; rethrow anything else so unexpected errors remain visible (crash the request, don't swallow).
- **`_meta.ui.resourceUri` threading:** Set in `registerAppTool` config; `ext-apps` serialises it into the MCP `tools/list` response so the client App knows which resource URI to load for the iframe. No runtime wiring needed in server code beyond setting the field.
- **Task 5.1 (Phase 5 — Claude Desktop config, 2026-01-10):** Created `src/demo-a-mcp-apps/claude-desktop-config.json` with `mcpServers` entry for `vehicle-genui-demo-a` pointing to `http://localhost:3001/mcp`. File is merge-ready snippet for contributors' local Claude config; JSON validated with node parser.
