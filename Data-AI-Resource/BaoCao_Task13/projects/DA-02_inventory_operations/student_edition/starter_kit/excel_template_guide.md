# HƯỚNG DẪN XÂY DỰNG MÔ HÌNH BẢNG TÍNH EXCEL — CAPSTONE DA-02
## BỘ KHUNG THIẾT KẾ WORKBOOK 5 SHEETS

Học viên xây dựng tệp `CyberSoft_DA02_Inventory_Model.xlsx` theo quy chuẩn thiết kế gồm 5 sheets chức năng:

---

### SHEET 1: `Executive_Summary`
* Đặt tiêu đề rõ ràng: **CYBERSOFT SUPPLY CHAIN EXECUTIVE DASHBOARD — FY2024**.
* Tạo 5 thẻ chỉ số tài chính (Cards) định dạng nổi bật:
  - Total Ending Stock (Units)
  - Total Inventory Valuation (USD)
  - Total COGS (USD)
  - Inventory Turnover Ratio (x)
  - Days of Inventory on Hand (Days)
* Vẽ 2 biểu đồ trực quan:
  - Biểu đồ Donut: Tỷ trọng phân bổ vốn theo 5 ngành hàng.
  - Biểu đồ Bar: So sánh số lượng tồn kho giữa 3 kho (HN, DN, HCM).

### SHEET 2: `Stock_Ledger_Data`
* Nhập khẩu toàn bộ dữ liệu từ `inventory_movements.csv` và chuyển thành Excel Table (`Ctrl + T`).
* Thêm cột tính toán:
  - `Signed_Quantity`: `=IF([@direction]="IN", [@quantity], -[@quantity])`.
  - `Extended_Cost`: `=[@Signed_Quantity] * [@unit_cost]`.

### SHEET 3: `Warehouse_Pivot`
* Chèn PivotTable từ bảng `Stock_Ledger_Data`:
  - Rows: `warehouse_id`, `region`.
  - Columns: `movement_type`.
  - Values: `Sum of Signed_Quantity`.
* Thêm Slicers: Lọc theo `Region` và `Quarter`.

### SHEET 4: `SKU_Health_Matrix`
* Liệt kê 50 SKU từ `products.csv`.
* Dùng công thức `SUMIFS` để kéo tồn kho thực tế từ `Stock_Ledger_Data`.
* Thiết lập cột Trạng thái (`Status_Alert`) kèm định dạng có điều kiện (Conditional Formatting):
  - Màu Đỏ: `STOCKOUT` (Tồn <= 0).
  - Màu Vàng: `REORDER ALERT` (Tồn <= ROP).
  - Màu Xanh: `OPTIMAL`.

### SHEET 5: `Audit_Discrepancy_Log`
* Bảng tổng hợp kết quả kiểm kê từ `inventory_audits.csv`.
* Tính toán tổng tổn thất do hao hụt (Shrinkage Loss) và phế phẩm (Scrap Loss).
