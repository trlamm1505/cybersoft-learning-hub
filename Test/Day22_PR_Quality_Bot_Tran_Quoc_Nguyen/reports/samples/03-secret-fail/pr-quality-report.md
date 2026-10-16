# Day 22 - PR Quality Report

- **Kết quả tổng:** FAIL (exit code 1)
- **Thời gian UTC:** 2026-10-05T06:40:49+00:00
- **Số file thay đổi:** 1 (docs-only: 0, chưa map: 0)
- **Secret và workflow policy:** FAIL
- **Link report:** `reports/pr-quality-report.md`, `reports/pr-quality-report.json` (chạy local)

## Gate summary

| Gate | Loại | Trạng thái | Exit code |
|---|---|---:|---:|
| Secret và workflow policy | blocking | FAIL | 1 |
| PR Quality Bot self-test | blocking | FAIL | 1 |

## Change impact

| File | Phân loại | Gate được chọn |
|---|---|---|
| `Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/demo-tmp/leak.env` | code | pr_quality_self_test |

## Security findings

- `Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/demo-tmp/leak.env:1` / `openai_key`: Phát hiện chuỗi có dạng secret thật.
- `Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/demo-tmp/leak.env:1` / `assigned_secret`: Phát hiện chuỗi có dạng secret thật.

**Cách khắc phục:** Secret: xóa khỏi commit, rotate khóa nếu là khóa thật, chuyển sang GitHub Secrets/biến môi trường. Workflow: giảm quyền về read, bỏ lệnh approve/merge/comment tự động rồi chạy lại.

## PR Quality Bot self-test — FAIL

- `python -m unittest discover -s Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/tests`
- Exit code: `1`; thời gian: `0.55s`

```text
...........................F........
======================================================================
FAIL: test_bot_source_and_tests_pass_their_own_secret_scan (test_pr_quality.SecurityTests)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/sessions/rcw-01hwe9akuqttxidx9jbnraod/mnt/thuctap/cybersoft-learning-hub/Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/tests/test_pr_quality.py", line 164, in test_bot_source_and_tests_pass_their_own_secret_scan
    self.assertEqual([], pr_quality.scan_security(files, REPO))
AssertionError: Lists differ: [] != [{'file': 'Test/Day22_PR_Quality_Bot_Tran_[274 chars]t.'}]

Second list contains 2 additional elements.
First extra element 0:
{'file': 'Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/demo-tmp/leak.env', 'rule': 'openai_key', 'line': 1, 'message': 'Phát hiện chuỗi có dạng secret thật.'}

- []
+ [{'file': 'Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/demo-tmp/leak.env',
+   'line': 1,
+   'message': 'Phát hiện chuỗi có dạng secret thật.',
+   'rule': 'openai_key'},
+  {'file': 'Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/demo-tmp/leak.env',
+   'line': 1,
+   'message': 'Phát hiện chuỗi có dạng secret thật.',
+   'rule': 'assigned_secret'}]

----------------------------------------------------------------------
Ran 36 tests in 0.461s

FAILED (failures=1)
```

**Cách khắc phục:** Sửa mapping/script hoặc test Ngày 22; chạy `python -m unittest discover -s Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/tests` đến khi exit code 0 rồi mới push.

## Quyết định review

Bot chỉ cung cấp bằng chứng PASS/FAIL. Bot **không có quyền và không được tự approve/merge PR**; người review chịu trách nhiệm quyết định cuối cùng.
