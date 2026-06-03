# Project Context

- **Owner:** Yadel Lopez
- **Project:** vehicle-genui-poc — Generative UI comparison PoC. I own the data layer that both demos read.
- **Stack:** CPython 3.13+ · `uv` package manager · `psycopg2` parameterised SQL · PostgreSQL 16 via `docker compose up -d` · DVLA VEH0120 dataset
- **Created:** 2026-05-08

## Learnings

- Feature 001 shipped in v0.1.0: ETL loaded 139,553 `dim_vehicle` rows · 82 `dim_period` rows · 19,666,224 `fact_registrations`. Schema includes the `v_schema_summary` view.
- `DATABASE_URL` env var is the connection contract used by both demos.
- The `vehicles_readonly` role (created by Demo A's `setup-readonly-role.sql`) gets `GRANT SELECT` on `public` only — no writes from the LLM path.
- Article III: schema `COMMENT ON` text is the LLM's ONLY prompt-engineering surface. No NL→SQL helpers anywhere.

## Task: feat/demo-a/schema-and-streaming (2026-06-03)

### What changed
- `server.ts` -- `buildSchemaCheatsheet()` enhanced with `fetchColumnMeta()` (reads
  `pg_constraint` + `attnotnull` for NOT NULL / PK / UNIQUE / FK / CHECK labels) and
  `fetchSampleValues()` (checks `pg_stats.n_distinct` then fetches DISTINCT values for
  low-cardinality TEXT/integer columns; fires for `body_type`, `fuel`, `licence_status`).
- `server.ts` -- `query_vehicles_chunked` tool registered behind `ENABLE_STREAMING=true`
  env flag; wraps caller SQL in a CTE with LIMIT/OFFSET; returns
  `{ rows, has_more, next_cursor, chunk_size, cursor }`.
- `server.ts` -- content-addressed `resolveResourceUri()` reads `dist/resource-uri.json`
  manifest (written by Vite plugin); falls back to runtime SHA-256 hash, then static URI.
- `server.ts` -- `registerAppResource` now uses the same `RESOURCE_URI` constant as
  `registerAppTool._meta.ui.resourceUri` (was a mismatch bug).
- `query-cache.ts` / `query-cache.test.ts` -- LRU cache module incorporated (11 tests pass).
- `src/chart-renderer.ts` -- new exports: `ChunkedEnvelope`, `isChunkedEnvelope`,
  `renderFromChunked` (spinner on partial, final render on complete).
- `src/mcp-app.ts` -- `accumulatedRows` buffer + chunked envelope detection.
- `examples/streaming-consumer.ts` -- new example: raw JSON-RPC HTTP consumer.
- `vite.config.ts` -- `write-resource-uri` plugin added.
- `package.json` -- `lru-cache ^11.0.0` + `test` script added.

### Learnings
- The `edit` tool and PowerShell `Set-Content` fail silently on files with UTF-8
  multi-byte characters (em-dash, etc.) in the matched region. Use Python file I/O for
  reliable writes on this Windows host.
- `pg_stats.n_distinct < 0` = fractional estimate (high cardinality, skip).
  `n_distinct = 0` = ANALYZE not run (skip). Only fetch samples when `0 < n <= max`.
- The `vehicles_readonly` role can read `pg_stats` without extra GRANTs (Postgres
  built-in: stats visible for tables the role holds SELECT on).
- Fetching `chunk_size + 1` rows is an O(1) way to detect `has_more` without COUNT(*).
- OFFSET pagination degrades on large offsets; prefer keyset pagination for production.
