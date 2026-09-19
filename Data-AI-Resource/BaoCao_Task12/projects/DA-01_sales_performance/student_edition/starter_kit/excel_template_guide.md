# HƯỚNG DẪN THIẾT KẾ WORKBOOK EXCEL & MÔ HÌNH DỮ LIỆU (EXCEL TEMPLATE GUIDE)

Để bài nộp `cybermart_executive_model.xlsx` đạt điểm tối đa ở hạng mục **CRIT-04 (Executive Dashboard & Excel Modeling)**, học viên nên tổ chức Workbook theo cấu trúc 5 trang tính (sheets) chuẩn công nghiệp như sau:

---

## 1. CẤU TRÚC CÁC TRANG TÍNH (SHEET ARCHITECTURE)

| Tên Trang Tính (Sheet) | Mục Đích | Nội Dung Chi Tiết & Yêu Cầu Kỹ Thuật |
| :--- | :--- | :--- |
| `00_Cover_Index` | Trang bìa & Mục lục | Tên dự án, thông tin tác giả, ngày cập nhật, sơ đồ liên kết nhanh (Hyperlinks) đến các trang tính khác. |
| `01_Clean_Data` | Dữ liệu nguồn đã làm sạch | 4 bảng dữ liệu Excel Table (`tbl_Orders`, `tbl_OrderItems`, `tbl_Customers`, `tbl_Products`). Đã khử 2 duplicate và chuẩn hóa 5 null. |
| `02_Calculations_KPI` | Bảng tính toán & Đối soát | Các cột phụ tính toán (Net Price, Line Profit), các khối tính toán tổng hợp (SUMIFS, XLOOKUP), bảng đối soát kiểm tra chéo số học (Checksum $= 0$). |
| `03_Pivot_Tables` | Các bảng Pivot tổng hợp | 6 bảng Pivot Tables chuyên biệt: (1) Doanh thu theo Tháng, (2) Doanh thu theo Category, (3) Top 10 Sản phẩm, (4) Tỷ lệ hủy theo Thanh toán, (5) Phân khúc RFM, (6) Ma trận Cohort. |
| `04_Executive_Dashboard`| Bảng điều khiển tương tác | Màn hình Dashboard trực quan: 4 KPI Cards, 4 biểu đồ chuyên nghiệp, 2 bộ lọc Slicer (Năm/Tháng và Danh mục sản phẩm). |

---

## 2. CÔNG THỨC EXCEL NÂNG CAO KHUYẾN NGHỊ

### Công thức 1: Tính Doanh thu Dòng mặt hàng (Line Net Amount)
Tại cột phụ trong bảng `tbl_OrderItems`:
```excel
=[@[quantity]] * ([@[unit_price]] - [@[discount_amount]])
```

### Công thức 2: Lấy Giá vốn Sản phẩm sang Bảng Order Items (XLOOKUP)
```excel
=XLOOKUP([@[product_id]], tbl_Products[product_id], tbl_Products[cost_price], 0)
```

### Công thức 3: Tính Lợi nhuận Gộp của Dòng mặt hàng (Line Gross Profit)
```excel
=([@[quantity]] * ([@[unit_price]] - [@[discount_amount]])) - ([@[quantity]] * [@[cost_price]])
```

### Công thức 4: Tính Doanh thu Thực nhận (Net Revenue) bằng SUMIFS
Tại bảng tổng hợp KPI:
```excel
=SUMIFS(tbl_Orders[total_amount], tbl_Orders[order_status], "completed")
```
*Kết quả kỳ vọng trên Excel*: `$388,850.28`.

---

## 3. TIÊU CHUẨN THIẾT KẾ EXECUTIVE DASHBOARD CHUYÊN NGHIỆP
1. **Quy tắc phối màu (Color Palette)**:
   - Màu chủ đạo: Xanh than / Navy Blue (`#1E3A8A`) cho tiêu đề và thanh điều hướng.
   - Màu nhấn mạnh (Accent): Xanh ngọc (`#0D9488`) hoặc Cam đất (`#EA580C`) cho các chỉ số quan trọng.
   - Màu cảnh báo: Đỏ son (`#DC2626`) cho tỷ lệ hủy đơn COD.
   - Không sử dụng quá 3 họ màu trong cùng một màn hình.
2. **Quy chuẩn Font chữ & Định dạng số**:
   - Font chữ chuẩn: Segoe UI, Aptos hoặc Calibri nhất quán toàn bộ trang.
   - Tiền tệ: Luôn hiển thị ký hiệu `$` kèm dấu phẩy phân cách hàng nghìn (VD: `$388,850.28`).
   - Tỷ lệ phần trăm: Hiển thị 2 chữ số thập phân (VD: `31.43%`, `10.75%`).
3. **Trải nghiệm người dùng (UX)**:
   - Ẩn đường lưới Gridlines (`View -> bỏ chọn Gridlines`).
   - Khóa các ô công thức quan trọng để bảo vệ tính toàn vẹn của mô hình.
