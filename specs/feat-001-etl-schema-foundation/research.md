# Research — Feature 001 — ETL + Postgres Schema

Research conducted on 2026-05-07 as required by `/speckit.plan` and Article IV
(Latest Dependencies). All versions are the latest stable releases available
on the date of research.

---

## Python — `3.14.4`

- **Released:** 2026-04-07
- **Source:** [python.org release notes](https://www.python.org/downloads/release/python-3144/)
- **Status:** stable maintenance release of 3.14.x; 3.13.13 also released same day for the 3.13 line; 3.15 still in alpha (3.15.0a8 released 2026-04, 3.15.0b1 scheduled 2026-05-05).
- **Decision:** target **Python 3.14**. The constitution's table says "3.13+" as a floor; Article IV requires latest stable. 3.14 is GA, so 3.14 wins.
- **Compatibility check:**
  - `psycopg2-binary 2.9.12` ships wheels for Python 3.9 → 3.14 ✓
  - `pandas 3.0.2` requires Python 3.11+ ✓
  - `python-dotenv 1.2.2` explicitly supports 3.14 ✓

## uv — latest rolling

- **Source:** [github.com/astral-sh/uv/releases](https://github.com/astral-sh/uv/releases)
- **Status:** rolling release, latest published 2026-05-04. uv has a bonus 3.14 release-candidate handling layer (3.14 introduced a GC change that caused production memory pressure; uv shipped a workaround patched into 3.14.5/3.15).
- **Decision:** install `uv` via the standard Astral installer. Do not pin a uv version inside `requirements.txt` — uv is the *runner*, not a *dependency*. Document the install command in README.

## psycopg2-binary — `2.9.12`

- **Released:** 2026-04-20
- **Source:** [pypi.org/project/psycopg2-binary](https://pypi.org/project/psycopg2-binary/)
- **Status:** stable. Wheels for Linux (manylinux), macOS, Windows; Python 3.9 → 3.14.
- **Decision:** pin `psycopg2-binary==2.9.12` in `requirements.txt`. Use `psycopg2.extras.execute_values` for batch inserts of 5,000 rows.
- **Constitution check:** Article III requires raw SQL, not an ORM. psycopg2 is a driver, not an ORM ✓.

## pandas — `3.0.2`

- **Released:** 2026-03-31 (3.0.0 GA was 2026-01-21; this is the second patch)
- **Source:** [pandas.pydata.org/docs/whatsnew](https://pandas.pydata.org/docs/whatsnew/index.html)
- **Status:** stable. pandas 3.0 is a major-release line introduced January 2026 with breaking changes; 3.0.2 includes regression fixes.
- **Decision:** pin `pandas==3.0.2`. The ETL uses pandas only for CSV parsing and `DataFrame.melt()` to convert the ~82 quarterly columns to long format. No pandas 2.x APIs are touched, so the 3.0 break is irrelevant here.

## python-dotenv — `1.2.2`

- **Released:** 2026-03-01
- **Source:** [pypi.org/project/python-dotenv](https://pypi.org/project/python-dotenv/)
- **Status:** stable. Adds Python 3.14 support and `PYTHON_DOTENV_DISABLED` opt-out.
- **Decision:** pin `python-dotenv==1.2.2`. Used by `etl.py` to read `DATABASE_URL` from `.env` during local development.

## PostgreSQL — `16.13` (Docker official image)

- **Released:** 2026-02-26 (CVE/security fixes batch released across 18.3, 17.9, 16.13, 15.17, 14.22)
- **Source:** [hub.docker.com/_/postgres](https://hub.docker.com/_/postgres) and [postgresql.org/docs/release](https://www.postgresql.org/docs/release/)
- **Decision:** use `postgres:16-alpine` in `docker-compose.yml`. Docker Hub's `16` and `16-alpine` tags track the latest 16.x patch (currently `16.13`). Alpine is ~80 MB smaller than the Debian variant; PostgreSQL has no glibc-specific quirks for our workload.
- **Constitution check:** Article IV pins **major version** to 16, latest patch automatically resolved by tag.

## pgAdmin — local install only

- **Decision (per spec resolution §2):** no pgAdmin service in `docker-compose.yml`.
  User has pgAdmin 4 installed natively on Windows. Postgres is exposed on
  `localhost:5432`; the local pgAdmin connects to it directly.
- **Trade-off:** contributors without a local pgAdmin need to install one or
  run `pgadmin4` ad-hoc via Docker. Acceptable — spec is a research PoC, not a
  product onboarding flow.

## mcp-postgres — out of scope here

The `mcp-postgres` MCP server is a Demo A / Demo B dependency, not an ETL
dependency. Version research deferred to Feature 002 / Feature 003.

---

## Summary table — what gets pinned where

| Dep | Where pinned | Pin |
|---|---|---|
| Python | `pyproject.toml` (or runtime via uv) | `>=3.14` |
| psycopg2-binary | `src/etl/requirements.txt` | `==2.9.12` |
| pandas | `src/etl/requirements.txt` | `==3.0.2` |
| python-dotenv | `src/etl/requirements.txt` | `==1.2.2` |
| PostgreSQL | `docker-compose.yml` image tag | `postgres:16-alpine` |
| uv | not pinned (system tool) | latest |
