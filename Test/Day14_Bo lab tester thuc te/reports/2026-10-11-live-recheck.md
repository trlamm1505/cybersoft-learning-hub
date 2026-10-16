# Kiểm lại trực tiếp trên demo thật — 11/10/2026

Cách kiểm: mở bằng Chrome, gọi API chỉ đọc (GET) hoặc request sai có chủ đích từ chính trang demo. Không tạo tài khoản, không ghi/xóa dữ liệu, không lưu nội dung bản ghi người dùng, không dùng mật khẩu hay token.
Thời điểm: 2026-10-11T02:10Z (09:10 giờ Việt Nam).

## Kết quả

| ID | Lab | Demo | Kết quả | Evidence ngắn |
|---|---|---|---|---|
| RF-001 | LAB-07 | movie0706 | TÁI HIỆN | `LayDanhSachPhim?maNhom=GP01` trả 33 phim; maPhim 11665 "Kẻ đào tẩu" có danhGia = -8 |
| RF-002 | LAB-07 | movie0706 | TÁI HIỆN | 4 nhóm tên trùng: 11605/11607, 11608/11609, 11666/11670 ("Tây Du Ký"), 11684/11685 ("film1") |
| RF-003 | LAB-02/07 | movie0706 | TÁI HIỆN | `LayThongTinPhim?MaPhim=999999` → HTTP 500 "Mã phim không hợp lệ!"; MaPhim=abc → 400; MaPhim=1314 → 200 |
| RF-004 | LAB-07 | movie0706 | TÁI HIỆN | thiếu moTa: 11605, 11607; thiếu trailer: 11214, 11587, 11601, 11605, 11607, 11610 |
| RF-008 | LAB-01 | demo2 | DOM XÁC NHẬN | 7 input (5 đăng ký, 2 đăng nhập) đều không có `required`; hai form dùng chung `name="taiKhoan"`/`name="matKhau"`; hành vi submit trống chưa pilot |
| K-02 | LAB-01 | demo2 | ĐÃ ĐỔI | ô số điện thoại hiện là `type="text"` (ghi chú cũ nói `type="phone"`) |
| K-03 | LAB-01 | demo2 | XÁC NHẬN | "Quên mật khẩu?" có `href="#"` |
| K-04 | LAB-01 | demo2 | XÁC NHẬN | danh sách nhóm GP01..GP09, GP010 |
| RF-013 | LAB-04 | demo6 | MỚI — TÁI HIỆN | `POST /api/Auth/login` với username/password không tồn tại → HTTP 500, thân rỗng (kỳ vọng 401). Body `{}` → 400 |
| RF-014 | LAB-04 | demo6 | MỚI — ỨNG VIÊN BẢO MẬT | GET không token trả 200 cho `/api/Patient`, `/api/User`, `/api/Invoices`, `/api/InvoiceDetail`, `/api/Appointment` (dung lượng phản hồi lớn). `/api/Blog/admin` trả 401 nên cơ chế xác thực có tồn tại. Chỉ ghi mã trạng thái và kích thước, không lưu nội dung. Cần mentor xác nhận đây là cố ý hay lỗi |
| RF-006 | LAB-04 | demo6 | GIỮ NGUYÊN | `GET /api/MedicalService` → 200 `[]` |
| RF-015 | LAB-03 | demo5 | MỚI — Low | `<title>` trang chủ bắt đầu bằng dấu backtick: "`Nhà nghỉ dưỡng & Căn hộ cao cấp cho thuê" |
| RF-016 | LAB-02 | demo1 | MỚI — Low | trang chủ có 1 ảnh lỗi (hiện chữ "Img alt"), 6/91 ảnh không có alt; một phim dùng ảnh logo thay poster |
| — | LAB-05/06 | demo3, demo4 | CHỈ ĐỌC SWAGGER | demo3 có 35 đường dẫn, demo4 có 34. Không gọi API vì cần TokenCybersoft mentor cấp riêng. Gọi không token tới demo4 trả 400/403 |
| — | LAB-11/12 | demo1 | XÁC NHẬN | trang chủ có 19 link `/detail/<số>` sau khi tải xong (link nạp bất đồng bộ, nên test phải chờ) |

## Đính chính báo cáo 23/09

`reports/2026-09-23-LAB07-data-check.json` ghi 0 lỗi ở cả 4 quy tắc, nhưng kiểm lại hôm nay cả 4 đều còn lỗi trên cùng endpoint và cùng 33 phim. Bản 23/09 không còn dùng làm bằng chứng LAB-07; kết quả đúng nằm ở bảng trên. Chưa xác định được nguyên nhân sai (lỗi script hay dữ liệu demo bị sửa rồi trả lại), nên cần chạy lại script kiểm bằng chính file này làm đối chứng.

## Local web (learning-hub, trang Tester Lab)

- Lúc kiểm, API `/tester-labs` trả 10 lab: LAB-01..09 và LAB-12, thiếu LAB-10 và LAB-11 (Automation). Cùng ngày đã thêm hai lab này vào seed và web trả 12 lab.
- Phân nhóm trên web: Bug Report (01, 02, 09), Test Case Design (03, 07, 08, 12), API Testing (04, 05, 06). Khác bộ 4 nhóm Manual/API/Data/Automation của Day14.
- File "Fixture (LAB-xx.json)" cho học viên tải là bản buggy có kèm `rule`. Đây là đúng thiết kế, vì `TASK.md` cũng in luật này cho học viên; không phải lỗ hổng lộ đáp án.
- LAB-04 hiển thị template `LAB-04.csv` nhưng chỉ nhận json/pdf, 2 cột bắt buộc.
- Chưa có bài nộp nào trong DB local (đã kiểm cả tài khoản student và teacher).
