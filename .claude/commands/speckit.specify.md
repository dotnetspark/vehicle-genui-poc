---
name: speckit.specify
description: Start a new feature — generates spec.md from a natural-language description.
---

Invoke the `speckit-specify` skill to create or update the feature specification
from the natural-language feature description supplied by the user.

Pass the user's description through as the feature description.

The skill is responsible for:

1. Running the `before_specify` git hook (`speckit.git.feature`) if enabled in
   `.specify/extensions.yml`.
2. Producing `specs/<feature-branch>/spec.md` from
   `.specify/templates/spec-template.md`.
3. Running the `after_specify` git hook (`speckit.git.commit`) if enabled.

After completion, remind the user that the next step is `/speckit.plan`, not
implementation.
