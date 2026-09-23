# LAB-09 — Data Quality Hunt trên SQLite

## Mục tiêu

Tìm dữ liệu trùng và mồ côi bằng GROUP BY/HAVING và LEFT JOIN.

## Phạm vi

- Môi trường thực chiến: Fixture offline — data/day14_snapshot.sqlite
- Công cụ: SQLite
- Thời lượng: 45 phút
- Artifact phải nộp: `LAB09_Data_Quality_Findings.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Tạo fixture lỗi bằng script data/create_snapshot.py.
2. Tìm email trùng sau chuẩn hóa và attempt không có user.
3. Lưu query, record ID và kết quả.
4. Chạy --clean, kiểm query trả 0 dòng, rồi dựng lại fixture cho lượt sau.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-09`.
2. Mở `fixtures/runtime/LAB-09.json` và áp dụng quy tắc: **Email phải duy nhất sau chuẩn hóa; mọi attempt phải có user.**
3. Viết finding cho `F-D14-009` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-09` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `LAB09_Data_Quality_Findings.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
