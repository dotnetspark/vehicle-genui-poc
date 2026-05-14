-- vehicle-genui-poc schema
-- Loaded by src/etl/etl.py from data/df_VEH0120_GB.csv.
-- Source: DVLA VEH0120 — UK vehicle registrations by make/model/fuel/quarter.
--
-- The COMMENT ON statements below are the LLM's only documentation
-- (constitution Article III). Edit them with that in mind: prefer concrete
-- value enumerations and worked examples over abstract prose.

-- =============================================================================
-- dim_vehicle
-- =============================================================================

CREATE TABLE IF NOT EXISTS dim_vehicle (
    vehicle_id  SERIAL PRIMARY KEY,
    body_type   TEXT NOT NULL,
    make        TEXT NOT NULL,
    gen_model   TEXT NOT NULL,
    model       TEXT NOT NULL,
    fuel        TEXT NOT NULL,
    UNIQUE (body_type, make, gen_model, model, fuel)
);

COMMENT ON TABLE dim_vehicle IS
$$Vehicle dimension. One row per distinct (body_type, make, gen_model, model, fuel)
tuple. Grain: a vehicle "kind". The licence/SORN status is NOT part of vehicle
identity — it lives on fact_registrations, so the same vehicle_id can be both
Licensed in one quarter and SORN in another.

Source: DVLA VEH0120 columns BodyType, Make, GenModel, Model, Fuel.

Typical use: JOIN fact_registrations f ON f.vehicle_id = dim_vehicle.vehicle_id
and filter on the categorical columns. Use SELECT COUNT(*) FROM dim_vehicle to
count distinct vehicle kinds.$$;

COMMENT ON COLUMN dim_vehicle.vehicle_id IS
'Surrogate primary key (SERIAL). No business meaning. Use as a JOIN key only.';

COMMENT ON COLUMN dim_vehicle.body_type IS
$$Vehicle body category. Exactly one of these 6 values (case-sensitive):
  - 'Buses and coaches'
  - 'Cars'
  - 'Heavy goods vehicles'   — HGVs / lorries
  - 'Light goods vehicles'   — vans
  - 'Motorcycles'
  - 'Other vehicles'         — DVLA catch-all (agricultural, special-purpose)$$;

COMMENT ON COLUMN dim_vehicle.make IS
$$Vehicle manufacturer (e.g. 'TOYOTA', 'FORD', 'BMW'). Source mixes uppercase
and mixed-case spellings; values are stored verbatim. Do not normalise — the
LLM should match the casing the user supplies in their question, or use ILIKE
for case-insensitive matching.$$;

COMMENT ON COLUMN dim_vehicle.gen_model IS
$$Generic / family model name (e.g. 'GOLF', 'CIVIC'). Coarser grouping than
the `model` column. Use this column to aggregate across model trims.$$;

COMMENT ON COLUMN dim_vehicle.model IS
$$Specific model variant (e.g. 'GOLF GTI', 'CIVIC TYPE R'). Finer than
`gen_model`. Use this column when the user asks about a specific trim.$$;

COMMENT ON COLUMN dim_vehicle.fuel IS
$$Fuel / propulsion type. Exactly one of these 11 values (UPPERCASE):
  - 'BATTERY ELECTRIC'                  — pure BEV
  - 'DIESEL'
  - 'FUEL CELL ELECTRIC'                — hydrogen
  - 'GAS'                               — LPG / CNG
  - 'HYBRID ELECTRIC (DIESEL)'          — non-plug-in diesel hybrid
  - 'HYBRID ELECTRIC (PETROL)'          — non-plug-in petrol hybrid
  - 'OTHER FUEL TYPES'
  - 'PETROL'
  - 'PLUG-IN HYBRID ELECTRIC (DIESEL)'  — PHEV diesel
  - 'PLUG-IN HYBRID ELECTRIC (PETROL)'  — PHEV petrol
  - 'RANGE EXTENDED ELECTRIC'           — EV with auxiliary ICE generator

