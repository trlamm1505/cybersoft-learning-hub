"""Tests verifying existence and schema integrity of prompt versions."""

from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def test_prompt_files_exist():
    assert (PROMPTS_DIR / "system_prompt_v1.txt").exists()
    assert (PROMPTS_DIR / "system_prompt_v2.txt").exists()
    assert (PROMPTS_DIR / "system_prompt_v3.txt").exists()
    assert (PROMPTS_DIR / "prompt_changelog.md").exists()


def test_system_prompt_v3_contains_guardrails_and_schema():
    content = (PROMPTS_DIR / "system_prompt_v3.txt").read_text(encoding="utf-8")

    # Verify context boundary tag
    assert "<context_boundary>" in content
    assert "</context_boundary>" in content

    # Verify security perimeters
    assert "ANTI-INJECTION PERIMETER" in content
    assert "ABSTENTION PROTOCOL" in content
    assert "ZERO-HALLUCINATION" in content

    # Verify schema fields
    assert "status" in content
    assert "citations" in content
    assert "chunk_id" in content
    assert "document_code" in content
    assert "section_title" in content
    assert "exact_quote" in content


def test_prompt_changelog_content():
    content = (PROMPTS_DIR / "prompt_changelog.md").read_text(encoding="utf-8")
    assert "Phiên bản v1.0" in content
    assert "Phiên bản v2.0" in content
    assert "Phiên bản v3.0" in content
    assert "ABLATION STUDY" in content
