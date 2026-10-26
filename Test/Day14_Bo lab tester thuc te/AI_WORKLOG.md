# AI Worklog — Day14

| Ngày | Việc AI hỗ trợ | Kiểm chứng độc lập | Quyết định |
|---|---|---|---|
| 21/09 | Khảo sát learning-hub, evidence cũ và lỗi TEACHER logout | Chưa có pilot người | Không kết luận bug từ source inspection |
| 21/09 | Khảo sát sáu demo và Swagger | Đã mở sáu web; demo có thể thay đổi | Dùng demo làm môi trường thực chiến |
| 22/09 | Thiết kế QA Lab Academy | Bộ riêng chạy được nhưng tăng phạm vi vận hành | Loại khỏi phiên bản chính |
| 22/09 | Gỡ `/tester-labs` khỏi learning-hub | FE build thành công | Không thêm Day14 vào sản phẩm |
| 22/09 | Đồng bộ 12 lab theo sáu demo | Workbook và demo đã đối chiếu; task cũ từng không đồng bộ | Viết lại TASK/GUIDE/Postman/Playwright |
| 22/09 | Tạo fixture clean/buggy không có server | Fixture tests 3/3 pass; Playwright smoke demo1/demo2 3/3 pass | Giữ fault chủ đích và reset mà không tác động demo |

## Việc người học phải tự xác nhận

- [ ] Tự chạy ít nhất một lab mỗi nhóm.
- [ ] Tự tái hiện ít nhất một finding demo và một controlled fault.
- [ ] Tự chạy clean/buggy reset và lưu evidence.
- [ ] Kiểm artifact bằng rubric.
- [ ] Giải thích được một API assertion, một data query và một Playwright locator.
