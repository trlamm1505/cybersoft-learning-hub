# 03. CHUẨN HÓA REPOSITORY VÀ MÔI TRƯỜNG PHÁT TRIỂN

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 03 — Chuẩn hóa repository và môi trường phát triển  
**Vai trò phụ trách**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Phiên bản**: v1.0  
**Ngày hoàn thiện**: 2026-09-03  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU (OVERVIEW & OBJECTIVES)

### 1.1. Bối cảnh
Sau khi hoàn thành Bản đồ bài toán (Ngày 01) và Thiết kế kiến trúc tổng thể kèm ADR-001 (Ngày 02), bước sang **Ngày 03**, nhiệm vụ sống còn của Data & AI Resource Engineer là chuyển hóa thiết kế trên giấy thành một **nền móng kỹ thuật vững chắc (Solid Technical Foundation)**.

Vấn đề thực tế tại các dự án Data & AI thường gặp phải:
1. **"Chạy được trên máy tôi" (It works on my machine)**: Sự khác biệt giữa phiên bản Python, OS (Windows/Linux/macOS), trình điều khiển CUDA dẫn đến xung đột thư viện nghiêm trọng khi người khác clone repository.
2. **Lộ lọt thông tin nhạy cảm (Secret Leaks)**: Vô tình commit API keys, database credentials, token cá nhân vào Git repository công khai/nội bộ.
3. **Ô nhiễm repository bởi dữ liệu nặng**: Commit các file dữ liệu lớn (`.csv`, `.parquet`, `.mp4`, checkpoint model `.pt` hàng trăm MB/GB) khiến Git bloat, clone chậm và vi phạm giới hạn GitHub (100MB/file).
4. **Codebase thiếu đồng nhất**: Mỗi thành viên code theo một phong cách khác nhau, không có format, không có lint tự động, không kiểm soát type hint.

### 1.2. Mục tiêu kỹ thuật cốt lõi Ngày 03
* **Cấu trúc Repository Skeleton chuẩn hóa**: Phân tách rõ ràng giữa `src/`, `data/`, `notebooks/`, `tests/`, và `docs/`.
* **Môi trường tái lập 100% (Reproducible Environment)**: Triển khai triết lý **CPU-First** (tối ưu hóa 100% tài nguyên CPU máy cá nhân, tải nhanh, không lỗi CUDA) và phân tách **GPU-Optional** cho các tác vụ chuyên sâu.
* **Cơ chế kiểm soát bí mật và dữ liệu**: Thiết lập `.env.example` mẫu, cấu hình `.gitignore` đa tầng và tích hợp pre-commit hooks chặn commit secret hoặc file > 50MB.
* **Bộ công cụ Code Quality tự động**: Sử dụng `Ruff` (siêu tốc, thay thế Flake8 + Black + isort) và `pre-commit` để chuẩn hóa mã nguồn trước mỗi commit.
* **CI Pipeline đầu tiên**: GitHub Actions workflow tự động kiểm tra lint, format, type hint và chạy unit test mỗi khi tạo Pull Request.
* **Quy chuẩn thực thi "Một lệnh chuẩn" (Single-Command Execution)**: Bất kỳ máy mới nào cũng có thể cài đặt và kiểm thử toàn bộ hệ sinh thái chỉ bằng một lệnh duy nhất (`./run.ps1 setup` hoặc `make test`).

---

## 2. CẤU TRÚC REPOSITORY SKELETON CHUẨN CÔNG NGHIỆP

Cấu trúc thư mục được thiết kế theo chuẩn mã nguồn mở hiện đại dành riêng cho hệ sinh thái Data & AI:

```text
cybersoft-learning-hub/
└── Data-AI-Resource/
    └── BaoCao_Task03/
        ├── README.md                      # Hướng dẫn tổng quan & Quick Start 1 lệnh
        ├── 03_repo_environment_standard.md # Tài liệu đặc tả chuẩn hóa repo & env
        ├── AI_WORKLOG.md                  # Nhật ký làm chủ AI, diffs & thẩm định
        ├── DEFENSE_SCRIPT.md              # Kịch bản bảo vệ 3 phút trước Giảng viên
        ├── scripts/
        │   └── validate_day03.py          # Harness kiểm thử độc lập 100% tiêu chí DoD
        └── skeleton/                      # Skeleton hoàn chỉnh sẵn sàng áp dụng
            ├── .env.example               # Biến môi trường mẫu, zero-secret
            ├── .gitignore                 # Chặn secret, cache, và dữ liệu nặng (>50MB)
            ├── .pre-commit-config.yaml    # Hooks tự động format, lint & security check
            ├── pyproject.toml             # Cấu hình tập trung chuẩn PEP 518/621
            ├── requirements.txt           # Thư viện CPU-First (siêu nhẹ, <150MB)
            ├── requirements-gpu.txt       # Thư viện GPU tùy chọn (PyTorch CUDA)
            ├── requirements-dev.txt       # Thư viện cho Developer & Tester
            ├── Makefile                   # Trình điều khiển lệnh chuẩn cho Linux/macOS
            ├── run.ps1                    # Trình điều khiển lệnh chuẩn cho Windows PowerShell
            ├── run.sh                     # Shell script thực thi chuẩn cho POSIX
            ├── .github/
            │   └── workflows/
            │       └── ci.yml             # GitHub Actions CI lint & test tự động
            ├── src/                       # Mã nguồn hệ thống (5 module cốt lõi)
            │   ├── __init__.py
            │   ├── config.py              # Quản lý settings từ environment với Pydantic
            │   ├── core/                  # Tiện ích dùng chung, logging, exceptions
            │   │   ├── __init__.py
            │   │   ├── exceptions.py
            │   │   └── logger.py
            │   └── modules/               # 5 module kiến trúc đã xác lập ở Ngày 02
            │       ├── registry/          # Module 1: Quản lý Dataset & Metadata
            │       ├── quality/           # Module 2: Kiểm định chất lượng 7 nhóm lỗi
            │       ├── project/           # Module 3: Quản lý Capstones & Rubrics
            │       ├── rag/               # Module 4: Semantic Search & RAG Tutor
            │       └── evaluation/        # Module 5: Đánh giá hồi quy Ground Truth
            ├── data/                      # Lưu trữ dữ liệu phân tầng (không commit file lớn)
            │   ├── .gitkeep
            │   ├── raw/                   # Dữ liệu gốc nguyên bản
            │   ├── processed/             # Dữ liệu đã làm sạch qua Quality Gate
            │   └── interim/               # Dữ liệu trung gian trong pipeline
            ├── notebooks/                 # Thư mục thí nghiệm Jupyter Notebooks
            │   ├── .gitkeep
            │   └── 01_data_exploration_template.ipynb
            ├── tests/                     # Toàn bộ kiểm thử tự động (Unit & Integration)
            │   ├── __init__.py
            │   ├── conftest.py            # Pytest fixtures dùng chung
            │   ├── test_environment.py    # Kiểm tra tính toàn vẹn của môi trường Python
            │   ├── test_skeleton.py       # Kiểm tra cấu trúc cây thư mục & file mẫu
            │   └── test_quality_gate.py   # Kiểm tra sơ bộ logic chất lượng mã nguồn
            └── docs/                      # Tài liệu kỹ thuật chi tiết
                ├── SETUP_GUIDE.md         # Hướng dẫn cài đặt từng bước (CPU vs GPU)
                ├── ENVIRONMENT_MATRIX.md  # Bảng ma trận phần cứng & thư viện
                └── CI_CD_PIPELINE.md      # Quy chuẩn CI/CD và Quality Gate
```

---

## 3. CHIẾN LƯỢC MÔI TRƯỜNG: CPU-FIRST TRƯỚC, GPU TÙY CHỌN

### 3.1. Triết lý thiết kế CPU-First
Trong bối cảnh CyberSoft đào tạo đa dạng học viên từ nhiều nền tảng phần cứng (laptop văn phòng, máy không có card đồ họa NVIDIA rời, macOS chip Apple Silicon M1/M2/M3), việc ép buộc cài đặt CUDA hoặc PyTorch GPU ngay từ đầu sẽ gây ra tỷ lệ lỗi cài đặt trên 40%.

Vì vậy, kiến trúc môi trường tuân thủ nguyên tắc:
1. **CPU-First (Mặc định)**: Toàn bộ pipeline, từ FastAPI backend, SQLite metadata, ChromaDB vector store đến model embedding `all-MiniLM-L6-v2` và cross-encoder re-ranking đều được tối ưu hóa chạy hoàn toàn trên CPU.
   * Dung lượng gói tải: $< 150 \text{ MB}$.
   * Thời gian cài đặt môi trường mới: $< 60 \text{ giây}$.
   * Độ trễ suy luận embedding: $15 - 30 \text{ ms}$ cho mỗi text chunk 512 tokens trên CPU Intel Core i5 / AMD Ryzen 5 thông dụng.
2. **GPU-Optional (Tùy chọn nâng cao)**: Dành riêng cho học viên có GPU NVIDIA rời muốn tăng tốc finetuning hoặc chạy các LLM cục bộ cỡ lớn (Llama-3-8B, Qwen-2.5-7B qua vLLM/Ollama). File `requirements-gpu.txt` được tách biệt hoàn toàn để không gây xung đột dependency.

### 3.2. Bảng ma trận môi trường (Environment Matrix)

