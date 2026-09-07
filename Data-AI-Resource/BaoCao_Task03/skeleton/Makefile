# ==============================================================================
# CYBERSOFT DATA & AI LAB — MAKEFILE RUNNER
# ==============================================================================

.PHONY: setup test lint format clean run help

PYTHON ?= python3
VENV ?= .venv
BIN ?= $(VENV)/bin

help:
	@echo "Lệnh có sẵn:"
	@echo "  make setup   - Khởi tạo môi trường ảo, cài packages CPU, .env và hooks"
	@echo "  make test    - Chạy toàn bộ test suites với pytest"
	@echo "  make lint    - Kiểm tra code với ruff"
	@echo "  make format  - Tự động format code với ruff"
	@echo "  make clean   - Dọn dẹp cache và build files"

setup:
	@echo "[1/4] Khởi tạo .venv..."
	$(PYTHON) -m venv $(VENV)
	@echo "[2/4] Cài đặt dependencies CPU-first..."
	$(BIN)/pip install --upgrade pip
	$(BIN)/pip install -r requirements-dev.txt
	@echo "[3/4] Cấu hình .env..."
	@test -f .env || cp .env.example .env
	@echo "[4/4] Cài đặt pre-commit hooks..."
	$(BIN)/pre-commit install
	@echo "Setup hoàn tất!"

test:
	$(BIN)/pytest tests/ -v

lint:
	$(BIN)/ruff check .

format:
	$(BIN)/ruff format .

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .ruff_cache
