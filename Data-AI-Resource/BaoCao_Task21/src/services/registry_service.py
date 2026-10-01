"""Registry service managing datasets and student capstone projects."""

from typing import Any

from ..schemas.registry import (
    DatasetColumnSchema,
    DatasetDetail,
    DatasetItem,
    DatasetListResponse,
    PaginationMeta,
    ProjectDetail,
    ProjectItem,
    ProjectListResponse,
)

# In-memory standardized registry catalog matching CyberSoft curriculum
DATASETS_STORE: dict[str, dict[str, Any]] = {
    "ds-retail-ecommerce-sales-v1": {
        "id": "ds-retail-ecommerce-sales-v1",
        "name": "Bộ Dữ Liệu Bán Hàng E-Commerce Đa Bảng (Retail Sales v1.0)",
        "domain": "Retail",
        "difficulty_level": "intermediate",
        "format": "csv",
        "records_count": 10500,
        "current_version": "v1.0",
        "tags": ["retail", "ecommerce", "sales", "sql", "excel", "powerbi"],
        "is_public": True,
        "description": "Bộ dữ liệu bán hàng đa bảng chuẩn hóa 3NF gồm Customers, Orders, OrderItems, Products, Payments phục vụ thực hành SQL nâng cao và xây dựng Dashboard phân tích doanh thu.",
        "checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "file_size_bytes": 1428500,
        "created_at": "2026-09-08T08:00:00Z",
        "license": "CyberSoft Academy Educational License",
        "schema_definition": [
            {
                "name": "order_id",
                "type": "string",
                "nullable": False,
                "description": "Mã đơn hàng duy nhất",
            },
            {
                "name": "customer_id",
                "type": "string",
                "nullable": False,
                "description": "Mã khách hàng liên kết",
            },
            {
                "name": "order_date",
                "type": "datetime",
                "nullable": False,
                "description": "Ngày giờ đặt hàng",
            },
            {
                "name": "total_amount",
                "type": "float",
                "nullable": False,
                "description": "Tổng giá trị đơn hàng (VNĐ)",
            },
            {
                "name": "status",
                "type": "string",
                "nullable": False,
                "description": "Trạng thái: Completed, Processing, Cancelled",
            },
        ],
        "sample_preview": [
            {
                "order_id": "ORD-001",
                "customer_id": "CUST-101",
                "order_date": "2026-09-01T10:15:00",
                "total_amount": 1250000.0,
                "status": "Completed",
            },
            {
                "order_id": "ORD-002",
                "customer_id": "CUST-102",
                "order_date": "2026-09-01T11:30:00",
                "total_amount": 450000.0,
                "status": "Completed",
            },
            {
                "order_id": "ORD-003",
                "customer_id": "CUST-103",
                "order_date": "2026-09-01T14:45:00",
                "total_amount": 890000.0,
                "status": "Processing",
            },
        ],
    },
    "ds-hr-operations-attendance-v1": {
        "id": "ds-hr-operations-attendance-v1",
        "name": "Bộ Dữ Liệu Nhân Sự & Chấm Công Vận Hành (HR & Operations)",
        "domain": "HR/Operations",
        "difficulty_level": "beginner",
        "format": "csv",
        "records_count": 4800,
        "current_version": "v1.0",
        "tags": ["hr", "operations", "attendance", "payroll", "turnover"],
        "is_public": True,
        "description": "Dữ liệu hồ sơ nhân viên, nhật ký chấm công vân tay, KPI hiệu suất và tỷ lệ thôi việc phục vụ môn học People Analytics.",
        "checksum_sha256": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
        "file_size_bytes": 624000,
        "created_at": "2026-09-10T09:30:00Z",
        "license": "CyberSoft Academy Educational License",
        "schema_definition": [
            {
                "name": "employee_id",
                "type": "string",
                "nullable": False,
                "description": "Mã nhân viên",
            },
            {
                "name": "department",
                "type": "string",
                "nullable": False,
                "description": "Phòng ban làm việc",
            },
            {
                "name": "monthly_salary",
                "type": "float",
                "nullable": False,
                "description": "Mức lương cơ bản hàng tháng",
            },
            {
                "name": "performance_score",
                "type": "integer",
                "nullable": False,
                "description": "Điểm đánh giá hiệu năng (1-5)",
            },
            {
                "name": "turnover_flag",
                "type": "boolean",
                "nullable": False,
                "description": "Cờ báo hiệu đã nghỉ việc hay còn làm",
            },
        ],
        "sample_preview": [
            {
                "employee_id": "EMP-01",
                "department": "Engineering",
                "monthly_salary": 25000000.0,
                "performance_score": 5,
                "turnover_flag": False,
            },
            {
                "employee_id": "EMP-02",
                "department": "Marketing",
                "monthly_salary": 16000000.0,
                "performance_score": 4,
                "turnover_flag": False,
            },
            {
                "employee_id": "EMP-03",
                "department": "Sales",
                "monthly_salary": 14000000.0,
                "performance_score": 2,
                "turnover_flag": True,
            },
        ],
    },
    "ds-nlp-rag-tutor-knowledgebase-v1": {
        "id": "ds-nlp-rag-tutor-knowledgebase-v1",
        "name": "Corpus Giáo Trình Học Liệu Chuẩn & Benchmark RAG v1.0",
        "domain": "NLP/RAG",
        "difficulty_level": "advanced",
        "format": "jsonl",
        "records_count": 91,
        "current_version": "v1.0",
        "tags": ["rag", "llm", "semantic-search", "embeddings", "ai-tutor"],
        "is_public": True,
        "description": "91 chunks văn bản giáo trình chuẩn hóa Markdown Header Chunking, tích hợp 30 ca đánh giá vàng Golden Benchmark kiểm thử truy xuất thông tin có trích nguồn.",
        "checksum_sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
        "file_size_bytes": 118400,
        "created_at": "2026-09-24T14:00:00Z",
        "license": "CyberSoft Academy Copyrighted Curriculum",
        "schema_definition": [
            {
                "name": "chunk_id",
                "type": "string",
                "nullable": False,
                "description": "Mã định danh chunk",
            },
            {
                "name": "doc_title",
                "type": "string",
                "nullable": False,
                "description": "Tiêu đề tài liệu nguồn",
            },
            {
                "name": "section",
                "type": "string",
                "nullable": False,
                "description": "Tiêu đề mục con",
            },
            {
                "name": "content",
                "type": "string",
                "nullable": False,
                "description": "Nội dung văn bản",
            },
        ],
        "sample_preview": [
            {
                "chunk_id": "chk_python_01",
                "doc_title": "Giáo trình Python Nâng Cao",
                "section": "1.1 Cấu trúc List và Dict",
                "content": "List trong Python là mảng động...",
            },
            {
                "chunk_id": "chk_rag_02",
                "doc_title": "Giáo trình AI Native & RAG",
                "section": "2.3 Cơ chế Hybrid Search RRF",
                "content": "RRF kết hợp thứ hạng từ khóa BM25 và Vector Dense...",
            },
        ],
    },
    "ds-learning-quiz-contest-v1": {
        "id": "ds-learning-quiz-contest-v1",
        "name": "Bộ Đề Thi Trắc Nghiệm & Lập Trình Luyện Thi (Contest Questions)",
        "domain": "Education",
        "difficulty_level": "intermediate",
        "format": "json",
        "records_count": 150,
        "current_version": "v1.0",
        "tags": ["quiz", "contest", "frontend", "backend", "fullstack"],
        "is_public": True,
        "description": "Kho câu hỏi trắc nghiệm kèm giải thích sư phạm chi tiết đồng bộ trực tiếp với NestJS Backend và React FE của TTS 02.",
        "checksum_sha256": "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
        "file_size_bytes": 348000,
        "created_at": "2026-09-20T10:00:00Z",
        "license": "CyberSoft Academy Internal Use",
        "schema_definition": [
            {
                "name": "question_id",
                "type": "string",
                "nullable": False,
                "description": "Mã câu hỏi",
            },
            {
                "name": "topic",
                "type": "string",
                "nullable": False,
                "description": "Chủ đề kiến thức",
            },
            {
                "name": "difficulty",
                "type": "string",
                "nullable": False,
                "description": "Mức độ: Easy, Medium, Hard",
            },
            {
                "name": "points",
                "type": "integer",
                "nullable": False,
                "description": "Điểm số",
            },
        ],
        "sample_preview": [
            {
                "question_id": "Q-01",
                "topic": "React Hooks",
                "difficulty": "Easy",
                "points": 10,
            },
            {
                "question_id": "Q-02",
                "topic": "NestJS Architecture",
                "difficulty": "Medium",
                "points": 15,
            },
        ],
    },
}

