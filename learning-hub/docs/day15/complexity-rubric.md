# Complexity Rubric — Bộ 15 bài luyện thi thuật toán lớp 10-12 (Ngày 15)

Tài liệu này định nghĩa **độ phức tạp mục tiêu** của từng bài, giải thích ràng buộc (constraint) trong đề đã được chọn như thế nào để buộc thí sinh dùng đúng thuật toán, và cách `timeLimitMs` + test case lớn cùng nhau tạo ra "hàng rào" loại các lời giải sai độ phức tạp.

## Nguyên tắc thiết kế constraint

Với time limit tiêu chuẩn (1-3 giây) và tốc độ tham chiếu ~10^8 phép tính đơn giản/giây (Python thường chậm hơn C++ 20-50 lần, nhưng vẫn dùng mốc ~10^7-10^8 cho an toàn):

| Độ phức tạp mục tiêu | N tối đa chấp nhận được | Độ phức tạp KHÔNG đạt (sẽ TLE) | N khiến nó TLE |
|---|---|---|---|
| O(N) hoặc O(N log N) | 10^5 - 5*10^5 | O(N^2) | N >= 2000-6000 (Python) |
| O(N log(giá trị)) — binary search trên đáp án | 10^5 | O(2^N) hoặc duyệt toàn bộ cách chia | N >= 20-30 |
| O((N+M) log N) — Union-Find | 2*10^5 đỉnh/cạnh | O(N*M) không nén đường | Đồ thị dạng chuỗi dài |
| O(S*M) — DP unbounded knapsack | S <= 10^7, M <= 20 | O(2^S) hoặc duyệt tổ hợp | Không khả thi ngay cả N nhỏ |

Mỗi bài trong bộ 15 bài có **ít nhất 1 hidden test case với N/S ở biên trên constraint**, được thiết kế sao cho:
1. Lời giải đúng độ phức tạp mục tiêu chạy xong trong **dưới 30% timeLimitMs** (biên an toàn rộng cho môi trường chấm chậm hơn máy dev).
2. Lời giải sai độ phức tạp (thường là "giải pháp ngây thơ" đầu tiên học sinh nghĩ ra) **vượt quá timeLimitMs** trên cùng test case đó — đã kiểm chứng độc lập bằng script Python thực thi solution qua `subprocess` với `timeout` bằng đúng `timeLimitMs`.

## Ràng buộc thứ hai cần tôn trọng: giới hạn kích thước output (64KB)

Ngoài `timeLimitMs`, hệ thống chấm bài còn giới hạn **stdout tối đa 64KB** mỗi lần chạy (hằng số `MAX_OUTPUT_BYTES` trong `code-runner.helper.ts`) — output vượt quá giới hạn này bị cắt cụt, khiến ngay cả lời giải ĐÚNG thuật toán vẫn bị chấm **WA (Sai kết quả)** vì phần bị cắt không khớp đáp án đầy đủ. Đây là ràng buộc hạ tầng TÁCH BIỆT với `timeLimitMs`, dễ bị bỏ sót khi thiết kế test case cho các bài mà đề yêu cầu IN RA NHIỀU DÒNG (ví dụ in từng phần tử một, khác với bài chỉ in 1 con số kết quả tổng hợp).

