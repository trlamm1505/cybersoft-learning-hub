# AI Work Log — Ngày 14: Bộ 20 bài Python/game logic cho lớp 6-9

| | |
|---|---|
| **Người thực hiện** | Dương Chí Việt |
| **Ngày** | 2026-09-18 |
| **Nhánh** | `feature/learning-hub-day14` |
| **Công cụ** | Claude Code (CLI, VSCode extension), model Claude Sonnet 5 |
| **Phạm vi quyền** | Đọc/ghi trong `learning-hub/`; tạo branch mới từ `feature/learning-hub-day13` + merge `main` (loại trừ `Test/`, `Data-AI-Resource/` vì là công việc của nhóm khác); chạy build/typecheck/seed/dev server thật; gọi API thật qua judge pipeline để kiểm chứng. Không đụng `Test/`, `Data-AI-Resource/` |

---

## Tóm tắt 1 dòng mỗi việc

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Tạo branch `feature/learning-hub-day14`, merge `main` loại trừ `Test/`, `Data-AI-Resource/` | ✅ Xong |
| 2 | Khảo sát kiến trúc hiện có (Lesson vs Exercise) để chọn đúng nơi tích hợp 20 bài | ✅ Xong |
| 3 | Thiết kế 20 bài Python (5 nhóm x 4 bài), 92 test case | ✅ Xong |
| 4 | Kiểm chứng độc lập bằng script Python — tự bắt 4 lỗi thiết kế bài/test | ✅ Xong |
| 5 | Thêm `tags`, `prerequisiteSlug` vào `Exercise` schema; sửa 1 lỗi schema có sẵn (`expectedOutput` không cho chuỗi rỗng) | ✅ Xong |
| 6 | Chạy qua đúng judge pipeline thật — phát hiện và vá lỗi hạ tầng CRLF/LF có sẵn | ✅ Xong |
| 7 | Viết Editorials + Teacher Guide cho 20 bài | ✅ Xong |
| 8 | Sửa bug FE: 20 bài mới bị ẩn khỏi Code Playground do logic gộp danh sách sai | ✅ Xong |
| 9 | Tái cấu trúc theo phản hồi: thêm `gradeBand`/`topic`/`orderInTopic`, giảm độ khó 3 bài HARD cho đúng lứa tuổi | ✅ Xong |
| 10 | Giao diện danh sách bài kiểu HackerRank + khóa tuần tự (AC mới mở bài sau) + gợi ý 3 cấp | ✅ Xong |
| 11 | Đổi flow điều hướng: box chọn Lớp → grid chọn Bài → mới mở Code Editor | ✅ Xong |
| 12 | Sửa bug khóa tuần tự không hoạt động ở lớp 6-9; chuẩn hóa trạng thái WA/TLE/RE/CE/AC; đồng bộ icon `lucide-react` (Batch 1); focus-trap 6 modal; xóa Responsive Guide | ✅ Xong |
| 13 | Đồng bộ icon `lucide-react` Batch 2 (các trang/component còn lại) qua 4 sub-agent song song; khắc phục sự cố `git stash` giữa lúc chạy song song làm mất tạm các thay đổi | ✅ Xong |

---

## Việc 1 — Tạo branch, merge main loại trừ Test/ và Data-AI-Resource/

### Prompt gốc của người dùng
> "tương tự như này ngày 13 giờ tạo branch day14 sau đó kéo main xuống (trừ folder test và data vì là của người khác)"

### Đã làm
Tạo `feature/learning-hub-day14` từ `feature/learning-hub-day13`. Merge `main` vào, kiểm tra diff xác nhận toàn bộ thay đổi từ merge chỉ nằm trong `Test/` và `Data-AI-Resource/` (việc của nhóm khác); không có thay đổi nào trong `learning-hub/`. Loại các file thuộc 2 thư mục trên khỏi working tree trước khi commit merge.

---

## Việc 2 — Khảo sát kiến trúc, chọn nơi tích hợp 20 bài

### Phát hiện
Hệ thống có 2 nơi lưu "bài tập" dễ nhầm: `Lesson` (trang "Bài học" chính thống, không có judge pipeline) và `Exercise` (Code Playground, có judge chạy Python thật). Nhiệm vụ ngày 14 khớp với `Exercise`.

