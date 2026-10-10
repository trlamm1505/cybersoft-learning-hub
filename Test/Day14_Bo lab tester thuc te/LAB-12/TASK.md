# LAB-12 — Mini Regression Suite

## Mục tiêu

Xây regression read-only, data-driven và kết luận GO/NO-GO có bằng chứng.

## Phạm vi

- Môi trường thực chiến: demo1 - TIX — https://demo1.cybersoft.edu.vn/
- Công cụ: Playwright (TS)
- Thời lượng: 90 phút
- Artifact phải nộp: `regression.spec.ts + Regression_Summary.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Chọn ít nhất sáu luồng read-only hoặc tự cleanup được.
2. Gắn @smoke cho luồng quan trọng và dùng dữ liệu lấy từ DOM/API thay vì ID cố định.
3. Chạy smoke và full suite hai lần; tách lỗi demo, lỗi test và lỗi mạng.
4. Kết luận GO/NO-GO dựa trên severity và evidence, không dựa trên số pass đơn thuần.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-12`.
2. Mở `fixtures/runtime/LAB-12.json` và áp dụng quy tắc: **Regression case ID phải duy nhất và ca ghi dữ liệu phải có cleanup.**
3. Viết finding cho `F-D14-012` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-12` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `regression.spec.ts + Regression_Summary.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
