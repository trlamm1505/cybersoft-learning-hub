# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 28
## DỰ ÁN: CYBERSOFT DATA & AI LAB — PHÂN HỆ ĐO LƯỜNG VỚI NGƯỜI DÙNG THỬ (USABILITY TESTING) v1.0

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 28 — Đo lường với người dùng thử (SUS Score, Time-to-find, Issue Backlog & Top 5 Priority Fixes)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-11  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước sang Tuần 6 (Giai đoạn hoàn thiện và bàn giao), sản phẩm CyberSoft Data & AI Lab v1.0 cần chuyển từ kiểm thử nội bộ kỹ thuật sang **đo lường định lượng thực tế với người dùng thật**:
1. **Thiếu cơ sở khoa học đo lường trải nghiệm**: Trước Ngày 28, việc đánh giá độ tiện dụng chỉ dựa vào nhận xét cảm tính, thiếu các chỉ số đo lường chuẩn hóa quốc tế như System Usability Scale (SUS), Time-to-find và Task Success Rate.
2. **Quy mô mẫu thử nghiệm nội bộ nhỏ (n = 5)**: Cần thiết lập chuỗi thử nghiệm có kiểm soát chặt chẽ với 5 người dùng đại diện (2 Giảng viên DA/AI, 2 Học viên K28/K29 và 1 Trợ giảng học vụ) trên 25 lượt tác vụ thực tế.
3. **Danh mục điểm nghẽn chưa được lượng hóa**: Các phản hồi người dùng bị phân mảnh, chưa được đưa vào ma trận Tác động (Impact) vs Chi phí (Effort) để phân bổ nguồn lực lập trình sửa lỗi hợp lý.
4. **Rào cản thông báo lỗi kỹ thuật**: Hệ thống hiển thị các thông báo lỗi xác thực schema Pydantic bằng tiếng Anh gây khó hiểu cho Giảng viên và Học viên khi nhập dữ liệu.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning & code generation).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * AI đóng vai trò trợ lý sinh mã thuật toán đo lường, chuyển đổi thông báo lỗi song ngữ và phác thảo giao diện Web Dashboard SPA.
  * Kỹ sư con người trực tiếp thiết kế bài thử nghiệm, thu thập số liệu bấm giờ thực tế, thẩm định ma trận ưu tiên và kiểm chứng 100% các bài test tự động.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề xuất ban đầu của AI | Phân tích Rủi ro & Điểm bất hợp lý | Quyết định & Tinh chỉnh của Kỹ sư Con người |
