# Từ điển Dữ liệu: RAG Corpus v1 Document Schema

Tài liệu này đặc tả quy chuẩn cấu trúc và metadata bắt buộc cho toàn bộ 20 tài liệu trong tập ngữ liệu `RAG Corpus v1` tại CyberSoft Academy.

## 1. Thuộc tính Cấp Tài liệu (Frontmatter Metadata)

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Quy chuẩn | Ví dụ |
| :--- | :--- | :---: | :--- | :--- |
| `document_id` | String | Có | Mã định danh duy nhất của tài liệu theo cú pháp `CS-<LOAI>-<STT>`. Trong đó `<LOAI>` gồm: `POL` (Policy), `TEC` (Technical), `CRS` (Curriculum), `FAQ` (Hỏi đáp). | `CS-POL-001` |
| `title` | String | Có | Tiêu đề đầy đủ, chuẩn hóa của văn bản. | `Quy chế bảo lưu khóa học tại CyberSoft Academy` |
| `category` | String | Có | Phân loại nghiệp vụ văn bản: `Academic Policy`, `Technical Guide`, `Curriculum`, `Academic FAQ`. | `Academic Policy` |
| `version` | String | Có | Phiên bản văn bản ban hành (`vX.Y`). | `v2.1` |
| `effective_date`| String (Date) | Có | Ngày văn bản bắt đầu có hiệu lực (định dạng `YYYY-MM-DD`). | `2025-01-15` |
| `last_updated` | String (Date) | Không | Ngày rà soát hoặc điều chỉnh kỹ thuật gần nhất (`YYYY-MM-DD`). | `2025-11-01` |
| `author` | String | Có | Đơn vị, phòng ban hoặc hội đồng ban hành văn bản. | `Phòng Đào tạo & Quản lý Học vụ` |
| `tags` | Array[String]| Có | Danh sách từ khóa phân loại hỗ trợ bộ lọc Metadata Filtering khi truy xuất. | `["bao_luu", "chinh_sach", "hoc_vu"]` |
| `target_audience`| String | Có | Đối tượng áp dụng của văn bản. | `Học viên tất cả các hệ đào tạo` |

## 2. Thuộc tính Phân đoạn (Section Content & Identifiers)

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Quy chuẩn |
| :--- | :--- | :---: | :--- |
| `section_id` | String | Có | Định danh duy nhất cho từng phân đoạn theo mẫu `SEC-<DOC_ID_SUFFIX>-<STT>` (Ví dụ: `SEC-POL-001-01`). |
| `section_title`| String | Có | Tên tiêu đề phân đoạn thể hiện rõ chủ đề độc lập. |
| `content` | String | Có | Nội dung văn bản chi tiết, bảo đảm tính mạch lạc ngữ nghĩa, không phân mảnh câu. |
