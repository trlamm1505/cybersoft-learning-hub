# LAB-05 — Project & Task API

## Mục tiêu

Thực hiện chuỗi CRUD bằng endpoint đọc trực tiếp từ Swagger và dọn dữ liệu đã tạo.

## Phạm vi

- Môi trường thực chiến: demo3 - Jira — https://jiranew.cybersoft.edu.vn/swagger/index.html
- Công cụ: Postman + Swagger
- Thời lượng: 75 phút
- Artifact phải nộp: `LAB05_API_Report.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Đọc Swagger và ghi endpoint signin/project/task chính xác.
2. Tạo project có tiền tố DAY14_<mãHV>, sau đó tạo task và đọc lại chi tiết.
3. Kiểm update status/assign chỉ trên project của bạn.
4. Xóa project do bạn tạo và lưu response xác nhận cleanup.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-05`.
2. Mở `fixtures/runtime/LAB-05.json` và áp dụng quy tắc: **Sửa/xóa phải kiểm quyền sở hữu tài nguyên.**
3. Viết finding cho `F-D14-005` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-05` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `LAB05_API_Report.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
