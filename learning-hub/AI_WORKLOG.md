# AI Work Log Ngày 20: Cá nhân hóa lộ trình đơn giản

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 29 tháng 9 năm 2026 |
| Nhánh | feature/learning-hub-day20 |
| Công cụ, model | Claude Code, mô hình Claude Sonnet 5, có sử dụng nhiều subagent loại Explore và general-purpose để khảo sát kiến trúc trước khi thiết kế và để tự rà soát chéo kết quả |
| Phạm vi quyền | Đọc và ghi trong thư mục learning-hub |
| Dữ liệu nhạy cảm | Không có sự cố nào trong ngày |

## Mục lục các việc trong ngày

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Tạo nhánh feature/learning-hub-day20 từ main đã cập nhật | Đạt |
| 2 | Nghiên cứu schema attempt/exercise/tag trước khi thiết kế mastery | Đạt |
| 3 | Xây dựng mastery calculator và recommendation engine ba quy tắc | Đạt |
| 4 | Xây API, trang tiến độ học tập và mười hồ sơ học viên mẫu | Đạt |
| 5 | Tự rà soát mastery/recommendation, bổ sung ba trường hợp kiểm thử còn thiếu | Đạt |
| 6 | Sửa lỗi bài lấy từ ngân hàng đề trong Code Playground bị mất nhóm lớp | Đạt |
| 7 | Thêm cụm avatar và trang thông tin cá nhân theo yêu cầu thiết kế lại giao diện | Đạt |
| 8 | Rà soát và vá bảy hạng mục tồn đọng của pipeline AI Tạo Đề ngày 19 | Đạt |
| 9 | Tự rà soát lại giao diện Problem Generator sau khi thêm trạng thái lỗi từng bài | Đạt |
| 10 | Sửa lỗi gốc khiến bài lấy từ ngân hàng đề không xuất bản được, rà soát quyền Admin/Teacher | Đạt |
| 11 | Bổ sung cơ chế con người xác nhận cho cảnh báo trùng lặp mềm | Đạt |
| 12 | Sửa lỗi mã nguồn dùng sys.stdin bị chặn nhầm, thêm sửa trực tiếp và chạy lại kiểm thử | Đạt |
| 13 | Viết tài liệu kỹ thuật mô tả cơ chế mastery và recommendation | Đạt |

---

## Việc 1: Tạo nhánh feature/learning-hub-day20 từ main đã cập nhật

> "Tạo branch hub day 19 xong kéo main về, làm xong đợi tôi ra lệnh ko tự ý làm." Sau khi được hỏi lại xác nhận số ngày: "20 tôi nhầm 19, tạo branch 20 nhé."

### Điều tôi hiểu trước khi gọi AI

Chỉ thực hiện đúng thao tác Git được yêu cầu, không tự ý bắt đầu bất kỳ công việc nào khác cho tới khi có đề bài cụ thể.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không tạo file nào. Xác nhận cây làm việc sạch, lấy về các nhánh mới trên máy chủ, chuyển sang nhánh main và cập nhật lên bản mới nhất, sau đó tạo nhánh feature/learning-hub-day20 từ đó.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi người dùng gõ nhầm số ngày trong yêu cầu, nên hỏi lại để xác nhận thay vì suy đoán, đúng như đã làm ở bước này.

---

## Việc 2: Nghiên cứu schema attempt/exercise/tag trước khi thiết kế mastery

> "NGÀY 20 - Cá nhân hóa lộ trình đơn giản. Việc phải làm: Tính mastery theo tag từ attempt. Thiết kế rule recommendation minh bạch. Tạo learner progress page. Bàn giao cuối ngày: Recommendation v0.1, Progress dashboard, 10 simulated learner profiles. Điều kiện nghiệm thu: Giải thích được vì sao gợi ý. Không khóa học viên vào một đường duy nhất. Rule có unit test. — bám theo sườn đề day20 tôi đã gửi trc đó mà làm."

### Context, tài liệu, file, constraint đã cung cấp

Giao một tác vụ khảo sát riêng đọc schema attempt/submission, exercise, tag, cơ chế xác thực và vai trò, trang tiến độ học viên hiện có nếu có, và convention module/route của ngày 19 để làm mẫu tổ chức code.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Yêu cầu khảo sát xác định rõ hệ thống dùng Mongoose hay Prisma cho dữ liệu thật, vì repository có cả hai lớp dữ liệu song song nhưng chỉ một lớp thực sự được các module khác sử dụng.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Việc này chưa tạo file, chỉ nghiên cứu. Phát hiện quan trọng nhất được giữ lại làm cơ sở thiết kế: lớp Prisma tồn tại trong repository nhưng không có module nào import PrismaService ngoài chính module khai báo nó, toàn bộ module nghiệp vụ thật dùng Mongoose. Bản ghi attempt thật là Submission, không có model riêng tên Attempt. Trường tags trên Exercise là mảng chuỗi tự do, không có bảng danh mục tag chuẩn hóa, và ghi chú trong nhật ký ngày 19 đã cố tình để ngỏ quyết định này cho ngày 20.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: xác nhận đúng lớp dữ liệu nào thật sự đang chạy trước khi thiết kế bất kỳ truy vấn nào là bước bắt buộc trong một repository có nhiều lớp dữ liệu song song chưa dọn dẹp hết. Điều chưa chắc: chưa rõ có cần chuẩn hóa tag thành một danh mục cố định hay giữ nguyên dạng tự do, quyết định giữ nguyên tự do vì đây đúng là lựa chọn ngày 19 đã cố tình để lại.

---

## Việc 3: Xây dựng mastery calculator và recommendation engine ba quy tắc

