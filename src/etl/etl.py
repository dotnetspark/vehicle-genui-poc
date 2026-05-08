"""ETL: DVLA VEH0120 wide CSV -> Postgres star schema.

Loads `dim_vehicle`, `dim_period`, and `fact_registrations` from the
DVLA VEH0120 CSV. Idempotent — every insert uses ON CONFLICT DO NOTHING.

Strategy:
- Dim tables: pandas drop_duplicates -> psycopg2.extras.execute_values.
- Fact table: chunked vectorised melt -> DataFrame.to_csv -> COPY FROM
  into a TEMP staging table -> INSERT INTO fact_registrations SELECT
  JOIN dim_vehicle. Postgres resolves vehicle_id via JOIN; Python never
  iterates the ~20M fact rows. Memory stays bounded by chunk size.

Run:
    uv run python src/etl/etl.py

Env (loaded from .env via python-dotenv):
    DATABASE_URL   postgresql://user:pass@host:port/db
    VEH0120_CSV    path to CSV (default: data/df_VEH0120_GB.csv)
"""

from __future__ import annotations

import io
import os
import re
import sys
import time
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

BATCH_SIZE = 5000
SOURCE_CHUNK_ROWS = 25_000  # 25k source rows × 82 quarters ≈ 2M long rows per chunk
DIM_COLS = ["BodyType", "Make", "GenModel", "Model", "Fuel"]
LICENCE_COL = "LicenceStatus"

# Match "YYYY QN" with an optional parenthetical suffix like "(P)" or "(provisional)".
# A parenthetical suffix flags the quarter as provisional → is_full_quarter = false.
QUARTER_COL_RE = re.compile(r"^(\d{4})\s+Q([1-4])(?:\s*\((.+)\))?$")


def parse_quarter_header(header: str) -> tuple[int, int, bool] | None:
    m = QUARTER_COL_RE.match(header.strip())
    if m is None:
        return None
    return int(m.group(1)), int(m.group(2)), m.group(3) is None


