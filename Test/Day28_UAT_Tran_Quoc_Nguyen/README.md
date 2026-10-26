# Day 28 - UAT với giảng viên nội bộ

## Mục tiêu

Xác nhận sản phẩm hỗ trợ đúng nhu cầu thực tế của giảng viên thông qua 14 kịch bản UAT bám theo menu Teacher Studio. Kết quả phải dựa trên việc chạy thật và xác nhận thật, không điền giả dữ liệu hoặc chữ ký.

## 14 kịch bản (khớp giao diện giảng viên)

UAT-01 Đăng nhập và cổng Teacher Studio; UAT-02 Tổng quan lớp; UAT-03 Giao bài cho lớp; UAT-04 Soạn Thảo Bài Thi; UAT-05 Xem Các Bài Thi (thư viện); UAT-06 AI Tạo Đề; UAT-07 Quản Lý Cuộc Thi; UAT-08 Bài nộp Lab; UAT-09 Chấm Insight; UAT-10 Xem xét trung thực; UAT-11 Quality & QA Harness; UAT-12 Usability & Age UI; UAT-13 Bảo Mật & Tải; UAT-14 Luồng đầu-cuối giao bài đến xem kết quả.

## File chính

- `Day28_UAT_Pack_Tran_Quoc_Nguyen.xlsx`: kịch bản UAT (sheet `UAT Cases`), tổng quan, defect ưu tiên.
- `Bao_Cao_Ngay_28_Tran_Quoc_Nguyen.docx`: báo cáo bản nháp để cập nhật sau buổi UAT.
- `AI_WORKLOG.md`: bằng chứng sử dụng và kiểm chứng đề xuất của AI.
- `evidence/`: nơi lưu ảnh, log hoặc biên bản thực tế.

## Cách thực hiện

1. Mở sheet `Tong quan`, điền ngày UAT và thông tin giảng viên ở các ô màu vàng.
2. Chạy BE và FE đúng phiên bản cần nghiệm thu; ghi commit hoặc phiên bản sử dụng.
3. Chuẩn bị dữ liệu: giảng viên có lớp và học viên, bài trong ngân hàng, bài nộp Lab/Insight chờ chấm, một cảnh báo integrity (xem cột "Ghi chú chuẩn bị" của từng kịch bản).
4. Cho giảng viên thực hiện lần lượt 14 dòng trong sheet `UAT Cases`.
5. Với mỗi dòng, điền Kết quả thực tế, Issue ID nếu có, phân loại, nhận xét, người xác nhận, kết luận và ngày xác nhận.
6. Mọi lỗi nhập vào sheet `Defects` (severity, Must-fix/Next, owner, deadline, quyết định).
7. Lưu ảnh/log vào `evidence/`. Không đưa dữ liệu nhạy cảm thật vào bằng chứng.
8. Cập nhật Word bằng kết quả thực tế rồi xin giảng viên xác nhận.

## Điều kiện hoàn thành

- Đã chạy đủ 14 kịch bản hoặc giải thích rõ kịch bản Not Run.
- Kết luận dựa trên scenario, không dựa trên cảm tính.
- Mọi issue Critical/High có quyết định Must-fix/Next và người phụ trách.
- Có ghi hạn chế mẫu (ví dụ chỉ có 01 giảng viên nội bộ).
- Có xác nhận thực tế; không tạo chữ ký giả.
