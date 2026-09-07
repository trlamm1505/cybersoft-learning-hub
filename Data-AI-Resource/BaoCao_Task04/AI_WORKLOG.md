# CYBERSOFT DATA & AI LAB — AI WORK LOG (NGÀY 04)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 04 — Thiết kế schema Dataset Registry  
**Kỹ sư thực hiện**: Đào Trung Kiên — Data & AI Resource Engineer  
**Công cụ AI sử dụng**: Google Antigravity & Codex (Model: Gemini 3.8 Flash / Claude 3.5 Sonnet)  
**Ngày thực hiện**: 2026-09-04  

---

## 1. TỔNG QUAN BÀI TOÁN & PHÂN VAI (PROBLEM & ROLE SETUP)

### 1.1. Problem Statement trước khi gọi AI
Cần thiết kế một chuẩn Schema Metadata cho kho Dataset Registry của CyberSoft Data & AI Lab. Schema này không chỉ là mô tả tên file và kích thước đơn thuần, mà phải đóng vai trò bản quản trị dữ liệu (Data Governance) khắt khe:
1. Bắt buộc có thông tin bản quyền (License) và quản trị dữ liệu cá nhân (PII Protection theo chuẩn PDPA Việt Nam).
2. Lưu vết nguồn gốc (Data Lineage & Provenance) và mã băm toàn vẹn SHA-256.
3. Hỗ trợ mô hình dữ liệu quan hệ đa bảng (Star Schema) với khóa chính, khóa ngoại phục vụ khóa học Data Analyst.
4. Hỗ trợ định dạng vector embeddings và RAG Knowledge Base phục vụ khóa học AI Engineer.
5. Triển khai kép: JSON Schema Draft 2020-12 (đa nền tảng) và Pydantic v2 (Python runtime).

### 1.2. Phân vai hệ thống AI (System Prompt / Persona)
- **Role**: Principal Data Architect & Enterprise Governance Specialist.
- **Context cung cấp**: Lộ trình 30 ngày của CyberSoft, kiến trúc tổng thể Ngày 02, chuẩn repo Ngày 03, mục tiêu khóa học Data Analyst & AI Engineer.
- **Yêu cầu chỉ đạo**: Tạo code Pydantic v2 chuẩn type hints, kèm JSON Schema tương ứng; tạo 5 bộ metadata mẫu chuẩn ngành; viết CLI validator; không sinh code generic lỏng lẻo.

---

## 2. QUY TRÌNH PHỐI HỢP & NHẬT KÝ RA QUYẾT ĐỊNH CỦA CON NGƯỜI

