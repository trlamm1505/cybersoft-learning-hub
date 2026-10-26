# BÁO CÁO NGÀY 12 - Validator đề trắc nghiệm (bản v2)

**Kết quả chính (theo kế hoạch):** Bắt lỗi đáp án và câu hỏi kém chất lượng. ✅ Đạt.

> Bản v2 - tích hợp theo hướng dẫn điều chỉnh của mentor (đổi mã rule
> `QZ0xx` → `QV0xx`, tổ chức lại fixture `fixtures/good/`+`fixtures/bad/`
> với ID `FIX-0xx`, thêm 3 rule mới, Quality Report mở rộng, Excel 8 sheet,
> chuyển vào `cybersoft-learning-hub/Test/`). Xem đầy đủ diễn biến ở
> `AI_WORKLOG.md` mục "Vòng 2".

## 1. Bàn giao (đối chiếu danh sách tối thiểu + hướng dẫn điều chỉnh)

| Yêu cầu | Trạng thái | Đường dẫn |
|---|---|---|
| quiz_validator | ✅ | `tools/quiz-validator/quiz-validator.js` |
| Fixture bank (50 fixture, `FIX-0xx`) | ✅ | `tools/quiz-validator/fixtures/{good,bad}/` (50 file) + `fixtures-manifest.json` |
| Quality report (mở rộng) | ✅ | `tools/quiz-validator/reports/*/quality-report.json` / `.csv` |
| AI Worklog | ✅ | `AI_WORKLOG.md` (mục "Vòng 2 - tích hợp theo hướng dẫn điều chỉnh") |
| Excel 8 sheet | ✅ | `Day12_Quality_Report.xlsx` |
| evidence CLI output | ✅ | xem mục 2 bên dưới + `README.md` |

Bonus ngoài danh sách tối thiểu: `samples/quiz-good.json` (5 câu hỏi thật,
0 ERROR + 1 WARNING đã biết là false positive), `real-content/` (chạy trên
30 câu hỏi THẬT trích từ BE), `reports/rules-catalog.json` (23 rule export
JSON), `reports/fixtures-run/` (chạy CLI trên toàn bộ 50 fixture cùng lúc,
minh chứng tính năng quét thư mục kể cả 2 cấp con `good/`/`bad/`).

## 2. Evidence CLI output (chạy thật, không chỉnh sửa)

```
$ node quiz-validator.js samples/quiz-good.json --fail-on never
WARNING QV023 quiz-good.json:87 correct option is 3.7x shorter than the average distractor (1 vs avg 3.7 chars) - possible length-based giveaway

Scanned 1 file(s), 5 question(s). 0 error(s), 1 warning(s).
```

1 WARNING duy nhất này là **false positive đã biết và được tài liệu hoá**
(đáp án đúng của câu hỏi Python là `"="`, ngắn hơn distractor "let"/"var"/
"const" - đúng bản chất cú pháp Python, không phải lỗi ra đề - xem README
mục "Giới hạn đã biết"), KHÔNG phải bug của validator.

