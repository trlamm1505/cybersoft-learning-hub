# KỊCH BẢN VIDEO DEMO 3 PHÚT (DEMO_SCRIPT_3_MINUTES)
## CỔNG GIAO DIỆN TÌM VÀ TẢI TÀI NGUYÊN DỮ LIỆU GIÁO DỤC (CYBERSOFT RESOURCE PORTAL v0.1)

- **Dự án**: CyberSoft Data & AI Lab  
- **Cột mốc**: NGÀY 22 — Giao diện tìm và tải tài nguyên (`cybersoft-resource-portal`)  
- **Thời lượng**: Đúng 03 phút 00 giây (180 giây)  
- **Người thực hiện**: Đào Trung Kiên (Data & AI Resource Engineer)  
- **Đối tượng theo dõi**: Hội đồng nghiệm thu, Giảng viên chuyên môn, Trợ giảng CyberSoft Academy  
- **Mục tiêu cốt lõi**: Chứng minh Giảng viên có thể tìm kiếm, xem trước lược đồ, kiểm tra tính toàn vẹn và tải dataset trong **dưới 60 giây**, tuân thủ 100% tiêu chí nghiệm thu DoD (chặn tải bản nháp 403, feedback 1-5 sao, 5 kịch bản usability pass).

---

## BẢNG PHÂN CẢNH CHI TIẾT THEO TỪNG GIÂY (STORYBOARD & TIMELINE)

