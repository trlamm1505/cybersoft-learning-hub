# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 21
## DỰ ÁN: CYBERSOFT DATA & AI LAB — PHÂN HỆ API VÀ HỢP ĐỒNG TÍCH HỢP v1.0

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 21 — API và hợp đồng tích hợp (`cybersoft-data-ai-api`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-09-29  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước sang Tuần 5, phân hệ CyberSoft Data & AI Lab cần giải quyết bài toán giao tiếp liên phân hệ trong kiến trúc Monorepo/Microservices:
1. **Rào cản ngôn ngữ và runtime**: Nền tảng gồm nhiều ứng dụng vệ tinh phát triển trên nhiều công nghệ khác nhau (Backend NestJS, Web Frontend React, kịch bản kiểm thử tự động Python QA). Nếu không có chuẩn giao tiếp chính thức, việc tích hợp sẽ phát sinh xung đột mã nguồn và đứt gãy giao diện.
2. **Thiếu vắng Hợp đồng Dịch vụ (API Contract)**: Trước Ngày 21, chưa có tài liệu OpenAPI v3.1 rõ ràng quy định schema đầu vào, đầu ra, các ràng buộc kiểu dữ liệu và cam kết thời gian đáp ứng (SLA).
3. **Cấu trúc phản hồi lỗi phân mảnh**: Các phân hệ tự xử lý lỗi theo cách riêng, dẫn đến tình trạng Frontend hoặc QA Script bị crash khi gặp lỗi ngoại lệ không lường trước.
4. **Yêu cầu an toàn và phân quyền phát triển**: Cần một cơ chế Mock Authentication & RBAC gọn nhẹ, không phụ thuộc vào hạ tầng OAuth ngoài nhưng vẫn mô phỏng chính xác 4 vai trò vận hành (`student`, `instructor`, `qa_engineer`, `admin`).

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning & code generation).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * AI đóng vai trò trợ lý sinh mã khung (Boilerplate) và rà soát cú pháp đặc tả OpenAPI.
  * Kỹ sư con người giữ quyền quyết định kiến trúc phân tầng, thiết kế schema dữ liệu, thẩm định logic phân quyền RBAC và kiểm chứng 100% kết quả đo lường thực nghiệm.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề xuất ban đầu của AI | Phân tích Rủi ro & Điểm bất hợp lý | Quyết định & Tinh chỉnh của Kỹ sư Con người |
