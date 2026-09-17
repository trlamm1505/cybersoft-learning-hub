# AI Work Log — Ngày 13: Bộ bài tập Block Puzzle cho lớp 3-5

| | |
|---|---|
| **Người thực hiện** | Dương Chí Việt |
| **Ngày** | 2026-09-17 |
| **Nhánh** | `feature/learning-hub-day13` |
| **Công cụ** | Claude Code (CLI, VSCode extension), model Claude Sonnet 5 |
| **Phạm vi quyền** | Đọc/ghi trong `learning-hub/`; chạy build/test/dev server; seed & truy vấn MongoDB; gọi API thật để kiểm chứng. Không đụng `Test/`, `Data-AI-Resource/` |

---

## Tóm tắt 1 dòng mỗi việc

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Thiết kế + tích hợp 15 bài Block Puzzle (kéo-thả khối lệnh, không gõ code) | ✅ Xong |
| 2 | Sửa bug thứ tự bài hiển thị ngược (bài dễ nhất hiện số 15) | ✅ Xong |
| 3 | Thêm khóa tuần tự "ải" — phải qua bài trước mới mở bài sau | ✅ Xong |
| 4 | Thêm hiệu ứng animation từng bước + va chạm rõ ràng khi đâm tường/cây | ✅ Xong |
| 5 | Nâng cấp engine hỗ trợ khối lồng nhau (nested), thiết kế lại 5 bài để ép buộc đúng khái niệm | ✅ Xong |
| 6 | Sửa bug không nhét được khối vào bên trong "Lặp lại" | ✅ Xong |
| 7 | Viết Teacher Guide + Answer/Rubric | ✅ Xong |

---

## Việc 1 — Thiết kế 15 bài + tích hợp vào app

### Prompt gốc của người dùng
> "NGÀY 13 - Bộ bài tập cho lớp 3-5 [...] Việc phải làm: Thiết kế 15 bài sequence, loop, condition theo câu chuyện. Không yêu cầu gõ code dài. Tạo hình minh họa/fixture đơn giản và rubric."

Khi hỏi hình thức tương tác, người dùng chọn: **"Kéo-thả khối lệnh theo thứ tự"** (kiểu Scratch/Blockly đơn giản hóa) và xác nhận làm cả tài liệu lẫn tích hợp thật vào app, không chỉ UI cho học sinh chơi (không cần UI cho giáo viên tự tạo bài mới).

### Đã làm

**Backend** — mở rộng loại bài học hiện có (`Lesson`) để chứa được kiểu "Block Puzzle": thêm cấu hình lưới, vị trí xuất phát/đích, chướng ngại vật, danh sách khối lệnh được phép dùng, giới hạn số khối tối đa. Viết 15 bài mẫu theo câu chuyện "dẫn Robot về nhà/nhặt sao/thông minh né chướng ngại vật", chia đều 5-5-5 theo 3 khái niệm sequence/loop/condition, độ khó tăng dần.

**Frontend** — trang chơi mới (kéo khối từ hộp công cụ, thả vào khung xếp lệnh theo thứ tự, bấm "Chạy Thử" xem Robot di chuyển trên lưới, có 3 mức gợi ý bấm xem dần). Thêm mục điều hướng mới trên thanh menu.

### Lỗi tự phát hiện khi viết code

| Lỗi | Nguyên nhân | Đã sửa |
|---|---|---|
| Trang danh sách bài hiện sai — bài đầu tiên trả về cuối danh sách | Hệ thống bài học có sẵn sắp xếp theo "mới tạo trước", mà 15 bài được tạo lần lượt từ bài 1 đến 15 nên bài 15 luôn "mới nhất" | Thêm số thứ tự riêng cho mỗi bài, luôn sắp xếp lại đúng thứ tự đó ở màn hình học sinh, không dựa vào thứ tự trả về từ server |

---

## Việc 2 — Bug thứ tự bài hiển thị ngược

