# ruff: noqa: E402
"""Server launcher for CyberSoft Lineage & Versioning System."""

import sys
from pathlib import Path
import uvicorn

# Setup import path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.config import config

if __name__ == "__main__":
    print(f"Starting {config.app_name} on http://localhost:{config.port} ...")
    uvicorn.run("src.main:app", host="127.0.0.1", port=config.port, reload=False)
