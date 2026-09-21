# AI Work Log — Ngày 15: Bộ 15 bài luyện thi thuật toán lớp 10-12

| | |
|---|---|
| **Người thực hiện** | Dương Chí Việt |
| **Ngày** | 2026-09-21 |
| **Nhánh** | `feature/learning-hub-day15` |
| **Công cụ** | Claude Code (CLI, VSCode extension), model Claude Sonnet 5 |
| **Phạm vi quyền** | Đọc/ghi trong `learning-hub/`; tạo branch mới từ `main`; chạy build/typecheck/seed/dev server thật; gọi API thật qua judge pipeline để kiểm chứng; seed dữ liệu vào MongoDB local (`localhost:27017/cybersoft`, đã xác nhận với người dùng trước khi chạy vì có bước xóa collection cũ). |

---

## Tóm tắt 1 dòng mỗi việc

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Tạo branch `feature/learning-hub-day15`, kéo `main` xuống, đổi tên nhánh cho đúng convention | Xong |
| 2 | Thiết kế 15 bài thuật toán (5 nhóm x 3 bài: Complexity, Sorting, Binary Search, Greedy, Graph/DP cơ bản), 73 test case | Xong |
| 3 | Kiểm chứng độc lập bằng script Python — xác nhận naive O(N^2) thực sự TLE, không chỉ suy luận lý thuyết | Xong |
| 4 | Viết Editorials, Teacher Guide, Complexity Rubric cho 15 bài | Xong |
| 5 | Sửa lỗi hiển thị: đổi label "Lớp 9-12" thành "Lớp 10-12" cho khớp giá trị gradeBand FE đang dùng | Xong |
| 6 | Chạy qua đúng judge pipeline thật — phát hiện và sửa bug runtime `import sys` bị chặn ở bài Đếm nghịch thế | Xong |
| 7 | Phát hiện và sửa bug thiết kế test case: hidden test bài Gộp khoảng thời gian vượt giới hạn 64KB output của judge | Xong |
| 8 | Viết file đáp án riêng cho bộ 15 bài (`docs/day15/answers.md`) | Xong |
| 9 | Rà soát lại bộ 20 bài lớp 6-9 (ngày 14): thêm import còn thiếu vào starterCode, sửa hint2 bị vỡ định dạng, viết lại hint3 từ lộ nguyên đáp án thành khung code có TODO | Xong |
| 10 | Viết file đáp án cho bộ 20 bài ngày 14 (`docs/day14/answers.md`) | Xong |
| 11 | Phát hiện và sửa bug khóa tầng gợi ý: bấm thẳng được Tầng 3 mà không cần mở Tầng 1, Tầng 2 trước | Xong |
| 12 | Thêm hiệu ứng hoàn thành khóa (modal chúc mừng, đếm ngược, tự chuyển trang) và nút Bài tiếp theo | Xong |
| 13 | Thêm scrollbar mỏng theo theme, thay cho thanh cuộn mặc định của hệ điều hành | Xong |
| 14 | Phát hiện và sửa bug Block Puzzle (lớp 3-5, ngày 13): khối Lặp lại và Nếu...thì không lồng được vào nhau dù khác loại | Xong |
| 15 | Viết file đáp án cho Block Puzzle (`docs/day13/answers.md`), kiểm chứng lại 15 màn chơi bằng mô phỏng độc lập | Xong |
| 16 | Chia 5 commit theo chủ đề, push lên `feature/learning-hub-day15` | Xong |

---

## Việc 1 — Tạo branch, kéo main, đổi tên cho đúng convention

### Prompt gốc của người dùng
Yêu cầu tạo nhánh làm việc cho ngày 15 và cập nhật từ nhánh `main` mới nhất, tương tự cách đã làm ở ngày 14.

### Đã làm
Tạo branch từ `origin/main` mới nhất. Khi người dùng chỉ ra tên nhánh không khớp convention (phải là `feature/learning-hub-day15` như ngày 14), đổi tên lại bằng `git branch -m`.

