# Day 22 - PR Quality Report

- **Kết quả tổng:** FAIL (exit code 1)
- **Thời gian UTC:** 2026-10-05T06:40:48+00:00
- **Số file thay đổi:** 1 (docs-only: 0, chưa map: 0)
- **Secret và workflow policy:** PASS
- **Link report:** `reports/pr-quality-report.md`, `reports/pr-quality-report.json` (chạy local)

## Gate summary

| Gate | Loại | Trạng thái | Exit code |
|---|---|---:|---:|
| Secret và workflow policy | blocking | PASS | 0 |
| Demo gate cố ý fail (exit 3) | blocking | FAIL | 3 |

## Change impact

| File | Phân loại | Gate được chọn |
|---|---|---|
| `demo/broken_feature.py` | code | demo_failing_gate |

## Demo gate cố ý fail (exit 3) — FAIL

- `python -c "import sys; print('AssertionError: expected 200, got 500'); sys.exit(3)"`
- Exit code: `3`; thời gian: `0.01s`

```text
AssertionError: expected 200, got 500
```

**Cách khắc phục:** Đọc dòng AssertionError trong log, sửa code để API trả 200, chạy lại lệnh ở trên tới khi exit code 0 rồi push commit mới.

## Quyết định review

Bot chỉ cung cấp bằng chứng PASS/FAIL. Bot **không có quyền và không được tự approve/merge PR**; người review chịu trách nhiệm quyết định cuối cùng.
