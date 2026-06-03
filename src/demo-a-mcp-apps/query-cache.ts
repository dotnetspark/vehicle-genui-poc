// LRU query cache for the `query_vehicles` tool.
//
// Runtime config (env vars):
//   CACHE_MAX — maximum number of entries (default: 100)
//   CACHE_TTL — time-to-live in milliseconds (default: 300000 = 5 min)

import { LRUCache } from "lru-cache";

export interface QueryResult {
  rows: unknown[];
}

export interface CacheStats {
  size: number;
  max: number;
  ttl_ms: number;
}

/** Collapse whitespace and lower-case SQL for a stable, normalised cache key. */
export function normalizeSQL(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

export function createQueryCache(max: number, ttlMs: number) {
  const cache = new LRUCache<string, QueryResult>({ max, ttl: ttlMs });

  return {
    get(sql: string): QueryResult | undefined {
      return cache.get(normalizeSQL(sql));
    },
    set(sql: string, result: QueryResult): void {
      cache.set(normalizeSQL(sql), result);
    },
    stats(): CacheStats {
      return { size: cache.size, max, ttl_ms: ttlMs };
    },
  };
}

const CACHE_MAX = Math.max(1, Number(process.env.CACHE_MAX) || 100);
const CACHE_TTL = Math.max(1_000, Number(process.env.CACHE_TTL) || 300_000);

/** Singleton — configured via CACHE_MAX / CACHE_TTL env vars at process start. */
export const queryCache = createQueryCache(CACHE_MAX, CACHE_TTL);
