# ĐẶC TẢ KỸ THUẬT MÔ HÌNH BẢNG TÍNH EXCEL (EXCEL MODEL SPECIFICATION)

Tài liệu dành cho Giảng viên chấm thi và kiểm toán viên mô hình dữ liệu Capstone DA-01.

---

## 1. MÔ HÌNH DỮ LIỆU POWERPIVOT / DATA MODEL (STAR SCHEMA)
Mô hình dữ liệu trong Excel được xây dựng theo chuẩn Star Schema với các quan hệ sau:
* `tbl_Orders[customer_id]` $\rightarrow$ `tbl_Customers[customer_id]` (Quan hệ $N:1$).
* `tbl_OrderItems[order_id]` $\rightarrow$ `tbl_Orders[order_id]` (Quan hệ $N:1$).
* `tbl_OrderItems[product_id]` $\rightarrow$ `tbl_Products[product_id]` (Quan hệ $N:1$).

---

## 2. BỘ CÔNG THỨC ĐỐI SOÁT CHÉO SỐ HỌC (CROSS-RECONCILIATION EQUATIONS)

Để đảm bảo học viên không "gõ chay" số liệu, người chấm dùng 3 công thức đối soát ma trận:

### Đối soát 1: Tổng Doanh thu Cấp Đơn hàng vs Cấp Dòng Mặt hàng
* **Công thức Đơn hàng**:
  $$\text{Net Revenue (Order Level)} = \sum_{i \in \text{Completed Orders}} \text{total\_amount}_i = \$388,850.28$$
* **Công thức Dòng Mặt hàng**:
  $$\text{Net Revenue (Item Level)} = \sum_{j \in \text{Completed Items}} (\text{unit\_price}_j - \text{discount\_amount}_j) \times \text{quantity}_j = \$388,850.28$$
* **Nguyên tắc**: Hiệu số đối soát Checksum:
  $$\Delta = |\text{Net Revenue (Order Level)} - \text{Net Revenue (Item Level)}| = \$0.00$$
  Nếu $\Delta > \$1.00$, học viên đã làm sai bước join hoặc tính nhầm giá chiết khấu.

### Đối soát 2: Lợi nhuận Gộp và Giá vốn Hàng bán (COGS)
* **Tổng Giá vốn (COGS)**:
  $$\text{Total COGS} = \sum (\text{cost\_price} \times \text{quantity}) = \$267,197.77$$
* **Lợi nhuận gộp (Gross Profit)**:
  $$\text{Gross Profit} = \text{Net Revenue} - \text{Total COGS} = \$388,850.28 - \$267,197.77 = \$121,652.51$$
* **Biên lợi nhuận gộp (Gross Margin %)**:
  $$\text{Gross Margin \%} = \frac{\$121,652.51}{\$388,850.28} \times 100\% = 31.43\%$$

---

## 3. CÁC BIỂU ĐỨC DAX CHUẨN (DAX MEASURES) DÀNH CHO POWERBI / EXCEL

```dax
// 1. Tổng doanh thu thực nhận
Net Revenue := 
CALCULATE(
    SUM(tbl_Orders[total_amount]),
    tbl_Orders[order_status] = "completed"
)

// 2. Giá trị trung bình đơn hàng
AOV := 
DIVIDE(
    [Net Revenue],
    CALCULATE(COUNTROWS(tbl_Orders), tbl_Orders[order_status] = "completed")
)

// 3. Tổng lợi nhuận gộp
Gross Profit := 
CALCULATE(
    SUMX(
        tbl_OrderItems,
        (tbl_OrderItems[unit_price] - tbl_OrderItems[discount_amount] - RELATED(tbl_Products[cost_price])) * tbl_OrderItems[quantity]
    ),
    tbl_Orders[order_status] = "completed"
)

// 4. Biên lợi nhuận gộp
Gross Margin Pct := 
DIVIDE([Gross Profit], [Net Revenue], 0)
```
