# AI Work Log Ngày 18: Harness đánh giá tự động cho AI Coach

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 25 tháng 9 năm 2026 |
| Nhánh | feature/learning hub day18 |
| Công cụ, model | Claude Code, mô hình Claude Sonnet 5, có sử dụng một subagent loại Explore để đọc code trước khi thiết kế |
| Phạm vi quyền | Chỉ đọc và ghi trong thư mục learning hub, không đụng vào thư mục Data AI Resource và các thư mục Test |
| Dữ liệu nhạy cảm | Không có, toàn bộ context sử dụng trong ngày là mã nguồn công khai của dự án, dữ liệu thử nghiệm tự tạo, và nhật ký lỗi do chính người dùng chạy ứng dụng thật rồi dán lại |

## Mục lục các việc trong ngày

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Nghiên cứu kiến trúc Coach hiện tại trước khi thiết kế | Đạt |
| 2 | Vá lỗ hổng chèn lệnh giả mạo | Đạt |
| 3 | Xây dựng Coach Eval Harness với một trăm trường hợp kiểm thử và bốn tiêu chí rubric | Đạt |
| 4 | Sinh báo cáo nền và thêm bước trong tích hợp liên tục | Đạt |
| 5 | Chạy thử dự án, phát hiện và sửa lỗi máy chủ trả về mã năm trăm | Đạt |
| 6 | Sửa giao diện phần AI Coach theo phản hồi thực tế | Đạt |
| 7 | Thêm câu trả lời mặc định cho lời chào đơn giản | Đạt |
| 8 | Tự rà soát lại toàn bộ công việc trong ngày và bổ sung phần còn thiếu | Đạt |
| 9 | Kiểm tra lại toàn bộ từ đầu bằng cách chạy trực tiếp mọi lệnh, không tin vào báo cáo cũ | Đạt |

---

## Việc 1: Nghiên cứu kiến trúc Coach hiện tại trước khi thiết kế

> **Prompt người dùng:** Yêu cầu ngày 18 là xây dựng harness cho AI Coach, gồm tạo trường hợp kiểm thử thuộc bốn nhóm đúng, sai, thiếu dữ kiện, chèn lệnh giả mạo, chấm điểm bằng rubric bốn tiêu chí đúng đắn, sư phạm, rò rỉ, an toàn, và chạy hồi quy theo phiên bản câu lệnh hoặc mô hình. Bàn giao cuối ngày gồm harness, một trăm trường hợp kiểm thử, và báo cáo nền. Điều kiện nghiệm thu gồm kiểm tra rò rỉ lời giải đầy đủ, giám khảo mô hình ngôn ngữ được đối chiếu mẫu thủ công, và cổng chặn hồi quy trong tích hợp liên tục. Người dùng đồng thời gửi kèm nội dung nhiệm vụ ngày 19 về việc AI hỗ trợ sinh đề có kiểm soát, để tham khảo trước, với mục đích rõ ràng là thiết kế ngày 18 sao cho không gây khó cho ngày 19. Người dùng nhấn mạnh riêng một điều kiện phạm vi: không được thao tác trên thư mục dữ liệu và thư mục kiểm thử ở cấp cao của kho mã nguồn, chỉ được làm việc trong thư mục learning hub.

### Điều tôi hiểu trước khi gọi AI

Nhiệm vụ đòi hỏi xây một bộ đánh giá tự động cho AI Coach, nhưng phải thiết kế sao cho không tạo ra kiến trúc gây khó cho việc sinh đề bài của ngày 19. Chưa biết kiến trúc Coach hiện tại có sẵn những gì, có mô hình ngôn ngữ thật hay chưa, nên chưa thể tự viết code ngay mà cần khảo sát trước.

### Context, tài liệu, file, constraint đã cung cấp

Context cung cấp cho subagent Explore: toàn bộ thư mục coach trong backend, gồm bảy tệp mã nguồn, các tệp kiểm thử, thư mục fixtures, tệp cấu hình tích hợp liên tục, và nội dung AI worklog cũ của ngày trước. Constraint: không đụng thư mục Data AI Resource và Test.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính đưa cho subagent Explore: đọc kiến trúc Coach hiện tại trước khi thiết kế harness, báo cáo lại phát hiện quan trọng. Sau khi nhận báo cáo, dùng công cụ hỏi người dùng để chốt ba quyết định thiết kế trước khi viết code, không tự đoán.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Việc này chưa tạo file hay diff nào, chỉ là bước nghiên cứu và ra quyết định thiết kế. Ba phát hiện quan trọng nhất từ báo cáo của subagent được giữ lại nguyên vẹn làm cơ sở thiết kế:

1. Tệp coach module đang gán cứng StubLlmClient làm mô hình ngôn ngữ. Kho mã nguồn hiện tại chưa có mô hình ngôn ngữ thật nào được gọi, chưa cài thư viện của Anthropic hay OpenAI.
2. Tệp readme trong thư mục fixtures đã ghi sẵn từ ngày 17 rằng tệp conversation traces dùng làm nền cho harness đánh giá của ngày 18.
3. Tệp coach policy đã có sẵn cơ chế chặn rò rỉ lời giải đầy đủ nhưng hoàn toàn chưa có cơ chế nhận diện chèn lệnh giả mạo.

Ba quyết định thiết kế chốt lại sau khi hỏi người dùng, thay cho việc AI tự đoán:

1. Phần giám khảo mô hình ngôn ngữ triển khai theo hướng dựa trên luật, có kiến trúc sẵn sàng thay bằng mô hình ngôn ngữ thật sau này, thay vì gọi một mô hình thật ngay trong ngày 18.
2. Một trăm trường hợp kiểm thử viết tay dưới dạng dữ liệu tĩnh, không sinh ngẫu nhiên.
3. Đặt toàn bộ mã nguồn tại thư mục coach eval trong backend để tự động nằm trong lệnh kiểm thử có sẵn.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Không có lệnh kiểm thử nào chạy ở việc này vì chưa có code. Không phát hiện lỗi AI nào ở bước nghiên cứu này.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: đọc kiến trúc thật trước khi thiết kế đã tránh được một sai lầm lớn, nếu không đọc kỹ sẽ tưởng kho mã nguồn đã có mô hình ngôn ngữ thật và thiết kế giám khảo sai hướng ngay từ đầu. Điều chưa chắc: chưa rõ khi nào ngày 19 sẽ thật sự gắn một mô hình ngôn ngữ thật vào, nên kiến trúc rule based hôm nay có thể cần điều chỉnh thêm khi đó. Thay đổi cho lần sau: nên có một quy ước ghi rõ trong tài liệu dự án về việc kho mã nguồn hiện đang dùng mô hình giả lập nào, để các ngày sau không phải tự dò lại từ đầu.