PROJECTS_STORE: dict[str, dict[str, Any]] = {
    "proj-capstone-data-analyst-sales": {
        "id": "proj-capstone-data-analyst-sales",
        "title": "Dự Án Capstone 1: Phân Tích Hiệu Suất Bán Hàng E-Commerce Toàn Diện",
        "track": "Data Analyst",
        "target_audience": "Sinh viên & Người chuyển ngành",
        "difficulty": "Level 3",
        "estimated_hours": 40,
        "associated_dataset_ids": ["ds-retail-ecommerce-sales-v1"],
        "objectives": [
            "Làm sạch dữ liệu đa bảng, xử lý giá trị ngoại lai và missing values",
            "Viết các truy vấn SQL nâng cao (Window Functions, CTE, Aggregate)",
            "Thiết kế Dashboard tương tác PowerBI/Tableau thể hiện KPI doanh thu, biên lợi nhuận và cohort retention",
        ],
        "deliverables": [
            "File báo cáo phân tích PDF/Word chuẩn mực",
            "Tệp truy vấn SQL kịch bản tạo bảng và view",
            "Tệp Dashboard PowerBI (.pbix) hoặc Tableau Workbook",
        ],
        "rubric_summary": {
            "Data Cleaning & Modeling": 25,
            "SQL Complexity & Correctness": 30,
            "Business Insights & Actionability": 25,
            "Dashboard UX/UI Presentation": 20,
        },
        "recommended_tools": ["PostgreSQL", "PowerBI", "Python Pandas", "Excel"],
    },
    "proj-capstone-ai-engineer-rag": {
        "id": "proj-capstone-ai-engineer-rag",
        "title": "Dự Án Capstone 2: Xây Dựng Hệ Thống Trợ Giảng AI RAG Có Đánh Giá Định Lượng",
        "track": "AI Engineer",
        "target_audience": "Kỹ sư AI & Lập trình viên Backend",
        "difficulty": "Level 4",
        "estimated_hours": 60,
        "associated_dataset_ids": ["ds-nlp-rag-tutor-knowledgebase-v1"],
        "objectives": [
            "Xây dựng pipeline Ingest, Chunking và Lập chỉ mục Vector kết hợp BM25",
            "Thiết kế thuật toán Hybrid Search RRF và bộ lọc Guardrails an toàn",
            "Xây dựng khung đánh giá RAG Evaluation Harness đo lường Recall, MRR, Citation Precision",
        ],
        "deliverables": [
            "Mã nguồn Backend FastAPI triển khai đầy đủ endpoints",
            "Báo cáo đánh giá hồi quy tự động Regression Report",
            "Bộ kiểm thử tự động Pytest bao phủ 100% các ca kiểm thử vàng",
        ],
        "rubric_summary": {
            "Retrieval Architecture & Indexing": 30,
            "Guardrails & Safe Abstention": 25,
            "Evaluation Rigor & Metrics": 25,
            "API Quality & Code Structure": 20,
        },
        "recommended_tools": [
            "Python",
            "FastAPI",
            "ChromaDB/FAISS",
            "Pytest",
            "Docker",
        ],
    },
}


