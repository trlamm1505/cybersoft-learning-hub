# AI_WORKLOG - Ngày 25

## Bài toán trước khi dùng AI

Cần xác định nhóm test mới của Admin/Teacher/Student có flaky hay không, đo flake rate bằng dữ liệu chạy thật và xây quy định quarantine không che lỗi bằng retry.

## Công cụ và chỉ dẫn chính

- Công cụ: Codex, PowerShell, Vitest, Jest.
- Chỉ dẫn: đọc đúng kế hoạch QA Ngày 25; kiểm tra dự án mới nhất; chạy lặp critical smoke; không tạo số liệu giả; phân biệt lỗi hạ tầng và lỗi sản phẩm; tạo bộ bàn giao có thể tự chạy lại.

## AI đề xuất

- Chọn nhóm test sát chức năng mới nhất: phân quyền, quản lý lớp, Teacher Dashboard và Student Classes.
- Chạy 10 vòng FE/BE, lưu kết quả và tính flake rate.
- Dùng `--runInBand` cho baseline BE để giảm nhiễu do chia sẻ state.
- Thiết lập policy quarantine có owner/deadline/exit criteria.

## Kiểm chứng độc lập của tester

- FE: 5 file, 33 test/vòng, 10/10 vòng PASS.
- BE: 5 file, 104 test/vòng, 10/10 vòng PASS.
- Tổng: 1.370 assertion, chưa quan sát thấy flake.
- Tester có thể chạy độc lập bằng `run_flake_check.ps1` và kiểm tra log/CSV thay vì chỉ tin kết luận AI.

## Điểm AI/chạy tự động chưa đủ và quyết định của bản thân

- Một lần setup Jest trong sandbox bị `EPERM realpath`; không được đánh dấu là bug sản phẩm.
- Flake rate 0% trong 10 vòng không chứng minh hệ thống vĩnh viễn ổn định; quyết định tiếp tục thu thập lịch sử CI tối thiểu 7 ngày hoặc 100 lần chạy.
- Không sửa code chính khi chưa có bằng chứng flaky, tránh tạo thay đổi không cần thiết.

## Diff tạo ra

- Script kiểm tra lặp và lưu evidence.
- Flake report.
- Stabilization notes.
- Quarantine policy.
- AI worklog.

