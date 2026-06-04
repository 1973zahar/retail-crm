"use strict";

const APP_VERSION = "2026.06.04.2";
const APP_BUILD = "20260604-b2c-prototype-1";
const STORAGE_KEY = "retail-crm-b2c-v2";

const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);

const seedState = {
  currentView: "dashboard",
  checkout: {
    customerId: "walk-in",
    paymentMethod: "card",
    search: "",
    note: "",
    lines: [
      { productId: "p-102", qty: 1, discount: 0 }
    ]
  },
  products: [
    { id: "p-100", name: "Оптичний приціл R-Point", sku: "OPT-RPOINT", barcode: "4820001000011", category: "Оптика", price: 5400, cost: 3650, minStock: 3 },
    { id: "p-101", name: "Чохол транспортний 120 см", sku: "CASE-120", barcode: "4820001000028", category: "Аксесуари", price: 2100, cost: 1180, minStock: 5 },
    { id: "p-102", name: "Набір для догляду", sku: "CARE-KIT", barcode: "4820001000035", category: "Догляд", price: 860, cost: 420, minStock: 8 },
    { id: "p-103", name: "Ремінь тактичний", sku: "SLING-TAC", barcode: "4820001000042", category: "Аксесуари", price: 1450, cost: 790, minStock: 6 }
  ],
  customers: [
    { id: "walk-in", name: "Роздрібний покупець", phone: "", loyalty: "standard" },
    { id: "c-001", name: "Олександр Клименко", phone: "+380671234567", loyalty: "silver" },
    { id: "c-002", name: "Ірина Бойко", phone: "+380662224466", loyalty: "gold" }
  ],
  stock: [
    { productId: "p-100", qty: 8 },
    { productId: "p-101", qty: 12 },
    { productId: "p-102", qty: 18 },
    { productId: "p-103", qty: 7 }
  ],
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
      cashier: "Каса магазину",
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
  stockReceipts: [],
  auditLog: [
    { at: nowIso(), actor: "system", event: "Створено demo-дані B2C прототипу" }
  ]
};