| Thành phần | Cấu hình CPU-First (Mặc định) | Cấu hình GPU-Optional (Tùy chọn) | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Hệ điều hành** | Windows 10/11, Ubuntu 20.04+, macOS 12+ | Windows 10/11 x64, Ubuntu 22.04 LTS | Cross-platform 100% |
| **Python Version** | Python 3.10.x hoặc 3.11.x | Python 3.10.x hoặc 3.11.x | Đảm bảo tính tương thích lâu dài |
| **PyTorch Backend** | `torch --index-url https://download.pytorch.org/whl/cpu` | `torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121` | Tách biệt wheel URL |
| **Embedding Engine** | `sentence-transformers` (ONNX / CPU runtime) | `sentence-transformers` (CUDA device `cuda:0`) | Tự động fallback nếu không có GPU |
| **Vector DB** | `chromadb` (Embedded DuckDB/Parquet engine) | `chromadb` (Embedded hoặc Docker GPU-accelerated) | Lưu trữ local disk `./chroma_db` |
| **RAM Khuyến nghị** | Tối thiểu 8 GB RAM (Trống $\ge 3 \text{ GB}$) | Tối thiểu 16 GB RAM + 6GB VRAM GPU | Không gây tràn bộ nhớ |
| **Disk Storage** | Tối thiểu 2 GB dung lượng trống | Tối thiểu 10 GB dung lượng trống | Dành cho cache model & test data |

---

## 4. QUẢN LÝ BIẾN MÔI TRƯỜNG & CHỐNG LỘ LỌT DỮ LIỆU/SECRET

### 4.1. Cơ chế Quản lý Biến Môi trường (.env.example vs .env)
Nguyên tắc 12-Factor App được áp dụng triệt để:
* File `.env.example`: Được commit công khai vào Git repository. Chứa đầy đủ tất cả các biến cấu hình cần thiết kèm giá trị mặc định an toàn cho môi trường Local-first, tuyệt đối không chứa password thật, secret keys, hay token cá nhân.
* File `.env`: Được tạo ra tự động từ `.env.example` khi chạy script khởi tạo. Chứa cấu hình thực tế của từng máy. File này nằm trong danh sách cấm kỵ của `.gitignore`.
* Quản lý cấu hình bằng `pydantic-settings`: Validate kiểu dữ liệu của biến môi trường ngay khi ứng dụng khởi động. Báo lỗi rõ ràng nếu thiếu biến bắt buộc.

### 4.2. Chiến lược .gitignore Đa Tầng Chống Rò Rỉ
File `.gitignore` được cấu hình chặt chẽ với 4 lớp phòng thủ:
1. **Lớp 1: Chặn Secret & Credentials**: `.env`, `*.pem`, `*.key`, `*.pfx`, `id_rsa`, `credentials.json`, `token.json`.
2. **Lớp 2: Chặn Dữ liệu Lớn & Nhị phân**: `data/raw/*`, `data/processed/*`, `*.parquet`, `*.csv` ($>10\text{MB}$), `*.tar.gz`, `*.zip`, checkpoints model `*.pt`, `*.bin`, `*.onnx`.
3. **Lớp 3: Chặn Database & Index cục bộ**: `*.db`, `*.sqlite`, `*.sqlite3`, thư mục vector `./chroma_db/`.
4. **Lớp 4: Chặn Cache & Môi trường ảo**: `.venv/`, `venv/`, `__pycache__/`, `.pytest_cache/`, `.ruff_cache/`.

---

## 5. THIẾT LẬP CODE QUALITY: RUFF, PRE-COMMIT VÀ CI PIPELINE

### 5.1. Tối ưu hóa với Ruff (Thay thế Flake8, Black, isort)
Thay vì phải cài đặt và cấu hình 4 công cụ rời rạc (Flake8, Black, isort, Bandit) khiến thời gian kiểm tra chậm chạp và thường xuyên xảy ra xung đột rule, dự án thống nhất sử dụng **`Ruff`** viết bằng Rust:
* Tốc độ thực thi nhanh hơn **10 - 100 lần** so với Flake8/Black.
* Tích hợp toàn bộ tính năng format code, sắp xếp import (`isort`), và lint 700+ rules tiêu chuẩn PEP 8.
* Cấu hình tập trung tại duy nhất 1 file `pyproject.toml`.

