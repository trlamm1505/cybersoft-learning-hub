# AI WORK LOG - NGÀY 04: THIẾT KẾ SCHEMA DATASET REGISTRY

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-04  
**Task ID**: `#DAY-04-DATASET-REGISTRY-SCHEMA`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Xây dựng chuẩn Schema Metadata cho kho lưu trữ Dataset Registry của CyberSoft Data & AI Lab, đóng vai trò bản quản trị dữ liệu (Data Governance) khắt khe cho cả hai nhánh đào tạo: Data Analyst và AI Engineer.
* **Yêu cầu kỹ thuật cốt lõi**:
  * Quản trị dữ liệu cá nhân (PII Protection theo chuẩn PDPA Việt Nam / Nghị định 13/2023/NĐ-CP) và giấy phép bản quyền (License) bắt buộc.
  * Lưu vết nguồn gốc (Data Lineage & Provenance) và mã băm toàn vẹn SHA-256.
  * Hỗ trợ mô hình dữ liệu quan hệ đa bảng (Star Schema) với khóa chính (`primary_key`), khóa ngoại (`foreign_keys`) phục vụ học phần SQL & Data Modeling cho Data Analyst.
  * Hỗ trợ định dạng vector embeddings (`vector[1536]`) và văn bản lớn phục vụ học phần RAG & NLP cho AI Engineer.
  * Triển khai kiến trúc Single Source of Truth (SSOT): định nghĩa bằng Pydantic v2 (Python runtime) và tự động trích xuất JSON Schema Draft 2020-12 (cho các hệ thống đa nền tảng).

### Rủi ro dự kiến & Bẫy AI thường gặp
* AI thường tạo schema phẳng (flat schema) dạng tối giản, giả định mỗi dataset chỉ gồm duy nhất 1 file CSV, bỏ qua quan hệ đa bảng Dim/Fact cần thiết cho việc học SQL JOINs.
* AI có xu hướng để các trường quản trị dữ liệu quan trọng như `license` hay `pii` ở trạng thái tùy chọn (`Optional = None`) hoặc mặc định chuỗi rỗng `""`, gây nguy cơ vi phạm pháp lý PDPA.
* AI thường bỏ qua logic kiểm tra chéo (cross-field validation): nếu cột con đánh dấu `is_pii = True` nhưng cờ tổng thể ở root ghi `has_pii = False`, model vẫn cho qua dẫn đến trạng thái dữ liệu mâu thuẫn.
* AI có xu hướng không kiểm soát độ khớp giữa số lượng cột khai báo (`column_count`) và độ dài danh sách thực tế của mảng `columns`.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash / Claude 3.5 Sonnet).
* **Mục tiêu tương tác**: Xây dựng Pydantic v2 data models với strict type hints, trích xuất JSON Schema Draft 2020-12, thiết lập 5 bộ metadata mẫu chuẩn ngành, và viết CLI script thẩm định chất lượng.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data Architect & Enterprise Governance Specialist tại CyberSoft Academy.
Bối cảnh: Kế thừa kiến trúc tổng thể Ngày 02 và chuẩn repository Ngày 03, hãy thiết kế Schema Metadata cho kho Dataset Registry của CyberSoft Data & AI Lab.
Ràng buộc: Đội ngũ 3 người, thời hạn 30 ngày, phục vụ cả 2 đối tượng học viên Data Analyst (mô hình dữ liệu quan hệ) và AI Engineer (RAG vector embeddings).
Hãy thực hiện các yêu cầu sau theo chuẩn công nghiệp:
1. Xây dựng Data Models bằng Pydantic v2 hỗ trợ quan hệ đa bảng: TableSchema, ColumnSchema, ForeignKeySchema, PIISchema, LineageSchema.
2. Thiết lập quy tắc quản trị bắt buộc (Strict Governance): License và PII là trường bắt buộc, không được để trống hoặc gán giá trị rác.
3. Viết các custom cross-field validators kiểm tra tính toàn vẹn: cờ has_pii phải khớp với các cột con, tên primary_key và foreign_keys phải tồn tại trong danh sách columns, column_count phải khớp chính xác độ dài danh sách columns.
4. Mở rộng kiểu dữ liệu hỗ trợ cả kiểu truyền thống và định dạng vector embeddings (vector[1536]).
5. Tự động sinh JSON Schema Draft 2020-12 từ Pydantic model để làm Single Source of Truth.
6. Xây dựng 5 bộ metadata mẫu chuẩn ngành và 4 bộ dữ liệu âm bản (negative test cases) để kiểm thử CLI validator.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Đề xuất flat schema tối giản**, giả định mỗi dataset chỉ có 1 file bảng đơn lẻ. | Đồ án thực tế của Data Analyst (Sales, HR, E-commerce) luôn gồm từ 2 đến 5 bảng liên kết khóa ngoại. Nếu dùng flat schema, học viên không thể học và thực hành SQL JOINs. | **TÁI CẤU TRÚC HỆ THỐNG ĐA BẢNG**: Thiết kế cấu trúc `tables: List[TableSchema]`, bổ sung định nghĩa khóa chính `primary_key` và danh sách khóa ngoại `foreign_keys: List[ForeignKeySchema]`. |
| **Cho phép trường `pii` là tùy chọn (`Optional[PII] = None`)** và `license` mặc định chuỗi rỗng `""`. | Vi phạm nghiêm trọng DoD Ngày 04 (*License/PII là bắt buộc*). Nếu để tùy chọn, người đóng góp dữ liệu sẽ bỏ qua, gây rủi ro pháp lý nghiêm trọng theo Nghị định 13/2023/NĐ-CP (PDPA Việt Nam). | **SIẾT CHẶT QUẢN TRỊ BẮT BUỘC**: Chuyển `license` và `pii` thành trường bắt buộc (`Field(...)`). Viết validator chặn các giá trị vô nghĩa như `"none"`, `"unknown"`, `"n/a"`. |
| **Bỏ qua kiểm tra chéo (Cross-field Validation) giữa các tầng**. | Trạng thái dữ liệu không nhất quán: Cột con trong `TableSchema` đánh dấu `is_pii=True` nhưng cờ root metadata lại khai báo `pii.has_pii=False`, dẫn đến lọt dữ liệu nhạy cảm. | **BỔ SUNG MODEL VALIDATOR TỰ ĐỘNG**: Thêm hàm `@model_validator(mode="after")` quét toàn bộ cột; nếu phát hiện cột PII mà cờ tổng thể là False thì lập tức ném ngoại lệ chặn lại. |
| **Khai báo trường `column_count` nhưng không kiểm tra thực tế**. | Nguy cơ sai lệch thông tin metadata: người khai báo có thể ghi `column_count: 10` nhưng thực tế chỉ khai báo 3 cột trong danh sách `columns`. | **BỔ SUNG RÀNG BUỘC TOÀN VẸN**: Thêm validator kiểm tra `len(self.columns) == self.column_count`, đồng thời kiểm tra `primary_key` và `foreign_keys` phải thuộc danh sách cột hợp lệ. |
| **Chỉ hỗ trợ các kiểu dữ liệu truyền thống**: `integer`, `float`, `string`, `boolean`. | Thiếu hụt nghiêm trọng đối với khóa AI Engineer: Dataset RAG Knowledge Base cần lưu trữ vector nhúng đặc trưng (ví dụ 1536 chiều từ OpenAI / Qdrant) và trường văn bản `text` dài. | **MỞ RỘNG DATA TYPES**: Cho phép kiểu dữ liệu vector đặc thù (`vector[1536]`, `vector[384]`) và trường văn bản `text`, đảm bảo tính tương thích toàn diện cho cả DA và AI. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thực thi hệ thống kiểm thử độc lập bao gồm 5 bộ dữ liệu chuẩn ngành và 4 bộ dữ liệu âm bản (*negative test cases*) cố tình vi phạm để kiểm tra khả năng bắt lỗi tự động:
1. `invalid_missing_license.json`: Thiếu giấy phép bản quyền $\rightarrow$ Bị chặn thành công bởi JSONSchema & Pydantic.
2. `invalid_missing_pii.json`: Thiếu khối khai báo PII $\rightarrow$ Bị chặn thành công.
3. `invalid_wrong_type.json`: `column_count` là chuỗi và `row_count` âm $\rightarrow$ Bị chặn thành công.
4. `invalid_bad_version.json`: Chuỗi version không theo chuẩn SemVer $\rightarrow$ Bị chặn thành công.