const navItems = [
  ["dashboard", "Панель"],
  ["checkout", "Новий чек"],
  ["receipts", "Чеки"],
  ["returns", "Повернення"],
  ["stock", "Залишки"],
  ["cash", "Каса/POS"],
  ["reports", "Звіт дня"],
  ["log", "Журнал"]
];

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
  next.products = Array.isArray(next.products) ? next.products : clone(seedState.products);
  next.customers = Array.isArray(next.customers) ? next.customers : clone(seedState.customers);
  next.stock = Array.isArray(next.stock) ? next.stock : clone(seedState.stock);
  next.receipts = Array.isArray(next.receipts) ? next.receipts.map((receipt) => normalizeReceipt(receipt, next.products)) : [];
  next.returns = Array.isArray(next.returns) ? next.returns : [];
  next.cashShifts = Array.isArray(next.cashShifts) ? next.cashShifts.map(normalizeShift) : clone(seedState.cashShifts);
  next.stockReceipts = Array.isArray(next.stockReceipts) ? next.stockReceipts : [];
  next.auditLog = Array.isArray(next.auditLog) ? next.auditLog : [];
  next.checkout = {
    ...clone(seedState.checkout),
    ...(next.checkout || {})
  };
  next.checkout.lines = Array.isArray(next.checkout.lines) && next.checkout.lines.length ? next.checkout.lines : clone(seedState.checkout.lines);
  return next;
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
  return { posted: "проведено", returned: "повернено" }[status] || status || "-";
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
  document.getElementById("nav").innerHTML = navItems.map(([id, label]) => (
    `<button type="button" class="${state.currentView === id ? "active" : ""}" data-view="${id}">${escapeHtml(label)}</button>`
  )).join("");
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
      ${renderCheckoutPanel()}
      <article class="panel">
        <div class="split">
          <h2>Операції сьогодні</h2>
          <span class="pill">B2C prototype</span>
        </div>
        <div class="stack">
          ${state.auditLog.slice(0, 6).map((row) => `
            <div class="log-row">
              <strong>${escapeHtml(row.event)}</strong>
              <span>${formatDateTime(row.at)} · ${escapeHtml(row.actor)}</span>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderCheckout() {
  setTitle("Новий чек магазину");
  return renderCheckoutPanel(true);
}

function renderCheckoutPanel(full = false) {
  const lines = cartLines();
  const total = receiptTotal(lines);
  const filter = String(state.checkout.search || "").trim().toLowerCase();
  const products = state.products.filter((product) => (
    !filter
    || product.name.toLowerCase().includes(filter)
    || product.sku.toLowerCase().includes(filter)
    || product.barcode.includes(filter)
  ));
  return `
    <section class="panel ${full ? "" : "compact-panel"}">
      <div class="split">
        <h2>B2C.1 Новий чек</h2>
        <span class="pill ${openShift() ? "good" : "danger"}">${openShift() ? "каса відкрита" : "відкрийте касу"}</span>
      </div>
      <form class="form-grid checkout-form" data-action="create-receipt">
        <label class="field"><span>Покупець</span><select name="customerId" data-checkout-field>${state.customers.map((customer) => option(customer.id, customer.name, customer.id === state.checkout.customerId)).join("")}</select></label>
        <label class="field"><span>Оплата</span><select name="paymentMethod" data-checkout-field>${["cash", "card", "bank"].map((method) => option(method, paymentLabel(method), method === state.checkout.paymentMethod)).join("")}</select></label>
        <label class="field wide"><span>Пошук SKU / штрихкод</span><input name="search" data-product-search value="${escapeHtml(state.checkout.search)}" placeholder="назва, SKU або штрихкод"></label>
        <label class="field full"><span>Коментар</span><input name="note" data-checkout-field value="${escapeHtml(state.checkout.note || "")}" placeholder="примітка до чека"></label>
        <div class="product-pick full">
          ${products.map((product) => `
            <button class="product-button" type="button" data-add-cart="${escapeHtml(product.id)}">
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.sku)} · ${formatMoney(product.price)} · залишок ${stockQty(product.id)}</span>
            </button>
          `).join("") || '<p class="muted">Товарів за цим пошуком немає.</p>'}
        </div>
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
          <strong>Разом: ${formatMoney(total)}</strong>
          <button class="primary" type="submit" ${openShift() && lines.length ? "" : "disabled"}>Провести чек</button>
        </div>
      </form>
    </section>
  `;
}

function renderReceipts() {
  setTitle("Чеки магазину");
  return `
    <section class="panel">
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
                <td><button class="secondary" type="button" data-return-receipt="${escapeHtml(receipt.id)}" ${receipt.status === "returned" ? "disabled" : ""}>Повернення</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderReturns() {
  setTitle("Повернення");
  return `
    <section class="panel">
      <div class="split">
        <h2>B2C.3 Повернення</h2>
        <span class="pill">${state.returns.length} документів</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Повернення</th><th>Чек</th><th>Дата</th><th>Покупець</th><th>Позиції</th><th>Сума</th><th>Причина</th></tr></thead>
          <tbody>
            ${state.returns.map((item) => {
              const receipt = state.receipts.find((row) => row.id === item.receiptId);
              return `
                <tr>
                  <td>${escapeHtml(item.id)}</td>
                  <td>${escapeHtml(item.receiptId)}</td>
                  <td>${escapeHtml(item.date)}</td>
                  <td>${escapeHtml(customerById(receipt?.customerId).name)}</td>
                  <td>${item.lines.map((line) => `${escapeHtml(productById(line.productId).sku)} x ${line.qty}`).join("<br>")}</td>
                  <td><strong>${formatMoney(item.total)}</strong></td>
                  <td>${escapeHtml(item.reason || "повне повернення")}</td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="7" class="muted">Повернень ще немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStock() {
  setTitle("Залишки магазину");
  return `
    <section class="grid two">
      <article class="panel">
        <div class="split">
          <h2>B2C.4 Залишки</h2>
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
        <h2>Надходження в магазин</h2>
        <form class="form-grid one-col" data-action="receive-stock">
          <label class="field"><span>Товар</span><select name="productId">${state.products.map((product) => option(product.id, `${product.name} · ${product.sku}`)).join("")}</select></label>
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1" required></label>
          <label class="field"><span>Постачальник / джерело</span><input name="supplier" value="Центральний склад"></label>
          <label class="field"><span>Коментар</span><input name="note" placeholder="накладна або примітка"></label>
          <button class="primary" type="submit">Оприбуткувати</button>
        </form>
      </article>
    </section>
  `;
}

function renderCash() {
  setTitle("Каса та POS");
  const shift = openShift();
  return `
    <section class="grid two">
      <article class="panel">
        <div class="split">
          <h2>B2C.5 Каса/POS</h2>
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
      <div><dt>Відкрито</dt><dd>${formatDateTime(shift.openedAt)}</dd></div>
      <div><dt>Готівка продажі</dt><dd>${formatMoney(shift.cashSales)}</dd></div>
      <div><dt>Картка/POS</dt><dd>${formatMoney(shift.cardSales)}</dd></div>
      <div><dt>Банк</dt><dd>${formatMoney(shift.bankSales)}</dd></div>
      <div><dt>Повернення</dt><dd>${formatMoney(shift.cashReturns + shift.cardReturns + shift.bankReturns)}</dd></div>
      <div><dt>Готівка очікувана</dt><dd><strong>${formatMoney(shiftExpectedCash(shift))}</strong></dd></div>
    </dl>
    <form class="form-grid one-col" data-action="close-shift">
      <label class="field"><span>Фактична готівка в касі</span><input name="actualCash" type="number" min="0" value="${shiftExpectedCash(shift)}"></label>
      <button class="primary" type="submit">Закрити зміну</button>
    </form>
  `;
}

function renderOpenShiftForm() {
  return `
    <form class="form-grid one-col" data-action="open-shift">
      <label class="field"><span>Касир</span><input name="cashier" value="Каса магазину"></label>
      <label class="field"><span>Розмінна готівка</span><input name="openingCash" type="number" min="0" value="3000"></label>
      <button class="primary" type="submit">Відкрити зміну</button>
    </form>
  `;
}

function renderReports() {
  setTitle("Звіт дня");
  const receipts = state.receipts.filter((receipt) => receipt.status === "posted");
  const returnsTotal = state.returns.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const revenue = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const margin = receipts.reduce((sum, receipt) => sum + receipt.lines.reduce((lineSum, line) => {
    const product = productById(line.productId);
    return lineSum + line.total - Number(product.cost || 0) * Number(line.qty || 0);
  }, 0), 0);
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

function removeCartLine(index) {
  state.checkout.lines.splice(index, 1);
  if (!state.checkout.lines.length) state.checkout.lines.push({ productId: state.products[0].id, qty: 1, discount: 0 });
  saveState();
  render();
}

function createReceipt(form) {
  const shift = openShift();
  if (!shift) {
    alert("Спочатку відкрийте касову зміну.");
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  state.checkout.customerId = data.customerId || state.checkout.customerId;
  state.checkout.paymentMethod = data.paymentMethod || state.checkout.paymentMethod;
  state.checkout.note = data.note || "";
  const lines = cartLines().map((line) => {
    const product = productById(line.productId);
    return { ...line, price: Number(product.price || line.price || 0), total: lineTotal(line) };
  });
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
    total: receiptTotal(lines),
    note: state.checkout.note,
    createdAt: nowIso()
  };
  state.receipts.unshift(receipt);
  applyPaymentToShift(shift, receipt.paymentMethod, receipt.total, "sale");
  state.checkout.lines = [{ productId: state.products[0].id, qty: 1, discount: 0 }];
  state.checkout.note = "";
  state.currentView = "receipts";
  audit(`Проведено чек ${receipt.id} на ${formatMoney(receipt.total)}`);
  saveState();
  render();
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
  const receipt = state.receipts.find((item) => item.id === receiptId);
  if (!receipt || receipt.status === "returned") return;
  const shift = openShift();
  if (!shift) {
    alert("Для повернення потрібна відкрита касова зміна.");
    return;
  }
  const returnDoc = {
    id: nextId("RET", state.returns),
    date: today(),
    receiptId,
    lines: clone(receipt.lines),
    total: Number(receipt.total || 0),
    reason: "повне повернення",
    createdAt: nowIso()
  };
  receipt.lines.forEach((line) => {
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

function receiveStock(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const product = productById(data.productId);
  const qty = Math.max(1, Number(data.qty || 1));
  stockRow(product.id).qty += qty;
  const doc = {
    id: nextId("RCV", state.stockReceipts),
    date: today(),
    supplier: data.supplier || "Центральний склад",
    productId: product.id,
    qty,
    note: data.note || "",
    createdAt: nowIso()
  };
  state.stockReceipts.unshift(doc);
  audit(`Оприбутковано ${qty} од. ${product.sku} у магазин`);
  saveState();
  render();
}

function openCashShift(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  if (openShift()) return alert("Вже є відкрита касова зміна.");
  const shift = {
    id: nextId("SHIFT", state.cashShifts),
    date: today(),
    cashier: data.cashier || "Каса магазину",
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
  if (target.dataset.productSearch !== undefined) {
    state.checkout.search = target.value;
    saveState();
    render();
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
  renderNav();
  const views = {
    dashboard: renderDashboard,
    checkout: renderCheckout,
    receipts: renderReceipts,
    returns: renderReturns,
    stock: renderStock,
    cash: renderCash,
    reports: renderReports,
    log: renderLog
  };
  document.getElementById("app").innerHTML = (views[state.currentView] || renderDashboard)();
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    state.currentView = viewButton.dataset.view;
    saveState();
    render();
    return;
  }
  const addButton = event.target.closest("[data-add-cart]");
  if (addButton) return addCartProduct(addButton.dataset.addCart);
  const removeButton = event.target.closest("[data-remove-cart]");
  if (removeButton) return removeCartLine(Number(removeButton.dataset.removeCart));
  const returnButton = event.target.closest("[data-return-receipt]");
  if (returnButton) return createReturn(returnButton.dataset.returnReceipt);
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
  if (event.target.dataset.productSearch !== undefined) {
    updateCheckoutField(event.target);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.checkoutField !== undefined) updateCheckoutField(event.target);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  if (form.dataset.action === "create-receipt") createReceipt(form);
  if (form.dataset.action === "receive-stock") receiveStock(form);
  if (form.dataset.action === "open-shift") openCashShift(form);
  if (form.dataset.action === "close-shift") closeCashShift(form);
});

render();
