// Unit tests for query-cache using Node 22's built-in test runner.
// Run: npm test  (node --import tsx/esm --test query-cache.test.ts)

import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSQL, createQueryCache } from "./query-cache.ts";

// ---------------------------------------------------------------------------
// normalizeSQL
// ---------------------------------------------------------------------------

test("normalizeSQL collapses internal whitespace", () => {
  assert.equal(
    normalizeSQL("SELECT  *\n  FROM\t dim_vehicle"),
    "select * from dim_vehicle"
  );
});

test("normalizeSQL lowercases all identifiers", () => {
  assert.equal(normalizeSQL("SELECT COUNT(*) FROM Dim_Vehicle"), "select count(*) from dim_vehicle");
});

test("normalizeSQL trims leading/trailing whitespace", () => {
  assert.equal(normalizeSQL("  select 1  "), "select 1");
});

// ---------------------------------------------------------------------------
// createQueryCache — get / set
// ---------------------------------------------------------------------------

test("cache miss returns undefined", () => {
  const cache = createQueryCache(10, 60_000);
  assert.equal(cache.get("SELECT 1"), undefined);
});

test("cache hit returns stored result", () => {
  const cache = createQueryCache(10, 60_000);
  const rows = [{ count: 5 }];
  cache.set("SELECT 1", { rows });
  assert.deepEqual(cache.get("SELECT 1"), { rows });
});

test("cache is normalised — whitespace-agnostic key", () => {
  const cache = createQueryCache(10, 60_000);
  const rows = [{ make: "Ford" }];
  cache.set("SELECT  *  FROM  dim_vehicle", { rows });
  // key with different spacing should match
  assert.deepEqual(cache.get("select * from dim_vehicle"), { rows });
});

test("cache is normalised — case-agnostic key", () => {
  const cache = createQueryCache(10, 60_000);
  const rows = [{ n: 1 }];
  cache.set("SELECT 1", { rows });
  assert.deepEqual(cache.get("select 1"), { rows });
});

test("distinct queries are cached independently", () => {
  const cache = createQueryCache(10, 60_000);
  cache.set("SELECT 1", { rows: [{ n: 1 }] });
  cache.set("SELECT 2", { rows: [{ n: 2 }] });
  assert.deepEqual(cache.get("SELECT 1"), { rows: [{ n: 1 }] });
  assert.deepEqual(cache.get("SELECT 2"), { rows: [{ n: 2 }] });
});

// ---------------------------------------------------------------------------
// createQueryCache — stats
// ---------------------------------------------------------------------------

test("stats.size reflects number of entries", () => {
  const cache = createQueryCache(50, 120_000);
  assert.equal(cache.stats().size, 0);
  cache.set("SELECT 1", { rows: [] });
  assert.equal(cache.stats().size, 1);
  cache.set("SELECT 2", { rows: [] });
  assert.equal(cache.stats().size, 2);
});

test("stats returns configured max and ttl", () => {
  const cache = createQueryCache(42, 99_000);
  const s = cache.stats();
  assert.equal(s.max, 42);
  assert.equal(s.ttl_ms, 99_000);
});

test("LRU eviction respects max", () => {
  const cache = createQueryCache(2, 60_000);
  cache.set("SELECT 1", { rows: [] });
  cache.set("SELECT 2", { rows: [] });
  cache.set("SELECT 3", { rows: [] }); // evicts SELECT 1 (LRU)
  assert.equal(cache.stats().size, 2);
  assert.equal(cache.get("SELECT 1"), undefined, "evicted entry should be gone");
});