### Quyết định của người dùng (qua câu hỏi lựa chọn)
- Tích hợp vào `Exercise` (không tạo loại `Lesson` mới).
- 20 bài chia 5 nhóm, độ khó tăng dần **trong từng nhóm**.
- Mỗi bài 5-6 test case (2 sample công khai + 3-4 hidden bắt edge case).

---

## Việc 3 — Thiết kế 20 bài + 92 test case

Viết `BE/src/data/initial-exercises-day14.ts` — 20 bài (input/output, list, loop, function, simulation), mỗi bài có `title`, `description`, `starterCode`, `solutionCode`, `testCases`, `tags`, `prerequisiteSlug` nối thành 1 chuỗi tiến trình 1→20.

Với mỗi bài, tự đặt câu hỏi "học sinh có né được khái niệm cần học mà vẫn ra đúng kết quả không" trước khi chốt test case — ví dụ bài "loại bỏ trùng lặp" cố ý thêm hidden test thứ tự giảm dần để bắt lỗi dùng `list(set(nums))`.

---

## Việc 4 — Kiểm chứng độc lập bằng script, tự bắt 4 lỗi trước khi động vào hệ thống thật

Viết script Python (`verify_day14.py`) tự chạy `solutionCode` qua toàn bộ 92 test case bằng `subprocess`, so sánh output thật với `expectedOutput` — không dựa vào đọc lại bằng mắt.

### 4 lỗi tự phát hiện

| # | Bài | Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|---|---|
| 1 | Trộn 2 danh sách đã sắp xếp | Lỗi runtime khi N=0/M=0 | Code đọc dòng có điều kiện, nhưng test input vẫn có dòng trống → lệch dòng đọc | Luôn đọc đúng số dòng cố định, không đọc có điều kiện |
| 2 | Mô phỏng thang máy | Sai kỳ vọng khi 12 lệnh UP liên tiếp | Tính nhẩm sai giới hạn chặn biên | Chạy code thật thay vì tính tay, sửa expected theo kết quả thật |
| 3 | Mô phỏng trận đấu | Sai người thắng | Nhầm thứ tự ai đánh trước thắng | Chạy code thật, sửa expected |
| 4 | Mô phỏng thang máy (case khác) | Sai kỳ vọng | Tương tự #2, có cả DOWN và UP chặn biên trong 1 chuỗi | Chạy code thật |

Sau khi sửa: 92/92 test case pass qua Python thuần — nhưng đây chỉ là kiểm chứng tầng 1 (xem Việc 6).

---

## Việc 5 — Thêm field mới vào schema, phát hiện + sửa 1 lỗi schema có sẵn

Thêm `tags: string[]`, `prerequisiteSlug?: string` vào `Exercise` schema, cập nhật `exercise.service.ts` và FE type.

### Lỗi có sẵn trong hệ thống, tự phát hiện khi seed thật vào MongoDB
`npm run seed:exercises` thật bị chặn: field `expectedOutput` khai `required: true` nhưng 1 bài cần `expectedOutput: ''` hợp lệ (túi rỗng thì không in gì) — Mongoose coi chuỗi rỗng là "thiếu" (truthy-check, không phải presence-check). Thử 4 cách sửa khác (validator function, `checkRequired` override, `required` dạng function) đều không hoạt động đúng như tài liệu khi tự viết script kiểm tra riêng. Cách cuối: bỏ hẳn `required: true` khỏi field này.

---

## Việc 6 — Chạy qua đúng judge pipeline thật, phát hiện lỗi hạ tầng CRLF/LF có sẵn

Không dừng ở script Python thuần (Việc 4) — khởi động thật NestJS backend, gọi đúng API `POST /exercises/:slug/submit` (hàng đợi judge thật) cho cả 20 bài, poll qua `GET /exercises/submissions/:id`.

### Phát hiện quan trọng nhất của ngày 14
Lần chạy đầu qua API thật: 6/20 bài bị `WA` dù đã pass 100% ở Việc 4. `actualOutput` có `\r\n` (CRLF) trong khi `expectedOutput` chỉ có `\n` (LF) — judge chạy Python trực tiếp trên Windows host nên `print()` sinh dòng mới kiểu Windows. Đây là **lỗi hạ tầng có sẵn**, ảnh hưởng mọi bài có output nhiều dòng trong toàn Code Playground, chỉ chưa lộ ra vì 10 bài mẫu cũ hầu hết có 1 dòng output.