| :---: | :--- | :--- | :--- |
| **01** | Cài đặt hệ thống JWT Authentication đầy đủ với SQLite và bảng Users phức tạp. | Quá cồng kềnh cho môi trường lab tích hợp; phụ thuộc database state làm CI test của client bị flakiness. | **Bác bỏ**: Chuyển sang **Mock In-Memory Credential Store** hỗ trợ cả header `X-API-Key` và Bearer token với 4 vai trò định sẵn, 100% deterministic và độc lập môi trường. |
| **02** | Dùng cấu trúc lỗi mặc định của FastAPI (`{"detail": [...]}`). | Cấu trúc mặc định của FastAPI không có trường `code`, không có `request_id`, định dạng mảng gây khó khăn cho Axios interceptor của Web Frontend. | **Bác bỏ & Chuẩn hóa**: Xây dựng **Uniform Error Envelope** (`code`, `message`, `details`, `request_id`, `timestamp`) bọc toàn bộ mã HTTP 400, 401, 403, 404, 422, 500. |
| **03** | Bỏ qua các endpoint `/quality` vì cho rằng chất lượng là việc nội bộ của Data team. | Bỏ sót nhu cầu cốt lõi của đội ngũ QA trong ngày 21 là xây dựng "Quality dashboard hợp nhất" thu thập số liệu Data Quality và RAG Eval. | **Bổ sung bắt buộc**: Triển khai `/api/v1/quality/metrics` và `/validate-dataset`, cung cấp đầy đủ các chỉ số Recall@5, MRR, Citation Precision, Latency p95 cho phân hệ QA. |
| **04** | Đặt cổng mặc định của dịch vụ API là 3000 hoặc 5173. | Trùng xung đột cổng mạng với Backend NestJS (3000) và Frontend Vite React (5173) của Learning Platform. | **Cố định**: Cấu hình chạy cổng riêng biệt **8000**, đồng thời bật CORS mở cho `http://localhost:5173` và `http://localhost:3000`. |
| **05** | Gọi API OpenAI Cloud trả phí để sinh câu trả lời trong endpoint AI Tutor. | Tốn kém chi phí định kỳ, rủi ro cạn quota token trên CI, độ trễ mạng cao và phụ thuộc kết nối internet ngoài. | **Tối ưu hóa**: Triển khai **Grounded Local Synthesis** trên 91 chunks học liệu chuẩn hóa, tích hợp Guardrails và Safe Abstention, chi phí **$0.00 USD**. |
| **06** | Trả về kết quả tìm kiếm Semantic Search dạng raw text không kèm trích nguồn. | Vi phạm tôn chỉ sư phạm và tính liêm chính học thuật của CyberSoft; học viên không biết kiến thức lấy từ đâu. | **Bổ sung**: Bắt buộc mọi chunk trả về phải có cấu trúc `source_citation: [Tên tài liệu, Mục/Trang]` rõ ràng để đối soát. |
| **07** | Trả về toàn bộ danh sách dataset không hỗ trợ phân trang (Pagination). | Khi số lượng dataset tăng lên hàng trăm bộ, response sẽ nặng hàng chục MB, gây nghẽn đường truyền của nền tảng học tập. | **Chuẩn hóa**: Bổ sung `PaginationMeta` (`total`, `limit`, `offset`, `has_next`) trên toàn bộ các endpoint danh sách. |
| **08** | Không truyền `X-Request-ID` trong response header. | Khó khăn cho việc tra vết log (Observability) khi các client hoặc kịch bản kiểm thử báo lỗi API trong quá trình tích hợp. | **Cải tiến**: Viết Middleware tự động gắn `X-Request-ID` (dạng `req-xxxx`) và đo thời gian xử lý `X-Response-Time-Ms` trên từng request. |
| **09** | Chỉ viết các unit test rời rạc sử dụng mock object. | Không kiểm chứng được tính tương thích của HTTP router, serialization JSON và các exception handler thực tế. | **Nâng cấp**: Viết **Pytest Integration Test Suite** gồm 29 bài test chạy trực tiếp qua `TestClient`, xác thực từng mã trạng thái HTTP thực tế. |
| **10** | Chỉ xuất đặc tả hợp đồng dưới dạng file JSON đơn lẻ. | Giảng viên và học viên lớp QA không quen đọc JSON thô; khó import vào công cụ kiểm thử giao diện. | **Mở rộng bàn giao**: Xuất song song file YAML (`openapi.yaml`) và đóng gói sẵn **Postman Collection v2.1** kèm file Environment local. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy "Code Generator Sprawl" (Sinh mã thừa thãi)**: AI có xu hướng import hàng loạt thư viện nặng (Celery, Redis, SQLAlchemy). *Cách tránh*: Giữ kiến trúc gọn gàng, thuần túy FastAPI và in-memory services.
2. **Bẫy "Hardcoded Absolute Paths" (Đường dẫn cứng)**: AI dùng đường dẫn dạng `C:/Users/ADMIN/...`. *Cách tránh*: Sử dụng `Path(__file__).resolve().parent` bảo đảm chạy được trên mọi máy tính.
3. **Bẫy "Silent Data Corruption" (Lặng lẽ nuốt lỗi)**: AI dùng `except: pass` khi load dữ liệu. *Cách tránh*: Ghi log cảnh báo và có cơ chế fallback tường minh.
4. **Bẫy "False Sense of Security" (An ninh giả tạo)**: AI gợi ý hardcode password trong code mà không có vai trò. *Cách tránh*: Thiết kế bảng phân quyền RBAC phân tách 4 vai trò độc lập.
5. **Bẫy "Breaking Schema Changes" (Phá vỡ tính tương thích)**: AI tự ý đổi tên trường `records_count` thành `count`. *Cách tránh*: Khóa chặt Schema Pydantic v1.0.
6. **Bẫy "Inconsistent Date Format" (Sai lệch định dạng thời gian)**: AI sinh chuỗi timestamp không có múi giờ Z. *Cách tránh*: Bắt buộc chuẩn ISO 8601 UTC kết thúc bằng `Z`.
7. **Bẫy "Hallucinated Endpoints" (Endpoint ảo tưởng)**: AI sinh các router không có thực trong kế hoạch 30 ngày. *Cách tránh*: Đối soát 1-1 với văn bản `01_Ke_hoach_30_ngay_Thuc_tap_sinh_Data_AI_RAG.docx`.
8. **Bẫy "Over-Promising SLA" (Cam kết phi thực tế)**: AI đề xuất SLA độ trễ < 1ms cho RAG. *Cách tránh*: Đo đạc thực tế qua `demo_client.py` và thiết lập mốc SLA trung thực (< 100ms cho search, < 250ms cho tutor).
9. **Bẫy "Ignoring Cross-Origin Requests" (Bỏ quên CORS)**: AI quên bật CORS làm Frontend bị trình duyệt chặn kết nối. *Cách tránh*: Cấu hình CORSMiddleware mở rộng cho cả port 5173 và 3000.
10. **Bẫy "Overfitting Unit Tests" (Kiểm thử hình thức)**: AI viết test chỉ assert `status_code == 200` mà không kiểm tra cấu trúc payload. *Cách tránh*: Assert sâu vào từng trường của Uniform Envelope.

