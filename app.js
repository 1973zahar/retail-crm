"use strict";

const APP_VERSION = "2026.06.08.1";
const APP_BUILD = "20260608-b2c-live-clients-directories";
const APP_RELEASED_AT = "2026-06-08 12:06:22 +03:00";
const STORAGE_KEY = "retail-crm-b2c-v12";
const SESSION_KEY = "retail-crm-b2c-session-v1";
const SIDEBAR_COLLAPSED_KEY = "retail-crm-b2c-sidebar-collapsed-v1";
const ROLE_PERMISSION_SCHEMA = "20260606-server-settings";
const SCHEMA_DEFAULT_BLOCKS = ["settings"];
const SCHEMA_DEFAULT_ACTIONS = ["customer_create", "drilldown_view", "document_edit", "document_list_view", "document_list_sort", "document_list_collapse", "exchange_view", "system_settings"];

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
const LIVE_PRODUCT_LOOKUP_LIMIT = 20;
const LIVE_CUSTOMER_LOOKUP_LIMIT = 20;
const LIVE_STOCK_LOOKUP_LIMIT = 20;
const LIVE_SERIAL_LOOKUP_LIMIT = 100;
const LIVE_TABLE_LIMIT_OPTIONS = [20, 50, 100];
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
  warehouses: {
    endpoint: "/api/live/warehouses",
    defaultLimit: 20,
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
  lastLoadedAt: "",
  lastSavedAt: "",
  error: "",
  timer: null
};
const liveProductCache = new Map();
const liveTableLoadQueue = new Set();
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
  { id: "dashboard", label: "Панель" },
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
    blocks: ["dashboard", "pos", "returns", "catalog", "customers", "stock", "inventory", "exchange", "settings", "reports", "employees", "log"],
    actions: ["sale_create", "return_create", "drilldown_view", "document_edit", "document_list_view", "document_list_sort", "document_list_collapse", "customer_create", "cash_open", "cash_close", "inventory_post", "inventory_resort", "sql_import", "exchange_view", "exchange_import", "exchange_export", "exchange_automation", "system_settings", "employee_manage", "reports_view", "audit_view"]
  },
  seller: {
    label: "Продавець",
    blocks: ["dashboard", "pos", "catalog", "customers", "stock"],
    actions: ["sale_create", "document_list_view", "document_list_sort", "document_list_collapse", "customer_create"]
  },
  cashier: {
    label: "Касир",
    blocks: ["dashboard", "pos", "returns"],
    actions: ["sale_create", "return_create", "drilldown_view", "document_list_view", "document_list_sort", "document_list_collapse", "cash_open", "cash_close"]
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
  return {
    productId: row.id,
    expectedQty: stockQtyFromRows(sqlStockBalanceSnapshot, row.id),
    actualQty: ""
  };
}

