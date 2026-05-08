# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Feature 001 — ETL + Postgres schema foundation** (#1, #2, #3, #4):
  - `docker-compose.yml` runs Postgres 16 (Alpine) on `localhost:5432` with
    a named `pgdata` volume and a `pg_isready` healthcheck. pgAdmin
    intentionally omitted — connect any local pgAdmin / psql to the
    exposed port.
  - `.env.example` documents `POSTGRES_USER/PASSWORD/DB`, `DATABASE_URL`,
    and `VEH0120_CSV`.
  - `src/etl/schema.sql`: star schema (`dim_vehicle`, `dim_period`,
    `fact_registrations`) plus `v_schema_summary` view. Every table and
    every column carries a `COMMENT ON …` written for LLM consumption —
    enumerations include all 6 body types, all 11 fuel types, and the 2
    licence statuses (Licensed, SORN) sampled from the CSV. Four
    verification queries appear as trailing SQL comments.
  - `src/etl/etl.py`: idempotent ETL. Dim inserts via
    `psycopg2.extras.execute_values` (page_size=5000). Fact inserts via
    chunked `pandas.melt` → `DataFrame.to_csv` → `COPY FROM` into a TEMP
    staging table → server-side `INSERT … SELECT … JOIN dim_vehicle`
    to resolve `vehicle_id` without per-row Python work. A fast-skip
    short-circuits re-runs on a populated DB in ~3 s; run
    `TRUNCATE fact_registrations` to force a reload.
  - `src/etl/requirements.txt`: pinned `psycopg2-binary==2.9.12`,
    `pandas==3.0.2`, `python-dotenv==1.2.2` (latest stable on 2026-05-07).

### Notes

- Initial load row counts: `dim_vehicle=139,553`, `dim_period=82`,
  `fact_registrations=19,666,224`. Period coverage 1994 Q4 → 2025 Q2 (no
  provisional quarters in the source data).
- First-run timing on Docker Desktop / Windows is approximately 35 minutes
  due to WSL2 volume I/O and Postgres index maintenance at the 19.7M-row
  fact scale. This is a one-time onboarding cost — re-runs are < 5 s via
  fast-skip. See `specs/feat-001-etl-schema-foundation/spec.md` for the
  full discussion.

## [0.0.1] — 2026-05-07

### Added

- Spec Kit SDD scaffold: `.specify/constitution.md`, templates, slash
  commands under `.claude/commands/`.
- Empty source tree under `src/` with placeholders for `shared/`, `etl/`,
  `demo-a-mcp-apps/`, and `demo-b-copilotkit/frontend/`.
- Repository documentation: `README.md`, `docs/PRD.md`, `docs/ROADMAP.md`.
- GitHub issue and pull request templates under `.github/`.
- Root `.gitignore` covering Python, Node, environment files, and raw CSV data.
- `data/README.md` documenting where the user must place the DVLA VEH0120 CSV.
