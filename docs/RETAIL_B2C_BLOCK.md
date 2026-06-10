# Retail B2C CRM Block

This document defines the current autonomous Retail B2C block before future changes.

## Identity

```text
Block ID: retail-b2c
Repo: D:\Codex\CRM\retail-crm
Stable LAN runtime: http://<LAN-IP>:18810/index.html
Legacy/manual local runtime: internal diagnostics only, not the working URL
MESER runtime: http://192.168.0.5:8790/index.html
Current build: 20260610-b2c-shared-session-auth-large-state
App version: 2026.06.10.9
Released at: 2026-06-10 21:13:22 +03:00
Contract version: 2026.06.07-retail-live-api-1
```

## Architecture

This block is one autonomous module in the Odoo-like modular CRM.

```text
1C / MESER
  -> CSV export
  -> PostgreSQL SQL core
  -> one_c_mirror SQL views
  -> Retail B2C CRM block
  -> outbox/export queues for approved writes
```

The block owns retail workflows, not master data. Product, price, stock, serial number, receipt and 1C-origin facts come from the SQL core.

`Панель` and `Продаж` are one Retail B2C working screen. The separate dashboard/sidebar block is removed; old `dashboard`, `checkout`, `receipts` and `cash` view ids resolve to `pos`. The `Продаж` screen is the first/default view and contains the shift/cashier/sales/revenue cards, checkout, receipt list and cash shift controls.

Retail sale prices are currency-aware. B2C must not treat SQL numeric currency codes as UAH by default: `980=UAH`, `978=EUR`, `840=USD`. When a selected sale price has one foreign currency, the backend downloads official NBU exchange rates through `/api/live/exchange-rates` and the POS stores the sale line price in UAH together with source currency, source price, exchange rate and exchange-rate date. Product add is not blocked solely because the initial price/currency choice is ambiguous, missing, or waiting for a rate: the product is inserted into the checkout line with a warning and the attached price options. Employees whose role has the `price_select` action can choose the concrete attached price from that checkout row; other roles cannot change the line price selector. If SQL currently returns an aggregated product summary such as one `priceTypes` comma-list and mixed `priceCurrencies`, the POS splits that summary into separate attached-price options instead of rendering one unusable long option.

Retail sale line discount is a percent field in the invoice/cart, not an absolute UAH amount. The checkout row stores `discount`/`discountPercent` as 0-100 and calculates the line total as `quantity * price * (1 - discountPercent / 100)`. Receipt print details show the percent discount per line when it is applied.

B2C.10 employee cards can be edited from the employee row/card click path when the current role has `employee_edit` or `employee_manage`. The role matrix exposes `Працівники: зміна всіх полів`; that permission allows editing all employee card fields: code, name, role, status, phone, email, login, PIN, store, schedule, hire date and note. Creating employees and role-matrix administration remain under the broader `employee_manage` action.

Retail sale product selection reads Warehouse 1 stock through bounded live endpoints. The POS product autocomplete uses `/api/live/stock-balances?warehouseCode=2&search=&limit=&offset=` and shows only products with a positive `Склад №1` balance; in server mode it must not fall back to the local/demo full product list when live stock search returns zero rows. After a product is selected, the sale line reloads product-scoped stock by `productCode` and `warehouseCode`. Serial numbers are fetched only after a concrete weapon product is selected through `/api/live/serial-stock?productCode=&warehouseCode=2&limit=20&offset=`; `productCode` is required, and weapon rows require one available live serial number before a sale can be posted.

The inventory button `Додати всі товари із залишками` uses the selected live warehouses in server mode. The operator can select one or multiple warehouses above the inventory sheet; Retail B2C reads `/api/live/stock-balances?warehouseCode=<selected>&limit=100&offset=...` page by page for every selected warehouse, then creates or updates inventory draft rows keyed by product + warehouse + optional serial number. Serialized product candidates are expanded through product-scoped `/api/live/serial-stock?productCode=&warehouseCode=&limit=100&offset=...`, so each serial number appears as its own row under the product instead of being merged into one aggregate product row. The browser still does not load a full serial directory.

