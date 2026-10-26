# Đáp án chi tiết — Bộ 20 bài Python cho lớp 6-9 (Ngày 14)

File này dùng để **đọc hiểu code đáp án**, không phải chỉ để copy-paste. Mỗi bài có 4 phần:
- **Đề tóm tắt**: nói lại đề bằng 1-2 câu ngắn.
- **Code đáp án**: y hệt `solutionCode` trong hệ thống (`initial-exercises-day14.ts`), đã chạy qua Python thật và khớp 100% với `expectedOutput` của mọi test case (93 test case, 20 bài).
- **Giải thích từng bước**: đọc code từ trên xuống, dòng nào làm gì, tại sao viết như vậy.
- **Vì sao không viết cách đơn giản hơn / lỗi hay gặp**: chỉ ra cách nghĩ sai phổ biến hoặc edge case dễ bỏ sót.

Nếu vẫn thấy khó, đọc thêm [editorials.md](./editorials.md) (nói kỹ hơn về edge case và lỗi phổ biến cho từng bài) — file này chỉ tập trung giải thích ĐÚNG 1 hướng đáp án chính.

> **Lưu ý về phạm vi file này**: các khối "Code đáp án" dưới đây là `solutionCode` — lời giải ĐẦY ĐỦ, dùng để đọc hiểu và đối chiếu, không phải những gì học sinh nhìn thấy khi mở bài trên hệ thống. Trên giao diện thật, học sinh bắt đầu từ `starterCode` (đã có sẵn phần đọc input, chỉ thiếu phần logic) và có thể xin gợi ý theo 3 tầng tăng dần: Tầng 1/2 là gợi ý bằng lời (đã xuống dòng rõ ràng theo từng bước), Tầng 3 (hint3) là 1 khung code SƯỜN (giữ nguyên phần đọc input/cấu trúc if-else/vòng lặp nhưng phần logic cốt lõi để trống bằng `# TODO`, không phải lời giải đầy đủ như dưới đây) — học sinh vẫn phải tự điền nốt phần TODO đó mới ra được đáp án hoàn chỉnh.

---

## Nhóm 1: Input / Output

### 1. Chào hỏi theo tên (`day14-chao-hoi-theo-ten`)

**Đề tóm tắt**: đọc 1 tên, in ra câu "Xin chao, `<ten>`!".

**Code đáp án**:
```python
ten = input()
print(f"Xin chao, {ten}!")
```

**Giải thích từng bước**:
1. `input()` đọc 1 dòng từ bàn phím (ở đây là tên), lưu vào biến `ten`.
2. `f"Xin chao, {ten}!"` — dùng f-string để chèn giá trị biến `ten` vào đúng vị trí trong câu, giữ nguyên dấu phẩy sau "Xin chao" và dấu chấm than ở cuối.

**Lỗi hay gặp**: quên rằng `input()` đã tự bỏ ký tự xuống dòng cuối — không cần gọi thêm `.strip()` (gọi cũng không sai, chỉ là thừa).

---

### 2. Tính tiền mua hàng có thuế (`day14-tinh-tien-co-thue`)

**Đề tóm tắt**: đọc giá gốc, thuế 10%, in ra tổng tiền làm tròn 2 chữ số thập phân.

**Code đáp án**:
```python
gia = float(input())
tong = gia * 1.1
print(f"{tong:.2f}")
```

**Giải thích từng bước**:
1. `float(input())` đọc giá gốc, ép kiểu số thực (vì giá có thể có phần thập phân).
2. `gia * 1.1` — thuế 10% nghĩa là tổng = giá gốc + 10% giá gốc = giá gốc × 1.1.
3. `f"{tong:.2f}"` — định dạng in ra LUÔN đúng 2 chữ số thập phân (kể cả khi số tròn, ví dụ 110 vẫn in "110.00").

**Vì sao không dùng `round(tong, 2)` rồi in trực tiếp**: `round()` không đảm bảo hiển thị đủ 2 chữ số 0 ở cuối (ví dụ `round(110.0, 2)` in ra `110.0` chứ không phải `110.00`) — phải dùng định dạng chuỗi `:.2f`, không phải làm tròn số học.

---

### 3. Đổi phút thành giờ và phút (`day14-doi-phut-thanh-gio-phut`)

**Đề tóm tắt**: đọc N phút, in ra dạng "Xh Ym".

**Code đáp án**:
```python
n = int(input())
gio = n // 60
phut = n % 60
print(f"{gio}h {phut}m")
```

