# Blockers và prevention actions

| ID | Blocker | Phân loại | Mức độ | Owner đề xuất | Deadline | Hành động | Exit criteria |
|---|---|---|---|---|---|---|---|
| D26-01 | Docker Desktop không boot được WSL engine | Environment | High (ĐÃ HẾT 10/10 08:06) | Máy kiểm thử / DevOps | Chưa xác nhận | Chạy `wsl --shutdown`, cập nhật WSL, restart Docker; nếu vẫn lỗi dùng Docker troubleshoot/reset theo chính sách dữ liệu | `docker info` exit 0 |
| D26-02 | Postgres sandbox chưa được xác nhận healthy | Infrastructure | High (ĐÃ HẾT: healthy, SQL ACCEPTED) | BE/DevOps | Chưa xác nhận (sau D26-01) | `docker compose up -d postgres-sandbox`, kiểm tra `docker compose ps` và `pg_isready` | Container healthy và SQL smoke PASS |
| D26-03 | Python sandbox image chưa xác nhận | Infrastructure | Medium (ĐÃ HẾT: Run API 509 ms) | BE/DevOps | Chưa xác nhận (sau D26-01) | Pull `python:3.12-slim`, chạy một bài Python smoke | Bài Python trả output đúng |
| D26-04 | Setup có thể in “sandbox sẵn sàng” dù helper chỉ cảnh báo | Test observability | Medium | BE | Chưa xác nhận | Release gate phải kiểm tra Docker health trực tiếp; cân nhắc thêm strict mode cho setup | Strict gate trả non-zero khi sandbox fail |
| D26-05 | FE bundle có chunk lớn hơn 500 kB | Performance | Low | FE | Chưa xác nhận | Đo tải trang, cân nhắc dynamic import/code splitting | Không vượt ngân sách đã thống nhất |
| D26-06 | Lỗi High còn mở ở log Ngày 23/24 (DEF-026, 021, 023, 034, 019, 012) chưa được chấp nhận hoặc sửa | Product | High | BE/FE (đề xuất) | Chưa xác nhận | Họp quyết định sửa hay chấp nhận rủi ro từng lỗi; ghi vào báo cáo mục 12 | Mỗi lỗi High có quyết định bằng văn bản |
| D26-07 | Smoke chỉ kiểm health và trang chủ, thiếu smoke chức năng | Test coverage | Medium (ĐÃ HẾT: lần 2 trên clone mới đạt 16/16, báo cáo mục 19) | QA | Chưa xác nhận | Thêm smoke đăng nhập, quiz, Playground, AI Coach | Smoke chức năng PASS và có log |
| D26-08 | Seed repo có 60 câu quiz (20 Python, 20 HTML5, 20 CSS3) nhưng MongoDB chỉ có 20; web: đề Python không có câu, HTML5 2 câu; `/exercises` trả 2 bài (gate ghi 25) | Data/Environment | Medium (ĐÃ HẾT trên bản clone mới: 60 câu quiz, 45 bài có test case, smoke 16/16; DB cũ vẫn thiếu) | BE | Chưa xác nhận | Seed bổ sung từng collection thiếu (không dùng `seed:all`), rồi kiểm lại số câu trên thẻ và đề | Mỗi chủ đề có đủ 20 câu và bắt đầu được |
| D26-09 | Chưa có log gốc và thời gian từng gate | Evidence | Medium (ĐÃ HẾT: 13 log + gate-timing.csv) | Tester | Chưa xác nhận | Chạy `run_release_gates.ps1`, lưu `evidence/logs/` và `gate-timing.csv` | Mọi gate có log và thời gian |
| D26-10 | Cây làm việc không sạch sau rehearsal: 14 file sửa do eval/pytest/Excel, `.tmp-jest/`, 2 file backup trong mã nguồn, `weights/`, `yolov8n.pt` | Process | Low | QA | Chưa xác nhận | Làm theo bảng phân loại ở báo cáo mục 15 | `git status` chỉ còn thay đổi có chủ đích |
| D26-11 | Chưa rollback ứng dụng thật | Release process | Medium | QA/DevOps | Chưa xác nhận | Chạy `run_rollback_rehearsal.ps1 -Execute` | `/api/health` 200 trên bản `HEAD~1` ở cổng 3100 và worktree đã gỡ |
| D26-12 | Lần Run đầu sau khi BE khởi động quá 10 giây, FE báo "Không thể kết nối tới máy chủ chạy code" dù BE đang chạy | Product/Performance | Medium (không tái hiện ở lần 2, giữ theo dõi) | FE/BE | Chưa xác nhận | Làm nóng runner khi khởi động hoặc tăng timeout FE; sửa thông báo lỗi cho đúng nguyên nhân | Lần Run đầu dưới 10 giây hoặc hiện thông báo đúng |

Không reset Docker hoặc xóa volume tự động trong Ngày 26 vì có rủi ro mất dữ liệu local. Tester cần xác nhận dữ liệu đã backup trước thao tác reset.

