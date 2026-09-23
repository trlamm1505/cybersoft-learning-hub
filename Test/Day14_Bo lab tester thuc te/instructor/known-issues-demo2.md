# Lỗi đã biết / ứng viên trên demo2.cybersoft.edu.vn (V Learning)

> Dành cho mentor. Quan sát bằng trình duyệt ngày 21/09/2026, CHƯA pilot đầy đủ. Demo là môi trường dùng chung do CyberSoft vận hành, có thể thay đổi bất cứ lúc nào.
> Quy trình: trước mỗi đợt, mentor pilot lại từng mục, cập nhật cột Trạng thái (CONFIRMED / NOT REPRODUCED / CHANGED) và ngày kiểm.

| ID | Lab | Mô tả | Bằng chứng ban đầu | Trạng thái | Ngày kiểm |
|---|---|---|---|---|---|
| K-01 | LAB-01 | Form đăng ký demo2 không có thuộc tính required ở mọi ô (quan sát DOM 21/09). Cần pilot xem có chặn bằng JavaScript không. | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |
| K-02 | LAB-01 | Ô số điện thoại demo2 dùng type="phone" (không phải type hợp lệ "tel") nên bị coi như ô text, điện thoại không bật bàn phím số (Low). | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |
| K-03 | LAB-01 | Link "Quên mật khẩu?" có href="#" - cần pilot xem có chức năng không. | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |
| K-04 | LAB-01 | Danh sách nhóm GP01..GP09 rồi GP010 - định dạng không nhất quán (Low, hỏi PO). | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |
| K-05 | LAB-02 | /chitiet/<mã không tồn tại> vẫn hiển thị nội dung khóa học mẫu (giảng viên, đánh giá 3.5, mô tả React) dù API LayThongTinKhoaHoc được gọi với mã sai - không báo "không tìm thấy" (quan sát 21/09). | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |
| K-06 | LAB-02 | Trang chi tiết tải lại liên tục ảnh ngoài từ codersera.com (15 lần trong 5 giây, ảnh không tải được, alt rỗng) - ảnh hưởng hiệu năng và accessibility. | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |
| K-07 | LAB-02 | Tìm kiếm luôn gửi MaNhom=GP01; khóa học nhóm khác không tìm được - câu hỏi cho PO. | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |
| K-09 | LAB-04 | Thiếu header TokenCybersoft -> 403 "Token cybersoft không hợp lệ hoặc đã hết hạn" (đã xác nhận 21/09). | Quan sát DOM/Network qua trình duyệt | CONFIRMED | 21/09/2026 |
| K-08 | LAB-06 | Theo Swagger, LayDanhSachNguoiDung/TimKiemNguoiDung chỉ yêu cầu TokenCybersoft, không yêu cầu đăng nhập - có thể lộ email/SĐT người dùng. Mentor tự xác minh; học viên không khai thác. | Quan sát DOM/Network qua trình duyệt | CANDIDATE | 21/09/2026 |

Không đưa danh sách này cho học viên trước khi làm Phần A. Chấp nhận mọi phát hiện khác nếu tái hiện được.
