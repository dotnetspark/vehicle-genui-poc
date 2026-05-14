import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set; copy runtime/.env.example to runtime/.env and configure it.");
}

export const pool = new Pool({ connectionString, max: 10 });

pool.on("error", (err) => {
  console.error("[db] pool error", err);
});
