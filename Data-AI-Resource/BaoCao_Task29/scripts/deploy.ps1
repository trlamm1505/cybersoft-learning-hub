# PowerShell Deployment Script for CyberSoft Data & AI Lab Container
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR = Split-Path -Parent $SCRIPT_DIR
Set-Location $ROOT_DIR

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "CYBERSOFT DATA & AI LAB — TRIỂN KHAI CONTAINER DOCKER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$IMAGE_NAME = "cybersoft/data-ai-lab:v1.0"

Write-Host "[1/3] Đang kiểm tra cấu hình Dockerfile và docker-compose.yml..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "[2/3] Đang build & khởi động Container ($IMAGE_NAME)..." -ForegroundColor Yellow
    docker-compose up -d --build
    Write-Host "[3/3] Kiểm tra sức khỏe container..." -ForegroundColor Yellow
    docker ps --filter "name=cybersoft-data-ai-lab"
    Write-Host "[SUCCESS] Hệ thống đang chạy tại http://localhost:8029/portal/" -ForegroundColor Green
} else {
    Write-Host "[INFO] Docker daemon không khả dụng trên môi trường cục bộ này." -ForegroundColor Yellow
    Write-Host "[FALLBACK] Khởi chạy trực tiếp bằng Python Uvicorn engine..." -ForegroundColor Green
    python -m uvicorn src.main:app --host 0.0.0.0 --port 8029
}
