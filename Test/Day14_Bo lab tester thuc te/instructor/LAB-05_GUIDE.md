# Instructor Guide — LAB-05 Project & Task API

## Chuẩn bị

- Kiểm tra truy cập: https://jiranew.cybersoft.edu.vn/swagger/index.html
- Không phát `fixtures/manifest.json` hoặc tài liệu instructor cho học viên trước khi nộp.
- Reset fixture: `node fixtures/reset.mjs --mode buggy --lab LAB-05`.

## Đáp án định hướng

- Controlled fault: `F-D14-005`.
- Quy tắc đúng: Sửa/xóa phải kiểm quyền sở hữu tài nguyên.
- Finding demo tham chiếu: RF-010 (CANDIDATE; không thử trên dữ liệu người khác).
- Finding demo chỉ được chấm là bug khi học viên có bước tái hiện và evidence ở thời điểm chạy.

## Rubric 10 điểm

| Tiêu chí | Điểm |
|---|---:|
| Phạm vi và test design phù hợp | 2 |
| Actual/Expected dựa trên Swagger, UI hoặc rule đã nêu | 2 |
| Evidence tái hiện được | 2 |
| Phân loại severity/result hợp lý | 2 |
| Cleanup/reset và giải thích kết quả | 2 |

## Reset và nghiệm thu

1. Chạy `node fixtures/reset.mjs --mode clean --lab LAB-05`; fault phải biến mất.
2. Chạy lại `--mode buggy`; fault phải xuất hiện trở lại.
3. Kiểm tra học viên đã dọn dữ liệu demo của chính mình.
4. Chỉ chuyển READY/VERIFIED sau pilot thủ công và lưu evidence.
