# TÀI LIỆU GỢI Ý & GIÀN GIÁO HỖ TRỢ HỌC VIÊN — CAPSTONE DA-02
## HỆ THỐNG GỢI Ý 3 TẦNG (3-LEVEL SCAFFOLDING HINTS)

Nhằm giúp học viên tự tin vượt qua các thử thách kỹ thuật mà không làm mất đi tính trải nghiệm và tư duy giải quyết vấn đề độc lập, tài liệu này cung cấp 3 tầng trợ giúp:

---

### TẦNG 1: KHÁI NIỆM & NGUYÊN LÝ NGHIỆP VỤ (CONCEPTUAL CLARITY)

1. **Phương trình cân bằng hàng tồn kho (Stock Balance Equation)**:
   $$\text{Tồn kho cuối kỳ} = \text{Tồn đầu kỳ} + \sum \text{Nhập trong kỳ} - \sum \text{Xuất trong kỳ} + \text{Điều chỉnh kiểm kê thuần}$$
   Mọi hệ thống quản trị kho (WMS/ERP) đều phải tuân thủ nghiêm ngặt phương trình này. Nếu phương trình không cân bằng, chắc chắn có giao dịch bị bỏ sót hoặc hạch toán sai chiều.

2. **Chỉ số Vòng quay Hàng tồn kho (Inventory Turnover Ratio)**:
   $$\text{Inventory Turnover} = \frac{\text{Giá vốn hàng bán (COGS)}}{\text{Tồn kho bình quân (Average Inventory)}}$$
   $$\text{Days of Inventory on Hand (DOH)} = \frac{365}{\text{Inventory Turnover}}$$
   *Lưu ý*: Luôn dùng Giá vốn hàng bán (COGS) ở tử số, tuyệt đối không dùng Doanh thu bán hàng (Revenue), vì hàng tồn kho được ghi nhận theo giá vốn gốc.

3. **Nguyên tắc phân biệt hàng khả dụng (Available Stock) và hàng vật lý (Physical Stock)**:
   Hàng đang lưu tại kho vật lý chưa chắc đã sẵn sàng để bán. Phải trừ đi hàng hư hỏng (`SCRAP_DAMAGED`) và hàng trả về đang chờ bộ phận kỹ thuật thẩm định (`PENDING_INSPECTION`).

---

### TẦNG 2: MẪU CÚ PHÁP & TIẾP CẬN KỸ THUẬT (SYNTAX & PATTERNS)

#### 1. Xử lý dấu biến động kho trong SQL:
Cột `direction` nhận giá trị `'IN'` (làm tăng kho) và `'OUT'` (làm giảm kho). Cú pháp chuẩn hóa:
```sql
SELECT 
    product_id,
    SUM(CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END) AS net_stock_quantity
FROM inventory_movements
GROUP BY product_id;
```

#### 2. Tính toán Vectorized trong Python Pandas:
```python
import numpy as np
import pandas as pd

# Gán số lượng có dấu
df_mov['qty_signed'] = np.where(
    df_mov['direction'] == 'IN', 
    df_mov['quantity'], 
    -df_mov['quantity']
)

# Tổng hợp theo SKU và ghép nối thông tin giá vốn
ending_stock = df_mov.groupby('product_id')['qty_signed'].sum().reset_index()
ending_stock = ending_stock.merge(df_products[['product_id', 'unit_cost', 'reorder_point']], on='product_id')
ending_stock['valuation_usd'] = ending_stock['qty_signed'] * ending_stock['unit_cost']
```

#### 3. Công thức Excel Pivot & SUMIFS:
Để tính tổng tồn kho cho một SKU cụ thể tại một kho xác định:
```excel
=SUMIFS(tbl_Movements[Signed_Quantity], tbl_Movements[product_id], [@product_id], tbl_Movements[warehouse_id], "WH-HN01")
```

---

### TẦNG 3: CẢNH BÁO BẪY LỖI KINH ĐIỂN (PITFALL WARNINGS)

* ⚠️ **Đừng quên số dư đầu kỳ**: Các dòng có `reference_doc = 'INIT-BALANCE-2024'` ghi nhận tồn kho tại thời điểm 01/01/2024. Nếu bạn chỉ đếm các đơn mua `PO-2024-xxx`, tồn kho của bạn sẽ bị thiếu hụt nghiêm trọng!
* ⚠️ **Cẩn thận với phép chia tỷ lệ vòng quay**: Khi tính Inventory Turnover của toàn doanh nghiệp, hãy lấy Tổng COGS chia cho Tổng Tồn kho bình quân. Đừng bao giờ tính bình quân cộng của các phân số!
* ⚠️ **Phân biệt điều chuyển nội bộ và bán hàng**: Giao dịch `TRANSFER_OUT` và `TRANSFER_IN` chỉ di chuyển hàng giữa các kho của CyberSoft. Tổng lượng hàng toàn công ty không thay đổi sau một chu trình điều chuyển hoàn tất.
* ⚠️ **Xử lý tồn kho âm trong file dirty**: Đừng vội xóa bản ghi khi thấy số dư bị âm tạm thời! Hãy kiểm tra timestamp: bạn sẽ thấy đơn xuất hàng diễn ra lúc 08:00 sáng và đơn nhập PO cùng ngày lại được ghi nhận lúc 18:00 chiều do nhân viên nhập liệu trễ. Hãy dùng tư duy nghiệp vụ để tái sắp xếp chuỗi thời gian!