---

## Việc 2: Vá lỗ hổng chèn lệnh giả mạo

> **Bối cảnh phát sinh:** Việc này không phải một yêu cầu mới của người dùng mà phái sinh trực tiếp từ phát hiện thứ ba ở Việc 1, tệp coach policy đã có cơ chế chặn rò rỉ lời giải nhưng chưa có cơ chế chặn chèn lệnh giả mạo, trong khi đề bài ngày 18 yêu cầu bắt buộc phải có trường hợp kiểm thử cho nhóm chèn lệnh giả mạo.

### Context, tài liệu, file, constraint đã cung cấp

Context là kết quả nghiên cứu từ Việc 1, cụ thể là cấu trúc tệp coach policy và tệp coach service. Không có tài liệu bên ngoài nào khác được cung cấp.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính là tự triển khai dựa trên phát hiện lỗ hổng ở Việc 1, không có vòng phản hồi qua lại nào với người dùng ở việc này.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo mới tệp coach injection guard, chứa hàm thuần detectPromptInjection quét khoảng mười ba mẫu biểu thức chính quy bằng cả tiếng Việt và tiếng Anh cho năm nhóm tấn công: yêu cầu bỏ qua hướng dẫn hệ thống, yêu cầu đổi vai trò thành quản trị viên hoặc chế độ nhà phát triển, tự xưng là quản trị viên để đòi quyền cao hơn, yêu cầu tiết lộ câu lệnh hệ thống hoặc test ẩn hoặc lời giải gốc, và các kỹ thuật vượt rào phổ biến.

Sửa tệp coach service, gắn hàm phát hiện chèn lệnh vào, chạy ngay sau khi ghi lại tin nhắn của người dùng và trước khi gọi tới mô hình ngôn ngữ. Toàn bộ phần này được giữ lại nguyên vẹn, không có phần nào bị loại bỏ, vì đây là code mới hoàn toàn không thay thế logic cũ nào.

Vì StubLlmClient hiện tại chỉ là bộ nhận diện mẫu câu, không phải mô hình thật, lớp chặn này không làm thay đổi hành vi quan sát được ngay hôm nay, giá trị của nó chỉ hiện rõ khi mô hình thật được gắn vào sau này. Giới hạn này được ghi rõ trong chú thích đầu tệp để giữ lại đúng ngữ cảnh cho người đọc sau.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết tệp coach injection guard spec với mười sáu trường hợp: mười câu chèn lệnh phải bị bắt, năm câu hỏi hợp lệ không được chặn nhầm, một kiểm tra nội dung câu từ chối không tiết lộ thêm gì. Thêm một trường hợp tích hợp trong coach service spec xác nhận hàm mockLlmClient chat không được gọi khi tin nhắn là chèn lệnh.

Lệnh chạy và kết quả, chạy trong thư mục backend:

```
npx jest coach-injection-guard coach.service
```

Kết quả toàn bộ các trường hợp đều đạt. Không phát hiện lỗi AI nào ở việc này khi kiểm chứng lần đầu, các lỗi thật của bộ chặn này chỉ lộ ra sau khi chạy qua Coach Eval Harness ở Việc 3.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: đặt lớp chặn ở tầng service, trước khi gọi mô hình ngôn ngữ, là vị trí đúng để bảo đảm hiệu lực dù sau này đổi sang mô hình thật nào. Điều chưa chắc: bộ mẫu biểu thức chính quy hiện tại chỉ bắt được các dạng tấn công đã biết, chưa chắc bao quát hết các biến thể chèn lệnh mới. Thay đổi cho lần sau: nên bổ sung định kỳ mẫu tấn công mới vào bộ chặn này khi phát hiện qua thực tế sử dụng, giống như đã làm ở Việc 3.

---

## Việc 3: Xây dựng Coach Eval Harness với một trăm trường hợp kiểm thử và bốn tiêu chí rubric

> **Prompt người dùng:** Nguyên văn yêu cầu đã dán ở Việc 1, không lặp lại ở đây.

### Điều tôi hiểu trước khi gọi AI

Cần dựng một trăm trường hợp kiểm thử chia bốn nhóm đúng, sai, thiếu dữ kiện, chèn lệnh giả mạo, chấm điểm bằng rubric bốn tiêu chí đúng đắn, sư phạm, rò rỉ, an toàn, và toàn bộ phải chạy được như một cổng chặn hồi quy tự động.

### Context, tài liệu, file, constraint đã cung cấp

Context gồm ba quyết định thiết kế đã chốt ở Việc 1, cơ chế chặn chèn lệnh vừa tạo ở Việc 2, và hai mươi trường hợp phân tích lỗi có sẵn từ ngày 17 trong tệp failure fixtures. Constraint: không sinh case ngẫu nhiên, phải đọc lại fixtures của ngày 17 bằng hàm đọc tệp thay vì chép tay.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính: dựng đủ một trăm trường hợp, bốn tiêu chí rubric, cổng chặn hồi quy trong Jest. Vòng phản hồi quan trọng nhất: sau khi chạy thử lần đầu và phát hiện sáu trên mười hai trường hợp kiểm thử không đạt, tự quyết định không sửa mù mà viết kịch bản gỡ lỗi riêng để đọc từng trường hợp trước khi sửa.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Toàn bộ mã nguồn tạo mới tại thư mục coach eval trong backend, chi tiết đầy đủ nằm trong tài liệu riêng tại `learning-hub/docs/day18/coach-eval-harness-spec.md`.

