# Day 26 - End to end release rehearsal

## Kết quả hiện tại

**RELEASE HOLD có điều kiện.** Cập nhật 10/10 08:25: 13/13 gate tự động PASS (57,6 giây), Docker/WSL đã hết lỗi, Postgres sandbox healthy, DA Lab SQL ACCEPTED. Cập nhật 10/10 17:30: trên bản clone mới (DB seed đầy đủ) smoke chức năng đạt 16/16, lỗi seed thiếu chỉ còn ở DB cũ. Chưa phát hành vì: lỗi High chưa có quyết định, chưa rollback ứng dụng, chưa chạy lại 13 gate trên bản clone, chưa kiểm Data service thật.

## Hồ sơ bàn giao

- `DAY26_REHEARSAL_REPORT.md`: báo cáo rehearsal và evidence từng gate.
- `RUNBOOK.md`: hướng dẫn chạy lại từ đầu đến rollback.
- `BLOCKERS_AND_ACTIONS.md`: blocker, owner, mức độ và hành động xử lý.
- `AI_WORKLOG.md`: bằng chứng sử dụng và kiểm chứng AI.
- `run_release_gates.ps1`: chạy các gate, lưu log và thời gian từng gate.
- `run_rollback_rehearsal.ps1`: rollback ứng dụng thật về `HEAD~1` trong worktree riêng (mặc định chỉ in kế hoạch).
- `evidence/functional-smoke.md`: bảng smoke chức năng: lần 1 trên DB cũ (2 FAIL do seed thiếu) và lần 2 trên bản clone mới (16/16 đạt).
- `evidence/gate-results.csv`: bảng kết quả máy đọc.
- `evidence/rollback-result.json`: kết quả rollback-plan đã gọi thật.

## Việc còn lại của tester

- Chạy `run_release_gates.ps1` (thêm `-IncludeSmoke` khi BE và FE đang chạy) để có `evidence/logs/` và `evidence/gate-timing.csv`.
- Xác minh dữ liệu seed so với giao diện (báo cáo mục 11) và thử các bước sửa Docker an toàn (mục 14).
- Có quyết định cho các lỗi High đang mở (báo cáo mục 12).

## Quyết định phát hành

Không approve full release cho tới khi xử lý các mục ở `DAY26_REHEARSAL_REPORT.md` mục 9.

