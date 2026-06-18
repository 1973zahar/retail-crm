import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLiveReadRequest,
  getLiveReadEndpointRule,
  normalizeLimit,
  normalizeOffset,
  normalizePagedEnvelope,
  normalizeSearch,
  normalizeSort
} from "../src/domain/live-query-rules.mjs";

test("live endpoint rules clamp limits and offsets per endpoint", () => {
  const productsRule = getLiveReadEndpointRule("/api/live/products");
  const stockRule = getLiveReadEndpointRule("/api/live/stock-balances");

  assert.equal(normalizeLimit(undefined, productsRule), 20);
  assert.equal(normalizeLimit(10000, productsRule), 100);
  assert.equal(normalizeLimit(10000, stockRule), 5000);
  assert.equal(normalizeLimit(-5, productsRule), 20);
  assert.equal(normalizeOffset("25.9"), 25);
  assert.equal(normalizeOffset("-1"), 0);
});

test("live read requests keep only bounded allowlisted filters", () => {
  const request = buildLiveReadRequest("/api/live/stock-balances?ignored=true", {
    search: "  drill    bit  ",
    productCode: "02422",
    warehouseCode: "2",
    limit: "99999",
    offset: "10",
    sort: "availableQty",
    direction: "DESC",
    injected: "drop"
  });

  assert.equal(request.ok, true);
  assert.deepEqual(request.missingFilters, []);
  assert.deepEqual(request.query, {
    limit: 5000,
    offset: 10,
    productCode: "02422",
    warehouseCode: "2",
    search: "drill bit",
    sort: "availableQty",
    direction: "desc"
  });
});

test("serial stock requests require productCode", () => {
  const missing = buildLiveReadRequest("/api/live/serial-stock", {
    warehouseCode: "2",
    limit: "20"
  });
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.missingFilters, ["productCode"]);

  const ready = buildLiveReadRequest("/api/live/serial-stock", {
    productCode: "W-001",
    warehouseCode: "2",
    sort: "notAllowed"
  });
  assert.equal(ready.ok, true);
  assert.equal(ready.query.limit, 20);
  assert.equal(ready.query.offset, 0);
  assert.equal(ready.query.productCode, "W-001");
});

test("search and sort normalization use safe defaults", () => {
  assert.equal(normalizeSearch(" a   b  "), "a b");
  assert.equal(normalizeSearch("x".repeat(130)).length, 120);

  const counterpartiesRule = getLiveReadEndpointRule("/api/live/counterparties");
  assert.equal(normalizeSort("updatedAt", counterpartiesRule), "updatedAt");
  assert.equal(normalizeSort("drop table", counterpartiesRule), "name");
});

test("paged envelopes expose data and items aliases without full-load assumptions", () => {
  const envelope = normalizePagedEnvelope({
    rows: [{ id: 1 }, { id: 2 }],
    offset: 20,
    limit: 2,
    total: 25,
    source: "sql-api"
  });

  assert.deepEqual(envelope.data, [{ id: 1 }, { id: 2 }]);
  assert.equal(envelope.items, envelope.data);
  assert.equal(envelope.limit, 2);
  assert.equal(envelope.offset, 20);
  assert.equal(envelope.total, 25);
  assert.equal(envelope.hasMore, true);
  assert.equal(envelope.nextOffset, 22);
  assert.equal(envelope.source, "sql-api");
});