**Giải thích từng bước**:
1. `n // 60` — chia lấy phần nguyên cho 60, ra số giờ.
2. `n % 60` — chia lấy số dư cho 60, ra số phút còn lại.
3. In theo đúng khuôn `"{gio}h {phut}m"`, kể cả khi `gio` hoặc `phut` bằng 0 (không được bỏ qua, ví dụ 45 phút phải in "0h 45m" chứ không phải chỉ "45m").

**Lỗi hay gặp**: nhầm lẫn thứ tự `//` và `%`, hoặc cố tình bỏ in "0h"/"0m" khi giá trị bằng 0.

---

### 4. Định dạng hóa đơn nhiều dòng (`day14-dinh-dang-hoa-don`)

**Đề tóm tắt**: đọc tên, số lượng, đơn giá — in 3 dòng theo khuôn cố định.

**Code đáp án**:
```python
ten = input()
n = int(input())
gia = float(input())
print(f"San pham: {ten}")
print(f"So luong: {n}")
print(f"Thanh tien: {n * gia:.2f}")
```

**Giải thích từng bước**:
1. Đọc đúng thứ tự 3 dòng: tên (chuỗi, không ép kiểu số), số lượng (`int`), đơn giá (`float`).
2. In 3 dòng theo đúng khuôn mẫu, dòng cuối tính `n * gia` và định dạng 2 chữ số thập phân.

**Lỗi hay gặp**: đọc sai thứ tự 3 dòng; quên ép kiểu `float()` cho đơn giá dù input có thể trông như số nguyên (ví dụ "5000") — đơn giá về bản chất vẫn là số thực.

---

## Nhóm 2: List

### 5. Tổng và trung bình cộng danh sách (`day14-tong-trung-binh-danh-sach`)

**Đề tóm tắt**: đọc N số, in tổng và trung bình cộng (2 chữ số thập phân).

**Code đáp án**:
```python
n = int(input())
nums = list(map(int, input().split()))
tong = sum(nums)
print(tong)
print(f"{tong / n:.2f}")
```

**Giải thích từng bước**:
1. `list(map(int, input().split()))` — đọc 1 dòng, tách theo dấu cách, ép từng phần thành số nguyên, gom thành list.
2. `sum(nums)` — Python có sẵn hàm tính tổng cả danh sách, không cần tự viết vòng lặp cộng dồn.
3. In tổng, rồi in trung bình = `tong / n` (chia thực bằng `/`, không phải chia nguyên `//`), định dạng 2 chữ số thập phân.

**Lỗi hay gặp**: dùng `//` thay vì `/` khi tính trung bình (nếu quen ngôn ngữ khác có thể nhầm), làm mất phần thập phân.

---

### 6. Đếm số lần xuất hiện của một giá trị (`day14-dem-so-lan-xuat-hien`)

**Đề tóm tắt**: đọc N số và giá trị X, đếm X xuất hiện bao nhiêu lần.

**Code đáp án**:
```python
n = int(input())
nums = list(map(int, input().split()))
x = int(input())
print(nums.count(x))
```

**Giải thích từng bước**: `list.count(x)` là phương thức có sẵn, đếm số lần `x` xuất hiện trong danh sách — không cần tự viết vòng lặp so sánh từng phần tử.

**Lỗi hay gặp**: quên `int()` khi đọc X, khiến so sánh `str` với `int` luôn sai (đếm ra 0 dù thực tế có xuất hiện).

---

### 7. Loại bỏ phần tử trùng lặp, giữ thứ tự xuất hiện (`day14-loai-bo-trung-lap`)

**Đề tóm tắt**: đọc N số, in ra danh sách sau khi loại trùng lặp, GIỮ NGUYÊN thứ tự xuất hiện đầu tiên.

**Code đáp án**:
```python
n = int(input())
nums = list(map(int, input().split()))
da_thay = set()
ket_qua = []
for x in nums:
    if x not in da_thay:
        da_thay.add(x)
        ket_qua.append(x)
print(' '.join(map(str, ket_qua)))
```

**Giải thích từng bước**:
1. `da_thay` — 1 set dùng để "ghi nhớ" các giá trị đã gặp, tra cứu nhanh (O(1)).
2. Duyệt từng số theo đúng thứ tự ban đầu — nếu CHƯA có trong `da_thay`, thêm vào cả `da_thay` (đánh dấu đã gặp) và `ket_qua` (kết quả); nếu đã có rồi thì bỏ qua.
3. In `ket_qua`, các số cách nhau bởi dấu cách.

