# Retail B2C CRM Block

This document defines the current autonomous Retail B2C block before future changes.

## Identity

```text
Block ID: retail-b2c
Repo: D:\Codex\CRM\retail-crm
Stable local runtime: http://127.0.0.1:18810/index.html
Legacy/manual local runtime: http://127.0.0.1:8790/index.html
MESER runtime: http://192.168.0.5:8790/index.html
Current build: 20260606-b2c-login-session
App version: 2026.06.06.7
Contract version: 2026.06.06-retail-block-1
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
```

## Next API Layer

```text
POST /api/login
POST /api/logout
GET /api/products
GET /api/products/:id
GET /api/customers
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
Do not paste passwords, secrets, raw .env, raw logs or credentials.
```

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
Use stable local port 18810.
Open http://127.0.0.1:18810/index.html after health passes.
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
