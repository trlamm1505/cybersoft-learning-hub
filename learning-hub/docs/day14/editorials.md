# Editorials — Bộ 20 bài Python cho lớp 6-9 (Ngày 14)

Tài liệu này giải thích ý tưởng giải, edge case cần lưu ý, và lỗi phổ biến học sinh dễ mắc cho từng bài trong bộ 20 bài. Dùng cho giáo viên chấm/chữa bài hoặc học sinh tự đối chiếu sau khi làm.

Quy ước: mỗi bài có `slug` để tra trong hệ thống (Code Playground), độ khó tăng dần trong từng nhóm, và `prerequisiteSlug` (bài liền trước cần hoàn thành) tạo thành 1 chuỗi tiến trình xuyên suốt cả 20 bài.

---

## Nhóm 1: Input / Output (4 bài)

### 1. Chào hỏi theo tên (`day14-chao-hoi-theo-ten`) — EASY

**Ý tưởng**: đọc 1 dòng chuỗi, ghép vào câu chào bằng f-string.

**Edge case đã kiểm tra**: tên có khoảng trắng ở giữa ("Nguyen Van B"), tên 1 ký tự.

**Lỗi phổ biến**: quên rằng `input()` đã tự bỏ ký tự `\n` cuối dòng — học sinh có thể tự `.strip()` thừa, không sai nhưng không cần thiết.

### 2. Tính tiền mua hàng có thuế (`day14-tinh-tien-co-thue`) — EASY

**Ý tưởng**: đọc số thực, nhân 1.1, định dạng 2 chữ số thập phân bằng `f"{x:.2f}"`.

**Edge case đã kiểm tra**: giá = 0; số có nhiều chữ số thập phân (19.99 → 21.99, kiểm tra làm tròn đúng không bị lỗi float).

**Lỗi phổ biến**: dùng `round(x, 2)` rồi `print()` trực tiếp — với số như `110.00000000001` do sai số float, `round()` không đảm bảo hiển thị đúng 2 chữ số (ví dụ in ra `110.0` thay vì `110.00`). Phải dùng định dạng chuỗi (`:.2f`), không phải làm tròn số học.

### 3. Đổi phút thành giờ và phút (`day14-doi-phut-thanh-gio-phut`) — MEDIUM

**Ý tưởng**: chia lấy nguyên (`//`) và chia lấy dư (`%`) cho 60.

**Edge case đã kiểm tra**: N = 0 ("0h 0m"); N là số phút tròn giờ (60 → "1h 0m"); N lớn nhất trong 1 ngày (1439 → "23h 59m").

**Lỗi phổ biến**: nhầm thứ tự `//` và `%`, hoặc quên rằng kết quả giờ có thể là 0 (không nên bỏ qua in "0h").

### 4. Định dạng hóa đơn nhiều dòng (`day14-dinh-dang-hoa-don`) — MEDIUM

**Ý tưởng**: đọc 3 dòng dữ liệu khác kiểu (str, int, float) đúng thứ tự, in ra đúng 3 dòng theo định dạng cố định.

**Edge case đã kiểm tra**: đơn giá = 0; số lượng lớn với đơn giá có phần thập phân (kiểm tra không bị lỗi tràn định dạng hoặc làm tròn sai).

**Lỗi phổ biến**: đọc sai thứ tự dòng (tên/số lượng/đơn giá), hoặc quên ép kiểu `float()` cho đơn giá khi đơn giá có thể là số nguyên trong input ("5000" vẫn phải đọc bằng `float()` vì đơn giá về bản chất là số thực).

---

## Nhóm 2: List (4 bài)

### 5. Tổng và trung bình cộng danh sách (`day14-tong-trung-binh-danh-sach`) — EASY

**Ý tưởng**: `sum()` cho tổng, chia cho N cho trung bình, định dạng 2 chữ số thập phân.

**Edge case đã kiểm tra**: N = 1 (danh sách 1 phần tử); tổng bằng 0 (số âm và dương triệt tiêu nhau); trung bình có phần thập phân không tròn (1.20).

**Lỗi phổ biến**: dùng `/` (phép chia thực) là đúng ở Python 3, nhưng nếu học sinh quen tư duy từ ngôn ngữ khác có thể vô tình dùng `//` (chia nguyên) làm mất phần thập phân.

### 6. Đếm số lần xuất hiện của một giá trị (`day14-dem-so-lan-xuat-hien`) — EASY

