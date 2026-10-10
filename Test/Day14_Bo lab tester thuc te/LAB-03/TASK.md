# LAB-03 — Functional Tìm phòng & Đặt phòng

## Mục tiêu

Dùng decision table để kiểm tìm phòng, ngày ở và số khách.

## Phạm vi

- Môi trường thực chiến: demo5 - CyberSoftbnb — https://demo5.cybersoft.edu.vn/
- Công cụ: Chrome + DevTools
- Thời lượng: 60 phút
- Artifact phải nộp: `Functional_Test_Cases_LAB03.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Tìm phòng theo một vị trí và mở chi tiết.
2. Lập decision table cho trạng thái đăng nhập, ngày nhận/trả và số khách.
3. Thử ca biên ngày trả trước ngày nhận, số khách 0 và chưa đăng nhập.
4. Nếu tạo booking, chỉ tạo dữ liệu của bạn và hủy ngay sau khi ghi evidence.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-03`.
2. Mở `fixtures/runtime/LAB-03.json` và áp dụng quy tắc: **Ngày trả phải sau ngày nhận và số khách phải lớn hơn 0.**
3. Viết finding cho `F-D14-003` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-03` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `Functional_Test_Cases_LAB03.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
