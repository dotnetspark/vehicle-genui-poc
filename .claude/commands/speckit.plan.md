# /speckit.plan

You are creating the technical implementation plan for a feature in `vehicle-genui-poc`.

## Pre-flight checklist

- [ ] Read `.specify/constitution.md` in full
- [ ] Read `specs/[current-branch]/spec.md` in full
- [ ] Confirm all `[NEEDS CLARIFICATION]` items in the spec are resolved
- [ ] Read `docs/PRD.md` and `docs/ROADMAP.md` for context

## Research step (mandatory)

Before writing the plan, research the exact current versions of any dependency
this feature touches. Use web search to verify:
- Latest stable Python version (currently targeting 3.13+)
- Latest stable fastmcp version
- Latest stable @copilotkit/* versions
- Latest stable Vite, React, TypeScript, Tailwind CSS v4, Recharts versions
- Latest stable mcp-postgres package

Document findings in `specs/[current-branch]/research.md` before proceeding.

## Output: `specs/[current-branch]/plan.md`

```markdown
# Implementation Plan — Feature NNN

## Overview
[One paragraph summary of the technical approach]

## Architecture Decisions
[Key decisions made, with rationale. Include what was rejected and why.]

## Data Model Changes
[Any schema changes — must be backward-compatible if DB already has data]

## Directory Changes
[New files/folders to be created, mapped to src/ structure]

## Dependencies to Add
| Package | Version | Layer | Reason |
|---------|---------|-------|--------|

## Implementation Sequence
[Ordered list of what gets built — lowest dependency first]

## Testing Approach
[How this feature will be verified before the PR is opened]

## Mermaid Diagram (if applicable)
[Architecture or flow diagram using Mermaid]

## Constitution Compliance Check
- [ ] All source code in src/
- [ ] No ORMs — raw SQL with parameterised queries
- [ ] No custom query tools
- [ ] Demo isolation maintained
- [ ] Latest versions used (see research.md)
- [ ] CHANGELOG entry planned
```

## Rules
- No plan proceeds without research.md being complete
- Flag any proposed dependency older than latest stable
- If the plan would violate Article 6 (no custom query tools) or Article 7 (demo isolation),
  stop and surface the conflict before continuing
