"""Python Client SDK for CyberSoft Data & AI Lab Integration API."""

from typing import Any

import requests


class CyberSoftAPIError(Exception):
    """Exception raised when API returns an Error Envelope."""

    def __init__(
        self,
        code: str,
        message: str,
        details: list[dict[str, Any]],
        request_id: str,
        status_code: int,
    ):
        self.code = code
        self.message = message
        self.details = details
        self.request_id = request_id
        self.status_code = status_code
        super().__init__(
            f"[{code}] {message} (Request ID: {request_id}, HTTP {status_code})"
        )


class CyberSoftDataAIClient:
    """Standardized Python SDK Client for interacting with CyberSoft Data & AI Lab API."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        api_key: str | None = None,
        bearer_token: str | None = None,
        timeout: float = 10.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.bearer_token = bearer_token
        self.timeout = timeout
        self.session = requests.Session()

    def _get_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        elif self.bearer_token:
            headers["Authorization"] = f"Bearer {self.bearer_token}"
        return headers

    def _request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        resp = self.session.request(
            method=method,
            url=url,
            params=params,
            json=json_body,
            headers=headers,
            timeout=self.timeout,
        )

        try:
            body = resp.json()
        except Exception:
            resp.raise_for_status()
            return resp.text

        if not resp.ok or not body.get("success", False):
            err = body.get("error", {})
            raise CyberSoftAPIError(
                code=err.get("code", f"HTTP_{resp.status_code}"),
                message=err.get("message", resp.text),
                details=err.get("details", []),
                request_id=err.get(
                    "request_id", resp.headers.get("X-Request-ID", "unknown")
                ),
                status_code=resp.status_code,
            )

        return body.get("data")

    # 1. Health & Metadata
    def get_health(self) -> dict[str, Any]:
        """Check system health status and subsystems."""
        return self._request("GET", "/api/v1/health")

    def get_info(self) -> dict[str, Any]:
        """Get API specifications, OpenAPI URLs and SLA commitments."""
        return self._request("GET", "/api/v1/info")

    # 2. Dataset Registry
    def list_datasets(
        self,
        domain: str | None = None,
        difficulty: str | None = None,
        format_type: str | None = None,
        tag: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List registered datasets with optional filtering."""
        params = {"limit": limit, "offset": offset}
        if domain:
            params["domain"] = domain
        if difficulty:
            params["difficulty_level"] = difficulty
        if format_type:
            params["format"] = format_type
        if tag:
            params["tag"] = tag
        return self._request("GET", "/api/v1/registry/datasets", params=params)

    def get_dataset(self, dataset_id: str) -> dict[str, Any]:
        """Get detailed metadata, schema, and sample preview of a dataset."""
        return self._request("GET", f"/api/v1/registry/datasets/{dataset_id}")

    def list_projects(
        self,
        track: str | None = None,
        difficulty: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List capstone student project templates."""
        params = {"limit": limit, "offset": offset}
        if track:
            params["track"] = track
        if difficulty:
            params["difficulty"] = difficulty
        return self._request("GET", "/api/v1/registry/projects", params=params)

    def get_project(self, project_id: str) -> dict[str, Any]:
        """Get project rubric, objectives, and deliverables."""
        return self._request("GET", f"/api/v1/registry/projects/{project_id}")

    def list_evaluation_sets(self) -> dict[str, Any]:
        """List benchmark evaluation sets for AI Lab automated grading."""
        return self._request("GET", "/api/v1/registry/evaluation-sets")

    def get_evaluation_set(self, eval_set_id: str) -> dict[str, Any]:
        """Get evaluation set questions and ground-truth answers for AI Lab grading."""
        return self._request("GET", f"/api/v1/registry/evaluation-sets/{eval_set_id}")

    def list_dataset_tables(self, dataset_id: str) -> dict[str, Any]:
        """List available tables for a dataset."""
        return self._request("GET", f"/api/v1/registry/datasets/{dataset_id}/tables")

    def get_dataset_table_data(
        self,
        dataset_id: str,
        table_name: str,
        variant: str = "clean",
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Get paginated rows of a dataset table ('clean' for Postgres Sandbox or 'dirty' for testing)."""
        params = {"variant": variant, "page": page, "page_size": page_size}
        return self._request(
            "GET",
            f"/api/v1/registry/datasets/{dataset_id}/tables/{table_name}",
            params=params,
        )

    def download_dataset_table(
        self,
        dataset_id: str,
        table_name: str,
        variant: str = "clean",
        save_path: str | None = None,
    ) -> bytes:
        """Download table directly as CSV bytes (optionally saving to file)."""
        params = {"variant": variant, "download": True}
        data = self._request(
            "GET",
            f"/api/v1/registry/datasets/{dataset_id}/tables/{table_name}",
            params=params,
        )
        if save_path and isinstance(data, (bytes, str)):
            content = data if isinstance(data, bytes) else data.encode("utf-8")
            with open(save_path, "wb") as f:
                f.write(content)
        return data

    # 3. Semantic Search
    def search_semantic(
        self,
        query: str,
        top_k: int = 5,
        similarity_threshold: float = 0.1,
        filters: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Perform hybrid BM25 + Vector Dense RRF search over curriculum."""
        payload = {
            "query": query,
            "top_k": top_k,
            "similarity_threshold": similarity_threshold,
            "filters": filters,
        }
        return self._request("POST", "/api/v1/search/semantic", json_body=payload)

    def get_chunk(self, chunk_id: str) -> dict[str, Any]:
        """Get detailed chunk content by chunk_id."""
        return self._request("GET", f"/api/v1/search/chunks/{chunk_id}")

    # 4. AI Tutor RAG
    def chat_tutor(
        self,
        question: str,
        conversation_history: list[dict[str, str]] | None = None,
        top_k: int = 3,
        strict_abstention: bool = True,
    ) -> dict[str, Any]:
        """Ask question to CyberSoft AI Tutor with grounded citations and guardrails."""
        payload = {
            "question": question,
            "conversation_history": conversation_history or [],
            "top_k": top_k,
            "strict_abstention": strict_abstention,
        }
        return self._request("POST", "/api/v1/tutor/chat", json_body=payload)

    # 5. Data Quality & QA Metrics
    def validate_dataset(
        self,
        dataset_id: str,
        check_rules: list[str] | None = None,
    ) -> dict[str, Any]:
        """Run automated quality validation checks on dataset."""
        payload = {
            "dataset_id": dataset_id,
            "check_rules": check_rules
            or ["schema_conformance", "missing_values", "duplicate_rows"],
        }
        return self._request(
            "POST", "/api/v1/quality/validate-dataset", json_body=payload
        )

    def get_quality_metrics(self) -> dict[str, Any]:
        """Retrieve aggregated data quality and RAG benchmarks for TTS 03 Dashboard."""
        return self._request("GET", "/api/v1/quality/metrics")