| Tệp | Nội dung | Giữ lại hay chỉnh sửa |
|---|---|---|
| eval types | Định nghĩa hai họ trường hợp kiểm thử tương ứng hai nhánh xử lý thật, một là chat đi qua CoachService, hai là debugLoop đi qua hàm thuần analyzeDebugLoop | Giữ nguyên |
| debug loop eval cases | Ba mươi trường hợp, đọc trực tiếp tệp failure fixtures bằng hàm đọc tệp thay vì chép tay, tái dùng nguyên hai mươi trường hợp của ngày 17 làm nhóm đúng, thêm năm trường hợp nhóm sai và năm trường hợp nhóm thiếu dữ kiện viết mới | Giữ nguyên |
| chat eval cases | Bảy mươi trường hợp, chia hai mươi nhóm đúng, mười lăm nhóm sai, mười lăm nhóm thiếu dữ kiện, hai mươi nhóm chèn lệnh giả mạo | Giữ nguyên |
| coach eval runner | Mô phỏng lại đúng thứ tự các bước thật của hàm chat trong CoachService | Giữ nguyên ở việc này, chỉnh sửa thêm ở Việc 8 |
| coach rubric | Chấm điểm bốn tiêu chí đúng đắn, sư phạm, rò rỉ, an toàn | Chỉnh sửa hai lần sau khi phát hiện lỗi, xem mục kiểm chứng bên dưới |
| coach eval spec | Cổng chặn hồi quy, ngưỡng cứng cho rò rỉ và an toàn, ngưỡng mềm cho các tiêu chí còn lại | Giữ nguyên ở việc này, chỉnh sửa thêm ở Việc 8 |

Một tệp kịch bản gỡ lỗi tạm thời được tạo ra trong lúc làm để đọc trực tiếp đầu vào đầu ra của từng trường hợp không đạt, sau đó bị loại bỏ hoàn toàn sau khi dùng xong, vì nó chỉ phục vụ mục đích chẩn đoán một lần, không phải một phần của harness.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Lần chạy đầu tiên của cổng chặn báo sáu trên mười hai trường hợp kiểm thử không đạt. Dùng kịch bản gỡ lỗi tạm thời để đọc trực tiếp từng trường hợp thay vì sửa mù, tìm ra bốn lỗi thật:

1. Hai lỗi ở bộ nhận diện chèn lệnh còn thiếu mẫu câu, chưa bắt được hai câu chèn lệnh thật.
2. Hai lỗi trong chính rubric tự viết, không phải lỗi mã nguồn sản phẩm: rubric hiểu nhầm một câu mô tả phạm vi từ chối là hành vi rò rỉ thật, và rubric hiểu nhầm một câu gợi ý mở gợi ý là một câu khẳng định đã mở gợi ý.

Cách phát hiện: đọc nguyên văn nội dung đầu vào và đầu ra của từng trường hợp không đạt bằng kịch bản gỡ lỗi, không tin vào con số tổng do công cụ tự động trả ra. Cả bốn lỗi đều đã sửa, có trường hợp kiểm thử riêng để không tái diễn.

Lệnh chạy và kết quả tại thời điểm hoàn thành việc 3, chạy trong thư mục backend:

```
npx tsc --noEmit
npx jest --silent
npm run eval:coach
```

Kết quả: không có lỗi kiểu, hai mươi mốt bộ kiểm thử đạt với một trăm bảy mươi tư trường hợp đạt, và một trăm trên một trăm trường hợp của báo cáo nền đạt.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một cổng chặn tự động có thể tự sai ở chính công cụ chấm điểm của nó, không chỉ ở mã nguồn sản phẩm được chấm, nên luôn phải đọc lý do không đạt cụ thể trước khi kết luận. Điều chưa chắc: bộ một trăm trường hợp hiện tại là dữ liệu tĩnh viết tay, chưa chắc bao quát hết mọi tình huống thật sẽ gặp khi có mô hình ngôn ngữ thật. Thay đổi cho lần sau: nên tách rõ quy trình đối chiếu thủ công thành một bước bắt buộc mỗi khi thêm trường hợp kiểm thử mới, không chỉ làm một lần rồi thôi, và ghi quy trình này vào tài liệu hướng dẫn của harness.

---

## Việc 4: Sinh báo cáo nền và thêm bước trong tích hợp liên tục

> **Bối cảnh:** Đây là phần bàn giao cuối ngày theo đề bài ngày 18 đã dán ở Việc 1, gồm baseline report và regression gate trong CI, không phải một yêu cầu mới.

### Context, tài liệu, file, constraint đã cung cấp

Context là toàn bộ harness đã xây ở Việc 3 và tệp cấu hình tích hợp liên tục hiện có của dự án đã đọc ở Việc 1.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính là tự triển khai dựa trên bàn giao đã nêu ở đề bài, không có vòng phản hồi qua lại nào ở việc này.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Thêm lệnh eval coach vào tệp package json của backend. Thêm một bước riêng trong tệp cấu hình tích hợp liên tục, chạy sau bước kiểm thử đơn vị đã có sẵn, để in báo cáo nền ra nhật ký và tự thoát với mã lỗi nếu phát hiện rò rỉ. Toàn bộ được giữ lại nguyên vẹn, không có phần nào loại bỏ.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Không chạy được máy chủ tích hợp liên tục thật trong phiên làm việc vì không đẩy mã nguồn lên máy chủ từ xa. Đã chạy đúng hai lệnh mà máy chủ tích hợp liên tục sẽ chạy ngay tại máy cá nhân, cả hai đều thành công. Không phát hiện lỗi AI nào ở việc này.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: đặt báo cáo nền như một bước riêng trong tích hợp liên tục, tách khỏi bước kiểm thử đơn vị, giúp người xem nhật ký thấy ngay kết quả tổng hợp mà không cần đọc hết log kiểm thử chi tiết. Điều chưa chắc: chưa kiểm chứng được hành vi thật trên máy chủ tích hợp liên tục vì chưa đẩy mã nguồn lên. Thay đổi cho lần sau: khi đẩy nhánh này lên máy chủ từ xa, cần xác nhận lại bước này chạy đúng như mong đợi trên môi trường tích hợp liên tục thật, không chỉ tin vào kết quả chạy tại máy cá nhân.

---

