/**
 * Unit tests for query-cache.ts.
 * Run: node --import tsx/esm --test query-cache.test.ts
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { queryCache, createQueryCache } from "./query-cache.ts";

const SQL1 = "SELECT 1 AS n";
const SQL2 = "SELECT 2 AS n";
const ENTRY1 = { rows: [{ n: 1 }] };
const ENTRY2 = { rows: [{ n: 2 }] };

describe("queryCache (singleton)", () => {
  before(() => queryCache.clear());
  after(() => queryCache.clear());

  it("returns undefined for a cold key", () => {
    assert.equal(queryCache.get(SQL1), undefined);
  });

  it("stores and retrieves an entry", () => {
    queryCache.set(SQL1, ENTRY1);
    const hit = queryCache.get(SQL1);
    assert.deepEqual(hit, ENTRY1);
  });

  it("does not conflate different keys", () => {
    queryCache.set(SQL2, ENTRY2);
    assert.deepEqual(queryCache.get(SQL1), ENTRY1);
    assert.deepEqual(queryCache.get(SQL2), ENTRY2);
  });

  it("delete removes the entry", () => {
    queryCache.delete(SQL1);
    assert.equal(queryCache.get(SQL1), undefined);
  });

  it("clear empties the cache", () => {
    queryCache.set(SQL1, ENTRY1);
    queryCache.clear();
    assert.equal(queryCache.get(SQL1), undefined);
    assert.equal(queryCache.stats().size, 0);
  });

  it("stats.size reflects current entry count", () => {
    queryCache.clear();
    queryCache.set(SQL1, ENTRY1);
    queryCache.set(SQL2, ENTRY2);
    assert.equal(queryCache.stats().size, 2);
  });

  it("stats.max is the configured max", () => {
    const max = queryCache.stats().max;
    assert.equal(typeof max, "number");
    assert.ok(max > 0);
  });

  it("stats.ttl_ms is positive", () => {
    assert.ok(queryCache.stats().ttl_ms > 0);
  });

  it("stats.hits and misses increment correctly", () => {
    queryCache.clear();
    queryCache.get(SQL1); // miss
    queryCache.set(SQL1, ENTRY1);
    queryCache.get(SQL1); // hit
    const s = queryCache.stats();
    assert.equal(s.hits, 1);
    assert.equal(s.misses, 1);
  });

  it("stats.hit_rate is null when no calls yet", () => {
    queryCache.clear();
    assert.equal(queryCache.stats().hit_rate, null);
  });

  it("stats.hit_rate is 0.5 with equal hits and misses", () => {
    queryCache.clear();
    queryCache.get(SQL1); // miss
    queryCache.set(SQL1, ENTRY1);
    queryCache.get(SQL1); // hit
    const s = queryCache.stats();
    assert.equal(s.hit_rate, 0.5);
  });
});

// ---------------------------------------------------------------------------
// Key normalisation — the cache is key-exact; whitespace/case differences in
// the SQL string produce distinct entries (no normalisation is applied).
// ---------------------------------------------------------------------------

describe("queryCache key normalisation (createQueryCache)", () => {
  it("treats identical SQL strings as the same key", () => {
    const c = createQueryCache(10, 60_000);
    c.set(SQL1, ENTRY1);
    assert.deepEqual(c.get(SQL1), ENTRY1);
  });

  it("treats trailing-whitespace variant as a DIFFERENT key", () => {
    const c = createQueryCache(10, 60_000);
    c.set(SQL1, ENTRY1);
    // SQL1 with extra space is a different key — no normalisation applied.
    assert.equal(c.get(SQL1 + " "), undefined);
  });

  it("treats uppercase SQL as a DIFFERENT key", () => {
    const c = createQueryCache(10, 60_000);
    const lower = "select 1";
    const upper = "SELECT 1";
    c.set(lower, ENTRY1);
    assert.equal(c.get(upper), undefined);
  });

  it("repeated identical gets all return the same entry", () => {
    const c = createQueryCache(10, 60_000);
    c.set(SQL1, ENTRY1);
    for (let i = 0; i < 5; i++) {
      assert.deepEqual(c.get(SQL1), ENTRY1);
    }
    assert.equal(c.stats().hits, 5);
  });
});

// ---------------------------------------------------------------------------
// LRU eviction — oldest/least-recently-used entry is evicted when max is full.
// ---------------------------------------------------------------------------

describe("LRU eviction (createQueryCache max=3)", () => {
  it("does not evict when below capacity", () => {
    const c = createQueryCache(3, 60_000);
    c.set("q1", { rows: [1] });
    c.set("q2", { rows: [2] });
    c.set("q3", { rows: [3] });
    assert.ok(c.get("q1") !== undefined);
    assert.ok(c.get("q2") !== undefined);
    assert.ok(c.get("q3") !== undefined);
  });

  it("evicts the least-recently-used entry when capacity is exceeded", () => {
    const c = createQueryCache(3, 60_000);
    c.set("q1", { rows: [1] });
    c.set("q2", { rows: [2] });
    c.set("q3", { rows: [3] });
    // "q1" is now oldest — adding "q4" should evict it.
    c.set("q4", { rows: [4] });
    assert.equal(c.stats().size, 3);
    assert.equal(c.get("q1"), undefined, "q1 should have been evicted");
    assert.ok(c.get("q2") !== undefined);
    assert.ok(c.get("q3") !== undefined);
    assert.ok(c.get("q4") !== undefined);
  });

  it("touching an entry via get() saves it from eviction", () => {
    const c = createQueryCache(3, 60_000);
    c.set("q1", { rows: [1] });
    c.set("q2", { rows: [2] });
    c.set("q3", { rows: [3] });
    // Touch q1 so it becomes recently used; now q2 is the LRU.
    c.get("q1");
    c.set("q4", { rows: [4] });
    assert.ok(c.get("q1") !== undefined, "q1 was touched so it should survive");
    assert.equal(c.get("q2"), undefined, "q2 (LRU) should have been evicted");
  });

  it("size stays at max after repeated additions", () => {
    const c = createQueryCache(3, 60_000);
    for (let i = 0; i < 10; i++) {
      c.set(`q${i}`, { rows: [i] });
    }
    assert.equal(c.stats().size, 3);
  });

  it("clear resets size to 0 and stats counters", () => {
    const c = createQueryCache(3, 60_000);
    c.set("q1", { rows: [1] });
    c.get("q1"); // hit
    c.get("q9"); // miss
    c.clear();
    assert.equal(c.stats().size, 0);
    assert.equal(c.stats().hits, 0);
    assert.equal(c.stats().misses, 0);
    assert.equal(c.stats().hit_rate, null);
  });
});
