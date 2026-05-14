# Research — Feature 004

## Scope of research

Feature 004 is **documentation-only**. No new runtime dependencies are added,
no `src/` code is modified, and no schema changes occur. The mandatory
dependency-version research step is therefore reduced to **verifying that the
versions already shipped in v0.3.0 remain the canonical answer** for the
README and COMPARISON.md when those documents quote tool versions.

## Versions to quote in documentation

These come from the as-shipped `package.json` / `pyproject.toml` files at the
v0.3.0 tag. They are the source of truth for any "we used X version Y" line
in `docs/COMPARISON.md` or the README.

| Layer                 | Tool                                | Version (as shipped) | Source of truth                                     |
| --------------------- | ----------------------------------- | -------------------- | --------------------------------------------------- |
| Database              | PostgreSQL                          | 16                   | `docker-compose.yml`                                |
| Python runtime        | CPython                             | 3.13+                | `src/etl/pyproject.toml`                            |
| Python pkg manager    | uv                                  | latest               | bootstrap docs                                      |
| Node.js               | Node.js                             | 22 LTS               | `.nvmrc` / engines field                            |
| JS pkg manager        | pnpm                                | 9+                   | `package.json` packageManager / workspace root      |
| Demo A — MCP SDK      | `@modelcontextprotocol/sdk`         | per `package.json`   | `src/demo-a-mcp-apps/package.json`                  |
| Demo A — MCP Apps ext | `@modelcontextprotocol/ext-apps`    | per `package.json`   | `src/demo-a-mcp-apps/package.json`                  |
| Demo A — Postgres     | `pg`                                | per `package.json`   | `src/demo-a-mcp-apps/package.json`                  |
| Demo A — Charts       | Chart.js                            | 4+                   | bundled in `src/demo-a-mcp-apps/src/chart-renderer` |
| Demo B — CopilotKit   | `@copilotkit/react-core`, `runtime` | per `package.json`   | `src/demo-b-copilotkit/*/package.json`              |
| Demo B — React        | React                               | 19                   | `src/demo-b-copilotkit/frontend/package.json`       |
| Demo B — Vite         | Vite                                | 7                    | `src/demo-b-copilotkit/frontend/package.json`       |
| Demo B — Tailwind     | Tailwind CSS                        | 4                    | `src/demo-b-copilotkit/frontend/package.json`       |
| Demo B — Charts       | Recharts                            | 3                    | `src/demo-b-copilotkit/frontend/package.json`       |
| Demo B — runtime svr  | Express                             | 5                    | `src/demo-b-copilotkit/runtime/package.json`        |

**Verification step at implementation time:** read each `package.json` and
`pyproject.toml` listed above and quote the *exact* `version` (or
`dependencies` entry) into the COMPARISON.md "What you had to build" section
rather than relying on this table. This table is for orientation only.

## What does *not* need research

- No new packages will be added — Article II ("latest stable") is satisfied by
  the prior features and is not re-litigated here.
- No new schema or query tools — Article VI not engaged.
- No cross-demo code — Article VII not engaged.

## Open questions

None. The feature scope is concrete and the artefacts are well-defined.
