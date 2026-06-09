import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_VERSION = "2026.06.09.11";
const APP_BUILD = "20260609-b2c-add-product-price-roles";
const APP_RELEASED_AT = "2026-06-09 22:14:23 +03:00";
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CRM_SQL_API_BASE_URL = String(process.env.CRM_SQL_API_BASE_URL || "http://192.168.0.166:3000").replace(/\/+$/, "");
const CRM_SQL_API_TIMEOUT_MS = Math.max(1000, Number(process.env.CRM_SQL_API_TIMEOUT_MS || 30000));
const NBU_EXCHANGE_RATES_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangenew?json";
const NBU_EXCHANGE_RATES_TIMEOUT_MS = Math.max(1000, Number(process.env.NBU_EXCHANGE_RATES_TIMEOUT_MS || 15000));
const NBU_EXCHANGE_RATES_CACHE_TTL_MS = Math.max(60000, Number(process.env.NBU_EXCHANGE_RATES_CACHE_TTL_MS || 21600000));

const DEFAULT_CONFIG = {
  host: "0.0.0.0",
  port: 8790,
  publicHost: "192.168.0.5",
  dataDir: "data",
  stateFile: "retail-crm-state.json",
  settingsFile: "retail-crm-settings.json"
};

const DEFAULT_SETTINGS = {
  mode: "server",
  publicHost: "192.168.0.5",
  publicBaseUrl: "http://192.168.0.5:8790",
  apiBaseUrl: "",
  bindAddress: "0.0.0.0",
  port: 8790,
  storageBackend: "server-json",
  dataDir: "data",
  crmSqlApiBaseUrl: CRM_SQL_API_BASE_URL,
  multiUser: true,
  externalAccess: true,
  allowLocalFallback: true,
  autoRefreshSeconds: 15,
  lastSavedAt: ""
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const cli = parseArgs(process.argv.slice(2));
const fileConfig = await readConfig(cli.config || "retail-crm.config.json");
const config = normalizeConfig({ ...DEFAULT_CONFIG, ...fileConfig, ...cli });
const dataDir = path.resolve(ROOT_DIR, config.dataDir);
const statePath = path.join(dataDir, config.stateFile);
const settingsPath = path.join(dataDir, config.settingsFile);
let exchangeRatesCache = { fetchedAt: 0, payload: null };

await fs.mkdir(dataDir, { recursive: true });

const server = http.createServer(async (request, response) => {
  try {
    addCommonHeaders(response);
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url || "/", publicBaseUrl());
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(url, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(config.port, config.host, () => {
  const publicUrl = publicBaseUrl();
  console.log(`B2C Retail CRM ${APP_BUILD}`);
  console.log(`Released:  ${APP_RELEASED_AT}`);
  console.log(`Listening: http://${config.host}:${config.port}`);
  console.log(`Public:    ${publicUrl}`);
  console.log(`Data dir:  ${dataDir}`);
});

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      result[toCamelCase(key)] = next;
      index += 1;
    } else {
      result[toCamelCase(key)] = true;
    }
  }
  return result;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

async function readConfig(configName) {
  const configPath = path.resolve(ROOT_DIR, configName);
  try {
    return JSON.parse(await fs.readFile(configPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function normalizeConfig(input) {
  const port = Number(process.env.RETAIL_CRM_PORT || input.port || DEFAULT_CONFIG.port);
  const host = String(process.env.RETAIL_CRM_HOST || input.host || DEFAULT_CONFIG.host);
  const publicHost = String(process.env.RETAIL_CRM_PUBLIC_HOST || input.publicHost || DEFAULT_CONFIG.publicHost);
  return {
    ...input,
    host,
    port,
    publicHost,
    dataDir: String(process.env.RETAIL_CRM_DATA_DIR || input.dataDir || DEFAULT_CONFIG.dataDir),
    stateFile: String(input.stateFile || DEFAULT_CONFIG.stateFile),
    settingsFile: String(input.settingsFile || DEFAULT_CONFIG.settingsFile)
  };
}

function publicBaseUrl() {
  const host = config.publicHost || config.host;
  const value = host.startsWith("http://") || host.startsWith("https://")
    ? host
    : `http://${host}:${config.port}`;
  return value.replace(/\/+$/, "");
}

function addCommonHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, healthPayload(stateContainer));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/live/products") {
    sendJson(response, 200, await listLiveProducts(url));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/live/product-prices") {
    sendJson(response, 200, await listLiveProductPrices(url));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/live/exchange-rates") {
    try {
      sendJson(response, 200, await listLiveExchangeRates(url));
    } catch (error) {
      sendJson(response, 502, {
        error: error.message || "NBU exchange rates unavailable",
        code: "NBU_EXCHANGE_RATES_UNAVAILABLE",
        source: "nbu",
        bounded: true
      });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/live/counterparties") {
    sendJson(response, 200, await listLiveCounterparties(url));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/live/warehouses") {
    sendJson(response, 200, await listLiveWarehouses(url));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/live/stock-balances") {
    try {
      sendJson(response, 200, await listLiveStockBalances(url));
    } catch (error) {
      sendJson(response, 502, {
        error: error.message || "CRM SQL stock API unavailable",
        code: "CRM_SQL_STOCK_UPSTREAM_UNAVAILABLE",
        source: "crm-sql-live",
        bounded: true
      });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/live/serial-stock") {
    if (!String(url.searchParams.get("productCode") || "").trim()) {
      sendJson(response, 400, {
        error: "productCode is required",
        code: "SERIAL_PRODUCT_REQUIRED",
        source: "crm-sql-live",
        bounded: true
      });
      return;
    }
    try {
      sendJson(response, 200, await listLiveSerialStock(url));
    } catch (error) {
      sendJson(response, 502, {
        error: error.message || "CRM SQL serial API unavailable",
        code: "CRM_SQL_SERIAL_UPSTREAM_UNAVAILABLE",
        source: "crm-sql-live",
        bounded: true
      });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/products") {
    try {
      sendJson(response, 200, await listLiveProducts(url));
    } catch (error) {
      const stateContainer = await readJson(statePath, defaultStateContainer());
      sendJson(response, 200, {
        ...listProducts(stateContainer, url),
        fallbackError: error.message || "CRM SQL API unavailable"
      });
    }
    return;
  }

  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  if (request.method === "GET" && productMatch) {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    const product = findProductById(stateContainer, decodeURIComponent(productMatch[1]));
    if (!product) {
      sendJson(response, 404, { error: "Product not found" });
      return;
    }
    sendJson(response, 200, liveApiEnvelope(stateContainer, { item: toPublicProduct(product, stateContainer.state) }));
    return;
  }

  if (request.method === "GET" && (url.pathname === "/api/customers" || url.pathname === "/api/clients")) {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, listCustomers(stateContainer, url));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/stock-balances") {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, listStockBalances(stateContainer, url));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/warehouses") {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, listWarehouses(stateContainer, url));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/bootstrap") {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    const settingsContainer = await readJson(settingsPath, defaultSettingsContainer());
    sendJson(response, 200, {
      ...healthPayload(stateContainer),
      settings: settingsContainer.settings,
      settingsRevision: settingsContainer.revision,
      state: stateContainer.state,
      stateRevision: stateContainer.revision,
      savedAt: stateContainer.savedAt
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/state") {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, stateContainer);
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/state") {
    const body = await readBody(request);
    if (!body || typeof body.state !== "object") {
      sendJson(response, 400, { error: "state object is required" });
      return;
    }
    const current = await readJson(statePath, defaultStateContainer());
    const conflict = Number(body.baseRevision ?? 0) < Number(current.revision || 0);
    const nextState = body.state;
    if (conflict && current.state?.employeeSessions && typeof current.state.employeeSessions === "object") {
      nextState.employeeSessions = current.state.employeeSessions;
    }
    const next = {
      revision: Number(current.revision || 0) + 1,
      savedAt: new Date().toISOString(),
      savedBy: String(body.savedBy || "system"),
      build: String(body.build || APP_BUILD),
      appVersion: String(body.appVersion || APP_VERSION),
      releasedAt: String(body.releasedAt || APP_RELEASED_AT),
      conflict,
      state: nextState
    };
    await writeJsonAtomic(statePath, next);
    sendJson(response, 200, next);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/settings") {
    const settingsContainer = await readJson(settingsPath, defaultSettingsContainer());
    sendJson(response, 200, settingsContainer);
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/settings") {
    const body = await readBody(request);
    if (!body || typeof body.settings !== "object") {
      sendJson(response, 400, { error: "settings object is required" });
      return;
    }
    const current = await readJson(settingsPath, defaultSettingsContainer());
    const settings = normalizeSettings(body.settings);
    const next = {
      revision: Number(current.revision || 0) + 1,
      savedAt: new Date().toISOString(),
      savedBy: String(body.savedBy || "system"),
      build: String(body.build || APP_BUILD),
      releasedAt: String(body.releasedAt || APP_RELEASED_AT),
      settings
    };
    await writeJsonAtomic(settingsPath, next);
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, { ...next, stateRevision: stateContainer.revision });
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

function liveApiEnvelope(stateContainer, payload = {}) {
  const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload.items) ? payload.items : []);
  const limit = Number(payload.limit || data.length || 0);
  const offset = Number(payload.offset || 0);
  const total = Number(payload.total ?? data.length);
  const explicitHasMore = typeof payload.hasMore === "boolean" ? payload.hasMore : null;
  const hasMore = explicitHasMore ?? (limit > 0 && data.length >= limit);
  const nextOffset = payload.nextOffset ?? (hasMore ? offset + limit : null);
  return {
    ...payload,
    data,
    items: Array.isArray(payload.items) ? payload.items : data,
    limit,
    offset,
    total,
    hasMore,
    nextOffset,
    totalExact: typeof payload.totalExact === "boolean" ? payload.totalExact : false,
    source: "server-json-fallback",
    sourceDetail: "retail-crm-state.json; target production source is PostgreSQL crm_hub through backend model layer",
    bounded: true,
    fallback: true,
    productionReady: false,
    revision: Number(stateContainer.revision || 0),
    savedAt: stateContainer.savedAt || ""
  };
}

function boundedParams(url, defaultLimit = 20, maxLimit = 100) {
  const rawLimit = Number(url.searchParams.get("limit") || defaultLimit);
  const rawOffset = Number(url.searchParams.get("offset") || 0);
  return {
    limit: Math.max(1, Math.min(maxLimit, Number.isFinite(rawLimit) ? rawLimit : defaultLimit)),
    offset: Math.max(0, Number.isFinite(rawOffset) ? rawOffset : 0)
  };
}

function stateArray(stateContainer, key) {
  const value = stateContainer.state?.[key];
  return Array.isArray(value) ? value : [];
}

function normalizedText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function scanTokens(value) {
  const raw = normalizedText(value);
  const tokens = new Set();
  if (!raw) return tokens;
  tokens.add(raw);
  raw.split(/[|;&\n\r\t ?]+/).forEach((part) => {
    const clean = part.trim();
    if (!clean) return;
    tokens.add(clean);
    const pair = clean.split(/[=:]/);
    if (pair.length > 1 && pair[1]) tokens.add(pair.slice(1).join("=").trim());
  });
  return tokens;
}

function productScanTargets(product) {
  return [product.sku, product.productCode, product.barcode, product.qr, product.sqlId, product.id]
    .map(normalizedText)
    .filter(Boolean);
}

function productMatches(product, search, barcode) {
  const barcodeQuery = normalizedText(barcode);
  if (barcodeQuery) {
    const barcodeTokens = scanTokens(barcodeQuery);
    return productScanTargets(product).some((target) => barcodeTokens.has(target) || barcodeQuery.includes(target));
  }
  const raw = normalizedText(search);
  if (!raw) return true;
  const tokens = scanTokens(raw);
  const haystack = normalizedText([
    product.name,
    product.sku,
    product.productCode,
    product.barcode,
    product.qr,
    product.sqlId,
    product.productGroupPath,
    product.productFullPath,
    product.category,
    product.productKind,
    product.productSeries,
    product.productGroup
  ].join(" "));
  if (haystack.includes(raw)) return true;
  return productScanTargets(product).some((target) => tokens.has(target) || raw.includes(target));
}

function customerMatches(customer, search) {
  const raw = normalizedText(search);
  if (!raw) return true;
  return normalizedText([
    customer.name,
    customer.phone,
    customer.email,
    customer.id,
    customer.sqlId,
    customer.counterpartyCode
  ].join(" ")).includes(raw);
}

function productStockSummary(productId, state) {
  const rows = Array.isArray(state?.stock) ? state.stock.filter((row) => row.productId === productId) : [];
  return {
    retailStockQty: rows
      .filter((row) => row.warehouseCode ? String(row.warehouseCode) === "2" : true)
      .reduce((sum, row) => sum + Number(row.qty || 0), 0),
    stockTotalQty: rows.reduce((sum, row) => sum + Number(row.qty || 0), 0),
    stockWholesaleQty: rows
      .filter((row) => String(row.warehouseName || "").toLowerCase().includes("гурт"))
      .reduce((sum, row) => sum + Number(row.qty || 0), 0)
  };
}

function toPublicProduct(product, state) {
  const stock = productStockSummary(product.id, state);
  return {
    id: product.id || "",
    sqlId: product.sqlId || "",
    productCode: product.productCode || product.sku || "",
    sku: product.sku || product.productCode || "",
    name: product.name || "",
    barcode: product.barcode || "",
    qr: product.qr || "",
    category: product.category || "",
    categoryPrimary: product.categoryPrimary || product.category || "",
    productGroupPath: product.productGroupPath || "",
    productFullPath: product.productFullPath || "",
    productGroupCodePath: product.productGroupCodePath || "",
    productGroupLevel: Number(product.productGroupLevel || 0),
    productKind: product.productKind || "",
    productSeries: product.productSeries || "",
    productGroup: product.productGroup || "",
    characteristics: Array.isArray(product.characteristics) ? product.characteristics : [],
    price: Number(product.price || 0),
    cost: Number(product.cost || 0),
    priceSummary: product.priceSummary || "",
    priceTypes: product.priceTypes || "",
    priceCurrencies: product.priceCurrencies || "",
    prices: Array.isArray(product.prices) ? product.prices : [],
    minStock: Number(product.minStock || 0),
    source: product.source || "sql",
    ...stock
  };
}

function findProductById(stateContainer, id) {
  const raw = normalizedText(id);
  return stateArray(stateContainer, "products").find((product) => (
    [product.id, product.sqlId, product.productCode, product.sku, product.barcode]
      .map(normalizedText)
      .includes(raw)
  ));
}

function listProducts(stateContainer, url) {
  const { limit, offset } = boundedParams(url, 20, 100);
  const search = url.searchParams.get("search") || "";
  const barcode = url.searchParams.get("barcode") || "";
  const rows = stateArray(stateContainer, "products")
    .filter((product) => productMatches(product, search, barcode))
    .map((product) => toPublicProduct(product, stateContainer.state));
  const items = rows.slice(offset, offset + limit);
  return liveApiEnvelope(stateContainer, {
    items,
    total: rows.length,
    limit,
    offset,
    query: { search, barcode }
  });
}

function toPublicCustomer(customer) {
  return {
    id: customer.id || "",
    sqlId: customer.sqlId || "",
    counterpartyCode: customer.counterpartyCode || "",
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    loyalty: customer.loyalty || "standard",
    balance: Number(customer.balance || 0),
    balanceCurrency: customer.balanceCurrency || "UAH",
    source: customer.source || "sql",
    exportStatus: customer.exportStatus || ""
  };
}

function listCustomers(stateContainer, url) {
  const { limit, offset } = boundedParams(url, 20, 100);
  const search = url.searchParams.get("search") || "";
  const rows = stateArray(stateContainer, "customers")
    .filter((customer) => customerMatches(customer, search))
    .map(toPublicCustomer);
  return liveApiEnvelope(stateContainer, {
    items: rows.slice(offset, offset + limit),
    total: rows.length,
    limit,
    offset,
    query: { search }
  });
}

function listStockBalances(stateContainer, url) {
  const { limit, offset } = boundedParams(url, 50, 100);
  const search = url.searchParams.get("search") || "";
  const productId = normalizedText(url.searchParams.get("productId") || "");
  const warehouseId = normalizedText(url.searchParams.get("warehouseId") || url.searchParams.get("warehouseCode") || "");
  const productsById = new Map(stateArray(stateContainer, "products").map((product) => [product.id, product]));
  const rows = stateArray(stateContainer, "stock").filter((row) => {
    if (productId && normalizedText(row.productId) !== productId && normalizedText(row.productCode) !== productId) return false;
    if (warehouseId && normalizedText(row.warehouseCode) !== warehouseId && normalizedText(row.warehouseName) !== warehouseId) return false;
    if (!search) return true;
    const product = productsById.get(row.productId) || {};
    return normalizedText([
      row.productId,
      row.productCode,
      row.warehouseCode,
      row.warehouseName,
      product.name,
      product.sku,
      product.productCode
    ].join(" ")).includes(normalizedText(search));
  }).map((row) => {
    const product = productsById.get(row.productId) || {};
    return {
      productId: row.productId || "",
      productCode: row.productCode || product.productCode || product.sku || "",
      productName: product.name || "",
      warehouseCode: row.warehouseCode || "",
      warehouseName: row.warehouseName || "",
      qty: Number(row.qty || 0),
      reservedQty: Number(row.reservedQty || 0)
    };
  });
  return liveApiEnvelope(stateContainer, {
    items: rows.slice(offset, offset + limit),
    total: rows.length,
    limit,
    offset,
    query: { search, productId, warehouseId }
  });
}

function listWarehouses(stateContainer, url) {
  const { limit, offset } = boundedParams(url, 100, 100);
  const search = normalizedText(url.searchParams.get("search") || "");
  const map = new Map();
  stateArray(stateContainer, "stock").forEach((row) => {
    const code = String(row.warehouseCode || "");
    const name = String(row.warehouseName || "");
    const key = code || name;
    if (!key) return;
    if (search && !normalizedText(`${code} ${name}`).includes(search)) return;
    if (!map.has(key)) map.set(key, { warehouseCode: code, warehouseName: name });
  });
  const rows = Array.from(map.values());
  return liveApiEnvelope(stateContainer, {
    items: rows.slice(offset, offset + limit),
    total: rows.length,
    limit,
    offset,
    query: { search }
  });
}

async function fetchCrmSql(pathName, params) {
  const query = params ? params.toString() : "";
  const url = `${CRM_SQL_API_BASE_URL}${pathName}${query ? `?${query}` : ""}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CRM_SQL_API_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || payload.message || `CRM SQL API ${response.status}`);
    }
    return { payload, url };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeNbuExchangeRate(row) {
  const numericCode = textValue(row.r030, row.numericCode, row.numeric_code);
  const currency = textValue(row.cc, row.currency).toUpperCase();
  const rate = numberValue(row.rate);
  if (!numericCode || !currency || !rate) return null;
  return {
    currency,
    numericCode,
    rate,
    name: textValue(row.txt, row.name),
    exchangedate: textValue(row.exchangedate, row.exchangeDate, row.exchange_date),
    source: "nbu"
  };
}

async function fetchNbuExchangeRates(force = false) {
  const now = Date.now();
  if (!force && exchangeRatesCache.payload && now - exchangeRatesCache.fetchedAt < NBU_EXCHANGE_RATES_CACHE_TTL_MS) {
    return exchangeRatesCache.payload;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NBU_EXCHANGE_RATES_TIMEOUT_MS);
  try {
    const response = await fetch(NBU_EXCHANGE_RATES_URL, { signal: controller.signal });
    const rows = await response.json().catch(() => []);
    if (!response.ok) throw new Error(`NBU API ${response.status}`);
    if (!Array.isArray(rows)) throw new Error("NBU API returned invalid exchange-rate payload");
    const rates = rows.map(normalizeNbuExchangeRate).filter(Boolean);
    const exchangedate = rates[0]?.exchangedate || new Date().toLocaleDateString("uk-UA");
    const items = [
      { currency: "UAH", numericCode: "980", rate: 1, name: "Українська гривня", exchangedate, source: "base-uah" },
      ...rates
    ];
    const payload = {
      data: items,
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
      hasMore: false,
      nextOffset: null,
      totalExact: true,
      source: "nbu",
      sourceDetail: NBU_EXCHANGE_RATES_URL,
      bounded: true,
      fallback: false,
      productionReady: true,
      loadedAt: new Date().toISOString(),
      cacheTtlMs: NBU_EXCHANGE_RATES_CACHE_TTL_MS
    };
    exchangeRatesCache = { fetchedAt: now, payload };
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function listLiveExchangeRates(url) {
  const force = ["1", "true", "yes"].includes(String(url.searchParams.get("force") || "").toLowerCase());
  const currency = String(url.searchParams.get("currency") || url.searchParams.get("valcode") || "").trim().toUpperCase();
  const search = String(url.searchParams.get("search") || "").trim().toUpperCase();
  const payload = await fetchNbuExchangeRates(force);
  const items = payload.items.filter((item) => {
    if (currency && item.currency !== currency && item.numericCode !== currency) return false;
    if (search) {
      const haystack = `${item.currency} ${item.numericCode} ${item.name}`.toUpperCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  return {
    ...payload,
    data: items,
    items,
    total: items.length,
    limit: items.length,
    query: { currency, search }
  };
}

function liveQuery(url, defaultLimit = 20, maxLimit = 100, filterNames = []) {
  const { limit, offset } = boundedParams(url, defaultLimit, maxLimit);
  const search = String(url.searchParams.get("search") || "").trim();
  const barcode = String(url.searchParams.get("barcode") || "").trim();
  const filters = {};
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (barcode) {
    params.set("barcode", barcode);
    if (!search) params.set("search", barcode);
  }
  filterNames.forEach((name) => {
    const value = String(url.searchParams.get(name) || "").trim();
    if (!value) return;
    filters[name] = value;
    params.set(name, value);
  });
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  return { params, limit, offset, search, barcode, filters };
}

function payloadItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.content?.items)) return payload.content.items;
  return [];
}

function payloadTotalInfo(payload, items, query) {
  const value = payload?.total ?? payload?.meta?.total ?? payload?.pagination?.total;
  const total = Number(value);
  const exact = Number.isFinite(total);
  return {
    total: exact ? total : query.offset + items.length,
    exact
  };
}

function payloadBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return null;
}

function textValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function numberValue(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}

function sqlEnvelope(pathName, url, query, items, payload) {
  const { total, exact } = payloadTotalInfo(payload, items, query);
  const explicitHasMore = payloadBoolean(payload?.hasMore, payload?.pagination?.hasMore, payload?.meta?.hasMore);
  const limit = query.limit;
  const offset = query.offset;
  const pageLooksFull = items.length >= limit;
  const hasMore = explicitHasMore ?? (exact && !pageLooksFull ? offset + items.length < total : pageLooksFull);
  const rawNextOffset = payload?.nextOffset ?? payload?.pagination?.nextOffset ?? payload?.meta?.nextOffset;
  const parsedNextOffset = Number(rawNextOffset);
  const nextOffset = Number.isFinite(parsedNextOffset) ? parsedNextOffset : (hasMore ? offset + limit : null);
  return {
    data: items,
    items,
    total,
    limit,
    offset,
    hasMore,
    nextOffset,
    totalExact: exact,
    query: { search: query.search, barcode: query.barcode, ...(query.filters || {}) },
    source: "crm-sql-live",
    sourceDetail: `${CRM_SQL_API_BASE_URL}${pathName}`,
    bounded: true,
    fallback: false,
    productionReady: true,
    loadedAt: new Date().toISOString()
  };
}

function normalizeLiveProduct(row) {
  const productCode = textValue(row.productCode, row.product_code, row.sku, row.code);
  const id = textValue(row.id, productCode, row.oneCRef, row.one_c_ref, row.barcode);
  const price = numberValue(row.latestPrice, row.latest_price, row.price, row.amount);
  const currency = textValue(row.latestPriceCurrency, row.latest_price_currency, row.currency, "UAH");
  const priceType = textValue(row.latestPriceType, row.latest_price_type, row.priceTypeName, row.price_type_name);
  return {
    id,
    sqlId: textValue(row.oneCRef, row.one_c_ref, row.externalId, row.external_id, row.id),
    productCode,
    sku: textValue(row.sku, productCode),
    barcode: textValue(row.barcode, row.bar_code),
    qr: textValue(row.qr),
    name: textValue(row.name, row.productName, row.product_name, row.description, "Товар з SQL"),
    category: textValue(row.category, row.categoryName, row.category_name, row.productGroupName, row.product_group_name, "Інше"),
    categoryPrimary: textValue(row.categoryPrimary, row.category_primary, row.category, row.categoryName, "Інше"),
    categorySecondary: textValue(row.categorySecondary, row.category_secondary),
    supplyChannel: textValue(row.supplyChannel, row.supply_channel),
    importer: textValue(row.importer),
    isSparePart: Boolean(row.isSparePart ?? row.is_spare_part),
    productGroupPath: textValue(row.productGroupPath, row.product_group_path, row.categoryPath),
    productFullPath: textValue(row.productFullPath, row.product_full_path, row.productGroupPath, row.product_group_path),
    productGroupCodePath: textValue(row.productGroupCodePath, row.product_group_code_path),
    productGroupLevel: numberValue(row.productGroupLevel, row.product_group_level),
    productKind: textValue(row.productKind, row.product_kind),
    productSeries: textValue(row.productSeries, row.product_series),
    productGroup: textValue(row.productGroup, row.product_group, row.productGroupName, row.product_group_name),
    characteristics: Array.isArray(row.characteristics) ? row.characteristics : [],
    price,
    cost: numberValue(row.cost),
    priceSummary: price ? `${price} ${currency}` : "",
    priceTypes: priceType,
    priceCurrencies: currency,
    prices: price ? [{ priceType, currency, price }] : [],
    minStock: numberValue(row.minStock, row.min_stock),
    retailStockQty: numberValue(row.availableQuantity, row.available_quantity, row.stockOnRetailWarehouse, row.stock_on_retail_warehouse),
    stockTotalQty: numberValue(row.totalQuantity, row.total_quantity, row.stockTotalAllWarehouses, row.stock_total_all_warehouses),
    stockWholesaleQty: numberValue(row.stockOnOtherWarehouses, row.stock_on_other_warehouses),
    source: "crm-sql-live"
  };
}

function normalizeLivePrice(row) {
  return {
    id: textValue(row.id, row.productCode, row.product_code, row.productName, row.product_name),
    productCode: textValue(row.productCode, row.product_code, row.sku),
    productName: textValue(row.productName, row.product_name, row.name),
    priceTypeCode: textValue(row.priceTypeCode, row.price_type_code),
    priceTypeName: textValue(row.priceTypeName, row.price_type_name, row.priceType, row.price_type),
    currency: textValue(row.currency, "UAH"),
    amount: numberValue(row.amount, row.price),
    price: numberValue(row.price, row.amount),
    snapshotAt: textValue(row.snapshotAt, row.snapshot_at, row.importedAt, row.imported_at),
    sourceFile: textValue(row.sourceFile, row.source_file),
    importedAt: textValue(row.importedAt, row.imported_at),
    source: "crm-sql-live"
  };
}

function normalizeLiveCounterparty(row) {
  const counterpartyCode = textValue(row.counterpartyCode, row.counterparty_code, row.externalId, row.external_id);
  return {
    id: textValue(row.id, counterpartyCode, row.oneCRef, row.one_c_ref),
    sqlId: textValue(row.oneCRef, row.one_c_ref, row.externalId, row.external_id),
    counterpartyCode,
    name: textValue(row.name, row.fullName, row.full_name, row.counterpartyName, row.counterparty_name, "Контрагент SQL"),
    fullName: textValue(row.fullName, row.full_name, row.counterpartyName, row.counterparty_name, row.name),
    phone: textValue(row.phone),
    email: textValue(row.email),
    taxId: textValue(row.taxId, row.tax_id),
    sourceModule: textValue(row.sourceModule, row.source_module),
    sourceFile: textValue(row.sourceFile, row.source_file),
    importedAt: textValue(row.importedAt, row.imported_at),
    isDeleted: Boolean(row.isDeleted ?? row.is_deleted),
    source: "crm-sql-live"
  };
}

function uniqueLiveCounterparties(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = textValue(item.counterpartyCode, item.id, item.sqlId, item.name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function liveCounterpartyMatchesSearch(item, search) {
  const query = String(search || "").trim().toLowerCase();
  if (!query) return true;
  return [
    item.counterpartyCode,
    item.id,
    item.sqlId,
    item.name,
    item.fullName,
    item.phone,
    item.email,
    item.taxId
  ].some((value) => String(value || "").toLowerCase().includes(query));
}

function normalizeLiveWarehouse(row) {
  const warehouseCode = textValue(row.warehouseCode, row.warehouse_code, row.code, row.id);
  return {
    id: textValue(row.id, row.warehouseCode, row.warehouse_code, row.code, warehouseCode),
    warehouseCode,
    warehouseName: textValue(row.warehouseName, row.warehouse_name, row.name, "Склад SQL"),
    sourceFile: textValue(row.sourceFile, row.source_file),
    importedAt: textValue(row.importedAt, row.imported_at),
    source: "crm-sql-live"
  };
}

function normalizeLiveStockBalance(row) {
  const productCode = textValue(row.productCode, row.product_code, row.sku);
  const warehouseCode = textValue(row.warehouseCode, row.warehouse_code, row.warehouseId, row.warehouse_id);
  const qty = numberValue(
    row.availableQty,
    row.available_qty,
    row.availableQuantity,
    row.available_quantity,
    row.qty,
    row.quantity,
    row.balance
  );
  return {
    id: textValue(row.id, `${productCode}:${warehouseCode}`),
    productId: textValue(row.productId, row.product_id, productCode),
    productCode,
    sku: textValue(row.sku, productCode),
    productName: textValue(row.productName, row.product_name, row.name),
    warehouseId: textValue(row.warehouseId, row.warehouse_id, warehouseCode),
    warehouseCode,
    warehouseName: textValue(row.warehouseName, row.warehouse_name, row.warehouse, "Склад"),
    qty,
    quantity: numberValue(row.quantity, row.qty, qty),
    availableQty: qty,
    reservedQty: numberValue(row.reservedQty, row.reserved_qty, row.reservedQuantity, row.reserved_quantity),
    snapshotAt: textValue(row.snapshotAt, row.snapshot_at, row.importedAt, row.imported_at),
    sourceFile: textValue(row.sourceFile, row.source_file),
    importedAt: textValue(row.importedAt, row.imported_at),
    source: "crm-sql-live"
  };
}

function normalizeLiveSerialStock(row) {
  const productCode = textValue(row.productCode, row.product_code, row.sku);
  const warehouseCode = textValue(row.warehouseCode, row.warehouse_code, row.warehouseId, row.warehouse_id);
  const serialName = textValue(row.serialName, row.serial_name, row.serialNumber, row.serial_number, row.serial, row.name);
  const quantity = numberValue(row.availableQty, row.available_qty, row.quantity, row.qty, row.balance);
  return {
    id: textValue(row.id, `${productCode}:${warehouseCode}:${serialName}`),
    productId: textValue(row.productId, row.product_id, productCode),
    productCode,
    sku: textValue(row.sku, productCode),
    productName: textValue(row.productName, row.product_name, row.name),
    warehouseId: textValue(row.warehouseId, row.warehouse_id, warehouseCode),
    warehouseCode,
    warehouseName: textValue(row.warehouseName, row.warehouse_name, row.warehouse, "Склад"),
    serialName,
    serialNumber: textValue(row.serialNumber, row.serial_number, serialName),
    quantity,
    availableQty: quantity,
    balanceSign: textValue(row.balanceSign, row.balance_sign, quantity > 0 ? "positive" : quantity < 0 ? "negative" : "zero"),
    snapshotAt: textValue(row.snapshotAt, row.snapshot_at, row.importedAt, row.imported_at),
    sourceFile: textValue(row.sourceFile, row.source_file),
    importedAt: textValue(row.importedAt, row.imported_at),
    source: "crm-sql-live"
  };
}

async function listLiveProducts(url) {
  const query = liveQuery(url, 20, 100);
  const pathName = "/products";
  const { payload } = await fetchCrmSql(pathName, query.params);
  const items = payloadItems(payload).map(normalizeLiveProduct);
  return sqlEnvelope(pathName, url, query, items, payload);
}

async function listLiveProductPrices(url) {
  const query = liveQuery(url, 20, 100, ["productCode"]);
  const pathName = "/one-c-mirror/product-prices";
  const { payload } = await fetchCrmSql(pathName, query.params);
  const productCode = String(query.filters.productCode || "").trim().toLowerCase();
  const items = payloadItems(payload)
    .map(normalizeLivePrice)
    .filter((item) => !productCode || String(item.productCode || "").trim().toLowerCase() === productCode);
  return sqlEnvelope(pathName, url, query, items, payload);
}

async function listLiveCounterparties(url) {
  const query = liveQuery(url, 20, 100);
  const hasSearch = Boolean(String(query.search || "").trim());
  const pathName = hasSearch ? "/one-c-mirror/counterparty-balances" : "/one-c-mirror/counterparties";
  const { payload } = await fetchCrmSql(pathName, query.params);
  const balanceItems = uniqueLiveCounterparties(payloadItems(payload).map(normalizeLiveCounterparty));
  let items = balanceItems;
  if (hasSearch && balanceItems.length <= 1) {
    const fallbackParams = new URLSearchParams(query.params);
    fallbackParams.set("limit", "100");
    fallbackParams.set("offset", "0");
    const { payload: fallbackPayload } = await fetchCrmSql("/one-c-mirror/counterparties", fallbackParams);
    const fallbackItems = payloadItems(fallbackPayload)
      .map(normalizeLiveCounterparty)
      .filter((item) => liveCounterpartyMatchesSearch(item, query.search));
    items = uniqueLiveCounterparties([...balanceItems, ...fallbackItems]).slice(0, query.limit);
  }
  const envelopePayload = hasSearch
    ? { ...payload, total: items.length, hasMore: false, nextOffset: null }
    : payload;
  return sqlEnvelope(pathName, url, query, items, envelopePayload);
}

async function listLiveWarehouses(url) {
  const query = liveQuery(url, 20, 100);
  const pathName = "/one-c-mirror/warehouses";
  const { payload } = await fetchCrmSql(pathName, query.params);
  const items = payloadItems(payload).map(normalizeLiveWarehouse);
  return sqlEnvelope(pathName, url, query, items, payload);
}

async function listLiveStockBalances(url) {
  const query = liveQuery(url, 20, 100, ["productCode", "warehouseCode"]);
  const pathName = "/one-c-mirror/stock-balances";
  const { payload } = await fetchCrmSql(pathName, query.params);
  const items = payloadItems(payload).map(normalizeLiveStockBalance);
  return sqlEnvelope(pathName, url, query, items, payload);
}

async function listLiveSerialStock(url) {
  const query = liveQuery(url, 20, 100, ["productCode", "warehouseCode"]);
  const pathName = "/one-c-mirror/serial-stock";
  const { payload } = await fetchCrmSql(pathName, query.params);
  const items = payloadItems(payload).map(normalizeLiveSerialStock);
  return sqlEnvelope(pathName, url, query, items, payload);
}

function healthPayload(stateContainer) {
  return {
    ok: true,
    appVersion: APP_VERSION,
    build: APP_BUILD,
    releasedAt: APP_RELEASED_AT,
    mode: "server",
    host: config.host,
    publicHost: config.publicHost,
    publicBaseUrl: publicBaseUrl(),
    crmSqlApiBaseUrl: CRM_SQL_API_BASE_URL,
    port: config.port,
    dataDir,
    revision: stateContainer.revision,
    savedAt: stateContainer.savedAt || ""
  };
}

function defaultStateContainer() {
  return {
    revision: 0,
    savedAt: "",
    savedBy: "",
    build: APP_BUILD,
    appVersion: APP_VERSION,
    releasedAt: APP_RELEASED_AT,
    conflict: false,
    state: null
  };
}

function defaultSettingsContainer() {
  return {
    revision: 0,
    savedAt: "",
    savedBy: "",
    build: APP_BUILD,
    releasedAt: APP_RELEASED_AT,
    settings: normalizeSettings(DEFAULT_SETTINGS)
  };
}

function normalizeSettings(input) {
  const source = input || {};
  const port = Math.max(1, Math.min(65535, Number(source.port || config.port || DEFAULT_SETTINGS.port)));
  const publicHost = String(source.publicHost || config.publicHost || DEFAULT_SETTINGS.publicHost);
  return {
    ...DEFAULT_SETTINGS,
    ...source,
    mode: source.mode === "local" ? "local" : "server",
    publicHost,
    publicBaseUrl: String(source.publicBaseUrl || publicBaseUrl()),
    apiBaseUrl: String(source.apiBaseUrl || "").replace(/\/+$/, ""),
    crmSqlApiBaseUrl: String(source.crmSqlApiBaseUrl || CRM_SQL_API_BASE_URL).replace(/\/+$/, ""),
    bindAddress: String(source.bindAddress || config.host || DEFAULT_SETTINGS.bindAddress),
    port,
    storageBackend: source.storageBackend || DEFAULT_SETTINGS.storageBackend,
    dataDir: String(source.dataDir || config.dataDir || DEFAULT_SETTINGS.dataDir),
    multiUser: source.multiUser !== false,
    externalAccess: source.externalAccess !== false,
    allowLocalFallback: source.allowLocalFallback !== false,
    autoRefreshSeconds: Math.max(5, Math.min(300, Number(source.autoRefreshSeconds || DEFAULT_SETTINGS.autoRefreshSeconds))),
    lastSavedAt: source.lastSavedAt || ""
  };
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 10 * 1024 * 1024) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

async function serveStatic(url, response) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.resolve(ROOT_DIR, `.${normalized}`);
  if (!filePath.startsWith(ROOT_DIR)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }
  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      const index = await fs.readFile(path.join(ROOT_DIR, "index.html"));
      response.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
      response.end(index);
      return;
    }
    throw error;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(payload)}\n`);
}
