# Đáp án chi tiết — Bộ 15 bài luyện thi thuật toán lớp 9-12 (Ngày 15)

File này dùng để **đọc hiểu code đáp án**, không phải chỉ để copy-paste. Mỗi bài có 4 phần:
- **Đề tóm tắt**: nói lại đề bằng 1-2 câu ngắn.
- **Code đáp án**: y hệt `solutionCode` trong hệ thống (`initial-exercises-day15.ts`), đã chạy qua Python thật và khớp 100% với `expectedOutput` của mọi test case.
- **Giải thích từng bước**: đọc code từ trên xuống, dòng nào làm gì, tại sao viết như vậy.
- **Vì sao không viết cách đơn giản hơn**: nói rõ cách "nghĩ đầu tiên" (naive) sai ở đâu hoặc chậm ở đâu.

Nếu vẫn thấy khó, đọc thêm [editorials.md](./editorials.md) (có thêm nhiều hướng giải khác nhau) — file này chỉ tập trung giải thích ĐÚNG 1 hướng đáp án chính, giải thích kỹ hơn.

> **Lưu ý về phạm vi file này**: các khối "Code đáp án" dưới đây là `solutionCode` — lời giải ĐẦY ĐỦ, dùng để đọc hiểu và đối chiếu, không phải những gì học viên nhìn thấy khi mở bài trên hệ thống. Trên giao diện thật, học viên bắt đầu từ `starterCode` (đã có sẵn các `import` cần thiết + phần đọc input, chỉ thiếu phần logic) và có thể xin gợi ý theo 3 tầng tăng dần: Tầng 1/2 là gợi ý bằng lời, Tầng 3 (hint3) là 1 khung code SƯỜN (có cấu trúc import/vòng lặp/hàm đầy đủ nhưng phần logic cốt lõi để trống bằng `# TODO`, không phải lời giải đầy đủ như dưới đây) — tự học viên vẫn phải điền nốt phần TODO đó mới ra được đáp án hoàn chỉnh.

---

## Nhóm 1: Complexity

### 1. Đếm cặp có tổng bằng target (`day15-dem-cap-tong-bang-target`)

**Đề tóm tắt**: cho N số, đếm xem có bao nhiêu cặp (2 số khác vị trí nhau) cộng lại đúng bằng `target`.

**Code đáp án**:
```python
from collections import defaultdict

n = int(input())
a = list(map(int, input().split()))
target = int(input())
cnt = defaultdict(int)
pairs = 0
for x in a:
    pairs += cnt[target - x]
    cnt[x] += 1
print(pairs)
```

**Giải thích từng bước**:
1. `cnt = defaultdict(int)` — tạo 1 "cuốn sổ" đếm xem mỗi số đã xuất hiện bao nhiêu lần. `defaultdict(int)` nghĩa là nếu tra 1 số chưa từng ghi vào sổ, nó tự trả về 0 (không bị lỗi `KeyError`).
2. Duyệt từng số `x` trong mảng, theo đúng thứ tự từ trái sang phải.
3. `pairs += cnt[target - x]` — trước khi ghi `x` vào sổ, hỏi sổ: "đã có bao nhiêu số bằng `target - x` được ghi TỪ TRƯỚC (tức là đứng trước `x` trong mảng)?". Mỗi số như vậy ghép với `x` hiện tại tạo thành 1 cặp hợp lệ (vì nó đứng trước `x`, đúng yêu cầu `i < j`).
4. `cnt[x] += 1` — LÀM SAU bước 3, ghi nhận đã gặp thêm 1 số `x`.
5. Vì sao thứ tự bước 3 trước bước 4 quan trọng? Nếu đảo ngược (ghi sổ trước, hỏi sau), một số có thể "tự ghép với chính mình" khi `target` đúng bằng `2*x` — sai đề.

**Vì sao không viết cách đơn giản hơn (2 vòng lặp lồng nhau)**: cách đó là so sánh MỌI cặp `(i, j)` với nhau — với N = 200000, số cặp lên tới khoảng 20 tỷ, máy tính không thể chạy xong trong 2 giây. Cách dùng "sổ đếm" (dict) ở trên chỉ duyệt mảng ĐÚNG 1 LẦN, nên luôn kịp giờ.

---

### 2. Đếm nghịch thế trong dãy số (`day15-dem-nghich-the`)

**Đề tóm tắt**: đếm xem có bao nhiêu cặp `(i, j)` với `i < j` mà số đứng trước (`a[i]`) lại LỚN HƠN số đứng sau (`a[j]`) — gọi là 1 "nghịch thế" (nghĩa là thứ tự bị đảo lộn so với sắp xếp tăng dần).

**Code đáp án**:
```python
n = int(input())
a = list(map(int, input().split()))
buf = [0] * n
width = 1
total = 0
while width < n:
    lo = 0
    while lo < n:
        mid = min(lo + width, n)
        hi = min(lo + 2 * width, n)
        i, j, k = lo, mid, lo
        while i < mid and j < hi:
            if a[i] <= a[j]:
                buf[k] = a[i]; i += 1
            else:
                buf[k] = a[j]; j += 1
                total += mid - i
            k += 1
        while i < mid:
            buf[k] = a[i]; i += 1; k += 1
        while j < hi:
            buf[k] = a[j]; j += 1; k += 1
        lo += 2 * width
    a, buf = buf, a
    width *= 2
print(total)
```

> **Lưu ý quan trọng**: bản đầu tiên của bài này dùng merge sort ĐỆ QUY (hàm tự gọi lại chính nó) và cần `import sys` để gọi `sys.setrecursionlimit(300000)` (tăng giới hạn số lần đệ quy, vì Python mặc định chỉ cho khoảng 1000 lần). Nhưng hệ thống chấm bài (Code Playground) CHẶN HẲN việc `import sys` vì lý do bảo mật (module `sys` có thể dùng để can thiệp sâu vào tiến trình chạy code) — nộp bài sẽ báo lỗi runtime **"Không được phép import module 'sys'"**. Vì vậy bản đáp án chính thức ở trên đã được viết lại theo kiểu KHÔNG ĐỆ QUY (gọi là "bottom-up merge sort"), không cần `sys` nữa. Đã kiểm chứng: nộp qua đúng judge pipeline thật cho kết quả `AC, 5/5 test pass` (kể cả test N=100000 chạy 681ms, trong giới hạn 3000ms).

