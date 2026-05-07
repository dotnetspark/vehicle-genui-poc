---
name: speckit.implement
description: Execute the implementation plan one task at a time.
---

Invoke the `speckit-implement` skill to execute the implementation plan by
processing and executing tasks defined in `specs/<feature-branch>/tasks.md`.

Preconditions:

- `/speckit.analyze` has been run with no unresolved issues.
- The current Git branch matches the feature branch naming convention.

The skill is responsible for:

1. Running the `before_implement` git hook (`speckit.git.commit`) if enabled.
2. Executing tasks from `tasks.md` one at a time, marking each complete before
   moving to the next.
3. Running the `after_implement` git hook (`speckit.git.commit`) if enabled.

Do not skip ahead, do not batch task completion, and do not write code outside
of `src/`.