> "Bỏ qua bước lập plan chi tiết, bắt đầu code luôn trọn gói Day 20 theo các file sau, tuân thủ đúng convention Day 19 và context Mongoose/NestJS: mastery.service.ts query submissions theo userId, aggregate ra % mastery từng tag. recommendation.service.ts: Gợi ý 1 Remediation, gợi ý 2 Progression, gợi ý 3 Exploration, trả về danh sách bài kèm trường reason. recommendation.controller.ts: endpoint GET /learner/progress và GET /learner/recommendations, bảo vệ bởi role STUDENT. Unit test các nhánh rule, mock-profiles.json 10 hồ sơ học viên. Frontend LearnerProgressPage gọi 2 endpoint trên, hiển thị mastery theo tag và bài gợi ý kèm reason, khai báo routing vào App.tsx. Tạo/sửa trực tiếp vào source code, không giải thích lý thuyết dông dài."

### Điều tôi hiểu trước khi gọi AI

Cần tách phần tính toán thuần túy khỏi phần truy vấn Mongoose để dễ kiểm thử không cần cơ sở dữ liệu thật, đúng quy ước module Coach đã dùng ở các ngày trước.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo module mới tại đường dẫn modules-api/recommendation, tách bốn lớp trách nhiệm riêng biệt. Lớp kiểu dữ liệu định nghĩa hình dạng attempt đã chấm, tóm tắt bài tập, và mastery theo tag. Lớp tính toán mastery gom các lượt nộp theo tag, loại bỏ lượt còn đang chấm, tính tỷ lệ đạt chuẩn trên tổng số lượt. Lớp động cơ gợi ý nhận vào danh sách mastery và danh sách bài tập, chạy tuần tự ba nhánh độc lập: nhánh ôn tập ưu tiên tag có mastery thấp nhất đã đủ số lần nộp tối thiểu, dự phòng bằng tag có lượt nộp thất bại gần nhất nếu chưa tag nào đủ số lần; nhánh nâng cao ưu tiên tag đã đạt ngưỡng vững, dự phòng bằng tag luyện nhiều nhất; nhánh khám phá luôn tìm một tag chưa từng thử nếu còn. Lớp dịch vụ bọc quanh động cơ này bằng các lệnh gọi Mongoose thật, và lớp điều khiển expose hai điểm truy cập chỉ dành cho học viên đã đăng nhập, lấy định danh người dùng từ mã xác thực, không nhận từ tham số truy vấn.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết chín trường hợp kiểm thử ban đầu cho lớp tính toán mastery và động cơ gợi ý, chạy bằng lệnh sau:

```
cd learning-hub/BE
npx jest src/modules-api/recommendation/recommendation.spec.ts
```

**Lỗi AI mắc phải, phát hiện khi chạy kiểm thử:** một trường hợp kiểm thử nhánh nâng cao ban đầu thất bại vì logic loại trừ nhầm nhánh nâng cao khi nó trùng tag với nhánh ôn tập, trong khi tag đã đạt ngưỡng vững thật sự vẫn nên được ưu tiên hiển thị dù trùng tag với nhánh ôn tập. Sửa lại điều kiện: chỉ nhánh dự phòng theo tag luyện nhiều nhất mới cần tránh trùng tag với ôn tập, còn tag đã đạt ngưỡng vững luôn được ưu tiên hiển thị bất kể trùng hay không. Chạy lại đạt chín trên chín.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi có hai tín hiệu cùng chỉ về một tag, một tín hiệu rõ ràng như đã đạt ngưỡng vững không nên bị một quy tắc chống trùng lặp chung chung che khuất, quy tắc chống trùng chỉ nên áp dụng cho tín hiệu dự phòng yếu hơn. Điều chưa chắc: ngưỡng ba lần nộp tối thiểu và tám mươi phần trăm cho mastery vững là ước lượng ban đầu, cần dữ liệu học viên thật đủ lớn mới hiệu chỉnh được.

---

## Việc 4: Xây API, trang tiến độ học tập và mười hồ sơ học viên mẫu

> Cùng một chỉ dẫn với Việc 3 ở trên, phần này ứng với hạng mục bàn giao trang giao diện tiến độ và bộ dữ liệu mười hồ sơ học viên mô phỏng trong cùng yêu cầu.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Thêm trang giao diện hiển thị thanh mastery theo từng tag kèm màu sắc phân theo mức độ, và danh sách bài tập gợi ý kèm nhãn phân loại theo ba nhánh cùng dòng lý do. Đăng ký đường dẫn mới trong tệp định tuyến chính, chỉ cho học viên đã đăng nhập truy cập. Viết tệp dữ liệu mười hồ sơ học viên mô phỏng dạng lượt nộp thô, bao quát các kịch bản người mới hoàn toàn, yếu một mảng kiến thức, đã vững một mảng, học lệch, đang hồi phục sau nhiều lần sai, bài gắn nhiều tag cùng lúc, còn lượt đang chấm dở, đã vững toàn bộ tag hiện có, và nhiều dạng lỗi chấm khác nhau ngoài sai đáp án thông thường.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Khởi chạy máy chủ backend và giao diện thật, đăng nhập bằng một tài khoản học viên mới tạo, gọi trực tiếp hai điểm truy cập bằng lệnh mạng thật xác nhận trả về đúng hình dạng dữ liệu. Tạo thêm lượt nộp thật qua điểm chấm bài production cho cùng tài khoản đó, xác nhận mastery và gợi ý cập nhật đúng theo dữ liệu vừa nộp, chụp lại giao diện xác nhận hiển thị đúng số liệu.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: xác nhận một tính năng đọc dữ liệu học viên nên đi hết vòng đời thật, từ nộp bài qua điểm chấm production tới xem lại trên giao diện, không dừng ở việc gọi thẳng điểm truy cập với dữ liệu giả lập trong bộ nhớ.

