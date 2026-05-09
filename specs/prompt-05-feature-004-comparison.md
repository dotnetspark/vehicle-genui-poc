# Prompt 5 — Feature 004: Comparison Document + v1.0.0 Polish

> Feed this to Claude Code after Prompt 4 is complete, both demos are running,
> and v0.3.0 is tagged. This covers Roadmap items R13–R16 (Milestone v1.0.0).

---

## Step 1 — Create GitHub Issues

- #13: docs: COMPARISON.md — all six sections
- #14: chore: CHANGELOG complete for all milestones
- #15: chore: Git tags for all milestones verified
- #16: docs: README finalised with demo script

## Step 2 — Run /speckit.specify

```
/speckit.specify

Feature 004 — Comparison Document + v1.0.0 Polish

Write docs/COMPARISON.md from direct observation of both running demos.
Then finalise the README with a demo script section.

The comparison document must contain six sections:

1. What you had to build
   Table: every file written, categorised as schema / UI assets / React components /
   configuration / glue code. One column per demo. Include approximate line counts.

2. Control model table
   | Concern | Demo A MCP Apps | Demo B CopilotKit Static |
   Rows: UI assets, rendering surface, who runs the agent, state sync mechanism,
   portability, UI customisation, design system integration

3. Developer experience
   Honest notes on: setup friction, what broke or was underdocumented,
   what surprised you (positively or negatively), rough time spent on each

4. Overlap analysis
   Where the two approaches share concepts vs where they genuinely diverge.
   Expected: the only real overlap is the database and schema.

5. When to use which
   - Use MCP Apps when: [concrete scenarios]
   - Use CopilotKit Static when: [concrete scenarios]

6. Community recommendation
   A short opinionated paragraph (200 words max) suitable for a dev blog or
   community forum. Answer: given the current state of both specs and tooling,
   what would you tell a developer who has to choose?

README additions:
- Demo script section: step-by-step walkthrough for showing both demos to an audience,
  with suggested queries and talking points at each step
- Finalise all Mermaid diagrams

Closes #13, #14, #15, #16.
```

## Step 3 — Run /speckit.plan + /speckit.tasks + /speckit.analyze

```
/speckit.plan
/speckit.tasks
/speckit.analyze
```

## Step 4 — Run /speckit.implement

```
/speckit.implement

Priority sequence:
1. docs/COMPARISON.md — write from direct observation, all six sections
   Note: Section 3 (Developer Experience) must be filled in by the human.
   Leave placeholder: [FILL IN: your honest observations after running both demos]
2. README.md — add Demo Script section, verify all Mermaid diagrams render
3. CHANGELOG.md — move all [Unreleased] items to [v1.0.0], add release date
4. docs/ROADMAP.md — mark all v1.0.0 items ✅
```

## Step 5 — Final tag

```bash
git add .
git commit -m "docs(004): comparison document + v1.0.0 polish — closes #13 #14 #15 #16"
git tag v1.0.0
```

## Step 6 — Final verification checklist

- [ ] Both demos run end-to-end
- [ ] docs/COMPARISON.md has all six sections (Section 3 filled in by human)
- [ ] CHANGELOG.md complete through v1.0.0
- [ ] All milestones tagged: v0.0.1, v0.1.0, v0.2.0, v0.3.0, v1.0.0
- [ ] README Mermaid diagrams render in GitHub
- [ ] docs/ROADMAP.md all items ✅
- [ ] PR template used for every PR in the project
- [ ] No code outside src/ (verify with: find . -name "*.py" -o -name "*.tsx" | grep -v "src/\|node_modules\|.specify")
