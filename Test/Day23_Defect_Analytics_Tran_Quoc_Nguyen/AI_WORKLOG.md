# AI_WORKLOG — Ngày 23

> Ô ghi **(bạn tự điền)** là phần của tester; AI không điền thay.

## 1. Bài toán trước AI

Defect nằm rải rác trong báo cáo, JUnit, workbook và AI_WORKLOG của Ngày 6-22. Chưa có taxonomy chung và chưa biết nguyên nhân gốc nào lặp lại nhiều nhất.

## 2. Công cụ đã dùng

- Claude (Cowork): đọc artefact, gọi API web local qua trình duyệt tích hợp, viết generator và script kiểm chứng.
- Python + openpyxl, Git, GitHub Actions API.
- Kết quả pytest và Node test runner chạy lại ở Ngày 22.

## 3. Chỉ dẫn chính cho AI

1. Bản mô tả yêu cầu Ngày 23: chỉ dùng defect có bằng chứng, phân biệt symptom và root cause, không tự đặt ngày hay người phụ trách.
2. Ba lựa chọn: làm luôn Ngày 23; vào web local kiểm lỗi cũ và tìm lỗi mới; owner/deadline ghi "Chưa xác nhận".
3. (bạn tự điền các điều chỉnh sau khi xem kết quả)

## 4. AI đề xuất gì

Taxonomy 18 category, 13 root cause category, 7 defect kind; 57 defect; Pareto; RCA top 5; 14 prevention action; dashboard dùng công thức COUNTIF thay cho số nhập tay.

## 5. AI sai hoặc chưa đủ ở đâu, kiểm chứng và xử lý

| # | AI làm/đề xuất | Sai hoặc chưa đủ | Kiểm bằng gì | Xử lý |
|---|---|---|---|---|
| 1 | Định đưa 3 lỗi của bản dashboard Ngày 21 vào log | Không còn file ghi lại các lỗi đó | Kiểm đường dẫn evidence | Loại cả 3; chỉ giữ DEF-038 có bằng chứng từ GitHub Actions |
| 2 | Xếp test token Ngày 7 (41/42) là lỗi phân quyền sản phẩm | Test chạy trên API mô phỏng; chạy lại 05/10 cho 42/42 | pytest trong thư mục Day07 | Đổi thành Test Automation, Needs verification |
| 3 | Coi F-D13-06 là defect | Báo cáo gốc ghi mức Info, không có expected result bị vi phạm | Đọc sheet 06_Findings | Không đưa vào log |
| 4 | Đếm 13 case FAIL Ngày 19 thành 13 defect | 10 case cùng hiện tượng, cùng nguyên nhân; đếm 10 lần làm lệch Pareto | Đọc cột Actual Response | Gộp thành DEF-033; 3 case còn lại là 3 defect |
| 5 | Ghi root cause của lỗi forgot-password là thiếu cấu hình SMTP | Chưa xem log BE, mới là giả thuyết | Chỉ có response 500 | Status = Needs verification |
| 6 | Ghi chéo sai mã defect trong ghi chú | Đánh số lại sau khi thêm lỗi | Đọc lại | Đã sửa |
| 7 | Script kiểm chứng báo FAIL ở Pareto | Lỗi của chính script (đọc cả dòng ghi chú như một nguyên nhân) | Đọc output | Sửa script, chạy lại 33/33 |
| 8 | Biểu đồ "theo source day" vẽ sai khi xem bản render | Trục số bị hiểu thành dữ liệu | Xem ảnh render | Bỏ biểu đồ, giữ bảng |
| 9 | Bot Ngày 22 (do AI viết) báo oan lộ secret trên PR #99 của nhóm | Regex không phân biệt biểu thức code với khóa viết cứng | Report run 37287770405 | Ghi thành DEF-057; sửa regex + 2 test ở máy local, chờ PR |
| 10 | Lần 05/10 để DEF-034, DEF-009, DEF-005 là Open dù chưa kiểm lại được | Trạng thái dựa trên báo cáo cũ | Test lại 07/10 (evidence/live_test_2026-10-07.md) | Chuyển 3 lỗi sang Retest; thêm DEF-058; DEF-057 thành Fixed sau PR #101 |
| 11 | Test trực tiếp tạo dữ liệu trong DB local | Không dọn được qua API | Ghi trong evidence mục C | Báo tester để dọn |
| 12 | Đợt 1 ngày 07/10 thấy GET /exercises trả 2 bài rồi coi như Playground chỉ có 2 bài | Giao diện có 12 bài: 10 bài đến từ /authoring/lessons | Test lại qua Chrome của tester (evidence 07/10 mục E), đọc CodePlaygroundPage.tsx | Thêm DEF-059, DEF-060, DEF-061; bổ sung ghi chú 8 defect cũ |
| 13 | Giữ lỗi đã sửa trong log để tính tỷ lệ Fixed | Tester muốn log chỉ còn lỗi đang tồn tại | Chạy lại validator Ngày 11, 12, 13 và pytest Ngày 7 trên cb311b5; mở lại xlsx Ngày 10, docx Ngày 22 | Bỏ 25 lỗi đã hết; 10 lỗi cũ kiểm lại vẫn còn |

## 6. Kiểm chứng độc lập

```text
python tools/build_defect_dashboard.py   ->  36 defects | 14 actions
python tools/verify_defect_dashboard.py  ->  TỔNG: 33/33 PASS (exit code 0)
```

Công thức đã được tính lại bằng LibreOffice và so với số đếm độc lập: 56 tổng, 26 mở, 22 đã sửa/đóng, 7 fixture bug, 1 regression (trước khi thêm DEF-057). Sau khi thêm DEF-057 script đếm lại: 57 tổng, 27 mở hoặc đang sửa; Pareto 8-7-7-7-7-6-5-4-2-1-1-1-1.

**Phần bạn tự làm (bạn tự điền):**

- [ ] Chạy 2 lệnh trên máy mình, dán output.
- [ ] Mở Excel, kiểm số trên Dashboard hiện đúng (Excel tự tính công thức khi mở), bấm thử 3 link "Mở".
- [ ] Chọn 3 defect bất kỳ, mở file evidence và đối chiếu symptom.
- [ ] Tự gọi lại 1 request trong evidence (ví dụ N-02) bằng Postman để xác nhận.

## 7. Quyết định của tester (bạn tự điền)

- Top 5 tôi đồng ý / muốn đổi: ______
- Severity tôi đổi so với đề xuất: ______
- Defect tôi loại khỏi log và lý do: ______
- Owner/deadline đã xin được từ mentor: ______
