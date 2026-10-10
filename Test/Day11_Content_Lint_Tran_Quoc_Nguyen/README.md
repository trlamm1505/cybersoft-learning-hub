# NGÀY 11 - Content lint cho bài học

> Theo `03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`, Tuần 3 - Học liệu và đề thi.
> Kết quả chính: **phát hiện lỗi cấu trúc học liệu tự động**.

**Bản này là bản làm lại (v2)** sau khi trao đổi để bám sát đúng cấu trúc yêu cầu:
CLI Node.js độc lập (`tools/content-lint/`), 20 rule mã **CT001-CT020**, output CLI
dạng `SEVERITY CODE file:line message`, report JSON/CSV có vị trí lỗi rõ ràng.
Bản làm đầu tiên (Python, mã rule `CL0xx`) đã bị xoá khỏi thư mục này (không còn
`content/`, `fixtures/`, `src/`, `tests/` cũ) - lý do và các quyết định thiết kế khác
với bản đó vẫn được ghi lại trong `AI_WORKLOG.md` để có dấu vết, nhưng **tools/content-lint/
là deliverable chính thức duy nhất của Ngày 11**.

## Mục tiêu

- Kiểm tra **title, learning outcome, prerequisite, terminology, link** của bài học.
- Rule áp dụng cho cả **JSON và Markdown**.
- Chạy trên bộ nội dung mẫu có **cả PASS và FAIL** (`samples/`), và bonus: chạy trên
  nội dung **thật** trích từ BE/FE của `cybersoft-learning-hub` (`real-content/`).

## Cấu trúc

```
tools/content-lint/
├── content-lint.js          CLI chính (node content-lint.js <file...> [--out-dir DIR] [--fail-on ...])
├── rules.js                 20 rule CT001-CT020
├── parsers/
│   ├── text-scan.js         quét text thuần lấy số dòng thật trong JSON (không dùng lib ngoài)
│   ├── json-lesson-parser.js
│   └── md-lesson-parser.js
├── samples/
│   ├── lesson-good.json     0 lỗi - chứng minh không false positive
│   ├── lesson-bad.json      cố ý sai - 2 bài học, kích hoạt phần lớn rule JSON
│   ├── lesson-bad.md        cố ý sai - kích hoạt rule còn lại + rule riêng cho Markdown
│   ├── lesson-good.md       0 lỗi (Markdown) - thêm để đối chứng false positive cho .md
│   └── lesson-invalid.json  JSON sai cú pháp - test đường lỗi parse (CTPARSE)
├── real-content/
│   ├── extract-from-ts.js   trích bài học thật từ BE/FE (.ts) ra JSON, không cần lib ngoài
│   ├── be-lessons.json / fe-lessons.json   snapshot nội dung thật
│   └── lint-report.json/.csv               kết quả lint trên nội dung thật (bonus)
├── reports/
│   ├── lint-report.json/.csv               kết quả lint trên samples/ (deliverable chính)
│   ├── rules-catalog.json                  20 rule export ra JSON (input cho Excel)
│   └── generate_guide_xlsx.py              script sinh Day11_Content_Lint_Guide.xlsx
└── tests/
    └── content-lint.test.js  17 test (node:test, có sẵn trong Node, không cần cài thêm)
```

## Cài đặt

Không cần cài package nào - `content-lint.js` chỉ dùng module có sẵn của Node
(`fs`, `path`, `vm`, `node:test`, `node:assert`). Yêu cầu Node.js >= 18 (khuyến
nghị 20+ để có `node --test` ổn định).

## Chạy

```powershell
cd Day11_Content_Lint_Tran_Quoc_Nguyen\tools\content-lint

# Lint 1 file
node content-lint.js samples\lesson-bad.json

# Lint nhiều file cùng lúc, ghi report ra thư mục reports\
node content-lint.js samples\lesson-good.json samples\lesson-bad.json samples\lesson-bad.md samples\lesson-good.md --out-dir reports

# Lint cả 1 THƯ MỤC (tự quét đệ quy hết file .json/.md bên trong, không cần liệt kê từng file)
node content-lint.js samples --out-dir reports

# (Tùy chọn) kiểm tra link SỐNG/CHẾT thật qua mạng (HTTP request thật, mặc định TẮT vì cần mạng)
node content-lint.js samples --check-links

# Chạy test
node --test tests\content-lint.test.js

# (Bonus) trích + lint nội dung thật từ BE/FE
node real-content\extract-from-ts.js be ..\..\..\..\learning-hub\BE\src\data\initial-data.ts real-content\be-lessons.json
node real-content\extract-from-ts.js fe ..\..\..\..\learning-hub\FE\src\data\mockLessons.ts real-content\fe-lessons.json
node content-lint.js real-content\be-lessons.json real-content\fe-lessons.json --out-dir real-content --fail-on never
```

