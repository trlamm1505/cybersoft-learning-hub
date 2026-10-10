"""Schema and metadata reader service for CyberSoft datasets (Task 23).

Extracts columns, data types, sample values, null counts, and pedagogical context
to provide structured grounding for the Exercise Generator.
"""

import csv
from pathlib import Path
from typing import Any

from src.config import DATASETS_DIR


class DatasetSchemaMetadata:
    """Structured container for dataset schema and metadata."""

    def __init__(
        self,
        dataset_id: str,
        filename: str,
        name: str,
        domain: str,
        description: str,
        total_rows: int,
        columns: list[dict[str, Any]],
        sample_rows: list[dict[str, Any]],
    ):
        self.dataset_id = dataset_id
        self.filename = filename
        self.name = name
        self.domain = domain
        self.description = description
        self.total_rows = total_rows
        self.columns = columns
        self.sample_rows = sample_rows

    def to_dict(self) -> dict[str, Any]:
        return {
            "dataset_id": self.dataset_id,
            "filename": self.filename,
            "name": self.name,
            "domain": self.domain,
            "description": self.description,
            "total_rows": self.total_rows,
            "columns": self.columns,
            "sample_rows": self.sample_rows,
        }

    def get_prompt_context(self) -> str:
        """Format schema and metadata as a compact context block for LLM prompts."""
        col_summary = []
        for col in self.columns:
            samples_str = ", ".join(f"'{s}'" for s in col.get("sample_values", [])[:3])
            col_summary.append(
                f"- {col['name']} ({col['data_type']}, non-null: {col['non_null_count']}/{self.total_rows}): "
                f"{col.get('description', '')}. Ví dụ: [{samples_str}]"
            )
        cols_text = "\n".join(col_summary)
        return (
            f"=== BỘ DỮ LIỆU: {self.name} (ID: {self.dataset_id}) ===\n"
            f"Lĩnh vực: {self.domain} | Tổng số dòng: {self.total_rows}\n"
            f"Mô tả: {self.description}\n"
            f"Lược đồ các cột (Schema Columns):\n{cols_text}\n"
        )


