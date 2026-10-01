# Day 21: Tester Lab

Tài liệu mô tả cơ chế nghiệp vụ đã triển khai trong Ngày 21 — phân hệ Tester Lab cho phép học viên xem đề, tải template và fixture, nộp artifact và nhận điểm theo rubric bán tự động, cùng các cơ chế kiểm soát an toàn cho tệp tải lên và phân quyền chấm điểm.

## 1. Nguồn bộ lab và phối hợp với Tester

Bộ lab không do phía nền tảng tự soạn. Toàn bộ nội dung đề được tiếp nhận từ thư mục `Test/Day14_Bo lab tester thuc te` do Tester Trần Quốc Nguyên bàn giao, gồm 12 bài LAB-01 đến LAB-12. Mỗi bài có `TASK.md` (mục tiêu, phạm vi, môi trường demo, artifact phải nộp), `template.csv` (dòng tiêu đề chuẩn của artifact), fixture lỗi có kiểm soát trong `fixtures/buggy/`, và `instructor/LAB-xx_GUIDE.md` chứa rubric 10 điểm.

Hai bên thống nhất chọn 10 trong 12 bài:

| Nhóm | Bài | Artifact nộp |
|---|---|---|
| BUG_REPORT | LAB-01, LAB-02, LAB-09 | `Bug_Report_LAB01.csv`, `Exploratory_Report_LAB02.csv`, `LAB09_Data_Quality_Findings.csv` |
| TEST_CASE_DESIGN | LAB-03, LAB-07, LAB-08, LAB-12 | `Functional_Test_Cases_LAB03.csv`, `LAB07_Data_Check.csv`, `LAB08_Integrity_Report.csv`, `Regression_Summary.csv` |
| API_TESTING | LAB-04, LAB-05, LAB-06 | `LAB04_Auth_API.postman_collection.json`, `LAB05_API_Report.csv`, `LAB06_Negative_API_Report.csv` |

LAB-10 và LAB-11 bị loại vì artifact chính là `login.spec.ts` và `booking.spec.ts`, không thuộc bốn định dạng nền tảng nhận (.csv, .xlsx, .json, .pdf). LAB-12 được giữ lại vì ngoài `regression.spec.ts` còn có `Regression_Summary.csv`, và hệ thống chỉ nhận phần CSV này.

Rubric gốc của Tester được giữ nguyên thang 10 điểm, 5 tiêu chí, mỗi tiêu chí 2 điểm. Phía nền tảng chỉ bổ sung trường `kind` để tách hai nhóm chấm:

| Tiêu chí | Điểm | kind |
|---|---:|---|
| Phạm vi và test design phù hợp | 2 | quality |
| Actual/Expected dựa trên Swagger, UI hoặc rule đã nêu | 2 | quality |
| Evidence tái hiện được | 2 | quality |
| Phân loại severity/result hợp lý | 2 | severity |
| Cleanup/reset và giải thích kết quả | 2 | quality |

Nhóm `severity` gồm tiêu chí đánh giá phân loại bug và kết quả pass/fail. Nhóm `quality` gồm chuẩn trình bày, độ rõ của bước tái hiện và độ bao phủ. Dòng tiêu đề trong `template.csv` của Tester được dùng nguyên văn làm danh sách `requiredColumns` để hệ thống kiểm tra bài nộp. Riêng LAB-04, artifact là Postman collection nên `requiredColumns` là hai khóa gốc `info` và `item`.

## 2. Mô hình dữ liệu và luồng nghiệp vụ

Hai collection Mongoose: `tester_labs` và `tester_lab_submissions`.

- `TesterLab`: `labCode` (duy nhất), `title`, `description`, `category`, `environmentUrl`, `fixtureUrls`, `templateArtifact`, `allowedFileTypes`, `requiredColumns`, `rubricCriteria` (mỗi phần tử gồm `key`, `label`, `maxScore`, `kind`).
- `TesterLabSubmission`: `labId`, `userId`, `artifactUrl`, `fileType`, `fileSize`, `autoCheckResults`, `rubricGrades`, `reviewerNotes`, `reviewerId`, `status` (`SUBMITTED` hoặc `REVIEWED`).

Điểm truy cập, tiền tố `/api/tester-labs`, mọi route đều yêu cầu đăng nhập:

| Route | Vai trò | Mô tả |
|---|---|---|
| `GET /` và `GET /:labCode` | Đã đăng nhập | Danh sách lab và chi tiết một lab |
| `GET /:labCode/files/:name` | Đã đăng nhập | Tải template hoặc fixture đã khai báo trong lab |
| `POST /:labCode/submissions` | STUDENT | Nộp artifact (trường `file`, multipart) |
| `GET /:labCode/submissions/mine` | Đã đăng nhập | Bài nộp của chính người gọi |
| `GET /:labCode/submissions` | TEACHER, ADMIN; STUDENT khi bật peer-review | Bài của người khác cần chấm |
| `GET /submissions/:id/artifact` | Chủ bài, TEACHER, ADMIN | Tải file artifact |
| `PUT /submissions/:id/review` | TEACHER, ADMIN; STUDENT khi bật peer-review | Nhập điểm rubric và nhận xét |

Auto-check cứng chạy ngay khi nộp và chỉ trả về pass/fail kèm thông báo, không tự cho điểm: định dạng có nằm trong `allowedFileTypes` của lab, chữ ký tệp PDF và XLSX, JSON có hợp lệ, và đủ `requiredColumns` (cột tiêu đề của CSV hoặc khóa gốc của JSON). Điểm số chỉ do người chấm nhập. Engine kiểm tra điểm từng tiêu chí nằm trong khoảng 0 đến `maxScore`, từ chối tiêu chí lạ, chấm trùng hoặc chấm thiếu, rồi tổng hợp riêng `severityScore` và `qualityScore` trên tổng 10 điểm. Sau khi lưu, bài chuyển sang `REVIEWED`.

