# Báo Cáo Ngày 03 - QA Repository và CI

## Bàn Giao Cuối Ngày

- QA repo skeleton: Done. Đã có `tests/api`, `tests/ui`, `tests/data`, `tests/content`, `tests/ai_eval`, `tests/fixtures`, `reports`.
- CI pipeline: Done. Đã có `.github/workflows/qa-ci.yml`.
- HTML/JUnit report: Done local. Đã sinh `reports/html-report.html` và `reports/junit-report.xml`.

## Điều Kiện Nghiệm Thu

- Test chạy độc lập: Pass. Chạy `pytest` trong folder `Test/Day3_Trần Quốc Nguyên`.
- Failure lưu artifact: Pass về cấu hình. CI upload thư mục `reports/` bằng `if: always()`.
- Không hard-code secret: Pass. Fixture chỉ dùng dữ liệu mock, không có API key/token/password thật.

## Bằng Chứng Local

- Lint: `ruff check .` -> All checks passed.
- Test: `pytest` -> 5 passed.
- Report HTML: `reports/html-report.html`.
- Report JUnit: `reports/junit-report.xml`.

## Nội Dung Đã Học

- Biết cách tổ chức automation architecture cho QA repo.
- Biết dùng fixture mock để test chạy độc lập.
- Biết viết smoke test cơ bản cho API/data.
- Biết cấu hình pytest để sinh HTML/JUnit report.
- Biết dùng ruff để kiểm tra format/import trước khi bàn giao.

## Giới Hạn Hiện Tại

- Test hiện tại dùng mock data, chưa kết nối API thật của `learning-hub` hoặc `Data-AI-Resource`.
- CI mới được cấu hình local trong repository, chưa kiểm chứng trên GitHub Actions theo yêu cầu hiện tại.
