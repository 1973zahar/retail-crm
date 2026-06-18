import {
  buildLiveReadRequest,
  normalizePagedEnvelope
} from "../domain/live-query-rules.mjs";

export const LIVE_READ_ROUTE_TARGETS = Object.freeze({
  "/api/products": routeTarget("/products", "Product"),
  "/api/live/products": routeTarget("/products", "Product"),
  "/api/live/product-prices": routeTarget("/one-c-mirror/product-prices", "ProductPrice"),
  "/api/live/counterparties": routeTarget("/one-c-mirror/counterparties", "Counterparty", {
    searchTargetPath: "/one-c-mirror/counterparty-balances",
    fallbackTargetPath: "/one-c-mirror/counterparties"
  }),
  "/api/live/warehouses": routeTarget("/one-c-mirror/warehouses", "Warehouse"),
  "/api/live/stock-balances": routeTarget("/one-c-mirror/stock-balances", "StockBalance"),
  "/api/live/serial-stock": routeTarget("/one-c-mirror/serial-stock", "SerialStock", {
    missingFilterCode: "SERIAL_PRODUCT_REQUIRED"
  })
});

export function resolveRetailLiveReadRoute(path, rawQuery = {}) {
  const request = buildLiveReadRequest(path, rawQuery);
  const target = LIVE_READ_ROUTE_TARGETS[request.path];
  if (!target) {
    return {
      ok: false,
      httpStatus: 404,
      code: "RETAIL_LIVE_ROUTE_NOT_FOUND",
      path: request.path
    };
  }

  if (!request.ok) {
    return {
      ok: false,
      httpStatus: 400,
      code: target.missingFilterCode || "RETAIL_LIVE_REQUIRED_FILTER_MISSING",
      path: request.path,
      targetPath: target.targetPath,
      model: target.model,
      missingFilters: request.missingFilters,
      query: request.query
    };
  }

  return {
    ok: true,
    httpStatus: 200,
    path: request.path,
    targetPath: resolveTargetPath(target, request.query),
    fallbackTargetPath: target.fallbackTargetPath || "",
    model: target.model,
    query: request.query,
    searchParams: toSearchParams(request.query),
    bounded: true
  };
}

export function normalizeRetailLiveReadPayload(route, payload = {}) {
  if (!route?.ok) {
    throw new Error("Cannot normalize payload for an unresolved live read route");
  }

  return {
    ...normalizePagedEnvelope(payload, route.query),
    model: route.model,
    source: payload.source || "crm-sql-live",
    sourceDetail: route.targetPath,
    bounded: true,
    fallback: false
  };
}

function resolveTargetPath(target, query) {
  if (target.searchTargetPath && String(query.search || "").trim()) {
    return target.searchTargetPath;
  }
  return target.targetPath;
}

function toSearchParams(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.set(key, String(value));
  }
  return params;
}

function routeTarget(targetPath, model, extras = {}) {
  return Object.freeze({
    targetPath,
    model,
    ...extras
  });
}
