#!/usr/bin/env bash
# ==============================================================================
# CYBERSOFT DATA & AI LAB — POSIX BASH SINGLE-COMMAND RUNNER (LINUX / MACOS)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

command="${1:-help}"

function show_header() {
    echo "=========================================================="
    echo " CYBERSOFT DATA & AI LAB — RUNNER (POSIX / BASH)"
    echo "=========================================================="
}

function run_setup() {
    show_header
    echo "[1/5] Kiểm tra Python runtime..."
    python3 --version

    echo -e "\n[2/5] Khởi tạo môi trường ảo Python (.venv)..."
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
        echo "-> Đã tạo .venv thành công."
    else
        echo "-> Môi trường ảo .venv đã tồn tại."
    fi

    source .venv/bin/activate

    echo -e "\n[3/5] Cài đặt dependencies CPU-First (siêu nhẹ)..."
    pip install --upgrade pip
    pip install -r requirements-dev.txt

    echo -e "\n[4/5] Khởi tạo file biến môi trường .env..."
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "-> Đã tạo file .env an toàn từ .env.example."
    else
        echo "-> File .env đã sẵn sàng."
    fi

    echo -e "\n[5/5] Cài đặt Pre-commit hooks..."
    if command -v pre-commit &> /dev/null; then
        pre-commit install
        echo "-> Git pre-commit hooks đã được kích hoạt."
    fi

    echo -e "\n=========================================================="
    echo " THIẾT LẬP THÀNH CÔNG! ĐẠT CHUẨN SINGLE-COMMAND EXECUTION"
    echo " Để chạy test: ./run.sh test"
    echo " Để chạy lint: ./run.sh lint"
    echo "=========================================================="
}

function run_test() {
    show_header
    if [ -d ".venv" ]; then source .venv/bin/activate; fi
    pytest tests/ -v
}

function run_lint() {
    show_header
    if [ -d ".venv" ]; then source .venv/bin/activate; fi
    ruff check .
}

function run_format() {
    show_header
    if [ -d ".venv" ]; then source .venv/bin/activate; fi
    ruff format .
}

function run_clean() {
    show_header
    find . -type d -name "__pycache__" -exec rm -rf {} +
    find . -type f -name "*.pyc" -delete
    rm -rf .pytest_cache .ruff_cache
    echo "-> Đã dọn dẹp sạch sẽ."
}

case "$command" in
    setup)  run_setup ;;
    test)   run_test ;;
    lint)   run_lint ;;
    format) run_format ;;
    clean)  run_clean ;;
    *)
        show_header
        echo "Sử dụng: ./run.sh [setup | test | lint | format | clean]"
        ;;
esac
