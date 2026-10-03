"""Run FastAPI server for CyberSoft AI Tutor (Task 19).
Usage:
    python scripts/run_tutor_api.py [--host 0.0.0.0] [--port 8000]
"""

import argparse
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import uvicorn  # noqa: E402
from src.api import create_app  # noqa: E402
from src.tutor_engine import CyberSoftAITutor  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="Run CyberSoft AI Tutor API")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host interface")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    args = parser.parse_args()

    print("===========================================================================")
    print("  CYBERSOFT AI TUTOR REST API SERVER — TASK 19")
    print("===========================================================================")
    print(f"[*] Starting server at http://{args.host}:{args.port}")
    print(f"[*] Swagger UI available at http://{args.host}:{args.port}/docs")
    print(f"[*] Interactive Web UI available at http://{args.host}:{args.port}/")

    tutor = CyberSoftAITutor()
    app = create_app(tutor=tutor)

    uvicorn.run(app, host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