| :---: | :--- | :--- | :--- |
| **01** | Sinh dữ liệu 100 người dùng ảo (mock user bot) tự động điền form khảo sát để đạt cỡ mẫu lớn. | Số liệu giả lập vi phạm tính trung thực khoa học của DoD; không phản ánh chân thực hành vi người dùng CyberSoft. | **Bác bỏ**: Giới hạn trung thực ở cỡ mẫu $n = 5$ người dùng thật nội bộ với 25 lượt tác vụ đo lường thực tế và nhật ký chi tiết. |
| **02** | Lập trình giải quyết toàn bộ 10 vấn đề ghi nhận ngay trong Ngày 28. | Khối lượng quá lớn không khả thi trong 1 ngày làm việc, dễ phát sinh lỗi hồi quy (regression bugs). | **Chỉnh sửa**: Phân loại theo Impact vs Effort; chỉ cam kết xử lý dứt điểm Top 5 vấn đề nghiêm trọng nhất (FIX-001 đến FIX-005), 5 vấn đề còn lại xếp vào Backlog v1.1. |
| **03** | Dùng điểm trung bình cộng số học đơn giản cho 10 câu hỏi SUS. | Sai lệch hoàn toàn phương pháp luận chuẩn quốc tế của Brookes (1996) về câu chẵn/câu lẻ. | **Chuẩn hóa**: Triển khai công thức chuẩn xác: câu lẻ $(x - 1)$, câu chẵn $(5 - x)$, nhân hệ số 2.5 cho thang điểm 0 - 100. |
| **04** | Dịch thô thông báo lỗi Pydantic bằng Google Translate API runtime. | Phụ thuộc internet ngoài, tốn chi phí gọi API và câu dịch ngữ nghĩa máy móc, không có hướng dẫn hành động. | **Tối ưu hóa**: Xây dựng `Vietnamese Error Transformer` cục bộ với từ điển ánh xạ tường minh kèm trường `huong_dan_khac_phuc` cụ thể cho từng cột dữ liệu. |
| **05** | Tải toàn bộ bảng CSV lớn hàng trăm nghìn dòng vào trình duyệt xem trước. | Làm đơ trình duyệt của học viên dùng máy cấu hình thấp, gây tràn bộ nhớ client. | **Cải tiến**: Cắt lát giới hạn 10 dòng đầu xem trước (Preview Slice), bọc container `overflow-x: auto` và giữ cố định thanh tiêu đề cột. |
| **06** | Bỏ qua tính năng sao chép trích dẫn học liệu, yêu cầu người dùng tự bôi đen chuột để copy. | Thao tác bôi đen trên giao diện web dễ sót dấu ngoặc `[doc#sec]` làm hỏng truy vấn trích dẫn của AI Tutor. | **Bổ sung**: Tích hợp nút 1-click Copy tự động định dạng chuẩn `[Mã_tài_liệu#Mục] "Trích dẫn..."` vào Clipboard hệ thống. |
| **07** | Hiển thị nút tải file không có thông tin dung lượng và thanh tiến trình. | Học viên không biết tệp nặng bao nhiêu MB để chuẩn bị dung lượng đĩa cứng và đường truyền mạng. | **Bổ sung**: Hiển thị trước dung lượng tệp tính theo MB và bật animation tiến trình trong thời gian chuẩn bị dữ liệu. |
| **08** | Nhúng thư viện React hoặc Vue cồng kềnh cho trang Usability Dashboard. | Gây phân mảnh hệ thống, tăng gánh nặng cài đặt thư viện phụ thuộc cho dịch vụ báo cáo. | **Chuẩn hóa**: Xây dựng Vanilla SPA (HTML5 + CSS Grid/Flexbox + ES6 JavaScript) nhẹ dưới 50KB, tải tức thì dưới 0.1s. |
| **09** | Dùng từ ngữ nhạy cảm trong tiến trình thử nghiệm sản phẩm. | Vi phạm quy chuẩn giao tiếp và kỷ luật tài liệu nghiêm ngặt của CyberSoft. | **Bác bỏ & Quét sạch**: Loại bỏ 100% từ cấm, thay bằng `tiến trình`, `chuỗi thao tác`, `bài thử nghiệm`. |
| **10** | Viết bài test chỉ kiểm tra mã HTTP 200 đơn thuần. | Không kiểm chứng được tính đúng đắn của công thức tính điểm SUS và cấu trúc ma trận phân loại lỗi. | **Nâng cấp**: Viết bộ Pytest Suite 32 bài test kiểm tra đa tầng từ toán học SUS, logic chuyển đổi lỗi song ngữ đến API endpoint. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy "Công thức SUS chẵn lẻ"**: AI thường đảo lộn quy tắc câu lẻ $(x - 1)$ và câu chẵn $(5 - x)$. *Cách phòng vệ*: Viết unit test toán học kiểm tra cận biên với bộ câu trả lời toàn 1 và toàn 5.
2. **Bẫy "Unescaped Quotes trong JavaScript"**: AI sinh chuỗi lồng dấu ngoặc kép `"Trích dẫn..."` bên trong chuỗi string bọc bởi `""` gây lỗi `SyntaxError: Unexpected identifier` làm crash toàn bộ Web Dashboard. *Cách phòng vệ*: Dùng dấu ngoặc đơn lồng nhau hoặc template literal và kiểm chứng với `node -c app.js`.
3. **Bẫy "Relative Import vượt cấp khi chạy script"**: AI viết `from ..src.config import HOST, PORT` trong tệp `scripts/run_server.py`. *Cách phòng vệ*: Bổ sung `sys.path.insert(0, str(TASK_ROOT))` để chạy độc lập ổn định.
4. **Bẫy "Module path chứa dấu gạch nối"**: AI viết `uvicorn.run("cybersoft-learning-hub.Data-AI-Resource...src.main:app")` bị lỗi cú pháp Python module. *Cách phòng vệ*: Đưa task root vào `sys.path` và gọi trực tiếp `"src.main:app"`.
5. **Bẫy "Thiếu Root Redirect"**: AI chỉ mount static file tại `/portal/` mà quên route đón tại `/` làm người dùng gõ `localhost:8028` bị lỗi 404. *Cách phòng vệ*: Thêm route `@app.get("/")` RedirectResponse 307 về `/portal/`.
6. **Bẫy "Pydantic v2 min_items deprecated"**: AI dùng cú pháp cũ của Pydantic v1. *Cách phòng vệ*: Chuyển đổi toàn diện sang `min_length` và `max_length` chuẩn Pydantic v2.
7. **Bẫy "Lệch số liệu giữa file tĩnh và data động"**: AI hardcode số liệu cũ (86.5) trong HTML trong khi dữ liệu tính toán thực tế là 92.5. *Cách phòng vệ*: Đồng bộ hóa 100% các giá trị KPI trong HTML, README, tài liệu và mã kiểm định.
8. **Bẫy "Lọt từ cấm trong tài liệu"**: AI có xu hướng dịch tự động từ tiếng Anh sinh từ nhạy cảm. *Cách phòng vệ*: Thiết lập script kiểm định tự động ripgrep quét từ ngữ trước khi đóng gói.
9. **Bẫy "Bỏ quên thông số CSAT"**: AI chỉ tập trung vào SUS mà bỏ qua chỉ số hài lòng khách hàng (Customer Satisfaction). *Cách phòng vệ*: Tích hợp khảo sát CSAT 1-5 sao và đạt 4.8 / 5.0 (96.0%).
10. **Bẫy "Bỏ sót bài test ca biên"**: AI không kiểm thử khi danh sách lỗi rỗng hoặc tệp tải về có dung lượng cực nhỏ (bytes) hay cực lớn (GB). *Cách phòng vệ*: Bổ sung riêng tệp `test_usability_edge_cases.py` với 6 bài test ca biên chuyên sâu.

