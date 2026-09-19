New-Item -ItemType Directory -Force -Path reports | Out-Null
python -m pytest -v --junitxml=reports/junit.xml
if ($LASTEXITCODE -ne 0) {
    Write-Host "Contract tests FAILED - CI/release gate should fail." -ForegroundColor Red
    exit $LASTEXITCODE
}
python generate_contract_report.py
Write-Host "Contract tests PASSED. Open reports/contract_report.md" -ForegroundColor Green
