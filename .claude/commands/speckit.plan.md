---
name: speckit.plan
description: Generate plan.md and research.md from an approved spec.
---

Invoke the `speckit-plan` skill to execute the implementation planning workflow
using `.specify/templates/plan-template.md` and produce design artefacts for the
current feature branch.

Preconditions:

- `specs/<feature-branch>/spec.md` exists and the user has approved it.
- The current Git branch matches the feature branch naming convention
  (`feat/NNN-short-description`, `fix/NNN-short-description`).

The skill is responsible for:

1. Running the `before_plan` git hook (`speckit.git.commit`) if enabled.
2. Producing `specs/<feature-branch>/plan.md` and `specs/<feature-branch>/research.md`.
3. Running the `after_plan` git hook (`speckit.git.commit`) if enabled.

After completion, remind the user that the next step is `/speckit.tasks`.
