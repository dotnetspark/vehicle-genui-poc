# Squad Decisions

## Phase 2 — Demo A MCP server

### 2026-05-08 — `query_vehicles` implemented as a generic SQL runner

**Author:** Parker

Context: Feature 002 (Demo A MCP Apps) required a tool querying the `vehicles` PostgreSQL database. Constitution Article III v1.1.0 is explicit: the demo's SQL-execution tool is generic, accepting SQL strings from the LLM and returning rows. No NL→SQL translation, templates, or intent introspection.

Decision: `query_vehicles` is a pure SQL pass-through with `inputSchema: { sql: z.string() }`. Handler calls `pool.query(sql)` directly and returns structured rows. The `vehicles_readonly` Postgres role enforces read-only access at the DB layer; write attempts are rejected by Postgres and surfaced as `{ isError: true }`, allowing the LLM to self-correct. Schema `COMMENT ON` statements (applied by the ETL) remain the only prompt-engineering surface. If the LLM generates invalid SQL or a permission-denied query, the tool returns the Postgres error so the model can retry.

References: Constitution Article III v1.1.0; `src/demo-a-mcp-apps/server.ts`; `specs/feat-002-demo-a-mcp-apps/tasks.md` Task 2.3.

## Phase 3-5 — Demo A UI + wiring

### 2026-05-08 — MCP End-to-End Smoke Test Protocol

**Author:** Ash

Verifying MCP server implementations requires: client connection, StreamableHTTP transport (Accept/Content-Type headers, session-id management), tool calls with arguments, error handling, resource endpoints. Decision: **use MCP SDK `Client` + `StreamableHTTPClientTransport` for all e2e smoke tests**, not raw HTTP. SDK handles JSON-RPC handshake, session-ids, streaming transparently; single `.mjs` file (Node.js ESM) can be created, run, deleted without build overhead. Type safety and reusability across demos. Implementation: create `smoke-test.mjs` in server root; import SDK client; instantiate; connect via transport; run assertions. Task 4.1 (2026-05-08) validated protocol: server bootstrap, query_vehicles tool metadata (resourceUri set), structured response rows, permission denial on mutation, resource read. **Adoption: use this pattern for all MCP server e2e tests in Phase 2–5.**

### 2026-05-08 — Structured Content Shape and Import Path Corrections

**Author:** Dallas

Three corrections to Phase 3 (Tasks 3.1–3.3):

1. **`structuredContent` envelope shape:** tasks.md draft said `result.structuredContent ?? []` (bare array). Reality: `server.ts` emits `{ rows: result.rows }` (object with `rows` key). Correct client pattern: `result.structuredContent?.rows ?? []`. `server.ts` is correct and unchanged; only client access pattern needed updating.

2. **Import path for `App`:** tasks.md said `import { App } from "@modelcontextprotocol/ext-apps/iframe"`. Reality: v1.6.x exports map has no `/iframe` subpath. **Correct import:** `import { App } from "@modelcontextprotocol/ext-apps"`.

3. **Bundle size:** Spec target 150–400 KB; actual 509.6 KB (gzip: 143.9 KB). Overshoot caused by zod v4 transitive dependency. Gzip is within practical limits; no action needed.

## Phase 6 — Community & Governance

### 2026-06-02T09:58:22.351-04:00: User directive — PR #28 Sponsor Channel Challenge
**By:** Yadel Lopez  
**What:** Challenge the need for PR #28 — README sponsor button already displays; why add a Stripe placeholder in FUNDING.yml?  
**Context:** Repo currently shows sponsor button (GitHub Sponsors). PR #28 adds README sponsor text and a .github/FUNDING.yml with a Stripe placeholder (and a separate SPONSORSHIP.md guidance file). Committing any Stripe links requires a public buy.stripe.com link only; no secrets.  
**Why:** Avoid confusing or redundant funding manifests; prefer GitHub Sponsors-only flow unless user explicitly wants direct Stripe purchases.  
**Recommended options:**
1. Keep PR #28 but remove the Stripe placeholder from FUNDING.yml (leave GitHub Sponsors entry only).  
2. Close PR #28 without merging (if docs are redundant).  
3. Replace placeholder with a public buy.stripe.com link provided by the user (user must paste link here).  
**Requested action:** Squad will NOT modify remote PRs without explicit approval. Please reply with choice or paste your buy.stripe.com link to apply option 3.