**Giải thích từng bước** (đây là "bottom-up merge sort" — sắp xếp trộn nhưng ghép các đoạn nhỏ thành đoạn lớn dần bằng VÒNG LẶP, không phải bằng cách hàm tự gọi lại chính nó):
1. `width` — "độ rộng đoạn" hiện tại, bắt đầu từ 1. Ý tưởng: coi mỗi phần tử ban đầu là 1 "đoạn đã sắp xếp xong" (1 phần tử thì luôn tự sắp xếp đúng, không cần làm gì).
2. Vòng lặp ngoài (`while width < n`) — mỗi lần lặp sẽ "gấp đôi" độ rộng đoạn đã sắp xếp: từ các đoạn dài 1, ghép thành đoạn dài 2; từ đoạn dài 2, ghép thành đoạn dài 4; cứ thế cho tới khi width lớn hơn hoặc bằng cả mảng.
3. Vòng lặp trong (`while lo < n`) — trong mỗi "lượt gấp đôi", duyệt qua mảng theo từng cặp đoạn liền kề có độ dài `width`, ghép (trộn) từng cặp lại với nhau:
   - `mid` là điểm chia giữa 2 đoạn, `hi` là điểm kết thúc của cả cặp đoạn.
   - Dùng 2 con trỏ `i` (chạy trong đoạn trái, từ `lo` tới `mid`) và `j` (chạy trong đoạn phải, từ `mid` tới `hi`), giống hệt cách trộn của merge sort thông thường.
   - Nếu `a[i] <= a[j]`: không có gì bất thường, lấy phần tử trái ra trước.
   - Nếu `a[i] > a[j]`: đây là 1 nghịch thế (phần tử bên trái lớn hơn nhưng đứng trước) — và toàn bộ các phần tử còn lại trong đoạn trái (từ vị trí `i` tới `mid`) cũng đều lớn hơn `a[j]` (vì đoạn trái đã sắp xếp tăng dần) — cộng `mid - i` vào tổng nghịch thế.
4. Kết quả mỗi lượt ghép được ghi vào mảng phụ `buf`, sau khi ghép xong 1 lượt thì hoán đổi `a` và `buf` cho nhau (`a, buf = buf, a`) để lượt tiếp theo làm việc trên mảng mới đã sắp xếp một phần.
5. Khi `width >= n`, toàn bộ mảng đã trở thành 1 đoạn duy nhất, đã sắp xếp xong — `total` lúc này chính là tổng số nghịch thế.

**Vì sao không viết cách đơn giản hơn (2 vòng lặp lồng nhau)**: giống bài 1, với N=100000 sẽ là 5 tỷ phép so sánh — quá chậm. Merge sort đếm được nghịch thế "miễn phí" trong lúc sắp xếp, chỉ tốn thêm 1 dòng cộng số, nên nhanh hơn nhiều (khoảng 1.7 triệu phép tính thay vì 5 tỷ).

**Vì sao không viết theo kiểu đệ quy (hàm tự gọi lại chính nó) như sách giáo khoa thường dạy**: về mặt thuật toán, đệ quy và không đệ quy cho ra kết quả giống hệt nhau, độ phức tạp đều là O(N log N). Nhưng như đã giải thích ở trên, bản đệ quy cần `import sys` để tăng giới hạn đệ quy — điều mà hệ thống chấm bài này không cho phép. Đây là 1 bài học thực tế: đôi khi thuật toán ĐÚNG về lý thuyết vẫn phải điều chỉnh cách VIẾT CODE cho phù hợp với môi trường chạy thực tế (ở đây là 1 sandbox chấm bài có giới hạn về mặt bảo mật).

---

### 3. Giá trị xuất hiện nhiều nhất trong dãy lớn (`day15-gia-tri-xuat-hien-nhieu-nhat`)

**Đề tóm tắt**: cho N số, tìm xem giá trị nào xuất hiện nhiều lần nhất, in ra SỐ LẦN đó (không cần in giá trị là gì).

**Code đáp án**:
```python
from collections import Counter

n = int(input())
a = list(map(int, input().split()))
cnt = Counter(a)
print(max(cnt.values()) if cnt else 0)
```

**Giải thích từng bước**:
1. `Counter(a)` — Python có sẵn công cụ `Counter`, tự động đếm số lần xuất hiện của mỗi phần tử trong `a`, trả về 1 dict dạng `{giá_trị: số_lần_xuất_hiện}`. Chỉ cần 1 dòng, không cần tự viết vòng lặp đếm.
2. `cnt.values()` — lấy ra toàn bộ các "số lần xuất hiện" đã đếm được (bỏ qua giá trị gốc, chỉ lấy số lần).
3. `max(...)` — lấy số lớn nhất trong các số lần đó, chính là đáp án.
4. `if cnt else 0` — phòng trường hợp mảng rỗng (không có phần tử nào), tránh lỗi khi gọi `max()` trên danh sách rỗng (thực tế đề luôn có ít nhất 1 phần tử, nhưng viết vậy cho chắc chắn).

**Vì sao không viết cách đơn giản hơn (với mỗi số, duyệt lại cả mảng để đếm)**: cách đó là N × N = N² phép so sánh, với N=500000 sẽ là 250 tỷ — quá chậm. `Counter` chỉ duyệt mảng đúng 1 lần.

---

## Nhóm 2: Sorting

### 4. Gộp các khoảng thời gian chồng lấn (`day15-gop-khoang-thoi-gian`)

**Đề tóm tắt**: cho nhiều khoảng thời gian `[bắt_đầu, kết_thúc]`, gộp những khoảng có chung nhau (kể cả chạm đúng 1 điểm) lại thành 1 khoảng lớn hơn.

**Code đáp án**:
```python
n = int(input())
intervals = [list(map(int, input().split())) for _ in range(n)]
intervals.sort()
result = []
for s, e in intervals:
    if result and s <= result[-1][1]:
        result[-1][1] = max(result[-1][1], e)
    else:
        result.append([s, e])
for s, e in result:
    print(s, e)
```