**Ý tưởng**: dùng sẵn `list.count(x)`.

**Edge case đã kiểm tra**: giá trị không xuất hiện (kết quả 0); danh sách có số âm trùng nhiều lần.

**Lỗi phổ biến**: học sinh tự viết loop đếm nhưng so sánh sai kiểu dữ liệu (so `str` với `int`) nếu quên `int()` khi đọc X.

### 7. Loại bỏ phần tử trùng lặp, giữ thứ tự xuất hiện (`day14-loai-bo-trung-lap`) — MEDIUM

**Ý tưởng**: duyệt tuần tự, dùng `set` để kiểm tra đã gặp chưa (O(1)), chỉ thêm vào kết quả lần đầu gặp.

**Edge case đã kiểm tra**: toàn bộ phần tử giống nhau; danh sách chỉ 1 phần tử.

**Lỗi phổ biến**: dùng `list(set(nums))` để loại trùng — cách này SAI vì `set` không đảm bảo giữ thứ tự ban đầu (đề bài yêu cầu giữ đúng thứ tự xuất hiện đầu tiên). Đây là lỗi thường gặp nhất ở bài này, hidden test case `'5\n4 3 2 1 4'` (kỳ vọng `4 3 2 1`, thứ tự giảm dần) được thiết kế riêng để bắt lỗi này — nếu dùng `set()` trực tiếp, Python có thể trả về thứ tự khác hoàn toàn.

### 8. Trộn hai danh sách đã sắp xếp (`day14-tron-hai-danh-sach-sap-xep`) — HARD

**Ý tưởng**: nối 2 danh sách (`a + b`) rồi sắp xếp lại bằng `sorted()`. Đơn giản, dễ hiểu cho lớp 6-9 — không yêu cầu kỹ thuật two-pointer (dùng 2 con trỏ duyệt song song để merge trong O(N+M) mà không cần sort lại) vì đó là kỹ thuật nâng cao hơn phù hợp lớp 9-12. Giáo viên có thể giới thiệu ý tưởng two-pointer như phần mở rộng cho học sinh khá, không bắt buộc.

**Edge case đã kiểm tra (quan trọng)**: N = 0 hoặc M = 0 (một trong hai danh sách rỗng); cả hai đều rỗng (in ra dòng trống); có phần tử trùng lặp giữa 2 danh sách.

**Bài học thiết kế test**: bản đầu tiên của bộ test cho bài này dùng format input `"N\n[list nếu N>0]\nM\n[list nếu M>0]"` — khi N=0, dòng "danh sách" bị bỏ qua hoàn toàn. Khi tự chạy kiểm chứng độc lập (không tin vào suy luận ban đầu), phát hiện: cách đọc input kiểu "có điều kiện" này khiến chương trình đọc lệch dòng khi test data vẫn chèn dòng trống cho trường hợp N=0. Đã sửa lại quy tắc: **input luôn có đúng 4 dòng cố định** (dòng rỗng vẫn phải đọc bằng `input()`, không bỏ qua có điều kiện) — đây là nguyên tắc thiết kế test quan trọng: định dạng input phải nhất quán, không phụ thuộc giá trị của dữ liệu.

---

## Nhóm 3: Loop (4 bài)

### 9. In bảng cửu chương (`day14-bang-cuu-chuong`) — EASY

**Ý tưởng**: `for i in range(1, 11)`, in theo định dạng cố định.

**Edge case đã kiểm tra**: N = 2 (nhỏ nhất theo đề) và N = 9 (lớn nhất theo đề).

**Lỗi phổ biến**: sai khoảng `range` (dùng `range(1, 10)` thiếu dòng cuối, hoặc `range(0, 10)` thừa dòng "N x 0").

### 10. Đếm số chữ số của một số nguyên (`day14-dem-so-chu-so`) — EASY

**Ý tưởng**: lấy trị tuyệt đối (bỏ dấu âm), dùng `while n > 0: n //= 10` đếm số lần chia.

**Edge case đã kiểm tra (quan trọng)**: N = 0 — vòng lặp `while n > 0` không chạy lần nào nếu không xử lý riêng, dẫn đến kết quả sai là 0 chữ số thay vì 1. Đây là edge case cổ điển của bài "đếm chữ số" — code mẫu xử lý riêng bằng `if n == 0: print(1)`. Số âm (-987 → 3 chữ số, không tính dấu).