Output console mẫu thật (chạy trên `samples/lesson-bad.json`):

```
ERROR CT001 lesson-bad.json:3 title is missing
ERROR CT010 lesson-bad.json:10 prerequisite[0] references "Bài 99" which does not exist in the scanned corpus
...
WARNING CT011 lesson-bad.json:12 terminology "JS" is inconsistent (found variants: JS, Js)
...
Scanned 1 file(s), 2 lesson(s). 10 error(s), 9 warning(s).
```

Exit code: `0` nếu không có finding severity ERROR (hoặc theo `--fail-on warning|never`),
ngược lại `1` - dùng thẳng được làm CI/PR gate.

## 20 rule (CT001-CT020)

| Nhóm | Mã | Nội dung |
|---|---|---|
| Title | CT001 | thiếu title |
| | CT002 | title quá ngắn (< 10 ký tự) |
| | CT003 | title quá dài (> 100 ký tự) |
| Learning outcome | CT004 | thiếu field learningOutcome |
| | CT005 | learningOutcome rỗng |
| | CT006 | outcome quá mơ hồ (< 4 từ) |
| | CT007 | outcome trùng lặp trong cùng bài |
| Prerequisite | CT008 | thiếu field prerequisite |
| | CT009 | prerequisite rỗng |
| | CT010 | prerequisite tham chiếu bài học không tồn tại (vd "(Bài 99)") |
| Terminology | CT011 | thuật ngữ viết không nhất quán (vd "JS" và "Js") |
| | CT012 | chứa từ cấm/placeholder (todo, fixme, lorem ipsum...) |
| | CT013 | viết hoa sai convention (vd "Html" thay vì "HTML") |
| Link | CT014 | link sai định dạng URL |
| | CT015 | link rỗng |
| | CT016 | link dùng protocol không cho phép (chỉ cho http/https) |
| | CT017 | link trùng lặp |
| Structure | CT018 | thiếu field/section bắt buộc |
| | CT019 | field sai kiểu dữ liệu (JSON) |
| | CT020 | content trắng hoặc quá ngắn (< 40 ký tự) |

Đầy đủ mô tả + hướng sửa: `reports/rules-catalog.json`, hoặc sheet **01_Rule_Catalog**
trong `Day11_Content_Lint_Guide.xlsx`.

## Bonus: quét thư mục + kiểm tra link sống/chết qua mạng (CTLINK)

Hai tính năng bổ sung thêm sau khi rà lại yêu cầu, KHÔNG tính vào 20 rule ở trên (vẫn
đúng 20 rule tĩnh CT001-CT020, có test khẳng định):

- **Quét cả thư mục**: `node content-lint.js <thư mục>` tự quét đệ quy, gom hết file
  `.json`/`.md` bên trong để lint - không bắt buộc phải liệt kê từng file tay hay dựa
  vào glob của shell nữa. File định dạng khác trong thư mục bị bỏ qua âm thầm (vì đây
  là quét tự động); truyền thẳng 1 file định dạng lạ vẫn báo lỗi rõ như cũ.
- **`--check-links`**: bật thêm 1 bước kiểm tra link SỐNG/CHẾT bằng HTTP request THẬT
  (HEAD, fallback GET nếu server chặn HEAD) - phát hiện đúng "dead link" (link trả về
  404/500...) chứ không chỉ kiểm tra định dạng URL như CT014-CT017. Mặc định **TẮT**
  vì cần mạng ra ngoài; báo bằng mã riêng `CTLINK` (không phải 1 trong 20 rule) với 2
  mức: `ERROR` khi server THẬT SỰ trả về lỗi (chắc chắn link hỏng), `WARNING` khi không
  kết nối được (lỗi mạng/timeout/DNS - không chắc do link chết hay do máy đang chạy
  không có mạng, nên không báo ERROR để tránh báo oan hàng loạt khi chạy trong CI
  offline). Xem `link-checker.js` để biết chi tiết cách phân loại, và
  `tests/content-lint.test.js` mục 8 cho test tự động (dùng server HTTP cục bộ, không
  phụ thuộc mạng ngoài khi chạy test).

