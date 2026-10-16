# AI_WORKLOG - Day 28

## Bài toán trước khi dùng AI

Chuẩn bị bộ UAT Ngày 28 cho CyberSoft Learning Hub. Bản đầu có 8 kịch bản chung; tester yêu cầu làm lại thành 14 kịch bản bám đúng giao diện Teacher Studio.

## Công cụ đã dùng

- Codex: đề xuất cấu trúc, 8 kịch bản đầu và bản nháp tài liệu.
- Claude: duyệt thật các mục menu giảng viên trên web local (Chrome) và viết lại 14 kịch bản theo nhãn, tab, nút có trên giao diện.
- Excel/Word: người thực hiện xem lại, chỉnh sửa và ghi kết quả thật.

## Chỉ dẫn chính

Chuẩn bị 14 kịch bản UAT cho phù hợp với giao diện bên giảng viên.

## AI đề xuất

- 14 kịch bản theo menu: Lớp của tôi (Tổng quan lớp, Giao bài), Soạn Thảo Bài Thi, Xem Các Bài Thi, AI Tạo Đề, Quản Lý Cuộc Thi, Bài nộp Lab, Chấm Insight, Xem xét trung thực, Quality & QA Harness, Usability & Age UI, Bảo Mật & Tải, luồng đầu-cuối.
- Cột "Ghi chú chuẩn bị" ghi điều quan sát được khi duyệt giao diện (không phải kết luận UAT).
- Hai defect ứng viên cần xác minh: AI Tạo Đề ở chế độ Stub (đề lệch mục tiêu, lời giải 0/4 test) và số đếm không khớp ở thư viện bài (Tất cả 64 so với Lập trình 47 + Trắc nghiệm 0; Published 62 + Draft 0).

## Quyết định của tester

- Không ghi giả kết quả hoặc chữ ký giảng viên; các ô kết quả thực tế, nhận xét, kết luận và xác nhận để trống đến khi chạy thật.
- Mục Tester Lab trong menu không đưa vào UAT vì dành cho tester, không phải nghiệp vụ giảng viên.
- Tester phải chạy checklist độc lập và lưu bằng chứng vào `evidence/`.

## Cần cập nhật sau buổi UAT

- Ngày chạy, commit/phiên bản và môi trường.
- Kết quả từng scenario và bằng chứng.
- Danh sách defect, owner, deadline và quyết định.
- Điểm AI đề xuất sai/chưa đủ và phần tester đã sửa.
- Xác nhận thực tế của giảng viên.