**Vì sao không dùng `list(set(nums))` để loại trùng**: `set` trong Python KHÔNG đảm bảo giữ đúng thứ tự phần tử — đề bài yêu cầu giữ nguyên thứ tự xuất hiện đầu tiên, nên phải tự duyệt tuần tự và dùng set chỉ để tra cứu "đã gặp chưa", không dùng để loại trùng trực tiếp.

---

### 8. Trộn hai danh sách đã sắp xếp (`day14-tron-hai-danh-sach-sap-xep`)

**Đề tóm tắt**: đọc 2 danh sách A, B — in ra danh sách hợp nhất theo thứ tự tăng dần (giữ cả phần tử trùng lặp).

**Code đáp án**:
```python
n = int(input())
a = list(map(int, input().split()))
m = int(input())
b = list(map(int, input().split()))
ket_qua = sorted(a + b)
print(' '.join(map(str, ket_qua)))
```

**Giải thích từng bước**:
1. Đọc đúng 4 dòng cố định: N, danh sách A, M, danh sách B — kể cả khi N=0 hoặc M=0, vẫn phải đọc dòng đó (khi đó `input().split()` trả về list rỗng, không lỗi).
2. Nối `a + b` thành 1 list, `sorted()` sắp xếp tăng dần.
3. In ra — nếu list rỗng, `join` tự cho ra chuỗi rỗng, đúng là 1 dòng trống.

**Bài học thiết kế input quan trọng**: định dạng input phải LUÔN có đúng số dòng cố định, không phụ thuộc giá trị dữ liệu (không được bỏ qua dòng "danh sách" chỉ vì N=0) — nếu không, chương trình đọc lệch dòng và lỗi ở những test tưởng như đơn giản nhất.

---

## Nhóm 3: Loop

### 9. In bảng cửu chương (`day14-bang-cuu-chuong`)

**Đề tóm tắt**: đọc N, in 10 dòng bảng cửu chương N.

**Code đáp án**:
```python
n = int(input())
for i in range(1, 11):
    print(f"{n} x {i} = {n * i}")
```

**Giải thích từng bước**: `range(1, 11)` cho `i` chạy 1, 2, ..., 10 (đúng 10 dòng theo đề). Mỗi lần lặp in 1 dòng theo khuôn `f"{n} x {i} = {n * i}"`.

**Lỗi hay gặp**: sai khoảng `range` — dùng `range(1, 10)` thiếu dòng cuối (chỉ tới i=9), hoặc `range(0, 10)` thừa dòng "N x 0".

---

### 10. Đếm số chữ số của một số nguyên (`day14-dem-so-chu-so`)

**Đề tóm tắt**: đọc N (có thể âm), đếm số lượng chữ số (không tính dấu âm).

**Code đáp án**:
```python
n = abs(int(input()))
if n == 0:
    print(1)
else:
    dem = 0
    while n > 0:
        n //= 10
        dem += 1
    print(dem)
```

**Giải thích từng bước**:
1. `abs()` bỏ dấu âm trước khi đếm chữ số.
2. Trường hợp đặc biệt N=0: vòng lặp `while n > 0` sẽ KHÔNG chạy lần nào nếu n=0 ngay từ đầu — nhưng số 0 vẫn có đúng 1 chữ số, nên phải xử lý riêng bằng `if n == 0: print(1)`.
3. Với N khác 0: mỗi lần lặp, `n //= 10` bỏ đi chữ số cuối, tăng biến đếm — lặp tới khi n về 0.

**Lỗi hay gặp**: quên xử lý N=0 riêng (sẽ in ra 0 chữ số thay vì 1); quên `abs()` khiến vòng lặp `while n > 0` không chạy đúng với số âm.

---

### 11. Số hoàn thiện — Perfect Number (`day14-so-hoan-thien`)

**Đề tóm tắt**: kiểm tra N có bằng tổng các ước số dương của nó (không tính chính nó) không.

**Code đáp án**:
```python
n = int(input())
tong = 0
for i in range(1, n):
    if n % i == 0:
        tong += i
print("YES" if tong == n else "NO")
```

**Giải thích từng bước**:
1. `range(1, n)` — duyệt các số từ 1 đến N-1 (KHÔNG tính N), vì đề yêu cầu "không tính chính nó".
2. Với mỗi `i`, nếu `n % i == 0` (i là ước của n), cộng vào tổng.
3. So sánh tổng ước số với N — bằng nhau thì "YES", khác thì "NO".

