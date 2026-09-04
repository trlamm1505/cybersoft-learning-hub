# AI Work Log - Day 03

## Bài Toán

Khởi tạo QA repository skeleton cho ngày 3, có smoke test chạy độc lập, có CI pipeline và có HTML/JUnit report.

## AI Hỗ Trợ

- Gợi ý cấu trúc `tests/api`, `tests/ui`, `tests/data`, `tests/content`, `tests/ai_eval`, `tests/fixtures`, `reports`.
- Tạo mock fixtures và smoke tests.
- Tạo `pytest.ini`, `requirements.txt`, README, báo cáo ngày 3 và workflow CI.

## Tester Kiểm Chứng

- Đọc lại cấu trúc file và nội dung test.
- Chạy `ruff check . --fix` để sửa import format.
- Chạy `ruff check .` và nhận kết quả pass.
- Chạy `pytest` và nhận kết quả 5 tests pass.
- Kiểm tra report sinh ra trong `reports/html-report.html` và `reports/junit-report.xml`.

## Quyết Định

Giữ bài ngày 3 trong folder riêng `Test/Day3_Trần Quốc Nguyên` để không lẫn với tài liệu ngày 2 và code của thành viên khác. Hiện tại chỉ dùng mock data để đáp ứng mục tiêu ngày 3; phần kết nối hệ thống thật sẽ mở rộng sau.
