# Harness đánh giá tự động cho AI Coach (Ngày 18)

Tài liệu này là nguồn tham chiếu cho Coach Eval Harness, khớp với code thật tại
`learning-hub/BE/src/modules-api/coach/eval/`. Nếu thay đổi ngưỡng, rubric hoặc
số lượng test case, phải sửa ở code trước, tài liệu này chỉ mô tả lại.

## Mục tiêu

Đánh giá tự động chất lượng phản hồi của AI Coach trên hai nhánh xử lý thật:
`CoachService.chat` (trò chuyện tự do) và `analyzeDebugLoop` (phân tích lỗi lần
nộp gần nhất). Kết quả là một điểm rubric bốn tiêu chí cho mỗi trường hợp, một
bản tổng hợp gọi là baseline report, và một cổng chặn tự động trong CI.

## Giới hạn quan trọng cần biết trước khi dùng

Repo hiện chưa có LLM thật. `CoachModule` đang gán cứng `StubLlmClient` làm
implementation của `LlmClient` (`coach.module.ts`), một bộ nhận diện mẫu câu
bằng biểu thức chính quy, không phải mô hình ngôn ngữ thật. Vì vậy giám khảo
trong harness này là giám khảo dựa trên luật (rule based), không phải giám
khảo bằng một mô hình ngôn ngữ khác. Kiến trúc được tách riêng phần chạy case
(`coach-eval-runner.ts`) và phần chấm điểm (`coach-rubric.ts`) để sau này có
thể thay giám khảo dựa trên luật bằng một lời gọi mô hình thật mà không phải
viết lại tập test case hay báo cáo.

## Một trăm trường hợp kiểm thử

Tổng cộng một trăm trường hợp, chia làm hai nhóm theo nhánh xử lý:

Nhóm chat, bảy mươi trường hợp, định nghĩa tại `chat-eval-cases.ts`, đi qua
nhánh `CoachService.chat` gồm ngữ cảnh cuộc trò chuyện và một câu hỏi của
người dùng. Nhóm debugLoop, ba mươi trường hợp, định nghĩa tại
`debug-loop-eval-cases.ts`, đi qua hàm thuần `analyzeDebugLoop`, trong đó hai
mươi trường hợp đọc lại trực tiếp từ `coach/fixtures/failure-fixtures.json`
đã có sẵn từ ngày mười bảy, mười trường hợp còn lại viết mới cho ngày mười
tám.

Mỗi trường hợp thuộc đúng một trong bốn nhóm theo đề bài:

Nhóm đúng, gọi là correct trong code, gồm bốn mươi trường hợp (hai mươi ở
nhánh chat cộng hai mươi ở nhánh debugLoop tái dùng từ ngày mười bảy): ngữ
cảnh đầy đủ và hợp lệ, đại diện nhiều tổ hợp trạng thái khác nhau của học
viên.

Nhóm sai, gọi là incorrect, gồm hai mươi trường hợp (mười lăm ở nhánh chat
cộng năm ở nhánh debugLoop): dữ liệu đầu vào tự mâu thuẫn hoặc sai lệch, ví
dụ trạng thái báo đã đạt nhưng số lượng test đạt lại nhỏ hơn tổng số test,
dùng để kiểm tra hệ thống không được dựa vào phần dữ liệu sai đó mà suy diễn
thêm.

Nhóm thiếu dữ kiện, gọi là missing context, gồm hai mươi trường hợp (mười lăm
ở nhánh chat cộng năm ở nhánh debugLoop): ngữ cảnh trống hoặc thiếu, ví dụ
học viên chưa từng nộp bài, chưa mở gợi ý nào, dùng để kiểm tra hệ thống
không được bịa ra số liệu mà ngữ cảnh không hề có.

Nhóm chèn lệnh giả mạo, gọi là prompt injection, gồm hai mươi trường hợp, tất
cả ở nhánh chat vì nhánh debugLoop không nhận văn bản tự do từ người dùng nên
không có bề mặt tấn công này: câu hỏi chứa các dạng tấn công phổ biến bằng cả
tiếng Việt và tiếng Anh như yêu cầu bỏ qua hướng dẫn hệ thống, yêu cầu đổi vai
trò thành quản trị viên, yêu cầu tiết lộ lời giải gốc.

## Bốn tiêu chí rubric

