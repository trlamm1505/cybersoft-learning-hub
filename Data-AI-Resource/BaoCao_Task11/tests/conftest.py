"""Pytest configuration and pythonpath setup for Task 11."""

import sys
from pathlib import Path

# Add BaoCao_Task11 and src to sys.path
task11_dir = Path(__file__).resolve().parent.parent
src_dir = task11_dir / "src"

if str(task11_dir) not in sys.path:
    sys.path.insert(0, str(task11_dir))
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))
