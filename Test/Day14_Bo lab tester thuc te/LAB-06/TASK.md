# LAB-06 — Negative & Error Handling

## Mục tiêu

Thiết kế negative tests từ Swagger và phân biệt 400/401/403/404/500.

## Phạm vi

- Môi trường thực chiến: demo4 - Fiverr — https://fiverrnew.cybersoft.edu.vn/swagger/index.html
- Công cụ: Postman + Swagger
- Thời lượng: 60 phút
- Artifact phải nộp: `LAB06_Negative_API_Report.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Chọn endpoint tìm kiếm/phân trang có thật trong Swagger và ghi path chính xác.
2. Thử pageIndex=0/âm, id không tồn tại, sai method và thiếu token.
3. Kiểm body lỗi có lộ stack/SQL/path nội bộ không.
4. Chỉ gửi request đọc hoặc dữ liệu thuộc tài khoản của bạn.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-06`.
2. Mở `fixtures/runtime/LAB-06.json` và áp dụng quy tắc: **Input biên phải trả 4xx phù hợp và không lộ stack trace.**
3. Viết finding cho `F-D14-006` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-06` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `LAB06_Negative_API_Report.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
