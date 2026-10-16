# 📋 Tài Liệu Đặc Tả Kỹ Thuật JSON Schema: project.schema.json

- **Phiên bản Schema:** Draft 2020-12
- **Định danh URI:** `https://cybersoft.edu.vn/schemas/project.schema.json`
- **Mục đích:** Quy chuẩn hóa toàn bộ các dự án học viên và dự án mẫu trong CyberSoft Project Bank.

---

## 1. Cấu Trúc Khối Bắt Buộc (Required Top-Level Sections)
1. `$schema`: Chuỗi URI trỏ đến chuẩn JSON Schema Draft 2020-12.
2. `metadata`: Thông tin định danh dự án, lĩnh vực, vai trò mục tiêu, thời lượng dự kiến.
3. `business_context`: Bối cảnh doanh nghiệp thực tế, vấn đề cần giải quyết, đối tượng liên quan.
4. `datasets`: Danh sách các tập dữ liệu thành phần (kèm schema bảng, PK, FK, và các dị biệt đã biết).
5. `requirements`: Phân rã nhiệm vụ thành Core Tasks (50-80đ) và Extension Tasks (20-50đ). Tổng điểm bắt buộc bằng 100.
6. `kpis`: Danh sách KPI nghiệp vụ và KPI kỹ thuật kèm công thức và ngưỡng dung sai sai số.
7. `rubrics`: Barem điểm chi tiết 100 điểm với 4 cấp độ đánh giá và tiêu chí định lượng bắt buộc.
8. `hints`: Hệ thống gợi ý 3 phân tầng (Tier 1: Khái niệm; Tier 2: Cú pháp/Kỹ thuật; Tier 3: Dị biệt dữ liệu).
9. `expected_artifacts`: Danh sách các tệp sản phẩm bàn giao kỳ vọng của học viên.

---

## 2. Bảng Mô Tả Kiểu Dữ Liệu
| Trường | Kiểu dữ liệu | Ràng buộc / Enum | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `metadata.domain` | string | `retail_ecommerce`, `hr_operations`, `finance_banking`, `nlp_genai`, `computer_vision`, `recommender_system`, `edtech_analytics` | Lĩnh vực nghiệp vụ |
| `metadata.level` | string | `beginner`, `intermediate`, `advanced` | Mức độ khó của dự án |
| `metadata.target_role` | string | `data_analyst`, `ai_engineer`, `data_engineer`, `qa_engineer` | Vai trò nghề nghiệp đích |
| `metadata.estimated_hours` | number | 1 đến 60 | Thời lượng hoàn thành dự kiến |
| `rubrics.total_points` | integer | Cố định 100 | Tổng điểm barem đánh giá |
| `hints[].tier` | integer | 1, 2, 3 | Cấp độ gợi ý |
