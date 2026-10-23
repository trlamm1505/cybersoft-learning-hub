"""Pytest fixtures for Capstone DA-02 test suite."""

import os
import pytest
import json


@pytest.fixture(scope="session")
def base_dir():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture(scope="session")
def clean_data_dir(base_dir):
    return os.path.join(
        base_dir,
        "projects",
        "DA-02_inventory_operations",
        "student_edition",
        "data",
        "clean",
    )


@pytest.fixture(scope="session")
def dirty_data_dir(base_dir):
    return os.path.join(
        base_dir,
        "projects",
        "DA-02_inventory_operations",
        "student_edition",
        "data",
        "dirty",
    )


@pytest.fixture(scope="session")
def expected_kpis(base_dir):
    kpi_path = os.path.join(
        base_dir,
        "projects",
        "DA-02_inventory_operations",
        "instructor_edition",
        "expected_kpis.json",
    )
    with open(kpi_path, "r", encoding="utf-8-sig") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def rubric_data(base_dir):
    rubric_path = os.path.join(
        base_dir,
        "projects",
        "DA-02_inventory_operations",
        "student_edition",
        "rubric.json",
    )
    with open(rubric_path, "r", encoding="utf-8-sig") as f:
        return json.load(f)
