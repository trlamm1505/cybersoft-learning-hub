# AI Work Log Ngày 24: Integrity và chống gian lận cơ bản

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 5 tháng 10 năm 2026 |
| Nhánh | feature/learning-hub-day24 |
| Công cụ, model | Claude Code chạy trên Claude Sonnet 5.5 trong cả ngày; không sử dụng subagent |
| Phạm vi quyền | Đọc và ghi trong thư mục learning-hub. Với `Data-AI-Resource` của Thực tập sinh số 1 chỉ đọc; riêng Việc 11, AI chạy thử server Day 21 của Số 1 trong một môi trường Python tạm ở thư mục tạm của hệ thống, không sửa file nào trong `Data-AI-Resource` và đã xoá môi trường đó sau khi thử |
| Dữ liệu nhạy cảm | Có một sự cố nhỏ: ở Việc 8, AI đọc `BE/.env` bằng lệnh lọc chưa kỹ nên mật khẩu ứng dụng Gmail hiện ra trong kết quả lệnh của phiên làm việc. Giá trị này không được ghi vào file nào và không bị commit; cần đổi mật khẩu ứng dụng Gmail. Các lần đọc `.env` sau đó đều che giá trị. Khóa API mẫu của server Số 1 (`cybersoft-student-public-key-101`) là khóa mẫu công khai trong mã nguồn của Số 1. Mọi tài khoản và dữ liệu tạm dùng để kiểm thử động đều bị xoá ngay sau khi chạy |

## Mục lục các việc trong ngày

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Tạo nhánh feature/learning-hub-day24 từ main đã cập nhật | Đạt |
| 2 | Tín hiệu liêm chính v0.1: dòng thời gian, rời màn hình, so khớp mã nguồn, hàng chờ xem xét | Đạt |
| 3 | Viết tóm tắt Day 24 và chạy dự án để kiểm thử thủ công | Đạt |
| 4 | Giải thích vì sao rời tab không thấy phản ứng | Đạt, không sửa file |
| 5 | Làm lại quản lý cuộc thi, phối hợp trắc nghiệm và Code Playground, tích hợp chống gian lận, rà lỗi hai vai trò | Đạt |
| 6 | Tạo docs/day11/tomtat.md từ báo cáo | Đạt |
| 7 | Sáng và tối, responsive, thanh điều hướng có dropdown | Đạt |
| 8 | DA Lab và AI Lab không cần mock thủ công, tự bật Docker, triển khai trọn bộ bằng Docker | Đạt |
| 9 | Dựng môi trường trên máy mới bằng một lệnh | Đạt |
| 10 | Ghi cơ chế liên kết với Số 1 vào docs/day22/tomtat.md | Đạt |
| 11 | Làm rõ cách liên kết với Số 1: server Day 21, Postgres và việc cần nhờ | Đạt |
| 12 | Đánh giá thiết kế tích hợp qua API và soạn tin nhắn gửi Số 1 | Đạt |
| 13 | Ghi ghi chú theo dõi chờ Số 1 vào docs/day22/tomtat.md | Đạt |
| 14 | Viết lại phần liên kết trong docs/day22/tomtat.md theo văn phong tài liệu | Đạt |
| 15 | Làm lại trang thông tin cá nhân: avatar và biểu đồ hoạt động | Đạt |
| 16 | Soạn docs/day24/policy_draft.md | Đạt |
| 17 | Cập nhật AI Work Log Ngày 24 | Đạt |

---

## Việc 1: Tạo nhánh feature/learning-hub-day24 từ main đã cập nhật

> "tạo branch hub day 24 (cùng định dạng tên) và kéo main về, làm xong đợi tôi ra lệnh"

### Điều tôi hiểu trước khi gọi AI

Day 23 đã được merge nên nhánh Day 24 phải tạo từ main mới nhất, đặt tên theo quy ước `feature/learning-hub-dayNN` như các ngày trước. "Đợi tôi ra lệnh" nghĩa là không làm thêm việc gì sau khi tạo nhánh.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không tạo file. AI chuyển sang `main`, `git pull` (fast-forward lên `bdd7dd3`, kéo thêm nhánh `feature/data-ai-day24` của Số 1), tạo nhánh `feature/learning-hub-day24` và dừng. Lần này tên nhánh đúng quy ước ngay từ đầu.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: ghi rõ "cùng định dạng tên" trong prompt giúp AI không đặt sai tên như ở Day 23.

---

## Việc 2: Tín hiệu liêm chính v0.1: dòng thời gian, rời màn hình, so khớp mã nguồn, hàng chờ xem xét

> "NGÀY 24 - Integrity và chống gian lận cơ bản
> Giai đoạn: Tuần 5 - Tester/Data/AI courses  |  Kết quả chính: Có tín hiệu hỗ trợ giám sát, không kết luận máy móc.
> Việc phải làm
> •	Ghi attempt timeline, focus events ở mức phù hợp và similarity flag.
> •	Thiết kế policy minh bạch.
> •	Tạo review queue cho giảng viên.
> Bàn giao cuối ngày
> •	Integrity signals v0.1
> •	Policy draft
> •	Review UI
> Điều kiện nghiệm thu
> •	Không tự động kết tội.
> •	Thu thập tối thiểu và có thông báo.
> •	Có false-positive test cases.
> Kiến thức nhận lại
> •	Responsible analytics
> •	Privacy by design
> •	Human review
> Bằng chứng sử dụng và làm chủ AI
> •	Cập nhật AI_WORKLOG: bài toán trước AI, công cụ đã dùng (Codex/Antigravity/khác), chỉ dẫn chính, diff và quyết định của bản thân.
> •	Chạy test/checklist độc lập với kết luận của AI; đính kèm lệnh chạy và kết quả.
> •	Giải thích ngẫu nhiên một đoạn code/schema/test và sửa một thay đổi nhỏ mà không sao chép nguyên câu trả lời AI."
>
> "Thực hiện toàn bộ yêu cầu kỹ thuật của NGÀY 24: "Integrity và chống gian lận cơ bản" vào dự án learning-hub/. Sửa trực tiếp vào mã nguồn, không tạo bất kỳ tệp tài liệu nào (doc sẽ làm cuối buổi). Đảm bảo toàn bộ test hiện có tiếp tục xanh, viết thêm test mới và typecheck sạch 100%.
>
> NGUYÊN TẮC CỐT LÕI BẮT BUỘC:
> - Không tự động kết tội: Hệ thống chỉ thu thập tín hiệu khách quan (Integrity signals) để hỗ trợ giảng viên giám sát, tuyệt đối không tự động trừ điểm, không hủy bài và không tự kết luận học viên gian lận.
> - Thu thập tối thiểu và minh bạch: Chỉ ghi nhận các sự kiện cần thiết, có thông báo rõ ràng cho học viên trước khi làm bài.
> - Giảng viên là người quyết định cuối cùng (Human-in-the-loop).
>
> CÁC HẠNG MỤC TRIỂN KHAI:
>
> 1. Cơ sở dữ liệu và Backend:
> - Mở rộng cấu trúc dữ liệu bài nộp để lưu trữ các tín hiệu giám sát:
>   + Dòng thời gian làm bài: thời điểm bắt đầu, các mốc chỉnh sửa mã nguồn, thời điểm nộp bài và tổng thời lượng thao tác thực tế.
>   + Sự kiện chuyển đổi cửa sổ/tab: ghi nhận thời điểm rời màn hình làm bài, thời điểm quay lại và khoảng thời gian rời đi ở mức tối thiểu.
>   + Cờ tương đồng mã nguồn: điểm số tương đồng (0 đến 1), liên kết bài nộp bị trùng lặp và cờ đánh dấu cần xem xét.
>   + Trạng thái xử lý: trạng thái bình thường, trạng thái cần xem xét và trạng thái đã duyệt; kèm trường lưu quyết định thủ công cùng ghi chú của giảng viên.
> - Thuật toán so khớp độ tương đồng mã nguồn:
>   + Chuẩn hóa mã nguồn (loại bỏ chú thích, khoảng trắng thừa, định dạng cơ bản) trước khi so sánh.
>   + Đánh giá độ tương đồng so với các bài nộp khác của cùng bài tập; gắn cờ nếu vượt ngưỡng nghi vấn nhưng không tự ý đổi điểm số.
> - API:
>   + Nhận và lưu trữ dữ liệu tín hiệu giám sát từ phía client gửi lên.
>   + Danh sách hàng chờ duyệt bài cho giảng viên: lọc và lấy các bài nộp có cờ nghi vấn.
>   + Cập nhật kết luận duyệt bài của giảng viên: ghi nhận người duyệt, kết luận và lý do.
>
> 2. Giao diện người dùng (Frontend):
> - Màn hình làm bài của học viên:
>   + Hiển thị thông báo minh bạch ngay đầu trang: nêu rõ việc hệ thống ghi nhận thời gian làm bài và số lần chuyển đổi cửa sổ nhằm đảm bảo tính công bằng, dữ liệu chỉ dùng để giảng viên xem xét.
>   + Lắng nghe sự kiện rời cửa sổ làm bài ở mức tối thiểu và gửi kèm vào dữ liệu nộp bài.
> - Màn hình duyệt bài của giảng viên:
>   + Xây dựng giao diện hàng chờ xem xét tính trung thực dành cho giảng viên.
>   + Danh sách bài nộp hiển thị rõ: học viên, bài tập, thời gian thao tác, số lần rời màn hình, điểm tương đồng mã nguồn và trạng thái cờ.
>   + Màn hình/modal chi tiết: hiển thị dòng thời gian làm bài, bảng so sánh đoạn mã nghi vấn (nếu có cờ tương đồng), cùng form để giảng viên nhập nhận xét và đưa ra kết luận duyệt.
>
> 3. Kiểm thử tự động (Unit & Integration Tests):
> - Viết test bao phủ các luồng: lưu trữ tín hiệu giám sát đúng cấu trúc, phân quyền giảng viên xem hàng chờ và học viên không xem được dữ liệu của người khác.
> - Bắt buộc có các ca kiểm thử cho trường hợp nhận diện nhầm (False-Positive Cases):
>   + Học viên chuyển tab trong thời gian ngắn hoặc số lần ít (dưới ngưỡng) -> Không gắn cờ nghi vấn.
>   + Hai bài làm dùng chung mã khung khởi tạo mẫu -> Thuật toán không đánh dấu nhầm là sao chép.
>   + Thời gian nộp bài nhanh đối với bài dễ -> Chỉ ghi nhận mốc thời gian, không tự động hủy bài hay trừ điểm.
>
> BÁO CÁO KẾT QUẢ:
> - Báo cáo các chức năng đã triển khai.
> - Số lượng bài test mới, tổng số test xanh hiện tại và xác nhận kết quả typecheck, build.
> - Liệt kê các tệp đã tạo mới hoặc chỉnh sửa."
>
> "lưu ý ko cập nhât doc (doc đợi xong hết mới làm để tiết kiệm quota)"

