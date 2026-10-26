# Sổ tay mentor — Ngày 14

## Trước buổi học

1. Kiểm tra sáu demo truy cập được; ghi ngày giờ kiểm tra.
2. Chạy `node --test fixtures/tests/fixtures.test.mjs`.
3. Chạy `node fixtures/reset.mjs --mode buggy --lab all`.
4. Kiểm tra token chỉ được cấp qua kênh riêng, không nằm trong file nộp.
5. Chọn lab và đọc `instructor/LAB-xx_GUIDE.md`.

## Khi hướng dẫn

- Phát `LAB-xx/TASK.md`, template và fixture runtime tương ứng.
- Không phát `fixtures/manifest.json`, sheet `02_Fault_Manifest` hoặc thư mục `instructor/`.
- Demo thật dùng để quan sát hành vi tại thời điểm chạy. Fixture dùng để chấm khả năng phát hiện lỗi có kiểm soát.
- Không yêu cầu học viên thử quyền trên tài nguyên của người khác.

## Sau buổi học

1. Kiểm evidence và artifact bằng rubric.
2. Xác nhận cleanup dữ liệu demo của học viên.
3. Chạy clean fixture để xác nhận fault biến mất, rồi reset buggy cho lượt sau.
4. Chỉ ghi PASS/READY/VERIFIED khi có bằng chứng thực chạy.

## Phân loại sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Demo không truy cập được | Ghi BLOCKED và thời điểm; vẫn làm phần fixture |
| Swagger thay đổi | Cập nhật task/collection theo schema mới, không đoán endpoint |
| Token hết hạn | Cấp token mới qua kênh riêng; xóa token khỏi evidence |
| Automation fail thất thường | Chạy lặp, lưu trace và phân loại timing/network/product |
| Không dọn được dữ liệu | Ghi rõ ID và báo mentor; không xóa dữ liệu người khác |
