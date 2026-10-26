# LAB-08 — Đối chiếu UI ↔ API khóa học

## Mục tiêu

Đối chiếu danh sách/chi tiết khóa học giữa UI và API.

## Phạm vi

- Môi trường thực chiến: demo2 - V Learning — https://demo2.cybersoft.edu.vn/
- Công cụ: Chrome + Postman
- Thời lượng: 60 phút
- Artifact phải nộp: `LAB08_Integrity_Report.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Chọn một danh mục và ghi số khóa học UI hiển thị.
2. Dùng Network/Swagger xác định endpoint tương ứng rồi gọi bằng Postman.
3. Đối chiếu mã, tên, hình ảnh và tổng số qua các trang.
4. Ghi rõ thời điểm lấy dữ liệu vì demo dùng chung có thể thay đổi.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-08`.
2. Mở `fixtures/runtime/LAB-08.json` và áp dụng quy tắc: **Tổng UI và API của cùng bộ lọc/thời điểm phải khớp.**
3. Viết finding cho `F-D14-008` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-08` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `LAB08_Integrity_Report.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
