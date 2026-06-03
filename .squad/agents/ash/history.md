# Project Context

- **Owner:** Yadel Lopez
- **Project:** vehicle-genui-poc — Generative UI comparison PoC. I gate every milestone tag.
- **Stack:** Same as the project (TS / Node 22, Python 3.13+ / uv, Postgres 16, Vite 6, React 19, CopilotKit, MCP SDK)
- **Created:** 2026-05-08

## Learnings

- Acceptance evidence belongs in `tasks.md` as `[x] Verification — <output excerpt>` immediately after the matching `[x] Implementation — ...` line. Phase 1 of Feature 002 follows this pattern.
- Issue #9 is the v0.2.0 milestone-tag e2e gate. Issues #6, #7, #8 are the implementation tracks for Feature 002.
- Feature 001 v0.1.0 acceptance: 139,553 dim_vehicles · 82 periods · 19,666,224 facts loaded.
- **Task 2.1 (2026-05-08):** `$env:PGPASSWORD = "readonly"` required on Windows to avoid psql password prompt via docker exec. Role successfully idempotent: both applies exit 0. Permission message: "ERROR: permission denied for schema public" (not "permission denied" alone). SELECT as readonly returned correct aggregates (FORD 10740, VAUXHALL 8173, MERCEDES 7904).
- **Task 2.2 (2026-05-08):** `npm run serve` boots in ~2-3 seconds; boot log line is "Demo A MCP server listening on http://localhost:3001/mcp" (no port variable). Empty POST body to /mcp returns 406 with JSON-RPC error (`{"jsonrpc":"2.0","error":{"code":-32000,"message":"Not Acceptable: Client must accept both application/json and text/event-stream"},"id":null}`), confirming route is mounted and JSON-RPC transport is active.
- **Task 2.5 smoke test (2026-05-08):** Used SDK `Client` + `StreamableHTTPClientTransport` (not raw curl — cleaner and avoids manual session-id header wrangling). All 5 acceptance criteria passed: (1) server boots cleanly; (2) query_vehicles tool listed with `_meta.ui.resourceUri="ui://vehicle/chart-renderer/mcp-app.html"`; (3) SELECT top-5-makes returned structuredContent.rows=[FORD 10740, VAUXHALL 8173, MERCEDES 7904, RENAULT 7311, VOLKSWAGEN 7156]; (4) CREATE TABLE rejected with isError=true, content="permission denied for schema public"; (5) resource/read returned placeholder HTML with DOCTYPE+title+root-div (Phase 3 will replace mimeType marker when UI bundle built). Key insight: SDK client handles all MCP protocol complexity—handshake, sessions, streaming—transparently; recommend this for all e2e tests.
- **chore/tests/demo-a-b (2026-05-XX):** Wrote and ran comprehensive tests for Demo A and Demo B changes from draft PRs `feat/demo-a/content-hash-uri` and `feat/demo-b/frontend-improvements`. 
  - Demo A (node:test): 32/32 pass — extracted `resolveResourceUri` into `resource-uri.ts` with injectable `FsAdapter` seam (18 tests); extended `query-cache.test.ts` with key normalisation (4) and LRU eviction (5) tests using new `createQueryCache` factory.
  - Demo B (Vitest + RTL): 63/63 pass — set up full Vitest infrastructure (jsdom, globals, setup stubs); added `PanelErrorBoundary`, `ProgressPanel`, `toolSchemas` (Zod) production files from PR; 7 test files covering all new components/state/schemas.
  - CI scripts: `scripts/run-tests.sh` + `scripts/run-tests.ps1`.
  - PR: https://github.com/dotnetspark/vehicle-genui-poc/pull/44 (draft)
  - Verdict: ✓ Both suites green. No blocking issues in the PR changes. `act()` warnings in Dashboard tests are cosmetic (CopilotKit subscriptions, not test failures).