| Hạng mục | AI Đề xuất Ban đầu | Con người Thẩm định & Phát hiện Lỗi | Quyết định Kỹ thuật Cuối cùng |
| :--- | :--- | :--- | :--- |
| **Cấu trúc Bảng (Table Structure)** | AI đề xuất schema phẳng (flat schema), giả định mỗi dataset chỉ gồm đúng 1 file CSV. | **Lỗi thiết kế**: Các đồ án thực tế của Data Analyst (ví dụ Sales, HR) luôn có ít nhất 2-5 bảng liên kết khóa ngoại (Foreign Keys). Nếu dùng flat schema, học viên không thể thực hành SQL JOINs. | **Chỉnh sửa**: Tái cấu trúc thành danh sách `tables: List[TableSchema]`, bổ sung `primary_key` và `foreign_keys: List[ForeignKeySchema]`. |
| **Ràng buộc PII (PII Governance)** | AI cho phép trường `pii` là tùy chọn (`Optional[PIIClassification] = None`) và `license` mặc định là chuỗi rỗng `""`. | **Lỗi vi phạm DoD**: DoD Ngày 04 nêu rõ: *"License/PII là trường bắt buộc"*. Nếu để optional, học viên hoặc người đóng góp dữ liệu sẽ bỏ qua, gây rủi ro pháp lý theo nghị định 13/2023/NĐ-CP (PDPA VN). | **Bác bỏ & Bắt buộc**: Chuyển `license` và `pii` thành trường bắt buộc (`Field(...)`). Viết custom validator chặn các giá trị rác như `"none"`, `"unknown"`, `"n/a"`. |
| **Logic Kiểm tra Chéo (Cross-field Validation)** | AI sinh model độc lập, nếu một cột trong `TableSchema` đánh dấu `is_pii=True` nhưng trên root metadata ghi `pii.has_pii=False`, model vẫn cho qua. | **Lỗ hổng dữ liệu**: Trạng thái metadata không nhất quán (inconsistent state), gây hiểu lầm cho hệ thống tìm kiếm tự động. | **Bổ sung validator**: Thêm hàm `@model_validator(mode="after") def cross_validate_pii_columns` để quét toàn bộ cột; nếu phát hiện cột PII mà cờ tổng thể là False, lập tức ném ngoại lệ `ValueError`. |
| **Độ chính xác Số lượng Cột** | AI khai báo trường `column_count` nhưng không kiểm tra xem danh sách `columns` có thực sự đủ số lượng hay không. | **Nguy cơ sai lệch**: Người tạo metadata có thể ghi `column_count: 10` nhưng chỉ khai báo 3 cột trong `columns`. | **Bổ sung validator**: Thêm ràng buộc `len(self.columns) == self.column_count`, đồng thời kiểm tra `primary_key` và `foreign_keys` phải nằm trong tập hợp tên cột. |
| **Định dạng Vector Embeddings** | AI chỉ hỗ trợ các kiểu dữ liệu truyền thống: `integer`, `float`, `string`, `boolean`. | **Thiếu hụt cho khóa AI Engineer**: Dataset RAG Knowledge Base cần lưu vector nhúng (ví dụ 1536 chiều từ OpenAI / Qdrant). | **Mở rộng kiểu dữ liệu**: Cho phép `vector[1536]` và kiểu văn bản `text` lớn. |

---

## 3. THẨM ĐỊNH MÃ NGUỒN VÀ KIỂM CHỨNG ĐỘC LẬP

### 3.1. Thử nghiệm Bắt lỗi Tự động (Negative Testing)
Để đảm bảo không phụ thuộc vào khẳng định của AI rằng "schema đã hoạt động tốt", tôi đã tự xây dựng 4 test cases cố tình vi phạm:
1. `invalid_missing_license.json`: Thiếu giấy phép bản quyền -> **Bị chặn thành công bởi JSONSchema & Pydantic**.
2. `invalid_missing_pii.json`: Thiếu khối khai báo PII -> **Bị chặn thành công**.
3. `invalid_wrong_type.json`: `column_count` là chuỗi và `row_count` âm -> **Bị chặn thành công**.
4. `invalid_bad_version.json`: Chuỗi version `version_one_alpha` không theo SemVer -> **Bị chặn thành công**.

### 3.2. Lệnh thực thi & Kết quả đo lường:
```powershell
python Data-AI-Resource/BaoCao_Task04/scripts/validate_metadata.py
```
- **Kết quả**: 5/5 bộ metadata hợp lệ đạt 100% PASS.
- **Negative cases**: 4/4 bộ dữ liệu lỗi bị phát hiện và từ chối đúng như kỳ vọng (0 False Positives, 0 False Negatives).

---

## 4. BÀI HỌC VÀ LÀM CHỦ KỸ THUẬT (ENGINEERING REFLECTION)

1. **Hiểu bài toán trước khi nhận code AI**: AI thường có xu hướng tạo ra các model "tối giản nhất có thể" (minimal viable schema) và bỏ qua các ràng buộc nghiệp vụ phức tạp nếu kỹ sư không có định hướng rõ ràng về relational schema và data governance.
2. **Sức mạnh của Pydantic v2 Core (Rust)**: Tốc độ validation cực nhanh, cho phép áp dụng các logic cross-field validation phức tạp mà không làm chậm quy trình ingest dữ liệu.
3. **Tính tương thích đa nền tảng**: Xuất file `dataset.schema.json` từ chính model Pydantic là cách tiếp cận Single Source of Truth (SSOT) tối ưu nhất, giúp đội ngũ Frontend/Backend (Node.js/Go) và đội Data (Python) luôn đồng bộ 100% định dạng schema.
