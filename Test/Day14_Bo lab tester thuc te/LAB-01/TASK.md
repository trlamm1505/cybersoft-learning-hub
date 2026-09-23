# LAB-01 — Bug hunt Đăng ký / Đăng nhập

## Mục tiêu

Thiết kế ca âm cho đăng ký/đăng nhập và viết bug report tái hiện được.

## Phạm vi

- Môi trường thực chiến: demo2 - V Learning — https://demo2.cybersoft.edu.vn/login
- Công cụ: Chrome + DevTools
- Thời lượng: 60 phút
- Artifact phải nộp: `Bug_Report_LAB01.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Khảo sát form đăng ký và đăng nhập, ghi lại trường và validation nhìn thấy.
2. Thử bỏ trống từng trường, email sai định dạng, mật khẩu biên và đăng nhập sai.
3. Kiểm bằng bàn phím và viewport 375px; theo dõi Network để phân biệt UI chặn với API chặn.
4. Chỉ đăng ký một tài khoản test của bạn; không dùng dữ liệu cá nhân thật.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-01`.
2. Mở `fixtures/runtime/LAB-01.json` và áp dụng quy tắc: **Mọi trường bắt buộc phải được khai báo và chặn trước request.**
3. Viết finding cho `F-D14-001` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-01` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `Bug_Report_LAB01.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