**Giải thích từng bước**:
1. `intervals.sort()` — sắp xếp các khoảng theo điểm BẮT ĐẦU tăng dần trước (Python tự so sánh list `[s, e]` theo `s` trước, `e` sau nếu `s` bằng nhau). Đây là bước then chốt: sau khi sắp xếp, các khoảng có thể gộp với nhau chắc chắn nằm CẠNH NHAU trong danh sách, không cần so sánh mọi cặp.
2. `result = []` — danh sách chứa kết quả cuối cùng, mỗi phần tử là 1 khoảng đã gộp xong.
3. Với mỗi khoảng `(s, e)` (đã duyệt theo thứ tự đã sắp):
   - Nếu `result` đang có ít nhất 1 khoảng, VÀ điểm bắt đầu `s` của khoảng hiện tại `<=` điểm kết thúc của khoảng CUỐI CÙNG trong `result` — nghĩa là 2 khoảng này chồng lấn (hoặc chạm nhau) — gộp lại bằng cách cập nhật điểm kết thúc của khoảng cuối trong `result` thành `max(cũ, mới)` (phải lấy max vì khoảng mới có thể kết thúc SỚM HƠN khoảng cũ, ví dụ khoảng cũ là `[0,10]`, khoảng mới là `[2,3]` — vẫn phải giữ kết thúc là 10).
   - Ngược lại (không chồng lấn) — thêm khoảng hiện tại như 1 khoảng MỚI vào `result`.
4. In từng khoảng trong `result`.

**Vì sao không viết cách đơn giản hơn (so từng cặp khoảng với nhau)**: nếu không sắp xếp trước, phải kiểm tra mọi cặp khoảng xem có chồng lấn không — N² phép so sánh, lại còn phải xử lý việc "gộp dây chuyền" (A chồng B, B chồng C → cả 3 phải gộp) rất dễ viết sai. Sắp xếp trước giúp bài toán đơn giản thành 1 vòng lặp duy nhất.

> **Lưu ý về 1 lỗi đã gặp (không phải lỗi thuật toán)**: bản đầu tiên của hidden test lớn nhất dùng N=100000 khoảng, khiến output có tới ~1.29MB. Hệ thống chấm bài giới hạn stdout tối đa **64KB** mỗi lần chạy (`MAX_OUTPUT_BYTES` trong `code-runner.helper.ts`) — output vượt quá giới hạn này bị CẮT CỤT, khiến bài dù đúng thuật toán 100% vẫn bị chấm **Sai kết quả (WA)** vì phần output bị cắt không khớp đáp án đầy đủ. Đây là lỗi thiết kế test case (chọn N quá lớn cho 1 bài mà output tỉ lệ thuận với N), không phải lỗi logic code. Đã sửa: giảm N của test đó xuống 3000 (output ~29KB, an toàn dưới 64KB) — vẫn đủ lớn để không thể giải bằng cách vét cạn thủ công. Đã kiểm chứng lại qua đúng judge pipeline thật: `AC, 5/5 test pass`.
>
> **Bài học cho bản thân khi tự thiết kế test case**: nếu đề bài yêu cầu IN RA nhiều dòng (không phải chỉ in 1 con số kết quả như đếm/tổng), phải tính trước dung lượng output tỉ lệ với N trước khi chọn N cho test lớn — không phải cứ N sát giới hạn constraint (ở đây là 100000) là luôn an toàn, vì còn phải tôn trọng giới hạn KÍCH THƯỚC OUTPUT của riêng hệ thống chấm bài, tách biệt với giới hạn constraint trong đề.

---

### 5. K giá trị lớn nhất trong dòng dữ liệu (`day15-k-gia-tri-lon-nhat`)

**Đề tóm tắt**: cho N số và số K, in ra K số LỚN NHẤT trong dãy, theo thứ tự tăng dần.

**Code đáp án**:
```python
import heapq

n, k = map(int, input().split())
a = list(map(int, input().split()))
top_k = heapq.nlargest(k, a)
top_k.sort()
print(' '.join(map(str, top_k)))
```

**Giải thích từng bước**:
1. `heapq.nlargest(k, a)` — Python có sẵn hàm này để lấy ra K phần tử LỚN NHẤT của danh sách `a`, trả về theo thứ tự GIẢM DẦN. Bên trong, hàm này dùng 1 cấu trúc gọi là "heap" chỉ giữ K phần tử tại một thời điểm — nhanh hơn việc sắp xếp lại TOÀN BỘ mảng khi K nhỏ hơn N rất nhiều.
2. `top_k.sort()` — vì đề yêu cầu in theo thứ tự TĂNG DẦN (còn `nlargest` trả về giảm dần), phải sắp xếp lại K phần tử đó (chỉ K phần tử, rất nhanh vì K thường nhỏ).
3. In ra, các số cách nhau bởi dấu cách.

**Vì sao không viết cách đơn giản hơn (sắp xếp toàn bộ N phần tử rồi lấy K phần tử cuối)**: cách đó VẪN ĐÚNG và với bài này vẫn đủ nhanh (không bị chặn TLE) — nhưng nó lãng phí công sức sắp xếp toàn bộ N phần tử trong khi chỉ cần biết K phần tử lớn nhất. Nếu N rất lớn còn K rất nhỏ (ví dụ N=1 triệu, K=5), dùng `heapq.nlargest` sẽ nhanh hơn đáng kể.

---

### 6. Ghép số lớn nhất từ danh sách số (`day15-ghep-so-lon-nhat`)

**Đề tóm tắt**: cho N số (viết dưới dạng số nguyên), sắp xếp lại rồi NỐI CHUỖI chúng để tạo ra số lớn nhất có thể.

**Code đáp án**:
```python
from functools import cmp_to_key

n = int(input())
a = input().split()
a.sort(key=cmp_to_key(lambda x, y: -1 if x + y > y + x else (1 if x + y < y + x else 0)))
result = "".join(a)
print("0" if result[0] == "0" else result)
```

**Giải thích từng bước**:
1. `a = input().split()` — đọc các số dưới dạng CHUỖI (không ép kiểu `int`), vì ta sẽ ghép chuỗi, không tính toán số học.
2. Đây là điểm khó nhất của bài: **không thể so sánh 2 số theo giá trị số học thông thường**. Ví dụ so `9` và `30` theo giá trị thì `30 > 9`, nhưng nếu ghép theo thứ tự đó ra `"309"`, còn ghép ngược lại ra `"930"` — rõ ràng `"930" > "309"`, nên `9` phải đứng TRƯỚC `30`.
3. `cmp_to_key(lambda x, y: ...)` — viết 1 hàm so sánh TÙY CHỈNH giữa 2 chuỗi số `x` và `y`:
   - Thử ghép `x + y` (x trước, y sau) và `y + x` (y trước, x sau).
   - Nếu `x + y` (khi ghép thành 1 chuỗi rồi so sánh như so sánh chữ trong từ điển) LỚN HƠN `y + x` → `x` nên đứng trước `y` (trả về `-1`, nghĩa là "x nhỏ hơn y trong thứ tự sắp xếp" — dùng để sort giảm dần theo "độ tốt khi đứng trước").
   - Ngược lại thì `y` nên đứng trước `x` (trả về `1`).
   - Nếu bằng nhau, giữ nguyên (`0`).