### Điều tôi hiểu trước khi gọi AI

Tín hiệu chỉ để giảng viên xem xét, không bao giờ làm thay đổi điểm hay trạng thái chấm. "Thu thập tối thiểu" nghĩa là không ghi phím bấm hay nội dung gõ, chỉ ghi thời điểm và độ dài mã. Hai bài chung mã khung không được coi là sao chép nên phải loại mã khung trước khi so. Dòng "không tạo tệp tài liệu" nghĩa là chưa viết doc hay AI_WORKLOG trong lượt này.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc ở chế độ chỉ đọc:
- Backend: schema `Submission`, `ExerciseService.submitCode`, các controller `teacher/*` và `RolesGuard`, `StudentOnlyGuard`, `AppThrottlerGuard`.
- Frontend: `CodePlaygroundPage.tsx`, `TeacherLabSubmissionsPage.tsx`, `Header.tsx`, `App.tsx` để bắt chước cách dựng trang giảng viên.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Nơi lưu tín hiệu:** gắn trường `integrity` vào bản ghi `Submission` của luồng judge, tách khỏi các trường điểm; API đọc bài nộp của học viên không trả trường này.
- **Thuật toán so khớp:** chuẩn hóa mã, loại các dòng trùng với mã khung của đề, tách token rồi tính Jaccard trên tập 3 token liên tiếp; mã quá ngắn (dưới 20 token) không so; không so học viên với chính họ; tối đa 200 bài gần nhất.
- **Ngưỡng:** tương đồng từ 0,8; hoặc rời màn hình từ 5 lần và tổng từ 180 giây (cần cả hai điều kiện để hạn chế nhận diện nhầm).
- **Không tin client:** thời điểm nộp luôn lấy theo giờ máy chủ, thời điểm bắt đầu không được lớn hơn thời điểm nộp, thời gian rời tối đa bị chặn bằng tổng thời gian làm bài, số sự kiện tối đa 50.
- **Duyệt:** ba kết luận, bắt buộc có lý do; chỉ ghi vào các trường `integrity.*`.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend lõi | `modules-api/integrity/`: `integrity.config.ts`, `code-similarity.ts`, `integrity-signals.ts`, `integrity.service.ts`, `integrity.controller.ts`, `integrity.module.ts` | Ngưỡng cấu hình riêng một file; chuẩn hóa mã; dựng tín hiệu; hàng chờ, chi tiết, duyệt |
| Lưu trữ, nộp bài | `submission.schema.ts`, `exercise.service.ts`, `exercise.module.ts`, `dto/submit-code.dto.ts`, `app.module.ts` | Thêm `integrity`; nộp bài gọi `evaluate` nhưng vẫn đưa bài vào hàng đợi chấm như cũ |
| Frontend | `common/integrityTracker.ts`, `components/IntegrityNotice.tsx`, `pages/TeacherIntegrityQueuePage.tsx`, `pages/integrityFormat.ts`, `axios/integrityApi.ts`, `types/integrity.ts`, `CodePlaygroundPage.tsx`, `Header.tsx`, `App.tsx` | Thông báo minh bạch đầu trang; bộ ghi tín hiệu tối thiểu; trang hàng chờ với modal so sánh hai đoạn mã |
| Test | `code-similarity.spec.ts`, `integrity-signals.spec.ts`, `integrity.service.spec.ts`, `integrityTracker.test.ts`, `integrityFormat.test.ts`, test mới trong `exercise.service.spec.ts` | Có 3 ca nhận diện nhầm theo đề, cộng thêm ca bài ngắn và ca không so với chính mình |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit -p tsconfig.json` và `npx jest` ở BE; `npx tsc -b`, `npx vitest run`, `npm run build` ở FE.
- **Kết quả:** 34 test mới ở BE (BE tổng 644 xanh, 58 suite); 12 test mới ở FE (FE tổng 28 xanh, 7 file); typecheck và build của cả hai sạch; `oxlint` không có cảnh báo mới.
- **Ca nhận diện nhầm:** chuyển tab 2 lần mỗi lần 20 giây không gắn cờ; 8 lần mỗi lần 5 giây (tổng 40 giây) không gắn cờ; hai bài chỉ giống nhau ở mã khung có điểm 0; nộp sau 8 giây chỉ ghi mốc, không có lý do, không có kết luận.

**Lỗi AI mắc phải:**
- Hai lần dùng heredoc dài trong bash bị vỡ cú pháp (`unexpected EOF`), chưa file nào được tạo. AI chuyển sang ghi file bằng công cụ ghi file.
- Một bản ghi file bằng script làm mất dấu `\` trong `code-similarity.ts` (`'\\'` thành `'\'`). `tsc` báo `TS1002: Unterminated string literal`; AI sửa lại và đọc kỹ dòng đó.
- Một test FE kỳ vọng sai: mốc chỉnh sửa đầu tiên được ghi ngay lập tức chứ không đợi 30 giây. AI sửa test cho đúng hành vi đã thiết kế.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** ngưỡng đặt theo kiểu "cả hai điều kiện" làm giảm nhận diện nhầm, nhưng cần dữ liệu thật để chỉnh.

**Điều chưa chắc:**
- Tín hiệu mới áp dụng cho bài code qua judge; bài giảng viên soạn (chấm phía client) và DA/AI Lab chưa có.
- Bài nộp trước Day 24 không có `integrity` nên không vào hàng chờ.

---

## Việc 3: Viết tóm tắt Day 24 và chạy dự án để kiểm thử thủ công

> "1. Tạo file docs/day24/tomtat.md, tổng hợp lại toàn bộ nội dung mà bạn vừa báo cáo ở phản hồi trước (chi tiết về những gì đã làm, nguyên lý hoạt động, cấu trúc dữ liệu, thuật toán so khớp, công nghệ sử dụng, danh sách file mới/sửa và các ca kiểm thử false-positive). và run dự án lên để tôi test thủ công"

### Điều tôi hiểu trước khi gọi AI

Báo cáo ở phản hồi trước phải được chuyển thành tài liệu có cấu trúc. Cần bật backend và web để tự kiểm thử trên trình duyệt; MongoDB local đã chạy sẵn.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo `docs/day24/tomtat.md` gồm 11 mục: mục tiêu, công nghệ, nguyên lý, cấu trúc dữ liệu, thuật toán, API, giao diện, kiểm thử, danh sách file, giới hạn và cách thử thủ công. AI chạy `npm run dev:api` và `npm run dev:web` ở nền, chỉ bật hai tiến trình này vì mock và sandbox Docker chỉ cần cho DA Lab.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Kiểm tra:** cổng 5173 trả web; cổng 3000 trả `Nest application successfully started`, `GET /api` hoạt động.

