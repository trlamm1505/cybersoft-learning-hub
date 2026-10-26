# 🏛️ CyberSoft Project Bank Architecture & Lifecycle Specification

## 1. Tầm Nhìn & Vị Trí Của Project Bank Trong Hệ Sinh Thái
**CyberSoft Project Bank** là kho tài nguyên dự án chuẩn hóa đóng vai trò cầu nối giữa dữ liệu thô (Dataset Registry) và nền tảng học tập thực chiến (Learning & Contest Platform):
- **Cung cấp Capstone Projects thực tế:** Chuyển hóa các bài toán kinh doanh phức tạp (Retail, HR, Finance, GenAI RAG) thành các đề bài có cấu trúc chặt chẽ.
- **Tiêu chuẩn hóa đánh giá (Rubric-Driven):** Chấm dứt tình trạng chấm bài theo cảm tính bằng bộ rubric định lượng 100 điểm, tương thích với cả người chấm (Mentor/Giảng viên) và máy chấm tự động (Auto-Judge).
- **Phân tách hai miền không gian dữ liệu:** Bản dành cho học viên (*Student Edition*) và bản dành cho giảng viên (*Instructor Edition*) được cách ly hoàn toàn để bảo đảm tính liêm chính học thuật.

---

## 2. Kiến Trúc Phân Lớp Của Project Bank

![Sơ đồ Phân tầng Luồng Dữ liệu Kiến trúc 3 Swimlanes](../Picture_11_project_bank_architecture.png)

```text
+-------------------------------------------------------------------------+
|                  CYBERSOFT PROJECT BANK ECOSYSTEM                       |
+-------------------------------------------------------------------------+
                                    |
        +---------------------------+---------------------------+
        |                                                       |
        v                                                       v
+-------------------------------+               +-------------------------------+
|     STUDENT EDITION (Học viên)|               |  INSTRUCTOR EDITION (Giảng viên|
+-------------------------------+               +-------------------------------+
| - PROJECT_BRIEF.md (Đề bài)   |               | - SOLUTION_MANUAL.md (Barem)  |
| - data/ (Tập dữ liệu thô/lỗi) |               | - solutions/ (Lời giải chuẩn) |
| - starter_kit/ (Mã khung)     |               | - expected_kpis.json (Ground) |
| - rubric.json (Barem điểm)    |               | - grading/ (Auto-grader engine|
| - HINTS.md (Gợi ý 3 Tier)     |               |                               |
+-------------------------------+               +-------------------------------+
        |                                                       |
        +---------------------------+---------------------------+
                                    |
                                    v
            +-----------------------------------------------+
            |        AUTOMATED QUALITY & INTEGRATION        |
            +-----------------------------------------------+
            | 1. JSON Schema Draft 2020-12 Validation       |
            | 2. Zero Answer Leakage Scanner                |
            | 3. Contest Hub Ingestion Adapter              |
            | 4. Content Linter Engine (20 Static Rules)    |
            +-----------------------------------------------+
```

---

## 3. Quy Trình Vòng Đời Của Một Dự Án (Project Lifecycle)
1. **Design & Authoring:** Kỹ sư thiết kế cấu trúc bối cảnh, chọn dataset từ Registry, soạn thảo KPI và Rubric theo template `project_manifest_template.json`.
2. **Schema & Leakage Verification:** Chạy bộ kiểm thử tự động `project_cli.py validate` và `check-leakage` để đảm bảo không vi phạm hợp đồng dữ liệu và không để lọt đáp án vào bản học viên.
3. **QA Content Lint:** Quét kiểm tra toàn bộ tài liệu Markdown/JSON qua bộ công cụ `content_lint` (kiểm tra liên kết hỏng, thuật ngữ, chuẩn đề mục).
4. **Publish & Seed Contest:** Đóng gói bản Student nạp vào hệ thống Contest Hub, sẵn sàng mở khóa theo thời gian thực thi của kỳ thi.
5. **Auto-Grading & Review:** Khi học viên nộp bài, hệ thống Auto-grader chấm các phần định lượng (60%), Mentor chấm phần insight và trình bày (40%).