Common groupings the LLM should know:
  - "Zero emission" or "EV"  →  fuel IN ('BATTERY ELECTRIC', 'FUEL CELL ELECTRIC', 'RANGE EXTENDED ELECTRIC')
  - "Plug-in hybrid" / "PHEV" →  fuel IN ('PLUG-IN HYBRID ELECTRIC (DIESEL)', 'PLUG-IN HYBRID ELECTRIC (PETROL)')
  - "Hybrid" (any)            →  fuel ILIKE '%HYBRID%'$$;

-- =============================================================================
-- dim_period
-- =============================================================================

CREATE TABLE IF NOT EXISTS dim_period (
    period_id        SERIAL PRIMARY KEY,
    year             SMALLINT NOT NULL,
    quarter          SMALLINT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    period_label     TEXT NOT NULL,
    is_full_quarter  BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (year, quarter)
);

COMMENT ON TABLE dim_period IS
$$Period dimension. One row per quarter present in the source data.
Coverage in the current load: 1994 Q4 through 2025 Q2 (~82 rows).

Important coverage detail:
  - 1994 Q4 through 2007 Q4: only Q4 snapshots are present (annual data).
  - 2008 Q3 onward:           every quarter Q1–Q4 is present.

Filter chronologically with WHERE year = N or year BETWEEN A AND B; order with
ORDER BY year, quarter. Use `period_label` for human-friendly output only.$$;

COMMENT ON COLUMN dim_period.period_id IS
'Surrogate primary key (SERIAL). Use as a JOIN key only.';

COMMENT ON COLUMN dim_period.year IS
'Calendar year. SMALLINT, current range 1994–2025.';

COMMENT ON COLUMN dim_period.quarter IS
'Calendar quarter 1–4. CHECK constraint enforces the range.';

COMMENT ON COLUMN dim_period.period_label IS
$$Human-readable label of the form 'YYYY QN' (e.g. '2024 Q3'). UNIQUE per
(year, quarter). Display this column to users; do not parse it for filtering —
filter on year and quarter directly.$$;

COMMENT ON COLUMN dim_period.is_full_quarter IS
$$True if the source treats this quarter as final/complete, false if provisional.
DVLA flags provisional quarters with a parenthetical suffix in the column header
(e.g. '2025 Q2 (P)'). The current dataset has no provisional quarters — all rows
are TRUE — but the column exists so future loads can mark them without schema
change. To exclude provisional data, filter `is_full_quarter = TRUE`.$$;

-- =============================================================================
-- fact_registrations
-- =============================================================================

CREATE TABLE IF NOT EXISTS fact_registrations (
    vehicle_id      INT NOT NULL REFERENCES dim_vehicle(vehicle_id),
    period_id       INT NOT NULL REFERENCES dim_period(period_id),
    licence_status  TEXT NOT NULL,
    count           INT NOT NULL CHECK (count >= 0),
    PRIMARY KEY (vehicle_id, period_id, licence_status)
);

COMMENT ON TABLE fact_registrations IS
$$Quarterly registration counts. Grain: number of vehicles of a given kind, in
a given quarter, in a given licence state.

The same vehicle_id can appear with both 'Licensed' and 'SORN' status in the
same quarter — they are different rows. Sum them for the total population of
that vehicle kind in that quarter (on-road + off-road).

NULL-equivalent values in the source (empty cells in the CSV) are SKIPPED at
ETL time — they are not stored as zero. Absence of a row means "no data for
that combination", not "zero vehicles".

Common queries:
  - Time series of one make:
      SELECT p.period_label, SUM(f.count)
      FROM fact_registrations f
      JOIN dim_vehicle v USING (vehicle_id)
      JOIN dim_period p USING (period_id)
      WHERE v.make = 'TOYOTA' AND f.licence_status = 'Licensed'
      GROUP BY p.period_label, p.year, p.quarter
      ORDER BY p.year, p.quarter;
  - Top makes by current licensed registrations:
      SELECT v.make, SUM(f.count) AS total
      FROM fact_registrations f JOIN dim_vehicle v USING (vehicle_id)
      WHERE f.licence_status = 'Licensed'
      GROUP BY v.make ORDER BY total DESC LIMIT 10;$$;

COMMENT ON COLUMN fact_registrations.vehicle_id IS
'FK → dim_vehicle.vehicle_id. Identifies which vehicle kind the count is for.';

