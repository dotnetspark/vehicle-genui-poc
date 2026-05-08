# Feature 001 — Foundation: ETL + Postgres Schema

## GitHub Issue

Closes #1, #2, #3, #4.

## Problem Statement

Both demos in this PoC (Demo A: MCP Apps, Demo B: CopilotKit) need to query the
same UK vehicle registration data via the standard `mcp-postgres` MCP server.
Without a populated Postgres database whose schema is documented in
LLM-readable table and column comments, neither demo can be built and no fair
comparison is possible.

This feature delivers the shared foundation: a Dockerised Postgres 16, a star
schema designed for LLM consumption, and an idempotent ETL that melts the wide
DVLA VEH0120 CSV into that schema.

## User Stories

- **As a contributor cloning the repo**, I can run `docker compose up -d`,
  apply the schema, and run the ETL once — and have a queryable database
  ready, without needing internal documentation.
- **As an LLM querying the database via `mcp-postgres`**, I can rely solely on
  the table and column comments to write correct SQL — no human-only
  documentation should be required.
- **As a reviewer**, I can verify ETL correctness by running the canned
  verification queries committed alongside the schema.
- **As the author of Demo A or Demo B (later)**, I connect to a single shared
  database that has already enforced Article II (Demo Isolation) by being the
  only cross-demo surface.

## Resolved decisions

The following decisions were resolved during specification and shape the
acceptance criteria below:

1. **CSV path is env-driven.** ETL reads the path from `VEH0120_CSV` (default
   `data/df_VEH0120_GB.csv`). Source CSV is already in place at that path.
2. **No pgAdmin service in compose.** Postgres is exposed on `localhost:5432`;
   contributors connect their own pgAdmin (or any client) to it.
3. **UK spelling everywhere.** Column names follow the DVLA source:
   `licence_status`, `body_type`, `make`, `gen_model`, `model`, `fuel`.
4. **Period coverage is an observation, not a constraint.** ETL is agnostic to
   the date range; a verification query reports the range that was loaded.
5. **CSV file is present** at `data/df_VEH0120_GB.csv` (60 MB) — no implementation
   blocker.

## Acceptance Criteria

### Infrastructure (#1)

- [ ] `docker compose up -d` brings Postgres 16 up cleanly on a fresh clone
- [ ] Postgres exposed on `localhost:5432` (no pgAdmin service in compose)
- [ ] `.env.example` documents all required variables; real `.env` gitignored
- [ ] Connection string available as `DATABASE_URL`

### Schema (#3)

- [ ] `src/etl/schema.sql` creates `dim_vehicle`, `dim_period`, and `fact_registrations`
- [ ] All identifiers use UK spelling (`licence_status`, `body_type`, `gen_model`, …)
- [ ] `v_schema_summary` view exists and summarises row counts and key dimensions
- [ ] **Every** table has a `COMMENT ON TABLE` aimed at LLM consumption
- [ ] **Every** column has a `COMMENT ON COLUMN` describing semantics, units, and value sets
- [ ] Column comments enumerate exact value sets where the data is finite (fuel
      types, licence_status values, body types)
- [ ] Verification queries appear as SQL comments at the bottom of `schema.sql`
- [ ] One verification query reports the actual period range loaded
- [ ] Schema applies cleanly via `psql` against the running Postgres container

### ETL (#2)

- [ ] `src/etl/etl.py` reads the CSV path from `VEH0120_CSV` env var
      (default `data/df_VEH0120_GB.csv`) and loads all three tables
- [ ] ETL melts the wide pivot (~82 quarterly columns in `YYYY QN` format) into
      `fact_registrations` rows
- [ ] ETL uses `psycopg2` with parameterised queries — no ORM
- [ ] Dim inserts use `psycopg2.extras.execute_values` with `page_size=5000`
- [ ] Fact inserts use `COPY FROM` into a TEMP staging table, then a single
      server-side `INSERT … SELECT … JOIN dim_vehicle … ON CONFLICT DO NOTHING`
      to resolve `vehicle_id` without per-row Python work
- [ ] Idempotent: a fast-skip at startup detects a populated `fact_registrations`
      and exits as a no-op (~3 s); contributors run
      `TRUNCATE fact_registrations` to force a fresh load
- [ ] Exits 0 on success, 1 on failure
- [ ] `src/etl/requirements.txt` pins direct deps (latest stable)
- [ ] Reproducible row counts documented in PR description
- [ ] **First-run timing on Docker Desktop / Windows is approximately 35 minutes**
      — a one-time onboarding cost dominated by Postgres index maintenance and
      WSL2 volume I/O at the 19.7M-row fact scale. Subsequent runs are < 5 s
      via fast-skip. Future contributors only pay the load cost once.

### Documentation (#4)

- [ ] README updated with Mermaid ER diagram matching `schema.sql`
- [ ] README updated with Mermaid architecture diagram (DB, mcp-postgres, both demos)
- [ ] Quick-start runs end-to-end on a fresh clone (assumes user has placed CSV)
- [ ] No ASCII diagrams (Article VI)

### Release plumbing

- [ ] CHANGELOG entry added under `[Unreleased]` describing what shipped
- [ ] `docs/ROADMAP.md` row for `v0.1.0` marked ✅
- [ ] Tag `v0.1.0` applied after merge

## Out of Scope

- Demo A (MCP Apps) and Demo B (CopilotKit) implementations — Features 002 and 003.
- Authentication, multi-tenant deployment, production hosting.
- Custom query tools or NL→SQL translation layers — forbidden by Article III.
- ORMs of any kind — forbidden by Article III.
- Indexing strategy beyond primary and foreign keys (revisit if performance
  becomes an issue during demo work).
- Materialised views beyond `v_schema_summary`.
- pgAdmin as a docker-compose service (omitted by decision §2 above).

## Dependencies

- **Blocks:** Feature 002 (Demo A) and Feature 003 (Demo B). They cannot start
  until this database exists and is populated.
- **Depends on:** none. This is the foundation feature.
- **External:** the DVLA VEH0120 CSV is already placed at
  `data/df_VEH0120_GB.csv` (gitignored, user-supplied).

## Constitution Compliance

- [x] **Article I — Source Layout:** all code under `src/etl/`. `docker-compose.yml`
      and `.env.example` live at repo root as configuration, not source.
- [x] **Article II — Demo Isolation:** this feature ships only the shared
      database; nothing demo-specific is introduced.
- [x] **Article III — No Custom Query Tools:** ETL uses raw SQL via psycopg2
      parameterised queries. The schema and its comments are the only
      prompt-engineering surface. No ORM. No NL→SQL helpers.
- [x] **Article IV — Latest Dependencies:** Python 3.13+, Postgres 16,
      latest stable `psycopg2-binary`, `pandas`, `python-dotenv`. Exact pinned
      versions to be determined by `/speckit.plan` research step.
- [x] **Article V — Documentation-First:** spec → plan → tasks → code.
- [x] **Article VI — Mermaid-Only Diagrams:** README diagrams will use Mermaid.
- [x] **Article VII — Simplicity:** no premature optimisation; star schema is
      the minimum that lets both demos answer the golden-path questions.