**Lỗi hay gặp phổ biến nhất**: dùng `range(1, n+1)` (tính cả N) thay vì `range(1, n)` — vì N luôn chia hết cho chính nó, cộng thêm N vào tổng sẽ làm sai kết quả với mọi N. Test case N=1 được thiết kế riêng để bắt lỗi off-by-one này (đáp án đúng là "NO", vì không có ước dương nào nhỏ hơn 1).

---

### 12. Kiểm tra ma trận đối xứng (`day14-ma-tran-doi-xung`)

**Đề tóm tắt**: kiểm tra ma trận NxN có đối xứng qua đường chéo chính không (`matrix[i][j] == matrix[j][i]` với mọi i, j).

**Code đáp án**:
```python
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
doi_xung = True
for i in range(n):
    for j in range(n):
        if matrix[i][j] != matrix[j][i]:
            doi_xung = False
print("YES" if doi_xung else "NO")
```

**Giải thích từng bước**:
1. Đọc N dòng, mỗi dòng là 1 hàng của ma trận, tạo thành list-trong-list bằng list comprehension.
2. Dùng 2 vòng lặp lồng nhau (`i`, `j` đều chạy 0..N-1) để so sánh MỌI cặp `matrix[i][j]` với `matrix[j][i]`.
3. Nếu tìm thấy bất kỳ cặp nào khác nhau, đánh dấu `doi_xung = False` — vẫn tiếp tục vòng lặp cho hết (không dừng sớm), rồi in kết quả cuối cùng.

**Lỗi hay gặp**: chỉ so sánh nửa trên/nửa dưới đường chéo một cách sai sót, bỏ sót cặp; hoặc dùng `break` không đúng cách khiến vòng lặp `for` bên trong dừng nhưng vòng ngoài vẫn tiếp tục chạy thừa (không sai kết quả nhưng lãng phí, cần phân biệt "tối ưu sớm" và "sai logic").

---

## Nhóm 4: Function

### 13. Viết hàm kiểm tra số nguyên tố (`day14-ham-kiem-tra-nguyen-to`)

**Đề tóm tắt**: viết hàm `is_prime(n)`.

**Code đáp án**:
```python
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

n = int(input())
print("YES" if is_prime(n) else "NO")
```

**Giải thích từng bước**:
1. Chặn `n < 2` trước — số 0, 1, số âm KHÔNG phải số nguyên tố.
2. Chỉ cần kiểm tra ước từ 2 đến CĂN BẬC HAI của n là đủ (không cần kiểm tra tới n) — nếu n có ước lớn hơn căn bậc hai, chắc chắn cũng có ước nhỏ hơn hoặc bằng căn bậc hai tương ứng.
3. Tìm thấy 1 ước bất kỳ trong khoảng đó → trả về `False`; không tìm thấy ước nào → trả về `True`.

**Lỗi hay gặp**: quên chặn `n < 2` — nếu không chặn, với N=1, vòng lặp `range(2, int(1**0.5)+1)` = `range(2, 2)` rỗng, hàm sẽ trả `True` sai (1 không phải số nguyên tố).

---

### 14. Hàm tính giai thừa có kiểm tra đầu vào (`day14-ham-tinh-giai-thua`)

**Đề tóm tắt**: viết hàm `factorial(n)`, quy ước `0! = 1`, n âm trả về -1.

**Code đáp án**:
```python
def factorial(n):
    if n < 0:
        return -1
    ket_qua = 1
    for i in range(2, n + 1):
        ket_qua *= i
    return ket_qua

n = int(input())
print(factorial(n))
```

**Giải thích từng bước**:
1. Chặn `n < 0` — trả về -1 (giá trị báo lỗi) ngay.
2. Khởi tạo `ket_qua = 1` — đúng cho cả trường hợp n=0 (0! = 1).
3. Vòng lặp `range(2, n+1)` nhân dồn từ 2 đến n — nếu n=0 hoặc n=1, vòng lặp không chạy lần nào, `ket_qua` giữ nguyên là 1 (đúng theo quy ước).

**Lỗi hay gặp**: nhầm quy ước 0! = 1 thành "không tính được" (trả về -1 sai cho n=0); dùng đệ quy không kiểm soát cho n âm, dễ lỗi thay vì trả về -1 có kiểm soát ngay từ đầu.

---

### 15. Hàm tái sử dụng: quy đổi điểm chữ (`day14-ham-quy-doi-diem-chu`)