const seedState = {
  currentView: "dashboard",
  systemSettings: clone(DEFAULT_SYSTEM_SETTINGS),
  checkout: {
    customerId: "walk-in",
    customerSearch: "",
    paymentMethod: "card",
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
  selectedCashierId: "e-004",
  selectedReturnId: "",
  stockUi: {
    serialProductId: ""
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

const navItems = [
  ["dashboard", "Панель"],
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
  dashboard: "П",
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

const VIEW_ALIASES = { checkout: "pos", receipts: "pos", cash: "pos" };

let sessionEmployeeId = loadSessionEmployeeId();
let state = loadState();
let loginDialog = { open: false, employeeId: "" };
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

function storeSessionEmployeeId(employeeId) {
  sessionEmployeeId = employeeId || "";
  try {
    if (sessionEmployeeId) {
      sessionStorage.setItem(SESSION_KEY, sessionEmployeeId);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
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
  next.selectedCashierId = next.selectedCashierId || next.employees.find((item) => item.role === "cashier" && item.status === "active")?.id || seedState.selectedCashierId;
  next.selectedReturnId = next.selectedReturnId || "";
  next.stockUi = {
    ...clone(seedState.stockUi),
    ...(next.stockUi || {})
  };
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
  next.listUi = normalizeListUi(next.listUi);
  if (!canOpenBlock(next.currentView, next)) next.currentView = firstAllowedView(next);
  return next;
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

function normalizeLiveTables(input) {
  return Object.fromEntries(Object.entries(LIVE_TABLES).map(([kind, config]) => [
    kind,
    normalizeLiveTableState(input?.[kind], kind, config)
  ]));
}

function normalizeLiveTableState(table, kind, config = LIVE_TABLES[kind]) {
  const source = table || {};
  const limit = clampLiveLimit(source.limit, config.defaultLimit);
  const rows = Array.isArray(source.items) ? source.items : (Array.isArray(source.data) ? source.data : []);
  return {
    search: String(source.search || ""),
    limit,
    offset: Math.max(0, Number(source.offset || 0)),
    total: Math.max(0, Number(source.total || 0)),
    totalExact: Boolean(source.totalExact),
    hasMore: Boolean(source.hasMore),
    nextOffset: source.nextOffset === null || source.nextOffset === undefined ? null : Math.max(0, Number(source.nextOffset || 0)),
    items: rows.slice(0, limit).map((item) => normalizeLiveTableItem(kind, item)),
    loading: false,
    error: String(source.error || ""),
    source: String(source.source || ""),
    lastLoadedAt: String(source.lastLoadedAt || "")
  };
}

function normalizeLiveTableItem(kind, item) {
  if (kind === "products") return normalizeProduct(item);
  if (kind === "prices") return normalizeLivePrice(item);
  if (kind === "counterparties") return normalizeLiveCounterparty(item);
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

function normalizeLivePrice(row) {
  const source = row || {};
  return {
    id: textField(source, ["id", "productCode", "product_code", "productName", "product_name"], `price-${Date.now()}`),
    productCode: textField(source, ["productCode", "product_code", "sku"]),
    productName: textField(source, ["productName", "product_name", "name"]),
    priceTypeCode: textField(source, ["priceTypeCode", "price_type_code"]),
    priceTypeName: textField(source, ["priceTypeName", "price_type_name", "priceType", "price_type"]),
    currency: textField(source, ["currency"], "UAH"),
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
    prices: Array.isArray(product.prices) ? product.prices.map((price) => ({
      priceType: price.priceType || "",
      currency: price.currency || "UAH",
      price: Number(price.price || 0)
    })) : [],
    priceCurrencies: product.priceCurrencies || "",
    priceTypes: product.priceTypes || "",
    priceSummary: product.priceSummary || "",
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
  return {
    lineId: line.lineId || `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: line.productId || "",
    qty: Math.max(1, Number(line.qty || 1)),
    price: Number(line.price || 0),
    discount: Math.max(0, Number(line.discount || 0)),
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
    const sourceBlocks = Array.isArray(source.blocks) ? source.blocks.filter((id) => knownBlocks.has(id)) : [...defaults.blocks];
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
    const lines = receipt.lines.map((line) => ({
      productId: line.productId,
      qty: Number(line.qty || 0),
      price: Number(line.price || 0),
      discount: Number(line.discount || 0),
      total: Number(line.total || 0),
      warehouseCode: line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
      warehouseName: line.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
      warehouseStockQty: Number(line.warehouseStockQty || 0),
      serialName: line.serialName || line.serialNumber || "",
      serialNumber: line.serialNumber || line.serialName || ""
    }));
    const linesTotal = lines.reduce((sum, line) => {
      const fallbackTotal = Math.max(0, Number(line.qty || 0) * Number(line.price || 0) - Number(line.discount || 0));
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
    if (!product || lines.some((item) => item.productId === product.id)) return;
    const actualValue = line.actualQty;
    lines.push({
      productId: product.id,
      expectedQty: stockQtyFromRows(stockRows, product.id),
      actualQty: actualValue === "" || actualValue === undefined || actualValue === null ? "" : Number(actualValue)
    });
  });
  return {
    id: inventory?.id || "INV-DRAFT",
    date: inventory?.date || today(),
    search: inventory?.search || "",
    scan: inventory?.scan || "",
    addSearch: inventory?.addSearch || "",
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

function stockQtyFromRows(stockRows, productId) {
  return (stockRows || [])
    .filter((item) => item.productId === productId && (
      item.warehouseCode ? item.warehouseCode === SQL_MAIN_WAREHOUSE_CODE : true
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

function serverModeEnabled() {
  return state.systemSettings?.mode !== "local" && Boolean(apiEndpoint("/api/health"));
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
    throw new Error(payload.error || `${response.status} ${response.statusText}`);
  }
  return payload;
}

function rememberLiveProduct(product) {
  const normalized = normalizeProduct(product);
  if (normalized.id) liveProductCache.set(normalized.id, normalized);
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
  const localMatches = state.customers.filter((customer) => customerMatchesQuery(customer, query));
  const liveMatches = serverModeEnabled() && queryKey === liveKey && liveCustomerLookup.source
    ? liveCustomerLookup.items
    : [];
  const merged = new Map();
  [...localMatches, ...liveMatches].forEach((customer) => {
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
  if (!raw || !Array.isArray(liveProductLookup.items)) return null;
  const items = liveProductLookup.items.filter(productHasMainWarehouseStock);
  return items.find((product) => normalizeScanText(productLookupValue(product)) === raw)
    || items.find((product) => productMatchesQuery(product, value))
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
  const items = (await Promise.all(stockRows.map(fetchLiveProductForStockRow)))
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

async function queryLiveSerialsForProduct(product) {
  const productCode = liveProductCode(product);
  if (!productCode) throw new Error("productCode товару відсутній");
  const params = new URLSearchParams({
    productCode,
    warehouseCode: SQL_MAIN_WAREHOUSE_CODE,
    limit: String(LIVE_SERIAL_LOOKUP_LIMIT),
    offset: "0"
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

function localSerialOptionsForProduct(product) {
  if (!isWeaponProduct(product)) return [];
  return state.serialStock
    .filter((row) => (
      String(row.warehouseCode) === SQL_MAIN_WAREHOUSE_CODE
      && Number(row.quantity || 0) > 0
      && (
        row.productId === product.id
        || (row.productCode && row.productCode === liveProductCode(product))
      )
    ))
    .map(normalizeSerialStock);
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
  const limit = clampLiveLimit(options.limit ?? table.limit, config.defaultLimit);
  const offset = Math.max(0, Number(options.offset ?? table.offset ?? 0));
  const params = new URLSearchParams();
  const search = String(options.search ?? table.search ?? "").trim();
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  table.loading = true;
  table.error = "";
  table.limit = limit;
  table.offset = offset;
  table.search = search;
  saveState({ server: false });
  render();
  try {
    const payload = await fetchJson(`${config.endpoint}?${params.toString()}`);
    const items = normalizeLivePayloadItems(kind, payload);
    table.items = items;
    table.total = liveTableTotal(payload, items);
    table.totalExact = Boolean(payload.totalExact);
    table.limit = Number(payload.limit || limit);
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
  const limit = clampLiveLimit(formData.get("limit"), liveTableConfig(kind).defaultLimit);
  return loadLiveTable(kind, { search, limit, offset: 0 });
}

function refreshLiveTable(kind) {
  const table = liveTable(kind);
  return loadLiveTable(kind, { offset: table.offset });
}

function pageLiveTable(kind, direction) {
  const table = liveTable(kind);
  const limit = clampLiveLimit(table.limit, liveTableConfig(kind).defaultLimit);
  const nextOffset = direction > 0 && table.nextOffset !== null && table.nextOffset !== undefined
    ? Math.max(0, Number(table.nextOffset || 0))
    : Math.max(0, Number(table.offset || 0) + Number(direction || 0) * limit);
  if (nextOffset === table.offset && direction < 0) return;
  return loadLiveTable(kind, { offset: nextOffset });
}

function queueLiveProductLookup(value) {
  const query = String(value || "").trim();
  window.clearTimeout(liveProductLookup.timer);
  liveProductLookup.query = query;
  liveProductLookup.barcode = "";
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
  liveProductLookup.items = [];
  liveProductLookup.total = 0;
  liveProductLookup.source = "";
  liveProductLookup.fallback = false;
  const requestId = liveProductLookup.requestId + 1;
  liveProductLookup.requestId = requestId;
  liveProductLookup.loading = true;
  liveProductLookup.error = "";
  renderProductLookupOptions();
  liveProductLookup.timer = window.setTimeout(async () => {
    try {
      const payload = await queryLiveStockedProducts({ search: query, limit: LIVE_PRODUCT_LOOKUP_LIMIT });
      if (requestId !== liveProductLookup.requestId) return;
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
    if (selected) return selected;
    liveProductLookup.loading = true;
    liveProductLookup.error = "";
    renderProductLookupOptions();
    try {
      const payload = await queryLiveStockedProducts({ search: query, limit: LIVE_PRODUCT_LOOKUP_LIMIT });
      liveProductLookup.loading = false;
      renderProductLookupOptions();
      if (payload.items.length) return payload.items[0];
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
    const payload = await fetchJson("/api/bootstrap");
    if (payload.settings) {
      state.systemSettings = normalizeSystemSettings({ ...state.systemSettings, ...payload.settings });
    }
    if (payload.state) {
      state = normalizeState(payload.state);
      if (payload.settings) state.systemSettings = normalizeSystemSettings({ ...state.systemSettings, ...payload.settings });
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
    const payload = await fetchJson("/api/state", {
      method: "PUT",
      body: JSON.stringify({
        baseRevision: serverSync.revision,
        build: APP_BUILD,
        appVersion: APP_VERSION,
        releasedAt: APP_RELEASED_AT,
        savedBy: currentEmployee()?.name || "system",
        state
      })
    });
    markServerOnline(payload);
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
    const previousRevision = Number(serverSync.revision || 0);
    const payload = await fetchJson(`/api/state?revision=${encodeURIComponent(serverSync.revision)}`);
    markServerOnline({
      revision: payload.revision,
      savedAt: payload.savedAt,
      loadedAt: nowIso()
    });
    if ((force || Number(payload.revision || 0) > previousRevision) && payload.state) {
      state = normalizeState(payload.state);
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
  return `${product.productCode || product.sku} · ${product.name} · ${scanCode} · ${formatMoney(product.price)} · ${SQL_MAIN_WAREHOUSE_NAME} ${retailQty} · всього ${totalQty}`;
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

function currentEmployee(source = state) {
  return source.employees.find((employee) => employee.id === sessionEmployeeId && employee.status === "active") || null;
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

function firstAllowedView(source = state) {
  return flatNavItems().find(([id]) => canOpenBlock(id, source))?.[0] || "dashboard";
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
  return text.includes("збро") || text.includes("оруж") || text.includes("weapon") || text.includes("firearm");
}

function serialRowsForSelectedWeaponProduct(productId) {
  const product = productById(productId);
  if (!product?.id || !isWeaponProduct(product)) return [];
  return state.serialStock.filter((row) => (
    row.productId === product.id
    || (product.productCode && row.productCode === product.productCode)
    || (product.sku && row.productCode === product.sku)
  ));
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

function findCustomerByLookup(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const pool = customerSearchPool();
  return pool.find((customer) => normalizeScanText(customerLookupValue(customer)) === raw)
    || pool.find((customer) => normalizeScanText(customer.id) === raw)
    || pool.find((customer) => normalizeScanText(customer.counterpartyCode) === raw)
    || pool.find((customer) => customerMatchesQuery(customer, value))
    || null;
}

function formatMoney(value) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(Number(value || 0));
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
  const discount = Math.max(0, Number(line.discount || 0));
  return Math.max(0, qty * price - discount);
}

function cartLines() {
  return state.checkout.lines.map((line) => {
    const product = productById(line.productId);
    if (!product.id) return null;
    const normalized = normalizeCheckoutLine(line);
    return {
      productId: product.id,
      lineId: normalized.lineId,
      qty: isWeaponProduct(product) ? 1 : Math.max(1, Number(normalized.qty || 1)),
      price: Number(normalized.price || product.price || 0),
      discount: Math.max(0, Number(normalized.discount || 0)),
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
      <small>${escapeHtml(roleLabel(employee.role))}</small>
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
          <label class="field"><span>Логін працівника</span><select name="employeeId" required>
            ${active.map((employee) => option(employee.id, `${employee.login || employee.code} · ${employee.name} · ${roleLabel(employee.role)}`, employee.id === selectedId)).join("")}
          </select></label>
          <label class="field"><span>PIN</span><input name="pin" type="password" autocomplete="current-password" placeholder="якщо встановлено в картці"></label>
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
  const posted = state.receipts.filter((receipt) => receipt.status === "posted");
  const returned = state.returns;
  const revenue = posted.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const returnsTotal = returned.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const lowStock = state.products.filter((product) => stockQty(product.id) <= product.minStock).length;
  const shift = openShift();
  setTitle("Панель магазину");
  return `
    <section class="grid four">
      ${metricCard("Виторг", formatMoney(revenue - returnsTotal), `${posted.length} чеків, ${returned.length} повернень.`, "dashboard_revenue")}
      ${metricCard("Середній чек", formatMoney(posted.length ? revenue / posted.length : 0), "Тільки B2C роздріб.", "dashboard_revenue")}
      ${metricCard("Низький залишок", String(lowStock), "Позиції для поповнення магазину.")}
      ${metricCard("Каса", shift ? "Відкрита" : "Закрита", shift ? `${shift.id} · очікувано ${formatMoney(shiftExpectedCash(shift))}` : "Немає активної зміни")}
    </section>
    <section class="stacked-panels section-gap">
      ${canOpenBlock("pos") && canDo("sale_create") ? renderCheckoutPanel() : ""}
      <article class="panel">
        <div class="split">
          <h2>Операції сьогодні</h2>
          <span class="pill">B2C prototype</span>
        </div>
        <div class="stack">
          ${canDo("audit_view") ? state.auditLog.slice(0, 6).map((row) => `
            <div class="log-row">
              <strong>${escapeHtml(row.event)}</strong>
              <span>${formatDateTime(row.at)} · ${escapeHtml(row.actor)}</span>
            </div>
          `).join("") : '<p class="muted">Журнал дій приховано для цієї ролі.</p>'}
        </div>
      </article>
    </section>
  `;
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
  if (serverModeEnabled()) ensureLiveTableLoaded("counterparties");
  const lines = cartLines();
  const subtotal = receiptSubtotal(lines);
  const loyalDiscount = loyaltyDiscount(lines);
  const total = checkoutTotal(lines);
  const customer = customerById(state.checkout.customerId);
  const customerLookup = state.checkout.customerSearch && findCustomerByLookup(state.checkout.customerSearch)?.id === customer.id
    ? state.checkout.customerSearch
    : customerLookupValue(customer);
  const productLookupItems = currentProductLookupItems();
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
        <div class="loyalty-note full">
          <span class="pill">${escapeHtml(LOYALTY_LABELS[customer.loyalty] || customer.loyalty)}</span>
          <strong>${escapeHtml(customer.name)}</strong>
          <span>${loyaltyRate()}% автоматична знижка лояльності</span>
        </div>
        <label class="field full"><span>Коментар</span><input name="note" data-checkout-field value="${escapeHtml(state.checkout.note || "")}" placeholder="примітка до продажу"></label>
        <div class="table-wrap full">
          <table>
            <thead><tr><th>Товар</th><th>Склад №1</th><th>Серійний номер</th><th>Ціна</th><th>К-сть</th><th>Знижка</th><th>Сума</th><th></th></tr></thead>
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
                    <td>${formatMoney(line.price)}</td>
                    <td><input class="mini-input" data-cart-qty="${index}" type="number" min="1" ${weapon ? 'max="1"' : ""} value="${line.qty}"></td>
                    <td><input class="mini-input" data-cart-discount="${index}" type="number" min="0" value="${line.discount}"></td>
                    <td><strong>${formatMoney(lineTotal(line))}</strong></td>
                    <td><button class="secondary" type="button" data-remove-cart="${index}">Прибрати</button></td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="8" class="muted">Залишків ще не імпортовано з SQL. Локальні демо-залишки вимкнено.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="cart-summary full">
          <div>
            <span>Підсумок: ${formatMoney(subtotal)}</span>
            <span>Лояльність: -${formatMoney(loyalDiscount)}</span>
            <strong>Разом: ${formatMoney(total)}</strong>
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
        const details = [
          `${product.sku} x ${line.qty}`,
          line.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
          line.serialName ? `SN ${line.serialName}` : ""
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
    const expectedQty = stockQty(product.id);
    const hasActual = line.actualQty !== "" && line.actualQty !== null && line.actualQty !== undefined;
    const actualQty = hasActual ? Number(line.actualQty || 0) : "";
    const diff = hasActual ? Number(actualQty) - expectedQty : null;
    const price = Number(product.price || 0);
    const expectedAmount = expectedQty * price;
    const actualAmount = hasActual ? Number(actualQty) * price : null;
    const diffAmount = hasActual ? Number(diff || 0) * price : null;
    return { product, line, expectedQty, actualQty, hasActual, diff, price, expectedAmount, actualAmount, diffAmount };
  }).filter(Boolean);
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
          <thead><tr><th>SKU</th><th>Штрихкод</th><th>Товар</th><th>Роздріб</th><th>Облік</th><th>Факт</th><th>Різниця</th><th>+/- грн</th><th>Підпис</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.product.sku)}</td>
                <td>${escapeHtml(row.product.barcode || "-")}</td>
                <td>${escapeHtml(row.product.name)}</td>
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
  const allRows = inventoryRows();
  const inventorySearch = String(state.inventory.search || "").trim();
  const rows = allRows.filter((row) => productMatchesQuery(row.product, inventorySearch));
  const totals = inventoryTotals(allRows);
  const printTotals = inventoryTotals(rows);
  const resortTotals = inventoryResortTotals();
  const canPostInventory = canDo("inventory_post");
  const canResortInventory = canDo("inventory_resort");
  const weaponProducts = state.products.filter(isWeaponProduct);
  const selectedSerialProductId = weaponProducts.some((product) => product.id === state.stockUi.serialProductId)
    ? state.stockUi.serialProductId
    : "";
  const selectedSerialProduct = selectedSerialProductId ? productById(selectedSerialProductId) : null;
  const serialRows = selectedSerialProductId ? serialRowsForSelectedWeaponProduct(selectedSerialProductId) : [];
  const serialEmptyText = !weaponProducts.length
    ? "У довіднику немає товарів категорії Зброя."
    : selectedSerialProductId
      ? "Для вибраного товару категорії Зброя серійних залишків ще не імпортовано з SQL."
      : "Виберіть товар із категорії Зброя, щоб підтягнути серійні номери.";
  return `
    <section class="stacked-panels">
      <article class="panel">
        <div class="split">
          <h2>B2C.6 Залишки</h2>
          <span class="pill">склад магазину</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>product_code</th><th>Товар</th><th>Категорія</th><th>Склад №1</th><th>Склад Гуртовий</th><th>Всі склади</th><th>Вартість роздробу</th><th>Стан</th></tr></thead>
            <tbody>
              ${state.products.map((product) => {
                const qty = stockQty(product.id);
                const wholesaleQty = stockWholesaleQty(product.id);
                const totalQty = stockTotalQty(product.id);
                const low = qty <= product.minStock;
                return `<tr><td>${escapeHtml(product.productCode || product.sku)}</td><td>${escapeHtml(product.name)}<br><span class="muted">${escapeHtml(product.productFullPath || product.productGroupPath || "-")}</span></td><td>${escapeHtml(product.categoryPrimary || product.category)}</td><td><strong>${qty}</strong></td><td>${wholesaleQty}</td><td>${totalQty}</td><td>${formatMoney(totalQty * product.price)}</td><td><span class="pill ${low ? "danger" : "good"}">${low ? "поповнити" : "доступно"}</span></td></tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel">
        <div class="split">
          <h2>Серійні номери</h2>
          <span class="pill">${selectedSerialProductId ? `${serialRows.length} рядків з SQL` : "тільки Зброя"}</span>
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
            <small class="muted">Серійні номери не показуються без вибору товару з категорії Зброя.</small>
          </div>
        </div>
        ${selectedSerialProduct ? `<p class="muted">Вибрано: ${escapeHtml(selectedSerialProduct.productFullPath || selectedSerialProduct.productGroupPath || selectedSerialProduct.categoryPrimary || selectedSerialProduct.category)}</p>` : ""}
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
        <label class="field wide"><span>Товар з довідника</span><input name="inventoryAddSearch" data-inventory-add-search list="inventory-product-options" value="${escapeHtml(state.inventory.addSearch || "")}" autocomplete="off" placeholder="назва, SKU, штрихкод або QR з довідника товарів"><datalist id="inventory-product-options">${state.products.map((product) => `<option value="${escapeHtml(productLookupValue(product))}"></option>`).join("")}</datalist></label>
        <div class="field lookup-action no-print"><span>Додати</span><button class="secondary" type="button" data-add-inventory-product>Додати товар</button></div>
        <label class="field wide"><span>Пошук у інвентаризації</span><input name="inventorySearch" data-inventory-search value="${escapeHtml(state.inventory.search || "")}" placeholder="назва, SKU, штрихкод або QR"></label>
        <label class="field wide"><span>Сканер інвентаризації</span><input name="inventoryScan" data-inventory-scan autocomplete="off" placeholder="скануйте штрихкод або QR, Enter додає 1 до факту"></label>
        <div class="toolbar full no-print">
          <button class="secondary" type="button" data-add-all-stock-inventory>Додати всі товари із залишками</button>
          <button class="secondary" type="button" data-print-inventory>Друк Інвентаризаційний лист</button>
          <button class="secondary" type="button" data-reset-inventory>Очистити лист</button>
          ${canPostInventory ? '<button class="primary" type="submit">Провести і оновити склад</button>' : ""}
        </div>
        <div class="table-wrap full">
          <table>
            <thead><tr><th>SKU</th><th>Товар</th><th>Штрихкод</th><th>Роздріб</th><th>Облік</th><th>Факт</th><th>Різниця</th><th>+/- грн</th><th>Дії</th></tr></thead>
            <tbody>
              ${rows.map((row) => `
                <tr class="${row.hasActual && row.diff !== 0 ? "inventory-diff" : ""}">
                  <td>${escapeHtml(row.product.sku)}</td>
                  <td>${escapeHtml(row.product.name)}</td>
                  <td>${escapeHtml(row.product.barcode || "-")}</td>
                  <td>${formatMoney(row.price)}</td>
                  <td><strong>${row.expectedQty}</strong></td>
                  <td><input class="mini-input" data-inventory-actual="${escapeHtml(row.product.id)}" type="number" min="0" value="${row.hasActual ? row.actualQty : ""}"></td>
                  <td><span class="pill ${row.diff === null ? "" : row.diff < 0 ? "danger" : row.diff > 0 ? "warn" : "good"}">${diffLabel(row.diff)}</span></td>
                  <td>${row.diffAmount === null ? "-" : formatMoney(row.diffAmount)}</td>
                  <td><button class="secondary" type="button" data-remove-inventory-product="${escapeHtml(row.product.id)}">Видалити</button></td>
                </tr>
              `).join("") || `<tr><td colspan="9" class="muted">${inventorySearch ? "За цим пошуком позицій немає." : "Додайте товар з довідника товарів або відскануйте штрихкод/QR."}</td></tr>`}
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
          <label class="field"><span>Мінус товар</span><select name="fromProductId">${state.products.map((product, index) => option(product.id, `${product.sku} · ${product.name} · ${formatMoney(product.price)}`, index === 0)).join("")}</select></label>
          <label class="field"><span>Плюс товар</span><select name="toProductId">${state.products.map((product, index) => option(product.id, `${product.sku} · ${product.name} · ${formatMoney(product.price)}`, index === 1)).join("")}</select></label>
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
    const totalText = table.totalExact && table.total ? ` з ${table.total}` : "";
    const moreText = table.hasMore ? " · є наступна сторінка" : "";
    return { text: `${from}-${to}${totalText} · limit ${table.limit}${moreText}`, className: "good" };
  }
  return { text: "очікує першого запиту", className: "warn" };
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
      <label class="field"><span>Рядків</span><select name="limit">${LIVE_TABLE_LIMIT_OPTIONS.map((limit) => option(limit, limit, limit === table.limit)).join("")}</select></label>
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
              <td>${escapeHtml(product.priceSummary || formatMoney(product.price))}<br><span class="muted">${escapeHtml(product.priceTypes || "-")} · ${escapeHtml(product.priceCurrencies || "UAH")}</span></td>
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
              <td><strong>${Number(price.amount || price.price || 0)}</strong> ${escapeHtml(price.currency || "UAH")}</td>
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
                <tr>
                  <td>${escapeHtml(employee.code)}</td>
                  <td><strong>${escapeHtml(employee.name)}</strong><br><span class="muted">${escapeHtml(employee.login || "-")} · ${escapeHtml(employee.schedule || "-")}</span></td>
                  <td>${canManageEmployees ? `<select class="mini-select" data-employee-role="${escapeHtml(employee.id)}">${roleRows.map(([id, role]) => option(id, role.label, id === employee.role)).join("")}</select>` : `<span class="pill">${escapeHtml(roleLabel(employee.role))}</span>`}</td>
                  <td>${escapeHtml(employee.phone || "-")}<br><span class="muted">${escapeHtml(employee.email || "-")}</span></td>
                  <td><span class="pill ${employee.status === "active" ? "good" : employee.status === "vacation" ? "warn" : "danger"}">${escapeHtml(employeeStatusLabel(employee.status))}</span></td>
                  <td>${escapeHtml(employee.store || "-")}<br><span class="muted">з ${escapeHtml(employee.hireDate || "-")}</span></td>
                  <td>
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
          <label class="field"><span>PIN / код доступу</span><input name="pin" placeholder="службовий PIN"></label>
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

function prepareCheckoutLine(product) {
  return normalizeCheckoutLine({
    lineId: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    qty: 1,
    discount: 0,
    price: Number(product.price || 0),
    warehouseCode: SQL_MAIN_WAREHOUSE_CODE,
    warehouseName: SQL_MAIN_WAREHOUSE_NAME,
    warehouseStockQty: productWarehouseStockFallback(product),
    stockSource: product.retailStockQty ? "crm-sql-product-summary" : "local-fallback",
    serialOptions: localSerialOptionsForProduct(product),
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
      const serialPayload = serverModeEnabled()
        ? await queryLiveSerialsForProduct(product)
        : { items: localSerialOptionsForProduct(product), source: "local-fallback" };
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
        const fallback = localSerialOptionsForProduct(product);
        latestLine.serialOptions = fallback;
        latestLine.serialLoading = false;
        latestLine.serialError = fallback.length
          ? "live serial API недоступний, показано локальний fallback"
          : String(error?.message || error || "serial stock unavailable");
      }
    }
  }
  saveState();
  render();
}

function addCartProduct(productOrId) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const product = typeof productOrId === "object" && productOrId
    ? rememberLiveProduct(productOrId)
    : productById(productOrId);
  if (!product.id) return alert("Товар не знайдено в довіднику.");
  const productId = product.id;
  const weapon = isWeaponProduct(product);
  const existing = weapon ? null : state.checkout.lines.find((line) => line.productId === productId);
  if (existing) {
    existing.qty = Number(existing.qty || 1) + 1;
  } else {
    state.checkout.lines.push(prepareCheckoutLine(product));
  }
  audit(`Додано товар у кошик: ${product.sku}`);
  saveState();
  render();
  hydrateCheckoutLine(existing?.lineId || state.checkout.lines[state.checkout.lines.length - 1]?.lineId);
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
  state.checkout.search = "";
  addCartProduct(product);
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
  addCartProduct(product);
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
      price: Number(product.price || line.price || 0),
      warehouseCode: line.warehouseCode || SQL_MAIN_WAREHOUSE_CODE,
      warehouseName: line.warehouseName || SQL_MAIN_WAREHOUSE_NAME,
      warehouseStockQty: checkoutLineWarehouseStock(line, product),
      serialName: line.serialName || "",
      serialNumber: line.serialNumber || line.serialName || ""
    };
    return { ...saleLine, total: lineTotal(saleLine) };
  });
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
  const customer = findCustomerByLookup(query);
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
  const line = state.inventory.lines.find((item) => item.productId === productId);
  if (!line) return;
  line.expectedQty = stockQty(productId);
  line.actualQty = value === "" ? "" : Math.max(0, Number(value || 0));
  saveState();
}

function inventoryLineForProduct(productId) {
  let line = state.inventory.lines.find((item) => item.productId === productId);
  if (!line) {
    line = { productId, expectedQty: stockQty(productId), actualQty: "" };
    state.inventory.lines.push(line);
  }
  line.expectedQty = stockQty(productId);
  return line;
}

function addInventoryProductFromLookup(value = state.inventory.addSearch) {
  const query = String(value || "").trim();
  if (!query) {
    alert("Вкажіть товар з довідника товарів.");
    return;
  }
  const product = findProductByLookup(query);
  if (!product) {
    state.inventory.addSearch = query;
    saveState();
    render();
    alert("Товар не знайдено в довіднику товарів. Перевірте назву, SKU, штрихкод або QR.");
    return;
  }
  const existed = state.inventory.lines.some((item) => item.productId === product.id);
  inventoryLineForProduct(product.id);
  state.inventory.addSearch = "";
  state.inventory.search = product.sku;
  audit(`${existed ? "Відкрито" : "Додано"} товар до інвентаризації: ${product.sku}`);
  saveState();
  render();
}

function addAllInventoryStockProducts() {
  const productsWithStock = state.products.filter((product) => stockQty(product.id) > 0);
  const before = state.inventory.lines.length;
  productsWithStock.forEach((product) => {
    inventoryLineForProduct(product.id);
  });
  const added = state.inventory.lines.length - before;
  state.inventory.addSearch = "";
  state.inventory.search = "";
  if (!productsWithStock.length) {
    alert("У довіднику немає товарів із залишками.");
    return;
  }
  audit(`Додано товари із залишками до інвентаризації: ${added} нових із ${productsWithStock.length}`);
  saveState();
  render();
}

function removeInventoryProduct(productId) {
  const index = state.inventory.lines.findIndex((item) => item.productId === productId);
  if (index === -1) return;
  const product = productById(productId);
  const relatedResorts = state.inventory.resorts.filter((item) => item.fromProductId === productId || item.toProductId === productId).length;
  state.inventory.lines.splice(index, 1);
  if (relatedResorts) {
    state.inventory.resorts = state.inventory.resorts.filter((item) => item.fromProductId !== productId && item.toProductId !== productId);
  }
  if (normalizeScanText(state.inventory.search) === normalizeScanText(product.sku)) state.inventory.search = "";
  audit(`Видалено товар з інвентаризації: ${product.sku}${relatedResorts ? `, прибрано пересортів: ${relatedResorts}` : ""}`);
  saveState();
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
  saveState();
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
  saveState();
  render();
}

function scanInventoryProduct(value) {
  const product = findProductByScan(value);
  if (!product) {
    alert("Товар за штрихкодом або QR для інвентаризації не знайдено.");
    return;
  }
  const line = inventoryLineForProduct(product.id);
  line.expectedQty = stockQty(product.id);
  line.actualQty = Number(line.actualQty || 0) + 1;
  state.inventory.scan = "";
  state.inventory.search = product.sku;
  saveState();
  render();
}

function resetInventoryDraft() {
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  audit("Очищено інвентаризаційний лист");
  saveState();
  render();
}

function printInventorySheet() {
  state.inventory.printedAt = nowIso();
  saveState();
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
      productId: row.product.id,
      sku: row.product.sku,
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
      beforeQty: row.expectedQty,
      afterQty: row.actualQty,
      diff: row.diff
    }))
  };
  rows.forEach((row) => {
    stockRow(row.product.id).qty = row.actualQty;
  });
  state.inventoryDocs.unshift(doc);
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  audit(`Проведено інвентаризацію ${doc.id} і оновлено склад: різниця ${diffLabel(doc.totalDiff)}, ${formatMoney(doc.totalAmountDiff)}`);
  saveState();
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

function toggleEmployeeStatus(employeeId) {
  if (!canDo("employee_manage")) return alert("Немає дозволу керувати працівниками.");
  const employee = employeeById(employeeId);
  employee.status = employee.status === "active" ? "inactive" : "active";
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
  if (!canDo("employee_manage")) return alert("Немає дозволу керувати працівниками.");
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

function loginEmployee(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const employee = activeEmployees().find((item) => item.id === data.employeeId);
  if (!employee) return alert("Працівника для входу не знайдено або він не активний.");
  const enteredPin = String(data.pin || "").trim();
  const requiredPin = String(employee.pin || "").trim();
  if (requiredPin && enteredPin !== requiredPin) {
    audit(`Невдала спроба входу для ${employee.name}: невірний PIN`, "auth");
    saveState();
    render();
    return alert("Невірний PIN працівника.");
  }
  const previous = currentEmployee();
  storeSessionEmployeeId(employee.id);
  state.activeEmployeeId = employee.id;
  loginDialog = { open: false, employeeId: "" };
  if (!canOpenBlock(state.currentView)) state.currentView = firstAllowedView();
  audit(previous?.id === employee.id
    ? `Працівник повторно увійшов у B2C: ${employee.name} (${roleLabel(employee.role)})`
    : `Вхід працівника у B2C: ${employee.name} (${roleLabel(employee.role)})`,
    employee.name);
  saveState();
  render();
}

function logoutEmployee() {
  const employee = currentEmployee();
  if (!employee) return openEmployeeLogin();
  audit(`Вихід працівника з B2C: ${employee.name} (${roleLabel(employee.role)})`, employee.name);
  storeSessionEmployeeId("");
  loginDialog = { open: true, employeeId: activeEmployees()[0]?.id || "" };
  saveState();
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
    state.checkout.customerSearch = target.value;
    saveState();
    queueLiveCustomerLookup(target.value);
    return;
  }
  if (target.dataset.checkoutField !== undefined) {
    state.checkout[target.name] = target.value;
    saveState();
  }
}

function updateCartField(target) {
  if (target.dataset.cartQty !== undefined) {
    const index = Number(target.dataset.cartQty);
    const line = state.checkout.lines[index];
    if (!line) return;
    const product = productById(line?.productId);
    line.qty = isWeaponProduct(product) ? 1 : Math.max(1, Number(target.value || 1));
  }
  if (target.dataset.cartDiscount !== undefined) {
    const index = Number(target.dataset.cartDiscount);
    if (!state.checkout.lines[index]) return;
    state.checkout.lines[index].discount = Math.max(0, Number(target.value || 0));
  }
  saveState();
  render();
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
  saveState();
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
    dashboard: renderDashboard,
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
    ? (views[state.currentView] || renderDashboard)()
    : renderNoAccess();
  document.getElementById("app").innerHTML = `${pageHtml}${renderSalePaymentConfirm()}${renderReturnRefundConfirm()}${renderDrilldownModal()}${renderDocumentEditModal()}${renderEmployeeLoginModal()}`;
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
  const openDocumentButton = event.target.closest("[data-open-document]");
  if (openDocumentButton) {
    const interactive = event.target.closest("button, a, input, select, textarea");
    if (!interactive || interactive === openDocumentButton) return openDocumentTarget(openDocumentButton.dataset.openDocument);
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
  if (event.target.id === "reset-local-state") {
    state = clone(seedState);
    audit("Скинуто локальний стан B2C. Товари, клієнти, залишки й чеки очищені до нового SQL-імпорту.", "manager");
    saveState();
    render();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.dataset.cartQty !== undefined || event.target.dataset.cartDiscount !== undefined) {
    updateCartField(event.target);
  }
  if (event.target.dataset.productLookup !== undefined || event.target.dataset.customerLookup !== undefined) {
    updateCheckoutField(event.target);
  }
  if (event.target.dataset.inventorySearch !== undefined) {
    state.inventory.search = event.target.value;
    saveState();
    render();
  }
  if (event.target.dataset.inventoryAddSearch !== undefined) {
    state.inventory.addSearch = event.target.value;
    saveState();
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
  if (event.target.dataset.checkoutField !== undefined) updateCheckoutField(event.target);
  if (event.target.dataset.customerLookup !== undefined) selectCustomerFromLookup(event.target.value);
  if (event.target.dataset.checkoutScan !== undefined && event.target.value.trim()) scanCheckoutProduct(event.target.value);
  if (event.target.dataset.stockSerialProduct !== undefined) {
    const product = productById(event.target.value);
    state.stockUi.serialProductId = product?.id && isWeaponProduct(product) ? product.id : "";
    saveState();
    render();
  }
  if (event.target.dataset.inventoryActual !== undefined) {
    setInventoryActual(event.target.dataset.inventoryActual, event.target.value);
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
  if ((event.key === "Enter" || event.key === " ") && event.target.dataset.drilldown !== undefined) {
    event.preventDefault();
    openDrilldown(event.target.dataset.drilldown);
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
  if (form.dataset.action === "create-receipt") createReceipt(form);
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
