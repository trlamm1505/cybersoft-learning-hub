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
| Để trống | Bản mô phỏng nội bộ | Backend dùng bộ dữ liệu mô phỏng theo đúng hợp đồng, không gọi mạng |
| Địa chỉ server của số 1 (hiện tại `http://127.0.0.1:8000`) | Gọi API thật | Server không phản hồi thì trả lỗi rõ ràng |

Khi hai bên chạy trên hai máy khác nhau, địa chỉ `localhost` chỉ trỏ về máy đang chạy chương trình, nên cần dùng địa chỉ IP hoặc tên miền của máy chạy server số 1. Địa chỉ Postgres Sandbox cũng phải truy cập được từ backend của Learning Hub.

## Theo dõi tích hợp với số 1 (hoàn tất ngày 06/10/2026)

### Trạng thái

Hoàn tất. Số 1 đã cập nhật đủ ba endpoint, Learning Hub đã chuyển từ bản mô phỏng sang gọi server thật (`DATA_SERVICE_BASE_URL=http://127.0.0.1:8000`, `npm run doctor` báo "server ngoài"). Dữ liệu được nạp vào Postgres Sandbox hoàn toàn qua API bằng `npm run ingest:sandbox`, không sao chép tệp thủ công. Thư mục của số 1 không bị chỉnh sửa.

### Đối chiếu hợp đồng: chênh lệch thực tế và cách xử lý

Cả ba endpoint trả đúng dữ liệu nhưng tên trường khác với bản đề xuất. Phần chuyển đổi nằm ở `DatasetIntegrationService`, FE và các bài lab không phải sửa.

| Endpoint | Đề xuất của Learning Hub | Thực tế server số 1 | Xử lý |
|---|---|---|---|
| `GET /datasets/{id}` | `data_dictionary: { tables: [{ name, columns: [{ name, type, pk, fk }] }] }` | `data_dictionary: [{ table_name, columns: [{ name, data_type, is_primary_key, is_foreign_key, foreign_key_target }] }]` (mảng, không bọc `tables`) | Chuẩn hóa về dạng nội bộ cũ |
| `GET /datasets/{id}` | `sandbox_db_url` | Không có | Chủ động: Postgres Sandbox do Learning Hub quản lý nên chuỗi kết nối dựng từ cấu hình sandbox, vẫn không gửi ra trình duyệt |
| `GET /evaluation-sets/{id}` | `items`; `expected_behavior` là `ANSWER`/`ABSTAIN`; `category` là loại câu | `questions`. Bộ `eval-rag-golden-v1` đúng quy ước; bộ `eval-policy-curriculum-v1` ghi `expected_behavior` bằng câu mô tả rubric ("Return factual answer...") và `category` bằng chủ đề (Academic Policy...) | Đọc cả `items` lẫn `questions`; dịch rubric sang `ANSWER`/`ABSTAIN` và loại câu, rubric lạ thì báo lỗi |
| `GET /datasets/{id}/tables/{bảng}` | Phân trang hoặc tệp, kèm version và checksum | Đúng đề xuất: JSON phân trang hoặc `format=csv`; header `X-Checksum-SHA256`, `X-Total-Rows`, `X-Data-Variant`; tham số `variant=clean` hoặc `dirty` | Dùng nguyên |
| Mã evaluation set | 8 bộ riêng cho 8 bài AI Lab (`eval-cs-*`) | Server chỉ có 2 bộ lớn: `eval-rag-golden-v1` (30 câu) và `eval-policy-curriculum-v1` (100 câu) | Mỗi bài AI Lab là một "lát" danh sách `question_id` (`eval-slices.ts`); nội dung câu hỏi và đáp án luôn lấy từ server thật |

Kiểu dữ liệu `DATETIME` trong từ điển của số 1 được đổi thành `TIMESTAMP` khi tạo bảng Postgres.

### Đối soát nạp dữ liệu (variant clean, v1.0, schema `public`)

Kịch bản kiểm tra theo thứ tự: checksum tệp tải về so với header, so với checksum của phản hồi JSON, tên cột CSV so với từ điển, số dòng so với `X-Total-Rows` và `row_count`, rồi đếm lại trong Postgres. Sai một điều kiện là hủy cả giao dịch, sandbox giữ nguyên.

| Bảng | Dòng ở nguồn | Dòng trong Postgres | SHA-256 (12 ký tự đầu) |
|---|---|---|---|
| customers | 200 | 200 | `3f1c14f32c4c` |
| employees | 20 | 20 | `92e42a6e63a0` |
| products | 50 | 50 | `25b2a7df1071` |
| orders | 1.000 | 1.000 | `ac5e353b4ddd` |
| order_details | 1.803 | 1.803 | `bf07ccd995fd` |
| Tổng | 3.073 | 3.073 | |