4. `a.sort(key=cmp_to_key(...))` — sắp xếp toàn bộ danh sách theo quy tắc so sánh vừa định nghĩa.
5. `result = "".join(a)` — nối toàn bộ chuỗi số theo thứ tự vừa sắp xếp.
6. `"0" if result[0] == "0" else result` — xử lý trường hợp đặc biệt: nếu TOÀN BỘ các số đều là 0 (ví dụ đầu vào `[0, 0]`), kết quả nối chuỗi sẽ là `"00"` — nhưng số `"00"` không hợp lệ, phải in ra đúng `"0"`. Cách kiểm tra: nếu chữ số ĐẦU TIÊN của kết quả là `"0"`, nghĩa là mọi số đều là 0 (vì nếu có bất kỳ số nào khác 0, quy tắc so sánh ở bước 3 sẽ đẩy số đó lên đầu).

**Vì sao không viết cách đơn giản hơn (so sánh giá trị số trực tiếp)**: đã giải thích ở bước 2 — so sánh giá trị số cho ra thứ tự SAI, đây là lỗi về LOGIC (không phải lỗi tốc độ), rất dễ mắc nếu không để ý.

---

## Nhóm 3: Binary Search

### 7. Tìm kiếm trong mảng đã xoay (`day15-tim-kiem-mang-da-xoay`)

**Đề tóm tắt**: mảng đã sắp xếp tăng dần rồi bị "xoay" tại 1 điểm (ví dụ `[1,2,3,4,5]` xoay thành `[4,5,1,2,3]`). Tìm vị trí của 1 số `target` trong mảng đó.

**Code đáp án**:
```python
n = int(input())
a = list(map(int, input().split()))
target = int(input())
lo, hi = 0, n - 1
ans = -1
while lo <= hi:
    mid = (lo + hi) // 2
    if a[mid] == target:
        ans = mid
        break
    if a[lo] <= a[mid]:
        if a[lo] <= target < a[mid]:
            hi = mid - 1
        else:
            lo = mid + 1
    else:
        if a[mid] < target <= a[hi]:
            lo = mid + 1
        else:
            hi = mid - 1
print(ans)
```

**Giải thích từng bước**:
1. `lo`, `hi` là 2 biên trái/phải của đoạn đang tìm kiếm — giống binary search bình thường, bắt đầu là toàn bộ mảng.
2. `mid = (lo + hi) // 2` — lấy vị trí giữa. Nếu `a[mid]` đúng bằng `target`, tìm thấy luôn, dừng lại (`break`).
3. Phần khó nhất: mảng bị xoay nên KHÔNG THỂ chỉ so `target` với `a[mid]` để biết đi trái hay phải như binary search bình thường. Cần biết: trong 2 nửa `[lo, mid]` và `[mid, hi]`, NỬA NÀO ĐANG CÒN SẮP XẾP BÌNH THƯỜNG (không bị "gãy khúc" do điểm xoay nằm trong đó)?
   - Kiểm tra `a[lo] <= a[mid]` — nếu đúng, nghĩa là nửa TRÁI `[lo, mid]` không có điểm xoay, vẫn tăng dần bình thường.
     - Nếu `target` nằm trong khoảng `[a[lo], a[mid])` — chắc chắn nó ở nửa trái (vì nửa trái đang sắp xếp đúng) → thu hẹp `hi = mid - 1`.
     - Ngược lại, `target` phải ở nửa phải → `lo = mid + 1`.
   - Nếu `a[lo] <= a[mid]` SAI (nghĩa là nửa trái bị "gãy khúc" do chứa điểm xoay), thì chắc chắn nửa PHẢI `[mid, hi]` đang sắp xếp bình thường — áp dụng logic tương tự nhưng đảo chiều.
4. Lặp lại cho tới khi `lo > hi` (không tìm thấy, giữ nguyên `ans = -1`) hoặc tìm thấy target.

**Vì sao không viết cách đơn giản hơn (duyệt từng phần tử)**: duyệt tuyến tính vẫn ra đúng đáp số và với bài này vẫn kịp giờ, nhưng bài này CỐ TÌNH chặn thời gian chỉ còn 1 giây (thay vì 2-3 giây như các bài khác) để khuyến khích luyện đúng kỹ thuật binary search trên mảng xoay — đây là dạng bài rất hay gặp khi thi.

---

### 8. Chia sách thành K phần, tối thiểu hóa phần lớn nhất (`day15-chia-sach-toi-thieu-hoa`)

**Đề tóm tắt**: có N cuốn sách xếp theo thứ tự cố định, chia cho K người (mỗi người nhận 1 đoạn LIÊN TIẾP các cuốn sách). Tìm cách chia sao cho "người đọc nhiều trang nhất" đọc CÀNG ÍT TRANG CÀNG TỐT.

**Code đáp án**:
```python
def can_split(a, k, cap):
    parts = 1
    cur = 0
    for x in a:
        if x > cap:
            return False
        if cur + x > cap:
            parts += 1
            cur = x
        else:
            cur += x
    return parts <= k

n, k = map(int, input().split())
a = list(map(int, input().split()))
lo, hi = max(a), sum(a)
while lo < hi:
    mid = (lo + hi) // 2
    if can_split(a, k, mid):
        hi = mid
    else:
        lo = mid + 1
print(lo)
```

