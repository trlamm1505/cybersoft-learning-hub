# Editorials — Bộ 15 bài luyện thi thuật toán lớp 10-12 (Ngày 15)

Tài liệu giải thích ý tưởng giải theo **nhiều hướng tiếp cận** (từ hướng ngây thơ tới hướng tối ưu), edge case, và bẫy phổ biến cho từng bài trong bộ 15 bài. Dùng cho giáo viên chấm/chữa bài hoặc học sinh tự đối chiếu sau khi làm.

Quy ước: mỗi bài có `slug` để tra trong hệ thống (Code Playground), `prerequisiteSlug` nối 15 bài thành 1 chuỗi tiến trình. Xem [complexity-rubric.md](./complexity-rubric.md) để biết độ phức tạp mục tiêu và cách constraint được thiết kế để ép đúng thuật toán.

---

## Nhóm 1: Complexity (3 bài)

### 1. Đếm cặp có tổng bằng target (`day15-dem-cap-tong-bang-target`) — MEDIUM

**Hướng 1 (naive, O(N^2))**: duyệt 2 vòng lặp lồng nhau kiểm tra mọi cặp (i, j). Đúng nhưng với N=200000 sẽ là 2*10^10 phép so sánh — TLE chắc chắn (đã verify: TLE tại đúng mốc `timeLimitMs`).

**Hướng 2 (tối ưu, O(N))**: dùng hashmap đếm tần suất, duyệt 1 lượt — với mỗi phần tử x, cộng vào kết quả số lần `target - x` đã xuất hiện TRƯỚC ĐÓ, rồi mới thêm x vào bảng đếm. Thứ tự "đếm trước, cập nhật sau" đảm bảo mỗi cặp (i, j) với i < j chỉ đếm đúng 1 lần.

**Hướng 3 (thay thế, O(N log N))**: sắp xếp mảng, dùng 2 con trỏ (two-pointer) từ 2 đầu. Cách này không xử lý tốt phần tử trùng lặp bằng hashmap nếu học sinh không cẩn thận đếm số lượng trùng — nên hướng hashmap được khuyến nghị là lời giải chính.

**Edge case đã kiểm tra**: mảng có phần tử trùng lặp nhiều (`1 1 1 1`, target=2 → 6 cặp — công thức C(4,2)); không có cặp nào thỏa; N=1 (không có cặp).

**Lỗi phổ biến**: cập nhật `cnt[x] += 1` TRƯỚC khi cộng `pairs += cnt[target-x]` — khiến một phần tử tự đếm với chính nó khi `target = 2*x`.

### 2. Đếm nghịch thế trong dãy số (`day15-dem-nghich-the`) — HARD

**Hướng 1 (naive, O(N^2))**: so sánh mọi cặp (i, j), i < j, đếm `a[i] > a[j]`. Đã verify TLE tại đúng `timeLimitMs` với N=100000.

**Hướng 2 (tối ưu, O(N log N) — merge sort)**: đếm nghịch thế ngay trong bước "trộn" của merge sort — khi lấy phần tử từ nửa phải trước nửa trái, mọi phần tử còn lại của nửa trái đều tạo nghịch thế với phần tử đó.

**Hướng 3 (thay thế, O(N log N) — Binary Indexed Tree/Fenwick Tree)**: nén tọa độ giá trị, duyệt mảng từ phải sang trái, với mỗi phần tử truy vấn "có bao nhiêu phần tử nhỏ hơn nó đã được thêm vào BIT", cộng vào kết quả, rồi thêm phần tử hiện tại vào BIT. Cách này phù hợp hơn khi bài toán mở rộng thành "đếm nghịch thế có cập nhật động" (online), nhưng merge sort đơn giản hơn để cài đặt trong ngữ cảnh thi.

**Edge case đã kiểm tra**: dãy đã sắp xếp tăng dần (0 nghịch thế); dãy giảm dần hoàn toàn (nghịch thế tối đa = C(N,2)); N=1.

