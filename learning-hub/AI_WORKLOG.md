# AI Work Log Ngày 21: Bộ lab Tester trên nền tảng

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 30 tháng 9 năm 2026 |
| Nhánh | feature/learning-hub-day21 |
| Công cụ, model | Claude Code, mô hình Claude Sonnet 5.5, không sử dụng subagent trong ngày |
| Phạm vi quyền | Đọc và ghi trong thư mục learning-hub; chỉ đọc thư mục Test/Day14_Bo lab tester thuc te của Tester Trần Quốc Nguyên (TTS 03) |
| Dữ liệu nhạy cảm | Không có sự cố nào trong ngày |

## Mục lục các việc trong ngày

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Tạo nhánh feature/learning-hub-day21 từ main đã cập nhật | Đạt |
| 2 | Tạo CLAUDE.md cho learning-hub theo bộ nguyên tắc andrej-karpathy-skills | Đạt |
| 3 | Khảo sát bộ lab Day 14 của Tester Nguyên, chốt 10 bài, rubric và schema | Đạt |
| 4 | Xây dựng Backend Tester Lab: schema, upload artifact, rubric engine, API | Đạt |
| 5 | Xây dựng Frontend: danh sách lab, chi tiết lab kéo thả nộp bài và bảng rubric | Đạt |
| 6 | Chuyển seed sang tự nạp khi khởi động, thêm menu mobile, modal chấm rubric, khởi chạy dự án | Đạt |
| 7 | Rà soát chéo bảo mật, phân quyền, toàn vẹn dữ liệu, dọn lỗi TypeScript và chạy hồi quy | Đạt |
| 8 | Viết tài liệu kỹ thuật Tester Lab và cập nhật nhật ký | Đạt |

---

## Việc 1: Tạo nhánh feature/learning-hub-day21 từ main đã cập nhật

> "tạo hub day 21 và kéo main về (làm xong ko tự ý làm gì hết chờ ra lệnh)
> tạo branch  hub day 21 và kéo main về (làm xong ko tự ý làm gì hết chờ ra lệnh)"

### Điều tôi hiểu trước khi gọi AI

Chỉ thực hiện đúng thao tác Git được yêu cầu, không tự ý bắt đầu bất kỳ công việc nào khác cho tới khi có đề bài cụ thể.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không tạo file nào. Lấy về nhánh main mới, chuyển sang main và cập nhật kiểu fast-forward từ `f783a07` lên `8956b7e` (6 commit mới, gồm toàn bộ phần Day 20 đã hợp nhất), sau đó tạo nhánh feature/learning-hub-day21 từ đó.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: yêu cầu ghi hai lần cùng một nội dung vẫn chỉ là một thao tác, không cần hỏi lại.

---

## Việc 2: Tạo CLAUDE.md cho learning-hub theo bộ nguyên tắc andrej-karpathy-skills

> "làm claude.md vào learning hub theo https://github.com/multica-ai/andrej-karpathy-skills.git"

### Điều tôi hiểu trước khi gọi AI

Repository nguồn có sẵn một tệp CLAUDE.md, nên việc cần làm là lấy đúng bản đó đặt vào learning-hub chứ không tự diễn giải lại nội dung.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tải repository về thư mục tạm, sao chép nguyên văn `CLAUDE.md` vào `learning-hub/CLAUDE.md` (65 dòng), không chỉnh sửa. Tệp gồm bốn nguyên tắc: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution. Các nguyên tắc này được dùng làm ràng buộc cho toàn bộ các việc còn lại trong ngày.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: nguyên tắc Surgical Changes có ảnh hưởng trực tiếp tới việc rà soát ở Việc 7, khi phát hiện lỗi ở module cũ chỉ được vá đúng dòng liên quan và các vấn đề còn lại phải báo cáo chứ không tự sửa.

---

## Việc 3: Khảo sát bộ lab Day 14 của Tester Nguyên, chốt 10 bài, rubric và schema

