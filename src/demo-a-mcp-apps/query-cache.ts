/**
 * Thin LRU query cache for Demo A.
 *
 * Wraps `lru-cache` with a typed API and exposes a stats() helper for the
 * /cache-stats debug endpoint.
 *
 * Config env vars (read once at module load):
 *   CACHE_MAX  -- max entries          (default: 100)
 *   CACHE_TTL  -- TTL in ms            (default: 300_000 = 5 min)
 */

import { LRUCache } from "lru-cache";

export interface CacheEntry {
  rows: unknown[];
}

const CACHE_MAX = parseInt(process.env.CACHE_MAX ?? "100", 10);
const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? "300000", 10);

const cache = new LRUCache<string, CacheEntry>({
  max: CACHE_MAX,
  ttl: CACHE_TTL,
});

let hits = 0;
let misses = 0;

export const queryCache = {
  get(sql: string): CacheEntry | undefined {
    const hit = cache.get(sql);
    if (hit) { hits++; } else { misses++; }
    return hit;
  },

  set(sql: string, entry: CacheEntry): void {
    cache.set(sql, entry);
  },

  delete(sql: string): void {
    cache.delete(sql);
  },

  clear(): void {
    cache.clear();
    hits = 0;
    misses = 0;
  },

  stats() {
    return {
      size: cache.size,
      max: CACHE_MAX,
      ttl_ms: CACHE_TTL,
      hits,
      misses,
      hit_rate: hits + misses === 0 ? null : hits / (hits + misses),
    };
  },
} as const;