### Cách sửa
Vá ở `judge-queue.service.ts`: chuẩn hóa `\r\n` → `\n` cho cả `actualOutput` và `expectedOutput` trước khi so sánh.

### Kiểm chứng cuối cùng
Chạy lại 20 bài qua API thật lần 2: 20/20 `AC`, 92/92 test case pass. Submit thêm 1 bản giải cố ý sai (bug off-by-one bài "Số hoàn thiện") để xác nhận hidden test bắt được đúng lỗi phổ biến — kết quả `WA 1/5` như kỳ vọng.

---

## Việc 7 — Tài liệu bàn giao

- **Editorials** (`docs/day14/editorials.md`): ý tưởng giải, edge case, lỗi phổ biến cho từng bài trong 20 bài.
- **Teacher Guide** (`docs/day14/teacher-guide.md`): mục tiêu sư phạm theo 5 nhóm, rubric, bản đồ tiến trình 20 bài.

---

## Việc 8 — Sửa bug FE: 20 bài mới bị ẩn khỏi Code Playground

### Prompt gốc của người dùng
> "run len cho toi test cái" — sau đó: "không thấy"

### Nguyên nhân (bug có sẵn trong FE, không do ngày 14 tạo ra)
`combinedExercises` có logic: nếu có ít nhất 1 bài "Teacher Authoring" thì bỏ hoàn toàn danh sách từ Exercise API. Vì hệ thống đã có sẵn 10 bài Teacher Authoring trùng, toàn bộ 20 bài day14 (chỉ nằm trong `Exercise`) bị ẩn khỏi dropdown.

### Đã sửa
Gộp cả 2 nguồn vào `combinedExercises` bằng `Map` theo `slug` (bài giáo viên đè lên bài hệ thống nếu trùng) thay vì để 1 nguồn thay thế hoàn toàn nguồn khác.

---

## Việc 9 — Tái cấu trúc theo phản hồi: phân lớp/chủ đề + giảm độ khó cho đúng lứa tuổi

### Prompt gốc của người dùng
> "hay nên làm tách ra đi tại bữa sau làm 9-12 [...] h tách lộ trình kiểu như 3-5 chung 1 chủ đề nhưng chia cấp độ làm tương tự lần lượt á, như hackerank với leetcode" — làm rõ thêm: "kiểu chủ đề cho 3-5 tìm đường cho robot về nhà á gồm 10 câu, sau này thêm chủ đề mới [...] mỗi cấp độ lại phân game, nên làm kỹ 1 xíu"

### Quyết định của người dùng (qua câu hỏi lựa chọn)
- 1 collection duy nhất, thêm `gradeBand` + `topic` (mỗi khối lớp chứa nhiều topic song song, mỗi topic tự có tiến trình riêng) — không tách nhiều collection theo lớp.
- 20 bài ngày 14 giữ nguyên 1 gói (`topic: 'python-fundamentals'`), không tách 5 game riêng ngay — nhưng sửa lại độ khó cho đúng lứa tuổi.
- Xác nhận 4 bài HARD (xoắn ốc ma trận, Fibonacci memo, trộn list two-pointer, trận đấu turn-based) vượt tầm lớp 6-9, thay 3 bài đầu bằng bài dễ hơn.

### Đã làm
- Thêm `gradeBand?: string`, `topic?: string`, `orderInTopic?: number` vào `Exercise` schema.
- Thay 3 bài HARD: "Xoắn ốc lưới vuông" → "Kiểm tra ma trận đối xứng"; "Fibonacci memoization" → "Đệ quy đếm số lần xuất hiện trong danh sách"; "Trộn 2 danh sách" bỏ yêu cầu two-pointer, chỉ cần `sorted(a+b)`. Bài Simulation cuối giữ nguyên logic, viết lại mô tả đơn giản hơn.
- Gán `gradeBand: '6-9'`, `topic: 'python-fundamentals'`, `orderInTopic: 1..20` bằng script.
- Cập nhật `exercise.service.ts`, FE type, `docs/day14/*.md`.

### Kiểm chứng độc lập
Chạy lại cả 2 tầng cho toàn bộ 20 bài (kể cả 17 bài không đổi): (1) script Python thuần — 93/93 pass; (2) qua đúng judge pipeline thật — 20/20 AC.