**Lỗi AI mắc phải:**
- Lệnh chờ bằng `sleep` bị công cụ chặn, và một lệnh `Monitor` kết thúc sớm khi log mới chỉ có dòng biên dịch. AI chuyển sang vòng lặp kiểm tra cổng.
- Vì thế bước đầu tưởng API đã sẵn sàng, nhưng cổng 3000 chưa nghe: biên dịch xong chưa có nghĩa là ứng dụng đã khởi động.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: dòng "Found 0 errors" của chế độ watch chỉ báo biên dịch xong; phải kiểm tra cổng đang nghe mới biết ứng dụng đã chạy.

---

## Việc 4: Giải thích vì sao rời tab không thấy phản ứng

> "sao tôi out tab vẫn ko sao"

### Điều tôi hiểu trước khi gọi AI

Tôi mong thấy cảnh báo khi rời tab, nhưng thiết kế là ghi nhận âm thầm và chỉ gắn cờ khi vượt ngưỡng.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. AI giải thích ba lý do: việc ghi nhận không hiện cảnh báo cho học viên; một lần rời tab không gắn cờ vì ngưỡng là từ 5 lần và 180 giây; tín hiệu chỉ gửi khi bấm nộp. AI cũng chỉ ra giới hạn thật: chỉ nghe `visibilitychange` nên không bắt được trường hợp chuyển sang cửa sổ ứng dụng khác khi trình duyệt vẫn hiện, và đề xuất thêm `blur`/`focus` cùng ngưỡng hạ thấp qua biến môi trường để thử.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một giới hạn của giải pháp cần được nói rõ ngay khi người dùng gặp hiện tượng "không có gì xảy ra". Phần `blur`/`focus` được thêm ở Việc 5 và Việc 7.

---

## Việc 5: Làm lại quản lý cuộc thi, phối hợp trắc nghiệm và Code Playground, tích hợp chống gian lận, rà lỗi hai vai trò

> "oke chuẩn rồi, nhưng làm lại cái quản lý cuộc thi  ui ux đơn giản dễ dùng + phối hợp bài trắc nghiệm + code play luôn xong chèn thêm cái chống gian lận này vào cuộc thi luôn với xem hiện tại cái phần cuộc thi cả role giảng viên + học viên có lỗi j không"

### Điều tôi hiểu trước khi gọi AI

Cần ba việc: đơn giản hóa giao diện quản lý cuộc thi và cho phép ghép trắc nghiệm với bài Code Playground trong cùng một cuộc thi; đưa tín hiệu liêm chính vào cuộc thi; và rà soát lỗi thật ở cả hai vai trò trước khi sửa, chứ không đoán.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc toàn bộ phần cuộc thi: `contest.controller.ts`, `contest.service.ts`, `contest-submission.service.ts`, `contest.schema.ts`, `leaderboard.service.ts`, các spec hiện có, `TeacherContestAuthoring.tsx` (674 dòng), `ContestListPage.tsx` (677 dòng), `ContestExamWorkspace.tsx` (1184 dòng), `initial-contests.ts`. AI cũng truy vấn MongoDB thật (bằng script tạm) để xem dữ liệu cuộc thi, bài, câu hỏi.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Lỗi thật AI tìm thấy và đưa vào sửa:

| Mức | Lỗi | Bằng chứng |
|---|---|---|
| Nghiêm trọng | Danh sách cuộc thi rỗng cho cả giảng viên và học viên: bộ lọc bản nháp bị đảo (khách thấy bản nháp, người đăng nhập kể cả giảng viên lại không thấy) | DB chỉ còn 1 cuộc thi ở trạng thái nháp |
| Nghiêm trọng | Đồng hồ cá nhân và khóa "mỗi người một lượt" nằm ở localStorage, xóa dữ liệu trình duyệt là thi lại được | Đọc `ContestExamWorkspace.tsx` |
| Nghiêm trọng | Đề không có test case bị chấm AC full điểm cho mọi bài làm; cuộc thi mẫu trỏ tới bài không tồn tại | Đọc `gradeCoding`; so slug mẫu với DB |
| Cao | API công khai trả cả danh sách tên và ID học viên đã đăng ký | Đọc `findOne`, `findAll` |
| Cao | Giảng viên đăng ký thi được | `registerContest` không có `StudentOnlyGuard` |
| Trung bình | Body gửi lên ghi đè tuỳ ý (`Object.assign`), sửa tiêu đề làm mất thời lượng cá nhân, xóa cuộc thi để lại dữ liệu mồ côi, nộp bài không có giới hạn tốc độ, sau khi cuộc thi bắt đầu vẫn đổi được giờ và đề | Đọc service |
| Giao diện | Tổng điểm gắn cứng 100, số thí sinh hiển thị sai, câu trắc nghiệm có đoạn code không hiện đoạn code, chữ nói "nộp lại được" nhưng nút bị khóa, không có nút về danh sách bài | Đọc component |

