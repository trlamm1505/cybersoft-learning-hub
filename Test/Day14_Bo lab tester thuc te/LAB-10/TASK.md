# LAB-10 — Login UI Automation

## Mục tiêu

Viết smoke login ổn định và phân loại lỗi product/test/environment.

## Phạm vi

- Môi trường thực chiến: demo2 - V Learning — https://demo2.cybersoft.edu.vn/login
- Công cụ: Playwright (TS)
- Thời lượng: 75 phút
- Artifact phải nộp: `login.spec.ts + HTML report` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Chạy test read-only có sẵn để kiểm form đăng nhập tồn tại.
2. Dùng biến môi trường cho tài khoản; không hardcode credential.
3. Bổ sung ca sai mật khẩu, bỏ trống và chạy lặp hai lần.
4. Lưu HTML report/trace khi fail và phân loại nguyên nhân.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-10`.
2. Mở `fixtures/runtime/LAB-10.json` và áp dụng quy tắc: **Locator phải theo role/label/name ổn định, không phụ thuộc class ngẫu nhiên.**
3. Viết finding cho `F-D14-010` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-10` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `login.spec.ts + HTML report` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
