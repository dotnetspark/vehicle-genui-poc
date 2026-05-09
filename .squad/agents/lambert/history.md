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
