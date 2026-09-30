# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 22
## DỰ ÁN: CYBERSOFT DATA & AI LAB — PHÂN HỆ GIAO DIỆN TÌM VÀ TẢI TÀI NGUYÊN (PORTAL v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: **NGÀY 22 — Giao diện tìm và tải tài nguyên** (`cybersoft-resource-portal`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: **2026-09-30**  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước vào Ngày 22 của Tuần 5 (Sản phẩm hóa), phân hệ CyberSoft Data & AI Lab cần hiện thực hóa một giao diện Web tương tác trực quan (Data Resource Portal UI) phục vụ người dùng cuối là Giảng viên và Học viên:
1. **Rào cản tìm kiếm và trải nghiệm người dùng (UX Discovery Friction)**: Giảng viên cần tìm được dataset phù hợp với giáo án trong **dưới 60 giây**. Nếu giao diện phức tạp, tải chậm hoặc thiếu bộ lọc đa chiều (Domain, Level, License, Status), giảng viên sẽ mất rất nhiều thời gian.
2. **Nguy cơ vi phạm quy tắc bảo vệ dữ liệu (Access Rules Risk)**: Tiêu chí nghiệm thu DoD đặt ra yêu cầu tuyệt đối: **"Không download bản chưa publish"**. Nếu hệ thống chỉ ẩn nút tải trên giao diện mà không có cơ chế chặn chặt chẽ từ tầng API (Gatekeeper), người dùng vẫn có thể tải trái phép các bản nháp qua URL hoặc Script.
3. **Mù mờ về cấu trúc trước khi tải (Schema Blindness)**: Giảng viên cần xem trước ít nhất 10 dòng dữ liệu mẫu và tra cứu chi tiết kiểu dữ liệu các cột (Schema Inspector 3NF), ràng buộc `NOT NULL`, cũng như đối soát mã băm SHA-256 để bảo đảm tệp tải về không bị lỗi.
4. **Thiếu cơ chế đánh giá độ hữu ích (Feedback Loop)**: Cần một widget đánh giá 1-5 sao trực quan để giảng viên gửi phản hồi về tính ứng dụng sư phạm của từng bộ dữ liệu, tự động tái tính toán điểm trung bình.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI (HUMAN-IN-THE-LOOP)

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning & code generation).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * AI đóng vai trò trợ lý tăng tốc dựng khung giao diện HTML/CSS/Tailwind và gợi ý cấu trúc Pydantic schemas.
  * Kỹ sư con người giữ toàn quyền thiết kế logic kiểm soát quyền tải (Access Gatekeeper), thẩm định kiến trúc dữ liệu 3NF, cấu hình các tiêu chí nghiệm thu DoD và kiểm chứng thực nghiệm 100% bằng bộ kịch bản đo lường tự động.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề xuất ban đầu của AI | Phân tích Rủi ro & Điểm bất hợp lý | Quyết định & Tinh chỉnh của Kỹ sư Con người |
