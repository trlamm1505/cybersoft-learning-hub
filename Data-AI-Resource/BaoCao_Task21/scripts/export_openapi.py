"""Script to export OpenAPI JSON & YAML contracts and generate Postman Collection."""

import json
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import yaml  # noqa: E402
from src.main import app  # noqa: E402

CONTRACTS_DIR = BASE_DIR / "contracts"
CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)


def export_openapi_specs():
    openapi_schema = app.openapi()

    # 1. Export JSON
    json_path = CONTRACTS_DIR / "openapi.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    print(f"Exported OpenAPI JSON to {json_path}")

    # 2. Export YAML
    yaml_path = CONTRACTS_DIR / "openapi.yaml"
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(openapi_schema, f, allow_unicode=True, sort_keys=False)
    print(f"Exported OpenAPI YAML to {yaml_path}")


def generate_postman_collection():
    collection = {
        "info": {
            "_postman_id": "cybersoft-data-ai-api-v1",
            "name": "CyberSoft Data & AI Lab API v1.0",
            "description": "Collection kiểm thử và tích hợp toàn diện API CyberSoft Data & AI Lab phục vụ TTS 02 (Learning Hub) và TTS 03 (QA Platform).",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "item": [
            {
                "name": "1. Health & Metadata",
                "item": [
                    {
                        "name": "GET Health Check",
                        "request": {
                            "method": "GET",
                            "header": [],
                            "url": {
                                "raw": "{{base_url}}/api/v1/health",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "health"],
                            },
                        },
                    },
                    {
                        "name": "GET API Info & SLA",
                        "request": {
                            "method": "GET",
                            "header": [],
                            "url": {
                                "raw": "{{base_url}}/api/v1/info",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "info"],
                            },
                        },
                    },
                ],
            },
            {
                "name": "2. Dataset Registry",
                "item": [
                    {
                        "name": "GET List Datasets",
                        "request": {
                            "method": "GET",
                            "header": [
                                {
                                    "key": "X-API-Key",
                                    "value": "{{student_api_key}}",
                                    "type": "text",
                                }
                            ],
                            "url": {
                                "raw": "{{base_url}}/api/v1/registry/datasets?limit=10&offset=0",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "registry", "datasets"],
                                "query": [
                                    {"key": "limit", "value": "10"},
                                    {"key": "offset", "value": "0"},
                                ],
                            },
                        },
                    },
                    {
                        "name": "GET Dataset Detail by ID",
                        "request": {
                            "method": "GET",
                            "header": [
                                {
                                    "key": "X-API-Key",
                                    "value": "{{student_api_key}}",
                                    "type": "text",
                                }
                            ],
                            "url": {
                                "raw": "{{base_url}}/api/v1/registry/datasets/ds-retail-ecommerce-sales-v1",
                                "host": ["{{base_url}}"],
                                "path": [
                                    "api",
                                    "v1",
                                    "registry",
                                    "datasets",
                                    "ds-retail-ecommerce-sales-v1",
                                ],
                            },
                        },
                    },
                    {
                        "name": "GET List Capstone Projects",
                        "request": {
                            "method": "GET",
                            "header": [
                                {
                                    "key": "X-API-Key",
                                    "value": "{{instructor_api_key}}",
                                    "type": "text",
                                }
                            ],
                            "url": {
                                "raw": "{{base_url}}/api/v1/registry/projects",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "registry", "projects"],
                            },
                        },
                    },
                ],
            },
            {
                "name": "3. Semantic Search",
                "item": [
                    {
                        "name": "POST Semantic Hybrid Search",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "X-API-Key", "value": "{{student_api_key}}"},
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps(
                                    {
                                        "query": "thuật toán hybrid search RRF kết hợp BM25 và Vector",
                                        "top_k": 3,
                                        "similarity_threshold": 0.1,
                                    },
                                    indent=2,
                                    ensure_ascii=False,
                                ),
                            },
                            "url": {
                                "raw": "{{base_url}}/api/v1/search/semantic",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "search", "semantic"],
                            },
                        },
                    }
                ],
            },
            {
                "name": "4. AI Tutor RAG",
                "item": [
                    {
                        "name": "POST Chat with AI Tutor (Grounded)",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "X-API-Key", "value": "{{student_api_key}}"},
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps(
                                    {
                                        "question": "Quy định về thời hạn nộp bài tập và gia hạn đồ án tại CyberSoft như thế nào?",
                                        "top_k": 3,
                                        "strict_abstention": True,
                                    },
                                    indent=2,
                                    ensure_ascii=False,
                                ),
                            },
                            "url": {
                                "raw": "{{base_url}}/api/v1/tutor/chat",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "tutor", "chat"],
                            },
                        },
                    },
                    {
                        "name": "POST Chat with AI Tutor (Safe Abstention)",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "X-API-Key", "value": "{{student_api_key}}"},
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps(
                                    {
                                        "question": "Hướng dẫn cách nấu phở bò Nam Định truyền thống",
                                        "top_k": 3,
                                        "strict_abstention": True,
                                    },
                                    indent=2,
                                    ensure_ascii=False,
                                ),
                            },
                            "url": {
                                "raw": "{{base_url}}/api/v1/tutor/chat",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "tutor", "chat"],
                            },
                        },
                    },
                ],
            },
            {
                "name": "5. Data Quality & QA Metrics",
                "item": [
                    {
                        "name": "POST Validate Clean Dataset",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "X-API-Key", "value": "{{qa_api_key}}"},
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps(
                                    {
                                        "dataset_id": "ds-retail-ecommerce-sales-v1",
                                        "check_rules": [
                                            "schema_conformance",
                                            "missing_values",
                                            "duplicate_rows",
                                        ],
                                    },
                                    indent=2,
                                    ensure_ascii=False,
                                ),
                            },
                            "url": {
                                "raw": "{{base_url}}/api/v1/quality/validate-dataset",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "quality", "validate-dataset"],
                            },
                        },
                    },
                    {
                        "name": "GET Quality & RAG Metrics (For TTS 03 Dashboard)",
                        "request": {
                            "method": "GET",
                            "header": [{"key": "X-API-Key", "value": "{{qa_api_key}}"}],
                            "url": {
                                "raw": "{{base_url}}/api/v1/quality/metrics",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "quality", "metrics"],
                            },
                        },
                    },
                ],
            },
        ],
    }

    environment = {
        "id": "cybersoft-local-env",
        "name": "CyberSoft Local Environment",
        "values": [
            {"key": "base_url", "value": "http://localhost:8000", "enabled": True},
            {
                "key": "student_api_key",
                "value": "cybersoft-student-public-key-101",
                "enabled": True,
            },
            {
                "key": "instructor_api_key",
                "value": "cybersoft-instructor-key-2026",
                "enabled": True,
            },
            {
                "key": "qa_api_key",
                "value": "cybersoft-qa-eval-key-333",
                "enabled": True,
            },
            {
                "key": "admin_api_key",
                "value": "cybersoft-admin-sec-key-999",
                "enabled": True,
            },
        ],
    }

    col_path = CONTRACTS_DIR / "cybersoft_api_v1.postman_collection.json"
    with open(col_path, "w", encoding="utf-8") as f:
        json.dump(collection, f, indent=2, ensure_ascii=False)
    print(f"Exported Postman Collection to {col_path}")

    env_path = CONTRACTS_DIR / "cybersoft_local.postman_environment.json"
    with open(env_path, "w", encoding="utf-8") as f:
        json.dump(environment, f, indent=2, ensure_ascii=False)
    print(f"Exported Postman Environment to {env_path}")


if __name__ == "__main__":
    export_openapi_specs()
    generate_postman_collection()
