#!/usr/bin/env bash
# Shell Deployment Script for CyberSoft Data & AI Lab Container
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=========================================================="
echo "CYBERSOFT DATA & AI LAB — TRIỂN KHAI CONTAINER DOCKER"
echo "=========================================================="

IMAGE_NAME="cybersoft/data-ai-lab:v1.0"

if command -v docker &> /dev/null; then
    echo "[1/2] Đang build & khởi động Container ($IMAGE_NAME)..."
    docker-compose up -d --build
    echo "[2/2] Kiểm tra sức khỏe container..."
    docker ps --filter "name=cybersoft-data-ai-lab"
    echo "[SUCCESS] Hệ thống đang chạy tại http://localhost:8029/portal/"
else
    echo "[FALLBACK] Khởi chạy trực tiếp qua Python Uvicorn..."
    python -m uvicorn src.main:app --host 0.0.0.0 --port 8029
fi
