# 02. THIẾT KẾ KIẾN TRÚC TỔNG THỂ CYBERSOFT DATA & AI LAB

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 02 — Thiết kế kiến trúc hệ thống và ranh giới module  
**Vai trò phụ trách**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Phiên bản**: v1.0  
**Ngày hoàn thiện**: 2026-08-31  

---

## 1. TỔNG QUAN HỆ THỐNG VÀ NGUYÊN TẮC THIẾT KẾ (SYSTEM OVERVIEW)

### 1.1. Bối cảnh và Mục tiêu
CyberSoft Data & AI Lab được thiết kế để giải quyết triệt để 3 nút thắt đã xác định ở Ngày 01 (Task 01):
1. **Tài nguyên rời rạc**: Chưa có kho lưu trữ tập trung có gắn nhãn versioning cho dataset đa bảng (Clean/Dirty).
2. **Thiếu chuẩn kiểm thử**: Dữ liệu và bài nộp đồ án chưa có Quality Gate tự động, giảng viên phải kiểm tra thủ công.
3. **RAG thiếu đo lường**: Các bài lab AI/RAG chưa có corpus chuẩn, chưa có cơ chế kiểm soát ảo giác (hallucination) bằng bộ kiểm thử hồi quy (Evaluation Harness).

Hệ thống đóng vai trò là **hạ tầng dữ liệu và AI lõi (Core Data/AI Infrastructure)**, cung cấp tài nguyên, API và công cụ kiểm định chất lượng cho **Learning Platform**, giảng viên và học viên tại CyberSoft Academy.

### 1.2. Các nguyên tắc kiến trúc cốt lõi (Architectural Principles)
* **Local-First & Lightweight**: Ưu tiên chạy mượt mà trên môi trường máy cá nhân của học viên/giảng viên (CPU standard) bằng SQLite và ChromaDB cục bộ trước khi scale lên Cloud/Docker.
* **Quality Gate First**: Không có bất kỳ dataset hay corpus nào được phép xuất bản (Publish) vào Registry nếu chưa vượt qua kiểm định của Data Quality Harness.
* **Grounded & Verifiable RAG**: Mọi câu trả lời của AI Tutor bắt buộc phải có trích dẫn nguồn (citation) từ corpus giáo trình; hệ thống phải biết từ chối (abstain) khi ngoài phạm vi, loại bỏ 100% ảo giác đối với các thông tin đã kiểm định.
* **Clean Separation of Concerns**: Tách biệt hoàn toàn ranh giới giữa 5 module chức năng để dễ dàng bảo trì, viết test độc lập và mở rộng.

---

## 2. KIẾN TRÚC TỔNG THỂ & 5 MODULE CỐT LÕI (SYSTEM ARCHITECTURE)

### 2.1. Sơ đồ kiến trúc Container (C4 Container Diagram)

![Picture 0202](./Picture%200202.png)

---

### 2.2. Đặc tả Ranh giới Trách nhiệm của 5 Module Cốt lõi

| Module | Trách nhiệm chính (Responsibility) | Input | Output | Ranh giới cấm kỵ (Out of Scope) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Dataset Registry** | Quản lý vòng đời, versioning (v1.0, v1.1), metadata, quan hệ bảng và vị trí lưu trữ file Clean/Dirty. | File dataset (.csv, .parquet), file `metadata.yaml` | `dataset_id`, mã hash SHA-256, đường dẫn file chuẩn hóa, catalog schema. | Không thực hiện làm sạch dữ liệu hay sửa đổi nội dung file. |
| **2. Data Quality Harness** | Thẩm định 7 nhóm lỗi dữ liệu (Missing, Duplicates, Schema mismatch, Outliers, Constraint violation, Encoding, PII). | File dữ liệu thô, cấu hình quy tắc `rules.json` | Báo cáo kiểm định `QualityReport` (Pass/Fail, Quality Score 0-100, danh sách lỗi vi phạm). | Không tự ý can thiệp xóa dòng lỗi nếu không có chỉ định script generator. |
| **3. Project Bank** | Quản lý capstone projects, cấu trúc thư mục mẫu, rubric 100 điểm, và barem đáp án đối soát của giảng viên. | Đề bài capstone, Rubric template, schema dữ liệu bài tập | `project_id`, cấu trúc Starter-Kit, bảng tiêu chí chấm điểm định lượng. | Không tự ý chấm điểm cảm tính; không publish solution ra portal học viên. |
| **4. Semantic Search & RAG Tutor** | Ingestion corpus giáo trình, chunking, tính vector embedding, tìm kiếm ngữ nghĩa, trả lời kèm trích dẫn và từ chối ngoài phạm vi. | Tài liệu markdown/text giáo trình, User query | Top-K chunks tương đồng, câu trả lời có gắn mã trích dẫn `[Doc_ID#Page]`, cờ `is_abstained`. | Không được bịa đặt thông tin khi không có chunk đối soát (Zero Hallucination policy). |
| **5. Evaluation Harness** | Chạy kiểm thử hồi quy tự động trên bộ 100 câu hỏi Ground Truth, đo lường định lượng độ chuẩn xác của RAG và Quality Gate. | Bộ câu hỏi Ground Truth, RAG Pipeline Endpoint | Báo cáo kiểm thử hồi quy: `Hit@K`, `MRR`, `Citation Precision (%)`, `Abstention Recall (%)`. | Không can thiệp vào quá trình sinh vector runtime của Module 4. |