---

## Việc 10 — Giao diện danh sách bài kiểu HackerRank + khóa tuần tự + gợi ý 3 cấp

### Prompt gốc của người dùng
> "oke kiểu giao diện làm kiểu lộ trình hackerank á, xong bài này mới được chuyển qua bài sau với làm gợi ý 3 cấp độ luôn"

### Quyết định của người dùng (qua câu hỏi lựa chọn)
- Giao diện progression: danh sách dạng list (giống tab "Problems" HackerRank).
- Khóa tuần tự: phải nộp đúng (AC) bài trước mới mở bài kế, lưu localStorage — đúng quy tắc đã dùng ở Block Puzzle ngày 13.
- Nội dung gợi ý 3 cấp: Claude soạn sẵn cho cả 20 bài (Tầng 1 Khái niệm, Tầng 2 Chiến lược, Tầng 3 = `solutionCode`).

### Đã làm
- Thêm field `hints?: LessonHints` vào `Exercise` schema, tái dùng class có sẵn từ `lesson.schema.ts`.
- Soạn 3 cấp gợi ý cho 20 bài, dùng script chèn vào đúng vị trí trong file TS (tránh sửa tay 20 lần dễ gõ sai cú pháp).
- FE: state `completedSlugs` (localStorage), `markCompleted(slug)` khi Submit trả `AC`; `isExerciseUnlocked(idx)` chỉ khóa khi đang xem đúng 1 topic cụ thể; danh sách bài dạng modal có icon trạng thái (đã xong/đang mở/còn khóa); truyền `exercise?.hints` vào `HintPanel` qua prop có sẵn.

### Kiểm chứng độc lập
So khớp script: `hint3` của cả 20 bài bằng đúng 100% `solutionCode` thật. Chạy lại toàn bộ pipeline: TypeScript compile sạch, script Python 93/93 pass, judge pipeline thật 20/20 AC, API trả đúng field mới.

---

## Việc 11 — Đổi flow điều hướng: box chọn Lớp → grid chọn Bài → mới mở Code Editor

### Prompt gốc của người dùng
> "kiểu muốn vào Code Playground chia thành từng box r mới mở code editor theo từng box chứ k mở code eđitor sẵn á"

### Quyết định của người dùng (qua câu hỏi lựa chọn)
3 màn hình tuần tự: Box chọn Lớp (màn 1) → Grid thẻ chọn Bài (màn 2) → Code Editor (màn 3, chỉ mở khi bấm 1 thẻ bài cụ thể).

### Đã làm
Thêm state điều hướng `view: 'grade' | 'exercises' | 'editor'`, bỏ hành vi tự chọn bài đầu tiên khi vào trang. Viết lại JSX theo 3 nhánh render, xóa Modal "Danh sách bài" cũ (màn 2 thay thế vai trò đó bằng grid). Hàm `openExercise(slug)` gộp logic kiểm tra đăng nhập + chuyển `view('editor')` vào 1 chỗ.

### Kiểm chứng
`npx tsc --noEmit` sạch, `vite build` thành công — vì đây là thay đổi cấu trúc lớn (xóa hẳn 1 nhánh JSX, viết 3 nhánh mới), rủi ro cao nhất là tham chiếu biến/state đã xóa mà quên dọn.

---

## Việc 12 — Sửa bug khóa tuần tự, chuẩn hóa WA/TLE/RE/CE/AC, đồng bộ icon (Batch 1), focus-trap, xóa Responsive Guide

### Prompt gốc của người dùng
> "chưa ràng buộc từng bước kìa, hiện tại ấn vào bài nào cũng được hết, thứ 2 làm kỹ xác định WA/TLE/RE/CE/AC. vào cho người ta thấy chuyên nghiệp và bổ sung kiến thức về các lỗi, thứ 2 toàn bộ web bị lạm dụng icon ticker khác nhau nên nhìn rất là AI, nên đồng bộ Icon, chuyên nghiệp mỗi cấp độ vd 3-5 thì tiểu học nên cần màu sắc 1 tí, thứ 3 là tester vừa bảo khi test phím (không chuột thì nó nhảy button ko theo trình tự), thứ 4 xóa cái 📸 Hướng dẫn chụp ảnh Responsive (v0.1) đi"

