import { LRUCache } from "lru-cache";
import { pool } from "../db/pool.js";

const cache = new LRUCache<string, unknown[]>({
  max: 200,
  ttl: 1000 * 60 * 60,
});

export interface QueryVehiclesArgs {
  sql: string;
}

export interface QueryVehiclesResult {
  rows: unknown[];
  cached: boolean;
}

export async function queryVehicles({ sql }: QueryVehiclesArgs): Promise<QueryVehiclesResult> {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("sql must be a non-empty string");
  }
  const key = sql.trim();
  const hit = cache.get(key);
  if (hit) {
    return { rows: hit, cached: true };
  }
  const result = await pool.query(key);
  cache.set(key, result.rows);
  return { rows: result.rows, cached: false };
}

export function clearQueryCache(): void {
  cache.clear();
}
