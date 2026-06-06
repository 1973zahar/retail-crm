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

Поточний build: 20260606-b2c-server-mvp, app version 2026.06.06.6.

Поточний напрям: перша реальна server-backed багатокористувацька B2C-програма із зовнішнім доступом через 192.165.0.5, Node.js server.mjs, API /api/state та /api/settings, збереженням даних у data/ на сервері й блоком "Налаштування".

Основні правила:
- товари, ціни, залишки, серійні номери і надходження тільки через SQL-імпорт з one_c_mirror;
- імпорт і експорт тільки через блок "Обмін даними";
- у довідниках не показувати блоки запуску імпорту;
- клієнтів можна створювати в B2C через "Клієнти і лояльність", вони мають очікувати експорт у one_c_mirror.b2c_counterparties_export_queue;
- ролі мають керувати видимістю блоків і діями.

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
