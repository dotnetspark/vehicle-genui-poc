/**
 * Unit tests for query-cache.ts.
 * Run: node --import tsx/esm --test query-cache.test.ts
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { queryCache } from "./query-cache.ts";

const SQL1 = "SELECT 1 AS n";
const SQL2 = "SELECT 2 AS n";
const ENTRY1 = { rows: [{ n: 1 }] };
const ENTRY2 = { rows: [{ n: 2 }] };

describe("queryCache", () => {
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
