# Tasks — Feature 004

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked (reason in notes)

## Phase 1 — Evidence gathering

### Task 1.1 — Inventory files per demo
**Acceptance:** A reproducible measurement of file counts and approximate
line counts per demo, grouped by category (schema / UI assets / React
components / configuration / glue code), captured into the eventual
COMPARISON.md "What you had to build" table.
**Files:** working notes only (used inline in `docs/COMPARISON.md` later)
**Dependencies:** none
**Parallel:** Yes [P]
- [ ] Run `git ls-files src/demo-a-mcp-apps src/demo-b-copilotkit src/etl src/shared` and bucket each file
- [ ] Use `wc -l` (or PowerShell equivalent) on the resulting file list
- [ ] Verification: numbers re-derivable in one shell command per demo

### Task 1.2 — Capture exact dependency versions [P]
**Acceptance:** Exact `version` strings (or `dependencies` entries) extracted
from every `package.json` and `pyproject.toml` under `src/` and recorded for
quoting in COMPARISON.md.
**Files:** read-only
**Dependencies:** none
**Parallel:** Yes [P]
- [ ] Read `src/etl/pyproject.toml`
- [ ] Read `src/demo-a-mcp-apps/package.json`
- [ ] Read `src/demo-b-copilotkit/runtime/package.json`
- [ ] Read `src/demo-b-copilotkit/frontend/package.json`
- [ ] Read root `package.json` if present
- [ ] Verification: every version cited in COMPARISON.md traces back to one of these files

### Task 1.3 — Re-run golden-path question set against both demos [P]
**Acceptance:** Notes captured (objective only) on what each demo did when
asked the same five golden-path questions: success/fail, latency feel,
visible LLM "guessing" behaviour, error recovery, chart polish. These notes
seed Sections 3 (objective parts), 4, and 5 of COMPARISON.md.
**Files:** working notes only
**Dependencies:** none
**Parallel:** Yes [P]
**Notes:** Demos must already be running (Demo A on :3001, Demo B runtime + frontend). Do not change any code while testing.
- [ ] Both demos asked the same 5 questions
- [ ] Notes recorded (no fabrication; if a demo crashes, that goes in the notes)

## Phase 2 — Write COMPARISON.md

### Task 2.1 — Draft `docs/COMPARISON.md` skeleton with all six sections
**Acceptance:** File exists with all six section headings in order matching
the spec; each section contains at minimum a one-line description of what
goes there. No fabricated content.
**Files:** `docs/COMPARISON.md`
**Dependencies:** none (skeleton)
- [ ] File created
- [ ] All six section headings present in order

### Task 2.2 — Fill Section 1 "What you had to build"
**Acceptance:** Table with rows = file categories, columns = Demo A / Demo B,
cells = file count + approximate line count + representative file paths.
Numbers reconcile to Task 1.1 evidence.
**Files:** `docs/COMPARISON.md`
**Dependencies:** 1.1, 2.1
- [ ] Table populated
- [ ] Numbers spot-checked against `git ls-files` + `wc -l`

### Task 2.3 — Fill Section 2 "Control model table"
**Acceptance:** Table `| Concern | Demo A MCP Apps | Demo B CopilotKit Static |`
with the seven rows specified in the spec (UI assets, rendering surface, who
runs the agent, state sync mechanism, portability, UI customisation, design
system integration). Each cell ≤ 1 sentence.
**Files:** `docs/COMPARISON.md`
**Dependencies:** 2.1
- [ ] All 7 rows present
- [ ] Each cell ≤ 1 sentence

### Task 2.4 — Fill Section 3 "Developer experience"
**Acceptance:** Objective subsections (setup commands, what broke during E2E
debugging this session, error messages encountered) filled by agent.
Subjective subsections (rough time spent, what surprised you) marked
`[FILL IN: human observations]`.
**Files:** `docs/COMPARISON.md`
**Dependencies:** 1.3, 2.1
- [ ] Objective subsections complete
- [ ] `[FILL IN: ...]` markers present in subjective subsections

### Task 2.5 — Fill Section 4 "Overlap analysis"
**Acceptance:** Explicit identification of database + schema as the only
shared surface; clear list of where the approaches diverge (transport,
rendering surface, who owns the agent loop, etc.).
**Files:** `docs/COMPARISON.md`
**Dependencies:** 2.1
- [ ] Shared surfaces enumerated
- [ ] Divergences enumerated

