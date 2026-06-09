# Retail B2C New Chat Start - 2026-06-09

Цей файл є точкою старту для нового чату по Retail B2C. Він не замінює
канонічні правила проєкту. Новий чат має прочитати правила першими.

## Copy This Into The New Chat

```text
Продовжуємо окремий Retail B2C / роздрібний магазин у репозиторії:
D:\Codex\CRM\retail-crm

GitHub:
1973zahar/retail-crm

Не чіпай marketplace-crm і B2B. Це окремий автономний B2C-блок у Odoo-like modular CRM.

Перед будь-якою роботою прочитай саме в цьому порядку:
1. D:\Codex\CRM\AGENTS.md
2. D:\Codex\CRM\docs\PROJECT_SHARED_RULES.md
3. D:\Codex\CRM\docs\PROJECT_SHARED_KNOWLEDGE_BASE.md
4. D:\Codex\CRM\docs\PROJECT_ACCESS_MAP.md
5. D:\Codex\CRM\docs\POSTGRESQL_LIVE_ARCHITECTURE_RECOMMENDATION.md
6. D:\Codex\CRM\retail-crm\B2C_HANDOFF_2026-06-06.md
7. D:\Codex\CRM\retail-crm\NEW_CHAT_START_RETAIL_B2C_2026-06-09.md
8. D:\Codex\CRM\retail-crm\logs\B2C_WORK_LOG_2026-06-06.md
9. D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md latest relevant Retail B2C lines

Усі дії, запити, відповіді, команди, результати, кодові зміни, перевірки,
commits і push записуй у два логи:
1. D:\Codex\CRM\retail-crm\logs\B2C_WORK_LOG_2026-06-06.md
2. D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md

Window map:
- Вікно 1 / Ubuntu = crmadmin@192.168.0.166, path ~/SQL, PostgreSQL crm_hub, SQL API :3000.
- Вікно 2 / MESER = Windows Server 192.168.0.5, user fresh\zahar, Retail B2C host.
- Вікно 3 / локальний = local Windows, workspace D:\Codex\CRM.

Поточна Retail B2C версія:
- build: 20260608-b2c-lan-only-launcher
- app version: 2026.06.08.5
- releasedAt: 2026-06-08 20:40:22 +03:00

Поточна основна MESER адреса:
http://192.168.0.5:8790/index.html

Health:
http://192.168.0.5:8790/api/health

Остання підтверджена MESER health відповідь:
- ok: True
- mode: server-powershell
- build: 20260608-b2c-lan-only-launcher
- appVersion: 2026.06.08.5
- crmSqlApiBaseUrl: http://192.168.0.166:3000
- publicBaseUrl: http://192.168.0.5:8790
- dataDir: D:\Codex\CRM\retail-crm\data

Почни з Вікно 3 - локальний:
cd D:\Codex\CRM\retail-crm
git status --short --branch

Перевір MESER:
Invoke-RestMethod -Uri http://192.168.0.5:8790/api/health -TimeoutSec 10

Перевір entrypoint:
$r = Invoke-WebRequest -UseBasicParsing -Uri 'http://192.168.0.5:8790/index.html' -TimeoutSec 10
if ($r.Content -match 'app\.js\?v=([^"'']+)') { $matches[1] } else { 'no-build' }

Після будь-яких code changes перевіряй:
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
git diff --check
Invoke-WebRequest -UseBasicParsing -Uri 'http://192.168.0.5:8790/index.html' -TimeoutSec 10

Після завершення роби commit і push у 1973zahar/retail-crm.
Якщо push успішний, зроби окремий log-only commit з результатом push.
Не stage README.md або AGENTS.md, якщо вони мають чужі зміни і це не твоя задача.
```

## Current Runtime Facts

- Local repo: `D:\Codex\CRM\retail-crm`
- Branch: `main`
- GitHub repo: `1973zahar/retail-crm`
- MESER deploy path: `D:\Codex\CRM\retail-crm`
- MESER scheduled task: `Retail B2C CRM`
- MESER URL: `http://192.168.0.5:8790/index.html`
- MESER health: `http://192.168.0.5:8790/api/health`
- Current build: `20260608-b2c-lan-only-launcher`
- Current app version: `2026.06.08.5`
- Version timestamp: `2026-06-08 20:40:22 +03:00`
- SQL API base: `http://192.168.0.166:3000`

Local LAN launcher may print an operator URL like:

```text
http://192.168.4.14:18810/index.html
```

That local URL is for LAN testing from the current local Windows machine. The stable MESER
URL for operators is:

```text
http://192.168.0.5:8790/index.html
```

## Architecture Rules

Retail B2C is one autonomous CRM block. It must not copy the full database into
browser memory.

Source of truth:

```text
1C on MESER
  -> CSV / exchange
  -> Ubuntu PostgreSQL crm_hub
  -> one_c_mirror SQL views/read models
  -> SQL API http://192.168.0.166:3000
  -> Retail B2C backend/proxy
  -> B2C UI bounded pages/search
```

Mandatory live-data rules:

- Products, prices, stock, warehouses, serial numbers and 1C counterparties come from SQL/live API.
- UI never loads all products, all stock, all clients or all serials.
- Use `search`, `limit`, `offset`, filters and the standard paged envelope.
- Browser localStorage/seed data is fallback/demo only, not production source of truth.
- Browser must not connect directly to PostgreSQL.
- B2C must not write directly to `one_c_mirror.*` or 1C.
- CRM documents/events must go through CRM-owned tables/events/outbox/export queues.
- 1C write-back needs separate approval and must use export queue/outbox, not direct browser write.

## Live SQL API Contracts Used By Retail B2C

Current base:

```text
http://192.168.0.166:3000
```

Retail B2C backend endpoints/proxies:

```text
GET /api/live/products?search=&limit=&offset=
GET /api/live/product-prices?search=&limit=&offset=
GET /api/live/counterparties?search=&limit=&offset=
GET /api/live/warehouses?search=&limit=&offset=
GET /api/live/stock-balances?warehouseCode=2&search=&limit=&offset=
GET /api/live/serial-stock?productCode=<required>&warehouseCode=2&limit=20&offset=0
```

Direct SQL API equivalents:

```text
GET /products?search=&limit=&offset=
GET /one-c-mirror/warehouses?search=&limit=&offset=
GET /one-c-mirror/stock-balances?productCode=&warehouseCode=&search=&limit=&offset=
GET /one-c-mirror/counterparty-balances?counterpartyCode=&search=&limit=&offset=
GET /one-c-mirror/serial-stock?productCode=<required>&warehouseCode=&limit=&offset=
GET /one-c-mirror/serials?productCode=<required>&warehouseCode=&limit=&offset=
GET /one-c-mirror/serial-stock-summary?productCode=<required>&warehouseCode=&limit=&offset=
```

Standard expected response shape:

```json
{
  "data": [],
  "rows": [],
  "count": 0,
  "total": 0,
  "limit": 100,
  "offset": 0,
  "hasMore": false,
  "nextOffset": null,
  "nextCursor": null
}
```

Serial-stock contract:

- `productCode` is required.
- Missing `productCode` must return HTTP 400 with code `SERIAL_PRODUCT_REQUIRED`.
- Serial numbers are fetched only after choosing a concrete product.
- Prefer `warehouseCode=2` for Retail Warehouse 1 / `Склад №1`.
- For weapon goods, sale/save is blocked until an available live `serialNumber` is selected.

## Retail Warehouse Rules

Retail Warehouse 1:

```text
warehouse_name = Склад №1
warehouse_code = 2
```

POS product dropdown:

- search via bounded live stock lookup;
- show only products with positive stock on `warehouseCode=2`;
- do not fall back to local/demo product list in server mode when live search returns zero rows.

Stock directory:

- `Довідники -> Залишки` reads live stock from `/api/live/stock-balances?warehouseCode=2...`.
- Show Warehouse 1, wholesale warehouse and total stock where data exists.
- Do not render stock directory from local demo rows in production/server mode.

Serial directory:

- `Довідники -> Залишки -> Серійні номери` appears only after selecting a product from category/path `Зброя`.
- No full serial directory load.

## Multi-User Rules

Retail B2C is multi-user. Shared business state may sync, but per-user working state must stay local.

Do not write these into shared `/api/state`:

- current screen/view;
- active employee session;
- selected cashier;
- checkout draft;
- selected customer/product in a draft;
- confirmation modals;
- live table page cache;
- stock/serial lookup UI state;
- inventory draft.

Multiple operators must be able to work in parallel without one browser switching to another
operator's screen or draft.

## MESER Deployment And Autostart

MESER permanent task:

```text
Retail B2C CRM
```

Normal remote credential flow from Window 3:

```powershell
$cred = Import-Clixml "$env:USERPROFILE\.ssh\meser-fresh-zahar.credential.xml"
Invoke-Command -ComputerName 192.168.0.5 -Credential $cred -ScriptBlock { hostname; Get-Location }
```