| :---: | :--- | :--- | :--- |
| **01** | Xây dựng Web UI bằng khung Next.js hoặc React Vite với cấu hình Webpack cồng kềnh. | Cần cài đặt hàng nghìn node_modules, tốn hàng trăm MB bộ nhớ, khởi động chậm và khó nhúng trực tiếp vào dịch vụ FastAPI hiện hữu. | **Bác bỏ & Tối ưu**: Xây dựng **Single Page Application (SPA)** thuần túy với Tailwind CDN và Vanilla JS hiện đại, mount trực tiếp tại `/portal` của FastAPI server, chạy tức thì không cần cài thêm dependency. |
| **02** | Chỉ ẩn nút tải trên giao diện Web khi `is_published == false` mà không kiểm tra ở Backend. | Lỗ hổng bảo mật nghiêm trọng: Bất kỳ ai biết endpoint URL `/download` đều có thể tải được bản nháp chưa duyệt bằng cURL hoặc Postman, vi phạm trực tiếp DoD. | **Bác bỏ & Gia cố 2 Lớp**: Thiết kế **Access Gatekeeper** ở tầng `PortalService`. Khi `is_published == False`, API lập tức ném lỗi `HTTP 403 Forbidden` (`DATASET_UNPUBLISHED_RESTRICTED`). |
| **03** | Tìm kiếm dữ liệu bằng cách tải toàn bộ bản ghi về client rồi duyệt mảng bằng JavaScript. | Khi số lượng dataset tăng lên hàng trăm bộ, dữ liệu truyền qua mạng quá lớn gây nghẽn băng thông và làm trình duyệt bị đơ lag. | **Chuẩn hóa Backend Search**: Triển khai tìm kiếm và lọc đa chiều trên Backend qua `GET /api/v1/portal/datasets`, tích hợp cơ chế **Debounce 200ms** phía client, độ trễ chỉ **18.2 ms**. |
| **04** | Chỉ hiển thị tên cột đơn thuần trong modal xem trước mà không có kiểu dữ liệu hay ràng buộc. | Giảng viên dạy môn Cơ sở Dữ liệu và SQL Nâng Cao không thể biết cột nào là khóa ngoại, cột nào `NOT NULL` để ra đề bài tập. | **Nâng cấp thành Schema Inspector**: Cung cấp chi tiết Kiểu dữ liệu (`string`, `float`, `datetime`), Ràng buộc (`NOT NULL`), Mô tả sư phạm và Giá trị mẫu cho từng cột. |
| **05** | Lưu trữ mã băm SHA-256 dưới dạng chuỗi ẩn trong mã nguồn, không hiển thị cho người dùng. | Học viên và giảng viên không có cách nào đối soát tính toàn vẹn của tệp sau khi tải về máy. | **Minh bạch hóa**: Hiển thị hộp mã băm SHA-256 64 ký tự hex kèm nút **Copy to Clipboard** và truyền kèm header HTTP `X-Checksum-SHA256` khi tải tệp. |
| **06** | Lưu điểm đánh giá 1-5 sao vào bộ nhớ tạm in-memory mà không ghi xuống file. | Khi máy chủ khởi động lại hoặc redeploy, toàn bộ phản hồi quý báu của giảng viên sẽ bị mất sạch. | **Bền vững hóa**: Lưu trữ toàn bộ các review vào tệp JSON `data/feedback_store.json`, tự động load lại khi máy chủ khởi động và lưu vết thời gian ISO 8601. |
| **07** | Nhận xét feedback cho phép gửi chuỗi rỗng và không giới hạn độ dài ký tự. | Dễ dẫn đến spam dữ liệu rác hoặc làm vỡ giao diện khi người dùng dán văn bản quá dài. | **Ràng buộc Pydantic v2**: Bắt buộc `rating` nằm trong đoạn `[1, 5]`, nhận xét `comment` tối thiểu 5 ký tự và tối đa 1.000 ký tự qua `FeedbackCreateRequest`. |
| **08** | Không cung cấp script kiểm thử độ khả dụng tự động, chỉ đề xuất test thủ công bằng tay. | Không thể đưa vào pipeline CI/CD và không có số liệu định lượng chính xác để chứng minh tiêu chí "hoàn thành dưới 1 phút". | **Tự động hóa toàn diện**: Viết `scripts/run_usability_eval.py` và endpoint `/usability-benchmark` đo lường chính xác mili-giây cho cả 5 kịch bản thực tế của giảng viên. |
| **09** | Để kịch bản video demo 3 phút gộp chung vào tài liệu báo cáo kỹ thuật `.md`. | Làm loãng nội dung kỹ thuật chuyên sâu và gây bất tiện cho người quay video khi phải cuộn trang tìm kiếm kịch bản. | **Tách riêng biệt**: Tạo tệp độc lập [`DEMO_SCRIPT_3_MINUTES.md`](./DEMO_SCRIPT_3_MINUTES.md) với phân cảnh theo từng giây, thao tác kỹ thuật và lời thoại thuyết minh chuẩn mực. |
| **10** | Viết test Pytest chỉ kiểm tra mã HTTP 200 mà bỏ qua trường hợp chặn tải 403. | Bỏ sót điều kiện nghiệm thu cốt lõi của bài toán sản phẩm hóa Ngày 22. | **Bao phủ 100%**: Xây dựng test suite 19 bài test, trong đó có `test_access_rules.py` xác thực nghiêm ngặt mã lỗi 403 và mã định danh `DATASET_UNPUBLISHED_RESTRICTED`. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy "UI Framework Bloat" (Lạm dụng Framework giao diện)**: AI đề xuất cài đặt Vue/React/Webpack phức tạp. *Cách tránh*: Dùng Vanilla JS và Tailwind CSS gọn nhẹ, tốc độ tải trang dưới 100ms.
2. **Bẫy "Client-Side Only Validation" (Bảo vệ hời hợt một phía)**: AI chỉ disable button trên HTML. *Cách tránh*: Xây dựng Access Gatekeeper ném ngoại lệ 403 trên Backend API.
3. **Bẫy "Hardcoded Absolute Paths" (Đường dẫn cứng)**: AI dùng đường dẫn `D:/Cybersoft/...`. *Cách tránh*: Sử dụng `Path(__file__).resolve().parent` tương thích đa nền tảng.
4. **Bẫy "Missing Feedback Rating Bounds" (Bỏ quên chặn biên số sao)**: AI cho phép rating = 0 hoặc rating = 10. *Cách tránh*: Dùng `ge=1, le=5` trong Pydantic.
5. **Bẫy "Uncontrolled CSV Parsing" (Đọc file CSV thiếu kiểm soát)**: AI đọc toàn bộ file CSV hàng trăm MB vào RAM để preview. *Cách tránh*: Giới hạn đọc tối đa 10 dòng mẫu (`limit=10`).
6. **Bẫy "Inconsistent Error Structure" (Cấu trúc lỗi phân mảnh)**: AI dùng `{"detail": ...}` mặc định của FastAPI. *Cách tránh*: Áp dụng `Uniform Error Envelope` đồng nhất.
7. **Bẫy "Unverified Checksums" (Mã băm ảo tưởng)**: AI sinh mã SHA-256 giả lập không khớp với nội dung file. *Cách tránh*: Dùng thư viện `hashlib.sha256` tính toán mã băm thực tế từ từng file CSV.
8. **Bẫy "No Live Feedback Recalculation" (Quên cập nhật điểm số)**: AI lưu feedback nhưng giữ nguyên rating cũ của dataset. *Cách tránh*: Viết hàm `get_dataset_rating_stats` tự động tính lại trung bình cộng.
9. **Bẫy "Flaky Usability Timing" (Đo lường thời gian thiếu chính xác)**: AI dùng `time.time()` thay vì `time.perf_counter()`. *Cách tránh*: Dùng `time.perf_counter()` cho độ phân giải nano-giây.
10. **Bẫy "Merged Documentation" (Gộp chung tài liệu)**: AI gộp kịch bản video vào đặc tả kỹ thuật. *Cách tránh*: Tách riêng `DEMO_SCRIPT_3_MINUTES.md` theo chỉ đạo của người dùng.