---

## 3. VÒNG ĐỜI DỮ LIỆU & LUỒNG END-TO-END (DATA LIFECYCLE)

### 3.1. Sơ đồ Luồng Xử lý Dữ liệu 4 Bước
Chu trình chuẩn: **INGEST $\longrightarrow$ VALIDATE $\longrightarrow$ PUBLISH $\longrightarrow$ SEARCH / RETRIEVE**

```text
[Raw Dataset / Corpus]
        │
        ▼
┌──────────────────┐
│   1. INGESTION   │ ──► Kiểm tra định dạng (.csv, .md), tính SHA-256 Checksum, đọc metadata
└──────────────────┘
        │
        ▼
┌──────────────────┐       [FAILED]       ┌────────────────────────────────┐
│   2. VALIDATE    │ ───────────────────► │  REJECTED & ERROR LOGGING       │
│ (Quality Harness)│                      │  (Trả về mã lỗi & dòng vi phạm)│
└──────────────────┘                      └────────────────────────────────┘
        │ [PASSED (Quality Score >= 95)]
        ▼
┌──────────────────┐
│   3. PUBLISH     │ ──► Gắn Version (v1.0), lưu Metadata vào Registry, sinh Embeddings
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ 4. SEARCH & RETR │ ──► Cổng tra cứu Resource Portal / RAG Tutor phục vụ Giảng viên & Học viên
└──────────────────┘
```

---

### 3.2. Bảng Ma trận Trạng thái Lỗi & Cơ chế Phục hồi (Error States & Fallbacks)

Để đảm bảo hệ thống vận hành tin cậy và không "gãy ngầm" (silent failure), mọi trạng thái lỗi đều được định nghĩa mã lỗi chuẩn, hành động xử lý và fallback rõ ràng:

| Mã Lỗi (Error Code) | Giai đoạn | Nguyên nhân (Trigger) | Hành động Xử lý (System Action) | Cơ chế Phục hồi & Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **ERR_INGEST_INVALID_FORMAT** | Ingest | File tải lên không đúng định dạng hỗ trợ (không phải CSV, JSON, MD, Parquet). | Từ chối tiếp nhận ngay tại API Gateway (HTTP 415). Không ghi file vào ổ cứng. | Thông báo danh sách định dạng hợp lệ cho người dùng. |
| **ERR_SCHEMA_MISMATCH** | Validate | Tên cột, số lượng cột hoặc kiểu dữ liệu (dtype) không khớp với `metadata.yaml`. | Đánh dấu `VALIDATION_FAILED`. Ghi chi tiết tên cột lệch và kiểu dữ liệu phát hiện vào log. | Yêu cầu cập nhật file schema hoặc từ chối publish. Không cho phép nạp vào Registry. |
| **ERR_QUALITY_PII_DETECTED** | Validate | Bộ quét phát hiện thông tin nhạy cảm (Số điện thoại, CCCD, Email thật) trong file. | **Chặn ngay lập tức** (Hard Gate), kích hoạt cờ đỏ `CRITICAL_PII_LEAK`. | Từ chối tiếp nhận (REJECTED), chặn không cho nạp vào Registry và yêu cầu tác giả chạy script ẩn danh hóa (anonymize) trước khi nộp lại. |
| **ERR_QUALITY_SCORE_LOW** | Validate | Tỷ lệ dữ liệu thiếu (Null rate > 10%) hoặc trùng lặp vượt ngưỡng cho phép của bản Clean. | Đánh dấu trạng thái `DIRTY_CANDIDATE` hoặc `REJECTED`. | Nếu mục tiêu là bản Clean: Bắt buộc sửa; Nếu mục tiêu là bản Dirty: Chấp nhận nhưng yêu cầu gắn thẻ nhãn `dataset_type: dirty`. |
| **ERR_EMBED_RATE_LIMIT** | Publish | Quá tải hoặc vượt hạn mức request tới Embedding Model / Vector DB. | Tạm dừng pipeline ingestion, kích hoạt retry với Exponential Backoff (3 lần). | Nếu retry thất bại: Lưu checkpoint tiến trình chunking; chuyển sang fallback model local (All-MiniLM-L6-v2 CPU). |
| **ERR_RAG_LOW_CONFIDENCE** | Search | Độ tương đồng (Similarity score) của Top-K chunks retrieved < 0.65. | Kích hoạt cơ chế **Abstention** (Từ chối trả lời). Không đưa chunk rác vào LLM Context. | Trả lời mẫu: *"Tài liệu giáo trình hiện tại không đủ dữ kiện để trả lời chính xác câu hỏi này. Vui lòng liên hệ Giảng viên."* |

