# 📘 CyberSoft Mart Sales Performance — Instructor Solution Manual & Grading Guide

> **DÀNH RIÊNG CHO GIẢNG VIÊN & HỆ THỐNG AUTO-JUDGE**  
> **Cấm sao chép, phân phối hoặc lưu trữ trong thư mục truy cập của học viên.**

---

## 🎯 1. Bảng Đối Soát Chỉ Số Chuẩn (Ground Truth Benchmark)
Dưới đây là các giá trị chính thức được tính toán trên bộ dữ liệu `data/` với mã nguồn `full_analysis_solution.py`:

| Chỉ số / Tiêu chí | Công thức / Định nghĩa | Giá trị Chuẩn (Ground Truth) | Dung sai Cho phép (Tolerance) |
| :--- | :--- | :---: | :---: |
| **Tổng số bản ghi ban đầu** | Đếm dòng file `orders.csv` | 402 đơn hàng | Tuyệt đối (402) |
| **Số bản ghi sau làm sạch** | Loại bỏ 2 dòng duplicate (`subset=['order_id']`) | 400 đơn hàng | Tuyệt đối (400) |
| **Số đơn hoàn tất (`completed`)** | Đơn gốc `completed` (333) + đơn null đã quy chuẩn (5) | 338 đơn hàng | Tuyệt đối (338) |
| **Số đơn bị hủy (`cancelled`)** | `order_status = 'cancelled'` | 43 đơn hàng | Tuyệt đối (43) |
| **Số đơn hoàn trả (`returned`)** | `order_status = 'returned'` | 19 đơn hàng | Tuyệt đối (19) |
| **Doanh thu thực nhận (Net Revenue)** | `SUM(total_amount)` với đơn `completed` | **$388,850.28** | $\pm 0.05\%$ (\$388,655 - \$389,044) |
| **Giá trị trung bình đơn (AOV)** | Net Revenue / 338 đơn hoàn tất | **$1,150.44** | $\pm 0.10\%$ (\$1,149.29 - \$1,151.59) |
| **Tỷ lệ hủy đơn hàng** | 43 / 400 * 100 | **10.75%** | $\pm 0.20\%$ (10.55% - 10.95%) |
| **Tỷ lệ hoàn trả hàng** | 19 / 400 * 100 | **4.75%** | $\pm 0.20\%$ (4.55% - 4.95%) |
| **Lợi nhuận gộp sản phẩm (Gross Profit)**| $\sum (unit\_price - discount - cost) \times qty$ | **$121,652.51** | $\pm 0.50\%$ |
| **Tỷ suất lợi nhuận gộp (Gross Margin)** | Gross Profit / Net Product Revenue * 100 | **31.43%** | $\pm 0.50\%$ (30.93% - 31.93%) |

---

## 🔍 2. Phân Tích Lỗi Thường Gặp Của Học Viên (Common Student Pitfalls)
1. **Quên khử duplicate (Mất 10-20đ ở Task 1 & 2):**
   * Học viên tính trực tiếp trên 402 dòng dẫn đến doanh thu bị tính trùng 2 đơn lặp (vọt lên khoảng $391,000+).
2. **Tính cả đơn `cancelled` vào doanh thu:**
   * Tính `SUM(total_amount)` mà không có điều kiện `WHERE order_status = 'completed'`. Sai số lên tới hơn $45,000.
3. **Hiểu nhầm doanh thu đơn hàng và doanh thu mặt hàng:**
   * Cột `total_amount` trong `orders.csv` đã bao gồm `shipping_fee`. Khi tính lợi nhuận sản phẩm (Task 2), cần tính từ bảng `order_items.csv` nối `products.csv`.
4. **Lỗi phân vị RFM với dữ liệu rời rạc (Task EXT-01):**
   * Dùng `pd.qcut` không xử lý duplicate bins dẫn đến crash chương trình khi chấm tự động.

---

## 💡 3. Barem Chấm Tự Động & Hướng Dẫn Hội Đồng
- **Chấm tự động (Auto-grader - 50đ):** Chạy `auto_grader.py` để kiểm tra các file đầu ra (`orders_cleaned.csv`, `kpi_summary.json`, `rfm_customer_segments.csv`).
- **Chấm thủ công / Vấn đáp (Manual Review - 50đ):**
  * Đánh giá chất lượng code SQL/Python (tối ưu query, đặt tên biến).
  * Đánh giá 4 biểu đồ trực quan hóa và chất lượng báo cáo `executive_summary.md`.