---

## Việc 2 — Thiết kế 15 bài thuật toán, 73 test case

### Prompt gốc của người dùng
Yêu cầu triển khai nhiệm vụ ngày 15 theo đề bài đã cho: soạn 15 bài luyện thi thuật toán cho lớp 10-12, thuộc các chủ đề complexity, sorting, binary search, greedy và graph/DP cơ bản; viết constraint buộc đúng độ phức tạp; xây dựng editorial nhiều hướng giải; bàn giao gói bài kèm official solutions và complexity rubric.

### Đã làm
Viết `BE/src/data/initial-exercises-day15.ts`: 15 bài chia 5 nhóm (Complexity, Sorting, Binary Search, Greedy, Graph/DP cơ bản), mỗi bài có `starterCode`, `solutionCode`, `testCases`, `tags`, `prerequisiteSlug` nối thành 1 chuỗi tiến trình.

Với mỗi bài, thiết kế ít nhất 1 hidden test case có N/S nằm ở biên constraint, để lời giải sai độ phức tạp mục tiêu bị chặn bởi `timeLimitMs`.

---

## Việc 3 — Kiểm chứng độc lập, xác nhận TLE thật chứ không chỉ suy luận

### Prompt gốc của người dùng
Điều kiện nghiệm thu của đề bài yêu cầu có test phân biệt được lời giải chậm, chạy test/checklist độc lập với kết luận của AI, đính kèm lệnh chạy và kết quả — không chấp nhận chỉ suy luận độ phức tạp trên giấy.

### Đã làm
Viết script Python tự chạy `solutionCode` qua toàn bộ 73 test case bằng `subprocess`, so sánh output thật với `expectedOutput`. Phát hiện và tự sửa 2 lỗi trong lúc soạn test (một lỗi tính tay expectedOutput sai ở bài trộn dãy, một lỗi kỳ vọng khoảng cách sai ở bài BFS lưới) trước khi seed vào hệ thống.

Với 4 bài có bẫy độ phức tạp thuần túy (naive vẫn ra đúng đáp số, chỉ chậm), viết thêm script riêng chạy naive solution qua `subprocess.run(..., timeout=timeLimitMs/1000)` trên đúng input của hidden test lớn nhất, xác nhận `TimeoutExpired` được raise thật sự, không dừng lại ở việc tính Big-O trên giấy.

---

## Việc 4 — Editorials, Teacher Guide, Complexity Rubric

### Prompt gốc của người dùng
Đề bài ngày 15 yêu cầu bàn giao editorials, teacher guide và complexity rubric là các sản phẩm bắt buộc, tương tự cấu trúc tài liệu đã dùng ở ngày 14.

### Đã làm
Viết `docs/day15/editorials.md` (nhiều hướng giải mỗi bài, từ naive đến tối ưu, phân biệt rõ bẫy tốc độ và bẫy logic), `docs/day15/teacher-guide.md` (mục tiêu sư phạm, rubric chấm điểm, mapping mục tiêu kỳ thi kèm giới hạn tránh đặt kỳ vọng sai), và `docs/day15/complexity-rubric.md` (bảng ánh xạ độ phức tạp mục tiêu và ràng buộc constraint cho từng bài).

---

## Việc 5 — Sửa lỗi hiển thị nhãn lớp

### Phát hiện của người dùng
Sau khi seed xong, vào Code Playground không thấy mục lớp 10-12.

### Nguyên nhân
File dữ liệu ban đầu dùng `gradeBand: '10-12'`, nhưng FE `CodePlaygroundPage.tsx` chỉ định nghĩa sẵn nhãn/icon/gradient cho giá trị `'9-12'`, không có `'10-12'` — bài bị lọc rơi mất, không hiện mục nào.