COMMENT ON COLUMN fact_registrations.period_id IS
'FK → dim_period.period_id. Identifies which quarter the count is for.';

COMMENT ON COLUMN fact_registrations.licence_status IS
$$Vehicle licence state. Exactly one of:
  - 'Licensed' — vehicle is currently registered for road use
  - 'SORN'     — Statutory Off Road Notification (registered as off-road)

A single vehicle can move between these states across quarters. To count
"vehicles on the road" use `licence_status = 'Licensed'`. To count "all
registered vehicles" omit the filter and SUM across both statuses.$$;

COMMENT ON COLUMN fact_registrations.count IS
$$Number of vehicles of this kind in this licence state in this quarter.
INTEGER, always >= 0 (CHECK constraint). The original CSV has empty cells
for vehicle/quarter combinations that did not exist; those are skipped at
ETL time, not stored as zero.$$;

-- =============================================================================
-- v_schema_summary
-- =============================================================================

CREATE OR REPLACE VIEW v_schema_summary AS
SELECT
    'dim_vehicle'        AS object,
    -- Use pg_class.reltuples (planner estimate from ANALYZE) instead of
    -- COUNT(*) — exact counts on fact_registrations (~19.7M rows) routinely
    -- exceed the 10s readonly statement_timeout that demo connections set.
    (SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'dim_vehicle')   AS row_count,
    (SELECT COUNT(DISTINCT body_type) FROM dim_vehicle)::INT AS extra_distinct_a,
    'distinct body_types' AS extra_a_label,
    (SELECT COUNT(DISTINCT fuel) FROM dim_vehicle)::INT      AS extra_distinct_b,
    'distinct fuels'     AS extra_b_label
UNION ALL
SELECT
    'dim_period',
    (SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'dim_period'),
    (SELECT MIN(year) FROM dim_period)::INT,
    'earliest year',
    (SELECT MAX(year) FROM dim_period)::INT,
    'latest year'
UNION ALL
SELECT
    'fact_registrations',
    (SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'fact_registrations'),
    (SELECT COUNT(DISTINCT licence_status) FROM fact_registrations)::INT,
    'distinct licence_status',
    NULL,
    NULL;

COMMENT ON VIEW v_schema_summary IS
$$Quick smoke-test summary of every table. One row per object with row count
and a couple of dimension stats (label/value pairs to keep the schema flat).
Use SELECT * FROM v_schema_summary; as a one-liner sanity check after ETL.$$;

-- =============================================================================
-- Verification queries — run after ETL completes.
-- =============================================================================
--
-- 1. Row counts per table.
--
--    SELECT * FROM v_schema_summary;
--
--
-- 2. Distinct categorical values, with cardinality of the dim that contains them.
--
--    SELECT 'body_type'::TEXT AS column_name, body_type AS value, COUNT(*) AS cardinality
--    FROM dim_vehicle GROUP BY body_type
--    UNION ALL
--    SELECT 'fuel', fuel, COUNT(*) FROM dim_vehicle GROUP BY fuel
--    UNION ALL
--    SELECT 'licence_status', licence_status, COUNT(*)
--    FROM fact_registrations GROUP BY licence_status
--    ORDER BY column_name, value;
--
--
-- 3. Period coverage.
--
--    SELECT
--        MIN(period_label) AS earliest,
--        MAX(period_label) AS latest,
--        COUNT(*)         AS total_periods,
--        SUM(CASE WHEN is_full_quarter THEN 1 ELSE 0 END) AS full_quarter_count
--    FROM dim_period;
--
--
-- 4. Top 10 makes by total Licensed vehicles in the most recent loaded year.
--
--    SELECT v.make, SUM(f.count) AS total_licensed
--    FROM fact_registrations f
--    JOIN dim_vehicle v USING (vehicle_id)
--    JOIN dim_period  p USING (period_id)
--    WHERE f.licence_status = 'Licensed'
--      AND p.year = (SELECT MAX(year) FROM dim_period)
--    GROUP BY v.make
--    ORDER BY total_licensed DESC
--    LIMIT 10;
