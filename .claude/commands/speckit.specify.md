# /speckit.specify

You are creating a feature specification for `vehicle-genui-poc` following the
Spec Kit SDD methodology.

## Pre-flight checklist (complete before writing anything)

- [ ] Read `.specify/constitution.md` in full
- [ ] Identify the next available feature number by scanning `specs/` directory
- [ ] Confirm the feature aligns with `docs/PRD.md` and `docs/ROADMAP.md`
- [ ] Confirm a GitHub Issue exists (or note that one must be created first)

## Output artefacts

Create the following files under `specs/[feature-branch-name]/`:

### spec.md
```markdown
# Feature NNN — [Title]

## GitHub Issue
Closes #NNN

## Problem Statement
[What problem does this feature solve?]

## User Stories
- As a [role], I want [goal] so that [benefit]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Out of Scope
- [Explicit exclusions]

## Dependencies
- [Other features or issues this depends on]

## Constitution Compliance
- [ ] All source code in src/
- [ ] Demo isolation maintained
- [ ] No custom query tools introduced
- [ ] Latest dependency versions used
- [ ] CHANGELOG.md will be updated in the PR
- [ ] Mermaid diagrams used (no ASCII)
```

### [NEEDS CLARIFICATION] items
If any acceptance criteria are ambiguous, list them as `[NEEDS CLARIFICATION: ...]`
items inside the spec and stop. Do not proceed to planning until all clarifications
are resolved.

## Rules
- Never start a spec without reading the constitution first
- Branch name format: `feat/NNN-short-description`
- One spec per feature — never combine multiple features in one spec
- Flag any constitution violations immediately