Thiết kế AI đề xuất và tôi chấp nhận:
- Lượt thi do máy chủ giữ (`contest_attempts`): giờ bắt đầu, hạn nộp, đã nộp hay chưa; mỗi học viên một lượt.
- Đề có ba nguồn: bài tự soạn, bài Code Playground, hoặc phần trắc nghiệm ghép từ ngân hàng câu hỏi.
- Quản lý theo 3 bước (thông tin, đề thi, giám sát và xuất bản), có lưu nháp ở mọi bước.
- Tín hiệu liêm chính nằm trên lượt thi, bật hoặc tắt theo từng cuộc thi, giữ nguyên nguyên tắc không tự kết luận.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend mới | `contest-attempt.schema.ts`, `contest-attempt.service.ts`, `contest-manage.service.ts`, `contest-problem-content.service.ts`, `dto/finish-contest.dto.ts`, `data/seed-contests.ts` | Bắt đầu, nộp, kết quả của chính học viên; kết quả theo thí sinh; ngân hàng câu hỏi và bài; nạp lại cuộc thi mẫu |
| Backend sửa | `contest.service.ts` (viết lại), `contest-submission.service.ts`, `contest.controller.ts`, `contest.module.ts`, `contest.schema.ts`, các DTO, `database.module.ts`, `app-throttler.guard.ts`, `initial-contests.ts`, `package.json` | Danh sách trắng trường, kiểm tra đề, bản nháp, chặn sửa đề sau khi bắt đầu, dọn dữ liệu khi xóa, giới hạn tốc độ nộp bài |
| Frontend mới | `components/contest-manager/` (`ContestEditor.tsx`, `ProblemPicker.tsx`, `ContestResultsPanel.tsx`, `contestForm.ts`, `resultsFormat.ts`), `contestAttemptResult.ts`, `IntegrityReviewModal.tsx` (tách từ trang hàng chờ để dùng chung), `hooks/useIntegrityTracker.ts` | Trình soạn 3 bước; chọn đề; bảng kết quả có xuất CSV; hook ghi tín hiệu dùng cho cả cuộc thi và Playground |
| Frontend sửa | `TeacherContestAuthoring.tsx` (viết lại), `ContestExamWorkspace.tsx`, `ContestListPage.tsx`, `types/contest.ts`, `contestApi.ts`, `contestSubmissionApi.ts`, `CodePlaygroundPage.tsx` | Đồng hồ và khóa lượt thi lấy từ máy chủ; thông báo liêm chính trước và trong phòng thi; hiện đoạn code của câu trắc nghiệm |
| Test | `contest.service.spec.ts`, `contest-submission.service.spec.ts` (viết lại), `contest-attempt.service.spec.ts`, `contest-manage.service.spec.ts` (mới), `contestForm.test.ts`, `resultsFormat.test.ts`, `contestAttemptResult.test.ts` | Có ca đề không test case bị từ chối, bản nháp ẩn với học viên, chặn sửa đề sau khi bắt đầu, ca nhận diện nhầm ở cấp lượt thi |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx jest`, `npx tsc --noEmit -p tsconfig.json`, `npm run build` ở BE; `npx vitest run`, `npx tsc -b`, `npm run build` ở FE.
- **Kết quả:** BE từ 644 lên 716 (60 suite); FE từ 28 lên 52 (10 file); typecheck và build sạch; `oxlint` không có cảnh báo mới.
- **Kiểm thử động qua HTTP thật (script tạm, đã dọn):**
  - Khách và học viên không thấy bản nháp, giảng viên thấy; danh sách học viên không còn trường `registrations`.
  - Tạo cuộc thi ghép trắc nghiệm ngân hàng và bài Code Playground; xuất bản không có đề bị 400; bài không tồn tại bị 400.
  - Chưa đăng ký thì vào thi bị 403; giảng viên đăng ký bị 403; xem đề trước khi bấm vào thi bị 400; gọi vào thi hai lần trả cùng giờ bắt đầu.
  - Nộp code đúng nhận AC 70/70; nộp trắc nghiệm lần hai bị 400; nộp sau khi đã chốt bài thi bị 400; giảng viên xem được kết quả, học viên gọi nhận 403.
  - Sau khi cuộc thi bắt đầu, đổi tên được nhưng đổi danh sách đề bị 400.
  - Kịch bản chép bài với ba học viên tạm: bài B chép bài A (đổi tên biến, thêm chú thích) bị gắn cờ 86%; bài C làm khác và chuyển tab 2 lần không bị gắn cờ.

**Lỗi AI mắc phải:**
- Lại gặp lỗi heredoc bash nên chuyển sang ghi file bằng công cụ ghi file.
- `tsc` báo kiểu sai ở bộ lọc bản nháp (`{ $ne: string }`); AI đổi sang `Record<string, unknown>`.
- AI viết một DTO duyệt thừa rồi nhận ra đã có sẵn kiểu dùng chung và xoá đi.
- Lần xoá tài khoản tạm đầu tiên trả 0 vì biểu thức khớp phân biệt chữ hoa thường; AI chạy lại không phân biệt và xoá đủ 3 tài khoản.
- Trong kịch bản kiểm thử ban đầu, các sự kiện rời màn hình giả dài hơn thời gian thực nên tổng bị cắt về thời gian làm bài và không gắn cờ. Đây là hành vi đúng (chống client khai khống), không phải lỗi.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** đọc dữ liệu thật trong DB trước khi kết luận cho thấy ngay lỗi nghiêm trọng nhất (danh sách trống do bộ lọc đảo), thứ mà chỉ đọc code khó thấy.

**Điều chưa chắc:**
- Việc nạp lại cuộc thi mẫu bằng `npm run seed:contests` xoá và tạo lại 4 cuộc thi mẫu, kể cả bản nháp mẫu cũ.
- Bài nộp sau mới được so với bài nộp trước, nên với cặp bài giống nhau chỉ bài nộp sau bị gắn cờ.

---

## Việc 6: Tạo docs/day11/tomtat.md từ báo cáo

> "(kèm đoạn nội dung dán từ báo cáo trước: mục "Quản lý cuộc thi mới (giảng viên)" và mục "Chống gian lận trong cuộc thi")
>
> tạo doc day11 cóp này vào tomtat.md"

### Điều tôi hiểu trước khi gọi AI

Nội dung dán là phần báo cáo về quản lý cuộc thi, cần đưa nguyên vào tài liệu của Day 11 (ngày làm cuộc thi), ở thư mục `docs/day11`.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo `docs/day11/tomtat.md` với hai mục như đoạn dán. AI chỉ thêm tiêu đề và đổi "Mình dùng chung" thành "Dùng chung" cho hợp văn tài liệu; còn lại giữ nguyên. Thư mục `docs/day11` chưa tồn tại nên được tạo mới.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều chưa chắc: `docs/day24/tomtat.md` vẫn là bản của lượt trước, chưa cập nhật phần cuộc thi.

---

## Việc 7: Sáng và tối, responsive, thanh điều hướng có dropdown

> "hiện tại light mode và darkmode thật sự không được tối ưu, vào khi cái bảng code nhìn ko thấy đang gõ code j luôn, thứ 2 repónive cho mọi thiết bị, nav 3 bị mất chỗ thì làm dropdown"

### Điều tôi hiểu trước khi gọi AI

Có ba vấn đề: màu sáng và tối không nhất quán; trình soạn code khi gõ không thấy chữ; giao diện chưa phù hợp mọi thiết bị, thanh điều hướng thiếu chỗ nên cần gom bớt mục vào dropdown.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `styles/main.css`, `App.tsx`, `CodeEditor.tsx`, `Header.tsx` và các trang chính. Công cụ đo: Chrome headless điều khiển bằng `puppeteer-core` cài trong thư mục tạm, chụp ảnh ở 1366, 820 và 390 px, ở cả hai giao diện, kèm bộ đo tương phản và tràn ngang trên 21 trang.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Nguyên nhân sáng/tối:** biến thể `dark:` của Tailwind mặc định theo cài đặt hệ điều hành chứ không theo nút đổi giao diện của ứng dụng; chụp ảnh ở tổ hợp app sáng với máy tối cho thấy chip tối trên thẻ sáng. Sửa bằng một khai báo biến thể `dark` theo class `theme-dark`, cộng `color-scheme`.
- **Nguyên nhân không thấy chữ khi gõ:** phòng thi cuộc thi truyền cờ theme sai (kiểm tra class `dark` trong khi ứng dụng dùng `theme-dark`) nên editor luôn ở theme sáng; theme sáng của thư viện gần như rỗng nên chữ kế thừa màu trang, tức chữ gần trắng trên nền trắng khi ứng dụng ở giao diện tối. Sửa: editor tự theo giao diện ứng dụng và có theme sáng tường minh.
- **Thanh điều hướng:** chia theo chiều rộng thật của từng mục, mục không đủ chỗ vào dropdown "Thêm"; mục đang mở luôn hiện sẵn; menu di động dùng chung danh sách.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Giao diện | `styles/main.css`, `CodeEditor.tsx`, `components/editorTheme.ts`, `hooks/useIsDarkTheme.ts`, `pages/DaLabWorkspacePage.tsx`, `ContestExamWorkspace.tsx`, `CodePlaygroundPage.tsx` | Biến thể `dark`, theme editor tường minh và tự cập nhật khi đổi giao diện |
| Điều hướng | `components/OverflowNav.tsx`, `components/navOverflow.ts`, `Header.tsx` (viết lại) | Danh sách mục khai báo một chỗ dùng cho desktop và di động |
| Màu và tương phản | Khoảng 23 file `.tsx`, `Footer.tsx` | Nâng màu nút xanh lá, cyan, cam từ `-600` lên `-700` (trắng trên `-600` chỉ đạt 3,2 đến 3,6); chữ phụ, badge, nút Xóa theo cả hai giao diện |
| Responsive | `ContestExamWorkspace.tsx`, `ProblemPicker.tsx`, `ContestEditor.tsx` | Thanh tiêu đề phòng thi xếp dọc trên điện thoại; sửa tràn ngang |
| Test | `components/navOverflow.test.ts` | 8 test cho phép tính chia mục và dropdown |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `node shot.mjs`, `node audit.mjs`, `node flows.mjs`, `node editorcheck.mjs` (script tạm), cùng `npx tsc -b`, `npx vitest run`, `npm run build`.
- **Kết quả:**
  - Độ tương phản chữ của trình soạn code: 17,9 (sáng) và 6,6 (tối) ở cả 4 tổ hợp app và máy, đổi giao diện khi đang mở thì editor đổi theo.
  - Lần đo đầu báo 97 trên 126 lượt có vấn đề, nhưng bộ đo lúc đó đọc sai màu `oklch` của Tailwind. Sau khi sửa bộ đo và các màu, còn 9 lượt (3 loại), đã sửa tiếp; chưa chạy lại toàn bộ 126 lượt sau lần sửa cuối, chỉ chạy lại các luồng cuộc thi và hồ sơ.
  - Không còn trang nào tràn ngang ở 3 kích thước.
  - FE 60 test xanh (11 file); `tsc` và build sạch.

**Lỗi AI mắc phải:**
- Thước đo ẩn của thanh điều hướng (dùng để đo chiều rộng từng mục) làm trang cuộn ngang; bộ đo tràn ngang bắt được và AI bọc thước đo vào khung 0x0.
- Bộ đo tương phản ban đầu đọc sai màu `oklch`; AI đổi sang quy đổi màu qua canvas.
- Các lần tự động hóa đầu chọn nhầm nút điều hướng thay vì thẻ bài tập; AI sửa bộ chọn.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** nhìn ảnh chụp thật và đo bằng công cụ cho thấy nguyên nhân gốc (biến thể `dark:` theo hệ điều hành), nhanh hơn nhiều so với sửa từng màu.

**Điều chưa chắc:** bộ đo bỏ qua chữ nằm trên nền gradient (như banner đầu trang), phần đó chỉ xem bằng mắt qua ảnh chụp.

---

## Việc 8: DA Lab và AI Lab không cần mock thủ công, tự bật Docker, triển khai trọn bộ bằng Docker

> "vấn đề là giờ cái da lab với ai lab Máy chủ dữ liệu giả lập chưa được bật, Máy chủ dữ liệu giả lập chưa được bật, giờ làm sao, vấn đề phải liên kết với data của ng số 1 mà giờ cứ như v phải làm thủ công, vấn đề làm chung nữa docker local mà còn ko auto bật mai mốt còn khó deploy"

### Điều tôi hiểu trước khi gọi AI

Lỗi xuất hiện vì bản tôi đang chạy chỉ bật backend và web, không bật mock của Số 1. Gốc vấn đề rộng hơn: backend phụ thuộc một tiến trình mock riêng, Docker không tự bật, và việc triển khai thật phụ thuộc nhiều bước thủ công.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `docker-compose.yml`, `scripts/ensure-sandbox.js`, `dataset-integration.service.ts`, `mock-data-service/server.ts`, `.env.example`, `BE/.env` (xem lưu ý dữ liệu nhạy cảm ở đầu file), và đọc mã server Day 21 của Số 1 để biết nó có những route nào.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Nguồn dữ liệu có ba chế độ:** để trống `DATA_SERVICE_BASE_URL` thì backend dùng bản dữ liệu tích hợp sẵn (chuyển fixture vào `src/integration/local-registry/`); có địa chỉ thì gọi server thật; thêm `DATA_SERVICE_FALLBACK=embedded` thì tự rơi về bản tích hợp khi server tắt (chỉ nên dùng khi dev).
- **Nối với dữ liệu thật của Số 1:** server Day 21 hiện chưa có `data_dictionary`, `sandbox_db_url` và route `evaluation-sets`; vì thế mặc định là bản tích hợp.
- **Docker:** `ensure-sandbox.js` tự mở Docker Desktop (Windows và macOS), tự bật MongoDB nếu máy chưa có; hook `prestart:dev` để bật backend theo cách nào cũng có sandbox.
- **Triển khai:** Dockerfile cho backend và frontend, nginx chuyển tiếp `/api`, và profile `full` trong compose.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Registry tích hợp | `integration/local-registry/` (3 file, chuyển bằng `git mv`), `dataset-integration.service.ts`, `main.ts` | `describeSource()`, chế độ embedded và dự phòng; thông báo lỗi mới chỉ rõ cách xử lý |
| Chẩn đoán | `app.controller.ts` (`GET /api/health/dependencies`), `app.module.ts`, `scripts/doctor.js` | Báo nguồn dữ liệu đang dùng và Postgres sandbox có nghe cổng không |
| Tự bật hạ tầng | `scripts/ensure-sandbox.js`, `package.json` (gốc và BE) | Tự mở Docker Desktop, bật `mongo-dev` khi cổng 27017 trống |
| Triển khai | `BE/Dockerfile`, `FE/Dockerfile`, `FE/nginx.conf`, hai file `.dockerignore`, `docker-compose.yml`, `docker-compose.prod.yml`, `tsconfig.build.json`, `jwt-secret.ts` | Profile `full`; backend từ chối khởi động ở production nếu thiếu `JWT_SECRET` |
| Test | 11 test mới ở `dataset-integration.service.spec.ts`, 2 ở `app.controller.spec.ts`, `jwt-secret.spec.ts` (3 test) | Ba chế độ, 404 không bị nhầm với lỗi máy chủ, fallback chỉ áp dụng khi không có phản hồi |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx jest`, `npx tsc --noEmit -p tsconfig.json`, `npm run build`, `node scripts/doctor.js`, `docker compose config`, `docker build -f BE/Dockerfile .`, `docker build -f FE/Dockerfile .`.
- **Kết quả:**
  - BE từ 716 lên 732 test (61 suite).
  - Với backend đang chạy: DA Lab trả dataset và chạy SQL (`SELECT COUNT(*) FROM orders` ra 15); AI Lab trả bộ câu hỏi; `doctor` báo mọi mục sẵn sàng.
  - Dựng hai image thành công; chạy thử trong mạng Docker riêng: backend `healthy`, nginx chuyển tiếp `/api`, đường dẫn con của SPA trả 200, sandbox truy cập được bằng tên dịch vụ, DA Lab, AI Lab và chạy Python đều đúng. Đã xoá container, mạng và image thử.

