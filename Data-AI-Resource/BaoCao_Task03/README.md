# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 03

**Dự án**: CyberSoft Data & AI Lab
**Đầu việc**: NGÀY 03 — Chuẩn hóa repository và môi trường phát triển
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO DOD CYBERSOFT**

---

## 📂 1. CẤU TRÚC THƯ MỤC BÀN GIAO (DELIVERABLES)

```text
Data-AI-Resource/
└── BaoCao_Task03/
    ├── README.md                          # Hướng dẫn tổng quan & chỉ mục nghiệm thu Ngày 03
    ├── 03_repo_environment_standard.md    # Tài liệu đặc tả chuẩn hóa repo, môi trường CPU/GPU, CI/CD
    ├── AI_WORKLOG.md                      # Nhật ký sử dụng AI minh bạch, phát hiện lỗi & làm chủ kỹ thuật
    ├── DEFENSE_SCRIPT.md                  # Kịch bản bảo vệ 3 phút trước Giảng viên & Q&A phản biện
    ├── scripts/
    │   └── validate_day03.py              # Script kiểm thử tự động độc lập 100% tiêu chuẩn DoD
    └── skeleton/                          # Khung xương Repository hoàn chỉnh chạy bằng 1 lệnh
        ├── .env.example                   # Biến môi trường mẫu, zero-secret
        ├── .gitignore                     # Chặn secret, credentials, cache & dữ liệu lớn (>50MB)
        ├── .pre-commit-config.yaml        # Git hooks: check-added-large-files, detect-private-key, ruff
        ├── pyproject.toml                 # Cấu hình tập trung PEP 518/621 cho Ruff & Pytest
        ├── requirements.txt               # Thư viện CPU-First siêu nhẹ (<150MB, tải <60s)
        ├── requirements-gpu.txt           # Thư viện GPU tùy chọn (PyTorch CUDA 12.1)
        ├── requirements-dev.txt           # Thư viện cho Developer & Tester
        ├── Makefile                       # Trình điều khiển lệnh cho Linux/macOS
        ├── run.ps1                        # Trình điều khiển lệnh chuẩn cho Windows PowerShell
        ├── run.sh                         # Shell script điều khiển cho POSIX
        ├── .github/workflows/ci.yml       # GitHub Actions CI workflow (Lint + Test tự động)
        ├── src/                           # Mã nguồn chuẩn hóa 5 module cốt lõi
        │   ├── config.py                  # Settings an toàn từ .env với Pydantic
        │   ├── core/                      # Tiện ích logging (Loguru) và exceptions
        │   └── modules/                   # 5 module: registry, quality, project, rag, evaluation
        ├── data/                          # Phân tầng dữ liệu: raw, processed, interim (+ .gitkeep)
        ├── notebooks/                     # Sổ tay Jupyter thí nghiệm (+ .gitkeep & README)
        ├── tests/                         # Bộ kiểm thử tự động pytest (môi trường, skeleton, quality gate)
        └── docs/                          # Hướng dẫn kỹ thuật: SETUP_GUIDE, ENVIRONMENT_MATRIX, CI_CD
```

---

## 📋 2. BẢNG ĐỐI SOÁT ĐIỀU KIỆN NGHIỆM THU (DOD CHECKLIST)

| STT | Tiêu chí nghiệm thu (DoD Ngày 03) | Bằng chứng thực hiện | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | Cấu trúc source, data, notebooks, tests, docs | Cây thư mục đầy đủ tại `BaoCao_Task03/skeleton/` |  **ĐẠT** |
| 2 | Thiết lập lint, format, pre-commit | `pyproject.toml` (Ruff) và `.pre-commit-config.yaml` |  **ĐẠT** |
| 3 | Biến môi trường mẫu (.env.example) | File `skeleton/.env.example` chuẩn 12-factor, zero-secret |  **ĐẠT** |
| 4 | Hướng dẫn setup CPU trước, GPU tùy chọn | `requirements.txt` vs `requirements-gpu.txt` & `docs/SETUP_GUIDE.md` |  **ĐẠT** |
| 5 | Repository skeleton & README Quick Start | Thư mục `skeleton/` và file `README.md` hướng dẫn 1 lệnh |  **ĐẠT** |
| 6 | CI lint/test đầu tiên | Workflow `.github/workflows/ci.yml` (chạy ruff & pytest) |  **ĐẠT** |
| 7 | Máy mới làm theo README chạy được | Kiểm chứng thực thi qua `run.ps1` / `run.sh` / `Makefile` |  **ĐẠT** |
| 8 | Không commit secret hoặc dữ liệu lớn | `.gitignore` 4 lớp và pre-commit hook `check-added-large-files` |  **ĐẠT** |
| 9 | Nhật ký AI_WORKLOG & Kịch bản bảo vệ 3 phút | `AI_WORKLOG.md` và `DEFENSE_SCRIPT.md` chuẩn công nghiệp |  **ĐẠT** |
| 10 | Script kiểm thử độc lập nghiệm thu 100% | File `scripts/validate_day03.py` PASS 100% |  **ĐẠT** |

---

## ⚡ 3. HƯỚNG DẪN CHẠY KIỂM THỬ NGHIỆM THU ĐỘC LẬP

Thực hiện lệnh sau từ terminal tại thư mục gốc repository để thẩm định toàn bộ kết quả bàn giao Ngày 03:

```powershell
python Data-AI-Resource/BaoCao_Task03/scripts/validate_day03.py
```

### Kết quả kỳ vọng:
```text
==================================================
CYBERSOFT DATA & AI LAB - DAY 03 VALIDATION HARNESS
==================================================
[PASS] Skeleton root directory exists
[PASS] All 5 Core directories verified (src, data, notebooks, tests, docs)
[PASS] Data subdirectories verified (raw, processed, interim with .gitkeep)
[PASS] Core source modules verified (config, core, registry, quality, project, rag, evaluation)
[PASS] Environment files verified (.env.example, .gitignore, pyproject.toml, .pre-commit-config.yaml)
[PASS] CPU-First vs GPU-Optional separation verified (requirements.txt < 150MB, requirements-gpu.txt exists)
[PASS] Security rules in .gitignore verified (secrets, .env, large files, .db, cache blocked)
[PASS] Pre-commit hooks verified (check-added-large-files, detect-private-key, ruff)
[PASS] CI/CD Workflow verified (.github/workflows/ci.yml with lint and test jobs)
[PASS] Single-command runners verified (run.ps1, run.sh, Makefile)
[PASS] Setup guides and documentation verified (SETUP_GUIDE.md, ENVIRONMENT_MATRIX.md)
[PASS] All Report documents verified (Standard, AI_WORKLOG, DEFENSE_SCRIPT)
--------------------------------------------------
SUCCESS: All Day 03 DoD requirements passed (100%)!
==================================================
```

---

## 🚀 4. QUY CHUẨN KHỞI TẠO BẰNG "MỘT LỆNH CHUẨN" (SINGLE COMMAND)

Bất kỳ thành viên nào khi clone dự án về máy sạch đều có thể cài đặt toàn bộ môi trường và kích hoạt test suites chỉ bằng 1 lệnh:

* **Trên Windows (PowerShell)**:
  ```powershell
  .\Data-AI-Resource\BaoCao_Task03\skeleton\run.ps1 setup
  ```
* **Trên Linux / macOS**:
  ```bash
  ./Data-AI-Resource/BaoCao_Task03/skeleton/run.sh setup
  ```
