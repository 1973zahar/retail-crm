import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_VERSION = "2026.06.07.1";
const APP_BUILD = "20260607-b2c-sidebar-clock";
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
      settings
    };
    await writeJsonAtomic(settingsPath, next);
    const stateContainer = await readJson(statePath, defaultStateContainer());
    sendJson(response, 200, { ...next, stateRevision: stateContainer.revision });
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

function healthPayload(stateContainer) {
  return {
    ok: true,
    appVersion: APP_VERSION,
    build: APP_BUILD,
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