### Task 2.6 — Fill Section 5 "When to use which"
**Acceptance:** Two bulleted lists ("Use MCP Apps when…", "Use CopilotKit
Static when…"), each with at least 3 concrete scenarios grounded in
observed behaviour, not marketing claims.
**Files:** `docs/COMPARISON.md`
**Dependencies:** 1.3, 2.1
- [ ] Both lists present
- [ ] Each scenario references a concrete capability or constraint

### Task 2.7 — Fill Section 6 "Community recommendation"
**Acceptance:** Single paragraph ≤ 200 words, opinionated, grounded in
sections 1–5. Suitable for a dev-blog teaser.
**Files:** `docs/COMPARISON.md`
**Dependencies:** 2.2–2.6
- [ ] Paragraph present
- [ ] Word count ≤ 200

## Phase 3 — README polish

### Task 3.1 — Add "Demo Script" section to README
**Acceptance:** A new top-level `## Demo Script` section in `README.md`
with: prerequisites, step-by-step commands (clone → docker compose → ETL →
Demo A start → Demo A queries → Demo B start → Demo B queries), suggested
queries from the golden-path set, and a one-line talking point per step.
**Files:** `README.md`
**Dependencies:** none
- [ ] Section present
- [ ] Steps reproducible from a clean clone

### Task 3.2 — Verify all Mermaid diagrams render on GitHub
**Acceptance:** Every Mermaid block in `README.md` and under `docs/`
displays correctly when viewed on github.com on the feature branch.
**Files:** `README.md`, `docs/*.md`
**Dependencies:** 2.1, 3.1
- [ ] Branch pushed
- [ ] Each file with a `mermaid` code fence visually inspected on github.com
- [ ] Any non-rendering diagram fixed (likely indentation / fence language)

## Phase 4 — Release bookkeeping

### Task 4.1 — Promote `[Unreleased]` to `[v1.0.0] — <date>` in CHANGELOG
**Acceptance:** `CHANGELOG.md` has a `[v1.0.0] — YYYY-MM-DD` section
containing all prior `[Unreleased]` entries plus a new line for the
comparison document. `[Unreleased]` is left empty (or removed).
**Files:** `CHANGELOG.md`
**Dependencies:** 2.7, 3.1
- [ ] Section created with today's date
- [ ] Comparison document line added
- [ ] `[Unreleased]` cleared

### Task 4.2 — Mark v1.0.0 items ✅ in ROADMAP
**Acceptance:** Every line item under v1.0.0 in `docs/ROADMAP.md` is
marked ✅. Earlier milestones (v0.1.0 / v0.2.0 / v0.3.0) remain ✅ as
already shipped.
**Files:** `docs/ROADMAP.md`
**Dependencies:** 4.1
- [ ] All v1.0.0 items marked ✅

### Task 4.3 — Verify all milestone tags exist on origin
**Acceptance:** `git ls-remote --tags origin` lists v0.0.1, v0.1.0, v0.2.0,
v0.3.0. (v1.0.0 is tagged after PR merge — see post-merge step in plan.)
**Files:** none (verification only)
**Dependencies:** none
- [ ] Output captured and confirmed

### Task 4.4 — Source-isolation check
**Acceptance:** No `.py`, `.ts`, `.tsx`, `.js`, `.jsx` files exist outside
`src/` (excluding `node_modules`, `.specify`, `specs`).
**Files:** none (verification only)
**Dependencies:** none
- [ ] Glob returns zero rows

### Task 4.5 — Open PR using project PR template
**Acceptance:** PR opened against `main` from
`feat/004-comparison-and-polish` using the project PR template, body
references "Closes #18, #19, #20, #21".
**Files:** none (GitHub PR)
**Dependencies:** 4.1, 4.2, 4.3, 4.4
- [ ] PR opened
- [ ] Template used
- [ ] All four issues referenced

### Task 4.6 — Update CHANGELOG and close roadmap item
**Acceptance:** CHANGELOG.md has an entry describing this feature
(satisfied by 4.1). docs/ROADMAP.md item is marked ✅ (satisfied by 4.2).
This task exists per template requirement; if 4.1 + 4.2 are done, this is
a no-op verification.
**Files:** CHANGELOG.md, docs/ROADMAP.md
**Dependencies:** All previous tasks complete
- [ ] CHANGELOG entry verified present
- [ ] Roadmap item verified marked ✅
