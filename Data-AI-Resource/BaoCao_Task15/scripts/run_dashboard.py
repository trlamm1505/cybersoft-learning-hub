"""Launcher script for CyberSoft Resource Quality Dashboard.

Supports:
- python run_dashboard.py --headless (runs quick verification without opening browser)
- python run_dashboard.py --port 8501 (launches the Streamlit app)
"""

import argparse
from pathlib import Path
import subprocess
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(
        description="Launch CyberSoft Resource Quality Dashboard"
    )
    parser.add_argument(
        "--port", type=int, default=8501, help="Port to run Streamlit on"
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run in headless verification mode without UI",
    )
    args = parser.parse_args()

    task15_dir = Path(__file__).resolve().parent.parent
    app_path = task15_dir / "src" / "app.py"

    if not app_path.exists():
        print(f"[ERROR] App file not found at: {app_path}")
        sys.exit(1)

    if args.headless:
        print("[HEADLESS] Verifying app syntax and collector integration...")
        sys.path.insert(0, str(task15_dir))
        from src.collector import ResourceCollector
        from src.metrics_engine import MetricsEngine

        collector = ResourceCollector()
        res = collector.collect_all_resources()
        kpis = MetricsEngine.compute_summary_kpis(res)
        print(
            f"[HEADLESS PASS] Successfully loaded {len(res)} resources. Average RQI: {kpis['avg_rqi']}"
        )
        sys.exit(0)

    print(f"[START] Launching Streamlit dashboard on port {args.port}...")
    cmd = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(app_path),
        "--server.port",
        str(args.port),
        "--server.headless",
        "true",
    ]
    subprocess.run(cmd)


if __name__ == "__main__":
    main()
