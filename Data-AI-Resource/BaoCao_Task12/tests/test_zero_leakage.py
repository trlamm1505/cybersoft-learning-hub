import os
import re


def test_no_solution_files_in_student_edition(task12_paths):
    student_dir = task12_paths["student"]
    forbidden_patterns = [
        r".*solution.*",
        r".*expected_kpi.*",
        r".*auto_grader.*",
        r".*ground_truth.*",
    ]

    leaked = []
    for root, _, files in os.walk(student_dir):
        for file in files:
            for pat in forbidden_patterns:
                if re.match(pat, file, re.IGNORECASE):
                    leaked.append(os.path.join(root, file))

    assert (
        len(leaked) == 0
    ), f"Phát hiện tệp lời giải rò rỉ trong student_edition: {leaked}"


def test_no_ground_truth_kpis_in_student_brief(task12_paths):
    """Đảm bảo trong PROJECT_BRIEF.md không vô tình để lộ đáp số $388,850.28 hay $121,652.51."""
    brief_path = os.path.join(task12_paths["student"], "PROJECT_BRIEF.md")
    with open(brief_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "388,850.28" not in content, "Rò rỉ Net Revenue trong PROJECT_BRIEF.md!"
    assert "121,652.51" not in content, "Rò rỉ Gross Profit trong PROJECT_BRIEF.md!"
    assert "388850.28" not in content, "Rò rỉ số thô trong PROJECT_BRIEF.md!"