### Prompt gốc của người dùng
> "sắp xếp thứ tự hình như bị sai -> nên khó tới dễ tự nhiên giờ bài dễ nhất là bài số 15, thứ 2 là xóa cái cột cuộn đi thấy nó bị lạc quẻ quá, 3. sửa lại nội dung doc cho phù hợp đúng, tránh từ ngữ ko phù hợp hoặc tự cao, 4. làm hướng dẫn chơi nữa vì đây cho k3-5"

### Đã làm
- Thêm số thứ tự cố định cho từng bài, đảm bảo màn hình luôn hiện đúng 1→15 dù dữ liệu trả về từ server không theo thứ tự đó.
- Bỏ cột danh sách bài riêng biệt bên cạnh (gây cảm giác tách rời), thay bằng thanh chọn số bài nhỏ gọn ngay phía trên khu vực chơi.
- Rà lại toàn bộ câu chữ trong 2 tài liệu hướng dẫn, bỏ các câu khẳng định kiểu tự khen, chuyển thành liệt kê trung lập để giáo viên tự đánh giá.
- Thêm hộp hướng dẫn cách chơi bằng hình ảnh/icon lớn, hiện tự động lần đầu vào trang, có nút bấm xem lại.

### Lỗi tự phát hiện: sau khi thêm số thứ tự, vẫn hiện sai lần đầu

Sau khi sửa, người dùng vẫn thấy bài "Đường Thẳng" (đáng lẽ dễ nhất) hiện đè lên bởi bài số 15. Kiểm tra kỹ thì phát hiện thêm 1 lỗi khác: giá trị "bài đang chọn" được lấy ngay lúc mở trang, nhưng lúc đó dữ liệu 15 bài chưa tải xong từ server (đang là danh sách rỗng), nên giá trị này bị kẹt ở trạng thái ban đầu (rỗng) và không tự cập nhật lại khi dữ liệu thật đã có — sửa bằng cách theo dõi lại khi dữ liệu thay đổi, tự chọn về đúng bài đầu tiên nếu giá trị hiện tại không hợp lệ.

---

## Việc 3 — Khóa tuần tự "ải"

### Prompt gốc của người dùng
> "thứ 2 thêm khóa tuần tự (phải qua ải trước mới qua ải sau)" *(diễn giải lại ý — trích từ yêu cầu gốc: "thêm ràng buộc xong bài 1 thì mới qua bài 2 ghi ải 1 ải 2 đi chứ bài 1 hơi kỳ")*

### Đã làm
Bài 1 luôn mở sẵn. Phải hoàn thành đúng (Robot tới đích) bài N mới mở được bài N+1 — đánh dấu khóa 🔒 cho bài chưa mở, không bấm chọn được; đánh dấu ✅ cho bài đã qua. Tiến độ lưu trên trình duyệt đang dùng. Khi thắng 1 bài, hiện thông báo rõ "đã mở khóa bài tiếp theo" kèm nút bấm chuyển sang bài kế (không tự động chuyển ngay, để học sinh có thời gian đọc thông báo mừng).

---

## Việc 4 — Hiệu ứng animation & va chạm

### Prompt gốc của người dùng
> "hay làm kiểu ấn chạy thử thì cho trẻ thấy mũi tên di chuyển theo khối xếp luôn đụng tường hoặc ko đúng thì hiện thua" và sau đó: "1. cho chèn giữa các khối hiện tại muốn chèn phải xóa đặt lại, thứ 2 thêm hiệu ứng đập tường hoặc đụng gốc cây"

### Đã làm
- Khi bấm "Chạy Thử", Robot di chuyển từng bước có hoạt ảnh trên lưới (không chỉ hiện kết quả cuối ngay lập tức) — mũi tên xoay đúng theo hướng đang đi.
- Nếu đâm chướng ngại vật hoặc đâm tường, animation dừng đúng tại vị trí đó, có hiệu ứng rung lắc + đổi hình thành biểu tượng va chạm.
- Cho phép chèn khối lệnh vào giữa chuỗi đã xếp (không cần xóa xếp lại từ đầu) — kéo khối vào đúng khoảng trống mong muốn giữa 2 khối bất kỳ.

---

## Việc 5 — Rà soát độ khó, phát hiện lỗi thiết kế sâu, nâng cấp engine

