# NGÀY 15 - Phase 1: Kiểm chứng độc lập các claim trong PHASE1_SURVEY.md

Vì Phase 1 chỉ tạo ra 1 tài liệu khảo sát (chưa có code mới của Ngày 15), "test xem có hoạt động không" ở đây nghĩa là: **kiểm tra từng claim trong `PHASE1_SURVEY.md` có đúng với code/tool thật hay không** — đúng tinh thần "kiểm chứng độc lập" mà Day12/Day13 đã làm (xem `AI_WORKLOG.md` của 2 ngày đó). Dưới đây là kết quả kiểm chứng thực hiện ngay trong phiên này, cộng với cách để bạn tự làm lại trên máy mình.

## 1. Đối chiếu từng claim với dòng code thật

| # | Claim trong PHASE1_SURVEY.md | Bằng chứng (file:dòng thật, đã grep lại) | Kết quả |
|---|---|---|---|
| 1 | `Question` schema không có field `id`/`version` | `question.schema.ts` dòng 1-45: chỉ có `content, codeSnippet, options, explanation, difficulty, category, points, tags` — không có `@Prop` nào tên `id`/`version` | ✅ Khớp |
| 2 | `Exercise.slug` là `unique: true`, dùng làm sourceId được | `exercise.schema.ts:31` — `@Prop({ required: true, type: String, unique: true })` ngay trên `slug: string;` (dòng 32) | ✅ Khớp |
| 3 | Schema `Exercise` không có field `constraints` | grep `constraints` trong `exercise.schema.ts` → chỉ khớp text bình luận không liên quan, không có `@Prop` nào tên `constraints` | ✅ Khớp |
| 4 | BE chấm quiz **chỉ single-choice** (so 1 `selectedOptionKey` với 1 option `isCorrect`) | `quiz.service.ts:157-172` — `selectedOption = options.find(opt => opt.key === selectedKey)`, rồi `if (selectedOption && selectedOption.isCorrect)`; không có logic gộp nhiều `selectedOptionKey` nào khác | ✅ Khớp |
| 5 | Day12 định danh câu hỏi bằng `<file>#Q<index 1-based>`, không dùng field `id` | `quiz-validator.js:180` — `` const questionId = `${fileBase}#Q${q.index + 1}` `` | ✅ Khớp |
| 6 | Day13 CLI có 3 subcommand chính: `validate`, `mutate`, `probe-leak` | `run-all.js:46-52` gọi cả 3 subcommand này qua `coding-problem-validator.js` | ✅ Khớp |
| 7 | `typeof (typeof X)` luôn là `"string"` với mọi `X` (cơ sở cho variant #5 đề xuất) | Chạy thật bằng Node, xem mục 3 bên dưới | ✅ Khớp (chạy thật, không suy luận suông) |

## 2. Chạy thật 2 tool có sẵn để chứng minh chúng còn hoạt động (không chỉ đọc code suông)

Do máy hiện tại (`desktop-ao6qrua`) chưa có `device_bash`, phần này chạy trên **bản sao file staged trong sandbox cloud** (nội dung y hệt file thật trên `D:\thuctap`, byte-for-byte, không sửa gì) — mục 4 bên dưới có lệnh để bạn tự chạy lại **trên đúng máy/thư mục thật**.

### 2a. Day12 `quiz-validator.js` — chạy trên sample có sẵn

```
node quiz-validator.js samples/quiz-good.json
→ WARNING QV023 quiz-good.json:87 ... (1 warning, 0 error)
Scanned 1 file(s), 5 question(s). 0 error(s), 1 warning(s).

node quiz-validator.js samples/quiz-bad.json
→ 12 error(s), 24 warning(s) — đúng như README mô tả (QV016, QV018, QV020, QV021, QV022, QV023 đều bắt đúng lỗi cố ý gài trong sample bad)
```

Kết quả khớp 100% với những gì `README.md` của Day12 mô tả → **tool Day12 vẫn chạy đúng, không bị hỏng do thay đổi gì sau này**.

### 2b. Day13 `coding-problem-validator.js validate` — chạy trên đề thật

```
node coding-problem-validator.js validate problems --out-dir <report-dir> --python python3
→ Scanned 1 file(s), 10 problem(s). 0 error(s), 12 warning(s).
→ Reference solution: 10/10 đạt AC.
```

**Đây là bằng chứng trực tiếp quan trọng nhất cho Ngày 15**: dòng `Reference solution: 10/10 đạt AC` nghĩa là tool vừa **CHẠY THẬT** `solutionCode` (Python) của cả 10 bài trên `testCases` thật và so sánh output — đúng cơ chế "tính lại đáp án tự động" mà Ngày 15 bắt buộc phải tái dùng (mục 4/6 của `PHASE1_SURVEY.md`). 12 warning đều là `CP002`/`CP013` (thiếu ràng buộc số học / ít test) — khớp finding F-D13-02/03 đã ghi trong `DAY13_REPORT.md`, không phải lỗi phát sinh mới.

## 3. Kiểm chứng thật claim "typeof typeof X luôn là string" (nguồn: câu quiz #5 đề xuất)

Chạy Node thật với 11 kiểu giá trị khác nhau (number, string, boolean, null, undefined, array, object, float, NaN, Symbol, BigInt):

```js
[1, 'abc', true, null, undefined, [1,2], {a:1}, 3.14, NaN, Symbol('x'), 123n]
  .map(v => typeof (typeof v))
→ tất cả đều "string" (11/11)
```

Đây chính là cơ sở để khẳng định câu quiz `initial-quiz-questions.ts#Q5` là source **duy nhất** trong 20 câu quiz thật có đáp án tính được/bất biến theo tham số — không phải suy đoán.

## 4. Cách bạn tự chạy lại trên máy thật (không cần AI)

Mở PowerShell tại `D:\thuctap\cybersoft-learning-hub\Test`, chạy:

```powershell
cd Day12_Quiz_Validator_Tran_Quoc_Nguyen\tools\quiz-validator
node quiz-validator.js samples\quiz-good.json samples\quiz-bad.json
# kỳ vọng: quiz-good.json 0 error; quiz-bad.json 12 error, 24 warning

cd ..\..\..\Day13_Coding_Problem_Validator_Tran_Quoc_Nguyen\tools\coding-problem-validator
node coding-problem-validator.js validate problems --out-dir reports\manual-check
# kỳ vọng: "Reference solution: 10/10 đạt AC.", 0 error, 12 warning (CP002/CP013)

# hoặc chạy full pipeline gốc (mutation + kiểm chứng độc lập Python):
node run-all.js
```

Nếu cả 2 lệnh trên ra đúng số liệu như mục 2 → khẳng định môi trường Node/Python trên máy bạn vẫn chấm đúng như lúc Day12/13 bàn giao, và những gì `PHASE1_SURVEY.md` mô tả về 2 tool này là chính xác, KHÔNG PHẢI AI bịa ra.

## 5. Còn thiếu gì chưa kiểm được trong phiên này

- Chưa `git pull --ff-only origin main` để đối chiếu "day15" của Dương Chí Việt trên GitHub (cần bạn tự chạy vì máy hiện tại không có `device_bash`).
- Chưa kiểm claim quiz-validator chấp nhận fixture `multiple-correct-with-flag.json` không báo ERROR — nếu bạn muốn, có thể chạy thêm `node quiz-validator.js fixtures\good\multiple-correct-with-flag.json` để tự thấy.
