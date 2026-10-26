# Evidence Inventory - Day 30

## Bản kiểm thử hiện hành

- Phiên bản: **Bản V2 được retest ngày 17/10/2026**
- Repo trên máy: `D:\thuctap\clone2\cybersoft-learning-hub`
- Môi trường local: FE `http://localhost:5173`, BE `http://localhost:3000/api`, MongoDB connected tại thời điểm retest

## Nguồn số liệu chính

| Phạm vi | Nguồn | Kết quả dùng trong báo cáo |
|---|---|---|
| Số liệu tổng hợp retest V2 | `evidence/retest_v2_2026-10-17_REVIEW.md` | 38 ca: 18 Pass, 18 Fail, 1 Blocked, 1 Pending (số tổng hợp trong biên bản; **không có workbook từng ca**) |
| Defect/risk hiện hành | `Day30_Defect_Risk_Tracker_Tran_Quoc_Nguyen_REVIEW.xlsx` | 29 mục: 28 OPEN, 1 PENDING APPROVAL; 8 High |
| Biên bản retest V2 | `evidence/retest_v2_2026-10-17_REVIEW.md` | Môi trường, tài khoản, thay đổi so với tracker cũ và giới hạn |
| Ảnh retest V2 | `evidence/retest_v2_2026-10-17/` | 17 ảnh cho các ca UI/API/security/role |
| Bản cũ chạy release gate 15/10/2026 | `evidence/final_gate_lan2_2026-10-15/` | 13/13 PASS; **bằng chứng lịch sử của bản cũ**, không chứng minh bản V2/bản hiện tại |
| Retest defect cũ | `evidence/retest_defects_2026-10-15/` | DEF-053/056 từng PASS; DEF-035 OPEN; DEF-058 đã mở lại trên V2 |
| Security retest | `evidence/security_retest_2026-10-15.md` | IDOR/upload PASS, CORS FAIL, credential mặc định hoạt động |
| Secret scan | `evidence/secret_scan_2026-10-15.md` | Không thấy secret thật theo mẫu quét; Task21 còn API key ghi cứng |

## Kết quả V2 theo nhóm

| Nhóm | Tổng | Pass | Fail | Blocked | Pending |
|---|---:|---:|---:|---:|---:|
| Học sinh 3-5 | 5 | 4 | 1 | 0 | 0 |
| Học sinh 6-9 | 9 | 3 | 5 | 1 | 0 |
| Học sinh 10-12 và trái ngành | 3 | 2 | 1 | 0 | 0 |
| Giáo viên | 8 | 5 | 2 | 0 | 1 |
| Bảo mật và dữ liệu chung | 8 | 3 | 5 | 0 | 0 |
| Giao diện / Accessibility | 5 | 1 | 4 | 0 | 0 |
| **Tổng** | **38** | **18** | **18** | **1** | **1** |

## High blocker hiện hành

| ID | Owner đề xuất | Vấn đề |
|---|---|---|
| DEF-033 | Data AI | AI Coach không từ chối unsafe child content |
| DEF-035 | Data AI | AI Coach lặp traceback/path nội bộ |
| DEF-050 | BE | Input object làm API trả 500 |
| DEF-018 | BE | Mutation test số nguyên tố chỉ đạt 66,7% |
| DEF-060 | BE | Check-syntax lộ đường dẫn máy chủ |
| RISK-06 | BE | Tài khoản mặc định đăng nhập được |
| RISK-07 | Data AI | Task21 ghi cứng API key |
| RISK-08 | BE | CORS chấp nhận mọi origin |

## Quy tắc sử dụng evidence

- Mỗi kết luận phải trỏ đến đúng workbook, log hoặc ảnh.
- Không dùng kết quả gate 13/13 của bản cũ (15/10/2026) để tuyên bố bản V2 đã qua release gate.
- Không lưu mật khẩu, JWT, token hoặc secret trong evidence.
- `BLOCKED` và `PENDING` không được đổi thành PASS nếu chưa chạy/xác nhận.
- DEF/RISK chỉ chuyển RESOLVED sau khi có bản sửa và QA retest PASS.

## Kết luận

Evidence hiện hành hỗ trợ quyết định **NO-GO/HOLD**. Cần xử lý hoặc phê duyệt 8 High blocker, chạy lại các ca bị giới hạn dữ liệu, hoàn thành UAT và chạy release gate trên bản V2/bản hiện tại trước khi xem xét GO.
