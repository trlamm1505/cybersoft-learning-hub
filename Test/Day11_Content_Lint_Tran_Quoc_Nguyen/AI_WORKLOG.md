# AI WORK LOG - DAY 11 (Content lint cho bài học) - bản v2

## Problem statement trước AI

Bản đầu tiên đã làm bằng Python (`content_lint.py`, mã rule `CL0xx`) và đạt các điều
kiện nghiệm thu cơ bản, nhưng khác cấu trúc so với yêu cầu cụ thể sau khi
trao đổi lại: cần đúng dạng **CLI Node.js** (`tools/content-lint/content-lint.js`),
mã rule **CT001-CT020** (không phải CL0xx), output CLI theo dòng dạng
`SEVERITY CODE file:line message`, report có cả **JSONPath lẫn số dòng**, và có
sample **Markdown** thật sự (không chỉ JSON).

Giả định/kế hoạch trước khi viết code:
- Giữ nguyên nguyên tắc từ bản v1 (không sửa file âm thầm, phân biệt error/warning,
  chạy được trên nội dung mẫu có cả PASS/FAIL) nhưng đổi toàn bộ implementation.
- Vì `content-lint.js` cần in ra **số dòng thật** (không chỉ JSONPath), phải tự viết
  một bộ quét text (`text-scan.js`) để lấy vị trí dòng của từng field trong JSON gốc -
  `JSON.parse()` chuẩn của Node không giữ lại thông tin này.
- Markdown cần parser riêng (heading H1 = title, H2 = section) vì cấu trúc hoàn toàn
  khác JSON.
- Bắt đầu bằng một số rule cốt lõi trước (title, learningOutcome, prerequisite,
  terminology, link - đúng tinh thần "làm 5 rule trước, chạy được CLI, rồi mở rộng"),
  chạy thử trên `samples/lesson-bad.json` để xác nhận pipeline (parser → rule → CLI
  output) hoạt động đúng đầu-cuối, sau đó mới viết tiếp 15 rule còn lại theo đúng 6
  nhóm trong bảng đề xuất.

## Input / Output / Constraint

**Input:** `samples/lesson-good.json`, `samples/lesson-bad.json` (2 bài học cố ý sai),
`samples/lesson-bad.md`, `samples/lesson-good.md`, `samples/lesson-invalid.json` (JSON
sai cú pháp). Bonus: nội dung thật trích từ `BE/src/data/initial-data.ts` và
`FE/src/data/mockLessons.ts` của `cybersoft-learning-hub`.

**Output:** `content-lint.js` (CLI), `rules.js` (20 rule CT001-CT020), report console +
`lint-report.json`/`.csv` có `file/line/path/rule/severity/message/fix`, 14 test
`node:test`, `Day11_Content_Lint_Guide.xlsx` (5 sheet: 00_BAT_DAU, 01_Rule_Catalog,
02_Test_Execution, 03_Lint_Findings, 04_AI_Worklog).

**Constraint:** không cài thêm package ngoài (chỉ dùng module có sẵn của Node); không
sửa file input; chạy offline; không dùng dữ liệu nhạy cảm/PII thật (seed data đào tạo).

## AI hỗ trợ

- Đề xuất kiến trúc quét text tự viết (`scanArrayItems`, `findKeyLine`,
  `findArrayOpenForKey` trong `text-scan.js`) để lấy số dòng chính xác cho từng field
  JSON mà không cần cài thư viện JSON-with-position từ npm.
- Viết khung 20 rule theo đúng 6 nhóm + severity đề xuất (10 ERROR / 10 WARNING),
  bao gồm cả rule khó như CT010 (cross-reference "(Bài N)" giữa các bài học trong cùng
  corpus) và CT011/CT013 (phát hiện thuật ngữ viết không nhất quán / sai convention).
- Viết `samples/lesson-bad.json` và `samples/lesson-bad.md` sao cho **kết hợp cả 2
  file** kích hoạt đủ toàn bộ 20 rule (test `lesson-bad.json + lesson-bad.md cùng nhau
  kích hoạt đủ cả 20 rule` xác nhận điều này).

