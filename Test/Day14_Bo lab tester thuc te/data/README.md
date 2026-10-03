# LAB-09 — Snapshot SQL của Learning Hub

Đây là dữ liệu giả mô phỏng users và quizattempts, không phải bản sao dữ liệu người dùng thật. Ứng dụng vẫn dùng MongoDB. Snapshot giúp thực hành GROUP BY và LEFT JOIN đúng yêu cầu SQL của Ngày 14.

1. Mở terminal tại thư mục Day14.
2. Chạy `python data/create_snapshot.py` để tạo `data/day14_snapshot.sqlite` có lỗi.
3. Mở file bằng công cụ SQLite bạn có (hoặc Python sqlite3). Tìm email trùng sau chuẩn hóa và attempt không có user.
4. Lưu query và kết quả vào bài nộp LAB-09. `checks.sql` là query gợi ý nếu cần.
5. Chạy `python data/create_snapshot.py --clean` để reset. Chạy lại query, cả hai phải có 0 dòng.
6. Chạy lại lệnh ở bước 2 để bắt đầu lượt học tiếp theo.

Mentor có thể chạy toàn bộ chu kỳ buggy → clean → buggy bằng `python data/verify_snapshot.py`. Script lưu evidence JSON trong `reports/` và trả exit code khác 0 nếu kết quả không đúng.

Reset chỉ thay hai bảng trong file snapshot này. Không kết nối hoặc seed MongoDB.