**Giải thích từng bước** (đây là kỹ thuật "binary search trên đáp án" — khác với binary search thông thường, ta không tìm 1 phần tử trong mảng, mà TÌM GIÁ TRỊ ĐÁP ÁN NHỎ NHẤT thỏa điều kiện):
1. Ý tưởng cốt lõi: thay vì nghĩ "chia thế nào", hãy nghĩ ngược lại — "NẾU mỗi người chỉ được đọc tối đa `cap` trang, thì có chia đủ cho K người không?". Hàm `can_split(a, k, cap)` trả lời câu hỏi đó.
2. Trong `can_split`: duyệt qua từng cuốn sách theo thứ tự, cố gắng dồn càng nhiều sách vào 1 người càng tốt (miễn không vượt `cap`) — hết chỗ (`cur + x > cap`) thì mới bắt đầu tính cho người tiếp theo (`parts += 1`). Đây là 1 bước THAM LAM (greedy) NHỎ nằm bên trong lời giải binary-search — không phải cả bài này là greedy.
3. Nếu 1 cuốn sách có số trang lớn hơn cả `cap` (`x > cap`), chắc chắn không thể chia được (dù chỉ 1 người đọc riêng cuốn đó cũng không đủ trần) → trả về `False` ngay.
4. Cuối cùng, so `parts` (số người CẦN dùng) với `k` (số người CÓ) — nếu `parts <= k`, nghĩa là `cap` này khả thi (thậm chí có thể còn dư người).
5. Phần binary search bên ngoài: tìm giá trị `cap` NHỎ NHẤT mà `can_split` vẫn trả về `True`.
   - `lo` bắt đầu từ `max(a)` — vì `cap` chắc chắn phải đủ chứa cuốn sách dày nhất, không thể nhỏ hơn.
   - `hi` bắt đầu từ `sum(a)` — trường hợp xấu nhất, dồn hết cho 1 người đọc.
   - Mỗi vòng lặp, thử `mid` ở giữa — nếu khả thi (`can_split` đúng), có thể còn giảm được nữa, thu hẹp `hi = mid`; nếu không khả thi, phải tăng `cap` lên, `lo = mid + 1`.
6. Khi `lo == hi`, đó chính là đáp án.

**Vì sao không viết cách đơn giản hơn (thử mọi cách chia)**: số cách chia N sách thành K đoạn tăng theo tổ hợp — với N=100000 thì không thể liệt kê hết, kể cả N=30 cũng đã quá nhiều. Nhờ nhận ra "cap càng lớn thì càng dễ chia được" (tính chất đơn điệu), ta có thể binary search trên GIÁ TRỊ đáp án thay vì liệt kê cách chia.

---

### 9. Đếm số lượng phần tử trong khoảng giá trị (`day15-dem-phan-tu-trong-khoang`)

**Đề tóm tắt**: cho 1 dãy số ĐÃ SẮP XẾP TĂNG DẦN và nhiều truy vấn `(L, R)`, mỗi truy vấn hỏi "có bao nhiêu phần tử có giá trị nằm trong khoảng `[L, R]`?".

**Code đáp án**:
```python
import bisect

n = int(input())
a = list(map(int, input().split()))
q = int(input())
out = []
for _ in range(q):
    l, r = map(int, input().split())
    left = bisect.bisect_left(a, l)
    right = bisect.bisect_right(a, r)
    out.append(str(right - left))
print('\n'.join(out))
```

**Giải thích từng bước**:
1. Vì mảng `a` đã sắp xếp sẵn, ta có thể dùng 2 hàm có sẵn của Python: `bisect_left` và `bisect_right` — cả 2 đều dùng kỹ thuật binary search bên trong, chạy rất nhanh (O(log N) mỗi lần gọi).
2. `bisect.bisect_left(a, l)` — tìm vị trí ĐẦU TIÊN mà phần tử `>= l` (gọi là "lower bound" — biên dưới).
3. `bisect.bisect_right(a, r)` — tìm vị trí ĐẦU TIÊN mà phần tử `> r` (gọi là "upper bound" — biên trên, nhưng LOẠI TRỪ giá trị đúng bằng `r`, tức là bao gồm cả những phần tử bằng `r`).
4. Số lượng phần tử nằm trong đoạn `[l, r]` chính là khoảng cách giữa 2 vị trí đó: `right - left`.
5. Lặp lại cho từng truy vấn, gom kết quả vào `out` rồi in 1 lần (`'\n'.join(out)`) — in gộp 1 lần thường nhanh hơn gọi `print()` nhiều lần liên tiếp khi có rất nhiều truy vấn.

**Vì sao không viết cách đơn giản hơn (mỗi truy vấn duyệt lại toàn mảng)**: với N và số truy vấn Q đều lớn (tới hàng trăm nghìn), duyệt lại toàn mảng cho MỖI truy vấn sẽ tốn N × Q phép tính — quá chậm. Nhờ mảng đã sắp xếp sẵn, `bisect` giúp mỗi truy vấn chỉ tốn thời gian rất ngắn.

---

## Nhóm 4: Greedy

### 10. Chọn tối đa hoạt động không giao nhau (`day15-chon-hoat-dong-khong-giao-nhau`)

**Đề tóm tắt**: cho nhiều hoạt động, mỗi hoạt động có khoảng thời gian `[bắt_đầu, kết_thúc)`. Chọn CÀNG NHIỀU hoạt động CÀNG TỐT sao cho không có 2 hoạt động nào bị trùng giờ.

**Code đáp án**:
```python
n = int(input())
activities = [tuple(map(int, input().split())) for _ in range(n)]
activities.sort(key=lambda x: x[1])
count = 0
last_end = float("-inf")
for s, e in activities:
    if s >= last_end:
        count += 1
        last_end = e
print(count)
```

**Giải thích từng bước**:
1. `activities.sort(key=lambda x: x[1])` — sắp xếp các hoạt động theo thời điểm KẾT THÚC tăng dần (chú ý: KHÔNG PHẢI theo thời điểm bắt đầu). Đây là điểm mấu chốt của bài.
2. `last_end` — ghi nhớ thời điểm kết thúc của hoạt động ĐÃ CHỌN gần nhất, khởi tạo là "âm vô cực" (chưa chọn gì).
3. Duyệt các hoạt động theo thứ tự đã sắp (kết thúc sớm nhất trước): nếu hoạt động hiện tại bắt đầu (`s`) sau hoặc đúng lúc hoạt động trước đó kết thúc (`s >= last_end`), nghĩa là KHÔNG bị trùng giờ với hoạt động đã chọn — chọn luôn nó, tăng `count`, cập nhật `last_end = e`.
4. Nếu bị trùng giờ, bỏ qua hoạt động đó, xét hoạt động tiếp theo.