Retail sale customer selection reads SQL counterparties through bounded live endpoints. The POS customer autocomplete uses `/api/live/counterparties?search=&limit=20&offset=0`; B2C stores only the selected SQL customer card for receipts and does not import the full client directory into browser memory. The client screen shows SQL live counterparties first with search/pagination and keeps local B2C-created/export-pending cards in a separate cache table.

When a customer is selected from the POS datalist, the exact option value is resolved and persisted before starting any new live search. The customer field must keep the selected SQL customer and must not repaint back to the previous `customerId` while a live lookup is refreshing.

The stock directory screen reads real Warehouse 1 balances through `/api/live/stock-balances?warehouseCode=2&search=&sort=&direction=&limit=&offset=`. Operators can collapse/expand the list, sort by every visible stock column, and choose 20 / 50 / 100 / all rows. The explicit all-rows mode is capped at 5000 rows and is handled by the Retail backend by paging SQL API stock rows in 500-row chunks before returning the selected response. Local/demo `state.stock` rows must not be the visible source-of-truth table in `Довідники -> Залишки`; they are only fallback/demo data for offline prototype flows.

Multi-user server sync stores shared business state plus the minimal `employeeSessions` registry used to enforce one active computer per employee. Browser-local UI and draft state stays local per operator/session: current screen, selected cashier, selected document row, checkout draft, confirm modals, drilldowns, live table pages, stock serial lookup page and inventory draft must not be written back as another user's global `/api/state`.

One employee can own an active B2C session on only one browser device/computer at a time. Logging in with the employee password/PIN from a second computer replaces the previous employee session. The previous computer detects the replacement on the next server refresh, clears its local employee session, and opens the login dialog without deleting the new session from the server.

Current migration direction:

```text
PostgreSQL crm_hub = shared durable source of truth
Backend API/model layer = permissions, transactions, pagination and audit
Frontend = bounded interactive view/cache only
```

The browser must not load full products, stock, serials, customers, balances or orders as production data. Large lists must be read through backend endpoints with `search`, `limit`, `offset` and filters. Retail B2C now has live reference tables for products, prices, counterparties/customers and warehouses through its own backend proxy over the CRM SQL API. The current local `server-json` responses are fallback/demo only.

Large reference responses must use the standard paged envelope:

```json
{
  "data": [],
  "limit": 100,
  "offset": 0,
  "total": 12345,
  "hasMore": true,
  "nextOffset": 100
}
```

Retail B2C also keeps `items` as a backward-compatible alias for existing UI code, but new code should read `data`.

The sidebar version footer shows fixed release/build metadata. `Дата/час версії` is the creation timestamp of the app version, not a live clock. Session and server status belong to the top page bar, while the sidebar is navigation-only plus the version footer.

In `Довідники -> Залишки`, serial numbers are gated by product category. The serial-number table stays empty until a user selects a product from category/path `Зброя`; non-weapon products must not trigger serial-number loading or display. After selection the screen reads only the current live SQL page from `/api/live/serial-stock` with `warehouseCode=2`; local/demo serial rows are not a fallback for this screen.

## Owned Workflows

```text
Retail sales
Returns
Customers and loyalty
Cashier shifts
Retail inventory workflows
Employee login sessions
Role visibility and action permissions
Settings
Data Exchange UI
Audit log
Outbox/export queues
```

## SQL Core Inputs

```text
one_c_mirror.crm_products
one_c_mirror.crm_products_enriched
one_c_mirror.crm_product_prices
one_c_mirror.crm_product_price_summary
one_c_mirror.crm_stock_balances
one_c_mirror.crm_warehouses
one_c_mirror.crm_serial_stock_current
one_c_mirror.crm_serial_stock_by_serial
one_c_mirror.crm_serial_stock_summary
one_c_mirror.crm_counterparties
one_c_mirror.crm_counterparty_contracts
one_c_mirror.crm_counterparty_settlements
one_c_mirror.crm_counterparty_balance_summary
```

Retail warehouse rule:

```text
warehouse_code = 2
warehouse_name = Склад №1
```

The UI must still show other warehouses separately:

```text
stock_on_retail_warehouse
stock_on_other_warehouses
stock_total_all_warehouses
serials_by_warehouse
```

## Outbound Queues

Current approved queue:

```text
one_c_mirror.b2c_counterparties_export_queue
```

Future queues:

```text
one_c_mirror.b2c_sales_export_queue
one_c_mirror.b2c_returns_export_queue
```

