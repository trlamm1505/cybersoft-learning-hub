# AI WORKLOG - Day 30

## Bài toán trước khi dùng AI

Tổng hợp kết quả QA 30 ngày thành bộ bàn giao có nguồn, có evidence, phân loại đúng owner và giải thích được quyết định release.

## Công cụ và phạm vi AI hỗ trợ

- Codex/Claude: kiểm kê file, đối chiếu workbook, đọc log, gợi ý cấu trúc và hỗ trợ cập nhật tài liệu.
- PowerShell/Git: kiểm tra commit, trạng thái repo, chạy test và thu thập output.
- Excel/Word: test case, defect/risk tracker và báo cáo bàn giao.

AI không tự phê duyệt release, không tự ký UAT, không tự nhận owner/deadline và không được đổi FAIL thành PASS nếu thiếu evidence.

## Sai sót hoặc thiếu sót của AI đã được tester phát hiện

- Từng gán sai mã DEF và ghép nhiều nhóm owner trong một lỗi.
- Bản đầu chỉ tổng hợp Ngày 25-29, thiếu nguồn Ngày 6-24.
- Từng coi DEF-058 đã đóng hoàn toàn; retest V2 cho thấy lỗi tái diễn ở bài 0 test case.
- Kết quả gate dùng `StubLlmClient` không chứng minh model thật đạt 100%.
- Một số kết quả cũ thuộc commit `d804c49`, không thể tự động áp dụng cho commit V2 `8902fcb`.

## Kiểm chứng độc lập của tester

- Đối chiếu defect ID với workbook Ngày 23 và evidence nguồn.
- Giữ riêng các mẫu số khác nghĩa; không cộng lượt flake với số test case.
- Chạy/đọc release gate, security retest, secret scan và retest defect.
- Retest V2 ngày 17/10/2026 theo 38 test case, chia theo học sinh 3-5, 6-9, 10-12/trái ngành, giáo viên, bảo mật và accessibility.
- Kiểm tra UI, API, quyền truy cập và source; những ca không chạy được ghi BLOCKED/PENDING hoặc nêu giới hạn.

## Kết quả chốt từ hai workbook mới

| Hạng mục | Kết quả |
|---|---|
| Test case V2 | 38 ca: 18 Pass, 18 Fail, 1 Blocked, 1 Pending |
| Fail theo severity | 5 High, 8 Medium, 5 Low |
| Defect/risk tracker | 29 mục: 28 OPEN, 1 PENDING APPROVAL |
| Tracker theo severity | 8 High, 11 Medium, 10 Low |
| High blocker | DEF-033, DEF-035, DEF-050, DEF-018, DEF-060, RISK-06, RISK-07, RISK-08 |
| Quyết định | NO-GO/HOLD |

## Thay đổi quan trọng trên V2

- PASS và bỏ khỏi tracker: DEF-006, DEF-007, DEF-051, DEF-054.
- DEF-021 đã sửa trong code; cần runtime regression khi có bài chứa hidden test.
- DEF-058 mở lại do AI Coach trả `undefined` khi bài chưa có test case.
- Thêm RISK-09 về seed V2 thiếu bài/test case.
- Thêm RISK-10 về mapping lớp, giáo viên và ageGroup.
- Giao diện Kids và phân quyền xem lớp đạt; API quiz/contest vẫn thiếu enforcement nhóm tuổi (`RISK-02`).

## Evidence chính

- `Day30_Test_Cases_V2_Tran_Quoc_Nguyen.xlsx`
- `Day30_Defect_Risk_Tracker_Tran_Quoc_Nguyen.xlsx`
- `evidence/retest_v2_2026-10-17.md`
- `evidence/retest_v2_2026-10-17/`
- `evidence/final_gate_lan2_2026-10-15/` (bằng chứng lịch sử trên commit cũ)

## Quyết định của tester

Giữ **NO-GO/HOLD**. Chỉ xem xét thay đổi khi 8 High blocker được xử lý hoặc phê duyệt, regression/gate PASS trên cùng commit V2, UAT có xác nhận thật và các ca BLOCKED/PENDING ảnh hưởng nghiệm thu đã được giải quyết.
