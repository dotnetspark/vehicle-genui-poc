# Prompt 1 — Bootstrap

> Feed this to Claude Code after opening the repo in VS Code.
> Purpose: validate the scaffold and run /speckit.constitution.

---

You are working in the `vehicle-genui-poc` repository at
`C:\Users\ylrre\source\repos\vehicle-genui-poc`.

This project follows Spec Kit spec-driven development. Your slash commands are in
`.claude/commands/`.

## Step 1 — Validate the scaffold

Verify the following directories and files exist. Report any that are missing:

```
.specify/constitution.md
.specify/templates/spec-template.md
.specify/templates/plan-template.md
.specify/templates/tasks-template.md
.claude/commands/speckit.constitution.md
.claude/commands/speckit.specify.md
.claude/commands/speckit.plan.md
.claude/commands/speckit.tasks.md
.claude/commands/speckit.implement.md
.claude/commands/speckit.analyze.md
.github/ISSUE_TEMPLATE/feature.md
.github/pull_request_template.md
docs/PRD.md
docs/ROADMAP.md
CHANGELOG.md
README.md
src/
src/shared/
src/etl/
src/demo-a-mcp-apps/
src/demo-b-copilotkit/frontend/
data/
specs/
```

## Step 2 — Run /speckit.constitution

Read `.specify/constitution.md` and confirm it contains:
- 7 named Core Principles (I through VII)
- A Git Workflow section
- A Changelog and Roadmap section
- A Governance section with version/ratification footer

Print a summary table of all NON-NEGOTIABLE constraints (those marked as such).
Do not regenerate or overwrite the file.

## Step 3 — Initialise Git

If the repository is not yet a Git repo, run:
```bash
git init
git add .
git commit -m "chore: initial scaffold — Spec Kit SDD structure"
git tag v0.0.1
```

Then confirm the initial tag exists.

## Step 4 — Report

Print a readiness checklist:
- [ ] Scaffold complete
- [ ] Constitution validated
- [ ] Git initialised and tagged v0.0.1
- [ ] Ready to start /speckit.specify for Feature 001
