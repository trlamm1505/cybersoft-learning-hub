# -*- coding: utf-8 -*-
"""
Validator CLI for Task 08 - CyberSoft Academy RAG Dataset
Performs comprehensive integrity validation across Corpus and Evaluation Benchmark.

POSIX Exit Codes:
  0: Success (100% PASS, zero violations)
  1: Data Quality Violation (Schema error, broken citation, answer leakage)
  2: Fatal System Error (Missing directories/files, parse failure)
"""

import os
import sys
import json
import csv
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_DIR = os.path.join(BASE_DIR, "data", "corpus")
EVAL_DIR = os.path.join(BASE_DIR, "data", "eval_qa")
MANIFEST_PATH = os.path.join(CORPUS_DIR, "corpus_manifest.json")
EVAL_JSON_PATH = os.path.join(EVAL_DIR, "rag_eval_questions.json")
EVAL_CSV_PATH = os.path.join(EVAL_DIR, "rag_eval_questions.csv")


def log_step(title):
    print(f"\n[CHECK] {title}...")


def main():
    print("=" * 80)
    print(" CYBERSOFT DATA & AI RESOURCE QUALITY GATE - TASK 08 RAG VALIDATOR")
    print("=" * 80)

    violations = []
    fatal_errors = []

    # Check 1: Existence of Directories and Files
    log_step("1. Checking Directory & Essential Files Existence")
    if not os.path.isdir(CORPUS_DIR):
        fatal_errors.append(f"Missing corpus directory: {CORPUS_DIR}")
    if not os.path.isdir(EVAL_DIR):
        fatal_errors.append(f"Missing eval directory: {EVAL_DIR}")
    if not os.path.isfile(MANIFEST_PATH):
        fatal_errors.append(f"Missing corpus manifest: {MANIFEST_PATH}")
    if not os.path.isfile(EVAL_JSON_PATH):
        fatal_errors.append(f"Missing eval json: {EVAL_JSON_PATH}")
    if not os.path.isfile(EVAL_CSV_PATH):
        fatal_errors.append(f"Missing eval csv: {EVAL_CSV_PATH}")

    if fatal_errors:
        for err in fatal_errors:
            print(f"  [FATAL] {err}")
        print("\nValidator terminating with Exit Code 2 (Fatal System Error).")
        sys.exit(2)

    print("  -> All core directories and files exist.")

    # Check 2: Load and Verify Corpus Documents
    log_step("2. Validating Corpus Documents & Metadata Frontmatter")
    try:
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)
            if len(manifest_data) < 20:
                violations.append(
                    f"Manifest documents count {len(manifest_data)} is below minimum requirement of 20."
                )
    except Exception as e:
        print(f"  [FATAL] Failed to parse manifest JSON: {e}")
        sys.exit(2)

    doc_files = [f for f in os.listdir(CORPUS_DIR) if f.endswith(".md")]
    print(f"  -> Found {len(doc_files)} Markdown files in corpus directory.")
    if len(doc_files) < 20:
        violations.append(
            f"Corpus documents count {len(doc_files)} is below minimum requirement of 20."
        )

    corpus_map = {}
    required_frontmatter = [
        "document_id",
        "title",
        "category",
        "version",
        "effective_date",
        "author",
        "tags",
        "target_audience",
    ]

    for df in doc_files:
        path = os.path.join(CORPUS_DIR, df)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse frontmatter
        fm_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
        if not fm_match:
            violations.append(f"File {df} is missing YAML frontmatter.")
            continue

        fm_text = fm_match.group(1)
        fm_dict = {}
        for line in fm_text.split("\n"):
            line = line.strip()
            if ":" in line:
                k, v = line.split(":", 1)
                fm_dict[k.strip()] = v.strip().strip('"').strip("'")

        for req in required_frontmatter:
            if req not in fm_dict:
                violations.append(
                    f"File {df} missing required frontmatter key '{req}'."
                )

        doc_id = fm_dict.get("document_id", "")
        # Parse sections
        sections = {}
        sec_matches = re.finditer(
            r"##\s+(SEC-[A-Z0-9\-]+):\s+([^\n]+)\n(.*?)(?=\n##\s+SEC-|\Z)",
            content,
            re.DOTALL,
        )
        for sm in sec_matches:
            s_id = sm.group(1).strip()
            s_title = sm.group(2).strip()
            s_content = sm.group(3).strip()
            sections[s_id] = {
                "section_id": s_id,
                "section_title": s_title,
                "content": s_content,
            }

        if len(sections) == 0:
            violations.append(
                f"File {df} does not contain any valid '## SEC-...' sections."
            )

        corpus_map[doc_id] = {
            "metadata": fm_dict,
            "filename": df,
            "sections": sections,
            "raw_content": content,
        }

    print(
        f"  -> Successfully parsed {len(corpus_map)} documents with {sum(len(d['sections']) for d in corpus_map.values())} sections."
    )

    # Check 3: Load and Validate Evaluation Benchmark Questions
    log_step("3. Validating 100 RAG Evaluation Benchmark Questions")
    try:
        with open(EVAL_JSON_PATH, "r", encoding="utf-8") as f:
            eval_data = json.load(f)
    except Exception as e:
        print(f"  [FATAL] Failed to parse eval JSON: {e}")
        sys.exit(2)

    total_q = len(eval_data)
    print(f"  -> Total evaluation questions loaded: {total_q}")
    if total_q != 100:
        violations.append(
            f"Expected exactly 100 evaluation questions, but found {total_q}."
        )

    # Check distribution
    types_count = {}
    categories_count = {}
    for q in eval_data:
        t = q.get("type", "Unknown")
        c = q.get("category", "Unknown")
        types_count[t] = types_count.get(t, 0) + 1
        categories_count[c] = categories_count.get(c, 0) + 1

    print(f"  -> Types distribution: {types_count}")
    print(f"  -> Categories distribution: {categories_count}")

    if types_count.get("Answerable - Single Hop", 0) != 40:
        violations.append(
            f"Expected 40 Single-Hop questions, got {types_count.get('Answerable - Single Hop', 0)}."
        )
    if types_count.get("Answerable - Multi Hop", 0) != 20:
        violations.append(
            f"Expected 20 Multi-Hop questions, got {types_count.get('Answerable - Multi Hop', 0)}."
        )
    if types_count.get("Unanswerable", 0) != 20:
        violations.append(
            f"Expected 20 Unanswerable questions, got {types_count.get('Unanswerable', 0)}."
        )
    if types_count.get("Adversarial / Distractor", 0) != 20:
        violations.append(
            f"Expected 20 Adversarial / Distractor questions, got {types_count.get('Adversarial / Distractor', 0)}."
        )

    # Check 4: Ground-Truth Citations Integrity
    log_step("4. Validating Ground-Truth Citations Strict Match")
    valid_citations_count = 0
    for q in eval_data:
        qid = q.get("question_id", "Unknown")
        qtype = q.get("type", "")
        citations = q.get("citations", [])

        if qtype == "Unanswerable":
            if len(citations) != 0:
                violations.append(
                    f"Question {qid} is Unanswerable but has non-empty citations."
                )
        else:
            if len(citations) == 0:
                violations.append(
                    f"Question {qid} of type '{qtype}' must have at least 1 citation."
                )

            for cit in citations:
                doc_id = cit.get("document_id", "")
                sec_id = cit.get("section_id", "")
                text_cit = cit.get("text_citation", "")

                if doc_id not in corpus_map:
                    violations.append(
                        f"Question {qid} references non-existent document_id: '{doc_id}'."
                    )
                    continue

                doc_obj = corpus_map[doc_id]
                if sec_id not in doc_obj["sections"]:
                    violations.append(
                        f"Question {qid} references non-existent section_id '{sec_id}' in doc '{doc_id}'."
                    )
                    continue

                sec_content = doc_obj["sections"][sec_id]["content"]
                if text_cit not in sec_content:
                    violations.append(
                        f"Question {qid} citation text NOT found in {doc_id} -> {sec_id}. Citation: '{text_cit[:40]}...'"
                    )
                else:
                    valid_citations_count += 1

    print(f"  -> Total verified authentic citation text spans: {valid_citations_count}")

    # Check 5: Anti-Leakage Audit
    log_step("5. Executing Anti-Leakage & Query Quality Audit")
    leakage_count = 0
    for q in eval_data:
        qid = q.get("question_id", "Unknown")
        query = q.get("query", "").lower()

        # Rule 1: Query must not contain raw internal section IDs
        if "sec-" in query:
            violations.append(
                f"Question {qid} contains internal section ID in query text (Leakage!): '{query}'."
            )
            leakage_count += 1

        # Rule 2: Query must not leak document file IDs directly as hints
        if re.search(r"\bcs-(pol|tec|crs|faq)-\d{3}\b", query):
            violations.append(
                f"Question {qid} contains explicit document ID in query text: '{query}'."
            )
            leakage_count += 1

        # Rule 3: Query should have sufficient length
        if len(query.split()) < 5:
            violations.append(
                f"Question {qid} query is too short ({len(query.split())} words): '{query}'."
            )

    if leakage_count == 0:
        print(
            "  -> Zero Answer Leakage verified! All queries pass heuristic anti-leakage checks."
        )

    # Check 6: CSV & JSON Parity
    log_step("6. Validating JSON and CSV Parity")
    csv_rows = []
    with open(EVAL_CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_rows.append(row)

    if len(csv_rows) != total_q:
        violations.append(
            f"CSV row count ({len(csv_rows)}) does not match JSON count ({total_q})."
        )
    else:
        print(
            f"  -> CSV row count ({len(csv_rows)}) perfectly matches JSON count ({total_q})."
        )

    # Summary Report
    print("\n" + "=" * 80)
    print(" VALIDATION SUMMARY REPORT")
    print("=" * 80)
    print(f"  - Total Corpus Documents:      {len(corpus_map)} (DoD minimum: 20)")
    print(
        f"  - Total Corpus Sections:       {sum(len(d['sections']) for d in corpus_map.values())}"
    )
    print(f"  - Total Benchmark Questions:   {total_q} (DoD requirement: 100)")
    print(f"  - Verified Ground Truth Citations: {valid_citations_count}")
    print(f"  - Total Quality Violations:    {len(violations)}")

    if violations:
        print("\n[FAIL] Found Quality Violations:")
        for idx, v in enumerate(violations, 1):
            print(f"  {idx}. {v}")
        print("\nValidator exiting with Exit Code 1 (Data Quality Violation).")
        sys.exit(1)
    else:
        print("\n[PASS] ALL CHECKS PASSED 100%! DATASET INTEGRITY VERIFIED.")
        print("Validator exiting with Exit Code 0 (Success).")
        sys.exit(0)


if __name__ == "__main__":
    main()
