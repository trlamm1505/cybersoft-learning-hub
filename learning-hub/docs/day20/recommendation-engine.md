# Day 20: Recommendation Engine

Tài liệu mô tả cơ chế nghiệp vụ đã triển khai trong Ngày 20 — tính độ thành thạo theo chủ đề (mastery) và gợi ý bài tập kế tiếp cho học viên, cùng các cơ chế kiểm soát an toàn được bổ sung khi xử lý phần tồn đọng của Ngày 19.

## 1. Mô hình tính toán độ thành thạo (Mastery Calculation)

Độ thành thạo của một học viên với một tag được tính từ toàn bộ lượt nộp bài (attempt) đã chấm xong có gắn tag đó:

```
Mastery(tag) = (Số lần nộp đạt chuẩn AC / Tổng số lần nộp đã chấm) x 100
```

Các lượt nộp còn ở trạng thái `QUEUED` hoặc `RUNNING` bị loại khỏi phép tính vì chưa có kết quả xác định. Một bài tập có nhiều tag thì mỗi lượt nộp của bài đó được tính vào mastery của tất cả các tag liên quan — một bài vừa gắn tag `loop` vừa gắn tag `array` thì một lượt AC là bằng chứng cho cả hai.

Ba ngưỡng quy ước dùng xuyên suốt engine:

- **Ngưỡng yếu, cần ôn luyện**: mastery dưới 50%.
- **Ngưỡng nắm vững**: mastery từ 80% trở lên.
- **Số lần nộp tối thiểu để số liệu có ý nghĩa thống kê**: 3 lần. Một tag mới có 1 lượt AC duy nhất không được coi là "nắm vững 100%" ngay lập tức.

## 2. Cơ chế ba quy tắc gợi ý bài tập (Recommendation Rules)

Engine chạy tuần tự ba nhánh độc lập, mỗi nhánh trả về tối đa một gợi ý. Không nhánh nào bắt buộc phải có kết quả — nếu điều kiện không thỏa, nhánh đó bị bỏ qua thay vì báo lỗi.

**Ôn tập (Remediation)**

Áp dụng cho tag có mastery thấp nhất trong số các tag đã đạt đủ 3 lần nộp. Nếu chưa tag nào đủ 3 lần, hệ thống lấy tag có lượt nộp thất bại gần nhất theo thời gian. Bài được chọn là bài dễ nhất trong tag đó mà học viên chưa giải.

**Nâng cao (Progression)**

Áp dụng cho tag đã đạt mastery từ 80% trở lên, với điều kiện tag đó cũng có ít nhất 3 lượt nộp. Nếu chưa tag nào đạt ngưỡng này, hệ thống lấy tag được luyện tập nhiều lần nhất làm phương án dự phòng. Bài được chọn là bài có độ khó cao hơn trong cùng tag mà học viên chưa giải.

**Khám phá (Exploration)**

Chọn một tag mà học viên chưa từng thử qua trong toàn bộ ngân hàng đề, gợi ý một bài ở mức độ dễ của tag đó. Đây là nhánh đảm bảo hệ thống không khóa học viên vào một lộ trình cố định xoay quanh các tag đã quen — kể cả khi remediation và progression đều đã có kết quả, exploration vẫn được thêm vào nếu còn tag mới.

Mỗi gợi ý trả về kèm một chuỗi `reason` diễn giải bằng số liệu thực tế của học viên (ví dụ: "Mastery tag X đang ở 33.3%, thấp nhất trong các tag đã làm"), không phải một nhãn cố định — mục tiêu là học viên đọc được lý do cụ thể tại sao bài này được gợi ý.

## 3. Cơ chế kiểm soát và an toàn thực thi

Ba cơ chế sau được bổ sung khi xử lý các vấn đề tồn đọng liên quan tới pipeline AI Tạo Đề của Ngày 19, vận hành song song với engine gợi ý:

**Phê duyệt của con người (human-in-the-loop) cho cảnh báo trùng lặp.** Khi một bài do AI sinh ra bị gắn cờ trùng lặp ở mức cảnh báo (không phải trùng tuyệt đối), giáo viên có quyền tự đối chiếu và xác nhận bỏ qua để lưu bài vào ngân hàng đề. Xác nhận này được ghi lại cùng thời điểm và người phê duyệt, không phải một thao tác ẩn.

**Sửa trực tiếp và kiểm thử tại chỗ.** Giáo viên có thể chỉnh sửa tiêu đề, mô tả và mã nguồn lời giải ngay trên giao diện, sau đó chạy lại toàn bộ kiểm thử mà không cần gọi lại mô hình sinh đề. Việc này tách rời hai chi phí khác nhau: sinh nội dung (tốn lượt gọi AI) và xác minh nội dung (chỉ tốn thời gian chạy test).

