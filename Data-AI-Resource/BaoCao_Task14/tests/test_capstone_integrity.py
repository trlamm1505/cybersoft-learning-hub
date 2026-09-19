"""
Test 1: Kiểm tra tính toàn vẹn kiến trúc và cấu trúc tệp của Capstone AI-01.
"""

import json
import os


def test_directory_structure_integrity(task14_paths):
    se = task14_paths["student_edition"]
    ie = task14_paths["instructor_edition"]

    # Kiểm tra student edition
    assert os.path.exists(
        os.path.join(se, "PROJECT_BRIEF.md")
    ), "Thiếu PROJECT_BRIEF.md trong student_edition"
    assert os.path.exists(
        os.path.join(se, "rubric.json")
    ), "Thiếu rubric.json trong student_edition"
    assert os.path.exists(
        os.path.join(se, "HINTS.md")
    ), "Thiếu HINTS.md trong student_edition"
    assert os.path.exists(
        os.path.join(se, "starter_kit", "rag_starter.py")
    ), "Thiếu starter_kit/rag_starter.py"
    assert os.path.exists(
        os.path.join(se, "starter_kit", "config.yaml")
    ), "Thiếu starter_kit/config.yaml"
    assert os.path.exists(
        os.path.join(se, "starter_kit", "requirements.txt")
    ), "Thiếu starter_kit/requirements.txt"

    # Kiểm tra instructor edition
    assert os.path.exists(
        os.path.join(ie, "SOLUTION_MANUAL.md")
    ), "Thiếu SOLUTION_MANUAL.md trong instructor_edition"
    assert os.path.exists(
        os.path.join(ie, "common_pitfalls.md")
    ), "Thiếu common_pitfalls.md trong instructor_edition"
    assert os.path.exists(
        os.path.join(ie, "expected_benchmarks.json")
    ), "Thiếu expected_benchmarks.json trong instructor_edition"
    assert os.path.exists(
        os.path.join(ie, "solutions", "baseline_rag.py")
    ), "Thiếu baseline_rag.py"
    assert os.path.exists(
        os.path.join(ie, "solutions", "advanced_rag.py")
    ), "Thiếu advanced_rag.py"
    assert os.path.exists(
        os.path.join(ie, "solutions", "rag_pipeline.py")
    ), "Thiếu rag_pipeline.py"
    assert os.path.exists(
        os.path.join(ie, "grading", "auto_grader.py")
    ), "Thiếu auto_grader.py"


def test_corpus_and_eval_integrity(task14_paths):
    corpus_dir = task14_paths["corpus_dir"]
    files = [f for f in os.listdir(corpus_dir) if f.endswith(".md")]
    assert (
        len(files) == 20
    ), f"Corpus phải chứa đúng 20 tài liệu markdown, hiện có {len(files)}"

    # Kiểm tra 100 câu test queries
    with open(task14_paths["test_queries_json"], "r", encoding="utf-8") as f:
        queries = json.load(f)
    assert (
        len(queries) == 100
    ), f"Tập test queries phải chứa đúng 100 câu hỏi, hiện có {len(queries)}"

    # Kiểm tra ảnh sơ đồ kiến trúc
    assert os.path.exists(task14_paths["diagram_png"]) or os.path.exists(
        task14_paths["diagram_png"].replace("_", "-")
    ), "Thiếu Picture_14_Detail.png"
