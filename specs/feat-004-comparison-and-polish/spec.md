# Feature 004 — Comparison Document + v1.0.0 Polish

## GitHub Issue
Closes #18, #19, #20, #21

## Problem Statement

Two Generative-UI demos (Demo A: MCP Apps SEP-1865; Demo B: CopilotKit Static
AG-UI) now run end-to-end against the same DVLA VEH0120 dataset. The PoC's
research output — a community-facing, evidence-based comparison — has not yet
been written. Without it, the project does not deliver on its stated goal in
`docs/PRD.md` §1: *"a community-facing comparison document, not a production
application."*

This feature produces that comparison document, finalises the README so a
reader can reproduce the demos in under 15 minutes, locks the CHANGELOG and
ROADMAP for the v1.0.0 release, and verifies all milestone tags are in place.

## User Stories

- As a **developer evaluating GenUI approaches**, I want a single document that
  compares MCP Apps and CopilotKit Static side-by-side across consistent axes
  so that I can choose the right tool for my context without running both
  demos myself.

- As a **conference attendee or blog reader**, I want an opinionated
  recommendation backed by concrete observations so that I can form my own
  view without re-litigating the same trade-offs.

- As a **first-time contributor cloning the repo**, I want a Demo Script in the
  README so that I can reproduce both demos and ask the same golden-path
  questions a presenter would.

- As a **maintainer**, I want CHANGELOG and ROADMAP locked at v1.0.0 and all
  milestone tags verified so that the repository is ready for community
  release.

## Acceptance Criteria

- [ ] `docs/COMPARISON.md` exists with all six required sections:
  1. **What you had to build** — table of every file written, categorised
     (schema / UI assets / React components / configuration / glue code), one
     column per demo, with approximate line counts.
  2. **Control model table** — `| Concern | Demo A | Demo B |` with rows for
     UI assets, rendering surface, who runs the agent, state sync mechanism,
     portability, UI customisation, design system integration.
  3. **Developer experience** — honest setup-friction notes; sections marked
     `[FILL IN: human observations]` are acceptable for the human-owned
     subsections (rough time spent, what surprised you).
  4. **Overlap analysis** — where the approaches share concepts vs where they
     diverge. Explicitly identify the database + schema as the only shared
     surface.
  5. **When to use which** — concrete scenarios for each demo.
  6. **Community recommendation** — single opinionated paragraph (≤200 words).
- [ ] `README.md` contains a top-level **Demo Script** section with a
  step-by-step walkthrough for showing both demos to an audience, including
  suggested queries and talking points.
- [ ] All Mermaid diagrams in `README.md` and `docs/` render correctly when
  viewed on GitHub (no ASCII art anywhere).
- [ ] `CHANGELOG.md` has all `[Unreleased]` items moved into a
  `[v1.0.0] — <release date>` section. Earlier milestones (v0.0.1, v0.1.0,
  v0.2.0, v0.3.0) each have their own dated section.
- [ ] `docs/ROADMAP.md` has every v1.0.0 line item (R13–R16 / equivalent)
  marked ✅.
- [ ] All milestone tags exist on `origin`: v0.0.1, v0.1.0, v0.2.0, v0.3.0,
  v1.0.0.
- [ ] No source files exist outside `src/` (verified with a glob check
  excluding `node_modules`, `.specify`, `specs`, `docs`).
- [ ] PR for this feature uses the project PR template.

## Out of Scope

- Adding new features, charts, or query types to either demo.
- Refactoring or restructuring code in `src/`.
- Performance benchmarks beyond what is observable from the existing demos.
- Translating the comparison document or README to other languages.
- Publishing to external platforms (blog posts, conference submissions, etc.) —
  those happen *after* v1.0.0.
- Recording video walkthroughs or producing screenshots beyond what the README
  Demo Script requires.

## Dependencies

- v0.3.0 tagged on `main` (Demo A polish + Demo B end-to-end working). ✅
- Both demos start with their documented commands and answer the golden-path
  question set without intervention.
- PostgreSQL + ETL data already loaded (Feature 001 outputs).

## Constitution Compliance

- [x] All source code in `src/` — this feature is documentation-only; no `src/`
  changes expected.
- [x] Demo isolation maintained — comparison document only **describes** the
  demos; it does not introduce shared code.
- [x] No custom query tools introduced — Article VI not engaged.
- [x] Latest dependency versions used — no dependency changes expected.
- [x] CHANGELOG.md will be updated in the PR — explicit acceptance criterion.
- [x] Mermaid diagrams used (no ASCII) — explicit acceptance criterion.
