import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeRetailLiveReadPayload,
  resolveRetailLiveReadRoute
} from "../src/api/live-read-routes.mjs";

test("live read routes resolve Retail paths to bounded SQL API targets", () => {
  const route = resolveRetailLiveReadRoute("/api/live/stock-balances", {
    warehouseCode: "2",
    limit: "50000",
    offset: "5",
    sort: "availableQty",
    direction: "DESC"
  });

  assert.equal(route.ok, true);
  assert.equal(route.httpStatus, 200);
  assert.equal(route.targetPath, "/one-c-mirror/stock-balances");
  assert.equal(route.model, "StockBalance");
  assert.equal(route.query.limit, 5000);
  assert.equal(route.query.offset, 5);
  assert.equal(route.query.sort, "availableQty");
  assert.equal(route.query.direction, "desc");
  assert.equal(route.searchParams.get("warehouseCode"), "2");
});

test("counterparty searches route through the balance read model with fallback metadata", () => {
  const route = resolveRetailLiveReadRoute("/api/live/counterparties", {
    search: " retail buyer "
  });

  assert.equal(route.ok, true);
  assert.equal(route.targetPath, "/one-c-mirror/counterparty-balances");
  assert.equal(route.fallbackTargetPath, "/one-c-mirror/counterparties");
  assert.equal(route.query.search, "retail buyer");
});

test("serial stock routes reject missing productCode before upstream calls", () => {
  const route = resolveRetailLiveReadRoute("/api/live/serial-stock", {
    warehouseCode: "2"
  });

  assert.equal(route.ok, false);
  assert.equal(route.httpStatus, 400);
  assert.equal(route.code, "SERIAL_PRODUCT_REQUIRED");
  assert.deepEqual(route.missingFilters, ["productCode"]);
});

test("live read payload normalization keeps canonical data/items envelope", () => {
  const route = resolveRetailLiveReadRoute("/api/live/products", {
    search: "optic",
    limit: 20
  });
  const envelope = normalizeRetailLiveReadPayload(route, {
    items: [{ productCode: "02422" }],
    total: 3,
    hasMore: true
  });

  assert.deepEqual(envelope.data, [{ productCode: "02422" }]);
  assert.equal(envelope.items, envelope.data);
  assert.equal(envelope.model, "Product");
  assert.equal(envelope.limit, 20);
  assert.equal(envelope.offset, 0);
  assert.equal(envelope.total, 3);
  assert.equal(envelope.hasMore, true);
  assert.equal(envelope.nextOffset, 1);
  assert.equal(envelope.sourceDetail, "/products");
  assert.equal(envelope.bounded, true);
  assert.equal(envelope.fallback, false);
});
