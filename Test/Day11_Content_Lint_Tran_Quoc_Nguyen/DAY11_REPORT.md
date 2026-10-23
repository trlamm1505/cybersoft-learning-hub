# BÁO CÁO NGÀY 11 - Content lint cho bài học (v2 - Node.js/CT0xx)

**Kết quả chính (theo kế hoạch):** Phát hiện lỗi cấu trúc học liệu tự động. ✅ Đạt.

## 1. Bàn giao (đối chiếu danh sách tối thiểu)

| Yêu cầu | Trạng thái | Đường dẫn |
|---|---|---|
| content-lint.js |  | `tools/content-lint/content-lint.js` |
| rules.js |  | `tools/content-lint/rules.js` |
| lesson-good.json |  | `tools/content-lint/samples/lesson-good.json` |
| lesson-bad.json |  | `tools/content-lint/samples/lesson-bad.json` |
| lesson-bad.md |  | `tools/content-lint/samples/lesson-bad.md` |
| lint-report.json / .csv |  | `tools/content-lint/reports/lint-report.json` / `.csv` |
| 20 rules CT001 → CT020 |  | `tools/content-lint/reports/rules-catalog.json` |
| evidence CLI output |  | xem mục 2 bên dưới + `README.md` |

Bonus ngoài danh sách tối thiểu: `lesson-good.md` (đối chứng false positive cho
Markdown), `lesson-invalid.json` (test đường lỗi parse), `real-content/` (lint trên
nội dung thật của BE/FE), `Day11_Content_Lint_Guide.xlsx` (5 sheet theo đúng đề nghị).

## 2. Evidence CLI output (chạy thật, không chỉnh sửa)

```
$ node content-lint.js samples/lesson-bad.json
ERROR CT001 lesson-bad.json:3 title is missing
ERROR CT010 lesson-bad.json:10 prerequisite[0] references "Bài 99" which does not exist in the scanned corpus
ERROR CT012 lesson-bad.json:12 content contains banned/placeholder text "todo"
ERROR CT014 lesson-bad.json:13 videoUrl is malformed: "not-a-valid-url"
ERROR CT015 lesson-bad.json:14 link is empty
ERROR CT016 lesson-bad.json:17 links[1] uses disallowed protocol "javascript:"
ERROR CT019 lesson-bad.json:20 points should be of type number, got string
ERROR CT019 lesson-bad.json:21 isPublished should be of type boolean, got string
ERROR CT018 lesson-bad.json:23 required field "content"/"contentMarkdown" is missing
ERROR CT005 lesson-bad.json:25 learningOutcome is empty
WARNING CT006 lesson-bad.json:6 learning outcome is too vague: "ok"
WARNING CT006 lesson-bad.json:7 learning outcome is too vague: "ok"
WARNING CT007 lesson-bad.json:7 learning outcome[1] duplicates outcome[0]
WARNING CT011 lesson-bad.json:12 terminology "JS" is inconsistent (found variants: JS, Js)
WARNING CT013 lesson-bad.json:12 "Html" should be written as "HTML"
WARNING CT017 lesson-bad.json:18 links[2] duplicates link already used in "links[0]": http://insecure.example.com/video
WARNING CT020 lesson-bad.json:23 content is blank/empty
WARNING CT003 lesson-bad.json:24 title is too long (120 chars)
WARNING CT009 lesson-bad.json:26 prerequisite is empty

Scanned 1 file(s), 2 lesson(s). 10 error(s), 9 warning(s).
```

```
$ node content-lint.js samples/lesson-bad.md
ERROR CT004 lesson-bad.md:1 learningOutcome field is missing
ERROR CT018 lesson-bad.md:1 required section heading for "learningOutcome" is missing
ERROR CT018 lesson-bad.md:1 required section heading for "prerequisite" is missing
ERROR CT014 lesson-bad.md:10 link[2] "bad" is malformed: "not-a-url"
ERROR CT015 lesson-bad.md:10 link[0] "Trang chủ" is empty
ERROR CT016 lesson-bad.md:10 link[1] "ftp link" uses disallowed protocol "ftp:"
WARNING CT002 lesson-bad.md:1 title is too short ("JS", 2 chars)
WARNING CT008 lesson-bad.md:1 prerequisite field is missing
WARNING CT011 lesson-bad.md:3 terminology "JS" is inconsistent (found variants: JS, Js)
WARNING CT013 lesson-bad.md:3 "Html" should be written as "HTML"
WARNING CT020 lesson-bad.md:3 content is too short (11 chars)
WARNING CT017 lesson-bad.md:10 link[4] "dup2" duplicates link already used in "link[3] "dup"": https://example.com/x

Scanned 1 file(s), 1 lesson(s). 6 error(s), 6 warning(s).
```

```
$ node content-lint.js samples/lesson-good.json
Scanned 1 file(s), 1 lesson(s). 0 error(s), 0 warning(s).

$ node content-lint.js samples/lesson-good.md
Scanned 1 file(s), 1 lesson(s). 0 error(s), 0 warning(s).

$ node content-lint.js samples/lesson-invalid.json
ERROR CTPARSE lesson-invalid.json:1 invalid JSON - Unexpected token ']', ..."iêu 1",↵  ]↵}↵" is not valid JSON
Scanned 1 file(s), 0 lesson(s). 1 error(s), 0 warning(s).
```