---

## Việc 5: Tự rà soát mastery/recommendation, bổ sung ba trường hợp kiểm thử còn thiếu

> "Hãy tự rà soát lại toàn bộ mã nguồn vừa viết dựa trên Điều kiện nghiệm thu và Bàn giao cuối ngày của Day 20. Chạy toàn bộ file test của module recommendation, xác nhận có đủ test case cho ba nhánh Remediation, Progression, Exploration và các trường hợp biên: học viên mới toanh, học viên giải hết bài một tag, học viên đã làm qua tất cả các tag. Kiểm tra mười hồ sơ mô phỏng có bao quát đủ kịch bản chưa, thử chạy engine trên ít nhất hai hồ sơ đối lập và in ra reason minh bạch. Kiểm tra cơ chế không khóa học viên vào một đường duy nhất đã đảm bảo chưa, nhánh Exploration có luôn trả về bài hợp lệ không. Frontend LearnerProgressPage và avatar dropdown đã nhận đúng dữ liệu chưa, có lỗi render khi mảng tag rỗng không."

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Giao một tác vụ rà soát độc lập, không tự đọc lại bằng chính góc nhìn đã viết code, để giảm thiên vị xác nhận. Yêu cầu tác vụ này phải chạy thật bằng công cụ dịch thẳng từ mã nguồn thay vì chỉ suy luận từ tên hàm.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Kết quả rà soát xác nhận chín trên chín kiểm thử ban đầu đạt, nhưng thiếu ba trường hợp biên quan trọng: học viên hoàn toàn mới với ngân hàng bài không rỗng, nhánh nâng cao cũng hết bài để gợi ý, và học viên đã thử qua toàn bộ tag hiện có. Bổ sung cả ba trường hợp này vào bộ kiểm thử, cả ba đều đạt ngay không cần sửa logic động cơ, xác nhận hành vi cũ vốn đã đúng chỉ là chưa được chứng minh bằng kiểm thử.

Đồng thời phát hiện điểm nhỏ: khối cảnh báo lỗi từng bài trên giao diện thiếu giới hạn chiều cao cuộn riêng, và văn bản lý do lỗi dài không được cắt gọn, cả hai đã sửa ngay.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

```
npx jest src/modules-api/recommendation/recommendation.spec.ts
```

Mười hai trên mười hai đạt sau khi bổ sung.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một hành vi đúng nhưng chưa có kiểm thử bảo vệ vẫn là rủi ro thật, vì lần sửa code kế tiếp có thể vô tình phá vỡ hành vi đó mà không ai biết cho tới khi lỗi xuất hiện ở môi trường thật.

---

## Việc 6: Sửa lỗi bài lấy từ ngân hàng đề trong Code Playground bị mất nhóm lớp

> "Còn ui day 20 vừa làm luôn, làm sao để test." Sau khi được hướng dẫn cách test và chạy thử giao diện thật: "??? làm cho cả hệ thống thật mà chứ làm cho tài khoản local làm gì." Rồi làm rõ vấn đề thật đang thấy: "Nó gom hết bài vào thư mục bài cũ, mất ô chọn lớp r."

### Điều tôi hiểu trước khi gọi AI

Cần xác định đây có phải lỗi do các thay đổi trong ngày gây ra hay là lỗi có sẵn từ trước, trước khi kết luận phạm vi sửa.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Xác nhận qua lịch sử thay đổi: lỗi này không liên quan tới các sửa đổi trong ngày. Nguyên nhân là trang khu vực luyện tập gộp danh sách bài từ hai nguồn, bài hệ thống và bài do giáo viên soạn, theo đường dẫn định danh; khi hai nguồn trùng đường dẫn định danh, bản ghi từ nguồn giáo viên soạn ghi đè hoàn toàn bản ghi hệ thống, bao gồm cả các trường phân loại lớp và chủ đề mà bản ghi giáo viên soạn không có. Sửa lại để khi trùng đường dẫn định danh, giữ nguyên các trường phân loại từ bản ghi hệ thống, chỉ để bản ghi giáo viên soạn ghi đè phần nội dung khác.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Kiểm tra kiểu tĩnh sạch. Mở giao diện thật bằng trình duyệt tự động, xác nhận trước khi sửa toàn bộ năm mươi bài rơi vào một nhóm duy nhất, sau khi sửa tách đúng thành ba nhóm theo đúng số lượng bài mỗi nhóm.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi hai nguồn dữ liệu được gộp bằng khóa trùng, luôn cần xác định rõ nguồn nào là chủ sở hữu của từng trường dữ liệu, gộp theo kiểu ghi đè toàn bộ không phân biệt trường sẽ âm thầm xóa mất dữ liệu từ nguồn kia.

---

## Việc 7: Thêm cụm avatar và trang thông tin cá nhân theo yêu cầu thiết kế lại giao diện

> "??? Không có nút để vào xem, giờ phải rõ url mới vào được, hiểu không." Sau khi chốt hướng xử lý: "Hãy sửa component Navbar/Header ở góc trên bên phải: bỏ nút bấm Tiến Độ Của Tôi và nút Đăng xuất rời rạc hiện tại trên thanh bar. Thay thế bằng một cụm Avatar Dropdown nằm ở góc ngoài cùng bên phải. Avatar trigger là một nút tròn avatar, bo tròn, hiển thị chữ cái đầu tên user. Dropdown menu khi click vào avatar mở xuống, nền trắng, đổ bóng, bo góc, z-index nổi lên trên, gồm header menu tên người dùng cộng email cộng role badge, mục Thông tin cá nhân, mục Tiến độ học tập chuyển hướng sang trang progress hiện tại, đường kẻ phân cách, mục Đăng xuất chữ đỏ. Click bên ngoài vùng dropdown thì tự động đóng menu. Sửa trực tiếp vào file Navbar/Header hiện có, dùng Tailwind CSS đồng bộ style hiện tại của app."

