-- src/demo-a-mcp-apps/setup-readonly-role.sql
-- Creates the `vehicles_readonly` Postgres role used by Demo A (and later Demo B)
-- to enforce read-only access at the DB layer. Apply once after Feature 001's
-- schema.sql has been applied.
--
-- Apply via:
--   docker compose exec -T db psql -U postgres -d vehicles < src/demo-a-mcp-apps/setup-readonly-role.sql
--
-- Idempotent — safe to re-run.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vehicles_readonly') THEN
        CREATE ROLE vehicles_readonly LOGIN PASSWORD 'readonly';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE vehicles TO vehicles_readonly;
GRANT USAGE ON SCHEMA public TO vehicles_readonly;

-- Allow-list, secure-by-default. We deliberately do NOT use
-- `GRANT SELECT ON ALL TABLES` or `ALTER DEFAULT PRIVILEGES`: a future
-- migration that adds an unrelated table (e.g., users, audit, secrets)
-- must require an explicit GRANT here before the LLM can read it. Revoke
-- both first to keep this script idempotent across upgrades from earlier
-- versions of this file that did use the blanket grants.
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM vehicles_readonly;
ALTER  DEFAULT PRIVILEGES IN SCHEMA public
       REVOKE SELECT ON TABLES FROM vehicles_readonly;

GRANT SELECT ON dim_vehicle, dim_period, fact_registrations,
                v_schema_summary
      TO vehicles_readonly;

-- Defence-in-depth on top of SELECT-only grants. The role is the SQL author for
-- both demos; the LLM composes arbitrary SQL at runtime. These two settings stop
-- a malicious or runaway query from (a) sneaking a write through a function call
-- or `SELECT ... FOR UPDATE`, and (b) hogging the database with a multi-hour
-- cartesian join. Both are role-scoped and idempotent.
ALTER ROLE vehicles_readonly SET default_transaction_read_only = on;
ALTER ROLE vehicles_readonly SET statement_timeout = '10s';
