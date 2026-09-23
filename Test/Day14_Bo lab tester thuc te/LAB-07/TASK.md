# LAB-07 — Kiểm chất lượng dữ liệu phim

## Mục tiêu

Biến quy tắc dữ liệu thành kiểm tra chạy lại được trên JSON phim.

## Phạm vi

- Môi trường thực chiến: demo1 API movie0706 — https://movie0706.cybersoft.edu.vn/swagger/index.html
- Công cụ: Postman + Excel/JS
- Thời lượng: 60 phút
- Artifact phải nộp: `LAB07_Data_Check.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Lấy danh sách phim GP01 từ endpoint đã xác nhận trong Swagger/Network.
2. Kiểm danhGia trong 0..10, tên chuẩn hóa bị trùng, mô tả/trailer rỗng.
3. Ghi query hoặc đoạn JS/Excel formula đã dùng.
4. Đính response rút gọn và ID mẫu; không gọi endpoint ghi dữ liệu.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-07`.
2. Mở `fixtures/runtime/LAB-07.json` và áp dụng quy tắc: **danhGia phải nằm trong 0..10.**
3. Viết finding cho `F-D14-007` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-07` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `LAB07_Data_Check.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