---

## 5. BỐN TẦNG NĂNG LỰC ỨNG DỤNG AI (THE FOUR TIERS OF AI MASTERY)

Trong quá trình thực hiện Task 21, tôi áp dụng mô hình Bốn Tầng Năng Lực AI:
- **Tầng 1 — Trợ lý cú pháp (Syntax Assistant)**: Dùng AI gợi ý cú pháp Pydantic v2 `Field(..., description=...)` và định nghĩa kiểu dữ liệu.
- **Tầng 2 — Tăng tốc sinh mã khung (Scaffolding Acceleration)**: Dùng AI sinh khung các router FastAPI và mẫu Postman Collection JSON từ OpenAPI schema.
- **Tầng 3 — Thẩm định & Phản biện kỹ thuật (Critical Architecture Review)**: Kỹ sư chủ động bắt bẻ AI về việc xung đột cổng với Web Frontend/Backend, thiếu endpoint cho phân hệ QA, và chuẩn hóa Uniform Error Envelope.
- **Tầng 4 — Điều phối hệ sinh thái & Làm chủ giải pháp (Ecosystem Orchestration)**: Tự tay liên kết các phân hệ trong hệ sinh thái (Data Lab - Learning Hub - QA Platform), viết bộ kiểm thử tích hợp 29 bài test, và xuất bản tài liệu hợp đồng đạt chuẩn DoD 100%.

---

## 6. LỖI KỸ THUẬT PHÁT SINH, NGUYÊN NHÂN GỐC RỄ & CÁCH KHẮC PHỤC

### Sự cố 1: Lỗi UnicodeEncodeError trên Console Windows khi chạy demo
- **Hiện tượng**: Lệnh `python scripts/demo_client.py` gặp lỗi `UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f680'`.
- **Nguyên nhân gốc rễ**: Console Windows mặc định dùng bảng mã `cp1252`, không in được các ký tự icon Emoji trong thông điệp tiếng Việt.
- **Giải pháp xử lý**: Thêm đoạn cấu hình `sys.stdout.reconfigure(encoding="utf-8")` ở đầu tất cả các script Python. Chạy lại script thành công 100%.

### Sự cố 2: Lỗi 404 khi kiểm thử tra cứu Chunk ID trong Test Suite
- **Hiện tượng**: Bài test `test_get_chunk_detail_success` bị `assert 404 == 200` khi truy vấn chunk `chk_rag_02`.
- **Nguyên nhân gốc rễ**: Tệp dữ liệu `chunks_markdown_header_semantic.jsonl` được kế thừa từ Task 16-20 sử dụng mã chunk dạng `CS-TXT-001_chk_000`, trong khi bài test ban đầu hardcode mã của fallback chunk. Đồng thời `SearchService.get_chunk_by_id` chưa trích xuất trường `text` và `heading_hierarchy`.
- **Giải pháp xử lý**: Cập nhật `SearchService.get_chunk_by_id` đọc đa năng cả trường `text` và `content`, đồng thời cập nhật bài test lấy động mã chunk thực tế từ tập dữ liệu. Kết quả test suite đạt **29/29 tests PASS 100%**.