## 3. Kết quả trên nội dung thật (bonus, BE + FE)

```
$ node content-lint.js real-content/be-lessons.json real-content/fe-lessons.json --fail-on never
ERROR CT004 be-lessons.json:2 learningOutcome field is missing
ERROR CT004 be-lessons.json:45 learningOutcome field is missing
WARNING CT008 be-lessons.json:2 prerequisite field is missing
WARNING CT008 be-lessons.json:45 prerequisite field is missing
WARNING CT011 fe-lessons.json:32 terminology "HTML" is inconsistent (found variants: HTML, html)
WARNING CT013 fe-lessons.json:32 "html" should be written as "HTML"
WARNING CT011 fe-lessons.json:75 terminology "CSS" is inconsistent (found variants: CSS, css)
WARNING CT013 fe-lessons.json:75 "css" should be written as "CSS"
WARNING CT011 fe-lessons.json:118 terminology "API" is inconsistent (found variants: api, API)
WARNING CT013 fe-lessons.json:118 "javascript" should be written as "JavaScript"
WARNING CT013 fe-lessons.json:118 "api" should be written as "API"
WARNING CT013 fe-lessons.json:118 "json" should be written as "JSON"

Scanned 2 file(s), 7 lesson(s). 2 error(s), 10 warning(s).
```

Nhận xét (đã tự đối chiếu bằng mắt với source thật, không chỉ tin report):
- CT004/CT008 trên BE **đúng thật**: seed data `initial-data.ts` không có field
  `learningOutcome`/`prerequisite` cho bài học nào - đây là phát hiện đã có từ bản v1
  (rule `CL008`/`CL010` cũ), nay được xác nhận lại độc lập bằng rule mới CT004/CT008
  chạy trên `real-content/be-lessons.json` (xem mục 3 phía trên).
- CT011/CT013 trên FE ("html"/"css"/"api"/"json"/"javascript" viết thường lẫn với
  cách viết hoa chuẩn) phần lớn đến từ các đoạn **code fence ví dụ** trong
  `contentMarkdown` (ví dụ `<!-- Bad Structure --><div class="header">`, hay chuỗi
  `application/json` trong code mẫu) chứ không phải lỗi văn phong thật sự nghiêm
  trọng - đây là giới hạn đã ghi trong README (rule CT011/CT013 không phân biệt được
  text trong code fence với text mô tả thường), cần review bằng người trước khi coi
  là release blocker.

## 4. Test tự động

```
$ node --test tests/content-lint.test.js
# tests 14
# pass 14
# fail 0
```

14 test bao gồm: rule catalog đủ 20 rule hợp lệ, CLI chạy đúng cho JSON/Markdown hợp
lệ và lỗi cú pháp, `lesson-bad.*` kích hoạt đủ cả 20 rule, số dòng report đúng thật
(không phải suy đoán — test này từng **fail** ở vòng đầu do lỗi lấy sai kiểu dữ liệu
line cho field mảng, đã sửa và pass lại, xem `AI_WORKLOG.md`), tool không sửa file
input, report JSON/CSV đúng field, sort đúng thứ tự severity, `--fail-on` hoạt động
đúng, và file định dạng lạ báo lỗi rõ ràng thay vì crash.

## 5. Đối chiếu điều kiện nghiệm thu

| Điều kiện | Đạt? | Bằng chứng |
|---|---|---|
| Rule có mã và hướng sửa |  | Test "mỗi rule có mã, severity hợp lệ và hướng sửa không rỗng" |
| Phân biệt error/warning |  | Mọi finding có `severity`; console in ERROR trước WARNING |
| Không sửa nội dung âm thầm |  | Test "content-lint không được sửa/ghi đè file input" (so byte-for-byte) |
| Report có vị trí lỗi |  | `line` (số dòng thật) + `path` (JSONPath) trong mọi finding |
| Tối thiểu 20 rule |  | Test "có đúng 20 rule (CT001-CT020)" |
| Chạy trên bộ nội dung có PASS và FAIL |  | `lesson-good.*` = 0 finding, `lesson-bad.*` = kích hoạt đủ 20 rule |

## 6. Giới hạn còn tồn tại

- Xem đầy đủ trong `README.md` mục "Giới hạn đã biết": line-tracking dựa trên quét
  text (không phải AST parser đầy đủ), CT011/CT013 có thể bắt nhầm text trong code
  fence, CT010 chỉ đối chiếu trong phạm vi 1 lần chạy CLI, `extract-from-ts.js` chỉ
  xử lý được file data literal đơn giản.
- Prerequisite/terminology chưa phải field chính thức trong BE schema (Mongoose) -
  đề xuất bổ sung nếu đội Data/BE đồng ý, để tránh lặp lại cảnh báo "thiếu field" ở
  mọi bài BE.