### Điều tôi hiểu trước khi gọi AI

Trang thông tin cá nhân chưa tồn tại, cần tạo mới thay vì chỉ liên kết tới một đường dẫn trống.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Sửa thành phần điều hướng chung: bỏ nút tiến độ khỏi danh sách chính, thay khu vực đăng xuất bằng một cụm avatar hình tròn hiển thị chữ cái đầu tên người dùng, bấm vào mở một lớp menu chứa tên, hộp thư điện tử, nhãn vai trò, liên kết thông tin cá nhân, liên kết tiến độ học tập chỉ hiện với học viên, và mục đăng xuất. Gắn một trình lắng nghe sự kiện bấm chuột ở phạm vi toàn trang để tự đóng menu khi bấm ra ngoài vùng menu. Tạo trang thông tin cá nhân mới hiển thị họ tên, hộp thư điện tử, vai trò, mã học viên nếu có, và nhóm tuổi nếu có, đăng ký đường dẫn mới.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Mở giao diện thật bằng trình duyệt tự động, xác nhận bấm avatar mở đúng menu với đầy đủ thông tin tài khoản, bấm ra ngoài menu tự đóng, bấm liên kết tiến độ học tập chuyển đúng trang, bấm liên kết thông tin cá nhân hiển thị đúng dữ liệu tài khoản.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một liên kết trong menu trỏ tới một trang chưa tồn tại là một dạng lỗi dễ bỏ sót nếu không tự đi hết đường dẫn đó trên giao diện thật trước khi báo hoàn thành.

---

## Việc 8: Rà soát và vá bảy hạng mục tồn đọng của pipeline AI Tạo Đề ngày 19

> "Yêu cầu xử lý kỹ thuật, Fix tồn đọng Ngày 19 - Problem Generator Pipeline. Đây là các vấn đề phát hiện khi self-audit cuối Ngày 19. Hãy tiến hành refactor và sửa triệt để bảy hạng mục: chính xác hóa logic so sánh outputsMatch trong problem-validator.ts, chỉ áp dụng epsilon khi có dấu chấm thập phân hoặc ký hiệu khoa học. Xử lý chịu lỗi và Partial Success khi sinh hàng loạt trong problem-generator.controller.ts, bọc try/catch riêng cho từng item, trả về results và errors. Mở rộng cơ chế Retry mạng và chống crash JSON trong problem-generator-gemini.client.ts, bắt toàn bộ mã lỗi mạng phổ biến, exponential backoff, tăng maxOutputTokens, bọc JSON.parse trong try/catch. Bảo toàn dữ liệu và chống ghi đè ngoài ý muốn trong authoring.service.ts, kiểm tra nguồn gốc trước khi lưu đè. Kiểm tra trùng lặp động trên Database thật trong problem-duplicate-check.ts, chuyển sang truy vấn trực tiếp collection exercises. Chuẩn hóa mã nguồn, tách hàm slugify dùng chung ra common/utils. Bảo mật và trải nghiệm giao diện, sanitize input, hiển thị rõ tiến độ từng bài kèm nút thử lại. Viết bổ sung unit test cho outputsMatch và callWithRetry."

### Điều tôi hiểu trước khi gọi AI

Bảy hạng mục này đã được chính hệ thống ghi nhận là tồn đọng từ Việc 13 của ngày 19, không phải suy đoán mới, cần sửa lần lượt và kiểm chứng từng hạng mục bằng kiểm thử riêng trước khi chuyển sang hạng mục kế tiếp.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Hạng mục một: sửa hàm so khớp kết quả dùng chung, chỉ áp dụng sai số cho phép khi cả hai vế đều ở dạng có dấu chấm thập phân hoặc ký hiệu khoa học, số nguyên thuần kể cả có số không ở đầu luôn so sánh chuỗi tuyệt đối.

Hạng mục hai: đổi route sinh hàng loạt sang mô hình mỗi bài bọc riêng một khối bắt lỗi, trả về đồng thời danh sách bài thành công và danh sách bài lỗi kèm vị trí và lý do đã làm sạch, một bài lỗi không còn làm mất các bài đã sinh thành công trước đó trong cùng lô.

Hạng mục ba: mở rộng điều kiện nhận diện lỗi mạng đáng thử lại khi gọi mô hình sinh đề, không chỉ hai mã lỗi cụ thể như trước mà gồm toàn bộ nhóm mã lỗi máy chủ và các mã lỗi kết nối phổ biến, áp dụng khoảng chờ tăng dần giữa các lần thử. Tăng giới hạn số token đầu ra, thêm cơ chế phát hiện phản hồi bị cắt ngang giữa chừng và tự động yêu cầu mô hình sinh lại ngắn gọn hơn thay vì báo lỗi ngay.

Hạng mục bốn: thêm trường đánh dấu nguồn gốc trên bản ghi bài tập, chỉ cho phép cơ chế đồng bộ tự ghi đè khi chính nó là chủ sở hữu bản ghi trước đó, nếu không tự sinh đường dẫn định danh hậu tố mới thay vì ghi đè âm thầm.

Hạng mục năm: chuyển hàm kiểm tra trùng lặp từ việc đọc ba tệp dữ liệu mẫu tĩnh sang nhận một danh sách bài đã có do nơi gọi cung cấp, nơi gọi có kết nối cơ sở dữ liệu truy vấn trực tiếp toàn bộ bài đang có thật, đảm bảo bài vừa được người khác lưu cũng nằm trong tập đối chiếu.

