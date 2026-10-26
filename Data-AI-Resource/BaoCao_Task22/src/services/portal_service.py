"""Portal service managing datasets catalog, search, preview, access control, and feedback."""

import csv
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status

from ..config import DATASETS_DIR, FEEDBACK_FILE
from ..schemas.common import ErrorDetail, ErrorEnvelope, ErrorPayload
from ..schemas.portal import (
    DatasetColumnSchema,
    DatasetListResponse,
    DatasetPortalItem,
    DatasetPreviewResponse,
    FeedbackCreateRequest,
    FeedbackItemSchema,
    FeedbackSummaryResponse,
    PortalStatsResponse,
)

PORTAL_DATASETS: dict[str, dict[str, Any]] = {
    "ds-retail-ecommerce-sales-v1": {
        "id": "ds-retail-ecommerce-sales-v1",
        "name": "Bộ Dữ Liệu Bán Hàng E-Commerce Đa Bảng (Retail Sales v1.0)",
        "domain": "Retail",
        "difficulty_level": "intermediate",
        "format": "csv",
        "records_count": 10500,
        "file_size_bytes": 1428500,
        "current_version": "v1.0",
        "tags": ["retail", "ecommerce", "sales", "sql", "powerbi", "3nf"],
        "is_published": True,
        "publication_status": "published",
        "license": "CyberSoft Academy Educational License",
        "quality_score": 98.5,
        "quality_tier": "Tier A",
        "checksum_sha256": "99b617486fd299e5037eff1cf44e35511c306722c60f243fbe223c5dca1e16b8",
        "filename": "retail_sales_v1.csv",
        "description": "Bộ dữ liệu bán hàng đa bảng chuẩn hóa 3NF gồm Customers, Orders, Payments phục vụ thực hành SQL Nâng Cao, phân tích doanh thu và trực quan hóa Dashboard PowerBI.",
        "columns": [
            {
                "name": "order_id",
                "type": "string",
                "nullable": False,
                "description": "Mã đơn hàng duy nhất",
                "sample_value": "ORD-001",
            },
            {
                "name": "customer_id",
                "type": "string",
                "nullable": False,
                "description": "Mã khách hàng liên kết",
                "sample_value": "CUST-101",
            },
            {
                "name": "order_date",
                "type": "datetime",
                "nullable": False,
                "description": "Ngày giờ đặt đơn hàng",
                "sample_value": "2026-09-01 10:15:00",
            },
            {
                "name": "total_amount",
                "type": "float",
                "nullable": False,
                "description": "Tổng giá trị đơn hàng (VNĐ)",
                "sample_value": 1250000.0,
            },
            {
                "name": "status",
                "type": "string",
                "nullable": False,
                "description": "Trạng thái xử lý đơn hàng",
                "sample_value": "Completed",
            },
            {
                "name": "payment_method",
                "type": "string",
                "nullable": False,
                "description": "Phương thức thanh toán",
                "sample_value": "VNPay",
            },
            {
                "name": "city",
                "type": "string",
                "nullable": False,
                "description": "Tỉnh thành nhận hàng",
                "sample_value": "Hanoi",
            },
        ],
    },
    "ds-hr-operations-attendance-v1": {
        "id": "ds-hr-operations-attendance-v1",
        "name": "Bộ Dữ Liệu Nhân Sự Chấm Công & Vận Hành (HR Attendance v1.0)",
        "domain": "HR",
        "difficulty_level": "beginner",
        "format": "csv",
        "records_count": 5200,
        "file_size_bytes": 625400,
        "current_version": "v1.0",
        "tags": ["hr", "attendance", "operations", "excel", "cleaning", "analytics"],
        "is_published": True,
        "publication_status": "published",
        "license": "CC-BY-4.0",
        "quality_score": 99.2,
        "quality_tier": "Tier A",
        "checksum_sha256": "4f120c6d3385e35c4a9263868b37137e111b8bf014ec4659f1f8d4ac3e183ed7",
        "filename": "hr_attendance_v1.csv",
        "description": "Dữ liệu nhật ký chấm công, thời gian làm việc và tỷ lệ đi muộn của 150 nhân sự toàn công ty. Tối ưu cho bài tập Data Cleaning và phân tích hiệu suất lao động.",
        "columns": [
            {
                "name": "employee_id",
                "type": "string",
                "nullable": False,
                "description": "Mã nhân viên",
                "sample_value": "EMP-001",
            },
            {
                "name": "full_name",
                "type": "string",
                "nullable": False,
                "description": "Họ và tên nhân sự",
                "sample_value": "Nguyen Van An",
            },
            {
                "name": "department",
                "type": "string",
                "nullable": False,
                "description": "Phòng ban công tác",
                "sample_value": "Engineering",
            },
            {
                "name": "work_date",
                "type": "date",
                "nullable": False,
                "description": "Ngày chấm công",
                "sample_value": "2026-09-01",
            },
            {
                "name": "check_in",
                "type": "time",
                "nullable": False,
                "description": "Giờ quẹt thẻ vào",
                "sample_value": "08:25:00",
            },
            {
                "name": "check_out",
                "type": "time",
                "nullable": False,
                "description": "Giờ quẹt thẻ ra",
                "sample_value": "17:35:00",
            },
            {
                "name": "work_hours",
                "type": "float",
                "nullable": False,
                "description": "Tổng số giờ làm việc",
                "sample_value": 8.17,
            },
            {
                "name": "status",
                "type": "string",
                "nullable": False,
                "description": "Trạng thái chuyên cần (OnTime, Late)",
                "sample_value": "OnTime",
            },
        ],
    },
    "ds-ai-rag-knowledge-chunks-v1": {
        "id": "ds-ai-rag-knowledge-chunks-v1",
        "name": "Kho Học Liệu Tri Thức Phân Đoạn RAG Chuyên Sâu (AI Knowledge Chunks)",
        "domain": "AI/RAG",
        "difficulty_level": "advanced",
        "format": "csv",
        "records_count": 91,
        "file_size_bytes": 187193,
        "current_version": "v1.0",
        "tags": ["rag", "ai-engineer", "vector-search", "bm25", "semantic-chunks"],
        "is_published": True,
        "publication_status": "published",
        "license": "MIT License",
        "quality_score": 97.8,
        "quality_tier": "Tier A",
        "checksum_sha256": "9a25f8a263ea06b6a3eebd8ad69c28ef166a5072ab6b002026c39c4affb9c849",
        "filename": "ai_knowledge_chunks_v1.csv",
        "description": "Tập 91 chunks giáo trình AI & RAG chuẩn hóa Markdown Header Semantic, phục vụ lập chỉ mục Vector, kiểm thử Hybrid Retrieval và tích hợp Trợ giảng AI Tutor.",
        "columns": [
            {
                "name": "chunk_id",
                "type": "string",
                "nullable": False,
                "description": "Mã định danh đoạn trích",
                "sample_value": "CS-TXT-001_chk_000",
            },
            {
                "name": "document_title",
                "type": "string",
                "nullable": False,
                "description": "Tên tài liệu gốc",
                "sample_value": "Giao trinh RAG Toan Dien",
            },
            {
                "name": "heading",
                "type": "string",
                "nullable": False,
                "description": "Tiêu đề cấu trúc phân cấp",
                "sample_value": "1. Tong quan kien truc RAG",
            },
            {
                "name": "token_count",
                "type": "integer",
                "nullable": False,
                "description": "Số lượng token nội dung",
                "sample_value": 245,
            },
            {
                "name": "modality",
                "type": "string",
                "nullable": False,
                "description": "Phương thức dữ liệu (text)",
                "sample_value": "text",
            },
            {
                "name": "created_date",
                "type": "date",
                "nullable": False,
                "description": "Ngày tạo chunk",
                "sample_value": "2026-09-15",
            },
        ],
    },
    "ds-customer-churn-classification-v1": {
        "id": "ds-customer-churn-classification-v1",
        "name": "Bộ Dữ Liệu Dự Báo Rời Bỏ Dịch Vụ Viễn Thông (Telco Customer Churn)",
        "domain": "Telecom",
        "difficulty_level": "intermediate",
        "format": "csv",
        "records_count": 7043,
        "file_size_bytes": 975000,
        "current_version": "v1.0",
        "tags": ["machine-learning", "classification", "churn", "scikit-learn", "eda"],
        "is_published": True,
        "publication_status": "published",
        "license": "CyberSoft Internal Research",
        "quality_score": 95.4,
        "quality_tier": "Tier B",
        "checksum_sha256": "3c7ad5c1d7b8bc60115ecdeab57c6c90b752de227c9aa798bc9dac95eb6638ef",
        "filename": "customer_churn_v1.csv",
        "description": "Tập dữ liệu viễn thông gồm 7.043 thuê bao viễn thông phục vụ huấn luyện mô hình phân lớp Machine Learning dự đoán nguy cơ khách hàng rời mạng.",
        "columns": [
            {
                "name": "customer_id",
                "type": "string",
                "nullable": False,
                "description": "Mã thuê bao khách hàng",
                "sample_value": "CUST-901",
            },
            {
                "name": "contract_type",
                "type": "string",
                "nullable": False,
                "description": "Loại hợp đồng viễn thông",
                "sample_value": "Month-to-month",
            },
            {
                "name": "monthly_charges",
                "type": "float",
                "nullable": False,
                "description": "Cước phí dịch vụ hàng tháng ($)",
                "sample_value": 65.5,
            },
            {
                "name": "total_charges",
                "type": "float",
                "nullable": False,
                "description": "Tổng cước tích lũy",
                "sample_value": 1310.0,
            },
            {
                "name": "tenure_months",
                "type": "integer",
                "nullable": False,
                "description": "Số tháng gắn bó",
                "sample_value": 20,
            },
            {
                "name": "churn_label",
                "type": "string",
                "nullable": False,
                "description": "Nhãn rời bỏ (Yes/No)",
                "sample_value": "Yes",
            },
        ],
    },
    "ds-cyber-ai-student-survey-draft": {
        "id": "ds-cyber-ai-student-survey-draft",
        "name": "Khảo Sát Đánh Giá Khóa Học AI Nội Bộ — BẢN NHÁP (Draft Student Survey)",
        "domain": "Education",
        "difficulty_level": "beginner",
        "format": "csv",
        "records_count": 3,
        "file_size_bytes": 256,
        "current_version": "v0.1-draft",
        "tags": ["draft", "survey", "internal", "unpublished"],
        "is_published": False,
        "publication_status": "draft",
        "license": "CyberSoft Internal Draft (Chưa Xuất Bản)",
        "quality_score": 88.0,
        "quality_tier": "Tier C",
        "checksum_sha256": "64f2a00f1344a3122826aa515fc8f36519355141e6702bb1dec1e23cd1ca8ec0",
        "filename": "student_survey_draft.csv",
        "description": "Dữ liệu khảo sát phản hồi học viên đang trong quy trình rà soát nội bộ, chưa được cấp phép xuất bản công khai. Phục vụ kiểm thử quy tắc bảo vệ Access Rules.",
        "columns": [
            {
                "name": "survey_id",
                "type": "string",
                "nullable": False,
                "description": "Mã phiếu khảo sát",
                "sample_value": "SURV-DRAFT-01",
            },
            {
                "name": "student_id",
                "type": "string",
                "nullable": False,
                "description": "Mã học viên ẩn danh",
                "sample_value": "STU-501",
            },
            {
                "name": "course_id",
                "type": "string",
                "nullable": False,
                "description": "Mã khóa học",
                "sample_value": "CRS-AI-01",
            },
            {
                "name": "instructor_score",
                "type": "float",
                "nullable": False,
                "description": "Điểm giảng viên",
                "sample_value": 4.8,
            },
            {
                "name": "content_score",
                "type": "float",
                "nullable": False,
                "description": "Điểm giáo trình",
                "sample_value": 4.5,
            },
            {
                "name": "status",
                "type": "string",
                "nullable": False,
                "description": "Trạng thái thẩm duyệt",
                "sample_value": "draft_internal_review",
            },
        ],
    },
}


