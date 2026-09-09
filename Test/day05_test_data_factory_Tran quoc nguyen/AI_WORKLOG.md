# AI WORK LOG - DAY 05

## 1. Problem statement trước khi dùng AI

Cần xây Test Data Factory để tạo dữ liệu kiểm thử cho user/course/exercise/submission.
Dữ liệu phải có 4 nhóm valid, boundary, invalid, adversarial; hỗ trợ seed, cleanup và chạy song song không đụng nhau.

## 2. Input / Output / Constraint

### Input
- seed
- worker_id
- entity type
- scenario category

### Output
- scenarios.json
- manifest.json
- 20 scenarios
- cleanup command
- unit tests

### Constraint
- Không dùng PII thật.
- Cùng seed + worker phải tái lập.
- Worker khác nhau không trùng ID.
- Cleanup chỉ xoá dữ liệu của đúng run.

## 3. AI đã hỗ trợ

- Đề xuất cấu trúc factory.
- Đề xuất 20 scenarios.
- Đề xuất cơ chế `run_id = seed + worker`.
- Đề xuất unit test cho deterministic và isolation.

## 4. Phần con người phải kiểm chứng

- Review toàn bộ 20 scenarios.
- Xác nhận boundary theo schema hệ thống thật.
- Chạy unit tests.
- Chạy cùng seed 2 lần để so sánh output.
- Chạy hai worker khác nhau để kiểm tra collision.
- Kiểm tra fixture không chứa PII thật.

## 5. Quyết định

### Chấp nhận
- Seed-based deterministic factory.
- Worker-based namespace.
- Domain `example.test`.
- Cleanup theo run_id.

### Cần sửa khi tích hợp production-like environment
- Rule username, score, time limit phải lấy từ schema/API thật.
- Cleanup hiện tại xoá file fixture; khi dùng API/DB phải cleanup record theo run_id.

## 6. Bằng chứng cần đính kèm

- Ảnh terminal chạy `python -m unittest discover -s tests -v`
- Ảnh folder `generated/seed20260908_w0`
- Ảnh chạy worker `w0` và `w1`
- Ảnh cleanup thành công