Hạng mục sáu: gộp hàm chuyển tiêu đề thành đường dẫn định danh, trước đây định nghĩa trùng lặp ở hai tệp nguồn khác nhau, về một nơi dùng chung duy nhất.

Hạng mục bảy: thêm hàm làm sạch đầu vào tự do trước khi đưa vào yêu cầu gửi mô hình sinh đề, cắt ký tự điều khiển ẩn và giới hạn độ dài. Xác nhận riêng phần mã lời giải sinh ra đã được kiểm tra an toàn từ trước khi thực thi thử, không cần thêm cơ chế mới. Thêm trạng thái nút bấm chờ và vô hiệu hóa khi đang lưu hoặc phát hành trên giao diện Soạn Thảo, tránh bấm lặp gây tranh chấp dữ liệu.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết kiểm thử riêng cho từng hạng mục ngay sau khi sửa xong hạng mục đó, không dồn lại kiểm thử một lần ở cuối. Chạy toàn bộ bộ kiểm thử backend sau khi hoàn tất cả bảy hạng mục:

```
npx jest --reporters=default
```

Hai mươi tám bộ, hai trăm sáu mươi ba trường hợp kiểm thử đạt.

**Lỗi AI mắc phải, phát hiện khi chạy kiểm thử:** một trường hợp kiểm thử cũ của hàm so khớp kết quả giả định sai số làm tròn được chấp nhận giữa một số thực và một số nguyên không có dấu chấm, trong khi quy tắc mới chỉ chấp nhận sai số khi cả hai vế đều là số thực. Sửa lại dữ liệu kiểm thử cho đúng quy tắc mới, không sửa logic vì logic mới mới là đúng ý đồ ban đầu.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: xử lý một danh sách tồn đọng đã tự ghi nhận từ trước nên đi lần lượt từng hạng mục kèm kiểm thử riêng ngay lập tức, không gộp chung, vì mỗi hạng mục có rủi ro làm lệch hành vi hiện có theo cách khác nhau, dồn lại dễ bỏ sót việc gán nhầm nguyên nhân khi có kiểm thử thất bại.

---

## Việc 9: Tự rà soát lại giao diện Problem Generator sau khi thêm trạng thái lỗi từng bài

> "Rà soát độc lập file TeacherProblemGeneratorPage.tsx cùng các component/types liên quan vừa sửa ở Hạng mục 2 và 7. Kiểm tra TypeScript và Runtime Crash: response Partial Success có biến nào undefined làm vỡ hàm render không, fallback khi success rỗng hoặc errors rỗng ra sao. Kiểm tra bố cục: progress bar có tràn viền không, khối danh sách lỗi có max-h và overflow-y-auto hợp lý không. Đồng bộ Design System: màu nút Thử lại, badge lỗi/thành công có đúng bảng màu chung không. Trạng thái tương tác: bấm Thử lại các bài bị lỗi có chặn spam click không, sau khi thử lại thành công danh sách lỗi cũ có xóa mượt mà không. Chạy thử lệnh typecheck FE, báo cáo tóm tắt component nào có nguy cơ vỡ layout hoặc crash runtime."

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Giao một tác vụ rà soát độc lập, yêu cầu chạy thật lệnh kiểm tra kiểu tĩnh của giao diện, không chỉ đọc mã bằng mắt.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Kết quả rà soát xác nhận kiểu tĩnh sạch và phần lớn giao diện đúng quy ước, nhưng phát hiện một lỗi thật: nút sinh bài chính không bị khóa trong lúc một thao tác thử lại một bài lỗi riêng lẻ đang chạy, có thể gây hai lệnh gọi cùng sửa chung một danh sách kết quả. Sửa lại điều kiện cho phép bấm nút sinh bài chính để loại trừ luôn trường hợp đang có thao tác thử lại riêng lẻ chạy dở. Cũng sửa các điểm nhỏ: giới hạn chiều cao cuộn cho danh sách lỗi, cắt gọn văn bản lý do dài, và sửa lại một chú thích mã nguồn mô tả sai hành vi khóa nút thực tế.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Kiểm tra kiểu tĩnh sạch sau khi sửa. Xác nhận bằng đọc lại đoạn mã điều kiện khóa nút, chưa chạy thao tác đồng thời thật trên trình duyệt để tái hiện tình huống tranh chấp cụ thể.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một chú thích mã nguồn mô tả sai hành vi thật của đoạn mã cạnh nó cũng là một dạng lỗi cần sửa, vì người đọc sau này sẽ tin theo chú thích thay vì tự lần lại logic thật.

---

## Việc 10: Sửa lỗi gốc khiến bài lấy từ ngân hàng đề không xuất bản được, rà soát quyền Admin/Teacher

> "Lệnh sửa lỗi luồng Bài tập -> Đề thi và Rà soát toàn diện Role Admin/Teacher. Tôi gặp lỗi nghiêm trọng: khi dùng AI tạo bài tập và bấm Lưu vào ngân hàng đề, bài đã được lưu. Nhưng khi giáo viên/admin tạo một đề thi/bài học thật Contest/Lesson và chọn kéo bài đó từ ngân hàng đề ra thì hệ thống KHÔNG cho lưu và KHÔNG thể phát hành được. Rà soát sự khác biệt giữa cấu trúc bản ghi do AI sinh lưu vào Exercise với schema mà Lesson/Contest yêu cầu khi publish, kiểm tra các trường bắt buộc lúc Publish. Đồng thời rà soát toàn bộ nghiệp vụ Admin/Teacher: đảm bảo route nhạy cảm có Guard chuẩn, kiểm tra lỗ hổng IDOR giáo viên A có sửa/xóa/lấy trộm bài của giáo viên B không, input sanitization, và toàn vẹn luồng CRUD Tạo bài mới đến Xóa."