**Lỗi AI mắc phải:**
- Dùng cú pháp bắt buộc biến (`:?`) cho `JWT_SECRET` trong compose làm lệnh `docker compose up` thường (chỉ bật sandbox khi dev) lỗi, vì Compose nội suy cả dịch vụ không thuộc profile. Phát hiện bằng `docker compose config`; AI chuyển yêu cầu bắt buộc sang file production và sang backend.
- Phát hiện `npm run start:prod` trỏ sai đường dẫn (`dist/main` trong khi build xuất `dist/src/main`); sửa bằng cách loại thư mục mock khỏi cấu hình build.
- Script `doctor.js` gọi `process.exit` làm Node trên Windows báo lỗi assertion; đổi sang `process.exitCode`.
- Lệnh đọc `BE/.env` che khóa chưa đủ (xem mục dữ liệu nhạy cảm).

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** nên tách "nguồn dữ liệu" khỏi "tiến trình phụ phải bật", và mọi khóa bắt buộc nên được kiểm tra ở nơi chạy thật chứ không ở file dùng chung.

**Điều chưa chắc:**
- Dữ liệu tích hợp sẵn vẫn là bản mô phỏng; chưa nối được dữ liệu thật của Số 1.
- Chạy Python trong container dùng chế độ `local` với kiểm tra AST và giới hạn; nếu cần cách ly mạnh hơn khi lên production thật thì phải cân nhắc lại.

---

## Việc 9: Dựng môi trường trên máy mới bằng một lệnh

> "nhưng mà setup máy mới thì như nào, tại dự án nhiều người làm chung"

### Điều tôi hiểu trước khi gọi AI

Máy mới thiếu file mẫu cấu hình, MongoDB, và dữ liệu mẫu; các lệnh seed hiện có xoá dữ liệu cũ nên không thể chạy tay lên CSDL đã có dữ liệu.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `README.md` (còn nội dung từ Day 6), các script seed, `.gitignore`, `.github/workflows/ci.yml`, và xác nhận `BE/.env` bị chặn commit nên người mới không có file mẫu.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Lệnh `npm run setup` an toàn:** kiểm tra Node (từ 20.12) và Docker; tạo `.env` từ file mẫu và sinh `JWT_SECRET` ngẫu nhiên, không ghi đè file đã có; cài thư viện nếu thiếu; bật MongoDB và Postgres sandbox; kéo image Python; nạp dữ liệu mẫu **chỉ khi CSDL còn trống**.
- **`npm run seed:all`** là lệnh nạp lại có xoá dữ liệu, tách riêng và có ghi chú cảnh báo.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Script | `scripts/setup.js`, `scripts/lib/setup-helpers.js`, `scripts/lib/setup-helpers.test.js`, `scripts/ensure-sandbox.js` | Hàm thuần tách riêng để kiểm thử |
| Cấu hình mẫu | `BE/.env.example`, `FE/.env.example`, `.nvmrc`, `docker-compose.yml` (dịch vụ `mongo-dev`, profile `dev`), `package.json` (`engines`, `setup`, `seed:all`, `test:scripts`) | Khóa Gemini, Gmail để trống thì tính năng tương ứng tạm tắt |
| Tài liệu | `README.md` (mục "Bắt Đầu Nhanh"), `.github/workflows/ci.yml` | CI chuyển sang Node 20 và 22, thêm bước chạy test script |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `node --test scripts/lib/*.test.js`; giả lập máy mới bằng cách sao chép dự án sang thư mục tạm (không có `.env`, không `node_modules`, dùng liên kết tới thư viện có sẵn) rồi chạy `node scripts/setup.js`.
- **Kết quả:**
  - 8 test script xanh.
  - Trên CSDL đã có dữ liệu: setup giữ nguyên, không seed.
  - Trên CSDL trống: nạp đủ 4 bộ (người dùng, bài tập, câu hỏi, cuộc thi mẫu); chạy lần hai không seed lại.
  - Đã xoá CSDL tạm và thư mục tạm; CSDL thật còn nguyên.

**Lỗi AI mắc phải:**
- Heredoc bash chứa nhiều ký tự đặc biệt lại vỡ; AI chuyển sang công cụ ghi file.
- Một test `tcpOpenSync` ban đầu viết sai vì tiến trình con chặn vòng lặp; AI sửa theo hành vi thật (kết nối hoàn tất ở tầng hệ điều hành).
- `node --test scripts/lib` không nhận thư mục trên Node mới; đổi sang mẫu `scripts/lib/*.test.js`.
- Cảnh báo `DEP0190` khi gọi npm qua shell; AI chuyển sang gọi bằng `npm_execpath`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** lệnh dựng môi trường phải coi dữ liệu có sẵn là thứ không được đụng tới.

**Điều chưa chắc:**
- Mới thử trên Windows, chưa thử macOS hoặc Linux; bước `npm ci` chưa chạy thật vì dùng thư viện có sẵn.
- `.github/workflows/ci.yml` nằm trong `learning-hub/` trong khi git root là thư mục cha, nên GitHub có thể không chạy workflow này; chưa kiểm tra.

---

## Việc 10: Ghi cơ chế liên kết với Số 1 vào docs/day22/tomtat.md

