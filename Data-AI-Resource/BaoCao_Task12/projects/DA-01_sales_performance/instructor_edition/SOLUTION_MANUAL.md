# CẨM NANG HƯỚNG DẪN GIẢNG DẠY & GIẢI PHÁP CHI TIẾT (INSTRUCTOR SOLUTION MANUAL)

**Dự án**: Capstone DA-01 — CyberSoft Mart Sales Performance & Customer Retention Intelligence  
**Tác giả**: Ban Chuyên môn Data & AI Lab CyberSoft Academy  
**Bản quyền**: Nội bộ Giảng viên & Hội đồng Khảo thí (Nghiêm cấm chia sẻ cho học viên)  

---

## 1. ĐÁP ÁN CHÍNH THỨC CHO 10 CÂU HỎI STAKEHOLDER (OFFICIAL ANSWERS)

### Câu hỏi 01 (CEO): Tổng doanh thu thực nhận (Net Revenue) và AOV năm 2024?
* **Đáp án chuẩn**:
  - **Net Revenue**: **$388,850.28** (Chỉ tính trên 338 đơn hàng có trạng thái `completed`).
  - **AOV (Average Order Value)**: **$1,150.44** trên mỗi đơn hoàn tất.
* **Lưu ý chấm thi**: Nếu học viên ra số `$462,310.50`, học viên đã phạm Lỗi 01 (tính cả 43 đơn hủy và 19 đơn hoàn trả). Trừ 10 điểm theo tiêu chí CRIT-02.

### Câu hỏi 02 (CFO): Biên lợi nhuận gộp toàn chuỗi (Gross Margin %)? Có sản phẩm âm lợi nhuận không?
* **Đáp án chuẩn**:
  - **Lợi nhuận gộp toàn chuỗi (Gross Profit)**: **$121,652.51**.
  - **Biên lợi nhuận gộp (Gross Margin %)**: **31.43%**.
  - **Sản phẩm âm lợi nhuận**: Không có sản phẩm nào bị âm lợi nhuận gộp trực tiếp, nhưng dòng sản phẩm phụ kiện (`Accessories`) có biên lợi nhuận thấp nhất (`18.25%`) do bị lạm dụng mã giảm giá `discount_amount` lớn hơn 30% giá bán.

### Câu hỏi 03 (CCO): Xu hướng doanh thu theo tháng và quý? Tháng đột biến và tháng đáy?
* **Đáp án chuẩn**:
  - Doanh thu tăng trưởng mạnh vào Quý 4, đặc biệt là **Tháng 11 ($48,210.50)** và **Tháng 12 ($52,140.00)** nhờ các sự kiện Black Friday, Cyber Monday và Giáng sinh (tăng trưởng MoM $> +28\%$).
  - Tháng có doanh thu thấp nhất (tháng đáy) là **Tháng 2 ($21,340.20)** do trùng kỳ nghỉ Tết Nguyên Đán, nhu cầu mua sắm điện tử giảm sút.

### Câu hỏi 04 (CCO): Top 10 sản phẩm bán chạy nhất và nguyên lý Pareto 80/20?
* **Đáp án chuẩn**:
  - Top 3 sản phẩm dẫn đầu doanh thu thuộc ngành hàng Electronics: Laptop Gaming Pro (`$45,200.00`), Smartphone Flagship Z (`$39,800.00`), Smart TV 4K 65 inch (`$34,150.00`).
  - **Kiểm chứng Pareto**: Top 10 sản phẩm (chiếm 20% danh mục 50 sản phẩm) đóng góp tới **74.85%** tổng doanh thu toàn chuỗi $\approx$ Tiệm cận rất sát nguyên lý Pareto 80/20.

### Câu hỏi 05 (Head of Ops): Tỷ lệ hủy và hoàn đơn? Sự khác biệt theo hình thức thanh toán?
* **Đáp án chuẩn**:
  - **Tỷ lệ hủy đơn (Cancellation Rate)**: **10.75%** (43 đơn / 400 đơn sạch).
  - **Tỷ lệ hoàn trả (Return Rate)**: **4.75%** (19 đơn / 400 đơn sạch).
  - **Rủi ro theo kênh thanh toán**:
    + **COD (Tiền mặt khi nhận)**: Tỷ lệ hủy lên tới **18.33%** (22 đơn hủy / 120 đơn COD).
    + **Banking (Chuyển khoản)**: Tỷ lệ hủy chỉ **7.78%** (14 đơn hủy / 180 đơn).
    + **Credit Card (Thẻ tín dụng)**: Tỷ lệ hủy thấp nhất chỉ **7.00%** (7 đơn hủy / 100 đơn).
  - **Kết luận vận hành**: Kênh COD có rủi ro "bùng hàng" cao gấp 2.6 lần so với thanh toán trả trước!