**Đề tóm tắt**: viết hàm `xep_loai(diem)` theo ngưỡng A/B/C/D/F.

**Code đáp án**:
```python
def xep_loai(diem):
    if diem >= 9:
        return "A"
    if diem >= 8:
        return "B"
    if diem >= 6.5:
        return "C"
    if diem >= 5:
        return "D"
    return "F"

n = int(input())
diems = list(map(float, input().split()))
for d in diems:
    print(xep_loai(d))
```

**Giải thích từng bước**: kiểm tra từ ngưỡng CAO xuống THẤP (9 → 8 → 6.5 → 5), dùng `return` ngay khi khớp ngưỡng nào — không cần lồng nhiều `else` phức tạp. Nếu không khớp ngưỡng nào ở trên, mặc định là "F".

**Lỗi hay gặp**: dùng dấu `>` thay vì `>=` ở biên (khiến điểm đúng 9.0 bị tính "B" thay vì "A"); kiểm tra theo thứ tự TĂNG DẦN ngưỡng (kiểm tra `< 5` trước) — dễ sai logic nếu không return sớm đúng cách.

---

### 16. Hàm đệ quy: đếm số lần xuất hiện trong danh sách (`day14-ham-de-quy-dem-xuat-hien`)

**Đề tóm tắt**: viết hàm ĐỆ QUY `dem(nums, x)`, không dùng `.count()`, không dùng `for`/`while`.

**Code đáp án**:
```python
def dem(nums, x):
    if len(nums) == 0:
        return 0
    dau = 1 if nums[0] == x else 0
    return dau + dem(nums[1:], x)

n = int(input())
nums = list(map(int, input().split()))
x = int(input())
print(dem(nums, x))
```

**Giải thích từng bước**:
1. Trường hợp dừng (base case): danh sách rỗng → trả về 0 (không còn gì để đếm).
2. Kiểm tra phần tử ĐẦU TIÊN (`nums[0]`) có bằng `x` không — 1 điểm nếu đúng, 0 nếu sai.
3. Cộng điểm đó với kết quả gọi lại CHÍNH hàm `dem()` cho PHẦN CÒN LẠI của danh sách (`nums[1:]`, bỏ phần tử đầu) — đây chính là đệ quy, không dùng vòng lặp.

**Lỗi hay gặp**: quên trường hợp dừng (`len(nums) == 0`), khiến đệ quy chạy tới khi danh sách rỗng vẫn cố truy cập `nums[0]`, gây lỗi; viết đệ quy nhưng lén dùng `for`/`while` bên trong — không sai kết quả nhưng sai tinh thần yêu cầu đề (chỉ được dùng đệ quy).

---

## Nhóm 5: Simulation (Game Logic)

### 17. Mô phỏng oẳn tù tì — Kéo Búa Bao (`day14-oan-tu-ti`)

**Đề tóm tắt**: đọc lựa chọn 2 người chơi, xác định ai thắng.

**Code đáp án**:
```python
p1 = input()
p2 = input()
thang = {"keo": "bao", "bua": "keo", "bao": "bua"}
if p1 == p2:
    print("HOA")
elif thang[p1] == p2:
    print("P1")
else:
    print("P2")
```

**Giải thích từng bước**:
1. Dùng 1 dict `thang` để ghi "lựa chọn này thắng lựa chọn nào" — thay vì viết nhiều `if/elif` rắc rối cho từng cặp.
2. Nếu 2 lựa chọn giống nhau → hòa.
3. Kiểm tra `thang[p1] == p2` — nếu đúng, lựa chọn của p1 thắng lựa chọn của p2 → "P1"; nếu không → "P2".

**Lỗi hay gặp**: viết thiếu 1 trong 6 tổ hợp thắng/thua khi dùng if/elif tay; nhầm chiều thắng (nhớ ngược "keo thắng bua" thành "bua thắng keo").

---

### 18. Mô phỏng thang máy đơn giản (`day14-mo-phong-thang-may`)

**Đề tóm tắt**: mô phỏng thang máy đi UP/DOWN trong tòa nhà 10 tầng, không vượt biên.

**Code đáp án**:
```python
n = int(input())
lenh = input().split() if n > 0 else []
tang = 1
for l in lenh:
    if l == "UP" and tang < 10:
        tang += 1
    elif l == "DOWN" and tang > 1:
        tang -= 1
print(tang)
```

