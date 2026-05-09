# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| MCP server, SQL tool, `pg`/Express, Demo A `server.ts` | Parker | Wire MCP tool, register embedded HTML resource, DB role + env |
| Demo A HTML/Chart.js bundle, Demo B React/CopilotKit UI | Dallas | `mcp-app.html`, Vite single-file build, React components, Recharts |
| Python ETL, schema, `COMMENT ON`, query shape, docker compose | Lambert | DDL changes, schema docs as prompt surface, ETL fixes |
| Spec/constitution review, architecture, PR gate, Issue triage | Ripley | Approve `plan.md`/`tasks.md`, constitution check, milestone gate |
| Acceptance verification, e2e gates (#9, equivalents), edge cases | Ash | Run builds, capture output, mark `[x] Verification` lines |
| Scope & priorities, trade-offs, milestone planning | Ripley | What to build next, when to tag, when to amend constitution |
| Session logging, decision merging, history hygiene | Scribe | Automatic — never needs routing |
| Backlog scan, Issue/PR work loop, keep-alive | Ralph | "Ralph, go" / "Ralph, status" |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Lead |
| `squad:{name}` | Pick up issue and complete the work | Named member |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.