class PortalService:
    """Core service for resource portal discovery, inspection, and feedback."""

    def __init__(self) -> None:
        self.datasets = PORTAL_DATASETS
        self.feedback_store: list[dict[str, Any]] = []
        self.download_counts: dict[str, int] = {k: 128 for k in self.datasets}
        self.download_counts["ds-retail-ecommerce-sales-v1"] = 432
        self.download_counts["ds-cyber-ai-student-survey-draft"] = 0
        self._load_feedbacks()

    def _load_feedbacks(self) -> None:
        """Load initial feedbacks from JSON file or seed list."""
        if FEEDBACK_FILE.exists():
            try:
                data = json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    self.feedback_store = data
                    return
            except Exception:
                pass
        self.feedback_store = []

    def _save_feedbacks(self) -> None:
        """Persist feedbacks to disk."""
        try:
            FEEDBACK_FILE.parent.mkdir(parents=True, exist_ok=True)
            FEEDBACK_FILE.write_text(
                json.dumps(self.feedback_store, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception:
            pass

    def get_dataset_rating_stats(self, dataset_id: str) -> tuple[float, int]:
        """Compute average rating and count for a dataset."""
        reviews = [
            fb for fb in self.feedback_store if fb.get("dataset_id") == dataset_id
        ]
        if not reviews:
            return 5.0, 0
        avg = sum(fb["rating"] for fb in reviews) / len(reviews)
        return round(avg, 2), len(reviews)

    def list_datasets(
        self,
        keyword: str | None = None,
        domain: str | None = None,
        level: str | None = None,
        license_type: str | None = None,
        status_filter: str | None = "all",
    ) -> DatasetListResponse:
        """Search and filter datasets with multi-faceted matching."""
        filtered: list[DatasetPortalItem] = []
        domains_set: set[str] = set()
        levels_set: set[str] = set()
        licenses_set: set[str] = set()

        kw = keyword.lower().strip() if keyword else None
        dom = domain.strip().lower() if domain and domain.lower() != "all" else None
        lvl = level.strip().lower() if level and level.lower() != "all" else None
        lic = (
            license_type.strip().lower()
            if license_type and license_type.lower() != "all"
            else None
        )

        for ds_id, ds in self.datasets.items():
            domains_set.add(ds["domain"])
            levels_set.add(ds["difficulty_level"])
            licenses_set.add(ds["license"])

            # Status filtering
            if status_filter == "published" and not ds["is_published"]:
                continue
            if status_filter == "draft" and ds["is_published"]:
                continue

            # Domain filter
            if dom and ds["domain"].lower() != dom:
                continue

            # Level filter
            if lvl and ds["difficulty_level"].lower() != lvl:
                continue

            # License filter
            if lic and lic not in ds["license"].lower():
                continue

            # Keyword search across name, description, tags, domain, columns
            if kw:
                text_corpus = (
                    f"{ds['name']} {ds['description']} {' '.join(ds['tags'])} {ds['domain']} "
                    f"{' '.join(c['name'] for c in ds['columns'])}"
                ).lower()
                if kw not in text_corpus:
                    continue

            avg_rating, total_cnt = self.get_dataset_rating_stats(ds_id)

            item = DatasetPortalItem(
                id=ds["id"],
                name=ds["name"],
                domain=ds["domain"],
                difficulty_level=ds["difficulty_level"],
                format=ds["format"],
                records_count=ds["records_count"],
                file_size_bytes=ds["file_size_bytes"],
                current_version=ds["current_version"],
                tags=ds["tags"],
                is_published=ds["is_published"],
                publication_status=ds["publication_status"],
                license=ds["license"],
                quality_score=ds["quality_score"],
                quality_tier=ds["quality_tier"],
                checksum_sha256=ds["checksum_sha256"],
                average_rating=avg_rating,
                total_ratings=total_cnt,
                description=ds["description"],
                download_url=f"/api/v1/portal/datasets/{ds['id']}/download",
            )
            filtered.append(item)

        return DatasetListResponse(
            items=filtered,
            total=len(filtered),
            domains_facet=sorted(list(domains_set)),
            levels_facet=sorted(list(levels_set)),
            licenses_facet=sorted(list(licenses_set)),
        )

    def get_dataset(self, dataset_id: str) -> DatasetPortalItem:
        """Retrieve single dataset metadata."""
        if dataset_id not in self.datasets:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="DATASET_NOT_FOUND",
                        message=f"Không tìm thấy tập dữ liệu với mã '{dataset_id}'",
                        request_id=f"req-{uuid.uuid4().hex[:8]}",
                    ),
                ).model_dump(),
            )
        ds = self.datasets[dataset_id]
        avg_rating, total_cnt = self.get_dataset_rating_stats(dataset_id)
        return DatasetPortalItem(
            id=ds["id"],
            name=ds["name"],
            domain=ds["domain"],
            difficulty_level=ds["difficulty_level"],
            format=ds["format"],
            records_count=ds["records_count"],
            file_size_bytes=ds["file_size_bytes"],
            current_version=ds["current_version"],
            tags=ds["tags"],
            is_published=ds["is_published"],
            publication_status=ds["publication_status"],
            license=ds["license"],
            quality_score=ds["quality_score"],
            quality_tier=ds["quality_tier"],
            checksum_sha256=ds["checksum_sha256"],
            average_rating=avg_rating,
            total_ratings=total_cnt,
            description=ds["description"],
            download_url=f"/api/v1/portal/datasets/{ds['id']}/download",
        )

    def get_preview(self, dataset_id: str, limit: int = 10) -> DatasetPreviewResponse:
        """Parse and return tabular sample preview and schema inspector details."""
        if dataset_id not in self.datasets:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="DATASET_NOT_FOUND",
                        message=f"Không tìm thấy tập dữ liệu với mã '{dataset_id}'",
                        request_id=f"req-{uuid.uuid4().hex[:8]}",
                    ),
                ).model_dump(),
            )

        ds = self.datasets[dataset_id]
        csv_file = DATASETS_DIR / ds["filename"]
        sample_rows: list[dict[str, Any]] = []

        if csv_file.exists():
            try:
                with open(csv_file, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for i, row in enumerate(reader):
                        if i >= limit:
                            break
                        sample_rows.append(row)
            except Exception:
                pass

        if not sample_rows:
            # Fallback generated sample from schema
            mock_row = {c["name"]: c.get("sample_value") for c in ds["columns"]}
            sample_rows = [mock_row]

        columns_spec = [DatasetColumnSchema(**col) for col in ds["columns"]]

        return DatasetPreviewResponse(
            dataset_id=ds["id"],
            dataset_name=ds["name"],
            is_published=ds["is_published"],
            publication_status=ds["publication_status"],
            license=ds["license"],
            quality_score=ds["quality_score"],
            quality_tier=ds["quality_tier"],
            checksum_sha256=ds["checksum_sha256"],
            file_size_bytes=ds["file_size_bytes"],
            columns=columns_spec,
            sample_rows=sample_rows,
            total_rows_preview=len(sample_rows),
            total_dataset_records=ds["records_count"],
            download_allowed=ds["is_published"],
        )

    def validate_and_prepare_download(self, dataset_id: str) -> tuple[Path, str, str]:
        """Enforce Access Rules: Block unpublished dataset downloads and return file."""
        if dataset_id not in self.datasets:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="DATASET_NOT_FOUND",
                        message=f"Không tìm thấy tập dữ liệu với mã '{dataset_id}'",
                        request_id=f"req-{uuid.uuid4().hex[:8]}",
                    ),
                ).model_dump(),
            )

        ds = self.datasets[dataset_id]

        # CORE ACCESS RULE: Unpublished/Draft datasets CANNOT be downloaded
        if not ds.get("is_published", False):
            request_id = f"req-{uuid.uuid4().hex[:8]}"
            payload = ErrorEnvelope(
                success=False,
                error=ErrorPayload(
                    code="DATASET_UNPUBLISHED_RESTRICTED",
                    message="Quy tắc bảo vệ: Không được phép tải tập dữ liệu chưa xuất bản chính thức (Trạng thái: draft/review). Vui lòng đợi quản trị viên phê duyệt!",
                    details=[
                        ErrorDetail(
                            field="publication_status",
                            issue=f"Dataset '{dataset_id}' có trạng thái '{ds.get('publication_status')}', vi phạm điều kiện nghiệm thu DoD!",
                        )
                    ],
                    request_id=request_id,
                ),
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=payload.model_dump(),
            )

        csv_file = DATASETS_DIR / ds["filename"]
        if not csv_file.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="DATASET_FILE_NOT_FOUND",
                        message=f"Tệp dữ liệu vật lý {ds['filename']} chưa được sẵn sàng trên máy chủ",
                        request_id=f"req-{uuid.uuid4().hex[:8]}",
                    ),
                ).model_dump(),
            )

        self.download_counts[dataset_id] = self.download_counts.get(dataset_id, 0) + 1
        return csv_file, ds["filename"], ds["checksum_sha256"]

    def add_feedback(
        self, dataset_id: str, request: FeedbackCreateRequest
    ) -> FeedbackItemSchema:
        """Register usefulness feedback (1-5 stars) and persist."""
        if dataset_id not in self.datasets:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="DATASET_NOT_FOUND",
                        message=f"Không tìm thấy tập dữ liệu với mã '{dataset_id}' để đánh giá",
                        request_id=f"req-{uuid.uuid4().hex[:8]}",
                    ),
                ).model_dump(),
            )

        feedback_id = f"fbk-{uuid.uuid4().hex[:8]}"
        created_at = datetime.utcnow().isoformat() + "Z"

        new_fb = {
            "id": feedback_id,
            "dataset_id": dataset_id,
            "rating": request.rating,
            "reviewer_name": request.reviewer_name,
            "role": request.role,
            "comment": request.comment,
            "usefulness_aspects": request.usefulness_aspects,
            "created_at": created_at,
        }
        self.feedback_store.insert(0, new_fb)
        self._save_feedbacks()

        return FeedbackItemSchema(**new_fb)

    def get_feedback_summary(self, dataset_id: str) -> FeedbackSummaryResponse:
        """Return feedback breakdown and reviews."""
        if dataset_id not in self.datasets:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="DATASET_NOT_FOUND",
                        message=f"Không tìm thấy tập dữ liệu với mã '{dataset_id}'",
                        request_id=f"req-{uuid.uuid4().hex[:8]}",
                    ),
                ).model_dump(),
            )

        reviews = [
            fb for fb in self.feedback_store if fb.get("dataset_id") == dataset_id
        ]
        dist = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
        total = len(reviews)
        avg = 5.0
        if total > 0:
            for r in reviews:
                star = str(r["rating"])
                dist[star] = dist.get(star, 0) + 1
            avg = round(sum(r["rating"] for r in reviews) / total, 2)

        recent = [FeedbackItemSchema(**fb) for fb in reviews[:10]]
        return FeedbackSummaryResponse(
            dataset_id=dataset_id,
            average_rating=avg,
            total_ratings=total,
            rating_distribution=dist,
            reviews=recent,
        )

    def get_portal_stats(self) -> PortalStatsResponse:
        """Global portal statistics."""
        published = sum(1 for ds in self.datasets.values() if ds["is_published"])
        draft = len(self.datasets) - published
        total_records = sum(ds["records_count"] for ds in self.datasets.values())
        total_downloads = sum(self.download_counts.values())

        all_ratings = [fb["rating"] for fb in self.feedback_store]
        avg_rating = (
            round(sum(all_ratings) / len(all_ratings), 2) if all_ratings else 5.0
        )

        return PortalStatsResponse(
            total_datasets=len(self.datasets),
            published_datasets=published,
            draft_datasets=draft,
            total_records=total_records,
            total_downloads=total_downloads,
            average_portal_rating=avg_rating,
        )


portal_service = PortalService()