### Đã sửa
Đổi toàn bộ 15 bài sang `gradeBand: '9-12'` để khớp giá trị FE đã dùng sẵn, chỉ đổi label hiển thị thành "Lớp 10-12" cho đúng tên gọi thực tế mà không cần sửa nhiều nơi trong FE.

---

## Việc 6 — Chạy qua đúng judge pipeline thật, phát hiện bug runtime `import sys`

### Phát hiện của người dùng
Nộp bài Đếm nghịch thế báo lỗi runtime: "Không được phép import module sys".

### Nguyên nhân
`solutionCode` dùng merge sort đệ quy, cần `sys.setrecursionlimit(300000)` để tránh tràn ngăn xếp trên mảng 100000 phần tử. Judge chặn hẳn module `sys` vì lý do bảo mật.

### Đã sửa
Viết lại thuật toán theo kiểu bottom-up merge sort (dùng vòng lặp ghép các đoạn độ dài tăng dần, không đệ quy), không cần `sys` nữa. Kiểm chứng bằng Python thuần (khớp 100% kết quả với bản đệ quy cũ trên 200 test ngẫu nhiên), sau đó nộp thật qua API judge: kết quả AC, 5/5 test pass, kể cả test N=100000 chạy trong giới hạn thời gian.

---

## Việc 7 — Phát hiện bug thiết kế test case vượt giới hạn output của judge

### Phát hiện của người dùng
Bài Gộp khoảng thời gian báo Sai kết quả (4/5 test) dù thuật toán đúng.

### Nguyên nhân
Hidden test lớn nhất dùng N=100000 khoảng, sinh ra output khoảng 1.29MB. Hệ thống chấm bài giới hạn stdout tối đa 64KB mỗi lần chạy (`MAX_OUTPUT_BYTES` trong `code-runner.helper.ts`), output vượt giới hạn bị cắt cụt, khiến bài đúng thuật toán vẫn bị chấm sai vì phần bị cắt không khớp đáp án đầy đủ.

### Đã sửa
Rà soát lại toàn bộ 73 test case của 15 bài, chỉ duy nhất bài này vi phạm giới hạn 64KB. Giảm N của test đó xuống 3000 (output khoảng 29KB, an toàn dưới giới hạn) mà vẫn đủ lớn để không thể giải bằng cách liệt kê thủ công. Ghi lại bài học này vào `complexity-rubric.md` để tránh lặp lại ở các bộ bài sau.

---

## Việc 8 — Viết file đáp án riêng cho bộ 15 bài

### Prompt gốc của người dùng
Yêu cầu soạn file đáp án cho học viên tự đối chiếu, có code đáp án đầy đủ kèm giải thích từng bước và lý do vì sao không dùng cách giải đơn giản hơn, ghi vào `docs/day15`.

### Đã làm
Viết `docs/day15/answers.md`: mỗi bài gồm đề tóm tắt, code đáp án đầy đủ (đúng bằng `solutionCode` trong hệ thống), giải thích từng dòng, và lý do vì sao cách giải naive không phù hợp. Đối chiếu tự động toàn bộ 15 bài để đảm bảo code trong tài liệu khớp chính xác với dữ liệu trong hệ thống tại thời điểm bàn giao, tránh lệch nội dung khi solutionCode được cập nhật về sau.

---

## Việc 9 — Rà soát lại bộ 20 bài ngày 14

### Prompt gốc của người dùng
Yêu cầu áp dụng tương tự các cải tiến của ngày 15 cho bộ bài ngày 14: thêm import sẵn cho học viên, sửa gợi ý bị vỡ định dạng, và đảm bảo Tầng 3 không lộ nguyên đáp án mà chỉ là khung sườn.

### Đã làm
Kiểm tra thấy bộ 20 bài không có bài nào thiếu import (chỉ dùng cú pháp Python cơ bản). Sửa `hint2` của cả 20 bài, thêm xuống dòng giữa các bước cho đúng định dạng. Viết lại `hint3` của cả 20 bài từ "giống hệt solutionCode" thành khung code có phần đọc input/cấu trúc sẵn nhưng để trống phần logic cốt lõi bằng comment TODO.