---

## 5. BỐN TẦNG NĂNG LỰC ỨNG DỤNG AI (THE FOUR TIERS OF AI MASTERY)

Trong toàn bộ quá trình thực hiện Task 22, tôi đã vận dụng nhuần nhuyễn mô hình Bốn Tầng Năng Lực AI:
- **Tầng 1 — Trợ lý cú pháp (Syntax Assistant)**: Sử dụng AI để sinh nhanh các mẫu HTML modal Tailwind CSS, các class icon Phosphor Icons và khai báo kiểu dữ liệu Pydantic.
- **Tầng 2 — Tăng tốc sinh mã khung (Scaffolding Acceleration)**: Dùng AI hỗ trợ sinh khung router `/portal` và các kịch bản test Pytest cơ sở.
- **Tầng 3 — Thẩm định & Phản biện kỹ thuật (Critical Architecture Review)**: Bác bỏ việc dùng framework React/Next.js nặng nề; yêu cầu bổ sung Access Gatekeeper 403 Forbidden; thiết kế chi tiết bảng Schema Inspector 3NF; bắt buộc tính mã băm SHA-256 thực tế.
- **Tầng 4 — Điều phối hệ sinh thái & Làm chủ giải pháp (Ecosystem Orchestration)**: Tự tay liên kết giao diện Web SPA với FastAPI backend, thiết kế bộ đo lường 5 kịch bản Usability Benchmark tự động đạt chuẩn DoD trong 0.14 giây, và xuất bản tệp Word báo cáo chính thức Ngày 22 không còn sót bất kỳ vết tích nào của Ngày 21.

