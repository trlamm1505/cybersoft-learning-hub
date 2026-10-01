"""Server startup script for CyberSoft AI Exercise Generator v0.1 (Task 23)."""

from pathlib import Path
import sys
import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import SERVER_HOST, SERVER_PORT


def main():
    print("=" * 70)
    print("CYBERSOFT DATA & AI LAB - AI EXERCISE GENERATOR v0.1")
    print(f"Khởi chạy máy chủ tại: http://{SERVER_HOST}:{SERVER_PORT}")
    print(f"Giao diện Web Review Workspace: http://{SERVER_HOST}:{SERVER_PORT}/portal/")
    print(f"Tài liệu tương tác Swagger UI:   http://{SERVER_HOST}:{SERVER_PORT}/docs")
    print("=" * 70)

    uvicorn.run(
        "src.main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
