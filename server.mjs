import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_VERSION = "2026.06.07.3";
const APP_BUILD = "20260607-b2c-release-timestamp";
const APP_RELEASED_AT = "2026-06-07 12:59:37 +03:00";
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

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

  if (request.method === "GET" && url.pathname === "/api/products") {
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, listProducts(stateContainer, url));
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
    const next = {
      revision: Number(current.revision || 0) + 1,
      savedAt: new Date().toISOString(),
      savedBy: String(body.savedBy || "system"),
      build: String(body.build || APP_BUILD),
      appVersion: String(body.appVersion || APP_VERSION),
      releasedAt: String(body.releasedAt || APP_RELEASED_AT),
      conflict: Number(body.baseRevision || 0) > 0 && Number(body.baseRevision || 0) < Number(current.revision || 0),
      state: body.state
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
  return {
    ...payload,
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
    return JSON.parse(await fs.readFile(filePath, "utf8"));
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
