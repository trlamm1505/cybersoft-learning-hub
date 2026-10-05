# Chính sách giám sát tính trung thực trong học tập và thi đấu

Bản thảo dành cho nền tảng CyberSoft Learning & Contest Hub. Chính sách xây dựng trên ba nguyên tắc: phân tích dữ liệu có trách nhiệm, bảo vệ quyền riêng tư ngay từ khâu thiết kế, và giữ con người ở vị trí quyết định cuối cùng.

## 1. Mục đích và phạm vi

### 1.1 Mục đích

- Bảo đảm môi trường học tập và thi đấu công bằng cho tất cả học viên.
- Hỗ trợ giảng viên nắm bắt tiến độ làm bài và xem xét các trường hợp có dấu hiệu bất thường.

Dữ liệu thu thập chỉ phục vụ hai mục đích trên. Dữ liệu không được dùng để xếp loại, chấm điểm hay xử lý học viên một cách tự động.

### 1.2 Phạm vi áp dụng

- Bài thực hành lập trình trong Code Playground.
- Các cuộc thi trên nền tảng. Giảng viên có thể bật hoặc tắt việc ghi nhận tín hiệu cho từng cuộc thi; mặc định là bật.

Chính sách áp dụng cho học viên đang làm bài và cho giảng viên được phân công xem xét. Trắc nghiệm trong cuộc thi chỉ ghi nhận thời gian và việc rời màn hình, không áp dụng so sánh mã nguồn.

## 2. Dữ liệu thu thập tối thiểu

Nền tảng chỉ ghi nhận những dữ liệu cần thiết cho mục đích ở mục 1. Học viên được thông báo rõ ràng bằng một khung thông báo hiển thị ở đầu trang làm bài và trước khi vào phòng thi.

### 2.1 Dòng thời gian làm bài

| Nội dung | Cách ghi nhận |
|---|---|
| Thời điểm bắt đầu | Với cuộc thi, do máy chủ ghi khi học viên bấm vào thi. Với bài thực hành, lấy từ trình duyệt nhưng được giới hạn không vượt quá thời điểm nộp |
| Mốc lưu mã nguồn | Ghi thưa, tối đa một mốc mỗi 30 giây và không quá 50 mốc. Mỗi mốc chỉ gồm thời điểm và độ dài mã, không lưu nội dung đã gõ |
| Thời điểm nộp bài | Luôn do máy chủ ghi, không lấy từ trình duyệt |
| Thời gian thao tác thực tế | Tổng thời gian làm bài trừ đi thời gian rời màn hình làm bài |

### 2.2 Sự kiện rời màn hình làm bài

Chỉ ghi nhận số lần và tổng thời lượng học viên rời khỏi màn hình làm bài, kèm thời điểm rời và quay lại. Nền tảng không ghi học viên chuyển sang trang nào hay ứng dụng nào. Mỗi phiên làm bài ghi tối đa 50 sự kiện.

### 2.3 Độ tương đồng mã nguồn

Độ tương đồng được tính trên mã nguồn bài nộp, so với bài nộp của các học viên khác cho cùng một đề. Trước khi so sánh, hệ thống loại bỏ hoàn toàn:

- các đoạn mã khởi tạo mẫu do đề bài cung cấp;
- chú thích, chuỗi mô tả và khoảng trắng thừa.

Bài quá ngắn sau khi loại bỏ không được so sánh, vì các lời giải ngắn giống nhau là điều bình thường. Hệ thống không bao giờ so một học viên với chính các bài nộp trước đó của họ.

### 2.4 Cam kết không thu thập

Nền tảng không và sẽ không thực hiện các việc sau:

- quay hoặc chụp màn hình học viên;
- truy cập webcam hoặc micro;
- đọc danh sách tiến trình đang chạy trên máy học viên;
- truy cập lịch sử duyệt web hoặc nội dung ngoài trang làm bài;
- ghi lại từng phím bấm hay nội dung gõ theo thời gian thực.

## 3. Nguyên tắc vận hành: không tự động kết luận