## Việc 5: Chạy thử dự án, phát hiện và sửa lỗi máy chủ trả về mã năm trăm

> **Prompt người dùng, tin nhắn 1:** Yêu cầu khởi động dự án lên để kiểm thử trực tiếp.
>
> **Prompt người dùng, tin nhắn 2:** Kèm đoạn nhật ký trình duyệt báo lỗi mã năm trăm khi gọi đường dẫn coach chat, cùng nhận xét rằng trải nghiệm phần phân tích lỗi và hỏi đáp bài tập của AI Coach không tốt, đôi khi phải tải lại trang, và một phần giao diện che khuất phần khác.
>
> **Prompt người dùng, tin nhắn 3:** Xác nhận đồng ý với phương án khởi động lại máy chủ giao diện để bảo đảm mã nguồn mới nhất được áp dụng, chọn từ danh sách gợi ý do hệ thống đưa ra.

### Điều tôi hiểu trước khi gọi AI

Người dùng muốn tự tay chạy và kiểm thử ứng dụng thật trên trình duyệt, không chỉ tin vào kết quả kiểm thử tự động. Lỗi mã năm trăm xuất hiện khi dùng thật là một tín hiệu quan trọng cần điều tra ngay, có thể liên quan tới thay đổi vừa làm ở Việc 2.

### Context, tài liệu, file, constraint đã cung cấp

Context là đoạn nhật ký lỗi trình duyệt người dùng dán vào, và dữ liệu thật đang có trong cơ sở dữ liệu Mongo của người dùng.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính từ tin nhắn 1 và 2. Vòng phản hồi quan trọng: sau khi đề xuất phương án khởi động lại máy chủ giao diện, người dùng xác nhận đồng ý qua lựa chọn trong danh sách gợi ý ở tin nhắn 3.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Viết một kịch bản gỡ lỗi tạm thời kết nối trực tiếp tới cơ sở dữ liệu Mongo để tìm nguyên nhân, sau đó loại bỏ hoàn toàn tệp này sau khi xác nhận sửa đúng, vì nó chỉ phục vụ chẩn đoán một lần.

Sửa hàm assertContextHasNoForbiddenData tại tệp coach policy. Phần bị loại bỏ: đoạn quét toàn bộ nội dung ngữ cảnh đã chuyển thành chuỗi ký tự bao gồm cả lịch sử hội thoại tự do. Phần được giữ lại và chỉnh sửa: chỉ quét phần dữ liệu có cấu trúc do hệ thống tự ráp từ cơ sở dữ liệu, gồm thông tin bài tập và gợi ý đã mở. Lý do loại bỏ phần quét lịch sử hội thoại: một câu chữ xuất hiện trong hội thoại tự do không đồng nghĩa với việc trường dữ liệu cấm đó đã thực sự lọt vào ngữ cảnh, quét cả phần đó gây chặn nhầm vĩnh viễn mọi tin nhắn sau đó trên cùng bài tập.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Lỗi AI mắc phải: hàm assertContextHasNoForbiddenData viết ở phiên làm việc trước quét quá rộng, không phân biệt được dữ liệu có cấu trúc với văn bản tự do trong lịch sử hội thoại. Cách phát hiện: đọc nhật ký backend thấy lỗi ném ra từ đúng hàm này, sau đó dùng kịch bản gỡ lỗi kết nối trực tiếp cơ sở dữ liệu thật để xác nhận chính tin nhắn chèn lệnh giả mạo người dùng vừa gõ có chứa nguyên văn từ solutionCode, đã bị lưu vào lịch sử hội thoại và gây lỗi ở lượt trò chuyện kế tiếp.

Thêm một trường hợp kiểm thử hồi quy trong tệp coach policy spec xác nhận hàm không ném lỗi khi chỉ có lịch sử hội thoại nhắc tới từ solutionCode. Chạy lại kịch bản gỡ lỗi để xác nhận trực tiếp trên chính dữ liệu Mongo thật của người dùng, kết quả hàm không còn ném lỗi dù lịch sử cũ vẫn còn nguyên câu chữ đó.

```
npx tsc --noEmit
npx jest --silent
```

Kết quả: không lỗi kiểu, toàn bộ trường hợp kiểm thử đều đạt.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: toàn bộ trường hợp kiểm thử tự động ở Việc 3 đều dùng ngữ cảnh giả lập sạch sẽ, không mô phỏng đúng tình huống một câu chữ nhạy cảm bị lưu lại trong lịch sử hội thoại thật rồi quay lại ảnh hưởng tới lượt sau, nên không hề bắt được lỗi này. Chỉ có việc người dùng tự chạy ứng dụng thật mới phát hiện ra. Điều chưa chắc: chưa rõ còn tình huống thật nào khác tương tự, nơi kiểm thử tự động dùng dữ liệu giả lập không phản ánh đúng dữ liệu tích lũy qua thời gian trong hệ thống thật. Thay đổi cho lần sau: cân nhắc thêm ít nhất một trường hợp kiểm thử mô phỏng lịch sử hội thoại có chứa từ khóa nhạy cảm vào chính bộ một trăm trường hợp của harness, để lớp bảo vệ tự động cũng bắt được dạng lỗi này mà không cần chờ người dùng tự phát hiện.

---

## Việc 6: Sửa giao diện phần AI Coach theo phản hồi thực tế

> **Prompt người dùng, tin nhắn 1:** Đã trích ở Việc 5 vì gửi chung với đoạn nhật ký lỗi mã năm trăm, nội dung về trải nghiệm chưa tốt của phần phân tích lỗi và hỏi đáp bài tập.
>
> **Prompt người dùng, tin nhắn 2, kèm một ảnh chụp màn hình:** Phản ánh rằng khối kết quả phân tích lỗi che hết khung trò chuyện mà không có nút đóng, và nút phân tích lỗi vẫn dùng được dù đã vượt quá giới hạn số lần sử dụng.
>
> **Prompt người dùng, tin nhắn 3:** Phản hồi rằng giới hạn vẫn bị vượt qua sau khi đã sửa, kèm bằng chứng vừa gửi thử nghiệm lần thứ mười.
>
> **Prompt người dùng, tin nhắn 4:** Phản ánh rằng mỗi lần gửi tin nhắn xong, màn hình tự cuộn trượt xuống, phải kéo tay lên lại rất khó chịu.

