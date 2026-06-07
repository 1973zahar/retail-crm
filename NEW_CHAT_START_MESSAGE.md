# Повідомлення для старту нового чату

Скопіюй і встав це в новий чат:

```text
Продовжуємо окремий B2C/роздрібний магазин у репозиторії D:\Codex\CRM\retail-crm, GitHub: 1973zahar/retail-crm.

Не чіпай marketplace-crm і B2B. Це окремий блок B2C.

Спочатку прочитай:
1. B2C_HANDOFF_2026-06-06.md
2. README.md
3. logs/B2C_WORK_LOG_2026-06-06.md

Усі дії, запити, відповіді, команди, результати, кодові зміни, перевірки, commits і push записуй у B2C log.

Поточний build: 20260607-b2c-weapon-serials, app version 2026.06.07.5, released at 2026-06-07 14:49:18 +03:00.

Поточний напрям: live PostgreSQL/Odoo-like архітектура: PostgreSQL crm_hub як shared source of truth, backend API/model layer для permissions/transactions/pagination/audit, frontend тільки bounded view/cache. POS product scan/search вже має backend-first slice через GET /api/products?search=&barcode=&limit=20&offset=0 з явним fallback local/demo.

Основні правила:
- товари, ціни, залишки, серійні номери і надходження тільки через SQL-імпорт з one_c_mirror;
- імпорт і експорт тільки через блок "Обмін даними";
- у довідниках не показувати блоки запуску імпорту;
- клієнтів можна створювати в B2C через "Клієнти і лояльність", вони мають очікувати експорт у one_c_mirror.b2c_counterparties_export_queue;
- ролі мають керувати видимістю блоків і діями.
- не вантажити всю базу в браузер; для товарів/клієнтів/залишків/балансів використовувати backend endpoints з search, limit, offset і filters.
- у футері версії `Дата/час версії` є фіксованою датою/часом створення app version, не живим годинником.
- `Сеанс` і `Сервер` показуються у верхній панелі сторінки, не в лівому меню.
- у `Довідники -> Залишки` серійні номери підтягувати/показувати тільки після вибору товару з категорії/шляху `Зброя`.

Перед роботою виконай:
cd D:\Codex\CRM\retail-crm
git status --short --branch

Після змін перевіряй:
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
git diff --check
http://127.0.0.1:8790/index.html

Після завершення роби commit і push у 1973zahar/retail-crm, а потім окремий log-only commit з результатом push.

Почни з перевірки стану репозиторію і підтверди, що продовжуєш саме з B2C_HANDOFF_2026-06-06.md.
```
