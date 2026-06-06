# Retail B2C CRM Launcher

This launcher is the stable local entrypoint for the Retail B2C block.

## Default Link

Use:

```text
D:\Codex\CRM\retail-crm\Retail B2C CRM.cmd
```

It starts the server if needed, waits for `/api/health`, and opens:

```text
http://127.0.0.1:18810/index.html
```

When opened through `Retail B2C CRM.cmd`, the launcher stays open as a watchdog. Leave the launcher window running while using the CRM. If the health check stops responding, the watchdog starts the server again.

When a server is started, the launcher also opens a separate minimized server window.

The local launcher uses port `18810` because local `8790` was previously observed as unstable or occupied by another listener. MESER deployment can still use:

```text
http://192.168.0.5:8790/index.html
```

## Desktop Shortcut

Run in `Vikno 3 - lokalnyi` only when the owner wants a desktop icon:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Codex\CRM\retail-crm\create-retail-crm-desktop-shortcut.ps1"
```

This creates a normal Windows shortcut to `Retail B2C CRM.cmd`.

## Data And Logs

Default persistent data stays in:

```text
D:\Codex\CRM\retail-crm\data
```

Launcher/server logs are written there as:

```text
retail-crm-launcher.log
retail-crm-server.out.log
retail-crm-server.err.log
retail-crm-server-runner.cmd
```

Do not paste raw logs into chat. Share only short observed results.

## Custom Ports

For a one-off test:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Codex\CRM\retail-crm\launch-retail-crm.ps1" -Port 18811 -NoBrowser
```

For MESER/LAN-style startup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Codex\CRM\retail-crm\launch-retail-crm.ps1" -HostName 0.0.0.0 -Port 8790 -PublicHost 192.168.0.5
```
