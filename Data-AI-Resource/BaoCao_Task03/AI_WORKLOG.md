# AI WORK LOG - NGÀY 03: CHUẨN HÓA REPOSITORY VÀ MÔI TRƯỜNG

**Dự án**: CyberSoft Data & AI Lab
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer
**Ngày thực hiện**: 2026-09-01
**Task ID**: `#DAY-03-REPO-ENVIRONMENT`

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Hiện thực hóa kiến trúc đã thiết kế ở Ngày 02 thành một repository skeleton chuẩn mực, sẵn sàng vận hành cho cả 3 bạn thực tập sinh và học viên.
* **Yêu cầu kỹ thuật cốt lõi**:
  * Tạo khung xương repository phân tách chuẩn 5 thư mục: `src/`, `data/`, `notebooks/`, `tests/`, `docs/`.
  * Thiết lập cơ chế quản lý môi trường: Ưu tiên tuyệt đối **CPU-First** (siêu nhẹ, không lỗi CUDA/driver), tách riêng **GPU-Optional** cho mở rộng.
  * Quản lý biến môi trường mẫu qua `.env.example`, bảo mật 4 lớp qua `.gitignore` chống commit secret và file dữ liệu lớn ($> 50\text{MB}$).
  * Thiết lập Code Quality chuẩn công nghiệp: Linting, Formatting, Pre-commit hooks và Workflow GitHub Actions CI đầu tiên.
  * Đảm bảo nguyên tắc **"Chạy được bằng một lệnh chuẩn" (Single-Command Execution)** trên bất kỳ máy mới nào.