## 3. Cơ chế kiểm soát và an toàn thực thi

**Kiểm tra tệp tải lên.** Giới hạn 5MB, áp dụng ở cả multer và service (kiểm theo `buffer.length` thực tế, không chỉ theo `size` do client khai báo). Tên tệp gốc bị từ chối nếu chứa `/`, `\`, byte NUL hoặc `..`, hoặc có đuôi thực thi ở giữa tên như `shell.php.csv`, `evil.exe.pdf`. MIME-type phải khớp với đuôi. Nội dung được đối chiếu với loại tệp: PDF phải bắt đầu bằng `%PDF`, XLSX bằng `PK\x03\x04`, CSV và JSON không được chứa byte NUL. Tệp được lưu tại `BE/uploads/tester-labs/` với tên UUID sinh ngẫu nhiên; tên gốc không bao giờ tham gia vào đường dẫn ghi đĩa. Thư mục này nằm trong `.gitignore`.

**Phân quyền chấm điểm.** Chỉ TEACHER và ADMIN chấm chính thức. Peer-review của học viên mặc định tắt và chỉ bật bằng biến môi trường `TESTER_LAB_PEER_REVIEW=true`. Khi bật, học viên không nhận `userId`, `artifactUrl` và `reviewerId` của bài người khác. Không ai chấm được bài của chính mình.

**Chống IDOR.** Tải artifact chỉ dành cho chủ bài và người có quyền chấm. Template và fixture chỉ tải được nếu tên nằm trong danh sách của chính lab đó, nên không thể dùng tham số `:name` để đọc tệp tùy ý.

**Tự nạp dữ liệu khi khởi động.** `TesterLabsService.onModuleInit` dùng `bulkWrite` upsert theo `labCode` với `$setOnInsert`: lab nào chưa có thì được chèn, lab đã có không bao giờ bị ghi đè. Khởi động lại nhiều lần không tạo bản ghi trùng và không ảnh hưởng bài nộp đang tham chiếu `labId`.

## 4. Hạn chế về mặt thiết kế (Known Limitations)

**Peer-review chưa có cơ chế phân công.** Khi bật cờ, mọi học viên xem được và chấm được bài của mọi học viên khác (đã ẩn danh), không có bước gán người chấm cho từng bài. Cờ chỉ là công tắc bật tắt toàn hệ thống.

**Auto-check không đọc được nội dung XLSX và PDF.** Với hai định dạng này hệ thống chỉ kiểm tra chữ ký tệp, không kiểm tra được cột bắt buộc vì không có thư viện đọc trong dự án. Chỉ CSV và JSON có kiểm tra cột.

**CSV mã hóa UTF-16 bị từ chối.** Do quy tắc không chứa byte NUL, tệp CSV lưu dưới dạng "Unicode text" của Excel bị từ chối; học viên phải lưu dưới dạng UTF-8.

**Tệp lưu trên đĩa cục bộ của máy chủ.** Chưa có lưu trữ ngoài. Khi chạy nhiều bản sao backend hoặc triển khai lại trên máy khác, tệp đã nộp không đi theo.

**Ghi tệp trước khi ghi bản ghi.** Nếu bước ghi bản ghi vào cơ sở dữ liệu thất bại sau khi tệp đã lưu xuống đĩa, tệp trở thành tệp mồ côi. Chưa có bước dọn.

**Giao diện chấm điểm chỉ ở trang chi tiết lab.** Chưa có trang tổng hợp bài chờ chấm xuyên nhiều lab cho giảng viên.

## 5. Các điểm nghi vấn và lỗi tiềm ẩn cần xử lý tiếp

**Đã xử lý trong ngày (phát hiện khi rà soát chéo).** Bản triển khai đầu tiên cho phép mọi người dùng đã đăng nhập xem danh sách bài của người khác và tải artifact của họ, đồng thời cho học viên chấm điểm. Đã siết lại như mô tả ở mục 3 và có kiểm thử riêng cho từng trường hợp (học viên bị từ chối khi tắt peer-review, không tải được bài người khác, chủ bài và giảng viên tải được, không tự chấm bài của mình, ẩn trường nhạy cảm khi peer-review).

**Đã xử lý ngoài phạm vi Tester Lab.** Khi xóa một lesson coding, `deleteLesson` trước đây xóa exercise theo `slug`. Nếu slug của exercise đã bị hậu tố do trùng với bài AI Tạo Đề, thao tác này xóa nhầm bài của nguồn khác và để lại bản đồng bộ mồ côi. Nay chỉ xóa exercise có `sourceLessonSlug` khớp lesson bị xóa.

**Còn tồn đọng, chưa xử lý vì sẽ đổi hành vi sẵn có.** Lesson coding đã xuất bản rồi chuyển về nháp vẫn để lại bản exercise trong Code Playground. Lesson đổi slug để lại exercise ở slug cũ thành bản mồ côi. Cả hai đều nằm ở cơ chế đồng bộ Lesson sang Exercise của Ngày 19 và 20.

**Chưa kiểm chứng trên môi trường thật.** Kịch bản một học viên tải bài của học viên khác chỉ được xác minh bằng kiểm thử đơn vị, chưa chạy trên máy chủ thật do thiếu tài khoản học viên thứ hai có mật khẩu đã biết. Giao diện mới chưa được mở lại trên trình duyệt sau đợt siết phân quyền.