### Kiểm chứng
93/93 test case vẫn khớp đúng solutionCode sau khi sửa (không đụng vào solutionCode/testCases). hint3 của cả 20 bài không còn trùng solutionCode, đều có TODO, không dùng module bị chặn trong sandbox chấm bài.

---

## Việc 10 — Viết file đáp án cho bộ 20 bài ngày 14

### Prompt gốc của người dùng
Yêu cầu bổ sung file đáp án tương tự ngày 15 cho bộ bài ngày 14, ghi vào `docs/day14`.

### Đã làm
Viết `docs/day14/answers.md` theo đúng cấu trúc đã dùng ở ngày 15: đề tóm tắt, code đáp án đầy đủ, giải thích từng bước, lỗi hay gặp cho cả 20 bài. Đối chiếu tự động với dữ liệu mới nhất trong hệ thống sau khi hint3 được viết lại ở việc 9, đảm bảo tài liệu không còn tham chiếu tới bản code cũ đã lộ đáp án.

---

## Việc 11 — Phát hiện và sửa bug khóa tầng gợi ý

### Prompt gốc của người dùng
Báo cáo lỗi: chưa từng nộp bài 3 nhưng vẫn bấm mở khóa được Tầng 3 (gợi ý gần đáp án nhất), yêu cầu quy tắc phải là chỉ những bài đã từng làm/nộp mới được xem như đã mở, các bài chưa làm phải mở tuần tự theo từng tầng.

### Phát hiện của người dùng
Chưa từng mở Tầng 1, Tầng 2 nhưng vẫn bấm mở được Tầng 3 (code mẫu).

### Điều tra
Ban đầu nghi ngờ là dữ liệu localStorage cũ từ lần test trước, nhưng người dùng xác nhận chưa từng submit bài trước đó. Kiểm tra lại code phát hiện bug thật ở cả 2 luồng: luồng gọi API thật (`hint.service.ts`) chỉ kiểm tra "đã mở tầng này chưa" và cooldown, không kiểm tra tầng liền trước đã mở chưa; luồng gợi ý tĩnh (`HintPanel.tsx`, dùng cho bộ bài day14/day15) set `isUnlocked` trực tiếp ở client mà không kiểm tra thứ tự tầng.

### Đã sửa
Thêm điều kiện bắt buộc ở cả 2 luồng: mở tầng N phải có bằng chứng tầng N-1 đã mở trước đó. Đồng thời disable việc chuyển tab sang tầng chưa đủ điều kiện mở trên giao diện.

### Kiểm chứng
Qua API thật: bỏ qua tầng 2 để mở thẳng tầng 3 bị chặn đúng, mở tuần tự 1 rồi 2 rồi 3 vẫn hoạt động bình thường không bị chặn oan.

---

## Việc 12 — Hiệu ứng hoàn thành khóa và nút Bài tiếp theo

### Prompt gốc của người dùng
Yêu cầu khi học viên hoàn thành hết các bài trong 1 khóa, hiển thị hiệu ứng chúc mừng đã hoàn thành khóa, đếm ngược rồi tự động chuyển về trang chính sau 10 giây. Trước đó cũng có yêu cầu riêng thêm nút chuyển sang bài tiếp theo ngay sau khi nộp bài đúng, thay vì phải quay lại danh sách chọn bài.

### Đã làm
Thêm nút "Bài tiếp theo" hiển thị ngay dưới kết quả nộp bài khi trạng thái là đúng (AC) và còn bài kế tiếp trong danh sách. Thêm modal chúc mừng toàn màn hình khi hoàn thành bài cuối cùng trong 1 chuỗi tiến trình, đếm ngược 10 giây kèm nút bỏ qua đếm ngược, tự động điều hướng về trang chính khi hết giờ. Dùng khóa lưu trữ cục bộ riêng để đảm bảo hiệu ứng chỉ hiện đúng 1 lần cho mỗi khóa, không lặp lại khi học viên mở lại một khóa đã hoàn thành từ trước.

