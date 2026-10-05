Trong Day 22 tôi đã tích hợp API Dataset Registry của Thực tập sinh số 1 để lấy schema và địa chỉ sandbox của bộ dữ liệu bán hàng, giao diện tự dựng cây bảng và cột từ dữ liệu đó thay vì viết cứng. Tôi làm SQL Grader chấm bài bằng cách chạy câu của học viên và câu tham chiếu trên cùng sandbox rồi so sánh dữ liệu trả về, không so sánh chuỗi code, mỗi lần chạy nằm trong giao dịch chỉ đọc có giới hạn thời gian. Phần Insight được chấm bằng Gemini kèm lớp chặn chấm theo từ khóa, và mọi bài nộp DA được lưu vào một collection riêng để giảng viên chấm tay khi AI không chấm được.

Các lỗi đã vá gồm ba việc. Bài DA từng lọt vào catalog công khai và Code Playground dưới dạng bài Python, nay đã bị loại khỏi luồng bài lập trình. Hệ thống chấm Python từng tự gán AC cho bài không có test case, nay chuyển sang trạng thái lỗi và chặn luôn việc nộp code Python vào bài DA. Thuật toán gợi ý cũng đã loại bài DA khỏi danh sách ứng viên.

Ghi chú ôn tập kiến trúc. Hiện tại cả hai loại lab đều dùng Docker nhưng theo hai vai trò khác nhau. SQL Lab cần kết nối TCP tới một Postgres chạy liên tục do team Data quản lý, Learning Hub chỉ là client đăng nhập bằng tài khoản chỉ đọc, còn container Postgres trên máy dev chỉ là bản giả lập sandbox của team Data. Python Sandbox thì ngược lại, là môi trường dùng một lần, mỗi lần chạy code hệ thống tự tạo một container mới không có mạng, giới hạn bộ nhớ, chạy xong là hủy ngay để giải phóng tài nguyên.

## Cơ chế liên kết với Thực tập sinh số 1

Learning Hub và Data & AI Resource là hai hệ thống độc lập, tích hợp với nhau qua REST API theo hợp đồng dữ liệu (data contract). Learning Hub không đọc tệp và không import mã nguồn của số 1; mọi thông tin về dataset đều lấy qua API.

Luồng xử lý khi học viên mở một bài DA Lab:

1. Backend gọi `GET /api/v1/registry/datasets/{id}` tới Dataset Registry của số 1, kèm header `X-API-Key`.
2. Registry trả về metadata của dataset gồm `data_dictionary` (danh sách bảng và cột) và `sandbox_db_url`.
3. Backend chỉ trả cho giao diện phần schema để dựng cây bảng và cột. `sandbox_db_url` được giữ ở backend, không gửi cho trình duyệt.
4. Khi học viên chạy câu SQL, backend kết nối Postgres Sandbox bằng tài khoản chỉ đọc, thực thi trong giao dịch có giới hạn thời gian rồi trả kết quả.

Với AI Lab, backend gọi `GET /api/v1/registry/evaluation-sets/{id}` để lấy bộ câu hỏi và đáp án chuẩn làm căn cứ chấm.

Nguồn dữ liệu được chọn bằng biến `DATA_SERVICE_BASE_URL` trong `BE/.env`:

| Giá trị | Chế độ | Mô tả |
|---|---|---|
| Để trống (hiện tại) | Bản mô phỏng nội bộ | Backend dùng bộ dữ liệu mô phỏng theo đúng hợp đồng, không gọi mạng |
| Địa chỉ server của số 1 | Gọi API thật | Server không phản hồi thì trả lỗi rõ ràng |

Khi hai bên chạy trên hai máy khác nhau, địa chỉ `localhost` chỉ trỏ về máy đang chạy chương trình, nên cần dùng địa chỉ IP hoặc tên miền của máy chạy server số 1. Địa chỉ Postgres Sandbox cũng phải truy cập được từ backend của Learning Hub.

## Theo dõi tích hợp với số 1 (cập nhật ngày 05/10/2026)

### Tình trạng

Server Day 21 của số 1 hiện đã trả thông tin cơ bản của dataset nhưng còn thiếu ba phần mà Learning Hub cần. Trong thời gian chờ, DA Lab và AI Lab chạy bằng bản mô phỏng nội bộ nên không bị chặn và vẫn phục vụ kiểm thử Day 24. Thư mục của số 1 không bị chỉnh sửa. Dự kiến số 1 hoàn thành sau khoảng 2 đến 3 ngày.