**Lỗi phổ biến**: quên cộng `len(left) - i` (chỉ cộng 1 thay vì cộng toàn bộ phần còn lại của nửa trái) — dẫn đến đếm thiếu nghịch thế; nhầm lẫn thứ tự so sánh `<=` vs `<` trong bước trộn (dùng `<=` để giữ ổn định và không đếm nhầm phần tử bằng nhau là nghịch thế).

### 3. Giá trị xuất hiện nhiều nhất trong dãy lớn (`day15-gia-tri-xuat-hien-nhieu-nhat`) — EASY

**Hướng 1 (naive, O(N^2))**: với mỗi phần tử, đếm lại tần suất bằng cách duyệt toàn mảng. Đã verify TLE tại đúng `timeLimitMs` với N=500000.

**Hướng 2 (tối ưu, O(N))**: dùng `Counter`/hashmap đếm tần suất trong 1 lượt duyệt, lấy giá trị lớn nhất trong các tần suất.

**Hướng 3 (thay thế, khi giá trị bị chặn nhỏ)**: nếu biết trước giá trị phần tử nằm trong khoảng nhỏ (ví dụ [0, 10^6] như đề bài), có thể dùng mảng đếm (counting array) thay hashmap — nhanh hơn về hằng số vì tránh overhead của hash, nhưng độ phức tạp Big-O vẫn là O(N + giá trị lớn nhất).

**Edge case đã kiểm tra**: mọi phần tử giống nhau; mọi phần tử khác nhau (tần suất tối đa = 1); N=1.

**Lỗi phổ biến**: không có lỗi logic phổ biến ở bài này — trọng tâm là nhận ra naive O(N^2) không cần thiết khi bài toán chỉ cần "đếm tần suất", không cần so sánh từng cặp.

---

## Nhóm 2: Sorting (3 bài)

### 4. Gộp các khoảng thời gian chồng lấn (`day15-gop-khoang-thoi-gian`) — MEDIUM

**Hướng 1 (naive, O(N^2))**: với mỗi khoảng, so sánh với mọi khoảng khác để tìm chồng lấn rồi gộp dần — cài đặt phức tạp và dễ sai khi phải gộp lại nhiều lần (gộp A với B, rồi kết quả lại chồng lấn với C).

**Hướng 2 (tối ưu, O(N log N))**: sắp xếp theo điểm bắt đầu, sau đó chỉ cần so sánh khoảng hiện tại với khoảng CUỐI CÙNG đã gộp trong kết quả — vì đã sắp xếp, mọi khoảng có thể chồng lấn với khoảng hiện tại chắc chắn đã được xét hoặc sẽ được gộp tuần tự.

**Edge case đã kiểm tra (quan trọng)**: 2 khoảng chạm đúng tại 1 điểm (`[1,4]` và `[4,5]` → gộp thành `[1,5]`, vì đề định nghĩa "chạm nhau" cũng tính là chồng lấn — cần dùng `s <= last_end`, không phải `s < last_end`); khoảng lồng hoàn toàn bên trong khoảng khác (`[0,4]` chứa `[1,4]`... test case dùng `[1,4], [0,4], [3,5]` → kết quả `[0,5]`, kiểm tra việc lấy `max` điểm kết thúc chứ không đơn giản thay thế).

**Lỗi phổ biến**: dùng `s < last_end` (dấu `<` nghiêm ngặt) thay vì `s <= last_end` — bỏ sót trường hợp 2 khoảng chạm đúng 1 điểm; quên lấy `max(last_end, e)` khi gộp — chỉ gán `last_end = e` có thể làm giảm điểm kết thúc nếu khoảng sau kết thúc sớm hơn khoảng đã gộp trước đó.

### 5. K giá trị lớn nhất trong dòng dữ liệu (`day15-k-gia-tri-lon-nhat`) — MEDIUM

**Hướng 1 (đơn giản, O(N log N))**: sắp xếp toàn bộ mảng, lấy K phần tử cuối. Với N=300000, vẫn chạy đủ nhanh trong `timeLimitMs` — bài này KHÔNG chặn cứng hướng này bằng TLE, mà dạy về sự khác biệt hằng số/độ phức tạp khi K rất nhỏ so với N.

