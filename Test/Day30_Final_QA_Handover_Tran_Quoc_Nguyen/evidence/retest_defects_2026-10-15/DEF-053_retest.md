# Retest DEF-053 - dữ liệu Quiz (15/10/2026, khoảng 14:39-14:40 UTC)

- **Người chạy:** Claude theo yêu cầu tester. Giao diện đọc ở `http://127.0.0.1:4173/quiz` (FE preview); API gọi cùng origin từ tab `http://localhost:3000` bằng trình duyệt tích hợp của Claude desktop.
- **Tài khoản:** `student@gmail.com` (tài khoản mẫu, xem RISK-06). Mật khẩu/token không ghi ở đây.
- **Môi trường:** BE health `status ok, mongo connected` (14:39:11 UTC). Repo `D:\thuctap\clone\cybersoft-learning-hub`, HEAD `d804c49`.
- **Kiểm tra bổ sung:** phần API được kiểm trước; tester sau đó đã chạy lại luồng trên Chrome và bổ sung ảnh giao diện cho Python, HTML5 và CSS3 trong cùng thư mục evidence.

## Kết quả

| Kiểm tra | Expected | Actual | Kết quả |
|---|---|---|---|
| Thẻ đề trên `/quiz` | Ghi số câu | Python, HTML5, CSS3 đều ghi "20 câu hỏi / 30 phút" | — |
| Bắt đầu đề Python | Mở được, có câu hỏi, không báo "Không tìm thấy câu hỏi" | 201, **20 câu**, tất cả category Python, 1800 giây | PASS |
| Bắt đầu đề HTML5 | Số câu khớp thẻ | 201, **20 câu**, tất cả HTML5, 1800 giây | PASS |
| Bắt đầu đề CSS3 | Số câu khớp thẻ | 201, **20 câu**, tất cả CSS3, 1800 giây | PASS |
| Nộp đề HTML5 (trả lời đủ 20 câu) | Nộp thành công | 201 "Nộp bài thi và chấm điểm thành công!", GRADED 60/200 | PASS |
| Xem kết quả | Trả 20 câu kèm điểm | 200, GRADED, 60/200, 20 câu | PASS |

**Kết luận DEF-053: RETEST PASS → RESOLVED.** API và UI xác nhận dữ liệu đã đủ 20 câu cho cả 3 đề; các luồng nộp và xem kết quả hoạt động. Nguyên nhân cũ là DB local seed thiếu; DB hiện đã seed lại.

## Evidence giao diện bổ sung

- `DEF-053-04-ket-qua-nop-quiz.png`: kết quả đề Python, trạng thái GRADED, đủ 20 câu.
- `DEF-053-05-html5-cau-1-tren-20.png`: đề HTML5 hiển thị Câu 1/20 và danh sách đủ 20 câu.
- `DEF-053-06-html5-ket-qua-20-cau.png`: kết quả HTML5, trạng thái GRADED, đủ 20 câu.
- `DEF-053-07-css3-cau-1-tren-20.png`: đề CSS3 hiển thị Câu 1/20 và danh sách đủ 20 câu.
- `DEF-053-08-css3-ket-qua-20-cau.png`: kết quả CSS3, trạng thái GRADED, đủ 20 câu.

## Quan sát mới (cần xác minh, chưa ghi thành defect)

Lần nộp đầu tiên của đề HTML5 trả **400** và review lượt đó ghi `EXPIRED, 0/200`, dù vừa bấm bắt đầu. Hai lần sau (tạo lượt mới) nộp bình thường. Dữ liệu cho thấy `POST /quiz/start` **trả lại lượt cũ còn IN_PROGRESS** nếu học viên đã có (lượt CSS3 lần 2 có `startedAt` của lần 1). Giả thuyết: lần đầu API trả lại một lượt HTML5 cũ đã quá 30 phút, nên nộp bị từ chối do hết giờ, nhưng giao diện vẫn cho làm. Cần tái hiện: bắt đầu đề, chờ quá 30 phút không nộp, bắt đầu lại cùng đề, rồi nộp.

## Dữ liệu test tạo thêm (student@gmail.com)

Khoảng 6 lượt quiz (Python, HTML5, CSS3), trong đó 3 lượt đã nộp/chấm, phần còn lại đang IN_PROGRESS.
