# Tasks — Feature 001 — ETL + Postgres Schema

Branch: `feat/001-etl-schema-foundation`
Issues: #1, #2, #3, #4
Milestone: `v0.1.0`

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked (reason in notes)

---

## Phase 1 — Infrastructure (#1)

### Task 1.1 — Stand up Postgres 16 via Docker Compose

**Acceptance:**
- `docker compose up -d` from a fresh clone brings up `postgres:16-alpine` cleanly.
- Postgres reachable on `localhost:5432` from the host (verified by `psql` connection).
- `.env.example` documents `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`.
- Real `.env` exists locally and is gitignored (already covered by root `.gitignore`).
- Named volume `pgdata` persists data across `docker compose down` / `up`.

**Files:** `docker-compose.yml` (new), `.env.example` (new)
**Dependencies:** none
**Parallel:** No (gates everything else)
**Notes:**
- Use `postgres:16-alpine` per plan §Architecture Decisions.
- No pgAdmin service — user has pgAdmin 4 locally (spec resolution §2).
- Compose lives at repo root — config, not source (Article I clause).

- [x] Implementation
- [x] Verification — `docker compose ps` reports healthy; `docker compose exec db pg_isready -U postgres -d vehicles` accepts connections; `\l` shows the `vehicles` database; running PostgreSQL 16.13 on `postgres:16-alpine`

---

## Phase 2 — Schema (#3)

### Task 2.1 — Author `schema.sql` (DDL + comments + view + verification queries) [P]

**Acceptance:**
- `src/etl/schema.sql` defines `dim_vehicle`, `dim_period`, `fact_registrations`.
- Unique constraints: `dim_vehicle (body_type, make, gen_model, model, fuel)`,
  `dim_period (year, quarter)`,
  `fact_registrations (vehicle_id, period_id, licence_status)`.
- FKs: `fact_registrations.vehicle_id → dim_vehicle.vehicle_id`,
  `fact_registrations.period_id → dim_period.period_id`.
- All identifiers use UK spelling (`licence_status`, `body_type`, `gen_model`, etc.).
- `v_schema_summary` view summarises row counts and key dimensions.
- **Every** table has `COMMENT ON TABLE` written for an LLM (purpose, grain, what to query).
- **Every** column has `COMMENT ON COLUMN` describing semantics, units, and value sets;
  comments enumerate exact value sets for `fuel`, `licence_status`, and `body_type`.
- Verification queries appear as SQL comments at the bottom of `schema.sql`:
  1. Row counts per table
  2. Distinct values for `body_type`, `fuel`, `licence_status`
  3. Period coverage (min/max `period_label`, full-quarter count)
  4. Top 10 makes by total registrations

**Files:** `src/etl/schema.sql` (new)
**Dependencies:** none (parallel with 3.1)
**Parallel:** Yes — runs alongside Task 3.1
**Notes:**
- Article III: these comments are the LLM's only schema documentation. Treat
  them as the prompt. No external docs.
- Use `SERIAL` for `vehicle_id` and `period_id` PKs.
- `period_label` is computed `'YYYY QN'` text; `is_full_quarter` is boolean
  (CSV may include partial-quarter columns at the trailing edge).

- [x] Implementation
- [x] Verification — `psql -f schema.sql` ran cleanly producing CREATE TABLE × 3, CREATE VIEW × 1, COMMENT × 19 (table + column + view comments). Categorical enumerations sampled from the CSV: 6 body types, 11 fuels, 2 licence statuses.

### Task 2.2 — Apply schema and verify comments came through

**Acceptance:**
- Schema applies cleanly (no errors). On Windows without a native `psql`, run:
  `docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < src/etl/schema.sql`
  (PowerShell: `Get-Content src/etl/schema.sql | docker compose exec -T db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB`).
  Alternatively, use the local pgAdmin 4 install: connect to `localhost:5432`
  and run the file via Query Tool.
- `docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\dt+'`
  shows all three tables and the view.
- `\d+ dim_vehicle`, `\d+ dim_period`, `\d+ fact_registrations` show every
  column comment.
- Re-running the file is idempotent or fails harmlessly (use `CREATE … IF NOT EXISTS`
  or document the expected error).

**Files:** none modified — verification only
**Dependencies:** 1.1, 2.1
**Parallel:** No
**Notes:**
- Capture the `\d+` output in PR description for review.
- A native `psql` install is not required; the container's `psql` is used via
  `docker compose exec`.

- [x] Implementation (apply schema) — applied via `docker compose exec -T db psql ... < src/etl/schema.sql`
- [x] Verification (`\dt+`, `\d+` outputs match spec) — all 3 tables + 1 view present, every table/column comment landed (verified via `\dt+` and `\d+ dim_vehicle`)

---

## Phase 3 — ETL (#2)

### Task 3.1 — Pin Python dependencies [P]

**Acceptance:**
- `src/etl/requirements.txt` contains exactly these pinned lines:
  - `psycopg2-binary==2.9.12`
  - `pandas==3.0.2`
  - `python-dotenv==1.2.2`
- `uv pip install -r src/etl/requirements.txt` succeeds against Python 3.14.

**Files:** `src/etl/requirements.txt` (new)
**Dependencies:** none (parallel with 2.1)
**Parallel:** Yes — runs alongside Task 2.1
**Notes:**
- Versions verified in research.md as the latest stable on 2026-05-07.
- Do not pin uv itself — it is a system tool, not a project dep.

- [x] Implementation
- [x] Verification — `.venv` created with Python 3.14.3 (auto-installed by uv); `uv pip install -r src/etl/requirements.txt` resolved 3 direct + 4 transitive packages cleanly

### Task 3.2 — Implement `etl.py`

