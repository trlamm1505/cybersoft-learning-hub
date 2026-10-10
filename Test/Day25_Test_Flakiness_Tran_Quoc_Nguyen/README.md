# Day 25 - Test flakiness và độ tin cậy CI

## Hồ sơ bàn giao

- `FLAKE_REPORT.md`: báo cáo kết quả chạy thật và flake rate.
- `run_flake_check.ps1`: script tester dùng để chạy lại.
- `QUARANTINE_POLICY.md`: quy định quarantine có owner/deadline.
- `STABILIZATION_NOTES.md`: nội dung thay đổi và hướng xử lý khi phát hiện flake.
- `AI_WORKLOG.md`: bằng chứng sử dụng và kiểm chứng AI.
- `reports/`: CSV và log sinh ra sau khi chạy script.

## Chạy

```powershell
cd D:\thuctap\cybersoft-learning-hub
powershell -ExecutionPolicy Bypass -File .\Test\Day25_Test_Flakiness_Tran_Quoc_Nguyen\run_flake_check.ps1 -Iterations 10
```

Script không tự retry. Nếu có bất kỳ vòng FAIL nào, script trả exit code 1 để CI không bị báo PASS giả.

