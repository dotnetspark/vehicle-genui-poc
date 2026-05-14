import { pool } from "../src/db/pool.js";

async function main() {
  const r = await pool.query("SELECT current_user AS user, current_database() AS db");
  console.log(r.rows[0]);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
