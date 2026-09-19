"""
Test 2: Kiểm tra phòng vệ rò rỉ đáp án (Zero Answer Leakage Defense).
"""

import json
import os


def test_student_eval_data_zero_leakage(task14_paths):
    test_json = task14_paths["test_queries_json"]
    with open(test_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    forbidden_keys = {
        "ground_truth_answer",
        "citations",
        "citations_doc_ids",
        "reasoning",
        "expected_behavior",
    }
    for idx, item in enumerate(data):
        present_keys = set(item.keys())
        leaked = present_keys.intersection(forbidden_keys)
        assert not leaked, f"Câu hỏi {idx} (ID: {item.get('question_id')}) bị rò rỉ các trường nhạy cảm: {leaked}"


def test_student_edition_files_clean(task14_paths):
    se = task14_paths["student_edition"]
    # Quét tất cả các file trong student_edition (ngoại trừ corpus gốc)
    for root, dirs, files in os.walk(se):
        if "corpus" in root:
            continue
        for file in files:
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Không được chứa ground truth answers từ instructor
            assert "expected_kpis" not in file.lower()
            assert "ground_truth_eval" not in file.lower()
            assert "solution_manual" not in file.lower()
            assert "auto_grader" not in file.lower()
            assert "ground_truth_answer" not in content
