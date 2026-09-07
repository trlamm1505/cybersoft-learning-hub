<#
.SYNOPSIS
    CyberSoft Data & AI Lab - Windows PowerShell Single-Command Runner
.DESCRIPTION
    Setup and run environment and test suites via a single standard command.
.EXAMPLE
    .\run.ps1 setup       # Create venv, install CPU requirements, setup .env & pre-commit
    .\run.ps1 test        # Run pytest test suite
    .\run.ps1 lint        # Run ruff check
    .\run.ps1 format      # Auto-format code with ruff
    .\run.ps1 run         # Start FastAPI local server
#>

param (
    [Parameter(Position=0)]
    [ValidateSet("setup", "test", "lint", "format", "run", "clean", "help")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function Show-Header {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host " CYBERSOFT DATA & AI LAB - RUNNER (WINDOWS POWERSHELL)" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
}

function Run-Setup {
    Show-Header
    Write-Host "[1/5] Checking Python runtime..." -ForegroundColor Yellow
    python --version

    Write-Host "`n[2/5] Creating virtual environment (.venv)..." -ForegroundColor Yellow
    if (-not (Test-Path ".venv")) {
        python -m venv .venv
        Write-Host "-> Created .venv successfully." -ForegroundColor Green
    } else {
        Write-Host "-> .venv already exists." -ForegroundColor Gray
    }

    $VenvPython = Join-Path $ScriptDir ".venv\Scripts\python.exe"
    $VenvPip = Join-Path $ScriptDir ".venv\Scripts\pip.exe"

    Write-Host "`n[3/5] Installing CPU-First dependencies (<150MB)..." -ForegroundColor Yellow
    & $VenvPython -m pip install --upgrade pip
    & $VenvPip install -r requirements-dev.txt

    Write-Host "`n[4/5] Initializing .env configuration..." -ForegroundColor Yellow
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Host "-> Created .env from .env.example safely." -ForegroundColor Green
    } else {
        Write-Host "-> .env file is ready." -ForegroundColor Gray
    }

    Write-Host "`n[5/5] Installing Git pre-commit hooks..." -ForegroundColor Yellow
    $VenvPreCommit = Join-Path $ScriptDir ".venv\Scripts\pre-commit.exe"
    if (Test-Path $VenvPreCommit) {
        & $VenvPreCommit install
        Write-Host "-> Git pre-commit hooks activated." -ForegroundColor Green
    }

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " SETUP SUCCESSFUL! SINGLE-COMMAND READY" -ForegroundColor Green
    Write-Host " To run tests: .\run.ps1 test" -ForegroundColor White
    Write-Host " To run lint:  .\run.ps1 lint" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Green
}

function Run-Test {
    Show-Header
    Write-Host "Running Pytest test suite..." -ForegroundColor Yellow
    $Pytest = if (Test-Path ".venv\Scripts\pytest.exe") { ".venv\Scripts\pytest.exe" } else { "pytest" }
    & $Pytest tests/ -v
}

function Run-Lint {
    Show-Header
    Write-Host "Running Ruff linter..." -ForegroundColor Yellow
    $Ruff = if (Test-Path ".venv\Scripts\ruff.exe") { ".venv\Scripts\ruff.exe" } else { "ruff" }
    & $Ruff check .
}

function Run-Format {
    Show-Header
    Write-Host "Auto-formatting with Ruff..." -ForegroundColor Yellow
    $Ruff = if (Test-Path ".venv\Scripts\ruff.exe") { ".venv\Scripts\ruff.exe" } else { "ruff" }
    & $Ruff format .
}

function Run-App {
    Show-Header
    Write-Host "Starting FastAPI local server..." -ForegroundColor Yellow
    $Uvicorn = if (Test-Path ".venv\Scripts\uvicorn.exe") { ".venv\Scripts\uvicorn.exe" } else { "uvicorn" }
    & $Uvicorn src.config:app --reload --port 8000
}

function Run-Clean {
    Show-Header
    Write-Host "Cleaning cache and build artifacts..." -ForegroundColor Yellow
    Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force -ErrorAction SilentlyContinue
    if (Test-Path ".pytest_cache") { Remove-Item -Recurse -Force ".pytest_cache" }
    if (Test-Path ".ruff_cache") { Remove-Item -Recurse -Force ".ruff_cache" }
    Write-Host "-> Cleaned successfully." -ForegroundColor Green
}

switch ($Command) {
    "setup"  { Run-Setup }
    "test"   { Run-Test }
    "lint"   { Run-Lint }
    "format" { Run-Format }
    "run"    { Run-App }
    "clean"  { Run-Clean }
    default  {
        Show-Header
        Write-Host "Usage: .\run.ps1 [setup | test | lint | format | run | clean]" -ForegroundColor Cyan
    }
}