### Prompt gốc của người dùng
> "kiểm tra lại 15 bài thiết kế sao cho tối thiểu khối được xếp (để tôi ưu độ khó chứ nhiều ô đặt đi đường vòng thì cũng như k, ko phát triển tư duy được)"

### Phát hiện quan trọng nhất trong buổi

Khi viết công cụ kiểm tra độc lập (không tin vào thiết kế ban đầu, tự chạy lại bằng thuật toán tìm đường đi ngắn nhất), phát hiện: **5 trên 15 bài không thực sự ép buộc dùng đúng khái niệm** — học sinh có thể giải bằng cách liệt kê từng bước thủ công, không cần dùng "Lặp lại" hay "Nếu...thì..." mà vẫn nằm trong giới hạn số khối cho phép.

Đào sâu hơn phát hiện nguyên nhân gốc: khối "Lặp lại" trong hệ thống trước đó chỉ có thể lặp lại đúng 1 hành động "Đi tới" cố định, không thể chứa nhiều khối khác bên trong nó. Nhưng gợi ý mẫu của 1 số bài lại mô tả cách giải "Lặp lại N lần, bên trong có Nếu...thì... và Đi tới" — **cách giải này không thể thực hiện được thật** trên hệ thống lúc đó.

### Quyết định của người dùng
Nâng cấp hệ thống để khối "Lặp lại"/"Nếu...thì..." có thể chứa nhiều khối bên trong (giới hạn 1 tầng, không lồng "Lặp lại" trong "Lặp lại"), rồi thiết kế lại các bài có vấn đề.

### Đã làm
- Nâng cấp cách xử lý để 2 khối trên có thể chứa nhóm khối con bên trong, và khối "Nếu...thì..." giờ **thật sự kiểm tra điều kiện** trước khi quyết định có chạy nhóm khối con hay không (trước đó luôn bỏ qua, không kiểm tra gì).
- Thiết kế lại 5 bài: 2 bài (hình vuông, hình chữ nhật) đổi cách xếp cho khớp khả năng mới; 1 bài (làm quen điều kiện) đổi mục tiêu thành "làm quen cách viết", không ép tối ưu số khối ở bài giới thiệu khái niệm mới; 3 bài mê cung đổi thành dạng "hành lang dài có nhiều chướng ngại vật cách đều nhau" để cách giải dùng đúng khái niệm rút ngắn được rõ ràng (tiết kiệm 1.5 đến 2.6 lần số khối so với liệt kê thủ công) — thay cho thiết kế cũ dùng vật cản rải rác không đều, không ép buộc được gì.

### Lỗi tự phát hiện khi tính lại tay các bài mới (rất nhiều lần)

Đây là phần tốn nhiều công sức nhất trong buổi: khi tự tính bằng tay đường đi né chướng ngại vật cho các bài mới, sai liên tiếp 4-5 lần trước khi ra đúng — mỗi lần sai đều tự phát hiện bằng cách viết lại chương trình mô phỏng đúng theo logic thật của hệ thống (không tin vào tính nhẩm), chạy thử và đọc kết quả từng bước.

| Lần sai | Vì sao sai | Cách phát hiện |
|---|---|---|
| Đường né vật cản chỉ đi vòng 1 ô sang bên | Không đủ để vượt qua hẳn cột có vật cản trước khi quay lại đường cũ, dẫn tới đâm ngay vào chính vật cản đó khi quay xuống | Chạy mô phỏng từng bước, thấy rõ vị trí đâm vào đúng ô vật cản |
| Sau khi né xong 1 lần, robot vẫn chạy thêm 1 bước "đi tới" thừa ở ngoài | Thiết kế "kiểm tra rồi né, xong luôn đi tới thêm 1 bước" chỉ đúng khi *không* né; khi *có* né thì bước né đã tự bao gồm việc tiến lên rồi, thêm 1 bước nữa là dư và có thể đâm luôn vào vật cản kế tiếp | Chạy mô phỏng thấy robot đâm vào vật cản dù đường đi tưởng đã đúng |
| Số lần lặp lại đặt dư hoặc thiếu so với độ dài đường đi thật | Tính nhẩm khoảng cách sai — không đếm đúng số ô cần đi qua | Viết chương trình dò tìm đúng số lần lặp cần thiết bằng cách thử tăng dần, so với kết quả tính tay |