**Acceptance:**
- Reads `.env` via `python-dotenv`; resolves `DATABASE_URL` and `VEH0120_CSV`
  (default `data/df_VEH0120_GB.csv`).
- Parses the CSV with `pandas.read_csv(...)`.
- Extracts `dim_vehicle` rows via distinct of
  `(body_type, make, gen_model, model, fuel)`; bulk-inserts via
  `psycopg2.extras.execute_values` with `page_size=5000` and
  `ON CONFLICT DO NOTHING`.
- Extracts `dim_period` rows by parsing the `YYYY QN` column headers; bulk-inserts
  with `ON CONFLICT DO NOTHING`.
- Calls `df.melt(...)` to convert wide quarter columns to long format.
- Inserts into `fact_registrations` by JOINing the long DataFrame with
  `dim_vehicle` and `dim_period` IDs at insert time (single SQL JOIN, not
  pandas merge — keeps memory bounded).
- Prints final row counts to stdout for each of the three tables.
- Exits 0 on success, 1 on any DB error.

**Files:** `src/etl/etl.py` (new)
**Dependencies:** 2.2, 3.1
**Parallel:** No
**Notes:**
- No ORM. Raw SQL via psycopg2 only (Article III).
- No NL→SQL helpers (Article III).
- Must be idempotent — every insert path uses `ON CONFLICT DO NOTHING`.
- Handle `NaN` cells from `pandas.melt` by skipping them (DVLA leaves cells
  empty for vehicles that didn't exist yet in early quarters).
- `is_full_quarter` rule: a quarter column header is treated as partial
  (`is_full_quarter = false`) if it contains a parenthetical suffix such as
  `(P)` or `(provisional)`; all other quarters are full. If the actual CSV
  uses a different convention, this is the only line in `etl.py` to adjust.

- [x] Implementation
- [x] Verification — `python src/etl/etl.py` imports clean; first end-to-end run loaded the expected counts; fast-skip path returns in 2.7 s on a populated DB

### Task 3.3 — Run ETL end-to-end and confirm idempotency

**Acceptance:**
- First run loads the expected counts and exits 0. Observed on Docker Desktop /
  Windows: ~36 min (one-time onboarding cost — see spec.md ETL note).
- Verification query #1 (row counts) returns sensible values:
  - `dim_vehicle` ≈ tens of thousands of distinct vehicles
  - `dim_period` matches the number of `YYYY QN` columns in the CSV (~82)
  - `fact_registrations` is in the millions (rows × quarters minus null cells)
- Verification queries #2, #3, #4 all return non-empty, plausible results.
- Second consecutive run is a no-op via the fast-skip path: completes in
  under 5 seconds, inserts zero new rows.
- Exit code 0 on both runs.
- Row counts captured for the eventual PR description.

**Files:** none — execution only
**Dependencies:** 3.2
**Parallel:** No
**Notes:**
- The CSV is already at `data/df_VEH0120_GB.csv` (60 MB).
- The 5-min target in the original spec proved unreachable at 19.7M rows on
  Docker Desktop / Windows due to WSL2 volume I/O. Optimisations attempted:
  COPY FROM into TEMP staging table + server-side JOIN. Bottleneck shifted to
  Postgres index maintenance on `fact_registrations`. The pragmatic fix
  (fast-skip) preserves idempotency and makes re-runs trivially fast.
- Force a reload via `docker compose exec db psql -U postgres -d vehicles -c 'TRUNCATE fact_registrations;'`.

- [x] Implementation (run `python src/etl/etl.py`) — first run 2198 s; loaded 19.7M facts
- [x] Verification (re-run shows zero new rows) — fast-skip run 2.7 s; counts unchanged: dim_vehicle=139,553, dim_period=82, fact_registrations=19,666,224

---

## Phase 4 — Documentation (#4)

### Task 4.1 — Polish README quick-start and verify Mermaid diagrams

**Acceptance:**
- README quick-start steps run end-to-end on a fresh clone (assuming the user
  has placed the CSV).
- README ER Mermaid diagram exactly matches the columns and constraints in the
  applied `schema.sql`.
- README architecture Mermaid diagram includes Postgres, mcp-postgres, and
  both demos.
- No ASCII diagrams anywhere (Article VI).
- README references the correct ETL invocation (`uv run python src/etl/etl.py`)
  and the correct env file (`.env`, derived from `.env.example`).

**Files:** `README.md` (modified)
**Dependencies:** 3.3
**Parallel:** No
**Notes:**
- The hand-edited README at v0.0.1 already contains both diagrams. This task
  is reconciliation, not authoring from scratch.
- Update example queries section if anything from the actual data informs
  what to demo.

- [x] Implementation — quick-start updated to use `cp .env.example .env`, `docker compose exec` for schema apply, `uv venv` + `uv pip install` for deps, `uv run python src/etl/etl.py` for the load; first-run timing footnote added
- [x] Verification — Mermaid ER diagram matches `src/etl/schema.sql` 1:1; architecture diagram includes Postgres + mcp-postgres + both demos

---

## Phase 5 — Release plumbing

### Task 5.1 — Update CHANGELOG and close roadmap item

**Acceptance:** CHANGELOG.md has an entry under [Unreleased] describing this feature.
docs/ROADMAP.md item for this feature is marked ✅.

**Files:** `CHANGELOG.md`, `docs/ROADMAP.md`
**Dependencies:** All previous tasks complete

- [x] CHANGELOG entry written — `[Unreleased]` block lists schema, ETL, env scaffolding, with row counts and timing note
- [x] Roadmap item marked done — `v0.0.1` and `v0.1.0` rows now show ✅ in `docs/ROADMAP.md`