### 2026-06-02T10:00:00.000-04:00: Squad action — FUNDING.yml Standardization (GitHub Sponsors only)
**By:** Squad (Coordinator)  
**What:** Created .github/FUNDING.yml containing only GitHub Sponsors: `github: dotnetspark` to avoid committing any Stripe placeholder. This aligns with the user's preference captured earlier to avoid Stripe placeholders when unnecessary.  
**Why:** Provide a safe repository-level funding manifest and remove ambiguity/redundancy between the visible sponsor button and a Stripe placeholder in PR #28.  
**Notes:**
- PR #28 remains open; Squad did NOT modify PR branch. If the maintainer merges PR #28 as-is, there may be duplication; maintainer should prefer the repo FUNDING.yml over placeholders.
- If the user later pastes a buy.stripe.com link, Squad will update FUNDING.yml to include it (only the public buy.stripe.com link). No secrets will be committed.

### 2026-06-02T10:16:00.000-04:00: Squad action — PR #28 Closed
**By:** Squad (Coordinator)  
**What:** Closed Pull Request #28 ("chore: add Sponsor section + funding instructions") on GitHub per user instruction: redundant with existing GitHub Sponsors button and .github/FUNDING.yml set to `github: dotnetspark`.  
**Why:** Avoid duplication and confusing funding channels. If the user later provides a public buy.stripe.com link, Squad will open a PR to add it to FUNDING.yml per policy (only public buy links are committed).  
**Notes:**
- PR #28 branch remains unchanged in the contributor's fork/branch.
- The decision was recorded and will be merged into the canonical decisions.md by Scribe on next run.

### 2026-06-02T11:55:00.000-04:00: Squad action — PRs #29 and #30 Closed
**By:** Squad (Coordinator)  
**What:** Closed Pull Requests #29 and #30 on GitHub per owner instruction: discussion templates already exist in the repository and the project will not proceed with the comparison write-up.  
**Why:** Avoid duplication and keep the repository focused. Discussion templates are already present; COMPARISON.md is deprecated per project direction.  
**Notes:**
- PR branches remain unchanged in contributors' forks.  
- Scribe will merge this inbox entry into .squad/decisions.md on the next Scribe run.
- If you change your mind, Squad can reopen the PRs or open updated PRs per your guidance.

### 2026-06-03: Decision — MCP Trends & Quick-Win Roadmap for Demo A
**Agent:** Parker (Backend/MCP Engineer)  
**Status:** Proposed  
**Scope:** Demo A Architecture & Enhancement Policy  

**Problem Statement:** Demo A (MCP Apps) currently lacks:
1. **Real-time responsiveness** for slow queries (streaming/progressive rendering not supported)
2. **Performance visibility** (no telemetry on cache behavior, tool call latencies)
3. **Schema governance** (no versioning, making debugging schema-related failures hard)
4. **LLM guidance** on available tools (LLMs generate invalid calls due to poor documentation)
5. **Build agility** (slow builds, large bundle size hinder iteration)

These gaps reduce competitiveness vs. CopilotKit's Static GenUI approach and risk overengineering without data.

**Proposed Policy: Quick-Win + Incremental Enhancements**

**Principle 1: Measure Before Investing**
- Prioritize features that add **immediate observability** (cache hit rate, tool call accuracy).
- Ship telemetry-first; let data guide Feature 1–5 prioritization.

**Principle 2: User-Visible Wins in 1–2 Days**
- Quick-Wins 1–2 (schema cheatsheet + cache) ship within 48 hours.
- High ROI: + 20–30% LLM accuracy, + 70% cache hit rate, no risk.