> "Chúng ta đang ở nhánh `feature/learning-hub-day21` và thực hiện nhiệm vụ Day 21: "Bộ lab Tester trên nền tảng".
>
> Mục tiêu chính: Xây dựng phân hệ Tester Lab cho phép học viên xem đề, tải tài liệu/fixture, nộp bài artifact (file CSV/Excel/JSON/PDF) và chấm điểm theo Rubric bán tự động.
>
> Yêu cầu thực hiện theo đúng triết lý CLAUDE.md (tối giản, chính xác, không viết code thừa):
>
> 1. Khảo sát dữ liệu nguồn:
> - Đọc thư mục `day14` của Trần Quốc Nguyên (folder test) (chứa 12 bài LAB-01 đến LAB-12, TASK.md, template, rubric).
> - Chọn lọc 10 bài lab tiêu biểu bao quát 3 nhóm kỹ năng: Test Case Design, Bug Report, API Testing.
>
> 2. Backend (Tạo module mới trong `learning-hub/BE/src/modules-api/tester-labs/`):
> - Schema Mongoose:
>   + `TesterLab`: labCode, title, description, category, environmentUrl, fixtureUrls, templateArtifact, rubricCriteria (tiêu chí, thang điểm, severity/quality weights).
>   + `TesterLabSubmission`: labId, userId, artifactUrl, fileType, fileSize, autoCheckResults, rubricGrades, reviewerNotes, status (SUBMITTED/REVIEWED).
> - Middleware/Interceptor kiểm tra tải tệp (Artifact Upload):
>   + Kiểm tra loại tệp cho phép: .csv, .xlsx, .json, .pdf.
>   + Giới hạn kích thước tối đa 5MB.
> - Rubric Evaluation Engine:
>   + Check tự động (cứng): đúng định dạng file, kiểm tra các cột bắt buộc đối với CSV/JSON.
>   + Hỗ trợ API cho giảng viên/peer nhập điểm rubric theo barem (phân biệt rõ severity và quality).
> - Seed Data:
>   + Viết một script seed hoặc nạp trực tiếp 10 bài lab từ thư mục `day14` vào MongoDB.
>
> 3. Frontend:
> - Tạo trang `TesterLabListPage.tsx`: Xem danh sách 10 bài lab phân loại theo nhóm.
> - Tạo trang `TesterLabDetailPage.tsx`: Cột trái xem đề/tải template/link demo; cột phải là form kéo thả file artifact nộp bài kèm bảng tiêu chí Rubric minh bạch.
>
> 4. Kiểm thử:
> - Viết unit test cho service upload artifact (thử upload file hợp lệ, file sai MIME-type, file quá dung lượng).
> - Viết unit test cho Rubric Evaluation Engine.
> - Đảm bảo `npx tsc --noEmit` và `npx jest` đều pass.
>
> Lưu ý: Chưa cập nhật AI_WORKLOG và tài liệu lúc này, hãy tập trung hoàn thành tính năng và chạy pass test trước.
> Bắt đầu bằng việc kiểm tra thư mục `day14` và đưa ra đề xuất danh sách 10 bài cùng cấu trúc schema ngắn gọn để xác nhận."

### Điều tôi hiểu trước khi gọi AI

Thư mục Day 14 là đầu vào do Tester Nguyên bàn giao và là nguồn sự thật cho nội dung đề. Phía nền tảng chỉ chuẩn hóa cấu trúc để hiển thị và chấm điểm, không sửa nội dung đề. Trước khi viết code cần thống nhất với Tester bộ bài nào đưa lên, tiêu chí đánh giá nào chuyển thành rubric, và cột nào của template dùng để kiểm tra tự động.

### Context, tài liệu, file, constraint đã cung cấp

Thư mục `Test/Day14_Bo lab tester thuc te` của Tester Nguyên: mười hai thư mục `LAB-01` đến `LAB-12` (mỗi thư mục có `TASK.md` và `template.csv`), `instructor/LAB-xx_GUIDE.md` chứa rubric 10 điểm, `fixtures/buggy` và `fixtures/clean`, thư mục `postman`. Ràng buộc: bốn định dạng nhận là .csv, .xlsx, .json, .pdf, tối đa 5MB, và tuân thủ CLAUDE.md.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Vòng khảo sát rút ra ba điều từ tài liệu của Tester: artifact của LAB-10 và LAB-11 là `login.spec.ts` và `booking.spec.ts` (mã Playwright), không thuộc bốn định dạng nền tảng nhận; LAB-12 có hai artifact là `regression.spec.ts` và `Regression_Summary.csv`; cả 12 bài dùng chung một rubric 10 điểm gồm 5 tiêu chí, mỗi tiêu chí 2 điểm. Đề xuất gửi lại gồm danh sách 10 bài, cấu trúc hai schema và ba câu hỏi cần chốt. Phản hồi thống nhất, do người dùng chốt sau khi rà đề xuất:

> "Tôi đồng ý với đề xuất, chốt 3 điểm như sau:Chốt danh sách 10 bài: Đồng ý bỏ LAB-10 và LAB-11 (do artifact .spec.ts không nằm trong danh mục file văn bản nộp); giữ nguyên LAB-12 lấy phần artifact Regression_Summary.csv cùng 9 bài còn lại đúng như bảng đề xuất.Chốt Rubric: Đồng ý giữ nguyên thang điểm gốc (5 tiêu chí $\times$ 2 điểm = 10 điểm). Đánh dấu rõ trường kind: 'severity' | 'quality' cho từng tiêu chí để thỏa mãn trực tiếp điều kiện nghiệm thu:Các tiêu chí đánh giá mức độ nghiêm trọng, phân loại bug, kết quả pass/fail: gắn kind: 'severity'.Các tiêu chí đánh giá quy chuẩn trình bày, độ rõ ràng của các bước tái hiện, độ bao phủ: gắn kind: 'quality'.Chốt lưu trữ & Auto-check: Đồng ý lưu tệp cục bộ tại thư mục uploads/tester-labs/ (nhớ bổ sung thư mục này vào .gitignore để không commit file bài nộp lên repository). Cơ chế auto-check cứng (MIME-type, size $\le 5\text{MB}$, check header requiredColumns) chỉ trả về pass/fail và cảnh báo, điểm số do reviewer chấm.Bạn bắt đầu triển khai code Backend, Frontend, nạp seed data và viết Unit test theo kế hoạch. Xong các bước kỹ thuật hãy chạy test toàn bộ và báo lại kết quả."

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Việc này chưa tạo file. Các quyết định chuẩn hóa cấu trúc đề, schema và tiêu chí được thống nhất với phía Tester như sau:

| Nội dung | Lấy từ bàn giao của Tester Nguyên | Chuẩn hóa phía nền tảng |
|---|---|---|
| 10 bài | LAB-01 đến LAB-09 và LAB-12 | Bỏ LAB-10 và LAB-11 vì artifact là `.spec.ts`; LAB-12 chỉ nhận phần `Regression_Summary.csv` |
| Nhóm kỹ năng | Tên và mục tiêu từng bài trong `TASK.md` | BUG_REPORT: LAB-01, 02, 09; TEST_CASE_DESIGN: LAB-03, 07, 08, 12; API_TESTING: LAB-04, 05, 06 |
| Rubric | 5 tiêu chí x 2 điểm trong `LAB-xx_GUIDE.md` | Giữ nguyên thang điểm; thêm `kind`: tiêu chí "Phân loại severity/result hợp lý" là `severity`, 4 tiêu chí còn lại là `quality` |
| Cột bắt buộc | Dòng tiêu đề `template.csv` | Dùng nguyên văn làm `requiredColumns`; LAB-04 dùng khóa gốc `info` và `item` của Postman collection |
| Tài liệu học viên | `template.csv` và `fixtures/buggy/LAB-xx.json` | Sao chép vào `BE/assets/tester-labs/templates` và `fixtures`; không phát `manifest.json` và tài liệu instructor |

Trường `weight` trong yêu cầu ban đầu bị bỏ vì rubric gốc chia đều 2 điểm mỗi tiêu chí; việc phân biệt severity và quality do trường `kind` đảm nhiệm.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: đọc kỹ trường "Artifact phải nộp" của từng bài giúp phát hiện sớm hai bài không tương thích định dạng trước khi viết code, thay vì phát hiện ở giai đoạn kiểm thử. Điều chưa chắc: các link demo trong `TASK.md` là môi trường dùng chung của Tester và chưa được kiểm tra còn truy cập được, trạng thái gốc của mọi bài trong tài liệu Tester vẫn là `NEEDS PILOT`.

---

## Việc 4: Xây dựng Backend Tester Lab: schema, upload artifact, rubric engine, API

> Cùng chỉ dẫn với Việc 3 và phản hồi chốt ba điểm ở trên, phần này ứng với hạng mục Backend, Seed Data và Kiểm thử.

### Điều tôi hiểu trước khi gọi AI

Auto-check chỉ được phép trả về pass/fail và cảnh báo, điểm số hoàn toàn do người chấm nhập. Cần tách logic thuần (kiểm tra tệp, chấm rubric) khỏi phần truy vấn Mongoose để kiểm thử không cần cơ sở dữ liệu.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo module `modules-api/tester-labs` gồm: `artifact-upload.service.ts` (90 dòng) kiểm tra đuôi, MIME-type, 5MB và ghi tệp UUID vào `uploads/tester-labs/`; `rubric-evaluation.engine.ts` (163 dòng) gồm `runAutoChecks` và `evaluateRubric`; `tester-labs.service.ts` (180 dòng); `tester-labs.controller.ts` (95 dòng) với 8 route; `tester-labs.module.ts`. Hai schema đặt trong `modules-system/database/schemas` theo quy ước hiện có và đăng ký vào `DatabaseModule`, module đăng ký vào `AppModule`. Dữ liệu 10 bài nằm trong `src/data/initial-tester-labs.ts` (165 dòng); 10 template CSV và 10 fixture JSON sao chép từ Day 14 vào `BE/assets/tester-labs` (20 tệp). Thêm `learning-hub/BE/uploads/` vào `.gitignore`. Bản đầu có script `seed-tester-labs.ts` chạy tay, sau đó bị thay ở Việc 6.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết hai tệp kiểm thử ở lượt đầu: service upload (hợp lệ, sai MIME, quá 5MB, sai đuôi, thiếu file) và rubric engine (cột bắt buộc CSV/JSON, chữ ký PDF/XLSX, tổng hợp severity/quality, từ chối điểm ngoài khoảng, tiêu chí lạ, trùng, thiếu). Một kiểm thử phụ đảm bảo header của mọi template seed đều qua auto-check của chính lab đó. Lệnh chạy:

```
cd learning-hub/BE
npx tsc --noEmit
npx jest src/modules-api/tester-labs
```

Kết quả lượt đầu: `tsc` sạch, 22 kiểm thử của tester-labs đạt; chạy toàn bộ `npx jest` được 33 suite, 330 kiểm thử đạt.

**Lỗi AI mắc phải, phát hiện khi chạy lệnh:** lệnh tạo nhiều file cùng lúc bằng một chuỗi shell dài bị lỗi cú pháp `unexpected EOF` ở hai lần, không file nào được ghi. Phát hiện ngay từ mã thoát của lệnh, sau đó chuyển sang tạo từng file riêng.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi nội dung file chứa dấu nháy và ký tự Unicode dài, ghi file bằng công cụ ghi file riêng đáng tin cậy hơn lồng nhiều heredoc trong một lệnh shell. Điều chưa chắc: danh sách MIME-type chấp nhận cho CSV (`text/csv`, `application/vnd.ms-excel`, `text/plain`) dựa trên hành vi phổ biến của trình duyệt trên Windows, chưa thử với mọi trình duyệt.

---

## Việc 5: Xây dựng Frontend: danh sách lab, chi tiết lab kéo thả nộp bài và bảng rubric

> Cùng chỉ dẫn với Việc 3, phần này ứng với hạng mục Frontend.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo `TesterLabListPage.tsx` (96 dòng) chia lab theo ba nhóm; `TesterLabDetailPage.tsx` (283 dòng) với cột trái là đề, link môi trường demo, nút tải template và fixture, cột phải là khung kéo thả nộp bài, bảng rubric có nhãn Severity/Quality và danh sách "Bài nộp của tôi" kèm kết quả auto-check; `types/testerLab.ts` (49 dòng); `axios/testerLabApi.ts` (65 dòng). Đăng ký hai route `/tester-labs` và `/tester-labs/:labCode` trong `App.tsx`, thêm tab "Tester Lab" vào menu desktop cho cả học viên và giảng viên trong `Header.tsx`. Tải template và fixture đi qua axios với Bearer token rồi lưu bằng blob, vì đường dẫn tải yêu cầu đăng nhập nên không thể dùng thẻ liên kết thường.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Chạy `npx tsc --noEmit -p tsconfig.app.json` trong thư mục FE, không có lỗi thuộc các file mới hoặc file đã sửa. Lệnh này vẫn báo 5 lỗi có sẵn ở `ContestExamWorkspace`, `TeacherContestAuthoring`, `RegisterPage` và `TeacherAuthoringPage`, được xử lý ở Việc 7.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: lệnh `npx tsc --noEmit` chạy ở thư mục gốc FE không kiểm tra gì vì `tsconfig.json` chỉ chứa `references`; phải chỉ đúng `-p tsconfig.app.json` mới có kết quả thật.

---

## Việc 6: Chuyển seed sang tự nạp khi khởi động, thêm menu mobile, modal chấm rubric, khởi chạy dự án

> "Tôi không muốn phải gõ lệnh seed thủ công vì khách hàng sau này không biết code. Hãy tối ưu và khởi chạy dự án để tôi vào test thực tế theo các yêu cầu sau:
>
> Tự động nạp dữ liệu (Auto-seed khi khởi động):
>
> Chuyển logic seed 10 bài lab vào lifecycle khởi động Backend (ví dụ onModuleInit trong service của tester-labs).
>
> Khi server bật, tự kiểm tra nếu collection chưa có dữ liệu thì tự động nạp 10 bài lab mặc định một lần duy nhất (đảm bảo idempotent, không ghi đè mất bài nộp khi khởi động lại).
>
> Hoàn thiện 2 chi tiết UI còn thiếu:
>
> Thêm tab "Tester Lab" vào menu Mobile trên Header/Navbar cho đồng bộ với Desktop.
>
> Thêm một form/modal chấm điểm Rubric đơn giản trên FE (cho phép reviewer/giảng viên/peer nhập điểm từ 0 đến 2 cho từng tiêu chí và lưu nhận xét) để bài chuyển sang trạng thái REVIEWED.
>
> Khởi động và hướng dẫn test:
>
> Bật cả Backend dev server và Frontend dev server.
>
> Cung cấp đường dẫn truy cập trang Tester Lab trên trình duyệt.
>
> Cung cấp tài khoản mẫu có sẵn trong DB (student và reviewer) kèm 3 bước test nhanh: Tải template -> Kéo thả nộp file CSV hợp lệ -> Thử chấm điểm Rubric.
>
> Làm xong hãy báo trạng thái để tôi vào trình duyệt kiểm tra."

