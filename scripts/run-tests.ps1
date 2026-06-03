# run-tests.ps1 — CI-friendly test runner for Demo A and Demo B (Windows / PowerShell).
#
# Usage:
#   pwsh scripts/run-tests.ps1
#
# Exit codes:
#   0 — all suites passed
#   1 — one or more suites failed

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Pass = 0
$Fail = 0

function Invoke-Suite {
  param(
    [string]$Name,
    [string]$Dir,
    [string[]]$Command
  )
  Write-Host ""
  Write-Host "──────────────────────────────────────────────" -ForegroundColor Cyan
  Write-Host "  Suite: $Name" -ForegroundColor Cyan
  Write-Host "  Dir  : $Dir" -ForegroundColor Cyan
  Write-Host "──────────────────────────────────────────────" -ForegroundColor Cyan
  Push-Location $Dir
  try {
    & $Command[0] @($Command | Select-Object -Skip 1)
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  ✓ PASSED: $Name" -ForegroundColor Green
      $script:Pass++
    } else {
      Write-Host "  ✗ FAILED: $Name (exit code $LASTEXITCODE)" -ForegroundColor Red
      $script:Fail++
    }
  } catch {
    Write-Host "  ✗ FAILED: $Name — $_" -ForegroundColor Red
    $script:Fail++
  } finally {
    Pop-Location
  }
}

# ── Demo A — Node built-in test runner ────────────────────────────────────────
Invoke-Suite `
  -Name "Demo A — query-cache (LRU + normalisation)" `
  -Dir  "$RepoRoot\src\demo-a-mcp-apps" `
  -Command @("node", "--import", "tsx/esm", "--test", "query-cache.test.ts")

Invoke-Suite `
  -Name "Demo A — resource-uri (content-hash URI resolution)" `
  -Dir  "$RepoRoot\src\demo-a-mcp-apps" `
  -Command @("node", "--import", "tsx/esm", "--test", "resource-uri.test.ts")

# ── Demo B — Vitest ───────────────────────────────────────────────────────────
Invoke-Suite `
  -Name "Demo B frontend — components + state + schemas (Vitest)" `
  -Dir  "$RepoRoot\src\demo-b-copilotkit\frontend" `
  -Command @("pnpm", "test")

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Results: $Pass passed, $Fail failed" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($Fail -gt 0) {
  exit 1
}