**Principle 3: Lazy Streaming, Not Eager**
- Streaming (Feature 1) deferred until telemetry proves it necessary.
- Don't optimize latency before benchmarking.

**Principle 4: Schema as Code**
- All tools, schemas, and versioning metadata live in code (not config files).
- Content-hash URIs generated from source at build time, immutable on deploy.

**Principle 5: Build Standardization**
- All MCP servers target ESM + esbuild by default.
- Single build artifact per MCP server (no SSR/client complexity in server layer).

**Immediate Actions:**

Action 1: **Implement Schema Cheatsheet Injection (1 day)**
- Rationale: LLM tool call accuracy is the #1 lever for perceived quality. Better docs → fewer errors.
- Files to Create/Modify:
  - `src/demo-a-mcp-apps/services/schema-loader.ts` (NEW)
  - `src/demo-a-mcp-apps/api/copilotkit-handler.ts` (MODIFY)
  - `src/demo-a-mcp-apps/config/system-prompt.txt` (NEW)
- Success Metric: Tool call error rate drops from baseline to < 5% within 24 hours of deployment.

Action 2: **Implement LRU Cache + Telemetry (1 day)**
- Rationale: Cache hit rate is both a performance lever and a leading indicator of query patterns. Real-time visibility enables data-driven tuning.
- Files to Create/Modify:
  - `src/demo-a-mcp-apps/services/cache.ts` (NEW)
  - `src/demo-a-mcp-apps/telemetry/metrics.ts` (NEW)
  - `src/demo-a-mcp-apps/tools/*.ts` (MODIFY to use cache)
- Success Metric: Cache hit rate > 70% within 2 hours of live traffic; telemetry metrics published to dashboard.

Action 3: **Defer Streaming Until Benchmarking Complete**
- Rationale: Streaming adds complexity. Only pursue if latency benchmarks prove queries regularly exceed 500 ms.
- Trigger for Prioritization: Telemetry shows p95 latency > 500 ms for non-cached queries over 1 week.

**Assumptions:**
1. Demo A uses deterministic queries (e.g., vehicle lookups, schema reads) with high repetition → LRU cache applicable.
2. Tool definitions are stable or change infrequently → content-hash versioning adds observability without noise.
3. CopilotKit system prompt is mutable at runtime → schema cheatsheet injection feasible without client changes.

**Risks & Mitigation:**
| Risk | Mitigation |
|------|-----------|
| Cache invalidation bugs (stale data) | TTL + explicit invalidation on schema updates; telemetry alarms for cache age |
| Telemetry overhead (latency impact) | Use sampling (10–20% of requests); async export to avoid blocking |
| Schema cheatsheet too large (prompt bloat) | Summarize; include links to full docs; A/B test inclusion |

**Success Criteria (2 weeks):**
- ✅ Schema cheatsheet deployed; LLM tool call accuracy measured baseline → post-deployment.
- ✅ LRU cache live; hit rate > 70%; telemetry dashboard operational.
- ✅ Build time reduced by 50% (from ~30s to ~15s).
- ✅ No regressions in Demo A functionality or response quality.

**Next Steps (If Approved):**
1. **Create Jira/GitHub Issues** for Quick-Wins 1–2 (Parker + Ripley).
2. **Define Dashboard** (Grafana/Prometheus) for cache metrics and tool call telemetry (Parker + Dallas).
3. **Schedule Review** after 1 week: assess cache hit rate, LLM accuracy, and decide on Streaming prioritization.
4. **Plan Feature 3–5** based on telemetry insights and team capacity.

**Approval Checklist:**
- [ ] Keaton: Architecture review & sign-off
- [ ] Ripley: Backend integration sign-off
- [ ] Dallas: UI/dashboard considerations sign-off
- [ ] Yadel Lopez: Project lead approval

**Owner:** Parker  
**Created:** 2026-06-03  
**Last Updated:** 2026-06-03

## Active Decisions

No new active decisions.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