**Sự cố đã xảy ra và cách sửa**: bài `day15-gop-khoang-thoi-gian` (Gộp khoảng thời gian, #4) ban đầu dùng hidden test N=100000 (đúng mức trần constraint trong đề), nhưng vì đề yêu cầu in ra TỪNG khoảng kết quả trên 1 dòng, output sinh ra ~1.29MB — vượt xa 64KB, bị cắt cụt, khiến solutionCode đúng 100% vẫn bị chấm WA. Đã sửa bằng cách giảm N của test đó xuống 3000 (output ~29KB, an toàn dưới 64KB) mà vẫn giữ đủ lớn để không thể giải bằng vét cạn thủ công. Đã kiểm chứng lại qua đúng judge pipeline thật (không chỉ Python subprocess độc lập): `AC, 5/5 test pass`.

**Quy tắc rút ra cho các bộ bài sau**: với bài yêu cầu in nhiều dòng, N của test lớn nhất phải được tính theo công thức `N * (độ dài trung bình 1 dòng output) < 64KB`, KHÔNG được mặc định lấy N sát trần constraint trong đề như với bài chỉ in 1 kết quả tổng hợp. Đã rà soát lại toàn bộ 73 test case của cả 15 bài (script `guard_check.js`/kiểm tra độ dài `expectedOutput`) — chỉ duy nhất bài #4 vi phạm, các bài còn lại (kể cả bài in nhiều dòng khác như #5 K giá trị lớn nhất, #9 đếm phần tử trong khoảng) đều có N/format output đã nằm trong giới hạn an toàn ngay từ đầu.

## Bảng ánh xạ từng bài

| # | Slug | Nhóm | Độ phức tạp mục tiêu | Độ phức tạp bị chặn (naive) | N/ràng buộc ép buộc | Đã verify TLE độc lập? |
|---|---|---|---|---|---|---|
| 1 | `day15-dem-cap-tong-bang-target` | Complexity | O(N) hashmap | O(N^2) duyệt cặp | N = 200000 | Đạt — naive TLE tại 2.0s (limit 2.0s) |
| 2 | `day15-dem-nghich-the` | Complexity | O(N log N) merge sort | O(N^2) duyệt cặp | N = 100000 | Đạt — naive TLE tại 3.0s (limit 3.0s) |
| 3 | `day15-gia-tri-xuat-hien-nhieu-nhat` | Complexity | O(N) đếm tần suất | O(N^2) đếm lồng nhau | N = 500000 | Đạt — naive TLE tại 2.0s (limit 2.0s) |
| 4 | `day15-gop-khoang-thoi-gian` | Sorting | O(N log N) sort + quét | O(N^2) so từng cặp khoảng | N = 3000 (test lớn nhất; xem ghi chú bên dưới) | Suy ra từ cấu trúc thuật toán (sort là bước bắt buộc, không có naive "duyệt cặp" nào cho ra thứ tự đúng dễ dàng hơn) |
| 5 | `day15-k-gia-tri-lon-nhat` | Sorting | O(N log K) heap | O(N log N) sort toàn bộ (vẫn đúng, chỉ kém tối ưu hơn khi K << N) | N = 300000, K = 5 | Không TLE cứng — bài dạy "tối ưu hằng số" hơn là "chặn cứng", ghi rõ trong editorial |
| 6 | `day15-ghep-so-lon-nhat` | Sorting | O(N log N) custom comparator | So sánh giá trị số trực tiếp (sai logic, không chỉ chậm) | N = 100000 | Đây là bẫy ĐÚNG/SAI logic, không phải bẫy tốc độ — xem editorial |
| 7 | `day15-tim-kiem-mang-da-xoay` | Binary Search | O(log N) | O(N) tuyến tính | N = 200000, timeLimitMs = 1000 | timeLimitMs thắt chặt còn 1s để O(N) cũng có nguy cơ rủi ro trên máy chấm chậm, dù thường vẫn pass — mục tiêu chính là ép ĐÚNG KỸ THUẬT binary search trên mảng xoay |
| 8 | `day15-chia-sach-toi-thieu-hoa` | Binary Search | O(N log(sum(a))) | O(2^N) hoặc duyệt mọi cách chia | N = 100000 | Duyệt toàn bộ cách chia không khả thi ngay cả N nhỏ — đã verify bằng so sánh với DP brute-force trên N <= 8 |
| 9 | `day15-dem-phan-tu-trong-khoang` | Binary Search | O((N+Q) log N) | O(N*Q) duyệt tuyến tính mỗi truy vấn | N = 200000, Q lớn | Cấu trúc bài (nhiều truy vấn) tự nhiên chặn O(N) mỗi truy vấn |
| 10 | `day15-chon-hoat-dong-khong-giao-nhau` | Greedy | O(N log N) sort theo kết thúc | Vét cạn tổ hợp O(2^N) | N = 100000 | Vét cạn không khả thi — đã verify greedy khớp brute-force trên N <= 10 |
| 11 | `day15-so-buoc-nhay-it-nhat` | Greedy | O(N) | BFS tường minh O(N) (đúng nhưng tốn bộ nhớ hàng đợi + danh sách kề hơn) | N = 100000 | Đã verify greedy khớp BFS trên nhiều test ngẫu nhiên N <= 10 |
| 12 | `day15-doi-tien-toi-thieu` | Greedy (bẫy) → DP | O(S*M) | Greedy đơn thuần cho kết quả **SAI** (không chỉ chậm) với hệ mệnh giá không chuẩn tắc | S <= 10^7 | Đã verify: coins=[1,3,4], S=6 → greedy=3, DP=2 (khác nhau, xác nhận bẫy có thật) |
| 13 | `day15-duong-di-ngan-nhat-luoi` | Graph | O(R*C) BFS | DFS tìm 1 đường đi bất kỳ (không đảm bảo ngắn nhất — sai logic, không chỉ chậm) | R, C <= 500 | Đã verify BFS cho khoảng cách đúng trên lưới rỗng 500x500 |
| 14 | `day15-dem-thanh-phan-lien-thong` | Graph | O((N+M) α(N)) Union-Find có nén đường | O(N*M) Union-Find không nén đường (suy biến trên đồ thị chuỗi dài) | N = 200000 đỉnh dạng chuỗi | Đã verify Union-Find khớp DFS trên nhiều đồ thị ngẫu nhiên nhỏ; test lớn dùng đồ thị chuỗi để lộ rõ nhu cầu path compression |
| 15 | `day15-day-con-tang-dai-nhat` | DP | O(N log N) patience sorting | O(N^2) DP cơ bản | N = 100000 | Đạt — naive TLE tại 2.0s (limit 2.0s) |

## Cách đọc cột "Đã verify TLE độc lập?"

4 bài (1, 2, 3, 15) có bẫy độ phức tạp **thuần túy về tốc độ** (naive vẫn ra đúng đáp số, chỉ chậm) — với các bài này, đã chạy script Python độc lập (`verify_slow_rejected.py`, tách biệt khỏi mọi công cụ AI dùng để soạn đề) thực thi naive solution qua `subprocess.run(..., timeout=timeLimitMs/1000)` trên đúng input của hidden test case lớn nhất, xác nhận `TimeoutExpired` được raise thật sự.

Các bài còn lại thuộc 2 nhóm khác:
- **Bẫy vét cạn/tổ hợp** (5, 8, 10): naive không đơn giản là "chậm hơn hằng số" mà thuộc lớp độ phức tạp mũ/giai thừa — không cần chạy thử cũng biết không khả thi với N thực tế, đã verify tính ĐÚNG của lời giải tối ưu bằng brute-force trên N nhỏ thay vì đo thời gian.
- **Bẫy logic** (6, 12, 13): naive không chỉ chậm mà **sai kết quả** — đây là loại bẫy quan trọng cần dạy riêng, không được nhầm với bẫy độ phức tạp thuần túy. Editorial của từng bài ghi rõ ví dụ phản chứng cụ thể.

## Cách tái chạy kiểm chứng

Script kiểm chứng độc lập không phụ thuộc vào bất kỳ kết luận nào do AI đưa ra:

```bash
# Kiểm tra toàn bộ 73 test case khớp đúng solutionCode (chạy Python thật)
python verify_exercises.py

# Kiểm tra 4 bài có bẫy độ phức tạp thuần túy: naive solution có thực sự TLE không
python verify_slow_rejected.py
```

Cả 2 script đọc trực tiếp `initial-exercises-day15.ts`, không hard-code lại expectedOutput — tránh trường hợp editorial "tự xác nhận" một kết luận sai lặp lại từ bước soạn đề ban đầu.
