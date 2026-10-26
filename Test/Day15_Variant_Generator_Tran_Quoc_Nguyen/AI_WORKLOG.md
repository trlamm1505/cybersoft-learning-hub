# AI WORK LOG - DAY 15 (Sinh biến thể đề có kiểm soát)

> Quy ước của file này (theo đúng convention Day12/13): mục "Kiểm chứng đã thực hiện" ghi những gì đã kiểm **bằng cách chạy thật** (không phải đọc code suông). Mục "Việc bạn cần tự làm trước khi nộp" ở cuối là phần con người phải tự làm - đừng ghi "đã xong" khi chưa có người xác nhận.

## Problem statement trước AI

Theo kế hoạch (Ngày 15): sinh biến thể đề có kiểm soát từ 5 source thật, đáp án phải tính lại tự động (không tin AI), không đổi learning outcome, mọi variant có source/version, phải qua validator Day12/13, con người phán quyết equivalence cuối cùng. Deliverable: Variant Generator v0.1, 30 variants, Equivalence Checklist.

Quy trình làm việc: Phase 1 (đọc-only, khảo sát schema/seed/validator thật, xem `PHASE1_SURVEY.md`) → user hỏi cách test Phase 1 → AI chạy kiểm chứng độc lập từng claim (xem `PHASE1_VERIFICATION.md`) → user nói "giúp tui làm ngày 15" → Phase 2 (mục này).

## Giả định đã tự chọn ở Phase 2 (vì user nói làm luôn, không chờ trả lời từng câu ở mục 8 của Phase 1)

Đây là các quyết định AI tự đưa ra để không bị kẹt - **cần bạn xác nhận lại**, không coi là "đã chốt":

1. **Chưa `git pull`** để đối chiếu "day15" của Dương Chí Việt trên GitHub - không có quyền chạy git trên máy bạn (không có `device_bash`). Deliverable này được đặt trong thư mục RIÊNG `Test/Day15_Variant_Generator_Tran_Quoc_Nguyen/` (đúng convention Day12/13, không đụng thư mục nào khác), nên nếu 2 việc trùng nhau thì cũng không mất công dọn dẹp gì thêm.
2. **sourceVersion** = content-hash manifest tự làm (`source-manifest.json`), version bắt đầu "1.0" - đã dùng đúng như đề xuất ở Phase 1.
3. **Quiz single-choice**: generator ép cứng đúng 1 option `isCorrect:true`/variant, có `throw Error` dừng ngay nếu vi phạm (xem `generator.js` hàm `genTypeofVariants`).
4. **Tỉ lệ source**: giữ đúng 4 coding + 1 quiz như đề xuất Phase 1, mỗi source sinh 6 variant = 24 + 6 = **30 variant** (khớp deliverable).
5. **Không có `device_bash` trên máy bạn**: toàn bộ generator/validator chạy trong sandbox cloud (bản sao byte-for-byte của file thật, stage qua remote-devices), rồi commit kết quả về đúng `Test/Day15_Variant_Generator_Tran_Quoc_Nguyen/` trên `D:\thuctap`. Không sửa gì trong `learning-hub/`.

## AI hỗ trợ (đề xuất giá trị tham số) + chương trình tính lại (đáp án)

- Viết `real-content/extract-sources.js` - tái dùng đúng kỹ thuật trích xuất TS->JSON của Day12 (`extract-quiz-from-ts.js`) và Day13 (`extract-exercises-from-ts.js`), không tự chép tay nội dung 5 source, không bịa field.
- Viết `real-content/build-manifest.js` - gắn `learningOutcome`, `allowedToChange`, `mustNotChange`, `paramRules` cho từng source (quyết định thiết kế của Day15, không sửa BE).
- Viết `generator.js` (Variant Generator v0.1): AI đề xuất **giá trị** tham số theo từng source (vd bộ số nguyên tố/hợp số/biên cho bài số nguyên tố, 6 literal JS khác nhau cho câu quiz), nhưng **KHÔNG** tự khẳng định đáp án:
  - Coding: `expectedOutput` của MỌI test case trong MỌI variant được tính bằng cách **chạy thật** `solutionCode` qua `python3` (`spawnSync`), y hệt cách Day13 đã làm - không đọc/suy luận công thức.
  - Quiz: chạy thật `node -e` để tính `typeof(literal)` và `typeof(typeof(literal))` cho cả 6 literal, xác nhận cả 6 đều ra `"string"` trước khi chấp nhận - không giả định suông.