> "trong docs/day22 tạo tomtat.md tương tự nãy h nói cách liên kết với số 1 đi ghi tương tự, tại tôi chưa hiểu nguyên lý, hiện tại 2 ng làm local nữa chả hiểu call api kiểu j"
>
> "khó hiểu quá với toàn tên file đọc k hiểu"

### Điều tôi hiểu trước khi gọi AI

Tôi cần hiểu nguyên lý hai hệ thống nói chuyện với nhau, đặc biệt khi cả hai cùng chạy trên máy cá nhân. Tài liệu `docs/day22/tomtat.md` đã có sẵn 3 đoạn tóm tắt Day 22 nên phần mới phải thêm vào cuối.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

AI giữ nguyên ba đoạn cũ và thêm mục giải thích liên kết: luồng khi học viên mở DA Lab, và bảng ba tình huống chạy (cùng máy, cùng mạng, đưa lên máy chủ), trong đó nhấn mạnh `localhost` chỉ trỏ về chính máy đang chạy. Bản đầu có quá nhiều đường dẫn và tên file nên tôi không đọc được. Lượt thứ hai, AI viết lại bằng lời đơn giản, dùng hình ảnh quán ăn và kho nguyên liệu, bảng ba thứ cần để gọi (địa chỉ, khóa, dữ liệu trả về), và chỉ còn nhắc `BE/.env`, `npm run doctor`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tài liệu giải thích nguyên lý cho người mới phải hạn chế tên file và thuật ngữ. Cách ví von ở lượt này sau đó bị tôi đánh giá là chưa chuyên nghiệp (xem Việc 14).

---

## Việc 11: Làm rõ cách liên kết với Số 1: server Day 21, Postgres và việc cần nhờ

> "nhưng hiện tại kiểu tôi clone src data số 1 về tự tôi run server của day số 1 à"
>
> "rồi bây giờ làm sao"
>
> "đường dẫn kết nối Postgres  nhưng mà cái này ng ta có làm k hay mình tự làm r kêu ng ta bổ sung"

### Điều tôi hiểu trước khi gọi AI

Tôi muốn biết trong thực tế dùng dữ liệu của Số 1 nghĩa là gì: có phải tự chạy server của họ không, ai làm Postgres, và việc gì cần nhờ họ bổ sung.

### Context, tài liệu, file, constraint đã cung cấp

AI chỉ đọc `Data-AI-Resource` (Task 06, 21, 24) bằng lệnh đọc và tìm kiếm, không sửa file nào.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Chạy thử thật server Day 21 của Số 1:** tạo môi trường Python tạm, cài thư viện, chạy ở cổng 8099. Kết quả: dataset `ds-retail-ecommerce-sales-v1` có, nhưng không có `data_dictionary`, không có `sandbox_db_url`, route `evaluation-sets` trả 404.
- **Trỏ backend của tôi vào server đó** (bản backend phụ cổng 3998): DA Lab trả 502 "chưa có data_dictionary"; AI Lab trả 404.
- **Ai làm Postgres:** tìm trong `Data-AI-Resource` không có Docker hay Postgres nào, chỉ có 5 file CSV của dataset bán hàng (200 khách hàng, 50 sản phẩm, 20 nhân viên, 1.000 đơn, 1.803 dòng chi tiết) và file mô tả bảng. `git log` cho thấy `init.sql` và Postgres trên máy do chính tôi tạo ở Day 22; tên bảng và cột khớp với CSV của Số 1 nhưng chỉ có khoảng 15 đơn hàng tổng hợp.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. AI tắt tiến trình tạm theo cổng, xoá môi trường Python tạm và xác nhận `Data-AI-Resource` không bị thay đổi (`git status`). AI khuyến nghị: tôi giữ Postgres, Số 1 chỉ cấp dữ liệu và API; đề xuất nạp CSV bằng tay bị tôi bác bỏ ở Việc 12.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `python -m venv`, `pip install`, chạy `uvicorn` với `src.main:app`, `curl` với khóa mẫu của Số 1, `git log --format='%h %an %s' -- init.sql`.
- **Kết quả:** như mô tả ở trên; backend của tôi đang chạy không bị ảnh hưởng.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** muốn biết "đã có chưa" thì chạy thử thật, không đoán từ tài liệu.

**Điều chưa chắc:** việc Số 1 thiếu ba phần dựa trên bản mã Day 21 hiện có trong repo; cần hỏi lại họ để biết đã làm chưa.

---

## Việc 12: Đánh giá thiết kế tích hợp qua API và soạn tin nhắn gửi Số 1

> "Không copy CSV thủ công vào database. Tiêu chí nghiệm thu của dự án bắt buộc hệ thống phải tích hợp tự động qua API và data contract, không sao chép dữ liệu tĩnh bằng tay.
>
> Thống nhất thiết kế kỹ thuật như sau:
> 1. Phân định trách nhiệm:
> - Số 1 (Data & AI Resource): Chịu trách nhiệm lưu trữ dataset, metadata, schema/data_dictionary và cấp API lấy dữ liệu.
> - Phía chúng ta (Learning Hub): Chịu trách nhiệm quản lý Postgres Sandbox và runner thực thi truy vấn.
>
> 2. Luồng tích hợp tự động:
> - Backend của chúng ta sẽ gọi API của Số 1 để lấy schema/data_dictionary vẽ UI động, và lấy bộ evaluation-set để chấm điểm AI Lab.
> - Đối với dữ liệu SQL: Viết kịch bản Ingestion tự động fetch dữ liệu từ API của Số 1 nạp vào Postgres Sandbox khi khởi tạo môi trường, thay vì copy file tĩnh bằng tay.
>
> Hiện tại giữ nguyên bản mô phỏng nội bộ để hoàn thành kiểm thử Ngày 24. Không sửa thư mục của Số 1. Hãy soạn cho tôi một tin nhắn ngắn gọn, chính xác để gửi Số 1 yêu cầu bổ sung đúng 2 API endpoint/response còn thiếu (data_dictionary và evaluation-sets).
>
> đánh giá cách làm này xem"
>
> "day21 còn thiếu
> 1.GET /api/v1/registry/datasets/{id}: thêm trường data_dictionary gồm danh sách bảng, mỗi bảng có danh sách cột (tên, kiểu dữ liệu, nullable, khóa chính, khóa ngoại, mô tả). Phần này bạn đã có file từ Task 06, chỉ cần trả thêm vào response. 
> 2.Route mới GET /api/v1/registry/evaluation-sets/{id}: mỗi câu có question_id, query, ground_truth_answer, expected_behavior để bên mình chấm AI Lab.   3.Route lấy dữ liệu từng bảng của dataset (phân trang hoặc tải dạng file, kèm current_version và checksum_sha256) để bên mình nạp vào Postgres Sandbox.  h nhắn cho số 1 như vnha"
>
> "r giờ phải chờ số 1 sửa à, mình bị trễ theo r"

### Điều tôi hiểu trước khi gọi AI

Thiết kế mới được thống nhất: Số 1 giữ dữ liệu và API, tôi giữ Postgres và việc nạp tự động qua API. Tôi cần đánh giá thiết kế, có tin nhắn đúng cho Số 1, và biết việc của tôi có bị chặn không.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. Đánh giá của AI:
- **Đúng:** phân chia trách nhiệm; nạp qua API thay vì copy tay; giữ bản mô phỏng cho Day 24.
- **Thiếu một thứ quan trọng:** chỉ xin hai endpoint thì không nạp được dữ liệu SQL, vì `data_dictionary` chỉ mô tả bảng, không chứa dòng dữ liệu. Server Day 21 chỉ trả vài dòng mẫu. Cần endpoint thứ ba lấy dữ liệu từng bảng; tôi đã tự viết ra endpoint này trong tin nhắn thứ hai.
- **Điều kiện cho phần nạp tự động:** nạp theo phiên bản và checksum để chạy lại không hỏng; tách tài khoản ghi và tài khoản chỉ đọc; kiểm tra tên bảng và cột đến từ API; khóa cứng phiên bản dữ liệu cho từng bài lab; chọn bản `clean` hay `dirty`.

Tin nhắn gửi Số 1: AI soạn bản đầu có 3 mục; tôi bổ sung nội dung thật cho từng mục, AI ghép thêm câu hỏi chọn `clean` hay `dirty`, câu nói Postgres do bên tôi quản lý, và ba câu hỏi về thời gian, địa chỉ server chung, khóa API. Về việc chờ: AI khẳng định tôi không bị chặn vì có thể viết sẵn phía mình và thử trên server mô phỏng, đồng thời đề xuất gửi kèm cấu trúc response gợi ý cho route thứ ba.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** khi viết yêu cầu cho nhóm khác, phải tự kiểm tra xem danh sách yêu cầu có đủ để toàn bộ luồng chạy được không.

**Điều chưa chắc:** Số 1 chưa trả lời về thời gian và địa chỉ server chung.

---

## Việc 13: Ghi ghi chú theo dõi chờ Số 1 vào docs/day22/tomtat.md