**Lỗi phổ biến**: quên xử lý N = 0 riêng; quên `abs()` cho số âm khiến vòng lặp `while n > 0` không chạy với số âm.

### 11. Số hoàn thiện — Perfect Number (`day14-so-hoan-thien`) — MEDIUM

**Ý tưởng**: duyệt ước số từ 1 đến N-1 (không tính N), cộng dồn, so sánh với N.

**Edge case đã kiểm tra (quan trọng)**: N = 1 — không có ước số dương nào nhỏ hơn 1, tổng = 0, không hoàn thiện (kết quả "NO"). Đây là lỗi phổ biến nhất của bài này: dùng `range(1, n+1)` (tính cả N) thay vì `range(1, n)` khiến N nào cũng tự "hoàn thiện" (vì N luôn là ước của chính nó, cộng thêm N vào tổng sẽ luôn bằng N + tổng_ước_thật > N... nhưng với N=1 sẽ sai theo hướng khác) — trong lúc viết bộ test, lỗi off-by-one này đã được tạo có chủ đích để kiểm tra hidden test bắt được: submit thử `range(1, n+1)` cho kết quả WA ngay ở test N=1 (kỳ vọng "NO" nhưng logic sai trả "YES" vì 1 == tổng khi tính cả bản thân... thực tế cần chạy thử để xác nhận từng trường hợp cụ thể, không suy luận suông).

**Lỗi phổ biến**: dùng `range(1, n+1)` (tính cả N) — đã minh họa ở trên.

### 12. Kiểm tra ma trận đối xứng (`day14-ma-tran-doi-xung`) — HARD

**Ý tưởng**: duyệt toàn bộ ma trận NxN bằng 2 vòng lặp lồng nhau, so sánh `matrix[i][j]` với `matrix[j][i]` — nếu có bất kỳ cặp nào khác nhau, ma trận không đối xứng.

**Edge case đã kiểm tra**: N = 1 (ma trận 1x1 luôn đối xứng vì chỉ có 1 phần tử, tự đối xứng với chính nó); ma trận đối xứng thật (kiểm tra `i == j` trên đường chéo chính không ảnh hưởng kết quả); ma trận chỉ khác nhau ở đúng 1 cặp phần tử (kiểm tra thuật toán không "dừng sớm" khi gặp 1 cặp đối xứng đúng mà bỏ qua kiểm tra tiếp).

**Lỗi phổ biến**: chỉ so sánh nửa trên/nửa dưới đường chéo một cách sai sót (bỏ sót 1 số cặp `i, j`); dừng vòng lặp ngay khi tìm thấy cặp không đối xứng đầu tiên bằng `break` không đúng cách (dùng `break` cho vòng `for` bên trong nhưng quên rằng vòng ngoài vẫn tiếp tục chạy, có thể lãng phí thời gian nhưng không sai kết quả — cần phân biệt "tối ưu sớm" và "sai logic").

*(Ghi chú thiết kế: bài "Xoắn ốc trên lưới vuông" ban đầu được thay bằng bài này vì đòi hỏi kỹ thuật mô phỏng 4 hướng di chuyển + quản lý 4 biên đồng thời — vượt quá mức "đỉnh của nhóm Loop cho lớp 6-9". Bài ma trận đối xứng vẫn giữ độ khó HARD thực sự trong nhóm (đòi hỏi hiểu đúng khái niệm "duyệt toàn bộ, không chỉ 1 nửa") nhưng chỉ cần 1 vòng lặp lồng nhau đơn giản.)*

---

## Nhóm 4: Function (4 bài)

### 13. Viết hàm kiểm tra số nguyên tố (`day14-ham-kiem-tra-nguyen-to`) — EASY

**Ý tưởng**: tách logic vào hàm `is_prime(n)`, chỉ kiểm tra ước từ 2 đến `sqrt(n)`.

**Edge case đã kiểm tra**: N = 1 (không phải số nguyên tố theo định nghĩa); N = 2 (số nguyên tố nhỏ nhất); N lớn (997).

**Lỗi phổ biến**: quên chặn N < 2 (số 0, 1, số âm không phải nguyên tố) — nếu không chặn, vòng `for i in range(2, ...)` với N=1 không chạy (`int(1**0.5)+1 = 2`, `range(2,2)` rỗng) nên hàm trả `True` sai.

### 14. Hàm tính giai thừa có kiểm tra đầu vào (`day14-ham-tinh-giai-thua`) — EASY