| Thời Lượng | Phân Cảnh (Visual) | Thao Tác Kỹ Thuật (Actions) | Lời Thoại Thuyết Minh (Voiceover Script) | Mục Tiêu & DoD Nghiệm Thu |
| :---: | :--- | :--- | :--- | :--- |
| **0:00 - 0:30**<br>(30 giây) | **Cảnh 1: Giới thiệu Tổng quan & Đặt vấn đề**<br>- Màn hình hiển thị trang chủ Cổng Tài nguyên: `http://localhost:8000/portal/`<br>- Banner CyberSoft Data & AI Lab, thanh thống kê 5 datasets, 4 published, điểm 4.85 ★. | - Mở trình duyệt Web tại `http://localhost:8000/portal/`<br>- Rà chuột qua các chỉ số tổng quan ở thanh Header. | "Xin chào quý Thầy Cô và Hội đồng nghiệm thu. Tôi là Đào Trung Kiên, Data & AI Resource Engineer tại CyberSoft. Trong Tuần 5 - Sản phẩm hóa, nhiệm vụ Ngày 22 của tôi là xây dựng **Giao diện tìm và tải tài nguyên giáo dục CyberSoft Resource Portal v0.1**. Vấn đề thực tế trước đây là Giảng viên mất nhiều thời gian tìm kiếm dữ liệu thực hành rải rác. Hôm nay, tôi xin chứng minh hệ thống mới giúp Giảng viên tìm và tải dữ liệu hoàn chỉnh trong **dưới 60 giây**." | Giới thiệu bài toán, vai trò kỹ sư và cam kết SLA tốc độ. |
| **0:30 - 1:05**<br>(35 giây) | **Cảnh 2: Tìm kiếm tức thì & Lọc đa chiều (< 60s Discovery)**<br>- Gõ từ khóa `bán hàng` vào ô tìm kiếm.<br>- Kết quả hiển thị tức thì trong 18.2 ms.<br>- Chọn bộ lọc `Domain = Retail`. | - Nhập `bán hàng` vào Search Bar.<br>- Chọn Dropdown Domain `Retail`.<br>- Chỉ vào đồng hồ đo độ trễ: `18.2 ms`. | "Bây giờ, Giảng viên cần chuẩn bị bài giảng môn SQL Nâng Cao. Tôi nhập từ khóa `bán hàng` và chọn lĩnh vực `Retail`. Chỉ sau **18 mili-giây**, tập dữ liệu `Retail Sales v1.0` đa bảng chuẩn hóa 3NF xuất hiện ngay lập tức với đầy đủ thông số: 10.500 dòng, kích thước 1.4 MB, xếp hạng chất lượng Tier A (98.5%) và điểm hữu ích 4.9 sao. Tiêu chí tìm kiếm dưới 1 phút đã đạt xuất sắc." | **DoD 1: Tìm được theo từ khóa và bộ lọc** trong < 60s. |
| **1:05 - 1:45**<br>(40 giây) | **Cảnh 3: Xem trước dữ liệu & Tra cứu lược đồ (Schema Inspector)**<br>- Bấm nút `Xem Trước & Schema`.<br>- Modal mở ra với 3 tab: Dữ liệu mẫu (10 dòng), Lược đồ cột (Schema Inspector), Chất lượng & License. | - Bấm `Xem Trước & Schema`.<br>- Lướt qua 10 dòng dữ liệu bảng đơn hàng.<br>- Chuyển sang tab `Lược Đồ Cột`: Rà chuột qua các cột `order_id` (NOT NULL), `total_amount`...<br>- Chuyển tab `Chất Lượng`: Đối soát mã SHA-256. | "Để bảo đảm dữ liệu phù hợp với giáo trình, Giảng viên bấm **Xem Trước**. Tab đầu tiên hiển thị trực quan 10 bản ghi đơn hàng mẫu trích xuất trực tiếp từ máy chủ. Chuyển sang tab **Lược Đồ Cột**, Giảng viên tra cứu tức thì kiểu dữ liệu, ràng buộc NOT NULL và mô tả nghiệp vụ của từng trường. Tại tab **Chất lượng**, mã băm SHA-256 `99b617486fd2...` được cung cấp kèm nút sao chép để đối soát tính toàn vẹn 100%." | **Yêu cầu 2: Hiển thị preview, license, level, quality**. |
| **1:45 - 2:20**<br>(35 giây) | **Cảnh 4: Kiểm thử Access Rules (Chặn tải Bản nháp) & Tải tập dữ liệu**<br>- Chọn bộ lọc `Trạng thái = Bản nháp`.<br>- Thấy dataset khảo sát `student_survey_draft`.<br>- Thử bấm nút tải: Nút bị khóa, hệ thống hiển thị cảnh báo từ chối 403.<br>- Quay lại dataset bán hàng và tải về thành công. | - Lọc `Trạng thái: Bản nháp`.<br>- Bấm vào nút `Khóa Tải (DoD)` của dataset bản nháp -> Hộp thoại Access Rules xuất hiện cảnh báo mã 403 Forbidden.<br>- Quay lại tải dataset bán hàng -> Tệp `retail_sales_v1.csv` tải xuống máy kèm mã băm. | "Đây là điểm cốt lõi trong điều kiện nghiệm thu DoD: **Không download bản chưa publish**. Khi tôi chọn tập dữ liệu bản nháp `Draft Student Survey`, nút tải đã bị khóa màu cam. Nếu người dùng cố tình gọi API tải, hệ thống lập tức chặn lại và trả về mã lỗi **403 Forbidden** với Uniform Error Envelope chuẩn hóa. Tiếp theo, tôi tải tập dữ liệu bán hàng chính thức: tệp CSV tải về hoàn tất trong 60ms kèm mã băm xác thực." | **DoD 2: Không download bản chưa publish (403 Forbidden)**. |
| **2:20 - 2:45**<br>(25 giây) | **Cảnh 5: Hệ thống Đánh giá Độ Hữu ích (Feedback 1-5 Sao)**<br>- Bấm nút `Đánh Giá`.<br>- Modal chọn 5 sao, nhập nhận xét thực tế.<br>- Bấm `Gửi Đánh Giá Ngay`.<br>- Điểm trung bình và số lượt đánh giá cập nhật theo thời gian thực. | - Bấm nút `Đánh Giá (3)` trên thẻ dataset bán hàng.<br>- Chọn 5 sao.<br>- Nhập nhận xét: 'Dữ liệu 3NF rất sạch, phù hợp dạy SQL Nâng Cao!'.<br>- Bấm `Gửi Đánh Giá Ngay`.<br>- Danh sách nhận xét cập nhật tức thì. | "Để hệ sinh thái liên tục hoàn thiện, hệ thống tích hợp widget đánh giá độ hữu ích 1-5 sao. Giảng viên chọn 5 sao, để lại nhận xét nghiệp vụ sư phạm và gửi đi. Hệ thống tính toán lại điểm trung bình theo thời gian thực và lưu trữ bền vững vào cơ sở dữ liệu phản hồi." | **Yêu cầu 3: Thêm feedback usefulness 1-5 sao**. |
| **2:45 - 3:00**<br>(15 giây) | **Cảnh 6: Kiểm thử Usability Benchmark (5 Scenarios) & Kết luận**<br>- Bấm nút `Kiểm Thử Usability (5 Scenarios)` ở góc trên.<br>- Modal chạy 5 kịch bản tự động, cả 5 đều hiện `[PASS]` trong 0.14 giây.<br>- Đưa ra lời chào kết thúc. | - Bấm nút tím `Kiểm Thử Usability (5 Scenarios)`.<br>- 5 kịch bản chạy trong chớp mắt, hiện biểu tượng màu xanh `100% PASS`.<br>- Kết thúc video. | "Cuối cùng, bộ kiểm thử độ khả dụng tự động thực thi cả 5 kịch bản thực tế của Giảng viên chỉ trong **0.14 giây**, vượt xa ngưỡng cam kết 60 giây. Cổng tài nguyên CyberSoft Resource Portal v0.1 đã sẵn sàng bàn giao cho toàn bộ học viện. Xin trân trọng cảm ơn!" | **DoD 3: 5 kịch bản usability pass**; kết thúc chuyên nghiệp. |

---

## HƯỚNG DẪN KỸ THUẬT KHI QUAY VIDEO (RECORDING CHECKLIST)
1. **Thiết lập môi trường**:
   - Khởi động máy chủ: `python scripts/run_server.py`.
   - Trình duyệt: Mở Chrome hoặc Edge ở độ phân giải Full HD (1920x1080), zoom 100%.
   - Truy cập sẵn trang: `http://localhost:8000/portal/`.
2. **Âm thanh & Tốc độ nói**:
   - Sử dụng microphone lọc tạp âm; giọng nói rõ ràng, tự tin, mang phong thái kỹ sư Data/AI chuyên nghiệp.
   - Nhịp điệu vừa phải, đồng bộ chính xác với từng thao tác bấm chuột trên màn hình.
3. **Phần mềm quay màn hình khuyến nghị**:
   - OBS Studio hoặc Windows Game Bar (`Win + Alt + R`).
   - Tốc độ khung hình: 60 FPS, định dạng MP4.
