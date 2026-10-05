# Ngày 11: Cuộc thi — Quản lý cuộc thi mới và chống gian lận

## Quản lý cuộc thi mới (giảng viên)

- **Danh sách:** lọc theo giai đoạn (đang diễn ra, sắp diễn ra, đã kết thúc, nháp). Mỗi dòng hiện số đề trắc nghiệm, số bài code, tổng điểm và số đăng ký.
- **Tạo/sửa 3 bước:** Thông tin → Đề thi → Giám sát & xuất bản.
  - Có lưu nháp ở mọi bước.
  - Đổi giờ bắt đầu thì giờ kết thúc đi theo.
  - Có câu giải thích dễ hiểu về khung giờ và thời lượng cá nhân.
- **Đề thi phối hợp:** chọn câu hỏi từ ngân hàng (ghép thành một phần trắc nghiệm), bài Code Playground, hoặc bài tự soạn. Sửa điểm từng đề, đổi thứ tự, xóa đề.
- **Kết quả:** bảng theo thí sinh (trạng thái, điểm từng đề, tổng), xuất CSV, nút xem xét trung thực.

## Chống gian lận trong cuộc thi

- Có thể bật hoặc tắt cho từng cuộc thi, mặc định bật.
- Học viên thấy thông báo ngay trong cửa sổ trước khi vào thi và trong phòng thi.
- Ghi nhận thời gian làm bài, số lần rời màn hình và độ giống nhau của code giữa các thí sinh trong cùng đề.
- Không tự trừ điểm, không hủy bài, không kết luận. Bài có dấu hiệu chỉ vào danh sách "Cần xem xét", giảng viên đối chiếu hai đoạn code và ghi kết luận kèm lý do.
- Dùng chung modal xem xét với trang xem xét của Playground.
- Kiểm thử thật: học viên B chép bài A (đổi tên biến, thêm chú thích) bị gắn cờ 86%. Học viên C làm khác và chuyển tab 2 lần không bị gắn cờ.
- Đã thêm lắng nghe `blur`/`focus` cho cả Playground và cuộc thi. Nhờ vậy việc chuyển sang cửa sổ ứng dụng khác khi trình duyệt vẫn hiện cũng được ghi.