- Hệ thống không tự trừ điểm, không hủy kết quả bài làm, không chặn học viên nộp bài và không tự gắn nhãn học viên gian lận.
- Mọi cờ cảnh báo chỉ là tín hiệu tham khảo để đưa bài nộp vào hàng chờ xem xét. Nhãn hiển thị là "cần xem xét", không phải kết luận.
- Tín hiệu và điểm số được lưu tách biệt. Việc duyệt của giảng viên chỉ ghi vào phần tín hiệu, không làm thay đổi điểm hay trạng thái chấm.
- Giảng viên là người duy nhất có thẩm quyền đánh giá bối cảnh, đối chiếu mã nguồn và đưa ra kết luận cuối cùng.

### 3.1 Điều kiện đưa bài vào hàng chờ

Các ngưỡng dưới đây là cấu hình hiện tại và được đặt rộng để hạn chế nhận diện nhầm:

- Độ tương đồng mã nguồn đạt từ 80% trở lên với một bài nộp khác.
- Hoặc học viên rời màn hình từ 5 lần trở lên và tổng thời gian rời từ 3 phút trở lên. Cần đồng thời cả hai điều kiện này.

Các trường hợp sau không bao giờ tự đưa bài vào hàng chờ: chuyển cửa sổ ít lần hoặc trong thời gian ngắn, hai bài chỉ giống nhau ở phần mã khởi tạo mẫu, và nộp bài nhanh đối với bài dễ. Với nộp bài nhanh, hệ thống chỉ ghi nhận mốc thời gian.

## 4. Quy trình xử lý và quyền giải trình của học viên

### 4.1 Quy trình của giảng viên

1. Bài có cờ cảnh báo xuất hiện trong hàng chờ xem xét tính trung thực, dành riêng cho giảng viên và quản trị viên. Học viên không truy cập được hàng chờ này.
2. Giảng viên xem dòng thời gian làm bài, số lần rời màn hình, điểm tương đồng và đối chiếu hai đoạn mã nguồn cạnh nhau.
3. Giảng viên tự đánh giá bối cảnh một cách độc lập, không dựa riêng vào con số của hệ thống.
4. Giảng viên ghi một trong ba kết luận: không có vấn đề, có dấu hiệu bất thường, hoặc cần trao đổi thêm với học viên. Mỗi kết luận bắt buộc kèm lý do bằng văn bản. Hệ thống ghi lại người duyệt và thời điểm duyệt.

### 4.2 Trao đổi và giải trình

- Khi có nghi vấn, giảng viên trao đổi trực tiếp với học viên và để học viên giải thích giải thuật hoặc quá trình thực hiện bài làm.
- Học viên có quyền giải trình đầy đủ và yêu cầu xem xét lại kết quả nếu nhận thấy có nhầm lẫn kỹ thuật, ví dụ cùng dùng một mẫu mã, rời màn hình do sự cố mạng hoặc thiết bị.
- Mọi biện pháp xử lý chỉ được thực hiện sau khi giảng viên đã trao đổi với học viên và không dựa riêng vào tín hiệu của hệ thống.
- Giảng viên có thể cập nhật kết luận sau khi học viên giải trình.

## 5. Phạm vi triển khai hiện tại và nội dung cần xác định

Phần này ghi rõ những gì bản thảo chưa thể cam kết để tránh hiểu nhầm.

- Hàng chờ xem xét cho giảng viên đã hoạt động. Việc giải trình của học viên hiện diễn ra bằng trao đổi trực tiếp; nền tảng chưa có chức năng để học viên nộp giải trình hoặc yêu cầu xem xét lại trực tuyến.
- Học viên chưa tự xem được các tín hiệu đã ghi về mình trên giao diện. Cho tới khi có chức năng này, học viên có thể đề nghị giảng viên cung cấp thông tin đó.
- Thời hạn lưu trữ tín hiệu và người được phép truy cập ngoài giảng viên phụ trách cần được nhà trường hoặc đơn vị đào tạo quyết định trước khi áp dụng chính thức.
- Các ngưỡng ở mục 3.1 là giá trị khởi đầu. Cần theo dõi tỷ lệ bài được kết luận không có vấn đề để điều chỉnh khi có đủ dữ liệu.
