# Evidence Day 30 (bản REVIEW)

> Bản REVIEW của `README.md`. Bản gốc được giữ nguyên. Thay đổi: thay mã commit/hash bằng tên phiên bản dễ hiểu kèm ngày kiểm thử, bỏ mọi liên kết tới workbook test case đã bỏ, và nói rõ kết quả release gate 13/13 là của bản cũ. Không đổi trạng thái lỗi nào.

Chỉ lưu bằng chứng kiểm thử thật hoặc liên kết rõ đến evidence của ngày nguồn. Không lưu credential, token, mật khẩu hay secret.

## Retest V2 - 17/10/2026

- Phiên bản: **Bản V2 được retest ngày 17/10/2026** (môi trường local).
- Thư mục dự án: `D:\thuctap\clone2\cybersoft-learning-hub`.
- Kết quả (số tổng hợp): **38 ca - 18 Pass, 18 Fail, 1 Blocked, 1 Pending**.
- Biên bản: `retest_v2_2026-10-17_REVIEW.md`.
- Ảnh: `retest_v2_2026-10-17/` (evidence chọn lọc, không phải bằng chứng cho đủ cả 38 ca).
- Tracker hiện hành: 29 mục, trong đó 8 High blocker.

> Số 38 ca ở trên là **số tổng hợp ghi trong biên bản retest**, không có bảng chi tiết từng ca kèm theo (workbook Day30 test case đã bỏ, không nộp). Ảnh trong thư mục retest chỉ là bằng chứng chọn lọc.

### High blocker

`DEF-033`, `DEF-035`, `DEF-050`, `DEF-018`, `DEF-060`, `RISK-06`, `RISK-07`, `RISK-08`.

### Thay đổi quan trọng

- Đã bỏ khỏi tracker: DEF-006, DEF-007, DEF-051, DEF-054.
- DEF-021 đã sửa trong code nhưng cần runtime regression khi DB có hidden test.
- DEF-058 **mở lại** vì bài 0 test case vẫn làm AI Coach trả `undefined`.
- Thêm RISK-09 (seed V2 thiếu bài/test case) và RISK-10 (mapping lớp/giáo viên/ageGroup).

## Release gate lịch sử - 15/10/2026

- Phiên bản: **Bản cũ được chạy release gate ngày 15/10/2026**.
- Kết quả lần 2: **13 PASS, 0 FAIL, 0 BLOCKED**, exit code `0`.
- Evidence: `final_gate_lan2_2026-10-15/gate-timing.csv` và `final_gate_lan2_2026-10-15/logs/`.
- AI Coach evaluation dùng `StubLlmClient`, không phải model thật.
- **Kết quả 13/13 này là của bản cũ (15/10/2026). Nó KHÔNG chứng minh bản V2 được retest 17/10 hay bản hiện tại trong thư mục dự án đã qua release gate.** Chưa chạy release gate trên bản V2/bản hiện tại.

## Retest defect lịch sử - 15/10/2026

| Defect | Kết quả khi đó | Trạng thái hiện tại |
|---|---|---|
| DEF-053 | Ba đề đủ 20 câu, nộp/chấm thành công | Không còn trong tracker hiện hành |
| DEF-056 | Code đúng đạt Accepted 4/4 | Không còn trong tracker hiện hành |
| DEF-058 | Không còn `undefined` trên bài có test case | **OPEN lại trên V2 với bài 0 test case** |
| DEF-035 | Còn traceback/path nội bộ | OPEN |

## Quy tắc evidence

Mỗi evidence mới cần ghi ngày giờ, phiên bản (mô tả + ngày kiểm thử), lệnh hoặc bước chạy, môi trường, kết quả PASS/FAIL/BLOCKED/PENDING và phạm vi kiểm tra.