class RegistryService:
    """Service handling catalog business logic."""

    @staticmethod
    def list_datasets(
        domain: str | None = None,
        difficulty_level: str | None = None,
        format_type: str | None = None,
        tag: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> DatasetListResponse:
        filtered = list(DATASETS_STORE.values())

        if domain:
            filtered = [d for d in filtered if d["domain"].lower() == domain.lower()]
        if difficulty_level:
            filtered = [
                d
                for d in filtered
                if d["difficulty_level"].lower() == difficulty_level.lower()
            ]
        if format_type:
            filtered = [
                d for d in filtered if d["format"].lower() == format_type.lower()
            ]
        if tag:
            filtered = [
                d
                for d in filtered
                if any(tag.lower() == t.lower() for t in d.get("tags", []))
            ]

        total = len(filtered)
        paginated = filtered[offset : offset + limit]

        items = [
            DatasetItem(
                id=d["id"],
                name=d["name"],
                domain=d["domain"],
                difficulty_level=d["difficulty_level"],
                format=d["format"],
                records_count=d["records_count"],
                current_version=d["current_version"],
                tags=d.get("tags", []),
                is_public=d.get("is_public", True),
            )
            for d in paginated
        ]

        return DatasetListResponse(
            items=items,
            pagination=PaginationMeta(
                total=total,
                limit=limit,
                offset=offset,
                has_next=(offset + limit) < total,
            ),
        )

    @staticmethod
    def get_dataset(dataset_id: str) -> DatasetDetail | None:
        if dataset_id not in DATASETS_STORE:
            return None
        raw = DATASETS_STORE[dataset_id]
        cols = [DatasetColumnSchema(**c) for c in raw.get("schema_definition", [])]
        return DatasetDetail(
            id=raw["id"],
            name=raw["name"],
            domain=raw["domain"],
            difficulty_level=raw["difficulty_level"],
            format=raw["format"],
            records_count=raw["records_count"],
            current_version=raw["current_version"],
            tags=raw.get("tags", []),
            is_public=raw.get("is_public", True),
            description=raw["description"],
            schema_definition=cols,
            checksum_sha256=raw["checksum_sha256"],
            file_size_bytes=raw.get("file_size_bytes", 0),
            created_at=raw["created_at"],
            license=raw.get("license", "CyberSoft Academy Internal Use"),
            sample_preview=raw.get("sample_preview", []),
        )

    @staticmethod
    def list_projects(
        track: str | None = None,
        difficulty: str | None = None,
        limit: int = 10,
        offset: int = 0,
    ) -> ProjectListResponse:
        filtered = list(PROJECTS_STORE.values())

        if track:
            filtered = [p for p in filtered if p["track"].lower() == track.lower()]
        if difficulty:
            filtered = [
                p for p in filtered if p["difficulty"].lower() == difficulty.lower()
            ]

        total = len(filtered)
        paginated = filtered[offset : offset + limit]

        items = [
            ProjectItem(
                id=p["id"],
                title=p["title"],
                track=p["track"],
                target_audience=p["target_audience"],
                difficulty=p["difficulty"],
                estimated_hours=p["estimated_hours"],
                associated_dataset_ids=p.get("associated_dataset_ids", []),
            )
            for p in paginated
        ]

        return ProjectListResponse(
            items=items,
            pagination=PaginationMeta(
                total=total,
                limit=limit,
                offset=offset,
                has_next=(offset + limit) < total,
            ),
        )

    @staticmethod
    def get_project(project_id: str) -> ProjectDetail | None:
        if project_id not in PROJECTS_STORE:
            return None
        raw = PROJECTS_STORE[project_id]
        return ProjectDetail(
            id=raw["id"],
            title=raw["title"],
            track=raw["track"],
            target_audience=raw["target_audience"],
            difficulty=raw["difficulty"],
            estimated_hours=raw["estimated_hours"],
            associated_dataset_ids=raw.get("associated_dataset_ids", []),
            objectives=raw["objectives"],
            deliverables=raw["deliverables"],
            rubric_summary=raw["rubric_summary"],
            recommended_tools=raw.get("recommended_tools", []),
        )
