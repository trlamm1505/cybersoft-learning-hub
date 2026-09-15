# AI Work Log — Ngày 12: Leaderboard đúng và công bằng

| | |
|---|---|
| **Người thực hiện** | Dương Chí Việt |
| **Ngày** | 2026-09-16 |
| **Nhánh** | `feature/learning-hub-day12` |
| **Công cụ** | Claude Code (CLI, VSCode extension), model Claude Sonnet 5 |
| **Phạm vi quyền** | Đọc/ghi trong `learning-hub/`; chạy build/test/dev server; seed & truy vấn MongoDB; gọi API thật để kiểm chứng. Không đụng `Test/`, `Data-AI-Resource/` |

---

## Tóm tắt 1 dòng mỗi việc

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Leaderboard: rule ICPC, live/frozen, submission log, ẩn đáp án | ✅ Xong |
| 2 | Sửa quiz Python hiện sai số câu (10 → thực chất load 20) | ✅ Xong |
| 3 | Dọn file log rác | ✅ Xong |
| 4 | Session sau logout vẫn hiện "đã đăng ký" (dùng chung ID `student-demo`) | ✅ Xong |
| 5 | Xoá data test, sửa điểm số/xếp hạng sai, chặn khách vãng lai | ✅ Xong |

---

## Việc 1 — Xây leaderboard từ đầu

### Prompt gốc của người dùng
> "NGÀY 12 - Leaderboard đúng và công bằng [...] Việc phải làm: Chọn rule score/penalty/tie-break. Tạo live và frozen leaderboard. Viết test cho hòa điểm, nộp lại và late submit. [...] Điều kiện nghiệm thu: Kết quả tái tính được từ submission log. Không lộ private submission. Rule hiển thị cho thí sinh."

Sau đó: **"làm đi"**

### Vấn đề phát hiện trước khi code
Contest (từ Ngày 11) chấm điểm 100% ở trình duyệt người dùng — không có log nộp bài nào ở server, và bài trắc nghiệm còn gửi luôn đáp án đúng cho trình duyệt trước khi nộp (ai mở DevTools cũng xem được / giả điểm được). Với kiến trúc này thì "tái tính từ log" và "không lộ đáp án" là bất khả thi — nên phải sửa cả cách chấm điểm, không chỉ thêm 1 màn hình bảng xếp hạng.

### Quyết định (hỏi & chốt với người dùng trước khi code)

| Câu hỏi | Lựa chọn đã chốt |
|---|---|
| Sửa cả cách chấm điểm hay chỉ thêm bảng xếp hạng? | Sửa luôn cách chấm — chuyển sang chấm ở server |
| Rule tính điểm? | Kiểu ICPC: tổng điểm trước, hòa thì so tổng (thời gian + phạt) |
| Nộp nhiều lần thì tính điểm nào? | Điểm cao nhất trong các lần nộp |
| Nộp trễ giờ thì sao? | Không cộng điểm, nhưng vẫn lưu lại để đối chiếu sau |
| Khóa bảng xếp hạng lúc nào? | Tự động khóa (đứng yên) ở giai đoạn cuối trước khi hết giờ |

### Đã làm

**Backend** — thêm bảng ghi lại mọi lần nộp bài trong contest (không có trước đây); viết lại phần chấm điểm để chạy ở server thay vì trình duyệt (coding chấm bằng cách chạy thử code thật, trắc nghiệm so đáp án ở server, không gửi đáp án đúng ra ngoài trước khi nộp); viết module tính bảng xếp hạng — luôn tính lại từ dữ liệu gốc mỗi lần gọi, không lưu sẵn kết quả tính toán ở đâu cả.

**Frontend** — màn hình bảng xếp hạng (có nhãn LIVE/ĐÃ KHÓA/CHUNG KẾT), popup "Quy chế xếp hạng" hiển thị đúng số liệu server đang dùng; sửa màn hình làm bài thi để gọi API chấm điểm thật thay vì tự chấm.

**Test** — 22 test case mới cho 2 phần chấm điểm và tính bảng xếp hạng, bao gồm: hòa điểm, nộp lại nhiều lần, nộp trễ giờ, khóa bảng lúc cuối giờ, và test "gọi lại 2 lần phải ra kết quả giống hệt nhau" (đảm bảo tái tính được từ log).

**Tài liệu** — 1 file mô tả rule tính điểm/phạt/xếp hạng công khai cho thí sinh.

### Lỗi tự phát hiện khi viết test (không phải người dùng báo)