**Hướng 2 (tối ưu hơn về mặt lý thuyết, O(N log K))**: dùng `heapq.nlargest(k, a)` — nội bộ dùng min-heap kích thước K, chỉ tốn O(log K) mỗi lần cập nhật thay vì O(log N) khi sort toàn bộ.

**Điểm sư phạm**: bài này minh họa rằng "đúng độ phức tạp tối ưu" không phải lúc nào cũng bị ép bằng TLE cứng — đôi khi ràng buộc chỉ đủ lớn để phân biệt về mặt lý thuyết, giáo viên nên giải thích thêm case "nếu K tiến gần N thì 2 hướng hội tụ độ phức tạp, nếu K << N thì hướng heap có lợi thế rõ rệt".

**Edge case đã kiểm tra**: K = N (lấy tất cả, phải sort lại toàn bộ); phần tử trùng lặp toàn bộ; số âm.

**Lỗi phổ biến**: quên sắp xếp lại kết quả theo thứ tự TĂNG DẦN sau khi gọi `heapq.nlargest` (hàm này trả về theo thứ tự giảm dần).

### 6. Ghép số lớn nhất từ danh sách số (`day15-ghep-so-lon-nhat`) — HARD

**Hướng 1 (sai, so sánh giá trị số trực tiếp)**: sắp xếp các số theo giá trị số học giảm dần (ví dụ 34 > 30 > 9 > 5 > 3) rồi ghép — cho kết quả SAI vì đây không phải bài toán so sánh giá trị đơn thuần.

**Hướng 2 (đúng, custom comparator O(N log N))**: so sánh 2 số bằng cách ghép chuỗi theo 2 chiều (`a+b` vs `b+a`), chiều nào tạo ra chuỗi lớn hơn (so sánh từ điển) thì thứ tự đó tốt hơn.

**Đây là bẫy LOGIC, không phải bẫy tốc độ**: cả 2 hướng đều chạy nhanh (O(N log N)), nhưng hướng 1 cho ra đáp số sai. Ví dụ minh họa: `[3, 30, 34, 5, 9]` — nếu so theo giá trị số, thứ tự giảm dần là `34, 30, 9, 5, 3` → ghép thành `"34309 53"`ghép sai định dạng; đáp án đúng là `"9534330"` (9 đứng trước 5, dù 5 < 9 theo giá trị, nhưng "95" > "59" khi so chuỗi ghép).

**Edge case đã kiểm tra (quan trọng)**: toàn bộ đều là 0 (`[0, 0]` → kết quả phải là `"0"`, không phải `"00"`); chỉ 1 số là 0 lẫn trong dãy số khác 0 — không cần xử lý riêng vì comparator tự xếp 0 xuống cuối nếu có số khác lớn hơn.

**Lỗi phổ biến**: quên xử lý trường hợp kết quả toàn số 0 (in ra `"000"` thay vì `"0"`); dùng so sánh giá trị số thay vì so sánh chuỗi ghép.

---

## Nhóm 3: Binary Search (3 bài)

### 7. Tìm kiếm trong mảng đã xoay (`day15-tim-kiem-mang-da-xoay`) — MEDIUM

**Hướng 1 (đơn giản, O(N))**: duyệt tuyến tính tìm target. Với N=200000 và `timeLimitMs` thắt chặt còn 1000ms, cách này có rủi ro chậm trên máy chấm yếu hơn máy dev, dù thường vẫn đủ nhanh trên Python hiện đại — mục tiêu chính của bài là RÈN KỸ THUẬT binary search trên mảng xoay, không đơn thuần chặn TLE.

**Hướng 2 (mục tiêu, O(log N))**: tại mỗi bước, xác định nửa nào [lo, mid] hoặc [mid, hi] đang còn "sắp xếp bình thường" (so sánh `a[lo] <= a[mid]`), rồi kiểm tra target có nằm trong khoảng của nửa đó không để quyết định thu hẹp.

