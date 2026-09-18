# ĐẶC TẢ KỸ THUẬT MÔ HÌNH BẢNG TÍNH EXCEL / POWERPIVOT — CAPSTONE DA-02
## INVENTORY & MULTI-WAREHOUSE OPERATIONS MODEL

Tài liệu hướng dẫn chi tiết cấu trúc workbook Excel 5 sheets chuẩn mực công nghiệp dành cho học viên và bộ phận kiểm định chất lượng tại CyberSoft Academy.

---

### SHEET 1: `Executive_Summary` (BẢNG ĐIỀU HÀNH CHUỖI CUNG ỨNG C-LEVEL)
* **Mục tiêu**: Cung cấp góc nhìn toàn cảnh về tình trạng sức khỏe tồn kho và các rủi ro vận hành trọng yếu cho Ban Giám đốc (CEO, COO, CFO).
* **Thành phần giao diện**:
  1. **Thẻ chỉ số tài chính (Financial KPI Cards)**:
     - Total Ending Inventory: `9,272 units` (Công thức: `=SUM(Stock_Ledger_Data!J:J)`)
     - Total Valuation: `$867,636.11` (Công thức: `=SUMPRODUCT(SKU_Health_Matrix!F:F, SKU_Health_Matrix!G:G)`)
     - Total COGS: `$814,742.22`
     - Inventory Turnover: `1.22x` (Công thức: `=COGS / Average_Inventory`)
     - Days of Inventory on Hand (DOH): `300.4 ngày` (Công thức: `=365 / Turnover`)
  2. **Thẻ cảnh báo rủi ro (Risk Alert Badges)**:
     - Stockouts Count: `1 SKU` (Conditional formatting màu Đỏ)
     - Reorder Point Alerts: `10 SKUs` (Conditional formatting màu Vàng cam)
     - Shrinkage Loss: `$3,076.24`
     - Scrap Loss: `$3,712.41`
  3. **Biểu đồ trực quan (Executive Charts)**:
     - Donut Chart: Phân bổ vốn theo 5 ngành hàng.
     - Clustered Bar Chart: So sánh tồn kho giữa 3 trung tâm phân phối (HN, DN, HCM).

---

### SHEET 2: `Stock_Ledger_Data` (SỔ CÁI BIẾN ĐỘNG CHI TIẾT)
* **Mục tiêu**: Lưu trữ toàn bộ 2,035 dòng giao dịch kho trong năm 2024 dưới dạng Excel Table chuẩn (`tbl_Movements`).
* **Các cột dữ liệu và công thức bổ trợ**:
  - Cột A-I: Các trường thô từ `inventory_movements.csv` (movement_id, timestamp, warehouse_id, product_id, movement_type, direction, quantity, unit_cost, reference_doc).
  - Cột J (`Signed_Quantity`): `=IF([@direction]="IN", [@quantity], -[@quantity])`.
  - Cột K (`Extended_Value`): `=[@Signed_Quantity] * [@unit_cost]`.
  - Cột L (`Month_Year`): `=TEXT([@timestamp], "yyyy-mm")`.

---

### SHEET 3: `Warehouse_Pivot` (BẢNG TỔNG HỢP VẬN HÀNH LIÊN KHO)
* **Mục tiêu**: Phân tích luồng nhập xuất và tồn kho theo từng trung tâm phân phối.
* **Cấu hình PivotTable**:
  - Rows: `warehouse_id`, `warehouse_name`, `region`.
  - Columns: `movement_type` (INBOUND_PO, OUTBOUND_SALE, TRANSFER_IN, TRANSFER_OUT, etc.).
  - Values: `SUM(Signed_Quantity)` và `SUM(Extended_Value)`.
  - Slicers đi kèm: Bộ lọc theo `Region` và theo `Quarter`.

---

### SHEET 4: `SKU_Health_Matrix` (MA TRẬN PHÂN TÍCH TỒN KHO THEO SKU)
* **Mục tiêu**: Đánh giá sức khỏe của từng mã hàng trong số 50 SKU.
* **Cột tính toán thông minh**:
  - Cột E (`Ending_Physical_Stock`): `=SUMIFS(tbl_Movements[Signed_Quantity], tbl_Movements[product_id], [@product_id])`.
  - Cột F (`Ending_Valuation`): `=[@Ending_Physical_Stock] * [@unit_cost]`.
  - Cột G (`Reorder_Point`): Giá trị ROP quy định trong `products.csv`.
  - Cột H (`Status_Alert`): `=IF([@Ending_Physical_Stock]<=0, "OUT OF STOCK", IF([@Ending_Physical_Stock]<=[@Reorder_Point], "REORDER ALERT", "HEALTHY"))`.
  - Cột I (`Replenishment_Deficit`): `=MAX(0, [@Reorder_Point] - [@Ending_Physical_Stock])`.

---

### SHEET 5: `Audit_Discrepancy_Log` (NHẬT KÝ KIỂM TOÁN VÀ HAO HỤT)
* **Mục tiêu**: Theo dõi kết quả kiểm kê 4 quý và đối soát thất thoát.
* **Các chỉ tiêu đối soát**:
  - Bảng tổng hợp chênh lệch theo mã nguyên nhân: `PILFERAGE`, `SCAN_CORRECTION`, `NORMAL_VARIANCE`.
  - Công thức tính tổn thất tài chính: `=ABS([@discrepancy_qty]) * VLOOKUP([@product_id], tbl_Products, 6, FALSE)`.
  - Bảng đối soát chứng minh: Tổng giá trị điều chỉnh kiểm kê trong sổ cái khớp 100% với báo cáo kiểm kê thực tế.
