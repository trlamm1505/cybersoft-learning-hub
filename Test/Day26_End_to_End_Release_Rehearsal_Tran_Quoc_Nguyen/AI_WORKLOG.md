# AI WORKLOG - NGÀY 26

## Bài toán trước AI

Cần diễn tập phát hành đầy đủ, thu evidence từng gate, thử rollback và không che failure. Repo có nhiều nhóm FE, BE, content QA và Data-AI nên cần chọn đúng lệnh production.

## Công cụ sử dụng

Codex, PowerShell, Git, npm, Jest, Vitest, Node test runner, Pytest, HTTP smoke và FastAPI rollback endpoint.

## Chỉ dẫn chính

- Đọc kế hoạch QA Ngày 26 và dùng code mới nhất.
- Không seed force hoặc xóa dữ liệu cũ.
- Không ghi PASS giả nếu Docker/service không chạy.
- Chạy độc lập build, test, content gate, AI eval, smoke và rollback.
- Lưu commit, số test, exit code, HTTP status và blocker.

## AI đề xuất và kết quả kiểm chứng

| Đề xuất | Kiểm chứng của tester | Quyết định |
|---|---|---|
| Chạy full FE/BE test | FE 169 PASS; BE 924 PASS, 2 skip | Chấp nhận gate test |
| Chạy content lint | Sandbox fail do localhost; terminal thường 17 PASS | Phân loại lỗi môi trường, giữ cả hai evidence |
| Chạy AI eval | 100/100 với StubLlmClient | PASS có giới hạn, không gọi là Gemini production |
| Build và deploy local | Cả build PASS; FE/BE HTTP 200 | Chấp nhận local deploy/smoke |
| Chạy rollback | 24 Pytest PASS; API sinh plan 5 bước v1.1.0 → v1.0.0 | Chấp nhận rollback-plan rehearsal |
| Chạy Docker full stack | Docker WSL ExecError | RELEASE HOLD, không bỏ qua blocker |

## Điểm AI chưa đủ và quyết định của bản thân

- Output setup nói Postgres sandbox sẵn sàng dù Docker compose đã thất bại. Tester không tin dòng tổng kết mà đối chiếu Docker health và giữ gate BLOCKED.
- AI eval dùng stub nên không đại diện model thật. Tester ghi rõ giới hạn và không nâng kết luận.
- Không chạy `seed:all` vì lệnh có thể xóa dữ liệu cũ. Tester chọn setup an toàn và xác nhận DB đã có dữ liệu.
- Không tự reset Docker/WSL hoặc xóa volume vì có nguy cơ ảnh hưởng dữ liệu ngoài phạm vi.

## Diff và bàn giao

- Rehearsal report có evidence thực tế.
- Runbook từ preflight đến cleanup.
- Blocker/action matrix có owner, deadline và exit criteria.
- CSV gate results và JSON rollback evidence.


## Bổ sung sau khi rà soát ngày 10/10

- Rà soát lần hai phát hiện: thiếu log gốc và thời gian từng gate; seed chưa đối chiếu với giao diện; quyết định release chưa tính lỗi High của Ngày 23/24; deadline blocker chưa có người xác nhận; cây git không sạch.
- AI thêm `run_release_gates.ps1`, mục 11 đến 14 của báo cáo và 5 dòng blocker D26-06 đến D26-10. AI không chạy được build, test, Docker trên máy kiểm thử nên các script và số liệu mới chưa được chạy; tester phải chạy và đối chiếu.
- (tester tự điền) Công cụ thực tế đã dùng, quyết định với từng lỗi High, và kết quả chạy lại script.
