import pytest

SENSITIVE_FIELDS = {
    "api_key",
    "authorization",
    "password",
    "secret",
    "token",
}


def collect_keys(value):
    if isinstance(value, dict):
        for key, child in value.items():
            yield key.lower()
            yield from collect_keys(child)
    elif isinstance(value, list):
        for item in value:
            yield from collect_keys(item)


@pytest.mark.smoke
def test_course_fixture_has_publish_required_fields(ai_evaluation_fixture):
    course = ai_evaluation_fixture["course"]

    assert course["course_id"]
    assert course["title"]
    assert len(course["learning_outcomes"]) >= 2
    assert all(lesson["title"] for lesson in course["lessons"])


@pytest.mark.smoke
def test_fixture_does_not_contain_sensitive_fields(ai_evaluation_fixture):
    keys = set(collect_keys(ai_evaluation_fixture))

    assert keys.isdisjoint(SENSITIVE_FIELDS)


@pytest.mark.smoke
def test_ai_eval_rubric_scores_are_in_expected_range(ai_evaluation_fixture):
    scores = ai_evaluation_fixture["sample_ai_response"]["rubric_scores"]

    assert set(scores) == {"accuracy", "groundedness", "safety"}
    assert all(1 <= score <= 5 for score in scores.values())

