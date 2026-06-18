export const LIVE_READ_ENDPOINT_RULES = Object.freeze({
  "/api/products": endpointRule({
    defaultLimit: 20,
    maxLimit: 100,
    allowedFilters: ["search", "barcode", "limit", "offset"],
    defaultSort: "productName",
    allowedSorts: ["productName", "productCode", "sku"]
  }),
  "/api/live/products": endpointRule({
    defaultLimit: 20,
    maxLimit: 100,
    allowedFilters: ["search", "limit", "offset"],
    defaultSort: "productName",
    allowedSorts: ["productName", "productCode", "sku"]
  }),
  "/api/live/product-prices": endpointRule({
    defaultLimit: 20,
    maxLimit: 100,
    allowedFilters: ["search", "productCode", "limit", "offset"],
    defaultSort: "productName",
    allowedSorts: ["productName", "productCode", "priceType", "currency"]
  }),
  "/api/live/counterparties": endpointRule({
    defaultLimit: 20,
    maxLimit: 100,
    allowedFilters: ["search", "limit", "offset"],
    defaultSort: "name",
    allowedSorts: ["name", "counterpartyCode", "updatedAt"]
  }),
  "/api/live/warehouses": endpointRule({
    defaultLimit: 100,
    maxLimit: 100,
    allowedFilters: ["search", "limit", "offset"],
    defaultSort: "warehouseName",
    allowedSorts: ["warehouseName", "warehouseCode"]
  }),
  "/api/live/stock-balances": endpointRule({
    defaultLimit: 20,
    maxLimit: 5000,
    allowedFilters: ["productCode", "warehouseCode", "search", "sort", "direction", "limit", "offset"],
    defaultSort: "productName",
    allowedSorts: ["productName", "productCode", "warehouseName", "availableQty", "snapshotAt"]
  }),
  "/api/live/serial-stock": endpointRule({
    defaultLimit: 20,
    maxLimit: 100,
    requiredFilters: ["productCode"],
    allowedFilters: ["productCode", "warehouseCode", "limit", "offset"],
    defaultSort: "serialNumber",
    allowedSorts: ["serialNumber", "warehouseName", "availableQty"]
  })
});

export function getLiveReadEndpointRule(path) {
  const normalizedPath = normalizePath(path);
  const rule = LIVE_READ_ENDPOINT_RULES[normalizedPath];
  if (!rule) {
    throw new Error(`Unsupported live read endpoint: ${normalizedPath}`);
  }
  return rule;
}

export function normalizeLimit(value, rule = {}) {
  const defaultLimit = positiveInteger(rule.defaultLimit, 20);
  const maxLimit = positiveInteger(rule.maxLimit, defaultLimit);
  const candidate = positiveInteger(value, defaultLimit);
  return Math.min(maxLimit, Math.max(1, candidate));
}

export function normalizeOffset(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }
  return Math.floor(number);
}

export function normalizeSearch(value, maxLength = 120) {
  const cleaned = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "";
  }
  return cleaned.slice(0, Math.max(1, maxLength));
}

export function normalizeDirection(value) {
  return String(value ?? "").toLowerCase() === "desc" ? "desc" : "asc";
}

export function normalizeSort(value, rule = {}) {
  const allowedSorts = Array.isArray(rule.allowedSorts) ? rule.allowedSorts : [];
  const candidate = String(value ?? "").trim();
  if (allowedSorts.includes(candidate)) {
    return candidate;
  }
  return rule.defaultSort || allowedSorts[0] || "";
}

export function buildLiveReadRequest(path, rawQuery = {}) {
  const normalizedPath = normalizePath(path);
  const rule = getLiveReadEndpointRule(normalizedPath);
  const source = normalizeQuerySource(rawQuery);
  const query = {
    limit: normalizeLimit(source.limit, rule),
    offset: normalizeOffset(source.offset)
  };

  for (const filter of rule.allowedFilters) {
    if (filter === "limit" || filter === "offset" || filter === "sort" || filter === "direction") {
      continue;
    }

    const value = source[filter];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    query[filter] = filter === "search" ? normalizeSearch(value) : String(value).trim();
  }

  if (rule.allowedFilters.includes("sort")) {
    query.sort = normalizeSort(source.sort, rule);
  }

  if (rule.allowedFilters.includes("direction")) {
    query.direction = normalizeDirection(source.direction);
  }

  const missingFilters = rule.requiredFilters.filter((filter) => !query[filter]);

  return {
    path: normalizedPath,
    query,
    missingFilters,
    ok: missingFilters.length === 0
  };
}

export function normalizePagedEnvelope(payload = {}, request = {}) {
  const data = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.rows)
        ? payload.rows
        : [];
  const limit = normalizeLimit(payload.limit ?? request.limit, {
    defaultLimit: request.limit || data.length || 20,
    maxLimit: Math.max(request.limit || 0, data.length, 1)
  });
  const offset = normalizeOffset(payload.offset ?? request.offset);
  const total = Number.isFinite(Number(payload.total)) ? Number(payload.total) : undefined;
  const hasMore = typeof payload.hasMore === "boolean"
    ? payload.hasMore
    : total !== undefined
      ? offset + data.length < total
      : data.length >= limit;

  return {
    data,
    items: data,
    limit,
    offset,
    total,
    hasMore,
    nextOffset: hasMore ? offset + data.length : undefined,
    source: payload.source
  };
}

function endpointRule(rule) {
  return Object.freeze({
    defaultLimit: 20,
    maxLimit: 100,
    requiredFilters: [],
    allowedFilters: [],
    allowedSorts: [],
    defaultSort: "",
    ...rule,
    requiredFilters: Object.freeze(rule.requiredFilters || []),
    allowedFilters: Object.freeze(rule.allowedFilters || []),
    allowedSorts: Object.freeze(rule.allowedSorts || [])
  });
}

function normalizePath(path) {
  return String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
}

function normalizeQuerySource(rawQuery) {
  if (rawQuery instanceof URLSearchParams) {
    return Object.fromEntries(rawQuery.entries());
  }
  return rawQuery && typeof rawQuery === "object" ? rawQuery : {};
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return Math.floor(fallback);
  }
  return Math.floor(number);
}
