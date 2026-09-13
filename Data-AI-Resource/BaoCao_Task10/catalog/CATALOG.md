# 🏛️ CyberSoft Dataset Registry & Resource Catalog

> **Hệ thống Quản lý và Xuất bản Tài nguyên Dữ liệu Thực hành AI-Native**  
> *Phiên bản Registry: 1.0.0 | Cập nhật lần cuối: 2026-09-13 19:07:56Z*

---

## 📊 Tổng quan Tài nguyên (Registry Metrics)

- **Tổng số Bộ dữ liệu đã đăng ký:** `4`
- **Bộ dữ liệu ĐÃ XUẤT BẢN (Published):** `3`
- **Quy tắc Kiểm soát Chất lượng (Quality Gate):** $\ge 95.0\%$ điểm kiểm thử & $0$ lỗi chặn.

---

## 📋 Bảng Danh mục Tài nguyên Đã Xuất Bản

| Dataset ID | Tên Bộ Dữ Liệu | Version | Lĩnh vực (Domain) | Cấp độ | Quality Score | Đối tượng / Kỹ năng |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`ds-retail-ecommerce-sales-v1`** | **CyberSoft Retail E-Commerce Multi-Table Sales Benchmark** | `v1.0.0` | `retail_ecommerce` | `beginner` | **100.0%** | Star Schema Data Modeling, SQL Multi-table JOINs and Aggregations, Window Functions (RANK, DENSE_RANK, LEAD, LAG) |
| **`ds-hr-operations-attendance-v1`** | **CyberSoft Enterprise HR Workforce & Attendance Benchmark** | `v1.1.0` | `hr_operations` | `intermediate` | **100.0%** | Time-Series and Date-Time SQL Manipulation, Complex Multi-condition CASE WHEN logic, Attrition / Turnover Rate Calculation |
| **`ds-nlp-rag-tutor-knowledgebase-v1`** | **CyberSoft RAG Tutor Knowledge Base & Evaluation Benchmark** | `v1.0.0` | `nlp_genai` | `advanced` | **100.0%** | Document Ingestion & Chunking Strategy Optimization, Dense Vector Embeddings & Similarity Search (Cosine, Inner Product), Vector Database Indexing (Qdrant, ChromaDB, FAISS) |

---

## 🔍 Chi tiết Từng Bộ Dữ Liệu

### 📦 `ds-retail-ecommerce-sales-v1` — CyberSoft Retail E-Commerce Multi-Table Sales Benchmark
- **Mô tả:** Multi-table relational star schema dataset simulating an omni-channel retail e-commerce business in Vietnam. Designed for Data Analyst students to practice SQL joins, window functions, cohort retention analysis, and Power BI executive dashboards.
- **Phiên bản mới nhất:** `v1.0.0` (Xuất bản: `2026-09-13T17:59:54.205855Z`)
- **Domain:** `retail_ecommerce` | **Độ khó:** `beginner` | **Giấy phép:** `CC-BY-4.0`
- **Tuân thủ PII:** `Có chứa PII giả lập có kiểm soát`
- **Điểm Quality Gate:** **100.0%** (23/23 tiêu chí pass)
- **Kỹ năng đào tạo:** Star Schema Data Modeling, SQL Multi-table JOINs and Aggregations, Window Functions (RANK, DENSE_RANK, LEAD, LAG), RFM (Recency, Frequency, Monetary) Customer Segmentation, Power BI Interactive Executive Dashboarding
- **Vai trò đích:** data_analyst, bi_analyst
- **File Manifest:** `BaoCao_Task10/registry_store/manifests/ds-retail-ecommerce-sales-v1_v1.0.0.json`
- **Tài nguyên đính kèm:**
  - `BaoCao_Task06/data/clean/customers.csv`
  - `BaoCao_Task06/data/clean/products.csv`
  - `BaoCao_Task06/data/clean/orders.csv`

---

### 📦 `ds-hr-operations-attendance-v1` — CyberSoft Enterprise HR Workforce & Attendance Benchmark
- **Mô tả:** Enterprise human resources and operational workforce dataset covering employee demographics, daily biometric attendance logs, leave records, and quarterly KPI performance reviews. Used in intermediate Data Analyst SQL & BI courses.
- **Phiên bản mới nhất:** `v1.1.0` (Xuất bản: `2026-09-13T17:59:54.343685Z`)
- **Domain:** `hr_operations` | **Độ khó:** `intermediate` | **Giấy phép:** `CyberSoft-Educational-Proprietary-v1`
- **Tuân thủ PII:** `Có chứa PII giả lập có kiểm soát`
- **Điểm Quality Gate:** **100.0%** (23/23 tiêu chí pass)
- **Kỹ năng đào tạo:** Time-Series and Date-Time SQL Manipulation, Complex Multi-condition CASE WHEN logic, Attrition / Turnover Rate Calculation, Overtime & Punctuality Variance Analysis, HR Talent Retention Modeling
- **Vai trò đích:** data_analyst, bi_analyst
- **File Manifest:** `BaoCao_Task10/registry_store/manifests/ds-hr-operations-attendance-v1_v1.1.0.json`
- **Tài nguyên đính kèm:**
  - `BaoCao_Task07/data/clean/employees.csv`
  - `BaoCao_Task07/data/clean/attendance.csv`
  - `BaoCao_Task07/data/clean/kpi_evaluations.csv`

---

### 📦 `ds-nlp-rag-tutor-knowledgebase-v1` — CyberSoft RAG Tutor Knowledge Base & Evaluation Benchmark
- **Mô tả:** Educational knowledge base corpus and gold-standard QA evaluation dataset for training and benchmarking CyberSoft RAG Tutor. Contains curriculum textbook markdown documents, semantic chunking metadata with 1536-dim vector embeddings, and expert ground-truth question-answer-citation triplets.
- **Phiên bản mới nhất:** `v1.0.0` (Xuất bản: `2026-09-13T17:59:54.467802Z`)
- **Domain:** `nlp_genai` | **Độ khó:** `advanced` | **Giấy phép:** `CyberSoft-Internal-Educational-v1`
- **Tuân thủ PII:** `An toàn (Đã ẩn danh)`
- **Điểm Quality Gate:** **100.0%** (11/11 tiêu chí pass)
- **Kỹ năng đào tạo:** Document Ingestion & Chunking Strategy Optimization, Dense Vector Embeddings & Similarity Search (Cosine, Inner Product), Vector Database Indexing (Qdrant, ChromaDB, FAISS), RAG Triad Evaluation: Context Precision, Faithfulness, Answer Relevance, Handling Out-of-Scope Queries (Refusal Guardrails)
- **Vai trò đích:** ai_engineer
- **File Manifest:** `BaoCao_Task10/registry_store/manifests/ds-nlp-rag-tutor-knowledgebase-v1_v1.0.0.json`
- **Tài nguyên đính kèm:**
  - `BaoCao_Task08/data/eval_qa/rag_eval_questions.json`

---
