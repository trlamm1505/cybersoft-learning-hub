import json
from pathlib import Path

import pytest

FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURE_DIR / name).open(encoding="utf-8") as file:
        return json.load(file)


@pytest.fixture
def learning_platform() -> dict:
    return load_fixture("mock_learning_platform.json")


@pytest.fixture
def ai_evaluation_fixture() -> dict:
    return load_fixture("mock_ai_evaluation.json")