## Phần con người kiểm chứng

- Tự chạy `node content-lint.js samples/lesson-bad.json` và **đọc từng dòng output đối
  chiếu bằng tay với file gốc** (không tin report ngay) - phát hiện lỗi thật ở bản đầu:
  với field dạng mảng (`links`), report in ra `lesson-bad.md:10,10,10,10,10` (số dòng bị
  nối chuỗi từ 1 mảng thay vì 1 số) do rules.js lấy `lesson.loc.links` (một mảng số dòng
  cho Markdown) làm giá trị `line` trực tiếp, trong khi với JSON `lesson.loc.links` lại
  là 1 số duy nhất - hai định dạng trả về kiểu dữ liệu khác nhau cho cùng 1 field.
- Tự sửa bằng cách chuẩn hoá lại: mỗi phần tử trong `lesson.links` giờ mang theo đúng
  `{field, url, line}` của chính nó (thay vì suy ra line ở tầng rule), áp dụng thống
  nhất cho cả `json-lesson-parser.js` và `md-lesson-parser.js`. Chạy lại
  `node --test tests/content-lint.test.js`: từ chỗ output sai lặng lẽ (không có test nào
  bắt được vì lúc đó test chưa viết) chuyển sang viết test
  `CT001 báo đúng dòng chứa key title` và kiểm tra thủ công output của CT011/CT014-17 để
  xác nhận số dòng đúng với từng link riêng biệt, không còn bị gộp.
- Tự đọc `real-content/be-lessons.json` và `real-content/fe-lessons.json` sau khi trích
  xuất, xác nhận đây đúng là nội dung thật (không phải AI tự bịa) trước khi lint và đưa
  vào Excel.
- Chạy `node --test tests/content-lint.test.js` độc lập: 14/14 PASS sau khi sửa lỗi
  line-tracking ở trên; log đính kèm trong README mục "Test độc lập".
- Khi rà lại `reports/lint-report.json` để đưa vào sheet 03_Lint_Findings (lúc chỉnh
  lại giao diện Excel), tự đọc kỹ cột `path` của các finding trên `lesson-bad.md` và
  phát hiện lỗi thứ 2: mọi rule về link/terminology/content trên Markdown báo
  `path: "null.link[2] \"bad\""`, `"null.content"`... (chuỗi `"null."`) thay vì một
  JSONPath hợp lệ. Nguyên nhân: `md-lesson-parser.js` gán `jsonPath: null` cho bài học
  Markdown (vì Markdown không có JSONPath thật), nhưng `rules.js` lại nối chuỗi
  `` `${lesson.jsonPath}.${field}` `` - khi `jsonPath` là `null`, JavaScript tự chuyển
  thành chữ `"null"` trong chuỗi. Đã tự sửa bằng cách đổi `jsonPath: null` thành
  `jsonPath: '$md'` (gốc quy ước riêng cho Markdown, giữ tinh thần JSONPath nhưng không
  giả vờ đó là JSON thật) trong `md-lesson-parser.js`, chạy lại
  `node --test tests/content-lint.test.js` (vẫn 14/14 PASS - không test nào phụ thuộc
  giá trị cũ) và chạy lại CLI trên toàn bộ `samples/` + `real-content/` để xác nhận
  `reports/lint-report.json` và `real-content/lint-report.json` không còn chuỗi
  `"null."` nào (`grep -c '"null\.'` = 0 ở cả 2 file).

## Vòng bổ sung: quét thư mục + kiểm tra link sống/chết qua mạng (CTLINK)

**Problem statement**: sau khi đối chiếu lại yêu cầu chi tiết hơn của Ngày 11, phát
hiện 2 khoảng trống thật so với đặc tả gốc: (1) CLI chỉ nhận danh sách file, không tự
quét được cả thư mục; (2) rule link CT014-CT017 chỉ kiểm tra ĐỊNH DẠNG URL (cú pháp,
protocol, rỗng, trùng), không kiểm tra link có thật sự SỐNG hay không (không phát hiện
được "dead link" HTTP 404 thật) - trong khi yêu cầu có nhắc cụ thể "phát hiện link
hỏng (dead links)".

