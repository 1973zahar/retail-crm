import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BUILD = "20260618-retail-autostart-detach-1";
const EXPECTED_VERSION = "2026.06.18.2";
const EXPECTED_RELEASED_AT = "2026-06-18 15:23:58 +03:00";
const EXPECTED_CONTRACT_VERSION = "2026.06.18-retail-autostart-detach-1";

const readText = (relativePath) => readFile(path.join(ROOT, relativePath), "utf8");
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test("version markers stay synchronized across runtime entrypoints", async () => {
  const [app, server, serverPs, index, docs, manifest] = await Promise.all([
    readText("app.js"),
    readText("server.mjs"),
    readText("server.ps1"),
    readText("index.html"),
    readText("docs/RETAIL_B2C_BLOCK.md"),
    readJson("block.manifest.json")
  ]);

  for (const content of [app, server, serverPs, index, docs]) {
    assert.match(content, new RegExp(EXPECTED_BUILD));
    assert.match(content, new RegExp(EXPECTED_VERSION.replaceAll(".", "\\.")));
    assert.match(content, new RegExp(EXPECTED_RELEASED_AT.replaceAll("+", "\\+")));
  }

  assert.equal(manifest.currentApp.build, EXPECTED_BUILD);
  assert.equal(manifest.currentApp.version, EXPECTED_VERSION);
  assert.equal(manifest.currentApp.releasedAt, EXPECTED_RELEASED_AT);
  assert.equal(manifest.currentApp.contractVersion, EXPECTED_CONTRACT_VERSION);
});

test("TypeScript scaffold files exist in the target block layout", async () => {
  const files = [
    "package.json",
    "tsconfig.json",
    "src/types/retail-b2c.ts",
    "src/domain/sales.ts",
    "src/domain/permissions.ts",
    "src/api/retail-live-routes.ts",
    "src/services/sql-api-client.types.ts",
    "src/adapters/sql-api-adapter.types.ts",
    "src/workers/retail-outbox-worker.types.ts",
    "src/ui/screen-contracts.ts",
    "src/contracts/retail-b2c-live-api.contract.json"
  ];

  for (const file of files) {
    assert.equal(existsSync(path.join(ROOT, file)), true, `${file} should exist`);
  }

  const tsconfig = await readJson("tsconfig.json");
  assert.equal(tsconfig.compilerOptions.strict, true);
  assert.equal(tsconfig.compilerOptions.noEmit, true);
});

test("live API contract keeps large references bounded", async () => {
  const contract = await readJson("src/contracts/retail-b2c-live-api.contract.json");
  assert.equal(contract.schema, "retail.b2c.live_api.v1");
  assert.equal(contract.blockId, "retail-b2c");
  assert.equal(contract.build, EXPECTED_BUILD);
  assert.equal(contract.pagedEnvelope.canonicalCollectionField, "data");
  assert.equal(contract.writePolicy.browserWritesToExternalSystems, false);

  for (const endpoint of contract.liveReadEndpoints) {
    assert.equal(endpoint.method, "GET");
    assert.equal(endpoint.allowBrowserFullLoad, false);
    assert.ok(endpoint.defaultLimit <= endpoint.maxLimit);
    assert.ok(endpoint.maxLimit <= 5000);
  }

  const serialEndpoint = contract.liveReadEndpoints.find((item) => item.path === "/api/live/serial-stock");
  assert.ok(serialEndpoint);
  assert.deepEqual(serialEndpoint.requiredFilters, ["productCode"]);
});

test("domain TypeScript slices export pure Retail B2C logic boundaries", async () => {
  const sales = await readText("src/domain/sales.ts");
  assert.match(sales, /export function normalizeDiscountPercent/);
  assert.match(sales, /export function calculateSaleLineTotals/);
  assert.match(sales, /export function calculateSaleTotals/);
  assert.match(sales, /export function canMergeSaleLines/);
  assert.match(sales, /export function requiresSerialNumber/);

  const permissions = await readText("src/domain/permissions.ts");
  assert.match(permissions, /export function canExecuteAction/);
  assert.match(permissions, /export function canViewBlock/);
  assert.match(permissions, /export function missingPermissionText/);
});

test("MESER autostart wrapper is detached and duplicate-safe", async () => {
  const script = await readText("start-retail-b2c-background.ps1");
  assert.match(script, /Start-Process/);
  assert.match(script, /LISTENING/);
  assert.match(script, /retail-b2c-server-\$runId\.out\.log/);
  assert.match(script, /retail-b2c-server-\$runId\.err\.log/);
  assert.match(script, /port 8790 already has Retail B2C listener/);
});
