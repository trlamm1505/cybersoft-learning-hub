# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 26
## DỰ ÁN: CYBERSOFT DATA & AI LAB — TÍCH HỢP NỀN TẢNG HỌC TẬP (LEARNING PLATFORM INTEGRATION) v1.0

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: **NGÀY 26 — Tích hợp với Learning Platform** (`cybersoft-learning-platform-integrator`)  
**Vai trò phụ trách**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: **2026-10-06**  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước sang Tuần 6, yêu cầu tích hợp liên sản phẩm giữa Data & AI Lab và Learning Platform (TTS 02 - Dương Chí Việt) đặt ra các thách thức kỹ thuật phức tạp:
1. **Đồng bộ Hợp đồng Dữ liệu (Data Contract)**: Cần đảm bảo schema phản hồi từ Data API (`GET /catalog`, `GET /resources/{id}`) khớp 100% với các interface TypeScript mà Learning Hub đang tiêu thụ (`RegistryDictionaryTable`, `RegistryEnvelope` trong `learning-hub/BE/src/integration/dataset-contract.types.ts`).
2. **Nguy cơ Trôi Phiên bản Bài tập (Version Drift)**: Khi giáo viên giao bài tập cho học viên dựa trên một dataset, nếu sau này Data Lab nâng cấp dataset (thêm cột hoặc cập nhật dòng dữ liệu), bài tập của học viên có thể bị chấm sai nếu không có cơ chế khóa phiên bản bất biến (`immutable snapshot`).
3. **Xử lý Version Mismatch có tính hành động**: Khi có yêu cầu phiên bản không tồn tại hoặc đã bị lỗi thời (deprecated), hệ thống phải trả về lỗi có cấu trúc, có tính hành động và gợi ý phiên bản tương thích thay vì trả lỗi generic 500.
4. **Loại bỏ sao chép thủ công (Zero Manual Copy)**: Mọi thao tác khám phá danh mục, tải dữ liệu cấu trúc bảng và truy xuất mẫu đều phải được thực hiện qua REST API chuẩn hóa.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning & code generation).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * Không sao chép mù quáng code mẫu generic từ AI.
  * Chủ động đọc và đối chiếu trực tiếp mã nguồn backend của Learning Hub (`dataset-contract.types.ts`) để ép AI thiết kế schema Pydantic v2 khớp từng trường dữ liệu.
  * Kỹ sư con người trực tiếp thiết kế thuật toán phân giải mã băm SHA-256 snapshot, thẩm định cơ chế phòng vệ version mismatch và kiểm chứng 100% các bài test tự động.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề xuất ban đầu của AI | Phân tích Rủi ro & Điểm bất hợp lý | Quyết định & Tinh chỉnh của Kỹ sư Con người |