---

## 4. PHÂN ĐỊNH RANH GIỚI PHẠM VI: MVP 30 NGÀY VS POST-MVP

| Tiêu chí | Phạm vi MVP 30 Ngày (Core & Strategic Scope) | Phạm vi Post-MVP (Mở rộng & Tối ưu hóa) |
| :--- | :--- | :--- |
| **Hạ tầng Cơ sở dữ liệu** | **SQLite cục bộ** (gọn nhẹ, không phụ thuộc server bên ngoài, dễ backup thành 1 file `.db`). | Di chuyển metadata sang **PostgreSQL**, hỗ trợ connection pooling và multi-tenant. |
| **Kho Lưu trữ Vector** | **ChromaDB chạy in-memory / local disk** (không cần GPU, tương thích mọi máy tính cá nhân). | Nâng cấp lên cụm **Milvus** hoặc **Qdrant** phục vụ tìm kiếm phân tán quy mô lớn. |
| **Data Quality Gate** | **CLI Tool `validate_data`** với bộ rule chuẩn viết bằng Pydantic & Pandas (kiểm tra 7 nhóm lỗi phổ biến). | Tích hợp **Great Expectations UI**, phân tích drift tự động và anomaly detection bằng ML. |
| **Phạm vi Dataset** | 03 bộ dữ liệu hoàn chỉnh: **Sales Performance**, **HR & Operations**, **E-commerce Customer**. | Mở rộng >10 dataset đa lĩnh vực (Tài chính, Y tế, Log mạng, Time-series IoT). |
| **AI Tutor & RAG** | Ingestion tài liệu text/markdown giáo trình CyberSoft; Semantic Search Top-3 chunks; Citation trích nguồn rõ ràng; Abstain rate > 90%. | Tích hợp Agentic Multi-hop Reasoning, GraphRAG, hỗ trợ đọc sơ đồ hình ảnh và audio bài giảng. |
| **Chấm bài & Sinh bài tập** | Quản lý Rubric 100 điểm, bài tập starter-kit và đáp án đối soát (Human mentor chấm theo barem). | **AI Exercise Generator** sinh đề tự động; Trợ lý AI chấm sơ khảo bài làm học viên (Human-in-the-loop). |

---

## 5. ĐẶC TẢ DANH SÁCH API CONTRACTS & SCHEMAS

Giao thức truyền thông chính: **RESTful HTTP/JSON** được định nghĩa bằng chuẩn OpenAPI (Pydantic v2):

### 5.1. Dataset Registry API (`/api/v1/datasets`)