### Kiểm chứng
Mô phỏng lại logic phát hiện hoàn thành khóa qua 4 trường hợp: chưa hoàn thành hết, vừa hoàn thành lần đầu, đã từng hiện hiệu ứng trước đó, và trường hợp không thuộc một chuỗi tiến trình duy nhất — cả 4 đều cho kết quả đúng.

---

## Việc 13 — Đồng bộ nhãn hiển thị lớp học và thanh cuộn

### Prompt gốc của người dùng
Yêu cầu sửa gộp 3 vấn đề giao diện được báo lại sau khi test thực tế: nhãn hiển thị chưa đúng "Lớp 10-12", phần gợi ý bị vỡ định dạng khi hiển thị (đã xử lý ở Việc 9), và thanh cuộn mặc định của trình duyệt không đẹp mắt, cần thay bằng thanh cuộn tùy chỉnh.

### Đã làm
Xác nhận lại việc đổi nhãn lớp đã xử lý đúng ở Việc 5. Thêm scrollbar mỏng, theo màu giao diện sáng/tối, áp dụng cho toàn bộ hệ thống thay cho thanh cuộn mặc định của hệ điều hành.

---

## Việc 14 — Phát hiện và sửa bug Block Puzzle không lồng được khối

### Prompt gốc của người dùng
Yêu cầu áp dụng tương tự các cải tiến của bộ bài Python cho Block Puzzle (lớp 3-5): kiểm tra và soạn file đáp án, đồng thời lưu ý ràng buộc khối vòng lặp không lồng được khối điều kiện và ngược lại.

### Phát hiện của người dùng
Kéo khối "Nếu phía trước có chướng ngại vật" vào bên trong khối "Lặp lại N lần" không thực hiện được, dù đáp án gốc của các bài 12 đến 15 yêu cầu đúng cấu trúc này.

### Điều tra
Kiểm tra code phát hiện điều kiện chặn `if (isContainerCommand) return` áp dụng cho mọi trường hợp container lồng vào container khác, không phân biệt cùng loại hay khác loại — khiến Lặp lại không thể chứa Nếu...thì dù khác loại khối.

Sau khi sửa lần đầu, người dùng báo tiếp: lồng được khối Nếu vào Lặp lại, nhưng khối di chuyển đơn (Rẽ trái, Đi tới) lại bị đẩy ra ngoài thay vì vào đúng vị trí bên trong. Điều tra tiếp phát hiện nguyên nhân gốc: `DndContext` không chỉ định chiến lược phát hiện va chạm (`collisionDetection`), dùng mặc định `rectIntersection`, không đảm bảo chọn đúng vùng thả trong cùng khi các vùng lồng nhau chồng lấn về mặt hình học.

### Đã sửa
Sửa điều kiện chặn để chỉ cấm cùng loại lồng nhau, cho phép khác loại lồng 1 cấp. Thêm hàm chèn khối đệ quy thay vì chỉ tìm ở cấp ngoài cùng. Đổi chiến lược phát hiện va chạm sang kết hợp `pointerWithin` ưu tiên trước (chọn đúng vùng trong cùng khi lồng nhau) và `rectIntersection` dự phòng (giữ đúng hành vi cũ cho các khe chèn hẹp giữa các khối).

### Kiểm chứng
Mô phỏng lại đúng logic chạy khối và cách đếm khối của trang chơi bằng Python, xác nhận cả 15/15 bài đều đưa robot tới đích đúng và số khối nằm trong giới hạn cho phép của từng bài.

---

## Việc 15 — Viết file đáp án cho Block Puzzle