**Hướng 3 (thay thế)**: tìm điểm xoay (pivot) trước bằng 1 binary search riêng, sau đó binary search bình thường trên đúng "nửa" chứa target — cách này tốn 2 lần binary search nhưng dễ suy luận hơn với học sinh mới học.

**Edge case đã kiểm tra**: mảng chỉ có 1 phần tử (2 trường hợp: có/không chứa target); mảng "xoay" nhưng thực chất chưa xoay (target ở đầu mảng gốc).

**Lỗi phổ biến**: nhầm điều kiện biên `<` và `<=` khi kiểm tra target có nằm trong nửa "sạch" hay không (ví dụ dùng `a[lo] < target < a[mid]` thay vì `a[lo] <= target < a[mid]`, bỏ sót trường hợp target trùng `a[lo]`).

### 8. Chia sách thành K phần, tối thiểu hóa phần lớn nhất (`day15-chia-sach-toi-thieu-hoa`) — HARD

**Hướng 1 (naive, vét cạn cách chia)**: thử mọi cách chia N sách thành K đoạn liên tiếp — số cách chia là C(N-1, K-1), tăng theo tổ hợp, không khả thi với N=100000 (thậm chí N=30 đã không khả thi).

**Hướng 2 (đúng, O(N log(sum(a))) — binary search trên đáp án)**: nhận ra rằng "khả năng chia được với trần cap cho trước" là một hàm ĐƠN ĐIỆU theo cap (cap càng lớn càng dễ chia được) — tính chất đơn điệu này cho phép binary search trên GIÁ TRỊ ĐÁP ÁN thay vì trên chỉ số mảng. Với mỗi cap thử nghiệm, kiểm tra tính khả thi bằng 1 lượt duyệt tham lam O(N).

**Hướng 3 (thay thế, O(N*K) — quy hoạch động)**: `dp[i][k]` = giá trị nhỏ nhất của "phần lớn nhất" khi chia i cuốn sách đầu cho k người — đúng nhưng chậm hơn nhiều với N, K lớn, phù hợp làm bài tập trung gian trước khi học binary-search-on-answer.

**Edge case đã kiểm tra**: K = 1 (không chia, 1 người đọc hết — đáp án = sum(a)); K = N (mỗi người đúng 1 cuốn — đáp án = max(a)); 1 cuốn sách duy nhất có số trang rất lớn (10^9).

**Lỗi phổ biến**: khởi tạo khoảng tìm kiếm sai (`lo` phải là `max(a)`, không phải `0`, vì không thể chia được nếu trần nhỏ hơn cuốn sách dày nhất); hàm kiểm tra tính khả thi (`can_split`) đếm sai số nhóm (off-by-one khi khởi tạo `parts = 0` thay vì `parts = 1`).

### 9. Đếm số lượng phần tử trong khoảng giá trị (`day15-dem-phan-tu-trong-khoang`) — MEDIUM

**Hướng 1 (naive, O(N) mỗi truy vấn → O(N*Q) tổng)**: với mỗi truy vấn, duyệt toàn mảng đếm phần tử trong [L, R]. Với N, Q đều tới 10^5-2*10^5, tổng phép tính lên tới 2*10^10 — không khả thi.

**Hướng 2 (đúng, O((N+Q) log N))**: dùng `bisect_left`/`bisect_right` (lower_bound/upper_bound) trên mảng đã sắp xếp sẵn — mỗi truy vấn chỉ O(log N).

**Hướng 3 (thay thế, O(N + Q) — prefix sum nếu giá trị bị chặn nhỏ)**: nếu biết trước giá trị nằm trong khoảng nhỏ, có thể xây mảng đếm tích lũy (prefix count) 1 lần, trả lời mỗi truy vấn O(1) — nhanh hơn nhưng cần giá trị bị chặn, không tổng quát bằng binary search.

**Edge case đã kiểm tra**: truy vấn [L, R] không giao với mảng (kết quả 0); dãy có phần tử trùng lặp toàn bộ (`1 1 1`, truy vấn `[1,1]` → toàn bộ 3 phần tử); truy vấn phủ toàn bộ mảng.

