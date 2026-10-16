"""Configuration settings for CyberSoft AI Exercise Generator v0.1."""

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATASETS_DIR = DATA_DIR / "datasets"
PORTAL_STATIC_DIR = BASE_DIR / "portal"

# Artifact file paths
APPROVED_FILE = DATA_DIR / "approved_exercises_20.json"
DRAFTS_FILE = DATA_DIR / "draft_exercises.json"
PROMPT_LOG_FILE = DATA_DIR / "prompt_eval_log.json"

# Quality & DoD Calibration Thresholds
DEDUPLICATION_THRESHOLD = 0.70  # Max acceptable similarity (70%)
TARGET_APPROVED_COUNT = 20  # DoD deliverable: 20 approved exercises
MIN_PASS_RATE_ROUND_1 = 0.80  # DoD criterion: at least 80% pass rate
MAX_REVIEW_ROUNDS = 2  # DoD criterion: max 2 review rounds

# Supported Bloom Taxonomy Levels
BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

# Supported Difficulty Levels
DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"]

# Exercise Types
EXERCISE_TYPES = ["SQL", "Python", "Data Analysis"]

# Server Configuration
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8000
