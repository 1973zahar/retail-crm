param(
  [string]$ShortcutName = "Retail B2C CRM.lnk"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetPath = Join-Path $ScriptDir "Retail B2C CRM.cmd"

if (-not (Test-Path -LiteralPath $TargetPath)) {
  throw "Cannot find launcher command file at $TargetPath"
}

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath $ShortcutName

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "Start and open Retail B2C CRM"
$Shortcut.Save()

Write-Host "Desktop shortcut created: $ShortcutPath"