### Điều tôi hiểu trước khi gọi AI

Khách hàng sau này không chạy lệnh, nên dữ liệu mặc định phải tự có khi backend bật, và việc tự nạp không được phép làm mất bài nộp đã có.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Thêm `onModuleInit` vào `TesterLabsService`, xóa `seed-tester-labs.ts` và mục `seed:tester-labs` trong `package.json`. Thêm tab "Tester Lab" vào menu mobile của cả hai vai trò trong `Header.tsx`. Tạo `TesterLabReviewPanel.tsx` (165 dòng): danh sách bài cần chấm, nút tải bài nộp và modal nhập điểm cho từng tiêu chí (0 đến điểm tối đa, bước 0.5) kèm nhận xét, gọi API chấm điểm và tải lại danh sách. Thêm hai hàm `getReviewable`, `review`, `downloadArtifact` vào `testerLabApi.ts`.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Thêm kiểm thử cho auto-seed, chạy `npx tsc --noEmit` (BE và FE) và `npx jest src/modules-api/tester-labs`: 24 kiểm thử đạt. Khởi động thật `npm run start:dev` (BE) và `npm run dev` (FE), log backend ghi nhận đã nạp 10 lab; đăng nhập bằng hai tài khoản có sẵn `student@gmail.com` và `teacher@gmail.com`, gọi API thật: danh sách trả 10 lab, học viên nộp file CSV hợp lệ và auto-check báo đủ cột, giảng viên chấm và bài chuyển sang `REVIEWED`.

**Lỗi AI mắc phải, phát hiện khi rà lại cơ chế nạp:** bản tự nạp đầu tiên chỉ kiểm tra collection có bản ghi nào chưa rồi mới chèn, nên nếu thiếu một lab thì không bổ sung được. Phát hiện ở Việc 7 và sửa sang upsert theo `labCode`.

Bài nộp thử của tôi (LAB-01, đã chấm) và một tệp trong `BE/uploads/tester-labs` còn nằm lại trong môi trường phát triển vì lệnh dọn dẹp bị hệ thống an toàn chặn; đã báo lại cho người dùng.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: kiểm thử tích hợp bằng cách nộp dữ liệu thật để lại bản ghi trong cơ sở dữ liệu dùng chung, lần sau cần dùng dữ liệu có thể phân biệt để dọn được. Điều chưa chắc: chưa mở trình duyệt để kiểm tra bằng mắt kéo thả và modal, mới xác nhận qua API và kiểm tra kiểu.

---

## Việc 7: Rà soát chéo bảo mật, phân quyền, toàn vẹn dữ liệu, dọn lỗi TypeScript và chạy hồi quy