**Tại sao "chọn hoạt động kết thúc sớm nhất trước" luôn đúng?** Trực giác: hoạt động kết thúc càng sớm thì càng "nhường chỗ" nhiều nhất cho các hoạt động tiếp theo có thể được chọn — nó "chiếm dụng" ít thời gian nhất có thể trên trục thời gian.

**Vì sao không viết cách đơn giản hơn (chọn hoạt động NGẮN NHẤT trước)**: nghe có vẻ hợp lý nhưng SAI — ví dụ có hoạt động `[1, 10]` (dài 9 đơn vị) và các hoạt động `[2,3], [3,4], [4,5], [5,6]` (mỗi cái ngắn hơn) — nếu ưu tiên chọn theo độ ngắn thì có thể chọn nhầm `[2,3]` trước rồi thôi vì không còn thời gian tốt hơn, trong khi cách đúng (ưu tiên kết thúc sớm) chọn được cả 4 hoạt động ngắn, bỏ hẳn `[1,10]` — kết quả tốt hơn hẳn.

---

### 11. Số bước nhảy ít nhất để tới đích (`day15-so-buoc-nhay-it-nhat`)

**Đề tóm tắt**: đứng ở vị trí 0, mỗi vị trí `i` có 1 con số `a[i]` là bước nhảy XA NHẤT có thể nhảy từ đó. Tìm số lần nhảy ÍT NHẤT để tới vị trí cuối cùng.

**Code đáp án**:
```python
n = int(input())
a = list(map(int, input().split()))
if n <= 1:
    print(0)
else:
    jumps = 0
    cur_end = 0
    farthest = 0
    for i in range(n - 1):
        farthest = max(farthest, i + a[i])
        if i == cur_end:
            jumps += 1
            cur_end = farthest
            if cur_end >= n - 1:
                break
    print(jumps)
```

**Giải thích từng bước** (đây là cách nghĩ "theo từng lượt nhảy", giống như game — mỗi lượt cố đi XA NHẤT CÓ THỂ):
1. Nếu mảng chỉ có 1 phần tử — đã ở đích ngay từ đầu, cần 0 bước nhảy.
2. `cur_end` — vị trí XA NHẤT có thể tới được với SỐ LƯỢT NHẢY đã dùng tính đến hiện tại (ví dụ: dùng đúng 1 lượt nhảy thì đi xa nhất được tới đâu).
3. `farthest` — trong lúc duyệt các vị trí `i` từ 0 tới hiện tại, đây là vị trí xa nhất CÓ THỂ đạt được nếu dùng THÊM 1 lượt nhảy nữa (tính từ bất kỳ vị trí nào đã đi qua).
4. Duyệt từng vị trí `i` (trừ vị trí cuối, vì không cần nhảy từ đích đi đâu nữa): cập nhật `farthest = max(farthest, i + a[i])` — luôn ghi nhớ "nếu đứng ở vị trí `i`, nhảy xa nhất có thể tới đâu".
5. Khi `i` chạm đúng `cur_end` (nghĩa là đã đi hết "tầm với" của số lượt nhảy hiện tại, không thể đi xa hơn nữa nếu không nhảy thêm) — BẮT BUỘC phải dùng thêm 1 lượt nhảy: `jumps += 1`, và tầm với mới trở thành `cur_end = farthest` (tầm xa nhất đã tính được ở các bước trước).
6. Nếu sau khi cập nhật, `cur_end` đã >= vị trí đích, dừng luôn (không cần duyệt tiếp).

**Vì sao không viết cách đơn giản hơn (BFS — duyệt theo từng "tầng" như tìm đường trong mê cung)**: BFS cũng cho ra đúng đáp số (và có trong [editorials.md](./editorials.md) như 1 hướng đối chứng), nhưng phải tự dựng "sơ đồ nối các vị trí với nhau" rồi dùng hàng đợi để duyệt — tốn thêm bộ nhớ và code phức tạp hơn. Cách viết ở trên "nén" ý tưởng BFS thành 1 vòng lặp đơn giản mà vẫn cho kết quả giống hệt.

---

### 12. Đổi tiền tối thiểu và cái bẫy của greedy (`day15-doi-tien-toi-thieu`)

**Đề tóm tắt**: có M loại tiền mệnh giá khác nhau (số lượng không giới hạn), cần đổi đúng số tiền S bằng ÍT TỜ TIỀN NHẤT có thể.

**Code đáp án**:
```python
m, s = map(int, input().split())
coins = list(map(int, input().split()))
INF = float("inf")
dp = [0] + [INF] * s
for i in range(1, s + 1):
    for c in coins:
        if c <= i and dp[i - c] + 1 < dp[i]:
            dp[i] = dp[i - c] + 1
print(dp[s] if dp[s] != INF else -1)
```

**Giải thích từng bước** (đây là quy hoạch động — dp — KHÔNG PHẢI thuật toán tham lam, dù trực giác đầu tiên thường nghĩ tới tham lam):
1. `dp[i]` là "số tờ tiền ÍT NHẤT cần dùng để đổi đúng số tiền `i`" — ta sẽ tính lần lượt `dp[0], dp[1], ..., dp[s]`.
2. `dp[0] = 0` — đổi đúng 0 đồng thì cần 0 tờ tiền (điều hiển nhiên, nhưng cần khai báo rõ vì đây là "điểm khởi đầu" để tính các `dp[i]` khác).
3. Các `dp[i]` khác ban đầu gán là "vô cực" (`INF`) — nghĩa là "chưa biết cách nào để đổi đúng số tiền này", sẽ được cập nhật dần trong vòng lặp.
4. Với mỗi số tiền `i` từ 1 đến `S`: thử LẦN LƯỢT từng loại mệnh giá `c` trong `coins`.
   - Nếu mệnh giá `c` không lớn hơn `i` (`c <= i`), ta CÓ THỂ dùng 1 tờ mệnh giá `c`, còn lại `i - c` đồng cần đổi tiếp — số tờ cần dùng trong trường hợp này là `dp[i - c] + 1` (1 tờ vừa dùng, cộng với cách tối ưu đã tính sẵn cho phần còn lại).
   - Nếu cách này ÍT TỜ HƠN cách đã biết trước đó (`dp[i - c] + 1 < dp[i]`), cập nhật lại `dp[i]` bằng giá trị nhỏ hơn này.
5. Sau khi thử hết mọi mệnh giá cho mọi số tiền từ 1 đến S, `dp[S]` chính là đáp án. Nếu vẫn còn là `INF`, nghĩa là không có cách nào đổi đúng số tiền S — in `-1`.

