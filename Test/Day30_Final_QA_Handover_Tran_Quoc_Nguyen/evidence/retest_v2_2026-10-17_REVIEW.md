# Retest Ngày 30 trên bản V2 (phân lớp theo độ tuổi) - 17/10/2026 (bản REVIEW)

> Bản REVIEW của `retest_v2_2026-10-17.md`. Bản gốc được giữ nguyên. Thay đổi: thay mã commit/hash và đường dẫn thư mục sai bằng tên phiên bản dễ hiểu, bỏ liên kết tới workbook test case đã bỏ, và nói rõ số 38 ca là số tổng hợp (không có bảng từng ca, ảnh chỉ là evidence chọn lọc). Không đổi trạng thái lỗi nào.

- **Người chạy:** Claude theo yêu cầu tester Trần Quốc Nguyên, trên Chrome và trình duyệt tích hợp của máy tester.
- **Phiên bản:** Bản V2 được retest ngày 17/10/2026 (môi trường local). Thư mục dự án: `D:\thuctap\clone2\cybersoft-learning-hub`. BE `http://localhost:3000/api` health `ok, mongo connected`; FE `http://localhost:5173`.
- **Tài khoản demo:** lop3-5, lop6-9, lop10-12, student (trái ngành), teacher3-5, teacher6-9, teacher10-12, trainganhtudo (@gmail.com). Mật khẩu/token không ghi ở đây.
- **Số liệu từng nhóm (38 ca):** là **số tổng hợp ghi trong biên bản này**. KHÔNG có bảng chi tiết từng ca kèm theo - workbook Day30 test case đã bỏ, không nộp. Ảnh trong `retest_v2_2026-10-17/` là **evidence chọn lọc**, không phải bằng chứng cho đủ cả 38 ca.

## Kết quả tổng (số tổng hợp)

| Nhóm | Tổng | Pass | Fail | Blocked | Pending |
|---|---|---|---|---|---|
| Học sinh 3-5 (Kids) | 5 | 4 | 1 | 0 | 0 |
| Học sinh 6-9 | 9 | 3 | 5 | 1 | 0 |
| Học sinh 10-12 và trái ngành | 3 | 2 | 1 | 0 | 0 |
| Giáo viên | 8 | 5 | 2 | 0 | 1 |
| Bảo mật và dữ liệu chung | 8 | 3 | 5 | 0 | 0 |
| Giao diện / Accessibility | 5 | 1 | 4 | 0 | 0 |
| **Tổng** | **38** | **18** | **18** | **1** | **1** |

## Chức năng mới của V2 đạt

- Giao diện Kids cho lớp 3-5; 10 URL khối khác đều chuyển về `/block-puzzle`.
- Học sinh chỉ xem được lớp của mình (lớp khác 404); bảng xếp hạng ẩn tên bạn học.
- Giáo viên chỉ xem lớp mình phụ trách (lớp khác 403); học sinh/giáo viên gọi API cấp trên bị 403.
- Ngân hàng đề chặn giáo viên khối 3-5 đúng thiết kế; CSRF chặn request dùng cookie phiên thiếu mã.

## Thay đổi so với tracker 16/10

- **Đã sửa (bỏ khỏi tracker):** DEF-006, DEF-007 (label form), DEF-051 (email sai định dạng 400), DEF-054 (quên mật khẩu đồng nhất).
- **Sửa trong code, chưa chạy lại được:** DEF-021 (judge không trả stderr test ẩn) - DB V2 không có bài có test ẩn.
- **Mở lại:** DEF-058 (AI Coach trả "undefined" khi bài chưa có test case).
- **Mới:** RISK-09 (DB local V2 chưa seed bài tập), RISK-10 (lớp K3-5, K6-9 chưa có giáo viên; ageGroup giáo viên lệch).
- **Cập nhật:** RISK-02 - giao diện đã chặn theo nhóm tuổi nhưng API quiz/contest chưa chặn (lop3-5 bắt đầu đề Python: 201). RISK-04 - đã có cookie httpOnly + CSRF nhưng FE vẫn lưu JWT trong localStorage.
- **High còn mở (8):** DEF-033, DEF-035, DEF-050, DEF-018, DEF-060, RISK-06, RISK-07, RISK-08.

## Giới hạn

- DB local V2 chỉ có 2 bài tập (0 test case): DEF-018, 020, 022, 035 kết luận theo source V2, chưa chạy lại runtime. Cần chạy seed rồi retest.
- DEF-008, DEF-019, DEF-023, DEF-024, DEF-055, RISK-07, RISK-08 kiểm bằng đọc source V2.
- `student@gmail.com` không đăng nhập được bằng mật khẩu demo chung (chỉ được bằng mật khẩu seed) - xem TC_TN_01.

## Dữ liệu test tạo thêm

3 lượt quiz và 3 bài nộp của lop6-9; 1 lượt quiz Python của lop3-5 (qua API). Không tạo tài khoản mới.
