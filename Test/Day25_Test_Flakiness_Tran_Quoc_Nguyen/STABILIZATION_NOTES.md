# Stabilization notes / nội dung chuẩn bị cho PR

## Thay đổi trong Ngày 25

- Thêm `run_flake_check.ps1` để chạy lặp cùng một nhóm critical smoke và lưu kết quả từng vòng.
- Tắt hành vi retry che lỗi: mỗi failure được giữ nguyên trong CSV/log và script trả exit code 1.
- BE chạy `--runInBand` để tránh test dùng dữ liệu hoặc mock toàn cục tác động lẫn nhau trong bước baseline.
- Tách lỗi setup runner khỏi lỗi test sản phẩm trong báo cáo.
- Ban hành quarantine policy có owner, deadline và exit criteria.

## Quyết định về code sản phẩm

Không sửa FE/BE chỉ để tạo ra một “stabilization diff” giả. Qua 10 vòng không phát hiện flaky test, nên hiện chưa có căn cứ thay đổi wait, dữ liệu hoặc logic isolation trong code chính.

Nếu CI tương lai phát hiện flake, PR sửa phải ưu tiên:

1. Loại bỏ sleep cố định, chờ theo trạng thái/điều kiện.
2. Tạo dữ liệu riêng cho từng test và cleanup trong `afterEach/afterAll`.
3. Không dùng chung port, account hoặc collection giữa các worker.
4. Mock thời gian, random và network ở unit test.
5. Chứng minh bản sửa bằng tối thiểu 20 vòng liên tiếp PASS.

