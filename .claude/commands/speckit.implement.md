# /speckit.implement

You are implementing tasks for `vehicle-genui-poc` following the Spec Kit SDD methodology.

## Pre-flight checklist (mandatory — do not skip)

- [ ] Read `.specify/constitution.md` in full
- [ ] Read `specs/[current-branch]/spec.md`
- [ ] Read `specs/[current-branch]/plan.md`
- [ ] Read `specs/[current-branch]/research.md`
- [ ] Read `specs/[current-branch]/tasks.md`
- [ ] Identify the current task to implement (first unchecked task)

## Implementation rules

1. **One task at a time.** Complete and verify each task before moving to the next.
   Do not implement multiple tasks in a single step unless they are marked `[P]` (parallel).

2. **Constitution compliance.** Before writing any code, check the task against:
   - Article 3: Is the file path inside `src/`?
   - Article 6: Does it introduce any custom query tools? (If yes → STOP)
   - Article 7: Does it cross demo boundaries? (If yes → STOP)
   - Article 2: Are all dependency versions latest stable?

3. **Verify before marking done.** After implementing a task, run the acceptance
   criterion check. Only mark `[x]` when the criterion passes.

4. **Commit message format:**
   ```
   feat(NNN): [task title]

   Implements task N.N from specs/[branch]/tasks.md
   Part of #NNN
   ```

5. **After all tasks complete:**
   - Update `CHANGELOG.md` under `[Unreleased]`
   - Mark the roadmap item in `docs/ROADMAP.md`
   - Confirm all task checkboxes are `[x]`
   - Summarise what was built and what the PR description should say

## What to do if a task is blocked

Stop. Do not skip or work around it. Report:
- Which task is blocked
- Why it is blocked
- What information or action is needed to unblock it

## What to do if implementation would violate the constitution

Stop immediately. Report the conflict explicitly. Do not implement a workaround silently.
