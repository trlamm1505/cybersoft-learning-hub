# MA TRẬN MÔI TRƯỜNG & TƯƠNG THÍCH (ENVIRONMENT MATRIX)

Bảng đối soát tính tương thích phần cứng và phiên bản phần mềm trong hệ sinh thái CyberSoft Data & AI Lab.

---

## 📊 1. Bảng Đối soát Tương thích Hệ điều hành

| Hệ điều hành | Trạng thái hỗ trợ | Cấu hình khuyên dùng | Lệnh khởi tạo chuẩn |
| :--- | :---: | :--- | :--- |
| **Windows 10 / 11** |  **Chính thức** | Python 3.10 / 3.11, PowerShell 5.1+ | `.\run.ps1 setup` |
| **Ubuntu 20.04 / 22.04 LTS** |  **Chính thức** | Python 3.10 / 3.11, bash/zsh | `./run.sh setup` |
| **macOS (Apple Silicon M1/M2/M3)** |  **Chính thức** | Python 3.10 / 3.11 qua Homebrew | `make setup` |
| **macOS (Intel x86_64)** |  **Chính thức** | Python 3.10 / 3.11 | `make setup` |

---

## ⚙️ 2. Phiên bản Thư viện Cốt lõi

| Thư viện | Phiên bản cố định | Vai trò kỹ thuật | Mức độ ảnh hưởng |
| :--- | :---: | :--- | :--- |
| **Python** | `3.10.x` - `3.11.x` | Base Runtime | Cốt lõi |
| **FastAPI** | `>= 0.110.0` | High-performance REST API | Backend |
| **Pydantic** | `>= 2.6.0` | DTO & Data Contract Validation | Schema |
| **SQLAlchemy** | `>= 2.0.28` | ORM & Repository Pattern | Database |
| **ChromaDB** | `>= 0.4.24` | Local Vector Store (Embedded) | AI / RAG |
| **Sentence-Transformers** | `>= 2.5.1` | Local CPU Embedding Engine | AI / RAG |
| **Ruff** | `>= 0.6.2` | Siêu linter, formatter bằng Rust | Code Quality |
| **Pytest** | `>= 8.0.0` | Automated Testing Framework | CI / Testing |
