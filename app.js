"use strict";

const APP_VERSION = "2026.06.05.9";
const APP_BUILD = "20260605-b2c-role-permissions";
const STORAGE_KEY = "retail-crm-b2c-v8";

const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);
const LOYALTY_DISCOUNTS = { standard: 0, silver: 3, gold: 5 };
const LOYALTY_LABELS = { standard: "Стандарт", silver: "Silver 3%", gold: "Gold 5%" };
const SQL_PRODUCT_SOURCE = "MSSQL:dbo.RetailProducts";
const SQL_STOCK_RECEIPT_SOURCE = "MSSQL:dbo.RetailStockReceipts";
const EMPLOYEE_STATUSES = { active: "Активний", inactive: "Вимкнений", vacation: "Відпустка" };
const ROLE_BLOCKS = [
  { id: "dashboard", label: "Панель" },
  { id: "pos", label: "Продаж" },
  { id: "returns", label: "Повернення" },
  { id: "catalog", label: "Товари SQL" },
  { id: "customers", label: "Клієнти і лояльність" },
  { id: "stock", label: "Залишки" },
  { id: "inventory", label: "Інвентаризація" },
  { id: "reports", label: "Звіти" },
  { id: "employees", label: "Працівники" },
  { id: "log", label: "Журнал" }
];
const ROLE_ACTIONS = [
  { id: "sale_create", label: "Створити продаж" },
  { id: "return_create", label: "Повернення" },
  { id: "cash_open", label: "Відкрити зміну" },
  { id: "cash_close", label: "Закрити зміну" },
  { id: "inventory_post", label: "Провести інвентаризацію" },
  { id: "inventory_resort", label: "Пересорт" },
  { id: "sql_import", label: "SQL імпорт" },
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
    blocks: ["dashboard", "pos", "returns", "catalog", "customers", "stock", "inventory", "reports", "employees", "log"],
    actions: ["sale_create", "return_create", "cash_open", "cash_close", "inventory_post", "inventory_resort", "sql_import", "employee_manage", "reports_view", "audit_view"]
  },
  seller: {
    label: "Продавець",
    blocks: ["dashboard", "pos", "catalog", "customers", "stock"],
    actions: ["sale_create"]
  },
  cashier: {
    label: "Касир",
    blocks: ["dashboard", "pos", "returns"],
    actions: ["sale_create", "return_create", "cash_open", "cash_close"]
  }
};
const sqlProductSnapshot = [
  { id: "p-100", sqlId: "SQL-100", name: "Оптичний приціл R-Point", sku: "OPT-RPOINT", barcode: "4820001000011", qr: "B2C|SKU=OPT-RPOINT|BARCODE=4820001000011", category: "Оптика", price: 5400, cost: 3650, minStock: 3, stockQty: 8 },
  { id: "p-101", sqlId: "SQL-101", name: "Чохол транспортний 120 см", sku: "CASE-120", barcode: "4820001000028", qr: "B2C|SKU=CASE-120|BARCODE=4820001000028", category: "Аксесуари", price: 2100, cost: 1180, minStock: 5, stockQty: 12 },
  { id: "p-102", sqlId: "SQL-102", name: "Набір для догляду", sku: "CARE-KIT", barcode: "4820001000035", qr: "B2C|SKU=CARE-KIT|BARCODE=4820001000035", category: "Догляд", price: 860, cost: 420, minStock: 8, stockQty: 18 },
  { id: "p-103", sqlId: "SQL-103", name: "Ремінь тактичний", sku: "SLING-TAC", barcode: "4820001000042", qr: "B2C|SKU=SLING-TAC|BARCODE=4820001000042", category: "Аксесуари", price: 1450, cost: 790, minStock: 6, stockQty: 7 },
  { id: "p-104", sqlId: "SQL-104", name: "Захисні окуляри ProShield", sku: "EYE-PRO", barcode: "4820001000059", qr: "B2C|SKU=EYE-PRO|BARCODE=4820001000059", category: "Захист", price: 980, cost: 520, minStock: 10, stockQty: 15 }
];
const sqlStockReceiptSnapshot = [
  { id: "RCV-SQL-0001", sqlId: "IN-SQL-9001", date: today(), supplier: "SQL Central Warehouse", productId: "p-100", qty: 4, note: "SQL import demo" },
  { id: "RCV-SQL-0002", sqlId: "IN-SQL-9002", date: today(), supplier: "SQL Central Warehouse", productId: "p-102", qty: 6, note: "SQL import demo" },
  { id: "RCV-SQL-0003", sqlId: "IN-SQL-9003", date: today(), supplier: "SQL Central Warehouse", productId: "p-104", qty: 5, note: "SQL import demo" }
];

function productFromSql(row) {
  return {
    id: row.id,
    sqlId: row.sqlId,
    source: "sql",
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    qr: row.qr,
    category: row.category,
    price: row.price,
    cost: row.cost,
    minStock: row.minStock
  };
}

function stockFromSql(row) {
  return { productId: row.id, qty: Number(row.stockQty || 0) };
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
    note: row.note || "",
    createdAt: nowIso()
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
    expectedQty: Number(row.stockQty || 0),
    actualQty: ""
  };
}

