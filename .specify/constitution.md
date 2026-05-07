# vehicle-genui-poc Constitution

## Core Principles

### I. Source Layout (NON-NEGOTIABLE)
All source code lives exclusively under `src/`. No exceptions.
- `src/shared/` — types and utilities shared between demos
- `src/etl/` — ETL script and Postgres schema
- `src/demo-a-mcp-apps/` — Demo A: FastMCP wrapper + HTML chart assets
- `src/demo-b-copilotkit/frontend/` — Demo B: Vite + React dashboard
No source file may be created outside `src/` without a constitution amendment.

### II. Demo Isolation (NON-NEGOTIABLE)
Demo A (`src/demo-a-mcp-apps/`) and Demo B (`src/demo-b-copilotkit/`) share only the PostgreSQL database and types in `src/shared/`. No other code crosses demo boundaries. The isolation is deliberate — the comparison document depends on it.

### III. No Custom Query Tools (NON-NEGOTIABLE)
All database access goes through the standard `mcp-postgres` MCP server. No custom NL→SQL translation layers, no bespoke query tools, no ORMs. The schema design and table comments are the only prompt engineering surface. Raw SQL via psycopg2 parameterised queries in the ETL only.

### IV. Latest Dependencies (NON-NEGOTIABLE)
Always use the latest stable version of every dependency at the time of implementation. Never pin to an older version without an explicit documented reason in the PR.

| Layer | Technology | Minimum |
|---|---|---|
| Python | CPython | 3.13+ |
| Python package manager | uv | latest |
| Node.js | Node.js | 22 LTS |
| JS package manager | pnpm | 9+ |
| React | React | 19+ |
| TypeScript | TypeScript | 5.8+ |
| Vite | Vite | 6+ |
| Tailwind CSS | Tailwind CSS | v4 |
| Recharts | Recharts | 2.15+ |
| CopilotKit | @copilotkit/* | latest |
| FastMCP | fastmcp | latest |
| PostgreSQL | PostgreSQL | 16 |
| Chart.js (HTML assets) | Chart.js | 4+ |

### V. Documentation-First
Specifications, plans, and tasks are written before code. The spec artefact is the source of truth. Code follows documentation — never the reverse. Every feature begins with `/speckit.specify` before any implementation.

### VI. Mermaid-Only Diagrams
All diagrams in `README.md`, `docs/`, and spec artefacts must use Mermaid. No ASCII art diagrams. No image files for diagrams.

### VII. Simplicity
This is a research PoC, not a production application. Favour readability and demonstrability over optimisation. Avoid over-engineering. YAGNI applies.

## Git Workflow

Every change follows this sequence without exception:
1. GitHub Issue created first — no code without an issue
2. Feature branch from main: `feat/NNN-short-description`, `fix/NNN-short-description`, `chore/NNN-short-description`
3. Pull Request opened against main
4. Squash merge for PRs with more than one commit — keeps main history linear
5. Conventional commit messages: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
6. `CHANGELOG.md` updated in every PR — no exceptions
7. SemVer tags after every milestone: `v0.1.0`, `v0.2.0`, `v0.3.0`, `v1.0.0`
8. No direct pushes to main

## Changelog and Roadmap

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.
Every PR moves items into `[Unreleased]`. Tags move `[Unreleased]` into a versioned section.

`docs/ROADMAP.md` is derived from `docs/PRD.md`. Every roadmap item links to a GitHub Issue.
Roadmap items are marked ✅ in the same PR that completes them.

## Governance

This constitution supersedes all other practices and guidelines. All implementation decisions must be checked against these principles before proceeding.

Amendments require:
- A dedicated GitHub Issue labelled `constitution`
- Explicit rationale documented in the issue
- PR reviewed and approved before merging
- Amendment noted in `CHANGELOG.md`

Claude Code must read this file at the start of every session. If any user request conflicts with a non-negotiable principle, surface the conflict explicitly and do not proceed silently.

**Version**: 1.0.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
