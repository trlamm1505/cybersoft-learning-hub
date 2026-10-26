# 🤝 Hợp Đồng Giao Diện Dữ Liệu & Phân Tách Student vs Instructor

## 1. Nguyên Tắc Zero Answer Leakage (Chống Rò Rỉ Đáp Án)
Trong quá trình triển khai hệ thống học tập và thi cử, rủi ro rò rỉ file lời giải hoặc ground-truth KPIs vào gói tài nguyên của thí sinh là cực kỳ nghiêm trọng. CyberSoft quy định 4 lớp phòng vệ:
1. **Lớp Tách Biệt Vật Lý (Physical Directory Isolation):**
   - Thư mục `student_edition/` và `instructor_edition/` tách biệt ngay từ cấp dự án.
   - Thư mục `student_edition/` không bao giờ chứa bất kỳ file nào có tiền tố/hậu tố `solution`, `answer`, `ground_truth`, `auto_grader`.
2. **Lớp Lọc Metadata Tự Động (Manifest Sanitization):**
   - Khi xuất bản gói học viên qua lệnh `project_cli.py package`, công cụ tự động gán `expected_value = None` cho toàn bộ các KPI trong `project_manifest.json` của học viên.
3. **Lớp Quét Nội Dung Tự Động (Leakage Scanner Linter):**
   - Trước khi đóng gói, chạy `project_cli.py check-leakage` quét toàn bộ các chuỗi regex bẫy (ví dụ: `SOLUTION_KEY`, `GROUND_TRUTH_REVENUE`). Bất kỳ sự xuất hiện nào cũng kích hoạt mã thoát 2 và chặn đứng quy trình release.
4. **Lớp Bảo Mật Môi Trường Thi Cử (Contest Hub Security):**
   - Nền tảng thi cử chỉ nạp file từ `student_edition/` cho giao diện người dùng. File `expected_kpis.json` và `auto_grader.py` chỉ được lưu trữ trên Server chấm bài (Sandbox Judge).

---

## 2. Tiêu Chuẩn Kiểm Định Nội Dung (Content Lint Integration)
Tài liệu của dự án (`PROJECT_BRIEF.md`, `HINTS.md`, `rubric.json`) được kết nối trực tiếp với công cụ `content_lint`:
- **Rule CL-01 (Broken Links):** Quét các liên kết Markdown đến thư mục dữ liệu `data/orders.csv`.
- **Rule CL-02 (Bloom Taxonomy):** Kiểm tra các động từ trong `learning_outcomes` (Phân tích, Đánh giá, Trực quan hóa, Xử lý).
- **Rule CL-03 (Rubric Sum):** Kiểm tra tổng điểm các hạng mục luôn bằng 100.
- **Rule CL-04 (Tiered Hints):** Đảm bảo có đủ 3 cấp độ gợi ý (Conceptual, Technical, Edge Cases).