### Lệnh chạy kiểm thử:
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task04/scripts/validate_metadata.py
```

### Kết quả chạy thực tế:
```text
======================================================================
  CYBERSOFT DATA & AI LAB -- DAY 04 METADATA VALIDATION HARNESS
======================================================================
[INFO] Validating 5 Production Sample Datasets:
  [PASS] sample_ecommerce_star_schema.json (Relational / Star Schema)
  [PASS] sample_hr_analytics.json          (HR Analytics / PII Masked)
  [PASS] sample_financial_fraud.json       (Financial Transactions)
  [PASS] sample_rag_knowledge_base.json    (RAG Chunks / Vector Embeddings)
  [PASS] sample_student_performance.json   (Education / Clean Dataset)

[INFO] Validating 4 Negative Test Cases (Must Catch Violations):
  [PASS] invalid_missing_license.json      (Caught: Missing required license)
  [PASS] invalid_missing_pii.json          (Caught: Missing PII classification)
  [PASS] invalid_wrong_type.json           (Caught: Invalid type & negative row_count)
  [PASS] invalid_bad_version.json          (Caught: Version violates SemVer regex)
----------------------------------------------------------------------
[*] Kết quả nghiệm thu: 5/5 valid datasets PASS (100%), 4/4 invalid datasets REJECTED
======================================================================
>>> CHÚC MỪNG: HOÀN THÀNH 100% ĐIỀU KIỆN NGHIỆM THU NGÀY 04 (DoD PASS) <<<
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Tự phân tích yêu cầu Data Governance, thiết lập khung quản trị PII theo luật PDPA Việt Nam, và xác định nhu cầu hỗ trợ đồng thời mô hình quan hệ đa bảng cho Data Analyst cùng vector embeddings cho AI Engineer.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Principal Data Architect, thiết kế prompt chi tiết định hướng AI sinh code Pydantic v2 hiện đại thay vì code Python lỏng lẻo, tận dụng cơ chế trích xuất JSON Schema làm Single Source of Truth.
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Phát hiện và loại bỏ các thiết kế flat schema ngây thơ của AI; phát hiện lỗ hổng thiếu cross-field validation; bắt buộc chuyển các trường License và PII từ dạng optional sang required.
* **Tầng 4 — Làm chủ (Engineering Ownership)**: Tự thiết kế 4 kịch bản negative test cases để thách thức và đo lường độ tin cậy của validator; làm chủ kiến trúc schema đa bảng và vector; đảm bảo 100% tài liệu và công cụ có thể chuyển giao an toàn cho toàn đội ngũ.