### Prompt gốc của người dùng
Yêu cầu soạn file đáp án cho Block Puzzle tương tự các bộ bài viết code, nhưng đơn giản hơn vì đây là trò chơi xếp khối lệnh, ghi vào `docs/day13`.

### Đã làm
Kiểm tra rubric đáp án đã có sẵn từ trước (`docs/day13/block-puzzle-answer-rubric.md`) để tránh soạn trùng lặp. Viết thêm `docs/day13/answers.md` dạng bảng liệt kê nhanh thứ tự đặt khối cho cả 15 bài, kèm ghi chú về quy tắc lồng khối tối đa 1 cấp đã xác nhận đúng theo mã nguồn.

### Kiểm chứng
Mô phỏng độc lập bằng Python cho cả 15 bài dựa trên dữ liệu level thật, xác nhận robot tới đích và số khối nằm trong giới hạn cho phép, trước khi đối chiếu với nội dung rubric cũ.

---

## Việc 16 — Chia commit theo chủ đề và đẩy lên nhánh

### Prompt gốc của người dùng
Yêu cầu tạo commit dễ hiểu, đầy đủ, chi tiết, có tính logic rồi đẩy lên nhánh `feature/learning-hub-day15`, không thêm dòng ghi công cụ AI vào nội dung commit.

### Đã làm
Chia toàn bộ thay đổi trong buổi làm việc thành 5 commit theo từng chủ đề độc lập: bộ 15 bài ngày 15 và tài liệu đi kèm; cải thiện bộ 20 bài ngày 14 và tài liệu đi kèm; sửa lỗi khóa tầng gợi ý; hiệu ứng hoàn thành khóa cùng các cải tiến giao diện Code Playground; sửa lỗi lồng khối Block Puzzle và tài liệu đi kèm. Đẩy cả 5 commit lên nhánh từ xa `feature/learning-hub-day15`.

---

## Đánh giá độ tin cậy của AI trong buổi làm việc

Phần thiết kế nội dung ban đầu (đề bài, test case, editorial) đúng phần lớn ngay từ đầu vì dựa trên kiến thức thuật toán chuẩn, nhưng có nhiều lớp lỗi chỉ lộ ra khi kiểm chứng qua đúng môi trường thật hoặc qua phản hồi trực tiếp từ người dùng khi thao tác trên giao diện, không phải chỉ đọc lại code hay suy luận trên giấy.

Bốn lỗi quan trọng nhất trong buổi làm việc (import sys bị chặn, output vượt giới hạn 64KB, khóa tầng gợi ý không hoạt động, Block Puzzle không lồng được khối) đều không được phát hiện ở bước kiểm chứng ban đầu bằng script độc lập, mà chỉ lộ ra khi người dùng tự tay thao tác trên giao diện thật và báo lại cụ thể. Điều này cho thấy kiểm chứng bằng script (chạy solutionCode qua Python thuần) là điều kiện cần nhưng chưa đủ — vẫn cần chạy qua đúng pipeline sản xuất thật (judge pipeline, giao diện kéo-thả, luồng unlock gợi ý) để bắt được các lớp lỗi hạ tầng hoặc lỗi UI không thể hiện ra khi chỉ kiểm tra logic thuần túy.

Với bug Block Puzzle, lần sửa đầu tiên chỉ giải quyết đúng phần người dùng mô tả (không lồng được khối chứa), nhưng chưa lường trước được tác động phụ của việc đổi chiến lược phát hiện va chạm tới các vùng thả khác (khe chèn hẹp giữa các khối) — phải sửa thêm 1 lần nữa sau khi người dùng test lại và báo lỗi mới phát sinh. Bài học rút ra: khi sửa 1 hành vi chia sẻ chung 1 cơ chế nền tảng (ở đây là toàn bộ hệ thống kéo-thả), cần rà soát lại mọi luồng khác cùng dùng chung cơ chế đó, không chỉ kiểm tra đúng trường hợp cụ thể vừa được báo lỗi.
