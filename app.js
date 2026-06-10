"use strict";

const APP_VERSION = "2026.06.10.7";
const APP_BUILD = "20260610-b2c-shared-session-auth";
const APP_RELEASED_AT = "2026-06-10 20:11:25 +03:00";
const STORAGE_KEY = "retail-crm-b2c-v12";
const SESSION_KEY = "retail-crm-b2c-session-v1";
const SESSION_TOKEN_KEY = "retail-crm-b2c-session-token-v1";
const DEVICE_KEY = "retail-crm-b2c-device-v1";
const SIDEBAR_COLLAPSED_KEY = "retail-crm-b2c-sidebar-collapsed-v1";
const ROLE_PERMISSION_SCHEMA = "20260610-employee-edit-percent-discount";
const SCHEMA_DEFAULT_BLOCKS = ["settings"];
const SCHEMA_DEFAULT_ACTIONS = ["customer_create", "drilldown_view", "document_edit", "document_list_view", "document_list_sort", "document_list_collapse", "exchange_view", "system_settings", "price_select", "employee_edit"];

const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);
const LOYALTY_DISCOUNTS = { standard: 0, silver: 3, gold: 5 };
const LOYALTY_LABELS = { standard: "Стандарт", silver: "Silver 3%", gold: "Gold 5%" };
const WALK_IN_CUSTOMER = { id: "walk-in", name: "Роздрібний покупець", phone: "", loyalty: "standard", source: "system" };
const EMPTY_PRODUCT = { id: "", name: "Товар не вибрано", sku: "", productCode: "", barcode: "", qr: "", sqlId: "", price: 0, cost: 0 };
const SQL_SCHEMA = "one_c_mirror";
const SQL_MAIN_WAREHOUSE_CODE = "2";
const SQL_MAIN_WAREHOUSE_NAME = "Склад №1";
const SQL_WHOLESALE_WAREHOUSE_NAME = "Склад Гуртовий";
const SQL_PRODUCT_SOURCE = "PostgreSQL:one_c_mirror.crm_products + crm_product_price_summary + crm_product_characteristics + crm_product_kinds + crm_product_series + crm_product_groups + crm_product_folders";
const SQL_STOCK_RECEIPT_SOURCE = "PostgreSQL:one_c_mirror.crm_stock_balances + crm_warehouses";
const SQL_SERIAL_STOCK_SOURCE = "PostgreSQL:one_c_mirror.crm_serial_stock_current + crm_serial_stock_by_serial + crm_serial_stock_summary";
const SQL_COUNTERPARTY_SOURCE = "PostgreSQL:one_c_mirror.crm_counterparties + crm_counterparty_contracts + crm_counterparty_settlements + crm_counterparty_balance_summary";
const SQL_REFERENCE_SOURCE = "PostgreSQL:one_c_mirror.crm_units + crm_currencies + crm_price_types + crm_organizations + crm_persons + crm_bank_accounts";
const SQL_READY_VIEWS = [
  "crm_products",
  "crm_product_prices",
  "crm_product_price_summary",
  "crm_product_characteristics",
  "crm_product_kinds",
  "crm_product_series",
  "crm_product_groups",
  "crm_product_folders",
  "crm_serial_stock_current",
  "crm_serial_stock_by_serial",
  "crm_serial_stock_summary",
  "crm_stock_balances",
  "crm_warehouses",
  "crm_counterparties",
  "crm_counterparty_contracts",
  "crm_counterparty_settlements",
  "crm_counterparty_balance_summary",
  "crm_units",
  "crm_currencies",
  "crm_price_types",
  "crm_organizations",
  "crm_persons",
  "crm_bank_accounts",
  "crm_product_folder_attributes",
  "crm_products_enriched"
];
const SQL_PENDING_VIEWS = [];
const DEFAULT_SYSTEM_SETTINGS = {
  mode: "server",
  publicHost: "192.168.0.5",
  publicBaseUrl: "http://192.168.0.5:8790",
  apiBaseUrl: "",
  crmSqlApiBaseUrl: "http://192.168.0.166:3000",
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
const LIVE_PRODUCT_LOOKUP_LIMIT = 100;
const LIVE_PRODUCT_LOOKUP_CACHE_LIMIT = 1000;
const LIVE_CUSTOMER_LOOKUP_LIMIT = 20;
const LIVE_STOCK_LOOKUP_LIMIT = 20;
const LIVE_INVENTORY_STOCK_PAGE_LIMIT = 100;
const LIVE_INVENTORY_STOCK_PAGE_CONCURRENCY = 4;
const LIVE_INVENTORY_SERIAL_PAGE_LIMIT = 100;
const SESSION_HEARTBEAT_MS = 30000;
const LIVE_SERIAL_LOOKUP_LIMIT = 20;
const LIVE_TABLE_LIMIT_OPTIONS = [20, 50, 100];
const LIVE_TABLE_ALL_VALUE = "all";
const LIVE_STOCK_ALL_LIMIT = 5000;
const LIVE_STOCK_SORT_FIELDS = new Set([
  "productCode",
  "productName",
  "warehouseName",
  "warehouseCode",
  "availableQty",
  "reservedQty",
  "quantity",
  "snapshotAt",
  "source"
]);
const BASE_CURRENCY = "UAH";
const CURRENCY_NUMERIC_CODES = {
  "980": "UAH",
  "978": "EUR",
  "840": "USD"
};
const CURRENCY_LABELS = {
  UAH: "UAH",
  EUR: "EUR",
  USD: "USD"
};
const DEFAULT_CHECKOUT_PRICE_TYPE = "Роздрібна (ГРН)";
const DEFAULT_CHECKOUT_PRICE_CURRENCY = "UAH";
const DEFAULT_CHECKOUT_PRICE_TYPES = ["Роздрібна (ГРН)", "Роздрібна", "Роздрібна (EUR)", "Роздрібна (USD)", "Оптова", "Гуртова", "Закупівельна"];
const DEFAULT_CHECKOUT_CURRENCIES = ["UAH", "EUR", "USD"];
const LIVE_TABLES = {
  products: {
    endpoint: "/api/live/products",
    defaultLimit: 20,
    title: "SQL live товари",
    subtitle: "one_c_mirror.crm_products_enriched / fast read model",
    searchPlaceholder: "назва, SKU, штрихкод або група"
  },
  prices: {
    endpoint: "/api/live/product-prices",
    defaultLimit: 20,
    title: "SQL live ціни",
    subtitle: "one_c_mirror.crm_product_prices",
    searchPlaceholder: "product_code, товар або тип ціни"
  },
  counterparties: {
    endpoint: "/api/live/counterparties",
    defaultLimit: 20,
    title: "SQL live контрагенти",
    subtitle: "one_c_mirror.crm_counterparties",
    searchPlaceholder: "код, назва, телефон, email або ЄДРПОУ"
  },
  stock: {
    endpoint: "/api/live/stock-balances",
    defaultLimit: 20,
    title: "SQL live залишки",
    subtitle: "one_c_mirror.crm_stock_balances · Склад №1",
    searchPlaceholder: "product_code, товар або SKU",
    params: { warehouseCode: SQL_MAIN_WAREHOUSE_CODE }
  },
  warehouses: {
    endpoint: "/api/live/warehouses",
    defaultLimit: 100,
    title: "SQL live склади",
    subtitle: "one_c_mirror.crm_warehouses",
    searchPlaceholder: "код або назва складу"
  }
};
const serverSync = {
  enabled: true,
  online: false,
  revision: 0,
  pending: false,
  saving: false,
  loading: false,
  lastSharedStateFingerprint: "",
  lastLoadedAt: "",
  lastSavedAt: "",
  error: "",
  timer: null
};
const liveProductCache = new Map();
const liveProductLookupCache = new Map();
const liveTableLoadQueue = new Set();
const inventoryAddAllStockStatus = {
  loading: false,
  loaded: 0,
  total: 0,
  error: ""
};
const exchangeRateLookup = {
  items: [],
  byCurrency: new Map(),
  loadedAt: "",
  loading: null,
  error: ""
};
const liveProductLookup = {
  query: "",
  barcode: "",
  items: [],
  total: 0,
  limit: LIVE_PRODUCT_LOOKUP_LIMIT,
  offset: 0,
  loading: false,
  error: "",
  source: "",
  fallback: false,
  requestId: 0,
  timer: null,
  lastLoadedAt: ""
};
const liveCustomerLookup = {
  query: "",
  items: [],
  total: 0,
  limit: LIVE_CUSTOMER_LOOKUP_LIMIT,
  offset: 0,
  loading: false,
  error: "",
  source: "",
  fallback: false,
  requestId: 0,
  timer: null,
  lastLoadedAt: ""
};
const EMPLOYEE_STATUSES = { active: "Активний", inactive: "Вимкнений", vacation: "Відпустка" };
const ROLE_BLOCKS = [
  { id: "pos", label: "Продаж" },
  { id: "returns", label: "Повернення" },
  { id: "catalog", label: "Товари SQL" },
  { id: "customers", label: "Клієнти і лояльність" },
  { id: "stock", label: "Залишки" },
  { id: "inventory", label: "Інвентаризація" },
  { id: "exchange", label: "Обмін даними" },
  { id: "settings", label: "Налаштування" },
  { id: "reports", label: "Звіти" },
  { id: "employees", label: "Працівники" },
  { id: "log", label: "Журнал" }
];
const ROLE_ACTIONS = [
  { id: "sale_create", label: "Створити продаж" },
  { id: "price_select", label: "Вибір типу ціни і валюти" },
  { id: "return_create", label: "Повернення" },
  { id: "drilldown_view", label: "Розшифровки сум і карток" },
  { id: "document_edit", label: "Редагування документів" },
  { id: "document_list_view", label: "Списки продажів і повернень" },
  { id: "document_list_sort", label: "Пошук і сортування списків" },
  { id: "document_list_collapse", label: "Згортання списків" },
  { id: "customer_create", label: "Створити клієнта" },
  { id: "cash_open", label: "Відкрити зміну" },
  { id: "cash_close", label: "Закрити зміну" },
  { id: "inventory_post", label: "Провести інвентаризацію" },
  { id: "inventory_resort", label: "Пересорт" },
  { id: "sql_import", label: "SQL імпорт" },
  { id: "exchange_view", label: "Перегляд обміну даними" },
  { id: "exchange_import", label: "Керувати імпортом" },
  { id: "exchange_export", label: "Керувати експортом" },
  { id: "exchange_automation", label: "Налаштування автоматизації" },
  { id: "system_settings", label: "Системні налаштування" },
  { id: "employee_manage", label: "Керувати працівниками" },
  { id: "employee_edit", label: "Працівники: зміна всіх полів" },
  { id: "reports_view", label: "Звіти" },
  { id: "audit_view", label: "Журнал дій" }
];
const EMPLOYEE_ROLES = {
  director: {
    label: "Директор",
    blocks: ROLE_BLOCKS.map((item) => item.id),
    actions: ROLE_ACTIONS.map((item) => item.id)
  },
  admin: {
    label: "Адміністратор",
    blocks: ["pos", "returns", "catalog", "customers", "stock", "inventory", "exchange", "settings", "reports", "employees", "log"],
    actions: ["sale_create", "price_select", "return_create", "drilldown_view", "document_edit", "document_list_view", "document_list_sort", "document_list_collapse", "customer_create", "cash_open", "cash_close", "inventory_post", "inventory_resort", "sql_import", "exchange_view", "exchange_import", "exchange_export", "exchange_automation", "system_settings", "employee_manage", "employee_edit", "reports_view", "audit_view"]
  },
  seller: {
    label: "Продавець",
    blocks: ["pos", "catalog", "customers", "stock"],
    actions: ["sale_create", "price_select", "document_list_view", "document_list_sort", "document_list_collapse", "customer_create"]
  },
  cashier: {
    label: "Касир",
    blocks: ["pos", "returns"],
    actions: ["sale_create", "price_select", "return_create", "drilldown_view", "document_list_view", "document_list_sort", "document_list_collapse", "cash_open", "cash_close"]
  }
};
const sqlProductSnapshot = [
  {
    id: "p-8601444",
    sqlId: "one_c_mirror.crm_products:8601444",
    productCode: "8601444",
    name: "Манжета поршня пневматики",
    sku: "8601444",
    barcode: "8601444",
    qr: "B2C|PRODUCT_CODE=8601444|WAREHOUSE=2",
    category: "Пневматика",
    categoryPrimary: "Пневматика",
    supplyChannel: "Наш імпорт",
    isSparePart: true,
    productGroupPath: "ПНЕВМАТИКА / НАШ ІМПОРТ / ЗАПЧАСТИНИ",
    productFullPath: "ПНЕВМАТИКА / НАШ ІМПОРТ / ЗАПЧАСТИНИ / Манжета поршня пневматики",
    productGroupCodePath: "PNEU / IMPORT / SPARE",
    productGroupLevel: 3,
    productKind: "Запчастини",
    productSeries: "Наш імпорт ФОП СЗМ",
    productGroup: "ЗАПЧАСТИНИ",
    characteristics: ["category_primary=Пневматика", "supply_channel=Наш імпорт", "is_spare_part=true"],
    prices: [
      { priceType: "Роздрібна", currency: "UAH", price: 245 },
      { priceType: "Гуртова", currency: "UAH", price: 198 }
    ],
    priceCurrencies: "UAH",
    priceTypes: "Роздрібна, Гуртова",
    priceSummary: "Роздрібна 245 UAH; Гуртова 198 UAH",
    price: 245,
    cost: 142,
    minStock: 3
  },
  {
    id: "p-868607410",
    sqlId: "one_c_mirror.crm_products:868607410",
    productCode: "868607410",
    name: "Ущільнювач клапана",
    sku: "868607410",
    barcode: "868607410",
    qr: "B2C|PRODUCT_CODE=868607410|WAREHOUSE=2",
    category: "Пневматика",
    categoryPrimary: "Пневматика",
    supplyChannel: "Наш імпорт",
    isSparePart: true,
    productGroupPath: "ПНЕВМАТИКА / НАШ ІМПОРТ / ЗАПЧАСТИНИ",
    productFullPath: "ПНЕВМАТИКА / НАШ ІМПОРТ / ЗАПЧАСТИНИ / Ущільнювач клапана",
    productGroupCodePath: "PNEU / IMPORT / SPARE",
    productGroupLevel: 3,
    productKind: "Запчастини",
    productSeries: "Серія клапанів",
    productGroup: "ЗАПЧАСТИНИ",
    characteristics: ["category_primary=Пневматика", "supply_channel=Наш імпорт", "is_spare_part=true"],
    prices: [
      { priceType: "Роздрібна", currency: "UAH", price: 185 },
      { priceType: "Гуртова", currency: "UAH", price: 150 }
    ],
    priceCurrencies: "UAH",
    priceTypes: "Роздрібна, Гуртова",
    priceSummary: "Роздрібна 185 UAH; Гуртова 150 UAH",
    price: 185,
    cost: 96,
    minStock: 5
  },
  {
    id: "p-OPT-RPOINT",
    sqlId: "one_c_mirror.crm_products:OPT-RPOINT",
    productCode: "OPT-RPOINT",
    name: "Оптичний приціл R-Point",
    sku: "OPT-RPOINT",
    barcode: "4820001000011",
    qr: "B2C|PRODUCT_CODE=OPT-RPOINT|WAREHOUSE=2",
    category: "Оптика",
    categoryPrimary: "Оптика",
    supplyChannel: "Основний склад",
    isSparePart: false,
    productGroupPath: "ОПТИКА / ПРИЦІЛИ",
    productFullPath: "ОПТИКА / ПРИЦІЛИ / Оптичний приціл R-Point",
    productGroupCodePath: "OPTICS / SCOPES",
    productGroupLevel: 2,
    productKind: "Оптика",
    productSeries: "R-Point",
    productGroup: "ПРИЦІЛИ",
    characteristics: ["category_primary=Оптика", "is_spare_part=false"],
    prices: [
      { priceType: "Роздрібна", currency: "UAH", price: 5400 },
      { priceType: "Гуртова", currency: "UAH", price: 4970 }
    ],
    priceCurrencies: "UAH",
    priceTypes: "Роздрібна, Гуртова",
    priceSummary: "Роздрібна 5400 UAH; Гуртова 4970 UAH",
    price: 5400,
    cost: 3650,
    minStock: 2
  },
  {
    id: "p-CASE-120",
    sqlId: "one_c_mirror.crm_products:CASE-120",
    productCode: "CASE-120",
    name: "Чохол транспортний 120 см",
    sku: "CASE-120",
    barcode: "4820001000028",
    qr: "B2C|PRODUCT_CODE=CASE-120|WAREHOUSE=2",
    category: "Аксесуари",
    categoryPrimary: "Аксесуари та інше",
    supplyChannel: "Склад",
    isSparePart: false,
    productGroupPath: "АКСЕСУАРИ та ІНШЕ / ЧОХЛИ",
    productFullPath: "АКСЕСУАРИ та ІНШЕ / ЧОХЛИ / Чохол транспортний 120 см",
    productGroupCodePath: "ACCESSORIES / CASES",
    productGroupLevel: 2,
    productKind: "Аксесуари",
    productSeries: "120 см",
    productGroup: "ЧОХЛИ",
    characteristics: ["category_primary=Аксесуари та інше", "is_spare_part=false"],
    prices: [
      { priceType: "Роздрібна", currency: "UAH", price: 2100 },
      { priceType: "Гуртова", currency: "UAH", price: 1840 }
    ],
    priceCurrencies: "UAH",
    priceTypes: "Роздрібна, Гуртова",
    priceSummary: "Роздрібна 2100 UAH; Гуртова 1840 UAH",
    price: 2100,
    cost: 1180,
    minStock: 4
  }
];
const sqlStockBalanceSnapshot = [
  { productId: "p-8601444", productCode: "8601444", warehouseCode: "2", warehouseName: "Склад №1", qty: 6, reservedQty: 1 },
  { productId: "p-8601444", productCode: "8601444", warehouseCode: "1", warehouseName: "Склад Гуртовий", qty: 18, reservedQty: 0 },
  { productId: "p-868607410", productCode: "868607410", warehouseCode: "2", warehouseName: "Склад №1", qty: 3, reservedQty: 0 },
  { productId: "p-868607410", productCode: "868607410", warehouseCode: "1", warehouseName: "Склад Гуртовий", qty: 11, reservedQty: 2 },
  { productId: "p-OPT-RPOINT", productCode: "OPT-RPOINT", warehouseCode: "2", warehouseName: "Склад №1", qty: 2, reservedQty: 0 },
  { productId: "p-OPT-RPOINT", productCode: "OPT-RPOINT", warehouseCode: "1", warehouseName: "Склад Гуртовий", qty: 5, reservedQty: 1 },
  { productId: "p-CASE-120", productCode: "CASE-120", warehouseCode: "2", warehouseName: "Склад №1", qty: 7, reservedQty: 0 },
  { productId: "p-CASE-120", productCode: "CASE-120", warehouseCode: "1", warehouseName: "Склад Гуртовий", qty: 14, reservedQty: 0 }
];
const sqlSerialStockSnapshot = [
  { productId: "p-OPT-RPOINT", productCode: "OPT-RPOINT", productName: "Оптичний приціл R-Point", warehouseCode: "2", warehouseName: "Склад №1", serialName: "SN-RP-00041", quantity: 1, balanceSign: "positive" },
  { productId: "p-OPT-RPOINT", productCode: "OPT-RPOINT", productName: "Оптичний приціл R-Point", warehouseCode: "2", warehouseName: "Склад №1", serialName: "SN-RP-00042", quantity: 1, balanceSign: "positive" },
  { productId: "p-OPT-RPOINT", productCode: "OPT-RPOINT", productName: "Оптичний приціл R-Point", warehouseCode: "1", warehouseName: "Склад Гуртовий", serialName: "SN-RP-00037", quantity: 1, balanceSign: "positive" }
];
const sqlStockReceiptSnapshot = sqlStockBalanceSnapshot
  .filter((row) => row.warehouseCode === SQL_MAIN_WAREHOUSE_CODE)
  .map((row, index) => ({
    id: `BAL-SQL-${String(index + 1).padStart(4, "0")}`,
    sqlId: `one_c_mirror.crm_stock_balances:${row.productCode}:${row.warehouseCode}`,
    date: today(),
    supplier: SQL_STOCK_RECEIPT_SOURCE,
    productId: row.productId,
    qty: row.qty,
    warehouseCode: row.warehouseCode,
    warehouseName: row.warehouseName,
    note: "Поточний залишок із PostgreSQL one_c_mirror"
  }));
const sqlCustomerSnapshot = [
  {
    id: "cp-0001",
    counterpartyCode: "0001",
    name: "Олександр Клименко",
    phone: "+380671234567",
    loyalty: "silver",
    contracts: [{ contractCode: "DOG-0001", contractName: "Роздрібний договір", currency: "UAH" }],
    settlements: [{ date: today(), amount: 1250, currency: "UAH", balanceSign: "debit" }],
    balance: 1250,
    balanceCurrency: "UAH"
  },
  {
    id: "cp-0002",
    counterpartyCode: "0002",
    name: "Ірина Бойко",
    phone: "+380662224466",
    loyalty: "gold",
    contracts: [{ contractCode: "DOG-0002", contractName: "Постійний покупець", currency: "UAH" }],
    settlements: [{ date: today(), amount: -320, currency: "UAH", balanceSign: "credit" }],
    balance: -320,
    balanceCurrency: "UAH"
  }
];
const sqlReferenceSnapshot = {
  units: ["шт", "комплект"],
  currencies: ["UAH", "USD", "EUR"],
  priceTypes: ["Роздрібна", "Гуртова"],
  organizations: ["Основна організація"],
  persons: ["Олена Директор", "Петро Касир"],
  bankAccounts: ["UA000000000000000000000000001"]
};

function productFromSql(row) {
  return {
    id: row.id,
    sqlId: row.sqlId,
    productCode: row.productCode || row.sku || row.id,
    source: "sql",
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    qr: row.qr,
    category: row.category,
    categoryPrimary: row.categoryPrimary || row.category,
    supplyChannel: row.supplyChannel || "",
    isSparePart: Boolean(row.isSparePart),
    productGroupPath: row.productGroupPath || "",
    productFullPath: row.productFullPath || "",
    productGroupCodePath: row.productGroupCodePath || "",
    productGroupLevel: Number(row.productGroupLevel || 0),
    productKind: row.productKind || "",
    productSeries: row.productSeries || "",
    productGroup: row.productGroup || "",
    characteristics: Array.isArray(row.characteristics) ? row.characteristics : [],
    prices: Array.isArray(row.prices) ? row.prices : [],
    priceCurrencies: row.priceCurrencies || "",
    priceTypes: row.priceTypes || "",
    priceSummary: row.priceSummary || "",
    price: row.price,
    cost: row.cost,
    minStock: row.minStock
  };
}

function stockFromSql(row) {
  return {
    productId: row.productId || row.id,
    productCode: row.productCode || "",
    warehouseCode: row.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: row.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
    qty: Number(row.qty ?? row.stockQty ?? 0),
    reservedQty: Number(row.reservedQty || 0)
  };
}

function stockReceiptFromSql(row) {
  return {
    id: row.id,
    sqlId: row.sqlId,
    source: "sql",
    date: row.date,
    supplier: row.supplier,
    productId: row.productId,
    qty: Number(row.qty || 0),
    warehouseCode: row.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: row.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
    note: row.note || "",
    createdAt: nowIso()
  };
}

function serialStockFromSql(row) {
  return {
    productId: row.productId,
    productCode: row.productCode || "",
    productName: row.productName || "",
    warehouseCode: row.warehouseCode || "",
    warehouseName: row.warehouseName || "",
    serialName: row.serialName || "",
    quantity: Number(row.quantity || 0),
    balanceSign: row.balanceSign || (Number(row.quantity || 0) > 0 ? "positive" : Number(row.quantity || 0) < 0 ? "negative" : "zero")
  };
}

function normalizeWarehouseCodes(value) {
  const source = Array.isArray(value) ? value : String(value || "").split(/[;,]+/);
  const codes = source
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return Array.from(new Set(codes.length ? codes : [SQL_MAIN_WAREHOUSE_CODE]));
}

function inventorySelectedWarehouseCodes(source = state.inventory) {
  return normalizeWarehouseCodes(source?.warehouseCodes || source?.warehouseCode || SQL_MAIN_WAREHOUSE_CODE);
}

function inventoryLineKey(productId, warehouseCode = SQL_MAIN_WAREHOUSE_CODE, serialName = "") {
  return [
    String(productId || "").trim(),
    String(warehouseCode || SQL_MAIN_WAREHOUSE_CODE).trim(),
    normalizeScanText(serialName)
  ].join("::");
}

function inventoryLineKeyForLine(line) {
  return line?.lineKey || inventoryLineKey(line?.productId, line?.warehouseCode || SQL_MAIN_WAREHOUSE_CODE, line?.serialName || line?.serialNumber || "");
}

function inventoryLineMatches(line, token) {
  const raw = String(token || "").trim();
  if (!raw) return false;
  return inventoryLineKeyForLine(line) === raw || line?.productId === raw;
}

function seedEmployee(id, code, name, role, phone, email, login, status = "active") {
  return {
    id,
    code,
    name,
    role,
    phone,
    email,
    login,
    pin: "",
    status,
    store: "B2C магазин",
    schedule: "5/2",
    hireDate: today(),
    note: "",
    createdAt: nowIso()
  };
}

function defaultRolePermissions() {
  return Object.fromEntries(Object.entries(EMPLOYEE_ROLES).map(([id, role]) => [
    id,
    {
      blocks: [...role.blocks],
      actions: [...role.actions]
    }
  ]));
}

function inventoryLineFromProduct(row) {
  const warehouseCode = SQL_MAIN_WAREHOUSE_CODE;
  return {
    lineKey: inventoryLineKey(row.id, warehouseCode),
    productId: row.id,
    warehouseCode,
    warehouseName: SQL_MAIN_WAREHOUSE_NAME,
    serialName: "",
    serialNumber: "",
    expectedQty: stockQtyFromRows(sqlStockBalanceSnapshot, row.id, warehouseCode),
    actualQty: ""
  };
}

const seedState = {
  currentView: "pos",
  systemSettings: clone(DEFAULT_SYSTEM_SETTINGS),
  checkout: {
    customerId: "walk-in",
    customerSearch: "",
    paymentMethod: "card",
    priceType: DEFAULT_CHECKOUT_PRICE_TYPE,
    priceCurrency: DEFAULT_CHECKOUT_PRICE_CURRENCY,
    search: "",
    note: "",
    printReceiptId: "",
    lines: []
  },
  saleConfirm: {
    open: false,
    paymentMethod: "card"
  },
  returnConfirm: {
    open: false,
    payload: null,
    refundMethod: "card"
  },
  drilldown: {
    open: false,
    type: ""
  },
  documentEdit: {
    open: false,
    type: "",
    id: ""
  },
  employeeEdit: {
    open: false,
    employeeId: ""
  },
  listUi: {
    receipts: { collapsed: false, sortBy: "date", sortDir: "desc", date: "", customer: "" },
    returns: { collapsed: false, sortBy: "date", sortDir: "desc", date: "", customer: "" },
    drilldown: { collapsed: false, sortBy: "date", sortDir: "desc", date: "", customer: "" }
  },
  products: [],
  customers: [],
  employees: [
    seedEmployee("e-001", "EMP-001", "Олена Директор", "director", "+380671110001", "director@retail.local", "director"),
    seedEmployee("e-002", "EMP-002", "Іван Адміністратор", "admin", "+380671110002", "admin@retail.local", "admin"),
    seedEmployee("e-003", "EMP-003", "Марія Продавець", "seller", "+380671110003", "seller@retail.local", "seller"),
    seedEmployee("e-004", "EMP-004", "Петро Касир", "cashier", "+380671110004", "cashier@retail.local", "cashier")
  ],
  activeEmployeeId: "e-001",
  employeeSessions: {},
  selectedCashierId: "e-004",
  selectedReturnId: "",
  stockUi: {
    stockListCollapsed: false,
    serialProductId: "",
    serialRows: [],
    serialLimit: LIVE_SERIAL_LOOKUP_LIMIT,
    serialOffset: 0,
    serialTotal: 0,
    serialHasMore: false,
    serialNextOffset: null,
    serialLoading: false,
    serialError: "",
    serialSource: "",
    serialLastLoadedAt: "",
    serialProductCode: ""
  },
  liveTables: {
    products: { search: "", limit: 20, offset: 0, total: 0, totalExact: false, hasMore: false, nextOffset: null, items: [], loading: false, error: "", source: "", lastLoadedAt: "" },
    prices: { search: "", limit: 20, offset: 0, total: 0, totalExact: false, hasMore: false, nextOffset: null, items: [], loading: false, error: "", source: "", lastLoadedAt: "" },
    counterparties: { search: "", limit: 20, offset: 0, total: 0, totalExact: false, hasMore: false, nextOffset: null, items: [], loading: false, error: "", source: "", lastLoadedAt: "" }
  },
  rolePermissionSchema: ROLE_PERMISSION_SCHEMA,
  rolePermissions: defaultRolePermissions(),
  stock: [],
  serialStock: [],
  references: {
    units: [],
    currencies: [],
    priceTypes: [],
    organizations: [],
    persons: [],
    bankAccounts: []
  },
  productImport: {
    source: SQL_PRODUCT_SOURCE,
    rows: 0,
    lastRunAt: "",
    mode: "not-imported"
  },
  stockImport: {
    source: SQL_STOCK_RECEIPT_SOURCE,
    rows: 0,
    lastRunAt: "",
    mode: "not-imported"
  },
  serialImport: {
    source: SQL_SERIAL_STOCK_SOURCE,
    rows: 0,
    lastRunAt: "",
    mode: "not-imported"
  },
  counterpartyImport: {
    source: SQL_COUNTERPARTY_SOURCE,
    rows: 0,
    lastRunAt: "",
    mode: "not-imported"
  },
  exchange: {
    process: {
      status: "idle",
      label: "Очікує запуску",
      progress: 0,
      startedAt: "",
      finishedAt: ""
    },
    automation: {
      enabled: false,
      interval: "manual",
      importProducts: true,
      importStock: true,
      importCounterparties: true,
      exportSales: false,
      exportInventory: false,
      exportCustomers: false,
      notifyResponsible: true,
      responsibleRole: "admin",
      lastRunAt: ""
    },
    records: []
  },
  inventory: {
    id: "INV-DRAFT",
    date: today(),
    search: "",
    scan: "",
    printedAt: "",
    addSearch: "",
    warehouseCodes: [SQL_MAIN_WAREHOUSE_CODE],
    lines: [],
    resorts: []
  },
  inventoryDocs: [],
  receipts: [],
  returns: [],
  cashShifts: [],
  stockReceipts: [],
  auditLog: [
    { at: nowIso(), actor: "system", event: "B2C стартує без локально створених товарів, клієнтів, залишків і чеків. Дані завантажуються тільки через SQL-імпорт." }
  ]
};

const CLIENT_LOCAL_STATE_KEYS = [
  "currentView",
  "activeEmployeeId",
  "selectedCashierId",
  "selectedReturnId",
  "checkout",
  "saleConfirm",
  "returnConfirm",
  "drilldown",
  "documentEdit",
  "employeeEdit",
  "listUi",
  "stockUi",
  "liveTables",
  "inventory"
];

const navItems = [
  ["pos", "Продаж"],
  { id: "directories", label: "Довідники", children: [
    ["catalog", "Товари"],
    ["customers", "Клієнти і лояльність"],
    ["stock", "Залишки"]
  ] },
  ["exchange", "Обмін даними"],
  ["settings", "Налаштування"],
  ["returns", "Повернення"],
  ["reports", "Звіт дня"],
  ["employees", "Працівники"],
  ["log", "Журнал"]
];

const NAV_ICONS = {
  pos: "₴",
  directories: "Д",
  catalog: "Т",
  customers: "К",
  stock: "З",
  exchange: "О",
  settings: "Н",
  returns: "ПВ",
  reports: "ЗД",
  employees: "ПР",
  log: "Ж"
};

const VIEW_ALIASES = { dashboard: "pos", checkout: "pos", receipts: "pos", cash: "pos" };

let sessionEmployeeId = loadSessionEmployeeId();
let sessionToken = loadSessionToken();
const browserDeviceId = loadBrowserDeviceId();
let state = loadState();
let loginDialog = { open: false, employeeId: "" };
let sessionNotice = "";
let sessionHeartbeatTimer = null;
let sidebarCollapsed = loadSidebarCollapsed();

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function loadSessionEmployeeId() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch (error) {
    return "";
  }
}

function loadSessionToken() {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
  } catch (error) {
    return "";
  }
}

function createOpaqueId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadBrowserDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const next = createOpaqueId("device");
    localStorage.setItem(DEVICE_KEY, next);
    return next;
  } catch (error) {
    return createOpaqueId("device-memory");
  }
}

function currentDeviceLabel() {
  return `Комп'ютер ${browserDeviceId.slice(-8).toUpperCase()}`;
}

function storeSessionEmployeeId(employeeId, token = sessionToken) {
  sessionEmployeeId = employeeId || "";
  sessionToken = sessionEmployeeId ? (token || createOpaqueId("session")) : "";
  try {
    if (sessionEmployeeId) {
      sessionStorage.setItem(SESSION_KEY, sessionEmployeeId);
      sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch (error) {
    // Keep the in-memory session when browser storage is blocked.
  }
}

function loadSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function storeSidebarCollapsed(collapsed) {
  sidebarCollapsed = Boolean(collapsed);
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
  } catch (error) {
    // Keep the in-memory sidebar state when browser storage is blocked.
  }
}

function applySidebarState() {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  const toggle = document.querySelector("[data-toggle-sidebar]");
  if (!toggle) return;
  const label = sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню";
  toggle.textContent = sidebarCollapsed ? ">" : "<";
  toggle.setAttribute("aria-label", label);
  toggle.setAttribute("title", label);
  toggle.setAttribute("aria-expanded", String(!sidebarCollapsed));
}

function toggleSidebar() {
  storeSidebarCollapsed(!sidebarCollapsed);
  applySidebarState();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : clone(seedState));
  } catch (error) {
    return clone(seedState);
  }
}

function normalizeState(input) {
  const next = { ...clone(seedState), ...(input || {}) };
  next.currentView = normalizeView(next.currentView);
  next.systemSettings = normalizeSystemSettings(next.systemSettings);
  next.products = Array.isArray(next.products) ? next.products.map(normalizeProduct) : clone(seedState.products);
  next.customers = Array.isArray(next.customers) ? next.customers.map(normalizeCustomer) : clone(seedState.customers);
  next.employees = Array.isArray(next.employees) ? next.employees.map(normalizeEmployee) : clone(seedState.employees);
  next.activeEmployeeId = next.employees.some((employee) => employee.id === next.activeEmployeeId)
    ? next.activeEmployeeId
    : next.employees.find((employee) => employee.role === "director")?.id || next.employees[0]?.id || "";
  next.employeeSessions = normalizeEmployeeSessions(next.employeeSessions, next.employees);
  next.selectedCashierId = next.selectedCashierId || next.employees.find((item) => item.role === "cashier" && item.status === "active")?.id || seedState.selectedCashierId;
  next.selectedReturnId = next.selectedReturnId || "";
  next.stockUi = {
    ...clone(seedState.stockUi),
    ...(next.stockUi || {})
  };
  next.stockUi.stockListCollapsed = Boolean(next.stockUi.stockListCollapsed);
  next.stockUi.serialRows = Array.isArray(next.stockUi.serialRows)
    ? next.stockUi.serialRows.map(normalizeSerialStock)
    : [];
  next.stockUi.serialLimit = clampLiveLimit(next.stockUi.serialLimit, LIVE_SERIAL_LOOKUP_LIMIT);
  next.stockUi.serialOffset = Math.max(0, Number(next.stockUi.serialOffset || 0));
  next.stockUi.serialTotal = Math.max(0, Number(next.stockUi.serialTotal || 0));
  next.stockUi.serialHasMore = Boolean(next.stockUi.serialHasMore);
  next.stockUi.serialNextOffset = next.stockUi.serialNextOffset === null || next.stockUi.serialNextOffset === undefined
    ? null
    : Math.max(0, Number(next.stockUi.serialNextOffset || 0));
  next.liveTables = normalizeLiveTables(next.liveTables);
  const inputRoleSchema = next.rolePermissionSchema || "";
  next.rolePermissions = normalizeRolePermissions(next.rolePermissions, inputRoleSchema);
  next.rolePermissionSchema = ROLE_PERMISSION_SCHEMA;
  next.stock = Array.isArray(next.stock) ? next.stock.map(normalizeStockBalance) : clone(seedState.stock);
  next.serialStock = Array.isArray(next.serialStock) ? next.serialStock.map(normalizeSerialStock) : clone(seedState.serialStock);
  next.references = Object.fromEntries(Object.entries(seedState.references).map(([key, defaults]) => [
    key,
    Array.isArray(next.references?.[key]) ? next.references[key] : clone(defaults)
  ]));
  next.productImport = {
    ...clone(seedState.productImport),
    ...(next.productImport || {})
  };
  next.stockImport = {
    ...clone(seedState.stockImport),
    ...(next.stockImport || {})
  };
  next.serialImport = {
    ...clone(seedState.serialImport),
    ...(next.serialImport || {})
  };
  next.counterpartyImport = {
    ...clone(seedState.counterpartyImport),
    ...(next.counterpartyImport || {})
  };
  next.exchange = normalizeExchange(next.exchange);
  next.receipts = Array.isArray(next.receipts) ? next.receipts.map((receipt) => normalizeReceipt(receipt, next.products)) : [];
  next.returns = Array.isArray(next.returns) ? next.returns.map(normalizeReturnDoc) : [];
  next.cashShifts = Array.isArray(next.cashShifts) ? next.cashShifts.map(normalizeShift) : clone(seedState.cashShifts);
  next.stockReceipts = Array.isArray(next.stockReceipts) ? next.stockReceipts.map(normalizeStockReceipt) : clone(seedState.stockReceipts);
  next.inventory = normalizeInventory(next.inventory, next.products, next.stock);
  next.inventoryDocs = Array.isArray(next.inventoryDocs) ? next.inventoryDocs.map(normalizeInventoryDoc) : [];
  next.auditLog = Array.isArray(next.auditLog) ? next.auditLog : [];
  next.checkout = {
    ...clone(seedState.checkout),
    ...(next.checkout || {})
  };
  next.checkout.priceType = normalizePriceTypeLabel(next.checkout.priceType);
  next.checkout.priceCurrency = normalizeCurrencyCode(next.checkout.priceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY);
  next.checkout.lines = Array.isArray(next.checkout.lines) && next.checkout.lines.length
    ? next.checkout.lines.map(normalizeCheckoutLine)
    : clone(seedState.checkout.lines).map(normalizeCheckoutLine);
  next.checkout.printReceiptId = next.checkout.printReceiptId || next.receipts[0]?.id || "";
  next.saleConfirm = {
    ...clone(seedState.saleConfirm),
    ...(next.saleConfirm || {})
  };
  next.saleConfirm.paymentMethod = ["cash", "card", "bank"].includes(next.saleConfirm.paymentMethod)
    ? next.saleConfirm.paymentMethod
    : next.checkout.paymentMethod;
  next.returnConfirm = {
    ...clone(seedState.returnConfirm),
    ...(next.returnConfirm || {})
  };
  next.returnConfirm.refundMethod = ["cash", "card"].includes(next.returnConfirm.refundMethod)
    ? next.returnConfirm.refundMethod
    : "card";
  if (!next.returnConfirm.open) next.returnConfirm.payload = null;
  next.drilldown = {
    ...clone(seedState.drilldown),
    ...(next.drilldown || {})
  };
  next.documentEdit = {
    ...clone(seedState.documentEdit),
    ...(next.documentEdit || {})
  };
  next.employeeEdit = {
    ...clone(seedState.employeeEdit),
    ...(next.employeeEdit || {})
  };
  if (!next.employeeEdit.open) next.employeeEdit.employeeId = "";
  next.listUi = normalizeListUi(next.listUi);
  if (!canOpenBlock(next.currentView, next)) next.currentView = firstAllowedView(next);
  return next;
}

function normalizeEmployeeSessions(input, employees = []) {
  const activeEmployeeIds = new Set(employees.filter((employee) => employee.status === "active").map((employee) => employee.id));
  const source = input && typeof input === "object" ? input : {};
  return Object.fromEntries(Object.entries(source).map(([employeeId, session]) => {
    const id = String(session?.employeeId || employeeId || "").trim();
    if (!id || !activeEmployeeIds.has(id)) return null;
    const deviceId = String(session?.deviceId || "").trim();
    if (!deviceId) return null;
    return [id, {
      employeeId: id,
      deviceId,
      deviceLabel: String(session?.deviceLabel || "Комп'ютер").slice(0, 80),
      sessionToken: String(session?.sessionToken || "").slice(0, 120),
      startedAt: String(session?.startedAt || nowIso()),
      lastSeenAt: String(session?.lastSeenAt || session?.startedAt || nowIso()),
      replacedAt: String(session?.replacedAt || "")
    }];
  }).filter(Boolean));
}

function clientLocalStateSnapshot(source = state) {
  return Object.fromEntries(CLIENT_LOCAL_STATE_KEYS.map((key) => [key, clone(source?.[key] ?? seedState[key])]));
}

function sharedStateForServer(source = state) {
  const shared = clone(source || seedState);
  CLIENT_LOCAL_STATE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(seedState, key)) {
      shared[key] = clone(seedState[key]);
    } else {
      delete shared[key];
    }
  });
  shared.activeEmployeeId = "";
  return shared;
}

function sharedStateFingerprint(source = state) {
  try {
    return JSON.stringify(sharedStateForServer(source));
  } catch (error) {
    return `${Date.now()}`;
  }
}

function rememberSharedStateFingerprint(source = state) {
  serverSync.lastSharedStateFingerprint = sharedStateFingerprint(source);
}

function mergeServerStateWithClientUi(serverState, clientUi = clientLocalStateSnapshot()) {
  const next = normalizeState(serverState || seedState);
  CLIENT_LOCAL_STATE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(clientUi, key)) {
      next[key] = clone(clientUi[key]);
    }
  });
  if (sessionEmployeeId && next.employees.some((employee) => employee.id === sessionEmployeeId && employee.status === "active")) {
    next.activeEmployeeId = employeeSessionIsCurrent(sessionEmployeeId, next) ? sessionEmployeeId : "";
  }
  if (!canOpenBlock(next.currentView, next)) next.currentView = firstAllowedView(next);
  return normalizeState(next);
}

function normalizeView(view) {
  const id = VIEW_ALIASES[view] || view || seedState.currentView;
  return flatNavItems().some(([itemId]) => itemId === id) ? id : seedState.currentView;
}

function normalizeSystemSettings(input) {
  const source = input || {};
  const mode = source.mode === "local" ? "local" : "server";
  const port = Math.max(1, Math.min(65535, Number(source.port || DEFAULT_SYSTEM_SETTINGS.port)));
  const refresh = Math.max(5, Math.min(300, Number(source.autoRefreshSeconds || DEFAULT_SYSTEM_SETTINGS.autoRefreshSeconds)));
  const publicHost = String(source.publicHost || DEFAULT_SYSTEM_SETTINGS.publicHost).trim();
  const publicBaseUrl = String(source.publicBaseUrl || `http://${publicHost}:${port}`).trim();
  return {
    ...clone(DEFAULT_SYSTEM_SETTINGS),
    ...source,
    mode,
    publicHost,
    publicBaseUrl,
    apiBaseUrl: String(source.apiBaseUrl || "").trim().replace(/\/+$/, ""),
    crmSqlApiBaseUrl: String(source.crmSqlApiBaseUrl || DEFAULT_SYSTEM_SETTINGS.crmSqlApiBaseUrl).trim().replace(/\/+$/, ""),
    bindAddress: String(source.bindAddress || DEFAULT_SYSTEM_SETTINGS.bindAddress).trim(),
    port,
    storageBackend: source.storageBackend || DEFAULT_SYSTEM_SETTINGS.storageBackend,
    dataDir: String(source.dataDir || DEFAULT_SYSTEM_SETTINGS.dataDir).trim(),
    multiUser: source.multiUser !== false,
    externalAccess: source.externalAccess !== false,
    allowLocalFallback: source.allowLocalFallback !== false,
    autoRefreshSeconds: refresh,
    lastSavedAt: source.lastSavedAt || ""
  };
}

function clampLiveLimit(value, fallback = 20) {
  const numeric = Number(value || fallback);
  const limit = LIVE_TABLE_LIMIT_OPTIONS.includes(numeric) ? numeric : fallback;
  return Math.max(1, Math.min(100, limit));
}

function normalizeLiveTableLimitChoice(value, kind, fallback = 20, mode = "") {
  const raw = String(value ?? "").trim().toLowerCase();
  if (kind === "stock" && (raw === LIVE_TABLE_ALL_VALUE || mode === LIVE_TABLE_ALL_VALUE)) {
    return { limit: LIVE_STOCK_ALL_LIMIT, mode: LIVE_TABLE_ALL_VALUE };
  }
  return { limit: clampLiveLimit(value, fallback), mode: "page" };
}

function liveTableLimitSelection(table) {
  return table.limitMode === LIVE_TABLE_ALL_VALUE ? LIVE_TABLE_ALL_VALUE : String(table.limit);
}

function normalizeLiveSortField(kind, field) {
  const value = String(field || "").trim();
  if (kind === "stock" && LIVE_STOCK_SORT_FIELDS.has(value)) return value;
  return "";
}

function normalizeSortDirection(value) {
  return String(value || "").toLowerCase() === "asc" ? "asc" : "desc";
}

function normalizeLiveTables(input) {
  return Object.fromEntries(Object.entries(LIVE_TABLES).map(([kind, config]) => [
    kind,
    normalizeLiveTableState(input?.[kind], kind, config)
  ]));
}

function normalizeLiveTableState(table, kind, config = LIVE_TABLES[kind]) {
  const source = table || {};
  const limitChoice = normalizeLiveTableLimitChoice(source.limit, kind, config.defaultLimit, source.limitMode);
  const limit = limitChoice.limit;
  const rows = Array.isArray(source.items) ? source.items : (Array.isArray(source.data) ? source.data : []);
  const sortField = normalizeLiveSortField(kind, source.sortField || source.sortBy || source.sort);
  return {
    search: String(source.search || ""),
    limit,
    limitMode: limitChoice.mode,
    offset: Math.max(0, Number(source.offset || 0)),
    total: Math.max(0, Number(source.total || 0)),
    totalExact: Boolean(source.totalExact),
    hasMore: Boolean(source.hasMore),
    nextOffset: source.nextOffset === null || source.nextOffset === undefined ? null : Math.max(0, Number(source.nextOffset || 0)),
    items: rows.slice(0, limit).map((item) => normalizeLiveTableItem(kind, item)),
    loading: false,
    error: String(source.error || ""),
    source: String(source.source || ""),
    lastLoadedAt: String(source.lastLoadedAt || ""),
    sortField,
    sortDirection: sortField ? normalizeSortDirection(source.sortDirection || source.sortDir || source.direction) : "desc"
  };
}

function normalizeLiveTableItem(kind, item) {
  if (kind === "products") return normalizeProduct(item);
  if (kind === "prices") return normalizeLivePrice(item);
  if (kind === "counterparties") return normalizeLiveCounterparty(item);
  if (kind === "stock") return normalizeStockBalance(item);
  if (kind === "warehouses") return normalizeLiveWarehouse(item);
  return item || {};
}

function textField(source, fields, fallback = "") {
  for (const field of fields) {
    const value = source?.[field];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

function numberField(source, fields, fallback = 0) {
  for (const field of fields) {
    const value = Number(source?.[field]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function currencyTokens(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap(currencyTokens)));
  }
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return [];
  const normalizedText = raw
    .replaceAll("ГРН", "UAH")
    .replaceAll("ГРИВНЯ", "UAH")
    .replaceAll("ЄВРО", "EUR")
    .replaceAll("ЕВРО", "EUR")
    .replaceAll("ДОЛАР", "USD");
  const tokens = normalizedText.split(/[^A-ZА-ЯІЇЄҐ0-9]+/iu)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => CURRENCY_NUMERIC_CODES[part] || part)
    .filter((part) => /^[A-Z]{3}$/.test(part));
  return Array.from(new Set(tokens));
}

function normalizeCurrencyCode(value, fallback = BASE_CURRENCY) {
  const tokens = currencyTokens(value);
  if (tokens.length === 1) return tokens[0];
  const raw = String(value || "").trim().toUpperCase();
  if (raw && CURRENCY_NUMERIC_CODES[raw]) return CURRENCY_NUMERIC_CODES[raw];
  if (raw && /^[A-Z]{3}$/.test(raw)) return raw;
  return fallback;
}

function displayCurrencyList(value, fallback = BASE_CURRENCY) {
  const tokens = currencyTokens(value);
  if (tokens.length) return tokens.map((token) => CURRENCY_LABELS[token] || token).join(", ");
  const normalized = normalizeCurrencyCode(value, fallback);
  return CURRENCY_LABELS[normalized] || normalized;
}

function splitOptionLabels(value) {
  if (Array.isArray(value)) return value.flatMap(splitOptionLabels);
  if (value && typeof value === "object") {
    return splitOptionLabels(value.name || value.label || value.title || value.priceTypeName || value.priceType || value.currency || value.code || "");
  }
  return String(value || "")
    .split(/[;,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizePriceTypeLabel(value, fallback = DEFAULT_CHECKOUT_PRICE_TYPE) {
  const label = String(value || "").trim();
  return label || fallback;
}

function normalizePriceTypeText(value) {
  return normalizeScanText(value)
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function priceTypeMatches(source, selected) {
  const selectedText = normalizePriceTypeText(selected);
  if (!selectedText) return true;
  const sourceText = normalizePriceTypeText(source);
  if (!sourceText) return false;
  if (sourceText === selectedText) return true;
  return splitOptionLabels(source).some((label) => {
    const text = normalizePriceTypeText(label);
    return text === selectedText || selectedText.includes(text) || text.includes(selectedText);
  });
}

function normalizeProductPriceRows(value) {
  const rows = Array.isArray(value) ? value : (value && typeof value === "object" ? [value] : []);
  return rows.map((price) => {
    const currencyRaw = price.currencyRaw || price.currency || price.priceCurrency || price.currencyCode || price.currency_code || BASE_CURRENCY;
    return {
      priceType: price.priceType || price.priceTypeName || price.price_type_name || "",
      currency: normalizeCurrencyCode(currencyRaw),
      currencyRaw,
      price: Number(price.price ?? price.amount ?? 0)
    };
  }).filter((price) => Number.isFinite(price.price));
}

function priceOptionId(option) {
  const type = normalizePriceTypeText(option?.priceType || "price");
  const currency = normalizeCurrencyCode(option?.currency || option?.currencyRaw || BASE_CURRENCY);
  const price = roundCurrencyAmount(option?.price || 0);
  return `${type}|${currency}|${price}`;
}

function normalizePriceOption(row, source = "attached-price") {
  const price = Number(row?.price || 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  const currencies = currencyTokens(row.currencyRaw || row.currency);
  const currency = currencies.length === 1
    ? currencies[0]
    : normalizeCurrencyCode(row.currency || row.currencyRaw || BASE_CURRENCY);
  const priceType = normalizePriceTypeLabel(row.priceType || row.priceTypeName || row.price_type_name || "Ціна");
  const option = {
    id: "",
    priceType,
    currency,
    currencyRaw: row.currencyRaw || row.currency || currency,
    price: roundCurrencyAmount(price),
    source,
    priceWarning: row.priceWarning || ""
  };
  option.id = priceOptionId(option);
  return option;
}

function priceTypeCurrencyHint(value) {
  const text = normalizePriceTypeText(value);
  if (!text) return "";
  if (text.includes("usd") || text.includes("дол")) return "USD";
  if (text.includes("eur") || text.includes("євро") || text.includes("евро")) return "EUR";
  if (text.includes("uah") || text.includes("грн") || text.includes("грив")) return "UAH";
  return "";
}

function priceOptionRowsFromSource(row, source = "attached-price") {
  const labels = splitOptionLabels(row?.priceType || row?.priceTypeName || row?.price_type_name);
  const priceTypes = labels.length ? labels : [normalizePriceTypeLabel(row?.priceType || row?.priceTypeName || row?.price_type_name || "Ціна")];
  const currencies = currencyTokens(row?.currencyRaw || row?.currency);
  const checkoutCurrency = normalizeCurrencyCode(state.checkout?.priceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY);
  const fallbackCurrency = currencies.includes(checkoutCurrency)
    ? checkoutCurrency
    : (currencies.includes(BASE_CURRENCY) ? BASE_CURRENCY : (currencies[0] || checkoutCurrency || BASE_CURRENCY));
  return priceTypes.flatMap((priceType) => {
    const hintedCurrency = priceTypeCurrencyHint(priceType);
    const currencyChoices = hintedCurrency
      ? [hintedCurrency]
      : (currencies.length > 1 && priceTypes.length === 1
        ? currencies
        : [fallbackCurrency]);
    return currencyChoices.map((currency) => normalizePriceOption({
      ...row,
      priceType,
      currency,
      currencyRaw: currency
    }, source)).filter(Boolean);
  });
}

function priceOptionLabel(option) {
  return [
    option.priceType || "Ціна",
    formatMoney(option.price || 0, option.currency || BASE_CURRENCY)
  ].filter(Boolean).join(" · ");
}

function productAttachedPriceOptions(product, liveRows = []) {
  const options = new Map();
  const addRows = (rows, source) => {
    rows.flatMap((row) => priceOptionRowsFromSource(row, source)).filter(Boolean).forEach((option) => {
      if (!options.has(option.id)) options.set(option.id, option);
    });
  };
  addRows(normalizeProductPriceRows(product?.prices).filter((row) => Number(row.price || 0) > 0), "product-attached-price");
  addRows(liveRows.filter((row) => Number(row.price || 0) > 0), "live-product-price");
  const directPrice = Number(product?.price || 0);
  const summaryCurrencies = productCurrencyTokens(product);
  if (directPrice > 0 && summaryCurrencies.length <= 1) {
    const currency = summaryCurrencies[0] || normalizeCurrencyCode(product?.priceCurrency || product?.currency || BASE_CURRENCY);
    addRows([{
      price: directPrice,
      currency,
      currencyRaw: currency,
      priceType: product?.priceTypes || state.checkout?.priceType || DEFAULT_CHECKOUT_PRICE_TYPE
    }], "sql-price-summary");
  }
  return Array.from(options.values()).sort((left, right) => priceRowRank(left) - priceRowRank(right));
}

function normalizePriceOptions(value, source = "attached-price") {
  const rows = Array.isArray(value) ? value : (value ? [value] : []);
  const options = new Map();
  rows.flatMap((row) => priceOptionRowsFromSource(row, row?.source || source)).filter(Boolean).forEach((option) => {
    if (!options.has(option.id)) options.set(option.id, option);
  });
  return Array.from(options.values()).sort((left, right) => priceRowRank(left) - priceRowRank(right));
}

function productCurrencyTokens(product) {
  const values = [
    product?.priceCurrencies,
    product?.priceCurrency,
    product?.currency,
    ...(Array.isArray(product?.prices) ? product.prices.flatMap((price) => [price.currencyRaw, price.currency]) : [])
  ];
  return currencyTokens(values);
}

function productPriceTypeLabels(product) {
  return Array.from(new Set([
    ...splitOptionLabels(product?.priceTypes),
    ...(Array.isArray(product?.prices) ? product.prices.flatMap((price) => splitOptionLabels(price.priceType || price.priceTypeName || price.price_type_name)) : [])
  ].map(normalizePriceTypeLabel)));
}

function productPriceTypeAvailable(product, selectedType) {
  const labels = productPriceTypeLabels(product);
  if (!labels.length) return true;
  return labels.some((label) => priceTypeMatches(label, selectedType));
}

function productAvailableCurrencies(product, rows = []) {
  const tokens = new Set([
    ...productCurrencyTokens(product),
    ...rows.flatMap((row) => row.currencies?.length ? row.currencies : currencyTokens(row.currencyRaw || row.currency))
  ]);
  if (!tokens.size) tokens.add(normalizeCurrencyCode(product?.priceCurrency || product?.currency || BASE_CURRENCY));
  return Array.from(tokens);
}

function checkoutPriceTypeOptions(product = null) {
  return Array.from(new Set([
    state.checkout?.priceType,
    ...DEFAULT_CHECKOUT_PRICE_TYPES,
    ...splitOptionLabels(state.references?.priceTypes || []),
    ...productPriceTypeLabels(product)
  ].map((item) => normalizePriceTypeLabel(item)).filter(Boolean)));
}

function checkoutCurrencyOptions(product = null) {
  return Array.from(new Set([
    state.checkout?.priceCurrency,
    ...DEFAULT_CHECKOUT_CURRENCIES,
    ...currencyTokens(splitOptionLabels(state.references?.currencies || [])),
    ...productCurrencyTokens(product)
  ].map((item) => normalizeCurrencyCode(item)).filter(Boolean)));
}

function checkoutPriceCriteria() {
  return {
    priceType: normalizePriceTypeLabel(state.checkout?.priceType),
    currency: normalizeCurrencyCode(state.checkout?.priceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY)
  };
}

function priceRowRank(row) {
  const text = normalizeScanText(row.priceType || "");
  if (text.includes("роздр") || text.includes("retail")) return 0;
  if (text.includes("опт") || text.includes("wholesale")) return 2;
  if (text.includes("закуп") || text.includes("purchase")) return 3;
  return 1;
}

function productPriceDisplay(product) {
  const amount = Number(product?.price || 0);
  if (amount <= 0) return "ціна після вибору";
  const currencies = productCurrencyTokens(product);
  if (currencies.length === 1) return formatMoney(amount, currencies[0]);
  if (currencies.length > 1) return `${amount} ${currencies.map((item) => CURRENCY_LABELS[item] || item).join(", ")}`;
  return formatMoney(amount, BASE_CURRENCY);
}

function productPriceSummaryDisplay(product) {
  const summary = String(product?.priceSummary || "").trim();
  const currencies = productCurrencyTokens(product);
  if (!summary) return productPriceDisplay(product);
  if (currencies.length > 1) return `${Number(product.price || 0)} ${currencies.map((item) => CURRENCY_LABELS[item] || item).join(", ")}`;
  return summary.replace(/\b980\b/g, "UAH").replace(/\b978\b/g, "EUR").replace(/\b840\b/g, "USD");
}

function normalizeLivePrice(row) {
  const source = row || {};
  return {
    id: textField(source, ["id", "productCode", "product_code", "productName", "product_name"], `price-${Date.now()}`),
    productCode: textField(source, ["productCode", "product_code", "sku"]),
    productName: textField(source, ["productName", "product_name", "name"]),
    priceTypeCode: textField(source, ["priceTypeCode", "price_type_code"]),
    priceTypeName: textField(source, ["priceTypeName", "price_type_name", "priceType", "price_type"]),
    currency: normalizeCurrencyCode(textField(source, ["currency"], BASE_CURRENCY)),
    amount: numberField(source, ["amount", "price"]),
    price: numberField(source, ["price", "amount"]),
    snapshotAt: textField(source, ["snapshotAt", "snapshot_at", "importedAt", "imported_at"]),
    sourceFile: textField(source, ["sourceFile", "source_file"]),
    importedAt: textField(source, ["importedAt", "imported_at"]),
    source: textField(source, ["source"], "crm-sql-live")
  };
}

function normalizeLiveCounterparty(row) {
  const source = row || {};
  const counterpartyCode = textField(source, ["counterpartyCode", "counterparty_code", "externalId", "external_id"]);
  return {
    id: textField(source, ["id", "counterpartyCode", "counterparty_code", "oneCRef", "one_c_ref"], `cp-${Date.now()}`),
    sqlId: textField(source, ["sqlId", "oneCRef", "one_c_ref", "externalId", "external_id"]),
    counterpartyCode,
    name: textField(source, ["name", "fullName", "full_name", "counterpartyName", "counterparty_name"], "Контрагент SQL"),
    fullName: textField(source, ["fullName", "full_name", "counterpartyName", "counterparty_name", "name"]),
    phone: textField(source, ["phone"]),
    email: textField(source, ["email"]),
    taxId: textField(source, ["taxId", "tax_id"]),
    sourceModule: textField(source, ["sourceModule", "source_module"]),
    sourceFile: textField(source, ["sourceFile", "source_file"]),
    importedAt: textField(source, ["importedAt", "imported_at"]),
    isDeleted: Boolean(source.isDeleted ?? source.is_deleted),
    source: textField(source, ["source"], "crm-sql-live")
  };
}

function normalizeLiveWarehouse(row) {
  const source = row || {};
  const warehouseCode = textField(source, ["warehouseCode", "warehouse_code", "code", "id"]);
  return {
    id: textField(source, ["id", "warehouseCode", "warehouse_code", "code"], warehouseCode),
    warehouseCode,
    warehouseName: textField(source, ["warehouseName", "warehouse_name", "name"], "Склад SQL"),
    sourceFile: textField(source, ["sourceFile", "source_file"]),
    importedAt: textField(source, ["importedAt", "imported_at"]),
    source: textField(source, ["source"], "crm-sql-live")
  };
}

function flatNavItems(items = navItems) {
  return items.flatMap((item) => Array.isArray(item) ? [item] : item.children || []);
}

function navIcon(id) {
  return NAV_ICONS[id] || id.slice(0, 2).toUpperCase();
}

function normalizeProduct(product) {
  const prices = normalizeProductPriceRows(product.prices);
  return {
    id: product.id || `p-${Date.now()}`,
    sqlId: product.sqlId || product.id || "",
    productCode: product.productCode || product.sku || product.sqlId || product.id || "",
    source: product.source || "sql",
    name: product.name || "Товар з SQL",
    sku: product.sku || product.id || `SKU-${Date.now()}`,
    barcode: product.barcode || "",
    qr: product.qr || "",
    category: product.category || "Інше",
    categoryPrimary: product.categoryPrimary || product.category || "Інше",
    categorySecondary: product.categorySecondary || "",
    supplyChannel: product.supplyChannel || "",
    importer: product.importer || "",
    isSparePart: Boolean(product.isSparePart),
    productGroupPath: product.productGroupPath || "",
    productFullPath: product.productFullPath || product.productGroupPath || "",
    productGroupCodePath: product.productGroupCodePath || "",
    productGroupLevel: Number(product.productGroupLevel || 0),
    productKind: product.productKind || "",
    productSeries: product.productSeries || "",
    productGroup: product.productGroup || product.category || "",
    characteristics: Array.isArray(product.characteristics) ? product.characteristics : [],
    prices,
    priceCurrencies: product.priceCurrencies || "",
    priceTypes: product.priceTypes || "",
    priceSummary: product.priceSummary || "",
    priceCurrency: normalizeCurrencyCode(product.priceCurrency || product.currency || product.priceCurrencies || prices[0]?.currency || BASE_CURRENCY),
    price: Number(product.price || 0),
    cost: Number(product.cost || 0),
    minStock: Number(product.minStock || 0),
    retailStockQty: Number(product.retailStockQty || 0),
    stockTotalQty: Number(product.stockTotalQty || 0),
    stockWholesaleQty: Number(product.stockWholesaleQty || 0)
  };
}

function normalizeCustomer(customer) {
  const source = customer.source || (customer.exportStatus ? "b2c" : "sql");
  return {
    id: customer.id || `c-${Date.now()}`,
    sqlId: customer.sqlId || "",
    counterpartyCode: customer.counterpartyCode || customer.id || "",
    name: customer.name || "Покупець",
    phone: customer.phone || "",
    email: customer.email || "",
    loyalty: LOYALTY_DISCOUNTS[customer.loyalty] !== undefined ? customer.loyalty : "standard",
    contracts: Array.isArray(customer.contracts) ? customer.contracts : [],
    settlements: Array.isArray(customer.settlements) ? customer.settlements : [],
    balance: Number(customer.balance || 0),
    balanceCurrency: customer.balanceCurrency || "UAH",
    source,
    exportStatus: customer.exportStatus || (source === "b2c" ? "pending" : "imported"),
    createdAt: customer.createdAt || nowIso(),
    exportedAt: customer.exportedAt || "",
    note: customer.note || ""
  };
}

function normalizeStockBalance(row) {
  const qty = Number(row.availableQty ?? row.available_quantity ?? row.availableQuantity ?? row.qty ?? row.quantity ?? 0);
  return {
    productId: row.productId || row.product_id || row.productCode || row.product_code || "",
    productCode: row.productCode || row.product_code || row.sku || "",
    productName: row.productName || row.product_name || row.name || "",
    warehouseCode: String(row.warehouseCode || row.warehouse_code || row.warehouseId || row.warehouse_id || SQL_MAIN_WAREHOUSE_CODE),
    warehouseName: row.warehouseName || row.warehouse_name || row.warehouse || SQL_MAIN_WAREHOUSE_NAME,
    qty,
    availableQty: qty,
    reservedQty: Number(row.reservedQty ?? row.reserved_qty ?? row.reservedQuantity ?? row.reserved_quantity ?? 0),
    quantity: Number(row.quantity ?? row.qty ?? qty),
    snapshotAt: row.snapshotAt || row.snapshot_at || "",
    sourceFile: row.sourceFile || row.source_file || "",
    importedAt: row.importedAt || row.imported_at || "",
    source: row.source || ""
  };
}

function normalizeSerialStock(row) {
  const quantity = Number(row.availableQty ?? row.available_qty ?? row.quantity ?? row.qty ?? 0);
  return {
    productId: row.productId || row.product_id || row.productCode || row.product_code || "",
    productCode: row.productCode || row.product_code || row.sku || "",
    productName: row.productName || row.product_name || row.name || "",
    warehouseCode: String(row.warehouseCode || row.warehouse_code || row.warehouseId || row.warehouse_id || ""),
    warehouseName: row.warehouseName || row.warehouse_name || row.warehouse || "",
    serialName: row.serialName || row.serial_name || row.serialNumber || row.serial_number || row.serial || "",
    serialNumber: row.serialNumber || row.serial_number || row.serialName || row.serial_name || row.serial || "",
    quantity,
    availableQty: quantity,
    balanceSign: row.balanceSign || row.balance_sign || (quantity > 0 ? "positive" : quantity < 0 ? "negative" : "zero"),
    source: row.source || ""
  };
}

function normalizeCheckoutLine(line) {
  const serialOptions = Array.isArray(line.serialOptions) ? line.serialOptions.map(normalizeSerialStock) : [];
  const priceOptions = normalizePriceOptions(line.priceOptions, "attached-price");
  return {
    lineId: line.lineId || `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: line.productId || "",
    productCode: line.productCode || "",
    sku: line.sku || "",
    sqlId: line.sqlId || "",
    qty: Math.max(1, Number(line.qty || 1)),
    price: Number(line.price || 0),
    priceCurrency: normalizeCurrencyCode(line.priceCurrency || BASE_CURRENCY),
    sourcePrice: Number(line.sourcePrice ?? line.price ?? 0),
    sourceCurrency: normalizeCurrencyCode(line.sourceCurrency || line.priceCurrency || BASE_CURRENCY),
    exchangeRate: Number(line.exchangeRate || 1),
    exchangeRateDate: line.exchangeRateDate || "",
    priceSource: line.priceSource || "",
    priceOptionId: line.priceOptionId || "",
    priceOptions,
    selectedPriceType: normalizePriceTypeLabel(line.selectedPriceType || DEFAULT_CHECKOUT_PRICE_TYPE),
    selectedPriceCurrency: normalizeCurrencyCode(line.selectedPriceCurrency || line.sourceCurrency || line.priceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY),
    priceWarning: line.priceWarning || "",
    discount: discountPercentValue(line.discountPercent ?? line.discount ?? 0),
    warehouseCode: line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: line.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
    warehouseStockQty: Number(line.warehouseStockQty ?? line.availableQty ?? 0),
    warehouseReservedQty: Number(line.warehouseReservedQty || 0),
    stockLoading: Boolean(line.stockLoading),
    stockError: line.stockError || "",
    stockSource: line.stockSource || "",
    serialName: line.serialName || line.serialNumber || "",
    serialNumber: line.serialNumber || line.serialName || "",
    serialOptions,
    serialLoading: Boolean(line.serialLoading),
    serialError: line.serialError || ""
  };
}

function normalizeEmployee(employee) {
  const role = EMPLOYEE_ROLES[employee.role] ? employee.role : "seller";
  const status = EMPLOYEE_STATUSES[employee.status] ? employee.status : "active";
  return {
    id: employee.id || `e-${Date.now()}`,
    code: employee.code || `EMP-${Date.now()}`,
    name: employee.name || "Працівник",
    role,
    phone: employee.phone || "",
    email: employee.email || "",
    login: employee.login || "",
    pin: employee.pin || "",
    status,
    store: employee.store || "B2C магазин",
    schedule: employee.schedule || "",
    hireDate: employee.hireDate || today(),
    note: employee.note || "",
    createdAt: employee.createdAt || nowIso()
  };
}

function normalizeRolePermissions(input, schemaVersion = ROLE_PERMISSION_SCHEMA) {
  const base = defaultRolePermissions();
  const knownBlocks = new Set(ROLE_BLOCKS.map((block) => block.id));
  const knownActions = new Set(ROLE_ACTIONS.map((action) => action.id));
  const shouldBackfillSchemaActions = schemaVersion !== ROLE_PERMISSION_SCHEMA;
  return Object.fromEntries(Object.entries(base).map(([roleId, defaults]) => {
    const source = input?.[roleId] || defaults;
    const sourceBlocks = Array.isArray(source.blocks)
      ? source.blocks.map((id) => VIEW_ALIASES[id] || id).filter((id) => knownBlocks.has(id))
      : [...defaults.blocks];
    const sourceActions = Array.isArray(source.actions) ? source.actions.filter((id) => knownActions.has(id)) : [...defaults.actions];
    const schemaBlocks = shouldBackfillSchemaActions
      ? defaults.blocks.filter((id) => SCHEMA_DEFAULT_BLOCKS.includes(id))
      : [];
    const schemaActions = shouldBackfillSchemaActions
      ? defaults.actions.filter((id) => SCHEMA_DEFAULT_ACTIONS.includes(id))
      : [];
    return [
      roleId,
      {
        blocks: Array.from(new Set([...sourceBlocks, ...schemaBlocks])),
        actions: Array.from(new Set([...sourceActions, ...schemaActions]))
      }
    ];
  }));
}

function normalizeListUi(input) {
  const sortFields = new Set(["id", "date", "customer", "amount", "method", "status"]);
  return Object.fromEntries(Object.entries(seedState.listUi).map(([key, defaults]) => {
    const source = input?.[key] || {};
    const sortBy = sortFields.has(source.sortBy) ? source.sortBy : defaults.sortBy;
    const sortDir = source.sortDir === "asc" ? "asc" : "desc";
    return [
      key,
      {
        collapsed: Boolean(source.collapsed),
        sortBy,
        sortDir,
        date: source.date || "",
        customer: source.customer || ""
      }
    ];
  }));
}

function normalizeExchange(input) {
  const source = input || {};
  const automation = source.automation || {};
  const intervals = new Set(["manual", "hourly", "daily", "weekly"]);
  const responsibleRoles = new Set(Object.keys(EMPLOYEE_ROLES));
  return {
    process: {
      ...clone(seedState.exchange.process),
      ...(source.process || {}),
      progress: Math.max(0, Math.min(100, Number(source.process?.progress || 0)))
    },
    automation: {
      ...clone(seedState.exchange.automation),
      ...automation,
      enabled: Boolean(automation.enabled),
      interval: intervals.has(automation.interval) ? automation.interval : seedState.exchange.automation.interval,
      importProducts: automation.importProducts !== false,
      importStock: automation.importStock !== false,
      importCounterparties: automation.importCounterparties !== false,
      exportSales: Boolean(automation.exportSales),
      exportInventory: Boolean(automation.exportInventory),
      exportCustomers: Boolean(automation.exportCustomers),
      notifyResponsible: automation.notifyResponsible !== false,
      responsibleRole: responsibleRoles.has(automation.responsibleRole) ? automation.responsibleRole : seedState.exchange.automation.responsibleRole
    },
    records: Array.isArray(source.records) ? source.records.map(normalizeExchangeRecord).slice(0, 80) : []
  };
}

function normalizeExchangeRecord(record) {
  return {
    id: record.id || nextId("EXCH", []),
    direction: ["import", "export"].includes(record.direction) ? record.direction : "import",
    dataset: record.dataset || "Дані",
    source: record.source || "",
    destination: record.destination || "",
    status: ["queued", "running", "done", "error"].includes(record.status) ? record.status : "done",
    rows: Number(record.rows || 0),
    startedAt: record.startedAt || nowIso(),
    finishedAt: record.finishedAt || record.startedAt || nowIso(),
    actor: record.actor || "system",
    details: record.details || ""
  };
}

function normalizeReceipt(receipt, products) {
  if (Array.isArray(receipt.lines)) {
    const lines = receipt.lines.map((line) => {
      const discount = discountPercentValue(line.discountPercent ?? line.discount ?? 0);
      return {
        productId: line.productId,
        qty: Number(line.qty || 0),
        price: Number(line.price || 0),
        discount,
        discountPercent: discount,
        total: Number(line.total || 0),
        warehouseCode: line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
        warehouseName: line.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
        warehouseStockQty: Number(line.warehouseStockQty || 0),
        serialName: line.serialName || line.serialNumber || "",
        serialNumber: line.serialNumber || line.serialName || ""
      };
    });
    const linesTotal = lines.reduce((sum, line) => {
      const gross = Number(line.qty || 0) * Number(line.price || 0);
      const fallbackTotal = roundCurrencyAmount(Math.max(0, gross * (1 - discountPercentValue(line.discount) / 100)));
      return sum + Number(line.total || fallbackTotal || 0);
    }, 0);
    return {
      ...receipt,
      customerId: receipt.customerId || "walk-in",
      paymentMethod: receipt.paymentMethod || "card",
      status: receipt.status || "posted",
      lines,
      total: Number(receipt.total || linesTotal),
      subtotal: Number(receipt.subtotal || linesTotal),
      loyaltyDiscount: Number(receipt.loyaltyDiscount || 0),
      note: receipt.note || "",
      shiftId: receipt.shiftId || "",
      createdAt: receipt.createdAt || nowIso()
    };
  }
  const product = products.find((item) => item.id === receipt.productId) || products[0] || EMPTY_PRODUCT;
  const qty = Number(receipt.qty || 1);
  const price = Number(receipt.price || product.price || 0);
  return {
    id: receipt.id,
    date: receipt.date || today(),
    customerId: receipt.customerId || "walk-in",
    paymentMethod: receipt.paymentMethod || "card",
    status: receipt.status || "posted",
    lines: product.id ? [{ productId: receipt.productId || product.id, qty, price, discount: 0, total: qty * price }] : [],
    total: Number(receipt.total || qty * price),
    note: receipt.note || "",
    shiftId: receipt.shiftId || "",
    createdAt: receipt.createdAt || nowIso()
  };
}

function normalizeReturnDoc(item) {
  return {
    id: item.id || nextId("RET", []),
    date: item.date || today(),
    receiptId: item.receiptId || "",
    lines: Array.isArray(item.lines) ? item.lines.map((line) => ({
      productId: line.productId,
      qty: Number(line.qty || 0),
      price: Number(line.price || 0),
      total: Number(line.total || 0)
    })) : [],
    total: Number(item.total || 0),
    reason: item.reason || "повернення",
    refundMethod: ["cash", "card"].includes(item.refundMethod) ? item.refundMethod : (item.paymentMethod === "cash" ? "cash" : "card"),
    sourcePaymentMethod: item.sourcePaymentMethod || item.paymentMethod || "",
    shiftId: item.shiftId || "",
    createdAt: item.createdAt || nowIso()
  };
}

function normalizeShift(shift) {
  return {
    ...shift,
    cashierId: shift.cashierId || "",
    cashier: shift.cashier || "Каса магазину",
    cashierRole: shift.cashierRole || "",
    openingCash: Number(shift.openingCash || 0),
    cashSales: Number(shift.cashSales || 0),
    cardSales: Number(shift.cardSales || 0),
    bankSales: Number(shift.bankSales || 0),
    cashReturns: Number(shift.cashReturns || 0),
    cardReturns: Number(shift.cardReturns || 0),
    bankReturns: Number(shift.bankReturns || 0),
    actualCash: Number(shift.actualCash || 0)
  };
}

function normalizeStockReceipt(receipt) {
  return {
    id: receipt.id || nextId("RCV-SQL", []),
    sqlId: receipt.sqlId || receipt.id || "",
    source: receipt.source || "sql",
    date: receipt.date || today(),
    supplier: receipt.supplier || SQL_STOCK_RECEIPT_SOURCE,
    productId: receipt.productId || "",
    qty: Number(receipt.qty || 0),
    warehouseCode: receipt.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: receipt.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
    note: receipt.note || "",
    createdAt: receipt.createdAt || nowIso()
  };
}

function normalizeInventory(inventory, products, stockRows) {
  const sourceLines = Array.isArray(inventory?.lines) ? inventory.lines : [];
  const lines = [];
  sourceLines.forEach((line) => {
    const product = products.find((item) => item.id === line.productId);
    if (!product) return;
    const warehouseCode = String(line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE);
    const warehouseName = line.warehouseName || (warehouseCode === SQL_MAIN_WAREHOUSE_CODE ? SQL_MAIN_WAREHOUSE_NAME : "Склад");
    const serialName = String(line.serialName || line.serialNumber || "");
    const lineKey = line.lineKey || inventoryLineKey(product.id, warehouseCode, serialName);
    if (lines.some((item) => inventoryLineKeyForLine(item) === lineKey)) return;
    const actualValue = line.actualQty;
    const expectedQty = serialName
      ? Number(line.expectedQty ?? line.quantity ?? 1)
      : stockQtyFromRows(stockRows, product.id, warehouseCode);
    lines.push({
      lineKey,
      productId: product.id,
      warehouseCode,
      warehouseName,
      serialName,
      serialNumber: line.serialNumber || serialName,
      expectedQty,
      actualQty: actualValue === "" || actualValue === undefined || actualValue === null ? "" : Number(actualValue)
    });
  });
  return {
    id: inventory?.id || "INV-DRAFT",
    date: inventory?.date || today(),
    search: inventory?.search || "",
    scan: inventory?.scan || "",
    addSearch: inventory?.addSearch || "",
    warehouseCodes: inventorySelectedWarehouseCodes(inventory),
    printedAt: inventory?.printedAt || "",
    lines,
    resorts: Array.isArray(inventory?.resorts) ? inventory.resorts.map(normalizeInventoryResort) : []
  };
}

function normalizeInventoryDoc(doc) {
  return {
    id: doc.id || nextId("INV", []),
    date: doc.date || today(),
    createdAt: doc.createdAt || nowIso(),
    lines: Array.isArray(doc.lines) ? doc.lines : [],
    totalDiff: Number(doc.totalDiff || 0),
    positiveDiff: Number(doc.positiveDiff || 0),
    negativeDiff: Number(doc.negativeDiff || 0),
    totalAmountDiff: Number(doc.totalAmountDiff || 0),
    positiveAmount: Number(doc.positiveAmount || 0),
    negativeAmount: Number(doc.negativeAmount || 0),
    resorts: Array.isArray(doc.resorts) ? doc.resorts.map(normalizeInventoryResort) : [],
    appliedToStock: doc.appliedToStock !== false,
    stockAdjustments: Array.isArray(doc.stockAdjustments) ? doc.stockAdjustments : []
  };
}

function normalizeInventoryResort(item) {
  return {
    id: item.id || `RSRT-${Date.now()}`,
    fromProductId: item.fromProductId || "",
    toProductId: item.toProductId || "",
    qty: Number(item.qty || 1),
    fromPrice: Number(item.fromPrice || 0),
    toPrice: Number(item.toPrice || 0),
    minusAmount: Number(item.minusAmount || 0),
    plusAmount: Number(item.plusAmount || 0),
    netAmount: Number(item.netAmount || 0),
    note: item.note || "",
    createdAt: item.createdAt || nowIso()
  };
}

function stockQtyFromRows(stockRows, productId, warehouseCode = SQL_MAIN_WAREHOUSE_CODE) {
  return (stockRows || [])
    .filter((item) => item.productId === productId && (
      item.warehouseCode ? String(item.warehouseCode) === String(warehouseCode || SQL_MAIN_WAREHOUSE_CODE) : String(warehouseCode || SQL_MAIN_WAREHOUSE_CODE) === SQL_MAIN_WAREHOUSE_CODE
    ))
    .reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function saveState(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options.server !== false) queueServerStateSave();
}

function apiBaseUrl() {
  const configured = state.systemSettings?.apiBaseUrl || "";
  return configured.replace(/\/+$/, "");
}

function apiEndpoint(path) {
  const base = apiBaseUrl();
  if (window.location.protocol === "file:" && !base) return "";
  return `${base}${path}`;
}

function appServedByHttpServer() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function serverModeEnabled() {
  if (!apiEndpoint("/api/health")) return false;
  if (appServedByHttpServer()) return true;
  return state.systemSettings?.mode !== "local";
}

function serverSyncLabel() {
  if (!serverModeEnabled()) return "Локальний режим";
  if (serverSync.saving) return "Збереження на сервері";
  if (serverSync.online) return `Сервер online · rev ${serverSync.revision}`;
  return serverSync.error ? `Сервер offline · ${serverSync.error}` : "Очікує сервер";
}

function serverSyncClass() {
  if (!serverModeEnabled()) return "";
  return serverSync.online ? "good" : "warn";
}

function queueServerStateSave() {
  if (!serverModeEnabled()) return;
  serverSync.pending = true;
  window.clearTimeout(serverSync.timer);
  serverSync.timer = window.setTimeout(() => flushServerState(), 450);
}

async function fetchJson(path, options = {}) {
  const endpoint = apiEndpoint(path);
  if (!endpoint) throw new Error("API endpoint не налаштовано");
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(apiErrorMessage(payload, response));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function apiErrorMessage(payload = {}, response = {}) {
  const messages = {
    AUTH_INVALID_PIN: "Невірний пароль/PIN працівника.",
    EMPLOYEE_NOT_ACTIVE: "Працівника для входу не знайдено або він не активний.",
    USER_SESSION_REPLACED: "Сеанс працівника відкрито на іншому комп'ютері.",
    DEVICE_ID_REQUIRED: "Не вдалося визначити цей комп'ютер для входу.",
    STATE_NOT_INITIALIZED: "Серверний стан B2C ще не ініціалізовано."
  };
  return messages[payload.code] || payload.error || `${response.status} ${response.statusText}`;
}

function normalizeExchangeRate(row) {
  const currency = normalizeCurrencyCode(row.currency || row.cc || row.valcode || row.numericCode || row.numeric_code || BASE_CURRENCY);
  const numericCode = String(row.numericCode || row.numeric_code || row.r030 || "").trim();
  const rate = Number(row.rate || 0);
  if (!currency || !Number.isFinite(rate) || rate <= 0) return null;
  return {
    currency,
    numericCode,
    rate,
    name: row.name || row.txt || "",
    exchangedate: row.exchangedate || row.exchangeDate || row.exchange_date || "",
    source: row.source || "nbu"
  };
}

async function fetchExchangeRates(force = false) {
  if (exchangeRateLookup.loading && !force) return exchangeRateLookup.loading;
  if (!force && exchangeRateLookup.byCurrency.size) return exchangeRateLookup.items;
  const params = new URLSearchParams();
  if (force) params.set("force", "1");
  const path = `/api/live/exchange-rates${params.toString() ? `?${params.toString()}` : ""}`;
  exchangeRateLookup.loading = fetchJson(path)
    .then((payload) => {
      const rows = payloadItems(payload).map(normalizeExchangeRate).filter(Boolean);
      const items = rows.some((row) => row.currency === BASE_CURRENCY)
        ? rows
        : [{ currency: BASE_CURRENCY, numericCode: "980", rate: 1, name: "Українська гривня", exchangedate: "", source: "base-uah" }, ...rows];
      exchangeRateLookup.items = items;
      exchangeRateLookup.byCurrency = new Map();
      items.forEach((row) => {
        exchangeRateLookup.byCurrency.set(row.currency, row);
        if (row.numericCode) exchangeRateLookup.byCurrency.set(row.numericCode, row);
      });
      exchangeRateLookup.loadedAt = payload.loadedAt || nowIso();
      exchangeRateLookup.error = "";
      markServerOnline(payload);
      return items;
    })
    .catch((error) => {
      exchangeRateLookup.error = String(error?.message || error || "курси валют недоступні");
      markServerOffline(error);
      throw error;
    })
    .finally(() => {
      exchangeRateLookup.loading = null;
    });
  return exchangeRateLookup.loading;
}

function exchangeRateForCurrency(currency) {
  const normalized = normalizeCurrencyCode(currency);
  if (normalized === BASE_CURRENCY) {
    return { currency: BASE_CURRENCY, numericCode: "980", rate: 1, exchangedate: "", source: "base-uah" };
  }
  return exchangeRateLookup.byCurrency.get(normalized) || null;
}

function roundCurrencyAmount(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function discountPercentValue(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}

function liveProductLookupKeys(product) {
  if (!product) return [];
  return [
    productLookupValue(product),
    product.id,
    product.sqlId,
    product.productCode,
    product.sku,
    product.barcode,
    product.qr,
    product.name
  ].map(normalizeScanText).filter(Boolean);
}

function rememberLiveLookupProduct(product) {
  if (!product) return product;
  if (liveProductLookupCache.size > LIVE_PRODUCT_LOOKUP_CACHE_LIMIT) {
    liveProductLookupCache.clear();
  }
  liveProductLookupKeys(product).forEach((key) => liveProductLookupCache.set(key, product));
  return product;
}

function rememberLiveProduct(product) {
  const normalized = normalizeProduct(product);
  if (normalized.id) liveProductCache.set(normalized.id, normalized);
  rememberLiveLookupProduct(normalized);
  return normalized;
}

function productSearchPool() {
  const byId = new Map(state.products.map((product) => [product.id, product]));
  liveProductCache.forEach((product, id) => byId.set(id, product));
  return Array.from(byId.values());
}

function localProductLookupItems(query, limit = LIVE_PRODUCT_LOOKUP_LIMIT) {
  return productSearchPool()
    .filter((product) => productMatchesQuery(product, query))
    .filter(productHasMainWarehouseStock)
    .slice(0, Math.max(1, Math.min(100, Number(limit || LIVE_PRODUCT_LOOKUP_LIMIT))));
}

function cachedLiveLookupProducts() {
  return Array.from(new Set(liveProductLookupCache.values())).filter(productHasMainWarehouseStock);
}

function findExactCachedLiveLookupProduct(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const direct = liveProductLookupCache.get(raw);
  if (direct && productHasMainWarehouseStock(direct)) return direct;
  return cachedLiveLookupProducts().find((product) => (
    normalizeScanText(productLookupValue(product)) === raw
    || productScanTargets(product).some((target) => target === raw)
  )) || null;
}

function findCachedLiveLookupProduct(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  return findExactCachedLiveLookupProduct(value)
    || cachedLiveLookupProducts().find((product) => (
      productMatchesQuery(product, value)
      || productScanTargets(product).some((target) => raw.includes(target))
    ))
    || null;
}

function liveProductLookupSearchTerm(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cached = findExactCachedLiveLookupProduct(raw);
  if (cached) return liveProductCode(cached) || cached.productCode || cached.sku || raw;
  const numericCodes = normalizeScanText(raw).match(/\d{5,}/g) || [];
  const longestNumericCode = numericCodes.sort((left, right) => right.length - left.length)[0];
  return longestNumericCode || raw;
}

function currentProductLookupItems() {
  const query = state.checkout?.search || "";
  const liveQuery = liveProductLookup.query || "";
  if (serverModeEnabled()) {
    if (!String(query).trim()) return [];
    if (
      normalizeScanText(query) === normalizeScanText(liveQuery)
      && Array.isArray(liveProductLookup.items)
      && liveProductLookup.source
    ) {
      return liveProductLookup.items;
    }
    return [];
  }
  return localProductLookupItems(query);
}

function productLookupStatusText() {
  const query = String(state.checkout?.search || "").trim();
  if (!query) return serverModeEnabled()
    ? `Live API готовий: введіть назву, SKU або штрихкод. У списку тільки ${SQL_MAIN_WAREHOUSE_NAME} > 0.`
    : `Fallback local/demo: тільки товари із залишком ${SQL_MAIN_WAREHOUSE_NAME}.`;
  if (liveProductLookup.loading) return `Live API: шукаю товари із залишком ${SQL_MAIN_WAREHOUSE_NAME}...`;
  if (serverModeEnabled() && !liveProductLookup.error && liveProductLookup.source) {
    if (!liveProductLookup.items.length) return `Live API: товарів із залишком ${SQL_MAIN_WAREHOUSE_NAME} не знайдено`;
    return `Live API: ${liveProductLookup.items.length} з ${liveProductLookup.total} із залишком ${SQL_MAIN_WAREHOUSE_NAME} · limit ${liveProductLookup.limit}`;
  }
  if (liveProductLookup.error) return serverModeEnabled()
    ? `Live API: ${liveProductLookup.error}. Локальний список не підмішується.`
    : `Fallback local/demo: ${liveProductLookup.error}`;
  return `Fallback local/demo: ${localProductLookupItems(query).length} товарів із залишком`;
}

function productLookupStatusClass() {
  if (liveProductLookup.loading) return "warn";
  if (serverModeEnabled() && !liveProductLookup.error && liveProductLookup.source) return "good";
  return "warn";
}

function renderProductLookupOptions() {
  const datalist = document.getElementById("product-options");
  if (datalist) {
    datalist.innerHTML = currentProductLookupItems()
      .map((product) => `<option value="${escapeHtml(productLookupValue(product))}"></option>`)
      .join("");
  }
  const status = document.querySelector("[data-product-lookup-status]");
  if (status) {
    status.textContent = productLookupStatusText();
    status.classList.toggle("good", productLookupStatusClass() === "good");
    status.classList.toggle("warn", productLookupStatusClass() === "warn");
  }
}

function liveCounterpartyIdentity(counterparty) {
  return String(
    counterparty?.counterpartyCode
    || counterparty?.sqlId
    || counterparty?.id
    || counterparty?.phone
    || counterparty?.email
    || counterparty?.name
    || ""
  ).trim();
}

function customerFromLiveCounterparty(row) {
  const counterparty = normalizeLiveCounterparty(row);
  const identity = liveCounterpartyIdentity(counterparty) || `live-${Date.now()}`;
  return normalizeCustomer({
    id: String(identity).startsWith("sql-") ? identity : `sql-${identity}`,
    sqlId: counterparty.sqlId || counterparty.id,
    counterpartyCode: counterparty.counterpartyCode || counterparty.id,
    name: counterparty.name || counterparty.fullName,
    phone: counterparty.phone,
    email: counterparty.email,
    loyalty: "standard",
    contracts: [],
    settlements: [],
    balance: 0,
    balanceCurrency: "UAH",
    source: "sql-live",
    exportStatus: "imported",
    note: [counterparty.taxId, counterparty.sourceModule, counterparty.sourceFile].filter(Boolean).join(" · ")
  });
}

function customerIdentityKeys(customer) {
  return [
    customer?.id,
    customer?.counterpartyCode,
    customer?.sqlId,
    customer?.phone,
    customer?.email
  ].map(normalizeScanText).filter(Boolean);
}

function rememberLiveCustomer(customer) {
  const normalized = normalizeCustomer(customer);
  const keys = new Set(customerIdentityKeys(normalized));
  const existing = state.customers.find((item) => customerIdentityKeys(item).some((key) => keys.has(key)));
  if (!existing) {
    state.customers.unshift(normalized);
    return normalized;
  }
  if (existing.source === "b2c") return existing;
  Object.assign(existing, {
    ...existing,
    ...normalized,
    loyalty: existing.loyalty || normalized.loyalty,
    contracts: existing.contracts?.length ? existing.contracts : normalized.contracts,
    settlements: existing.settlements?.length ? existing.settlements : normalized.settlements,
    exportStatus: "imported"
  });
  return existing;
}

function customerSearchPool() {
  const byKey = new Map();
  const add = (customer) => {
    const normalized = normalizeCustomer(customer);
    const key = customerIdentityKeys(normalized)[0] || normalized.id;
    if (key && !byKey.has(key)) byKey.set(key, normalized);
  };
  state.customers.forEach(add);
  liveCustomerLookup.items.forEach(add);
  liveTable("counterparties").items.map(customerFromLiveCounterparty).forEach(add);
  return Array.from(byKey.values());
}

function currentCustomerLookupItems() {
  const query = String(state.checkout?.customerSearch || "").trim();
  const queryKey = normalizeScanText(query);
  const liveKey = normalizeScanText(liveCustomerLookup.query);
  const pool = customerSearchPool();
  if (!query) {
    return pool.slice(0, LIVE_CUSTOMER_LOOKUP_LIMIT);
  }
  const cachedMatches = pool.filter((customer) => customerMatchesQuery(customer, query));
  const liveMatches = serverModeEnabled() && queryKey === liveKey && liveCustomerLookup.source
    ? liveCustomerLookup.items
    : [];
  const merged = new Map();
  [...cachedMatches, ...liveMatches].forEach((customer) => {
    const normalized = normalizeCustomer(customer);
    const key = customerIdentityKeys(normalized)[0] || normalized.id;
    if (key && !merged.has(key)) merged.set(key, normalized);
  });
  return Array.from(merged.values()).slice(0, LIVE_CUSTOMER_LOOKUP_LIMIT);
}

function customerLookupStatusText() {
  const query = String(state.checkout?.customerSearch || "").trim();
  if (!query) return serverModeEnabled()
    ? "Live API готовий: введіть ім'я, телефон, код або email клієнта."
    : "Fallback local/demo: тільки локальні B2C-картки.";
  if (liveCustomerLookup.loading) return "Live API: шукаю клієнтів у SQL...";
  if (serverModeEnabled() && !liveCustomerLookup.error && liveCustomerLookup.source) {
    if (!liveCustomerLookup.items.length) return "Live API: клієнтів за цим пошуком не знайдено";
    return `Live API: ${liveCustomerLookup.items.length} з ${liveCustomerLookup.total} клієнтів · limit ${liveCustomerLookup.limit}`;
  }
  if (liveCustomerLookup.error) return serverModeEnabled()
    ? `Live API: ${liveCustomerLookup.error}. Повний список у браузер не підмішується.`
    : `Fallback local/demo: ${liveCustomerLookup.error}`;
  return `Локально: ${currentCustomerLookupItems().length} карток`;
}

function customerLookupStatusClass() {
  if (liveCustomerLookup.loading) return "warn";
  if (serverModeEnabled() && !liveCustomerLookup.error && liveCustomerLookup.source) return "good";
  return "warn";
}

function renderCustomerLookupOptions() {
  const datalist = document.getElementById("customer-options");
  if (datalist) {
    datalist.innerHTML = currentCustomerLookupItems()
      .map((customer) => `<option value="${escapeHtml(customerLookupValue(customer))}"></option>`)
      .join("");
  }
  const status = document.querySelector("[data-customer-lookup-status]");
  if (status) {
    status.textContent = customerLookupStatusText();
    status.classList.toggle("good", customerLookupStatusClass() === "good");
    status.classList.toggle("warn", customerLookupStatusClass() === "warn");
  }
}

async function fetchLiveCustomers({ search = "", limit = LIVE_CUSTOMER_LOOKUP_LIMIT, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", String(Math.max(1, Math.min(100, Number(limit || LIVE_CUSTOMER_LOOKUP_LIMIT)))));
  params.set("offset", String(Math.max(0, Number(offset || 0))));
  const payload = await fetchJson(`/api/live/counterparties?${params.toString()}`);
  const items = payloadItems(payload).map(customerFromLiveCounterparty);
  markServerOnline(payload);
  return { ...payload, items };
}

async function queryLiveCustomers({ search = "", limit = LIVE_CUSTOMER_LOOKUP_LIMIT, offset = 0 } = {}) {
  const payload = await fetchLiveCustomers({ search, limit, offset });
  liveCustomerLookup.items = payload.items;
  liveCustomerLookup.total = Number(payload.total ?? payload.items.length);
  liveCustomerLookup.limit = Number(payload.limit || limit || LIVE_CUSTOMER_LOOKUP_LIMIT);
  liveCustomerLookup.offset = Number(payload.offset || offset || 0);
  liveCustomerLookup.query = search || "";
  liveCustomerLookup.source = payload.source || payload.sourceDetail || "crm-sql-live";
  liveCustomerLookup.fallback = Boolean(payload.fallback);
  liveCustomerLookup.error = "";
  liveCustomerLookup.lastLoadedAt = nowIso();
  return payload;
}

function queueLiveCustomerLookup(value) {
  const query = String(value || "").trim();
  window.clearTimeout(liveCustomerLookup.timer);
  liveCustomerLookup.query = query;
  if (!query) {
    liveCustomerLookup.items = [];
    liveCustomerLookup.total = 0;
    liveCustomerLookup.loading = false;
    liveCustomerLookup.error = "";
    liveCustomerLookup.source = "";
    renderCustomerLookupOptions();
    return;
  }
  if (!serverModeEnabled()) {
    liveCustomerLookup.items = state.customers.filter((customer) => customerMatchesQuery(customer, query)).slice(0, LIVE_CUSTOMER_LOOKUP_LIMIT);
    liveCustomerLookup.total = liveCustomerLookup.items.length;
    liveCustomerLookup.loading = false;
    liveCustomerLookup.error = "сервер не налаштовано";
    liveCustomerLookup.source = "local-demo";
    renderCustomerLookupOptions();
    return;
  }
  liveCustomerLookup.items = [];
  liveCustomerLookup.loading = true;
  liveCustomerLookup.error = "";
  liveCustomerLookup.source = "";
  const requestId = liveCustomerLookup.requestId + 1;
  liveCustomerLookup.requestId = requestId;
  renderCustomerLookupOptions();
  liveCustomerLookup.timer = window.setTimeout(async () => {
    try {
      await queryLiveCustomers({ search: query, limit: LIVE_CUSTOMER_LOOKUP_LIMIT, offset: 0 });
    } catch (error) {
      if (liveCustomerLookup.requestId !== requestId) return;
      liveCustomerLookup.items = [];
      liveCustomerLookup.total = 0;
      liveCustomerLookup.error = String(error?.message || error || "CRM SQL API недоступний");
      liveCustomerLookup.source = "";
      markServerOffline(error);
    } finally {
      if (liveCustomerLookup.requestId === requestId) {
        liveCustomerLookup.loading = false;
        renderCustomerLookupOptions();
      }
    }
  }, 250);
}

function findStockedLiveLookupProduct(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const items = Array.isArray(liveProductLookup.items)
    ? liveProductLookup.items.filter(productHasMainWarehouseStock)
    : [];
  return items.find((product) => normalizeScanText(productLookupValue(product)) === raw)
    || items.find((product) => productMatchesQuery(product, value))
    || findCachedLiveLookupProduct(value)
    || null;
}

async function queryLiveProducts({ search = "", barcode = "", limit = LIVE_PRODUCT_LOOKUP_LIMIT, offset = 0 } = {}) {
  const payload = await fetchLiveProducts({ search, barcode, limit, offset });
  liveProductLookup.items = payload.items;
  liveProductLookup.total = Number(payload.total ?? payload.items.length);
  liveProductLookup.limit = Number(payload.limit || limit || LIVE_PRODUCT_LOOKUP_LIMIT);
  liveProductLookup.offset = Number(payload.offset || offset || 0);
  liveProductLookup.query = search || barcode || "";
  liveProductLookup.barcode = barcode || "";
  liveProductLookup.source = payload.source || payload.sourceDetail || "backend";
  liveProductLookup.fallback = Boolean(payload.fallback);
  liveProductLookup.error = "";
  liveProductLookup.lastLoadedAt = nowIso();
  return payload;
}

async function fetchLiveProducts({ search = "", barcode = "", limit = LIVE_PRODUCT_LOOKUP_LIMIT, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (barcode) params.set("barcode", barcode);
  params.set("limit", String(Math.max(1, Math.min(100, Number(limit || LIVE_PRODUCT_LOOKUP_LIMIT)))));
  params.set("offset", String(Math.max(0, Number(offset || 0))));
  const payload = await fetchJson(`/api/products?${params.toString()}`);
  const items = payloadItems(payload).map(rememberLiveProduct);
  markServerOnline(payload);
  return { ...payload, items };
}

async function fetchLiveProductPricesForSale(product) {
  if (!serverModeEnabled()) return [];
  const productCode = liveProductCode(product);
  if (!productCode) return [];
  const params = new URLSearchParams({
    productCode,
    search: productCode,
    limit: "100",
    offset: "0"
  });
  try {
    const payload = await fetchJson(`/api/live/product-prices?${params.toString()}`);
    const target = normalizeScanText(productCode);
    const productName = normalizeScanText(product.name);
    const rows = payloadItems(payload).map(normalizeLivePrice).filter((row) => {
      const rowCode = normalizeScanText(row.productCode);
      const rowName = normalizeScanText(row.productName);
      return !rowCode || rowCode === target || rowName === productName;
    });
    markServerOnline(payload);
    return rows.map((row) => ({
      priceType: row.priceTypeName || row.priceTypeCode || "",
      currency: normalizeCurrencyCode(row.currency),
      currencyRaw: row.currency,
      price: Number(row.price || row.amount || 0)
    })).filter((row) => Number(row.price || 0) > 0);
  } catch (error) {
    return [];
  }
}

function stockLookupAvailableQty(row) {
  const qty = Number(row?.availableQty ?? row?.availableQuantity ?? row?.available_quantity ?? row?.qty ?? row?.quantity ?? row?.retailStockQty ?? 0);
  return Number.isFinite(qty) ? qty : 0;
}

function liveStockProductCode(row) {
  return String(row?.productCode || row?.product_code || row?.sku || row?.productId || row?.product_id || "").trim();
}

function mergeLiveProductWithStock(product, row) {
  const stockQtyValue = stockLookupAvailableQty(row);
  const productCode = liveStockProductCode(row) || liveProductCode(product);
  return rememberLiveProduct({
    ...(product || {}),
    id: product?.id || productCode || `stock-${Date.now()}`,
    sqlId: product?.sqlId || product?.id || productCode || "",
    productCode: product?.productCode || productCode,
    sku: product?.sku || productCode,
    name: product?.name || row?.productName || row?.product_name || "Товар із залишком",
    source: product?.source || row?.source || "crm-sql-live-stock",
    retailStockQty: stockQtyValue,
    stockTotalQty: Math.max(Number(product?.stockTotalQty || 0), stockQtyValue)
  });
}

async function fetchLiveProductForStockRow(row) {
  const productCode = liveStockProductCode(row);
  if (!productCode) return mergeLiveProductWithStock(null, row);
  try {
    const payload = await fetchLiveProducts({ search: productCode, limit: 5, offset: 0 });
    const target = normalizeScanText(productCode);
    const exact = payload.items.find((product) => (
      normalizeScanText(product.productCode) === target
      || normalizeScanText(product.sku) === target
      || normalizeScanText(product.id) === target
      || normalizeScanText(product.barcode) === target
    ));
    return mergeLiveProductWithStock(exact || payload.items[0] || null, row);
  } catch (error) {
    return mergeLiveProductWithStock(null, row);
  }
}

async function enrichStockLookupProductForSale(product) {
  if (!serverModeEnabled()) return product;
  const productCode = liveProductCode(product);
  if (!productCode) return product;
  try {
    const payload = await fetchLiveProducts({ search: productCode, limit: 5, offset: 0 });
    const target = normalizeScanText(productCode);
    const exact = payload.items.find((item) => (
      normalizeScanText(item.productCode) === target
      || normalizeScanText(item.sku) === target
      || normalizeScanText(item.id) === target
      || normalizeScanText(item.barcode) === target
    ));
    return mergeLiveProductWithStock(exact || payload.items[0] || product, {
      productCode,
      productName: product.name,
      warehouseCode: SQL_MAIN_WAREHOUSE_CODE,
      warehouseName: SQL_MAIN_WAREHOUSE_NAME,
      availableQty: product.retailStockQty
    });
  } catch (error) {
    return product;
  }
}

async function queryLiveStockedProducts({ search = "", barcode = "", limit = LIVE_PRODUCT_LOOKUP_LIMIT, offset = 0 } = {}) {
  const lookup = String(search || barcode || "").trim();
  const params = new URLSearchParams({
    warehouseCode: SQL_MAIN_WAREHOUSE_CODE,
    limit: String(Math.max(1, Math.min(100, Number(limit || LIVE_PRODUCT_LOOKUP_LIMIT)))),
    offset: String(Math.max(0, Number(offset || 0)))
  });
  if (lookup) params.set("search", lookup);
  const payload = await fetchJson(`/api/live/stock-balances?${params.toString()}`);
  const seen = new Set();
  const stockRows = payloadItems(payload)
    .map(normalizeStockBalance)
    .filter((row) => String(row.warehouseCode) === SQL_MAIN_WAREHOUSE_CODE && stockLookupAvailableQty(row) > 0)
    .filter((row) => {
      const key = normalizeScanText(liveStockProductCode(row) || row.productName);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const items = stockRows
    .map((row) => mergeLiveProductWithStock(null, row))
    .filter(Boolean)
    .filter(productHasMainWarehouseStock);
  liveProductLookup.items = items;
  liveProductLookup.total = Number(payload.total ?? items.length);
  liveProductLookup.limit = Number(payload.limit || limit || LIVE_PRODUCT_LOOKUP_LIMIT);
  liveProductLookup.offset = Number(payload.offset || offset || 0);
  liveProductLookup.query = lookup;
  liveProductLookup.barcode = barcode || "";
  liveProductLookup.source = payload.source || payload.sourceDetail || "crm-sql-live-stock";
  liveProductLookup.fallback = false;
  liveProductLookup.error = "";
  liveProductLookup.lastLoadedAt = nowIso();
  markServerOnline(payload);
  return { ...payload, items };
}

function findProductByLiveStockIdentity(row) {
  const code = normalizeScanText(liveStockProductCode(row));
  if (!code) return null;
  return productSearchPool().find((product) => (
    normalizeScanText(product.id) === code
    || normalizeScanText(product.sqlId) === code
    || normalizeScanText(product.productCode) === code
    || normalizeScanText(product.sku) === code
    || normalizeScanText(product.barcode) === code
    || productScanTargets(product).includes(code)
  )) || null;
}

function upsertInventoryProductFromLiveStock(row) {
  const stockRowData = normalizeStockBalance(row);
  const stockCode = liveStockProductCode(stockRowData);
  const existing = findProductByLiveStockIdentity(stockRowData);
  const stockQtyValue = stockLookupAvailableQty(stockRowData);
  const product = normalizeProduct({
    ...(existing || {}),
    id: existing?.id || stockCode || stockRowData.productId || `stock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sqlId: existing?.sqlId || stockRowData.productId || stockCode || "",
    productCode: existing?.productCode || stockCode || stockRowData.productId || "",
    sku: existing?.sku || stockCode || stockRowData.productId || "",
    name: stockRowData.productName || existing?.name || stockCode || "Товар із залишком",
    source: existing?.source || stockRowData.source || "crm-sql-live-stock",
    retailStockQty: stockQtyValue,
    stockTotalQty: Math.max(Number(existing?.stockTotalQty || 0), stockQtyValue)
  });
  const index = state.products.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    state.products[index] = product;
  } else {
    state.products.push(product);
  }
  return rememberLiveProduct(product);
}

function upsertInventoryStockBalance(product, row) {
  const stockRowData = normalizeStockBalance({
    ...row,
    productId: product.id,
    productCode: product.productCode || product.sku || row.productCode,
    productName: product.name || row.productName,
    warehouseCode: row.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: row.warehouseName || SQL_MAIN_WAREHOUSE_NAME
  });
  const productCodeKey = normalizeScanText(stockRowData.productCode || product.productCode || product.sku);
  const warehouseCode = String(stockRowData.warehouseCode || SQL_MAIN_WAREHOUSE_CODE);
  const existing = state.stock.find((item) => {
    const sameWarehouse = item.warehouseCode ? String(item.warehouseCode) === warehouseCode : warehouseCode === SQL_MAIN_WAREHOUSE_CODE;
    if (!sameWarehouse) return false;
    if (item.productId === product.id) return true;
    const itemCode = normalizeScanText(item.productCode || item.productId);
    return Boolean(productCodeKey && itemCode === productCodeKey);
  });
  if (existing) {
    Object.assign(existing, stockRowData);
  } else {
    state.stock.push(stockRowData);
  }
  return stockRowData;
}

function inventoryProductHasLocalSerials(product, warehouseCode) {
  const targetCode = normalizeScanText(liveProductCode(product));
  return state.serialStock.some((row) => {
    const serial = normalizeSerialStock(row);
    if (warehouseCode && String(serial.warehouseCode) !== String(warehouseCode)) return false;
    if (Number(serial.quantity || 0) <= 0 || !serial.serialName) return false;
    const rowCode = normalizeScanText(serial.productCode || serial.productId);
    return Boolean(targetCode && rowCode === targetCode) || serial.productId === product.id;
  });
}

function productMayHaveSerialNumbers(product) {
  const text = normalizeScanText(productCategoryText(product));
  return text.includes("серійн")
    || text.includes("серийн")
    || text.includes("serial")
    || text.includes("s/n")
    || text.includes("sn ");
}

function productNeedsInventorySerialRows(product, warehouseCode) {
  return isWeaponProduct(product)
    || productMayHaveSerialNumbers(product)
    || inventoryProductHasLocalSerials(product, warehouseCode);
}

function upsertInventorySerialStock(product, row) {
  const serial = normalizeSerialStock({
    ...row,
    productId: product.id,
    productCode: product.productCode || product.sku || row.productCode,
    productName: product.name || row.productName,
    warehouseCode: row.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: row.warehouseName || SQL_MAIN_WAREHOUSE_NAME
  });
  if (!serial.serialName) return null;
  const key = inventoryLineKey(product.id, serial.warehouseCode, serial.serialName);
  const index = state.serialStock.findIndex((item) => inventoryLineKey(
    item.productId,
    item.warehouseCode,
    item.serialName || item.serialNumber
  ) === key);
  if (index >= 0) state.serialStock[index] = serial;
  else state.serialStock.push(serial);
  return serial;
}

async function fetchLiveInventorySerialPage(product, warehouseCode, offset) {
  const productCode = liveProductCode(product);
  if (!productCode) return { rows: [], offset, nextOffset: null, total: 0, payload: { hasMore: false } };
  const params = new URLSearchParams({
    productCode,
    warehouseCode: String(warehouseCode || SQL_MAIN_WAREHOUSE_CODE),
    limit: String(LIVE_INVENTORY_SERIAL_PAGE_LIMIT),
    offset: String(Math.max(0, Number(offset || 0)))
  });
  const payload = await fetchJson(`/api/live/serial-stock?${params.toString()}`);
  markServerOnline(payload);
  const rows = payloadItems(payload)
    .map((item) => normalizeSerialStock({
      ...item,
      productId: product.id,
      productCode,
      productName: product.name,
      warehouseCode: item.warehouseCode || warehouseCode,
      warehouseName: item.warehouseName || warehouseNameByCode(warehouseCode)
    }))
    .filter((item) => item.serialName && String(item.warehouseCode) === String(warehouseCode) && Number(item.quantity || 0) > 0);
  return {
    payload,
    rows,
    offset: Math.max(0, Number(payload.offset || offset || 0)),
    nextOffset: payload.nextOffset === null || payload.nextOffset === undefined ? null : Number(payload.nextOffset),
    total: Math.max(0, Number(payload.total || rows.length))
  };
}

async function fetchAllLiveInventorySerialRows(product, warehouseCode) {
  const rows = [];
  const firstPage = await fetchLiveInventorySerialPage(product, warehouseCode, 0);
  rows.push(...firstPage.rows);
  let offset = firstPage.nextOffset;
  const seenOffsets = new Set([firstPage.offset]);
  while (firstPage.payload.hasMore && Number.isFinite(offset) && !seenOffsets.has(offset)) {
    seenOffsets.add(offset);
    const page = await fetchLiveInventorySerialPage(product, warehouseCode, offset);
    rows.push(...page.rows);
    if (!page.payload.hasMore || !Number.isFinite(page.nextOffset) || page.nextOffset <= offset) break;
    offset = page.nextOffset;
  }
  return rows;
}

async function applyLiveStockRowsToInventory(rows) {
  const grouped = new Map();
  const selectedWarehouses = new Set(inventorySelectedWarehouseCodes());
  rows.forEach((sourceRow) => {
    const row = normalizeStockBalance(sourceRow);
    if (!selectedWarehouses.has(String(row.warehouseCode)) || stockLookupAvailableQty(row) <= 0) return;
    const product = upsertInventoryProductFromLiveStock(row);
    if (!product?.id) return;
    const key = `${product.id}::${row.warehouseCode || SQL_MAIN_WAREHOUSE_CODE}`;
    const current = grouped.get(key) || {
      product,
      row: {
        ...row,
        productId: product.id,
        productCode: product.productCode || product.sku || row.productCode,
        productName: product.name || row.productName
      },
      qty: 0,
      reservedQty: 0
    };
    current.qty += stockLookupAvailableQty(row);
    current.reservedQty += Number(row.reservedQty || 0);
    grouped.set(key, current);
  });

  let added = 0;
  let updated = 0;
  let serialLines = 0;
  for (const entry of grouped.values()) {
    const stockRowData = {
      ...entry.row,
      qty: entry.qty,
      availableQty: entry.qty,
      quantity: entry.qty,
      reservedQty: entry.reservedQty
    };
    upsertInventoryStockBalance(entry.product, stockRowData);
    const warehouseCode = String(stockRowData.warehouseCode || SQL_MAIN_WAREHOUSE_CODE);
    const warehouseName = stockRowData.warehouseName || warehouseNameByCode(warehouseCode);
    let serialRows = [];
    if (productNeedsInventorySerialRows(entry.product, warehouseCode)) {
      try {
        serialRows = await fetchAllLiveInventorySerialRows(entry.product, warehouseCode);
      } catch (error) {
        serialRows = state.serialStock
          .map(normalizeSerialStock)
          .filter((row) => row.serialName && String(row.warehouseCode) === warehouseCode && Number(row.quantity || 0) > 0 && (
            row.productId === entry.product.id
            || normalizeScanText(row.productCode || row.productId) === normalizeScanText(liveProductCode(entry.product))
          ));
      }
    }
    if (serialRows.length) {
      for (const serialRow of serialRows) {
        const serial = upsertInventorySerialStock(entry.product, {
          ...serialRow,
          warehouseCode,
          warehouseName
        });
        if (!serial) continue;
        const lineKey = inventoryLineKey(entry.product.id, warehouseCode, serial.serialName);
        const existed = state.inventory.lines.some((line) => inventoryLineKeyForLine(line) === lineKey);
        const line = inventoryLineForProduct(entry.product.id, {
          warehouseCode,
          warehouseName,
          serialName: serial.serialName,
          serialNumber: serial.serialNumber,
          expectedQty: Math.max(1, Number(serial.quantity || 1))
        });
        line.expectedQty = Math.max(1, Number(serial.quantity || 1));
        if (existed) updated += 1;
        else added += 1;
        serialLines += 1;
      }
      continue;
    }
    const lineKey = inventoryLineKey(entry.product.id, warehouseCode);
    const existed = state.inventory.lines.some((line) => inventoryLineKeyForLine(line) === lineKey);
    const line = inventoryLineForProduct(entry.product.id, {
      warehouseCode,
      warehouseName,
      expectedQty: stockQty(entry.product.id, warehouseCode)
    });
    line.expectedQty = stockQty(entry.product.id, warehouseCode);
    if (existed) updated += 1;
    else added += 1;
  }

  return { added, updated, products: grouped.size, sourceRows: rows.length, serialLines };
}

async function fetchLiveInventoryStockPage(offset, warehouseCode = SQL_MAIN_WAREHOUSE_CODE) {
  const params = new URLSearchParams({
    warehouseCode: String(warehouseCode || SQL_MAIN_WAREHOUSE_CODE),
    limit: String(LIVE_INVENTORY_STOCK_PAGE_LIMIT),
    offset: String(Math.max(0, Number(offset || 0)))
  });
  const payload = await fetchJson(`/api/live/stock-balances?${params.toString()}`);
  markServerOnline(payload);
  return {
    payload,
    rows: payloadItems(payload),
    limit: Math.max(1, Number(payload.limit || LIVE_INVENTORY_STOCK_PAGE_LIMIT)),
    offset: Math.max(0, Number(payload.offset || offset || 0)),
    nextOffset: payload.nextOffset === null || payload.nextOffset === undefined ? null : Number(payload.nextOffset),
    total: Math.max(0, Number(payload.total || 0)),
    warehouseCode: String(warehouseCode || SQL_MAIN_WAREHOUSE_CODE)
  };
}

async function fetchRemainingLiveInventoryStockRowsSequential(firstPage, warehouseCode = SQL_MAIN_WAREHOUSE_CODE) {
  const rows = [];
  const seenOffsets = new Set([firstPage.offset]);
  let offset = firstPage.nextOffset;
  while (Number.isFinite(offset) && offset > firstPage.offset) {
    if (seenOffsets.has(offset)) {
      throw new Error(`Live API повернув повторний offset ${offset}; зупинено, щоб не зациклити інвентаризацію.`);
    }
    seenOffsets.add(offset);
    const page = await fetchLiveInventoryStockPage(offset, warehouseCode);
    rows.push(...page.rows);
    inventoryAddAllStockStatus.loaded += page.rows.length;
    inventoryAddAllStockStatus.total = Math.max(inventoryAddAllStockStatus.total, page.total, inventoryAddAllStockStatus.loaded);
    if (!page.payload.hasMore || !page.rows.length || !Number.isFinite(page.nextOffset) || page.nextOffset <= offset) break;
    offset = page.nextOffset;
  }
  return rows;
}

async function fetchAllLiveInventoryStockRowsForWarehouse(warehouseCode) {
  const firstPage = await fetchLiveInventoryStockPage(0, warehouseCode);
  const rows = [...firstPage.rows];
  inventoryAddAllStockStatus.loaded += rows.length;
  inventoryAddAllStockStatus.total += Math.max(firstPage.total, rows.length);
  if (!firstPage.payload.hasMore || !rows.length) return rows;

  if (!firstPage.total || firstPage.total <= firstPage.limit || !Number.isFinite(firstPage.limit)) {
    rows.push(...await fetchRemainingLiveInventoryStockRowsSequential(firstPage, warehouseCode));
    return rows;
  }

  const offsets = [];
  for (let offset = firstPage.nextOffset || firstPage.limit; offset < firstPage.total; offset += firstPage.limit) {
    offsets.push(offset);
  }
  for (let index = 0; index < offsets.length; index += LIVE_INVENTORY_STOCK_PAGE_CONCURRENCY) {
    const batchOffsets = offsets.slice(index, index + LIVE_INVENTORY_STOCK_PAGE_CONCURRENCY);
    const pages = await Promise.all(batchOffsets.map((offset) => fetchLiveInventoryStockPage(offset, warehouseCode)));
    pages
      .sort((left, right) => left.offset - right.offset)
      .forEach((page) => {
        rows.push(...page.rows);
        inventoryAddAllStockStatus.loaded += page.rows.length;
      });
  }
  return rows;
}

async function fetchAllLiveInventoryStockRows(warehouseCodes = inventorySelectedWarehouseCodes()) {
  const rows = [];
  inventoryAddAllStockStatus.loaded = 0;
  inventoryAddAllStockStatus.total = 0;
  for (const warehouseCode of normalizeWarehouseCodes(warehouseCodes)) {
    rows.push(...await fetchAllLiveInventoryStockRowsForWarehouse(warehouseCode));
  }
  return rows;
}

function liveTable(kind) {
  if (!state.liveTables) state.liveTables = normalizeLiveTables({});
  if (!state.liveTables[kind]) state.liveTables[kind] = normalizeLiveTableState({}, kind);
  return state.liveTables[kind];
}

function liveTableConfig(kind) {
  return LIVE_TABLES[kind] || LIVE_TABLES.products;
}

function payloadItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.content?.items)) return payload.content.items;
  return [];
}

function liveProductCode(product) {
  return String(product?.productCode || product?.sku || product?.id || "").trim();
}

async function queryLiveStockForProduct(product) {
  const productCode = liveProductCode(product);
  if (!productCode) throw new Error("productCode товару відсутній");
  const params = new URLSearchParams({
    productCode,
    warehouseCode: SQL_MAIN_WAREHOUSE_CODE,
    limit: String(LIVE_STOCK_LOOKUP_LIMIT),
    offset: "0"
  });
  const payload = await fetchJson(`/api/live/stock-balances?${params.toString()}`);
  const items = payloadItems(payload).map((item) => normalizeStockBalance({
    ...item,
    productId: item.productId || product.id,
    productCode: item.productCode || productCode,
    warehouseCode: item.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: item.warehouseName || SQL_MAIN_WAREHOUSE_NAME
  }));
  markServerOnline(payload);
  return { ...payload, items };
}

async function queryLiveSerialsForProduct(product, options = {}) {
  const productCode = liveProductCode(product);
  if (!productCode) throw new Error("productCode товару відсутній");
  const limit = clampLiveLimit(options.limit ?? LIVE_SERIAL_LOOKUP_LIMIT, LIVE_SERIAL_LOOKUP_LIMIT);
  const offset = Math.max(0, Number(options.offset || 0));
  const params = new URLSearchParams({
    productCode,
    warehouseCode: SQL_MAIN_WAREHOUSE_CODE,
    limit: String(limit),
    offset: String(offset)
  });
  const payload = await fetchJson(`/api/live/serial-stock?${params.toString()}`);
  const items = payloadItems(payload)
    .map((item) => normalizeSerialStock({
      ...item,
      productId: item.productId || product.id,
      productCode: item.productCode || productCode,
      productName: item.productName || product.name,
      warehouseCode: item.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
      warehouseName: item.warehouseName || SQL_MAIN_WAREHOUSE_NAME
    }))
    .filter((item) => item.serialName && String(item.warehouseCode) === SQL_MAIN_WAREHOUSE_CODE && Number(item.quantity || 0) > 0);
  markServerOnline(payload);
  return { ...payload, items };
}

async function loadStockSerialRows(offset = 0) {
  const product = productById(state.stockUi.serialProductId);
  if (!product?.id || !isWeaponProduct(product)) return;
  const limit = clampLiveLimit(state.stockUi.serialLimit, LIVE_SERIAL_LOOKUP_LIMIT);
  state.stockUi.serialLoading = true;
  state.stockUi.serialError = "";
  state.stockUi.serialLimit = limit;
  state.stockUi.serialOffset = Math.max(0, Number(offset || 0));
  state.stockUi.serialProductCode = liveProductCode(product);
  saveState({ server: false });
  render();
  try {
    const payload = await queryLiveSerialsForProduct(product, {
      limit,
      offset: state.stockUi.serialOffset
    });
    const items = payload.items.slice(0, limit);
    state.stockUi.serialRows = items;
    state.stockUi.serialTotal = liveTableTotal(payload, items);
    state.stockUi.serialHasMore = typeof payload.hasMore === "boolean" ? payload.hasMore : items.length >= limit;
    state.stockUi.serialNextOffset = payload.nextOffset === null || payload.nextOffset === undefined ? null : Math.max(0, Number(payload.nextOffset || 0));
    state.stockUi.serialSource = payload.sourceDetail || payload.source || "crm-sql-live";
    state.stockUi.serialLastLoadedAt = payload.loadedAt || nowIso();
    state.stockUi.serialError = "";
    markServerOnline(payload);
  } catch (error) {
    state.stockUi.serialRows = [];
    state.stockUi.serialTotal = 0;
    state.stockUi.serialHasMore = false;
    state.stockUi.serialNextOffset = null;
    state.stockUi.serialSource = "";
    state.stockUi.serialError = String(error?.message || error || "CRM SQL serial API недоступний");
    markServerOffline(error);
  } finally {
    state.stockUi.serialLoading = false;
    saveState({ server: false });
    render();
  }
}

function resetStockSerialRows(productId = "") {
  state.stockUi.serialProductId = productId;
  state.stockUi.serialRows = [];
  state.stockUi.serialOffset = 0;
  state.stockUi.serialTotal = 0;
  state.stockUi.serialHasMore = false;
  state.stockUi.serialNextOffset = null;
  state.stockUi.serialLoading = false;
  state.stockUi.serialError = "";
  state.stockUi.serialSource = "";
  state.stockUi.serialLastLoadedAt = "";
  state.stockUi.serialProductCode = "";
}

function pageStockSerialRows(direction) {
  const limit = clampLiveLimit(state.stockUi.serialLimit, LIVE_SERIAL_LOOKUP_LIMIT);
  const nextOffset = direction > 0 && state.stockUi.serialNextOffset !== null && state.stockUi.serialNextOffset !== undefined
    ? Math.max(0, Number(state.stockUi.serialNextOffset || 0))
    : Math.max(0, Number(state.stockUi.serialOffset || 0) + Number(direction || 0) * limit);
  if (nextOffset === state.stockUi.serialOffset && direction < 0) return;
  return loadStockSerialRows(nextOffset);
}

function normalizeLivePayloadItems(kind, payload) {
  return payloadItems(payload).map((item) => {
    const normalized = normalizeLiveTableItem(kind, item);
    if (kind === "products") return rememberLiveProduct(normalized);
    return normalized;
  });
}

function liveTableTotal(payload, items) {
  const total = Number(payload.total ?? payload.count ?? payload.meta?.total ?? payload.pagination?.total);
  return Number.isFinite(total) ? total : items.length;
}

async function loadLiveTable(kind, options = {}) {
  const config = liveTableConfig(kind);
  const table = liveTable(kind);
  const limitSource = options.limit ?? (table.limitMode === LIVE_TABLE_ALL_VALUE ? LIVE_TABLE_ALL_VALUE : table.limit);
  const limitChoice = normalizeLiveTableLimitChoice(limitSource, kind, config.defaultLimit, options.limitMode ?? table.limitMode);
  const limit = limitChoice.limit;
  const offset = Math.max(0, Number(options.offset ?? table.offset ?? 0));
  const params = new URLSearchParams();
  const search = String(options.search ?? table.search ?? "").trim();
  const sortField = normalizeLiveSortField(kind, options.sortField ?? table.sortField);
  const sortDirection = sortField ? normalizeSortDirection(options.sortDirection ?? table.sortDirection) : "desc";
  if (search) params.set("search", search);
  Object.entries(config.params || {}).forEach(([key, value]) => params.set(key, String(value)));
  params.set("limit", limitChoice.mode === LIVE_TABLE_ALL_VALUE ? LIVE_TABLE_ALL_VALUE : String(limit));
  params.set("offset", String(offset));
  if (sortField) {
    params.set("sort", sortField);
    params.set("direction", sortDirection);
  }
  table.loading = true;
  table.error = "";
  table.limit = limit;
  table.limitMode = limitChoice.mode;
  table.offset = offset;
  table.search = search;
  table.sortField = sortField;
  table.sortDirection = sortDirection;
  saveState({ server: false });
  render();
  try {
    const payload = await fetchJson(`${config.endpoint}?${params.toString()}`);
    const items = normalizeLivePayloadItems(kind, payload);
    table.items = items;
    table.total = liveTableTotal(payload, items);
    table.totalExact = Boolean(payload.totalExact);
    table.limit = Number(payload.limit || limit);
    table.limitMode = limitChoice.mode;
    table.offset = Number(payload.offset || offset);
    table.hasMore = typeof payload.hasMore === "boolean" ? payload.hasMore : items.length >= table.limit;
    table.nextOffset = payload.nextOffset === null || payload.nextOffset === undefined ? null : Math.max(0, Number(payload.nextOffset || 0));
    table.source = payload.sourceDetail || payload.source || "crm-sql-live";
    table.lastLoadedAt = payload.loadedAt || nowIso();
    table.error = "";
    markServerOnline(payload);
  } catch (error) {
    table.items = [];
    table.total = 0;
    table.error = String(error?.message || error || "CRM SQL API недоступний");
    table.source = "";
    markServerOffline(error);
  } finally {
    table.loading = false;
    saveState({ server: false });
    render();
  }
}

function ensureLiveTableLoaded(kind) {
  const table = liveTable(kind);
  if (!serverModeEnabled() || table.loading || table.lastLoadedAt || table.error || liveTableLoadQueue.has(kind)) return;
  liveTableLoadQueue.add(kind);
  window.setTimeout(async () => {
    try {
      await loadLiveTable(kind);
    } finally {
      liveTableLoadQueue.delete(kind);
    }
  }, 0);
}

function searchLiveTable(form) {
  const kind = form.dataset.liveKind;
  const formData = new FormData(form);
  const search = String(formData.get("search") || "").trim();
  return loadLiveTable(kind, { search, limit: formData.get("limit"), offset: 0 });
}

function refreshLiveTable(kind) {
  const table = liveTable(kind);
  return loadLiveTable(kind, { offset: table.offset });
}

function pageLiveTable(kind, direction) {
  const table = liveTable(kind);
  const limit = normalizeLiveTableLimitChoice(
    table.limitMode === LIVE_TABLE_ALL_VALUE ? LIVE_TABLE_ALL_VALUE : table.limit,
    kind,
    liveTableConfig(kind).defaultLimit,
    table.limitMode
  ).limit;
  const nextOffset = direction > 0 && table.nextOffset !== null && table.nextOffset !== undefined
    ? Math.max(0, Number(table.nextOffset || 0))
    : Math.max(0, Number(table.offset || 0) + Number(direction || 0) * limit);
  if (nextOffset === table.offset && direction < 0) return;
  return loadLiveTable(kind, { offset: nextOffset });
}

function sortLiveStockTable(field, explicitDirection = "") {
  const table = liveTable("stock");
  const sortField = normalizeLiveSortField("stock", field);
  if (!sortField || table.loading) return;
  const nextDirection = explicitDirection
    ? normalizeSortDirection(explicitDirection)
    : table.sortField === sortField && table.sortDirection === "desc"
      ? "asc"
      : "desc";
  return loadLiveTable("stock", { sortField, sortDirection: nextDirection, offset: 0 });
}

function toggleStockList() {
  state.stockUi.stockListCollapsed = !state.stockUi.stockListCollapsed;
  saveState({ server: false });
  render();
}

function queueLiveProductLookup(value) {
  const query = String(value || "").trim();
  window.clearTimeout(liveProductLookup.timer);
  liveProductLookup.query = query;
  liveProductLookup.barcode = "";
  const requestId = liveProductLookup.requestId + 1;
  liveProductLookup.requestId = requestId;
  if (!query) {
    liveProductLookup.items = [];
    liveProductLookup.total = 0;
    liveProductLookup.loading = false;
    liveProductLookup.error = "";
    liveProductLookup.source = "";
    renderProductLookupOptions();
    return;
  }
  if (!serverModeEnabled()) {
    liveProductLookup.items = localProductLookupItems(query);
    liveProductLookup.total = liveProductLookup.items.length;
    liveProductLookup.loading = false;
    liveProductLookup.error = "сервер не налаштовано";
    liveProductLookup.source = "local-demo";
    renderProductLookupOptions();
    return;
  }
  const cached = findExactCachedLiveLookupProduct(query);
  if (cached) {
    liveProductLookup.items = [cached];
    liveProductLookup.total = 1;
    liveProductLookup.limit = LIVE_PRODUCT_LOOKUP_LIMIT;
    liveProductLookup.offset = 0;
    liveProductLookup.loading = false;
    liveProductLookup.error = "";
    liveProductLookup.source = "crm-sql-live-stock-cache";
    liveProductLookup.fallback = false;
    liveProductLookup.lastLoadedAt = nowIso();
    renderProductLookupOptions();
    return;
  }
  liveProductLookup.items = [];
  liveProductLookup.total = 0;
  liveProductLookup.source = "";
  liveProductLookup.fallback = false;
  liveProductLookup.loading = true;
  liveProductLookup.error = "";
  renderProductLookupOptions();
  liveProductLookup.timer = window.setTimeout(async () => {
    try {
      const payload = await queryLiveStockedProducts({ search: liveProductLookupSearchTerm(query), limit: LIVE_PRODUCT_LOOKUP_LIMIT });
      if (requestId !== liveProductLookup.requestId) return;
      liveProductLookup.query = query;
      liveProductLookup.items = payload.items;
    } catch (error) {
      if (requestId !== liveProductLookup.requestId) return;
      markServerOffline(error);
      liveProductLookup.items = [];
      liveProductLookup.total = 0;
      liveProductLookup.error = String(error?.message || error || "сервер недоступний");
      liveProductLookup.source = "";
      liveProductLookup.fallback = false;
    } finally {
      if (requestId === liveProductLookup.requestId) {
        liveProductLookup.loading = false;
        renderProductLookupOptions();
      }
    }
  }, 220);
}

async function resolveProductForSale(value, { scan = false } = {}) {
  const query = String(value || "").trim();
  if (!query) return null;
  if (serverModeEnabled()) {
    const selected = findStockedLiveLookupProduct(query);
    if (selected) return enrichStockLookupProductForSale(selected);
    liveProductLookup.loading = true;
    liveProductLookup.error = "";
    renderProductLookupOptions();
    try {
      const payload = await queryLiveStockedProducts({ search: liveProductLookupSearchTerm(query), limit: LIVE_PRODUCT_LOOKUP_LIMIT });
      liveProductLookup.query = query;
      liveProductLookup.loading = false;
      renderProductLookupOptions();
      if (payload.items.length) return enrichStockLookupProductForSale(payload.items[0]);
    } catch (error) {
      markServerOffline(error);
      liveProductLookup.loading = false;
      liveProductLookup.error = String(error?.message || error || "сервер недоступний");
      liveProductLookup.source = "";
      liveProductLookup.fallback = false;
      renderProductLookupOptions();
    }
    return null;
  }
  return scan ? findProductByScan(query) : findProductByLookup(query);
}

function markServerOnline(payload = {}) {
  serverSync.online = true;
  serverSync.error = "";
  serverSync.revision = Number(payload.revision ?? payload.stateRevision ?? serverSync.revision ?? 0);
  serverSync.lastLoadedAt = payload.loadedAt || serverSync.lastLoadedAt;
  serverSync.lastSavedAt = payload.savedAt || serverSync.lastSavedAt;
}

function markServerOffline(error) {
  serverSync.online = false;
  serverSync.error = String(error?.message || error || "немає відповіді");
}

async function bootstrapServerState() {
  if (!serverModeEnabled() || serverSync.loading) return;
  serverSync.loading = true;
  try {
    const clientUi = clientLocalStateSnapshot();
    const payload = await fetchJson("/api/bootstrap");
    if (payload.settings) {
      state.systemSettings = normalizeSystemSettings({ ...state.systemSettings, ...payload.settings });
    }
    if (payload.state) {
      state = mergeServerStateWithClientUi(payload.state, clientUi);
      if (payload.settings) state.systemSettings = normalizeSystemSettings({ ...state.systemSettings, ...payload.settings });
      rememberSharedStateFingerprint(state);
      applySessionRulesAfterServerMerge();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      queueServerStateSave();
    }
    markServerOnline({
      revision: payload.stateRevision,
      savedAt: payload.savedAt,
      loadedAt: nowIso()
    });
    render();
  } catch (error) {
    markServerOffline(error);
    render();
  } finally {
    serverSync.loading = false;
  }
}

async function flushServerState(renderAfter = false) {
  if (!serverModeEnabled() || serverSync.saving) return;
  serverSync.saving = true;
  serverSync.pending = false;
  try {
    const sharedState = sharedStateForServer(state);
    const sharedFingerprint = sharedStateFingerprint(sharedState);
    if (sharedFingerprint === serverSync.lastSharedStateFingerprint) {
      if (renderAfter) render();
      return;
    }
    const payload = await fetchJson("/api/state", {
      method: "PUT",
      body: JSON.stringify({
        baseRevision: serverSync.revision,
        build: APP_BUILD,
        appVersion: APP_VERSION,
        releasedAt: APP_RELEASED_AT,
        savedBy: currentEmployee()?.name || "system",
        state: sharedState
      })
    });
    markServerOnline(payload);
    serverSync.lastSharedStateFingerprint = sharedFingerprint;
    state.systemSettings.lastSavedAt = payload.savedAt || nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (renderAfter) render();
  } catch (error) {
    markServerOffline(error);
    if (renderAfter) render();
  } finally {
    serverSync.saving = false;
  }
}

async function refreshServerState(force = false) {
  if (!serverModeEnabled() || serverSync.loading || serverSync.saving || serverSync.pending) return;
  try {
    const clientUi = clientLocalStateSnapshot();
    const previousRevision = Number(serverSync.revision || 0);
    const payload = await fetchJson(`/api/state?revision=${encodeURIComponent(serverSync.revision)}`);
    markServerOnline({
      revision: payload.revision,
      savedAt: payload.savedAt,
      loadedAt: nowIso()
    });
    if ((force || Number(payload.revision || 0) > previousRevision) && payload.state) {
      state = mergeServerStateWithClientUi(payload.state, clientUi);
      rememberSharedStateFingerprint(state);
      applySessionRulesAfterServerMerge();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
    }
  } catch (error) {
    markServerOffline(error);
  }
}

async function saveServerSettings(renderAfter = false) {
  if (!serverModeEnabled()) return;
  try {
    const payload = await fetchJson("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        settings: state.systemSettings,
        savedBy: currentEmployee()?.name || "system",
        build: APP_BUILD,
        releasedAt: APP_RELEASED_AT
      })
    });
    if (payload.settings) state.systemSettings = normalizeSystemSettings(payload.settings);
    markServerOnline({
      revision: payload.stateRevision ?? serverSync.revision,
      savedAt: payload.savedAt,
      loadedAt: nowIso()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (renderAfter) render();
  } catch (error) {
    markServerOffline(error);
    if (renderAfter) render();
  }
}

function audit(event, actor = "manager") {
  state.auditLog.unshift({ at: nowIso(), actor, event });
  state.auditLog = state.auditLog.slice(0, 100);
}

function exchangeStatusLabel(status) {
  return { idle: "Очікує", running: "Виконується", done: "Завершено", error: "Помилка", queued: "У черзі" }[status] || status || "-";
}

function exchangeDirectionLabel(direction) {
  return direction === "export" ? "Експорт" : "Імпорт";
}

function exchangeIntervalLabel(interval) {
  return { manual: "Ручний запуск", hourly: "Щогодини", daily: "Щодня", weekly: "Щотижня" }[interval] || interval || "-";
}

function exchangeRecordStatusClass(status) {
  return status === "error" ? "danger" : status === "running" || status === "queued" ? "warn" : "good";
}

function setExchangeProcess(label, progress = 0, status = "running") {
  state.exchange.process = {
    status,
    label,
    progress: Math.max(0, Math.min(100, Number(progress || 0))),
    startedAt: status === "running" ? nowIso() : state.exchange.process.startedAt,
    finishedAt: status === "running" ? "" : nowIso()
  };
}

function finishExchangeProcess(label, status = "done") {
  state.exchange.process = {
    ...state.exchange.process,
    status,
    label,
    progress: status === "done" ? 100 : state.exchange.process.progress,
    finishedAt: nowIso()
  };
}

function addExchangeRecord(record) {
  const normalized = normalizeExchangeRecord({
    id: nextId(record.direction === "export" ? "EXP" : "IMP", state.exchange.records),
    actor: currentEmployee()?.name || "manager",
    startedAt: nowIso(),
    finishedAt: nowIso(),
    status: "done",
    ...record
  });
  state.exchange.records.unshift(normalized);
  state.exchange.records = state.exchange.records.slice(0, 80);
  return normalized;
}

function importSummaryRows() {
  return Number(state.productImport.rows || 0)
    + Number(state.stockImport.rows || 0)
    + Number(state.serialImport.rows || 0)
    + Number(state.counterpartyImport.rows || 0);
}

function pendingCustomerExports() {
  return state.customers.filter((customer) => customer.source === "b2c" && customer.exportStatus !== "exported");
}

function exportSalesToSql(renderAfter = true) {
  if (!canDo("exchange_export")) return alert("Немає дозволу керувати експортом.");
  setExchangeProcess("Експорт продажів у SQL-чергу", 65);
  const rows = state.receipts.length;
  const record = addExchangeRecord({
    direction: "export",
    dataset: "Продажі B2C",
    destination: `${SQL_SCHEMA}.b2c_sales_export_queue`,
    rows,
    details: rows ? "Чеки підготовлено до експорту в SQL-шар." : "Немає чеків для експорту."
  });
  finishExchangeProcess(`Експорт продажів завершено: ${rows} рядків`);
  audit(`Експортовано ${rows} продажів у SQL-чергу (${record.destination})`);
  saveState();
  if (renderAfter) render();
}

function exportCustomersToSql(renderAfter = true) {
  if (!canDo("exchange_export")) return alert("Немає дозволу керувати експортом.");
  const pending = pendingCustomerExports();
  setExchangeProcess("Експорт нових клієнтів B2C у SQL-чергу", 65);
  const record = addExchangeRecord({
    direction: "export",
    dataset: "Клієнти B2C",
    destination: `${SQL_SCHEMA}.b2c_counterparties_export_queue`,
    rows: pending.length,
    details: pending.length ? "Нові клієнти підготовлено до експорту в SQL-шар." : "Немає нових клієнтів для експорту."
  });
  pending.forEach((customer) => {
    customer.exportStatus = "exported";
    customer.exportedAt = nowIso();
  });
  finishExchangeProcess(`Експорт клієнтів завершено: ${pending.length} карток`);
  audit(`Експортовано ${pending.length} нових клієнтів у SQL-чергу (${record.destination})`);
  saveState();
  if (renderAfter) render();
}

function exportInventoryToSql(renderAfter = true) {
  if (!canDo("exchange_export")) return alert("Немає дозволу керувати експортом.");
  setExchangeProcess("Експорт інвентаризацій у SQL-чергу", 65);
  const rows = state.inventoryDocs.length;
  const record = addExchangeRecord({
    direction: "export",
    dataset: "Інвентаризації B2C",
    destination: `${SQL_SCHEMA}.b2c_inventory_export_queue`,
    rows,
    details: rows ? "Документи інвентаризації підготовлено до експорту в SQL-шар." : "Немає проведених інвентаризацій для експорту."
  });
  finishExchangeProcess(`Експорт інвентаризацій завершено: ${rows} рядків`);
  audit(`Експортовано ${rows} інвентаризацій у SQL-чергу (${record.destination})`);
  saveState();
  if (renderAfter) render();
}

function updateExchangeAutomation(form) {
  if (!canDo("exchange_automation")) return alert("Немає дозволу налаштовувати автоматизацію.");
  const data = Object.fromEntries(new FormData(form).entries());
  state.exchange.automation = normalizeExchange({
    automation: {
      enabled: data.enabled === "on",
      interval: data.interval,
      importProducts: data.importProducts === "on",
      importStock: data.importStock === "on",
      importCounterparties: data.importCounterparties === "on",
      exportSales: data.exportSales === "on",
      exportInventory: data.exportInventory === "on",
      exportCustomers: data.exportCustomers === "on",
      notifyResponsible: data.notifyResponsible === "on",
      responsibleRole: data.responsibleRole
    }
  }).automation;
  audit(`Оновлено автоматизацію обміну даними: ${state.exchange.automation.enabled ? "увімкнено" : "вимкнено"}, ${state.exchange.automation.interval}`);
  saveState();
  render();
}

function runExchangeAutomationNow() {
  if (!canDo("exchange_automation")) return alert("Немає дозволу запускати автоматизацію.");
  const automation = state.exchange.automation;
  if (automation.importProducts) syncProductsFromSql("automation", false);
  if (automation.importStock) syncStockReceiptsFromSql("automation", false);
  if (automation.importCounterparties) syncCounterpartiesFromSql("automation", false);
  if (automation.exportSales) exportSalesToSql(false);
  if (automation.exportInventory) exportInventoryToSql(false);
  if (automation.exportCustomers) exportCustomersToSql(false);
  state.exchange.automation.lastRunAt = nowIso();
  audit("Автоматизацію обміну даними запущено вручну");
  saveState();
  render();
}

function updateSystemSettings(form) {
  if (!canDo("system_settings")) return alert("Немає дозволу змінювати системні налаштування.");
  const data = Object.fromEntries(new FormData(form).entries());
  const nextSettings = normalizeSystemSettings({
    mode: data.mode,
    publicHost: data.publicHost,
    publicBaseUrl: data.publicBaseUrl,
    apiBaseUrl: data.apiBaseUrl,
    crmSqlApiBaseUrl: data.crmSqlApiBaseUrl,
    bindAddress: data.bindAddress,
    port: data.port,
    storageBackend: data.storageBackend,
    dataDir: data.dataDir,
    autoRefreshSeconds: data.autoRefreshSeconds,
    multiUser: data.multiUser === "on",
    externalAccess: data.externalAccess === "on",
    allowLocalFallback: data.allowLocalFallback === "on",
    lastSavedAt: nowIso()
  });
  state.systemSettings = nextSettings;
  audit(`Оновлено системні налаштування B2C: ${nextSettings.mode}, ${nextSettings.publicBaseUrl}`);
  saveState();
  saveServerSettings(true);
  render();
}

function productById(id) {
  return liveProductCache.get(id) || state.products.find((product) => product.id === id) || EMPTY_PRODUCT;
}

function productCartIdentity(product) {
  const source = product || {};
  return normalizeScanText(source.productCode || source.sku || source.sqlId || source.id || "");
}

function checkoutLineProductIdentity(line) {
  const product = productById(line?.productId);
  return productCartIdentity({
    ...product,
    productCode: line?.productCode || product.productCode,
    sku: line?.sku || product.sku,
    sqlId: line?.sqlId || product.sqlId,
    id: line?.productId || product.id
  });
}

function findCheckoutLineForProduct(product) {
  const target = productCartIdentity(product);
  if (!target) return null;
  return state.checkout.lines.find((line) => checkoutLineProductIdentity(line) === target) || null;
}

function customerById(id) {
  return state.customers.find((customer) => customer.id === id) || WALK_IN_CUSTOMER;
}

function hasRegisteredCustomer(customerId = state.checkout.customerId) {
  const customer = state.customers.find((item) => item.id === customerId);
  return Boolean(customer && customer.id && customer.id !== "walk-in");
}

function customerLookupValue(customer) {
  const source = customer || WALK_IN_CUSTOMER;
  return `${source.name} · ${source.phone || "без телефону"} · ${LOYALTY_LABELS[source.loyalty] || source.loyalty}`;
}

function productLookupValue(product) {
  const scanCode = product.barcode || product.qr || product.productCode || product.sqlId || product.sku;
  const retailQty = product.retailStockQty ?? stockQty(product.id);
  const totalQty = product.stockTotalQty ?? stockTotalQty(product.id);
  const priceText = productPriceDisplay(product);
  return `${product.productCode || product.sku} · ${product.name} · ${scanCode} · ${priceText} · ${SQL_MAIN_WAREHOUSE_NAME} ${retailQty} · всього ${totalQty}`;
}

function employeeById(id) {
  return state.employees.find((employee) => employee.id === id) || state.employees[0];
}

function activeEmployees() {
  return state.employees.filter((employee) => employee.status === "active");
}

function roleLabel(role) {
  return EMPLOYEE_ROLES[role]?.label || role || "-";
}

function employeeStatusLabel(status) {
  return EMPLOYEE_STATUSES[status] || status || "-";
}

function employeeSessionRecord(employeeId, source = state) {
  return source.employeeSessions?.[employeeId] || null;
}

function employeeSessionMatchesBrowser(record) {
  return Boolean(
    record?.deviceId
    && record.deviceId === browserDeviceId
    && record.sessionToken
    && sessionToken
    && record.sessionToken === sessionToken
  );
}

function employeeSessionIsCurrent(employeeId, source = state) {
  if (!employeeId) return false;
  const record = employeeSessionRecord(employeeId, source);
  return employeeSessionMatchesBrowser(record);
}

function employeeSessionLabel(employee) {
  const record = employeeSessionRecord(employee?.id);
  if (!record?.deviceId) return "Сеанс не відкрито";
  if (employeeSessionMatchesBrowser(record)) return "Сеанс на цьому комп'ютері";
  if (record.deviceId === browserDeviceId) return "Потрібен повторний вхід на цьому комп'ютері";
  return `Сеанс на іншому комп'ютері: ${record.deviceLabel || "без назви"}`;
}

function registerEmployeeSession(employee) {
  state.employeeSessions = normalizeEmployeeSessions(state.employeeSessions, state.employees);
  const previous = state.employeeSessions[employee.id] || null;
  const token = createOpaqueId("session");
  const timestamp = nowIso();
  storeSessionEmployeeId(employee.id, token);
  state.employeeSessions[employee.id] = {
    employeeId: employee.id,
    deviceId: browserDeviceId,
    deviceLabel: currentDeviceLabel(),
    sessionToken: token,
    startedAt: previous?.deviceId === browserDeviceId ? previous.startedAt || timestamp : timestamp,
    lastSeenAt: timestamp,
    replacedAt: previous?.deviceId && previous.deviceId !== browserDeviceId ? timestamp : ""
  };
  return previous;
}

function clearEmployeeSession(employeeId = sessionEmployeeId) {
  const record = employeeSessionRecord(employeeId);
  if (employeeSessionMatchesBrowser(record)) {
    delete state.employeeSessions[employeeId];
  }
}

function ensureCurrentEmployeeSessionRegistered() {
  if (serverModeEnabled()) return false;
  if (!sessionEmployeeId) return false;
  const employee = state.employees.find((item) => item.id === sessionEmployeeId && item.status === "active");
  if (!employee) {
    storeSessionEmployeeId("");
    state.activeEmployeeId = "";
    return true;
  }
  const record = employeeSessionRecord(employee.id);
  if (employeeSessionMatchesBrowser(record)) return false;
  if (record?.deviceId) return false;
  const token = sessionToken || createOpaqueId("session");
  const timestamp = nowIso();
  storeSessionEmployeeId(employee.id, token);
  state.employeeSessions[employee.id] = {
    employeeId: employee.id,
    deviceId: browserDeviceId,
    deviceLabel: currentDeviceLabel(),
    sessionToken: token,
    startedAt: timestamp,
    lastSeenAt: timestamp,
    replacedAt: ""
  };
  return true;
}

function enforceCurrentEmployeeSession(reason = "sync") {
  if (!sessionEmployeeId) return false;
  const employee = state.employees.find((item) => item.id === sessionEmployeeId);
  const record = employeeSessionRecord(sessionEmployeeId);
  const invalidEmployee = !employee || employee.status !== "active";
  const missingServerSession = !record?.deviceId;
  const replacedByOtherDevice = Boolean(record?.deviceId && record.deviceId !== browserDeviceId);
  const replacedByOtherSession = Boolean(record?.deviceId && record.deviceId === browserDeviceId && !employeeSessionMatchesBrowser(record));
  if (!invalidEmployee && !missingServerSession && !replacedByOtherDevice && !replacedByOtherSession) return false;
  const employeeName = employee?.name || "працівника";
  storeSessionEmployeeId("");
  state.activeEmployeeId = "";
  loginDialog = { open: true, employeeId: employee?.id || activeEmployees()[0]?.id || "" };
  sessionNotice = replacedByOtherDevice
    ? `Сеанс ${employeeName} відкрито на іншому комп'ютері. Цей комп'ютер автоматично вийшов із B2C.`
    : replacedByOtherSession || missingServerSession
    ? `Сеанс ${employeeName} більше не активний на цьому комп'ютері. Увійдіть повторно.`
    : "Сеанс завершено, бо працівник не активний або відсутній.";
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Keep the in-memory logout when browser storage is blocked.
  }
  return true;
}

function applySessionRulesAfterServerMerge() {
  const forcedLogout = enforceCurrentEmployeeSession("server-sync");
  if (forcedLogout) return { forcedLogout, registered: false };
  const registered = !serverModeEnabled() && ensureCurrentEmployeeSessionRegistered();
  if (registered) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Keep the in-memory session when browser storage is blocked.
    }
    queueServerStateSave();
  }
  return { forcedLogout, registered };
}

function currentEmployee(source = state) {
  const employee = source.employees.find((item) => item.id === sessionEmployeeId && item.status === "active") || null;
  return employee && employeeSessionIsCurrent(employee.id, source) ? employee : null;
}

function rolePermissionSet(role, source = state) {
  return source.rolePermissions?.[role] || EMPLOYEE_ROLES[role] || { blocks: [], actions: [] };
}

function roleHas(role, type, id, source = state) {
  return Boolean(rolePermissionSet(role, source)?.[type]?.includes(id));
}

function canOpenBlock(blockId, source = state) {
  return roleHas(currentEmployee(source)?.role, "blocks", VIEW_ALIASES[blockId] || blockId, source);
}

function canDo(actionId, source = state) {
  return roleHas(currentEmployee(source)?.role, "actions", actionId, source);
}

function canEditEmployeeFields(source = state) {
  return canDo("employee_edit", source) || canDo("employee_manage", source);
}

function firstAllowedView(source = state) {
  return flatNavItems().find(([id]) => canOpenBlock(id, source))?.[0] || "pos";
}

function rolePermissionCheckbox(roleId, type, permissionId) {
  const checked = roleHas(roleId, type, permissionId);
  return `
    <label class="check-cell">
      <input type="checkbox" data-role-permission="${escapeHtml(type)}" data-role-id="${escapeHtml(roleId)}" data-permission-id="${escapeHtml(permissionId)}" ${checked ? "checked" : ""} ${canDo("employee_manage") ? "" : "disabled"}>
      <span>${checked ? "так" : "ні"}</span>
    </label>
  `;
}

function warehouseLabel(code, name) {
  return `${name || "Склад"}${code ? ` (${code})` : ""}`;
}

function warehouseNameByCode(code) {
  const target = String(code || "");
  if (target === SQL_MAIN_WAREHOUSE_CODE) return SQL_MAIN_WAREHOUSE_NAME;
  const live = liveTable("warehouses").items.find((item) => String(item.warehouseCode || item.id) === target);
  if (live) return live.warehouseName || "Склад";
  const stock = state.stock.find((item) => String(item.warehouseCode || "") === target);
  return stock?.warehouseName || "Склад";
}

function inventoryWarehouseOptions() {
  const selected = inventorySelectedWarehouseCodes();
  const options = new Map();
  const add = (code, name) => {
    const key = String(code || "").trim();
    if (!key || options.has(key)) return;
    options.set(key, { warehouseCode: key, warehouseName: name || warehouseNameByCode(key) });
  };
  add(SQL_MAIN_WAREHOUSE_CODE, SQL_MAIN_WAREHOUSE_NAME);
  liveTable("warehouses").items.forEach((warehouse) => add(warehouse.warehouseCode || warehouse.id, warehouse.warehouseName));
  state.stock.forEach((row) => add(row.warehouseCode, row.warehouseName));
  selected.forEach((code) => add(code, warehouseNameByCode(code)));
  return Array.from(options.values()).sort((left, right) => {
    if (left.warehouseCode === SQL_MAIN_WAREHOUSE_CODE) return -1;
    if (right.warehouseCode === SQL_MAIN_WAREHOUSE_CODE) return 1;
    return warehouseLabel(left.warehouseCode, left.warehouseName).localeCompare(warehouseLabel(right.warehouseCode, right.warehouseName), "uk");
  });
}

function stockRowsForProduct(productId) {
  return state.stock.filter((item) => item.productId === productId);
}

function stockRow(productId, warehouseCode = SQL_MAIN_WAREHOUSE_CODE) {
  let row = state.stock.find((item) => item.productId === productId && (
    item.warehouseCode === warehouseCode
    || (!item.warehouseCode && warehouseCode === SQL_MAIN_WAREHOUSE_CODE)
  ));
  if (!row) {
    row = {
      productId,
      productCode: productById(productId)?.productCode || productById(productId)?.sku || "",
      warehouseCode,
      warehouseName: warehouseCode === SQL_MAIN_WAREHOUSE_CODE ? SQL_MAIN_WAREHOUSE_NAME : "Склад",
      qty: 0,
      reservedQty: 0
    };
    state.stock.push(row);
  }
  return row;
}

function stockQty(productId, warehouseCode = SQL_MAIN_WAREHOUSE_CODE) {
  return stockRowsForProduct(productId)
    .filter((item) => item.warehouseCode ? item.warehouseCode === warehouseCode : warehouseCode === SQL_MAIN_WAREHOUSE_CODE)
    .reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function stockTotalQty(productId) {
  return stockRowsForProduct(productId).reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function stockWholesaleQty(productId) {
  return stockRowsForProduct(productId)
    .filter((item) => String(item.warehouseName || "").toLowerCase().includes("гурт"))
    .reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function productCategoryText(product) {
  return [
    product.name,
    product.category,
    product.categoryPrimary,
    product.productGroup,
    product.productGroupPath,
    product.productFullPath,
    product.productKind,
    ...(Array.isArray(product.characteristics) ? product.characteristics : [])
  ].filter(Boolean).join(" ");
}

function isWeaponProduct(product) {
  const text = normalizeScanText(productCategoryText(product));
  return text.includes("збро")
    || text.includes("оруж")
    || text.includes("weapon")
    || text.includes("firearm")
    || text.includes("рушниц")
    || text.includes("караб")
    || text.includes("гвинтів")
    || text.includes("винтовк")
    || text.includes("пістолет");
}

function productWarehouseStockFallback(product) {
  const direct = Number(product?.retailStockQty);
  if (Number.isFinite(direct) && direct > 0) return direct;
  return stockQty(product?.id || "", SQL_MAIN_WAREHOUSE_CODE);
}

function productHasMainWarehouseStock(product) {
  return productWarehouseStockFallback(product) > 0;
}

function checkoutLineWarehouseStock(line, product = productById(line.productId)) {
  const liveQty = Number(line.warehouseStockQty);
  if (Number.isFinite(liveQty) && (line.stockSource || line.stockError)) return liveQty;
  return productWarehouseStockFallback(product);
}

function checkoutLineStockHint(line, product = productById(line.productId)) {
  if (line.stockLoading) return `${SQL_MAIN_WAREHOUSE_NAME}: завантаження...`;
  if (line.stockError) return `${SQL_MAIN_WAREHOUSE_NAME}: ${checkoutLineWarehouseStock(line, product)} · ${line.stockError}`;
  return `${SQL_MAIN_WAREHOUSE_NAME}: ${checkoutLineWarehouseStock(line, product)}`;
}

function checkoutLineSerialOptions(line) {
  return Array.isArray(line.serialOptions) ? line.serialOptions.filter((item) => item.serialName && Number(item.quantity || 0) > 0) : [];
}

function selectedSerialOption(line) {
  return checkoutLineSerialOptions(line).find((item) => item.serialName === line.serialName) || null;
}

function decreaseLocalStockIfPresent(line) {
  const row = state.stock.find((item) => item.productId === line.productId && (
    item.warehouseCode === (line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE)
    || (!item.warehouseCode && (line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE) === SQL_MAIN_WAREHOUSE_CODE)
  ));
  if (row) row.qty = Number(row.qty || 0) - Number(line.qty || 0);
}

function normalizeScanText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function scanTokens(value) {
  const raw = normalizeScanText(value);
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
  return [product.sku, product.productCode, product.barcode, product.qr, product.sqlId]
    .map(normalizeScanText)
    .filter(Boolean);
}

function productMatchesQuery(product, query) {
  const raw = normalizeScanText(query);
  if (!raw) return true;
  const tokens = scanTokens(raw);
  const text = normalizeScanText(`${product.name} ${product.sku} ${product.productCode} ${product.barcode} ${product.qr} ${product.sqlId} ${product.productGroupPath} ${product.productFullPath}`);
  if (text.includes(raw)) return true;
  return productScanTargets(product).some((target) => tokens.has(target) || raw.includes(target));
}

function customerMatchesQuery(customer, query) {
  const raw = normalizeScanText(query);
  if (!raw) return true;
  return normalizeScanText(`${customer.name} ${customer.phone} ${customer.email} ${customer.counterpartyCode} ${customer.sqlId} ${customer.id} ${LOYALTY_LABELS[customer.loyalty] || customer.loyalty}`).includes(raw);
}

function findProductByScan(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const tokens = scanTokens(raw);
  return productSearchPool().filter(productHasMainWarehouseStock).find((product) => (
    productScanTargets(product).some((target) => tokens.has(target) || raw.includes(target))
  )) || null;
}

function findProductByLookup(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const pool = productSearchPool().filter(productHasMainWarehouseStock);
  return pool.find((product) => normalizeScanText(productLookupValue(product)) === raw)
    || findProductByScan(value)
    || pool.find((product) => productMatchesQuery(product, value))
    || null;
}

function findProductForSale(value) {
  return findProductByLookup(value);
}

function findInventoryProductByScan(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const tokens = scanTokens(raw);
  return productSearchPool().find((product) => (
    productScanTargets(product).some((target) => tokens.has(target) || raw.includes(target))
  )) || null;
}

function findInventoryProductByLookup(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const pool = productSearchPool();
  return pool.find((product) => normalizeScanText(productLookupValue(product)) === raw)
    || findInventoryProductByScan(value)
    || pool.find((product) => productMatchesQuery(product, value))
    || null;
}

function findCustomerByLookup(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const pool = customerSearchPool();
  return findExactCustomerByLookup(value)
    || pool.find((customer) => customerMatchesQuery(customer, value))
    || null;
}

function findExactCustomerByLookup(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const pool = customerSearchPool();
  return pool.find((customer) => normalizeScanText(customerLookupValue(customer)) === raw)
    || pool.find((customer) => normalizeScanText(customer.id) === raw)
    || pool.find((customer) => normalizeScanText(customer.counterpartyCode) === raw)
    || pool.find((customer) => normalizeScanText(customer.sqlId) === raw)
    || null;
}

function formatMoney(value, currency = BASE_CURRENCY) {
  const amount = Number(value || 0);
  const normalizedCurrency = normalizeCurrencyCode(currency, BASE_CURRENCY);
  const maximumFractionDigits = Math.abs(amount % 1) > 0 ? 2 : 0;
  try {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits }).format(amount)} ${displayCurrencyList(normalizedCurrency)}`;
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function option(value, label, selected = false) {
  return `<option value="${escapeHtml(value)}" ${selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function paymentLabel(method) {
  return { cash: "Готівка", card: "Картка/POS", bank: "Банк" }[method] || method || "-";
}

function statusLabel(status) {
  return { posted: "проведено", partial_return: "часткове повернення", returned: "повернено" }[status] || status || "-";
}

function refundLabel(method) {
  return { cash: "Готівка", card: "POS" }[method] || paymentLabel(method);
}

function openShift() {
  return state.cashShifts.find((shift) => shift.opened);
}

function shiftExpectedCash(shift) {
  return Number(shift.openingCash || 0) + Number(shift.cashSales || 0) - Number(shift.cashReturns || 0);
}

function receiptTotal(lines) {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

function receiptSubtotal(lines) {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

function loyaltyRate(customerId = state.checkout.customerId) {
  return LOYALTY_DISCOUNTS[customerById(customerId).loyalty] || 0;
}

function loyaltyDiscount(lines, customerId = state.checkout.customerId) {
  return Math.round(receiptSubtotal(lines) * loyaltyRate(customerId) / 100);
}

function checkoutTotal(lines, customerId = state.checkout.customerId) {
  return Math.max(0, receiptSubtotal(lines) - loyaltyDiscount(lines, customerId));
}

function returnedQty(receiptId, productId) {
  return state.returns
    .filter((item) => item.receiptId === receiptId)
    .flatMap((item) => item.lines || [])
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + Number(line.qty || 0), 0);
}

function receiptReturnableLines(receipt) {
  return (receipt.lines || []).map((line) => {
    const returned = returnedQty(receipt.id, line.productId);
    return { ...line, returned, returnable: Math.max(0, Number(line.qty || 0) - returned) };
  });
}

function lineTotal(line) {
  const product = productById(line.productId);
  const price = Number(line.price ?? product.price ?? 0);
  const qty = Math.max(1, Number(line.qty || 1));
  const discount = discountPercentValue(line.discountPercent ?? line.discount ?? 0);
  const gross = qty * price;
  return roundCurrencyAmount(Math.max(0, gross * (1 - discount / 100)));
}

function cartLines() {
  return state.checkout.lines.map((line) => {
    const product = productById(line.productId);
    if (!product.id) return null;
    const normalized = normalizeCheckoutLine(line);
    return {
      productId: product.id,
      lineId: normalized.lineId,
      productCode: normalized.productCode || product.productCode || product.sku || "",
      sku: normalized.sku || product.sku || product.productCode || "",
      sqlId: normalized.sqlId || product.sqlId || "",
      qty: isWeaponProduct(product) ? 1 : Math.max(1, Number(normalized.qty || 1)),
      price: Number(Object.prototype.hasOwnProperty.call(line, "price") ? normalized.price : product.price || 0),
      priceCurrency: normalized.priceCurrency || BASE_CURRENCY,
      sourcePrice: Number(normalized.sourcePrice ?? normalized.price ?? product.price ?? 0),
      sourceCurrency: normalized.sourceCurrency || normalized.priceCurrency || BASE_CURRENCY,
      exchangeRate: Number(normalized.exchangeRate || 1),
      exchangeRateDate: normalized.exchangeRateDate || "",
      priceSource: normalized.priceSource || "",
      priceOptionId: normalized.priceOptionId || "",
      priceOptions: normalized.priceOptions || [],
      selectedPriceType: normalized.selectedPriceType || DEFAULT_CHECKOUT_PRICE_TYPE,
      selectedPriceCurrency: normalized.selectedPriceCurrency || normalized.sourceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY,
      priceWarning: normalized.priceWarning || "",
      discount: discountPercentValue(normalized.discount),
      discountPercent: discountPercentValue(normalized.discount),
      warehouseCode: normalized.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
      warehouseName: normalized.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
      warehouseStockQty: normalized.warehouseStockQty,
      warehouseReservedQty: normalized.warehouseReservedQty,
      stockLoading: normalized.stockLoading,
      stockError: normalized.stockError,
      stockSource: normalized.stockSource,
      serialName: normalized.serialName,
      serialNumber: normalized.serialNumber,
      serialOptions: normalized.serialOptions,
      serialLoading: normalized.serialLoading,
      serialError: normalized.serialError
    };
  }).filter(Boolean);
}

function checkoutLinePriceHtml(line, index) {
  const price = formatMoney(line.price, line.priceCurrency || BASE_CURRENCY);
  const priceOptions = Array.isArray(line.priceOptions) ? line.priceOptions : [];
  const selector = canDo("price_select") && priceOptions.length
    ? `
      <select class="mini-select" data-cart-price-option="${escapeHtml(line.lineId || index)}">
        <option value="" ${line.priceOptionId ? "" : "selected"}>Виберіть прикріплену ціну</option>
        ${priceOptions.map((item) => option(item.id, priceOptionLabel(item), item.id === line.priceOptionId)).join("")}
      </select>
    `
    : "";
  const details = [
    line.selectedPriceType || "",
    line.selectedPriceCurrency && line.selectedPriceCurrency !== (line.sourceCurrency || BASE_CURRENCY) ? line.selectedPriceCurrency : "",
    line.sourceCurrency && line.sourceCurrency !== BASE_CURRENCY ? formatMoney(line.sourcePrice, line.sourceCurrency) : "",
    line.sourceCurrency && line.sourceCurrency !== BASE_CURRENCY && line.exchangeRate ? `курс ${line.exchangeRate}` : "",
    line.sourceCurrency && line.sourceCurrency !== BASE_CURRENCY ? line.exchangeRateDate || "" : "",
    line.priceWarning || ""
  ].filter(Boolean).join(" · ");
  const currentPrice = details ? `${price}<br><span class="muted">${escapeHtml(details)}</span>` : price;
  return selector ? `${selector}${currentPrice}` : currentPrice;
}

function nextId(prefix, collection) {
  const number = collection.length + 1;
  return `${prefix}-${String(number).padStart(4, "0")}`;
}

function metricCard(label, value, note, drilldownType = "") {
  const canDrilldown = drilldownType && canDo("drilldown_view");
  return `
    <article class="card metric ${canDrilldown ? "metric-clickable" : ""}" ${canDrilldown ? `role="button" tabindex="0" data-drilldown="${escapeHtml(drilldownType)}"` : ""}>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </article>
  `;
}

function drilldownPill(type, label) {
  return canDo("drilldown_view")
    ? `<button class="pill pill-button" type="button" data-drilldown="${escapeHtml(type)}">${escapeHtml(label)}</button>`
    : `<span class="pill">${escapeHtml(label)}</span>`;
}

function documentLineSummary(lines = []) {
  return lines.map((line) => {
    const serial = line.serialName ? ` SN ${line.serialName}` : "";
    return `${productById(line.productId).sku} x ${line.qty}${serial}`;
  }).join(", ");
}

function receiptDrilldownRow(receipt, amount = Number(receipt.total || 0), note = "") {
  return {
    type: "receipt",
    id: receipt.id,
    date: receipt.date,
    createdAt: receipt.createdAt,
    partner: customerById(receipt.customerId).name,
    lines: documentLineSummary(receipt.lines),
    amount,
    method: paymentLabel(receipt.paymentMethod),
    status: statusLabel(receipt.status),
    note: note || receipt.note || "",
    canReturn: receipt.status !== "returned"
  };
}

function returnDrilldownRow(returnDoc, amount = Number(returnDoc.total || 0), note = "") {
  const receipt = state.receipts.find((item) => item.id === returnDoc.receiptId);
  return {
    type: "return",
    id: returnDoc.id,
    date: returnDoc.date,
    createdAt: returnDoc.createdAt,
    partner: receipt ? customerById(receipt.customerId).name : "-",
    lines: documentLineSummary(returnDoc.lines),
    amount,
    method: refundLabel(returnDoc.refundMethod),
    status: "повернення",
    note: note || returnDoc.reason || ""
  };
}

function receiptMargin(receipt) {
  const cost = (receipt.lines || []).reduce((sum, line) => {
    return sum + Number(productById(line.productId).cost || 0) * Number(line.qty || 0);
  }, 0);
  return Number(receipt.total || 0) - cost;
}

function drilldownData(type) {
  const day = today();
  const posted = state.receipts.filter((receipt) => receipt.status === "posted");
  const todayReceipts = state.receipts.filter((receipt) => receipt.date === day);
  const dayReceipts = posted.filter((receipt) => receipt.date === day);
  const dayReturns = state.returns.filter((item) => item.date === day);
  const allReturns = state.returns;
  const allRevenue = posted.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const allReturnsTotal = allReturns.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const todayRevenue = todayReceipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const dayRevenue = dayReceipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const dayReturnsTotal = dayReturns.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const configs = {
    dashboard_revenue: {
      title: "Розшифровка виторгу",
      totalLabel: "Виторг мінус повернення",
      total: allRevenue - allReturnsTotal,
      rows: [
        ...posted.map((receipt) => receiptDrilldownRow(receipt)),
        ...allReturns.map((item) => returnDrilldownRow(item, -Number(item.total || 0), "мінус повернення"))
      ]
    },
    pos_today_receipts: {
      title: "Продажі сьогодні",
      totalLabel: "Кількість продажів",
      totalType: "count",
      total: todayReceipts.length,
      rows: todayReceipts.map((receipt) => receiptDrilldownRow(receipt))
    },
    pos_today_revenue: {
      title: "Виторг сьогодні",
      totalLabel: "Виторг до повернень",
      total: todayRevenue,
      rows: todayReceipts.map((receipt) => receiptDrilldownRow(receipt))
    },
    returns_journal: {
      title: "Журнал повернень",
      totalLabel: "Сума повернень",
      total: allReturnsTotal,
      rows: allReturns.map((item) => returnDrilldownRow(item))
    },
    report_revenue: {
      title: "Звіт дня: виторг",
      totalLabel: "Виторг дня",
      total: dayRevenue,
      rows: dayReceipts.map((receipt) => receiptDrilldownRow(receipt))
    },
    report_returns: {
      title: "Звіт дня: повернення",
      totalLabel: "Повернення дня",
      total: dayReturnsTotal,
      rows: dayReturns.map((item) => returnDrilldownRow(item))
    },
    report_margin: {
      title: "Звіт дня: маржа",
      totalLabel: "Маржа мінус повернення",
      total: dayReceipts.reduce((sum, receipt) => sum + receiptMargin(receipt), 0) - dayReturnsTotal,
      rows: dayReceipts.map((receipt) => receiptDrilldownRow(receipt, receiptMargin(receipt), "маржа по чеку"))
    },
    report_net: {
      title: "Звіт дня: чисто",
      totalLabel: "Чисто за день",
      total: dayRevenue - dayReturnsTotal,
      rows: [
        ...dayReceipts.map((receipt) => receiptDrilldownRow(receipt)),
        ...dayReturns.map((item) => returnDrilldownRow(item, -Number(item.total || 0), "мінус повернення"))
      ]
    }
  };
  return configs[type] || configs.dashboard_revenue;
}

function drilldownTotalValue(data) {
  return data.totalType === "count" ? String(data.total) : formatMoney(data.total);
}

function receiptListRow(receipt) {
  return {
    type: "receipt",
    id: receipt.id,
    date: receipt.date,
    createdAt: receipt.createdAt,
    customer: customerById(receipt.customerId).name,
    customerSearch: customerLookupValue(customerById(receipt.customerId)),
    lines: documentLineSummary(receipt.lines),
    amount: Number(receipt.total || 0),
    method: paymentLabel(receipt.paymentMethod),
    status: statusLabel(receipt.status),
    note: receipt.note || "",
    canReturn: receipt.status !== "returned"
  };
}

function returnListRow(returnDoc) {
  const receipt = state.receipts.find((item) => item.id === returnDoc.receiptId);
  const customer = receipt ? customerById(receipt.customerId) : null;
  return {
    type: "return",
    id: returnDoc.id,
    date: returnDoc.date,
    createdAt: returnDoc.createdAt,
    customer: customer?.name || "-",
    customerSearch: customer ? customerLookupValue(customer) : "",
    lines: documentLineSummary(returnDoc.lines),
    amount: Number(returnDoc.total || 0),
    method: refundLabel(returnDoc.refundMethod),
    status: returnDoc.reason || "повернення",
    note: `продаж ${returnDoc.receiptId}`
  };
}

function normalizeDocumentListRow(row) {
  return {
    type: row.type,
    id: row.id,
    date: row.date,
    createdAt: row.createdAt,
    customer: row.customer || row.partner || "-",
    customerSearch: row.customerSearch || row.partner || "",
    lines: row.lines || "",
    amount: Number(row.amount || 0),
    method: row.method || "",
    status: row.status || "",
    note: row.note || "",
    canReturn: row.canReturn !== false
  };
}

function documentListPrefs(kind) {
  return state.listUi?.[kind] || seedState.listUi.receipts;
}

function documentListSortLabel(kind, field, label) {
  const prefs = documentListPrefs(kind);
  const active = prefs.sortBy === field;
  const dir = active ? (prefs.sortDir === "asc" ? " ↑" : " ↓") : "";
  return `<button class="list-sort ${active ? "active" : ""}" type="button" data-list-sort="${escapeHtml(kind)}" data-sort-field="${escapeHtml(field)}">${escapeHtml(label + dir)}</button>`;
}

function rowMatchesDocumentList(row, prefs) {
  if (prefs.date && row.date !== prefs.date) return false;
  if (prefs.customer && !normalizeScanText(`${row.customer} ${row.customerSearch}`).includes(normalizeScanText(prefs.customer))) return false;
  return true;
}

function sortedDocumentRows(rows, prefs) {
  const accessors = {
    id: (row) => row.id,
    date: (row) => `${row.date || ""} ${row.createdAt || ""}`,
    customer: (row) => row.customer,
    amount: (row) => row.amount,
    method: (row) => row.method,
    status: (row) => row.status
  };
  const getter = accessors[prefs.sortBy] || accessors.date;
  const direction = prefs.sortDir === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const a = getter(left);
    const b = getter(right);
    if (typeof a === "number" || typeof b === "number") return (Number(a || 0) - Number(b || 0)) * direction;
    return String(a || "").localeCompare(String(b || ""), "uk") * direction;
  });
}

function documentListControls(kind) {
  if (!canDo("document_list_sort")) return "";
  const prefs = documentListPrefs(kind);
  return `
    <div class="list-controls">
      <label class="field"><span>Дата</span><input type="date" data-list-filter="${escapeHtml(kind)}" data-filter-field="date" value="${escapeHtml(prefs.date || "")}"></label>
      <label class="field"><span>Покупець</span><input data-list-filter="${escapeHtml(kind)}" data-filter-field="customer" value="${escapeHtml(prefs.customer || "")}" placeholder="ім'я або телефон"></label>
      <div class="sort-controls">
        <span>Сортування</span>
        ${documentListSortLabel(kind, "id", "Документ")}
        ${documentListSortLabel(kind, "date", "Дата")}
        ${documentListSortLabel(kind, "customer", "Покупець")}
        ${documentListSortLabel(kind, "amount", "Сума")}
        ${documentListSortLabel(kind, "method", "Метод")}
        ${documentListSortLabel(kind, "status", "Стан")}
      </div>
    </div>
  `;
}

function documentListHeader(kind, title, countLabel) {
  const prefs = documentListPrefs(kind);
  const canCollapse = canDo("document_list_collapse");
  return `
    <div class="split list-heading">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <span class="muted">${escapeHtml(countLabel)}</span>
      </div>
      ${canCollapse ? `<button class="secondary collapse-button" type="button" data-toggle-list="${escapeHtml(kind)}" aria-expanded="${prefs.collapsed ? "false" : "true"}">${prefs.collapsed ? "▸" : "▾"}</button>` : ""}
    </div>
  `;
}

function renderDocumentStripList(kind, sourceRows, emptyText = "Документів немає.") {
  if (!canDo("document_list_view")) {
    return '<p class="muted">Для цієї ролі списки документів приховані.</p>';
  }
  const prefs = documentListPrefs(kind);
  const rows = sortedDocumentRows(sourceRows.map(normalizeDocumentListRow).filter((row) => rowMatchesDocumentList(row, prefs)), prefs);
  if (prefs.collapsed && canDo("document_list_collapse")) {
    return '<p class="muted">Список згорнуто.</p>';
  }
  return `
    ${documentListControls(kind)}
    <div class="document-list">
      ${rows.map((row) => `
        <div class="document-row ${row.type === "return" ? "return-row" : ""} ${state.checkout.printReceiptId === row.id || state.selectedReturnId === row.id ? "selected-row" : ""}" role="button" tabindex="0" data-open-document="${escapeHtml(`${row.type}::${row.id}`)}">
          <div class="document-main">
            <strong>${escapeHtml(row.id)}</strong>
            <span>${escapeHtml(row.date)} · ${formatDateTime(row.createdAt)}</span>
          </div>
          <div>
            <span class="document-label">Покупець</span>
            <strong>${escapeHtml(row.customer)}</strong>
          </div>
          <div>
            <span class="document-label">Позиції</span>
            <span>${escapeHtml(row.lines || "-")}</span>
          </div>
          <div>
            <span class="document-label">Метод</span>
            <span>${escapeHtml(row.method)}</span>
          </div>
          <div>
            <span class="document-label">Стан</span>
            <span>${escapeHtml(row.status)}</span>
          </div>
          <div class="document-amount">
            <strong>${formatMoney(row.amount)}</strong>
            ${row.note ? `<span>${escapeHtml(row.note)}</span>` : ""}
          </div>
          <div class="row-actions">
            ${row.type === "receipt" ? `<button class="secondary" type="button" data-print-receipt="${escapeHtml(row.id)}">Друк</button>` : ""}
            ${canDo("document_edit") ? `<button class="secondary" type="button" data-edit-document="${escapeHtml(`${row.type}::${row.id}`)}">Змінити</button>` : ""}
            ${row.type === "receipt" && canDo("return_create") ? `<button class="secondary" type="button" data-return-receipt="${escapeHtml(row.id)}" ${row.canReturn ? "" : "disabled"}>Повернення</button>` : ""}
          </div>
        </div>
      `).join("") || `<div class="document-row empty-row"><span class="muted">${escapeHtml(emptyText)}</span></div>`}
    </div>
  `;
}

function renderDrilldownModal() {
  if (!state.drilldown.open || !canDo("drilldown_view")) return "";
  const data = drilldownData(state.drilldown.type);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="drilldown-title">
        <div class="split">
          <div>
            <p class="eyebrow">Розшифровка</p>
            <h2 id="drilldown-title">${escapeHtml(data.title)}</h2>
          </div>
          <button class="secondary" type="button" data-close-drilldown>Закрити</button>
        </div>
        <dl class="summary-list">
          <div><dt>${escapeHtml(data.totalLabel)}</dt><dd><strong>${escapeHtml(drilldownTotalValue(data))}</strong></dd></div>
          <div><dt>Документів</dt><dd>${data.rows.length}</dd></div>
        </dl>
        ${documentListHeader("drilldown", "Документи у розшифровці", `${data.rows.length} рядків`)}
        ${renderDocumentStripList("drilldown", data.rows, "Немає документів для цієї розшифровки.")}
      </section>
    </div>
  `;
}

function renderDocumentEditModal() {
  if (!state.documentEdit.open || !canDo("document_edit")) return "";
  const { type, id } = state.documentEdit;
  if (type === "receipt") {
    const receipt = state.receipts.find((item) => item.id === id);
    if (!receipt) return "";
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="document-edit-title">
          <div class="split">
            <div>
              <p class="eyebrow">Документ продажу</p>
              <h2 id="document-edit-title">Змінити продаж ${escapeHtml(receipt.id)}</h2>
            </div>
            <button class="secondary" type="button" data-close-document-edit>Закрити</button>
          </div>
          <form class="form-grid one-col" data-action="save-document-edit">
            <label class="field"><span>Клієнт</span><select name="customerId">${state.customers.map((customer) => option(customer.id, customerLookupValue(customer), customer.id === receipt.customerId)).join("")}</select></label>
            <label class="field"><span>Метод оплати</span><select name="paymentMethod">${["cash", "card", "bank"].map((method) => option(method, paymentLabel(method), method === receipt.paymentMethod)).join("")}</select></label>
            <label class="field"><span>Коментар</span><input name="note" value="${escapeHtml(receipt.note || "")}"></label>
            <dl class="summary-list">
              <div><dt>Сума</dt><dd><strong>${formatMoney(receipt.total)}</strong></dd></div>
              <div><dt>Стан</dt><dd>${escapeHtml(statusLabel(receipt.status))}</dd></div>
            </dl>
            <div class="toolbar">
              <button class="secondary" type="button" data-close-document-edit>Скасувати</button>
              <button class="primary" type="submit">Зберегти зміни</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  const returnDoc = state.returns.find((item) => item.id === id);
  if (!returnDoc) return "";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="document-edit-title">
        <div class="split">
          <div>
            <p class="eyebrow">Документ повернення</p>
            <h2 id="document-edit-title">Змінити повернення ${escapeHtml(returnDoc.id)}</h2>
          </div>
          <button class="secondary" type="button" data-close-document-edit>Закрити</button>
        </div>
        <form class="form-grid one-col" data-action="save-document-edit">
          <label class="field"><span>Метод повернення грошей</span><select name="refundMethod">${["card", "cash"].map((method) => option(method, refundLabel(method), method === returnDoc.refundMethod)).join("")}</select></label>
          <label class="field"><span>Причина</span><input name="reason" value="${escapeHtml(returnDoc.reason || "")}"></label>
          <dl class="summary-list">
            <div><dt>Продаж</dt><dd>${escapeHtml(returnDoc.receiptId)}</dd></div>
            <div><dt>Сума</dt><dd><strong>${formatMoney(returnDoc.total)}</strong></dd></div>
          </dl>
          <div class="toolbar">
            <button class="secondary" type="button" data-close-document-edit>Скасувати</button>
            <button class="primary" type="submit">Зберегти зміни</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function setTitle(title) {
  document.getElementById("page-title").textContent = title;
}

function renderSessionStatus() {
  const employee = currentEmployee();
  if (!employee) {
    return `
      <div class="top-status-card top-session-card" title="Вхід не виконано">
        <span class="card-icon" aria-hidden="true">С</span>
        <span class="top-status-label">Сеанс</span>
        <strong>Вхід не виконано</strong>
        <small>Рольові блоки приховані</small>
        <div class="top-status-actions">
          <button class="topbar-action" type="button" data-open-employee-login>Увійти</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="top-status-card top-session-card" title="${escapeHtml(employee.name)} · ${escapeHtml(roleLabel(employee.role))}">
      <span class="card-icon" aria-hidden="true">С</span>
      <span class="top-status-label">Сеанс</span>
      <strong>${escapeHtml(employee.name)}</strong>
      <small>${escapeHtml(roleLabel(employee.role))} · ${escapeHtml(employeeSessionLabel(employee))}</small>
      <div class="top-status-actions">
        <button class="topbar-action" type="button" data-open-employee-login>Змінити вхід</button>
        <button class="topbar-action danger-outline" type="button" data-logout-employee>Вийти</button>
      </div>
    </div>
  `;
}

function renderTopStatus() {
  const target = document.getElementById("top-status");
  if (!target) return;
  const serverUrl = state.systemSettings.publicBaseUrl || state.systemSettings.publicHost;
  target.innerHTML = `
    ${renderSessionStatus()}
    <div class="top-status-card top-server-card" title="Сервер: ${escapeHtml(serverSyncLabel())}">
      <span class="card-icon" aria-hidden="true">S</span>
      <span class="top-status-label">Сервер</span>
      <strong><span class="pill ${serverSyncClass()}">${escapeHtml(serverSyncLabel())}</span></strong>
      <small>${escapeHtml(serverUrl)}</small>
    </div>
  `;
}

function renderNav() {
  const itemsHtml = navItems.map((item) => {
    if (Array.isArray(item)) {
      const [id, label] = item;
      if (!canOpenBlock(id)) return "";
      return `<button type="button" class="${state.currentView === id ? "active" : ""}" data-view="${id}" title="${escapeHtml(label)}"><span class="nav-icon" aria-hidden="true">${escapeHtml(navIcon(id))}</span><span class="nav-label">${escapeHtml(label)}</span></button>`;
    }

    const children = (item.children || []).filter(([id]) => canOpenBlock(id));
    if (!children.length) return "";
    const active = children.some(([id]) => state.currentView === id);
    return `
      <div class="nav-group ${active ? "open" : ""}">
        <button type="button" class="nav-group-label" aria-haspopup="true" aria-expanded="${active ? "true" : "false"}" title="${escapeHtml(item.label)}">
          <span class="nav-icon" aria-hidden="true">${escapeHtml(navIcon(item.id))}</span>
          <span class="nav-label">${escapeHtml(item.label)}</span>
          <span class="nav-group-caret" aria-hidden="true">&gt;</span>
        </button>
        <div class="nav-submenu">
          ${children.map(([id, label]) => `<button type="button" class="${state.currentView === id ? "active" : ""}" data-view="${id}" title="${escapeHtml(label)}"><span class="nav-icon" aria-hidden="true">${escapeHtml(navIcon(id))}</span><span class="nav-label">${escapeHtml(label)}</span></button>`).join("")}
        </div>
      </div>
    `;
  }).join("");
  document.getElementById("nav").innerHTML = itemsHtml;
}

function renderEmployeeEditModal() {
  if (!state.employeeEdit?.open) return "";
  const employee = state.employees.find((item) => item.id === state.employeeEdit.employeeId);
  if (!employee) return "";
  const disabled = canEditEmployeeFields() ? "" : "disabled";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="employee-edit-title">
        <div class="split">
          <div>
            <p class="eyebrow">B2C.10 Працівники</p>
            <h2 id="employee-edit-title">Картка працівника</h2>
          </div>
          <button class="secondary" type="button" data-close-employee-edit>Закрити</button>
        </div>
        <form class="form-grid" data-action="save-employee-edit">
          <input type="hidden" name="employeeId" value="${escapeHtml(employee.id)}">
          <label class="field"><span>Код</span><input name="code" value="${escapeHtml(employee.code)}" required ${disabled}></label>
          <label class="field wide"><span>ПІБ</span><input name="name" value="${escapeHtml(employee.name)}" required ${disabled}></label>
          <label class="field"><span>Роль</span><select name="role" ${disabled}>${Object.entries(EMPLOYEE_ROLES).map(([id, role]) => option(id, role.label, id === employee.role)).join("")}</select></label>
          <label class="field"><span>Статус</span><select name="status" ${disabled}>${Object.entries(EMPLOYEE_STATUSES).map(([id, label]) => option(id, label, id === employee.status)).join("")}</select></label>
          <label class="field"><span>Телефон</span><input name="phone" value="${escapeHtml(employee.phone || "")}" ${disabled}></label>
          <label class="field"><span>Email</span><input name="email" type="email" value="${escapeHtml(employee.email || "")}" ${disabled}></label>
          <label class="field"><span>Логін</span><input name="login" value="${escapeHtml(employee.login || "")}" ${disabled}></label>
          <label class="field"><span>Пароль / PIN</span><input name="pin" type="password" autocomplete="new-password" value="${escapeHtml(employee.pin || "")}" ${disabled}></label>
          <label class="field"><span>Магазин</span><input name="store" value="${escapeHtml(employee.store || "")}" ${disabled}></label>
          <label class="field"><span>Графік</span><input name="schedule" value="${escapeHtml(employee.schedule || "")}" ${disabled}></label>
          <label class="field"><span>Дата прийому</span><input name="hireDate" type="date" value="${escapeHtml(employee.hireDate || today())}" ${disabled}></label>
          <label class="field wide"><span>Коментар</span><input name="note" value="${escapeHtml(employee.note || "")}" ${disabled}></label>
          <div class="toolbar full">
            <button class="secondary" type="button" data-close-employee-edit>Скасувати</button>
            <button class="primary" type="submit" ${disabled}>Зберегти зміни</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderEmployeeLoginModal() {
  const active = activeEmployees();
  const selectedId = loginDialog.employeeId
    || currentEmployee()?.id
    || active[0]?.id
    || "";
  if (!loginDialog.open && currentEmployee()) return "";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="employee-login-title">
        <div class="split">
          <div>
            <p class="eyebrow">Сеанс B2C</p>
            <h2 id="employee-login-title">Вхід працівника</h2>
          </div>
          ${currentEmployee() ? `<button class="secondary" type="button" data-close-employee-login>Закрити</button>` : ""}
        </div>
        <form class="form-grid one-col" data-action="employee-login">
          ${sessionNotice ? `<p class="warning-note">${escapeHtml(sessionNotice)}</p>` : ""}
          <label class="field"><span>Логін працівника</span><select name="employeeId" required>
            ${active.map((employee) => option(employee.id, `${employee.login || employee.code} · ${employee.name} · ${roleLabel(employee.role)}`, employee.id === selectedId)).join("")}
          </select></label>
          <label class="field"><span>Пароль / PIN</span><input name="pin" type="password" autocomplete="current-password" placeholder="пароль/PIN із картки працівника"></label>
          <div class="toolbar">
            ${currentEmployee() ? `<button class="secondary" type="button" data-close-employee-login>Скасувати</button>` : ""}
            <button class="primary" type="submit" ${active.length ? "" : "disabled"}>Увійти</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderDashboard() {
  return renderPos();
}

function renderCheckout() {
  setTitle("Продаж");
  return renderCheckoutPanel(true);
}

function renderPos() {
  setTitle("Продаж");
  const shift = openShift();
  const todayReceipts = state.receipts.filter((receipt) => receipt.date === today());
  const todayRevenue = todayReceipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const cashier = employeeById(state.selectedCashierId);
  return `
    <section class="grid four">
      ${metricCard("Касова зміна", shift ? "Відкрита" : "Закрита", shift ? shift.id : "Можна відкрити в цьому блоці.")}
      ${metricCard("Касир", shift?.cashier || cashier.name, `${shift?.cashierRole || roleLabel(cashier.role)}.`)}
      ${metricCard("Продажів сьогодні", String(todayReceipts.length), "Список продажів у цьому ж блоці.", "pos_today_receipts")}
      ${metricCard("Виторг сьогодні", formatMoney(todayRevenue), "До повернень.", "pos_today_revenue")}
    </section>
    <div class="section-gap">${renderCheckoutPanel(true)}</div>
    <div class="section-gap">${renderReceiptsContent()}</div>
    <div class="section-gap">${renderCashContent()}</div>
  `;
}

function renderCheckoutPanel(full = false) {
  if (!canDo("sale_create")) {
    return `
      <section class="panel ${full ? "" : "compact-panel"}">
        <h2>B2C.1 Продаж</h2>
        <p class="muted">Для ролі активного працівника не увімкнено дію "Створити продаж".</p>
      </section>
    `;
  }
  const lines = cartLines();
  const subtotal = receiptSubtotal(lines);
  const loyalDiscount = loyaltyDiscount(lines);
  const total = checkoutTotal(lines);
  const customer = customerById(state.checkout.customerId);
  const customerLookup = state.checkout.customerSearch || customerLookupValue(customer);
  const productLookupItems = currentProductLookupItems();
  const selectedLookupProduct = findStockedLiveLookupProduct(state.checkout.search);
  const priceSelectionEnabled = canDo("price_select");
  const priceTypeOptions = checkoutPriceTypeOptions(selectedLookupProduct);
  const currencyOptions = checkoutCurrencyOptions(selectedLookupProduct);
  return `
    <section class="panel ${full ? "" : "compact-panel"}">
      <div class="split">
        <h2>B2C.1 Продаж</h2>
        <span class="pill ${openShift() ? "good" : "danger"}">${openShift() ? "каса відкрита" : "відкрийте касу"}</span>
      </div>
      <form class="form-grid checkout-form" data-action="create-receipt">
        <label class="field wide"><span>Покупець</span><input name="customerSearch" data-customer-lookup list="customer-options" value="${escapeHtml(customerLookup)}" autocomplete="off" placeholder="ім'я, телефон, код або email з SQL"><datalist id="customer-options">${currentCustomerLookupItems().map((item) => `<option value="${escapeHtml(customerLookupValue(item))}"></option>`).join("")}</datalist><small class="lookup-status ${customerLookupStatusClass()}" data-customer-lookup-status>${escapeHtml(customerLookupStatusText())}</small></label>
        <label class="field"><span>Оплата</span><select name="paymentMethod" data-checkout-field>${["cash", "card", "bank"].map((method) => option(method, paymentLabel(method), method === state.checkout.paymentMethod)).join("")}</select></label>
        <label class="field wide"><span>Товар із залишком / штрихкод / QR</span><input name="search" data-product-lookup list="product-options" value="${escapeHtml(state.checkout.search)}" autocomplete="off" placeholder="назва, SKU, штрихкод або QR із залишком на Склад №1"><datalist id="product-options">${productLookupItems.map((product) => `<option value="${escapeHtml(productLookupValue(product))}"></option>`).join("")}</datalist><small class="lookup-status ${productLookupStatusClass()}" data-product-lookup-status>${escapeHtml(productLookupStatusText())}</small></label>
        <div class="field lookup-action"><span>Додати</span><button class="secondary" type="button" data-add-selected-product>Додати товар</button></div>
        <label class="field"><span>Тип ціни</span><select name="priceType" data-checkout-field ${priceSelectionEnabled ? "" : "disabled"}>${priceTypeOptions.map((type) => option(type, type, type === state.checkout.priceType)).join("")}</select></label>
        <label class="field"><span>Валюта</span><select name="priceCurrency" data-checkout-field ${priceSelectionEnabled ? "" : "disabled"}>${currencyOptions.map((currency) => option(currency, CURRENCY_LABELS[currency] || currency, currency === state.checkout.priceCurrency)).join("")}</select></label>
        <div class="loyalty-note full">
          <span class="pill">${escapeHtml(LOYALTY_LABELS[customer.loyalty] || customer.loyalty)}</span>
          <strong>${escapeHtml(customer.name)}</strong>
          <span>${loyaltyRate()}% автоматична знижка лояльності</span>
        </div>
        <label class="field full"><span>Коментар</span><input name="note" data-checkout-field value="${escapeHtml(state.checkout.note || "")}" placeholder="примітка до продажу"></label>
        <div class="table-wrap full">
          <table>
            <thead><tr><th>Товар</th><th>Склад №1</th><th>Серійний номер</th><th>Ціна</th><th>К-сть</th><th>Знижка, %</th><th>Сума</th><th></th></tr></thead>
            <tbody>
              ${lines.map((line, index) => {
                const product = productById(line.productId);
                const weapon = isWeaponProduct(product);
                const serialOptions = checkoutLineSerialOptions(line);
                const stockAvailable = checkoutLineWarehouseStock(line, product);
                const stockClass = line.stockError ? "warn" : stockAvailable > 0 ? "good" : "danger";
                const serialControl = weapon
                  ? `
                    <select class="mini-select" data-cart-serial="${index}" ${line.serialLoading ? "disabled" : ""}>
                      <option value="">Виберіть серійний номер</option>
                      ${serialOptions.map((item) => option(item.serialName, item.serialName, item.serialName === line.serialName)).join("")}
                    </select>
                    <small class="lookup-status ${line.serialError ? "warn" : line.serialName ? "good" : "warn"}">${escapeHtml(line.serialLoading ? "Завантаження серійників..." : line.serialError || `${serialOptions.length} доступно`)}</small>
                  `
                  : '<span class="muted">не потрібно</span>';
                return `
                  <tr>
                    <td>${escapeHtml(product.name)}<br><span class="muted">${escapeHtml(product.productCode || product.sku)}${weapon ? " · зброя" : ""}</span></td>
                    <td><span class="pill ${stockClass}">${escapeHtml(checkoutLineStockHint(line, product))}</span></td>
                    <td>${serialControl}</td>
                    <td>${checkoutLinePriceHtml(line, index)}</td>
                    <td><input class="mini-input" data-cart-qty="${index}" type="number" min="1" ${weapon ? 'max="1"' : ""} value="${line.qty}"></td>
                    <td><input class="mini-input" data-cart-discount="${index}" type="number" min="0" max="100" step="0.01" value="${line.discount}" title="Знижка у відсотках"></td>
                    <td><strong data-cart-line-total="${index}">${formatMoney(lineTotal(line))}</strong></td>
                    <td><button class="secondary" type="button" data-remove-cart="${index}">Прибрати</button></td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="8" class="muted">Додайте товар із поля вище. Live-залишки завантажуються під час вибору товару.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="cart-summary full">
          <div>
            <span>Підсумок: <span data-cart-subtotal>${formatMoney(subtotal)}</span></span>
            <span>Лояльність: -<span data-cart-loyalty>${formatMoney(loyalDiscount)}</span></span>
            <strong>Разом: <span data-cart-total>${formatMoney(total)}</span></strong>
          </div>
          <button class="primary" type="submit" ${openShift() && lines.length ? "" : "disabled"}>Провести продаж</button>
        </div>
      </form>
    </section>
  `;
}

function renderSalePaymentConfirm() {
  if (!state.saleConfirm.open) return "";
  const lines = cartLines();
  const customer = customerById(state.checkout.customerId);
  const method = state.saleConfirm.paymentMethod || state.checkout.paymentMethod || "card";
  const bankBlocked = method === "bank" && !hasRegisteredCustomer();
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="sale-payment-title">
        <div class="split">
          <div>
            <p class="eyebrow">Перед проведенням продажу</p>
            <h2 id="sale-payment-title">Підтвердити метод оплати</h2>
          </div>
          <button class="secondary" type="button" data-cancel-sale-confirm>Скасувати</button>
        </div>
        <form class="form-grid one-col" data-action="confirm-sale-payment">
          <label class="field">
            <span>Метод оплати</span>
            <select name="paymentMethod" data-sale-confirm-payment>${["cash", "card", "bank"].map((item) => option(item, paymentLabel(item), item === method)).join("")}</select>
          </label>
          <dl class="summary-list">
            <div><dt>Покупець</dt><dd>${escapeHtml(customer.name)}</dd></div>
            <div><dt>Позицій</dt><dd>${lines.length}</dd></div>
            <div><dt>Сума</dt><dd><strong>${formatMoney(checkoutTotal(lines))}</strong></dd></div>
          </dl>
          ${bankBlocked ? '<p class="warning-note">Для оплати "Банк" потрібно вибрати клієнта з довідника. Роздрібний покупець не допускається.</p>' : ""}
          <div class="toolbar">
            <button class="secondary" type="button" data-cancel-sale-confirm>Скасувати</button>
            <button class="primary" type="submit">Підтвердити і провести</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderReturnRefundConfirm() {
  if (!state.returnConfirm.open || !state.returnConfirm.payload) return "";
  const payload = state.returnConfirm.payload;
  const receipt = state.receipts.find((item) => item.id === payload.receiptId);
  const method = ["cash", "card"].includes(state.returnConfirm.refundMethod) ? state.returnConfirm.refundMethod : "card";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="return-refund-title">
        <div class="split">
          <div>
            <p class="eyebrow">Перед проведенням повернення</p>
            <h2 id="return-refund-title">Як повернути гроші покупцю?</h2>
          </div>
          <button class="secondary" type="button" data-cancel-return-confirm>Скасувати</button>
        </div>
        <form class="form-grid one-col" data-action="confirm-return-refund">
          <label class="field">
            <span>Повернути гроші</span>
            <select name="refundMethod" data-return-confirm-refund>${["card", "cash"].map((item) => option(item, refundLabel(item), item === method)).join("")}</select>
          </label>
          <dl class="summary-list">
            <div><dt>Продаж</dt><dd>${escapeHtml(payload.receiptId)}</dd></div>
            <div><dt>Початкова оплата</dt><dd>${escapeHtml(paymentLabel(receipt?.paymentMethod))}</dd></div>
            <div><dt>Сума повернення</dt><dd><strong>${formatMoney(payload.total)}</strong></dd></div>
          </dl>
          <div class="toolbar">
            <button class="secondary" type="button" data-cancel-return-confirm>Скасувати</button>
            <button class="primary" type="submit">Підтвердити повернення</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderReceipts() {
  setTitle("Продажі магазину");
  return renderReceiptsContent();
}

function renderReceiptsContent() {
  const selected = state.receipts.find((receipt) => receipt.id === state.checkout.printReceiptId) || state.receipts[0];
  const receiptRows = state.receipts.map(receiptListRow);
  return `
    <section class="stacked-panels">
      <article class="panel">
        ${documentListHeader("receipts", "B2C.2 Продажі", `${state.receipts.length} документів`)}
        ${renderDocumentStripList("receipts", receiptRows, "Продажів ще немає.")}
      </article>
      <article class="panel">
        <div class="split">
          <h2>Продаж до друку</h2>
          <span class="pill">${selected ? escapeHtml(selected.id) : "немає"}</span>
        </div>
        ${selected ? renderReceiptSlip(selected) : '<p class="muted">Оберіть продаж для перегляду.</p>'}
      </article>
    </section>
  `;
}

function renderReceiptSlip(receipt) {
  const customer = customerById(receipt.customerId);
  return `
    <div class="receipt-slip">
      <strong>Роздрібна торгівля B2C</strong>
      <span>${escapeHtml(receipt.id)} · ${formatDateTime(receipt.createdAt)}</span>
      <span>Покупець: ${escapeHtml(customer.name)}</span>
      <hr>
      ${receipt.lines.map((line) => {
        const product = productById(line.productId);
        const discount = discountPercentValue(line.discountPercent ?? line.discount ?? 0);
        const details = [
          `${product.sku} x ${line.qty}`,
          line.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
          line.serialName ? `SN ${line.serialName}` : "",
          discount ? `знижка ${discount}%` : ""
        ].filter(Boolean).join(" · ");
        return `<div class="receipt-line"><span>${escapeHtml(details)}</span><strong>${formatMoney(line.total)}</strong></div>`;
      }).join("")}
      ${Number(receipt.loyaltyDiscount || 0) ? `<div class="receipt-line muted"><span>Знижка лояльності</span><strong>-${formatMoney(receipt.loyaltyDiscount)}</strong></div>` : ""}
      <hr>
      <div class="receipt-line total"><span>До сплати</span><strong>${formatMoney(receipt.total)}</strong></div>
      <span>Оплата: ${escapeHtml(paymentLabel(receipt.paymentMethod))}</span>
    </div>
  `;
}

function renderReturns() {
  setTitle("Повернення");
  const returnableReceipts = state.receipts.filter((receipt) => receipt.status !== "returned");
  const returnRows = state.returns.map(returnListRow);
  return `
    <section class="stacked-panels">
      <article class="panel">
        <div class="split">
          <h2>B2C.3 Повернення</h2>
          <span class="pill">${state.returns.length} документів</span>
        </div>
        ${canDo("return_create") ? `<form class="form-grid one-col" data-action="create-return">
          <label class="field"><span>Продаж</span><select name="receiptId">${returnableReceipts.map((receipt) => option(receipt.id, `${receipt.id} · ${customerById(receipt.customerId).name} · ${formatMoney(receipt.total)}`)).join("")}</select></label>
          <label class="field"><span>Товар</span><select name="productId">${returnableReceipts.flatMap((receipt) => receiptReturnableLines(receipt).filter((line) => line.returnable > 0).map((line) => option(`${receipt.id}::${line.productId}`, `${receipt.id} · ${productById(line.productId).sku} · доступно ${line.returnable}`))).join("")}</select></label>
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1"></label>
          <label class="field"><span>Причина</span><input name="reason" value="часткове повернення"></label>
          <button class="primary" type="submit" ${returnableReceipts.length ? "" : "disabled"}>Оформити повернення</button>
        </form>` : '<p class="muted">Для ролі активного працівника не увімкнено дію "Повернення".</p>'}
      </article>
      <article class="panel">
        <div class="split">
          <h2>Журнал повернень</h2>
          ${drilldownPill("returns_journal", `${state.returns.length} документів`)}
        </div>
        ${documentListHeader("returns", "Список повернень", `${state.returns.length} документів`)}
        ${renderDocumentStripList("returns", returnRows, "Повернень ще немає.")}
      </article>
    </section>
  `;
}

function inventoryRows() {
  return state.inventory.lines.map((line) => {
    const product = state.products.find((item) => item.id === line.productId);
    if (!product) return null;
    const warehouseCode = String(line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE);
    const warehouseName = line.warehouseName || warehouseNameByCode(warehouseCode);
    const serialName = String(line.serialName || line.serialNumber || "");
    const expectedQty = serialName ? Number(line.expectedQty ?? 1) : stockQty(product.id, warehouseCode);
    const hasActual = line.actualQty !== "" && line.actualQty !== null && line.actualQty !== undefined;
    const actualQty = hasActual ? Number(line.actualQty || 0) : "";
    const diff = hasActual ? Number(actualQty) - expectedQty : null;
    const price = Number(product.price || 0);
    const expectedAmount = expectedQty * price;
    const actualAmount = hasActual ? Number(actualQty) * price : null;
    const diffAmount = hasActual ? Number(diff || 0) * price : null;
    const lineKey = inventoryLineKeyForLine({ ...line, warehouseCode, serialName });
    return { product, line, lineKey, warehouseCode, warehouseName, serialName, expectedQty, actualQty, hasActual, diff, price, expectedAmount, actualAmount, diffAmount };
  }).filter(Boolean);
}

function inventoryRowMatchesQuery(row, query) {
  const raw = normalizeScanText(query);
  if (!raw) return true;
  const text = normalizeScanText([
    row.product.name,
    row.product.sku,
    row.product.productCode,
    row.product.barcode,
    row.product.qr,
    row.product.sqlId,
    row.product.productGroupPath,
    row.product.productFullPath,
    row.warehouseCode,
    row.warehouseName,
    row.serialName
  ].filter(Boolean).join(" "));
  return text.includes(raw) || productMatchesQuery(row.product, query);
}

function inventoryTotals(rows) {
  return rows.reduce((totals, row) => {
    if (!row.hasActual) return totals;
    totals.counted += 1;
    totals.totalDiff += row.diff;
    if (row.diff > 0) totals.positive += row.diff;
    if (row.diff < 0) totals.negative += row.diff;
    totals.expectedAmount += row.expectedAmount;
    totals.actualAmount += Number(row.actualAmount || 0);
    totals.totalAmountDiff += Number(row.diffAmount || 0);
    if (row.diffAmount > 0) totals.positiveAmount += row.diffAmount;
    if (row.diffAmount < 0) totals.negativeAmount += row.diffAmount;
    return totals;
  }, { counted: 0, totalDiff: 0, positive: 0, negative: 0, expectedAmount: 0, actualAmount: 0, totalAmountDiff: 0, positiveAmount: 0, negativeAmount: 0 });
}

function diffLabel(diff) {
  if (diff === null || diff === undefined) return "-";
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

function inventoryResortTotals(resorts = state.inventory.resorts) {
  return resorts.reduce((totals, item) => {
    totals.qty += Number(item.qty || 0);
    totals.minusAmount += Number(item.minusAmount || 0);
    totals.plusAmount += Number(item.plusAmount || 0);
    totals.netAmount += Number(item.netAmount || 0);
    return totals;
  }, { qty: 0, minusAmount: 0, plusAmount: 0, netAmount: 0 });
}

function renderInventoryResorts(showActions = false) {
  const resorts = state.inventory.resorts || [];
  const totals = inventoryResortTotals(resorts);
  return `
    <div class="resort-summary">
      <span>К-сть: <strong>${totals.qty}</strong></span>
      <span>Мінус: <strong>-${formatMoney(totals.minusAmount)}</strong></span>
      <span>Плюс: <strong>${formatMoney(totals.plusAmount)}</strong></span>
      <span>Різниця: <strong>${formatMoney(totals.netAmount)}</strong></span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Мінус товар</th><th>Плюс товар</th><th>К-сть</th><th>Мінус грн</th><th>Плюс грн</th><th>+/- грн</th>${showActions ? "<th></th>" : ""}</tr></thead>
        <tbody>
          ${resorts.map((item, index) => {
            const from = productById(item.fromProductId);
            const to = productById(item.toProductId);
            return `
              <tr>
                <td>${escapeHtml(from.sku)}<br><span class="muted">${escapeHtml(from.name)}</span></td>
                <td>${escapeHtml(to.sku)}<br><span class="muted">${escapeHtml(to.name)}</span></td>
                <td>${item.qty}</td>
                <td>-${formatMoney(item.minusAmount)}</td>
                <td>${formatMoney(item.plusAmount)}</td>
                <td><span class="pill ${item.netAmount < 0 ? "danger" : item.netAmount > 0 ? "warn" : "good"}">${formatMoney(item.netAmount)}</span></td>
                ${showActions ? `<td><button class="secondary" type="button" data-remove-resort="${index}">Скасувати</button></td>` : ""}
              </tr>
            `;
          }).join("") || `<tr><td colspan="${showActions ? 7 : 6}" class="muted">Пересорту ще немає.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderInventorySheet(rows, totals) {
  return `
    <div class="inventory-print-sheet">
      <div class="split">
        <div>
          <h2>Інвентаризаційний лист</h2>
          <p class="muted">${escapeHtml(state.inventory.id)} · ${escapeHtml(state.inventory.date)} · B2C магазин</p>
        </div>
        <span class="pill">${totals.counted}/${rows.length} позицій</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>SKU</th><th>Склад</th><th>Штрихкод</th><th>Товар</th><th>Роздріб</th><th>Облік</th><th>Факт</th><th>Різниця</th><th>+/- грн</th><th>Підпис</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.product.sku)}</td>
                <td>${escapeHtml(row.warehouseName)}<br><span class="muted">${escapeHtml(row.warehouseCode)}</span></td>
                <td>${escapeHtml(row.product.barcode || "-")}</td>
                <td>${escapeHtml(row.product.name)}${row.serialName ? `<br><span class="muted">SN ${escapeHtml(row.serialName)}</span>` : ""}</td>
                <td>${formatMoney(row.price)}</td>
                <td>${row.expectedQty}</td>
                <td>${row.hasActual ? row.actualQty : ""}</td>
                <td>${diffLabel(row.diff)}</td>
                <td>${row.diffAmount === null ? "" : formatMoney(row.diffAmount)}</td>
                <td></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="inventory-print-total">
        <span>Плюс: ${formatMoney(totals.positiveAmount)}</span>
        <span>Мінус: -${formatMoney(Math.abs(totals.negativeAmount))}</span>
        <span>Нетто: ${formatMoney(totals.totalAmountDiff)}</span>
      </div>
      <h3>Пересорт</h3>
      ${renderInventoryResorts(false)}
    </div>
  `;
}

function renderStock() {
  setTitle("Залишки магазину");
  const stockListCollapsed = Boolean(state.stockUi.stockListCollapsed);
  if (!stockListCollapsed) ensureLiveTableLoaded("stock");
  ensureLiveTableLoaded("warehouses");
  const allRows = inventoryRows();
  const inventorySearch = String(state.inventory.search || "").trim();
  const rows = allRows.filter((row) => inventoryRowMatchesQuery(row, inventorySearch));
  const totals = inventoryTotals(allRows);
  const printTotals = inventoryTotals(rows);
  const resortTotals = inventoryResortTotals();
  const canPostInventory = canDo("inventory_post");
  const canResortInventory = canDo("inventory_resort");
  const selectedInventoryWarehouses = inventorySelectedWarehouseCodes();
  const inventoryWarehouseText = selectedInventoryWarehouses.map((code) => warehouseLabel(code, warehouseNameByCode(code))).join(", ");
  const inventoryWarehouseOptionsHtml = inventoryWarehouseOptions()
    .map((warehouse) => option(warehouse.warehouseCode, warehouseLabel(warehouse.warehouseCode, warehouse.warehouseName), selectedInventoryWarehouses.includes(String(warehouse.warehouseCode))))
    .join("");
  const weaponProducts = state.products.filter(isWeaponProduct);
  const selectedSerialProductId = weaponProducts.some((product) => product.id === state.stockUi.serialProductId)
    ? state.stockUi.serialProductId
    : "";
  const selectedSerialProduct = selectedSerialProductId ? productById(selectedSerialProductId) : null;
  const serialRows = selectedSerialProductId ? state.stockUi.serialRows : [];
  const serialOffset = Math.max(0, Number(state.stockUi.serialOffset || 0));
  const serialLimit = clampLiveLimit(state.stockUi.serialLimit, LIVE_SERIAL_LOOKUP_LIMIT);
  const serialTotal = Math.max(0, Number(state.stockUi.serialTotal || 0));
  const serialFrom = serialRows.length ? serialOffset + 1 : 0;
  const serialTo = serialRows.length ? serialOffset + serialRows.length : 0;
  const serialTotalText = serialTotal ? `з ${serialTotal}` : (state.stockUi.serialHasMore ? "є ще" : "");
  const serialEmptyText = !weaponProducts.length
    ? "У довіднику немає товарів категорії Зброя."
    : selectedSerialProductId
      ? state.stockUi.serialError || "Для вибраного товару категорії Зброя live серійних залишків не знайдено."
      : "Виберіть товар із категорії Зброя, щоб підтягнути серійні номери.";
  const inventoryAddAllText = inventoryAddAllStockStatus.loading
    ? `Додаю з SQL ${inventoryAddAllStockStatus.loaded}${inventoryAddAllStockStatus.total ? ` з ${inventoryAddAllStockStatus.total}` : ""}...`
    : "Додати всі товари із залишками";
  return `
    <section class="stacked-panels">
      <article class="panel">
        <div class="split">
          <div>
            <h2>B2C.6 Залишки</h2>
            <p class="muted">Реальні залишки з SQL по ${escapeHtml(SQL_MAIN_WAREHOUSE_NAME)}. Повний довідник відкривається сторінками, без завантаження всієї бази в браузер.</p>
          </div>
          <div class="toolbar">
            <span class="pill">live SQL · склад №1</span>
            <button class="secondary" type="button" data-toggle-stock-list>${stockListCollapsed ? "Розгорнути список" : "Згорнути список"}</button>
          </div>
        </div>
        ${stockListCollapsed ? `
          <p class="muted">Список залишків згорнуто. Пошук, сортування і вибір кількості рядків збережені локально для цього робочого місця.</p>
        ` : `
          ${renderLiveTableToolbar("stock")}
          ${renderLiveStockTable()}
        `}
      </article>
      <article class="panel">
        <div class="split">
          <h2>Серійні номери</h2>
          <span class="pill ${state.stockUi.serialError ? "warn" : ""}">${selectedSerialProductId ? `${serialFrom}-${serialTo} ${serialTotalText}`.trim() : "тільки Зброя"}</span>
        </div>
        <div class="form-grid section-gap">
          <label class="field wide">
            <span>Товар категорії Зброя</span>
            <select data-stock-serial-product>
              <option value="">Виберіть товар зі Зброї</option>
              ${weaponProducts.map((product) => option(product.id, `${product.productCode || product.sku} · ${product.name}`, product.id === selectedSerialProductId)).join("")}
            </select>
          </label>
          <div class="field">
            <span>Правило</span>
            <small class="muted">Серійні номери читаються live тільки після вибору товару з категорії Зброя і тільки по ${escapeHtml(SQL_MAIN_WAREHOUSE_NAME)}.</small>
          </div>
        </div>
        ${selectedSerialProduct ? `<p class="muted">Вибрано: ${escapeHtml(selectedSerialProduct.productFullPath || selectedSerialProduct.productGroupPath || selectedSerialProduct.categoryPrimary || selectedSerialProduct.category)}</p>` : ""}
        ${selectedSerialProduct ? `
          <div class="toolbar">
            <button class="secondary" type="button" data-stock-serial-refresh ${state.stockUi.serialLoading ? "disabled" : ""}>Оновити серії</button>
            <button class="secondary" type="button" data-stock-serial-page="-1" ${state.stockUi.serialLoading || serialOffset <= 0 ? "disabled" : ""}>Назад</button>
            <button class="secondary" type="button" data-stock-serial-page="1" ${state.stockUi.serialLoading || !state.stockUi.serialHasMore ? "disabled" : ""}>Вперед</button>
            <span class="lookup-status ${state.stockUi.serialError ? "warn" : "good"}">${escapeHtml(state.stockUi.serialLoading ? "Завантаження live serial-stock..." : state.stockUi.serialError || `limit ${serialLimit} · склад ${SQL_MAIN_WAREHOUSE_CODE}`)}</span>
          </div>
        ` : ""}
        <div class="table-wrap">
          <table>
            <thead><tr><th>product_code</th><th>Товар</th><th>warehouse_code</th><th>Склад</th><th>Серійний номер</th><th>Кількість</th><th>Знак</th></tr></thead>
            <tbody>
              ${serialRows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.productCode)}</td>
                  <td>${escapeHtml(row.productName || productById(row.productId).name)}</td>
                  <td>${escapeHtml(row.warehouseCode)}</td>
                  <td>${escapeHtml(row.warehouseName)}</td>
                  <td><strong>${escapeHtml(row.serialName)}</strong></td>
                  <td>${row.quantity}</td>
                  <td><span class="pill ${row.balanceSign === "negative" ? "danger" : row.balanceSign === "zero" ? "warn" : "good"}">${escapeHtml(row.balanceSign)}</span></td>
                </tr>
              `).join("") || `<tr><td colspan="7" class="muted">${escapeHtml(serialEmptyText)}</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>
    </section>
    ${canOpenBlock("inventory") ? `<section class="panel section-gap inventory-panel">
      <div class="split">
        <div>
          <h2>Інвентаризація</h2>
          <p class="muted">Введення фактичних залишків, сканування штрихкоду/QR, різниця по обліку і друк листа.</p>
        </div>
        <span class="pill">${escapeHtml(state.inventory.id)}</span>
      </div>
      <section class="grid four">
        <article class="card metric"><span>Позицій</span><strong>${rows.length}/${allRows.length}</strong><small>${inventorySearch ? "Відфільтровано по пошуку." : "Додані товари інвентаризації."}</small></article>
        <article class="card metric"><span>Пораховано</span><strong>${totals.counted}</strong><small>Є фактичний залишок.</small></article>
        <article class="card metric"><span>Плюс</span><strong>${formatMoney(totals.positiveAmount)}</strong><small>${totals.positive} од. факт більше обліку.</small></article>
        <article class="card metric"><span>Мінус</span><strong>${formatMoney(Math.abs(totals.negativeAmount))}</strong><small>${Math.abs(totals.negative)} од. факт менше обліку.</small></article>
      </section>
      <form class="form-grid section-gap" data-action="${canPostInventory ? "post-inventory" : "inventory-draft"}">
        <label class="field wide no-print"><span>Склади інвентаризації</span><select name="inventoryWarehouseCodes" data-inventory-warehouses multiple size="4">${inventoryWarehouseOptionsHtml}</select><small class="muted">Можна вибрати один або кілька складів. Поточний вибір: ${escapeHtml(inventoryWarehouseText)}</small></label>
        <div class="field lookup-action no-print"><span>Склади</span><button class="secondary" type="button" data-refresh-inventory-warehouses ${liveTable("warehouses").loading ? "disabled" : ""}>Оновити склади SQL</button></div>
        <label class="field wide"><span>Товар з довідника</span><input name="inventoryAddSearch" data-inventory-add-search list="inventory-product-options" value="${escapeHtml(state.inventory.addSearch || "")}" autocomplete="off" placeholder="назва, SKU, штрихкод або QR з довідника товарів"><datalist id="inventory-product-options">${state.products.map((product) => `<option value="${escapeHtml(productLookupValue(product))}"></option>`).join("")}</datalist></label>
        <div class="field lookup-action no-print"><span>Додати</span><button class="secondary" type="button" data-add-inventory-product>Додати товар</button></div>
        <label class="field wide"><span>Пошук у інвентаризації</span><input name="inventorySearch" data-inventory-search value="${escapeHtml(state.inventory.search || "")}" placeholder="назва, SKU, штрихкод або QR"></label>
        <label class="field wide"><span>Сканер інвентаризації</span><input name="inventoryScan" data-inventory-scan autocomplete="off" placeholder="скануйте штрихкод або QR, Enter додає 1 до факту"></label>
        <div class="toolbar full no-print">
          <button class="secondary" type="button" data-add-all-stock-inventory ${inventoryAddAllStockStatus.loading ? "disabled" : ""}>${escapeHtml(inventoryAddAllText)}</button>
          ${inventoryAddAllStockStatus.error ? `<span class="lookup-status warn">${escapeHtml(inventoryAddAllStockStatus.error)}</span>` : ""}
          <button class="secondary" type="button" data-print-inventory>Друк Інвентаризаційний лист</button>
          <button class="secondary" type="button" data-reset-inventory>Очистити лист</button>
          ${canPostInventory ? '<button class="primary" type="submit">Провести і оновити склад</button>' : ""}
        </div>
        <div class="table-wrap full">
          <table>
            <thead><tr><th>SKU</th><th>Склад</th><th>Товар</th><th>Штрихкод</th><th>Роздріб</th><th>Облік</th><th>Факт</th><th>Різниця</th><th>+/- грн</th><th>Дії</th></tr></thead>
            <tbody>
              ${rows.map((row) => `
                <tr class="${row.hasActual && row.diff !== 0 ? "inventory-diff" : ""}">
                  <td>${escapeHtml(row.product.sku)}</td>
                  <td>${escapeHtml(row.warehouseName)}<br><span class="muted">${escapeHtml(row.warehouseCode)}</span></td>
                  <td>${escapeHtml(row.product.name)}${row.serialName ? `<br><span class="muted">SN ${escapeHtml(row.serialName)}</span>` : ""}</td>
                  <td>${escapeHtml(row.product.barcode || "-")}</td>
                  <td>${formatMoney(row.price)}</td>
                  <td><strong>${row.expectedQty}</strong></td>
                  <td><input class="mini-input" data-inventory-actual="${escapeHtml(row.lineKey)}" type="number" min="0" ${row.serialName ? 'max="1"' : ""} value="${row.hasActual ? row.actualQty : ""}"></td>
                  <td><span class="pill ${row.diff === null ? "" : row.diff < 0 ? "danger" : row.diff > 0 ? "warn" : "good"}">${diffLabel(row.diff)}</span></td>
                  <td>${row.diffAmount === null ? "-" : formatMoney(row.diffAmount)}</td>
                  <td><button class="secondary" type="button" data-remove-inventory-product="${escapeHtml(row.lineKey)}">Видалити</button></td>
                </tr>
              `).join("") || `<tr><td colspan="10" class="muted">${inventorySearch ? "За цим пошуком позицій немає." : "Додайте товар з довідника товарів або відскануйте штрихкод/QR."}</td></tr>`}
            </tbody>
          </table>
        </div>
      </form>
      ${canResortInventory ? `<section class="inventory-resort no-print">
        <div class="split">
          <h2>Пересорт</h2>
          <span class="pill ${resortTotals.netAmount < 0 ? "danger" : resortTotals.netAmount > 0 ? "warn" : "good"}">${formatMoney(resortTotals.netAmount)}</span>
        </div>
        <form class="form-grid" data-action="create-inventory-resort">
          <label class="field"><span>Мінус товар</span><select name="fromProductId">${state.products.map((product, index) => option(product.id, `${product.sku} · ${product.name} · ${formatMoney(product.price, product.priceCurrency || BASE_CURRENCY)}`, index === 0)).join("")}</select></label>
          <label class="field"><span>Плюс товар</span><select name="toProductId">${state.products.map((product, index) => option(product.id, `${product.sku} · ${product.name} · ${formatMoney(product.price, product.priceCurrency || BASE_CURRENCY)}`, index === 1)).join("")}</select></label>
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1" required></label>
          <label class="field wide"><span>Коментар</span><input name="note" placeholder="причина пересорту"></label>
          <div class="toolbar full">
            <button class="primary" type="submit">Провести пересорт у факт</button>
          </div>
        </form>
        ${renderInventoryResorts(true)}
      </section>` : ""}
      ${renderInventorySheet(rows, printTotals)}
      <div class="table-wrap section-gap">
        <table>
          <thead><tr><th>Документ</th><th>Дата</th><th>Позицій</th><th>Різниця</th><th>+/- грн</th><th>Пересорт</th><th>Склад</th></tr></thead>
          <tbody>
            ${state.inventoryDocs.slice(0, 5).map((doc) => `
              <tr>
                <td>${escapeHtml(doc.id)}</td>
                <td>${formatDateTime(doc.createdAt)}</td>
                <td>${doc.lines.length}</td>
                <td>${diffLabel(doc.totalDiff)}</td>
                <td>${formatMoney(doc.totalAmountDiff)}</td>
                <td>${formatMoney(inventoryResortTotals(doc.resorts).netAmount)}</td>
                <td><span class="pill ${doc.appliedToStock ? "good" : "warn"}">${doc.appliedToStock ? "оновлено" : "чернетка"}</span></td>
              </tr>
            `).join("") || '<tr><td colspan="7" class="muted">Проведених інвентаризацій ще немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>` : ""}
  `;
}

function liveTableStatus(kind) {
  const table = liveTable(kind);
  if (!serverModeEnabled()) return { text: "server mode вимкнено", className: "warn" };
  if (table.loading) return { text: "завантаження SQL...", className: "warn" };
  if (table.error) return { text: table.error, className: "danger" };
  if (table.lastLoadedAt) {
    const from = table.items.length ? Number(table.offset || 0) + 1 : Number(table.offset || 0);
    const to = Number(table.offset || 0) + table.items.length;
    const totalText = table.total ? ` з ${table.totalExact ? "" : "~"}${table.total}` : "";
    const moreText = table.hasMore ? " · є наступна сторінка" : "";
    const limitText = table.limitMode === LIVE_TABLE_ALL_VALUE ? `Всі до ${LIVE_STOCK_ALL_LIMIT}` : table.limit;
    const sortText = table.sortField ? ` · sort ${table.sortField} ${table.sortDirection}` : "";
    return { text: `${from}-${to}${totalText} · limit ${limitText}${sortText}${moreText}`, className: "good" };
  }
  return { text: "очікує першого запиту", className: "warn" };
}

function renderLiveLimitOptions(kind, table) {
  const selectedValue = liveTableLimitSelection(table);
  const options = LIVE_TABLE_LIMIT_OPTIONS.map((limit) => option(limit, limit, String(limit) === selectedValue));
  if (kind === "stock") options.push(option(LIVE_TABLE_ALL_VALUE, "Всі", selectedValue === LIVE_TABLE_ALL_VALUE));
  return options.join("");
}

function renderLiveTableToolbar(kind) {
  const config = liveTableConfig(kind);
  const table = liveTable(kind);
  const status = liveTableStatus(kind);
  const canPrev = Number(table.offset || 0) > 0 && !table.loading;
  const canNext = !table.loading && Boolean(table.hasMore);
  return `
    <div class="split">
      <div>
        <p class="eyebrow">${escapeHtml(config.subtitle)}</p>
        <h2>${escapeHtml(config.title)}</h2>
      </div>
      <span class="pill ${status.className}">${escapeHtml(status.text)}</span>
    </div>
    <form class="form-grid live-table-toolbar" data-action="live-table-search" data-live-kind="${escapeHtml(kind)}">
      <label class="field wide"><span>Пошук</span><input name="search" value="${escapeHtml(table.search)}" placeholder="${escapeHtml(config.searchPlaceholder)}"></label>
      <label class="field"><span>Рядків</span><select name="limit">${renderLiveLimitOptions(kind, table)}</select></label>
      <div class="toolbar full">
        <button class="primary" type="submit" ${table.loading ? "disabled" : ""}>Пошук</button>
        <button class="secondary" type="button" data-live-refresh="${escapeHtml(kind)}" ${table.loading ? "disabled" : ""}>Оновити</button>
        <button class="secondary" type="button" data-live-table-page="${escapeHtml(kind)}" data-live-direction="-1" ${canPrev ? "" : "disabled"}>Назад</button>
        <button class="secondary" type="button" data-live-table-page="${escapeHtml(kind)}" data-live-direction="1" ${canNext ? "" : "disabled"}>Вперед</button>
      </div>
    </form>
    <p class="muted">Дані читаються з PostgreSQL/SQL API посторінково. Повний каталог у браузер не завантажується.</p>
  `;
}

function stockSortHeader(field, label) {
  const table = liveTable("stock");
  const active = table.sortField === field;
  const direction = active ? table.sortDirection : "desc";
  const marker = active ? (direction === "desc" ? " ↓" : " ↑") : "";
  const nextDirection = active && direction === "desc" ? "asc" : "desc";
  return `<button class="table-sort-button" type="button" data-live-stock-sort="${escapeHtml(field)}" data-live-stock-direction="${escapeHtml(nextDirection)}" title="Сортувати ${escapeHtml(label)}">${escapeHtml(label)}${marker}</button>`;
}

function renderLiveProductsTable() {
  const table = liveTable("products");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>product_code</th><th>Товар</th><th>Категорія/шлях</th><th>Ціна</th><th>Залишок</th><th>Джерело</th><th>Дії</th></tr></thead>
        <tbody>
          ${table.items.map((product) => `
            <tr>
              <td>${escapeHtml(product.productCode || product.sku || product.id)}<br><span class="muted">${escapeHtml(product.sqlId || "-")}</span></td>
              <td><strong>${escapeHtml(product.name)}</strong><br><span class="muted">${escapeHtml(product.barcode || product.qr || "-")} · ${escapeHtml(product.sku || "-")}</span></td>
              <td>${escapeHtml(product.productGroupPath || product.category)}<br><span class="muted">${escapeHtml(product.productFullPath || product.categorySecondary || "-")}</span></td>
              <td>${escapeHtml(productPriceSummaryDisplay(product))}<br><span class="muted">${escapeHtml(product.priceTypes || "-")} · ${escapeHtml(displayCurrencyList(product.priceCurrencies || product.priceCurrency || BASE_CURRENCY))}</span></td>
              <td><strong>${Number(product.retailStockQty || stockQty(product.id) || 0)}</strong><br><span class="muted">усього ${Number(product.stockTotalQty || 0)} · інші ${Number(product.stockWholesaleQty || 0)}</span></td>
              <td>${escapeHtml(product.source || "crm-sql-live")}<br><span class="muted">${escapeHtml(product.importer || product.supplyChannel || "-")}</span></td>
              <td>${canDo("sale_create") ? `<button class="secondary" type="button" data-add-cart="${escapeHtml(product.id)}">У продаж</button>` : ""}</td>
            </tr>
          `).join("") || `<tr><td colspan="7" class="muted">${table.loading ? "Завантаження..." : table.error ? escapeHtml(table.error) : "Немає рядків на цій сторінці."}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderLivePricesTable() {
  const table = liveTable("prices");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>product_code</th><th>Товар</th><th>Тип ціни</th><th>Ціна</th><th>Дата зрізу</th><th>Джерело</th></tr></thead>
        <tbody>
          ${table.items.map((price) => `
            <tr>
              <td>${escapeHtml(price.productCode || "-")}</td>
              <td><strong>${escapeHtml(price.productName || "-")}</strong></td>
              <td>${escapeHtml(price.priceTypeName || "-")}<br><span class="muted">${escapeHtml(price.priceTypeCode || "-")}</span></td>
              <td><strong>${formatMoney(price.amount || price.price || 0, price.currency || BASE_CURRENCY)}</strong></td>
              <td>${escapeHtml(price.snapshotAt || price.importedAt || "-")}</td>
              <td>${escapeHtml(price.sourceFile || price.source || "crm-sql-live")}</td>
            </tr>
          `).join("") || `<tr><td colspan="6" class="muted">${table.loading ? "Завантаження..." : table.error ? escapeHtml(table.error) : "Немає цін на цій сторінці."}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderLiveCounterpartiesTable() {
  const table = liveTable("counterparties");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>counterparty_code</th><th>Контрагент</th><th>Контакти</th><th>Податковий код</th><th>Статус</th><th>Джерело</th><th>Дії</th></tr></thead>
        <tbody>
          ${table.items.map((counterparty) => {
            const customer = customerFromLiveCounterparty(counterparty);
            return `
              <tr>
                <td>${escapeHtml(counterparty.counterpartyCode || counterparty.id)}<br><span class="muted">${escapeHtml(counterparty.sqlId || "-")}</span></td>
                <td><strong>${escapeHtml(counterparty.name)}</strong><br><span class="muted">${escapeHtml(counterparty.fullName || "-")}</span></td>
                <td>${escapeHtml(counterparty.phone || "-")}<br><span class="muted">${escapeHtml(counterparty.email || "-")}</span></td>
                <td>${escapeHtml(counterparty.taxId || "-")}</td>
                <td><span class="pill ${counterparty.isDeleted ? "danger" : "good"}">${counterparty.isDeleted ? "видалено в 1C" : "активний"}</span></td>
                <td>${escapeHtml(counterparty.sourceFile || counterparty.sourceModule || "crm-sql-live")}<br><span class="muted">${escapeHtml(counterparty.importedAt || "-")}</span></td>
                <td>${canDo("sale_create") ? `<button class="secondary" type="button" data-select-live-customer="${escapeHtml(customer.id)}">У продаж</button>` : ""}</td>
              </tr>
            `;
          }).join("") || `<tr><td colspan="7" class="muted">${table.loading ? "Завантаження..." : table.error ? escapeHtml(table.error) : "Немає контрагентів на цій сторінці."}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderLiveStockTable() {
  const table = liveTable("stock");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>${stockSortHeader("productCode", "product_code")}</th><th>${stockSortHeader("productName", "Товар")}</th><th>${stockSortHeader("warehouseName", "Склад")}</th><th>${stockSortHeader("availableQty", "Доступно")}</th><th>${stockSortHeader("reservedQty", "Резерв")}</th><th>${stockSortHeader("quantity", "К-сть")}</th><th>${stockSortHeader("snapshotAt", "Дата зрізу")}</th><th>${stockSortHeader("source", "Джерело")}</th></tr></thead>
        <tbody>
          ${table.items.map((row) => {
            const available = stockLookupAvailableQty(row);
            const reserved = Number(row.reservedQty || 0);
            const statusClass = available <= 0 ? "danger" : available <= 1 ? "warn" : "good";
            const statusText = available <= 0 ? "немає" : available <= 1 ? "мало" : "доступно";
            return `
              <tr>
                <td>${escapeHtml(row.productCode || row.productId || "-")}</td>
                <td><strong>${escapeHtml(row.productName || "-")}</strong></td>
                <td>${escapeHtml(row.warehouseName || SQL_MAIN_WAREHOUSE_NAME)}<br><span class="muted">${escapeHtml(row.warehouseCode || SQL_MAIN_WAREHOUSE_CODE)}</span></td>
                <td><strong>${available}</strong><br><span class="pill ${statusClass}">${statusText}</span></td>
                <td>${reserved}</td>
                <td>${Number(row.quantity ?? row.qty ?? available)}</td>
                <td>${escapeHtml(row.snapshotAt || "-")}</td>
                <td>${escapeHtml(row.sourceFile || row.source || "crm-sql-live")}<br><span class="muted">${escapeHtml(row.importedAt || "-")}</span></td>
              </tr>
            `;
          }).join("") || `<tr><td colspan="8" class="muted">${table.loading ? "Завантаження реальних залишків з SQL..." : table.error ? escapeHtml(table.error) : "Немає залишків на цій сторінці."}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderLiveWarehousesTable() {
  const table = liveTable("warehouses");
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>warehouse_code</th><th>Склад</th><th>Джерело</th></tr></thead>
        <tbody>
          ${table.items.map((warehouse) => `
            <tr>
              <td>${escapeHtml(warehouse.warehouseCode || warehouse.id || "-")}</td>
              <td><strong>${escapeHtml(warehouse.warehouseName || "-")}</strong></td>
              <td>${escapeHtml(warehouse.sourceFile || warehouse.source || "crm-sql-live")}<br><span class="muted">${escapeHtml(warehouse.importedAt || "-")}</span></td>
            </tr>
          `).join("") || `<tr><td colspan="3" class="muted">${table.loading ? "Завантаження..." : table.error ? escapeHtml(table.error) : "Немає складів на цій сторінці."}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderCatalog() {
  setTitle("Товари магазину");
  ensureLiveTableLoaded("products");
  ensureLiveTableLoaded("prices");
  ensureLiveTableLoaded("warehouses");
  return `
    <section class="stacked-panels">
      <article class="panel">
        ${renderLiveTableToolbar("products")}
        ${renderLiveProductsTable()}
      </article>
      <article class="panel">
        ${renderLiveTableToolbar("prices")}
        ${renderLivePricesTable()}
      </article>
      <article class="panel">
        ${renderLiveTableToolbar("warehouses")}
        ${renderLiveWarehousesTable()}
      </article>
      <article class="panel">
        <div class="split">
          <h2>SQL довідники</h2>
          <span class="pill">${escapeHtml(SQL_REFERENCE_SOURCE)}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Довідник</th><th>Значення</th><th>View</th></tr></thead>
            <tbody>
              <tr><td>Одиниці</td><td>${state.references.units.map(escapeHtml).join(", ")}</td><td>one_c_mirror.crm_units</td></tr>
              <tr><td>Валюти</td><td>${state.references.currencies.map(escapeHtml).join(", ")}</td><td>one_c_mirror.crm_currencies</td></tr>
              <tr><td>Типи цін</td><td>${state.references.priceTypes.map(escapeHtml).join(", ")}</td><td>one_c_mirror.crm_price_types</td></tr>
              <tr><td>Організації</td><td>${state.references.organizations.map(escapeHtml).join(", ")}</td><td>one_c_mirror.crm_organizations</td></tr>
              <tr><td>Особи</td><td>${state.references.persons.map(escapeHtml).join(", ")}</td><td>one_c_mirror.crm_persons</td></tr>
              <tr><td>Банківські рахунки</td><td>${state.references.bankAccounts.map(escapeHtml).join(", ")}</td><td>one_c_mirror.crm_bank_accounts</td></tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}

function renderCustomers() {
  setTitle("Клієнти і лояльність");
  ensureLiveTableLoaded("counterparties");
  const canCreateCustomer = canDo("customer_create");
  return `
    <section class="stacked-panels">
      <article class="panel">
        ${renderLiveTableToolbar("counterparties")}
        ${renderLiveCounterpartiesTable()}
      </article>
      ${canCreateCustomer ? `<article class="panel">
        <div class="split">
          <div>
            <p class="eyebrow">B2C. Створення клієнта</p>
            <h2>Новий клієнт</h2>
          </div>
          <span class="pill warn">очікує експорт у SQL</span>
        </div>
        <form class="form-grid" data-action="create-customer">
          <label class="field"><span>counterparty_code</span><input name="counterpartyCode" placeholder="автоматично, якщо пусто"></label>
          <label class="field"><span>Ім'я клієнта</span><input name="name" required placeholder="ПІБ або назва покупця"></label>
          <label class="field"><span>Телефон</span><input name="phone" placeholder="+380..."></label>
          <label class="field"><span>Email</span><input name="email" type="email" placeholder="email@example.com"></label>
          <label class="field"><span>Лояльність</span><select name="loyalty">${Object.entries(LOYALTY_LABELS).map(([id, label]) => option(id, label, id === "standard")).join("")}</select></label>
          <label class="field"><span>Договір</span><input name="contractName" value="Роздрібний договір"></label>
          <label class="field wide"><span>Коментар</span><input name="note" placeholder="примітка для магазину"></label>
          <button class="primary" type="submit">Створити клієнта</button>
        </form>
      </article>` : ""}
      <article class="panel">
        <div class="split">
          <div>
            <p class="eyebrow">B2C local/cache</p>
            <h2>Локальні B2C і вибрані SQL-клієнти</h2>
          </div>
          <div class="panel-actions">
            <span class="pill">${state.customers.length} карток</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>counterparty_code</th><th>Клієнт</th><th>Договори</th><th>Сальдо</th><th>Розрахунки</th><th>Чеків</th><th>Сума продажів</th><th>Дії</th></tr></thead>
            <tbody>
              ${state.customers.map((customer) => {
                const receipts = state.receipts.filter((receipt) => receipt.customerId === customer.id);
                const total = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
                return `
                  <tr>
                    <td>${escapeHtml(customer.counterpartyCode || customer.id)}<br><span class="muted">${escapeHtml(customer.source === "b2c" ? "B2C" : "SQL")}</span></td>
                    <td><strong>${escapeHtml(customer.name)}</strong><br><span class="muted">${escapeHtml(customer.phone || "-")} · ${escapeHtml(customer.email || "-")} · ${escapeHtml(LOYALTY_LABELS[customer.loyalty] || customer.loyalty)}</span>${customer.source === "b2c" ? `<br><span class="pill ${customer.exportStatus === "exported" ? "good" : "warn"}">${customer.exportStatus === "exported" ? "експортовано" : "очікує експорт"}</span>` : ""}</td>
                    <td>${(customer.contracts || []).map((contract) => `${escapeHtml(contract.contractCode || "-")} · ${escapeHtml(contract.contractName || "-")}`).join("<br>") || "-"}</td>
                    <td><span class="pill ${Number(customer.balance || 0) > 0 ? "warn" : Number(customer.balance || 0) < 0 ? "good" : ""}">${formatMoney(customer.balance)} ${escapeHtml(customer.balanceCurrency || "UAH")}</span></td>
                    <td>${(customer.settlements || []).map((item) => `${escapeHtml(item.date || "-")} · ${formatMoney(item.amount)} ${escapeHtml(item.currency || "UAH")}`).join("<br>") || "-"}</td>
                    <td>${receipts.length}</td>
                    <td>${formatMoney(total)}</td>
                    <td>${canDo("sale_create") ? `<button class="secondary" type="button" data-select-customer="${escapeHtml(customer.id)}">У продаж</button>` : ""}</td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="8" class="muted">${canCreateCustomer ? "Клієнтів ще немає. Створіть клієнта або імпортуйте контрагентів через Обмін даними." : "Клієнтів ще немає або роль не має дозволу на створення."}</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}

function renderCash() {
  setTitle("Каса та POS");
  return renderCashContent();
}

function renderCashContent() {
  const shift = openShift();
  return `
    <section class="stacked-panels">
      <article class="panel">
        <div class="split">
          <h2>B2C.7 Каса/POS</h2>
          <span class="pill ${shift ? "warn" : "good"}">${shift ? "зміна відкрита" : "зміна закрита"}</span>
        </div>
        ${shift ? renderOpenShift(shift) : renderOpenShiftForm()}
      </article>
      <article class="panel">
        <h2>Історія змін</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Зміна</th><th>Дата</th><th>Касир</th><th>Готівка очікувана</th><th>Факт</th><th>Картка</th><th>Стан</th></tr></thead>
            <tbody>${state.cashShifts.map((row) => `<tr><td>${escapeHtml(row.id)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.cashier)}</td><td>${formatMoney(shiftExpectedCash(row))}</td><td>${row.closedAt ? formatMoney(row.actualCash) : "-"}</td><td>${formatMoney(row.cardSales - row.cardReturns)}</td><td><span class="pill ${row.opened ? "warn" : "good"}">${row.opened ? "відкрита" : "закрита"}</span></td></tr>`).join("")}</tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}

function renderOpenShift(shift) {
  return `
    <dl class="summary-list">
      <div><dt>Зміна</dt><dd>${escapeHtml(shift.id)}</dd></div>
      <div><dt>Касир</dt><dd>${escapeHtml(shift.cashier)} · ${escapeHtml(shift.cashierRole || "-")}</dd></div>
      <div><dt>Відкрито</dt><dd>${formatDateTime(shift.openedAt)}</dd></div>
      <div><dt>Готівка продажі</dt><dd>${formatMoney(shift.cashSales)}</dd></div>
      <div><dt>Картка/POS</dt><dd>${formatMoney(shift.cardSales)}</dd></div>
      <div><dt>Банк</dt><dd>${formatMoney(shift.bankSales)}</dd></div>
      <div><dt>Повернення</dt><dd>${formatMoney(shift.cashReturns + shift.cardReturns + shift.bankReturns)}</dd></div>
      <div><dt>Готівка очікувана</dt><dd><strong>${formatMoney(shiftExpectedCash(shift))}</strong></dd></div>
    </dl>
    ${canDo("cash_close") ? `<form class="form-grid one-col" data-action="close-shift">
      <label class="field"><span>Фактична готівка в касі</span><input name="actualCash" type="number" min="0" value="${shiftExpectedCash(shift)}"></label>
      <button class="primary" type="submit">Закрити зміну</button>
    </form>` : '<p class="muted">Закриття касової зміни приховано для цієї ролі.</p>'}
  `;
}

function renderOpenShiftForm() {
  const employees = activeEmployees();
  const selectedId = employees.some((employee) => employee.id === state.selectedCashierId) ? state.selectedCashierId : employees[0]?.id;
  return `
    ${canDo("cash_open") ? `<form class="form-grid one-col" data-action="open-shift">
      <label class="field"><span>Касир / відповідальний</span><select name="cashierId">${employees.map((employee) => option(employee.id, `${employee.name} · ${roleLabel(employee.role)}`, employee.id === selectedId)).join("")}</select></label>
      <label class="field"><span>Розмінна готівка</span><input name="openingCash" type="number" min="0" value="3000"></label>
      <button class="primary" type="submit">Відкрити зміну</button>
    </form>` : '<p class="muted">Відкриття касової зміни приховано для цієї ролі.</p>'}
  `;
}

function renderReports() {
  setTitle("Звіт дня");
  const reportDate = today();
  const receipts = state.receipts.filter((receipt) => receipt.status === "posted" && receipt.date === reportDate);
  const returns = state.returns.filter((item) => item.date === reportDate);
  const returnsTotal = returns.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const revenue = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const margin = receipts.reduce((sum, receipt) => {
    const cost = receipt.lines.reduce((lineSum, line) => lineSum + Number(productById(line.productId).cost || 0) * Number(line.qty || 0), 0);
    return sum + Number(receipt.total || 0) - cost;
  }, 0);
  const paymentRows = ["cash", "card", "bank"].map((method) => ({
    method,
    total: receipts.filter((receipt) => receipt.paymentMethod === method).reduce((sum, receipt) => sum + Number(receipt.total || 0), 0)
  }));
  return `
    <section class="grid four">
      ${metricCard("Виторг", formatMoney(revenue), "До повернень.", "report_revenue")}
      ${metricCard("Повернення", formatMoney(returnsTotal), `${returns.length} документів.`, "report_returns")}
      ${metricCard("Маржа", formatMoney(margin - returnsTotal), "Оціночна за собівартістю.", "report_margin")}
      ${metricCard("Чисто", formatMoney(revenue - returnsTotal), "B2C день.", "report_net")}
    </section>
    <section class="panel section-gap">
      <h2>Оплати</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Метод</th><th>Сума</th></tr></thead>
          <tbody>${paymentRows.map((row) => `<tr><td>${escapeHtml(paymentLabel(row.method))}</td><td><strong>${formatMoney(row.total)}</strong></td></tr>`).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderEmployees() {
  setTitle("Працівники і ролі");
  const activeCount = state.employees.filter((employee) => employee.status === "active").length;
  const roleRows = Object.entries(EMPLOYEE_ROLES);
  const canManageEmployees = canDo("employee_manage");
  const canEditEmployees = canEditEmployeeFields();
  return `
    <section class="grid four">
      <article class="card metric"><span>Працівники</span><strong>${state.employees.length}</strong><small>${activeCount} активних.</small></article>
      <article class="card metric"><span>Ролі</span><strong>${roleRows.length}</strong><small>Директор, адміністратор, продавець, касир.</small></article>
      <article class="card metric"><span>Касир зміни</span><strong>${escapeHtml(employeeById(state.selectedCashierId).name)}</strong><small>${escapeHtml(roleLabel(employeeById(state.selectedCashierId).role))}.</small></article>
      <article class="card metric"><span>Доступи</span><strong>${ROLE_BLOCKS.length}/${ROLE_ACTIONS.length}</strong><small>Блоки і дії.</small></article>
    </section>
    <section class="stacked-panels section-gap">
      <article class="panel">
        <div class="split">
          <h2>B2C.10 Працівники</h2>
          <span class="pill">${state.employees.length} карток</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Код</th><th>Працівник</th><th>Роль</th><th>Контакти</th><th>Статус</th><th>Магазин</th><th>Дії</th></tr></thead>
            <tbody>
              ${state.employees.map((employee) => `
                <tr ${canEditEmployees ? `data-edit-employee="${escapeHtml(employee.id)}" tabindex="0" role="button" title="Редагувати картку працівника"` : ""}>
                  <td>${escapeHtml(employee.code)}</td>
                  <td><strong>${escapeHtml(employee.name)}</strong><br><span class="muted">${escapeHtml(employee.login || "-")} · ${escapeHtml(employee.schedule || "-")}</span></td>
                  <td>${canEditEmployees ? `<select class="mini-select" data-employee-role="${escapeHtml(employee.id)}">${roleRows.map(([id, role]) => option(id, role.label, id === employee.role)).join("")}</select>` : `<span class="pill">${escapeHtml(roleLabel(employee.role))}</span>`}</td>
                  <td>${escapeHtml(employee.phone || "-")}<br><span class="muted">${escapeHtml(employee.email || "-")}</span></td>
                  <td><span class="pill ${employee.status === "active" ? "good" : employee.status === "vacation" ? "warn" : "danger"}">${escapeHtml(employeeStatusLabel(employee.status))}</span><br><span class="muted">${escapeHtml(employeeSessionLabel(employee))}</span></td>
                  <td>${escapeHtml(employee.store || "-")}<br><span class="muted">з ${escapeHtml(employee.hireDate || "-")}</span></td>
                  <td>
                    ${canEditEmployees ? `<button class="secondary" type="button" data-edit-employee="${escapeHtml(employee.id)}">Редагувати</button>` : ""}
                    ${canDo("cash_open") ? `<button class="secondary" type="button" data-select-cashier="${escapeHtml(employee.id)}" ${employee.status === "active" ? "" : "disabled"}>У касу</button>` : ""}
                    ${canManageEmployees ? `<button class="secondary" type="button" data-toggle-employee="${escapeHtml(employee.id)}">${employee.status === "active" ? "Вимкнути" : "Активувати"}</button>` : ""}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
      ${canManageEmployees ? `<article class="panel">
        <h2>Нова картка працівника</h2>
        <form class="form-grid one-col" data-action="create-employee">
          <label class="field"><span>ПІБ</span><input name="name" required placeholder="ПІБ працівника"></label>
          <label class="field"><span>Роль</span><select name="role">${Object.entries(EMPLOYEE_ROLES).map(([id, role]) => option(id, role.label)).join("")}</select></label>
          <label class="field"><span>Телефон</span><input name="phone" placeholder="+380..."></label>
          <label class="field"><span>Email</span><input name="email" type="email" placeholder="name@company.ua"></label>
          <label class="field"><span>Логін</span><input name="login" placeholder="login"></label>
          <label class="field"><span>Пароль / PIN</span><input name="pin" type="password" autocomplete="new-password" placeholder="службовий пароль/PIN"></label>
          <label class="field"><span>Статус</span><select name="status">${Object.entries(EMPLOYEE_STATUSES).map(([id, label]) => option(id, label, id === "active")).join("")}</select></label>
          <label class="field"><span>Магазин</span><input name="store" value="B2C магазин"></label>
          <label class="field"><span>Графік</span><input name="schedule" value="5/2"></label>
          <label class="field"><span>Дата прийому</span><input name="hireDate" type="date" value="${today()}"></label>
          <label class="field"><span>Коментар</span><input name="note" placeholder="зона відповідальності, умови, примітка"></label>
          <button class="primary" type="submit">Створити працівника</button>
        </form>
      </article>` : ""}
    </section>
    <section class="stacked-panels section-gap">
      <article class="panel">
        <div class="split">
          <h2>Ролі і блоки</h2>
          <span class="pill">${ROLE_BLOCKS.length} блоків</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Блок</th>${roleRows.map(([, role]) => `<th>${escapeHtml(role.label)}</th>`).join("")}</tr></thead>
            <tbody>
              ${ROLE_BLOCKS.map((block) => `
                <tr>
                  <td>${escapeHtml(block.label)}</td>
                  ${roleRows.map(([roleId]) => `<td>${rolePermissionCheckbox(roleId, "blocks", block.id)}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel">
        <div class="split">
          <h2>Ролі і дії</h2>
          <span class="pill">${ROLE_ACTIONS.length} дій</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дія</th>${roleRows.map(([, role]) => `<th>${escapeHtml(role.label)}</th>`).join("")}</tr></thead>
            <tbody>
              ${ROLE_ACTIONS.map((action) => `
                <tr>
                  <td>${escapeHtml(action.label)}</td>
                  ${roleRows.map(([roleId]) => `<td>${rolePermissionCheckbox(roleId, "actions", action.id)}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}

function renderExchange() {
  setTitle("Обмін даними");
  if (!canDo("exchange_view")) {
    return `
      <section class="panel">
        <h2>Обмін даними</h2>
        <p class="muted">Роль має пункт меню, але не має дозволу "Перегляд обміну даними". Увімкніть його в матриці ролей.</p>
      </section>
    `;
  }
  const process = state.exchange.process;
  const automation = state.exchange.automation;
  const records = state.exchange.records;
  const importedRows = importSummaryRows();
  const exportedSales = records.filter((item) => item.direction === "export" && item.status === "done" && item.dataset.includes("Продаж")).reduce((sum, item) => sum + Number(item.rows || 0), 0);
  const exportedInventory = records.filter((item) => item.direction === "export" && item.status === "done" && item.dataset.includes("Інвентариза")).reduce((sum, item) => sum + Number(item.rows || 0), 0);
  const exportedCustomers = records.filter((item) => item.direction === "export" && item.status === "done" && item.dataset.includes("Клієнти")).reduce((sum, item) => sum + Number(item.rows || 0), 0);
  const pendingCustomers = pendingCustomerExports().length;
  const canImport = canDo("exchange_import") || canDo("sql_import");
  const canExport = canDo("exchange_export");
  const canAutomation = canDo("exchange_automation");
  return `
    <section class="grid four">
      <article class="card metric"><span>Імпортовано</span><strong>${importedRows}</strong><small>Товари, залишки, серії, клієнти.</small></article>
      <article class="card metric"><span>Експорт продажів</span><strong>${exportedSales}</strong><small>Рядків у SQL-чергу.</small></article>
      <article class="card metric"><span>Експорт клієнтів</span><strong>${exportedCustomers}</strong><small>${pendingCustomers} очікує експорту.</small></article>
      <article class="card metric"><span>Автоматизація</span><strong>${automation.enabled ? "Увімкнено" : "Вимкнено"}</strong><small>${exchangeIntervalLabel(automation.interval)} · ${roleLabel(automation.responsibleRole)}</small></article>
    </section>

    <section class="stacked-panels section-gap">
      <article class="panel">
        <div class="split">
          <div>
            <p class="eyebrow">B2C. Обмін даними</p>
            <h2>Перебіг процесу</h2>
          </div>
          <span class="pill ${exchangeRecordStatusClass(process.status)}">${escapeHtml(exchangeStatusLabel(process.status))}</span>
        </div>
        <div class="stack">
          <div class="log-row">
            <strong>${escapeHtml(process.label || "Очікує запуску")}</strong>
            <span>${process.startedAt ? `старт ${formatDateTime(process.startedAt)}` : "ще не запускався"}${process.finishedAt ? ` · фініш ${formatDateTime(process.finishedAt)}` : ""}</span>
          </div>
          <progress max="100" value="${Number(process.progress || 0)}"></progress>
          <div class="log-row">
            <strong>Готові SQL views</strong>
            <span>${SQL_READY_VIEWS.map((name) => `${SQL_SCHEMA}.${name}`).join(", ")}</span>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="split">
          <h2>Керування імпортом</h2>
          <span class="pill">${canImport ? "дозволено роллю" : "заборонено роллю"}</span>
        </div>
        <div class="grid four">
          <article class="card metric"><span>Товари</span><strong>${state.productImport.rows || 0}</strong><small>${state.productImport.lastRunAt ? formatDateTime(state.productImport.lastRunAt) : "не імпортовано"}</small></article>
          <article class="card metric"><span>Залишки</span><strong>${state.stockImport.rows || 0}</strong><small>${state.stockImport.lastRunAt ? formatDateTime(state.stockImport.lastRunAt) : "не імпортовано"}</small></article>
          <article class="card metric"><span>Серійні</span><strong>${state.serialImport.rows || 0}</strong><small>${state.serialImport.lastRunAt ? formatDateTime(state.serialImport.lastRunAt) : "не імпортовано"}</small></article>
          <article class="card metric"><span>Клієнти</span><strong>${state.counterpartyImport.rows || 0}</strong><small>${state.counterpartyImport.lastRunAt ? formatDateTime(state.counterpartyImport.lastRunAt) : "не імпортовано"}</small></article>
        </div>
        ${canImport ? `<div class="toolbar section-gap">
          <form data-action="exchange-full-import"><button class="primary" type="submit">Повний SQL-імпорт</button></form>
          <form data-action="sync-sql-products"><button class="secondary" type="submit">Імпорт товарів</button></form>
          <form data-action="sync-sql-stock-receipts"><button class="secondary" type="submit">Імпорт залишків</button></form>
          <form data-action="sync-sql-counterparties"><button class="secondary" type="submit">Імпорт клієнтів</button></form>
        </div>` : '<p class="muted section-gap">Роль не має дозволу на керування імпортом.</p>'}
      </article>

      <article class="panel">
        <div class="split">
          <h2>Керування експортом</h2>
          <span class="pill">${canExport ? "дозволено роллю" : "заборонено роллю"}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Що експортується</th><th>Кількість</th><th>Призначення</th><th>Стан</th></tr></thead>
            <tbody>
              <tr><td>Продажі B2C</td><td>${state.receipts.length}</td><td>${SQL_SCHEMA}.b2c_sales_export_queue</td><td>${state.receipts.length ? "готово" : "немає документів"}</td></tr>
              <tr><td>Інвентаризації B2C</td><td>${state.inventoryDocs.length}</td><td>${SQL_SCHEMA}.b2c_inventory_export_queue</td><td>${state.inventoryDocs.length ? "готово" : "немає документів"}</td></tr>
              <tr><td>Нові клієнти B2C</td><td>${pendingCustomers}</td><td>${SQL_SCHEMA}.b2c_counterparties_export_queue</td><td>${pendingCustomers ? "очікує експорту" : "немає нових клієнтів"}</td></tr>
            </tbody>
          </table>
        </div>
        ${canExport ? `<div class="toolbar section-gap">
          <form data-action="exchange-export-sales"><button class="secondary" type="submit">Експорт продажів</button></form>
          <form data-action="exchange-export-inventory"><button class="secondary" type="submit">Експорт інвентаризацій</button></form>
          <form data-action="exchange-export-customers"><button class="secondary" type="submit">Експорт клієнтів</button></form>
        </div>` : '<p class="muted section-gap">Роль не має дозволу на керування експортом.</p>'}
      </article>

      <article class="panel">
        <div class="split">
          <h2>Налаштування автоматизації</h2>
          <span class="pill ${automation.enabled ? "good" : ""}">${automation.enabled ? "активна" : "ручний режим"}</span>
        </div>
        ${canAutomation ? `<form class="form-grid" data-action="save-exchange-automation">
          <label class="check-line"><input type="checkbox" name="enabled" ${automation.enabled ? "checked" : ""}> Увімкнути автоматизацію</label>
          <label class="field"><span>Періодичність</span><select name="interval">${["manual", "hourly", "daily", "weekly"].map((id) => option(id, exchangeIntervalLabel(id), id === automation.interval)).join("")}</select></label>
          <label class="field"><span>Відповідальна роль</span><select name="responsibleRole">${Object.entries(EMPLOYEE_ROLES).map(([id, role]) => option(id, role.label, id === automation.responsibleRole)).join("")}</select></label>
          <label class="check-line"><input type="checkbox" name="importProducts" ${automation.importProducts ? "checked" : ""}> Імпорт товарів/цін/довідників</label>
          <label class="check-line"><input type="checkbox" name="importStock" ${automation.importStock ? "checked" : ""}> Імпорт залишків і серійних номерів</label>
          <label class="check-line"><input type="checkbox" name="importCounterparties" ${automation.importCounterparties ? "checked" : ""}> Імпорт клієнтів/контрагентів</label>
          <label class="check-line"><input type="checkbox" name="exportSales" ${automation.exportSales ? "checked" : ""}> Експорт продажів</label>
          <label class="check-line"><input type="checkbox" name="exportInventory" ${automation.exportInventory ? "checked" : ""}> Експорт інвентаризацій</label>
          <label class="check-line"><input type="checkbox" name="exportCustomers" ${automation.exportCustomers ? "checked" : ""}> Експорт нових клієнтів</label>
          <label class="check-line"><input type="checkbox" name="notifyResponsible" ${automation.notifyResponsible ? "checked" : ""}> Позначати відповідального у журналі</label>
          <div class="toolbar full">
            <button class="primary" type="submit">Зберегти автоматизацію</button>
            <button class="secondary" type="button" data-run-exchange-automation>Запустити зараз</button>
          </div>
        </form>` : '<p class="muted">Роль не має дозволу змінювати автоматизацію.</p>'}
      </article>

      <article class="panel">
        <div class="split">
          <h2>Журнал обміну</h2>
          <span class="pill">${records.length} подій</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Час</th><th>Тип</th><th>Набір даних</th><th>Рядків</th><th>Джерело/призначення</th><th>Стан</th><th>Деталі</th></tr></thead>
            <tbody>
              ${records.map((record) => `
                <tr>
                  <td>${formatDateTime(record.finishedAt || record.startedAt)}</td>
                  <td>${escapeHtml(exchangeDirectionLabel(record.direction))}</td>
                  <td><strong>${escapeHtml(record.dataset)}</strong><br><span class="muted">${escapeHtml(record.actor)}</span></td>
                  <td>${record.rows}</td>
                  <td>${escapeHtml(record.direction === "export" ? record.destination : record.source)}</td>
                  <td><span class="pill ${exchangeRecordStatusClass(record.status)}">${escapeHtml(exchangeStatusLabel(record.status))}</span></td>
                  <td>${escapeHtml(record.details || "-")}</td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Обмін ще не запускався.</td></tr>'}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}

function renderSettings() {
  setTitle("Налаштування");
  const settings = state.systemSettings;
  const canSettings = canDo("system_settings");
  const apiLabel = apiEndpoint("/api/health") || "API недоступний у file:// без apiBaseUrl";
  return `
    <section class="grid four">
      <article class="card metric"><span>Режим</span><strong>${settings.mode === "server" ? "Сервер" : "Локально"}</strong><small>${settings.multiUser ? "Багатокористувацький" : "Один користувач"}</small></article>
      <article class="card metric"><span>Зовнішній доступ</span><strong>${settings.externalAccess ? "Увімкнено" : "Вимкнено"}</strong><small>${escapeHtml(settings.publicBaseUrl)}</small></article>
      <article class="card metric"><span>Збереження</span><strong>${escapeHtml(settings.storageBackend)}</strong><small>${escapeHtml(settings.dataDir)}</small></article>
      <article class="card metric"><span>Синхронізація</span><strong>${serverSync.online ? "Online" : "Offline"}</strong><small>${escapeHtml(serverSyncLabel())}</small></article>
    </section>

    <section class="stacked-panels section-gap">
      <article class="panel">
        <div class="split">
          <div>
            <p class="eyebrow">B2C real app</p>
            <h2>Сервер і доступ</h2>
          </div>
          <span class="pill ${serverSyncClass()}">${escapeHtml(serverSyncLabel())}</span>
        </div>
        ${canSettings ? `<form class="form-grid" data-action="save-system-settings">
          <label class="field"><span>Режим роботи</span><select name="mode">${["server", "local"].map((id) => option(id, id === "server" ? "Серверний" : "Локальний fallback", id === settings.mode)).join("")}</select></label>
          <label class="field"><span>Публічний host</span><input name="publicHost" value="${escapeHtml(settings.publicHost)}" placeholder="192.168.0.5"></label>
          <label class="field"><span>Публічна адреса</span><input name="publicBaseUrl" value="${escapeHtml(settings.publicBaseUrl)}" placeholder="http://192.168.0.5:8790"></label>
          <label class="field"><span>API base URL</span><input name="apiBaseUrl" value="${escapeHtml(settings.apiBaseUrl)}" placeholder="порожньо = цей самий сервер"></label>
          <label class="field wide"><span>CRM SQL API base URL</span><input name="crmSqlApiBaseUrl" value="${escapeHtml(settings.crmSqlApiBaseUrl)}" placeholder="http://192.168.0.166:3000"></label>
          <label class="field"><span>Bind address</span><input name="bindAddress" value="${escapeHtml(settings.bindAddress)}" placeholder="0.0.0.0"></label>
          <label class="field"><span>Порт</span><input name="port" type="number" min="1" max="65535" value="${Number(settings.port || 8790)}"></label>
          <label class="field"><span>Сховище</span><select name="storageBackend">${["server-json", "postgresql"].map((id) => option(id, id === "server-json" ? "JSON на сервері" : "PostgreSQL API layer", id === settings.storageBackend)).join("")}</select></label>
          <label class="field"><span>Каталог даних</span><input name="dataDir" value="${escapeHtml(settings.dataDir)}" placeholder="data"></label>
          <label class="field"><span>Автооновлення, сек</span><input name="autoRefreshSeconds" type="number" min="5" max="300" value="${Number(settings.autoRefreshSeconds || 15)}"></label>
          <label class="check-line"><input type="checkbox" name="multiUser" ${settings.multiUser ? "checked" : ""}> Багатокористувацький режим</label>
          <label class="check-line"><input type="checkbox" name="externalAccess" ${settings.externalAccess ? "checked" : ""}> Дозволити зовнішній доступ</label>
          <label class="check-line"><input type="checkbox" name="allowLocalFallback" ${settings.allowLocalFallback ? "checked" : ""}> Дозволити локальний fallback, якщо сервер недоступний</label>
          <div class="toolbar full">
            <button class="primary" type="submit">Зберегти налаштування</button>
            <button class="secondary" type="button" data-sync-state-now>Зберегти стан на сервері</button>
            <button class="secondary" type="button" data-load-server-state>Перечитати з сервера</button>
          </div>
        </form>` : '<p class="muted">Роль не має дозволу змінювати системні налаштування.</p>'}
      </article>

      <article class="panel">
        <div class="split">
          <h2>Поточний API</h2>
          <span class="pill ${serverSyncClass()}">${serverSync.online ? "підключено" : "fallback"}</span>
        </div>
        <div class="table-wrap">
          <table>
            <tbody>
              <tr><th>Health endpoint</th><td>${escapeHtml(apiLabel)}</td></tr>
              <tr><th>CRM SQL API</th><td>${escapeHtml(settings.crmSqlApiBaseUrl || DEFAULT_SYSTEM_SETTINGS.crmSqlApiBaseUrl)}</td></tr>
              <tr><th>State revision</th><td>${Number(serverSync.revision || 0)}</td></tr>
              <tr><th>Останнє читання</th><td>${serverSync.lastLoadedAt ? formatDateTime(serverSync.lastLoadedAt) : "-"}</td></tr>
              <tr><th>Останнє збереження</th><td>${serverSync.lastSavedAt || settings.lastSavedAt ? formatDateTime(serverSync.lastSavedAt || settings.lastSavedAt) : "-"}</td></tr>
              <tr><th>Помилка</th><td>${escapeHtml(serverSync.error || "-")}</td></tr>
            </tbody>
          </table>
        </div>
        <p class="muted section-gap">Щоб дані реально зберігались на сервері 192.168.0.5, застосунок має бути запущений на цій машині командою <code>node server.mjs --host 0.0.0.0 --public-host 192.168.0.5 --port 8790</code> або через <code>start-server.ps1</code>.</p>
      </article>
    </section>
  `;
}

function renderLog() {
  setTitle("Операційний журнал");
  return `
    <section class="panel">
      <div class="split">
        <h2>Журнал дій B2C</h2>
        <span class="pill">${state.auditLog.length} подій</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Час</th><th>Користувач</th><th>Подія</th></tr></thead>
          <tbody>${state.auditLog.map((row) => `<tr><td>${formatDateTime(row.at)}</td><td>${escapeHtml(row.actor)}</td><td>${escapeHtml(row.event)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function checkoutLineById(lineId) {
  return state.checkout.lines.find((line) => line.lineId === lineId);
}

async function priceInfoFromPriceOption(option, criteria = checkoutPriceCriteria()) {
  const selected = normalizePriceOption(option, option?.source || "attached-price");
  if (!selected) {
    return { ok: false, error: "У вибраній прикріпленій ціні немає коректної суми." };
  }
  const sourceCurrency = normalizeCurrencyCode(selected.currency || selected.currencyRaw || BASE_CURRENCY);
  const sourcePrice = roundCurrencyAmount(selected.price || 0);
  const selectedPriceType = normalizePriceTypeLabel(selected.priceType || criteria.priceType);
  const baseInfo = {
    sourcePrice,
    sourceCurrency,
    priceOptionId: selected.id,
    priceSource: selected.source || selectedPriceType || "attached-price",
    selectedPriceType,
    selectedPriceCurrency: sourceCurrency,
    priceWarning: selected.priceWarning || ""
  };
  if (sourceCurrency === BASE_CURRENCY) {
    return {
      ok: true,
      ...baseInfo,
      price: sourcePrice,
      priceCurrency: BASE_CURRENCY,
      exchangeRate: 1,
      exchangeRateDate: ""
    };
  }
  try {
    await fetchExchangeRates();
  } catch (error) {
    return {
      ok: false,
      error: `Курси валют НБУ не завантажились: ${String(error?.message || error || "невідома помилка")}.`
    };
  }
  const rate = exchangeRateForCurrency(sourceCurrency);
  if (!rate) {
    return {
      ok: false,
      error: `Курс ${sourceCurrency} не завантажено з НБУ.`
    };
  }
  return {
    ok: true,
    ...baseInfo,
    price: roundCurrencyAmount(sourcePrice * Number(rate.rate || 0)),
    priceCurrency: BASE_CURRENCY,
    exchangeRate: Number(rate.rate || 0),
    exchangeRateDate: rate.exchangedate || exchangeRateLookup.loadedAt || "",
    priceWarning: selected.priceWarning || `${formatMoney(sourcePrice, sourceCurrency)} за курсом НБУ ${rate.rate}`
  };
}

async function resolveProductPriceForSale(product) {
  const directPrice = Number(product.price || 0);
  const criteria = checkoutPriceCriteria();
  const localRows = normalizeProductPriceRows(product.prices)
    .filter((row) => Number(row.price || 0) > 0)
    .sort((left, right) => priceRowRank(left) - priceRowRank(right));
  const localResolved = localRows.map((row) => ({
    ...row,
    currencies: currencyTokens(row.currencyRaw || row.currency),
    price: Number(row.price || 0)
  })).filter((row) => row.price > 0);
  const hasSelectedLocalRow = localResolved.some((row) => (
    row.currencies.length === 1
    && row.currencies[0] === criteria.currency
    && priceTypeMatches(row.priceType, criteria.priceType)
  ));
  const needsExactLiveRows = serverModeEnabled()
    && !hasSelectedLocalRow
    && (productCurrencyTokens(product).length > 1 || productPriceTypeLabels(product).length > 1);
  const liveRows = needsExactLiveRows ? await fetchLiveProductPricesForSale(product) : [];
  const priceOptions = productAttachedPriceOptions(product, liveRows);
  const rows = (liveRows.length ? liveRows : localRows)
    .filter((row) => Number(row.price || 0) > 0)
    .sort((left, right) => priceRowRank(left) - priceRowRank(right));
  const candidates = rows.length
    ? rows
    : [{ price: directPrice, currency: normalizeCurrencyCode(product.priceCurrency || product.currency || product.priceCurrencies || BASE_CURRENCY), currencyRaw: product.priceCurrencies || product.priceCurrency || product.currency || BASE_CURRENCY, priceType: product.priceTypes || "" }];
  const resolved = candidates.map((row) => ({
    ...row,
    currencies: currencyTokens(row.currencyRaw || row.currency),
    price: Number(row.price || 0)
  })).filter((row) => row.price > 0);
  const availableCurrencies = productAvailableCurrencies(product, resolved);
  const preferredCurrency = availableCurrencies.includes(criteria.currency)
    ? criteria.currency
    : (availableCurrencies.length === 1 ? availableCurrencies[0] : (availableCurrencies.includes(BASE_CURRENCY) ? BASE_CURRENCY : criteria.currency));
  const pendingPriceInfo = (message, selectedCurrency = preferredCurrency) => ({
    ok: true,
    price: 0,
    priceCurrency: BASE_CURRENCY,
    sourcePrice: 0,
    sourceCurrency: BASE_CURRENCY,
    exchangeRate: 1,
    exchangeRateDate: "",
    priceSource: "price-selection-required",
    priceOptionId: "",
    priceOptions,
    selectedPriceType: criteria.priceType,
    selectedPriceCurrency: selectedCurrency,
    priceWarning: message || "ціна після вибору"
  });
  if (!resolved.length) {
    return pendingPriceInfo("ціна після вибору");
  }
  const typeRows = resolved.filter((row) => priceTypeMatches(row.priceType, criteria.priceType));
  const exactRows = typeRows.filter((row) => row.currencies.length === 1 && row.currencies[0] === preferredCurrency);
  const rankedExactRows = exactRows.sort((left, right) => priceRowRank(left) - priceRowRank(right));
  const summaryCurrencies = productCurrencyTokens(product);
  const summarySource = directPrice > 0
    && productPriceTypeAvailable(product, criteria.priceType)
    && (!summaryCurrencies.length || summaryCurrencies.includes(preferredCurrency))
    ? {
      price: directPrice,
      currency: preferredCurrency,
      currencyRaw: preferredCurrency,
      currencies: [preferredCurrency],
      priceType: criteria.priceType || product.priceTypes || "sql-price-summary",
      priceWarning: liveRows.length ? "" : "ціна зі зведення SQL"
    }
    : null;
  const fallbackRows = typeRows.filter((row) => row.currencies.length === 1);
  const source = rankedExactRows[0]
    || summarySource
    || fallbackRows.find((row) => row.currencies[0] === BASE_CURRENCY)
    || fallbackRows[0]
    || null;
  if (!source) {
    return pendingPriceInfo(`Не знайдено прикріплену ціну для типу "${criteria.priceType}" і валюти ${preferredCurrency}. Виберіть доступну ціну в рядку чека.`);
  }
  const sourceCurrency = source.currencies[0];
  const sourceOption = normalizePriceOption({
    ...source,
    currency: sourceCurrency,
    currencyRaw: sourceCurrency,
    priceWarning: source.priceWarning || ""
  }, source.source || (liveRows.length ? "live-product-price" : "product-attached-price"));
  const priceInfo = await priceInfoFromPriceOption(sourceOption, criteria);
  if (!priceInfo.ok) {
    return pendingPriceInfo(priceInfo.error, sourceCurrency);
  }
  return {
    ...priceInfo,
    priceOptions
  };
}

function prepareCheckoutLine(product, priceInfo = {}) {
  return normalizeCheckoutLine({
    lineId: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    productCode: product.productCode || product.sku || "",
    sku: product.sku || product.productCode || "",
    sqlId: product.sqlId || "",
    qty: 1,
    discount: 0,
    price: Number(priceInfo.price ?? product.price ?? 0),
    priceCurrency: priceInfo.priceCurrency || BASE_CURRENCY,
    sourcePrice: Number(priceInfo.sourcePrice ?? priceInfo.price ?? product.price ?? 0),
    sourceCurrency: priceInfo.sourceCurrency || priceInfo.priceCurrency || BASE_CURRENCY,
    exchangeRate: Number(priceInfo.exchangeRate || 1),
    exchangeRateDate: priceInfo.exchangeRateDate || "",
    priceSource: priceInfo.priceSource || "",
    priceOptionId: priceInfo.priceOptionId || "",
    priceOptions: Array.isArray(priceInfo.priceOptions) && priceInfo.priceOptions.length ? priceInfo.priceOptions : productAttachedPriceOptions(product),
    selectedPriceType: priceInfo.selectedPriceType || state.checkout.priceType || DEFAULT_CHECKOUT_PRICE_TYPE,
    selectedPriceCurrency: priceInfo.selectedPriceCurrency || priceInfo.sourceCurrency || state.checkout.priceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY,
    priceWarning: priceInfo.priceWarning || "",
    warehouseCode: SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: SQL_MAIN_WAREHOUSE_NAME,
    warehouseStockQty: productWarehouseStockFallback(product),
    stockSource: product.retailStockQty ? "crm-sql-product-summary" : "local-fallback",
    serialOptions: [],
    serialName: "",
    serialError: ""
  });
}

async function hydrateCheckoutLine(lineId) {
  const line = checkoutLineById(lineId);
  if (!line) return;
  const product = productById(line.productId);
  if (!product.id) return;
  line.stockLoading = serverModeEnabled();
  line.stockError = "";
  if (isWeaponProduct(product)) {
    line.qty = 1;
    line.serialLoading = serverModeEnabled();
    line.serialError = "";
  }
  saveState();
  render();
  try {
    if (serverModeEnabled()) {
      const stockPayload = await queryLiveStockForProduct(product);
      const latestLine = checkoutLineById(lineId);
      if (latestLine) {
        const rows = stockPayload.items.filter((item) => String(item.warehouseCode) === SQL_MAIN_WAREHOUSE_CODE);
        latestLine.warehouseStockQty = rows.reduce((sum, item) => sum + Number(item.availableQty ?? item.qty ?? 0), 0);
        latestLine.warehouseReservedQty = rows.reduce((sum, item) => sum + Number(item.reservedQty || 0), 0);
        latestLine.warehouseCode = SQL_MAIN_WAREHOUSE_CODE;
        latestLine.warehouseName = rows[0]?.warehouseName || SQL_MAIN_WAREHOUSE_NAME;
        latestLine.stockSource = stockPayload.source || "crm-sql-live";
        latestLine.stockError = "";
      }
    }
  } catch (error) {
    markServerOffline(error);
    const latestLine = checkoutLineById(lineId);
    if (latestLine) {
      latestLine.warehouseStockQty = productWarehouseStockFallback(product);
      latestLine.stockSource = product.retailStockQty ? "crm-sql-product-summary" : "local-fallback";
      latestLine.stockError = String(error?.message || error || "stock unavailable");
    }
  } finally {
    const latestLine = checkoutLineById(lineId);
    if (latestLine) latestLine.stockLoading = false;
  }
  if (isWeaponProduct(product)) {
    try {
      if (!serverModeEnabled()) throw new Error("live serial API доступний тільки у server mode");
      const serialPayload = await queryLiveSerialsForProduct(product);
      const latestLine = checkoutLineById(lineId);
      if (latestLine) {
        latestLine.serialOptions = serialPayload.items;
        latestLine.serialLoading = false;
        latestLine.serialError = "";
        if (!latestLine.serialOptions.some((item) => item.serialName === latestLine.serialName)) {
          latestLine.serialName = "";
          latestLine.serialNumber = "";
        }
      }
    } catch (error) {
      markServerOffline(error);
      const latestLine = checkoutLineById(lineId);
      if (latestLine) {
        latestLine.serialOptions = [];
        latestLine.serialLoading = false;
        latestLine.serialName = "";
        latestLine.serialNumber = "";
        latestLine.serialError = String(error?.message || error || "live serial stock unavailable");
      }
    }
  }
  saveState();
  render();
}

async function addCartProduct(productOrId) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const product = typeof productOrId === "object" && productOrId
    ? rememberLiveProduct(productOrId)
    : productById(productOrId);
  if (!product.id) return alert("Товар не знайдено в довіднику.");
  const weapon = isWeaponProduct(product);
  const existing = weapon ? null : findCheckoutLineForProduct(product);
  if (existing) {
    existing.qty = Number(existing.qty || 1) + 1;
    existing.productId = product.id;
    existing.productCode = existing.productCode || product.productCode || product.sku || "";
    existing.sku = existing.sku || product.sku || product.productCode || "";
    existing.sqlId = existing.sqlId || product.sqlId || "";
    if (!Array.isArray(existing.priceOptions) || !existing.priceOptions.length) {
      existing.priceOptions = productAttachedPriceOptions(product);
    }
  } else {
    const priceInfo = await resolveProductPriceForSale(product);
    if (!priceInfo.ok) {
      state.checkout.lines.push(prepareCheckoutLine(product, {
        price: 0,
        priceCurrency: BASE_CURRENCY,
        sourcePrice: 0,
        sourceCurrency: BASE_CURRENCY,
        exchangeRate: 1,
        exchangeRateDate: "",
        priceSource: "price-selection-required",
        priceOptionId: "",
        priceOptions: Array.isArray(priceInfo.priceOptions) ? priceInfo.priceOptions : productAttachedPriceOptions(product),
        selectedPriceType: state.checkout.priceType || DEFAULT_CHECKOUT_PRICE_TYPE,
        selectedPriceCurrency: state.checkout.priceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY,
        priceWarning: priceInfo.error || "ціну товару потрібно вибрати в рядку чека"
      }));
    } else {
      state.checkout.lines.push(prepareCheckoutLine(product, priceInfo));
    }
  }
  audit(`Додано товар у кошик: ${product.sku}`);
  saveState();
  render();
  hydrateCheckoutLine(existing?.lineId || state.checkout.lines[state.checkout.lines.length - 1]?.lineId);
  return true;
}

async function addSelectedCheckoutProduct(value = state.checkout.search) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const query = String(value || "").trim();
  if (!query) {
    alert("Вкажіть товар, SKU, штрихкод або QR.");
    return;
  }
  const product = await resolveProductForSale(query);
  if (!product) {
    state.checkout.search = query;
    saveState();
    render();
    alert("Товар не знайдено через live API або fallback-довідник. Перевірте назву, SKU, штрихкод або QR.");
    return;
  }
  const added = await addCartProduct(product);
  if (added) {
    state.checkout.search = "";
    saveState();
    render();
  }
}

async function scanCheckoutProduct(value) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const product = await resolveProductForSale(value, { scan: true });
  if (!product) {
    state.checkout.search = String(value || "").trim();
    saveState();
    render();
    alert("Товар за штрихкодом або QR не знайдено через live API або fallback-довідник. Пошук залишено у полі товарів.");
    return;
  }
  const added = await addCartProduct(product);
  if (added) {
    state.checkout.search = "";
    saveState();
    render();
  }
}

function removeCartLine(index) {
  state.checkout.lines.splice(index, 1);
  saveState();
  render();
}

function currentSaleLines() {
  return cartLines().map((line) => {
    const product = productById(line.productId);
    const saleLine = {
      ...line,
      qty: isWeaponProduct(product) ? 1 : Math.max(1, Number(line.qty || 1)),
      price: Number(line.price || 0),
      priceCurrency: line.priceCurrency || BASE_CURRENCY,
      sourcePrice: Number(line.sourcePrice ?? line.price ?? 0),
      sourceCurrency: line.sourceCurrency || line.priceCurrency || BASE_CURRENCY,
      exchangeRate: Number(line.exchangeRate || 1),
      exchangeRateDate: line.exchangeRateDate || "",
      priceSource: line.priceSource || "",
      selectedPriceType: line.selectedPriceType || DEFAULT_CHECKOUT_PRICE_TYPE,
      selectedPriceCurrency: line.selectedPriceCurrency || line.sourceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY,
      priceWarning: line.priceWarning || "",
      discount: discountPercentValue(line.discount),
      discountPercent: discountPercentValue(line.discount),
      warehouseCode: line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
      warehouseName: line.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
      warehouseStockQty: checkoutLineWarehouseStock(line, product),
      serialName: line.serialName || "",
      serialNumber: line.serialNumber || line.serialName || ""
    };
    return { ...saleLine, total: lineTotal(saleLine) };
  });
}

function validateSalePrices(lines) {
  for (const line of lines) {
    const product = productById(line.productId);
    if (Number(line.price || 0) > 0) continue;
    alert(`Для товару "${product.name}" виберіть прикріплену ціну перед проведенням продажу.`);
    return false;
  }
  return true;
}

function validateSaleStock(lines) {
  const usedSerials = new Set();
  for (const line of lines) {
    const product = productById(line.productId);
    const available = checkoutLineWarehouseStock(line, product);
    if (line.stockLoading) {
      alert(`Залишок складу №1 ще завантажується: ${product.name}`);
      return false;
    }
    if (available < line.qty) {
      alert(`Недостатньо залишку на складі №1: ${product.name}. Доступно ${available}, потрібно ${line.qty}.`);
      return false;
    }
    if (!isWeaponProduct(product)) continue;
    if (line.serialLoading) {
      alert(`Серійні номери ще завантажуються: ${product.name}`);
      return false;
    }
    if (Number(line.qty || 1) !== 1) {
      alert(`Для зброї кількість у рядку має бути 1: ${product.name}`);
      return false;
    }
    const selected = selectedSerialOption(line);
    if (!line.serialName || !selected) {
      alert(`Для товару з папки "Зброя" оберіть доступний серійний номер: ${product.name}`);
      return false;
    }
    const serialKey = `${liveProductCode(product)}:${line.serialName}`;
    if (usedSerials.has(serialKey)) {
      alert(`Серійний номер уже вибраний у цьому чеку: ${line.serialName}`);
      return false;
    }
    usedSerials.add(serialKey);
  }
  return true;
}

function createReceipt(form) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  if (!openShift()) {
    alert("Спочатку відкрийте касову зміну.");
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.customerSearch) selectCustomerFromLookup(data.customerSearch, false);
  state.checkout.customerId = data.customerId || state.checkout.customerId;
  state.checkout.paymentMethod = data.paymentMethod || state.checkout.paymentMethod;
  state.checkout.note = data.note || "";
  const lines = currentSaleLines();
  if (!validateSaleStock(lines)) return;
  if (!validateSalePrices(lines)) return;
  state.saleConfirm = {
    open: true,
    paymentMethod: state.checkout.paymentMethod
  };
  saveState();
  render();
}

function updateSaleConfirmPayment(method) {
  state.saleConfirm.paymentMethod = ["cash", "card", "bank"].includes(method) ? method : state.checkout.paymentMethod;
  saveState();
  render();
}

function cancelSalePaymentConfirm() {
  state.saleConfirm = { open: false, paymentMethod: state.checkout.paymentMethod };
  saveState();
  render();
}

function confirmSalePayment(form) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const data = Object.fromEntries(new FormData(form).entries());
  const paymentMethod = data.paymentMethod || state.saleConfirm.paymentMethod || state.checkout.paymentMethod;
  if (paymentMethod === "bank" && !hasRegisteredCustomer()) {
    alert("Для оплати Банк потрібно вибрати клієнта з довідника. Роздрібний покупець не допускається.");
    state.saleConfirm = { open: true, paymentMethod };
    saveState();
    render();
    return;
  }
  state.checkout.paymentMethod = paymentMethod;
  state.saleConfirm = { open: false, paymentMethod };
  postConfirmedReceipt();
}

function postConfirmedReceipt() {
  const shift = openShift();
  if (!shift) {
    alert("Спочатку відкрийте касову зміну.");
    return;
  }
  if (state.checkout.paymentMethod === "bank" && !hasRegisteredCustomer()) {
    alert("Для оплати Банк потрібно вибрати клієнта з довідника. Роздрібний покупець не допускається.");
    state.saleConfirm = { open: true, paymentMethod: "bank" };
    saveState();
    render();
    return;
  }
  const lines = currentSaleLines();
  const subtotal = receiptSubtotal(lines);
  const loyalDiscount = loyaltyDiscount(lines, state.checkout.customerId);
  const total = checkoutTotal(lines, state.checkout.customerId);
  if (!validateSaleStock(lines)) return;
  if (!validateSalePrices(lines)) return;
  lines.forEach(decreaseLocalStockIfPresent);
  const receipt = {
    id: nextId("B2C", state.receipts),
    date: today(),
    customerId: state.checkout.customerId,
    paymentMethod: state.checkout.paymentMethod,
    status: "posted",
    lines,
    subtotal,
    loyaltyDiscount: loyalDiscount,
    total,
    note: state.checkout.note,
    shiftId: shift.id,
    createdAt: nowIso()
  };
  state.receipts.unshift(receipt);
  applyPaymentToShift(shift, receipt.paymentMethod, receipt.total, "sale");
  state.checkout.lines = [];
  state.checkout.note = "";
  state.saleConfirm = { open: false, paymentMethod: state.checkout.paymentMethod };
  state.currentView = "pos";
  audit(`Проведено продаж ${receipt.id} на ${formatMoney(receipt.total)}`);
  saveState();
  render();
}

function syncProductsFromSql(mode = "manual-sync", renderAfter = true) {
  if (!canDo("sql_import") && !canDo("exchange_import")) return alert("Немає дозволу виконувати SQL-імпорт.");
  setExchangeProcess("Імпорт товарів, цін і довідників з SQL", 45);
  state.products = sqlProductSnapshot.map((row) => normalizeProduct(productFromSql(row)));
  state.references = clone(sqlReferenceSnapshot);
  state.productImport = {
    source: SQL_PRODUCT_SOURCE,
    rows: sqlProductSnapshot.length,
    lastRunAt: nowIso(),
    mode
  };
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  addExchangeRecord({
    direction: "import",
    dataset: "Товари, ціни, довідники",
    source: SQL_PRODUCT_SOURCE,
    rows: state.products.length,
    details: "product_code, шляхи папок, ціни, валюти, характеристики, вид/серія/група"
  });
  finishExchangeProcess(`Імпорт товарів завершено: ${state.products.length} SKU`);
  audit(`Імпортовано ${state.products.length} SKU з PostgreSQL ${SQL_SCHEMA} (${SQL_PRODUCT_SOURCE})`);
  saveState();
  if (renderAfter) render();
}

function syncCounterpartiesFromSql(mode = "manual-sync", renderAfter = true) {
  if (!canDo("sql_import") && !canDo("exchange_import")) return alert("Немає дозволу виконувати SQL-імпорт.");
  setExchangeProcess("Імпорт клієнтів/контрагентів з SQL", 55);
  const localCustomers = state.customers.filter((customer) => customer.source === "b2c");
  const importedCustomers = sqlCustomerSnapshot.map(normalizeCustomer);
  const localKeys = new Set(localCustomers.flatMap((customer) => [
    customer.counterpartyCode,
    customer.phone
  ].filter(Boolean).map((value) => normalizeScanText(value))));
  state.customers = [
    ...localCustomers,
    ...importedCustomers.filter((customer) => !localKeys.has(normalizeScanText(customer.counterpartyCode)) && !localKeys.has(normalizeScanText(customer.phone)))
  ];
  state.counterpartyImport = {
    source: SQL_COUNTERPARTY_SOURCE,
    rows: importedCustomers.length,
    lastRunAt: nowIso(),
    mode
  };
  if (state.checkout.customerId !== "walk-in" && !state.customers.some((customer) => customer.id === state.checkout.customerId)) {
    state.checkout.customerId = "walk-in";
    state.checkout.customerSearch = "";
  }
  addExchangeRecord({
    direction: "import",
    dataset: "Клієнти/контрагенти",
    source: SQL_COUNTERPARTY_SOURCE,
    rows: importedCustomers.length,
    details: "контрагенти, договори, сальдо, розрахунки"
  });
  finishExchangeProcess(`Імпорт клієнтів завершено: ${importedCustomers.length} карток SQL, локальних B2C збережено: ${localCustomers.length}`);
  audit(`Імпортовано ${importedCustomers.length} клієнтів/контрагентів з PostgreSQL ${SQL_SCHEMA}; локальних B2C збережено ${localCustomers.length} (${SQL_COUNTERPARTY_SOURCE})`);
  saveState();
  if (renderAfter) render();
}

function nextCustomerCode() {
  const numbers = state.customers
    .map((customer) => String(customer.counterpartyCode || "").match(/^B2C-(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  return `B2C-${String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(4, "0")}`;
}

function createCustomer(form) {
  if (!canDo("customer_create")) return alert("Немає дозволу створювати клієнта.");
  const data = Object.fromEntries(new FormData(form).entries());
  const name = String(data.name || "").trim();
  const phone = String(data.phone || "").trim();
  const email = String(data.email || "").trim();
  const counterpartyCode = String(data.counterpartyCode || "").trim() || nextCustomerCode();
  const loyalty = LOYALTY_DISCOUNTS[data.loyalty] !== undefined ? data.loyalty : "standard";
  const contractName = String(data.contractName || "").trim();
  if (!name) return alert("Вкажіть ім'я клієнта.");
  if (phone && state.customers.some((customer) => normalizeScanText(customer.phone) === normalizeScanText(phone))) {
    return alert("Клієнт з таким телефоном вже є у довіднику.");
  }
  if (state.customers.some((customer) => normalizeScanText(customer.counterpartyCode) === normalizeScanText(counterpartyCode))) {
    return alert("Клієнт з таким counterparty_code вже є у довіднику.");
  }
  const customer = normalizeCustomer({
    id: `c-${Date.now()}`,
    counterpartyCode,
    name,
    phone,
    email,
    loyalty,
    contracts: contractName ? [{ contractCode: `DOG-${counterpartyCode}`, contractName }] : [],
    settlements: [],
    balance: 0,
    balanceCurrency: "UAH",
    source: "b2c",
    exportStatus: "pending",
    createdAt: nowIso(),
    note: String(data.note || "").trim()
  });
  state.customers.unshift(customer);
  state.checkout.customerId = customer.id;
  state.checkout.customerSearch = customerLookupValue(customer);
  addExchangeRecord({
    direction: "export",
    dataset: "Клієнти B2C",
    destination: `${SQL_SCHEMA}.b2c_counterparties_export_queue`,
    status: "queued",
    rows: 1,
    details: `Новий клієнт ${customer.counterpartyCode} очікує експорту.`
  });
  audit(`Створено клієнта ${customer.name} (${customer.counterpartyCode}) у B2C, очікує експорт у SQL`);
  form.reset();
  saveState();
  render();
}

function selectCustomer(customerId) {
  state.checkout.customerId = customerId;
  state.checkout.customerSearch = customerLookupValue(customerById(customerId));
  state.currentView = "pos";
  audit(`Клієнта ${customerById(customerId).name} вибрано для продажу`);
  saveState();
  render();
}

function selectLiveCustomer(customerId) {
  const target = normalizeScanText(customerId);
  const candidates = [
    ...liveCustomerLookup.items,
    ...liveTable("counterparties").items.map(customerFromLiveCounterparty)
  ];
  const found = candidates.find((customer) => (
    normalizeScanText(customer.id) === target
    || normalizeScanText(customer.counterpartyCode) === target
    || normalizeScanText(customer.sqlId) === target
  ));
  if (!found) return alert("SQL-клієнта не знайдено на поточній сторінці. Повторіть пошук.");
  const customer = rememberLiveCustomer(found);
  state.checkout.customerId = customer.id;
  state.checkout.customerSearch = customerLookupValue(customer);
  state.currentView = "pos";
  audit(`SQL-клієнта ${customer.name} вибрано для продажу`);
  saveState();
  render();
}

function selectCustomerFromLookup(value, renderAfter = true) {
  const query = String(value || "").trim();
  state.checkout.customerSearch = query;
  const customer = findExactCustomerByLookup(query) || findCustomerByLookup(query);
  if (customer) {
    const selected = rememberLiveCustomer(customer);
    const changed = state.checkout.customerId !== selected.id;
    state.checkout.customerId = selected.id;
    state.checkout.customerSearch = customerLookupValue(selected);
    if (changed) audit(`Клієнта ${selected.name} вибрано для продажу`);
  }
  saveState();
  if (renderAfter) render();
}

function applyPaymentToShift(shift, method, total, kind) {
  const field = paymentShiftField(kind, method) || paymentShiftField(kind, "cash");
  shift[field] = Number(shift[field] || 0) + Number(total || 0);
}

function paymentShiftField(kind, method) {
  const fieldMap = {
    sale: { cash: "cashSales", card: "cardSales", bank: "bankSales" },
    return: { cash: "cashReturns", card: "cardReturns", bank: "bankReturns" }
  };
  return fieldMap[kind]?.[method] || "";
}

function movePaymentInShift(shiftId, kind, oldMethod, newMethod, total) {
  if (oldMethod === newMethod) return;
  const shift = state.cashShifts.find((item) => item.id === shiftId) || openShift();
  if (!shift) return;
  const oldField = paymentShiftField(kind, oldMethod);
  const newField = paymentShiftField(kind, newMethod);
  if (!oldField || !newField) return;
  shift[oldField] = Number(shift[oldField] || 0) - Number(total || 0);
  shift[newField] = Number(shift[newField] || 0) + Number(total || 0);
}

function defaultRefundMethod(receipt) {
  return receipt?.paymentMethod === "cash" ? "cash" : "card";
}

function openReturnRefundConfirm(payload, receipt) {
  state.returnConfirm = {
    open: true,
    payload,
    refundMethod: defaultRefundMethod(receipt)
  };
  saveState();
  render();
}

function cancelReturnRefundConfirm() {
  state.returnConfirm = clone(seedState.returnConfirm);
  saveState();
  render();
}

function updateReturnConfirmRefund(method) {
  state.returnConfirm.refundMethod = ["cash", "card"].includes(method) ? method : "card";
  saveState();
  render();
}

function createReturn(receiptId) {
  if (!canDo("return_create")) return alert("Немає дозволу оформлювати повернення.");
  const receipt = state.receipts.find((item) => item.id === receiptId);
  if (!receipt || receipt.status === "returned") return;
  const remaining = receiptReturnableLines(receipt).filter((line) => line.returnable > 0);
  if (!remaining.length) return;
  if (!openShift()) {
    alert("Для повернення потрібна відкрита касова зміна.");
    return;
  }
  const total = remaining.reduce((sum, line) => sum + returnLineTotal(receipt, line.productId, line.returnable), 0);
  openReturnRefundConfirm({
    receiptId,
    lines: remaining.map((line) => ({ productId: line.productId, qty: line.returnable, price: line.price, total: returnLineTotal(receipt, line.productId, line.returnable) })),
    total,
    reason: "повне повернення"
  }, receipt);
}

function returnLineTotal(receipt, productId, qty) {
  const line = receipt.lines.find((item) => item.productId === productId);
  if (!line) return 0;
  const unitTotal = Number(line.total || 0) / Math.max(1, Number(line.qty || 1));
  const loyaltyShare = Number(receipt.loyaltyDiscount || 0) / Math.max(1, Number(receipt.subtotal || receiptTotal(receipt.lines) || 1));
  return Math.round(unitTotal * Number(qty || 0) * (1 - loyaltyShare));
}

function createPartialReturn(form) {
  if (!canDo("return_create")) return alert("Немає дозволу оформлювати повернення.");
  const data = Object.fromEntries(new FormData(form).entries());
  const [receiptId, productId] = String(data.productId || "").split("::");
  const receipt = state.receipts.find((item) => item.id === receiptId);
  if (!receipt || !productId) return alert("Оберіть чек і товар для повернення.");
  const line = receiptReturnableLines(receipt).find((item) => item.productId === productId);
  const qty = Math.max(1, Number(data.qty || 1));
  if (!line || line.returnable < qty) return alert("Кількість повернення більша за доступну.");
  if (!openShift()) return alert("Для повернення потрібна відкрита касова зміна.");
  const total = returnLineTotal(receipt, productId, qty);
  openReturnRefundConfirm({
    receiptId,
    lines: [{ productId, qty, price: line.price, total }],
    total,
    reason: data.reason || "часткове повернення"
  }, receipt);
}

function confirmReturnRefund(form) {
  if (!canDo("return_create")) return alert("Немає дозволу оформлювати повернення.");
  const data = Object.fromEntries(new FormData(form).entries());
  const refundMethod = ["cash", "card"].includes(data.refundMethod) ? data.refundMethod : state.returnConfirm.refundMethod;
  const payload = state.returnConfirm.payload;
  if (!payload) return;
  postReturnPayload(payload, refundMethod);
}

function postReturnPayload(payload, refundMethod) {
  const receipt = state.receipts.find((item) => item.id === payload.receiptId);
  if (!receipt) return alert("Чек для повернення не знайдено.");
  const shift = openShift();
  if (!shift) return alert("Для повернення потрібна відкрита касова зміна.");
  const returnable = receiptReturnableLines(receipt);
  const valid = payload.lines.every((line) => {
    const current = returnable.find((item) => item.productId === line.productId);
    return current && current.returnable >= Number(line.qty || 0);
  });
  if (!valid) return alert("Повернення вже не відповідає доступним залишкам по чеку.");
  const returnDoc = {
    id: nextId("RET", state.returns),
    date: today(),
    receiptId: payload.receiptId,
    lines: payload.lines.map((line) => ({ ...line, qty: Number(line.qty || 0), total: Number(line.total || 0) })),
    total: Number(payload.total || 0),
    reason: payload.reason || "повернення",
    refundMethod,
    sourcePaymentMethod: receipt.paymentMethod,
    shiftId: shift.id,
    createdAt: nowIso()
  };
  returnDoc.lines.forEach((line) => {
    stockRow(line.productId).qty += Number(line.qty || 0);
  });
  state.returns.unshift(returnDoc);
  const stillReturnable = receiptReturnableLines(receipt).some((item) => item.returnable > 0);
  receipt.status = stillReturnable ? "partial_return" : "returned";
  applyPaymentToShift(shift, refundMethod, returnDoc.total, "return");
  state.returnConfirm = clone(seedState.returnConfirm);
  state.selectedReturnId = returnDoc.id;
  audit(`Оформлено повернення ${returnDoc.id} по чеку ${receipt.id}: ${returnDoc.lines.map((line) => `${productById(line.productId).sku} x ${line.qty}`).join(", ")}, гроші ${refundLabel(refundMethod)}`);
  state.currentView = "returns";
  saveState();
  render();
}

function parseDocumentTarget(value) {
  const [type, id] = String(value || "").split("::");
  return { type, id };
}

function openDrilldown(type) {
  if (!canDo("drilldown_view")) return alert("Немає дозволу відкривати розшифровки сум.");
  state.drilldown = { open: true, type };
  saveState();
  render();
}

function closeDrilldown() {
  state.drilldown = clone(seedState.drilldown);
  saveState();
  render();
}

function openDocumentTarget(value) {
  const { type, id } = parseDocumentTarget(value);
  if (type === "receipt") {
    if (!canOpenBlock("pos")) return alert("Немає дозволу відкривати блок продажу.");
    state.checkout.printReceiptId = id;
    state.currentView = "pos";
  } else if (type === "return") {
    if (!canOpenBlock("returns")) return alert("Немає дозволу відкривати блок повернень.");
    state.selectedReturnId = id;
    state.currentView = "returns";
  }
  state.drilldown = clone(seedState.drilldown);
  saveState();
  render();
}

function editDocumentTarget(value) {
  if (!canDo("document_edit")) return alert("Немає дозволу редагувати документи.");
  const { type, id } = parseDocumentTarget(value);
  if (!["receipt", "return"].includes(type) || !id) return;
  state.documentEdit = { open: true, type, id };
  state.drilldown = clone(seedState.drilldown);
  saveState();
  render();
}

function closeDocumentEdit() {
  state.documentEdit = clone(seedState.documentEdit);
  saveState();
  render();
}

function saveDocumentEdit(form) {
  if (!canDo("document_edit")) return alert("Немає дозволу редагувати документи.");
  const data = Object.fromEntries(new FormData(form).entries());
  const { type, id } = state.documentEdit;
  if (type === "receipt") {
    const receipt = state.receipts.find((item) => item.id === id);
    if (!receipt) return alert("Чек не знайдено.");
    const nextCustomerId = state.customers.some((customer) => customer.id === data.customerId) ? data.customerId : receipt.customerId;
    const nextPaymentMethod = ["cash", "card", "bank"].includes(data.paymentMethod) ? data.paymentMethod : receipt.paymentMethod;
    if (nextPaymentMethod === "bank" && !hasRegisteredCustomer(nextCustomerId)) {
      return alert("Для оплати Банк у чеку має бути вибраний клієнт з довідника, не Роздрібний покупець.");
    }
    const oldPaymentMethod = receipt.paymentMethod;
    receipt.customerId = nextCustomerId;
    receipt.paymentMethod = nextPaymentMethod;
    receipt.note = data.note || "";
    if (!receipt.shiftId && openShift()) receipt.shiftId = openShift().id;
    movePaymentInShift(receipt.shiftId, "sale", oldPaymentMethod, nextPaymentMethod, receipt.total);
    audit(`Змінено чек ${receipt.id}`);
  } else if (type === "return") {
    const returnDoc = state.returns.find((item) => item.id === id);
    if (!returnDoc) return alert("Повернення не знайдено.");
    const nextRefundMethod = ["cash", "card"].includes(data.refundMethod) ? data.refundMethod : returnDoc.refundMethod;
    const oldRefundMethod = returnDoc.refundMethod;
    returnDoc.refundMethod = nextRefundMethod;
    returnDoc.reason = data.reason || "повернення";
    if (!returnDoc.shiftId && openShift()) returnDoc.shiftId = openShift().id;
    movePaymentInShift(returnDoc.shiftId, "return", oldRefundMethod, nextRefundMethod, returnDoc.total);
    audit(`Змінено повернення ${returnDoc.id}`);
  }
  state.documentEdit = clone(seedState.documentEdit);
  saveState();
  render();
}

function setDocumentListSort(kind, field) {
  if (!canDo("document_list_sort")) return alert("Немає дозволу сортувати списки.");
  const prefs = state.listUi?.[kind];
  if (!prefs) return;
  if (prefs.sortBy === field) {
    prefs.sortDir = prefs.sortDir === "asc" ? "desc" : "asc";
  } else {
    prefs.sortBy = field;
    prefs.sortDir = field === "amount" ? "desc" : "asc";
  }
  saveState();
  render();
}

function setDocumentListFilter(kind, field, value) {
  if (!canDo("document_list_sort")) return;
  const prefs = state.listUi?.[kind];
  if (!prefs || !["date", "customer"].includes(field)) return;
  prefs[field] = value;
  saveState();
  render();
}

function toggleDocumentList(kind) {
  if (!canDo("document_list_collapse")) return alert("Немає дозволу згортати списки.");
  const prefs = state.listUi?.[kind];
  if (!prefs) return;
  prefs.collapsed = !prefs.collapsed;
  saveState();
  render();
}

function syncStockReceiptsFromSql(mode = "manual-sync", renderAfter = true) {
  if (!canDo("sql_import") && !canDo("exchange_import")) return alert("Немає дозволу виконувати SQL-імпорт.");
  setExchangeProcess("Імпорт залишків і серійних номерів з SQL", 55);
  state.stockReceipts = sqlStockReceiptSnapshot.map((row) => normalizeStockReceipt(stockReceiptFromSql(row)));
  state.stock = sqlStockBalanceSnapshot.map((row) => normalizeStockBalance(stockFromSql(row)));
  state.serialStock = sqlSerialStockSnapshot.map((row) => normalizeSerialStock(serialStockFromSql(row)));
  state.stockImport = {
    source: SQL_STOCK_RECEIPT_SOURCE,
    rows: state.stock.length,
    lastRunAt: nowIso(),
    mode
  };
  state.serialImport = {
    source: SQL_SERIAL_STOCK_SOURCE,
    rows: state.serialStock.length,
    lastRunAt: nowIso(),
    mode
  };
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  addExchangeRecord({
    direction: "import",
    dataset: "Залишки і серійні номери",
    source: `${SQL_STOCK_RECEIPT_SOURCE}; ${SQL_SERIAL_STOCK_SOURCE}`,
    rows: state.stock.length + state.serialStock.length,
    details: `${SQL_MAIN_WAREHOUSE_NAME}, ${SQL_WHOLESALE_WAREHOUSE_NAME}, всі склади, product_code, warehouse_code`
  });
  finishExchangeProcess(`Імпорт залишків завершено: ${state.stock.length} залишків, ${state.serialStock.length} серійних рядків`);
  audit(`Імпортовано ${state.stock.length} складських залишків і ${state.serialStock.length} серійних рядків з SQL (${SQL_STOCK_RECEIPT_SOURCE})`);
  saveState();
  if (renderAfter) render();
}

function syncAllExchangeFromSql(mode = "manual-sync") {
  if (!canDo("exchange_import")) return alert("Немає дозволу керувати імпортом у блоці обміну даними.");
  setExchangeProcess("Повний імпорт B2C з PostgreSQL one_c_mirror", 10);
  syncProductsFromSql(mode, false);
  syncStockReceiptsFromSql(mode, false);
  syncCounterpartiesFromSql(mode, false);
  addExchangeRecord({
    direction: "import",
    dataset: "Повний B2C імпорт",
    source: `PostgreSQL:${SQL_SCHEMA}`,
    rows: importSummaryRows(),
    details: "товари, ціни, довідники, залишки, серійні номери, клієнти/контрагенти"
  });
  finishExchangeProcess(`Повний імпорт завершено: ${importSummaryRows()} рядків`);
  audit(`Повний SQL-імпорт B2C завершено: ${importSummaryRows()} рядків`);
  saveState();
  render();
}

function setInventoryActual(productId, value) {
  const line = state.inventory.lines.find((item) => inventoryLineMatches(item, productId));
  if (!line) return;
  line.expectedQty = line.serialName ? Number(line.expectedQty || 1) : stockQty(line.productId, line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE);
  line.actualQty = value === "" ? "" : Math.max(0, Number(value || 0));
  if (line.serialName && line.actualQty !== "") line.actualQty = Math.min(1, Number(line.actualQty || 0));
  saveState({ server: false });
}

function inventoryLineForProduct(productId, options = {}) {
  const warehouseCode = String(options.warehouseCode || SQL_MAIN_WAREHOUSE_CODE);
  const warehouseName = options.warehouseName || warehouseNameByCode(warehouseCode);
  const serialName = String(options.serialName || options.serialNumber || "");
  const lineKey = options.lineKey || inventoryLineKey(productId, warehouseCode, serialName);
  let line = state.inventory.lines.find((item) => inventoryLineKeyForLine(item) === lineKey);
  if (!line) {
    line = {
      lineKey,
      productId,
      warehouseCode,
      warehouseName,
      serialName,
      serialNumber: options.serialNumber || serialName,
      expectedQty: serialName ? Number(options.expectedQty ?? 1) : stockQty(productId, warehouseCode),
      actualQty: ""
    };
    state.inventory.lines.push(line);
  }
  line.lineKey = lineKey;
  line.warehouseCode = warehouseCode;
  line.warehouseName = warehouseName;
  line.serialName = serialName;
  line.serialNumber = options.serialNumber || serialName;
  line.expectedQty = serialName ? Number(options.expectedQty ?? line.expectedQty ?? 1) : stockQty(productId, warehouseCode);
  return line;
}

function addInventoryProductFromLookup(value = state.inventory.addSearch) {
  const query = String(value || "").trim();
  if (!query) {
    alert("Вкажіть товар з довідника товарів.");
    return;
  }
  const product = findInventoryProductByLookup(query);
  if (!product) {
    state.inventory.addSearch = query;
    saveState({ server: false });
    render();
    alert("Товар не знайдено в довіднику товарів. Перевірте назву, SKU, штрихкод або QR.");
    return;
  }
  const warehouseCode = inventorySelectedWarehouseCodes()[0] || SQL_MAIN_WAREHOUSE_CODE;
  const lineKey = inventoryLineKey(product.id, warehouseCode);
  const existed = state.inventory.lines.some((item) => inventoryLineKeyForLine(item) === lineKey);
  inventoryLineForProduct(product.id, { warehouseCode });
  state.inventory.addSearch = "";
  state.inventory.search = product.sku;
  audit(`${existed ? "Відкрито" : "Додано"} товар до інвентаризації: ${product.sku}`);
  saveState({ server: false });
  render();
}

function addLocalInventoryStockProducts() {
  const selectedWarehouses = inventorySelectedWarehouseCodes();
  const productsWithStock = state.products.filter((product) => selectedWarehouses.some((warehouseCode) => stockQty(product.id, warehouseCode) > 0));
  const before = state.inventory.lines.length;
  productsWithStock.forEach((product) => {
    selectedWarehouses
      .filter((warehouseCode) => stockQty(product.id, warehouseCode) > 0)
      .forEach((warehouseCode) => inventoryLineForProduct(product.id, { warehouseCode }));
  });
  const added = state.inventory.lines.length - before;
  state.inventory.addSearch = "";
  state.inventory.search = "";
  if (!productsWithStock.length) {
    alert("У довіднику немає товарів із залишками.");
    return;
  }
  audit(`Додано товари із залишками до інвентаризації: ${added} нових із ${productsWithStock.length}, склади ${selectedWarehouses.join(", ")}`);
  saveState({ server: false });
  render();
}

async function addAllInventoryStockProducts() {
  if (!serverModeEnabled()) return addLocalInventoryStockProducts();
  if (inventoryAddAllStockStatus.loading) return;
  inventoryAddAllStockStatus.loading = true;
  inventoryAddAllStockStatus.loaded = 0;
  inventoryAddAllStockStatus.total = 0;
  inventoryAddAllStockStatus.error = "";
  render();
  try {
    const selectedWarehouses = inventorySelectedWarehouseCodes();
    const rows = await fetchAllLiveInventoryStockRows(selectedWarehouses);
    const selectedWarehouseSet = new Set(selectedWarehouses);
    const filteredRows = rows
      .map(normalizeStockBalance)
      .filter((row) => selectedWarehouseSet.has(String(row.warehouseCode)) && stockLookupAvailableQty(row) > 0);
    if (!filteredRows.length) {
      inventoryAddAllStockStatus.error = `Live API не повернув товарів із залишками на вибраних складах: ${selectedWarehouses.join(", ")}.`;
      alert(inventoryAddAllStockStatus.error);
      return;
    }
    const result = await applyLiveStockRowsToInventory(filteredRows);
    state.inventory.addSearch = "";
    state.inventory.search = "";
    inventoryAddAllStockStatus.error = "";
    audit(`Додано live SQL залишки до інвентаризації: ${result.added} нових, ${result.updated} оновлено, ${result.products} товарів, ${result.serialLines} серійних рядків із ${result.sourceRows} рядків складів ${selectedWarehouses.join(", ")}`);
    saveState({ server: false });
  } catch (error) {
    inventoryAddAllStockStatus.error = String(error?.message || error || "Не вдалося завантажити live залишки.");
    markServerOffline(error);
    alert(`Не вдалося додати всі товари із залишками: ${inventoryAddAllStockStatus.error}`);
  } finally {
    inventoryAddAllStockStatus.loading = false;
    render();
  }
}

function removeInventoryProduct(productId) {
  const index = state.inventory.lines.findIndex((item) => inventoryLineMatches(item, productId));
  if (index === -1) return;
  const removedLine = state.inventory.lines[index];
  const product = productById(removedLine.productId || productId);
  const hasOtherProductLines = state.inventory.lines.some((item, itemIndex) => itemIndex !== index && item.productId === removedLine.productId);
  const relatedResorts = hasOtherProductLines ? 0 : state.inventory.resorts.filter((item) => item.fromProductId === removedLine.productId || item.toProductId === removedLine.productId).length;
  state.inventory.lines.splice(index, 1);
  if (relatedResorts) {
    state.inventory.resorts = state.inventory.resorts.filter((item) => item.fromProductId !== removedLine.productId && item.toProductId !== removedLine.productId);
  }
  if (normalizeScanText(state.inventory.search) === normalizeScanText(product.sku)) state.inventory.search = "";
  audit(`Видалено рядок з інвентаризації: ${product.sku} · ${removedLine.warehouseName || warehouseNameByCode(removedLine.warehouseCode)}${removedLine.serialName ? ` · SN ${removedLine.serialName}` : ""}${relatedResorts ? `, прибрано пересортів: ${relatedResorts}` : ""}`);
  saveState({ server: false });
  render();
}

function inventoryActualBase(productId) {
  const line = inventoryLineForProduct(productId);
  return line.actualQty === "" || line.actualQty === null || line.actualQty === undefined ? stockQty(productId) : Number(line.actualQty || 0);
}

function createInventoryResort(form) {
  if (!canDo("inventory_resort")) return alert("Немає дозволу проводити пересорт.");
  const data = Object.fromEntries(new FormData(form).entries());
  const fromProduct = productById(data.fromProductId);
  const toProduct = productById(data.toProductId);
  const qty = Math.max(1, Number(data.qty || 1));
  if (!fromProduct || !toProduct) return alert("Оберіть товари для пересорту.");
  if (fromProduct.id === toProduct.id) return alert("Для пересорту оберіть два різні товари.");

  const fromActual = inventoryActualBase(fromProduct.id);
  if (fromActual < qty) return alert("Кількість мінус товару не може бути більшою за фактичний залишок.");

  const toActual = inventoryActualBase(toProduct.id);
  const fromLine = inventoryLineForProduct(fromProduct.id);
  const toLine = inventoryLineForProduct(toProduct.id);
  fromLine.actualQty = fromActual - qty;
  toLine.actualQty = toActual + qty;

  const minusAmount = qty * Number(fromProduct.price || 0);
  const plusAmount = qty * Number(toProduct.price || 0);
  const item = {
    id: nextId("RSRT", state.inventory.resorts),
    fromProductId: fromProduct.id,
    toProductId: toProduct.id,
    qty,
    fromPrice: Number(fromProduct.price || 0),
    toPrice: Number(toProduct.price || 0),
    minusAmount,
    plusAmount,
    netAmount: plusAmount - minusAmount,
    note: data.note || "",
    createdAt: nowIso()
  };
  state.inventory.resorts.unshift(item);
  audit(`Проведено пересорт ${item.id}: -${fromProduct.sku} +${toProduct.sku}, ${qty} од., різниця ${formatMoney(item.netAmount)}`);
  saveState({ server: false });
  render();
}

function removeInventoryResort(index) {
  const item = state.inventory.resorts.splice(index, 1)[0];
  if (!item) return;
  const fromLine = inventoryLineForProduct(item.fromProductId);
  const toLine = inventoryLineForProduct(item.toProductId);
  fromLine.actualQty = inventoryActualBase(item.fromProductId) + Number(item.qty || 0);
  toLine.actualQty = Math.max(0, inventoryActualBase(item.toProductId) - Number(item.qty || 0));
  audit(`Скасовано пересорт ${item.id}`);
  saveState({ server: false });
  render();
}

function scanInventoryProduct(value) {
  const product = findInventoryProductByScan(value);
  if (!product) {
    alert("Товар за штрихкодом або QR для інвентаризації не знайдено.");
    return;
  }
  const warehouseCode = inventorySelectedWarehouseCodes()[0] || SQL_MAIN_WAREHOUSE_CODE;
  const line = inventoryLineForProduct(product.id, { warehouseCode });
  line.expectedQty = stockQty(product.id, warehouseCode);
  line.actualQty = Number(line.actualQty || 0) + 1;
  state.inventory.scan = "";
  state.inventory.search = product.sku;
  saveState({ server: false });
  render();
}

function resetInventoryDraft() {
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  audit("Очищено інвентаризаційний лист");
  saveState({ server: false });
  render();
}

function printInventorySheet() {
  state.inventory.printedAt = nowIso();
  saveState({ server: false });
  render();
  if (typeof window !== "undefined" && typeof window.print === "function") {
    window.print();
  }
}

function postInventory() {
  if (!canDo("inventory_post")) return alert("Немає дозволу проводити інвентаризацію.");
  const rows = inventoryRows().filter((row) => row.hasActual);
  if (!rows.length) {
    alert("Введіть фактичний залишок або проскануйте товар для інвентаризації.");
    return;
  }
  const totals = inventoryTotals(rows);
  const doc = {
    id: nextId("INV", state.inventoryDocs),
    date: today(),
    createdAt: nowIso(),
    lines: rows.map((row) => ({
      lineKey: row.lineKey,
      productId: row.product.id,
      sku: row.product.sku,
      productCode: row.product.productCode || row.product.sku,
      warehouseCode: row.warehouseCode,
      warehouseName: row.warehouseName,
      serialName: row.serialName,
      serialNumber: row.serialName,
      price: row.price,
      expectedQty: row.expectedQty,
      expectedAmount: row.expectedAmount,
      actualQty: row.actualQty,
      actualAmount: row.actualAmount,
      diff: row.diff,
      diffAmount: row.diffAmount
    })),
    totalDiff: totals.totalDiff,
    positiveDiff: totals.positive,
    negativeDiff: totals.negative,
    totalAmountDiff: totals.totalAmountDiff,
    positiveAmount: totals.positiveAmount,
    negativeAmount: totals.negativeAmount,
    resorts: clone(state.inventory.resorts),
    appliedToStock: true,
    stockAdjustments: rows.map((row) => ({
      productId: row.product.id,
      sku: row.product.sku,
      warehouseCode: row.warehouseCode,
      warehouseName: row.warehouseName,
      serialName: row.serialName,
      beforeQty: row.expectedQty,
      afterQty: row.actualQty,
      diff: row.diff
    }))
  };
  const actualByStockKey = new Map();
  rows.forEach((row) => {
    const key = inventoryLineKey(row.product.id, row.warehouseCode);
    const current = actualByStockKey.get(key) || { row, actualQty: 0, serialMode: false };
    current.actualQty += Number(row.actualQty || 0);
    current.serialMode = current.serialMode || Boolean(row.serialName);
    actualByStockKey.set(key, current);
  });
  actualByStockKey.forEach((entry) => {
    const target = stockRow(entry.row.product.id, entry.row.warehouseCode);
    target.warehouseName = entry.row.warehouseName;
    target.qty = entry.serialMode ? entry.actualQty : entry.row.actualQty;
  });
  state.inventoryDocs.unshift(doc);
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  audit(`Проведено інвентаризацію ${doc.id} і оновлено склад: різниця ${diffLabel(doc.totalDiff)}, ${formatMoney(doc.totalAmountDiff)}`);
  saveState();
  render();
}

function openEmployeeEdit(employeeId) {
  if (!canEditEmployeeFields()) return alert("Немає дозволу змінювати поля працівників.");
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) return alert("Працівника не знайдено.");
  state.employeeEdit = { open: true, employeeId: employee.id };
  saveState({ server: false });
  render();
}

function closeEmployeeEdit() {
  state.employeeEdit = { open: false, employeeId: "" };
  saveState({ server: false });
  render();
}

function createEmployee(form) {
  if (!canDo("employee_manage")) return alert("Немає дозволу керувати працівниками.");
  const data = Object.fromEntries(new FormData(form).entries());
  const name = String(data.name || "").trim();
  if (!name) return alert("Вкажіть ПІБ працівника.");
  const login = String(data.login || "").trim();
  if (login && state.employees.some((employee) => employee.login.toLowerCase() === login.toLowerCase())) {
    return alert("Працівник з таким логіном вже існує.");
  }
  const employee = normalizeEmployee({
    id: `e-${Date.now()}`,
    code: `EMP-${String(state.employees.length + 1).padStart(3, "0")}`,
    name,
    role: data.role || "seller",
    phone: String(data.phone || "").trim(),
    email: String(data.email || "").trim(),
    login,
    pin: String(data.pin || "").trim(),
    status: data.status || "active",
    store: String(data.store || "B2C магазин").trim(),
    schedule: String(data.schedule || "").trim(),
    hireDate: data.hireDate || today(),
    note: String(data.note || "").trim(),
    createdAt: nowIso()
  });
  state.employees.push(employee);
  if (employee.status === "active" && employee.role === "cashier") state.selectedCashierId = employee.id;
  audit(`Створено працівника ${employee.name}: ${roleLabel(employee.role)}`);
  saveState();
  render();
}

function saveEmployeeEdit(form) {
  if (!canEditEmployeeFields()) return alert("Немає дозволу змінювати поля працівників.");
  const data = Object.fromEntries(new FormData(form).entries());
  const employee = state.employees.find((item) => item.id === data.employeeId);
  if (!employee) return alert("Працівника не знайдено.");
  const code = String(data.code || "").trim();
  const name = String(data.name || "").trim();
  const login = String(data.login || "").trim();
  if (!code) return alert("Вкажіть код працівника.");
  if (!name) return alert("Вкажіть ПІБ працівника.");
  if (login && state.employees.some((item) => item.id !== employee.id && item.login.toLowerCase() === login.toLowerCase())) {
    return alert("Працівник з таким логіном вже існує.");
  }
  const role = EMPLOYEE_ROLES[data.role] ? data.role : employee.role;
  const status = EMPLOYEE_STATUSES[data.status] ? data.status : employee.status;
  Object.assign(employee, {
    code,
    name,
    role,
    phone: String(data.phone || "").trim(),
    email: String(data.email || "").trim(),
    login,
    pin: String(data.pin || "").trim(),
    status,
    store: String(data.store || "B2C магазин").trim(),
    schedule: String(data.schedule || "").trim(),
    hireDate: data.hireDate || today(),
    note: String(data.note || "").trim()
  });
  if (employee.status !== "active") delete state.employeeSessions[employee.id];
  if (employee.status !== "active" && state.selectedCashierId === employee.id) {
    state.selectedCashierId = activeEmployees()[0]?.id || "";
  }
  if (employee.status === "active" && !state.selectedCashierId) {
    state.selectedCashierId = employee.id;
  }
  state.employeeEdit = { open: false, employeeId: "" };
  audit(`Оновлено картку працівника ${employee.name}: всі поля`);
  saveState();
  render();
}

function toggleEmployeeStatus(employeeId) {
  if (!canDo("employee_manage")) return alert("Немає дозволу керувати працівниками.");
  const employee = employeeById(employeeId);
  employee.status = employee.status === "active" ? "inactive" : "active";
  if (employee.status !== "active") delete state.employeeSessions[employee.id];
  if (employee.status !== "active" && state.selectedCashierId === employee.id) {
    state.selectedCashierId = activeEmployees()[0]?.id || "";
  }
  if (employee.status === "active" && !state.selectedCashierId) {
    state.selectedCashierId = employee.id;
  }
  audit(`Змінено статус працівника ${employee.name}: ${employeeStatusLabel(employee.status)}`);
  saveState();
  render();
}

function changeEmployeeRole(employeeId, role) {
  if (!canEditEmployeeFields()) return alert("Немає дозволу змінювати поля працівників.");
  const employee = employeeById(employeeId);
  if (!EMPLOYEE_ROLES[role]) return;
  employee.role = role;
  audit(`Змінено роль працівника ${employee.name}: ${roleLabel(role)}`);
  saveState();
  render();
}

function toggleRolePermission(type, roleId, permissionId, checked) {
  if (!canDo("employee_manage")) return alert("Немає дозволу керувати ролями.");
  if (!EMPLOYEE_ROLES[roleId] || !["blocks", "actions"].includes(type)) return;
  const allowedIds = type === "blocks" ? ROLE_BLOCKS.map((item) => item.id) : ROLE_ACTIONS.map((item) => item.id);
  if (!allowedIds.includes(permissionId)) return;
  const role = state.rolePermissions[roleId] || { blocks: [], actions: [] };
  const values = new Set(role[type] || []);
  if (checked) values.add(permissionId);
  if (!checked) values.delete(permissionId);
  role[type] = [...values];
  state.rolePermissions[roleId] = role;
  audit(`Оновлено права ролі ${roleLabel(roleId)}: ${type}/${permissionId} = ${checked ? "так" : "ні"}`);
  saveState();
  render();
}

function openEmployeeLogin() {
  if (currentEmployee()) sessionNotice = "";
  loginDialog = {
    open: true,
    employeeId: currentEmployee()?.id || activeEmployees()[0]?.id || ""
  };
  render();
}

function closeEmployeeLogin() {
  if (!currentEmployee()) return;
  loginDialog = { open: false, employeeId: "" };
  render();
}

function cacheStateLocally() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Keep the in-memory state when browser storage is blocked.
  }
}

function applyServerStatePayload(payload, clientUi = clientLocalStateSnapshot()) {
  if (!payload) return;
  if (payload.state) {
    state = mergeServerStateWithClientUi(payload.state, clientUi);
    rememberSharedStateFingerprint(state);
    cacheStateLocally();
  }
  markServerOnline({
    revision: payload.stateRevision ?? payload.revision,
    savedAt: payload.savedAt,
    loadedAt: nowIso()
  });
}

function forceLocalSessionLogout(message, employeeId = sessionEmployeeId) {
  const employee = state.employees.find((item) => item.id === employeeId);
  storeSessionEmployeeId("");
  state.activeEmployeeId = "";
  loginDialog = { open: true, employeeId: employee?.id || activeEmployees()[0]?.id || "" };
  sessionNotice = message || "Сеанс завершено. Увійдіть повторно.";
  cacheStateLocally();
  syncSessionHeartbeatTimer();
}

async function heartbeatEmployeeSession(renderAfter = false) {
  if (!serverModeEnabled() || !sessionEmployeeId || !sessionToken) return;
  const employeeId = sessionEmployeeId;
  try {
    const payload = await fetchJson("/api/auth/heartbeat", {
      method: "POST",
      body: JSON.stringify({
        employeeId,
        deviceId: browserDeviceId,
        sessionToken,
        deviceLabel: currentDeviceLabel()
      })
    });
    applyServerStatePayload(payload);
    applySessionRulesAfterServerMerge();
    cacheStateLocally();
    if (renderAfter) render();
  } catch (error) {
    if (error.payload?.state) applyServerStatePayload(error.payload);
    if ([401, 403, 409].includes(Number(error.status || 0))) {
      forceLocalSessionLogout(error.message || "Сеанс працівника відкрито на іншому комп'ютері.", employeeId);
      render();
      return;
    }
    markServerOffline(error);
    if (renderAfter) render();
  }
}

function syncSessionHeartbeatTimer() {
  const shouldRun = serverModeEnabled() && Boolean(sessionEmployeeId && sessionToken);
  if (!shouldRun && sessionHeartbeatTimer) {
    window.clearInterval(sessionHeartbeatTimer);
    sessionHeartbeatTimer = null;
    return;
  }
  if (shouldRun && !sessionHeartbeatTimer) {
    sessionHeartbeatTimer = window.setInterval(() => heartbeatEmployeeSession(true), SESSION_HEARTBEAT_MS);
  }
}

async function loginEmployee(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const employee = activeEmployees().find((item) => item.id === data.employeeId);
  if (!employee) return alert("Працівника для входу не знайдено або він не активний.");
  const enteredPin = String(data.pin || "").trim();
  const requiredPin = String(employee.pin || "").trim();
  if (serverModeEnabled()) {
    const token = createOpaqueId("session");
    try {
      const payload = await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          employeeId: employee.id,
          pin: enteredPin,
          deviceId: browserDeviceId,
          deviceLabel: currentDeviceLabel(),
          sessionToken: token,
          build: APP_BUILD,
          appVersion: APP_VERSION,
          releasedAt: APP_RELEASED_AT
        })
      });
      storeSessionEmployeeId(employee.id, payload.session?.sessionToken || token);
      applyServerStatePayload(payload);
      const serverEmployee = state.employees.find((item) => item.id === employee.id) || employee;
      state.activeEmployeeId = serverEmployee.id;
      loginDialog = { open: false, employeeId: "" };
      sessionNotice = payload.replacedSession
        ? `Попередній сеанс ${serverEmployee.name} на іншому комп'ютері завершено сервером.`
        : "";
      if (!canOpenBlock(state.currentView)) state.currentView = firstAllowedView();
      cacheStateLocally();
      syncSessionHeartbeatTimer();
      render();
      return;
    } catch (error) {
      if (![401, 403].includes(Number(error.status || 0))) markServerOffline(error);
      return alert(error.message || "Не вдалося виконати вхід працівника.");
    }
  }
  if (requiredPin && enteredPin !== requiredPin) {
    audit(`Невдала спроба входу для ${employee.name}: невірний пароль/PIN`, "auth");
    saveState({ server: false });
    render();
    return alert("Невірний пароль/PIN працівника.");
  }
  const previous = currentEmployee();
  const previousSession = employeeSessionRecord(employee.id);
  const displacedOtherComputer = Boolean(previousSession?.deviceId && previousSession.deviceId !== browserDeviceId);
  registerEmployeeSession(employee);
  state.activeEmployeeId = employee.id;
  loginDialog = { open: false, employeeId: "" };
  sessionNotice = displacedOtherComputer
    ? `Попередній сеанс ${employee.name} на іншому комп'ютері буде завершено при наступному оновленні.`
    : "";
  if (!canOpenBlock(state.currentView)) state.currentView = firstAllowedView();
  audit(displacedOtherComputer
    ? `Вхід працівника у B2C: ${employee.name} (${roleLabel(employee.role)}); попередній сеанс на іншому комп'ютері витіснено`
    : previous?.id === employee.id
    ? `Працівник повторно увійшов у B2C: ${employee.name} (${roleLabel(employee.role)})`
    : `Вхід працівника у B2C: ${employee.name} (${roleLabel(employee.role)})`,
    employee.name);
  saveState({ server: false });
  render();
}

async function logoutEmployee() {
  const employee = currentEmployee();
  const employeeId = sessionEmployeeId;
  const token = sessionToken;
  if (!employee && !employeeId) return openEmployeeLogin();
  let payload = null;
  if (serverModeEnabled() && employeeId && token) {
    try {
      payload = await fetchJson("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({
          employeeId,
          deviceId: browserDeviceId,
          sessionToken: token
        })
      });
    } catch (error) {
      if (![401, 403, 409].includes(Number(error.status || 0))) markServerOffline(error);
    }
  }
  const useServerMode = serverModeEnabled();
  if (employee && !useServerMode) {
    audit(`Вихід працівника з B2C: ${employee.name} (${roleLabel(employee.role)})`, employee.name);
  }
  if (!useServerMode && employee) clearEmployeeSession(employee.id);
  storeSessionEmployeeId("");
  if (payload?.state) applyServerStatePayload(payload);
  state.activeEmployeeId = "";
  loginDialog = { open: true, employeeId: employee?.id || activeEmployees()[0]?.id || "" };
  sessionNotice = "";
  cacheStateLocally();
  syncSessionHeartbeatTimer();
  render();
}

function setActiveEmployee(employeeId) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) return;
  loginDialog = { open: true, employeeId: employee.id };
  render();
}

function selectCashier(employeeId) {
  if (!canDo("cash_open")) return alert("Немає дозволу вибирати відповідального за касу.");
  const employee = employeeById(employeeId);
  if (employee.status !== "active") return alert("Для касової зміни можна вибрати тільки активного працівника.");
  state.selectedCashierId = employee.id;
  state.currentView = "pos";
  audit(`Працівника ${employee.name} вибрано відповідальним за касову зміну`);
  saveState();
  render();
}

function openCashShift(form) {
  if (!canDo("cash_open")) return alert("Немає дозволу відкривати касову зміну.");
  const data = Object.fromEntries(new FormData(form).entries());
  if (openShift()) return alert("Вже є відкрита касова зміна.");
  const cashier = employeeById(data.cashierId || state.selectedCashierId);
  const shift = {
    id: nextId("SHIFT", state.cashShifts),
    date: today(),
    cashierId: cashier.id,
    cashier: cashier.name,
    cashierRole: roleLabel(cashier.role),
    opened: true,
    openedAt: nowIso(),
    closedAt: "",
    openingCash: Number(data.openingCash || 0),
    cashSales: 0,
    cardSales: 0,
    bankSales: 0,
    cashReturns: 0,
    cardReturns: 0,
    bankReturns: 0,
    actualCash: 0
  };
  state.cashShifts.unshift(shift);
  audit(`Відкрито касову зміну ${shift.id}`);
  saveState();
  render();
}

function closeCashShift(form) {
  if (!canDo("cash_close")) return alert("Немає дозволу закривати касову зміну.");
  const shift = openShift();
  if (!shift) return;
  const data = Object.fromEntries(new FormData(form).entries());
  shift.actualCash = Number(data.actualCash || 0);
  shift.opened = false;
  shift.closedAt = nowIso();
  audit(`Закрито касову зміну ${shift.id}, факт ${formatMoney(shift.actualCash)}`);
  saveState();
  render();
}

function updateCheckoutField(target) {
  if (target.dataset.productLookup !== undefined) {
    state.checkout.search = target.value;
    saveState();
    queueLiveProductLookup(target.value);
    return;
  }
  if (target.dataset.customerLookup !== undefined) {
    const exactCustomer = findExactCustomerByLookup(target.value);
    if (exactCustomer) {
      const selected = rememberLiveCustomer(exactCustomer);
      const changed = state.checkout.customerId !== selected.id;
      state.checkout.customerId = selected.id;
      state.checkout.customerSearch = customerLookupValue(selected);
      window.clearTimeout(liveCustomerLookup.timer);
      liveCustomerLookup.query = state.checkout.customerSearch;
      liveCustomerLookup.loading = false;
      liveCustomerLookup.error = "";
      if (changed) audit(`Клієнта ${selected.name} вибрано для продажу`);
      saveState();
      render();
      return;
    }
    state.checkout.customerSearch = target.value;
    saveState();
    queueLiveCustomerLookup(target.value);
    return;
  }
  if (target.dataset.checkoutField !== undefined) {
    if (target.name === "priceType") {
      state.checkout.priceType = normalizePriceTypeLabel(target.value);
    } else if (target.name === "priceCurrency") {
      state.checkout.priceCurrency = normalizeCurrencyCode(target.value || DEFAULT_CHECKOUT_PRICE_CURRENCY);
    } else {
      state.checkout[target.name] = target.value;
    }
    saveState();
  }
}

function updateCartField(target, options = {}) {
  const commitEmpty = options.commitEmpty !== false;
  const saveAfter = options.saveAfter !== false;
  const renderAfter = options.renderAfter !== false;
  let changed = false;
  if (target.dataset.cartQty !== undefined) {
    const index = Number(target.dataset.cartQty);
    const line = state.checkout.lines[index];
    if (!line) return;
    const product = productById(line?.productId);
    const rawValue = String(target.value ?? "").trim();
    if (!rawValue && !commitEmpty) return false;
    const parsedQty = Number(rawValue || 1);
    if (!Number.isFinite(parsedQty)) return false;
    const nextQty = isWeaponProduct(product) ? 1 : Math.max(1, parsedQty);
    if (Number(line.qty || 0) !== nextQty) {
      line.qty = nextQty;
      changed = true;
    }
  }
  if (target.dataset.cartDiscount !== undefined) {
    const index = Number(target.dataset.cartDiscount);
    if (!state.checkout.lines[index]) return;
    const rawValue = String(target.value ?? "").trim();
    if (!rawValue && !commitEmpty) return false;
    const parsedDiscount = Number(rawValue || 0);
    if (!Number.isFinite(parsedDiscount)) return false;
    const nextDiscount = discountPercentValue(parsedDiscount);
    if (Number(state.checkout.lines[index].discount || 0) !== nextDiscount) {
      state.checkout.lines[index].discount = nextDiscount;
      changed = true;
    }
  }
  if (changed && saveAfter) saveState();
  if (changed && renderAfter) render();
  return changed;
}

function updateCartTotalsInPlace() {
  const lines = cartLines();
  lines.forEach((line, index) => {
    const lineTotalTarget = document.querySelector(`[data-cart-line-total="${index}"]`);
    if (lineTotalTarget) lineTotalTarget.textContent = formatMoney(lineTotal(line));
  });
  const subtotal = receiptSubtotal(lines);
  const loyalty = loyaltyDiscount(lines);
  const total = checkoutTotal(lines);
  const subtotalTarget = document.querySelector("[data-cart-subtotal]");
  const loyaltyTarget = document.querySelector("[data-cart-loyalty]");
  const totalTarget = document.querySelector("[data-cart-total]");
  if (subtotalTarget) subtotalTarget.textContent = formatMoney(subtotal);
  if (loyaltyTarget) loyaltyTarget.textContent = formatMoney(loyalty);
  if (totalTarget) totalTarget.textContent = formatMoney(total);
}

function syncCartInputValue(target) {
  if (target.dataset.cartQty !== undefined) {
    const line = state.checkout.lines[Number(target.dataset.cartQty)];
    if (line) target.value = String(Math.max(1, Number(line.qty || 1)));
  }
  if (target.dataset.cartDiscount !== undefined) {
    const line = state.checkout.lines[Number(target.dataset.cartDiscount)];
    if (line) target.value = String(discountPercentValue(line.discount));
  }
}

function updateCartFieldAndTotals(target, options = {}) {
  const changed = updateCartField(target, { ...options, renderAfter: false });
  if (options.commitEmpty !== false) syncCartInputValue(target);
  updateCartTotalsInPlace();
  return changed;
}

function commitCartInlineEdits() {
  let changed = false;
  document.querySelectorAll("[data-cart-qty], [data-cart-discount]").forEach((target) => {
    changed = updateCartField(target, { commitEmpty: true, saveAfter: false, renderAfter: false }) || changed;
  });
  if (changed) saveState();
  return changed;
}

function updateCartSerial(index, serialName) {
  const line = state.checkout.lines[index];
  if (!line) return;
  const product = productById(line.productId);
  if (!isWeaponProduct(product)) return;
  const selected = checkoutLineSerialOptions(line).find((item) => item.serialName === serialName);
  line.serialName = selected?.serialName || "";
  line.serialNumber = selected?.serialNumber || selected?.serialName || "";
  line.qty = 1;
  saveState({ server: false });
  render();
}

function checkoutLineIndexByToken(token) {
  const raw = String(token ?? "");
  if (/^\d+$/.test(raw) && state.checkout.lines[Number(raw)]) return Number(raw);
  return state.checkout.lines.findIndex((line) => line.lineId === raw);
}

function findCheckoutPriceOption(line, optionId) {
  const rawId = String(optionId || "");
  if (!rawId) return null;
  const options = normalizeCheckoutLine(line).priceOptions;
  return options.find((item) => item.id === rawId)
    || options.find((item) => normalizeScanText(priceOptionLabel(item)) === normalizeScanText(rawId))
    || null;
}

async function updateCartPriceOption(lineToken, optionId) {
  if (!canDo("price_select")) return alert("Немає дозволу вибирати тип ціни.");
  const index = checkoutLineIndexByToken(lineToken);
  const line = state.checkout.lines[index];
  if (!line) return;
  if (line.priceOptionId === optionId && Number(line.price || 0) > 0) return;
  const selected = findCheckoutPriceOption(line, optionId);
  if (!selected) {
    Object.assign(line, {
      price: 0,
      priceCurrency: BASE_CURRENCY,
      sourcePrice: 0,
      sourceCurrency: BASE_CURRENCY,
      exchangeRate: 1,
      exchangeRateDate: "",
      priceSource: "price-selection-required",
      priceOptionId: "",
      selectedPriceType: state.checkout.priceType || DEFAULT_CHECKOUT_PRICE_TYPE,
      selectedPriceCurrency: state.checkout.priceCurrency || DEFAULT_CHECKOUT_PRICE_CURRENCY,
      priceWarning: "виберіть прикріплену ціну"
    });
    saveState();
    render();
    return;
  }
  const priceInfo = await priceInfoFromPriceOption(selected);
  if (!priceInfo.ok) {
    line.priceOptionId = "";
    line.priceWarning = priceInfo.error || "ціну не вдалося перерахувати";
    saveState();
    render();
    alert(line.priceWarning);
    return;
  }
  Object.assign(line, {
    price: priceInfo.price,
    priceCurrency: priceInfo.priceCurrency,
    sourcePrice: priceInfo.sourcePrice,
    sourceCurrency: priceInfo.sourceCurrency,
    exchangeRate: priceInfo.exchangeRate,
    exchangeRateDate: priceInfo.exchangeRateDate,
    priceSource: priceInfo.priceSource,
    priceOptionId: priceInfo.priceOptionId,
    selectedPriceType: priceInfo.selectedPriceType,
    selectedPriceCurrency: priceInfo.selectedPriceCurrency,
    priceWarning: priceInfo.priceWarning || ""
  });
  audit(`Змінено ціну товару ${productById(line.productId).sku}: ${priceOptionLabel(selected)}`);
  saveState({ server: false });
  render();
}

function render() {
  applySidebarState();
  renderAppReleaseTime();
  if (!canOpenBlock(state.currentView)) {
    const allowedView = firstAllowedView();
    if (canOpenBlock(allowedView)) {
      state.currentView = allowedView;
      saveState();
    }
  }
  renderTopStatus();
  renderNav();
  const views = {
    dashboard: renderPos,
    pos: renderPos,
    checkout: renderPos,
    receipts: renderPos,
    returns: renderReturns,
    catalog: renderCatalog,
    customers: renderCustomers,
    stock: renderStock,
    cash: renderPos,
    exchange: renderExchange,
    settings: renderSettings,
    reports: renderReports,
    employees: renderEmployees,
    log: renderLog
  };
  const pageHtml = canOpenBlock(state.currentView)
    ? (views[state.currentView] || renderPos)()
    : renderNoAccess();
  document.getElementById("app").innerHTML = `${pageHtml}${renderSalePaymentConfirm()}${renderReturnRefundConfirm()}${renderDrilldownModal()}${renderDocumentEditModal()}${renderEmployeeEditModal()}${renderEmployeeLoginModal()}`;
  syncSessionHeartbeatTimer();
}

function renderNoAccess() {
  setTitle("Немає доступу");
  return `
    <section class="panel">
      <h2>Немає доступних блоків</h2>
      <p class="muted">Потрібен вхід працівника з активною роллю.</p>
      <button class="primary" type="button" data-open-employee-login>Увійти</button>
    </section>
  `;
}

document.addEventListener("click", (event) => {
  const sidebarToggleButton = event.target.closest("[data-toggle-sidebar]");
  if (sidebarToggleButton) return toggleSidebar();
  const openLoginButton = event.target.closest("[data-open-employee-login]");
  if (openLoginButton) return openEmployeeLogin();
  const closeLoginButton = event.target.closest("[data-close-employee-login]");
  if (closeLoginButton) return closeEmployeeLogin();
  const logoutEmployeeButton = event.target.closest("[data-logout-employee]");
  if (logoutEmployeeButton) return logoutEmployee();
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    const nextView = normalizeView(viewButton.dataset.view);
    if (!canOpenBlock(nextView)) return;
    state.currentView = nextView;
    saveState();
    render();
    return;
  }
  const addButton = event.target.closest("[data-add-cart]");
  if (addButton) return addCartProduct(addButton.dataset.addCart);
  const addSelectedButton = event.target.closest("[data-add-selected-product]");
  if (addSelectedButton) return addSelectedCheckoutProduct();
  const removeButton = event.target.closest("[data-remove-cart]");
  if (removeButton) return removeCartLine(Number(removeButton.dataset.removeCart));
  const drilldownButton = event.target.closest("[data-drilldown]");
  if (drilldownButton) return openDrilldown(drilldownButton.dataset.drilldown);
  const listSortButton = event.target.closest("[data-list-sort]");
  if (listSortButton) return setDocumentListSort(listSortButton.dataset.listSort, listSortButton.dataset.sortField);
  const listToggleButton = event.target.closest("[data-toggle-list]");
  if (listToggleButton) return toggleDocumentList(listToggleButton.dataset.toggleList);
  const closeDrilldownButton = event.target.closest("[data-close-drilldown]");
  if (closeDrilldownButton) return closeDrilldown();
  const editDocumentButton = event.target.closest("[data-edit-document]");
  if (editDocumentButton) return editDocumentTarget(editDocumentButton.dataset.editDocument);
  const closeDocumentEditButton = event.target.closest("[data-close-document-edit]");
  if (closeDocumentEditButton) return closeDocumentEdit();
  const closeEmployeeEditButton = event.target.closest("[data-close-employee-edit]");
  if (closeEmployeeEditButton) return closeEmployeeEdit();
  const openDocumentButton = event.target.closest("[data-open-document]");
  if (openDocumentButton) {
    const interactive = event.target.closest("button, a, input, select, textarea");
    if (!interactive || interactive === openDocumentButton) return openDocumentTarget(openDocumentButton.dataset.openDocument);
  }
  const editEmployeeButton = event.target.closest("[data-edit-employee]");
  if (editEmployeeButton) {
    const interactive = event.target.closest("button, a, input, select, textarea");
    if (!interactive || interactive === editEmployeeButton) return openEmployeeEdit(editEmployeeButton.dataset.editEmployee);
  }
  const returnButton = event.target.closest("[data-return-receipt]");
  if (returnButton) return createReturn(returnButton.dataset.returnReceipt);
  const printButton = event.target.closest("[data-print-receipt]");
  if (printButton) {
    state.checkout.printReceiptId = printButton.dataset.printReceipt;
    saveState();
    render();
    return;
  }
  const inventoryPrintButton = event.target.closest("[data-print-inventory]");
  if (inventoryPrintButton) return printInventorySheet();
  const inventoryResetButton = event.target.closest("[data-reset-inventory]");
  if (inventoryResetButton) return resetInventoryDraft();
  const addInventoryProductButton = event.target.closest("[data-add-inventory-product]");
  if (addInventoryProductButton) return addInventoryProductFromLookup();
  const addAllStockInventoryButton = event.target.closest("[data-add-all-stock-inventory]");
  if (addAllStockInventoryButton) return addAllInventoryStockProducts();
  const refreshInventoryWarehousesButton = event.target.closest("[data-refresh-inventory-warehouses]");
  if (refreshInventoryWarehousesButton) return loadLiveTable("warehouses", { limit: 100, offset: 0 });
  const removeInventoryProductButton = event.target.closest("[data-remove-inventory-product]");
  if (removeInventoryProductButton) return removeInventoryProduct(removeInventoryProductButton.dataset.removeInventoryProduct);
  const resortRemoveButton = event.target.closest("[data-remove-resort]");
  if (resortRemoveButton) return removeInventoryResort(Number(resortRemoveButton.dataset.removeResort));
  const selectCashierButton = event.target.closest("[data-select-cashier]");
  if (selectCashierButton) return selectCashier(selectCashierButton.dataset.selectCashier);
  const toggleEmployeeButton = event.target.closest("[data-toggle-employee]");
  if (toggleEmployeeButton) return toggleEmployeeStatus(toggleEmployeeButton.dataset.toggleEmployee);
  const selectCustomerButton = event.target.closest("[data-select-customer]");
  if (selectCustomerButton) return selectCustomer(selectCustomerButton.dataset.selectCustomer);
  const selectLiveCustomerButton = event.target.closest("[data-select-live-customer]");
  if (selectLiveCustomerButton) return selectLiveCustomer(selectLiveCustomerButton.dataset.selectLiveCustomer);
  const cancelSaleConfirmButton = event.target.closest("[data-cancel-sale-confirm]");
  if (cancelSaleConfirmButton) return cancelSalePaymentConfirm();
  const cancelReturnConfirmButton = event.target.closest("[data-cancel-return-confirm]");
  if (cancelReturnConfirmButton) return cancelReturnRefundConfirm();
  const runExchangeAutomationButton = event.target.closest("[data-run-exchange-automation]");
  if (runExchangeAutomationButton) return runExchangeAutomationNow();
  const syncStateNowButton = event.target.closest("[data-sync-state-now]");
  if (syncStateNowButton) return flushServerState(true);
  const loadServerStateButton = event.target.closest("[data-load-server-state]");
  if (loadServerStateButton) return refreshServerState(true);
  const liveRefreshButton = event.target.closest("[data-live-refresh]");
  if (liveRefreshButton) return refreshLiveTable(liveRefreshButton.dataset.liveRefresh);
  const livePageButton = event.target.closest("[data-live-table-page]");
  if (livePageButton) return pageLiveTable(livePageButton.dataset.liveTablePage, Number(livePageButton.dataset.liveDirection || 0));
  const liveStockSortButton = event.target.closest("[data-live-stock-sort]");
  if (liveStockSortButton) return sortLiveStockTable(liveStockSortButton.dataset.liveStockSort, liveStockSortButton.dataset.liveStockDirection);
  const stockListToggleButton = event.target.closest("[data-toggle-stock-list]");
  if (stockListToggleButton) return toggleStockList();
  const stockSerialRefreshButton = event.target.closest("[data-stock-serial-refresh]");
  if (stockSerialRefreshButton) return loadStockSerialRows(0);
  const stockSerialPageButton = event.target.closest("[data-stock-serial-page]");
  if (stockSerialPageButton) return pageStockSerialRows(Number(stockSerialPageButton.dataset.stockSerialPage || 0));
  if (event.target.id === "reset-local-state") {
    state = clone(seedState);
    audit("Скинуто локальний стан B2C. Товари, клієнти, залишки й чеки очищені до нового SQL-імпорту.", "manager");
    saveState({ server: false });
    render();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.dataset.cartQty !== undefined || event.target.dataset.cartDiscount !== undefined) {
    updateCartFieldAndTotals(event.target, { commitEmpty: false, saveAfter: false });
    return;
  }
  if (event.target.dataset.productLookup !== undefined || event.target.dataset.customerLookup !== undefined) {
    updateCheckoutField(event.target);
  }
  if (event.target.dataset.inventorySearch !== undefined) {
    state.inventory.search = event.target.value;
    saveState({ server: false });
    render();
  }
  if (event.target.dataset.inventoryAddSearch !== undefined) {
    state.inventory.addSearch = event.target.value;
    saveState({ server: false });
  }
  if (event.target.dataset.listFilter !== undefined) {
    setDocumentListFilter(event.target.dataset.listFilter, event.target.dataset.filterField, event.target.value);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.employeeRole !== undefined) changeEmployeeRole(event.target.dataset.employeeRole, event.target.value);
  if (event.target.dataset.rolePermission !== undefined) {
    toggleRolePermission(event.target.dataset.rolePermission, event.target.dataset.roleId, event.target.dataset.permissionId, event.target.checked);
  }
  if (event.target.dataset.saleConfirmPayment !== undefined) updateSaleConfirmPayment(event.target.value);
  if (event.target.dataset.returnConfirmRefund !== undefined) updateReturnConfirmRefund(event.target.value);
  if (event.target.dataset.cartSerial !== undefined) updateCartSerial(Number(event.target.dataset.cartSerial), event.target.value);
  if (event.target.dataset.cartQty !== undefined || event.target.dataset.cartDiscount !== undefined) updateCartFieldAndTotals(event.target, { commitEmpty: true, saveAfter: true });
  if (event.target.dataset.cartPriceOption !== undefined) updateCartPriceOption(event.target.dataset.cartPriceOption, event.target.value);
  if (event.target.dataset.checkoutField !== undefined) updateCheckoutField(event.target);
  if (event.target.dataset.customerLookup !== undefined) selectCustomerFromLookup(event.target.value);
  if (event.target.dataset.checkoutScan !== undefined && event.target.value.trim()) scanCheckoutProduct(event.target.value);
  if (event.target.dataset.stockSerialProduct !== undefined) {
    const product = productById(event.target.value);
    const productId = product?.id && isWeaponProduct(product) ? product.id : "";
    resetStockSerialRows(productId);
    saveState({ server: false });
    render();
    if (productId) loadStockSerialRows(0);
  }
  if (event.target.dataset.inventoryActual !== undefined) {
    setInventoryActual(event.target.dataset.inventoryActual, event.target.value);
    render();
  }
  if (event.target.dataset.inventoryWarehouses !== undefined) {
    const selected = Array.from(event.target.selectedOptions || []).map((item) => item.value);
    state.inventory.warehouseCodes = normalizeWarehouseCodes(selected);
    saveState({ server: false });
    render();
  }
  if (event.target.dataset.inventoryScan !== undefined && event.target.value.trim()) scanInventoryProduct(event.target.value);
});

document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.dataset.openDocument !== undefined) {
    event.preventDefault();
    openDocumentTarget(event.target.dataset.openDocument);
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.dataset.editEmployee !== undefined) {
    event.preventDefault();
    openEmployeeEdit(event.target.dataset.editEmployee);
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.dataset.drilldown !== undefined) {
    event.preventDefault();
    openDrilldown(event.target.dataset.drilldown);
    return;
  }
  if (event.key === "Enter" && (event.target.dataset.cartQty !== undefined || event.target.dataset.cartDiscount !== undefined)) {
    event.preventDefault();
    updateCartFieldAndTotals(event.target, { commitEmpty: true, saveAfter: true });
    event.target.blur();
    return;
  }
  if (event.key !== "Enter") return;
  if (event.target.dataset.checkoutScan !== undefined) {
    event.preventDefault();
    if (event.target.value.trim()) scanCheckoutProduct(event.target.value);
  }
  if (event.target.dataset.productLookup !== undefined) {
    event.preventDefault();
    addSelectedCheckoutProduct(event.target.value);
  }
  if (event.target.dataset.customerLookup !== undefined) {
    event.preventDefault();
    selectCustomerFromLookup(event.target.value);
  }
  if (event.target.dataset.inventoryScan !== undefined) {
    event.preventDefault();
    if (event.target.value.trim()) scanInventoryProduct(event.target.value);
  }
  if (event.target.dataset.inventoryAddSearch !== undefined) {
    event.preventDefault();
    addInventoryProductFromLookup(event.target.value);
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  if (form.dataset.action === "employee-login") loginEmployee(form);
  if (form.dataset.action === "create-receipt") {
    commitCartInlineEdits();
    createReceipt(form);
  }
  if (form.dataset.action === "confirm-sale-payment") confirmSalePayment(form);
  if (form.dataset.action === "confirm-return-refund") confirmReturnRefund(form);
  if (form.dataset.action === "save-document-edit") saveDocumentEdit(form);
  if (form.dataset.action === "exchange-full-import") syncAllExchangeFromSql();
  if (form.dataset.action === "exchange-export-sales") exportSalesToSql();
  if (form.dataset.action === "exchange-export-inventory") exportInventoryToSql();
  if (form.dataset.action === "exchange-export-customers") exportCustomersToSql();
  if (form.dataset.action === "save-exchange-automation") updateExchangeAutomation(form);
  if (form.dataset.action === "save-system-settings") updateSystemSettings(form);
  if (form.dataset.action === "sync-sql-products") syncProductsFromSql();
  if (form.dataset.action === "sync-sql-counterparties") syncCounterpartiesFromSql();
  if (form.dataset.action === "create-customer") createCustomer(form);
  if (form.dataset.action === "create-return") createPartialReturn(form);
  if (form.dataset.action === "sync-sql-stock-receipts") syncStockReceiptsFromSql();
  if (form.dataset.action === "create-inventory-resort") createInventoryResort(form);
  if (form.dataset.action === "post-inventory") postInventory();
  if (form.dataset.action === "create-employee") createEmployee(form);
  if (form.dataset.action === "save-employee-edit") saveEmployeeEdit(form);
  if (form.dataset.action === "open-shift") openCashShift(form);
  if (form.dataset.action === "close-shift") closeCashShift(form);
  if (form.dataset.action === "live-table-search") searchLiveTable(form);
});

function renderAppReleaseTime() {
  const target = document.getElementById("app-release-time");
  if (!target) return;
  target.textContent = APP_RELEASED_AT;
}

applySidebarState();
renderAppReleaseTime();
render();
bootstrapServerState();
window.setInterval(() => {
  const seconds = Number(state.systemSettings?.autoRefreshSeconds || DEFAULT_SYSTEM_SETTINGS.autoRefreshSeconds);
  if (serverModeEnabled() && seconds > 0) refreshServerState(false);
}, 1000 * Math.max(5, Number(state.systemSettings?.autoRefreshSeconds || DEFAULT_SYSTEM_SETTINGS.autoRefreshSeconds)));