### Rủi ro dự kiến & Bẫy AI thường gặp
* AI thường tự động đưa các gói thư viện PyTorch GPU (`torch`, `torchvision` dung lượng 2.5GB–4GB) vào file `requirements.txt` mặc định. Điều này dẫn đến nguy cơ máy học viên không có card NVIDIA bị crash, cài đặt mất 20–30 phút hoặc lỗi thiếu CUDA drivers.
* AI thường đề xuất cài đặt cồng kềnh đồng thời 4 công cụ riêng lẻ: `flake8`, `black`, `isort`, `bandit` với 4 file cấu hình phân tán, dễ xung đột rule (ví dụ độ dài dòng của Black là 88 trong khi Flake8 mặc định là 79).
* AI có xu hướng bỏ qua kiểm soát file dung lượng lớn trong Git, chỉ cấu hình ignore thư mục chung chung mà không thiết lập hook chặn commit file $>50\text{MB}$.
* AI thường viết CI workflow chạy bằng container Docker nặng nề, khiến thời gian chạy CI tốn 5–10 phút mỗi lần commit thay vì tận dụng cache pip trên máy ảo sạch.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Gemini 3.7 Flash / Claude 3.5 Sonnet).
* **Mục tiêu tương tác**: Tạo cấu trúc repository skeleton, soạn thảo các file cấu hình `pyproject.toml`, `.pre-commit-config.yaml`, GitHub Actions `ci.yml`, script điều khiển `run.ps1` và script kiểm thử `validate_day03.py`.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal MLOps & Platform Engineer tại CyberSoft Academy.
Bối cảnh: Sau khi hoàn thành Kiến trúc Ngày 02, hãy thiết lập repository skeleton và môi trường chuẩn hóa cho CyberSoft Data & AI Lab.
Ràng buộc: Đội ngũ 3 người, thời hạn 30 ngày, hệ thống chạy local-first trên máy cá nhân không GPU rời, tối ưu chi phí (0đ).
Hãy thực hiện các yêu cầu sau:
1. Thiết kế cấu trúc thư mục chuẩn bao gồm: src/, data/ (raw, processed, interim), notebooks/, tests/, docs/.
2. Xây dựng chiến lược môi trường CPU-First (requirements.txt siêu nhẹ < 150MB, chạy mượt trên mọi OS) và tách biệt requirements-gpu.txt.
3. Thiết lập bảo mật chống lộ secret (.env.example vs .env) và cấu hình .gitignore đa tầng chặn dữ liệu lớn (>50MB).
4. Chuẩn hóa Code Quality: Tối ưu dùng Ruff (thay thế Flake8 + Black + isort) và cấu hình pre-commit hooks.
5. Viết GitHub Actions CI workflow đầu tiên tự động lint và chạy test.
6. Viết script tự động hóa thực thi 1 lệnh chuẩn cho cả Windows PowerShell (run.ps1) và Linux (Makefile/run.sh).
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Đưa `torch` (CUDA build) trực tiếp vào `requirements.txt` mặc định**. | File wheel tải về nặng hơn 2.5GB, máy không có card NVIDIA sẽ báo lỗi hoặc lãng phí ổ cứng, làm chậm thời gian setup ban đầu lên 20 phút. | **CAN THIỆP PHÂN TÁCH TRIỆT ĐỂ**: `requirements.txt` chỉ chứa thư viện CPU siêu nhẹ (<150MB). Toàn bộ gói GPU (PyTorch CUDA, cuDNN) được chuyển vào `requirements-gpu.txt` dành cho ai chủ động kích hoạt. |
| **Đề xuất dùng 4 công cụ rời rạc: `black`, `flake8`, `isort`, `bandit`** với các file `.flake8`, `.isort.cfg`, `bandit.yml`. | Quá cồng kềnh, chạy chậm, dễ xung đột độ dài dòng giữa Black (88 ký tự) và Flake8 (79 ký tự); dev mới phải cấu hình phức tạp. | **THỐNG NHẤT SỬ DỤNG RUFF**: Dùng `ruff` viết bằng Rust tích hợp toàn bộ linting, formatting và sắp xếp import. Cấu hình duy nhất trong `pyproject.toml`, tốc độ thực thi nhanh gấp 30 lần. |
| **Bỏ quên hook kiểm tra file dung lượng lớn** trong file `.pre-commit-config.yaml`. | Học viên khi làm việc với dataset hoặc export mô hình rất dễ lỡ tay `git add` file `.parquet` hay `.csv` nặng hàng trăm MB, làm hỏng repository Git vĩnh viễn. | **BỔ SUNG BẮT BUỘC HOOK `check-added-large-files`** với giới hạn nghiêm ngặt `--maxkb=50000` (50MB) và hook `detect-private-key` để bảo vệ an toàn. |
| **Viết CI workflow kéo image Docker lớn** `python:3.10-slim` và cài đặt lại toàn bộ từ đầu không cache. | Mỗi lần commit đẩy lên GitHub, CI mất 7–10 phút chỉ để tải docker layer và compile bánh xe wheel, làm nghẽn pipeline nhóm. | **TỐI ƯU GITHUB ACTIONS**: Sử dụng `actions/setup-python@v5` kết hợp `cache: 'pip'`. Thời gian chạy lint & test giảm xuống chỉ còn dưới **40 giây**! |
| **Chỉ viết lệnh chạy cho Linux (`Makefile`)**, không hỗ trợ máy Windows của học viên. | Hơn 70% học viên CyberSoft sử dụng hệ điều hành Windows PowerShell, nếu chỉ có `Makefile` sẽ gây lỗi "make is not recognized". | **BỔ SUNG ĐỒNG THỜI `run.ps1` (PowerShell)** và `run.sh` / `Makefile`, đảm bảo trải nghiệm 1 chạm chuẩn mực trên mọi nền tảng OS. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Để đảm bảo chất lượng bàn giao không dựa vào lời nói cảm tính, script kiểm thử tự động độc lập `scripts/validate_day03.py` được xây dựng để quét 100% các tiêu chí kỹ thuật:

### Lệnh chạy kiểm thử:
```powershell
python Data-AI-Resource/BaoCao_Task03/scripts/validate_day03.py
```

### Kết quả chạy thực tế:
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
--------------------------------------------------
SUCCESS: All Day 03 DoD requirements passed (100%)!
==================================================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Nắm vững các tiêu chuẩn kỹ thuật về Skeleton, cơ chế tách biệt CPU/GPU, và quy tắc 12-Factor App trong quản lý cấu hình và bí mật.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Cung cấp bản đặc tả chi tiết, yêu cầu AI sinh mã cấu hình chuẩn PEP 518/621 cho `pyproject.toml` và workflow CI chuẩn GitHub Actions.
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Phát hiện và loại bỏ các lỗi nghiêm trọng do AI đề xuất: loại bỏ dependency PyTorch GPU nặng nề trong CPU-first, thay thế bộ 4 công cụ lint rời rạc bằng Ruff, bổ sung chốt chặn commit file dung lượng lớn $>50\text{MB}$.
* **Tầng 4 — Làm chủ (Engineering Ownership)**: Tự viết script kiểm thử độc lập `validate_day03.py`, tối ưu hóa script điều khiển `run.ps1` trên Windows và `Makefile` trên Linux, đảm bảo bất kỳ máy mới nào cũng khởi động thành công chỉ bằng một lệnh chuẩn.
