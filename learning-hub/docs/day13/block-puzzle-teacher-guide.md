# Teacher Guide — Bộ 15 bài Block Puzzle (lớp 3-5)

## 1. Mục tiêu sư phạm

Bộ bài hướng tới giúp học sinh 7-10 tuổi (lớp 3-5) làm quen với 3 khái niệm nền tảng của tư duy máy tính (computational thinking), không yêu cầu gõ code:

| Khái niệm | Học sinh học được gì | Số bài |
|---|---|---|
| **Sequence** (tuần tự) | Máy tính chỉ làm đúng những gì được yêu cầu, theo đúng thứ tự đã sắp xếp | Bài 1-5 |
| **Loop** (vòng lặp) | Một nhóm hành động lặp lại có thể rút gọn bằng 1 lệnh "lặp lại N lần" | Bài 6-10 |
| **Condition** (điều kiện) | Máy tính có thể phản ứng khác nhau tuỳ tình huống ("nếu...thì...") | Bài 11-15 |

Học sinh tương tác bằng cách kéo-thả khối lệnh có sẵn (Đi tới, Rẽ trái/phải, Lặp lại N lần, Nếu phía trước có chướng ngại vật) để dẫn một chú Robot đi tới đích trên lưới ô vuông, tránh chướng ngại vật.

Từ bài 6 trở đi, khối "Lặp lại N lần" và "Nếu phía trước có chướng ngại vật" có thể chứa các khối khác bên trong nó — học sinh kéo khối con vào đúng khung nhỏ bên trong 2 khối này (giống cách xếp đồ vào 1 cái hộp), giúp diễn đạt được các quy tắc lặp lại/điều kiện phức tạp hơn mà không cần lặp lại nhiều lần từng bước riêng lẻ.

## 2. Cách truy cập

Học sinh vào mục "🧩 Block Puzzle" trên thanh điều hướng của Learning Hub (`/block-puzzle`). Danh sách 15 bài hiện ở thanh chọn bài phía trên khu vực chơi, đánh số 1-15 theo đúng thứ tự độ khó tăng dần.

Các bài được mở khoá tuần tự: hoàn thành đúng (Robot tới đích) bài N mới mở được bài N+1, đánh dấu 🔒 là bài chưa mở, ✅ là bài đã hoàn thành. Bài 1 luôn mở sẵn. Tiến độ lưu trên trình duyệt đang dùng — nếu học sinh đổi sang máy/trình duyệt khác, tiến độ sẽ không theo sang.

## 3. Gợi ý thời lượng sử dụng trong lớp học

| Buổi học | Bài gợi ý | Thời lượng gợi ý |
|---|---|---|
| Buổi 1 | Bài 1-3 (Sequence cơ bản) | 20-25 phút |
| Buổi 2 | Bài 4-5 (Sequence có chướng ngại vật) | 20-25 phút |
| Buổi 3 | Bài 6-8 (Loop cơ bản) | 25-30 phút |
| Buổi 4 | Bài 9-10 (Loop nâng cao) | 25-30 phút |
| Buổi 5 | Bài 11-13 (Condition cơ bản) | 30 phút |
| Buổi 6 | Bài 14-15 (Thử thách tổng hợp) | 30-35 phút |

Đây là đề xuất tham khảo, không bắt buộc — giáo viên có thể điều chỉnh tuỳ tốc độ tiếp thu thực tế của lớp. Mỗi bài có 1 mục tiêu học tập (xem `learningOutcome` của từng bài); nên tránh gộp nhiều mục tiêu trong 1 buổi.

## 4. Cách hỗ trợ học sinh khi gặp khó khăn

Mỗi bài có 3 mức gợi ý, học sinh tự bấm xem khi cần (không tự động hiện):
1. **Gợi ý 1 — Khái niệm**: nhắc lại cách dùng khối lệnh liên quan, không tiết lộ đáp án.
2. **Gợi ý 2 — Chiến lược**: gợi ý cách chia nhỏ bài toán hoặc hướng đi.
3. **Gợi ý 3 — Gần đáp án**: gợi ý gần với lời giải cụ thể, học sinh vẫn phải tự kéo-thả để hoàn thành.

Giáo viên có thể khuyến khích học sinh tự thử vài lần trước khi mở Gợi ý 2, và cân nhắc để Gợi ý 3 cho lúc học sinh thực sự bế tắc — mục đích là để các em có cơ hội tự trải nghiệm quá trình thử — sai — sửa.

## 5. Những điểm cần giáo viên nội bộ xem lại trước khi dùng

- Độ khó tăng dần qua từng bài có phù hợp với tốc độ tiếp thu thực tế của học sinh lớp 3 (nhỏ tuổi nhất trong nhóm) hay chưa.
- Câu chữ (câu chuyện dẫn dắt, tên khối lệnh, thông báo kết quả) có dùng từ ngữ phù hợp lứa tuổi 7-10 hay chưa.
- Số bước tối đa mỗi bài (`maxBlocks`) có phù hợp với khả năng tập trung của học sinh hay chưa — có thể cần điều chỉnh giảm/tăng tuỳ lớp.
- Các thông báo phản hồi khi đúng/sai hiện đang dùng giọng nhẹ nhàng, khuyến khích thử lại — giáo viên xem lại có cần chỉnh sửa cho phù hợp văn hoá/độ tuổi lớp mình không.

## 6. Cách đọc rubric

Xem file `block-puzzle-answer-rubric.md` — mỗi bài có 1 lời giải mẫu hợp lệ (không phải lời giải duy nhất) và tiêu chí chấm theo 3 mức: Đạt, Khá, Giỏi.
