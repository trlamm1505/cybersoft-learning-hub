"""Test cases for documentation integrity and forbidden terms scanning."""

from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parent.parent / "docs"
TASK30_ROOT = Path(__file__).resolve().parent.parent


def test_technical_handbook_exists():
    handbook = DOCS_DIR / "technical_handbook.md"
    assert handbook.exists()
    content = handbook.read_text(encoding="utf-8")
    assert "SỔ TAY KỸ THUẬT VẬN HÀNH TOÀN DIỆN" in content
    assert "Đào Trung Kiên" in content


def test_instructor_guide_exists():
    guide = DOCS_DIR / "instructor_guide.md"
    assert guide.exists()
    content = guide.read_text(encoding="utf-8")
    assert "SỔ TAY HƯỚNG DẪN DÀNH CHO GIẢNG VIÊN" in content
    assert "DS-001" in content


def test_demo_guide_exists():
    demo = DOCS_DIR / "demo_guide.md"
    assert demo.exists()
    content = demo.read_text(encoding="utf-8")
    assert "HƯỚNG DẪN QUY TRÌNH DEMO END-TO-END" in content
    assert "15 PHÚT" in content


def test_retro_and_roadmap_exists():
    retro = DOCS_DIR / "retro_and_roadmap.md"
    assert retro.exists()
    content = retro.read_text(encoding="utf-8")
    assert "START / STOP / CONTINUE" in content
    assert "LỘ TRÌNH PHÁT TRIỂN 60 NGÀY" in content


def test_giai_thich_guide_exists():
    guide = DOCS_DIR / "GIAI_THICH.md"
    assert guide.exists()
    assert guide.stat().st_size > 100


def test_zero_forbidden_terms_in_docs():
    forbidden = "kịch" + "bản"
    for md_file in DOCS_DIR.glob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        assert forbidden not in content.lower(), f"File {md_file.name} contains forbidden term"