### Kiểm chứng độc lập cuối cùng
Viết lại toàn bộ 15 lời giải mẫu thành chương trình, mô phỏng đúng chính xác theo logic hệ thống đang chạy thật (không phải logic cũ, không phải tính nhẩm), chạy kiểm tra trên dữ liệu thật lấy trực tiếp từ máy chủ (không phải file nguồn) — xác nhận cả 15 bài đều giải được đúng trong giới hạn số khối quy định.

---

## Việc 6 — Bug không nhét được khối vào bên trong "Lặp lại"

### Prompt gốc của người dùng
> "cái vòng lặp ko nhét khối vào trong được"

### Nguyên nhân
Khu vực thả khối bên trong "Lặp lại"/"Nếu...thì..." được chia thành nhiều vùng nhỏ xen kẽ (để chèn đúng vị trí mong muốn) nằm lồng trong 1 vùng lớn hơn. Khi thả không trúng chính xác vào 1 vùng nhỏ cụ thể (rất dễ xảy ra vì các vùng đó rất mảnh), hệ thống không có xử lý cho trường hợp này — thao tác bị lạc mất, khối lại rơi vào cuối danh sách bên ngoài thay vì vào trong.

### Đã sửa
Thêm xử lý: nếu thả vào vùng lớn bên trong 1 khối "Lặp lại"/"Nếu...thì..." mà không trúng đúng 1 vùng nhỏ cụ thể, khối mới vẫn được thêm vào cuối danh sách bên trong khối đó (không còn bị lạc ra ngoài).

---

## Việc 7 — Tài liệu bàn giao

- **Teacher Guide** (`docs/day13/block-puzzle-teacher-guide.md`): mục tiêu sư phạm theo từng nhóm 5 bài, cách truy cập, gợi ý thời lượng theo buổi học, cách dùng 3 mức gợi ý, các điểm cần giáo viên nội bộ xem lại (độ khó, câu chữ, giới hạn số khối có phù hợp lứa tuổi hay chưa).
- **Answer Key & Rubric** (`docs/day13/block-puzzle-answer-rubric.md`): lời giải mẫu đã kiểm chứng chạy thật cho cả 15 bài, rubric chấm theo 3 mức (Đạt/Khá/Giỏi), ghi rõ số khối tối thiểu và mức chênh lệch so với cách giải thủ công để giáo viên đánh giá học sinh có thực sự dùng đúng khái niệm hay chỉ "đi vòng" cho có kết quả.

---

## Đánh giá độ tin cậy của AI trong buổi làm việc

Phần thiết kế khung ban đầu (chọn cách chia 3 nhóm khái niệm, chọn hình thức kéo-thả, cấu trúc lưu dữ liệu 1 bài) làm đúng ngay từ đầu và có thể tin theo lý luận logic thuần.

Nhưng phần quan trọng nhất của buổi — kiểm tra xem 15 bài có thực sự dạy đúng khái niệm hay không — chỉ phát hiện được bằng cách tự viết công cụ kiểm tra độc lập, không thể tin vào cảm giác "bài này trông có vẻ hợp lý" khi thiết kế ban đầu. Cụ thể: 5/15 bài ban đầu tưởng đúng nhưng thực chất không ép buộc gì cả; và ngay cả sau khi biết vấn đề, việc tính tay lời giải mới cũng sai liên tiếp nhiều lần — mỗi lần chỉ phát hiện được bằng cách chạy lại đúng logic hệ thống thật, không phải bằng cách đọc lại và tính nhẩm cẩn thận hơn.

Bài học rút ra: với loại bài toán "thiết kế độ khó" (không phải chỉ đúng/sai code), việc tự nhận "đã kiểm tra kỹ" là không đủ tin cậy nếu không có 1 công cụ độc lập chạy lại đúng luật chơi thật để xác nhận — con người (kể cả AI) rất dễ tính sai khi làm bằng tay các bài toán về đường đi/hướng di chuyển, dù đã cẩn thận.
