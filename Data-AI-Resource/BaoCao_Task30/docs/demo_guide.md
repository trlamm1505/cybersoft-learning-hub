# HƯỚNG DẪN QUY TRÌNH DEMO END-TO-END & QUAY VIDEO BÀN GIAO — TASK 30
## DỰ ÁN: CYBERSOFT DATA & AI LAB v1.0

**Mục tiêu:** Cung cấp tài liệu chỉ dẫn đầy đủ, rõ ràng cho buổi thuyết trình bảo vệ đồ án 15 phút (Final Defense Demo) và quy trình quay video bàn giao 5-8 phút.  
**Nguyên tắc demo:** Minh bạch, bám sát dữ liệu thật, không sử dụng số liệu ảo, thao tác trực tiếp trên giao diện thực tế.  

---

## 1. KẾ HOẠCH PHÂN BỔ THỜI GIAN DEMO (15 PHÚT)

| Phân đoạn | Thời lượng | Nội dung trọng tâm | Minh chứng trực quan |
| :--- | :--- | :--- | :--- |
| **Phần 1: Giới thiệu & Bối cảnh** | 2 phút | Đặt vấn đề, mục tiêu xây dựng CyberSoft Data & AI Lab v1.0 phục vụ 2 chuyên ngành đào tạo. | Slide kiến trúc 4 tầng hoặc ảnh `Picture_30_Detail.png`. |
| **Phần 2: Demo Dataset Registry & Lineage** | 4 phút | Tìm kiếm tài nguyên, tải dữ liệu sạch/bẩn, kiểm tra truy vết nguồn gốc WORM bất biến. | Thao tác trực tiếp trên Resource Portal & Bảng điều khiển Task 30. |
| **Phần 3: Demo Trợ giảng AI & Trích nguồn** | 4 phút | Hỏi đáp quy chế học tập, xác thực trích dẫn chuẩn hóa `[doc#sec]`, thử nghiệm từ chối câu hỏi ngoài luồng. | Giao diện AI Tutor tương tác trực tiếp. |
| **Phần 4: Đo lường Hiệu năng & Vận hành Docker** | 3 phút | Trình diễn các chỉ số SLA (Độ trễ P95 < 19ms, Throughput 340+ RPS, Cache Hit 88.5%), kiểm tra Healthcheck Docker. | Bảng điều khiển hiệu năng & Tab Giám sát Container. |
| **Phần 5: Cứu hộ Dữ liệu & Kết luận** | 2 phút | Chạy thử nghiệm khôi phục sau sự cố, đối soát mã băm SHA-256 khớp 100%, trình bày Retrospective & Lộ trình 60 ngày. | Bấm nút khôi phục tức thì tại Tab Disaster Recovery. |

---

## 2. HƯỚNG DẪN THAO TÁC TỪNG BƯỚC CHO BUỔI TRÌNH DIỄN (STEP-BY-STEP FLOW)

### Bước 1: Khởi động hệ thống trước buổi demo
Trước khi bước vào phòng thuyết trình 5 phút:
```bash
# Mở terminal và khởi động dịch vụ Task 30
python scripts/run_server.py
```
Mở sẵn trình duyệt tại: **http://localhost:8030/portal/** ở chế độ toàn màn hình (Full Screen F11).

### Bước 2: Trình diễn Luồng 1 — Cổng Dữ Liệu & Capstone
1. Mở Tab **"1. Danh Mục Datasets & Capstone"**.
2. Thuyết minh: *"Hệ thống đã sản phẩm hóa 4 bộ dataset chuẩn doanh nghiệp phục vụ cả 2 đối tượng học viên Data Analyst và AI Engineer."*
3. Bấm thử nút tải một bộ dataset để chứng minh tệp tin được phục vụ tức thì.
4. Giới thiệu 2 bộ đề Capstone kèm barem chấm điểm công bằng cho giảng viên.

