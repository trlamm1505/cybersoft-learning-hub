"""Pytest fixtures for CyberSoft Task 19 AI Tutor."""

from __future__ import annotations

from pathlib import Path
import sys
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.tutor_engine import CyberSoftAITutor  # noqa: E402


@pytest.fixture(scope="session")
def real_indexes_dir():
    return BASE_DIR / "indexes"


@pytest.fixture(scope="session")
def ai_tutor(real_indexes_dir):
    return CyberSoftAITutor(indexes_dir=real_indexes_dir, similarity_threshold=0.35)