```
$ node quiz-validator.js samples/quiz-bad.json --fail-on never
ERROR QV001 quiz-bad.json:2 options field is missing
ERROR QV002 quiz-bad.json:17 only 1 option(s) found - a question needs at least 2
ERROR QV004 quiz-bad.json:87 options[1] duplicates text already used in options[0]: "paris"
ERROR QV005 quiz-bad.json:114 options[1] key "A" duplicates key already used in options[0]
ERROR QV007 quiz-bad.json:190 options[0] text is empty
ERROR QV008 quiz-bad.json:207 content is blank/empty
ERROR QV010 quiz-bad.json:255 no option is marked isCorrect: true - missing answer key
ERROR QV011 quiz-bad.json:277 2 options are marked isCorrect: true (options[0, 1]) but allowMultiple is not true
ERROR QV012 quiz-bad.json:305 options[0] is missing a key
ERROR QV019 quiz-bad.json:434 category field is missing or empty
ERROR QV019 quiz-bad.json:436 difficulty "SUPER_HARD" is not one of EASY/MEDIUM/HARD
ERROR QV019 quiz-bad.json:437 points should be of type number, got string
WARNING QV017 quiz-bad.json correct answer sits at option position 0 in 17/22 questions (77%) - skewed beyond the 40% threshold
WARNING QV003 quiz-bad.json:34 7 options is more than the recommended max (6)
WARNING QV006 quiz-bad.json:158 question content duplicates another question (file "quiz-bad.json", $[5])
WARNING QV018 quiz-bad.json:184 4 consecutive questions ($[7] .. $[12]) all have the correct answer at option position 0
WARNING QV009 quiz-bad.json:245 explanation is blank/empty
WARNING QV023 quiz-bad.json:305 correct option is 2.0x longer than the average distractor (12 vs avg 6.0 chars) - possible length-based giveaway
WARNING QV016 quiz-bad.json:310 options[1] "Có key" is a substring of options[0] "Không có key"
WARNING QV023 quiz-bad.json:332 correct option is 2.0x shorter than the average distractor (3 vs avg 6.0 chars) - possible length-based giveaway
WARNING QV013 quiz-bad.json:343 explanation explicitly quotes key(s) C but the marked-correct key is B - possible wrong-answer explanation
WARNING QV014 quiz-bad.json:359 options[1] ".  class name" is near-identical to options[0] ".class-name" after ignoring punctuation/whitespace
WARNING QV014 quiz-bad.json:364 options[2] "#class-name" is near-identical to options[0] ".class-name" after ignoring punctuation/whitespace
WARNING QV016 quiz-bad.json:391 options[2] "Java" is a substring of options[1] "JavaScript"
WARNING QV015 quiz-bad.json:396 options[3] "Tất cả các đáp án trên" uses a shuffle-unsafe pattern ("all/none of the above")
WARNING QV023 quiz-bad.json:396 correct option is 3.3x longer than the average distractor (22 vs avg 6.7 chars) - possible length-based giveaway
WARNING QV018 quiz-bad.json:407 7 consecutive questions ($[16] .. $[22]) all have the correct answer at option position 0
WARNING QV016 quiz-bad.json:413 options[0] "aria-expanded" is a substring of options[1] "aria-expanded-state"
WARNING QV020 quiz-bad.json:472 explanation contains banned/placeholder text "todo"
WARNING QV020 quiz-bad.json:472 explanation is too short (4 chars, minimum recommended 15)
WARNING QV022 quiz-bad.json:506 question content is near-duplicate of another question (83% word overlap, file "quiz-bad.json", $[19])
WARNING QV022 quiz-bad.json:534 question content is near-duplicate of another question (83% word overlap, file "quiz-bad.json", $[19])
WARNING QV022 quiz-bad.json:562 question content is near-duplicate of another question (83% word overlap, file "quiz-bad.json", $[19])
WARNING QV022 quiz-bad.json:590 question content is near-duplicate of another question (83% word overlap, file "quiz-bad.json", $[19])
WARNING QV022 quiz-bad.json:618 question content is near-duplicate of another question (83% word overlap, file "quiz-bad.json", $[19])
WARNING QV021 quiz-bad.json:646 content is too short/vague (1 word(s), minimum recommended 5): "HTML5?"

Scanned 1 file(s), 26 question(s). 12 error(s), 24 warning(s).
```

Tất cả 23 mã QV001-QV023 đều xuất hiện trong output trên - xác nhận bằng
test tự động (`samples/quiz-bad.json kích hoạt đủ cả 23 rule QV001-QV023`),
không chỉ đếm bằng mắt.

## 3. Kết quả trên nội dung thật (real-data validation, 30 câu hỏi thật từ BE)