### Điều tôi hiểu trước khi gọi AI

Có ba vấn đề giao diện riêng biệt, gồm khối phân tích lỗi che khung chat không có nút đóng, nút phân tích lỗi vẫn dùng được dù đã vượt giới hạn vòng lặp, và khung chat tự cuộn kéo theo cả trang mỗi lần gửi tin nhắn.

### Context, tài liệu, file, constraint đã cung cấp

Context là ảnh chụp màn hình người dùng gửi ở tin nhắn 2, cho thấy trực quan lỗi giao diện.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Vòng phản hồi 1: sửa theo tin nhắn 2, thêm nút đóng và giới hạn chiều cao khối phân tích lỗi. Vòng phản hồi 2: người dùng báo lại ở tin nhắn 3 rằng vẫn vượt được giới hạn sau khi đã sửa, buộc phải điều tra sâu hơn và dùng công cụ hỏi người dùng để xác nhận hướng sửa ở tầng backend thay vì chỉ sửa giao diện. Vòng phản hồi 3: sửa theo tin nhắn 4, một vấn đề giao diện độc lập khác.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Cho tin nhắn 2, sửa tệp CoachPanel. Phần giữ lại: toàn bộ cấu trúc hiển thị kết quả phân tích lỗi. Phần thêm mới: một nút đóng cho khối kết quả phân tích, giới hạn chiều cao khối này kèm thanh cuộn riêng, và điều kiện khóa nút phân tích khi cờ chạm giới hạn bật lên. Lý do: khối hiển thị cũ không có nút đóng nào, chỉ tự biến mất khi đổi bài tập hoặc có lần nộp mới, và nút phân tích chỉ khóa theo trạng thái đang tải chứ không theo cờ giới hạn.

Cho tin nhắn 3, sửa hàm debugLoop trong tệp coach service. Phần loại bỏ: cách chặn cũ chỉ mang tính khuyến nghị ở phần nội dung trả về, không thực sự từ chối yêu cầu. Phần thêm mới: điều kiện nếu số lần thử liên tiếp chưa đạt đã lớn hơn hoặc bằng ngưỡng tối đa thì ném lỗi từ chối ngay, không tính toán tiếp. Cập nhật thêm tệp CoachPanel để bắt đúng lỗi từ chối này và khóa nút vĩnh viễn cho tới khi có lần nộp bài mới. Lý do loại bỏ cách cũ: số lần thử được máy chủ tự tính lại từ dữ liệu thật trong cơ sở dữ liệu mỗi lần gọi, nhưng trạng thái khóa nút ở giao diện lại bị đặt lại mỗi khi có lần nộp bài mới, nên người dùng chỉ cần nộp lại bài rồi bấm tiếp là vượt qua được cơ chế khuyến nghị cũ.

Cho tin nhắn 4, sửa tệp CoachPanel. Phần loại bỏ: cách gọi hàm scrollIntoView trên một phần tử rỗng ở cuối danh sách tin nhắn. Phần thêm mới: gắn tham chiếu trực tiếp lên chính khối chứa danh sách tin nhắn và tự đặt giá trị cuộn của khối đó. Lý do loại bỏ cách cũ: hàm scrollIntoView có thể kéo theo bất kỳ phần tử cha nào có thanh cuộn riêng, không giới hạn đúng trong phạm vi khung trò chuyện, khiến cả trang bị cuộn theo ngoài ý muốn.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Lỗi AI mắc phải ở lần sửa đầu cho tin nhắn 2: chỉ sửa giao diện mà chưa nhận ra gốc rễ nằm ở backend, khiến người dùng vẫn vượt được giới hạn ở tin nhắn 3. Cách phát hiện: người dùng tự tay thử lại và báo trực tiếp rằng vẫn vượt được, không phải AI tự phát hiện ra thiếu sót này.

| Tin nhắn | Lệnh chạy | Kết quả |
|---|---|---|
| 3 | npx tsc --noEmit và npx jest --silent | không lỗi, toàn bộ trường hợp đạt, thêm hai trường hợp kiểm thử mới xác nhận chặn cứng và không chặn nhầm khi đã đạt |
| 4 | công cụ kiểm tra kiểu chữ và quy tắc mã nguồn của giao diện | không phát sinh lỗi nào liên quan tới tệp CoachPanel |

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một cơ chế giới hạn chỉ đặt ở giao diện, dựa vào trạng thái có thể bị đặt lại, không phải một cơ chế chặn thật, phải luôn có một lớp chặn cứng ở phía máy chủ dựa trên dữ liệu không thể bị người dùng thao túng. Điều chưa chắc: chưa kiểm thử giao diện này trên nhiều kích thước màn hình khác nhau, chỉ xác nhận qua ảnh chụp người dùng gửi và mô tả bằng lời. Thay đổi cho lần sau: khi sửa giao diện dựa trên mô tả bằng lời hoặc ảnh chụp tĩnh, nên hỏi lại người dùng xác nhận trực tiếp trên trình duyệt thật sau khi sửa, thay vì chỉ tin vào kết quả kiểm tra kiểu chữ và quy tắc mã nguồn.

---

## Việc 7: Thêm câu trả lời mặc định cho lời chào đơn giản

> **Prompt người dùng:** Yêu cầu thêm một câu trả lời mặc định cho lời chào đơn giản kiểu hỏi thăm có thể giúp gì, với ràng buộc quan trọng là hành vi trả lời mặc định này phải tiếp tục hoạt động cả khi ngày mai gắn giao diện lập trình ứng dụng của Gemini vào, để không tốn hạn mức gọi mô hình cho những câu chào không cần thiết.

### Điều tôi hiểu trước khi gọi AI

Yêu cầu không chỉ đơn giản là thêm một câu trả lời cho lời chào, mà còn có ràng buộc quan trọng là hành vi này phải tồn tại độc lập với việc ngày mai đổi sang gọi mô hình Gemini thật, nghĩa là vị trí đặt logic quyết định việc có đạt được mục tiêu tiết kiệm hạn mức hay không.