---

## 5. BỐN TẦNG NĂNG LỰC ỨNG DỤNG AI (THE FOUR TIERS OF AI MASTERY)

- **Tầng 1 — Trợ lý cú pháp (Syntax Assistant)**: Dùng AI gợi ý cú pháp Pydantic Schema, CSS Flexbox/Grid và các hàm xử lý mảng JavaScript ES6.
- **Tầng 2 — Tăng tốc sinh mã khung (Scaffolding Acceleration)**: Dùng AI sinh khung sườn giao diện Web Usability Dashboard SPA 4 tab và khung các bài test Pytest.
- **Tầng 3 — Thẩm định & Phản biện kỹ thuật (Critical Architecture Review)**: Bác bỏ việc dùng bot giả lập chấm điểm, chuẩn hóa công thức SUS Brookes 1996 và phân định rõ ma trận Impact vs Effort để chỉ tập trung vào 5 bản vá ưu tiên.
- **Tầng 4 — Điều phối hệ sinh thái & Làm chủ giải pháp (Ecosystem Orchestration)**: Tích hợp toàn diện giữa Backend FastAPI, Web Dashboard SPA, bộ chuyển đổi lỗi song ngữ, và đảm bảo 32/32 tests PASS cùng 6/6 chặng DoD đạt chuẩn 100%.

---

## 6. LỖI KỸ THUẬT PHÁT SINH, NGUYÊN NHÂN GỐC RỄ & CÁCH KHẮC PHỤC

### Sự cố 1: Lỗi cú pháp JavaScript trong `portal/app.js` phá vỡ giao diện Dashboard
- **Hiện tượng**: Khi mở `http://localhost:8028/portal/`, giao diện web bị trắng/đơ, không nạp được danh mục vấn đề và chỉ số đo lường.
- **Nguyên nhân gốc rễ**: Dòng 167 chứa chuỗi chưa escape dấu ngoặc kép `after: "1-Click nút Copy tự động sao chép '[CS-POL-001#sec] "Trích dẫn..."' vào Clipboard."` gây lỗi `SyntaxError: Unexpected identifier 'Trích'`.
- **Giải pháp xử lý**: Đổi các dấu ngoặc kép lồng bên trong thành dấu ngoặc đơn, kiểm tra cú pháp với `node -c portal/app.js` đạt Exit Code 0.

### Sự cố 2: Lỗi Import tương đối & Module Path trong `scripts/run_server.py`
- **Hiện tượng**: Chạy lệnh `python scripts/run_server.py` bị crash ngay từ đầu.
- **Nguyên nhân gốc rễ**: Lệnh sử dụng `from ..src.config import HOST, PORT` (Python không cho phép import tương đối khi chạy trực tiếp dưới dạng script độc lập) và module target chứa dấu gạch nối `cybersoft-learning-hub`.
- **Giải pháp xử lý**: Bổ sung `sys.path.insert(0, str(TASK28_ROOT))` và truyền target `"src.main:app"` sạch cho uvicorn.

### Sự cố 3: Lỗi 404 Not Found tại đường dẫn gốc `/`
- **Hiện tượng**: Truy cập `http://localhost:8028/` trên trình duyệt trả về 404 Not Found.
- **Nguyên nhân gốc rễ**: Static files chỉ được mount tại `/portal/`, thiếu route tiếp nhận tại đường dẫn gốc.
- **Giải pháp xử lý**: Thêm route `@app.get("/")` sử dụng `RedirectResponse(url="/portal/")` tự động chuyển hướng người dùng vào Dashboard.

### Sự cố 4: Lệch số liệu SUS và Time-to-find giữa tài liệu tĩnh và dữ liệu tính toán
- **Hiện tượng**: Tài liệu ban đầu ghi 86.5/100 và 48.6s $\to$ 18.2s, trong khi dữ liệu `user_sessions.json` tính ra SUS là 92.5/100 và 45.9s $\to$ 17.3s.
- **Nguyên nhân gốc rễ**: Sử dụng số liệu phác thảo dự kiến ban đầu thay vì số liệu thực tế được tính toán từ các câu trả lời của 5 người dùng.
- **Giải pháp xử lý**: Đồng bộ hóa toàn diện 100% số liệu: Điểm SUS đạt **92.5 / 100 (Hạng A — Excellent)**, Thời gian tra cứu giảm **62.4%** (từ 45.9s xuống 17.3s), CSAT đạt **4.8 / 5.0**, và bộ kiểm thử đạt **32/32 tests PASS 100%**.

---

## 7. KẾT QUẢ KIỂM THỬ XÁC MINH ĐỘC LẬP

```bash
# Chạy bộ đánh giá chuẩn đầu ra DoD:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task28/scripts/run_usability_eval.py
# => 6/6 Chặng kiểm định ĐẠT CHUẨN (Exit Code 0)

# Chạy toàn bộ bài test tự động:
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task28/tests/ -v
# => 32 passed in 1.14s (100% SUCCESS)
```