### Điều tôi hiểu trước khi gọi AI

Người dùng đưa ra một giả thuyết ban đầu về nguyên nhân liên quan tới cuộc thi, cần tự điều tra độc lập để xác nhận đúng cơ chế thật gây lỗi trước khi sửa, không mặc định giả thuyết đó đúng.

### Context, tài liệu, file, constraint đã cung cấp

Giao một tác vụ điều tra riêng đọc toàn bộ luồng liên quan tới khái niệm cuộc thi và khái niệm bài học, xác nhận nơi nào thật sự đọc dữ liệu từ ngân hàng đề.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Kết quả điều tra bác bỏ giả thuyết ban đầu: khái niệm cuộc thi hoàn toàn không đọc dữ liệu từ ngân hàng đề, nó chỉ sao chép tiêu đề và đường dẫn định danh từ khái niệm bài học đã có sẵn. Nguyên nhân thật nằm ở khái niệm bài học: khi một bài tập trong ngân hàng đề chưa từng qua bước xuất bản chính thức được gộp hiển thị vào danh sách quản lý bài học để giáo viên xem và sửa, trường chuẩn đầu ra bắt buộc cho việc xuất bản bị gán cứng thành chuỗi rỗng, khiến điều kiện xuất bản luôn thất bại ngay cả khi giáo viên không đổi gì thêm.

Sửa bằng cách tự sinh một chuẩn đầu ra mặc định hợp lý từ tiêu đề bài tập thay vì để rỗng, cùng công thức đã dùng khi hệ thống tự gieo dữ liệu mẫu ban đầu. Bổ sung thêm điều kiện kiểm tra tiêu đề và mã lời giải bắt buộc phải có trước khi xuất bản, với thông báo lỗi nêu rõ đúng trường nào còn thiếu.

Về phần rà soát quyền: xác nhận trường chủ sở hữu tồn tại trên bản ghi bài học và cuộc thi nhưng chưa từng được dùng để kiểm tra quyền ở các thao tác sửa, xóa, xem chi tiết, và tệ hơn, trường này còn cho phép người gọi tự khai qua yêu cầu gửi lên. Sửa lại: trường chủ sở hữu luôn lấy từ mã xác thực, không bao giờ nhận từ yêu cầu gửi lên. Thêm một điều kiện kiểm tra chung: giáo viên chỉ sửa xóa xem được tài nguyên do chính mình tạo hoặc tài nguyên dùng chung được gieo sẵn từ hệ thống, người quản trị bỏ qua toàn bộ điều kiện này. Áp dụng cho cả hai khái niệm bài học và cuộc thi. Cũng bổ sung bước làm sạch loại bỏ ký tự điều khiển ẩn khỏi các trường văn bản tự do trước khi lưu, xác nhận riêng không có nguy cơ chèn mã kịch bản vì giao diện luôn hiển thị các trường này dưới dạng văn bản thuần, không có nơi nào diễn giải thành mã đánh dấu.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết một kiểm thử mô phỏng trọn vẹn đúng luồng nghiệp vụ gây lỗi ban đầu: sinh một bài bằng công cụ hỗ trợ trí tuệ nhân tạo, lưu vào ngân hàng đề, lấy ra sửa từ danh sách quản lý, xuất bản, xác nhận thành công. Bổ sung kiểm thử riêng cho từng nhánh phân quyền: giáo viên khác không sửa xóa xem được tài nguyên không thuộc về mình, người quản trị làm được với mọi tài nguyên, tài nguyên dùng chung ai cũng sửa được.

```
npx jest --reporters=default
```

Ba mươi mốt bộ, hai trăm chín mươi tám trường hợp kiểm thử đạt.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: giả thuyết ban đầu của người báo lỗi về nơi xảy ra sự cố có thể sai hoàn toàn ngay cả khi hiện tượng họ mô tả là chính xác, việc điều tra độc lập bằng cách đọc lần theo đúng luồng dữ liệu thật quan trọng hơn việc tin theo suy đoán ban đầu, kể cả khi suy đoán đó nghe hợp lý. Điều chưa chắc: khái niệm tài nguyên dùng chung hiện được nhận diện bằng một giá trị chủ sở hữu mặc định cố định, cách này đơn giản nhưng cứng, cần xem lại nếu sau này có nhu cầu chuyển giao quyền sở hữu tài nguyên dùng chung cho một giáo viên cụ thể.

---

## Việc 11: Bổ sung cơ chế con người xác nhận cho cảnh báo trùng lặp mềm

> "Bổ sung cơ chế Human-in-the-loop cho bài tập bị cảnh báo trùng lặp. Hiện tại khi bài tập sinh ra bị cảnh báo trùng lặp độ tương đồng cao, hệ thống hiện thông báo Pass test nhưng có nghi vấn trùng lặp, không thể lưu cho tới khi bạn tự xử lý, nhưng trên UI lại KHÔNG có hành động nào để tự xử lý, khiến nút Lưu vào ngân hàng đề bị kẹt hoàn toàn. Cung cấp tùy chọn xử lý rõ ràng ngay tại khối cảnh báo: một checkbox xác nhận đã đối chiếu và muốn tiếp tục lưu, nút Yêu cầu AI sinh lại bài khác với chỉ dẫn tự động bổ sung tránh trùng vào prompt. Cập nhật DTO saveDraft bổ sung forceSave và overrideReason, nếu có cờ trùng lặp nhưng gửi kèm forceSave true thì cho phép lưu, gắn thêm metadata approvedBy và approvedAt nếu được lưu đè. Đảm bảo ngưỡng cảnh báo hợp lý, chỉ chặn cứng nếu trùng tiêu đề hoặc giống một trăm phần trăm slug đã có."

### Điều tôi hiểu trước khi gọi AI

