# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 27
## DỰ ÁN: CYBERSOFT DATA & AI LAB — TÍCH HỢP CHỐT CHẶN CHẤT LƯỢNG QA (QA HARNESS INTEGRATION) v1.0

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: **NGÀY 27 — Tích hợp với QA Harness** (`cybersoft-qa-quality-gate-engine`)  
**Vai trò phụ trách**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: **2026-10-07**  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước sang Ngày 27, bài toán tích hợp giữa Data & AI Lab và QA Harness (TTS 03 - Trần Quốc Nguyên) đòi hỏi các giải pháp kỹ thuật có tính kỷ luật cao:
1. **Tiếp nhận & Cấu hình Test Rules từ QA**: Làm sao để các tiêu chuẩn kiểm thử do bạn QA đặt ra (chống lộ bí mật trong code, zero real PII, toàn vẹn schema, ngưỡng đánh giá RAG và content lint) được chuyển hóa thành các chốt chặn tự động trong hệ sinh thái Data Lab.
2. **Xây dựng Chốt Chặn Phát Hành Tổng Hợp (Master Release Gate)**: Cần một pipeline duy nhất có thể thẩm định đồng thời cả 3 loại tài nguyên: Dataset, RAG Benchmark và Nội dung học tập trước khi cho phép đóng gói release.
3. **Cơ chế Actionable Reasons & Zero Silent Bypass**: Loại bỏ hoàn toàn tình trạng fail mù mờ (chỉ báo lỗi mà không chỉ cách sửa); đồng thời ngăn chặn triệt để thói quen bỏ qua chốt chặn âm thầm (silent bypass) của các lập trình viên khi chuẩn bị phát hành.
4. **Bộ Dữ liệu Kiểm thử Dùng chung (Shared Fixtures)**: Chuẩn hóa các bộ test fixture sạch và lỗi để đội ngũ QA có thể đối soát độc lập mà không cần tạo lại dữ liệu giả lập.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning & code generation).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * Tận dụng AI để sinh nhanh các mẫu dữ liệu fixture (clean và corrupted) và dựng khung API FastAPI.
  * Kỹ sư con người kiểm soát chặt chẽ logic chốt chặn: ép AI phân tách rõ mức độ nghiêm trọng (`CRITICAL`, `HIGH`, `MEDIUM`) tương ứng với hành vi Gate (`BLOCK_RELEASE` vs `WARNING`).
  * Tự tay thiết kế và kiểm chứng chính sách Zero Silent Bypass, tuyệt đối không cho phép AI chèn bất kỳ backdoor hay cờ bypass mặc định nào.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề xuất ban đầu của AI | Phân tích Rủi ro & Điểm bất hợp lý | Quyết định & Tinh chỉnh của Kỹ sư Con người |