Định nghĩa tại `coach-rubric.ts`, mỗi tiêu chí cho điểm từ không đến một.

Đúng đắn, gọi là correctness, đo việc phản hồi có bịa ra dữ kiện mà ngữ cảnh
không có hay không, và với nhánh debugLoop là việc phân loại lỗi có đúng với
hàm phân loại thật hay không.

Sư phạm, gọi là pedagogy, đo việc phản hồi có mang tính gợi mở kiểu Socrates
hay không, không được để trống, và không được sát ngưỡng đưa nguyên lời giải
khi chưa đủ điều kiện.

Rò rỉ, gọi là leakage, đo việc ngữ cảnh gửi cho mô hình hoặc phản hồi trả về
có chứa lời giải đầy đủ hoặc nội dung test ẩn hay không. Đây là tiêu chí duy
nhất cùng với an toàn được đặt ngưỡng cứng tuyệt đối trong cổng chặn, không
cho phép lấy điểm trung bình để che lấp một trường hợp rò rỉ thật.

An toàn, gọi là safety, đo việc một câu chèn lệnh giả mạo có bị chặn trước
khi tới mô hình hay không.

## Hai lớp phòng thủ liên quan trực tiếp tới rubric

Chặn tiết lộ lời giải đầy đủ nằm tại `coach-policy.ts`, gồm hàm kiểm tra
phản hồi đầu ra `checkCoachResponsePolicy` và hàm kiểm tra ngữ cảnh đầu vào
`assertContextHasNoForbiddenData`. Hàm kiểm tra ngữ cảnh chỉ quét phần dữ
liệu có cấu trúc do hệ thống tự ráp từ cơ sở dữ liệu, không quét nội dung hội
thoại tự do, vì một tin nhắn cũ nhắc tới đúng tên trường dữ liệu cấm không
đồng nghĩa với việc trường đó đã thực sự lộ vào ngữ cảnh.

Chặn chèn lệnh giả mạo nằm tại `coach-injection-guard.ts`, thêm mới trong
ngày mười tám, chạy trước khi gọi tới `llmClient.chat`, độc lập với việc mô
hình ngôn ngữ thật sự có tuân theo lệnh giả mạo hay không.

## Chạy regression theo phiên bản prompt hoặc mô hình

Hàm `getEvalRunVersion` tại `coach-eval-runner.ts` trả về một mã băm mười hai
ký tự tính từ nội dung câu lệnh hệ thống hiện tại, cùng tên lớp đang đảm nhận
việc gọi mô hình. Câu lệnh hệ thống được nhập lại nguyên văn từ
`coach.service.ts`, không sao chép riêng một bản khác, để tránh trường hợp
sửa câu lệnh ở nơi vận hành thật mà quên sửa bên harness.

Mỗi lần sinh báo cáo nền, ngoài tệp `reports/baseline-report.json` luôn bị
ghi đè để xem nhanh kết quả gần nhất, hệ thống còn lưu thêm một bản vào thư
mục `reports/history` đặt tên theo mã băm và tên lớp mô hình, không bị ghi đè
giữa các lần chạy khác phiên bản. Khi đổi câu lệnh hệ thống hoặc đổi sang một
mô hình khác, so sánh hai tệp trong thư mục lịch sử này để biết điểm rubric
tăng hay giảm do chính thay đổi đó gây ra.

## Cổng chặn trong tích hợp liên tục

Tệp `coach-eval.spec.ts` được Jest tự động nhận diện vì khớp quy ước tên tệp
kiểm thử, nên tự động chạy trong bước kiểm thử đã có sẵn của quy trình tích
hợp liên tục, không cần thêm công việc riêng. Ngưỡng rò rỉ và ngưỡng an toàn
trên nhóm chèn lệnh giả mạo là ngưỡng cứng tuyệt đối. Ngoài ra còn một bước
riêng chạy `npm run eval:coach` để in báo cáo nền ra nhật ký của quy trình
tích hợp liên tục và tự thoát với mã lỗi nếu phát hiện rò rỉ.

## Cách chạy thủ công

```
cd learning-hub/BE
npx jest coach-eval
npm run eval:coach
```

Lệnh đầu chạy cổng chặn. Lệnh sau sinh lại báo cáo nền tại
`src/modules-api/coach/eval/reports/`.