**Lỗi phổ biến**: nhầm `bisect_left`/`bisect_right` cho nhau (dùng bisect_left(R) thay vì bisect_right(R) sẽ bỏ sót các phần tử có giá trị đúng bằng R).

---

## Nhóm 4: Greedy (3 bài)

### 10. Chọn tối đa hoạt động không giao nhau (`day15-chon-hoat-dong-khong-giao-nhau`) — MEDIUM

**Hướng 1 (sai trực giác, sắp theo thời lượng ngắn nhất)**: chọn hoạt động có thời lượng ngắn nhất trước — trực giác "ưu tiên cái ngắn để chèn được nhiều cái khác" nghe hợp lý nhưng SAI, vì một hoạt động ngắn có thể kết thúc muộn, chặn nhiều cơ hội hơn 1 hoạt động dài nhưng kết thúc sớm.

**Hướng 2 (đúng, sắp theo thời điểm kết thúc sớm nhất — O(N log N))**: đây là greedy chuẩn cho bài toán "interval scheduling maximization" — luôn chọn hoạt động kết thúc sớm nhất trong số các hoạt động còn khả thi.

**Hướng 3 (đối chứng, quy hoạch động)**: có thể giải bằng DP trên khoảng đã sắp xếp, nhưng độ phức tạp không tốt hơn greedy và cài đặt phức tạp hơn — greedy là lựa chọn chuẩn cho lớp bài toán này.

**Edge case đã kiểm tra**: 1 hoạt động duy nhất; các hoạt động nối đuôi nhau vừa khít (`[1,10]` bị "hy sinh" để chọn được 4 hoạt động ngắn hơn `[2,3],[3,4],[4,5],[5,6]` — minh họa rõ tại sao chọn theo thời lượng ngắn nhất là sai, vì `[1,10]` ngắn hơn tổng nhưng chặn hết cơ hội).

**Lỗi phổ biến**: sắp xếp theo thời điểm BẮT ĐẦU thay vì thời điểm KẾT THÚC (dẫn tới kết quả sai trong nhiều trường hợp).

### 11. Số bước nhảy ít nhất để tới đích (`day15-so-buoc-nhay-it-nhat`) — HARD

**Hướng 1 (đối chứng đúng nhưng chậm hơn, BFS tường minh — O(N))**: coi mỗi vị trí là 1 đỉnh, dựng cạnh tới mọi vị trí trong tầm nhảy, chạy BFS tìm khoảng cách ngắn nhất tới đích. Đúng về độ phức tạp Big-O nhưng tốn nhiều bộ nhớ/overhead hơn (hàng đợi, danh sách kề) so với hướng greedy trực tiếp.

**Hướng 2 (tối ưu, greedy theo tầng — O(N))**: duy trì `cur_end` (biên xa nhất đạt được với số lượt nhảy hiện tại) và `farthest` (biên xa nhất có thể đạt thêm 1 lượt) — về bản chất là "nén" BFS theo tầng thành 1 vòng lặp tuyến tính, không cần dựng đồ thị tường minh.

**Điểm sư phạm**: đây là ví dụ điển hình cho thấy 1 bài có thể giải đúng bằng BFS (an toàn, dễ nghĩ ra hơn) HOẶC bằng greedy (nhanh hơn về hằng số, đòi hỏi insight sâu hơn) — cùng độ phức tạp Big-O O(N) nhưng khác nhau về độ khó tư duy.

**Edge case đã kiểm tra**: N=1 (đã ở đích, 0 bước); mảng toàn giá trị 1 (mỗi bước chỉ nhảy được 1 ô, cần đúng N-1 bước).

**Lỗi phổ biến**: cập nhật `jumps` NGAY khi cập nhật `farthest` thay vì chỉ cập nhật khi `i == cur_end` (tăng nhầm số bước nhảy quá sớm).

### 12. Đổi tiền tối thiểu và cái bẫy của greedy (`day15-doi-tien-toi-thieu`) — HARD