def main() -> int:
    load_dotenv()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL not set (check .env)", file=sys.stderr)
        return 1

    csv_path = Path(os.environ.get("VEH0120_CSV", "data/df_VEH0120_GB.csv"))
    if not csv_path.exists():
        print(f"ERROR: CSV not found at {csv_path}", file=sys.stderr)
        return 1

    t_start = time.monotonic()

    # Fast-skip: if fact_registrations is already populated, exit early.
    # Re-running a populated DB is a no-op. To force a reload:
    #   docker compose exec db psql -U postgres -d vehicles -c 'TRUNCATE fact_registrations;'
    try:
        with psycopg2.connect(db_url) as probe:
            with probe.cursor() as pcur:
                pcur.execute("SELECT COUNT(*) FROM fact_registrations")
                existing_facts = pcur.fetchone()[0]
                if existing_facts > 0:
                    pcur.execute("SELECT COUNT(*) FROM dim_vehicle")
                    existing_vehicles = pcur.fetchone()[0]
                    pcur.execute("SELECT COUNT(*) FROM dim_period")
                    existing_periods = pcur.fetchone()[0]
                    print(
                        f"fact_registrations already has {existing_facts:,} rows — "
                        f"skipping load. Run TRUNCATE fact_registrations; to force "
                        f"a reload.",
                        flush=True,
                    )
                    print(
                        f"\nDone in {time.monotonic() - t_start:.1f}s. "
                        f"dim_vehicle={existing_vehicles:,}  "
                        f"dim_period={existing_periods:,}  "
                        f"fact_registrations={existing_facts:,}"
                    )
                    return 0
    except psycopg2.Error as e:
        print(f"ERROR: probe failed: {e}", file=sys.stderr)
        return 1

    print(f"Reading {csv_path} ...", flush=True)
    t = time.monotonic()
    df = pd.read_csv(csv_path, encoding="utf-8-sig")
    df = df.dropna(subset=DIM_COLS + [LICENCE_COL])
    print(f"  {len(df):,} source rows in {time.monotonic() - t:.1f}s", flush=True)

    quarter_cols_raw = [c for c in df.columns if c not in DIM_COLS + [LICENCE_COL]]
    quarter_meta: list[tuple[int, int, str, bool, str]] = []
    for col in quarter_cols_raw:
        parsed = parse_quarter_header(col)
        if parsed is None:
            print(f"WARNING: skipping unrecognised column '{col}'", file=sys.stderr)
            continue
        year, quarter, is_full = parsed
        quarter_meta.append((year, quarter, f"{year} Q{quarter}", is_full, col))
    valid_quarter_cols = [m[4] for m in quarter_meta]

    try:
        with psycopg2.connect(db_url) as conn:
            with conn.cursor() as cur:
                # 1. dim_vehicle
                t = time.monotonic()
                vehicle_tuples = list(
                    df[DIM_COLS].drop_duplicates().itertuples(index=False, name=None)
                )
                print(f"Inserting {len(vehicle_tuples):,} dim_vehicle rows ...", flush=True)
                execute_values(
                    cur,
                    "INSERT INTO dim_vehicle (body_type, make, gen_model, model, fuel) "
                    "VALUES %s ON CONFLICT DO NOTHING",
                    vehicle_tuples,
                    page_size=BATCH_SIZE,
                )
                print(f"  done in {time.monotonic() - t:.1f}s", flush=True)

                # 2. dim_period
                t = time.monotonic()
                period_rows = [(y, q, lab, full) for y, q, lab, full, _ in quarter_meta]
                print(f"Inserting {len(period_rows):,} dim_period rows ...", flush=True)
                execute_values(
                    cur,
                    "INSERT INTO dim_period (year, quarter, period_label, is_full_quarter) "
                    "VALUES %s ON CONFLICT DO NOTHING",
                    period_rows,
                    page_size=BATCH_SIZE,
                )
                print(f"  done in {time.monotonic() - t:.1f}s", flush=True)

                # Build raw-column-header → period_id map (used to vectorise the melt).
                cur.execute("SELECT period_id, year, quarter FROM dim_period")
                period_by_yq = {(y, q): pid for pid, y, q in cur.fetchall()}
                col_to_pid = {col: period_by_yq[(y, q)] for y, q, _, _, col in quarter_meta}

                # 3. fact_registrations — chunked melt → COPY → INSERT SELECT JOIN.
                t = time.monotonic()
                cur.execute(
                    """CREATE TEMP TABLE staging_facts (
                           body_type      TEXT,
                           make           TEXT,
                           gen_model      TEXT,
                           model          TEXT,
                           fuel           TEXT,
                           licence_status TEXT,
                           period_id      INT,
                           count          INT
                       ) ON COMMIT DROP"""
                )

                total_long_rows = 0
                num_chunks = (len(df) + SOURCE_CHUNK_ROWS - 1) // SOURCE_CHUNK_ROWS
                print(
                    f"Melting + COPY into staging "
                    f"({num_chunks} chunks of up to {SOURCE_CHUNK_ROWS:,} source rows) ...",
                    flush=True,
                )
                for chunk_idx, start in enumerate(range(0, len(df), SOURCE_CHUNK_ROWS), 1):
                    chunk = df.iloc[start:start + SOURCE_CHUNK_ROWS]
                    long_chunk = chunk.melt(
                        id_vars=DIM_COLS + [LICENCE_COL],
                        value_vars=valid_quarter_cols,
                        var_name="quarter_col",
                        value_name="count",
                    ).dropna(subset=["count"])
                    long_chunk["count"] = long_chunk["count"].astype("int64")
                    long_chunk["period_id"] = (
                        long_chunk["quarter_col"].map(col_to_pid).astype("int64")
                    )
                    long_chunk = long_chunk[DIM_COLS + [LICENCE_COL, "period_id", "count"]]

                    buf = io.StringIO()
                    long_chunk.to_csv(buf, sep="\t", index=False, header=False)
                    buf.seek(0)
                    cur.copy_expert(
                        "COPY staging_facts "
                        "(body_type, make, gen_model, model, fuel, licence_status, period_id, count) "
                        r"FROM STDIN WITH (FORMAT csv, DELIMITER E'\t')",
                        buf,
                    )
                    total_long_rows += len(long_chunk)
                    print(
                        f"  chunk {chunk_idx}/{num_chunks}: "
                        f"{len(long_chunk):,} rows staged "
                        f"(running total {total_long_rows:,})",
                        flush=True,
                    )
                print(f"  staging populated in {time.monotonic() - t:.1f}s", flush=True)

                # 4. Server-side JOIN to resolve vehicle_id, idempotent insert.
                t = time.monotonic()
                cur.execute(
                    """INSERT INTO fact_registrations
                           (vehicle_id, period_id, licence_status, count)
                       SELECT v.vehicle_id, s.period_id, s.licence_status, s.count
                       FROM staging_facts s
                       JOIN dim_vehicle v USING (body_type, make, gen_model, model, fuel)
                       ON CONFLICT DO NOTHING"""
                )
                inserted = cur.rowcount  # rows actually inserted (excludes ON CONFLICT skips)
                print(
                    f"INSERT SELECT JOIN: {inserted:,} new fact rows in "
                    f"{time.monotonic() - t:.1f}s",
                    flush=True,
                )

                # 5. Final counts
                cur.execute("SELECT COUNT(*) FROM dim_vehicle")
                v_count = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM dim_period")
                p_count = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM fact_registrations")
                f_count = cur.fetchone()[0]

        print(
            f"\nDone in {time.monotonic() - t_start:.1f}s. "
            f"dim_vehicle={v_count:,}  dim_period={p_count:,}  "
            f"fact_registrations={f_count:,}"
        )
        return 0
    except (psycopg2.Error, ValueError, KeyError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