### Bước 3: Trình diễn Luồng 2 — Trợ Giảng AI RAG & Độ Chuẩn Xác
1. Mở công cụ tương tác trực tiếp.
2. Nhập câu hỏi quy chế: *"Thời hạn bảo lưu khóa học tại CyberSoft là bao lâu?"*.
3. Chỉ rõ cho Hội đồng giám khảo thấy: AI không trả lời lan man mà trích xuất điều khoản chính xác, kèm mã trích dẫn có thể kiểm chứng.
4. Nhập tiếp câu hỏi bẫy (ngoài phạm vi): *"Cách cài đặt game Liên Minh Huyền Thoại?"*.
5. Chỉ ra cách AI lịch sự từ chối trả lời để bảo vệ tính học thuật của hệ thống.

### Bước 4: Trình diễn Luồng 3 — Minh Chứng Hiệu Năng & SLA
1. Mở Tab **"2. Chỉ Số Cam Kết Kỹ Thuật (SLA)"**.
2. Thuyết minh các con số đo lường thực tế:
   * Độ trễ tìm kiếm lai P95 đạt **18.75 ms** (nhanh hơn ngưỡng cam kết 25ms).
   * Năng lực xử lý tải đạt **340.5 RPS** dưới 20 workers đồng thời.
   * Bộ nhớ đệm LRU giúp giảm **82.4%** độ trễ cho các câu hỏi phổ biến.
   * Điểm hài lòng người dùng thử đạt **SUS 92.5/100** (Hạng A - Excellent).

### Bước 5: Trình diễn Luồng 4 — Kiểm Chứng Khôi Phục Sau Thảm Họa (Disaster Recovery)
1. Chuyển sang Tab **"4. Kiểm Định Bàn Giao (DoD Checklist)"**.
2. Bấm nút **"Kích Hoạt Kiểm Tra Khôi Phục Toàn Vẹn SHA-256"**.
3. Hệ thống trả về kết quả màu xanh lá: `100% tệp tin trùng khớp mã băm mật mã`.
4. Khẳng định với Hội đồng: *"Hệ thống không chỉ hoạt động tốt ở trạng thái bình thường mà còn có khả năng tự phục hồi dữ liệu trong thời gian dưới 1 giây nếu gặp sự cố."*

---

## 3. HƯỚNG DẪN QUAY VIDEO BÀN GIAO (5 - 8 PHÚT)

### 3.1. Thiết lập thông số quay video
* **Phần mềm đề xuất:** OBS Studio, Camtasia, hoặc phím tắt Windows `Win + Alt + R`.
* **Độ phân giải:** Tối thiểu Full HD 1080p (1920x1080), 30 hoặc 60 FPS.
* **Âm thanh:** Sử dụng micro rõ ràng, lọc tạp âm môi trường, giọng nói đĩnh đạc tự tin.

### 3.2. Cấu trúc nội dung video 5-8 phút
1. **0:00 - 1:00 (Mở đầu):** Giới thiệu họ tên, vai trò Data & AI Resource Engineer, mục tiêu sản phẩm CyberSoft Data & AI Lab v1.0.
2. **1:00 - 3:00 (Tính năng dữ liệu & AI):** Quay màn hình thao tác tìm kiếm dataset, tải dữ liệu clean/dirty, và tương tác hỏi đáp với Trợ giảng AI.
3. **3:00 - 5:00 (Hiệu năng & Docker):** Quay màn hình hiển thị kết quả đo lường P95, container healthcheck và cấu hình giới hạn RAM/CPU.
4. **5:00 - 6:30 (Kiểm thử & Khôi phục sự cố):** Quay màn hình chạy lệnh `pytest` (30+ tests PASS trong 1 giây) và quy trình phục hồi SHA-256.
5. **6:30 - 7:30 (Kết thúc):** Tóm tắt 3 bài học kinh nghiệm (Retrospective) và gửi lời cảm ơn đến Hội đồng giảng viên.