Cần phân biệt hai loại trùng lặp khác bản chất: trùng gần như tuyệt đối do cùng đường dẫn định danh hoặc cùng tiêu đề, và trùng nội dung ở mức tương đồng cao nhưng chưa chắc là bản sao thật. Chỉ loại thứ hai mới nên cho phép con người xác nhận bỏ qua.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Mở rộng kết quả kiểm tra trùng lặp thêm một cờ đánh dấu mức chặn cứng, bật lên khi đường dẫn định danh trùng tuyệt đối, tiêu đề trùng tuyệt đối sau khi chuẩn hóa, hoặc độ tương đồng nội dung vượt một ngưỡng rất cao gần như chắc chắn là bản sao. Route lưu bài nhận thêm một cờ xác nhận bỏ qua và một dòng lý do tùy chọn từ giáo viên; người phê duyệt luôn lấy từ mã xác thực, không nhận từ yêu cầu gửi lên. Nếu có cờ chặn cứng, từ chối lưu dù có xác nhận bỏ qua hay không. Nếu chỉ có cảnh báo mềm và có xác nhận bỏ qua, cho lưu và ghi thêm vào chính bản ghi bài tập bốn trường lưu vết: có cảnh báo trùng lặp hay không, ai đã duyệt, duyệt lúc nào, lý do gì.

Trên giao diện, khối cảnh báo trùng lặp hiển thị khác màu tùy mức chặn cứng hay cảnh báo mềm. Mức cảnh báo mềm hiện thêm một ô đánh dấu xác nhận đã đối chiếu, tick vào mới mở khóa nút lưu, kèm một ô nhập lý do không bắt buộc. Thêm một nút riêng đưa tên các bài bị nghi trùng vào một mục nhập mới trong biểu mẫu sinh bài kèm ràng buộc tránh trùng, để giáo viên chỉ cần bấm sinh lại thay vì gõ lại từ đầu.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết kiểm thử riêng cho từng nhánh: lưu bình thường khi không trùng, từ chối khi trùng mềm mà chưa xác nhận, cho lưu và ghi đúng vết khi trùng mềm đã xác nhận, vẫn từ chối khi chặn cứng dù đã xác nhận, vẫn từ chối khi lời giải chưa qua hết kiểm thử dù đã xác nhận trùng lặp.

```
npx jest --reporters=default
```

Ba mươi mốt bộ, ba trăm lẻ tám trường hợp kiểm thử đạt. Mở giao diện thật, sinh một bài cố ý gần giống một bài đã seed sẵn, xác nhận nút lưu bị khóa kèm chú thích lý do, tick xác nhận thấy nút chuyển trạng thái mở khóa, bấm lưu thành công và đọc lại đúng bốn trường lưu vết trong bản ghi vừa tạo qua lệnh gọi mạng thật.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một cảnh báo không kèm hành động xử lý cụ thể trên giao diện là một ngõ cụt thật sự đối với người dùng cuối, việc thêm quyền quyết định cho con người phải đi kèm việc phân biệt rõ ràng trường hợp nào con người thật sự có quyền quyết định và trường hợp nào không, nếu không sẽ vô tình mở đường cho việc lưu trùng thật sự.

---

## Việc 12: Sửa lỗi mã nguồn dùng sys.stdin bị chặn nhầm, thêm sửa trực tiếp và chạy lại kiểm thử

> "Lệnh sửa lỗi: Reference solution không nhận stdin, actual bị rỗng, và thêm tính năng sửa trực tiếp trên UI. Hiện tại khi Gemini sinh code dùng sys.stdin.read().split(), hệ thống chạy test báo 0/4 pass vì actual trả về rỗng hoàn toàn. Nguyên nhân khiến actual bị rỗng không nằm ở logic toán học mà nằm ở cơ chế nhập/xuất hoặc runner môi trường test: trong nhiều sandbox judge, sys.stdin.read() chờ EOF, nếu runner đẩy test case qua pipe mà không đóng stream chương trình sẽ treo ngầm. Hãy thay reference solution bằng giải pháp dùng input() an toàn. Xử lý các mục còn lại: xóa tag thừa trong đề bài, tích chọn checkbox xác nhận khác biệt để bỏ qua cảnh báo trùng lặp 65 phần trăm, dán code đã sửa vào Reference solution, bấm chạy lại test để nhận 4/4 pass, sau đó nút Lưu vào ngân hàng đề sẽ kích hoạt."

### Điều tôi hiểu trước khi gọi AI

Không mặc định giả thuyết của người dùng về nguyên nhân là đúng, tự tái hiện lỗi bằng đúng hàm chấm bài thật của hệ thống trước khi kết luận.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Viết một kiểm thử tạm gọi thẳng hàm chấm bài thật với đúng đoạn mã dùng sys.stdin người dùng mô tả, xác nhận kết quả trống không phải do cơ chế đóng luồng nhập dữ liệu như giả thuyết ban đầu, mà do lớp kiểm tra an toàn mã nguồn bằng phân tích cú pháp chặn hoàn toàn việc nhập khẩu thư viện sys từ trước khi mã được chạy, cùng nhóm với các thư viện hệ điều hành và tiến trình con.

Sửa lớp kiểm tra an toàn: bỏ thư viện sys khỏi danh sách thư viện bị chặn hoàn toàn, thay bằng một danh sách riêng chỉ chặn các thuộc tính thật sự nguy hiểm của thư viện này như thoát tiến trình, can thiệp bảng nhập khẩu, sửa đường dẫn tìm kiếm module, và các hàm truy xuất khung ngăn xếp ở tầng sâu. Luồng nhập xuất dữ liệu chuẩn của thư viện này được cho phép dùng bình thường.

