"""Tests for multi-channel catalog generation."""

from __future__ import annotations

import json
from pathlib import Path

from src.core.registry_manager import RegistryManager
from src.portal.catalog_generator import CatalogGenerator


def test_build_catalog_outputs(tmp_path: Path):
    reg_store = tmp_path / "reg_store"
    cat_output = tmp_path / "catalog_out"

    manager = RegistryManager(store_dir=reg_store)
    generator = CatalogGenerator(manager=manager, output_dir=cat_output)

    res = generator.build_all()

    md_file = res["markdown"]
    json_file = res["json"]
    html_file = res["html"]

    assert md_file.exists()
    assert json_file.exists()
    assert html_file.exists()

    # Verify Markdown
    with open(md_file, "r", encoding="utf-8") as f:
        md_text = f.read()
    assert "CyberSoft Dataset Registry" in md_text
    assert "Tổng quan Tài nguyên" in md_text

    # Verify JSON API
    with open(json_file, "r", encoding="utf-8") as f:
        json_data = json.load(f)
    assert json_data["catalog_version"] == "1.0.0"
    assert "published_datasets" in json_data

    # Verify HTML Portal
    with open(html_file, "r", encoding="utf-8") as f:
        html_text = f.read()
    assert "<!DOCTYPE html>" in html_text
    assert "searchInput" in html_text
