---
name: speckit.tasks
description: Generate an actionable, dependency-ordered tasks.md for the current feature.
---

Invoke the `speckit-tasks` skill to generate
`specs/<feature-branch>/tasks.md` from `.specify/templates/tasks-template.md`,
based on the spec and plan for the current feature branch.

Preconditions:

- `specs/<feature-branch>/spec.md` exists and the user has approved it.
- `specs/<feature-branch>/plan.md` exists and the user has approved it.

The skill is responsible for:

1. Running the `before_tasks` git hook (`speckit.git.commit`) if enabled.
2. Producing `specs/<feature-branch>/tasks.md`.
3. Running the `after_tasks` git hook (`speckit.git.commit`) if enabled.

After completion, remind the user to run `/speckit.analyze` before any
implementation begins.
