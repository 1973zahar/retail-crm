@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch-retail-crm.ps1" -KeepOpen %*
endlocal