**Ý tưởng**: hàm trả về mã lỗi riêng (-1) cho input không hợp lệ (n âm) thay vì crash — giới thiệu khái niệm "hàm xử lý input sai" ở mức đơn giản.

**Edge case đã kiểm tra**: N = 0 (quy ước 0! = 1); N âm (trả -1).

**Lỗi phổ biến**: quên quy ước 0! = 1 (nhầm với "không tính được"); dùng đệ quy không giới hạn cho N âm gây lỗi thay vì trả -1 có kiểm soát.

### 15. Hàm tái sử dụng: quy đổi điểm chữ (`day14-ham-quy-doi-diem-chu`) — MEDIUM

**Ý tưởng**: hàm `xep_loai(diem)` với chuỗi `if/elif` theo thứ tự giảm dần ngưỡng — minh họa cách viết điều kiện lồng nhau gọn bằng cách sắp thứ tự kiểm tra hợp lý (kiểm tra ngưỡng cao nhất trước).

**Edge case đã kiểm tra (quan trọng)**: đúng ngay tại ngưỡng (8, 8.9, 6.5, 9) — kiểm tra dùng đúng `>=` không phải `>`; điểm 0 và 10 (2 cực biên); điểm ngay dưới ngưỡng (4.999 → F, không phải D).

**Lỗi phổ biến**: dùng `>` thay vì `>=` ở biên (khiến điểm đúng 9.0 bị tính "B" thay vì "A"); kiểm tra theo thứ tự tăng dần ngưỡng (kiểm tra `< 5` trước) dẫn đến logic if/elif sai vì điểm cao vẫn lọt vào nhánh thấp nếu không return sớm.

### 16. Hàm đệ quy: đếm số lần xuất hiện trong danh sách (`day14-ham-de-quy-dem-xuat-hien`) — HARD

**Ý tưởng**: giới thiệu đệ quy trên danh sách — hàm `dem(nums, x)` xử lý phần tử đầu (`nums[0]`), rồi tự gọi lại chính mình cho phần còn lại (`nums[1:]`), cộng dồn kết quả. Trường hợp dừng (base case) là danh sách rỗng — trả về 0.

**Edge case đã kiểm tra**: danh sách rỗng ngay từ đầu (N = 0, base case kích hoạt ngay lượt gọi đầu tiên); giá trị cần đếm không xuất hiện (kết quả 0, đệ quy vẫn chạy hết toàn bộ danh sách); giá trị xuất hiện nhiều lần liên tiếp và không liên tiếp.

**Lỗi phổ biến**: quên trường hợp dừng (base case `if len(nums) == 0`), khiến đệ quy chạy vô hạn hoặc lỗi index khi danh sách rỗng; viết đệ quy nhưng vẫn lén dùng `for`/`while` bên trong (không đúng yêu cầu đề bài là "chỉ dùng đệ quy") — đây là lỗi về tinh thần bài tập hơn là lỗi kỹ thuật, hidden test không bắt được lỗi này (vì kết quả vẫn đúng), giáo viên cần đọc code để phát hiện.

*(Ghi chú thiết kế: bài "Fibonacci có ghi nhớ/memoization" ban đầu được thay bằng bài này vì memoization là kỹ thuật tối ưu hóa nâng cao, thường dạy ở cấp cao hơn (9-12 hoặc đại học) — với lớp 6-9, mục tiêu nhóm Function nên dừng ở "hiểu đệ quy hoạt động thế nào" thay vì "khi nào cần tối ưu đệ quy".)*

---

## Nhóm 5: Simulation / Game Logic (4 bài)

### 17. Mô phỏng oẳn tù tì (`day14-oan-tu-ti`) — EASY

**Ý tưởng**: dùng `dict` ánh xạ "vật gì thắng vật gì" (`thang[p1] == p2` nghĩa là lựa chọn của p1 thắng lựa chọn của p2) thay vì viết nhiều `if/elif` lồng nhau.

**Edge case đã kiểm tra**: cả 3 cặp thắng-thua (keo>bao, bua>keo, bao>bua đều được test ở cả 2 chiều P1 thắng/P2 thắng); trường hợp hòa.

**Lỗi phổ biến**: viết thiếu 1 trong 6 tổ hợp thắng/thua khi dùng if/elif tay, hoặc nhầm chiều thắng (nhớ ngược "keo thắng bua" thành "bua thắng keo").

