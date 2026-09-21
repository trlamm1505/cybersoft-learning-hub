"""
Test 6: Kiểm tra tính hợp lệ và cấu trúc schema của rubric.json (Barem 100 điểm).
"""

import json


def test_rubric_schema_and_weights(task14_paths):
    rubric_path = task14_paths["rubric_json"]
    with open(rubric_path, "r", encoding="utf-8") as f:
        rubric = json.load(f)

    assert rubric["total_points"] == 100, "Tổng điểm phải là 100"
    assert rubric["core_points"] == 70, "Điểm Core phải là 70"
    assert rubric["extension_points"] == 30, "Điểm Extension phải là 30"

    criteria = rubric["criteria"]
    total_max = sum(c["max_points"] for c in criteria)
    assert (
        total_max == 100
    ), f"Tổng max_points của các tiêu chí ({total_max}) phải đúng bằng 100"

    core_sum = sum(c["max_points"] for c in criteria if c["type"] == "Core")
    ext_sum = sum(c["max_points"] for c in criteria if c["type"] == "Extension")
    assert core_sum == 70, f"Tổng điểm Core ({core_sum}) phải là 70"
    assert ext_sum == 30, f"Tổng điểm Extension ({ext_sum}) phải là 30"

    # Kiểm tra các nhóm danh mục bắt buộc
    categories = {c["category"] for c in criteria}
    expected_categories = {
        "Retrieval Performance",
        "Generation Quality",
        "Citation & Abstention Guardrails",
        "Latency & Cost Efficiency",
    }
    assert expected_categories.issubset(
        categories
    ), f"Thiếu danh mục đánh giá: {expected_categories - categories}"