**Hướng 1 (SAI trong trường hợp tổng quát, greedy)**: luôn lấy mệnh giá lớn nhất có thể trước. Với hệ mệnh giá "chuẩn tắc" (canonical) như tiền VNĐ/USD thông thường, greedy cho kết quả ĐÚNG — nhưng đề bài này KHÔNG đảm bảo hệ mệnh giá chuẩn tắc. Phản chứng đã verify: `coins=[1,3,4]`, `S=6` → greedy chọn 4 trước (còn 2, cần 2 tờ 1đ) = 3 tờ; nhưng đáp án tối ưu thật là `3+3` = 2 tờ.

**Hướng 2 (đúng, O(S*M) — quy hoạch động unbounded knapsack)**: `dp[i]` = số tờ ít nhất để đổi đúng số tiền i, cập nhật bằng cách thử từng mệnh giá.

**Điểm sư phạm quan trọng nhất của bài này**: đây KHÔNG phải bẫy tốc độ mà là bẫy TÍNH ĐÚNG ĐẮN của thuật toán tham lam — nhiều học sinh quen thuộc với hệ tiền VNĐ nên mặc định greedy luôn đúng cho "bài đổi tiền", đây là cơ hội dạy rằng greedy CHỈ đúng khi chứng minh được tính chất "exchange argument" hoặc hệ mệnh giá thỏa điều kiện chuẩn tắc — không được áp dụng greedy "theo quán tính".

**Edge case đã kiểm tra**: không có cách đổi đủ đúng S (in ra -1, ví dụ mệnh giá `[2,4]` không thể đổi đúng `S=3` vì cả 2 mệnh giá đều chẵn); S=0 (0 tờ tiền).

**Lỗi phổ biến**: dùng greedy vì "quen với hệ tiền thật" — chính là bẫy trọng tâm của bài.

---

## Nhóm 5: Graph / DP cơ bản (3 bài)

### 13. Đường đi ngắn nhất trên lưới ô vuông (`day15-duong-di-ngan-nhat-luoi`) — MEDIUM

**Hướng 1 (SAI mục tiêu, DFS)**: DFS có thể tìm ra MỘT đường đi tới đích, nhưng không đảm bảo đó là đường NGẮN NHẤT — đây là lỗi khái niệm phổ biến khi học sinh mới làm quen đồ thị, nhầm "tìm được đường đi" với "tìm được đường đi ngắn nhất".

**Hướng 2 (đúng, BFS — O(R*C))**: BFS duyệt theo "tầng khoảng cách", đảm bảo ô nào được thăm trước có khoảng cách ngắn hơn hoặc bằng ô thăm sau — đây là bất biến (invariant) khiến BFS luôn cho khoảng cách ngắn nhất trên đồ thị không trọng số.

**Hướng 3 (tổng quát hơn nhưng không cần thiết ở đây, Dijkstra)**: nếu bài toán có trọng số cạnh khác nhau (ví dụ ô có "chi phí" di chuyển khác nhau), cần Dijkstra thay vì BFS thuần — nhưng bài này trọng số đều bằng 1 nên BFS đã tối ưu, dùng Dijkstra là thừa (tốn thêm log factor không cần thiết).

**Edge case đã kiểm tra**: điểm đầu = điểm đích (lưới 1x1, kết quả 0 bước); không tồn tại đường đi (bị vật cản chặn hoàn toàn, in -1).

**Lỗi phổ biến**: dùng DFS thay vì BFS (sai mục tiêu bài toán, dù có thể "may mắn" đúng trên vài test nhỏ); quên đánh dấu đã thăm TRƯỚC KHI đẩy vào hàng đợi (đánh dấu sau khi lấy ra khỏi hàng đợi) — có thể khiến 1 ô bị đẩy vào hàng đợi nhiều lần, không sai kết quả nhưng lãng phí thời gian/bộ nhớ đáng kể.

### 14. Đếm số vùng liên thông trong đồ thị (`day15-dem-thanh-phan-lien-thong`) — MEDIUM

