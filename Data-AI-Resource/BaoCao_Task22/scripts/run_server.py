"""Runner script to launch CyberSoft Data Resource Portal v0.1 FastAPI Server."""

import sys
import uvicorn

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

if __name__ == "__main__":
    print("=" * 70)
    print("Khởi động Máy chủ CyberSoft Data Resource Portal v0.1 (Task 22)...")
    print("Giao diện Web Portal:   http://localhost:8000/portal/")
    print("Tài liệu Swagger UI:   http://localhost:8000/docs")
    print("Tài liệu ReDoc:        http://localhost:8000/redoc")
    print("=" * 70)
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
