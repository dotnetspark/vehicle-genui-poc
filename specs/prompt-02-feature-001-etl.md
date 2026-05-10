# Prompt 2 — Feature 001: ETL + Schema (Milestone v0.1.0)

> Feed this to Claude Code after Prompt 1 is complete and the scaffold is validated.
> This covers Roadmap items R1–R4 (Milestone v0.1.0).

---

## Step 1 — Create the GitHub Issues

Before writing any code, confirm the following GitHub Issues exist (create them if not):

- #1: feat: Docker Compose — Postgres 16 + pgAdmin
- #2: feat: ETL — VEH0120 CSV → star schema
- #3: feat: Schema comments, v_schema_summary view, verification queries
- #4: feat: README scaffold with Mermaid diagrams

## Step 2 — Run /speckit.specify

```
/speckit.specify

Feature 001 — Foundation: ETL + Postgres Schema

We have a CSV file at data/df_VEH0120_GB.csv containing UK vehicle registration data
(DVLA VEH0120). It is a wide pivot table: ~240k rows, columns BodyType, Make, GenModel,
Model, Fuel, LicenceStatus, followed by ~82 quarterly count columns in "YYYY QN" format
(e.g. "2024 Q3") from 1994 Q4 to 2025 Q2.

We need to:
1. Spin up Postgres 16 via Docker Compose (with pgAdmin)
2. Create a star schema: dim_vehicle, dim_period, fact_registrations
3. Write an ETL script that melts the wide CSV into the star schema
4. Add table comments that describe domain rules for an LLM reading the schema cold
5. Create a v_schema_summary view
6. Scaffold README.md with Mermaid ER diagram and architecture diagram

All source code goes in src/etl/. Docker Compose at repo root.
Closes #1, #2, #3, #4.
```

Review the generated spec.md. Resolve any [NEEDS CLARIFICATION] items.

## Step 3 — Run /speckit.plan

```
/speckit.plan

Use the constitution and spec.md for Feature 001.
Research and confirm exact latest stable versions of:
- Python (target 3.13+)
- uv
- psycopg2-binary
- pandas
- python-dotenv
- PostgreSQL Docker image (target 16)

The ETL script must use psycopg2 (no ORM), batch inserts of 5,000 rows,
idempotent via INSERT ON CONFLICT DO NOTHING, and exit 0/1.

The schema must include:
- Table comments written as documentation for an LLM (not a human developer)
- v_schema_summary view
- Verification queries as comments at the bottom of schema.sql
- Exact column value enumerations in comments (e.g. all 11 fuel types, 2 licence_status values)
```

Review plan.md and research.md before proceeding.

## Step 4 — Run /speckit.tasks

```
/speckit.tasks
```

Verify the final task is the CHANGELOG + roadmap update task.

## Step 5 — Run /speckit.analyze

```
/speckit.analyze
```

Resolve any ❌ or ⚠️ items before implementation.

## Step 6 — Run /speckit.implement

```
/speckit.implement

Implement one task at a time. After each task, run the acceptance criterion.
Stop and report if any task would violate the constitution.

Priority sequence:
1. docker-compose.yml + .env.example
2. src/etl/schema.sql (DDL + comments + view + verification queries)
3. Apply schema: docker compose up -d, then psql to verify
4. src/etl/etl.py
5. src/etl/requirements.txt
6. Run etl.py, verify with all four verification queries
7. README.md (Mermaid ER + architecture diagrams, quick start)
8. CHANGELOG.md entry, ROADMAP.md milestone v0.1.0 marked done
```

## Step 7 — Tag the milestone

After all tasks are complete and verified:
```bash
git add .
git commit -m "feat(001): ETL + schema foundation — closes #1 #2 #3 #4"
git tag v0.1.0
```
