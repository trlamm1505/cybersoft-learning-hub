"""Configuration module for Task 27 - QA Harness Integration & Release Gate."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "shared_fixtures"

PORT = int(os.getenv("PORT", "8001"))
HOST = os.getenv("HOST", "127.0.0.1")
SERVICE_NAME = "cybersoft-qa-quality-gate-engine"
VERSION = "v1.0.0"
API_PREFIX = "/api/v1/qa"

RULES_PATH = DATA_DIR / "shared_qa_rules.json"
DATASET_FIXTURES_PATH = DATA_DIR / "qa_dataset_fixtures.json"
RAG_FIXTURES_PATH = DATA_DIR / "qa_rag_fixtures.json"
CONTENT_FIXTURES_PATH = DATA_DIR / "qa_content_fixtures.json"
