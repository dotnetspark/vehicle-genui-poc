# /speckit.tasks

You are generating the task breakdown for a feature in `vehicle-genui-poc`.

## Pre-flight checklist

- [ ] Read `.specify/constitution.md`
- [ ] Read `specs/[current-branch]/spec.md`
- [ ] Read `specs/[current-branch]/plan.md`
- [ ] Read `specs/[current-branch]/research.md`

## Output: `specs/[current-branch]/tasks.md`

Break the plan into the smallest independently-verifiable units of work.
Each task must be completable and testable in isolation.

```markdown
# Tasks — Feature NNN

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked (reason in notes)

## Phase 1 — [Name matching plan sequence]

### Task 1.1 — [Title]
**Acceptance:** [What does "done" look like? Be specific and testable]
**Files:** [Exact file paths to create or modify]
**Dependencies:** [Task IDs this depends on, if any]
**Parallel:** [Yes/No — can this run alongside other tasks?]
**Notes:** [Anything an agent needs to know before starting]
- [ ] Implementation
- [ ] Verification

### Task 1.2 — ...

## Phase 2 — ...
```

## Task rules

- Tasks must reference exact file paths under `src/`
- Every task must have a testable acceptance criterion
- Mark tasks that can run in parallel with `[P]`
- No task should create files outside `src/`, `docs/`, or spec artefact directories
- The final task in every feature must be:

```markdown
### Task N.N — Update CHANGELOG and close roadmap item
**Acceptance:** CHANGELOG.md has an entry under [Unreleased] describing this feature.
docs/ROADMAP.md item for this feature is marked ✅.
**Files:** CHANGELOG.md, docs/ROADMAP.md
**Dependencies:** All previous tasks complete
- [ ] CHANGELOG entry written
- [ ] Roadmap item marked done
```
