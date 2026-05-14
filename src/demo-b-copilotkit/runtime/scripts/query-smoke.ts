import { queryVehicles, clearQueryCache } from "../src/actions/queryVehicles.js";
import { pool } from "../src/db/pool.js";

const SQL = `SELECT c.relname AS table_name
             FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relkind = 'r' AND n.nspname = 'public'
             ORDER BY c.relname`;

async function main() {
  clearQueryCache();
  const a = await queryVehicles({ sql: SQL });
  console.log("first call:", { cached: a.cached, rowCount: a.rows.length });
  const b = await queryVehicles({ sql: SQL });
  console.log("second call:", { cached: b.cached, rowCount: b.rows.length });
  if (a.cached !== false) throw new Error("first call should be cached=false");
  if (b.cached !== true) throw new Error("second call should be cached=true");
  console.log("✅ cache behaves correctly");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
