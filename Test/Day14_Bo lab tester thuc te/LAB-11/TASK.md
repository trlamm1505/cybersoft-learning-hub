# LAB-11 — Luồng chọn phim → đặt vé

## Mục tiêu

Tự động hóa luồng đọc từ danh sách phim tới chi tiết, dừng trước giao dịch.

## Phạm vi

- Môi trường thực chiến: demo1 - TIX — https://demo1.cybersoft.edu.vn/
- Công cụ: Playwright (TS)
- Thời lượng: 75 phút
- Artifact phải nộp: `booking.spec.ts + evidence` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Chạy smoke mở trang và lấy link phim thực tế từ DOM.
2. Mở phim đầu tiên, kiểm URL /detail/<id> và nội dung chính.
3. Nếu tiếp tục tới ghế, dùng tài khoản test và dừng trước xác nhận/thanh toán.
4. Lưu trace/screenshot; không tạo giao dịch thật.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-11`.
2. Mở `fixtures/runtime/LAB-11.json` và áp dụng quy tắc: **Ghế đã đặt không được hiển thị là có thể chọn.**
3. Viết finding cho `F-D14-011` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-11` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `booking.spec.ts + evidence` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
