import json


def test_rubric_structure_and_point_allocation(task12_paths):
    with open(task12_paths["rubric"], "r", encoding="utf-8") as f:
        rubric = json.load(f)

    assert rubric["total_points"] == 100
    assert rubric["core_points"] == 70
    assert rubric["extension_points"] == 30
    assert (rubric["core_points"] + rubric["extension_points"]) == 100

    sum_category_weights = sum(cat["weight"] for cat in rubric["categories"])
    assert sum_category_weights == 100

    # Kiểm tra mỗi tiêu chí có 4 mức và quantitative_metric
    for cat in rubric["categories"]:
        for crit in cat["criteria"]:
            assert "quantitative_metric" in crit
            assert len(crit["quantitative_metric"]) > 10
            assert len(crit["scoring_levels"]) == 4
            levels = [lvl["level"] for lvl in crit["scoring_levels"]]
            assert set(levels) == {
                "exemplary",
                "proficient",
                "developing",
                "unsatisfactory",
            }
