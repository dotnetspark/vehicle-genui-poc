# vehicle-genui-poc

A research proof-of-concept comparing two Generative UI approaches against a single
real dataset of UK vehicle registrations (DVLA VEH0120):

- **Demo A** — MCP Apps (SEP-1865) via FastMCP with embedded HTML chart assets.
- **Demo B** — CopilotKit Static AG-UI on a Vite + React 19 dashboard.

The output of this PoC is a community-facing comparison document. It is **not** a
production application.

## Status

Bootstrap milestone — `v0.0.1`. See [docs/ROADMAP.md](docs/ROADMAP.md) for the
milestone plan.

## Documents

- [.specify/memory/constitution.md](.specify/memory/constitution.md) — supreme law of the project
- [docs/PRD.md](docs/PRD.md) — product requirements
- [docs/ROADMAP.md](docs/ROADMAP.md) — milestone plan
- [CHANGELOG.md](CHANGELOG.md) — release history
- [CLAUDE.md](CLAUDE.md) — agent operating instructions

## Layout

```
src/                        ALL source code lives here
  shared/                   shared types and utilities
  etl/                      Python ETL + schema
  demo-a-mcp-apps/          FastMCP wrapper + HTML chart assets
  demo-b-copilotkit/
    frontend/               Vite + React dashboard
data/                       raw CSV (gitignored — see data/README.md)
specs/                      Spec Kit artefacts per feature branch
docs/                       PRD, ROADMAP, COMPARISON, ADRs
```

## Workflow

This project follows Spec Kit spec-driven development. Every feature begins with a
slash command from `.claude/commands/`:

| Command                 | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `/speckit.constitution` | Validate or update project principles                       |
| `/speckit.specify`      | Start a new feature — generates `spec.md`                   |
| `/speckit.plan`         | Generate `plan.md` and `research.md` from an approved spec  |
| `/speckit.tasks`        | Generate `tasks.md` from an approved plan                   |
| `/speckit.analyze`      | Cross-check spec, plan and tasks before implementation      |
| `/speckit.implement`    | Implement tasks one at a time                               |

Always run `/speckit.analyze` before `/speckit.implement`.
