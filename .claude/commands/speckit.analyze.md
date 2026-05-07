---
name: speckit.analyze
description: Non-destructive cross-artefact consistency and quality analysis.
---

Invoke the `speckit-analyze` skill to perform a non-destructive cross-artefact
consistency and quality analysis across `spec.md`, `plan.md` and `tasks.md` for
the current feature branch.

Preconditions:

- All three artefacts exist for the current feature branch under
  `specs/<feature-branch>/`.

The skill is responsible for:

1. Running the `before_analyze` git hook (`speckit.git.commit`) if enabled.
2. Reporting inconsistencies between artefacts, gaps in tasks, and any items
   that conflict with the constitution.
3. Running the `after_analyze` git hook (`speckit.git.commit`) if enabled.

This command **must** be run before `/speckit.implement`. Do not modify the
artefacts during analysis — the skill is read-only by design.