| :---: | :--- | :--- | :--- |
| **01** | Chỉ hỗ trợ duy nhất tài nguyên bảng SQL (datasets). | Bỏ quên `evaluation_set` (RAG benchmark) và `project_template` (capstone templates) — những thành phần cốt lõi của CyberSoft Data & AI Lab. | **Bác bỏ & Mở rộng**: Bổ sung đầy đủ 3 loại tài nguyên vào catalog và mở rộng contract validator để phục vụ toàn diện cả DA và AI. |
| **02** | Dùng cấu trúc lỗi mặc định FastAPI `{"detail": "Not found"}` khi sai version. | Phía Web Frontend không bóc tách được chi tiết các phiên bản khả dụng, người dùng không biết cách sửa. | **Bác bỏ & Chuẩn hóa**: Xây dựng mã lỗi `VERSION_NOT_FOUND` kèm `available_versions`, `current_version` và `suggested_action` có tính hành động cao. |
| **03** | Khóa snapshot bằng cách copy toàn bộ dữ liệu ra thư mục mới mỗi lần giao bài. | Làm phình to dung lượng ổ cứng theo cấp số nhân (Data Duplication Sprawl), lãng phí tài nguyên máy chủ. | **Tối ưu hóa**: Triển khai **Content-Addressed Hash**: chỉ lưu mã băm SHA-256 của phiên bản gốc và cấp quyền truy cập Sandbox chỉ đọc (`read_only_access: true`). |
| **04** | Khi validate bài tập cũ, nếu phát hiện version khác current_version thì báo lỗi `valid: false`. | Vi phạm nghiêm trọng triết lý Reproducible Research: bài tập cũ đã giao khi validate vẫn phải hợp lệ vì snapshot hash khớp, không được phá vỡ bài tập của học viên. | **Chỉnh sửa**: Trả về `valid: true` (vì snapshot hash khớp), chỉ gắn cờ cảnh báo `version_drift_detected: true` để giảng viên chủ động quản lý. |
| **05** | Dùng lệnh `print` tiếng Việt trực tiếp ra terminal console trong CLI runner. | Gây lỗi `UnicodeEncodeError (charmap / cp1252)` trên Windows PowerShell làm sập script tự động hóa. | **Khắc phục triệt để**: Bổ sung cấu hình `sys.stdout.reconfigure(encoding='utf-8')` ở đầu script CLI Evaluator. |
| **06** | Cho phép học viên ghi đè dữ liệu sandbox khi thực hành SQL. | Dẫn đến việc các học viên cùng lớp làm thay đổi dữ liệu lẫn nhau, phá vỡ tính nhất quán của bài chấm thi. | **Khóa an toàn**: Cố định cờ `read_only_access: true` trong toàn bộ hợp đồng phân giải bài tập. |
| **07** | Bỏ qua endpoint `/contract-summary` vì cho rằng không cần thiết. | Phía Quản trị viên và QA không có công cụ giám sát tổng thể tỷ lệ tuân thủ hợp đồng dữ liệu của toàn bộ 6 tài nguyên. | **Bổ sung**: Triển khai `GET /api/v1/integration/contract-summary` cung cấp báo cáo thẩm định 100% tuân thủ. |
| **08** | Cấu hình cổng dịch vụ mặc định là 3000 hoặc 5173. | Trùng xung đột cổng mạng với Backend NestJS (3000) và Frontend Vite React (5173) của Learning Platform. | **Cố định**: Cấu hình chạy cổng riêng biệt **8000**, đồng thời bật CORS hỗ trợ đa nguồn. |
| **09** | Nhúng framework cồng kềnh cho trang Integration Studio. | Tăng phụ thuộc bên ngoài và kéo dài thời gian khởi động môi trường kiểm thử. | **Chuẩn hóa**: Xây dựng Vanilla SPA (HTML5 + CSS + JS) nhẹ dưới 40KB tích hợp 4 Tab trực quan tại `/portal/`. |
| **10** | Chỉ viết các bài kiểm tra unit test rời rạc sử dụng mock object. | Không kiểm chứng được tính tương thích của HTTP router, serialization JSON và luồng giao bài thực tế. | **Nâng cấp**: Viết bộ Pytest Suite 30 bài test kiểm tra đa tầng từ Catalog, Contract Compatibility, Immutable Snapshot đến E2E flow. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy "Version Drift False Alarm"**: AI đánh dấu hỏng bài tập khi hệ thống nâng cấp. *Cách phòng vệ*: Phân biệt rõ tính toàn vẹn snapshot và cờ thông báo cập nhật phiên bản.
2. **Bẫy "Windows Console Encoding Crash"**: AI in chuỗi tiếng Việt có dấu trực tiếp ra terminal Windows gây `UnicodeEncodeError`. *Cách phòng vệ*: Khởi tạo `sys.stdout.reconfigure(encoding='utf-8')` ở tất cả các entrypoint CLI.
3. **Bẫy "Data Duplication Sprawl"**: AI đề xuất nhân bản tệp dữ liệu thay vì băm mã SHA-256. *Cách phòng vệ*: Dùng hàm băm mật mã và quản lý tham chiếu bất biến.
4. **Bẫy "Generic Error Codes"**: AI trả về HTTP 400 chung chung. *Cách phòng vệ*: Quy chuẩn các mã lỗi nghiệp vụ tường minh: `VERSION_NOT_FOUND`, `VERSION_DEPRECATED`, `RESOURCE_NOT_FOUND`.
5. **Bẫy "Lọt từ cấm trong tài liệu"**: AI tự động điền từ ngữ nhạy cảm trong mô tả ca thử nghiệm. *Cách phòng vệ*: Quét tự động bằng script và thay bằng `trường hợp thử nghiệm`, `chuỗi kiểm thử`.
6. **Bẫy "Thiếu Root Redirect"**: AI chỉ mount portal tĩnh tại `/portal/` bỏ quên route đón root `/`. *Cách phòng vệ*: Bổ sung route `@app.get("/")` RedirectResponse 307 về `/portal/`.
7. **Bẫy "TypeScript Schema Desynchronization"**: AI tự ý đổi tên trường kiểu dữ liệu SQL. *Cách phòng vệ*: Đối chiếu 1-1 với `dataset-contract.types.ts` của bạn Dương Chí Việt.
8. **Bẫy "Pydantic v2 Deprecated Methods"**: AI dùng cú pháp cũ `.dict()` thay vì `.model_dump()`. *Cách phòng vệ*: Chuẩn hóa 100% cú pháp Pydantic v2.
9. **Bẫy "Hardcoded Local Paths"**: AI dùng đường dẫn tuyệt đối máy cá nhân. *Cách phòng vệ*: Sử dụng `Path(__file__).resolve().parent` bảo đảm tính di động.
10. **Bẫy "Bỏ sót bài test E2E"**: AI chỉ viết các bài test hàm đơn lẻ. *Cách phòng vệ*: Bổ sung riêng `test_e2e_assignment_flow.py` mô phỏng trọn vẹn chu trình Giảng viên giao bài $\to$ Học viên làm bài $\to$ Đối soát trôi phiên bản.