4 vấn đề riêng biệt trong 1 lượt. Với mỗi điểm mơ hồ về phạm vi, dùng AskUserQuestion để người dùng tự chọn thay vì tự đoán.

### 1. Bug khóa tuần tự không hoạt động
**Vị trí (người dùng xác nhận):** Lớp 6-9, chủ đề Python Fundamentals.

**Nguyên nhân:** `isSequentialUnlockActive = selectedTopic !== 'all'`. Dropdown chủ đề chỉ render khi có >1 topic — lớp 6-9 chỉ có 1 topic nên dropdown không hiện, `selectedTopic` mãi là `'all'`, khóa tuần tự luôn tắt.

**Đã sửa:**
```ts
const isSequentialUnlockActive =
  selectedGradeBand !== null && (selectedTopic !== 'all' || availableTopics.length === 1);
```

**Kiểm chứng:** `curl http://localhost:3000/api/exercises` xác nhận lớp 6-9 có đúng 20 bài, cùng 1 topic — đúng điều kiện bản sửa nhắm tới. Build lại sạch.

### 2. Chuẩn hóa trạng thái chấm bài WA/TLE/RE/CE/AC
**Lựa chọn người dùng:** "Thêm giải thích rõ từng loại lỗi + màu/badge chuẩn".

**Đã làm:** `TestResultsPanel.tsx`/`OutputPanel.tsx` — thêm field `explanation` cho từng trạng thái, icon `lucide-react` riêng, màu badge chuẩn theo tone (emerald=AC, amber=WA/TLE, red=RE/CE/FAILED, slate=QUEUED/RUNNING).

### 3. Đồng bộ icon, thêm màu theo cấp lớp (Batch 1)
**Lựa chọn người dùng:** phạm vi "toàn bộ web" (không chỉ Code Playground); thư viện `lucide-react`; triển khai theo đợt — Header + Code Playground trước.

**Đã làm:** dùng agent Explore rà soát emoji toàn FE trước khi hỏi lựa chọn. Cài `lucide-react`. Sửa `Header.tsx`, `CodePlaygroundPage.tsx` (thêm `GRADE_BAND_GRADIENT` — 3-5 cam-hồng ấm, 6-9 indigo-cyan, 9-12 slate tối), `TestResultsPanel.tsx`, `OutputPanel.tsx`, `HintPanel.tsx`.

**Kiểm chứng:** `tsc --noEmit` + `vite build` sạch (lưu ý `tsc` không bắt được 1 lỗi JSX thiếu dấu `>` phát sinh sau, chỉ `vite build` bắt được).

### 4. Bug accessibility: Tab bàn phím nhảy lộn xộn qua modal
**Chẩn đoán:** không phải do `tabIndex` sai, mà do toàn bộ 6 modal chưa có focus-trap.

**Lựa chọn người dùng:** vị trí "toàn web nói chung"; sửa cả 6 modal ngay.

**Đã làm:** viết hook `useFocusTrap(active, onClose)` (`FE/src/hooks/useFocusTrap.ts`), áp dụng cho `ContestRulesModal.tsx`, `BlockPuzzlePage.tsx`, `TeacherContestAuthoring.tsx`, `ContestListPage.tsx`, `TeacherAuthoringPage.tsx`, `QuizTakingPage.tsx`.

### 5. Xóa "📸 Hướng dẫn chụp ảnh Responsive"
Xóa hẳn `ResponsiveGuideModal.tsx` và toàn bộ wiring ở `Header.tsx`/`App.tsx`.

**Kiểm chứng tổng thể:** `tsc --noEmit` + `vite build` sạch sau mỗi bước; khởi động lại BE/FE, xác nhận API vẫn trả đúng data.

---

## Việc 13 — Đồng bộ icon Batch 2 qua nhiều agent song song + khắc phục sự cố git stash

### Bối cảnh
Batch 2 (phần icon còn lại: BlockPuzzlePage, các trang Contest, TeacherAuthoringPage, TeacherContestAuthoring, Quiz/Course/Login/Register/Footer...) có khối lượng lớn — dùng 1 agent điều phối, tự tách thành 4 sub-agent chạy song song, mỗi agent phụ trách 1-2 file.