**Hướng 1 (đối chứng, DFS/BFS từ từng đỉnh chưa thăm — O(N+M))**: với mỗi đỉnh chưa thăm, chạy DFS/BFS đánh dấu toàn bộ thành phần liên thông chứa nó, tăng biến đếm. Đúng và đủ nhanh, nhưng DFS đệ quy thuần có thể TRÀN NGĂN XẾP (stack overflow) trên đồ thị dạng chuỗi dài (ví dụ N=200000 đỉnh nối liên tiếp) nếu không tăng giới hạn đệ quy hoặc chuyển sang đệ quy dạng vòng lặp/BFS.

**Hướng 2 (đúng và an toàn hơn, Union-Find với path compression — O((N+M) α(N)))**: nối các đỉnh có cạnh vào cùng nhóm, đếm số nhóm gốc khác nhau ở cuối — không có rủi ro tràn ngăn xếp vì không dùng đệ quy sâu.

**Điểm sư phạm**: bài này dạy 2 kỹ năng riêng biệt — (a) hiểu khái niệm thành phần liên thông qua cả 2 hướng cài đặt, và (b) nhận ra rủi ro tràn ngăn xếp của DFS đệ quy trên input "xấu" (đồ thị dạng chuỗi dài) — một cân nhắc thực tế quan trọng khi thi đấu, không chỉ lý thuyết.

**Edge case đã kiểm tra**: đồ thị không có cạnh nào (mỗi đỉnh là 1 thành phần riêng); đồ thị liên thông hoàn toàn (1 thành phần duy nhất); đồ thị dạng chuỗi dài 200000 đỉnh (kiểm tra hiệu năng path compression).

**Lỗi phổ biến**: quên path compression trong `find()` — khiến Union-Find suy biến thành O(N) mỗi thao tác trên đồ thị dạng chuỗi, tổng thể trở thành O(N^2); DFS đệ quy không tăng `sys.setrecursionlimit` gây lỗi `RecursionError` trên đồ thị sâu.

### 15. Dãy con tăng dài nhất (`day15-day-con-tang-dai-nhat`) — HARD

**Hướng 1 (naive, O(N^2) DP cơ bản)**: `dp[i]` = độ dài LIS kết thúc tại i, xét mọi `j < i` để cập nhật. Đúng nhưng với N=100000 sẽ là 10^10 phép tính — đã verify TLE tại đúng `timeLimitMs`.

**Hướng 2 (tối ưu, O(N log N) — patience sorting)**: duy trì mảng `tails` (giá trị nhỏ nhất có thể làm phần tử cuối của 1 dãy tăng độ dài k+1), dùng `bisect_left` để tìm vị trí cần cập nhật cho mỗi phần tử mới. Độ dài cuối cùng của `tails` chính là độ dài LIS — mấu chốt cần nhấn mạnh: `tails` không nhất thiết là 1 dãy con THẬT SỰ tồn tại trong mảng gốc, nó chỉ lưu "tiềm năng mở rộng tốt nhất" cho mỗi độ dài.

**Hướng 3 (thay thế, Binary Indexed Tree trên giá trị đã nén tọa độ)**: nếu cần truy vết CHÍNH DÃY CON (không chỉ độ dài), có thể kết hợp BIT lưu max dp-value theo tiền tố giá trị — phức tạp hơn patience sorting nhưng linh hoạt hơn khi bài toán mở rộng (ví dụ đếm SỐ LƯỢNG dãy con tăng dài nhất).

**Edge case đã kiểm tra**: dãy giảm dần hoàn toàn (LIS = 1, mỗi phần tử tự là 1 dãy con); dãy tăng dần hoàn toàn (LIS = N); N=1.

**Lỗi phổ biến**: dùng `bisect_right` thay vì `bisect_left` (sai vì đề yêu cầu tăng NGHIÊM NGẶT — nếu dùng bisect_right sẽ vô tình cho phép dãy con "không giảm" thay vì "tăng thực sự", cho kết quả lớn hơn thực tế khi có phần tử trùng lặp); nhầm lẫn `len(tails)` với chính nội dung `tails` — `tails` sau khi chạy xong KHÔNG PHẢI là 1 LIS hợp lệ, chỉ có ĐỘ DÀI của nó là đúng.