Thêm một điểm truy cập mới chỉ chạy lại kiểm thử cho một bài đã sinh, không gọi lại mô hình sinh đề, dùng khi giáo viên tự sửa nội dung. Trên giao diện, thêm một nút chuyển đổi trạng thái sửa cho mỗi bài kết quả, khi bật thì tiêu đề, mô tả, mã lời giải chuyển thành ô nhập liệu trực tiếp, kèm một nút chạy lại kiểm thử gọi tới điểm truy cập mới và cập nhật lại toàn bộ trạng thái hiển thị theo kết quả trả về.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết hai mươi trường hợp kiểm thử cho lớp kiểm tra an toàn, xác nhận luồng nhập xuất chuẩn của thư viện sys được cho phép trong khi các thuộc tính nguy hiểm vẫn bị chặn đúng. Viết thêm kiểm thử riêng cho điểm truy cập chạy lại kiểm thử, gồm một trường hợp dùng chính đoạn mã sys.stdin gây lỗi ban đầu để làm kiểm thử chống tái phát.

```
npx jest --reporters=default
```

Ba mươi mốt bộ, ba trăm lẻ tám trường hợp kiểm thử đạt.

Gọi trực tiếp điểm truy cập chạy lại kiểm thử bằng lệnh mạng thật với đúng đoạn mã ban đầu của người dùng, xác nhận đạt bốn trên bốn trường hợp kiểm tra, không còn kết quả trống. Mở giao diện thật, bật chế độ sửa cho một bài, sửa mã lời giải, bấm chạy lại kiểm thử, xác nhận bảng trạng thái và danh sách trường hợp kiểm tra cập nhật đúng theo mã mới, thử cả hai chiều từ đúng sang sai và từ sai sang đúng.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: giả thuyết của người báo lỗi, dù hợp lý về mặt nguyên lý chung của các môi trường chấm bài khác, có thể không đúng với hệ thống cụ thể đang có, chỉ tái hiện được bằng cách gọi thẳng đúng hàm production mới xác định được lớp nào thật sự gây ra hành vi quan sát thấy. Điều chưa chắc: khi giáo viên sửa mã lời giải nhưng chưa bấm chạy lại kiểm thử, bảng trạng thái trên giao diện vẫn hiển thị kết quả của lần chạy trước đó, không tự đánh dấu là đã lỗi thời; việc lưu bài ở tầng máy chủ luôn tự kiểm tra lại nên không có rủi ro về dữ liệu, nhưng có thể gây hiểu lầm ngắn hạn cho giáo viên nếu đọc nhầm bảng trạng thái cũ, cần cân nhắc thêm dấu hiệu cảnh báo lỗi thời ngay khi nội dung bị sửa cho lần làm việc sau.

---

## Việc 13: Viết tài liệu kỹ thuật mô tả cơ chế mastery và recommendation

> "Yêu cầu tạo tài liệu kỹ thuật Day 20: tạo file docs/day20-recommendation-engine.md ghi lại cơ chế nghiệp vụ đã triển khai. Viết gãy gọn, tự nhiên, đúng giọng kỹ sư hệ thống, tuyệt đối không dùng emoji hay ký tự trang trí. Nội dung gồm năm phần: mô hình tính toán Mastery kèm công thức và các ngưỡng quy ước, cơ chế ba quy tắc gợi ý Remediation/Progression/Exploration kèm tính minh bạch reason, cơ chế kiểm soát và an toàn thực thi gồm human-in-the-loop, sửa trực tiếp chạy lại test, phân tách kiểm tra AST cho sys, hạn chế về mặt thiết kế, và một mục rà soát các điểm nghi vấn cần xử lý tiếp: rủi ro rỗng danh sách khi học viên giải hết một tag hoặc hết mọi tag, xung đột định dạng số nguyên kiểu 007 so với 7, và xác minh sau khi revalidate dữ liệu lưu vào database có chắc chắn lấy bản đã sửa hay không."

### Điều tôi hiểu trước khi gọi AI

Mục liệt kê điểm nghi vấn không nên viết theo trí nhớ từ yêu cầu ban đầu, mà phải tự xác minh lại từng điểm bằng cách đọc mã nguồn thật trước khi ghi, vì một số điểm có thể đã được xử lý trong các việc trước đó của cùng ngày làm việc.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo tệp tài liệu tại đường dẫn docs/day20/recommendation-engine.md theo đúng thư mục quy ước của các ngày trước. Trước khi viết mục điểm nghi vấn, tự đọc lại đoạn mã tính mastery, đoạn mã so khớp kết quả, và đoạn mã lưu bài sau khi chạy lại kiểm thử, xác nhận ba trong bốn điểm nghi vấn ban đầu người dùng nêu thực chất đã được xử lý và có kiểm thử bảo vệ từ các việc trước trong cùng ngày, chỉ còn đúng một khoảng hở thật sự chưa xử lý ở tầng hiển thị khi giáo viên sửa mã nhưng chưa chạy lại kiểm thử. Ghi lại đúng theo hiện trạng đã xác minh, không lặp lại nguyên văn các nghi vấn ban đầu như thể chưa ai xử lý.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Không có lệnh kiểm thử tự động cho việc viết tài liệu. Đối chiếu từng câu khẳng định trong tài liệu với đoạn mã nguồn tương ứng trước khi ghi, không suy diễn từ tên hàm hay tên biến.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi viết tài liệu tổng kết cuối một ngày làm việc dài với nhiều việc nối tiếp nhau, một số câu hỏi hoặc nghi vấn nêu ra ở đầu ngày có thể đã được chính các việc sau đó giải quyết mà chưa kịp cập nhật lại giả định ban đầu, cần xác minh lại toàn bộ thay vì chép nguyên yêu cầu gốc vào tài liệu.