> "ghi lại note này vào day22 đi có khi 2 3 ngày nữa số 1 xong r sửa"

### Điều tôi hiểu trước khi gọi AI

Số 1 có thể xong sau 2 đến 3 ngày. Cần ghi lại trạng thái và việc phải làm khi họ xong để không phải nhớ lại.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

AI thêm vào cuối `docs/day22/tomtat.md` mục "Ghi chú theo dõi: đang chờ số 1 bổ sung API (ghi ngày 05/10/2026)": tình hình hiện tại, ba việc đã nhờ, bảng ai làm gì, việc làm trong lúc chờ, sáu bước khi Số 1 xong và các lưu ý. AI ghi rõ những việc "làm trong lúc chờ" chưa được thực hiện vì tôi chưa ra lệnh.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều chưa chắc: phần nạp dữ liệu tự động vẫn chưa được viết; hiện vẫn là bản mô phỏng.

---

## Việc 14: Viết lại phần liên kết trong docs/day22/tomtat.md theo văn phong tài liệu

> "cai tomtat.md khúc dau noi don gian lien ket nhu nao thoi, ko co can vd thực tế đâu vì tài liệu mà ghi v nó ko chuyên nghiệp, ngôn ngữ thì quá mức ko nghiêm túc"

### Điều tôi hiểu trước khi gọi AI

Ví dụ đời thường và lời văn thân mật không phù hợp với một tài liệu kỹ thuật. Phần đầu chỉ cần nêu ngắn gọn cơ chế liên kết.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

AI viết lại `docs/day22/tomtat.md` giữ nguyên ba đoạn tóm tắt Day 22 ở đầu. Phần mới "Cơ chế liên kết với Thực tập sinh số 1" chỉ gồm: nguyên tắc tích hợp qua REST API theo hợp đồng dữ liệu; luồng 4 bước khi học viên mở DA Lab và cách AI Lab lấy bộ câu hỏi; bảng chọn nguồn dữ liệu bằng `DATA_SERVICE_BASE_URL`; một câu về `localhost`. Phần theo dõi được chuyển sang văn phong trung tính: bảng yêu cầu ba endpoint, bảng phân công, kế hoạch trong lúc chờ, các bước khi Số 1 xong, lưu ý; bỏ cách xưng hô cá nhân và mục lặp.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: phân biệt văn bản giải thích cho bản thân với tài liệu nộp; tài liệu nộp không dùng ví dụ đời thường.

---

## Việc 15: Làm lại trang thông tin cá nhân: avatar và biểu đồ hoạt động

> "Cập nhật lại giao diện trang thông tin cá nhân (Profile Page) theo layout mới, giữ nguyên logic lấy dữ liệu hiện có và đảm bảo typecheck sạch:
>
> 1. Khu vực Header cá nhân (bên trên):
> - Cho phép cập nhật avatar:
>   + Hiển thị avatar hiện tại (nếu chưa có thì giữ avatar chữ cái mặc định).
>   + Cho phép bấm vào icon camera nhỏ/hover trên avatar để chọn ảnh tải lên (hoặc nhập URL ảnh avatar), có preview và lưu vào profile.
> - Tên và email giữ hiển thị cạnh avatar như hiện tại.
>
> 2. Bố cục bên dưới chia thành 2 cột (dùng grid/flex responsive, trên desktop chia 2 cột cân đối):
>
> - CỘT TRÁI (Thông tin cá nhân):
>   + Thiết kế tối giản, sạch sẽ: KHÔNG dùng nút bấm (button), KHÔNG dùng các icon ô vuông bo tròn to viền xung quanh như hiện tại.
>   + Trình bày dạng các dòng kẻ ngang (kiểu ô ly / table rows đơn giản): Mỗi thông tin là một hàng ngăn cách nhau bằng border kẻ ngang mảnh (`border-b border-slate-700/50` hoặc tương đương).
>   + Mỗi hàng gồm nhãn bên trái (màu chữ phụ mờ) và giá trị bên phải (chữ trắng/sáng rõ ràng):
>     * Họ và tên
>     * Email
>     * Vai trò
>     * Mã học viên
>     * Nhóm tuổi
>
> - CỘT PHẢI (Biểu đồ hoạt động - Activity Heatmap):
>   + Thiết kế dạng ma trận các ô vuông nhỏ màu xanh giống biểu đồ commit trên GitHub (GitHub Contribution Graph).
>   + Thể hiện hoạt động nộp bài / học tập theo các ngày trong tuần và các tháng qua độ đậm nhạt của màu xanh (từ xám đậm không hoạt động đến các cấp độ xanh lá/xanh cyan đậm dần).
>   + Hiển thị tổng số lượt nộp bài / hoạt động và thanh chú thích cấp độ (Less -> More) ở góc dưới.
>   + Dữ liệu hoạt động: Tận dụng dữ liệu lịch sử nộp bài / attempts hiện có của học viên để tổng hợp thành heatmap, có fallback dữ liệu mẫu hợp lý nếu chưa có lượt nộp nào.
>
> Giữ đúng tông màu dark theme hiện tại của CyberSoft Hub, đảm bảo giao diện hiển thị gọn gàng, không phá vỡ các trang khác."

### Điều tôi hiểu trước khi gọi AI