| :---: | :--- | :--- | :--- |
| **01** | Hễ phát sinh bất kỳ lỗi nào ở Content Lint thì lập tức khóa cứng phát hành (`BLOCKED`). | Lỗi thiếu mô tả bài học hoặc liên kết ngoài tạm thời không nên làm nghẽn tiến độ phát hành nếu tài nguyên lõi (Dataset, RAG) đã hoàn hảo. | **Bác bỏ & Phân cấp**: Tách riêng Content Lint thành cấp `MEDIUM` với hành vi `WARNING`, cho phép phát hành có cảnh báo, chỉ khóa cứng khi có lỗi Critical/High. |
| **02** | Cho phép bypass chốt chặn mà không cần lý do hoặc chỉ cần cờ `--force`. | Phá vỡ toàn bộ kỷ luật chất lượng, dẫn tới việc lập trình viên lạm dụng để đẩy mã lỗi lên môi trường đào tạo. | **Bác bỏ & Thiết lập kỷ luật**: Yêu cầu lý do giải trình tối thiểu 15 ký tự, có người duyệt `authorized_by` và ném lỗi `BYPASS_REJECTED` nếu vi phạm. |
| **03** | Viết bài test trong `test_edge_cases.py` phụ thuộc vào thứ tự chạy của bài test khác (`assert len(records) >= 2`). | Phá vỡ tính độc lập (Test Isolation) của Pytest; khi chạy đơn lẻ hoặc theo thứ tự bảng chữ cái sẽ bị fail. | **Chỉnh sửa**: Viết lại điều kiện assert `assert len(records) >= 1` và reset trạng thái fixture độc lập cho từng bài test. |
| **04** | Dùng lệnh `print` tiếng Việt trực tiếp ra terminal console trong CLI runner. | Gây lỗi `UnicodeEncodeError` trên Windows PowerShell làm sập script tự động hóa của học viên. | **Khắc phục**: Bổ sung `sys.stdout.reconfigure(encoding='utf-8')` ở đầu tệp `run_qa_gate_eval.py`. |
| **05** | Lưu nhật ký kiểm toán Audit Trail tạm thời trong biến nhớ RAM (In-memory variable). | Khi khởi động lại dịch vụ, toàn bộ lịch sử bypass bị biến mất, vi phạm nguyên tắc kiểm toán an ninh bất biến. | **Nâng cấp**: Lưu trữ Audit Trail vào tệp JSON trên đĩa cứng có ghi nhận nhãn thời gian ISO 8601 và mã yêu cầu. |
| **06** | Chỉ báo lỗi tổng quát *"Dataset validation failed"* khi phát hiện vi phạm. | Kỹ sư không biết phải sửa từ đâu, tốn hàng giờ mở từng tệp dữ liệu kiểm tra. | **Chuẩn hóa**: Bổ sung trường `actionable_fix` chỉ rõ tên script cần chạy (ví dụ: `scripts/clean_orphans.py`). |
| **07** | Bỏ qua endpoint `/fixtures-summary` vì cho rằng QA có thể tự mở thư mục xem. | Thiếu tính năng khám phá tự động qua API, làm giảm tính tự động hóa của hệ thống CI/CD bên QA. | **Bổ sung**: Triển khai `GET /api/v1/qa/fixtures-summary` thống kê số lượng và tình trạng của toàn bộ 3 bộ fixtures. |
| **08** | Gom toàn bộ logic kiểm tra vào một hàm duy nhất dài hàng trăm dòng trong route. | Khó bảo trì, khó viết unit test độc lập cho từng loại tài nguyên. | **Tách lớp kiến trúc**: Phân chia thành `QAHookService` xử lý độc lập từng hook và `ReleaseGateEngine` đóng vai trò tổng hợp quyết định. |
| **09** | Nhúng thư viện ngoài nặng nề cho giao diện Web Dashboard. | Làm tăng thời gian tải trang và gây phụ thuộc không cần thiết cho một dịch vụ nội bộ. | **Chuẩn hóa**: Xây dựng Vanilla SPA Cyber-Dark nhẹ dưới 45KB tích hợp 4 Tab trực quan tại `/portal/`. |
| **10** | Chỉ viết test cho luồng kiểm thử thành công (Happy Path). | Bỏ sót các ca bẫy: rò rỉ secret ngụy trang, bypass không hợp lệ, dữ liệu mồ côi liên bảng. | **Nâng cấp**: Viết bộ Pytest Suite 30 bài test bao phủ toàn diện cả ca thành công, ca bị chặn, ca cảnh báo và ca biên. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy "Flaky Test Order Dependence"**: AI giả định thứ tự thực thi test theo giả định chủ quan. *Cách phòng vệ*: Đảm bảo tính độc lập tuyệt đối giữa các test module.
2. **Bẫy "Overly Aggressive Blocking"**: AI khóa phát hành cho các cảnh báo nhỏ. *Cách phòng vệ*: Thiết lập ma trận ánh xạ Severity $\to$ Gate Action rõ ràng (Critical/High $\to$ Block, Medium $\to$ Warn).
3. **Bẫy "Silent Bypass Backdoor"**: AI để ngỏ tham số bypass không kiểm tra độ dài. *Cách phòng vệ*: Chặn cứng tại schema Pydantic với `min_length=15`.
4. **Bẫy "Windows Console Encoding Crash"**: AI in chuỗi tiếng Việt có dấu trực tiếp ra terminal Windows gây `UnicodeEncodeError`. *Cách phòng vệ*: Khởi tạo `sys.stdout.reconfigure(encoding='utf-8')` ở tất cả các entrypoint CLI.
5. **Bẫy "Opaque Error Messages"**: AI chỉ báo mã lỗi mà không có hướng dẫn hành động. *Cách phòng vệ*: Bắt buộc mọi finding đều có trường `actionable_fix` rõ ràng.
6. **Bẫy "Thiếu Root Redirect"**: AI chỉ mount portal tĩnh tại `/portal/` bỏ quên route đón root `/`. *Cách phòng vệ*: Bổ sung route `@app.get("/")` RedirectResponse 307 về `/portal/`.
7. **Bẫy "Memory-only Audit Trail"**: AI lưu audit log trong RAM. *Cách phòng vệ*: Bền vững hóa vào tệp dữ liệu bất biến.
8. **Bẫy "Lọt từ cấm trong tài liệu"**: AI tự động điền từ ngữ nhạy cảm trong hướng dẫn kiểm thử. *Cách phòng vệ*: Quét tự động bằng script và thay bằng `trường hợp thử nghiệm`, `chuỗi kiểm tra`.
9. **Bẫy "Pydantic v2 Deprecated Methods"**: AI dùng `.dict()` cũ. *Cách phòng vệ*: Chuẩn hóa 100% cú pháp `.model_dump()`.
10. **Bẫy "Hardcoded Absolute Paths"**: AI dùng đường dẫn máy cá nhân. *Cách phòng vệ*: Sử dụng `Path(__file__).resolve().parent` bảo đảm tính di động.

---

## 5. DIFF MINH CHỨNG THỰC TẾ & KIỂM CHỨNG KỸ THUẬT

- **Xây dựng module QAHookService & ReleaseGateEngine**: Phân tách rõ ràng 4 hooks kiểm định và động cơ tổng hợp trạng thái chốt chặn.
- **Hoàn thiện Web Failure Dashboard SPA**: Xây dựng giao diện Web tại `/portal/` với 4 tab trực quan giúp mô phỏng việc khóa bản phát hành lỗi và chặn đứng hành vi bypass âm thầm.
- **Thiết lập chính sách Zero Silent Bypass**: Triển khai bộ kiểm tra nghiêm ngặt lý do giải trình và lưu vết Audit Trail đầy đủ.

---

## 6. KIỂM CHỨNG ĐỘC LẬP & KẾT QUẢ ĐO LƯỜNG

- **Kiểm định CLI độc lập**: Chạy `python scripts/run_qa_gate_eval.py` vượt qua **6/6 chặng kiểm định**, kết thúc với `Exit Code: 0`.
- **Kiểm định Pytest tự động**: Chạy `pytest tests/ -v` đạt **30/30 tests PASSED 100% trong 0.87s**, không có lỗi hay cảnh báo.
- **Kiểm tra đồ họa kiến trúc**: Script `render_diagram.py` tạo ảnh `Picture_27_Detail.png` đạt chuẩn 3400x1600 (300 DPI).
- **Thử nghiệm Web Failure Dashboard**: Mô phỏng thành công việc khóa gói phát hành lỗi, hiển thị 4 actionable reasons và chặn đứng hành vi bypass âm thầm.
