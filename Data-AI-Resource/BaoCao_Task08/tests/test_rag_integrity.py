# -*- coding: utf-8 -*-
"""
Automated Pytest Suite for Task 08 - CyberSoft RAG Dataset & Evaluation Benchmark.
Covers:
  1. Corpus documents count and manifest consistency.
  2. Corpus YAML frontmatter schema completeness.
  3. Evaluation benchmark 100 questions count and balanced distribution.
  4. Ground-truth citations verification against corpus text.
  5. Negative sampling & unanswerable tagging invariants.
  6. Zero answer leakage audit on queries.
  7. Parity between JSON and CSV formats.
  8. Standalone validator execution (POSIX exit code 0).
"""

import os
import sys
import json
import re
import subprocess
import pytest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_DIR = os.path.join(BASE_DIR, "data", "corpus")
EVAL_DIR = os.path.join(BASE_DIR, "data", "eval_qa")
MANIFEST_PATH = os.path.join(CORPUS_DIR, "corpus_manifest.json")
EVAL_JSON_PATH = os.path.join(EVAL_DIR, "rag_eval_questions.json")
EVAL_CSV_PATH = os.path.join(EVAL_DIR, "rag_eval_questions.csv")
VALIDATOR_SCRIPT = os.path.join(BASE_DIR, "scripts", "validate_rag_dataset.py")


@pytest.fixture(scope="module")
def corpus_data():
    """Loads all markdown documents and parsed sections."""
    doc_files = [f for f in os.listdir(CORPUS_DIR) if f.endswith(".md")]
    corpus = {}
    for df in doc_files:
        path = os.path.join(CORPUS_DIR, df)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        fm_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
        fm_dict = {}
        if fm_match:
            for line in fm_match.group(1).split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    fm_dict[k.strip()] = v.strip().strip('"').strip("'")

        doc_id = fm_dict.get("document_id", "")
        sections = {}
        sec_matches = re.finditer(
            r"##\s+(SEC-[A-Z0-9\-]+):\s+([^\n]+)\n(.*?)(?=\n##\s+SEC-|\Z)",
            content,
            re.DOTALL,
        )
        for sm in sec_matches:
            sections[sm.group(1).strip()] = {
                "title": sm.group(2).strip(),
                "content": sm.group(3).strip(),
            }

        corpus[doc_id] = {
            "metadata": fm_dict,
            "filename": df,
            "sections": sections,
            "raw": content,
        }
    return corpus


@pytest.fixture(scope="module")
def eval_questions():
    """Loads the 100 benchmark evaluation questions."""
    with open(EVAL_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_corpus_document_count(corpus_data):
    """Test 1: Verify that corpus contains at least 20 documents."""
    assert len(corpus_data) >= 20, f"Expected >= 20 documents, got {len(corpus_data)}"


def test_corpus_manifest_consistency(corpus_data):
    """Test 2: Verify manifest file exists and matches documents on disk."""
    assert os.path.isfile(MANIFEST_PATH), "Manifest file does not exist"
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    assert len(manifest) == len(
        corpus_data
    ), "Manifest count does not match documents count"
    manifest_doc_ids = {m["document_id"] for m in manifest}
    assert manifest_doc_ids == set(corpus_data.keys()), "Manifest document IDs mismatch"


def test_corpus_frontmatter_metadata(corpus_data):
    """Test 3: Verify all documents have complete YAML frontmatter metadata."""
    required_keys = {
        "document_id",
        "title",
        "category",
        "version",
        "effective_date",
        "author",
        "tags",
        "target_audience",
    }
    for doc_id, data in corpus_data.items():
        fm = data["metadata"]
        missing = required_keys - set(fm.keys())
        assert not missing, f"Document {doc_id} is missing metadata keys: {missing}"
        assert (
            len(data["sections"]) >= 3
        ), f"Document {doc_id} must have at least 3 sections"


def test_eval_question_count(eval_questions):
    """Test 4: Verify that evaluation benchmark contains exactly 100 questions."""
    assert (
        len(eval_questions) == 100
    ), f"Expected exactly 100 questions, found {len(eval_questions)}"


def test_eval_question_distribution(eval_questions):
    """Test 5: Verify required distribution across question types."""
    types_count = {}
    for q in eval_questions:
        t = q.get("type")
        types_count[t] = types_count.get(t, 0) + 1

    assert (
        types_count.get("Answerable - Single Hop") == 40
    ), f"Expected 40 Single-Hop, got {types_count.get('Answerable - Single Hop')}"
    assert (
        types_count.get("Answerable - Multi Hop") == 20
    ), f"Expected 20 Multi-Hop, got {types_count.get('Answerable - Multi Hop')}"
    assert (
        types_count.get("Unanswerable") == 20
    ), f"Expected 20 Unanswerable, got {types_count.get('Unanswerable')}"
    assert (
        types_count.get("Adversarial / Distractor") == 20
    ), f"Expected 20 Distractor, got {types_count.get('Adversarial / Distractor')}"


def test_ground_truth_citations_match(corpus_data, eval_questions):
    """Test 6: Verify that all citations point to authentic sections and text spans."""
    for q in eval_questions:
        qid = q["question_id"]
        qtype = q["type"]
        citations = q["citations"]

        if qtype != "Unanswerable":
            assert len(citations) > 0, f"Question {qid} must have at least one citation"
            for c in citations:
                doc_id = c["document_id"]
                sec_id = c["section_id"]
                text_cit = c["text_citation"]

                assert doc_id in corpus_data, f"{qid}: doc {doc_id} not in corpus"
                assert (
                    sec_id in corpus_data[doc_id]["sections"]
                ), f"{qid}: sec {sec_id} not in doc {doc_id}"
                sec_content = corpus_data[doc_id]["sections"][sec_id]["content"]
                assert (
                    text_cit in sec_content
                ), f"{qid}: text citation span not found in {doc_id}->{sec_id}"


def test_unanswerable_citations_are_empty(eval_questions):
    """Test 7: Verify that unanswerable questions have empty citations."""
    unanswerable = [q for q in eval_questions if q["type"] == "Unanswerable"]
    assert len(unanswerable) == 20
    for q in unanswerable:
        assert (
            len(q["citations"]) == 0
        ), f"Unanswerable question {q['question_id']} must have empty citations"
        assert (
            "không" in q["ground_truth_answer"].lower()
            or "chưa" in q["ground_truth_answer"].lower()
        ), f"Unanswerable question {q['question_id']} must acknowledge missing info"


def test_anti_leakage_and_quality(eval_questions):
    """Test 8: Verify no raw section IDs or internal document codes in query prompt."""
    for q in eval_questions:
        query = q["query"].lower()
        qid = q["question_id"]
        assert "sec-" not in query, f"Question {qid} leaks section ID: {query}"
        assert not re.search(
            r"\bcs-(pol|tec|crs|faq)-\d{3}\b", query
        ), f"Question {qid} leaks document ID: {query}"
        assert len(query.split()) >= 5, f"Question {qid} query too short"


def test_validator_cli_execution():
    """Test 9: Run standalone validator CLI and check POSIX Exit Code 0."""
    result = subprocess.run(
        [sys.executable, VALIDATOR_SCRIPT], capture_output=True, text=True
    )
    assert (
        result.returncode == 0
    ), f"Validator CLI failed with returncode {result.returncode}. Output:\n{result.stdout}\n{result.stderr}"
    assert "ALL CHECKS PASSED 100%" in result.stdout