#### Endpoint: `POST /api/v1/datasets/register`
* **Mục đích**: Đăng ký một dataset mới đã vượt qua Quality Gate vào hệ thống.
* **Request Body (JSON Schema)**:
```json
{
  "dataset_id": "ds_sales_ecommerce_v1",
  "name": "E-commerce Multi-Table Sales Dataset",
  "version": "1.0.0",
  "dataset_type": "clean",
  "domain": "Retail & E-commerce",
  "tables": [
    {
      "table_name": "orders",
      "file_path": "data/clean/orders.csv",
      "row_count": 10500,
      "primary_key": "order_id"
    },
    {
      "table_name": "order_items",
      "file_path": "data/clean/order_items.csv",
      "row_count": 28400,
      "foreign_keys": [{"column": "order_id", "ref_table": "orders", "ref_column": "order_id"}]
    }
  ],
  "author": "Đào Trung Kiên",
  "quality_score": 98.5
}
```
* **Response (Success - HTTP 201)**:
```json
{
  "status": "success",
  "message": "Dataset registered successfully",
  "registered_at": "2026-08-31T15:00:00Z",
  "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

### 5.2. Data Quality Harness API (`/api/v1/quality`)

#### Endpoint: `POST /api/v1/quality/validate`
* **Mục đích**: Chạy kiểm tra tự động một file dữ liệu dựa trên schema và bộ quy tắc định sẵn.
* **Request Body**:
```json
{
  "file_path": "data/raw/sales_dirty.csv",
  "schema_id": "schema_sales_orders",
  "strict_mode": true,
  "check_pii": true
}
```
* **Response (HTTP 200)**:
```json
{
  "file_path": "data/raw/sales_dirty.csv",
  "validation_passed": false,
  "quality_score": 74.2,
  "total_records": 5000,
  "errors_detected": [
    {
      "error_code": "ERR_MISSING_VALUE",
      "column": "customer_email",
      "affected_rows": 120,
      "severity": "WARNING"
    },
    {
      "error_code": "ERR_INVALID_DTYPE",
      "column": "order_date",
      "affected_rows": 45,
      "severity": "CRITICAL",
      "detail": "Date format not matching ISO-8601 YYYY-MM-DD"
    }
  ],
  "pii_leakage_detected": false
}
```

---

### 5.3. RAG Tutor & Retrieval API (`/api/v1/rag`)

#### Endpoint: `POST /api/v1/rag/query`
* **Mục đích**: Tiếp nhận câu hỏi học viên, truy vấn vector store và sinh câu trả lời có kèm nguồn trích dẫn hoặc từ chối nếu không đủ dữ kiện.
* **Request Body**:
```json
{
  "query": "Chính sách nộp đồ án tốt nghiệp Data Analyst tại CyberSoft muộn tối đa bao nhiêu ngày?",
  "top_k": 3,
  "similarity_threshold": 0.70
}
```
* **Response (Success with Citation - HTTP 200)**:
```json
{
  "answer": "Theo quy chế đào tạo CyberSoft, học viên được nộp đồ án muộn tối đa 03 ngày kể từ ngày hết hạn chính thức và sẽ bị trừ 10% tổng điểm đồ án cho mỗi ngày nộp muộn.",
  "is_abstained": false,
  "confidence_score": 0.89,
  "citations": [
    {
      "source_document": "Quy_che_Dao_tao_CyberSoft_2026.md",
      "section": "Điều 14: Quy định Nộp đồ án và Khóa luận",
      "chunk_id": "chunk_doc_04_008",
      "score": 0.91
    }
  ]
}
```

---

## 6. MÔ HÌNH DỮ LIỆU & LƯU TRỮ (DATA MODEL & DIRECTORY SKELETON)

### 6.1. Schema SQLite Quản lý Metadata (`registry.db`)
```sql
-- Bảng quản lý Danh mục Dataset
CREATE TABLE IF NOT EXISTS datasets (
    dataset_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    dataset_type TEXT CHECK(dataset_type IN ('clean', 'dirty', 'benchmark')),
    domain TEXT NOT NULL,
    quality_score REAL,
    storage_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng quản lý Lịch sử Kiểm tra Chất lượng Dữ liệu
CREATE TABLE IF NOT EXISTS quality_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id TEXT,
    check_type TEXT NOT NULL,
    passed INTEGER CHECK(passed IN (0, 1)),
    error_summary TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(dataset_id)
);

-- Bảng quản lý Project Bank & Capstones
CREATE TABLE IF NOT EXISTS project_bank (
    project_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    target_role TEXT CHECK(target_role IN ('Data Analyst', 'AI Engineer')),
    rubric_path TEXT NOT NULL,
    starter_kit_path TEXT NOT NULL,
    solution_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2. Cấu trúc Thư mục Dữ liệu Tiêu chuẩn
```text
data/
├── raw/               # Chứa dữ liệu thô ban đầu trước khi thẩm định
├── clean/             # Chứa các dataset sạch chuẩn quan hệ (Publish-ready)
├── dirty/             # Chứa các dataset bẩn được cấy lỗi có chủ đích theo kịch bản học tập
├── dictionaries/      # Chứa các file Data Dictionary giải thích ý nghĩa từng trường
└── benchmarks/        # Chứa bộ 100 câu Ground Truth đánh giá RAG
```

---

## 7. KẾT LUẬN & ĐÁNH GIÁ CHUẨN DOD NGÀY 02

Bản thiết kế kiến trúc này đáp ứng đầy đủ và vượt mức các tiêu chí nghiệm thu của **NGÀY 02**:
1. **Đầy đủ 5 module**: Phân định ranh giới mạch lạc, độc lập trách nhiệm giữa Registry, Quality, Projects, RAG và Evaluation.
2. **Luồng dữ liệu 4 bước khép kín**: Ingest $\rightarrow$ Validate $\rightarrow$ Publish $\rightarrow$ Search có ma trận xử lý lỗi chi tiết.
3. **Phân tầng phạm vi rõ ràng**: Khoanh vùng MVP tối ưu trong 30 ngày (SQLite, ChromaDB) và có lộ trình mở rộng Post-MVP (PostgreSQL, Milvus).
4. **Chuẩn hóa API Contracts**: Cung cấp schema JSON rõ ràng cho việc giao tiếp giữa CyberSoft Data & AI Lab và Learning Platform.
