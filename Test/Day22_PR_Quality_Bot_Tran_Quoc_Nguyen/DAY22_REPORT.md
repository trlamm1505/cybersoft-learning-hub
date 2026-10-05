# Báo cáo cuối ngày 22 — PR Quality Bot/Report

**Họ tên:** Trần Quốc Nguyên · **Vai trò:** QA/Tester · **Dự án:** CyberSoft Learning Hub

## Mục tiêu

Mỗi thay đổi trong Pull Request nhận phản hồi tự động, đúng phạm vi ảnh hưởng, có bằng chứng kiểm tra rõ ràng.

## Công việc đã hoàn thành

1. Change-impact mapping cho FE, BE, nội dung thật (quiz, bài coding, bài học), các bộ test Ngày 6/7/11/12/13 và chính PR bot; phân loại riêng docs-only và file chưa có gate.
2. Script chọn gate theo file đổi, chạy lệnh và kết luận theo exit code thật.
3. Report Markdown/JSON có log đã che secret, giới hạn độ dài, có hướng khắc phục khi lỗi.
4. Rule phát hiện secret, workflow nguy hiểm và comment spam; bot chỉ có quyền đọc.
5. GitHub Actions chạy khi có PR vào `main`, đưa report vào Job Summary và artifact, hủy run cũ khi push liên tiếp.
6. 36 unit test cho bot.

## Kết quả kiểm thử (05/10/2026, chạy local)

| Hạng mục | Kết quả |
|---|---|
| Unit test của bot | 36/36 PASS |
| Gate mock Ngày 6, Ngày 7 chạy qua bot | PASS (37 và 42 test) |
| Gate công cụ Ngày 11, 12, 13 chạy qua bot | PASS |
| Quiz thật (60 câu) và bài coding thật (30 bài) | PASS, 0 ERROR |
| Bài học thật | WARN (advisory): 2 lỗi CT004 có sẵn trong `initial-data.ts` |
| Quét secret toàn bộ 1 748 file đang track | 0 finding chặn; 12 chuỗi trong 8 file fixture đã allowlist có lý do |
| Gate FE/BE (`npm ci` + test + build) | Chưa chạy thử qua bot |
| PR check trên GitHub | Chưa có — cần push và mở PR |

## Đáp ứng điều kiện nghiệm thu

| Điều kiện | Kết quả | Bằng chứng |
|---|---|---|
| Kết quả chính xác theo exit code | Đạt | `ExitCodeTests` (10 test); mẫu `02-gate-fail`: gate exit 3 → bot exit 1 |
| Fail message có cách xử lý | Đạt | Mọi gate bắt buộc có `remediation`; security, file chưa map và danh sách rỗng đều có "Cách xử lý" |
| Không cho AI tự approve | Đạt | Workflow chỉ `read`; scanner chặn approve/merge; test `test_repo_workflow_is_read_only_and_cannot_approve` |

## Kết luận

Mã, test, tài liệu và report mẫu đã đủ. Việc còn lại để hoàn tất bàn giao "PR checks": push branch, mở Pull Request, chụp check run và artifact (các bước trong `SAMPLE_PR_DEMO.md`).