Phải giữ logic dữ liệu hiện có (dòng nào hiện, dòng nào ẩn). Avatar cần chỗ lưu trên hồ sơ, nên cần thêm API. Biểu đồ hoạt động cần dữ liệu lượt nộp thật, hiện chưa có API tổng hợp theo ngày. Dữ liệu mẫu chỉ là phương án dự phòng và phải được ghi rõ là mẫu.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `ProfilePage.tsx`, `authApi.ts`, `types/auth.ts`, `user.schema.ts`, `auth.service.ts`, `auth.controller.ts`, controller `learner` và các schema nộp bài (`Submission`, `QuizAttempt`, `ContestSubmission`, `DaLabSubmission`, `AiLabSubmission`, `TesterLabSubmission`) để biết trường ngày và trường định danh của từng nguồn.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Avatar:** nhận URL http(s) hoặc ảnh PNG, JPEG, WebP đã thu nhỏ ở trình duyệt; từ chối SVG và giao thức nguy hiểm; giới hạn dưới 100 KB của body JSON mặc định nên không phải nới giới hạn toàn hệ thống.
- **Hoạt động:** `GET /api/learner/activity` cộng lượt nộp từ 6 nguồn theo ngày, chia theo múi giờ của trình duyệt, chỉ trả dữ liệu của chính người gọi, chỉ học viên gọi được.
- **Dữ liệu mẫu:** hiện khi chưa có lượt nộp nào, kèm nhãn "Dữ liệu mẫu"; xác định theo ngày nên không nhấp nháy.
- **Chỉnh sau khi xem ảnh thật:** bản đầu 53 tuần làm các tuần gần nhất (dữ liệu hôm nay) bị cuộn mất, ô quá nhỏ, nhãn thứ lệch hàng và chữ nhãn tháng làm tràn ngang. AI đổi sang 40 tuần (khoảng 9 tháng, ô khoảng 10 px), căn nhãn thứ cố định bên trái, căn nhãn tháng sát mép phải về bên phải và tự cuộn tới tuần mới nhất trên màn hình hẹp.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend avatar | `modules-api/auth/avatar.ts`, `dto/set-avatar.dto.ts`, `auth.service.ts`, `auth.controller.ts`, `user.schema.ts` | `PUT /api/auth/avatar`; hồ sơ trả về có kèm avatar |
| Backend hoạt động | `modules-api/learner-activity/` (`activity-window.ts`, service, controller, module), `app.module.ts` | Gộp theo ngày bằng aggregation, chọn múi giờ, một nguồn lỗi không làm mất biểu đồ |
| Frontend | `pages/ProfilePage.tsx` (viết lại), `components/profile/` (`ActivityHeatmap.tsx`, `heatmapModel.ts`, `AvatarEditor.tsx`, `avatarImage.ts`), `components/UserAvatar.tsx`, `Header.tsx`, `App.tsx`, `types/auth.ts`, `types/learner.ts`, `authApi.ts`, `learnerApi.ts` | Avatar hiển thị cả ở thanh header; giảng viên không có biểu đồ nên trang một cột |
| Test | `avatar.spec.ts`, `learner-activity.service.spec.ts`, 5 test mới trong `auth.service.spec.ts`, `heatmapModel.test.ts`, `avatarImage.test.ts` | Gồm ca đổi giờ chia ngày theo múi giờ, từ chối SVG và `javascript:`, phân quyền |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit -p tsconfig.json`, `npx jest`, `npm run build` ở BE; `npx tsc -b`, `npx vitest run`, `npm run build`, `npx oxlint` ở FE; script `profile.mjs` điều khiển Chrome thật.
- **Kết quả:** BE từ 732 lên 755 test (63 suite); FE từ 60 lên 79 (13 file); typecheck và build sạch; không có cảnh báo lint mới.
- **Kiểm thử bằng trình duyệt thật (học viên tạm, giao diện sáng và tối, ba kích thước):**
  - Không tràn ngang, không thiếu tương phản, ở cả học viên có dữ liệu, học viên không có dữ liệu và giảng viên.
  - Nhập URL `javascript:` bị từ chối; tải ảnh 600x400 được thu nhỏ thành 256x256 JPEG khoảng 6 KB; lưu thành công, avatar hiện ở header, `GET /api/auth/me` trả avatar, ảnh còn sau khi tải lại trang; xóa ảnh thì cả giao diện và máy chủ đều xóa.
  - `GET /api/learner/activity` của học viên có 4 lượt nộp trả đúng 4 lượt trong ngày hôm nay; học viên chưa nộp trả danh sách rỗng; giảng viên bị 403.
  - Đã xoá 13 tài khoản và 16 bài nộp tạm.

**Lỗi AI mắc phải:**
- Hai file `activityHeatmap.ts` và `ActivityHeatmap.tsx` chỉ khác chữ hoa thường, gây xung đột trên Windows (`tsc` báo `TS1149`) và Vite báo trang trắng vì còn nhớ tên file cũ. AI đổi tên file logic thành `heatmapModel.ts` và khởi động lại web dev.
- Biểu đồ 53 tuần bị cắt mất tuần cuối, nhãn thứ lệch hàng và chữ tràn; phát hiện nhờ xem ảnh chụp thật, các test đơn vị không bắt được.
- Test dùng biểu thức tuỳ chọn không dùng kết quả bị `oxlint` cảnh báo; AI viết lại bằng `if`.
- Một test kỳ vọng sai ngày bắt đầu cửa sổ 371 ngày; AI tính lại bằng Node và sửa số trong test.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** tên file chỉ khác chữ hoa thường dễ gây lỗi trên Windows; giao diện dạng lưới phải được xem bằng ảnh chụp thật chứ không chỉ test logic.

**Điều chưa chắc:**
- Ảnh avatar lưu thẳng trong MongoDB dưới dạng chuỗi nhỏ; khi triển khai thật có thể cần kho lưu file riêng.
- DA Lab, AI Lab, Tester Lab gộp theo từng bài nên chỉ tính lần nộp đầu tiên của mỗi bài.

---

## Việc 16: Soạn docs/day24/policy_draft.md

> "Tạo tệp docs/day24/policy_draft.md trình bày bản thảo chính sách giám sát tính trung thực trong học tập và thi đấu cho nền tảng CyberSoft Learning & Contest Hub theo đúng tinh thần Ngày 24: Responsible Analytics, Privacy by Design và Human-in-the-loop.
>
> Yêu cầu định dạng và văn phong:
> - Văn phong rõ ràng, minh bạch, chuyên nghiệp, không dùng từ ngữ tự cao, không dùng emoji, không mở ngoặc đơn giải thích tiếng Anh bừa bãi.
> - Trình bày dạng Markdown với cấu trúc đề mục gãy gọn.
>
> Nội dung bắt buộc bao gồm các phần:
> 1. Mục đích và Phạm vi:
> - Đảm bảo môi trường học tập và thi đấu công bằng cho học viên.
> - Dữ liệu thu thập chỉ phục vụ mục đích hỗ trợ giảng viên nắm bắt tiến độ và xem xét các trường hợp bất thường, không dùng để xếp loại tự động.
>
> 2. Dữ liệu thu thập tối thiểu (Privacy by Design):
> - Dòng thời gian làm bài: Thời điểm bắt đầu, các mốc thời gian lưu mã nguồn thưa, thời điểm nộp bài và thời gian thao tác thực tế.
> - Sự kiện chuyển đổi cửa sổ/tab: Chỉ ghi nhận số lần và tổng thời lượng rời màn hình làm bài ở mức tối thiểu.
> - Độ tương đồng mã nguồn: Tính toán trên mã nguồn bài nộp sau khi đã loại trừ hoàn toàn các đoạn mã khởi tạo mẫu.
> - Cam kết không thu thập: Không quay màn hình, không truy cập webcam/micro, không đọc tiến trình chạy ngầm hay lịch sử duyệt web ngoài phạm vi bài thi.
>
> 3. Nguyên tắc vận hành cốt lõi (Không tự động kết tội):
> - Hệ thống tuyệt đối không tự ý trừ điểm, không hủy kết quả bài làm và không tự động gắn nhãn học viên là gian lận.
> - Mọi cờ cảnh báo (flag) chỉ là tín hiệu tham khảo để đưa bài nộp vào hàng chờ xem xét.
> - Giảng viên là người có thẩm quyền duy nhất đánh giá bối cảnh, đối chiếu mã nguồn và đưa ra kết luận cuối cùng (Human-in-the-loop).
>
> 4. Quy trình xử lý và Quyền giải trình của học viên:
> - Các trường hợp cờ cảnh báo được giảng viên tiếp nhận qua hàng chờ chuyên biệt và đánh giá độc lập.
> - Khi có nghi vấn, giảng viên sẽ trao đổi trực tiếp để học viên giải thích giải thuật hoặc quá trình thực hiện bài làm.
> - Học viên có quyền giải trình rõ ràng và yêu cầu xem xét lại kết quả nếu nhận thấy có sự nhầm lẫn kỹ thuật (false-positive)."

### Điều tôi hiểu trước khi gọi AI

Chính sách phải khớp với những gì hệ thống thật sự làm, không hứa nhiều hơn. Ba nguyên tắc cần xuyên suốt: chỉ thu thập tối thiểu, không tự động kết luận, giảng viên quyết định cuối cùng.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo `docs/day24/policy_draft.md` với 4 phần theo yêu cầu: mục đích và phạm vi; dữ liệu thu thập tối thiểu (kèm bảng cách ghi nhận từng loại dữ liệu và danh sách cam kết không thu thập); nguyên tắc không tự động kết luận (kèm điều kiện đưa bài vào hàng chờ và các trường hợp không bao giờ bị gắn cờ); quy trình xử lý và quyền giải trình. AI thêm mục 5 "Phạm vi triển khai hiện tại và nội dung cần xác định" để không hứa quá khả năng: chưa có chức năng nộp giải trình trực tuyến, học viên chưa tự xem được tín hiệu về mình, thời hạn lưu trữ cần được nhà trường quyết định, các ngưỡng là giá trị khởi đầu.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Cách kiểm tra:** AI đối chiếu từng con số và khẳng định trong tài liệu với mã nguồn (ngưỡng 0,8, 5 lần và 180 giây, tối đa 50 sự kiện, mốc lưu mã không quá 30 giây một mốc, thời điểm nộp luôn do máy chủ ghi, học viên không truy cập được hàng chờ).

**Lỗi AI mắc phải:** viết nhầm "quyền riêng tính" thay cho "quyền riêng tư" ở dòng mở đầu; AI phát hiện khi đọc lại và sửa.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** chính sách nên có một mục ghi rõ những gì chưa làm được để tránh cam kết vượt quá hệ thống.

**Điều chưa chắc:** nếu bản nộp chỉ gồm đúng 4 phần thì phải bỏ mục 5 và bỏ chỗ nhắc quyền giải trình ở mục 4.2, vì hệ thống chưa có chức năng giải trình trực tuyến.

---

## Việc 17: Cập nhật AI Work Log Ngày 24

> "oke ghi đè ai work log làm day24 theo đúng format (quan trọng, ko làm khác), mỗi công việc đều ghi đúng prompt gốc của tôi (tương tự day23)"

### Điều tôi hiểu trước khi gọi AI

Ghi đè nội dung Day 23 bằng Day 24, giữ đúng cấu trúc các ngày trước: bảng thông tin chung, mục lục, rồi mỗi việc có prompt nguyên văn và các mục con. Bản Day 23 vẫn còn trong lịch sử Git.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Ghi đè `AI_WORKLOG.md`. AI đọc lại toàn bộ log Day 23 để lấy đúng khung (tiêu đề, bảng thông tin chung, mục lục, các mục con theo từng việc). Nguyên văn prompt của từng việc được trích từ hội thoại; số liệu test và kết quả kiểm thử lấy từ kết quả chạy thật trong ngày. Với hai prompt có đoạn dán là văn bản do AI viết ở lượt trước (Việc 6), AI chỉ ghi chú nội dung đoạn dán thay vì chép lại.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều chưa chắc:
- Toàn bộ thay đổi Day 24 chưa được commit và chưa mở PR.
- Số 1 chưa trả lời về thời gian bổ sung ba phần còn thiếu của server Day 21; phần nạp dữ liệu tự động từ API chưa viết.
- Mật khẩu ứng dụng Gmail từng hiện trong kết quả một lệnh nên cần được đổi.
