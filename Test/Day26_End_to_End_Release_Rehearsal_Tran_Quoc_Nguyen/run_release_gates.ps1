# Day 26 - chay cac gate release va ghi log, thoi gian, ket qua tung gate.
# Khong tu retry. Moi FAIL/BLOCKED duoc giu nguyen trong CSV.
# Smoke chi chay khi dung -IncludeSmoke va BE (3000), FE preview (4173) da duoc bat san theo RUNBOOK muc 7.
param([switch]$IncludeSmoke)

$ErrorActionPreference = 'Continue'
$dayRoot  = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $dayRoot '..\..')).Path
$hub      = Join-Path $repoRoot 'learning-hub'
$logRoot  = Join-Path $dayRoot 'evidence\logs'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

$gates = @(
  @{ Id='preflight-commit';  Dir=$repoRoot; Cmd='git rev-parse HEAD';          OnFail='FAIL' },
  @{ Id='preflight-status';  Dir=$repoRoot; Cmd='git status --short';          OnFail='FAIL' },
  @{ Id='fe-build';          Dir=(Join-Path $hub 'FE'); Cmd='npm run build';   OnFail='FAIL' },
  @{ Id='be-build';          Dir=(Join-Path $hub 'BE'); Cmd='npm run build';   OnFail='FAIL' },
  @{ Id='fe-test';           Dir=(Join-Path $hub 'FE'); Cmd='npm test';        OnFail='FAIL' },
  @{ Id='be-test';           Dir=(Join-Path $hub 'BE'); Cmd='npm test -- --runInBand'; OnFail='FAIL' },
  @{ Id='content-lint';      Dir=(Join-Path $repoRoot 'Test\Day11_Content_Lint_Tran_Quoc_Nguyen\tools\content-lint'); Cmd='node --test tests\content-lint.test.js'; OnFail='FAIL' },
  @{ Id='ai-eval';           Dir=(Join-Path $hub 'BE'); Cmd='npm run eval:coach'; OnFail='FAIL' },
  @{ Id='data-ai-pytest';    Dir=(Join-Path $repoRoot 'Data-AI-Resource\BaoCao_Task24'); Cmd='py -m pytest tests -v'; OnFail='FAIL' },
  @{ Id='docker-info';       Dir=$hub; Cmd='docker info';                      OnFail='BLOCKED' },
  @{ Id='docker-compose-ps'; Dir=$hub; Cmd='docker compose ps';                OnFail='BLOCKED' }
)

$results = @()
$total = [System.Diagnostics.Stopwatch]::StartNew()

foreach ($g in $gates) {
  $log = Join-Path $logRoot ($g.Id + '.log')
  $start = Get-Date
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  Push-Location $g.Dir
  # cmd /c gop stdout+stderr vao log, tranh canh bao do NativeCommandError cua PowerShell
  cmd /c "$($g.Cmd) > `"$log`" 2>&1"
  $code = $LASTEXITCODE
  Pop-Location
  $sw.Stop()
  $status = if ($code -eq 0) { 'PASS' } else { $g.OnFail }
  $results += [PSCustomObject]@{
    Gate=$g.Id; Command=$g.Cmd; Start=$start.ToString('yyyy-MM-dd HH:mm:ss');
    DurationSeconds=[Math]::Round($sw.Elapsed.TotalSeconds,2); ExitCode=$code; Status=$status;
    Log=('evidence\logs\' + $g.Id + '.log')
  }
  Write-Host ("{0,-18} {1,-8} {2,8}s exit={3}" -f $g.Id, $status, [Math]::Round($sw.Elapsed.TotalSeconds,2), $code)
}

if ($IncludeSmoke) {
  $smokes = @(
    @{ Id='smoke-be'; Url='http://127.0.0.1:3000/api/health'; Must='"mongo"' },
    @{ Id='smoke-fe'; Url='http://127.0.0.1:4173/';           Must='id="root"' }
  )
  foreach ($s in $smokes) {
    $log = Join-Path $logRoot ($s.Id + '.log')
    $start = Get-Date
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $code = 0; $status = 'FAIL'
    try {
      $r = Invoke-WebRequest -Uri $s.Url -UseBasicParsing -TimeoutSec 15
      $code = [int]$r.StatusCode
      ("HTTP {0}`n{1}" -f $code, $r.Content.Substring(0, [Math]::Min(600, $r.Content.Length))) | Set-Content -LiteralPath $log -Encoding UTF8
      if ($code -eq 200 -and $r.Content.Contains($s.Must)) { $status = 'PASS' }
    } catch {
      ("ERROR: {0}" -f $_.Exception.Message) | Set-Content -LiteralPath $log -Encoding UTF8
      $code = -1
    }
    $sw.Stop()
    $results += [PSCustomObject]@{
      Gate=$s.Id; Command=('GET ' + $s.Url); Start=$start.ToString('yyyy-MM-dd HH:mm:ss');
      DurationSeconds=[Math]::Round($sw.Elapsed.TotalSeconds,2); ExitCode=$code; Status=$status;
      Log=('evidence\logs\' + $s.Id + '.log')
    }
    Write-Host ("{0,-18} {1,-8} {2,8}s http={3}" -f $s.Id, $status, [Math]::Round($sw.Elapsed.TotalSeconds,2), $code)
  }
}

$total.Stop()
$csv = Join-Path $dayRoot 'evidence\gate-timing.csv'
$results | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8
$slow = $results | Sort-Object DurationSeconds -Descending | Select-Object -First 1
Write-Host ("Tong thoi gian: {0}s | Cham nhat: {1} ({2}s)" -f [Math]::Round($total.Elapsed.TotalSeconds,1), $slow.Gate, $slow.DurationSeconds)
Write-Host ("PASS={0} FAIL={1} BLOCKED={2}" -f @($results|? Status -eq 'PASS').Count, @($results|? Status -eq 'FAIL').Count, @($results|? Status -eq 'BLOCKED').Count)
if (@($results | Where-Object { $_.Status -eq 'FAIL' }).Count -gt 0) { exit 1 }
