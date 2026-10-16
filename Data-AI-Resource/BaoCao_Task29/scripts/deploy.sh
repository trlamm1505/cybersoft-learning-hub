#!/usr/bin/env bash
# Shell Deployment Script for CyberSoft Data & AI Lab Container
set -e

echo "=========================================================="
echo "CYBERSOFT DATA & AI LAB — TRIỂN KHAI CONTAINER DOCKER"
echo "=========================================================="

IMAGE_NAME="cybersoft/data-ai-lab:v1.0"

if command -v docker &> /dev/null; then
    echo "[1/3] Đang build Docker Image: $IMAGE_NAME..."
    docker build -t "$IMAGE_NAME" .
    echo "[2/3] Khởi động Container qua docker-compose..."
    docker-compose up -d
    echo "[SUCCESS] Hệ thống đang chạy tại http://localhost:8029/portal/"
else
    echo "[FALLBACK] Khởi chạy trực tiếp qua Python Uvicorn..."
    python -m uvicorn src.main:app --host 0.0.0.0 --port 8029
fi
