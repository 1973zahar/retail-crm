"use strict";

const APP_VERSION = "2026.06.04.1";
const APP_BUILD = "20260604-retail-separate-1";
const STORAGE_KEY = "retail-crm-b2c-v1";

const today = new Date().toISOString().slice(0, 10);

const seedState = {
  currentView: "dashboard",
  products: [
    { id: "p-100", name: "Оптичний приціл R-Point", sku: "OPT-RPOINT", price: 5400, minStock: 3 },
    { id: "p-101", name: "Чохол транспортний 120 см", sku: "CASE-120", price: 2100, minStock: 5 },
    { id: "p-102", name: "Набір для догляду", sku: "CARE-KIT", price: 860, minStock: 8 }
  ],
  stock: [
    { productId: "p-100", qty: 8 },
    { productId: "p-101", qty: 12 },
    { productId: "p-102", qty: 18 }
  ],
  receipts: [
    {
      id: "B2C-0001",
      date: today,
      customer: "Роздрібний покупець",
      productId: "p-102",
      qty: 2,
      price: 860,
      total: 1720,
      paymentMethod: "card",
      status: "posted"
    }
  ],
  cashShifts: [
    { id: "SHIFT-001", date: today, cashier: "Каса магазину", opened: true, expected: 1720, actual: 1720 }
  ]
};

const navItems = [
  ["dashboard", "Панель"],
  ["checkout", "Новий чек"],
  ["receipts", "Чеки"],
  ["stock", "Залишки"],
  ["cash", "Каса/POS"]
];

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(seedState);
  } catch (error) {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function productById(id) {
  return state.products.find((product) => product.id === id) || state.products[0];
}

function stockQty(productId) {
  return state.stock.find((row) => row.productId === productId)?.qty || 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  const revenue = posted.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  const lowStock = state.products.filter((product) => stockQty(product.id) <= product.minStock).length;
  const openShift = state.cashShifts.find((shift) => shift.opened);
  setTitle("Панель магазину");
  return `
    <section class="grid four">
      <article class="card metric"><span>Виторг</span><strong>${formatMoney(revenue)}</strong><small>${posted.length} проведених чеків.</small></article>
      <article class="card metric"><span>Середній чек</span><strong>${formatMoney(posted.length ? revenue / posted.length : 0)}</strong><small>Тільки B2C роздріб.</small></article>
      <article class="card metric"><span>Низький залишок</span><strong>${lowStock}</strong><small>Позиції для поповнення магазину.</small></article>
      <article class="card metric"><span>Каса</span><strong>${openShift ? "Відкрита" : "Закрита"}</strong><small>${openShift ? openShift.id : "Немає активної зміни"}.</small></article>
    </section>
    ${renderCheckout()}
  `;
}

function renderCheckout() {
  setTitle("Новий чек магазину");
  return `
    <section class="panel">
      <div class="split">
        <h2>B2C.1 Новий чек</h2>
        <span class="pill good">окремий роздрібний блок</span>
      </div>
      <form class="form-grid" data-action="create-receipt">
        <label class="field wide"><span>Товар</span><select name="productId">${state.products.map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${escapeHtml(product.sku)} · ${formatMoney(product.price)}</option>`).join("")}</select></label>
        <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1" required></label>
        <label class="field"><span>Оплата</span><select name="paymentMethod"><option value="cash">Готівка</option><option value="card">Картка/POS</option><option value="bank">Банк</option></select></label>
        <label class="field wide"><span>Покупець</span><input name="customer" value="Роздрібний покупець"></label>
        <label class="field wide"><span>Коментар</span><input name="comment" placeholder="примітка до чека"></label>
        <button class="primary" type="submit">Створити і провести чек</button>
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
          <thead><tr><th>Чек</th><th>Дата</th><th>Покупець</th><th>Товар</th><th>К-сть</th><th>Сума</th><th>Оплата</th><th>Стан</th></tr></thead>
          <tbody>
            ${state.receipts.map((receipt) => {
              const product = productById(receipt.productId);
              return `<tr><td>${escapeHtml(receipt.id)}</td><td>${escapeHtml(receipt.date)}</td><td>${escapeHtml(receipt.customer)}</td><td>${escapeHtml(product.name)}</td><td>${receipt.qty}</td><td>${formatMoney(receipt.total)}</td><td>${escapeHtml(paymentLabel(receipt.paymentMethod))}</td><td><span class="pill good">проведено</span></td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStock() {
  setTitle("Залишки магазину");
  return `
    <section class="panel">
      <div class="split">
        <h2>B2C.3 Залишки</h2>
        <span class="pill">склад магазину</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>SKU</th><th>Товар</th><th>Залишок</th><th>Мінімум</th><th>Вартість</th><th>Стан</th></tr></thead>
          <tbody>
            ${state.products.map((product) => {
              const qty = stockQty(product.id);
              const low = qty <= product.minStock;
              return `<tr><td>${escapeHtml(product.sku)}</td><td>${escapeHtml(product.name)}</td><td><strong>${qty}</strong></td><td>${product.minStock}</td><td>${formatMoney(qty * product.price)}</td><td><span class="pill ${low ? "danger" : "good"}">${low ? "поповнити" : "доступно"}</span></td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCash() {
  setTitle("Каса та POS");
  const revenue = state.receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0);
  return `
    <section class="grid two">
      <article class="panel">
        <h2>B2C.4 Каса/POS</h2>
        <p class="muted">Окремий облік оплат роздрібного магазину.</p>
        <p><strong>${formatMoney(revenue)}</strong> очікуваний виторг за demo-даними.</p>
      </article>
      <article class="panel">
        <h2>Зміни</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Зміна</th><th>Дата</th><th>Касир</th><th>Очікувано</th><th>Факт</th><th>Стан</th></tr></thead>
            <tbody>${state.cashShifts.map((shift) => `<tr><td>${escapeHtml(shift.id)}</td><td>${escapeHtml(shift.date)}</td><td>${escapeHtml(shift.cashier)}</td><td>${formatMoney(shift.expected)}</td><td>${formatMoney(shift.actual)}</td><td><span class="pill ${shift.opened ? "warn" : "good"}">${shift.opened ? "відкрита" : "закрита"}</span></td></tr>`).join("")}</tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}

function paymentLabel(method) {
  return { cash: "Готівка", card: "Картка/POS", bank: "Банк" }[method] || method;
}

function createReceipt(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const product = productById(data.productId);
  const qty = Math.max(1, Number(data.qty || 1));
  const row = state.stock.find((item) => item.productId === product.id);
  if (!row || row.qty < qty) {
    alert("Недостатньо залишку для роздрібного чека.");
    return;
  }
  const receipt = {
    id: `B2C-${String(state.receipts.length + 1).padStart(4, "0")}`,
    date: today,
    customer: data.customer || "Роздрібний покупець",
    productId: product.id,
    qty,
    price: product.price,
    total: qty * product.price,
    paymentMethod: data.paymentMethod || "cash",
    status: "posted"
  };
  row.qty -= qty;
  state.receipts.unshift(receipt);
  const shift = state.cashShifts.find((item) => item.opened);
  if (shift) {
    shift.expected += receipt.total;
    shift.actual += receipt.total;
  }
  state.currentView = "receipts";
  saveState();
  render();
}

function render() {
  renderNav();
  const views = {
    dashboard: renderDashboard,
    checkout: renderCheckout,
    receipts: renderReceipts,
    stock: renderStock,
    cash: renderCash
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
  if (event.target.id === "reset-demo") {
    state = structuredClone(seedState);
    saveState();
    render();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  if (form.dataset.action === "create-receipt") createReceipt(form);
});

render();

