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
GRANT SELECT ON ALL TABLES IN SCHEMA public TO vehicles_readonly;

-- Ensure future tables (added by later schema migrations) are also readable.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO vehicles_readonly;
