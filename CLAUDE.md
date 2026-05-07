# CLAUDE.md — vehicle-genui-poc

This file is read by Claude Code at the start of every session.
Read it fully before taking any action.

---

## What this project is

A research PoC comparing two Generative UI approaches — MCP Apps (SEP-1865) and
CopilotKit Static AG-UI — on UK vehicle registration data (DVLA VEH0120).
The goal is a community-facing comparison document, not a production application.

---

## Before touching any code

1. Read `.specify/constitution.md` — it is the supreme law of this project
2. Check `docs/ROADMAP.md` — identify the current active milestone
3. Check `specs/` — identify the current active feature branch and its tasks.md
4. Check `CHANGELOG.md` — understand what has already shipped

If you are starting a new feature, do not write code first. Run `/speckit.specify`.

---

## Slash commands available

These are in `.claude/commands/` and follow the Spec Kit SDD workflow:

| Command                 | When to use                                              |
| ----------------------- | -------------------------------------------------------- |
| `/speckit.constitution` | Validate or update project principles (run once)         |
| `/speckit.specify`      | Start a new feature — generates spec.md                  |
| `/speckit.plan`         | After spec is approved — generates plan.md + research.md |
| `/speckit.tasks`        | After plan is approved — generates tasks.md              |
| `/speckit.analyze`      | Before implementation — cross-checks all artefacts       |
| `/speckit.implement`    | Implement tasks one at a time                            |

Always run `/speckit.analyze` before `/speckit.implement`.

---

## Project layout

```
src/                        # ALL source code — never write code outside here
  shared/                   # Shared types and utilities
  etl/                      # Python ETL + schema
  demo-a-mcp-apps/          # Demo A: FastMCP wrapper + HTML chart assets
  demo-b-copilotkit/
    frontend/               # Vite + React dashboard
data/                       # Raw CSV (gitignored — user places file here)
specs/                      # Spec Kit artefacts per feature branch
docs/                       # PRD, ROADMAP, COMPARISON, ADRs
.specify/constitution.md    # Project constitution (static — human-owned)
.specify/memory/            # Agent runtime memory (agent-writable)
.claude/commands/           # Slash command definitions
```

---

## Tech stack

| Layer                  | Technology     | Version |
| ---------------------- | -------------- | ------- |
| Python                 | CPython        | 3.13+   |
| Python package manager | uv             | latest  |
| Node.js                | Node.js        | 22 LTS  |
| JS package manager     | pnpm           | 9+      |
| React                  | React          | 19+     |
| TypeScript             | TypeScript     | 5.8+    |
| Vite                   | Vite           | 6+      |
| Tailwind CSS           | Tailwind CSS   | v4      |
| Recharts               | Recharts       | 2.15+   |
| CopilotKit             | @copilotkit/\* | latest  |
| MCP server             | FastMCP        | latest  |
| Database               | PostgreSQL     | 16      |
| Chart.js (HTML assets) | Chart.js       | 4+      |

**Never pin to an older version without a documented reason in the PR.**

---

## Git workflow

- Every change starts with a GitHub Issue
- Branch naming: `feat/NNN-short-description`, `fix/NNN-short-description`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Squash merge for PRs with more than one commit
- Update `CHANGELOG.md` in every PR — no exceptions
- Tag after every milestone: `v0.1.0`, `v0.2.0`, `v0.3.0`, `v1.0.0`

---

## Hard constraints — never violate these

- No source code outside `src/`
- No custom NL→SQL query tools — all DB access via standard `mcp-postgres`
- No ORM — raw SQL with psycopg2 parameterised queries
- Demo A and Demo B share only the database — no cross-demo code
- No ASCII diagrams — Mermaid only in all documentation
- No ORMs, no monkeypatching, no undocumented workarounds

---

## Active feature prompts

Sequential prompts for each milestone are in `specs/`:

```
specs/prompt-01-bootstrap.md       → scaffold validation + git init
specs/prompt-02-feature-001-etl.md → ETL + schema (v0.1.0)
specs/prompt-03-feature-002-demo-a.md → Demo A MCP Apps (v0.2.0)
specs/prompt-04-feature-003-demo-b.md → Demo B CopilotKit (v0.3.0)
specs/prompt-05-feature-004-comparison.md → Comparison + polish (v1.0.0)
```

---

## Database

PostgreSQL 16, started via `docker compose up -d`.
Connection string from `DATABASE_URL` environment variable.
Schema: `dim_vehicle`, `dim_period`, `fact_registrations`, `v_schema_summary` view.
Table comments are load-bearing — they are the LLM's only schema documentation.

---

## If something is unclear

Check in this order:

1. This file
2. `.specify/constitution.md`
3. The active `specs/[branch]/spec.md`
4. `docs/PRD.md`

If still unclear — ask before acting. Do not make assumptions that affect architecture.