## Điều kiện nghiệm thu (đối chiếu với kế hoạch)

- ✅ **20 rule, mỗi rule có mã và hướng sửa**: test `mỗi rule có mã, severity hợp lệ
  và hướng sửa không rỗng` xác nhận không rule nào thiếu `code`/`fix`.
- ✅ **Phân biệt error/warning**: mọi finding có `severity` ∈ {ERROR, WARNING}, report
  console in ERROR trước WARNING, report JSON/CSV có cột `severity` riêng.
- ✅ **Không sửa nội dung âm thầm**: `content-lint.js` chỉ đọc file (`fs.readFileSync`),
  không có lệnh ghi nào lên file input - test `content-lint không được sửa/ghi đè file
  input` xác nhận byte-for-byte không đổi trước/sau khi chạy.
- ✅ **Report có vị trí lỗi**: mỗi finding có `file`, `line` (số dòng thật, không phải
  suy đoán), `path` (kiểu JSONPath, ví dụ `$[0].learningOutcome[1]`).

## Test độc lập (không dựa vào kết luận của AI)

```
node --test tests\content-lint.test.js
# 17 tests, 17 pass
```

Gồm: rule catalog hợp lệ (20 rule, đủ code/severity/fix), CLI chạy được với JSON/Markdown
hợp lệ (0 false positive), JSON lỗi cú pháp báo `CTPARSE` thay vì crash, `lesson-bad.*`
kích hoạt **đủ cả 20 rule**, số dòng report đúng với vị trí thật trong file, tool không
sửa file input, report JSON/CSV đúng field, thứ tự sort đúng, `--fail-on` hoạt động đúng,
file định dạng không hỗ trợ báo lỗi rõ ràng, quét cả thư mục (đủ file + thư mục rỗng báo
lỗi rõ), và `--check-links` phân biệt đúng OK (200) / DEAD (404 thật, server test cục bộ
riêng) / UNREACHABLE (không có gì lắng nghe).

**Ngoài test tự động, cần tự đối chiếu vài lỗi bằng mắt** (đọc trực tiếp
`samples/lesson-bad.json` / `.md` và so với report) — checklist cụ thể nằm ở sheet
**02_Test_Execution** trong file Excel, đúng theo yêu cầu "AI/tool không được thay
quyết định QA" của kế hoạch.

## Giới hạn đã biết

- `extract-from-ts.js` không phải TypeScript compiler đầy đủ - chỉ trích xuất được
  file data literal đơn giản (`export const NAME = [...]`), import đầu file phải là
  `import type`. Nếu BE/FE đổi cấu trúc seed sang import runtime khác, script báo lỗi
  rõ ràng thay vì chạy sai lặng lẽ.
- `json-lesson-parser.js` xác định số dòng bằng cách quét lại text gốc (không dùng
  AST parser đầy đủ) - hoạt động đúng với JSON "pretty" (mỗi field 1 dòng) như mọi file
  trong `samples/` và `real-content/`; với JSON minify (1 dòng duy nhất) mọi lỗi sẽ báo
  cùng 1 số dòng.
- Rule CT011/CT013 (terminology) dùng danh sách acronym/casing cố định trong `rules.js`
  - có thể bắt nhầm khi acronym xuất hiện trong code fence chỉ mang tính ví dụ. Cần
  review bằng người trước khi dùng làm release gate cứng (xem sheet 02_Test_Execution
  mục B).
- CT010 (prerequisite reference) chỉ đối chiếu trong phạm vi các file được truyền vào
  CÙNG 1 lần chạy CLI (biến `ctx.corpus`) - nếu lint từng file riêng lẻ, tham chiếu
  chéo file sẽ không được kiểm tra. Quét cả thư mục (`node content-lint.js <dir>`) giúp
  gom đủ file vào 1 lần chạy nên giảm rủi ro này, nhưng nếu bài học tham chiếu chéo nằm
  ở 2 thư mục/lần chạy CLI khác nhau thì vẫn không bắt được.
- `--check-links` cần mạng ra ngoài và chạy tuần tự có giới hạn concurrency (5 request
  cùng lúc) nên sẽ chậm hơn đáng kể so với lint tĩnh thông thường trên bộ nội dung lớn;
  không nên bật mặc định trong CI chạy thường xuyên, chỉ nên chạy định kỳ (vd trước khi
  publish) hoặc chạy tay khi cần rà lại toàn bộ link.
