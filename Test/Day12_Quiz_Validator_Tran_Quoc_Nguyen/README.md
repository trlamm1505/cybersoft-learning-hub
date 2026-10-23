# NGÀY 12 - Validator đề trắc nghiệm

> Theo `03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`, Tuần 3 - Học liệu và đề thi.
> Kết quả chính: **bắt lỗi đáp án và câu hỏi kém chất lượng**.
>
> **Bản v2** - sau khi nhận hướng dẫn điều chỉnh từ mentor, đã tích hợp lại
> theo checklist chi tiết mentor đưa (rule catalog mã `QV0xx`, fixture 50 file
> chia `fixtures/good/` + `fixtures/bad/` với ID `FIX-0xx`, Quality Report mở
> rộng có cột con người điền tay, AI Worklog, và file Excel tổng hợp) và
> chuyển vào đúng repo thật `cybersoft-learning-hub/Test/` (xem mục "Lịch sử
> điều chỉnh (v1 -> v2)" ở cuối file).

CLI Node.js độc lập (`tools/quiz-validator/`), **23 rule mã QV001-QV023**
(21 rule cấp CÂU HỎI + 2 rule cấp FILE cho pattern đáp án lệch), output CLI
dạng `SEVERITY CODE file:line message`, report JSON/CSV có vị trí lỗi rõ
ràng - cùng kiến trúc và quy ước với `content-lint` của Ngày 11
(`Day11_Content_Lint_Tran_Quoc_Nguyen/tools/content-lint/`), áp dụng cho
schema câu hỏi trắc nghiệm THẬT đang dùng ở BE (`Question` Mongoose schema,
xem `learning-hub/BE/src/data/initial-quiz-questions.ts`).

## Mục tiêu (theo kế hoạch)

- Check **số đáp án, duplicate, empty, answer key, ambiguity flag**.
- Phát hiện **pattern đáp án lệch** (skewed answer key) - chỉ là tín hiệu
  WARNING, không tự kết luận đề sai (mục 7 hướng dẫn điều chỉnh).
- **50 fixture tốt/xấu** (25 good + 25 bad) làm fixture bank có ground-truth,
  đặt trong `fixtures/good/` và `fixtures/bad/`, ID dạng `FIX-0xx`.

## Bàn giao tối thiểu (đối chiếu kế hoạch + hướng dẫn điều chỉnh)

| Yêu cầu | Đường dẫn |
|---|---|
| quiz_validator | `tools/quiz-validator/quiz-validator.js` (+ `rules.js`, `parsers/`) |
| Fixture bank (50 fixture, `FIX-0xx`) | `tools/quiz-validator/fixtures/{good,bad}/` + `fixtures-manifest.json` |
| Quality report (mở rộng) | `tools/quiz-validator/reports/*/quality-report.json` / `.csv` |
| AI Worklog | `AI_WORKLOG.md` (mục "AI đề xuất / con người kiểm chứng / AI sai ở đâu") |
| Excel tổng hợp 8 sheet | `Day12_Quality_Report.xlsx` |

Bonus ngoài danh sách tối thiểu: `samples/quiz-good.json` / `quiz-bad.json`
(demo CLI, `quiz-bad.json` kích hoạt đủ cả 23 rule), `real-content/` (chạy
trên 30 câu hỏi THẬT trích từ BE - xem mục 6), `reports/rules-catalog.json`
(23 rule export JSON), `reports/fixtures-run/` (chạy validator trên toàn bộ
fixture bank cùng lúc - xem lưu ý ở mục "Giới hạn đã biết").

## Cấu trúc

```
tools/quiz-validator/
├── quiz-validator.js          CLI chính (node quiz-validator.js <file...> [--out-dir DIR] [--fail-on ...])
├── rules.js                   23 rule QV001-QV023 (21 cấp câu hỏi + 2 cấp file)
├── parsers/
│   ├── text-scan.js           quét text thuần lấy số dòng thật (tái dùng nguyên vẹn từ Ngày 11)
│   └── quiz-parser.js         parse JSON câu hỏi trắc nghiệm + line-tracking cho từng option
├── samples/
│   ├── quiz-good.json         5 câu hỏi THẬT (trích từ real-content) - 0 ERROR, 1 WARNING đã biết (QV023)
│   └── quiz-bad.json          26 câu hỏi cố ý sai - kích hoạt đủ cả 23 rule
├── fixtures/
│   ├── good/                  25 fixture "sạch" - không được trigger rule mục tiêu của nó
│   └── bad/                   25 fixture cố ý lỗi - PHẢI trigger đúng rule mục tiêu
├── fixtures-manifest.json     ground-truth: mỗi fixture (FIX-0xx) kỳ vọng trigger rule nào - đặt
│                               NGOÀI fixtures/ để quiz-validator không quét nhầm nó thành 1 fixture
├── real-content/
│   ├── extract-quiz-from-ts.js  trích câu hỏi thật từ BE (.ts) ra JSON, không cần lib ngoài
│   └── quiz-questions.json      snapshot 30 câu hỏi thật (INITIAL_QUIZ_QUESTIONS)
├── reports/
│   ├── samples-run/           kết quả chạy trên samples/ (deliverable "Quality report" chính)
│   ├── fixtures-run/          kết quả chạy trên TOÀN BỘ fixtures/ cùng lúc (bonus - đọc kỹ mục
│   │                           "Giới hạn đã biết" trước khi diễn giải số liệu ở đây)
│   ├── real-content-run/      kết quả chạy trên 30 câu hỏi THẬT (xem mục 6 "Real-data validation")
│   └── rules-catalog.json     23 rule export JSON (dùng để build sheet 01_Rule_Catalog)
└── tests/
    └── quiz-validator.test.js 76 test (node:test, có sẵn trong Node, không cần cài thêm)
```

## Cài đặt

Không cần cài package nào - `quiz-validator.js` chỉ dùng module có sẵn của
Node (`fs`, `path`, `node:test`, `node:assert`). Yêu cầu Node.js >= 18
(khuyến nghị 20+; đã test trên Node 22).

## Format câu hỏi (JSON) - đã xác nhận với schema thật của BE

```jsonc
{
  "content": "Nội dung câu hỏi",
  "codeSnippet": "// optional, đoạn code kèm câu hỏi",
  "category": "HTML5",
  "difficulty": "EASY", // EASY | MEDIUM | HARD
  "points": 10,
  "allowMultiple": false, // optional - true nếu câu hỏi CHO PHÉP nhiều đáp án đúng
  "options": [
    { "key": "A", "text": "...", "isCorrect": false },
    { "key": "B", "text": "...", "isCorrect": true }
  ],
  "explanation": "Giải thích vì sao đáp án đúng là đúng",
  "tags": ["HTML5", "Semantic"]
}
```

Ví dụ THẬT trích trực tiếp từ `INITIAL_QUIZ_QUESTIONS`
(`learning-hub/BE/src/data/initial-quiz-questions.ts`):

```json
{
  "content": "Thẻ HTML5 Semantic nào dưới đây thích hợp nhất để bọc thanh điều hướng liên kết chính của trang web?",
  "category": "HTML5", "difficulty": "EASY", "points": 10,
  "options": [
    { "key": "A", "text": "<section>", "isCorrect": false },
    { "key": "B", "text": "<nav>", "isCorrect": true },
    { "key": "C", "text": "<aside>", "isCorrect": false },
    { "key": "D", "text": "<header>", "isCorrect": false }
  ],
  "explanation": "Thẻ `<nav>` trong HTML5 được thiết kế chuyên biệt để chứa các liên kết điều hướng...",
  "tags": ["HTML5", "Semantic", "Accessibility"]
}
```

Input chấp nhận: mảng câu hỏi ở top-level (`[ {...}, {...} ]`), object bọc
`{ "questions": [...] }`, hoặc 1 câu hỏi đơn (object). Đây đúng là format
thật của `INITIAL_QUIZ_QUESTIONS` trong BE - `quiz-validator` chạy được
trực tiếp trên seed data thật, không cần chuyển đổi (xem mục 6).

`allowMultiple` là field MỞ RỘNG riêng của quiz-validator (không có trong
schema BE thật) - mặc định coi mọi câu hỏi là "chỉ 1 đáp án đúng" trừ khi
field này = `true` (dùng cho QV011).

## Chạy

```powershell
cd Day12_Quiz_Validator_Tran_Quoc_Nguyen\tools\quiz-validator

# Kiểm tra 1 file
node quiz-validator.js samples\quiz-bad.json

# Kiểm tra nhiều file cùng lúc, ghi report ra thư mục
node quiz-validator.js samples\quiz-good.json samples\quiz-bad.json --out-dir reports\samples-run

# Kiểm tra cả 1 THƯ MỤC (tự quét đệ quy hết file .json bên trong, kể cả subfolder good/bad/)
node quiz-validator.js fixtures --out-dir reports\fixtures-run

# Chỉ fail (exit 1) khi có ERROR (mặc định), có WARNING, hoặc không bao giờ fail
node quiz-validator.js samples\quiz-bad.json --fail-on warning
node quiz-validator.js samples\quiz-bad.json --fail-on never

# Chạy test
node --test tests\quiz-validator.test.js

# (Bonus) trích + kiểm tra nội dung câu hỏi THẬT từ BE
node real-content\extract-quiz-from-ts.js ..\..\..\..\learning-hub\BE\src\data\initial-quiz-questions.ts real-content\quiz-questions.json
node quiz-validator.js real-content\quiz-questions.json --out-dir reports\real-content-run --fail-on never
```

Output console mẫu thật (chạy trên `samples/quiz-bad.json`, rút gọn - xem
đầy đủ ở `DAY12_REPORT.md` mục 2):

```
ERROR QV001 quiz-bad.json:2 options field is missing
ERROR QV002 quiz-bad.json:17 only 1 option(s) found - a question needs at least 2
...
WARNING QV017 quiz-bad.json correct answer sits at option position 0 in 17/22 questions (77%) - skewed beyond the 40% threshold
WARNING QV021 quiz-bad.json:646 content is too short/vague (1 word(s), minimum recommended 5): "HTML5?"
...
Scanned 1 file(s), 26 question(s). 12 error(s), 18 warning(s).
```

Exit code: `0` nếu không có finding severity ERROR (hoặc theo
`--fail-on warning|never`), ngược lại `1` - dùng thẳng được làm CI/PR gate.

## Explainable output - mỗi finding luôn trả lời "vì sao" và "sửa thế nào"

Đúng theo mục 5 hướng dẫn điều chỉnh, MỌI finding (console/JSON/CSV) đều có
đủ: mã rule, severity, vị trí (file + dòng + JSON path), message giải thích
CỤ THỂ (không chỉ "lỗi ở đây" mà nói rõ dữ liệu nào gây lỗi), và hướng sửa
gợi ý. Ví dụ 1 dòng JSON thật (rút từ `reports/fixtures-run/quality-report.json`):

```json
{
  "severity": "WARNING",
  "code": "QV023",
  "file": "option-length-outlier.json",
  "questionId": "option-length-outlier.json#Q1",
  "line": 8,
  "path": "$[0].options[0]",
  "message": "correct option is 9.4x longer than the average distractor (66 vs avg 7.0 chars) - possible length-based giveaway",
  "fix": "Viết lại các option sai (distractor) với độ dài tương đương option đúng, hoặc rút gọn option đúng nếu không cần thiết dài.",
  "humanVerification": "",
  "falsePositive": "",
  "finalResult": ""
}
```

3 field cuối (`humanVerification`, `falsePositive`, `finalResult`) CỐ Ý để
trống - tool không tự phán quyết, con người điền tay sau khi xem lại từng
dòng (đây chính là cột `06_False_Positive`/`04_Quiz_Findings` trong file
Excel tổng hợp).

## 23 rule (QV001-QV023)

| Nhóm | Mã | Severity | Cấp | Nội dung |
|---|---|---|---|---|
| Số đáp án | QV001 | ERROR | câu hỏi | thiếu/field options không phải mảng |
| | QV002 | ERROR | câu hỏi | quá ít lựa chọn (< 2) |
| | QV003 | WARNING | câu hỏi | quá nhiều lựa chọn (> 6) |
| Trùng lặp | QV004 | ERROR | câu hỏi | 2 option trùng text (không phân biệt hoa/thường) |
| | QV005 | ERROR | câu hỏi | 2 option trùng key |
| | QV006 | WARNING | câu hỏi | câu hỏi trùng TUYỆT ĐỐI nội dung với câu khác trong cùng lần chạy |
| Rỗng | QV007 | ERROR | câu hỏi | option rỗng |
| | QV008 | ERROR | câu hỏi | content câu hỏi rỗng/thiếu |
| | QV009 | WARNING | câu hỏi | explanation rỗng |
| Answer key | QV010 | ERROR | câu hỏi | không option nào isCorrect: true |
| | QV011 | ERROR | câu hỏi | nhiều option đúng nhưng không allowMultiple |
| | QV012 | ERROR | câu hỏi | option thiếu key |
| | QV013 | WARNING | câu hỏi | explanation trích dẫn nhầm key (heuristic, chỉ xét khi có trích dẫn rõ ràng) |
| Ambiguity flag | QV014 | WARNING | câu hỏi | 2 option gần như trùng (chỉ khác dấu câu/khoảng trắng) |
| | QV015 | WARNING | câu hỏi | option kiểu "tất cả/không có đáp án trên" (không an toàn khi hệ thống xáo trộn option) |
| | QV016 | WARNING | câu hỏi | option là substring của option khác (chồng lấn nghĩa) |
| | QV023 | WARNING | câu hỏi | **[mới v2]** độ dài option đúng lệch bất thường (>= 1.8x) so với trung bình distractor |
| Pattern đáp án lệch | QV017 | WARNING | **file** | vị trí đáp án đúng lệch > 40% trong cả file (>= 5 câu single-choice hợp lệ) |
| | QV018 | WARNING | **file** | >= 4 câu liên tiếp cùng vị trí đáp án đúng |
| Structure | QV019 | ERROR | câu hỏi | sai kiểu dữ liệu / giá trị không hợp lệ (points, difficulty, category) |
| | QV020 | WARNING | câu hỏi | explanation quá ngắn hoặc placeholder (todo, fixme...) |
| Content quality | QV021 | WARNING | câu hỏi | **[mới v2]** content quá ngắn/mơ hồ (< 5 từ) |
| Trùng lặp (mở rộng) | QV022 | WARNING | câu hỏi | **[mới v2]** câu hỏi GẦN TRÙNG (Jaccard similarity >= 70%, không trùng tuyệt đối) |

Đầy đủ mô tả + hướng sửa: `reports/rules-catalog.json`.

QV017/QV018 là 2 rule **cấp FILE** (xét toàn bộ câu hỏi trong 1 file, không
phải từng câu riêng lẻ) - xem `eligibleCorrectPositions()` trong `rules.js`:
câu hỏi đã lỗi (thiếu answer key, nhiều đáp án đúng, quá ít option...) bị
LOẠI khỏi thống kê để không làm nhiễu bằng dữ liệu vốn đã sai (có test riêng
xác nhận, xem tests mục 10).

**Đối chiếu với bộ rule minh hoạ mentor đưa trong hướng dẫn điều chỉnh**: mã
`QV0xx` KHÔNG được đặt lại theo đúng thứ tự liệt kê trong hướng dẫn (mentor
đã ghi rõ bộ 15 rule đó là "ví dụ, không bắt buộc viết y nguyên") - việc
renumber sẽ phải làm lại toàn bộ 50 fixture/76 test đã kiểm chứng ở bản v1
mà không mang lại giá trị QA nào thêm. Thay vào đó, 23 rule ở đây được đối
chiếu theo NHÓM lỗi mentor liệt kê để đảm bảo không thiếu ý nào: số đáp án
(QV001-003), trùng lặp (QV004-006, QV022), rỗng (QV007-009), answer key
(QV010-013), ambiguity (QV014-016, QV023), skew pattern (QV017-018),
structure (QV019-020), content quality (QV021 - ý "câu hỏi quá ngắn/mơ hồ"
mentor nêu ở mục 2). 3 rule `QV021/QV022/QV023` được thêm MỚI ở bản v2 chính
vì bộ 20 rule v1 chưa che phủ đủ 3 ý này.

## Vì sao QV015 (all/none of the above) là 1 rule thật, không phải suy đoán

`quiz.service.ts` của `cybersoft-learning-hub` dùng `seededShuffle()` để xáo
trộn **thứ tự option** mỗi lượt làm bài (`startAttempt()`). Một option kiểu
"tất cả đáp án trên" chỉ còn đúng nghĩa nếu nó LUÔN đứng ở vị trí cố định
(thường là cuối) - điều mà cơ chế xáo trộn của hệ thống không đảm bảo. Đây
là lý do rule này được xếp vào nhóm "Ambiguity flag": không phải category
sai đáp án, mà là loại câu hỏi tự mâu thuẫn với chính hành vi runtime của hệ
thống nó chạy trên đó.

## Ambiguity flag và Skew pattern LUÔN là WARNING, không bao giờ là ERROR

Theo đúng mục 6 và mục 7 của hướng dẫn điều chỉnh: mọi rule thuộc nhóm
`Ambiguity` (QV014, QV015, QV016, QV023) và `Skew pattern` (QV017, QV018)
được khai báo `severity: WARNING` CỨNG trong `rules.js` - không có nhánh
logic nào nâng chúng lên ERROR. Lý do: đây là các heuristic CẦN CON NGƯỜI
xem lại (ambiguity phụ thuộc ngữ cảnh sư phạm; skew phụ thuộc cỡ đề và có
thể là trùng hợp ngẫu nhiên), tool KHÔNG được tự động kết luận "đề sai" chỉ
vì khớp pattern - đúng tinh thần "không dùng AI/tool làm nguồn phán quyết
duy nhất" của kế hoạch. Có test riêng khẳng định bất biến này
(`mọi rule nhóm Ambiguity và Skew pattern đều là WARNING`) để nếu sau này ai
đó vô tình đổi severity, test sẽ đỏ ngay.

## Điều kiện nghiệm thu (đối chiếu với kế hoạch)

- ✅ **Không dùng AI làm nguồn phán quyết duy nhất**: toàn bộ 23 rule là
  logic tất định (regex/so sánh chuỗi/đếm/Jaccard similarity - xem
  `rules.js`), không gọi AI/LLM nào lúc CHẠY. AI chỉ được dùng lúc VIẾT CODE
  (xem `AI_WORKLOG.md`). Mọi quyết định "fixture X có nên trigger rule Y"
  đều được xác nhận lại **2 lần độc lập**: 1 lần lúc sinh fixture
  (`build-fixtures-v2.js`), 1 lần trong `tests/quiz-validator.test.js` (chạy
  CLI thật, không đọc lại code sinh fixture).
- ✅ **Mỗi flag có giải thích**: mọi rule có `description` + `fix` không
  rỗng (test "mỗi rule có mã, severity hợp lệ, group và hướng sửa không
  rỗng" xác nhận); mọi finding trong report có `message` cụ thể + `fix`
  (xem mục "Explainable output" ở trên).
- ✅ **Known false positive được ghi**: xem mục "Giới hạn đã biết" bên dưới.
- ✅ **Ambiguity/Skew chỉ là WARNING, cần human review**: xem mục ngay trên.

## Test độc lập (không dựa vào kết luận của AI)

```
node --test tests\quiz-validator.test.js
# 76 tests, 76 pass (chạy lặp lại nhiều lần để loại flaky - xem AI_WORKLOG.md)
```

Gồm: rule catalog hợp lệ (23 rule, đủ code/severity/group/fix), bất biến
"Ambiguity/Skew pattern luôn WARNING", CLI chạy đúng cho JSON hợp lệ/lỗi cú
pháp/định dạng không hỗ trợ, `quiz-bad.json` kích hoạt **đủ cả 23 rule**,
**toàn bộ 50 fixture trong fixture bank được chạy lại qua CLI thật và đối
chiếu với `fixtures-manifest.json`** (fixture GOOD: 0 ERROR + không trigger
rule mục tiêu; fixture BAD: phải trigger đủ rule mục tiêu), **checklist test
tối thiểu theo mục 8 hướng dẫn điều chỉnh** (8 test riêng, đặt tên rõ để đối
chiếu 1-1 với checklist gốc: fixture good sạch, content rỗng, option trùng,
thiếu/thừa answer key, option thiếu key, skew là WARNING không phải ERROR,
ambiguity là WARNING không phải ERROR), số dòng report đúng thật (không suy
đoán) cho 2 case cụ thể, tool không sửa file input, report JSON/CSV đúng
field (kể cả 3 cột mở rộng `humanVerification`/`falsePositive`/`finalResult`),
`--fail-on` hoạt động đúng 3 chế độ, quét cả thư mục (kể cả subfolder
`good/`/`bad/`) ra đúng số file, QV017/QV018 loại đúng câu hỏi lỗi khỏi
thống kê, và nội dung thật (30 câu) không có ERROR cấu trúc nào.

**Ngoài test tự động, cần tự đối chiếu vài lỗi bằng mắt**: mở trực tiếp
`samples/quiz-bad.json` và so với `reports/samples-run/quality-report.csv`,
hoặc mở 1 fixture bất kỳ trong `fixtures/good|bad/` và so với
`fixtures-manifest.json` - đúng theo yêu cầu "AI/tool không được thay quyết
định QA" của kế hoạch.

## Real-data validation (bonus, chạy trên BE thật)

**Lưu ý quan trọng (mục 9 hướng dẫn điều chỉnh)**: bước này CHỈ được chạy
SAU KHI fixture bank đã "cứng" (50/50 fixture khớp manifest, 76/76 test
xanh - đã xác nhận ở các bước trên). Fixture bank là dữ liệu CỐ Ý lỗi để
test rule, khác hẳn về bản chất với finding trên dữ liệu thật: **1 WARNING
trên `real-content/quiz-questions.json` là 1 khả năng đáng xem lại của bộ đề
sản xuất thật, không phải "fixture lỗi"** - 2 loại kết quả này được tách
riêng ra 2 thư mục report khác nhau (`reports/fixtures-run/` vs
`reports/real-content-run/`) để không lẫn lộn khi đọc.

```
$ node quiz-validator.js real-content\quiz-questions.json --fail-on never
WARNING QV017 quiz-questions.json correct answer sits at option position 1 in 19/30 questions (63%) - skewed beyond the 40% threshold
WARNING QV018 quiz-questions.json:139 4 consecutive questions ($[4] .. $[7]) all have the correct answer at option position 1
WARNING QV023 quiz-questions.json:389 correct option is 2.2x longer than the average distractor (17 vs avg 7.7 chars) - possible length-based giveaway
WARNING QV023 quiz-questions.json:520 correct option is 2.2x shorter than the average distractor (3 vs avg 6.7 chars) - possible length-based giveaway
WARNING QV023 quiz-questions.json:700 correct option is 3.7x shorter than the average distractor (1 vs avg 3.7 chars) - possible length-based giveaway
WARNING QV016 quiz-questions.json:954 options[0] "1 2 3" is a substring of options[2] "0 1 2 3"
WARNING QV016 quiz-questions.json:959 options[1] "0 1 2" is a substring of options[2] "0 1 2 3"
WARNING QV016 quiz-questions.json:969 options[3] "1 2" is a substring of options[0] "1 2 3"
WARNING QV016 quiz-questions.json:992 options[1] "def" is a substring of options[3] "define"
WARNING QV016 quiz-questions.json:997 options[2] "func" is a substring of options[0] "function"

Scanned 1 file(s), 30 question(s). 0 error(s), 13 warning(s).
```

(Danh sách rút gọn, xem đầy đủ 13 dòng ở `reports/real-content-run/quality-report.csv`.)

Nhận xét (đã tự đối chiếu bằng mắt với source thật, không chỉ tin report -
**đây là finding cần con người kiểm chứng, chưa phải "bug đã xác nhận"**):

- **QV017 là phát hiện đáng quan tâm nhất, CẦN NGƯỜI XEM LẠI**: 19/30 câu
  hỏi (63%) trong bộ đề sản xuất hiện có đáp án đúng nằm ở **vị trí thứ 2**
  (option B) trong mảng `options` gốc trước khi hệ thống xáo trộn. Đã tự đếm
  lại bằng tay trên `real-content/quiz-questions.json` để xác nhận con số
  19/30 (không chỉ tin report). Vì `quiz.service.ts` có xáo trộn
  `optionKeysOrder` mỗi lượt làm bài nên người dùng cuối không khai thác
  được trực tiếp qua UI, NHƯNG đây vẫn là rủi ro thật cần đội nội dung xem
  lại: (1) bất kỳ chỗ nào hiển thị câu hỏi không qua đường xáo trộn (vd
  trang quản trị, export đề, review thủ công) sẽ lộ pattern; (2) nó cho thấy
  người ra đề có thói quen đặt đáp án đúng ở vị trí quen tay.
- **QV023 (3 finding, mới ở v2)**: đáng chú ý nhất là dòng 700 - đáp án đúng
  chỉ dài 1 ký tự trong khi trung bình distractor dài 3.7 ký tự. Đây chính
  là câu hỏi Python "từ khoá nào dùng để gán giá trị" (đáp án đúng `"="`) -
  **xem mục "Giới hạn đã biết" bên dưới, đây là ví dụ thật của false
  positive QV023** (đáp án ngắn vì bản chất cú pháp Python, không phải lỗi
  ra đề).
- **0 ERROR cấu trúc**: khác với Ngày 11 (BE thiếu hẳn `learningOutcome`/
  `prerequisite`), bộ câu hỏi trắc nghiệm này đã đầy đủ field bắt buộc,
  answer key hợp lệ 100% (1 đáp án đúng/câu, không câu nào thiếu) - phản
  ánh đúng thực tế: seed data quiz được viết cẩn thận hơn seed data bài học.
- **QV016 (7 finding) phần lớn là false positive đáng ngờ, cần người review**
  (xem thêm mục "Giới hạn đã biết"): các cặp như `"def"` / `"define"`,
  `"1 2"` / `"1 2 3"` là do BẢN CHẤT câu hỏi (kết quả in ra của vòng lặp, từ
  khóa ngôn ngữ) tự nhiên là chuỗi con của nhau khi đúng đáp án dài hơn -
  không phải lỗi ra đề thật sự.

## Giới hạn đã biết (known false positives / limitations)

- **QV016 (substring overlap)** dễ false positive với các đáp án dạng số/mã
  ngắn mà bản chất đúng là tập con của nhau (vd đầu ra vòng lặp `"1 2"` vs
  `"1 2 3"`, từ khóa `"def"` vs `"define"`) - xem 7/7 finding trên nội dung
  thật ở mục "Real-data validation". **Cần review bằng người**, không nên
  dùng làm release blocker cứng cho category "Programming output/keyword".
- **QV023 (option length outlier, mới v2)** false positive khi đáp án đúng
  NGẮN VÌ BẢN CHẤT ngôn ngữ/cú pháp (vd Python dùng `"="` để gán giá trị,
  chỉ 1 ký tự, trong khi distractor "let"/"var"/"const" dài hơn hẳn) - đây
  là ví dụ thật, xác nhận trong `samples/quiz-good.json` (câu hỏi #3) và
  `real-content/quiz-questions.json:700`. Rule vẫn hữu ích để BẮT các trường
  hợp đáp án dài bất thường do người ra đề viết "cẩn thận hơn" đáp án đúng
  (thiên kiến kinh điển), nhưng KHÔNG nên tự động fail CI chỉ vì QV023 -
  luôn cần review theo category câu hỏi.
- **QV013 (explanation trích dẫn nhầm key)** CHỦ ĐỘNG thiết kế thiên về
  false NEGATIVE hơn false positive: chỉ xét khi explanation trích dẫn 1
  key rõ ràng trong backtick/ngoặc kép (`` `B` `` hoặc `"B"`); văn xuôi
  không trích dẫn key tường minh sẽ KHÔNG bị xét (an toàn nhưng bỏ sót
  nhiều trường hợp giải thích sai mà không trích key).
- **QV017/QV018 (skew pattern)** dùng ngưỡng cố định (`SKEW_MIN_QUESTIONS =
  5`, `SKEW_RATIO_THRESHOLD = 0.4`, `RUN_MIN_LENGTH = 4`, khai báo đầu
  `rules.js`) - với bộ đề nhỏ (sát ngưỡng 5 câu), 1 sự trùng hợp ngẫu nhiên
  vẫn có thể bị flag dù không phải lỗi thật; ngược lại bộ đề rất lớn có thể
  cần ngưỡng chặt hơn. Cần người xem lại khi file gần biên ngưỡng.
- **QV006/QV022 (trùng lặp / gần trùng)** so khớp trên TOÀN BỘ câu hỏi được
  quét trong CÙNG 1 LẦN CHẠY (`ctx.corpus`). Khi chạy
  `quiz-validator.js fixtures --out-dir reports/fixtures-run` (bonus, quét
  TOÀN BỘ thư mục `fixtures/` cùng lúc), rất nhiều fixture GOOD dùng chung
  nội dung placeholder mặc định (`"Câu hỏi mẫu hợp lệ dùng để kiểm tra
  rule."`) vì mục tiêu ban đầu của các fixture đó là rule KHÁC, không phải
  QV006/QV022 - đây là **false positive do cách tổ chức fixture bank, không
  phải lỗi logic rule**: mỗi fixture được thiết kế để chạy ĐỘC LẬP (đúng như
  trong `tests/quiz-validator.test.js`, nơi từng fixture được chạy CLI riêng
  lẻ), báo cáo `reports/fixtures-run/` chỉ nhằm minh chứng tính năng quét
  thư mục hoạt động đúng trên 1 bộ dữ liệu thật (50 file, cả 2 cấp thư mục
  con `good/`/`bad/`) - không nên đọc số liệu QV006/QV022 trong báo cáo đó
  theo nghĩa đen.
- **`quiz-parser.js`** xác định số dòng bằng cách quét lại text gốc (không
  dùng AST parser đầy đủ, kỹ thuật giống Ngày 11) - hoạt động đúng với JSON
  "pretty" (mỗi field 1 dòng, mỗi option 1 object nhiều dòng hoặc 1 dòng);
  với JSON minify (1 dòng duy nhất) mọi lỗi trong cùng 1 câu hỏi sẽ báo
  cùng 1 số dòng.
- **`extract-quiz-from-ts.js`** không phải TypeScript compiler đầy đủ - chỉ
  trích được file data literal đơn giản (`export const NAME: Type[] = [...]`
  sau khi bỏ phần `interface`/import ở đầu file). Nếu BE đổi cấu trúc seed
  sang import runtime khác, script báo lỗi rõ ràng thay vì chạy sai lặng lẽ.

## Lịch sử điều chỉnh (v1 -> v2)

Bản v1 (20 rule `QZ001-QZ020`, 67 test, fixture phẳng `fixtures/good-QZxxx.json`)
được bàn giao trước, sau đó mentor gửi hướng dẫn điều chỉnh chi tiết yêu cầu:
đổi tiền tố rule thành `QV0xx`, tổ chức lại fixture thành `fixtures/good/` +
`fixtures/bad/` với ID `FIX-0xx` và tên file mô tả, mở rộng Quality Report
thêm 3 cột con người điền tay, thêm 3 rule mới che phủ "content quá
ngắn/mơ hồ", "câu hỏi gần trùng", "option lệch độ dài", và chuyển toàn bộ
deliverable vào đúng repo thật `cybersoft-learning-hub/Test/` (nơi Day 3,
Day 6-11 đã có sẵn) thay vì thư mục gốc `D:\thuctap\`. Toàn bộ thay đổi này
được ghi lại chi tiết trong `AI_WORKLOG.md` mục "Vòng 2 - tích hợp theo
hướng dẫn điều chỉnh".
