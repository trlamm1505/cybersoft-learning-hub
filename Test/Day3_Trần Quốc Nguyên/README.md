# Day 3 - QA Repository và CI

## Bàn Giao Cuối Ngày

- QA repo skeleton: đã tạo cấu trúc `tests/api`, `tests/ui`, `tests/data`, `tests/content`, `tests/ai_eval`, `tests/fixtures`, `reports`.
- CI pipeline: đã tạo workflow `.github/workflows/qa-ci.yml`.
- HTML/JUnit report: `pytest` sinh report tại `reports/html-report.html` và `reports/junit-report.xml`.

## Điều Kiện Nghiệm Thu

- Test chạy độc lập: chạy trong folder này bằng lệnh `pytest`.
- Failure lưu artifact: CI có bước upload `reports/` với `if: always()`.
- Không hard-code secret: chỉ dùng mock fixture, không lưu API key/token/password thật.

## Kiểm Chứng Local

- Cài thư viện: `pip install -r requirements.txt`.
- Kiểm tra lint: `ruff check .`.
- Chạy test: `pytest`.
- Kết quả hiện tại: `ruff` pass, `pytest` pass 5 tests.

## Cấu Trúc Chính

- `requirements.txt`: thư viện test/lint.
- `pytest.ini`: cấu hình test path và report.
- `tests/api`: smoke test mock Learning Hub.
- `tests/data`: smoke test data/content/AI evaluation fixture.
- `tests/fixtures`: dữ liệu mock dùng cho test.
- `reports`: nơi lưu HTML/JUnit report sau khi chạy test.