class SchemaReaderService:
    """Service to inspect and parse dataset schemas and metadata."""

    # Curated pedagogical domain descriptions for each known dataset
    METADATA_CATALOG = {
        "retail_sales_v1": {
            "name": "Dữ Liệu Bán Hàng Đa Bảng Chuẩn 3NF (Retail E-Commerce)",
            "domain": "Retail E-Commerce",
            "description": "Dữ liệu đơn hàng, khách hàng, ngày đặt, tổng tiền, trạng thái giao dịch và hình thức thanh toán.",
            "column_descriptions": {
                "order_id": "Mã đơn hàng duy nhất (Primary Key)",
                "customer_id": "Mã định danh khách hàng (Foreign Key)",
                "order_date": "Thời điểm đặt hàng (YYYY-MM-DD HH:MM:SS)",
                "total_amount": "Tổng giá trị đơn hàng (VNĐ)",
                "status": "Trạng thái đơn hàng (Completed, Processing, Cancelled)",
                "payment_method": "Phương thức thanh toán (VNPay, MoMo, Banking, COD, CreditCard)",
                "city": "Thành phố giao hàng (Hanoi, HoChiMinh, Danang, Cantho, Haiphong)",
            },
        },
        "hr_attendance_v1": {
            "name": "Dữ Liệu Chấm Công & Hiệu Suất Nhân Sự (HR Operations)",
            "domain": "HR & People Operations",
            "description": "Bản ghi chấm công theo ca, giờ vào/ra, số giờ làm việc (work_hours) và trạng thái OnTime/Late.",
            "column_descriptions": {
                "employee_id": "Mã định danh nhân viên",
                "full_name": "Họ và tên nhân viên",
                "department": "Phòng ban (Engineering, Marketing, DataLab, Operations, HR, Product)",
                "work_date": "Ngày làm việc (YYYY-MM-DD)",
                "check_in": "Giờ quẹt thẻ vào (HH:MM:SS)",
                "check_out": "Giờ quẹt thẻ ra (HH:MM:SS)",
                "work_hours": "Tổng số giờ làm việc trong ca (float)",
                "status": "Trạng thái đi làm (OnTime, Late)",
            },
        },
        "customer_churn_v1": {
            "name": "Dữ Liệu Khách Hàng Viễn Thông & Nguy Cơ Rời Bỏ (Customer Churn ML)",
            "domain": "Telecom & Predictive Analytics",
            "description": "Thông tin thuê bao viễn thông, thời gian gắn bó (tenure_months), cước phí hàng tháng, tổng tiền và nhãn rời bỏ.",
            "column_descriptions": {
                "customer_id": "Mã thuê bao khách hàng duy nhất",
                "contract_type": "Loại hợp đồng (Month-to-month, One year, Two year)",
                "monthly_charges": "Cước phí dịch vụ hàng tháng ($)",
                "total_charges": "Tổng số tiền đã thanh toán tích lũy ($)",
                "tenure_months": "Số tháng đã sử dụng dịch vụ",
                "churn_label": "Nhãn rời bỏ dịch vụ viễn thông (Yes, No)",
            },
        },
        "ai_knowledge_chunks_v1": {
            "name": "Kho Tri Thức Phân Đoạn Cho Hệ Thống RAG (AI & NLP Chunks)",
            "domain": "AI & Natural Language Processing",
            "description": "Các đoạn trích tài liệu kỹ thuật, số lượng token, phương thức định dạng và tiêu đề phân mục phục vụ mô hình RAG.",
            "column_descriptions": {
                "chunk_id": "Mã phân đoạn tri thức (Primary Key)",
                "document_title": "Tiêu đề tài liệu nguồn",
                "heading": "Tiêu đề phân mục hoặc chương sách",
                "token_count": "Số lượng token của phân đoạn",
                "modality": "Định dạng dữ liệu (text, code, image)",
                "created_date": "Ngày khởi tạo phân đoạn (YYYY-MM-DD)",
            },
        },
        "student_survey_draft": {
            "name": "Khảo Sát Đánh Giá Khóa Học AI Nội Bộ (Student Feedback - Draft)",
            "domain": "Education Survey",
            "description": "Ý kiến phản hồi của học viên về chất lượng giảng dạy, trợ giảng và mức độ hài lòng (Bản nháp).",
            "column_descriptions": {
                "survey_id": "Mã phiếu khảo sát",
                "student_id": "Mã ẩn danh học viên",
                "course_code": "Mã khóa học (AI-01, DATA-02)",
                "satisfaction_score": "Điểm hài lòng từ 1 đến 5",
                "feedback_text": "Ý kiến đóng góp chi tiết",
            },
        },
    }

    def __init__(self, datasets_dir: Path = DATASETS_DIR):
        self.datasets_dir = datasets_dir

    def list_available_datasets(self) -> list[str]:
        """Return list of dataset IDs present in directory."""
        if not self.datasets_dir.exists():
            return []
        files = list(self.datasets_dir.glob("*.csv"))
        return [f.stem for f in files]

    def read_dataset_schema(self, dataset_id: str) -> DatasetSchemaMetadata:
        """Inspect CSV file and extract schema, types, sample values, and metadata."""
        # Find file matching dataset_id
        csv_file = self.datasets_dir / f"{dataset_id}.csv"
        if not csv_file.exists():
            # Check if dataset_id matches stem
            matches = list(self.datasets_dir.glob(f"*{dataset_id}*.csv"))
            if matches:
                csv_file = matches[0]
            else:
                raise FileNotFoundError(
                    f"Không tìm thấy file dữ liệu cho dataset '{dataset_id}' trong {self.datasets_dir}"
                )

        meta = self.METADATA_CATALOG.get(
            dataset_id,
            {
                "name": dataset_id.replace("_", " ").title(),
                "domain": "General Data Analysis",
                "description": f"Bộ dữ liệu phục vụ thực hành môn {dataset_id}",
                "column_descriptions": {},
            },
        )

        rows: list[dict[str, Any]] = []
        with open(csv_file, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []
            for r in reader:
                rows.append(r)

        total_rows = len(rows)
        columns: list[dict[str, Any]] = []

        for col_name in fieldnames:
            values = [r.get(col_name) for r in rows if r.get(col_name) is not None]
            non_empty_values = [v for v in values if str(v).strip() != ""]
            non_null_count = len(non_empty_values)

            # Inferred type
            data_type = self._infer_data_type(non_empty_values)

            # Sample unique values
            unique_samples = []
            seen = set()
            for v in non_empty_values:
                if v not in seen:
                    seen.add(v)
                    unique_samples.append(v)
                if len(unique_samples) >= 4:
                    break

            columns.append(
                {
                    "name": col_name,
                    "data_type": data_type,
                    "non_null_count": non_null_count,
                    "total_count": total_rows,
                    "null_percentage": round(
                        (total_rows - non_null_count) / max(total_rows, 1) * 100, 2
                    ),
                    "sample_values": unique_samples,
                    "description": meta.get("column_descriptions", {}).get(
                        col_name, f"Trường dữ liệu {col_name}"
                    ),
                }
            )

        return DatasetSchemaMetadata(
            dataset_id=dataset_id,
            filename=csv_file.name,
            name=meta["name"],
            domain=meta["domain"],
            description=meta["description"],
            total_rows=total_rows,
            columns=columns,
            sample_rows=rows[:5],
        )

    def _infer_data_type(self, values: list[str]) -> str:
        """Infer best data type from list of string values."""
        if not values:
            return "string"

        # Check integer
        is_int = True
        for v in values[:20]:
            try:
                int(v)
            except ValueError:
                is_int = False
                break
        if is_int:
            return "integer"

        # Check float
        is_float = True
        for v in values[:20]:
            try:
                float(v)
            except ValueError:
                is_float = False
                break
        if is_float:
            return "float"

        # Check boolean
        lower_vals = {str(v).lower() for v in values[:20]}
        if lower_vals.issubset({"true", "false", "1", "0", "yes", "no"}):
            return "boolean"

        # Check datetime
        if any("-" in v and ":" in v for v in values[:5]):
            return "datetime"
        if any("-" in v and len(v) == 10 for v in values[:5]):
            return "date"

        return "string"