**AI hỗ trợ**: đề xuất quét thư mục bằng cách thêm bước `expandFileArgs()`/`walkDir()`
trong `content-lint.js` (tự quét đệ quy khi input là thư mục, giữ nguyên hành vi cũ khi
input là file lẻ). Đề xuất tách kiểm tra link sống/chết ra 1 file riêng
(`link-checker.js`, chỉ dùng `http`/`https` có sẵn của Node) và mã riêng `CTLINK` thay
vì thêm rule thứ 21, để không phá vỡ điều kiện nghiệm thu "đúng 20 rule" đã có test
khẳng định - cùng cách CTPARSE (lỗi cú pháp) đã được tách riêng từ đầu.

**Phần con người kiểm chứng**: khi viết test tự động cho `--check-links`, gặp 1 lỗi thật
không liên quan gì đến logic kiểm tra link mà đến từ chính môi trường chạy: viết test
mở 1 HTTP server NGAY TRONG tiến trình test rồi gọi CLI qua `execFileSync` để nó kết nối
ngược lại server đó - test luôn báo "UNREACHABLE" cho MỌI link kể cả link đáng lẽ phải
là 200 OK, dù chạy tay ngoài terminal (2 tiến trình `node` độc lập) lại đúng như kỳ
vọng. Không tin ngay đây là bug trong `link-checker.js` - tự viết 1 script tái hiện lỗi
tối giản (`repro.js`: tiến trình cha mở server, spawn tiến trình con bằng
`execFileSync`, con gọi HTTP về server của cha) và xác nhận: đây là giới hạn của môi
trường sandbox đang chạy (1 tiến trình con spawn qua `execFileSync` không kết nối được
ngược lại cổng do CHÍNH tiến trình cha của nó đang mở), không phải lỗi code. Xác nhận
thêm bằng 1 script đối chứng (`repro2.js`: server chạy ở tiến trình ĐỘC LẬP, không phải
cha của tiến trình gọi HTTP) - kết nối thành công. Từ đó sửa lại cách viết test: spawn
HTTP server test ở 1 tiến trình con riêng (anh em với tiến trình CLI, không phải cha),
chạy lại `node --test tests/content-lint.test.js` 3 lần liên tiếp để xác nhận không bị
flaky do timing cổng mạng - cả 3 lần đều 17/17 PASS.

## Quyết định

Chấp nhận kiến trúc sau khi tự phát hiện và sửa lỗi line-tracking cho field dạng mảng
(lỗi này nếu không bắt được sẽ làm sai giá trị cốt lõi nhất của tool: report phải chỉ
**đúng** vị trí lỗi, không phải chỉ đúng *có* lỗi). Không merge bản đầu tiên vì lỗi này.
Sau khi xác nhận bản v2 (`tools/content-lint/`) đáp ứng đủ yêu cầu, các file Python của
bản v1 (`src/`, `tests/`, `content/`, `fixtures/`, `reports/` cũ, `requirements.txt`,
`run_lint.ps1`, `run_tests.ps1`) đã được dọn khỏi thư mục Day11 để tránh 2 bản song song
gây nhầm lẫn - `tools/content-lint/` là deliverable chính thức duy nhất còn lại.

Chấp nhận thêm 2 tính năng bổ sung (quét thư mục, `--check-links`) sau khi xác nhận
chúng không phá vỡ điều kiện nghiệm thu gốc: 20 rule CT001-CT020 vẫn giữ nguyên số
lượng và mã (CTLINK là mã riêng, không tính vào 20), tool vẫn chỉ đọc không sửa file
input, và toàn bộ 3 test cũ liên quan (đếm rule, quét bad sample kích hoạt đủ 20 rule,
report JSON/CSV đúng field) vẫn PASS không đổi sau khi thêm code mới - tức 2 tính năng
mới cộng thêm chứ không thay thế/đổi hành vi phần đã nghiệm thu trước đó.
