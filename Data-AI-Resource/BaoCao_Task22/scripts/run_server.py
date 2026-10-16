"""Runner script to launch CyberSoft Data Resource Portal v0.1 FastAPI Server."""

import sys
from pathlib import Path

# Add project root directory to sys.path so 'src' is discoverable
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import uvicorn  # noqa: E402
from src.config import HOST, PORT  # noqa: E402

if __name__ == "__main__":
    print("=" * 70)
    print("Khởi động Máy chủ CyberSoft Data Resource Portal v0.1 (Task 22)...")
    print(f"Giao diện Web Portal:   http://localhost:{PORT}/portal/")
    print(f"Trang chủ Chuyển hướng: http://localhost:{PORT}/")
    print(f"Tài liệu Swagger UI:   http://localhost:{PORT}/docs")
    print(f"Tài liệu ReDoc:        http://localhost:{PORT}/redoc")
    print("=" * 70)
    uvicorn.run(
        "src.main:app",
        host=HOST,
        port=PORT,
        reload=False,
    )