If saved credential is missing/broken, ask the owner to recreate it through the OS prompt:

```powershell
$cred = Get-Credential "fresh\zahar"
$cred | Export-Clixml "$env:USERPROFILE\.ssh\meser-fresh-zahar.credential.xml"
```

Do not ask for or log the raw password.

Deploy current local Retail B2C to MESER from Window 3:

```powershell
cd D:\Codex\CRM\retail-crm
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\deploy-remote.ps1 -ComputerName 192.168.0.5 -Credential $cred -RemotePath D:\Codex\CRM\retail-crm -Port 8790 -PublicHost 192.168.0.5 -IncludeBundledNode
```

Start/restart task:

```powershell
Invoke-Command -ComputerName 192.168.0.5 -Credential $cred -ScriptBlock { schtasks /Run /TN "Retail B2C CRM" }
```

If health still returns an old build after deployment, first inspect the process on port 8790:

```powershell
Invoke-Command -ComputerName 192.168.0.5 -Credential $cred -ScriptBlock { cmd /c "netstat -ano | findstr :8790" }
Invoke-Command -ComputerName 192.168.0.5 -Credential $cred -ScriptBlock { Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object ProcessId,Name,CommandLine }
```

Only if the command line is confirmed as:

```text
D:\Codex\CRM\retail-crm\start-server.ps1 ... -Port 8790 ...
```

then stop that specific old Retail B2C PID and rerun the scheduled task:

```powershell
Invoke-Command -ComputerName 192.168.0.5 -Credential $cred -ScriptBlock { Stop-Process -Id <PID> -Force }
Invoke-Command -ComputerName 192.168.0.5 -Credential $cred -ScriptBlock { schtasks /Run /TN "Retail B2C CRM" }
```

Known confirmed old PID incident:

```text
2026-06-09: PID 6336 kept serving old build 20260606-b2c-server-mvp.
Command line was verified as Retail B2C start-server.ps1 on port 8790.
Stopping PID 6336 and rerunning the scheduled task loaded build 20260608-b2c-lan-only-launcher.
```

## Verification Commands

Window 3 - local:

```powershell
cd D:\Codex\CRM\retail-crm
git status --short --branch
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
git diff --check
Invoke-RestMethod -Uri http://192.168.0.5:8790/api/health -TimeoutSec 10
$r = Invoke-WebRequest -UseBasicParsing -Uri 'http://192.168.0.5:8790/index.html' -TimeoutSec 10
if ($r.Content -match 'app\.js\?v=([^"'']+)') { $matches[1] } else { 'no-build' }
```

Expected current MESER build:

```text
20260608-b2c-lan-only-launcher
```

Expected current health:

```text
ok: True
mode: server-powershell
appVersion: 2026.06.08.5
build: 20260608-b2c-lan-only-launcher
crmSqlApiBaseUrl: http://192.168.0.166:3000
publicBaseUrl: http://192.168.0.5:8790
```

Window 1 - Ubuntu SQL API serial checks:

```bash
curl -sS -i 'http://127.0.0.1:3000/one-c-mirror/serial-stock?limit=1' | head -40
curl -sS 'http://127.0.0.1:3000/one-c-mirror/serial-stock?productCode=8600167&limit=3&offset=0'
```

Expected:

```text
First command: HTTP 400 SERIAL_PRODUCT_REQUIRED.
Second command: HTTP 200 with serialName/serialNumber rows.
```

## Current Git Safety Notes

Recent pushed commits:

```text
bf5beda Log Retail B2C MESER deploy push
f03a9d1 Log Retail B2C MESER deploy
2a4f5ba Log Retail B2C LAN-only launcher push
ad155fe Make Retail B2C launcher LAN-only
89d7ab0 Log Retail B2C multi-user UI push
192b361 Isolate Retail B2C multi-user UI state
```

Before staging, always check:

```powershell
git status --short --branch
git diff --name-only
```

Known caution from 2026-06-09:

```text
README.md and AGENTS.md may have user/pre-existing changes.
Do not revert or stage them unless the current task explicitly owns those files.
```

## Next Work Should Continue From Here

Safe next areas:

- verify B2C UI on MESER URL with several operators;
- improve live B2C backend/TypeScript service layer over SQL API;
- continue stock-backed product selection and serial enforcement;
- improve clients/counterparties screen with bounded search/pagination;
- keep MESER autostart stable and logged;
- move toward PostgreSQL-backed CRM-owned document/outbox tables.

Do not restart from scratch. Do not replace the B2C app with another CRM/login page.