### Yêu cầu đã gửi số 1

| STT | Endpoint | Nội dung yêu cầu |
|---|---|---|
| 1 | `GET /api/v1/registry/datasets/{id}` | Bổ sung trường `data_dictionary`: danh sách bảng, mỗi bảng có danh sách cột (tên, kiểu dữ liệu, nullable, khóa chính, khóa ngoại, mô tả). Dữ liệu này đã có ở Task 06 |
| 2 | `GET /api/v1/registry/evaluation-sets/{id}` | Endpoint mới trả bộ câu hỏi chấm AI Lab, mỗi câu gồm `question_id`, `query`, `ground_truth_answer`, `expected_behavior` |
| 3 | Endpoint lấy dữ liệu từng bảng của dataset | Hỗ trợ phân trang hoặc tải dạng tệp, kèm `current_version` và `checksum_sha256`, để nạp vào Postgres Sandbox. Cần xác nhận phiên bản được cấp là `clean` hay `dirty` |

Learning Hub đã đề xuất cấu trúc response cho endpoint số 3 để hai bên thống nhất tên trường. Số 1 cần phản hồi thời điểm hoàn thành, địa chỉ server chung và khóa API sử dụng.

### Phân công trách nhiệm

| Nội dung | Phụ trách |
|---|---|
| Lưu trữ dataset, metadata, `data_dictionary`, bộ câu hỏi đánh giá và cấp API truy xuất | Số 1 |
| Quản lý Postgres Sandbox và thực thi truy vấn của học viên | Learning Hub |
| Nạp dữ liệu vào Postgres Sandbox | Learning Hub, tự động qua API, không sao chép tệp thủ công |

Số 1 không phải cấp địa chỉ kết nối Postgres vì Postgres Sandbox do Learning Hub quản lý. Postgres đang chạy ở môi trường dev do Learning Hub tự dựng ở Day 22: tên bảng và cột khớp với dữ liệu của số 1 nhưng nội dung chỉ là bản thu nhỏ (khoảng 15 đơn hàng), không phải 1.000 đơn hàng của dataset gốc.

### Kế hoạch trong thời gian chờ

- Bổ sung ba endpoint trên vào server mô phỏng theo đúng cấu trúc đã đề xuất.
- Viết kịch bản nạp dữ liệu tự động từ API vào Postgres Sandbox, có kiểm thử trên server mô phỏng.
- Khi số 1 hoàn thành, chỉ cần thay địa chỉ và khóa API trong `BE/.env`.

### Các bước khi số 1 hoàn thành

1. Gọi thử trực tiếp ba endpoint bằng `curl`, xác nhận đủ dữ liệu và đúng cấu trúc đã thống nhất.
2. Nếu tên trường khác với đề xuất thì điều chỉnh phần đọc dữ liệu cho khớp.
3. Cập nhật `DATA_SERVICE_BASE_URL` và `DATA_SERVICE_API_KEY` trong `BE/.env`, khởi động lại backend, chạy `npm run doctor` để xác nhận đã chuyển sang chế độ gọi API thật.
4. Chạy kịch bản nạp dữ liệu và đối chiếu số dòng từng bảng với dataset của số 1.
5. Rà soát các bài DA Lab: dữ liệu thật nhiều hơn nên kết quả truy vấn thay đổi, các bài ghi sẵn số liệu trong đề cần điều chỉnh.
6. Kiểm tra lại DA Lab và AI Lab bằng tài khoản học viên.

### Lưu ý

- Cần cố định phiên bản dữ liệu và bản `clean` hoặc `dirty` cho từng bài lab. Nếu dữ liệu thay đổi mà không đổi phiên bản, các bài có số liệu cố định sẽ cho kết quả sai mà không có cảnh báo.
- Khi server của số 1 ngừng hoạt động, phần dữ liệu SQL của môi trường mới không thể khởi tạo. Môi trường phát triển dùng bản mô phỏng làm dự phòng; môi trường triển khai thật phải báo lỗi rõ ràng.
- Chỉ ghi nhận là đã tích hợp tự động khi kịch bản nạp dữ liệu hoạt động với server thật của số 1. Hiện tại vẫn là bản mô phỏng.