**Vì sao KHÔNG dùng tham lam (luôn lấy tờ mệnh giá lớn nhất có thể trước)?** — đây là điểm quan trọng nhất của bài: với hệ tiền quen thuộc (ví dụ VNĐ: 1, 2, 5, 10, 20, 50...), tham lam luôn cho kết quả ĐÚNG. Nhưng đề bài KHÔNG đảm bảo hệ mệnh giá "đẹp" như vậy. Ví dụ cụ thể: mệnh giá `[1, 3, 4]`, cần đổi `6` đồng — nếu tham lam (lấy `4` trước, còn dư `2`, phải dùng 2 tờ `1` nữa) thì tốn tổng cộng `3` tờ; nhưng cách tối ưu thật sự là `3 + 3 = 6`, chỉ tốn `2` tờ. Tham lam đã chọn sai ngay từ bước đầu (`4`) mà không biết "sửa sai" — đây là lý do phải dùng DP, vì DP xét đủ MỌI khả năng chứ không chọn theo cảm tính "lớn nhất trước".

---

## Nhóm 5: Graph / DP cơ bản

### 13. Đường đi ngắn nhất trên lưới ô vuông (`day15-duong-di-ngan-nhat-luoi`)

**Đề tóm tắt**: cho 1 lưới ô vuông, có ô là vật cản. Tìm số bước ÍT NHẤT để đi từ góc trên-trái tới góc dưới-phải (mỗi bước chỉ đi sang ô liền kề trên/dưới/trái/phải).

**Code đáp án**:
```python
from collections import deque

r, c = map(int, input().split())
grid = [list(map(int, input().split())) for _ in range(r)]
dist = [[-1] * c for _ in range(r)]
dist[0][0] = 0
q = deque([(0, 0)])
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < r and 0 <= ny < c and grid[nx][ny] == 0 and dist[nx][ny] == -1:
            dist[nx][ny] = dist[x][y] + 1
            q.append((nx, ny))
print(dist[r - 1][c - 1])
```

**Giải thích từng bước** (đây là thuật toán BFS — Breadth-First Search — "duyệt theo từng lớp/tầng khoảng cách", chuyên dùng để tìm đường đi NGẮN NHẤT khi mọi bước đi đều "nặng như nhau"):
1. `dist[x][y]` — mảng lưu "khoảng cách ngắn nhất từ ô xuất phát `(0,0)` tới ô `(x,y)`", khởi tạo toàn bộ là `-1` (nghĩa là "chưa biết/chưa tới được").
2. `dist[0][0] = 0` — ô xuất phát cách chính nó 0 bước.
3. `q = deque([(0, 0)])` — dùng 1 "hàng đợi" (deque — vào trước ra trước, giống xếp hàng), bắt đầu chỉ có ô xuất phát.
4. Lặp lại: lấy 1 ô ra khỏi đầu hàng đợi (`q.popleft()`), xét cả 4 ô liền kề của nó (trên/dưới/trái/phải, biểu diễn bằng 4 cặp `(dx, dy)`):
   - Ô liền kề phải THỎA: còn nằm trong lưới (`0 <= nx < r` và `0 <= ny < c`), không phải vật cản (`grid[nx][ny] == 0`), và CHƯA từng được thăm (`dist[nx][ny] == -1`).
   - Nếu thỏa cả 3 điều kiện, ghi nhận khoảng cách tới ô đó là `dist[ô hiện tại] + 1` (xa hơn ô hiện tại đúng 1 bước), rồi đẩy nó vào cuối hàng đợi để sau này tiếp tục xét các ô liền kề CỦA NÓ.
5. Vì sao BFS luôn cho khoảng cách NGẮN NHẤT? Vì nó xét các ô theo đúng thứ tự "gần trước, xa sau" — ô nào cách xuất phát 1 bước được xét hết trước, rồi mới tới các ô cách 2 bước, v.v. Điều này đảm bảo lần đầu tiên 1 ô được ghi nhận khoảng cách, đó CHẮC CHẮN là khoảng cách ngắn nhất tới nó (không thể có đường nào ngắn hơn được phát hiện sau).
6. Kết quả là `dist[r-1][c-1]` — khoảng cách tới ô đích. Nếu vẫn là `-1`, nghĩa là không có đường nào tới được.

**Vì sao không dùng DFS (đi sâu tới cùng trước, giống lần theo 1 con đường tới hết mới quay lại)?** DFS có thể tìm ra 1 đường đi tới đích, nhưng đường đó CHƯA CHẮC là đường NGẮN NHẤT — nó có thể đi vòng vèo trước khi tới đích. Đây là lỗi hiểu nhầm rất phổ biến khi mới học đồ thị: "tìm được đường" khác với "tìm được đường ngắn nhất".

---

### 14. Đếm số vùng liên thông trong đồ thị (`day15-dem-thanh-phan-lien-thong`)

**Đề tóm tắt**: cho N điểm (đỉnh) và các đường nối (cạnh) giữa chúng. Đếm xem đồ thị này chia thành bao nhiêu "cụm" tách biệt nhau (2 điểm cùng cụm nếu có đường đi qua lại được, kể cả gián tiếp qua nhiều cạnh).

**Code đáp án**:
```python
n, m = map(int, input().split())
edges = [tuple(map(int, input().split())) for _ in range(m)]
parent = list(range(n))

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[ra] = rb

for a, b in edges:
    union(a, b)

roots = set(find(i) for i in range(n))
print(len(roots))
```

**Giải thích từng bước** (kỹ thuật này gọi là "Union-Find" hoặc "Disjoint Set Union — DSU" — dùng để nhóm các phần tử vào từng "cụm"):
1. `parent = list(range(n))` — ban đầu, coi mỗi đỉnh là "đại diện" (gốc) của chính cụm chứa riêng nó: `parent[0] = 0`, `parent[1] = 1`, v.v. — nghĩa là chưa có đỉnh nào nối với đỉnh nào.
2. Hàm `find(x)` — tìm xem đỉnh `x` hiện đang thuộc cụm nào, bằng cách "đi ngược" theo `parent` cho tới khi gặp 1 đỉnh mà `parent[đỉnh đó] == chính nó` (đây gọi là "gốc" của cụm).
   - Dòng `parent[x] = parent[parent[x]]` là 1 mẹo tối ưu gọi là "nén đường" (path compression) — trong lúc tìm gốc, tranh thủ rút ngắn đường đi cho các lần tìm SAU này nhanh hơn (nếu không có dòng này, với đồ thị dạng "chuỗi dài" — ví dụ đỉnh 0 nối đỉnh 1, đỉnh 1 nối đỉnh 2, ... — việc tìm gốc sẽ ngày càng chậm).