const seedState = {
  currentView: "dashboard",
  checkout: {
    customerId: "walk-in",
    customerSearch: "",
    paymentMethod: "card",
    search: "",
    note: "",
    printReceiptId: "B2C-0001",
    lines: [
      { productId: "p-102", qty: 1, discount: 0 }
    ]
  },
  products: sqlProductSnapshot.map(productFromSql),
  customers: [
    { id: "walk-in", name: "Роздрібний покупець", phone: "", loyalty: "standard" },
    { id: "c-001", name: "Олександр Клименко", phone: "+380671234567", loyalty: "silver" },
    { id: "c-002", name: "Ірина Бойко", phone: "+380662224466", loyalty: "gold" }
  ],
  employees: [
    seedEmployee("e-001", "EMP-001", "Олена Директор", "director", "+380671110001", "director@retail.local", "director"),
    seedEmployee("e-002", "EMP-002", "Іван Адміністратор", "admin", "+380671110002", "admin@retail.local", "admin"),
    seedEmployee("e-003", "EMP-003", "Марія Продавець", "seller", "+380671110003", "seller@retail.local", "seller"),
    seedEmployee("e-004", "EMP-004", "Петро Касир", "cashier", "+380671110004", "cashier@retail.local", "cashier")
  ],
  activeEmployeeId: "e-001",
  selectedCashierId: "e-004",
  rolePermissions: defaultRolePermissions(),
  stock: sqlProductSnapshot.map(stockFromSql),
  productImport: {
    source: SQL_PRODUCT_SOURCE,
    rows: sqlProductSnapshot.length,
    lastRunAt: nowIso(),
    mode: "seed"
  },
  stockImport: {
    source: SQL_STOCK_RECEIPT_SOURCE,
    rows: sqlStockReceiptSnapshot.length,
    lastRunAt: nowIso(),
    mode: "seed"
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
  receipts: [
    {
      id: "B2C-0001",
      date: today(),
      customerId: "walk-in",
      paymentMethod: "card",
      status: "posted",
      lines: [{ productId: "p-102", qty: 2, price: 860, discount: 0, total: 1720 }],
      total: 1720,
      note: "demo чек",
      createdAt: nowIso()
    }
  ],
  returns: [],
  cashShifts: [
    {
      id: "SHIFT-001",
      date: today(),
      cashierId: "e-004",
      cashier: "Петро Касир",
      cashierRole: "Касир",
      opened: true,
      openedAt: nowIso(),
      closedAt: "",
      openingCash: 3000,
      cashSales: 0,
      cardSales: 1720,
      bankSales: 0,
      cashReturns: 0,
      cardReturns: 0,
      bankReturns: 0,
      actualCash: 0
    }
  ],
  stockReceipts: sqlStockReceiptSnapshot.map(stockReceiptFromSql),
  auditLog: [
    { at: nowIso(), actor: "system", event: "Створено demo-дані B2C прототипу" }
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
  ["returns", "Повернення"],
  ["reports", "Звіт дня"],
  ["employees", "Працівники"],
  ["log", "Журнал"]
];

const VIEW_ALIASES = { checkout: "pos", receipts: "pos", cash: "pos" };

let state = loadState();

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
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
  next.products = Array.isArray(next.products) ? next.products.map(normalizeProduct) : clone(seedState.products);
  next.customers = Array.isArray(next.customers) ? next.customers.map(normalizeCustomer) : clone(seedState.customers);
  next.employees = Array.isArray(next.employees) ? next.employees.map(normalizeEmployee) : clone(seedState.employees);
  next.activeEmployeeId = next.employees.some((employee) => employee.id === next.activeEmployeeId)
    ? next.activeEmployeeId
    : next.employees.find((employee) => employee.role === "director")?.id || next.employees[0]?.id || "";
  next.selectedCashierId = next.selectedCashierId || next.employees.find((item) => item.role === "cashier" && item.status === "active")?.id || seedState.selectedCashierId;
  next.rolePermissions = normalizeRolePermissions(next.rolePermissions);
  next.stock = Array.isArray(next.stock) ? next.stock : clone(seedState.stock);
  next.productImport = {
    ...clone(seedState.productImport),
    ...(next.productImport || {})
  };
  next.stockImport = {
    ...clone(seedState.stockImport),
    ...(next.stockImport || {})
  };
  next.receipts = Array.isArray(next.receipts) ? next.receipts.map((receipt) => normalizeReceipt(receipt, next.products)) : [];
  next.returns = Array.isArray(next.returns) ? next.returns : [];
  next.cashShifts = Array.isArray(next.cashShifts) ? next.cashShifts.map(normalizeShift) : clone(seedState.cashShifts);
  next.stockReceipts = Array.isArray(next.stockReceipts) ? next.stockReceipts.map(normalizeStockReceipt) : clone(seedState.stockReceipts);
  next.inventory = normalizeInventory(next.inventory, next.products, next.stock);
  next.inventoryDocs = Array.isArray(next.inventoryDocs) ? next.inventoryDocs.map(normalizeInventoryDoc) : [];
  next.auditLog = Array.isArray(next.auditLog) ? next.auditLog : [];
  next.checkout = {
    ...clone(seedState.checkout),
    ...(next.checkout || {})
  };
  next.checkout.lines = Array.isArray(next.checkout.lines) && next.checkout.lines.length ? next.checkout.lines : clone(seedState.checkout.lines);
  next.checkout.printReceiptId = next.checkout.printReceiptId || next.receipts[0]?.id || "";
  if (!canOpenBlock(next.currentView, next)) next.currentView = firstAllowedView(next);
  return next;
}

function normalizeView(view) {
  const id = VIEW_ALIASES[view] || view || seedState.currentView;
  return flatNavItems().some(([itemId]) => itemId === id) ? id : seedState.currentView;
}

function flatNavItems(items = navItems) {
  return items.flatMap((item) => Array.isArray(item) ? [item] : item.children || []);
}

function normalizeProduct(product) {
  return {
    id: product.id || `p-${Date.now()}`,
    sqlId: product.sqlId || product.id || "",
    source: product.source || "sql",
    name: product.name || "Товар з SQL",
    sku: product.sku || product.id || `SKU-${Date.now()}`,
    barcode: product.barcode || "",
    qr: product.qr || "",
    category: product.category || "Інше",
    price: Number(product.price || 0),
    cost: Number(product.cost || 0),
    minStock: Number(product.minStock || 0)
  };
}

function normalizeCustomer(customer) {
  return {
    id: customer.id || `c-${Date.now()}`,
    name: customer.name || "Покупець",
    phone: customer.phone || "",
    loyalty: LOYALTY_DISCOUNTS[customer.loyalty] !== undefined ? customer.loyalty : "standard"
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

function normalizeRolePermissions(input) {
  const base = defaultRolePermissions();
  const knownBlocks = new Set(ROLE_BLOCKS.map((block) => block.id));
  const knownActions = new Set(ROLE_ACTIONS.map((action) => action.id));
  return Object.fromEntries(Object.entries(base).map(([roleId, defaults]) => {
    const source = input?.[roleId] || defaults;
    return [
      roleId,
      {
        blocks: Array.isArray(source.blocks) ? source.blocks.filter((id) => knownBlocks.has(id)) : [...defaults.blocks],
        actions: Array.isArray(source.actions) ? source.actions.filter((id) => knownActions.has(id)) : [...defaults.actions]
      }
    ];
  }));
}

function normalizeReceipt(receipt, products) {
  if (Array.isArray(receipt.lines)) return receipt;
  const product = products.find((item) => item.id === receipt.productId) || products[0] || seedState.products[0];
  const qty = Number(receipt.qty || 1);
  const price = Number(receipt.price || product.price || 0);
  return {
    id: receipt.id,
    date: receipt.date || today(),
    customerId: receipt.customerId || "walk-in",
    paymentMethod: receipt.paymentMethod || "card",
    status: receipt.status || "posted",
    lines: [{ productId: receipt.productId || product.id, qty, price, discount: 0, total: qty * price }],
    total: Number(receipt.total || qty * price),
    note: receipt.note || "",
    createdAt: receipt.createdAt || nowIso()
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
    productId: receipt.productId || seedState.products[0].id,
    qty: Number(receipt.qty || 0),
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
    fromProductId: item.fromProductId || seedState.products[0].id,
    toProductId: item.toProductId || seedState.products[1]?.id || seedState.products[0].id,
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
  const row = (stockRows || []).find((item) => item.productId === productId);
  return Number(row?.qty || 0);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function audit(event, actor = "manager") {
  state.auditLog.unshift({ at: nowIso(), actor, event });
  state.auditLog = state.auditLog.slice(0, 100);
}

function productById(id) {
  return state.products.find((product) => product.id === id) || state.products[0];
}

function customerById(id) {
  return state.customers.find((customer) => customer.id === id) || state.customers[0];
}

function customerLookupValue(customer) {
  return `${customer.name} · ${customer.phone || "без телефону"} · ${LOYALTY_LABELS[customer.loyalty] || customer.loyalty}`;
}

function productLookupValue(product) {
  const scanCode = product.barcode || product.qr || product.sqlId || product.sku;
  return `${product.sku} · ${product.name} · ${scanCode} · ${formatMoney(product.price)} · залишок ${stockQty(product.id)}`;
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
  return source.employees.find((employee) => employee.id === source.activeEmployeeId)
    || source.employees.find((employee) => employee.role === "director")
    || source.employees[0];
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

function stockRow(productId) {
  let row = state.stock.find((item) => item.productId === productId);
  if (!row) {
    row = { productId, qty: 0 };
    state.stock.push(row);
  }
  return row;
}

function stockQty(productId) {
  return Number(stockRow(productId).qty || 0);
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
  return [product.sku, product.barcode, product.qr, product.sqlId]
    .map(normalizeScanText)
    .filter(Boolean);
}

function productMatchesQuery(product, query) {
  const raw = normalizeScanText(query);
  if (!raw) return true;
  const tokens = scanTokens(raw);
  const text = normalizeScanText(`${product.name} ${product.sku} ${product.barcode} ${product.qr} ${product.sqlId}`);
  if (text.includes(raw)) return true;
  return productScanTargets(product).some((target) => tokens.has(target) || raw.includes(target));
}

function customerMatchesQuery(customer, query) {
  const raw = normalizeScanText(query);
  if (!raw) return true;
  return normalizeScanText(`${customer.name} ${customer.phone} ${customer.id} ${LOYALTY_LABELS[customer.loyalty] || customer.loyalty}`).includes(raw);
}

function findProductByScan(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  const tokens = scanTokens(raw);
  return state.products.find((product) => (
    productScanTargets(product).some((target) => tokens.has(target) || raw.includes(target))
  )) || null;
}

function findProductByLookup(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  return state.products.find((product) => normalizeScanText(productLookupValue(product)) === raw)
    || findProductByScan(value)
    || state.products.find((product) => productMatchesQuery(product, value))
    || null;
}

function findProductForSale(value) {
  return findProductByLookup(value);
}

function findCustomerByLookup(value) {
  const raw = normalizeScanText(value);
  if (!raw) return null;
  return state.customers.find((customer) => normalizeScanText(customerLookupValue(customer)) === raw)
    || state.customers.find((customer) => normalizeScanText(customer.id) === raw)
    || state.customers.find((customer) => customerMatchesQuery(customer, value))
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
    return {
      productId: product.id,
      qty: Math.max(1, Number(line.qty || 1)),
      price: Number(line.price ?? product.price),
      discount: Math.max(0, Number(line.discount || 0))
    };
  });
}

function nextId(prefix, collection) {
  const number = collection.length + 1;
  return `${prefix}-${String(number).padStart(4, "0")}`;
}

function setTitle(title) {
  document.getElementById("page-title").textContent = title;
}

function renderNav() {
  const employee = currentEmployee();
  const employeeSwitch = `
    <div class="access-switch">
      <span>Працівник</span>
      <select data-active-employee>
        ${state.employees.map((item) => option(item.id, `${item.name} · ${roleLabel(item.role)}`, item.id === employee?.id)).join("")}
      </select>
      <small>${escapeHtml(roleLabel(employee?.role))}</small>
    </div>
  `;
  const itemsHtml = navItems.map((item) => {
    if (Array.isArray(item)) {
      const [id, label] = item;
      if (!canOpenBlock(id)) return "";
      return `<button type="button" class="${state.currentView === id ? "active" : ""}" data-view="${id}">${escapeHtml(label)}</button>`;
    }

    const children = (item.children || []).filter(([id]) => canOpenBlock(id));
    if (!children.length) return "";
    const active = children.some(([id]) => state.currentView === id);
    return `
      <div class="nav-group ${active ? "open" : ""}">
        <button type="button" class="nav-group-label" aria-haspopup="true" aria-expanded="${active ? "true" : "false"}">
          <span>${escapeHtml(item.label)}</span>
          <span class="nav-group-caret" aria-hidden="true">&gt;</span>
        </button>
        <div class="nav-submenu">
          ${children.map(([id, label]) => `<button type="button" class="${state.currentView === id ? "active" : ""}" data-view="${id}">${escapeHtml(label)}</button>`).join("")}
        </div>
      </div>
    `;
  }).join("");
  document.getElementById("nav").innerHTML = `${employeeSwitch}${itemsHtml}`;
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
      <article class="card metric"><span>Виторг</span><strong>${formatMoney(revenue - returnsTotal)}</strong><small>${posted.length} чеків, ${returned.length} повернень.</small></article>
      <article class="card metric"><span>Середній чек</span><strong>${formatMoney(posted.length ? revenue / posted.length : 0)}</strong><small>Тільки B2C роздріб.</small></article>
      <article class="card metric"><span>Низький залишок</span><strong>${lowStock}</strong><small>Позиції для поповнення магазину.</small></article>
      <article class="card metric"><span>Каса</span><strong>${shift ? "Відкрита" : "Закрита"}</strong><small>${shift ? `${shift.id} · очікувано ${formatMoney(shiftExpectedCash(shift))}` : "Немає активної зміни"}.</small></article>
    </section>
    <section class="grid two section-gap">
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
      <article class="card metric"><span>Касова зміна</span><strong>${shift ? "Відкрита" : "Закрита"}</strong><small>${shift ? escapeHtml(shift.id) : "Можна відкрити в цьому блоці."}</small></article>
      <article class="card metric"><span>Касир</span><strong>${escapeHtml(shift?.cashier || cashier.name)}</strong><small>${escapeHtml(shift?.cashierRole || roleLabel(cashier.role))}.</small></article>
      <article class="card metric"><span>Чеків сьогодні</span><strong>${todayReceipts.length}</strong><small>Журнал чеків у цьому ж блоці.</small></article>
      <article class="card metric"><span>Виторг сьогодні</span><strong>${formatMoney(todayRevenue)}</strong><small>До повернень.</small></article>
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
  const customerLookup = state.checkout.customerSearch && findCustomerByLookup(state.checkout.customerSearch)?.id === customer.id
    ? state.checkout.customerSearch
    : customerLookupValue(customer);
  return `
    <section class="panel ${full ? "" : "compact-panel"}">
      <div class="split">
        <h2>B2C.1 Продаж</h2>
        <span class="pill ${openShift() ? "good" : "danger"}">${openShift() ? "каса відкрита" : "відкрийте касу"}</span>
      </div>
      <form class="form-grid checkout-form" data-action="create-receipt">
        <label class="field wide"><span>Покупець</span><input name="customerSearch" data-customer-lookup list="customer-options" value="${escapeHtml(customerLookup)}" autocomplete="off" placeholder="ім'я або телефон з довідника"><datalist id="customer-options">${state.customers.map((item) => `<option value="${escapeHtml(customerLookupValue(item))}"></option>`).join("")}</datalist></label>
        <label class="field"><span>Оплата</span><select name="paymentMethod" data-checkout-field>${["cash", "card", "bank"].map((method) => option(method, paymentLabel(method), method === state.checkout.paymentMethod)).join("")}</select></label>
        <label class="field wide"><span>Товар / штрихкод / QR</span><input name="search" data-product-lookup list="product-options" value="${escapeHtml(state.checkout.search)}" autocomplete="off" placeholder="назва, SKU, штрихкод або QR з довідника"><datalist id="product-options">${state.products.map((product) => `<option value="${escapeHtml(productLookupValue(product))}"></option>`).join("")}</datalist></label>
        <div class="field lookup-action"><span>Додати</span><button class="secondary" type="button" data-add-selected-product>Додати товар</button></div>
        <div class="loyalty-note full">
          <span class="pill">${escapeHtml(LOYALTY_LABELS[customer.loyalty] || customer.loyalty)}</span>
          <strong>${escapeHtml(customer.name)}</strong>
          <span>${loyaltyRate()}% автоматична знижка лояльності</span>
        </div>
        <label class="field full"><span>Коментар</span><input name="note" data-checkout-field value="${escapeHtml(state.checkout.note || "")}" placeholder="примітка до продажу"></label>
        <div class="table-wrap full">
          <table>
            <thead><tr><th>Товар</th><th>Ціна</th><th>К-сть</th><th>Знижка</th><th>Сума</th><th></th></tr></thead>
            <tbody>
              ${lines.map((line, index) => {
                const product = productById(line.productId);
                return `
                  <tr>
                    <td>${escapeHtml(product.name)}<br><span class="muted">${escapeHtml(product.sku)} · доступно ${stockQty(product.id)}</span></td>
                    <td>${formatMoney(line.price)}</td>
                    <td><input class="mini-input" data-cart-qty="${index}" type="number" min="1" value="${line.qty}"></td>
                    <td><input class="mini-input" data-cart-discount="${index}" type="number" min="0" value="${line.discount}"></td>
                    <td><strong>${formatMoney(lineTotal(line))}</strong></td>
                    <td><button class="secondary" type="button" data-remove-cart="${index}">Прибрати</button></td>
                  </tr>
                `;
              }).join("")}
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

function renderReceipts() {
  setTitle("Чеки магазину");
  return renderReceiptsContent();
}

function renderReceiptsContent() {
  const selected = state.receipts.find((receipt) => receipt.id === state.checkout.printReceiptId) || state.receipts[0];
  return `
    <section class="grid two">
      <article class="panel">
        <div class="split">
          <h2>B2C.2 Чеки</h2>
          <span class="pill">${state.receipts.length} документів</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Чек</th><th>Дата</th><th>Покупець</th><th>Позиції</th><th>Сума</th><th>Оплата</th><th>Стан</th><th>Дії</th></tr></thead>
            <tbody>
              ${state.receipts.map((receipt) => `
                <tr>
                  <td>${escapeHtml(receipt.id)}</td>
                  <td>${escapeHtml(receipt.date)}<br><span class="muted">${formatDateTime(receipt.createdAt)}</span></td>
                  <td>${escapeHtml(customerById(receipt.customerId).name)}</td>
                  <td>${receipt.lines.map((line) => `${escapeHtml(productById(line.productId).sku)} x ${line.qty}`).join("<br>")}</td>
                  <td><strong>${formatMoney(receipt.total)}</strong></td>
                  <td>${escapeHtml(paymentLabel(receipt.paymentMethod))}</td>
                  <td><span class="pill ${receipt.status === "returned" ? "warn" : "good"}">${escapeHtml(statusLabel(receipt.status))}</span></td>
                  <td>
                    <button class="secondary" type="button" data-print-receipt="${escapeHtml(receipt.id)}">Друк</button>
                    ${canDo("return_create") ? `<button class="secondary" type="button" data-return-receipt="${escapeHtml(receipt.id)}" ${receipt.status === "returned" ? "disabled" : ""}>Все назад</button>` : ""}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel">
        <div class="split">
          <h2>Чек до друку</h2>
          <span class="pill">${selected ? escapeHtml(selected.id) : "немає"}</span>
        </div>
        ${selected ? renderReceiptSlip(selected) : '<p class="muted">Оберіть чек для перегляду.</p>'}
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
        return `<div class="receipt-line"><span>${escapeHtml(product.sku)} x ${line.qty}</span><strong>${formatMoney(line.total)}</strong></div>`;
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
  return `
    <section class="grid two">
      <article class="panel">
        <div class="split">
          <h2>B2C.3 Повернення</h2>
          <span class="pill">${state.returns.length} документів</span>
        </div>
        ${canDo("return_create") ? `<form class="form-grid one-col" data-action="create-return">
          <label class="field"><span>Чек</span><select name="receiptId">${returnableReceipts.map((receipt) => option(receipt.id, `${receipt.id} · ${customerById(receipt.customerId).name} · ${formatMoney(receipt.total)}`)).join("")}</select></label>
          <label class="field"><span>Товар</span><select name="productId">${returnableReceipts.flatMap((receipt) => receiptReturnableLines(receipt).filter((line) => line.returnable > 0).map((line) => option(`${receipt.id}::${line.productId}`, `${receipt.id} · ${productById(line.productId).sku} · доступно ${line.returnable}`))).join("")}</select></label>
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1"></label>
          <label class="field"><span>Причина</span><input name="reason" value="часткове повернення"></label>
          <button class="primary" type="submit" ${returnableReceipts.length ? "" : "disabled"}>Оформити повернення</button>
        </form>` : '<p class="muted">Для ролі активного працівника не увімкнено дію "Повернення".</p>'}
      </article>
      <article class="panel">
        <h2>Журнал повернень</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Повернення</th><th>Чек</th><th>Дата</th><th>Позиції</th><th>Сума</th><th>Причина</th></tr></thead>
            <tbody>
              ${state.returns.map((item) => `
                <tr>
                  <td>${escapeHtml(item.id)}</td>
                  <td>${escapeHtml(item.receiptId)}</td>
                  <td>${escapeHtml(item.date)}</td>
                  <td>${item.lines.map((line) => `${escapeHtml(productById(line.productId).sku)} x ${line.qty}`).join("<br>")}</td>
                  <td><strong>${formatMoney(item.total)}</strong></td>
                  <td>${escapeHtml(item.reason || "повернення")}</td>
                </tr>
              `).join("") || '<tr><td colspan="6" class="muted">Повернень ще немає.</td></tr>'}
            </tbody>
          </table>
        </div>
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
  const receiptRows = state.stockReceipts.slice(0, 6);
  const allRows = inventoryRows();
  const inventorySearch = String(state.inventory.search || "").trim();
  const rows = allRows.filter((row) => productMatchesQuery(row.product, inventorySearch));
  const totals = inventoryTotals(allRows);
  const printTotals = inventoryTotals(rows);
  const resortTotals = inventoryResortTotals();
  const canImportSql = canDo("sql_import");
  const canPostInventory = canDo("inventory_post");
  const canResortInventory = canDo("inventory_resort");
  return `
    <section class="grid two">
      <article class="panel">
        <div class="split">
          <h2>B2C.6 Залишки</h2>
          <span class="pill">склад магазину</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>SKU</th><th>Товар</th><th>Категорія</th><th>Залишок</th><th>Мін.</th><th>Вартість</th><th>Стан</th></tr></thead>
            <tbody>
              ${state.products.map((product) => {
                const qty = stockQty(product.id);
                const low = qty <= product.minStock;
                return `<tr><td>${escapeHtml(product.sku)}</td><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.category)}</td><td><strong>${qty}</strong></td><td>${product.minStock}</td><td>${formatMoney(qty * product.cost)}</td><td><span class="pill ${low ? "danger" : "good"}">${low ? "поповнити" : "доступно"}</span></td></tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel">
        <div class="split">
          <h2>Імпорт надходжень з SQL</h2>
          <span class="pill good">ручне оприбуткування вимкнено</span>
        </div>
        <div class="stack">
          <div class="log-row">
            <strong>Джерело</strong>
            <span>${escapeHtml(state.stockImport.source || SQL_STOCK_RECEIPT_SOURCE)}</span>
          </div>
          <div class="log-row">
            <strong>Останній імпорт</strong>
            <span>${formatDateTime(state.stockImport.lastRunAt)} · ${state.stockImport.rows || 0} рядків</span>
          </div>
          <div class="sql-box">
            SELECT receipt_id, sql_product_id, sku, qty, supplier, receipt_date
            FROM dbo.RetailStockReceipts
            WHERE store_code = 'B2C' AND posted = 1
          </div>
          <p class="muted">Надходження в магазин не вводяться вручну. Оприбуткування, постачальник, кількість і поточні залишки приходять тільки з SQL-джерела.</p>
        </div>
        ${canImportSql ? `<form class="form-grid one-col" data-action="sync-sql-stock-receipts">
          <button class="primary" type="submit">Імпортувати надходження з SQL</button>
        </form>` : '<p class="muted">SQL-імпорт надходжень приховано для цієї ролі.</p>'}
        <div class="table-wrap section-gap">
          <table>
            <thead><tr><th>SQL док.</th><th>Дата</th><th>SKU</th><th>К-сть</th><th>Постачальник</th></tr></thead>
            <tbody>
              ${receiptRows.map((item) => `
                <tr>
                  <td>${escapeHtml(item.sqlId || item.id)}</td>
                  <td>${escapeHtml(item.date)}</td>
                  <td>${escapeHtml(productById(item.productId).sku)}</td>
                  <td><strong>${item.qty}</strong></td>
                  <td>${escapeHtml(item.supplier || "-")}</td>
                </tr>
              `).join("") || '<tr><td colspan="5" class="muted">SQL-надходжень ще немає.</td></tr>'}
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

function renderCatalog() {
  setTitle("Товари магазину");
  return `
    <section class="grid two">
      <article class="panel">
        <div class="split">
          <h2>B2C.4 Товари</h2>
          <span class="pill">${state.products.length} SKU з SQL</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>SQL ID</th><th>SKU</th><th>Назва</th><th>Штрихкод</th><th>Категорія</th><th>Ціна</th><th>Залишок</th><th>Дії</th></tr></thead>
            <tbody>
              ${state.products.map((product) => `
                <tr>
                  <td>${escapeHtml(product.sqlId || "-")}</td>
                  <td>${escapeHtml(product.sku)}</td>
                  <td>${escapeHtml(product.name)}</td>
                  <td>${escapeHtml(product.barcode || "-")}</td>
                  <td>${escapeHtml(product.category)}</td>
                  <td>${formatMoney(product.price)}</td>
                  <td>${stockQty(product.id)}</td>
                  <td>${canDo("sale_create") ? `<button class="secondary" type="button" data-add-cart="${escapeHtml(product.id)}">У продаж</button>` : ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel">
        <div class="split">
          <h2>Імпорт товарів з SQL</h2>
          <span class="pill good">ручне SKU вимкнено</span>
        </div>
        <div class="stack">
          <div class="log-row">
            <strong>Джерело</strong>
            <span>${escapeHtml(state.productImport.source || SQL_PRODUCT_SOURCE)}</span>
          </div>
          <div class="log-row">
            <strong>Останній імпорт</strong>
            <span>${formatDateTime(state.productImport.lastRunAt)} · ${state.productImport.rows || 0} рядків</span>
          </div>
          <div class="sql-box">
            SELECT sql_id, sku, barcode, name, category, price, cost, min_stock, stock_qty
            FROM dbo.RetailProducts
            WHERE active = 1
          </div>
          <p class="muted">SKU у роздробі не створюється вручну. Товари, ціни, штрихкоди та базові залишки приходять тільки з SQL-джерела.</p>
        </div>
        ${canDo("sql_import") ? `<form class="form-grid one-col" data-action="sync-sql-products">
          <button class="primary" type="submit">Синхронізувати з SQL</button>
        </form>` : '<p class="muted">SQL-імпорт приховано для цієї ролі.</p>'}
      </article>
    </section>
  `;
}

function renderCustomers() {
  setTitle("Клієнти і лояльність");
  return `
    <section class="grid two">
      <article class="panel">
        <div class="split">
          <div>
            <p class="eyebrow">Клієнти і лояльність</p>
            <h2>B2C.5 Клієнти</h2>
          </div>
          <div class="panel-actions">
            <span class="pill">${state.customers.length} карток</span>
            <a class="button-link secondary" href="#new-customer-card">Новий клієнт</a>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Клієнт</th><th>Телефон</th><th>Лояльність</th><th>Чеків</th><th>Сума</th><th>Дії</th></tr></thead>
            <tbody>
              ${state.customers.map((customer) => {
                const receipts = state.receipts.filter((receipt) => receipt.customerId === customer.id);
                const total = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
                return `
                  <tr>
                    <td>${escapeHtml(customer.name)}</td>
                    <td>${escapeHtml(customer.phone || "-")}</td>
                    <td><span class="pill">${escapeHtml(LOYALTY_LABELS[customer.loyalty] || customer.loyalty)}</span></td>
                    <td>${receipts.length}</td>
                    <td>${formatMoney(total)}</td>
                    <td>${canDo("sale_create") ? `<button class="secondary" type="button" data-select-customer="${escapeHtml(customer.id)}">У продаж</button>` : ""}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel" id="new-customer-card">
        <div class="split">
          <div>
            <p class="eyebrow">Клієнти</p>
            <h2>Новий клієнт</h2>
          </div>
          <span class="pill">картка лояльності</span>
        </div>
        <form class="form-grid one-col" data-action="create-customer">
          <label class="field"><span>Ім'я</span><input name="name" required placeholder="ПІБ або назва"></label>
          <label class="field"><span>Телефон</span><input name="phone" placeholder="+380..."></label>
          <label class="field"><span>Лояльність</span><select name="loyalty">${Object.entries(LOYALTY_LABELS).map(([id, label]) => option(id, label)).join("")}</select></label>
          <button class="primary" type="submit">Створити клієнта</button>
        </form>
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
    <section class="grid two">
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
  const receipts = state.receipts.filter((receipt) => receipt.status === "posted");
  const returnsTotal = state.returns.reduce((sum, item) => sum + Number(item.total || 0), 0);
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
      <article class="card metric"><span>Виторг</span><strong>${formatMoney(revenue)}</strong><small>До повернень.</small></article>
      <article class="card metric"><span>Повернення</span><strong>${formatMoney(returnsTotal)}</strong><small>${state.returns.length} документів.</small></article>
      <article class="card metric"><span>Маржа</span><strong>${formatMoney(margin - returnsTotal)}</strong><small>Оціночна за собівартістю.</small></article>
      <article class="card metric"><span>Чисто</span><strong>${formatMoney(revenue - returnsTotal)}</strong><small>B2C день.</small></article>
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
    <section class="grid two section-gap">
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
    <section class="grid two section-gap">
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

function addCartProduct(productId) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const existing = state.checkout.lines.find((line) => line.productId === productId);
  if (existing) {
    existing.qty = Number(existing.qty || 1) + 1;
  } else {
    state.checkout.lines.push({ productId, qty: 1, discount: 0 });
  }
  audit(`Додано товар у кошик: ${productById(productId).sku}`);
  saveState();
  render();
}

function addSelectedCheckoutProduct(value = state.checkout.search) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const query = String(value || "").trim();
  if (!query) {
    alert("Вкажіть товар, SKU, штрихкод або QR.");
    return;
  }
  const product = findProductForSale(query);
  if (!product) {
    state.checkout.search = query;
    saveState();
    render();
    alert("Товар не знайдено в довіднику. Перевірте назву, SKU, штрихкод або QR.");
    return;
  }
  state.checkout.search = "";
  addCartProduct(product.id);
}

function scanCheckoutProduct(value) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const product = findProductByScan(value);
  if (!product) {
    state.checkout.search = String(value || "").trim();
    saveState();
    render();
    alert("Товар за штрихкодом або QR не знайдено. Пошук залишено у полі товарів.");
    return;
  }
  addCartProduct(product.id);
}

function removeCartLine(index) {
  state.checkout.lines.splice(index, 1);
  if (!state.checkout.lines.length) state.checkout.lines.push({ productId: state.products[0].id, qty: 1, discount: 0 });
  saveState();
  render();
}

function createReceipt(form) {
  if (!canDo("sale_create")) return alert("Немає дозволу створювати продаж.");
  const shift = openShift();
  if (!shift) {
    alert("Спочатку відкрийте касову зміну.");
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.customerSearch) selectCustomerFromLookup(data.customerSearch, false);
  state.checkout.customerId = data.customerId || state.checkout.customerId;
  state.checkout.paymentMethod = data.paymentMethod || state.checkout.paymentMethod;
  state.checkout.note = data.note || "";
  const lines = cartLines().map((line) => {
    const product = productById(line.productId);
    return { ...line, price: Number(product.price || line.price || 0), total: lineTotal(line) };
  });
  const subtotal = receiptSubtotal(lines);
  const loyalDiscount = loyaltyDiscount(lines, state.checkout.customerId);
  const total = checkoutTotal(lines, state.checkout.customerId);
  for (const line of lines) {
    if (stockQty(line.productId) < line.qty) {
      alert(`Недостатньо залишку: ${productById(line.productId).name}`);
      return;
    }
  }
  lines.forEach((line) => {
    stockRow(line.productId).qty -= line.qty;
  });
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
    createdAt: nowIso()
  };
  state.receipts.unshift(receipt);
  applyPaymentToShift(shift, receipt.paymentMethod, receipt.total, "sale");
  state.checkout.lines = [{ productId: state.products[0].id, qty: 1, discount: 0 }];
  state.checkout.note = "";
  state.currentView = "pos";
  audit(`Проведено продаж ${receipt.id} на ${formatMoney(receipt.total)}`);
  saveState();
  render();
}

function syncProductsFromSql() {
  if (!canDo("sql_import")) return alert("Немає дозволу виконувати SQL-імпорт.");
  state.products = sqlProductSnapshot.map((row) => normalizeProduct(productFromSql(row)));
  state.stock = sqlProductSnapshot.map(stockFromSql);
  state.productImport = {
    source: SQL_PRODUCT_SOURCE,
    rows: sqlProductSnapshot.length,
    lastRunAt: nowIso(),
    mode: "manual-sync"
  };
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  audit(`Імпортовано ${state.products.length} SKU з SQL (${SQL_PRODUCT_SOURCE})`);
  saveState();
  render();
}

function createCustomer(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const name = String(data.name || "").trim();
  if (!name) return alert("Вкажіть ім'я клієнта.");
  const phone = String(data.phone || "").trim();
  if (phone && state.customers.some((customer) => customer.phone === phone)) {
    return alert("Клієнт з таким телефоном вже існує.");
  }
  const customer = normalizeCustomer({
    id: `c-${Date.now()}`,
    name,
    phone,
    loyalty: data.loyalty || "standard"
  });
  state.customers.push(customer);
  state.checkout.customerId = customer.id;
  state.checkout.customerSearch = customerLookupValue(customer);
  audit(`Створено клієнта ${customer.name} (${LOYALTY_LABELS[customer.loyalty]})`);
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

function selectCustomerFromLookup(value, renderAfter = true) {
  const query = String(value || "").trim();
  state.checkout.customerSearch = query;
  const customer = findCustomerByLookup(query);
  if (customer) {
    const changed = state.checkout.customerId !== customer.id;
    state.checkout.customerId = customer.id;
    state.checkout.customerSearch = customerLookupValue(customer);
    if (changed) audit(`Клієнта ${customer.name} вибрано для продажу`);
  }
  saveState();
  if (renderAfter) render();
}

function applyPaymentToShift(shift, method, total, kind) {
  const fieldMap = {
    sale: { cash: "cashSales", card: "cardSales", bank: "bankSales" },
    return: { cash: "cashReturns", card: "cardReturns", bank: "bankReturns" }
  };
  const field = fieldMap[kind]?.[method] || fieldMap[kind]?.cash;
  shift[field] = Number(shift[field] || 0) + Number(total || 0);
}

function createReturn(receiptId) {
  if (!canDo("return_create")) return alert("Немає дозволу оформлювати повернення.");
  const receipt = state.receipts.find((item) => item.id === receiptId);
  if (!receipt || receipt.status === "returned") return;
  const remaining = receiptReturnableLines(receipt).filter((line) => line.returnable > 0);
  if (!remaining.length) return;
  const shift = openShift();
  if (!shift) {
    alert("Для повернення потрібна відкрита касова зміна.");
    return;
  }
  const total = remaining.reduce((sum, line) => sum + returnLineTotal(receipt, line.productId, line.returnable), 0);
  const returnDoc = {
    id: nextId("RET", state.returns),
    date: today(),
    receiptId,
    lines: remaining.map((line) => ({ productId: line.productId, qty: line.returnable, price: line.price, total: returnLineTotal(receipt, line.productId, line.returnable) })),
    total,
    reason: "повне повернення",
    createdAt: nowIso()
  };
  returnDoc.lines.forEach((line) => {
    stockRow(line.productId).qty += Number(line.qty || 0);
  });
  receipt.status = "returned";
  state.returns.unshift(returnDoc);
  applyPaymentToShift(shift, receipt.paymentMethod, returnDoc.total, "return");
  audit(`Оформлено повернення ${returnDoc.id} по чеку ${receipt.id}`);
  state.currentView = "returns";
  saveState();
  render();
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
  const shift = openShift();
  if (!shift) return alert("Для повернення потрібна відкрита касова зміна.");
  const total = returnLineTotal(receipt, productId, qty);
  const returnDoc = {
    id: nextId("RET", state.returns),
    date: today(),
    receiptId,
    lines: [{ productId, qty, price: line.price, total }],
    total,
    reason: data.reason || "часткове повернення",
    createdAt: nowIso()
  };
  stockRow(productId).qty += qty;
  state.returns.unshift(returnDoc);
  const stillReturnable = receiptReturnableLines(receipt).some((item) => item.returnable > 0);
  receipt.status = stillReturnable ? "partial_return" : "returned";
  applyPaymentToShift(shift, receipt.paymentMethod, returnDoc.total, "return");
  audit(`Оформлено повернення ${returnDoc.id} по чеку ${receipt.id}: ${productById(productId).sku} x ${qty}`);
  state.currentView = "returns";
  saveState();
  render();
}

function syncStockReceiptsFromSql() {
  if (!canDo("sql_import")) return alert("Немає дозволу виконувати SQL-імпорт.");
  state.stockReceipts = sqlStockReceiptSnapshot.map((row) => normalizeStockReceipt(stockReceiptFromSql(row)));
  state.stock = sqlProductSnapshot.map(stockFromSql);
  state.stockImport = {
    source: SQL_STOCK_RECEIPT_SOURCE,
    rows: state.stockReceipts.length,
    lastRunAt: nowIso(),
    mode: "manual-sync"
  };
  state.inventory = normalizeInventory({ id: "INV-DRAFT", date: today(), lines: [] }, state.products, state.stock);
  audit(`Імпортовано ${state.stockReceipts.length} надходжень з SQL (${SQL_STOCK_RECEIPT_SOURCE})`);
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

function setActiveEmployee(employeeId) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) return;
  state.activeEmployeeId = employee.id;
  if (!canOpenBlock(state.currentView)) state.currentView = firstAllowedView();
  audit(`Перегляд перемкнено на працівника ${employee.name}: ${roleLabel(employee.role)}`);
  saveState();
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
    return;
  }
  if (target.dataset.customerLookup !== undefined) {
    state.checkout.customerSearch = target.value;
    saveState();
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
    state.checkout.lines[index].qty = Math.max(1, Number(target.value || 1));
  }
  if (target.dataset.cartDiscount !== undefined) {
    const index = Number(target.dataset.cartDiscount);
    state.checkout.lines[index].discount = Math.max(0, Number(target.value || 0));
  }
  saveState();
  render();
}

function render() {
  if (!canOpenBlock(state.currentView)) {
    const allowedView = firstAllowedView();
    if (canOpenBlock(allowedView)) {
      state.currentView = allowedView;
      saveState();
    }
  }
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
    reports: renderReports,
    employees: renderEmployees,
    log: renderLog
  };
  document.getElementById("app").innerHTML = canOpenBlock(state.currentView)
    ? (views[state.currentView] || renderDashboard)()
    : renderNoAccess();
}

function renderNoAccess() {
  setTitle("Немає доступу");
  return `
    <section class="panel">
      <h2>Немає доступних блоків</h2>
      <p class="muted">Для активного працівника не увімкнено жодного блоку в матриці ролей.</p>
    </section>
  `;
}

document.addEventListener("click", (event) => {
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
  if (event.target.id === "reset-demo") {
    state = clone(seedState);
    audit("Скинуто demo-дані", "manager");
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
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.activeEmployee !== undefined) setActiveEmployee(event.target.value);
  if (event.target.dataset.employeeRole !== undefined) changeEmployeeRole(event.target.dataset.employeeRole, event.target.value);
  if (event.target.dataset.rolePermission !== undefined) {
    toggleRolePermission(event.target.dataset.rolePermission, event.target.dataset.roleId, event.target.dataset.permissionId, event.target.checked);
  }
  if (event.target.dataset.checkoutField !== undefined) updateCheckoutField(event.target);
  if (event.target.dataset.customerLookup !== undefined) selectCustomerFromLookup(event.target.value);
  if (event.target.dataset.checkoutScan !== undefined && event.target.value.trim()) scanCheckoutProduct(event.target.value);
  if (event.target.dataset.inventoryActual !== undefined) {
    setInventoryActual(event.target.dataset.inventoryActual, event.target.value);
    render();
  }
  if (event.target.dataset.inventoryScan !== undefined && event.target.value.trim()) scanInventoryProduct(event.target.value);
});

document.addEventListener("keydown", (event) => {
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
  if (form.dataset.action === "create-receipt") createReceipt(form);
  if (form.dataset.action === "sync-sql-products") syncProductsFromSql();
  if (form.dataset.action === "create-customer") createCustomer(form);
  if (form.dataset.action === "create-return") createPartialReturn(form);
  if (form.dataset.action === "sync-sql-stock-receipts") syncStockReceiptsFromSql();
  if (form.dataset.action === "create-inventory-resort") createInventoryResort(form);
  if (form.dataset.action === "post-inventory") postInventory();
  if (form.dataset.action === "create-employee") createEmployee(form);
  if (form.dataset.action === "open-shift") openCashShift(form);
  if (form.dataset.action === "close-shift") closeCashShift(form);
});

render();