**Giải thích từng bước**: xử lý từng lệnh tuần tự, bắt đầu ở tầng 1. Lệnh "UP" chỉ có tác dụng nếu tầng hiện tại CHƯA đạt tầng 10; lệnh "DOWN" chỉ có tác dụng nếu tầng hiện tại CHƯA xuống tầng 1 — các lệnh vượt biên bị bỏ qua thầm lặng (thang máy đứng yên).

**Lỗi hay gặp**: quên kiểm tra biên (`tang < 10` / `tang > 1`) trước khi cộng/trừ, khiến thang máy có thể "vượt tầng" ra ngoài phạm vi hợp lệ.

---

### 19. Mô phỏng túi đồ trong game nhập vai (`day14-mo-phong-tui-do`)

**Đề tóm tắt**: mô phỏng túi đồ có sức chứa C, xử lý lệnh ADD/REMOVE.

**Code đáp án**:
```python
c = int(input())
n = int(input())
tui = []
for _ in range(n):
    lenh = input().split()
    hanh_dong = lenh[0]
    ten = lenh[1]
    if hanh_dong == "ADD":
        if len(tui) < c:
            tui.append(ten)
    elif hanh_dong == "REMOVE":
        if ten in tui:
            tui.remove(ten)
for vat_pham in tui:
    print(vat_pham)
```

**Giải thích từng bước**:
1. Túi là 1 list Python bình thường.
2. "ADD" chỉ thêm nếu túi CHƯA đầy (`len(tui) < c`) — nếu đầy, lệnh bị bỏ qua thầm lặng.
3. "REMOVE" chỉ xóa nếu tên đó THẬT SỰ có trong túi (kiểm tra `if ten in tui` trước khi `.remove()`) — tránh lỗi khi xóa vật phẩm không tồn tại.
4. In từng vật phẩm còn lại, giữ đúng thứ tự đã thêm vào.

**Lỗi hạ tầng đã phát hiện và vá (không phải lỗi thuật toán của bài này)**: khi chạy qua đúng pipeline chấm bài thật (Windows), `print()` sinh ra `\r\n` trong khi test kỳ vọng `\n`, khiến bài đúng logic 100% vẫn bị chấm sai — đã vá tận gốc ở `judge-queue.service.ts` (chuẩn hóa `\r\n` → `\n` trước khi so sánh). Bài học: luôn kiểm chứng qua đúng pipeline chấm bài thật, không chỉ tin vào việc chạy code trên máy cá nhân.

---

### 20. Mô phỏng trận đấu theo lượt (`day14-mo-phong-tran-dau`)

**Đề tóm tắt**: 2 nhân vật đánh xen kẽ, ai hết máu trước thì thua.

**Code đáp án**:
```python
hp1, atk1 = map(int, input().split())
hp2, atk2 = map(int, input().split())
luot_p1 = True
while True:
    if luot_p1:
        hp2 -= atk1
        if hp2 <= 0:
            print("P1")
            break
    else:
        hp1 -= atk2
        if hp1 <= 0:
            print("P2")
            break
    luot_p1 = not luot_p1
```

**Giải thích từng bước**:
1. Dùng biến boolean `luot_p1` theo dõi lượt đánh hiện tại.
2. Trong `while True`, người đang tới lượt trừ máu đối thủ — kiểm tra NGAY sau khi trừ máu xem đối thủ đã thua chưa (`<= 0`), nếu thua thì in kết quả và `break` NGAY, không chờ đối thủ đánh lại.
3. Nếu chưa ai thua, đảo lượt (`luot_p1 = not luot_p1`) rồi lặp tiếp.

**Lỗi hay gặp**: kiểm tra điều kiện thắng SAU KHI đã đổi lượt thay vì NGAY SAU khi trừ máu — nếu người đánh trước hạ gục đối thủ ngay lượt đầu, code sai sẽ "đánh thừa" thêm 1 lượt trước khi phát hiện đã có người thua, có thể gây sai kết quả ở các bài phức tạp hơn (dù ở bài này thắng-thua vẫn đúng, chỉ là thói quen mô phỏng sai cần sửa sớm).

---

## Cách tự kiểm tra lại (không cần tin lời giải thích ở trên)

Copy `solutionCode` của bài tương ứng trong `initial-exercises-day14.ts`, dán vào file `.py`, chạy thử với input mẫu (test case có `isHidden: false`), so sánh output với `expectedOutput`. Đây cũng chính là cách đã dùng để kiểm chứng toàn bộ 93 test case của cả 20 bài (script Python chạy `subprocess` qua từng `solutionCode`, không dựa vào đọc lại bằng mắt).