### 18. Mô phỏng thang máy đơn giản (`day14-mo-phong-thang-may`) — MEDIUM

**Ý tưởng**: mô phỏng từng lệnh tuần tự, có điều kiện chặn biên (không vượt tầng 1 và tầng 10).

**Edge case đã kiểm tra (quan trọng)**: N = 0 (không có lệnh nào, giữ nguyên tầng 1); lệnh đẩy vượt biên trên liên tục (12 lệnh UP liên tiếp từ tầng 1 chỉ lên tối đa tầng 10, các lệnh UP dư bị bỏ qua thầm lặng); lệnh đẩy xuống dưới tầng 1 ngay từ đầu (DOWN khi đang ở tầng 1 bị bỏ qua).

**Lỗi phổ biến**: quên kiểm tra biên (`tang < 10` / `tang > 1`) trước khi cộng/trừ, khiến thang máy có thể "vượt tầng" ra ngoài phạm vi hợp lệ của tòa nhà.

### 19. Mô phỏng túi đồ trong game nhập vai (`day14-mo-phong-tui-do`) — MEDIUM

**Ý tưởng**: mô phỏng cấu trúc dữ liệu "túi đồ có giới hạn sức chứa" bằng `list`, kiểm tra điều kiện trước khi thêm/xóa.

**Edge case đã kiểm tra (quan trọng)**: `REMOVE` một vật phẩm không có trong túi (phải bỏ qua, không lỗi); túi rỗng hoàn toàn ở cuối (không in gì — không in dòng trống thừa); `ADD` khi túi đã đầy (lệnh bị bỏ qua thầm lặng).

**Lỗi phổ biến — phát hiện qua kiểm chứng độc lập với môi trường chấm thật**: khi chạy thử bộ giải trên máy local (Python thuần), toàn bộ test pass; nhưng khi chạy qua đúng pipeline chấm bài thật của hệ thống (chạy Python trên Windows, không phải trình giả lập), phát hiện `print()` sinh ra ký tự xuống dòng `\r\n` (chuẩn Windows) trong khi bộ test kỳ vọng `\n` (chuẩn Unix) — khiến bài đúng logic 100% vẫn bị chấm sai (`WA`) do lệch định dạng dòng, không phải lỗi thuật toán. Đây là lỗi hạ tầng chấm bài có sẵn trong hệ thống (ảnh hưởng mọi bài có output nhiều dòng), đã được vá tận gốc ở `judge-queue.service.ts` (chuẩn hoá `\r\n` → `\n` trước khi so sánh) — **bài học quan trọng nhất của ngày 14: chạy test qua đúng pipeline chấm bài thật, không chỉ tin vào việc chạy thử code trên máy cá nhân, vì hai môi trường có thể khác nhau ở những chi tiết tưởng như không liên quan (line ending).**

### 20. Mô phỏng trận đấu turn-based đơn giản (`day14-mo-phong-tran-dau`) — HARD

**Ý tưởng**: mô phỏng lượt đánh xen kẽ bằng biến cờ boolean (`luot_p1`), kiểm tra điều kiện thắng ngay sau mỗi đòn đánh (không chờ hết lượt cả 2 bên).

**Edge case đã kiểm tra (quan trọng)**: người đánh trước hạ gục đối thủ ngay lượt đầu (P1 thắng ngay không cần đợi P2 phản công) — nếu code kiểm tra điều kiện thắng "sau khi cả 2 bên đã đánh" thay vì "ngay sau mỗi đòn", sẽ tính sai kết quả trong tình huống này; sát thương và máu bằng nhau (1 vs 1) — chỉ cần đúng 1 đòn để phân định thắng-thua.

**Lỗi phổ biến**: đặt điều kiện kiểm tra "hp <= 0" sau khi đã đổi lượt (`luot_p1 = not luot_p1`) thay vì ngay sau khi trừ máu — khiến trận đấu "đánh thừa" 1 lượt không cần thiết trước khi phát hiện đã có người thua, có thể cho kết quả sai nếu đối thủ vừa thắng lại vô tình bị đánh tiếp và giảm máu xuống âm sâu hơn (không ảnh hưởng kết quả thắng-thua ở bài này, nhưng là thói quen mô phỏng game sai cần sửa sớm vì sẽ gây lỗi ở bài phức tạp hơn, ví dụ tính điểm/combo theo lượt).