### Context, tài liệu, file, constraint đã cung cấp

Context là kiến trúc CoachService và StubLlmClient đã biết từ các việc trước. Constraint quan trọng nhất: hành vi phải giữ nguyên bất kể ngày 19 đổi sang client gọi Gemini nào.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Vòng phản hồi quan trọng: dùng công cụ hỏi người dùng để xác nhận vị trí đặt logic trước khi viết, giữa hai phương án đặt ở tầng CoachService trước khi gọi LlmClient, hoặc đặt bên trong StubLlmClient. Người dùng chọn phương án đặt ở tầng CoachService.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo mới tệp coach canned replies, chứa hàm detectGreeting nhận diện lời chào đơn giản bằng biểu thức chính quy, chỉ khớp khi gần như toàn bộ câu là lời chào, và hàm buildGreetingReply trả về một câu chào có nhắc tên bài tập hiện tại kèm lời mời hỏi tiếp.

Sửa tệp coach service, gắn hai hàm này vào, kiểm tra ngay sau bước ghi log tin nhắn người dùng và trước bước gọi tới llmClient chat. Toàn bộ được giữ lại nguyên vẹn. Lý do không đặt trong StubLlmClient: nếu đặt trong StubLlmClient thì logic này sẽ biến mất ngay khi ngày 19 thay StubLlmClient bằng một client gọi mô hình thật, không đạt được mục tiêu tiết kiệm hạn mức mà người dùng nêu rõ trong yêu cầu.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết tệp coach canned replies spec với mười sáu trường hợp: chín câu chào phải nhận diện được, sáu câu chứa từ chào nhưng có nội dung hỏi thêm không được nhận nhầm, một kiểm tra nội dung câu trả lời có nhắc đúng tên bài tập. Thêm một trường hợp tích hợp trong coach service spec xác nhận mockLlmClient chat không được gọi khi tin nhắn là lời chào.

```
npx tsc --noEmit
npx jest --silent
```

Kết quả: không lỗi kiểu, hai mươi hai bộ kiểm thử đạt với một trăm chín mươi bốn trường hợp đạt. Không phát hiện lỗi AI nào ở việc này, các trường hợp kiểm thử đạt ngay từ lần chạy đầu tiên.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi một yêu cầu có ràng buộc về việc tồn tại qua một thay đổi kiến trúc tương lai, phải hỏi rõ vị trí đặt logic trước khi viết, không tự chọn vị trí thuận tiện nhất trong hiện tại. Điều chưa chắc: chưa rõ tập lời chào tiếng Việt hiện tại đã đủ bao quát các cách chào phổ biến khác của học viên hay chưa. Thay đổi cho lần sau: khi ngày 19 gắn Gemini thật vào, cần chạy lại đúng bộ kiểm thử coach canned replies spec để xác nhận lời chào vẫn không lọt tới mô hình thật, coi đây là một trường hợp kiểm thử hồi quy bắt buộc.

---

## Việc 8: Tự rà soát lại toàn bộ công việc trong ngày và bổ sung phần còn thiếu

> **Prompt người dùng:** Yêu cầu kiểm tra lại toàn bộ nhiệm vụ trong ngày xem có sai sót hay thiếu sót gì không, kèm dán lại nguyên văn nội dung nhiệm vụ ngày 18 một lần nữa để đối chiếu. Người dùng dặn thêm ba yêu cầu về hình thức tài liệu: nếu công việc phát sinh yêu cầu tài liệu thì phải ghi vào thư mục tài liệu riêng của ngày 18, tệp AI worklog phải ghi lại đầy đủ chi tiết, và phần trích dẫn yêu cầu của người dùng phải ghi thẳng nguyên văn thay vì diễn giải lại kiểu tường thuật gián tiếp, đồng thời không dùng ký tự đặc biệt, không dùng ngôn ngữ ngoài tiếng Việt, không dùng dấu gạch ngang.

### Điều tôi hiểu trước khi gọi AI

Đây là yêu cầu tự kiểm tra độc lập, không phải tin tưởng vào báo cáo đã tự viết trước đó là đã hoàn chỉnh. Cần đối chiếu lại từng điều kiện nghiệm thu của đề bài gốc với thực tế đã làm, và viết lại tài liệu theo đúng định dạng nêu ra.

### Context, tài liệu, file, constraint đã cung cấp

Context là toàn bộ tám việc đã làm trong ngày và bốn điều kiện nghiệm thu gốc của đề bài ngày 18. Constraint mới về định dạng tài liệu như đã nêu ở trên.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính: tự rà soát, không chờ người dùng chỉ ra lỗi. Đây là vòng phản hồi có tính chất khác các việc trước, vì không có một lỗi cụ thể nào được người dùng chỉ ra trước, mà là yêu cầu tự đối chiếu để tìm ra lỗi hoặc thiếu sót nếu có.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tự đối chiếu bốn điều kiện nghiệm thu, phát hiện điều kiện thứ tư, chạy regression theo prompt hoặc phiên bản mô hình, chưa làm đầy đủ. Phát hiện thêm tệp coach eval runner đang chép tay một bản riêng của câu lệnh hệ thống thay vì lấy lại từ tệp coach service.

Sửa các vấn đề này:

1. Xuất câu lệnh hệ thống từ tệp coach service. Phần loại bỏ: bản chép tay riêng trong tệp coach eval runner. Phần giữ lại và chỉnh sửa: tệp coach eval runner nhập lại đúng nguyên văn từ coach service. Lý do: tránh rủi ro hai bản lệch nhau theo thời gian mà không ai biết.
2. Thêm hàm getEvalRunVersion tại tệp coach eval runner, trả về một mã băm ngắn tính từ nội dung câu lệnh hệ thống cùng tên lớp mô hình đang dùng.
3. Thêm trường runVersion vào kiểu dữ liệu EvalSummary.
4. Sửa script generate baseline report, ngoài tệp báo cáo mới nhất luôn bị ghi đè, thêm việc lưu một bản vào thư mục reports history đặt tên theo mã băm và tên lớp mô hình, không bị ghi đè giữa các lần chạy khác phiên bản.
5. Thêm một trường hợp kiểm thử mới trong coach eval spec xác nhận trường runVersion được gắn đúng định dạng.

