# Day 26 - rehearsal rollback ung dung: build BE o commit truoc (HEAD~1) trong worktree rieng, smoke, don dep.
# Mac dinh chi IN ke hoach. Them -Execute de chay that. Khong dung vao ban dang chay o cong 3000.
param([switch]$Execute, [string]$Port = '3100')

$ErrorActionPreference = 'Stop'
$dayRoot  = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $dayRoot '..\..')).Path
$target   = (git -C $repoRoot rev-parse HEAD~1).Trim()
$current  = (git -C $repoRoot rev-parse HEAD).Trim()
$wt       = Join-Path (Split-Path -Parent $repoRoot) 'rollback-rehearsal-wt'
$beDir    = Join-Path $wt 'learning-hub\BE'
$beEnv    = Join-Path $repoRoot 'learning-hub\BE\.env'
$logPath  = Join-Path $dayRoot 'evidence\logs\rollback-app.log'

Write-Host "Hien tai : $current"
Write-Host "Rollback : $target (HEAD~1)"
Write-Host "Worktree : $wt"
Write-Host "Cong     : $Port"
Write-Host @"
Cac buoc:
 1. git worktree add <worktree> HEAD~1
 2. copy .env cua BE vao worktree (neu co)
 3. npm ci va npm run build trong BE cua worktree
 4. chay BE o cong $Port, GET /api/health
 5. dung tien trinh, git worktree remove
"@
if (-not $Execute) { Write-Host 'Chua chay (thieu -Execute).'; return }

New-Item -ItemType Directory -Force -Path (Split-Path $logPath) | Out-Null
"Rollback rehearsal $(Get-Date -Format s) from $current to $target" | Set-Content -LiteralPath $logPath -Encoding UTF8
$proc = $null
try {
  git -C $repoRoot worktree add $wt $target *>> $logPath
  if (Test-Path $beEnv) { Copy-Item $beEnv (Join-Path $beDir '.env') }
  Push-Location $beDir
  cmd /c "npm ci >> `"$logPath`" 2>&1"; if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
  cmd /c "npm run build >> `"$logPath`" 2>&1"; if ($LASTEXITCODE -ne 0) { throw 'build failed' }
  $env:PORT = $Port
  $proc = Start-Process -FilePath 'node' -ArgumentList 'dist/main.js' -PassThru -WindowStyle Hidden
  Start-Sleep -Seconds 8
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -UseBasicParsing -TimeoutSec 15
  "HEALTH $($r.StatusCode) $($r.Content)" | Add-Content -LiteralPath $logPath -Encoding UTF8
  if ($r.StatusCode -eq 200) { Write-Host 'ROLLBACK APP: PASS' } else { Write-Host 'ROLLBACK APP: FAIL'; exit 1 }
}
catch { "ERROR $($_.Exception.Message)" | Add-Content -LiteralPath $logPath -Encoding UTF8; Write-Host "ROLLBACK APP: FAIL - $($_.Exception.Message)"; $failed = $true }
finally {
  Pop-Location -ErrorAction SilentlyContinue
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  git -C $repoRoot worktree remove --force $wt 2>$null
}
if ($failed) { exit 1 }
