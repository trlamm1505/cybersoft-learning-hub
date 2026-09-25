# LAB-04 — Auth API bệnh viện

## Mục tiêu

Đọc Swagger và kiểm cơ chế Bearer JWT mà không suy diễn endpoint.

## Phạm vi

- Môi trường thực chiến: demo6 - Insove — https://api-hospital.cybersoft.edu.vn/swagger/index.html
- Công cụ: Postman + Swagger
- Thời lượng: 60 phút
- Artifact phải nộp: `LAB04_Auth_API.postman_collection.json` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Mở Swagger và ghi chính xác endpoint/body/header trước khi tạo request.
2. Tạo tài khoản test nếu Swagger cho phép, đăng nhập và lưu token vào environment cục bộ.
3. Kiểm đăng nhập đúng/sai và một endpoint danh mục công khai.
4. Không đưa token hoặc mật khẩu vào collection/evidence.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-04`.
2. Mở `fixtures/runtime/LAB-04.json` và áp dụng quy tắc: **API bệnh viện dùng Authorization: Bearer; không dùng TokenCybersoft.**
3. Viết finding cho `F-D14-004` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-04` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `LAB04_Auth_API.postman_collection.json` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
