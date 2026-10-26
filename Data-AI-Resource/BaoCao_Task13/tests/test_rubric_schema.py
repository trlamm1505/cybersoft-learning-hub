"""Validate Rubric JSON schema and quantitative constraints."""


def test_rubric_structure(rubric_data):
    assert rubric_data["total_points"] == 100
    assert rubric_data["grading_breakdown"]["core_points"] == 70
    assert rubric_data["grading_breakdown"]["extension_points"] == 30

    total_calc = 0
    core_calc = 0
    ext_calc = 0

    for section in rubric_data["sections"]:
        sec_pts = section["section_weight"]
        total_calc += sec_pts
        if section["category"] == "CORE":
            core_calc += sec_pts
        elif section["category"] == "EXTENSION":
            ext_calc += sec_pts

        # Verify criteria sum up to section weight
        crit_sum = sum(c["points"] for c in section["criteria"])
        assert (
            crit_sum == sec_pts
        ), f"Criteria in {section['section_id']} sum to {crit_sum}, expected {sec_pts}"

    assert total_calc == 100
    assert core_calc == 70
    assert ext_calc == 30