| Lỗi | Vì sao xảy ra | Đã sửa |
|---|---|---|
| Nộp bài đúng 1 phần (vừa đúng vừa sai) bị tính nhầm thành "toàn sai" | Logic gán trạng thái lỗi quá sớm trong vòng lặp, không đợi xét hết mọi câu | Gộp lại xét sau khi chạy hết, không quyết định giữa chừng |
| 2 test về "khóa bảng xếp hạng" **pass giả** — không kiểm tra được gì cả | Dữ liệu giả lập (mock) trong test không lọc theo điều kiện thật, trả về y nguyên bất kể code đúng hay sai | Viết lại mock để tự lọc đúng như truy vấn thật, rồi chạy lại xác nhận test thật sự "bắt" được lỗi nếu có |

---

## Việc 2 — Bug quiz "chọn 10 câu nhưng vào thi ra 20 câu"

### Prompt gốc của người dùng
> "tôi thấy 1 vấn đề trong thi trắc nghiệm hiện 10 câu nhưng vào thì 20 câu"

### Nguyên nhân
Khi bắt đầu làm bài, hệ thống lấy **toàn bộ** ngân hàng câu hỏi trong database, không lọc theo đề thi nào đã chọn — nên chọn đề nào cũng ra cùng 1 bộ ~20 câu chủ đề Web. Đề "Python Căn Bản" trước giờ chưa từng có câu hỏi thật nào trong database.

### Đã làm
Viết 10 câu hỏi Python thật (biến, `input()`, vòng lặp, kiểu dữ liệu...); sửa hệ thống lọc đúng câu hỏi theo đề đã chọn; nạp lại dữ liệu.

### Lỗi tự phát hiện khi sửa
Lần lọc đầu tiên so khớp đúng tên "Fullstack Web" — nhưng 20 câu Web thật trong database lại được gắn nhãn theo 7 chủ đề con khác nhau (HTML5, CSS3, JavaScript...), không câu nào tên đúng "Fullstack Web" cả → gọi thử API bị báo lỗi "không tìm thấy câu hỏi". Sửa lại: hiểu "Fullstack Web" là "mọi câu không phải Python", không so khớp 1 tên cụ thể.

---

## Việc 3 — Dọn dẹp

### Prompt gốc của người dùng
> "kiểm tra kỹ nếu thật sự rác mới xóa tránh xóa nhầm làm hỏng dự án"

Tìm thấy 1 file log thừa (170 byte, không nằm trong git, là log của lần chạy thử từ nhiều ngày trước) — đã xóa. Không đụng đến các thư mục build (`dist/`) vì đó là output hợp lệ, tự sinh lại được.

---

## Việc 4 — Đăng xuất rồi mà vẫn hiện "đã đăng ký"

### Prompt gốc của người dùng
> "với lại khi đăng xuất thành công r mà vẫn hiện đăng ký thành công kìa mấy cái login logout còn nhiều lỗi"

### Nguyên nhân
Từ trước giờ toàn bộ tính năng Contest dùng chung 1 mã học viên cố định (`student-demo`) cho **mọi người** trên cùng máy — hoàn toàn không liên quan gì đến tài khoản đăng nhập thật. Đăng xuất chỉ xóa 2 mục nhớ trình duyệt (token, thông tin user), không đụng đến dữ liệu contest — nên trạng thái "đã đăng ký" của "student-demo" vẫn còn nguyên, hiện lại y như cũ với bất kỳ ai mở lại trang, kể cả sau khi đăng xuất.

### Đã làm
Gắn mã học viên đúng theo tài khoản đã đăng nhập thật (thay vì mã giả cố định); khi đăng xuất, dọn sạch toàn bộ dữ liệu contest gắn với đúng tài khoản đó (không chỉ 2 mục cũ); thêm chặn truy cập cho trang soạn bài giảng — trước đây bất kỳ ai kể cả chưa đăng nhập cũng vào thẳng được bằng cách gõ đường dẫn.

### Đã ghi nhận nhưng chưa sửa (theo yêu cầu người dùng, để dịp khác)
- Đăng xuất ở 1 tab trình duyệt không tự cập nhật các tab khác đang mở cùng lúc.
- Phần thi trắc nghiệm và luyện code chưa lưu tiến trình theo tài khoản (chỉ riêng Contest vừa được sửa).

---

## Việc 5 — Dọn dữ liệu test + sửa điểm số/xếp hạng sai + chặn khách vãng lai

