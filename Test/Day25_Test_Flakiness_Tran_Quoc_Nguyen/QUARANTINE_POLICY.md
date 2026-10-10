# Chính sách quarantine test

## Nguyên tắc

1. Không quarantine chỉ vì một test FAIL một lần; phải chạy lại có kiểm soát và xác định failure không ổn định.
2. Không áp dụng retry vô hạn. Retry trong bước chẩn đoán phải được ghi log và không được đổi trạng thái gate chính.
3. Critical smoke về đăng nhập, phân quyền, dữ liệu lớp và luồng nộp bài không được quarantine. Nếu flaky, CI phải FAIL và đội phụ trách sửa trước khi merge.
4. Test bị quarantine vẫn chạy trong job riêng để đo flake rate, không bị xóa hoặc bỏ quên.

## Điều kiện đưa vào quarantine

- Có ít nhất một lần PASS và một lần FAIL trên cùng commit/cấu hình; hoặc có bằng chứng rõ về race condition, timeout, shared data hay phụ thuộc dịch vụ không ổn định.
- Có bug/ticket liên kết.
- Có owner chịu trách nhiệm.
- Có deadline gỡ quarantine, tối đa 7 ngày cho test thường và 24 giờ cho test có mức độ High.

## Thông tin bắt buộc

| Trường | Yêu cầu |
|---|---|
| Test ID/file | Xác định chính xác test |
| Evidence | Log của cả lần PASS và FAIL |
| Suspected cause | Wait, data, isolation, concurrency, network hoặc environment |
| Owner | FE / BE / Data-AI / QA cụ thể |
| Deadline | Ngày phải sửa hoặc ra quyết định |
| Impact | Luồng nghiệp vụ bị ảnh hưởng |
| Exit criteria | Tối thiểu 20 vòng liên tiếp PASS sau sửa |

## Trạng thái hiện tại

Không có test nào cần quarantine sau 10 vòng Ngày 25. Danh sách quarantine hiện tại: **trống**.

