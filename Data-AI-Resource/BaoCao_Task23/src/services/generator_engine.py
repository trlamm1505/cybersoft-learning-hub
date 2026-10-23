"""AI Exercise Generator Engine v0.1 (Task 23).

Constructs structured prompts with schema grounding, enforces Project Schema compliance,
and coordinates quality validation (deduplication, difficulty calibration, feasibility).
"""

import json
import time
import uuid
from typing import Any

from src.config import APPROVED_FILE, DRAFTS_FILE, PROMPT_LOG_FILE
from src.schemas.exercise import ExerciseDraft
from src.schemas.review import PromptEvalLogEntry
from src.services.deduplicator import DeduplicationService
from src.services.difficulty_calibrator import DifficultyCalibratorService
from src.services.feasibility_executor import FeasibilityExecutorService
from src.services.schema_reader import SchemaReaderService


class GeneratorEngineService:
    """Core service for AI exercise generation and pipeline coordination."""

    def __init__(
        self,
        schema_reader: SchemaReaderService | None = None,
        deduplicator: DeduplicationService | None = None,
        calibrator: DifficultyCalibratorService | None = None,
        feasibility_executor: FeasibilityExecutorService | None = None,
    ):
        self.schema_reader = schema_reader or SchemaReaderService()
        self.deduplicator = deduplicator or DeduplicationService()
        self.calibrator = calibrator or DifficultyCalibratorService()
        self.feasibility_executor = feasibility_executor or FeasibilityExecutorService()

        # In-memory stores
        self.drafts: dict[str, dict[str, Any]] = {}
        self.approved: dict[str, dict[str, Any]] = {}
        self.prompt_logs: list[dict[str, Any]] = []

        self._load_stores()

    def _load_stores(self):
        """Load drafts, approved bank, and prompt logs from disk if available."""
        if APPROVED_FILE.exists():
            try:
                with open(APPROVED_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.approved = {item["id"]: item for item in data}
            except Exception:
                self.approved = {}

        if DRAFTS_FILE.exists():
            try:
                with open(DRAFTS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.drafts = {item["id"]: item for item in data}
            except Exception:
                self.drafts = {}

        if PROMPT_LOG_FILE.exists():
            try:
                with open(PROMPT_LOG_FILE, "r", encoding="utf-8") as f:
                    self.prompt_logs = json.load(f)
            except Exception:
                self.prompt_logs = []

    def _save_stores(self):
        """Persist stores to disk."""
        DRAFTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(DRAFTS_FILE, "w", encoding="utf-8") as f:
            json.dump(list(self.drafts.values()), f, ensure_ascii=False, indent=2)

        with open(APPROVED_FILE, "w", encoding="utf-8") as f:
            json.dump(list(self.approved.values()), f, ensure_ascii=False, indent=2)

        with open(PROMPT_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(self.prompt_logs, f, ensure_ascii=False, indent=2)

    def build_prompt(
        self,
        dataset_id: str,
        bloom_level: str | None = None,
        difficulty: str | None = None,
        exercise_type: str = "SQL",
    ) -> tuple[str, str]:
        """Construct structured prompt with schema and metadata context."""
        schema_meta = self.schema_reader.read_dataset_schema(dataset_id)
        schema_context = schema_meta.get_prompt_context()

        target_bloom = bloom_level or "Apply"
        target_diff = difficulty or "Intermediate"

        system_instruction = (
            "Bạn là CyberSoft Lead AI Curriculum Architect. Nhiệm vụ của bạn là đọc cấu trúc schema "
            "và siêu dữ liệu của bộ dữ liệu thực tế để tạo ra các bài tập thực hành sư phạm chất lượng cao. "
            "YÊU CẦU BẮT BUỘC:\n"
            "1. Xuất dữ liệu nghiêm ngặt theo đúng cấu trúc CyberSoft Project Schema (JSON format).\n"
            "2. Mặc định trạng thái (status) LUÔN LUÔN là 'draft_pending_review' (TUYỆT ĐỐI KHÔNG TỰ PUBLISH).\n"
            "3. Bắt buộc có ít nhất 1 chuẩn đầu ra học tập (learning_outcomes) với động từ hành động đo lường được.\n"
            "4. Bắt buộc có ít nhất 1 test case kiểm chứng cụ thể (test_cases) và mã giải pháp (solution_code) chạy được trên SQLite.\n"
            "5. Đảm bảo độ khó phù hợp với Thang đo Bloom yêu cầu."
        )

        user_prompt = (
            f"{schema_context}\n"
            f"=== YÊU CẦU SINH BÀI TẬP ===\n"
            f"- Cấp độ Bloom mục tiêu: {target_bloom}\n"
            f"- Độ khó sư phạm: {target_diff}\n"
            f"- Kỹ năng chuyên môn: {exercise_type}\n"
            f"- Cấu trúc JSON đầu ra bắt buộc:\n"
            "{\n"
            '  "id": "EX-{DATASET_PREFIX}-{NUMBER}",\n'
            '  "dataset_id": "' + dataset_id + '",\n'
            '  "title": "Tiêu đề bài tập",\n'
            '  "description": "Đề bài chi tiết và yêu cầu nghiệp vụ",\n'
            '  "bloom_level": "' + target_bloom + '",\n'
            '  "difficulty": "' + target_diff + '",\n'
            '  "exercise_type": "' + exercise_type + '",\n'
            '  "learning_outcomes": ["Học viên có khả năng..."],\n'
            '  "schema_dependencies": ["ten_cot_1", "ten_cot_2"],\n'
            '  "starter_code": "-- Viết câu truy vấn của bạn tại đây",\n'
            '  "solution_code": "SELECT ... FROM ...",\n'
            '  "test_cases": [\n'
            "    {\n"
            '      "id": "TC-01",\n'
            '      "description": "Kiểm tra kết quả...",\n'
            '      "expected_output": "giá trị kỳ vọng",\n'
            '      "assertion_type": "exact_value"\n'
            "    }\n"
            "  ],\n"
            '  "hints": ["Gợi ý sư phạm..."],\n'
            '  "status": "draft_pending_review"\n'
            "}\n"
        )

        return system_instruction, user_prompt

    def generate_draft(
        self,
        dataset_id: str,
        bloom_level: str | None = None,
        difficulty: str | None = None,
        exercise_type: str = "SQL",
        seed_data: dict[str, Any] | None = None,
    ) -> ExerciseDraft:
        """Generate a draft exercise, run validation pipeline, and return draft object."""
        start_time = time.perf_counter()
        sys_inst, user_prompt = self.build_prompt(
            dataset_id, bloom_level, difficulty, exercise_type
        )

        # Use seed_data if provided, or generate using deterministic template engine
        raw_exercise = seed_data or self._template_generate(
            dataset_id, bloom_level, difficulty, exercise_type
        )

        # 1. Enforce Project Schema Contract
        exercise_id = (
            raw_exercise.get("id")
            or f"EX-{dataset_id.upper()[:6]}-{uuid.uuid4().hex[:4].upper()}"
        )
        raw_exercise["id"] = exercise_id
        raw_exercise["dataset_id"] = dataset_id
        raw_exercise["status"] = (
            "draft_pending_review"  # DoD: Strictly no auto-publishing
        )

        # 2. Step 1 of Pipeline: Deduplication Check
        existing_bank = list(self.approved.values()) + list(self.drafts.values())
        is_dup, max_sim, matched_id = self.deduplicator.check_duplication(
            raw_exercise, existing_bank
        )
        raw_exercise["is_duplicate"] = is_dup
        raw_exercise["similarity_score"] = max_sim

        # 3. Step 2 of Pipeline: Bloom & Difficulty Calibration
        is_calib, cal_bloom, cal_diff, cal_reasons = self.calibrator.calibrate(
            raw_exercise
        )
        raw_exercise["bloom_level"] = cal_bloom
        raw_exercise["difficulty"] = cal_diff
        raw_exercise["is_calibrated"] = is_calib

        # 4. Step 3 of Pipeline: Feasibility Execution
        feas_result = self.feasibility_executor.execute_and_verify(
            exercise_id=exercise_id,
            dataset_id=dataset_id,
            solution_code=raw_exercise.get("solution_code", ""),
            test_cases=raw_exercise.get("test_cases", []),
        )
        raw_exercise["is_feasible"] = feas_result.is_feasible

        # Validate with Pydantic model
        draft = ExerciseDraft(**raw_exercise)

        # Save to draft store
        self.drafts[draft.id] = draft.model_dump()
        self._save_stores()

        # Log to prompt eval log
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        log_entry = PromptEvalLogEntry(
            log_id=f"LOG-{uuid.uuid4().hex[:8]}",
            dataset_id=dataset_id,
            bloom_level_requested=bloom_level or "Apply",
            difficulty_requested=difficulty or "Intermediate",
            prompt_template_name="controlled_exercise_prompt_v0.1",
            raw_prompt_text=user_prompt[:300] + "...",
            generation_time_ms=elapsed_ms,
            schema_adherence_valid=True,
            deduplication_score=max_sim,
            feasibility_status=feas_result.is_feasible,
            review_status="pending_review",
            review_round=1,
            reviewer_feedback=None,
        )
        self.prompt_logs.append(log_entry.model_dump())
        self._save_stores()

        return draft

    def _template_generate(
        self,
        dataset_id: str,
        bloom_level: str | None = None,
        difficulty: str | None = None,
        exercise_type: str = "SQL",
    ) -> dict[str, Any]:
        """Template generation fallback ensuring diverse, high quality drafts."""
        schema = self.schema_reader.read_dataset_schema(dataset_id)
        col_names = [c["name"] for c in schema.columns]
        target_bloom = bloom_level or "Apply"
        target_diff = difficulty or "Intermediate"
        table_name = dataset_id.replace("-", "_")

        # Dynamic generation based on dataset characteristics
        if "total_amount" in col_names:
            title = f"Phân tích Tổng Doanh thu Giao dịch {target_bloom}"
            desc = f"Viết câu truy vấn {exercise_type} tính tổng doanh thu và số lượng đơn hàng theo từng trạng thái hoặc thành phố trong bảng '{table_name}'."
            solution = f'SELECT status, COUNT(*) as order_count, SUM(CAST(total_amount AS FLOAT)) as total_revenue FROM "{table_name}" GROUP BY status;'
            starter = f'-- Viết truy vấn nhóm theo trạng thái và tính tổng tiền\nSELECT ... FROM "{table_name}" GROUP BY ...;'
            test_cases = [
                {
                    "id": "TC-01",
                    "description": "Kiểm tra có cột status và order_count",
                    "expected_output": ["status", "order_count", "total_revenue"],
                    "assertion_type": "column_match",
                },
                {
                    "id": "TC-02",
                    "description": "Kiểm tra có kết quả dòng",
                    "expected_output": 3,
                    "assertion_type": "row_count",
                },
            ]
            dependencies = ["status", "total_amount"]
        elif "work_hours" in col_names:
            title = f"Thống kê Giờ Làm Việc Nhân Sự {target_bloom}"
            desc = f"Truy vấn danh sách các phòng ban và tính trung bình số giờ làm việc (work_hours) trong bảng '{table_name}'."
            solution = f'SELECT department, COUNT(*) as emp_count, ROUND(AVG(CAST(work_hours AS FLOAT)), 2) as avg_hours FROM "{table_name}" GROUP BY department;'
            starter = (
                f'SELECT department, AVG(...) FROM "{table_name}" GROUP BY department;'
            )
            test_cases = [
                {
                    "id": "TC-01",
                    "description": "Kiểm tra cột department và avg_hours",
                    "expected_output": ["department", "emp_count", "avg_hours"],
                    "assertion_type": "column_match",
                },
                {
                    "id": "TC-02",
                    "description": "Kiểm tra số phòng ban",
                    "expected_output": 6,
                    "assertion_type": "row_count",
                },
            ]
            dependencies = ["department", "work_hours"]
        elif "churn_label" in col_names:
            title = f"Đánh giá Tỷ lệ Rời bỏ Khách hàng {target_bloom}"
            desc = f"Thống kê số lượng khách hàng rời bỏ (churn_label = 'Yes') theo từng loại hợp đồng (contract_type) trong bảng '{table_name}'."
            solution = f"SELECT contract_type, COUNT(*) as churn_count FROM \"{table_name}\" WHERE churn_label = 'Yes' GROUP BY contract_type;"
            starter = f"SELECT contract_type, COUNT(*) FROM \"{table_name}\" WHERE churn_label = 'Yes' GROUP BY ...;"
            test_cases = [
                {
                    "id": "TC-01",
                    "description": "Kiểm tra cột contract_type",
                    "expected_output": ["contract_type", "churn_count"],
                    "assertion_type": "column_match",
                },
                {
                    "id": "TC-02",
                    "description": "Kiểm tra có kết quả",
                    "expected_output": 1,
                    "assertion_type": "row_count",
                },
            ]
            dependencies = ["contract_type", "churn_label"]
        elif "token_count" in col_names:
            title = f"Thống Kê Kích Thước Chunks Tri Thức {target_bloom}"
            desc = f"Tính tổng số lượng token và số chunk theo tài liệu nguồn trong bảng '{table_name}'."
            solution = f'SELECT document_title, COUNT(*) as chunk_count, SUM(CAST(token_count AS INT)) as total_tokens FROM "{table_name}" GROUP BY document_title;'
            starter = f'SELECT document_title, COUNT(*) FROM "{table_name}" GROUP BY document_title;'
            test_cases = [
                {
                    "id": "TC-01",
                    "description": "Kiểm tra cột kết quả",
                    "expected_output": [
                        "document_title",
                        "chunk_count",
                        "total_tokens",
                    ],
                    "assertion_type": "column_match",
                },
                {
                    "id": "TC-02",
                    "description": "Kiểm tra có kết quả dòng",
                    "expected_output": 1,
                    "assertion_type": "row_count",
                },
            ]
            dependencies = ["document_title", "token_count"]
        else:
            first_col = col_names[0]
            title = f"Khám phá Dữ liệu Cơ bản {target_bloom}"
            desc = f"Truy vấn lấy 5 dòng dữ liệu đầu tiên từ bảng '{table_name}' để quan sát cấu trúc."
            solution = f'SELECT * FROM "{table_name}" LIMIT 5;'
            starter = f'SELECT * FROM "{table_name}" LIMIT 5;'
            test_cases = [
                {
                    "id": "TC-01",
                    "description": "Kiểm tra đúng 5 dòng",
                    "expected_output": 5,
                    "assertion_type": "row_count",
                },
            ]
            dependencies = [first_col]

        return {
            "title": title,
            "description": desc,
            "bloom_level": target_bloom,
            "difficulty": target_diff,
            "exercise_type": exercise_type,
            "learning_outcomes": [
                f"Học viên hiểu và vận dụng được kỹ năng truy vấn dữ liệu theo cấp độ {target_bloom}.",
                f"Làm chủ kỹ thuật xử lý dữ liệu với các trường {', '.join(dependencies)}.",
            ],
            "schema_dependencies": dependencies,
            "starter_code": starter,
            "solution_code": solution,
            "test_cases": test_cases,
            "hints": [
                "Xem lại cú pháp SELECT, GROUP BY và WHERE trong tài liệu học tập."
            ],
            "status": "draft_pending_review",
        }
