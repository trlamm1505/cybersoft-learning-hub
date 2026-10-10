"""
Pytest configuration and fixtures for Capstone AI-01 test suite.
"""

import os
import sys
import pytest

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
TASK14_DIR = os.path.dirname(TEST_DIR)
PROJECT_DIR = os.path.join(TASK14_DIR, "projects", "AI-01_rag_knowledge_retrieval")
SOLUTIONS_DIR = os.path.join(PROJECT_DIR, "instructor_edition", "solutions")
GRADING_DIR = os.path.join(PROJECT_DIR, "instructor_edition", "grading")
SCRIPTS_DIR = os.path.join(TASK14_DIR, "scripts")

for p in [SOLUTIONS_DIR, GRADING_DIR, SCRIPTS_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)


@pytest.fixture(scope="session")
def task14_paths():
    return {
        "base_dir": TASK14_DIR,
        "project_dir": PROJECT_DIR,
        "student_edition": os.path.join(PROJECT_DIR, "student_edition"),
        "instructor_edition": os.path.join(PROJECT_DIR, "instructor_edition"),
        "corpus_dir": os.path.join(PROJECT_DIR, "instructor_edition", "data", "corpus"),
        "test_queries_json": os.path.join(
            PROJECT_DIR, "student_edition", "data", "eval", "test_queries.json"
        ),
        "ground_truth_json": os.path.join(
            PROJECT_DIR, "instructor_edition", "data", "ground_truth_eval.json"
        ),
        "rubric_json": os.path.join(PROJECT_DIR, "student_edition", "rubric.json"),
        "diagram_png": os.path.join(TASK14_DIR, "Picture_14_Detail.png"),
    }
