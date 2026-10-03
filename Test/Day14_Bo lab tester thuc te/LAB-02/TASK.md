# LAB-02 — Exploratory Danh sách phim & Đặt vé

## Mục tiêu

Khám phá danh sách phim, chi tiết, suất chiếu và luồng vào sơ đồ ghế.

## Phạm vi

- Môi trường thực chiến: demo1 - TIX — https://demo1.cybersoft.edu.vn/
- Công cụ: Chrome + DevTools
- Thời lượng: 60 phút
- Artifact phải nộp: `Exploratory_Report_LAB02.csv` và evidence tương ứng.
- Trạng thái ban đầu: `NEEDS PILOT`. Không tự ghi PASS chỉ vì đọc source hoặc chạy fixture.

## Quy tắc an toàn

- Demo là môi trường dùng chung. Chỉ thao tác trên tài khoản và dữ liệu do bạn tạo.
- Không kiểm IDOR bằng cách sửa/xóa dữ liệu người khác; chỉ mô phỏng bằng fixture kiểm soát.
- Không lưu mật khẩu, JWT hoặc TokenCybersoft vào bài nộp, ảnh chụp hay git.
- Mọi endpoint/body/header phải lấy từ Swagger hoặc Network tại thời điểm chạy; không tự đoán.

## Phần A — Thực chiến trên demo

1. Lập charter cho danh sách phim, chi tiết và suất chiếu.
2. Mở ít nhất ba phim; thử URL chi tiết với mã không tồn tại.
3. Đi đến bước sơ đồ ghế nhưng dừng trước thanh toán hoặc xác nhận đặt vé.
4. Tách observation, risk và bug; bug phải có bước tái hiện.

## Phần B — Fixture lỗi có kiểm soát

1. Chạy `node fixtures/reset.mjs --mode buggy --lab LAB-02`.
2. Mở `fixtures/runtime/LAB-02.json` và áp dụng quy tắc: **Mã phim không tồn tại phải trả trạng thái không tìm thấy, không phải lỗi server.**
3. Viết finding cho `F-D14-002` mà không xem `fixtures/manifest.json` trước khi hoàn thành phần phân tích.
4. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-02` và xác nhận finding không còn tái hiện.
5. Chạy lại chế độ buggy để trả môi trường về trạng thái bắt đầu cho học viên sau.

## Bài nộp tối thiểu

- File `Exploratory_Report_LAB02.csv` đã điền Actual, Expected, Result và Evidence.
- Ít nhất một evidence từ demo và một evidence từ fixture.
- Ghi rõ dữ liệu đã tạo, cách cleanup và kết quả sau cleanup.
- Nếu demo thay đổi hoặc không truy cập được, ghi `BLOCKED/NEEDS VERIFICATION`; không đổi expected để ép PASS.
