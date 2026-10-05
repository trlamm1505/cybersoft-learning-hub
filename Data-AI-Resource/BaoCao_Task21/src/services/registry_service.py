import csv
import hashlib
import json
import math
from pathlib import Path
from typing import Any

from ..schemas.registry import (
    DatasetColumnSchema,
    DatasetDetail,
    DatasetItem,
    DatasetListResponse,
    EvaluationQuestionItem,
    EvaluationSetDetail,
    EvaluationSetListItem,
    EvaluationSetListResponse,
    PaginationMeta,
    ProjectDetail,
    ProjectItem,
    ProjectListResponse,
    TableDataResponse,
    TableDictionaryItem,
    TableListResponse,
    TableSummaryItem,
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TASK06_DIR = BASE_DIR.parent / "BaoCao_Task06"
TASK21_DIR = BASE_DIR

# Data dictionary from Task 06
RETAIL_DATA_DICTIONARY: list[dict[str, Any]] = [
    {
        "table_name": "customers",
        "file_name": "customers.csv",
        "row_count": 200,
        "primary_key": "customer_id",
        "description": "Bảng thông tin khách hàng bán lẻ và khách hàng thân thiết",
        "columns": [
            {
                "name": "customer_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": True,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Mã khách hàng duy nhất",
            },
            {
                "name": "full_name",
                "data_type": "VARCHAR(100)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Họ và tên khách hàng",
            },
            {
                "name": "email",
                "data_type": "VARCHAR(150)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Địa chỉ thư điện tử",
            },
            {
                "name": "phone",
                "data_type": "VARCHAR(15)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Số điện thoại di động",
            },
            {
                "name": "city",
                "data_type": "VARCHAR(50)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Tỉnh/Thành phố sinh sống",
            },
            {
                "name": "customer_segment",
                "data_type": "VARCHAR(20)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Phân khúc khách hàng (Retail, Wholesale, VIP)",
            },
            {
                "name": "created_at",
                "data_type": "DATETIME",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Thời gian đăng ký tài khoản",
            },
        ],
    },
    {
        "table_name": "employees",
        "file_name": "employees.csv",
        "row_count": 20,
        "primary_key": "employee_id",
        "description": "Bảng danh sách nhân viên kinh doanh và tư vấn bán hàng",
        "columns": [
            {
                "name": "employee_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": True,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Mã nhân viên bán hàng",
            },
            {
                "name": "full_name",
                "data_type": "VARCHAR(100)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Họ và tên nhân viên",
            },
            {
                "name": "department",
                "data_type": "VARCHAR(50)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Phòng ban công tác",
            },
            {
                "name": "position",
                "data_type": "VARCHAR(50)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Vị trí chức danh",
            },
            {
                "name": "hire_date",
                "data_type": "DATE",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Ngày tuyển dụng",
            },
            {
                "name": "region",
                "data_type": "VARCHAR(30)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Khu vực thị trường phụ trách",
            },
        ],
    },
    {
        "table_name": "products",
        "file_name": "products.csv",
        "row_count": 50,
        "primary_key": "product_id",
        "description": "Bảng danh mục sản phẩm thương mại",
        "columns": [
            {
                "name": "product_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": True,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Mã sản phẩm duy nhất",
            },
            {
                "name": "product_name",
                "data_type": "VARCHAR(150)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Tên sản phẩm thương mại",
            },
            {
                "name": "category",
                "data_type": "VARCHAR(50)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Ngành hàng sản phẩm",
            },
            {
                "name": "cost_price",
                "data_type": "NUMERIC(12,2)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Giá vốn nhập kho (VNĐ)",
            },
            {
                "name": "selling_price",
                "data_type": "NUMERIC(12,2)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Giá bán niêm yết (VNĐ)",
            },
            {
                "name": "stock_quantity",
                "data_type": "INT",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Số lượng tồn kho",
            },
            {
                "name": "status",
                "data_type": "VARCHAR(20)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Trạng thái kinh doanh",
            },
        ],
    },
    {
        "table_name": "orders",
        "file_name": "orders.csv",
        "row_count": 1000,
        "primary_key": "order_id",
        "description": "Bảng đơn đặt hàng tổng hợp",
        "columns": [
            {
                "name": "order_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": True,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Mã đơn hàng duy nhất",
            },
            {
                "name": "customer_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": True,
                "foreign_key_target": "customers.customer_id",
                "description": "Khách hàng đặt mua",
            },
            {
                "name": "employee_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": True,
                "foreign_key_target": "employees.employee_id",
                "description": "Nhân viên kinh doanh phụ trách",
            },
            {
                "name": "order_date",
                "data_type": "DATE",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Ngày chốt đơn đặt hàng",
            },
            {
                "name": "shipping_date",
                "data_type": "DATE",
                "nullable": True,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Ngày bàn giao cho đối tác vận chuyển",
            },
            {
                "name": "order_status",
                "data_type": "VARCHAR(20)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Trạng thái tiến trình đơn hàng",
            },
            {
                "name": "payment_method",
                "data_type": "VARCHAR(30)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Phương thức thanh toán",
            },
            {
                "name": "total_amount",
                "data_type": "NUMERIC(14,2)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Tổng giá trị thanh toán đơn hàng",
            },
        ],
    },
    {
        "table_name": "order_details",
        "file_name": "order_details.csv",
        "row_count": 1803,
        "primary_key": "order_detail_id",
        "description": "Bảng chi tiết các mặt hàng trong từng đơn đặt hàng",
        "columns": [
            {
                "name": "order_detail_id",
                "data_type": "VARCHAR(12)",
                "nullable": False,
                "is_primary_key": True,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Mã dòng chi tiết đơn hàng",
            },
            {
                "name": "order_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": True,
                "foreign_key_target": "orders.order_id",
                "description": "Mã đơn hàng sở hữu",
            },
            {
                "name": "product_id",
                "data_type": "VARCHAR(10)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": True,
                "foreign_key_target": "products.product_id",
                "description": "Mã sản phẩm được mua",
            },
            {
                "name": "quantity",
                "data_type": "INT",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Số lượng sản phẩm mua",
            },
            {
                "name": "unit_price",
                "data_type": "NUMERIC(12,2)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Đơn giá bán tại thời điểm mua",
            },
            {
                "name": "discount",
                "data_type": "NUMERIC(4,2)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Tỷ lệ chiết khấu giảm giá",
            },
            {
                "name": "line_total",
                "data_type": "NUMERIC(14,2)",
                "nullable": False,
                "is_primary_key": False,
                "is_foreign_key": False,
                "foreign_key_target": None,
                "description": "Thành tiền của dòng sản phẩm",
            },
        ],
    },
]

# In-memory standardized registry catalog matching CyberSoft curriculum
DATASETS_STORE: dict[str, dict[str, Any]] = {
    "ds-retail-ecommerce-sales-v1": {
        "id": "ds-retail-ecommerce-sales-v1",
        "data_dictionary": RETAIL_DATA_DICTIONARY,
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
        dict_raw = raw.get("data_dictionary")
        dict_models = None
        if dict_raw:
            dict_models = [TableDictionaryItem(**t) for t in dict_raw]

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
            data_dictionary=dict_models,
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

    @classmethod
    def list_dataset_tables(cls, dataset_id: str) -> TableListResponse | None:
        """List available tables for a dataset with available variants."""
        if dataset_id not in DATASETS_STORE:
            return None
        ds = DATASETS_STORE[dataset_id]
        dict_tables = ds.get("data_dictionary") or []
        table_items = []
        for t in dict_tables:
            table_items.append(
                TableSummaryItem(
                    table_name=t["table_name"],
                    row_count=t.get("row_count") or 0,
                    primary_key=t.get("primary_key"),
                    available_variants=["clean", "dirty"],
                    description=t.get("description"),
                )
            )
        return TableListResponse(
            dataset_id=dataset_id,
            total_tables=len(table_items),
            tables=table_items,
        )

    @classmethod
    def get_table_file_info(
        cls, dataset_id: str, table_name: str, variant: str = "clean"
    ) -> dict[str, Any] | None:
        """Get physical file info and checksum for a specific table."""
        if dataset_id not in DATASETS_STORE:
            return None
        ds = DATASETS_STORE[dataset_id]
        variant = variant.lower().strip()
        if variant not in ["clean", "dirty"]:
            return None

        table_file = None
        if dataset_id == "ds-retail-ecommerce-sales-v1":
            candidate = TASK06_DIR / "data" / variant / f"{table_name}.csv"
            if candidate.exists():
                table_file = candidate

        if not table_file or not table_file.exists():
            return None

        with open(table_file, "rb") as f:
            file_bytes = f.read()
            sha256 = hashlib.sha256(file_bytes).hexdigest()

        with open(table_file, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            total_rows = sum(1 for _ in reader)

        return {
            "file_path": table_file,
            "filename": f"{table_name}_{variant}_{ds['current_version']}.csv",
            "checksum_sha256": sha256,
            "current_version": ds["current_version"],
            "variant": variant,
            "total_rows": total_rows,
            "columns": header or [],
        }

    @classmethod
    def get_table_data(
        cls,
        dataset_id: str,
        table_name: str,
        variant: str = "clean",
        page: int = 1,
        page_size: int = 50,
    ) -> TableDataResponse | None:
        """Get paginated rows of a dataset table."""
        info = cls.get_table_file_info(dataset_id, table_name, variant)
        if not info:
            return None

        table_file: Path = info["file_path"]
        rows = []
        with open(table_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            columns = reader.fieldnames or []
            for r in reader:
                rows.append(r)

        total_rows = len(rows)
        total_pages = max(1, math.ceil(total_rows / page_size))
        start = (page - 1) * page_size
        end = start + page_size
        paginated_rows = rows[start:end]

        if variant == "clean":
            variant_desc = (
                "Bản dữ liệu CHUẨN SẠCH (Clean Edition) - Đã qua tiền xử lý, chuẩn hóa 3NF, "
                "toàn vẹn khóa ngoại và schema types, sẵn sàng 100% nạp trực tiếp vào Postgres Sandbox."
            )
        else:
            variant_desc = (
                "Bản dữ liệu NHIỄU/LỖI (Dirty Edition) - Chứa các lỗi chủ đích (null vi phạm, trùng lặp, "
                "sai định dạng ngày, orphan FK) dùng cho bài thực hành Data Quality và Cleaning."
            )

        return TableDataResponse(
            dataset_id=dataset_id,
            table_name=table_name,
            variant=variant,
            variant_description=variant_desc,
            current_version=info["current_version"],
            checksum_sha256=info["checksum_sha256"],
            total_rows=total_rows,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            columns=list(columns),
            rows=paginated_rows,
        )

    @classmethod
    def list_evaluation_sets(cls) -> EvaluationSetListResponse:
        """List available benchmark evaluation sets."""
        items = [
            EvaluationSetListItem(
                id="eval-rag-golden-v1",
                name="Golden RAG Benchmark Evaluation Set v1.0",
                version="v1.0",
                target_system="RAG AI Tutor (Hybrid Search BM25 + Dense Vector RRF)",
                total_questions=30,
                description="30 ca kiểm thử vàng ground-truth (15 ca standard Q&A, 5 ca multi-hop, 7 ca OOD, 3 ca jailbreak) phục vụ chấm điểm tự động AI Lab.",
            ),
            EvaluationSetListItem(
                id="eval-policy-curriculum-v1",
                name="CyberSoft Academic Policy Question Set v1.0",
                version="v1.0",
                target_system="CyberSoft LMS Knowledge Retrieval",
                total_questions=20,
                description="20 câu hỏi quy chế học vụ và chính sách trung tâm kèm ground-truth citation.",
            ),
        ]
        return EvaluationSetListResponse(total=len(items), items=items)

    @classmethod
    def get_evaluation_set(cls, eval_set_id: str) -> EvaluationSetDetail | None:
        """Get evaluation set questions and ground-truth answers for AI Lab grading."""
        norm_id = eval_set_id.lower().strip()
        if norm_id in [
            "eval-rag-golden-v1",
            "golden_rag_eval_v1",
            "eval-rag-benchmark-v1",
            "ds-nlp-rag-tutor-knowledgebase-v1",
        ]:
            eval_file = TASK21_DIR / "data" / "golden_rag_eval_v1.json"
            if not eval_file.exists():
                eval_file = (
                    TASK21_DIR.parent
                    / "BaoCao_Task20"
                    / "data"
                    / "golden_rag_eval_v1.json"
                )

            if not eval_file.exists():
                return None

            with open(eval_file, "r", encoding="utf-8") as f:
                raw_questions = json.load(f)

            questions = [
                EvaluationQuestionItem(
                    question_id=q.get("id") or q.get("question_id"),
                    query=q["query"],
                    ground_truth_answer=q["ground_truth_answer"],
                    expected_behavior=q["expected_behavior"],
                    category=q.get("category"),
                    expected_doc_ids=q.get("expected_doc_ids", []),
                    expected_chunk_ids=q.get("expected_chunk_ids", []),
                    ground_truth_keywords=q.get("ground_truth_keywords", []),
                )
                for q in raw_questions
            ]
            return EvaluationSetDetail(
                id="eval-rag-golden-v1",
                name="Golden RAG Benchmark Evaluation Set v1.0",
                version="v1.0",
                target_system="RAG AI Tutor (Hybrid Search BM25 + Dense Vector RRF)",
                total_questions=len(questions),
                description=(
                    "Bộ dữ liệu kiểm định vàng 30 trường hợp câu hỏi thực tế đa dạng "
                    "(15 ca Q&A giáo trình chuẩn, 5 ca đa bước multi-hop, 7 ca ngoài phạm vi OOD, 3 ca đối kháng) "
                    "dùng để chấm điểm AI Lab tự động."
                ),
                questions=questions,
            )

        elif norm_id in [
            "eval-policy-curriculum-v1",
            "rag_eval_questions",
            "eval_qa",
        ]:
            eval_file = (
                TASK21_DIR.parent
                / "BaoCao_Task08"
                / "data"
                / "eval_qa"
                / "rag_eval_questions.json"
            )
            if not eval_file.exists():
                return None
            with open(eval_file, "r", encoding="utf-8") as f:
                raw_questions = json.load(f)
            questions = [
                EvaluationQuestionItem(
                    question_id=q.get("question_id") or q.get("id"),
                    query=q["query"],
                    ground_truth_answer=q["ground_truth_answer"],
                    expected_behavior=q.get(
                        "expected_behavior", "Return factual answer"
                    ),
                    category=q.get("category"),
                    expected_doc_ids=[
                        c["document_id"]
                        for c in q.get("citations", [])
                        if "document_id" in c
                    ],
                    expected_chunk_ids=[
                        c["section_id"]
                        for c in q.get("citations", [])
                        if "section_id" in c
                    ],
                    ground_truth_keywords=[],
                )
                for q in raw_questions
            ]
            return EvaluationSetDetail(
                id="eval-policy-curriculum-v1",
                name="CyberSoft Academic Policy Question Set v1.0",
                version="v1.0",
                target_system="CyberSoft LMS Knowledge Retrieval",
                total_questions=len(questions),
                description="Bộ câu hỏi quy chế học vụ và chính sách trung tâm kèm ground-truth citation.",
                questions=questions,
            )

        return None