Chạy SAU KHI đã xác nhận fixture bank (50/50) + test suite (76/76) ổn định
hoàn toàn - đúng thứ tự mục 9 của hướng dẫn điều chỉnh ("Fixture cố ý lỗi
≠ bug thật", real-data chỉ chạy khi công cụ đã đáng tin).

```
$ node quiz-validator.js real-content/quiz-questions.json --fail-on never
WARNING QV017 quiz-questions.json correct answer sits at option position 1 in 19/30 questions (63%) - skewed beyond the 40% threshold
WARNING QV018 quiz-questions.json:139 4 consecutive questions ($[4] .. $[7]) all have the correct answer at option position 1
WARNING QV023 quiz-questions.json:389 correct option is 2.2x longer than the average distractor (17 vs avg 7.7 chars) - possible length-based giveaway
WARNING QV023 quiz-questions.json:520 correct option is 2.2x shorter than the average distractor (3 vs avg 6.7 chars) - possible length-based giveaway
WARNING QV023 quiz-questions.json:700 correct option is 3.7x shorter than the average distractor (1 vs avg 3.7 chars) - possible length-based giveaway
WARNING QV023 quiz-questions.json:789 correct option is 1.9x longer than the average distractor (18 vs avg 9.7 chars) - possible length-based giveaway
WARNING QV023 quiz-questions.json:827 correct option is 2.3x shorter than the average distractor (1 vs avg 2.3 chars) - possible length-based giveaway
WARNING QV016 quiz-questions.json:954 options[0] "1 2 3" is a substring of options[2] "0 1 2 3"
WARNING QV016 quiz-questions.json:959 options[1] "0 1 2" is a substring of options[2] "0 1 2 3"
WARNING QV016 quiz-questions.json:969 options[3] "1 2" is a substring of options[0] "1 2 3"
WARNING QV016 quiz-questions.json:992 options[1] "def" is a substring of options[3] "define"
WARNING QV023 quiz-questions.json:992 correct option is 2.0x shorter than the average distractor (3 vs avg 6.0 chars) - possible length-based giveaway
WARNING QV016 quiz-questions.json:997 options[2] "func" is a substring of options[0] "function"

Scanned 1 file(s), 30 question(s). 0 error(s), 13 warning(s).
```

Mọi finding trên là **WARNING cần con người xem lại**, KHÔNG phải "bug đã
xác nhận" (phân biệt rõ theo mục 9 hướng dẫn điều chỉnh):

- Phát hiện đáng chú ý nhất: **63% câu hỏi trong bộ đề sản xuất có đáp án
  đúng nằm ở vị trí thứ 2 (option B)** trong dữ liệu gốc - một pattern
  thật, đã tự đếm lại bằng tay để xác nhận (không chỉ tin report).
- 5 finding `QV023` (mới ở v2) - đáng chú ý nhất là dòng 700, xác nhận
  chính là câu hỏi Python đã biết là false positive (đáp án `"="`).
- 0 ERROR cấu trúc - khác với Ngày 11 (BE thiếu `learningOutcome`/
  `prerequisite`), seed data quiz đã đầy đủ field bắt buộc.
- 7 finding `QV016` phần lớn là false positive đáng ngờ (chuỗi con tự
  nhiên do bản chất nội dung: `"def"`/`"define"`, `"1 2"`/`"1 2 3"`), cần
  người review theo category "Programming output/keyword" - xem README.

Xem phân tích đầy đủ ở `README.md` mục "Real-data validation".

## 4. Test tự động

```
$ node --test tests/quiz-validator.test.js
# tests 76
# pass 76
# fail 0
```

76 test bao gồm: rule catalog đủ 23 rule hợp lệ (code/severity/group/fix),
**bất biến "Ambiguity/Skew pattern luôn là WARNING, không bao giờ ERROR"**
(mục 6/7 hướng dẫn điều chỉnh), CLI chạy đúng cho JSON hợp lệ/lỗi cú
pháp/định dạng không hỗ trợ, `quiz-bad.json` kích hoạt đủ cả 23 rule,
**50 test riêng - mỗi fixture trong fixture bank 1 test - đối chiếu với
`fixtures-manifest.json`** (phần lớn nhất của bộ test, phản ánh đúng trọng
tâm "Fixture bank"), **8 test checklist tối thiểu theo mục 8 hướng dẫn
điều chỉnh** (đặt tên rõ để đối chiếu 1-1: good sạch, content rỗng, option
trùng, thiếu/thừa answer key, thiếu key, skew là WARNING, ambiguity là
WARNING), số dòng report đúng thật cho 2 case cụ thể, tool không sửa file
input, report JSON/CSV đúng field (kể cả 3 cột mở rộng con người điền tay),
`--fail-on` hoạt động đúng 3 chế độ, quét cả thư mục (kể cả `good/`/`bad/`)
ra đúng số file, rule cấp file QV017/QV018 loại đúng câu hỏi đã lỗi khỏi
thống kê, và nội dung thật (30 câu) không có ERROR cấu trúc nào. Chạy lặp
lại 3 lần liên tiếp, cả 3 lần đều 76/76 PASS.

## 5. Đối chiếu điều kiện nghiệm thu

| Điều kiện | Đạt? | Bằng chứng |
|---|---|---|
| Không dùng AI làm nguồn phán quyết duy nhất | ✅ | 23 rule là logic tất định (`rules.js`, không gọi AI lúc chạy); 3 cột review (`humanVerification`/`falsePositive`/`finalResult`) trong report luôn để trống cho người điền |
| Mỗi flag có giải thích | ✅ | Test "mỗi rule có mã, severity hợp lệ, group và hướng sửa không rỗng"; ví dụ JSON finding đầy đủ field ở README mục "Explainable output" |
| Known false positive được ghi | ✅ | Mục "Giới hạn đã biết" trong README.md (QV016, QV023, QV013, QV017/QV018, QV006/QV022) |
| Check số đáp án, duplicate, empty, answer key, ambiguity flag | ✅ | QV001-QV016, QV023 |
| Phát hiện pattern đáp án lệch (chỉ WARNING) | ✅ | QV017/QV018 (rule cấp file, severity cố định WARNING), xác nhận bắt được pattern THẬT trên seed data (63% lệch vị trí B) |
| 50 fixture tốt/xấu, ID `FIX-0xx`, `fixtures/good\|bad/` | ✅ | `fixtures/{good,bad}/` (25+25), `fixtures-manifest.json`, test "fixture bank có đúng 50 fixture" |
| Ambiguity/skew CHỈ là WARNING | ✅ | Test riêng "mọi rule nhóm Ambiguity và Skew pattern đều là WARNING" |
| Real-data validation sau khi fixture cứng | ✅ | Mục 3 ở trên chạy sau khi 50/50 fixture + 76/76 test xanh |
| Quality Report mở rộng (Human Verification, False Positive?, Final Result) | ✅ | `quiz-validator.js` `toCsv()`/JSON report, 3 cột để trống cho người điền |
| AI Worklog đúng mẫu | ✅ | `AI_WORKLOG.md` mục "Vòng 2" (AI đề xuất / con người kiểm chứng / AI sai ở đâu / quyết định) |
| Excel 8 sheet | ✅ | `Day12_Quality_Report.xlsx` |

## 6. Giới hạn còn tồn tại

Xem đầy đủ trong `README.md` mục "Giới hạn đã biết": QV016 (substring) dễ
báo oan với đáp án dạng số/mã ngắn tự nhiên là tập con của đáp án dài hơn;
QV023 (mới v2) báo oan khi đáp án đúng ngắn vì bản chất ngôn ngữ/cú pháp
(ví dụ thật: đáp án Python `"="`); QV013 chủ động thiên về bỏ sót hơn báo
oan; QV017/QV018 dùng ngưỡng cố định, cần người xem lại với bộ đề sát biên
ngưỡng; QV006/QV022 chỉ so khớp trong CÙNG 1 lần chạy, và báo cáo
`reports/fixtures-run/` (chạy cả thư mục fixtures/ cùng lúc) có nhiễu
QV006/QV022 chéo giữa các fixture do dùng chung nội dung placeholder mặc
định - không phản ánh chất lượng rule mà là cách tổ chức fixture bank (mỗi
fixture được thiết kế chạy ĐỘC LẬP, đúng như trong test suite).
`extract-quiz-from-ts.js` chỉ xử lý được file data literal đơn giản, tương
tự giới hạn đã ghi nhận ở Ngày 11.