## Current API

```text
GET /api/health
GET /api/bootstrap
GET /api/state
PUT /api/state
GET /api/settings
PUT /api/settings
GET /api/live/products?search=&limit=&offset=
GET /api/live/product-prices?search=&limit=&offset=
GET /api/live/exchange-rates?currency=&force=
GET /api/live/counterparties?search=&limit=&offset=
GET /api/products?search=&barcode=&limit=&offset=
GET /api/products/:id
GET /api/customers?search=&limit=&offset=
GET /api/clients?search=&limit=&offset=
GET /api/stock-balances?productId=&warehouseId=&limit=&offset=
GET /api/warehouses?search=&limit=&offset=
```

## Next API Layer

```text
POST /api/login
POST /api/logout
POST /api/customers
GET /api/sales
POST /api/sales
GET /api/returns
POST /api/returns
GET /api/exchange/jobs
POST /api/exchange/jobs
GET /api/audit
```

## Hard Rules

```text
Do not touch marketplace-crm or B2B from this block.
Do not expose import/export launch controls outside Data Exchange.
Do not show import launch blocks inside directories.
Do not switch workers through sidebar selectors; use login/logout sessions.
Do not manually create products, prices, stock balances, serial numbers or receipts.
Do not duplicate SQL core master data as the local source of truth.
Do not load full product, stock, serial, customer, balance or order tables into browser state as production data.
Do not show or fetch serial numbers in the Stock reference screen until a selected product belongs to category/path `Зброя`.
Do not sync per-operator UI/draft state as shared server state in multi-user mode.
Do not paste passwords, secrets, raw .env, raw logs or credentials.
```

## First Live API Slice

Retail POS product scan/search now uses a backend-first bounded lookup:

```text
GET /api/products?search=<text>&barcode=<code>&limit=20&offset=0
```

The POS product datalist renders only the current bounded result set. If the backend is unavailable, the UI shows an explicit `Fallback local/demo` status and uses the local demo/server-state data only as a fallback, not as production source of truth.

## Live Reference Tables

`Довідники -> Товари` now shows:

```text
SQL live товари: GET /api/live/products?search=&limit=&offset=
SQL live ціни: GET /api/live/product-prices?search=&limit=&offset=
SQL live курси: GET /api/live/exchange-rates?currency=&force=
```

`Довідники -> Клієнти і лояльність` now keeps B2C-created clients separately and shows 1C/SQL counterparties through:

```text
GET /api/live/counterparties?search=&limit=&offset=
```

Operators see all accessible products, prices and counterparties by search plus Next/Back paging. The UI never requests a full table dump.

## Performance Rules

The program must load quickly, exchange data quickly, and expose all normal business information in the UI.

Implementation direction:

```text
Use a fast bootstrap endpoint for initial load.
Use server-side search, filtering and paging for large lists.
Use revision-based incremental sync instead of full reload where possible.
Use background import/export jobs with visible progress.
Keep the UI responsive during exchange.
Expose product, price, stock, serial, customer, sale, return, exchange, audit and settings facts in screens.
Do not make users inspect raw SQL, CSV, logs or scripts during normal work.
```

## Stable Launcher

The permanent local launcher is:

```text
D:\Codex\CRM\retail-crm\Retail B2C CRM.cmd
```

It wraps:

```text
D:\Codex\CRM\retail-crm\launch-retail-crm.ps1
```

Default behavior:

```text
Start server if /api/health is not ready.
Bind to 0.0.0.0 and use stable LAN port 18810.
Auto-detect LAN IPv4 unless -PublicHost is provided.
Open http://<LAN-IP>:18810/index.html after health passes.
Keep Retail B2C CRM.cmd open as a launcher watchdog.
Keep persistent data in D:\Codex\CRM\retail-crm\data.
Write launcher/server logs under data without exposing raw logs in chat.
```

Desktop shortcut helper:

```text
D:\Codex\CRM\retail-crm\create-retail-crm-desktop-shortcut.ps1
```

## Block Manifest

Machine-readable block metadata lives at:

```text
D:\Codex\CRM\retail-crm\block.manifest.json
```

Future generated OpenAPI and JSON Schema contracts should reference this block ID:

```text
retail-b2c
```