### 5.2. Pre-commit Hooks Tự động
File `.pre-commit-config.yaml` kích hoạt 6 chốt kiểm tra tự động trước mỗi lần `git commit`:
1. `check-added-large-files`: Từ chối mọi commit chứa file vượt quá **50 MB** (ngăn chặn commit nhầm dataset lớn).
2. `detect-private-key`: Tự động phát hiện và chặn commit các file chứa Private Key (SSH, RSA, PGP).
3. `check-merge-conflict`: Ngăn chặn commit các file còn sót lại conflict markers (`<<<<<<< HEAD`).
4. `end-of-file-fixer` & `trailing-whitespace`: Chuẩn hóa khoảng trắng và dòng cuối file.
5. `check-yaml` & `check-json`: Đảm bảo các file cấu hình đúng cú pháp.
6. `ruff-pre-commit`: Tự động lint và format mã nguồn Python đạt chuẩn PEP 8.

### 5.3. GitHub Actions CI Pipeline Đầu Tiên
Workflow `.github/workflows/ci.yml` đóng vai trò là **Cổng chất lượng tự động (Automated Quality Gate)**:
* Chạy trên môi trường ảo sạch (`ubuntu-latest`).
* Cài đặt Python 3.11 với cơ chế cache `pip` tối ưu (thời gian build $< 45\text{s}$).
* Chạy kiểm tra định dạng và quy chuẩn: `ruff check .` và `ruff format --check .`.
* Chạy toàn bộ test suites: `pytest tests/ -v --cov=src`.
* Pipeline thất bại (Fail) ngay lập tức nếu có bất kỳ lỗi lint, cú pháp, hoặc unit test không vượt qua.

---

## 6. QUY CHUẨN THỰC THI "MỘT LỆNH CHUẨN" (SINGLE-COMMAND EXECUTION)

Bất kỳ lập trình viên, học viên hoặc giảng viên nào khi clone repository về máy sạch đều có thể thiết lập và vận hành hệ thống thông qua một lệnh duy nhất:

### Trên Windows (PowerShell):
```powershell
# Thiết lập toàn bộ môi trường và chạy kiểm thử tự động
.\Data-AI-Resource\BaoCao_Task03\skeleton\run.ps1 setup
```

### Trên Linux / macOS (Bash hoặc Make):
```bash
# Bằng Shell script:
./Data-AI-Resource/BaoCao_Task03/skeleton/run.sh setup

# Hoặc bằng Makefile:
make setup && make test
```

Lệnh chuẩn sẽ tự động thực hiện chuỗi hành động khép kín:
1. Tạo môi trường ảo `.venv` nếu chưa tồn tại.
2. Nâng cấp `pip` và cài đặt các phụ thuộc `requirements.txt` (CPU-first) và `requirements-dev.txt`.
3. Tự động sinh file `.env` từ `.env.example` nếu chưa có.
4. Cài đặt các hooks kiểm tra vào Git (`pre-commit install`).
5. Kích hoạt pytest để chạy toàn bộ các bài test nghiệm thu cấu trúc và môi trường.

---

## 7. ĐIỀU KIỆN NGHIỆM THU (DEFINITION OF DONE - DOD NGÀY 03)

| STT | Tiêu chí nghiệm thu (DoD Ngày 03) | Bằng chứng kỹ thuật | Trạng thái |
| :---: | :--- | :--- | :--- |
| 1 | Cấu trúc thư mục đầy đủ 5 thành phần (`src`, `data`, `notebooks`, `tests`, `docs`) | Cấu trúc Skeleton tại `BaoCao_Task03/skeleton/` | **ĐẠT** |
| 2 | Thiết lập biến môi trường mẫu `.env.example` | File `skeleton/.env.example` (zero secret, đầy đủ biến) | **ĐẠT** |
| 3 | Cấu hình bảo mật `.gitignore` chặn secret và data lớn | File `skeleton/.gitignore` (chặn `.env`, data lớn, `.db`, cache) | **ĐẠT** |
| 4 | Cấu hình Code Quality tập trung (Lint & Format) | File `skeleton/pyproject.toml` (Ruff linter & formatter) | **ĐẠT** |
| 5 | Cấu hình Pre-commit hooks tự động | File `skeleton/.pre-commit-config.yaml` (6 hooks chuẩn) | **ĐẠT** |
| 6 | Phân tách môi trường CPU-First vs GPU-Optional | `requirements.txt` (<150MB) vs `requirements-gpu.txt` | **ĐẠT** |
| 7 | Workflow CI tự động đầu tiên | File `skeleton/.github/workflows/ci.yml` (Lint + Test) | **ĐẠT** |
| 8 | Hướng dẫn vận hành và script chạy 1 lệnh chuẩn | `run.ps1`, `run.sh`, `Makefile` và `SETUP_GUIDE.md` | **ĐẠT** |
| 9 | Script kiểm thử độc lập nghiệm thu 100% | File `scripts/validate_day03.py` (Toàn bộ checks PASS) | **ĐẠT** |
| 10 | Nhật ký AI Work Log minh bạch, phản biện và làm chủ | File `AI_WORKLOG.md` & `DEFENSE_SCRIPT.md` | **ĐẠT** |
