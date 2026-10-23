"""Unit tests for Schema and Metadata Reader (Task 23)."""

from src.services.schema_reader import SchemaReaderService


def test_list_available_datasets(schema_reader: SchemaReaderService):
    """Verify all 5 datasets are discoverable."""
    datasets = schema_reader.list_available_datasets()
    assert len(datasets) >= 4
    assert "retail_sales_v1" in datasets
    assert "hr_attendance_v1" in datasets
    assert "customer_churn_v1" in datasets
    assert "ai_knowledge_chunks_v1" in datasets


def test_read_retail_schema(schema_reader: SchemaReaderService):
    """Verify retail sales schema extraction."""
    meta = schema_reader.read_dataset_schema("retail_sales_v1")
    assert meta.dataset_id == "retail_sales_v1"
    assert meta.total_rows == 10
    col_names = [c["name"] for c in meta.columns]
    assert "order_id" in col_names
    assert "total_amount" in col_names
    assert "status" in col_names


def test_read_hr_schema(schema_reader: SchemaReaderService):
    """Verify HR attendance schema extraction."""
    meta = schema_reader.read_dataset_schema("hr_attendance_v1")
    assert meta.total_rows == 8
    col_names = [c["name"] for c in meta.columns]
    assert "employee_id" in col_names
    assert "work_hours" in col_names
    assert "status" in col_names


def test_read_churn_schema(schema_reader: SchemaReaderService):
    """Verify churn dataset schema extraction."""
    meta = schema_reader.read_dataset_schema("customer_churn_v1")
    assert meta.total_rows == 7
    col_names = [c["name"] for c in meta.columns]
    assert "customer_id" in col_names
    assert "churn_label" in col_names


def test_read_ai_chunks_schema(schema_reader: SchemaReaderService):
    """Verify AI chunks dataset schema extraction."""
    meta = schema_reader.read_dataset_schema("ai_knowledge_chunks_v1")
    assert meta.total_rows == 6
    col_names = [c["name"] for c in meta.columns]
    assert "chunk_id" in col_names
    assert "token_count" in col_names


def test_get_prompt_context(schema_reader: SchemaReaderService):
    """Verify formatted prompt context contains schema columns."""
    meta = schema_reader.read_dataset_schema("retail_sales_v1")
    prompt_ctx = meta.get_prompt_context()
    assert "order_id" in prompt_ctx
    assert "total_amount" in prompt_ctx
    assert "retail_sales_v1" in prompt_ctx
