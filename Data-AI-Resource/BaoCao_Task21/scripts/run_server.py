"""Launcher script for CyberSoft Data & AI API Service."""

import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import uvicorn  # noqa: E402
from src.config import HOST, PORT  # noqa: E402

if __name__ == "__main__":
    print(f"Starting CyberSoft Data & AI API Service on http://{HOST}:{PORT}")
    print(f"Interactive Swagger Docs: http://{HOST}:{PORT}/docs")
    print(f"Interactive ReDoc: http://{HOST}:{PORT}/redoc")
    print(f"OpenAPI Specification JSON: http://{HOST}:{PORT}/api/v1/openapi.json")
    uvicorn.run("src.main:app", host=HOST, port=PORT, reload=True)