- Cả 5 checksum trùng với checksum ghi trong tệp seed SQL của số 1 (`postgres_sandbox_retail_sales_clean.sql`).
- Toàn vẹn: 0 đơn hàng mồ côi, tổng `order_details.line_total` khớp `orders.total_amount` ở cả 1.000 đơn, ràng buộc PK/FK tạo đầy đủ.
- Bản `dirty` nạp riêng vào schema `dirty` (toàn cột TEXT, không ràng buộc, `lab_reader` chỉ đọc): cũng 5 bảng, 3.073 dòng, 5 checksum khớp. Các bài lab hiện chỉ dùng `clean`.
- Kết quả ghi vào bảng `_ingest_manifest` (phiên bản, checksum, số dòng, thời điểm nạp), dùng để kiểm tra dữ liệu đang có đúng phiên bản nào.
- So với bản mô phỏng cũ: 3.073 dòng thay cho 62 dòng (15 đơn, 24 dòng chi tiết, 10 khách hàng, 5 nhân viên, 8 sản phẩm).

### Ảnh hưởng tới DA Lab và AI Lab

Câu tham chiếu của DA Lab chạy lại trên sandbox mỗi lần chấm nên tự khớp dữ liệu thật; chỉ cần rà phần đề bài ghi sẵn số liệu.

| Bài | Vấn đề với dữ liệu thật | Điều chỉnh |
|---|---|---|
| `da-sql-09` | Ngưỡng 30 triệu: cả 20/20 nhân viên đều vượt (mỗi người khoảng 290 đến 600 triệu), điều kiện lọc mất ý nghĩa | Nâng ngưỡng lên 400 triệu, còn 6/20 nhân viên |
| `da-insight-02` | Rubric nhắc "số đơn ít, thiếu quý"; dữ liệu thật có 6 quý liên tục | Sửa thành "chỉ 6 quý, chưa đủ kết luận mùa vụ" |
| `da-insight-05` | Đề giả định có bất thường giữa trạng thái đơn và ngày giao; dữ liệu thật nhất quán (Completed và Shipping có ngày giao, Pending và Cancelled không) | Đề và rubric cho phép kết luận "không bất thường" kèm bằng chứng |
| `ai-lab-04` | Câu Q057 trong bộ thật thuộc loại tổng hợp nhiều điều kiện, lệch với bài chỉ có câu một bước | Thay bằng Q012 (câu một bước) |

Các bài còn lại không cần sửa. Số dòng kết quả của câu tham chiếu 10 bài SQL trên dữ liệu thật: 133, 10, 2, 4, 3, 3, 12, 7, 6, 50.

Phát hiện thêm: backend nạp bài DA Lab theo kiểu chỉ chèn bài mới, nên sửa đề trong mã không tới được CSDL đã có (bài 9 chấm sai vì câu tham chiếu cũ vẫn dùng ngưỡng 30 triệu). Đã đổi sang đồng bộ ghi đè nội dung theo `slug`, giống AI Lab.

### Kiểm thử

| Bộ kiểm thử | Kết quả |
|---|---|
| Backend (Jest): unit, integration, contract trên phản hồi chụp từ server thật | 64 bộ, 769 đạt, 2 bỏ qua (bộ live) |
| Contract test trực tiếp với server thật (`DATA_SERVICE_CONTRACT_URL=http://127.0.0.1:8000`) | 16/16 đạt |
| Frontend (Vitest) | 13 bộ, 79 đạt; kiểm tra kiểu TypeScript không lỗi |
| Kịch bản setup và nạp dữ liệu (`npm run test:scripts`) | 14/14 đạt |
| Biên dịch backend (`nest build`) | Đạt |
| `npm run doctor` | Docker, backend, MongoDB, nguồn dữ liệu "server ngoài", Postgres sandbox, Python đều đạt; chỉ web chưa bật khi kiểm tra |
| Chạy thật bằng tài khoản học viên (tài khoản thử đã xóa) | 10/10 bài SQL được chấm ACCEPTED; 8 bài AI Lab tải đúng bộ câu hỏi từ server thật; 3 bài (04, 05, 08) nộp thử đạt PASSED |

### Cách vận hành

1. Bật server của số 1, đặt `DATA_SERVICE_BASE_URL` và `DATA_SERVICE_API_KEY` trong `BE/.env`.
2. `npm run sandbox`, rồi `npm run ingest:sandbox` (thêm `--variant dirty` hoặc `--dry-run` nếu cần), khởi động lại backend.
3. `npm run doctor` để xác nhận đang ở chế độ server ngoài.

### Còn lại và lưu ý

- Khóa API đang dùng là khóa vai trò `student` của môi trường dev; môi trường thật cần xin số 1 khóa riêng cho Learning Hub.
- Địa chỉ hiện là `127.0.0.1`, hai bên chạy cùng máy. Khi tách máy cần đổi sang IP hoặc tên miền và mở cổng; địa chỉ Postgres Sandbox cũng phải truy cập được từ backend.
- Vẫn cần cố định phiên bản: nếu số 1 đổi dữ liệu mà không đổi `current_version` thì checksum trong `_ingest_manifest` sẽ lệch; chạy lại kịch bản nạp để phát hiện và đồng bộ.
- Server của số 1 ngừng hoạt động thì không nạp được dữ liệu mới và backend báo lỗi rõ ràng. Muốn dev chạy tạm bằng dữ liệu tích hợp sẵn thì đặt `DATA_SERVICE_FALLBACK=embedded`.
- Endpoint evaluation set của số 1 chưa có checksum riêng; Learning Hub tự tính từ câu hỏi và đáp án để ghi vào bản chạy, nên cần số 1 giữ ổn định mã câu hỏi.