3. Hàm `union(a, b)` — "gộp" 2 cụm chứa đỉnh `a` và đỉnh `b` lại làm 1: tìm gốc của cả 2 (`ra`, `rb`), nếu chúng khác nhau (chưa cùng cụm), cho gốc này trỏ về gốc kia — từ giờ cả 2 cụm coi như 1.
4. Với mỗi cạnh `(a, b)` trong danh sách cạnh cho trước, gọi `union(a, b)` — nghĩa là 2 đỉnh có cạnh nối thì phải cùng 1 cụm.
5. Sau khi xử lý hết mọi cạnh, tìm gốc của TỪNG đỉnh (`find(i)` cho `i` từ 0 đến N-1), gom vào 1 tập hợp `roots` (tập hợp tự động loại bỏ trùng lặp) — số lượng gốc KHÁC NHAU chính là số cụm (thành phần liên thông).

**Vì sao không dùng DFS/BFS (thử từ mỗi đỉnh chưa thăm, đi hết cả cụm rồi đếm)?** Cách đó cũng ĐÚNG và có trong [editorials.md](./editorials.md) như 1 hướng đối chứng, nhưng nếu dùng DFS kiểu đệ quy (hàm tự gọi lại chính nó) trên đồ thị dạng "chuỗi dài" (200000 đỉnh nối liên tiếp), Python có thể bị lỗi "đệ quy quá sâu" (`RecursionError`) nếu không tăng giới hạn đệ quy trước — Union-Find không gặp vấn đề này vì không dùng đệ quy.

---

### 15. Dãy con tăng dài nhất (`day15-day-con-tang-dai-nhat`)

**Đề tóm tắt**: cho N số, tìm ĐỘ DÀI của dãy con dài nhất mà các số trong đó tăng dần (không cần đứng cạnh nhau trong mảng gốc, nhưng phải giữ đúng thứ tự xuất hiện, và số sau phải LỚN HƠN số trước — không được bằng).

**Code đáp án**:
```python
import bisect

n = int(input())
a = list(map(int, input().split()))
tails = []
for x in a:
    i = bisect.bisect_left(tails, x)
    if i == len(tails):
        tails.append(x)
    else:
        tails[i] = x
print(len(tails))
```

**Giải thích từng bước** (đây là kỹ thuật khá "ảo diệu" gọi là "patience sorting" — cần đọc kỹ):
1. `tails` là 1 mảng phụ, LUÔN được giữ ở trạng thái SẮP XẾP TĂNG DẦN trong suốt quá trình chạy. Ý nghĩa của `tails[k]`: đây là giá trị NHỎ NHẤT có thể làm "số cuối cùng" của 1 dãy con tăng có độ dài `k+1`, TÍNH ĐẾN THỜI ĐIỂM HIỆN TẠI (đã xét hết các phần tử trước đó trong `a`).
2. Với mỗi số `x` trong mảng gốc `a` (duyệt theo đúng thứ tự xuất hiện):
   - `bisect.bisect_left(tails, x)` — tìm vị trí ĐẦU TIÊN trong `tails` mà giá trị `>= x` (dùng `bisect_left` vì đề yêu cầu tăng NGHIÊM NGẶT — không được bằng nhau).
   - Nếu vị trí đó nằm NGOÀI cuối mảng `tails` (`i == len(tails)`) — nghĩa là `x` LỚN HƠN mọi phần tử hiện có trong `tails` — `x` có thể "nối dài" thêm 1 dãy con tăng, làm cho độ dài tối đa tăng thêm 1: thêm `x` vào cuối `tails`.
   - Nếu không (tìm thấy 1 vị trí `i` cụ thể) — THAY THẾ `tails[i]` bằng `x`. Đây không phải là "xóa mất thông tin" — vì `x <= tails[i]` (nó vừa được tìm thấy tại vị trí đó), nên `x` là 1 lựa chọn "cuối dãy" TỐT HƠN hoặc BẰNG so với giá trị cũ ở vị trí đó — giữ tiềm năng mở rộng tốt hơn cho các phần tử tiếp theo trong mảng.
3. Sau khi duyệt hết `a`, ĐỘ DÀI của `tails` (không phải nội dung của nó) chính là đáp án.

**Điều quan trọng cần nhớ**: mảng `tails` sau khi chạy xong KHÔNG PHẢI là 1 dãy con thực sự tồn tại trong mảng gốc `a` — nó chỉ là 1 công cụ "theo dõi tiềm năng", nhưng ĐỘ DÀI của nó luôn đúng bằng độ dài của dãy con tăng dài nhất thực sự.

**Vì sao không viết cách đơn giản hơn (dp[i] = độ dài LIS kết thúc tại i, xét mọi j < i)?** Cách đó ĐÚNG hoàn toàn về mặt logic (và dễ hiểu hơn), nhưng với mỗi phần tử `i`, phải xét lại TẤT CẢ các phần tử `j` đứng trước nó — tổng cộng N² phép so sánh. Với N=100000, đó là 10 tỷ phép tính — quá chậm (đã tự kiểm tra: cách này thực sự bị timeout trên test lớn). Cách dùng `tails` + `bisect_left` chỉ cần 1 lần tìm kiếm nhị phân cho mỗi phần tử, nhanh hơn rất nhiều.

---

## Cách tự kiểm tra lại (không cần tin lời giải thích ở trên)

Nếu muốn tự tay xác nhận từng đáp án chạy đúng và đúng tốc độ, copy `solutionCode` của bài tương ứng trong `initial-exercises-day15.ts`, dán vào file `.py`, chạy thử với input mẫu (phần `testCases` của bài đó, các case có `isHidden: false`), so sánh output với `expectedOutput`. Đây cũng chính là cách đã dùng để kiểm chứng toàn bộ 73 test case của cả 15 bài trước khi đưa vào hệ thống (xem [complexity-rubric.md](./complexity-rubric.md) mục "Cách tái chạy kiểm chứng").