### Sự cố phát sinh và cách phát hiện
Một sub-agent chạy `git stash` giữa lúc các agent khác đang sửa file trên đĩa — lệnh này gom toàn bộ thay đổi chưa commit của cả phiên (không riêng phần việc của nó) vào 1 stash. Agent đó chỉ tự khôi phục đúng 2 file mình phụ trách, phần còn lại (khoảng 25 file, bao gồm AI_WORKLOG.md, Header.tsx, việc xóa ResponsiveGuideModal, CodePlaygroundPage.tsx...) bị kẹt trong stash, không còn trên working tree — phát hiện qua chính người dùng báo "sao giờ ít file/web như ban đầu vậy".

### Đã sửa
- Đối chiếu từng file trong stash với file hiện có trên đĩa: các file đã bị 4 sub-agent Batch 2 viết lại (mới hơn, đã qua kiểm chứng riêng) giữ nguyên bản trên đĩa; toàn bộ file còn lại phục hồi từ stash bằng `git checkout stash@{0} -- <file>` (làm từng file một, vì chạy gộp nhiều đường dẫn cùng lúc bị dừng giữa chừng do 1 đường dẫn không hợp lệ, khiến tưởng đã phục hồi nhưng thực ra chưa chạy gì).
- Phát hiện thêm: 2 trong số 6 modal (`BlockPuzzlePage.tsx`, `TeacherAuthoringPage.tsx`) bị mất phần `useFocusTrap` đã làm ở Việc 12, vì bị 1 sub-agent viết lại từ bản gốc (sau khi bị stash cuốn mất) mà không biết đến fix đó — thêm lại `useFocusTrap` cho cả 2 file.
- Xóa lại `ResponsiveGuideModal.tsx` (bị hồi sinh do stash).
- Drop stash sau khi xác nhận mọi nội dung đã có đầy đủ trên working tree.

### Kiểm chứng
`npx tsc --noEmit` sạch; `npx vite build` sạch (2011 module) sau khi phục hồi; grep xác nhận cả 6 modal đều có `useFocusTrap`; `git status` khớp đúng danh sách file đã thay đổi trong toàn phiên.

---

## Đánh giá độ tin cậy của AI trong buổi làm việc

Phần thiết kế nội dung ban đầu (đề bài, starter code, solution code) đúng phần lớn ngay từ đầu vì là bài toán lập trình cơ bản, suy luận logic đáng tin cậy.

Nhưng có nhiều lớp lỗi chỉ phát hiện được nhờ kiểm chứng độc lập nhiều tầng, không phải chỉ đọc lại code:
1. **Lỗi thiết kế test/tính tay** (Việc 4) — 4 lỗi chỉ lộ ra khi chạy script Python thật so khớp từng test case.
2. **Lỗi hạ tầng ẩn** (Việc 6) — lỗi CRLF/LF không thể phát hiện nếu chỉ kiểm chứng bằng Python thuần trên máy cá nhân, vì lỗi nằm ở sự khác biệt giữa môi trường local và judge pipeline thật. Đây là lỗi có sẵn trong hệ thống, chỉ bị 20 bài mới "phơi bày" vì là bộ đầu tiên có nhiều output nhiều dòng.
3. **Sự cố vận hành khi chạy nhiều agent song song** (Việc 13) — thao tác `git stash` của 1 agent ảnh hưởng toàn bộ working tree dùng chung bởi các agent khác đang chạy đồng thời; không phải lỗi logic code mà là rủi ro khi song song hóa các tác vụ ghi file/git trên cùng 1 thư mục làm việc. Phát hiện qua báo cáo trực tiếp của người dùng, không phải tự phát hiện trước.

Bài học rút ra: kiểm chứng "đủ" cho loại công việc này cần ít nhất 2 tầng — (1) chạy logic thuần xác nhận thuật toán đúng, và (2) chạy qua đúng pipeline sản xuất thật để xác nhận không có sai khác hạ tầng. Riêng với việc chạy nhiều agent song song trên cùng 1 working tree: cần tránh để agent tự ý chạy các lệnh git ảnh hưởng toàn bộ trạng thái chung (như `stash`, `reset`, `checkout .`) khi biết có tác vụ khác đang chạy đồng thời, và luôn đối chiếu `git status`/`git stash list` ngay khi có dấu hiệu bất thường (số file thay đổi giảm đột ngột) thay vì giả định code vẫn đúng.
