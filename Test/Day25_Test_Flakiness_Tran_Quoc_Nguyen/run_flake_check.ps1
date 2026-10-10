param(
    [ValidateRange(1, 100)]
    [int]$Iterations = 10
)

$ErrorActionPreference = 'Continue'
$day25Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $day25Root '..\..')).Path
$feRoot = Join-Path $repoRoot 'learning-hub\FE'
$beRoot = Join-Path $repoRoot 'learning-hub\BE'
$reportRoot = Join-Path $day25Root 'reports'
$logRoot = Join-Path $reportRoot 'logs'

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

$feArgs = @(
    'test', '--', '--run',
    'src/pages/adminModel.test.ts',
    'src/pages/classManagementModel.test.ts',
    'src/pages/teacherDashboardModel.test.ts',
    'src/pages/studentClassesModel.test.ts',
    'src/components/StudentRoute.test.tsx'
)

$beArgs = @(
    'test', '--', '--runInBand', '--runTestsByPath',
    'src/common/auth/student-only.guard.spec.ts',
    'src/modules-api/admin-users/role-revocation.spec.ts',
    'src/modules-api/teacher-analytics/class-admin.spec.ts',
    'src/modules-api/teacher-analytics/student-classes.spec.ts',
    'src/modules-api/teacher-analytics/teacher-analytics.service.spec.ts'
)

$results = @()

function Invoke-TestRun {
    param(
        [int]$Iteration,
        [string]$Target,
        [string]$WorkingDirectory,
        [string[]]$Arguments
    )

    $logPath = Join-Path $logRoot ("{0}-{1:00}.log" -f $Target.ToLower(), $Iteration)
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    Push-Location $WorkingDirectory
    try {
        # Jest writes part of its normal PASS output to stderr. Convert every
        # merged stream item to plain text so Windows PowerShell does not show
        # successful Jest output as a red NativeCommandError record.
        & npm.cmd @Arguments *>&1 |
            ForEach-Object { $_.ToString() } |
            Tee-Object -FilePath $logPath |
            Out-Host
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
        $stopwatch.Stop()
    }

    [PSCustomObject]@{
        Iteration = $Iteration
        Target = $Target
        Status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
        ExitCode = $exitCode
        DurationSeconds = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
        Log = $logPath.Substring($day25Root.Length + 1)
    }
}

for ($iteration = 1; $iteration -le $Iterations; $iteration++) {
    # No automatic retry. Every result is retained as-is.
    $results += Invoke-TestRun -Iteration $iteration -Target 'FE' -WorkingDirectory $feRoot -Arguments $feArgs
    $results += Invoke-TestRun -Iteration $iteration -Target 'BE' -WorkingDirectory $beRoot -Arguments $beArgs
}

$csvPath = Join-Path $reportRoot 'flake-runs.csv'
$results | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

$failedRuns = @($results | Where-Object Status -eq 'FAIL').Count
$totalRuns = $results.Count
$flakeRate = if ($totalRuns -eq 0) { 0 } else { [Math]::Round(($failedRuns / $totalRuns) * 100, 2) }
$generatedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'

$summary = @"
# Day 25 - Flake Report

- Generated at: $generatedAt
- Iterations per target: $Iterations
- Total command runs: $totalRuns
- Failed command runs: $failedRuns
- Observed run failure rate: $flakeRate%
- Retry policy: No automatic retry; every failure is retained.

## Result

$(if ($failedRuns -eq 0) { 'PASS - No flaky test was observed in the selected scope.' } else { 'REVIEW REQUIRED - At least one run failed; inspect CSV and logs before classifying it.' })

## Evidence

- Per-run details: reports/flake-runs.csv
- Raw logs: reports/logs/
"@

$summary | Set-Content -LiteralPath (Join-Path $reportRoot 'flake-report-latest.md') -Encoding UTF8

Write-Host "Completed $totalRuns command runs. Failed=$failedRuns; rate=$flakeRate%"
if ($failedRuns -gt 0) { exit 1 }