Tạo mới tài liệu tại `learning-hub/docs/day18/coach-eval-harness-spec.md`, theo đúng văn phong tài liệu kỹ thuật đã có sẵn ở các ngày trước trong cùng thư mục. Viết lại toàn bộ tệp AI worklog theo đúng yêu cầu định dạng, thay thế hoàn toàn bản cũ, vì bản cũ được viết trước khi có yêu cầu định dạng cụ thể này.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Lỗi AI mắc phải: khi hoàn thành Việc 3 và tự báo cáo, đã kết luận điều kiện chạy regression theo phiên bản là đạt, nhưng thực tế chưa có cơ chế ghi lại phiên bản nào cả, chỉ là một lời khẳng định không có bằng chứng đi kèm. Cách phát hiện: chỉ xảy ra khi được yêu cầu tường minh phải tự rà soát lại, không phải AI tự nhận ra thiếu sót này trong lúc làm Việc 3.

Chạy trong thư mục backend:

```
npx tsc --noEmit
npx jest coach
npx jest --silent
npm run eval:coach
```

Kết quả lần lượt: không lỗi kiểu; tám bộ kiểm thử đạt với chín mươi hai trường hợp đạt; hai mươi hai bộ kiểm thử đạt với một trăm chín mươi lăm trường hợp đạt; báo cáo nền một trăm trên một trăm trường hợp đạt, có in mã băm phiên bản và tên lớp mô hình, có sinh thêm tệp trong thư mục reports history.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một báo cáo tự viết ngay sau khi hoàn thành công việc có xu hướng đánh giá lạc quan hơn thực tế, việc yêu cầu rà soát lại một cách độc lập sau đó là một bước cần thiết chứ không phải thừa. Điều chưa chắc: chưa rõ liệu còn điều kiện nghiệm thu nào khác bị đánh giá quá lạc quan mà lần rà soát này chưa phát hiện ra. Thay đổi cho lần sau: nên đưa việc tự đối chiếu từng điều kiện nghiệm thu với bằng chứng cụ thể, không chỉ bằng lời khẳng định, thành một bước bắt buộc ngay trong lúc làm việc, không đợi tới khi được yêu cầu rà soát riêng.

---

## Việc 9: Kiểm tra lại toàn bộ từ đầu bằng cách chạy trực tiếp mọi lệnh, không tin vào báo cáo cũ

> **Prompt người dùng:** Yêu cầu kiểm tra lại tất cả nhiệm vụ trong ngày, xác nhận thật sự đúng và đã hoàn tất hết hay chưa.

### Điều tôi hiểu trước khi gọi AI

Đây là lần rà soát thứ hai trong ngày, khác với Việc 8 ở chỗ Việc 8 chỉ đối chiếu bốn điều kiện nghiệm thu bằng cách đọc lại code, còn lần này cần tự tay chạy lại toàn bộ lệnh kiểm thử, build, và các tài liệu đã viết để xác nhận bằng chứng thật, không dựa vào kết luận đã viết sẵn từ các việc trước.

### Context, tài liệu, file, constraint đã cung cấp

Context là toàn bộ chín việc đã làm trong ngày, bao gồm cả các tệp tài liệu vừa viết ở Việc 8.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính: kiểm tra lại tất cả, không giới hạn phạm vi cụ thể, nên tự quyết định mức độ kiểm tra cần thiết, bao gồm cả những phần chưa từng được xác minh trực tiếp trong ngày như lệnh build của cả hai phía backend và giao diện.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Chạy lại toàn bộ kiểm thử, kiểm tra kiểu, và quy tắc mã nguồn của backend, phát hiện hai vấn đề lint thật phát sinh từ các lần sửa trước đó trong ngày chưa được dọn sạch: tệp coach eval runner chưa được định dạng lại sau lần sửa gần nhất, và tệp coach policy còn một biến giải cấu trúc không dùng tới do cách viết cũ. Sửa cả hai: chạy công cụ định dạng tự động cho tệp thứ nhất, và với tệp thứ hai, thay cách giải cấu trúc bỏ một trường bằng cách xây dựng lại đối tượng tường minh chỉ với các trường cần giữ, tránh tạo ra một biến không dùng tới.

Chạy thử lệnh build của backend, thành công. Chạy thử lệnh build của giao diện, phát hiện thất bại với ba lỗi kiểu ở ba tệp không liên quan tới AI Coach. Để xác minh đây có phải lỗi do việc trong ngày gây ra hay không, tạm cất toàn bộ thay đổi trong ngày sang một nơi lưu trữ tạm, chạy lại lệnh build ở trạng thái sạch của nhánh, kết quả vẫn thất bại với đúng ba lỗi đó, xác nhận đây là lỗi có sẵn từ trước, không liên quan tới công việc ngày 18. Khôi phục lại toàn bộ thay đổi trong ngày sau khi xác minh xong.

Đọc lại toàn bộ tệp AI worklog đã viết ở Việc 8, phát hiện nhiều lệnh trong các khối mã minh họa bị viết sai cú pháp thật, ví dụ một lệnh của công cụ quản lý gói bị thiếu dấu hai chấm bắt buộc trong tên script, hai công cụ kiểm tra kiểu và kiểm thử bị viết bằng chữ thường thay vì đúng cờ dòng lệnh, và tên hai tệp kiểm thử bị viết cách nhau bằng khoảng trắng thay vì đúng tên tệp thật có dấu gạch ngang và dấu chấm. Nguyên nhân là do áp dụng quá cứng yêu cầu không dùng dấu gạch ngang vào cả phần mã lệnh kỹ thuật, vốn không phải văn xuôi và không thể đổi cú pháp mà vẫn chạy đúng. Sửa lại toàn bộ sáu khối mã lệnh trong tài liệu về đúng cú pháp thật, đã tự chạy thử từng lệnh để xác nhận trước khi ghi vào tài liệu.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Lỗi AI mắc phải, có hai loại. Một, hai lỗi quy tắc mã nguồn tồn đọng từ các lần sửa trước trong ngày mà không bước kiểm chứng nào trước đó phát hiện ra, vì các lần kiểm chứng trước chỉ chạy kiểm thử và kiểm tra kiểu, không chạy công cụ kiểm tra quy tắc mã nguồn trên đúng phạm vi tệp vừa sửa. Hai, nhiều lệnh minh họa trong tài liệu bị viết sai cú pháp do áp dụng máy móc một constraint về hình thức văn bản sang cả phần mã lệnh kỹ thuật, lẽ ra phải nhận ra ngay từ lúc viết rằng lệnh trong khối mã phải giữ nguyên cú pháp thật để người đọc copy chạy được.

