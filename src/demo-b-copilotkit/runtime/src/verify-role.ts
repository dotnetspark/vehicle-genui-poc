import { pool } from "./db/pool.js";

const EXPECTED_GRANTS = new Set([
  "dim_vehicle",
  "dim_period",
  "fact_registrations",
  "v_schema_summary",
]);

export async function verifyRoleHardening(): Promise<void> {
  const client = await pool.connect();
  try {
    const who = await client.query<{ user: string; db: string }>(
      "SELECT current_user AS user, current_database() AS db",
    );
    const { user, db } = who.rows[0];
    if (user !== "vehicles_readonly") {
      throw new Error(`expected role vehicles_readonly, got ${user}`);
    }

    const ro = await client.query<{ value: string }>(
      "SELECT current_setting('transaction_read_only') AS value",
    );
    if (ro.rows[0].value !== "on") {
      throw new Error("transaction_read_only is not 'on' for this role");
    }

    const timeout = await client.query<{ value: string }>(
      "SELECT current_setting('statement_timeout') AS value",
    );
    if (timeout.rows[0].value !== "10s" && timeout.rows[0].value !== "10000") {
      throw new Error(`statement_timeout is ${timeout.rows[0].value}, expected '10s'`);
    }

    const grants = await client.query<{ table_name: string; privilege_type: string }>(
      `SELECT table_name, privilege_type
       FROM information_schema.role_table_grants
       WHERE grantee = 'vehicles_readonly'
       ORDER BY table_name`,
    );
    const tables = new Set(grants.rows.map((r) => r.table_name));
    const nonSelect = grants.rows.filter((r) => r.privilege_type !== "SELECT");
    if (nonSelect.length > 0) {
      throw new Error(
        `role has non-SELECT privileges: ${nonSelect.map((r) => `${r.privilege_type} ${r.table_name}`).join(", ")}`,
      );
    }
    for (const t of EXPECTED_GRANTS) {
      if (!tables.has(t)) throw new Error(`missing SELECT on ${t}`);
    }
    const extras = [...tables].filter((t) => !EXPECTED_GRANTS.has(t));
    if (extras.length > 0) {
      console.warn(`[verify-role] WARNING: role has SELECT on unexpected tables: ${extras.join(", ")}`);
    }

    console.log(
      `[verify-role] role=${user} db=${db} read_only=on statement_timeout=${timeout.rows[0].value} grants=${grants.rows.length} ✅`,
    );
  } finally {
    client.release();
  }
}
