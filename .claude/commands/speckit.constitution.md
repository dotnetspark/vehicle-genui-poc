---
name: speckit.constitution
description: Validate or update the project constitution at .specify/memory/constitution.md.
---

Invoke the `speckit-constitution` skill to create or update the project
constitution from interactive or provided principle inputs, ensuring all
dependent templates stay in sync.

Pass through any user-supplied arguments verbatim.

After completion, confirm that:

1. `.specify/memory/constitution.md` is fully populated (no `[PLACEHOLDER]` text).
2. The constitution version, ratification date and last-amended date are set.
3. Any dependent templates under `.specify/templates/` that reference principles
   have been updated to match.
