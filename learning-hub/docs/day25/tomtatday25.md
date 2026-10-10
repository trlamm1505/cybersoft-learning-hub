# Tổng kết Ngày 25: Teacher Dashboard và Quản trị lớp học

## 1. Mục tiêu

Xây hệ thống quản lý lớp học và đo lường học tập (Learning Analytics) cho giảng viên và quản trị viên, phân quyền RBAC thật: Admin quản lý, Teacher xem số liệu và giao bài, Student chỉ thấy lớp của mình.

## 2. Hạng mục đã hoàn thành

### Admin Portal

- **Bố cục riêng**, tách hẳn khỏi layout học tập: Topbar quản trị, Sidebar thu gọn thành chế độ chỉ icon và kéo tay chỉnh độ rộng.
- **Quản lý người dùng (`/admin/users`)**
  - Bảng kiểu hairline grid, lọc theo vai trò, tìm kiếm.
  - Không cho gán quyền ADMIN từ giao diện hay API (chống leo thang đặc quyền).
  - Thu hồi quyền giảng viên có hiệu lực ngay: `JwtStrategy` kiểm tra lại DB ở mỗi request (khóa tài khoản, thu hồi phiên, vai trò lấy từ DB), nên token cũ mất tác dụng tức thì.
  - Drawer trượt xem hồ sơ và tiến độ học viên.
  - Cột trạng thái cho học viên hiện "Chưa vào lớp" hoặc "N lớp".
- **Quản lý lớp (`/admin/classes`)**
  - Chỉ Admin tạo lớp, gán giảng viên phụ trách, sửa, lưu trữ và xóa lớp.
  - Thêm học viên đơn lẻ (email hoặc mã `Cxxxx`) hoặc import Excel/CSV: kiểm tra chữ ký nhị phân và MIME, tối đa 2MB và 500 dòng, đối soát với email học viên có thật. Kết quả báo tách rõ: đã thêm, đã có trong lớp, không tồn tại, sai cú pháp, trùng trong file.

### Teacher Dashboard (`/teacher/dashboard`)

- Chỉ hiện lớp mà Admin gán cho giảng viên đó. Mọi truy vấn bị giới hạn bởi danh sách học viên và bài tập của lớp, nên lớp này không thấy dữ liệu lớp khác dù biết id (lớp của người khác trả 403).
- Chỉ số, tính theo cặp (học viên, bài được giao):
  - Tỷ lệ hoàn thành = cặp đạt / (số học viên × số bài).
  - Tỷ lệ đạt = cặp đạt / cặp đã thử.
  - Lần thử trung bình, tần suất dùng gợi ý.
  - Điểm nghẽn theo tag: điểm khó kết hợp tỷ lệ trượt, số lần thử và dùng gợi ý; tag đủ mẫu và vượt ngưỡng được đánh dấu.
  - Mẫu số bằng 0 trả `null`, giao diện hiện trạng thái trống, không bao giờ ra NaN.
- Drill-down hai tầng: theo từng bài tập (mọi học viên trong lớp) và theo từng học viên (mọi bài được giao).
- Tab Giao bài: giảng viên tích chọn bài (Code, SQL, Insight, AI Lab) gán cho lớp.
- Nguồn dữ liệu: bài nộp chấm từng lượt, cùng bản ghi gộp của DA Lab và AI Lab (dựng lại số lượt thử để cùng công thức).

### Trải nghiệm học viên

- **"Lớp học của tôi"** (trang Danh mục khóa học): `GET /api/student/classes` trả các lớp học viên đang tham gia, kèm bài được giao với trạng thái Chưa làm / Đang làm / Đã đạt, số lần thử và nút vào làm bài. Bài code mở thẳng trình soạn thảo qua `/playground?slug=…`; bài SQL/DA/AI mở trang lab tương ứng.
- **Học viên tự do:** chưa vào lớp thì khu này hiện thông báo trống ("Bạn chưa tham gia lớp học nào. Các bài tập bên dưới là lộ trình tự do…"). Họ vẫn làm bài công khai, bài nộp vẫn lưu và hiện trong trang cá nhân. Bài làm tự do không tính vào chỉ số của bất kỳ lớp nào. Khi Admin thêm vào lớp, bài làm được tính ngay từ lúc đó.

## 3. Luồng vận hành mẫu

1. Admin tạo lớp, gán giảng viên phụ trách, rồi thêm học viên (đơn lẻ hoặc import file Excel/CSV).
2. Giảng viên đăng nhập Teacher Dashboard, thấy lớp được phân công và giao danh mục bài tập.
3. Học viên trong lớp đăng nhập, mở "Lớp học của tôi", thấy bài được giao và nộp bài.
4. Bài nộp được ghi vào DB. Dashboard đọc trực tiếp từ cùng nguồn dữ liệu và cùng công thức với trang học viên (không có bản sao hay job đồng bộ), nên tỷ lệ hoàn thành, tỷ lệ đạt, lần thử và điểm nghẽn cập nhật ngay.

Đã chạy thật với backend và MongoDB (lượt nộp ghi thẳng vào collection `submissions`, vì máy chấm cần Docker):

| Bước | Học viên thấy | Hoàn thành | Tỷ lệ đạt |
|---|---|---|---|
| Mới giao 2 bài | 2 bài "Chưa làm" | 0 | null |
| Nộp sai bài 1 | "Đang làm" | 0 | 0 |
| Nộp đúng bài 1 | "Đã đạt" | 0.5 | 1 |

## 4. Kiểm thử và chất lượng

- **Backend:** 73 suite, 924 test đạt (2 skip có sẵn). `tsc --noEmit` sạch.
- **Frontend:** 169 test đạt. `tsc -b` sạch, `vite build` thành công.
- **Phạm vi test mới:** công thức phân tích, cô lập theo lớp, phân quyền Admin/Teacher/Student (guard và 403), quản lý lớp và import, dọn dữ liệu demo, trạng thái "Chưa vào lớp", vòng khép kín Admin → Giảng viên → Học viên → Dashboard, học viên tự do không làm loãng số liệu, trạng thái trống ở cả ba vai trò.
- **Dữ liệu demo:** seed demo của giảng viên đi kèm script dọn (`seed-teacher-demo`, `cleanup-teacher-demo`) và hàm dọn có test, nên không còn dữ liệu hardcode để lại trong DB.
- **Sandbox dữ liệu SQL:** khi chuẩn hóa chạy một lệnh, bootstrap thử nạp qua API trước, thất bại thì chuyển sang bộ dữ liệu nhúng sẵn (embedded), không chặn việc khởi động.
- **Bảo mật:** chặn truy cập chéo lớp ở tầng service (không chỉ ở route), không nhận id học viên từ client ở API học viên, không cho gán ADMIN, kiểm tra vai trò và trạng thái từ DB ở mọi request.

## 5. Điểm còn mở

- Bài loại Quiz và Code Block mới dẫn tới trang chung (`/quiz`, `/block-puzzle`), chưa mở thẳng từng bài. Dữ liệu mẫu hiện chưa có bài loại này được giao.
- Chưa có lần nộp qua nút Submit để xác nhận cuối bằng máy chấm Docker (đã xác nhận bằng bản ghi nộp trực tiếp vào DB).
