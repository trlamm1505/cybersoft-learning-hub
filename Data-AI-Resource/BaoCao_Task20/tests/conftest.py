"""Pytest configuration and shared fixtures for Task 20."""

from pathlib import Path
import sys
import pytest

TEST_DIR = Path(__file__).resolve().parent
TASK20_DIR = TEST_DIR.parent

if str(TASK20_DIR) not in sys.path:
    sys.path.insert(0, str(TASK20_DIR))


@pytest.fixture
def task20_dir() -> Path:
    return TASK20_DIR


@pytest.fixture
def sample_eval_item():
    return {
        "id": "TEST-01",
        "category": "standard_qa",
        "query": "Học viên phải bảo đảm tỷ lệ chuyên cần bao nhiêu %?",
        "expected_behavior": "ANSWER",
        "expected_doc_ids": ["CS-POL-003"],
        "expected_chunk_ids": ["CS-POL-003_hdr_000"],
        "ground_truth_keywords": ["chuyên cần", "80%"],
        "ground_truth_answer": "Học viên phải tham gia tối thiểu 80% số buổi học.",
    }


@pytest.fixture
def sample_ood_item():
    return {
        "id": "TEST-OOD",
        "category": "unanswerable_out_of_domain",
        "query": "Công thức nấu phở bò gia truyền?",
        "expected_behavior": "ABSTAIN",
        "expected_doc_ids": [],
        "expected_chunk_ids": [],
        "ground_truth_keywords": ["từ chối"],
        "ground_truth_answer": "Câu hỏi ẩm thực ngoài phạm vi học liệu.",
    }
