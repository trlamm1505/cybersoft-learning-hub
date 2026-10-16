# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 30
## DỰ ÁN: CYBERSOFT DATA & AI LAB — PHÂN HỆ BÀN GIAO TOÀN KHÓA & BẢO VỆ ĐỒ ÁN (RELEASE v1.0)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 30 — Tài liệu, demo và bàn giao cuối kỳ  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-15  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước vào ngày bàn giao cuối cùng (Ngày 30), kỹ sư phải đối mặt với các thách thức tổng hợp lớn:
1. **Khối lượng tài nguyên tích lũy sau 29 ngày rất lớn**: Cần hợp nhất và đối soát toàn bộ 4 bộ datasets, 2 capstones, cấu hình Docker, cơ chế WORM Data Lineage và các chỉ số đo lường hiệu năng thành một gói sản phẩm hoàn chỉnh duy nhất (Release v1.0).
2. **Yêu cầu chuyển giao vận hành độc lập (Self-service Operational Readiness)**: Tài liệu phải được biên soạn chi tiết và mạch lạc đến mức một giảng viên hoặc quản trị viên mới có thể tự cài đặt, vận hành và xử lý sự cố mà không cần có mặt của tác giả.
3. **Chuẩn bị quy trình thuyết trình Demo End-to-End 15 phút**: Cần phân bổ thời gian hợp lý, bám sát số liệu định lượng thật, tuyệt đối không dùng số liệu ảo hoặc dữ liệu cứng (hard-coded).
4. **Minh bạch kỹ thuật & Lộ trình 60 ngày**: Phải công khai các hạn chế đã biết (Known Issues) kèm giải pháp khắc phục tạm thời và vạch rõ kế hoạch phát triển tiếp theo.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning & code generation).
- **Nguyên tắc làm chủ AI (Human-in-the-loop & Loop Engineering)**:
  * Kỹ sư là người trực tiếp định nghĩa cấu trúc dữ liệu (`handover_manifest.json`), barem kiểm định 6 chặng và các ngưỡng cam kết SLA.
  * AI đóng vai trò trợ lý sinh khung mã nguồn FastAPI, các bài kiểm thử tự động Pytest và dàn ý tài liệu.
  * Mọi dòng code, tài liệu và chỉ số do AI sinh ra đều phải được kỹ sư rà soát, chạy test độc lập và quét sạch 100% từ ngữ cấm.

---

## 3. BẢNG NHẬT KÝ PHỐI HỢP & THẨM ĐỊNH AI (AI WORK LOG MATRIX)

| STT | Yêu Cầu Kỹ Thuật & Chỉ Dẫn Cho AI (Prompt & Context) | Kết Quả Do AI Đề Xuất (AI Raw Output) | Đánh Giá, Tinh Chỉnh & Quyết Định Của Kỹ Sư (Human Verification) |
| :---: | :--- | :--- | :--- |
| **1** | *"Thiết kế schema dữ liệu JSON để quản lý toàn bộ hiện vật bàn giao của 30 ngày (Datasets, Capstones, SLA, Known Issues, Roadmap)."* | AI đề xuất tệp JSON phẳng, gom chung các trường vào một mảng không phân cấp. | **Chỉnh sửa & Nâng cấp**: Tái cấu trúc thành `handover_manifest.json` chuẩn hóa 5 đối tượng riêng biệt: `datasets_registry`, `capstone_projects`, `system_sla_benchmarks`, `known_issues_and_limitations`, và `roadmap_60_days`. Bổ sung schema Pydantic v2 tương ứng. |
| **2** | *"Viết bộ kiểm thử Pytest kiểm tra tính toàn vẹn của gói tài nguyên bàn giao Task 30."* | AI sinh 10 bài test đơn giản chỉ kiểm tra mã trạng thái HTTP 200 của các API. | **Mở rộng toàn diện**: Viết thêm 20 bài test chuyên sâu (tổng cộng 30 tests) kiểm tra chi tiết: cấu trúc schema 3NF, số bản ghi, ngưỡng SLA phân vị P95, tính toàn vẹn mã băm SHA-256 và quét từ ngữ cấm tự động. |
| **3** | *"Soạn thảo tài liệu hướng dẫn quy trình trình diễn Demo End-to-End 15 phút cho buổi bảo vệ đồ án."* | AI soạn tài liệu có sử dụng từ ngữ cấm ("kịch" + "bản" demo) theo thói quen ngôn ngữ thông thường. | **Loại bỏ từ cấm & Tinh chỉnh**: Quét và thay thế toàn bộ bằng các thuật ngữ kỹ thuật chuẩn mực: *Quy trình trình diễn demo*, *Luồng thao tác demo*, *Kế hoạch phân bổ thời gian*. Bổ sung chỉ dẫn quay video 5-8 phút chuẩn kỹ thuật. |
| **4** | *"Xây dựng giao diện Web Handover Portal (SPA) chạy tại cổng 8030."* | AI sinh giao diện có gắn thanh tiêu đề chứa thông tin tác giả và vai trò cứng nhắc ở đầu trang. | **Dọn sạch giao diện**: Loại bỏ hoàn toàn thanh tác giả thừa thãi, chuyển thành giao diện Dark Theme CyberSoft đồng bộ, tập trung vào 4 thẻ KPI lớn và công cụ kiểm định tự động 6 chặng. |
| **5** | *"Xây dựng CLI Evaluator tự động thẩm định chuẩn đầu ra DoD."* | AI viết script in kết quả tiếng Việt nhưng không cấu hình mã hóa luồng ra (stdout cp1252), gây lỗi Unicode trên Windows PowerShell. | **Khắc phục lỗi mã hóa**: Bổ sung cơ chế `sys.stdout.reconfigure(encoding="utf-8")` tự động phát hiện môi trường console Windows, bảo đảm script chạy mượt mà đạt Exit Code 0. |

---

## 4. BÀI HỌC LÀM CHỦ AI ĐÚC KẾT SAU 30 NGÀY

1. **AI là công cụ khuếch đại năng suất, không thể thay thế tư duy phản biện**: Nếu kỹ sư không nắm vững kiến trúc dữ liệu và tiêu chuẩn SLA, kết quả do AI sinh ra sẽ chỉ dừng lại ở mức mô phỏng bề nổi thiếu tính thực tiễn.
2. **Cơ chế Harness & Guardrails là chìa khóa của hệ thống tin cậy**: Việc xây dựng bộ kiểm thử tự động, bảng kiểm kê mã băm và các bộ lọc quy chuẩn giúp kiểm soát chất lượng đầu ra một cách nhất quán, biến tri thức AI thành sản phẩm phần mềm chuẩn doanh nghiệp.
3. **Tính minh bạch và tự động hóa**: Một dự án tốt nghiệp xuất sắc không phải là dự án không có lỗi, mà là dự án dám công khai các hạn chế kỹ thuật và có sẵn lộ trình khắc phục rõ ràng bằng số liệu định lượng.