Cách phát hiện: tự chạy lại từng lệnh trong tài liệu thay vì chỉ đọc lại bằng mắt, thử tạm cất thay đổi để so sánh trạng thái sạch với trạng thái đã sửa nhằm phân biệt lỗi do mình gây ra với lỗi có sẵn từ trước.

Chạy trong thư mục backend:

```
npx eslint "src/modules-api/coach/**/*.ts"
npx tsc --noEmit
npx jest --silent
npm run eval:coach
```

Kết quả: quy tắc mã nguồn chỉ còn lỗi tồn đọng có sẵn từ trước không liên quan tới ngày 18, đã xác nhận qua việc đối chiếu với diff; không lỗi kiểu; hai mươi hai bộ kiểm thử đạt với một trăm chín mươi lăm trường hợp đạt; báo cáo nền một trăm trên một trăm trường hợp đạt. Chạy thêm lệnh build ở cả backend và giao diện, backend thành công, giao diện thất bại vì lỗi có sẵn từ trước đã xác minh không liên quan tới công việc ngày 18.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một constraint về hình thức trình bày văn bản, như việc không dùng một loại ký tự nào đó, không được áp dụng máy móc vào phần nội dung mang tính kỹ thuật như lệnh dòng lệnh hay tên tệp, vì phần đó phải đúng sự thật tuyệt đối để người đọc dùng lại được, khác với phần văn xuôi mô tả có thể diễn đạt lại tự do. Điều học được thứ hai: kiểm chứng bằng cách đọc lại kết luận cũ không đủ, phải tự chạy lại để xác nhận, và khi nghi ngờ một lỗi có phải do mình gây ra hay không, cách xác minh chắc chắn nhất là so sánh trực tiếp giữa trạng thái có thay đổi và trạng thái sạch của nhánh.

Điều chưa chắc: chưa rõ liệu ba lỗi kiểu ở giao diện có phải là vấn đề người dùng đã biết từ trước và đang xử lý riêng hay không, hay đây là thông tin mới cần báo ngay.

Thay đổi cho lần sau: khi có một constraint về hình thức tài liệu, nên hỏi rõ ngay từ đầu rằng constraint đó áp dụng cho toàn văn bản hay chỉ cho phần văn xuôi, không tự suy diễn rồi áp dụng sai phạm vi. Ngoài ra, bước kiểm chứng cuối mỗi việc nên luôn bao gồm công cụ kiểm tra quy tắc mã nguồn trên đúng những tệp vừa sửa, không chỉ kiểm thử và kiểm tra kiểu.

---

## Đối chiếu với điều kiện nghiệm thu ngày 18

| Điều kiện | Trạng thái | Ghi chú |
|---|---|---|
| Có kiểm tra leakage full solution | Đạt | Cơ chế nằm ở tệp coach rubric, chấm điểm rò rỉ bằng không tuyệt đối nếu lộ khối mã từ sáu dòng trở lên khi chưa đủ điều kiện hoặc nếu ngữ cảnh chứa trường solutionCode |
| LLM judge được đối chiếu mẫu thủ công | Đạt, với giới hạn đã nêu | Giám khảo là dựa trên luật vì kho mã nguồn chưa có mô hình ngôn ngữ thật, quá trình đối chiếu thủ công đã tìm ra bốn lỗi thật gồm hai lỗi bộ chặn chèn lệnh và hai lỗi trong chính rubric |
| Regression gate trong CI | Đạt | Tệp coach eval spec tự động chạy trong bước kiểm thử đơn vị có sẵn, thêm một bước riêng in báo cáo nền ra nhật ký và tự thoát với mã lỗi nếu phát hiện rò rỉ |
| Một trăm test cases | Đạt | Bảy mươi trường hợp nhánh chat cộng ba mươi trường hợp nhánh debugLoop, trong đó hai mươi trường hợp nhánh debugLoop tái dùng nguyên từ ngày 17 |
| Cases đúng sai thiếu dữ kiện prompt injection | Đạt | Phân bố đủ bốn nhóm ở cả hai nhánh, riêng nhóm chèn lệnh giả mạo chỉ có ở nhánh chat |
| Rubric correctness pedagogy leakage safety | Đạt | Định nghĩa tại tệp coach rubric, mỗi tiêu chí cho điểm từ không đến một |
| Chạy regression theo prompt model version | Đạt, sau khi bổ sung ở Việc 8 | Trước đó là một thiếu sót thật đã tự phát hiện ra trong lúc rà soát lại |
| Bàn giao Coach eval harness | Đạt | Toàn bộ mã nguồn tại thư mục coach eval trong backend |
| Bàn giao baseline report | Đạt | Tệp tại thư mục eval reports, có bản mới nhất và có bản lưu theo lịch sử phiên bản |

Ngoài chín điều kiện trên, lần kiểm tra lại ở Việc 9 còn phát hiện một vấn đề nằm ngoài phạm vi ngày 18 nhưng cần ghi nhận trung thực: lệnh build của phần giao diện hiện đang thất bại với ba lỗi kiểu ở ba tệp không liên quan tới AI Coach, gồm tệp ContestExamWorkspace, tệp TeacherContestAuthoring, và tệp RegisterPage. Đã xác minh bằng cách tạm cất toàn bộ thay đổi trong ngày và chạy lại ở trạng thái sạch của nhánh, lỗi vẫn xuất hiện y hệt, xác nhận đây là lỗi có sẵn từ trước, không phải do bất kỳ việc nào trong ngày 18 gây ra. Không tự sửa vì nằm ngoài phạm vi được giao, chỉ ghi nhận lại để người dùng biết và quyết định xử lý.