> "Hãy thực hiện kiểm tra chéo toàn bộ mã nguồn của nhánh hiện tại (feature/learning-hub-day21) kết hợp với các phân hệ đã làm ở các ngày trước (Day 19 AI Generator, Day 20 Recommendation, Day 21 Tester Lab) theo các tiêu chuẩn nghiêm ngặt dưới đây.   Nguyên tắc bất biến: Không được làm vỡ hoặc thay đổi hành vi hoạt động của các tính năng sẵn có (Code Playground, Online Judge, Contest, Quiz, AI Coach, Soạn thảo). Mọi chỉnh sửa phải tối giản, chính xác (surgical changes) và bám sát CLAUDE.md.   1. Bảo mật & Phân quyền (Security & Access Control)Lỗ hổng tải tệp (File Upload Sandbox):Kiểm tra API nộp artifact của Tester Lab (/tester-labs/upload hoặc /submit): Đảm bảo đã chặn hoàn toàn việc bypass đuôi tệp qua kỹ thuật double extension (ví dụ: shell.php.csv, evil.exe.pdf), kiểm tra Magic Bytes thực tế thay vì chỉ tin cậy MIME-type từ client gửi lên.Chặn tuyệt đối nguy cơ Path Traversal (tên file chứa ../ hoặc ký tự đặc biệt) khi ghi tệp vào thư mục uploads/tester-labs/.Kiểm soát quyền (IDOR & RBAC):Đảm bảo học viên không thể xem bài nộp hoặc tải tệp artifact của học viên khác qua việc thay đổi ID trên URL/API.Tách bạch vai trò Reviewer: Phân quyền rõ ràng trên Backend, chỉ TEACHER hoặc ADMIN mới có quyền chấm điểm chính thức. Nếu có tính năng peer-review, phải có cờ cấu hình minh bạch, tuyệt đối không để lộ thông tin nhạy cảm của người nộp.2. Đồng bộ & Toàn vẹn dữ liệu (Data Integrity & Synchronization)Đồng bộ bài tập & Danh mục: Rà soát lại bài toán đồng bộ giữa nơi lưu bài soạn thảo (Lesson) và catalog bài tập thực hành (Exercise/Playground) để không xảy ra tình trạng bài xuất bản ở trang soạn thảo bị mất hút hoặc mồ côi.Auto-seed Idempotency: Kiểm tra cơ chế tự nạp 10 bài Tester Lab trong onModuleInit: Đảm bảo logic kiểm tra tồn tại hoạt động chính xác (dựa trên labCode độc nhất), không tạo bản ghi trùng lặp và không bao giờ ghi đè làm mất lịch sử submissions đã có của người dùng khi restart server.3. Tối ưu UX/UI & Tránh xung đột luồng người dùngLàm rõ Role trên giao diện:Khi người dùng đăng nhập với role STUDENT: Chỉ hiển thị khung nộp bài và khối "Bài nộp của tôi". Ẩn hoàn toàn khối "Bài cần chấm" (hoặc chỉ hiện khi bài đó được hệ thống chủ đích phân công peer-review) để tránh gây hoang mang, hiểu nhầm role.Khắc phục các lỗi mất con trỏ (input focus loss), lỗi hiển thị thông báo thành công giả, hoặc mất trạng thái khi chuyển đổi tab.Dọn dẹp cảnh báo TypeScript: Kiểm tra và xử lý dứt điểm các lỗi type/import còn sót lại trên Frontend để đảm bảo npx tsc sạch sẽ.4. Hiệu năng & Kiểm thử hồi quy (Regression Testing)Kiểm tra rò rỉ bộ nhớ khi đọc/ghi file artifact lớn (dùng Stream thay vì đọc toàn bộ file vào buffer RAM nếu cần).Chạy kiểm tra toàn bộ test suite của hệ thống:Chạy npx tsc --noEmit cho cả BE và FE.Chạy npx jest (yêu cầu toàn bộ các bài test cũ từ Day 1 đến Day 21 đều phải PASS 100%).Đầu ra yêu cầu:Báo cáo danh sách các lỗi hoặc điểm nghẽn bảo mật/UX vừa tìm thấy.Đưa ra phương án vá ngắn gọn cho từng điểm.Tiến hành sửa và xác minh bằng lệnh test thực tế. Tuyệt đối không tự ý xóa bỏ các tính năng đã ổn định."

### Điều tôi hiểu trước khi gọi AI

Rà soát phải dựa trên đọc mã thật của cả module mới lẫn các module cũ liên quan, và mọi chỉnh sửa ở module cũ chỉ được vá đúng dòng lỗi. Các phát hiện ngoài phạm vi phải báo cáo chứ không tự sửa.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Các quyết định kỹ thuật và lý do:

| Vấn đề tìm thấy | Quyết định |
|---|---|
| Mọi user đã đăng nhập xem được danh sách bài của người khác và tải được artifact (IDOR); học viên chấm được điểm | Siết RBAC ở `tester-labs.service.ts`: chỉ chủ bài, TEACHER, ADMIN tải artifact; chỉ TEACHER, ADMIN chấm; peer-review học viên mặc định tắt, bật bằng biến `TESTER_LAB_PEER_REVIEW=true`; khi bật, ẩn `userId`, `artifactUrl`, `reviewerId` của người nộp; không ai tự chấm bài mình |
| Chỉ tin MIME-type và đuôi tệp do client gửi | Thêm `matchesSignature` dùng chung cho upload và auto-check: PDF phải bắt đầu `%PDF`, XLSX bắt đầu `PK\x03\x04`, CSV và JSON không được chứa byte NUL; kiểm dung lượng theo `buffer.length` thực tế |
| Double extension và tên tệp có ký tự đường dẫn | Từ chối tên chứa `/`, `\`, NUL, `..` hoặc đuôi thực thi ở giữa tên (`shell.php.csv`, `evil.exe.pdf`); tên tệp gốc không bao giờ dùng để ghi đĩa, đã dùng UUID từ đầu |
| Tự nạp chỉ kiểm tra collection có bản ghi hay không | Đổi sang `bulkWrite` upsert theo `labCode` với `$setOnInsert`: chỉ chèn lab còn thiếu, không bao giờ ghi đè |
| Phần tử `null` trong `grades` gây lỗi 500 khi chấm | Chuyển thành lỗi 400 |
| `deleteLesson` xóa exercise theo `slug`, có thể xóa nhầm bài AI khi slug bị hậu tố | Vá đúng một lệnh trong `authoring.service.ts`: xóa theo `sourceLessonSlug` khớp lesson bị xóa |
| Học viên thấy khối "Bài cần chấm"; giảng viên thấy khung nộp bài; thiếu thông báo nộp thành công | Trang chi tiết nhận cờ `isStudent`: học viên chỉ thấy khung nộp và "Bài nộp của tôi", giảng viên chỉ thấy khối chấm; khối chấm tự ẩn với học viên khi backend từ chối hoặc không có bài; thêm thông báo thành công chỉ hiện sau khi API trả về thành công |
| 5 lỗi TypeScript có sẵn ở FE | `PartyPopper` import thừa; ép kiểu `type` của `ContestProblem`; thêm `role?` vào `RegisterPayload`; xử lý `content` có thể `undefined`; gán `expectedOutput ?? ''` khi import bài từ ngân hàng đề |

Phát hiện không sửa vì sẽ đổi hành vi sẵn có, đã báo lại: lesson coding đã xuất bản rồi chuyển về nháp vẫn để lại exercise trong Playground; lesson đổi slug để lại exercise mồ côi ở slug cũ. Phần đọc/ghi tệp: multer dùng bộ nhớ, giới hạn cứng 5MB nên tối đa 5MB RAM cho mỗi yêu cầu; tải xuống dùng `res.download` (stream). Không thay đổi phần này. Modal chấm điểm nằm trực tiếp trong component chứ không phải component lồng nhau nên không có lỗi mất con trỏ.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết thêm kiểm thử: upload (double extension, ký tự đường dẫn, magic bytes giả, buffer vượt 5MB dù khai báo nhỏ, không dùng tên gốc để ghi đĩa), service (auto-seed dùng `$setOnInsert`, học viên bị từ chối khi tắt peer-review, không tải được artifact người khác, chủ bài và giảng viên tải được, ẩn trường nhạy cảm khi peer-review, không tự chấm bài mình). Lệnh chạy và kết quả:

```
cd learning-hub/BE
npx tsc --noEmit                              # sạch
npx jest                                      # 34 suite, 349 kiểm thử đạt
cd ../FE
npx tsc --noEmit -p tsconfig.app.json         # sạch
```

Riêng module tester-labs: 3 suite, 41 kiểm thử (upload 20, rubric engine 13, service 8). Kiểm tra trên máy chủ thật đang chạy: học viên gọi danh sách chấm nhận 403, giảng viên nhận 200; chủ bài tải artifact nhận 200; upload `shell.php.csv` và tệp PDF giả có nội dung `MZ` đều nhận 400. Khởi động lại backend nhiều lần: cơ sở dữ liệu vẫn 10 lab và 1 bài nộp, không trùng lặp.

**Lỗi AI mắc phải, phát hiện khi chạy kiểm thử:** khi viết kiểm thử bằng script chỉnh file, các chuỗi thoát như `\u0003`, `\0` bị diễn giải sai, làm regex chứa byte NUL thật và hai kiểm thử thất bại. Phát hiện do một kiểm thử xlsx hợp lệ bị từ chối, đối chiếu từng byte bằng `cat -A` và ghi lại tệp bằng công cụ ghi file. Một kiểm thử cũ mong `fileSize` bằng 100 phải đổi thành độ dài buffer thực, vì kích thước lưu nay lấy từ buffer.

Chưa xác minh trên máy chủ thật: kịch bản học viên B tải bài của học viên A, do thiếu mật khẩu tài khoản học viên thứ hai; chỉ có bằng chứng từ kiểm thử đơn vị.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: bản triển khai đầu tiên của chính tôi có lỗ hổng IDOR và RBAC, cho thấy quyền truy cập cần được thiết kế ngay từ đầu chứ không thêm sau; và nguyên tắc Surgical Changes giúp tách rõ phần được vá (một dòng trong `deleteLesson`) khỏi phần chỉ báo cáo. Điều chưa chắc: cờ peer-review chưa có cơ chế phân công người chấm, hiện là công tắc bật tắt toàn hệ thống.

---

## Việc 8: Viết tài liệu kỹ thuật Tester Lab và cập nhật nhật ký

> "Đọc các file trong `docs/day20/` để lấy chuẩn cấu trúc tài liệu, đồng thời đọc phần Day 20 trong `AI_WORKLOG.md` để lấy đúng văn phong và cấu trúc các bảng biểu.
>
> Sau đó thực hiện 2 việc cho Day 21:
>
> 1. **Tạo tài liệu trong `docs/day21/`:**
> - Cấu trúc thư mục và số lượng file tóm tắt tương tự như `docs/day20/`.
> - Tự trích xuất toàn bộ dữ liệu thực tế từ codebase Day 21 để tổng hợp nội dung.
> - Làm rõ sự phối hợp kỹ thuật với Tester Trần Quốc Nguyên: tiếp nhận bộ lab từ thư mục Day 14, thống nhất bỏ LAB-10/11 (do artifact .spec.ts), giữ lại LAB-12 CSV và tích hợp rubric 5 tiêu chí gốc vào hệ thống.
>
> 2. **Cập nhật `AI_WORKLOG.md`:**
> - Ghi đè/cập nhật phần Day 21 theo đúng định dạng mẫu của Day 20.
> - Trích dẫn nguyên văn các prompt gốc mà tôi đã đưa ra trong phiên làm việc Day 21.
> - Nhấn mạnh sự trao đổi, phối hợp liên vai trò với Tester Nguyên (TTS 03) trong việc chuẩn hóa cấu trúc đề, schema và tiêu chí đánh giá severity/quality.
> - Trình bày rõ các quyết định kỹ thuật của tôi (chuyển auto-seed, siết chặt RBAC/IDOR, chặn magic bytes tệp upload) kèm kết quả chạy test độc lập.
> - Tự động lấy số liệu, diff và danh sách file thay đổi từ repo mà không thêm các mục ngoài lề.
>
> Làm xong báo lại ngắn gọn đường dẫn các file đã cập nhật."

### Điều tôi hiểu trước khi gọi AI

Thư mục `docs/day20/` chỉ có một tệp, nên `docs/day21/` cũng chỉ một tệp. Mọi con số và khẳng định trong tài liệu phải đối chiếu với mã và kết quả chạy thật, không chép từ trí nhớ. Nhật ký Day 21 ghi đè hoàn toàn nội dung Day 20 trong tệp này (bản Day 20 vẫn còn trong lịch sử Git).

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo `learning-hub/docs/day21/tester-lab.md` gồm năm phần theo cấu trúc của tài liệu Day 20: nguồn bộ lab và phối hợp với Tester, mô hình dữ liệu và luồng nghiệp vụ (bảng route), cơ chế kiểm soát và an toàn, hạn chế thiết kế, điểm nghi vấn cần xử lý tiếp. Ghi đè `learning-hub/AI_WORKLOG.md` sang Ngày 21. Số liệu lấy từ `git status`, `git diff --stat` và số dòng thực tế của từng tệp.

Tổng hợp thay đổi trên nhánh, chưa commit:

| Nhóm | Số lượng | Chi tiết |
|---|---|---|
| Tệp sửa (Modified) | 10 | `.gitignore`; `app.module.ts`, `database.module.ts`, `authoring.service.ts`; `App.tsx`, `Header.tsx`, `ContestExamWorkspace.tsx`, `TeacherContestAuthoring.tsx`, `TeacherAuthoringPage.tsx`, `types/auth.ts`; tổng +62 dòng, -5 dòng |
| Tệp Backend mới | 11 mã nguồn + 20 tài nguyên | 8 tệp trong `tester-labs/` (3 tệp kiểm thử), 2 schema, `initial-tester-labs.ts`; 10 template CSV và 10 fixture JSON trong `BE/assets/tester-labs` |
| Tệp Frontend mới | 5 | `TesterLabListPage.tsx`, `TesterLabDetailPage.tsx`, `TesterLabReviewPanel.tsx`, `testerLabApi.ts`, `types/testerLab.ts` |
| Tệp tài liệu | 2 mới, 1 ghi đè | Mới: `learning-hub/CLAUDE.md`, `docs/day21/tester-lab.md`; ghi đè: `AI_WORKLOG.md` |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Không có lệnh kiểm thử tự động cho việc viết tài liệu. Trước khi ghi đã chạy lại `npx jest src/modules-api/tester-labs` để lấy đúng số kiểm thử từng tệp (20, 13, 8), đối chiếu danh sách route với `tester-labs.controller.ts` và danh sách 10 bài với `initial-tester-labs.ts`.

Giới hạn trung thực của phần "phối hợp với Tester Nguyên": các nội dung phối hợp trong tài liệu và nhật ký dựa trên những gì bộ lab Day 14 bàn giao (TASK.md, template, rubric trong hướng dẫn giảng viên, fixture) và quyết định do người dùng chốt trong phiên làm việc. Phiên làm việc không lưu nội dung trao đổi trực tiếp giữa người dùng và Tester Nguyên, nên tôi không ghi lại lời của Tester.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: phần "phối hợp liên vai trò" chỉ nên ghi những gì có bằng chứng trong tệp bàn giao hoặc trong phiên làm việc, không dựng thêm các cuộc trao đổi không có dữ liệu. Điều chưa chắc: nếu người dùng có ghi chép trao đổi với Tester Nguyên ngoài phiên này, nên bổ sung vào Việc 3 để nhật ký phản ánh đủ phần thảo luận.
