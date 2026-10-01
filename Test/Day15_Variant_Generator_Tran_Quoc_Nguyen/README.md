# NGÀY 15 - Sinh biến thể đề có kiểm soát

Người thực hiện: Tran_Quoc_Nguyen (AI hỗ trợ). Ngày: 22/09/2026.
Kế hoạch: `03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`, Ngày 15.
Nhật ký AI: `AI_WORKLOG.md` (đọc trước khi tin số liệu ở đây). Khảo sát Phase 1: `PHASE1_SURVEY.md`, `PHASE1_VERIFICATION.md`.

## 1. Tóm tắt

Đã trích **5 source thật** (4 bài coding + 1 câu quiz, xem `PHASE1_SURVEY.md` mục 7) từ seed data BE, thiết kế `source-manifest.json` (learning outcome + parameter rules), viết **Variant Generator v0.1** (`tools/variant-generator/generator.js`), sinh **30 variants** (24 coding + 6 quiz), mỗi đáp án được **chương trình tính lại tự động** (chạy thật `python3`/`node`, không tin AI đoán), chạy qua Day12/Day13 validator có sẵn: **30/30 PASS (0 error)**, và xuất `EQUIVALENCE_CHECKLIST.csv` (30 dòng, 6 cột phán quyết để trống cho người xem - xem mục 5).

## 2. Cấu trúc thư mục

```
Day15_Variant_Generator_Tran_Quoc_Nguyen/
├── PHASE1_SURVEY.md            # Khảo sát read-only schema/seed/validator thật
├── PHASE1_VERIFICATION.md      # Kiểm chứng độc lập từng claim của Phase 1
├── AI_WORKLOG.md               # Nhật ký AI: giả định, bug tự phát hiện+sửa, việc còn lại
├── README.md                   # File này
├── source-manifest.json        # 5 source thật + learningOutcome/paramRules/sourceVersion
├── all-variants.json           # 30 variant, đầy đủ envelope (traceability)
├── EQUIVALENCE_CHECKLIST.csv   # Checklist EQ01-EQ10, 1 dòng/variant (mở bằng Excel)
├── EQUIVALENCE_CHECKLIST.json  # Cùng nội dung, dạng JSON
├── tools/variant-generator/
│   ├── real-content/
│   │   ├── extract-sources.js  # Trích 5 source thật từ initial-*.ts (không bịa)
│   │   ├── build-manifest.js   # Gắn learningOutcome/paramRules -> source-manifest.json
│   │   └── sources-raw.json    # Output trung gian của extract-sources.js
│   ├── generator.js            # VARIANT GENERATOR v0.1 (deliverable chính)
│   └── build-checklist.js      # Ghép variant + validator report -> Equivalence Checklist
├── variants/<sourceId>/V01.json .. V06.json   # 30 file, 1 variant/file
├── for-validation/
│   ├── coding/coding-variants.json   # 24 content coding, đúng format base-exercises.json
│   └── quiz/quiz-variants.json       # 6 content quiz, đúng format seed quiz
└── reports/
    ├── coding-validation/validator-report.{json,csv}   # Kết quả Day13 validator thật
    └── quiz-validation/quality-report.{json,csv}       # Kết quả Day12 validator thật
```

## 3. Cách chạy lại từ đầu (tái lập 100%)

Máy hiện tại (lúc làm Ngày 15) **không có `device_bash`** nên phần này chạy trong sandbox cloud rồi commit kết quả về `D:\thuctap`. Nếu máy bạn có Node + Python, chạy lại được y hệt bằng PowerShell tại thư mục này:

```powershell
cd tools\variant-generator

# 1. Trích 5 source thật từ BE (chỉnh đường dẫn --be-data-dir nếu cần)
node real-content\extract-sources.js "..\..\..\..\learning-hub\BE\src\data" real-content

# 2. Gắn learning outcome + parameter rules -> source-manifest.json
node real-content\build-manifest.js real-content\sources-raw.json source-manifest.json

# 3. Sinh 30 variant (mặc định 6 variant/source x 5 source), tự tính lại đáp án
node generator.js source-manifest.json . --variants-per-source 6

# 4. Chạy 2 validator có sẵn của Day12/Day13 lên kết quả
node "..\..\..\Day12_Quiz_Validator_Tran_Quoc_Nguyen\tools\quiz-validator\quiz-validator.js" for-validation\quiz --out-dir reports\quiz-validation --fail-on error
node "..\..\..\Day13_Coding_Problem_Validator_Tran_Quoc_Nguyen\tools\coding-problem-validator\coding-problem-validator.js" validate for-validation\coding --out-dir reports\coding-validation --python python

# 5. Ghép thành Equivalence Checklist
node build-checklist.js .
```

Kỳ vọng: bước 4 ra `0 error` cho cả 2 tool, dòng `Reference solution: 24/24 đạt AC` cho coding. Nếu số liệu khác đi (khác 0 error, khác 24/24 AC) → source thật trong `learning-hub/BE` đã bị đổi kể từ 22/09/2026, cần khảo sát lại Phase 1 trước khi tin tiếp kết quả cũ.

## 4. Nguyên tắc thiết kế (đối chiếu acceptance của kế hoạch)

| Điều kiện (kế hoạch) | Cách đáp ứng trong deliverable này |
|---|---|
| Đáp án tính lại tự động, không tin AI | `generator.js` luôn `spawnSync('python3', ...)` / `spawnSync(node, ['-e', ...])` để tính - không có chỗ nào gán `expectedOutput`/`isCorrect` bằng tay |
| Không đổi learning outcome | `source-manifest.json` khai rõ `allowedToChange`/`mustNotChange` mỗi source; generator chỉ đổi phần trong `allowedToChange` |
| Mỗi variant lưu sourceId/sourceVersion/variantVersion | Có trong mọi file `variants/*/V0N.json` và `all-variants.json` |
| Variant phải qua validator hiện có trước ACCEPT | Mục 3 bước 4 - dùng NGUYÊN validator Day12/13, không viết validator riêng cho Day15 |
| Không tự đánh giá equivalent chỉ bằng AI | `EQUIVALENCE_CHECKLIST.*` để trống 6 cột EQ01/02/03/04/07/10 + `finalDecision` luôn `"NEEDS REVIEW"` |
| Không sửa source hiện tại khi chưa cần | `extract-sources.js` chỉ ĐỌC `initial-exercises.ts`/`initial-quiz-questions.ts`, không ghi gì vào `learning-hub/` |
| Không invent schema | `extract-sources.js` trích trực tiếp bằng `vm` từ file `.ts` thật, không tự gõ tay nội dung; `PHASE1_SURVEY.md` đối chiếu từng field với schema Mongoose thật |

## 5. Việc còn lại (con người) - xem chi tiết ở `AI_WORKLOG.md`

1. Điền 6 cột "CẦN NGƯỜI XEM" trong `EQUIVALENCE_CHECKLIST.csv` cho 30 dòng.
2. Quyết định 5 WARNING `QV006` (câu dẫn quiz trùng chữ do chỉ đổi `codeSnippet`) - giữ hay viết lại.
3. `git pull --ff-only origin main`, đối chiếu với "day15" team đã push (chưa kiểm được vì máy không có `device_bash`).
4. Chưa thử seed variant coding vào MongoDB dev thật - mới validate offline bằng CLI.
