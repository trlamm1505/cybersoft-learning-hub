# Ngày 30 - Bàn giao QA cuối kỳ

**Người thực hiện:** Trần Quốc Nguyên (QA Tester)  
**Dự án:** CyberSoft Learning Hub V2  
**Ngày cập nhật:** 22/10/2026  
**Bản kiểm thử:** Bản V2 được retest ngày 17/10/2026 (môi trường local; chi tiết trong `evidence/retest_v2_2026-10-17_REVIEW.md`).

## Kết luận

**NO-GO / HOLD** - chưa đủ điều kiện phát hành.

Retest V2 còn 8 mục High chưa đóng: `DEF-033`, `DEF-035`, `DEF-050`, `DEF-018`, `DEF-060`, `RISK-06`, `RISK-07`, `RISK-08`. Ngoài ra còn 18 test case FAIL, 1 BLOCKED, 1 PENDING và chưa có UAT chính thức.

## Đọc theo thứ tự

| # | File | Công dụng |
|---|---|---|
| 1 | `Final_Quality_Report_Tran_Quoc_Nguyen_REVIEW.docx` | Báo cáo chất lượng tổng hợp và lý do HOLD (bản REVIEW; bản gốc `.docx` giữ nguyên) |
| 2 | `Day30_Defect_Risk_Tracker_Tran_Quoc_Nguyen_REVIEW.xlsx` | 29 defect/risk để FE, BE, Data AI và QA xử lý/retest |
| 3 | `QA_Handbook_Tran_Quoc_Nguyen_REVIEW.docx` | Hướng dẫn riêng cách chạy bản cũ và bản V2, chạy test, seed/reset và lưu evidence |
| 4 | `Ban_Trinh_Bay_Thay_The_Video_Day30_Tran_Quoc_Nguyen_REVIEW.docx` | Tài liệu trình bày thay video — ĐÃ SOẠN, CHỜ MENTOR CHẤP THUẬN (video thật CHƯA quay) |
| 5 | `Retro_Roadmap_60_Days_Tran_Quoc_Nguyen_REVIEW.docx` | Retrospective và roadmap 60 ngày (bản REVIEW; owner/deadline là đề xuất, chờ xác nhận) |
| 6 | `AI_WORKLOG.md` | AI hỗ trợ gì và tester đã kiểm chứng ra sao |
| 7 | `EVIDENCE_INVENTORY_REVIEW.md` và `evidence/` | Danh mục nguồn, log và ảnh kiểm thử (bản REVIEW) |
| 8 | `Tester_Resource_Pack/README.md` | Mục lục 12 lab, tài liệu, rubric và cách reset an toàn |
| 9 | `Demo_Harness/README.md` | Kịch bản trình bày QA: chạy test, đọc PASS/FAIL, mở evidence, giải thích lỗi, thêm/sửa test, bảo vệ NO-GO/HOLD |

> **Về các bản REVIEW:** đã có bản REVIEW cho: Final Quality Report, Defect/Risk Tracker, QA Handbook, Evidence Inventory, hai file điều hướng trong `evidence/`, và README này. `Tester_Resource_Pack/README.md` là mục lục mới, trỏ về tài liệu nguồn Ngày 14 chứ không tạo bản sao. `Demo_Harness/README.md` là kịch bản trình bày mới, chỉ dùng lệnh đã xác minh tồn tại và không chứa kết quả test giả. Các file **chưa có bản REVIEW nên tạm dùng bản gốc**: `AI_WORKLOG.md`, `DAY30_KE_HOACH_HOAN_THIEN.md`, và các log/ảnh gốc trong `evidence/` ngày 15/10. Bản gốc của mọi tài liệu đều được giữ nguyên.

## Số liệu tổng hợp (nguồn: biên bản retest V2)

### Kết quả test case V2 (số tổng hợp)

> Số liệu dưới đây là **số tổng hợp** ghi trong `evidence/retest_v2_2026-10-17_REVIEW.md`. **Không có workbook liệt kê kết quả từng ca.** Ảnh trong `evidence/retest_v2_2026-10-17/` là ảnh **chọn lọc**, không chứng minh toàn bộ 38 ca.

| Nhóm | Tổng | Pass | Fail | Blocked | Pending |
|---|---:|---:|---:|---:|---:|
| Học sinh 3-5 | 5 | 4 | 1 | 0 | 0 |
| Học sinh 6-9 | 9 | 3 | 5 | 1 | 0 |
| Học sinh 10-12 và trái ngành | 3 | 2 | 1 | 0 | 0 |
| Giáo viên | 8 | 5 | 2 | 0 | 1 |
| Bảo mật và dữ liệu chung | 8 | 3 | 5 | 0 | 0 |
| Giao diện / Accessibility | 5 | 1 | 4 | 0 | 0 |
| **Tổng** | **38** | **18** | **18** | **1** | **1** |

### Defect/Risk tracker

- Tổng: **29 mục** (`20 defect + 9 risk`).
- Trạng thái: **28 OPEN**, **1 PENDING APPROVAL**, **0 RESOLVED** trong tracker hiện hành.
- Severity: **8 High**, **11 Medium**, **10 Low**.
- High blocker: **5 DEF + 3 RISK**.

## Điểm V2 đã đạt

- Giao diện Kids chặn đúng các route không phù hợp với lớp 3-5.
- Học sinh chỉ xem được lớp của mình; bảng xếp hạng ẩn tên bạn học.
- Giáo viên không truy cập được lớp của giáo viên khác.
- Học sinh/giáo viên bị chặn khỏi API cấp quyền cao hơn.
- Form đăng nhập/đăng ký đã có label; email sai định dạng trả 400.
- Forgot-password trả thông báo đồng nhất.
- CSRF chặn request dùng cookie nhưng thiếu mã.

## Giới hạn và việc còn lại

- API quiz/contest chưa chặn nội dung theo nhóm tuổi dù giao diện đã chặn (`RISK-02`).
- DB dùng trong retest V2 chỉ có 2 bài tập, đều 0 test case; một số lỗi chấm bài chỉ kiểm bằng source hoặc bị BLOCKED.
- `DEF-058` được mở lại vì bài 0 test case vẫn làm AI Coach hiển thị `undefined`.
- `RISK-09` và `RISK-10` là vấn đề dữ liệu/cấu hình V2 cần xử lý.
- Owner và deadline vẫn là `Chưa xác nhận` cho đến khi nhóm nhận việc.
- UAT chính thức, human dry-run và quyết định release vẫn chưa hoàn thành.

Release gate 13/13 là của **bản cũ ngày 15/10/2026**, **không** chứng minh bản V2 hay bản hiện tại trong thư mục dự án đã qua gate. Chưa chạy gate trên bản V2/bản hiện tại.

Chi tiết việc tiếp theo nằm trong `DAY30_KE_HOACH_HOAN_THIEN.md`.
