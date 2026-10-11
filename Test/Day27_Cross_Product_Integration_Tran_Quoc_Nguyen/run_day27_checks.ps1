param(
    [string]$DataServiceContractUrl = ""
)

$ErrorActionPreference = "Stop"
$day27Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $day27Dir "..\..")).Path
$beDir = Join-Path $repoRoot "learning-hub\BE"
$evidenceDir = Join-Path $day27Dir "evidence"
$logPath = Join-Path $evidenceDir "day27-integration-test.log"
$stdoutPath = Join-Path $evidenceDir "day27-jest.stdout.log"
$stderrPath = Join-Path $evidenceDir "day27-jest.stderr.log"

New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null

if (-not (Test-Path (Join-Path $beDir "package.json"))) {
    throw "Khong tim thay BE tai: $beDir"
}

if ($DataServiceContractUrl.Trim()) {
    $env:DATA_SERVICE_CONTRACT_URL = $DataServiceContractUrl.TrimEnd('/')
    Write-Host "LIVE contract enabled: $env:DATA_SERVICE_CONTRACT_URL"
} else {
    Remove-Item Env:DATA_SERVICE_CONTRACT_URL -ErrorAction SilentlyContinue
    Write-Host "LIVE contract disabled: 2 test voi Registry that se SKIP."
}

$specs = @(
    "src/integration/dataset-integration.service.spec.ts",
    "src/integration/real-registry-contract.spec.ts",
    "src/modules-api/da-labs/da-labs.submissions.spec.ts",
    "src/modules-api/da-labs/teacher-submissions.controller.spec.ts",
    "src/modules-api/ai-labs/ai-lab-grader.service.spec.ts",
    "src/integration/ai-exercise-to-lesson-publish.spec.ts"
)

Push-Location $beDir
try {
    $startedAt = Get-Date
    # Redirect stderr bằng Start-Process để PowerShell 5 không biến log
    # failure-path của Jest thành NativeCommandError giả.
    $npmArgs = @("test", "--", "--runInBand") + $specs
    $process = Start-Process -FilePath "npm.cmd" -ArgumentList $npmArgs `
        -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    $exitCode = $process.ExitCode
    $duration = [math]::Round(((Get-Date) - $startedAt).TotalSeconds, 2)

    # Node/Jest ghi UTF-8; đọc rõ encoding để tiếng Việt không lỗi font trên
    # Windows PowerShell 5 (Get-Content mặc định dùng ANSI).
    $utf8 = [System.Text.Encoding]::UTF8
    $stdout = if (Test-Path $stdoutPath) { [System.IO.File]::ReadAllText($stdoutPath, $utf8) } else { "" }
    $stderr = if (Test-Path $stderrPath) { [System.IO.File]::ReadAllText($stderrPath, $utf8) } else { "" }
    @($stdout, $stderr) | Set-Content -LiteralPath $logPath -Encoding UTF8
    Write-Host $stdout
    if ($stderr) { Write-Host $stderr }
} finally {
    Pop-Location
}

$summary = [ordered]@{
    executed_at = (Get-Date).ToString("s")
    exit_code = $exitCode
    duration_seconds = $duration
    live_contract_enabled = [bool]$DataServiceContractUrl.Trim()
    evidence_log = $logPath
}
$summary | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $evidenceDir "run-summary.json") -Encoding UTF8

Write-Host ""
Write-Host "Day 27 exit code: $exitCode"
Write-Host "Evidence: $logPath"
exit $exitCode