### Prompt gốc của người dùng
> "thôi sửa nữa đi giờ xóa thông tin usertest đi [...] đánh mã học viên là HV1 vào db, giảng viên kia đánh GV1, 🏆 Tổng Điểm Đạt Được 50 / 100 này cho max 1 câu 50đ là 50% thì là 50/50 chứ tỉ lệ chính xác 100%, 🎖️ Xếp Loại Kết Quả 🥈 ĐẠT [...] cái này top mấy thì hiện đúng chứ k ghi số 2, khách vãng lai ấn tham gia thì phải đăng nhập, chi tiết bài học cũng phải đăng nhập, thi trắc nghiệm cũng v, Code Playground cũng v vãng lai chỉ cho làm 1 bài tính tổng thôi, đăng nhập mới làm được 9 bài còn lại, cho xem bên ngoài chứ ấn vào học làm phải đăng nhập"

### 5a. Xóa dữ liệu test
Xóa sạch toàn bộ bài nộp thi và danh sách đăng ký test trong database (không đụng tài khoản người dùng thật/dữ liệu bài giảng).

### 5b. Điểm số hiển thị sai
**Vấn đề:** thi 1 câu 50 điểm, làm đúng hết → hiển thị "50/100 — Tỷ lệ chính xác 50%", trong khi lẽ ra phải là "50/50 — 100%".
**Nguyên nhân:** hệ thống luôn tự chia đều tổng 100 điểm cho số câu, bất kể đề thi thật khai báo bao nhiêu điểm mỗi câu.
**Đã sửa:** dùng đúng số điểm thật khai báo trên đề thi, tổng điểm tối đa = tổng thật của các câu đã làm, không tự đôn lên 100.

### 5c. Nhãn xếp loại không có ý nghĩa
**Vấn đề:** nhãn "🥈 ĐẠT" chỉ suy từ % điểm, không liên quan gì đến vị trí thật trên bảng xếp hạng.
**Đã sửa:** thay bằng hạng thật lấy trực tiếp từ bảng xếp hạng (ví dụ "Hạng 2/5").

### 5d. Chặn khách vãng lai (chưa đăng nhập)

| Tính năng | Trước | Sau |
|---|---|---|
| Đăng ký / vào thi đấu | Làm được luôn | Bắt đăng nhập trước |
| Xem chi tiết bài học | Vào được luôn | Bắt đăng nhập trước |
| Làm bài trắc nghiệm | Làm được luôn | Bắt đăng nhập trước |
| Luyện code (Code Playground) | Làm được cả 10 bài | Xem đề được cả 10 bài, nhưng chỉ **bài "Tính tổng hai số"** được bấm làm thật — 9 bài còn lại bấm vào sẽ chuyển sang trang đăng nhập |

---

## Đánh giá độ tin cậy của AI trong buổi làm việc

**Phần thiết kế logic thuần** (cách tính bảng xếp hạng luôn tính lại từ log thay vì lưu sẵn, cách xử lý khóa bảng theo mốc thời gian thay vì cờ trạng thái) — AI đề xuất đúng ngay từ đầu, có thể tin được vì kiểm chứng được bằng suy luận logic, không cần chạy thử mới biết đúng sai.

**Nhưng có nhiều lần chỉ phát hiện được lỗi khi chạy thử thật, không thể phát hiện chỉ bằng đọc code:**
- Bug quiz sai số câu chỉ lộ ra khi gọi API thật trên dữ liệu thật trong database — đọc code suy luận hoặc chạy test có dữ liệu giả lập sẽ không bao giờ thấy được, vì nguyên nhân nằm ở *dữ liệu thật không khớp giả định*, không phải lỗi cú pháp hay logic nhìn thấy được bằng mắt.
- Bug "đăng xuất vẫn hiện đã đăng ký" cũng vậy — chỉ người dùng tự bấm thử trên giao diện thật mới phát hiện ra, vì đây là lỗi về *thiết kế dữ liệu* (dùng chung 1 ID giả cho mọi người) chứ không phải lỗi code có thể tìm bằng cách đọc từng dòng.
- Có 2 lần chính bộ test do AI viết ra cũng sai (một lần logic tính điểm sai, một lần bài test không kiểm tra được gì cả do dữ liệu giả lập quá đơn giản) — nhắc lại bài học: "test chạy qua" không đồng nghĩa với "đúng", phải đọc lại cả code thật lẫn chính bài test khi nghi ngờ.

**Kết luận:** với các bug liên quan đến dữ liệu thật và trải nghiệm người dùng thật (không phải lỗi cú pháp/logic thuần túy), chỉ có cách chạy thử trên dữ liệu thật hoặc tự tay bấm thử giao diện mới phát hiện ra — không thể tin tưởng hoàn toàn vào "code compile được" hay "test pass" là đã đúng.