- Viết `build-checklist.js` - ghép 30 variant với kết quả chạy Day12/13 validator thật thành `EQUIVALENCE_CHECKLIST.csv`. **Chỉ điền tự động cột tính được bằng chương trình** (EQ05, EQ08, EQ09, EQ06-theo-finding-thật); EQ01-04/EQ07/EQ10 luôn để "CẦN NGƯỜI XEM" - `finalDecision` luôn là `"NEEDS REVIEW"`, AI không tự ghi ACCEPT.

## Kiểm chứng đã thực hiện (chạy thật, không phải đọc code suông)

1. **Chạy generator lần 1 (6 variant/source), phát hiện lỗi bằng cách CHẠY Day13 validator thật lên kết quả** (không phải tự đoán trước):
   - **CP017 (24 lần)**: `slug` bị lặp 6 lần trong 1 batch, vì 6 variant cùng source giữ nguyên slug gốc. Đối chiếu lại `exercise.schema.ts` (`slug: unique: true`, xem `PHASE1_SURVEY.md` mục 2) → nếu seed thật vào BE, 5/6 insert sẽ bị Mongo từ chối do trùng unique key. **Sửa**: mỗi variant coding có `slug` + `title` riêng (hậu tố `-v0N`), `description/starterCode/solutionCode` giữ NGUYÊN.
   - **CP010 (3 lần)**: test biên "n<2" dùng giá trị `0`/`-5`, trong khi đề gốc ghi rõ "N nguyên dương" - test ngoài domain đề bài. **Sửa**: đổi mọi giá trị "edge" về `1` (số nguyên dương nhỏ nhất, vẫn đúng nhánh <2).
   - Chạy lại: **0 ERROR, Reference solution 24/24 AC.**
2. **Chạy Day12 validator lần 1, phát hiện QV017/QV018**: đáp án đúng nằm ở CÙNG 1 vị trí (option B) trong cả 6/6 quiz variant - đúng dạng lỗi "học viên nhớ vị trí" mà chính 2 rule này sinh ra để bắt (nghịch lý: variant generator lẽ ra phải TRÁNH lỗi này, không phải tạo thêm). **Sửa**: xoay vòng (rotate) thứ tự 4 option theo chỉ số variant, gắn lại key A-D theo thứ tự mới; xác nhận an toàn với BE thật vì `quiz.service.ts` tự `seededShuffle` lại theo seed ở mỗi lượt thi, thứ tự lưu trong bank không ảnh hưởng học viên thấy gì. Chạy lại: **0 ERROR, QV017/018 hết xuất hiện** (còn 5 WARNING QV006 - xem mục "Chưa đủ" bên dưới).
3. **Phát hiện lỗi nội dung khi tự đọc lại variant JSON (không đợi validator báo)**: variant quiz literal=`null` vẫn giữ nguyên `explanation` gốc nói "`typeof 1` trả về number" - SAI vì `typeof null === "object"` (đặc thù nổi tiếng của JS), không phải "number". Nếu không sửa, variant vẫn "chạy được" (đáp án cuối vẫn `"string"`, vẫn qua Day12 validator vì rule không kiểm nội dung explanation theo ngữ nghĩa) nhưng **giải thích sai** - đúng loại lỗi mà chỉ con người/đọc kỹ mới bắt được, validator tự động không bắt được. **Sửa**: tính lại CẢ bước trung gian (`typeof(literal)`) bằng `node -e` thật cho từng literal, viết lại `explanation` theo giá trị trung gian thật (vd null → "object", array → "object", 3.14 → "number").
4. **Chạy full pipeline cuối cùng** (generator → Day12 validator trên `for-validation/quiz` → Day13 validator trên `for-validation/coding` → build-checklist): **30/30 variant PASS validator (0 error)**, `Reference solution: 24/24 đạt AC` (đáp án coding 100% tính lại bằng chạy thật python3, khớp). 5 WARNING QV006 (câu dẫn quiz trùng chữ - do 6 variant chỉ đổi `codeSnippet`, giữ nguyên `content`/câu dẫn) và 31 WARNING CP002/CP013/CP016 (kế thừa từ đặc điểm sẵn có của source, đã có trong `DAY13_REPORT.md` gốc: F-D13-02/03) được giữ lại làm dòng cần người xem trong Equivalence Checklist, không tự "chữa" cho sạch report.