---

## 6. LỖI KỸ THUẬT PHÁT SINH, NGUYÊN NHÂN GỐC RỄ & CÁCH KHẮC PHỤC

### Sự cố 1: Warning `HTTP_422_UNPROCESSABLE_ENTITY` trong thư viện Starlette khi chạy Pytest
- **Hiện tượng**: Khi chạy `pytest tests/ -v`, xuất hiện cảnh báo `DeprecationWarning: 'HTTP_422_UNPROCESSABLE_ENTITY' is deprecated. Use 'HTTP_422_UNPROCESSABLE_CONTENT' instead`.
- **Nguyên nhân gốc rễ**: Trong các phiên bản Starlette/FastAPI mới, hằng số mã 422 được cập nhật ngữ nghĩa theo chuẩn HTTP RFC mới (`UNPROCESSABLE_CONTENT`).
- **Giải pháp xử lý**: Xác nhận tính tương thích ngược, mã HTTP status vẫn trả về chính xác số nguyên 422, các bài kiểm thử xác thực cấu trúc `VALIDATION_ERROR` đều PASS 100%.

### Sự cố 2: Trình duyệt mở tab tải dữ liệu bị chặn nếu không cấu hình CORS Header đầy đủ
- **Hiện tượng**: Khi gọi API download từ giao diện web, mã băm `X-Checksum-SHA256` trong header không đọc được bởi JavaScript client.
- **Nguyên nhân gốc rễ**: Theo chuẩn bảo mật CORS của trình duyệt, các header tùy biến (custom headers) không được hiển thị cho client script nếu không được khai báo trong `Access-Control-Expose-Headers`.
- **Giải pháp xử lý**: Thêm header `"Access-Control-Expose-Headers": "X-Checksum-SHA256, X-Dataset-ID"` vào phản hồi của endpoint `GET /download`. Client JS đọc được mã băm trực tiếp.

---

## 7. ĐỘC LẬP KIỂM CHỨNG: LỆNH CHẠY TEST VÀ KẾT QUẢ THỰC TẾ

### 1. Lệnh Kiểm thử Độ khả dụng Tự động (Usability Benchmark)
```powershell
python scripts/run_usability_eval.py
```
- **Kết quả**: 5/5 kịch bản hoàn thành xuất sắc trong **0.1411 giây** (vượt xa chỉ tiêu DoD < 60 giây). Exit code: 0.

### 2. Lệnh Kiểm thử Tích hợp Pytest
```powershell
pytest tests/ -v
```
- **Kết quả**: **19/19 tests PASS 100%** trong 0.77 giây. Bao phủ đầy đủ tìm kiếm, lọc đa tiêu chí, xem trước schema 3NF, chặn tải 403 bản nháp và hệ thống feedback 1-5 sao. Exit code: 0.
