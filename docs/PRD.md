# Product Requirements — vehicle-genui-poc

**Status:** Draft (bootstrap milestone, v0.0.1)
**Owner:** Yadel Lopez
**Last updated:** 2026-05-07

---

## 1. Purpose

Produce a credible side-by-side comparison of two Generative UI architectures
against the **same** real-world dataset and the **same** set of analyst questions.
The output is a community-facing comparison document; the demos exist to support
that document.

## 2. Approaches under comparison

| Demo | Approach                | Surface                                            |
| ---- | ----------------------- | -------------------------------------------------- |
| A    | MCP Apps (SEP-1865)     | FastMCP server returning HTML chart resources      |
| B    | Static CopilotKit AG-UI | Vite + React 19 dashboard with Recharts components |

Both demos read from the **same** PostgreSQL 16 database (`mcp-postgres`) and
consume the **same** schema documentation. No demo writes its own SQL helpers; all
DB access goes through the standard `mcp-postgres` server.

## 3. Dataset

DVLA **VEH0120** — UK vehicle registration counts by make, model, body type and
period. The raw CSV is user-supplied (see [data/README.md](../data/README.md)) and
is never committed.

## 4. Analyst questions (golden path)

The comparison evaluates each demo against the same fixed question set. Initial
questions are TBD and will be finalised in Feature 004; the spec for that feature
will own the canonical list.

## 5. Comparison axes

The community-facing comparison document will score each approach on:

1. **Time to first chart** — fresh-clone to first interactive answer.
2. **Schema-awareness** — does the demo answer questions outside its built-in tools?
3. **UI fidelity** — typography, interaction, accessibility.
4. **Token / cost profile** — average tokens per question.
5. **Failure modes** — what happens when the LLM picks a bad query.
6. **Developer ergonomics** — code locality, hot-reload, type safety.
7. **Lock-in** — what survives if you swap the LLM, host, or framework.

## 6. Out of scope

- Authentication, multi-tenant deployment, production hosting.
- Custom NL→SQL tools (forbidden by [the constitution](../.specify/constitution.md)).
- ORMs of any kind.
- Any source code outside `src/`.

## 7. Success criteria

- Both demos answer the golden-path question set end-to-end without hand-holding.
- The comparison document at `docs/COMPARISON.md` is published with a fair, honest
  scoring against every axis in §5.
- A reader can clone the repository and reproduce both demos following the README.