## AI sai/chưa đủ ở đâu (đọc trước khi tin số liệu trên)

- **Tự gây lỗi lúc chạy validator lần đầu**: chạy `coding-problem-validator.js validate for-validation` (trỏ vào thư mục CHA chứa cả file quiz lẫn coding) khiến tool quét luôn `quiz-variants.json` như thể là bài coding, ra 45 ERROR ảo (CP001/003/005/007/009/017 trên "quiz-variants.json#1..6"). Đây là LỖI CỦA LỆNH AI GÕ, không phải lỗi generator hay lỗi validator. Đã sửa bằng cách tách `for-validation/coding/` và `for-validation/quiz/` thành 2 thư mục con riêng để lỗi này không lặp lại (không chỉ đổi tên file).
- **QV006 (câu dẫn quiz trùng chữ) CHƯA sửa**: 6 variant quiz chỉ khác nhau ở `codeSnippet` (literal cụ thể) và `explanation`, còn `content` (câu dẫn) giữ nguyên y hệt source ("Đoạn mã JavaScript sau đây sẽ in ra kết quả gì màn hình console?") - đúng theo `mustNotChange` đã thiết kế ở Phase 1 (không đổi phần không phải tham số). Đây là lựa chọn CÓ CHỦ ĐÍCH, nhưng **cần bạn quyết định**: giữ nguyên câu dẫn (an toàn, đúng learning outcome 100%) hay viết lại câu dẫn cho đa dạng hơn (rủi ro làm lệch ý nếu AI tự diễn đạt lại) - AI không tự quyết đổi câu dẫn vì đó là nội dung, không phải tham số.
- **`git pull` chưa chạy** (xem mục "Giả định" #1) - chưa loại trừ khả năng trùng việc với team.
- **Chưa test end-to-end với BE thật**: mới validate bằng Day12/13 CLI (offline), CHƯA thử insert 1 variant coding vào MongoDB dev thật để xác nhận `slug-v0N` mới không đụng constraint nào khác ngoài `unique` (vd index phụ, hook `pre-save`) - nên coi các variant là "sẵn sàng để review", chưa phải "sẵn sàng để seed vào DB thật".
- **paramRules trong `source-manifest.json` là min/max rất rộng** (vd -999999..999999) nhưng generator chỉ THỰC SỰ dùng một tập giá trị AI tự chọn tay trong `generator.js` (không random sinh tự động trong khoảng đó) - nếu sau này cần sinh HÀNG LOẠT variant (>30) tự động theo khoảng, phải viết thêm logic random có seed + validate lại từng giá trị, `generator.js` hiện tại CHƯA làm việc đó.

## Việc bạn cần tự làm trước khi nộp

1. Chạy `git pull --ff-only origin main`, kiểm `Test/Day15_...` hoặc phần "day15" trong `learning-hub/` có bị trùng với deliverable này không.
2. Mở `EQUIVALENCE_CHECKLIST.csv`, tự điền 6 cột "CẦN NGƯỜI XEM" (EQ01/02/03/04/07/10) cho 30 dòng - đây là phần **bắt buộc con người quyết**, không được để AI tự đánh dấu ACCEPT.
3. Đọc lại 5 dòng WARNING `QV006` (câu dẫn quiz trùng chữ) - quyết định giữ nguyên hay viết lại câu dẫn.
4. Xem qua từng file trong `variants/<source>/V0N.json` (30 file) ít nhất lướt nhanh - AI_WORKLOG này chỉ ghi những gì AI tự kiểm, không thay cho việc bạn tự đọc.
5. Nếu quyết định dùng variant coding để seed thật vào DB dev: tự thử insert 1-2 variant trước, xác nhận `slug-v0N` không đụng logic nào khác trong `authoring.service.ts`/`exercise.service.ts` chưa được khảo sát kỹ ở Phase 1/2 (Phase 1/2 chỉ khảo sát `exercise.schema.ts` và luồng chấm bài, chưa khảo sát luồng authoring/import).