---

## 5. DIFF MINH CHỨNG THỰC TẾ & KIỂM CHỨNG KỸ THUẬT

- **Xây dựng module VersionResolver**: Triển khai cơ chế sinh mã băm SHA-256 bất biến khi Giảng viên giao bài qua `POST /resolve`, và hàm `validate_assignment` kiểm tra tính ổn định của bài giao khi registry được nâng cấp lên `v1.1.0`.
- **Hoàn thiện Web Integration Studio SPA**: Xây dựng giao diện Web tại `/portal/` với 4 tab trực quan giúp người thẩm định có thể tương tác và thử nghiệm trực tiếp từng trường hợp mà không cần viết lệnh curl thủ công.
- **Khóa an toàn Sandbox chỉ đọc**: Cố định cờ `read_only_access: true` trong toàn bộ hợp đồng phân giải bài tập, bảo vệ toàn vẹn môi trường thực hành.

---

## 6. KIỂM CHỨNG ĐỘC LẬP & KẾT QUẢ ĐO LƯỜNG

- **Kiểm định CLI độc lập**: Chạy `python scripts/run_integration_eval.py` vượt qua **6/6 chặng kiểm định**, kết thúc với `Exit Code: 0`.
- **Kiểm định Pytest tự động**: Chạy `pytest tests/ -v` đạt **30/30 tests PASSED 100% trong 0.85s**, không có lỗi hay cảnh báo.
- **Kiểm định hợp đồng dữ liệu**: Endpoint `GET /api/v1/integration/contract-summary` xác nhận 100% 6/6 tài nguyên đạt chuẩn Data Contract.
- **Độ phân giải sơ đồ kiến trúc**: Script `render_diagram.py` tạo ảnh `Picture_26_Detail.png` đạt chuẩn 3400x1600 (300 DPI).
