# DAY 05 - Test Data Factory

## 1. Mục tiêu

Tạo bộ sinh dữ liệu kiểm thử có thể tái lập cho:

- User
- Course
- Exercise
- Submission

Bộ dữ liệu hỗ trợ 4 nhóm:

- Valid
- Boundary
- Invalid
- Adversarial

Ngoài ra có:

- Seed để tái lập
- `worker_id` để cô lập dữ liệu khi chạy song song
- Cleanup theo `run_id`
- 20 scenarios mẫu
- Unit tests để chứng minh các điều kiện nghiệm thu

---

## 2. Quy ước dữ liệu mẫu

Đây là **fixture giả lập**, không phải schema production.

Rule mẫu dùng để minh hoạ:

- `username`: 3-30 ký tự
- `email`: bắt buộc
- `role`: `student | teacher | admin`
- `course.title`: tối thiểu 1 ký tự
- `exercise.max_score >= 0`
- `exercise.time_limit_sec >= 1`
- `submission.status`: ví dụ `draft | submitted | graded`

Nếu hệ thống thật có rule khác, cập nhật scenarios theo API/schema thật.

---

## 3. Chạy nhanh

### Sinh dữ liệu

```bash
python generate_scenarios.py --seed 20260908 --worker w0
```

Kết quả:

```text
generated/
  seed20260908_w0/
    manifest.json
    scenarios.json
```

### Chứng minh deterministic

Chạy lại cùng lệnh:

```bash
python generate_scenarios.py --seed 20260908 --worker w0
```

Kết quả phải giống nhau.

### Chứng minh parallel isolation

Terminal 1:

```bash
python generate_scenarios.py --seed 20260908 --worker w0
```

Terminal 2:

```bash
python generate_scenarios.py --seed 20260908 --worker w1
```

Hai bộ có `run_id`, ID, email và folder khác nhau.

### Chạy test

```bash
python -m unittest discover -s tests -v
```

### Cleanup

```bash
python cleanup.py --run-id seed20260908_w0
```

---

## 4. 20 scenarios

| ID | Category | Entity | Mô tả |
|---|---|---|---|
| SC01 | valid | user | User học viên hợp lệ |
| SC02 | valid | user | User giảng viên hợp lệ |
| SC03 | valid | course | Course hợp lệ |
| SC04 | valid | exercise | Exercise quiz hợp lệ |
| SC05 | valid | submission | Submission hợp lệ |
| SC06 | boundary | user | Username = 3 ký tự |
| SC07 | boundary | user | Username = 30 ký tự |
| SC08 | boundary | course | Course title = 1 ký tự |
| SC09 | boundary | exercise | max_score = 0 |
| SC10 | boundary | exercise | time_limit_sec = 1 |
| SC11 | invalid | user | Email rỗng |
| SC12 | invalid | user | Role không hợp lệ |
| SC13 | invalid | course | Course title rỗng |
| SC14 | invalid | exercise | max_score âm |
| SC15 | invalid | submission | Status không hợp lệ |
| SC16 | adversarial | user | HTML/script string |
| SC17 | adversarial | course | SQL-like payload |
| SC18 | adversarial | exercise | Path traversal string |
| SC19 | adversarial | submission | Spreadsheet formula injection |
| SC20 | adversarial | submission | Payload rất dài |

---

## 5. Điều kiện nghiệm thu và bằng chứng

### Cùng seed tái lập

Bằng chứng bằng unit test:

```text
test_same_seed_is_deterministic
```

### Không dùng PII thật

Email fixture luôn dùng domain:

```text
@example.test
```

Tên chỉ là `Test User xxx`.

### Parallel test không đụng nhau

Mỗi worker có:

```text
run_id = seed<SEED>_<WORKER>
```

Ví dụ:

```text
seed20260908_w0
seed20260908_w1
```

ID, email và thư mục đều mang worker id.

---

## 6. Điểm cần chỉnh khi tích hợp vào hệ thống thật

Nếu test gọi API/DB thật, nên:

1. Gắn `run_id` vào record test.
2. Tạo dữ liệu qua API hoặc repository layer.
3. Cleanup tất cả record theo `run_id`.
4. Không cleanup toàn bảng.
5. Không dùng email/số điện thoại/tên người thật.
6. Với CI parallel, dùng `worker_id` từ CI runner, ví dụ `PYTEST_XDIST_WORKER`.