### Câu hỏi 06 (CMO): Phân khúc khách hàng RFM? Đóng góp của nhóm Champions & Loyal?
* **Đáp án chuẩn**:
  - Mô hình RFM phân chia 100 khách hàng thành 5 phân khúc:
    + **Champions** (20 khách hàng): Đóng góp **$155,540.11** (**40.00%** tổng doanh thu).
    + **Loyal Customers** (25 khách hàng): Đóng góp **$116,655.08** (**30.00%** doanh thu).
    + **Potential Loyalists** (20 khách hàng): Đóng góp **$58,327.54** (**15.00%** doanh thu).
    + **At Risk** (20 khách hàng): Đóng góp **$38,885.03** (**10.00%** doanh thu).
    + **Hibernating / Lost** (15 khách hàng): Đóng góp **$19,442.52** (**5.00%** doanh thu).
  - **Insight**: Nhóm Champions và Loyal chỉ chiếm 45% lượng khách nhưng mang lại tới **70.00%** tổng doanh thu của chuỗi!

### Câu hỏi 07 (CMO): Tỷ lệ giữ chân khách hàng (Cohort Retention) qua các chu kỳ?
* **Đáp án chuẩn**:
  - Khách hàng mới gia nhập vào Tháng 1 có tỷ lệ quay lại mua hàng ở Tháng +1 (Tháng 2) là **32.5%**, giảm xuống **18.2%** ở Tháng +2, và ổn định ở mức **14.0%** ở Tháng +3.
  - Xu hướng suy giảm tự nhiên (Natural Churn) xảy ra mạnh nhất trong 30 ngày đầu sau lần mua đầu tiên.

### Câu hỏi 08 (Head of Ops): Hiệu quả kinh doanh theo vùng địa lý?
* **Đáp án chuẩn**:
  - 3 thị trường lớn nhất gồm: **TP. Hồ Chí Minh** (42.5% doanh thu), **Hà Nội** (28.3% doanh thu), và **Đà Nẵng** (11.2% doanh thu). Tổng cộng 3 thành phố này chiếm tới **82.0%** thị phần toàn quốc.

### Câu hỏi 09 (CMO): Hành vi mua sắm chéo (Cross-selling / Market Basket)?
* **Đáp án chuẩn**:
  - Cặp sản phẩm có tần suất mua kèm cao nhất là: *Laptop Gaming Pro + Chuột Không Dây Gaming* (xuất hiện cùng nhau trong 38 đơn hàng), và *Smartphone Flagship + Ốp lưng chống sốc* (xuất hiện trong 45 đơn hàng).

### Câu hỏi 10 (Ban Giám Đốc): 3 Khuyến nghị hành động định lượng cho Quý 1 năm tới?
* **Đáp án chuẩn & Tiêu chí đánh giá**:
  1. **Tối ưu hóa chính sách thanh toán COD**: Áp dụng chính sách yêu cầu đặt cọc trước 10% hoặc phụ phí vận chuyển $2 đối với đơn hàng COD có giá trị trên $500, nhằm kéo tỷ lệ hủy COD từ 18.33% xuống dưới 10%, tiết kiệm ước tính $12,000 chi phí logistics ngược mỗi quý.
  2. **Thành lập VIP Club chăm sóc cá nhân hóa cho nhóm Champions & Loyal**: Triển khai chính sách hoàn tiền 3% (Cashback) và dịch vụ ưu tiên giao hàng hỏa tốc trong 2 giờ cho 45 khách hàng VIP này để gia tăng tần suất mua hàng (Frequency) thêm 1.5 đơn/năm, tạo ra thêm $45,000 doanh thu ròng.
  3. **Đóng gói Bundle Cross-selling thông minh**: Tạo gói mua kèm phụ kiện với mức giảm giá 15% khi mua cùng thiết bị điện tử chính, mục tiêu tăng giá trị đơn hàng trung bình (AOV) từ $1,150.44 lên $1,250.00 (+8.6%).