**Phân tách kiểm tra AST cho Python.** Guard kiểm tra mã nguồn trước khi thực thi không còn chặn toàn bộ thư viện `sys` như một khối — `sys.stdin`, `sys.stdout`, `sys.argv` được cho phép vì đây là cách đọc/ghi dữ liệu hợp lệ và phổ biến trong bài tập lập trình. Guard chỉ chặn riêng các thuộc tính có khả năng can thiệp vào tiến trình hệ thống: `sys.exit`, `sys.modules`, `sys.path`, `sys._getframe` và nhóm hàm liên quan đến introspection/debug ở tầng sâu.

## 4. Hạn chế về mặt thiết kế (Known Limitations)

**Mastery bị kéo tụt bởi các lần thử sai trước đó.** Công thức tính trên tổng số lượt nộp, không phải trên số lần thử độc lập gần nhất. Một học viên sai 5 lần rồi đúng ở lần thứ 6 chỉ đạt mastery khoảng 16.7% cho tag đó, dù cuối cùng đã giải được bài — mastery phản ánh tỷ lệ thành công tích lũy, không phản ánh trạng thái nắm vững hiện tại.

**Không có hệ số suy giảm theo thời gian.** Một tag học viên đạt 90% mastery cách đây sáu tháng và một tag vừa đạt 90% mastery hôm nay được engine đối xử như nhau. Không có cơ chế nào làm giảm độ tin cậy của số liệu cũ khi học viên đã lâu không động vào tag đó.

**Tính toán trực tiếp từ bảng lịch sử nộp bài mỗi lần tải trang.** Mastery và danh sách gợi ý được tính lại từ đầu trên toàn bộ lịch sử nộp bài của học viên mỗi khi gọi API, không có tầng cache hay bảng tổng hợp trung gian. Với khối lượng dữ liệu nộp bài hiện tại việc này chưa gây vấn đề, nhưng sẽ trở thành điểm nghẽn khi lịch sử nộp bài của một học viên tăng lên đáng kể.

## 5. Các điểm nghi vấn và lỗi tiềm ẩn cần xử lý tiếp

**Rủi ro rỗng danh sách.** Đã kiểm tra: khi học viên giải hết toàn bộ bài của tag đang được remediation hoặc progression nhắm tới, nhánh đó tự bỏ qua thay vì lỗi. Khi học viên đã thử qua toàn bộ tag hiện có trong ngân hàng đề, nhánh exploration cũng không có gì để gợi ý và trả về danh sách trống thay vì tạo gợi ý giả. Cả ba tình huống đều có kiểm thử riêng xác nhận hành vi này, không cần xử lý thêm.

**Xung đột định dạng số nguyên.** Đã xử lý: logic so khớp kết quả hiện chỉ áp dụng dung sai số thực khi cả hai vế đều ở dạng thập phân hoặc khoa học (có dấu chấm hoặc ký hiệu e/E). Chuỗi số nguyên thuần, bao gồm cả dạng có số không dẫn đầu như "007", được so sánh như chuỗi tuyệt đối sau khi cắt khoảng trắng — "007" và "7" được coi là khác nhau. Có kiểm thử riêng cho trường hợp này.

**Đồng bộ trạng thái sau khi sửa.** Đã xác minh phần cốt lõi: khi giáo viên bấm lưu, backend không tin bất kỳ kết quả kiểm thử nào được tính từ trước, kể cả kết quả revalidate — nó luôn chạy lại toàn bộ kiểm tra trên đúng nội dung mã nguồn tại thời điểm lưu trước khi ghi vào ngân hàng đề. Vì vậy dữ liệu ghi xuống luôn khớp với bản đã sửa, không có khả năng lưu nhầm bản nháp cũ.

Tuy nhiên còn một khoảng hở ở tầng hiển thị: nếu giáo viên sửa mã nguồn nhưng chưa bấm chạy lại kiểm thử, giao diện vẫn hiển thị kết quả kiểm thử của lần chạy trước đó — tức là banner trạng thái và danh sách test case trên màn hình có thể không phản ánh đúng mã nguồn hiện tại trong ô soạn thảo. Vì lệnh lưu ở backend luôn tự kiểm tra lại nên không có rủi ro về dữ liệu, nhưng có thể gây hiểu lầm ngắn hạn cho giáo viên nếu họ đọc banner cũ mà không nhận ra nó chưa cập nhật. Hướng xử lý hợp lý là đánh dấu kết quả kiểm thử cũ là lỗi thời ngay khi nội dung bị sửa, thay vì để nguyên đến khi giáo viên chủ động chạy lại.
