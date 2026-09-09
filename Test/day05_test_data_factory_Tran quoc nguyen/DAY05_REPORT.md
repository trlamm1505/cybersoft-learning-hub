# BÁO CÁO CUỐI NGÀY - DAY 05

## 1. Mục tiêu hôm nay

Xây Test Data Factory có thể sinh dữ liệu kiểm thử tái lập cho user/course/exercise/submission, bao phủ valid, boundary, invalid và adversarial.

## 2. Kết quả đã hoàn thành

- Tạo `TestDataFactory`.
- Có factory cho user/course/exercise/submission.
- Có 20 scenarios.
- Có seed để tái lập.
- Có worker_id để tránh collision khi chạy parallel.
- Có cleanup command.
- Có unit tests kiểm tra tiêu chí nghiệm thu.

## 3. Bằng chứng

Điền sau khi chạy thực tế:

- Commit/PR: ...
- Screenshot unit test: ...
- Screenshot generated data: ...
- Screenshot parallel workers: ...
- Screenshot cleanup: ...

## 4. Số liệu

- Số factory entity: 4
- Số scenario: 20
- Nhóm scenario: 4
- Unit tests: 6
- PII thật: 0

## 5. AI Work Log

Xem file `AI_WORKLOG.md`.

## 6. Lỗi và cách xử lý

Ví dụ nếu gặp:

**Lỗi:** Dữ liệu giữa parallel workers bị trùng ID.  
**Nguyên nhân:** ID chỉ phụ thuộc seed.  
**Cách xử lý:** Đưa `worker_id` vào `run_id`, ID và email.  
**Cách xác minh:** Chạy unit test `test_parallel_workers_do_not_collide`.

## 7. Kiến thức nhận lại

1. Test data phải deterministic để dễ debug lỗi CI.
2. Boundary data cần dựa trên rule/schema rõ ràng.
3. Parallel test cần isolation theo worker/run id.

Điều còn chưa chắc:
- Boundary thật của các field phải xác nhận lại từ schema/API của hệ thống thực tế.

## 8. Kế hoạch ngày mai

1. Xác nhận schema API thật cho auth/resource/exercise/submission.
2. Chuyển 20 fixture thành input cho API tests.
3. Chuẩn bị positive/negative/boundary contract tests.
