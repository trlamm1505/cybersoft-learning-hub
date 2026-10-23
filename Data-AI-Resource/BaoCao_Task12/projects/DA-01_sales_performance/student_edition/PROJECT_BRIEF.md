# CYBERSOFT MART — SALES PERFORMANCE & CUSTOMER RETENTION INTELLIGENCE CAPSTONE (DA-01)

**Mã dự án**: CAPSTONE-DA-01  
**Cấp độ**: Junior Data Analyst / Data Specialist  
**Lĩnh vực**: Bán lẻ Đa kênh & Thương mại Điện tử (Omnichannel Retail / E-commerce)  
**Thời lượng thực hiện**: 8 — 12 giờ làm việc  
**Công cụ áp dụng**: Excel (Pivot Tables, Advanced Formulas), SQL (Window Functions, CTE, Aggregate), BI Dashboard (PowerBI / Tableau / Metabase), Python (Tùy chọn kiểm toán).  
**Phiên bản**: v1.0.0 — Ban Đào tạo & Khảo thí CyberSoft Academy  

---

## 1. BỐI CẢNH DOANH NGHIỆP (BUSINESS CONTEXT)

**CyberSoft Mart** là chuỗi bán lẻ đa kênh chuyên cung cấp thiết bị công nghệ, phụ kiện thông minh và gia dụng hiện đại tại thị trường Việt Nam. Năm 2024, công ty mở rộng mạnh mẽ kênh bán hàng trực tuyến (E-commerce) bên cạnh hệ thống cửa hàng vật lý. 

Tuy nhiên, Ban Giám đốc đang đối mặt với nhiều bài toán hóc búa:
* Doanh thu ghi nhận trên hệ thống POS/ERP có dấu hiệu chênh lệch so với số tiền thực nhận vào tài khoản ngân hàng do tỷ lệ đơn hàng bị hủy (cancelled) và hoàn trả (
eturned) có xu hướng gia tăng.
* Cơ cấu chi phí khuyến mãi và chiết khấu (discount_amount) chưa được kiểm soát chặt chẽ, dẫn đến nguy cơ một số dòng sản phẩm chủ lực bị xói mòn biên lợi nhuận gộp.
* Khách hàng mới gia nhập nhiều nhưng tỷ lệ khách hàng quay lại mua lần 2, lần 3 (Retention Rate) chưa có dữ liệu đo lường cụ thể, thiếu chiến lược chăm sóc khách hàng cá nhân hóa theo giá trị vòng đời (Customer Lifetime Value).

**Vai trò của bạn**: Với tư cách là **Junior Data Analyst** thuộc phòng Business Intelligence, bạn được giao trọng trách tiếp nhận toàn bộ cơ sở dữ liệu bán hàng thô năm 2024, tiến hành kiểm toán dữ liệu, xây dựng mô hình phân tích, trả lời 10 câu hỏi trọng yếu từ Ban Lãnh đạo, và thiết kế một bản **Executive BI Dashboard** hoàn chỉnh hỗ trợ ra quyết định chiến lược.

---

## 2. 10 CÂU HỎI TRỌNG YẾU TỪ BAN LÃNH ĐẠO (STAKEHOLDER QUESTIONS)

| STT | Stakeholder | Câu hỏi nghiệp vụ trọng yếu | Mục tiêu & Kỳ vọng ra quyết định |
| :---: | :--- | :--- | :--- |
| **Q01** | **CEO** | *Tổng doanh thu thực nhận (Net Revenue) và Giá trị trung bình trên mỗi đơn hàng (AOV) của năm 2024 là bao nhiêu sau khi đã loại bỏ hoàn toàn các đơn bị hủy và hoàn trả?* | Xác định quy mô doanh thu thực tế để đối soát dòng tiền và lập kế hoạch ngân sách năm tới. |
| **Q02** | **CFO** | *Biên lợi nhuận gộp toàn chuỗi (Gross Margin %) đạt bao nhiêu? Có danh mục hoặc sản phẩm nào đang kinh doanh dưới giá vốn (âm lợi nhuận) do lạm dụng chiết khấu không?* | Kiểm soát an toàn tài chính, rà soát lại chính sách giá bán và mức trần chiết khấu đại lý. |
| **Q03** | **CCO (Sales)** | *Diễn biến doanh thu theo từng tháng và từng quý biến động ra sao? Đâu là các tháng có mức tăng trưởng MoM đột phá và đâu là các tháng trũng mùa vụ?* | Điều tiết nhân sự bán hàng và phân bổ chỉ tiêu KPI doanh số theo mùa vụ kinh doanh. |
| **Q04** | **CCO (Sales)** | *Top 10 sản phẩm mang lại doanh thu cao nhất và Top 10 sản phẩm mang lại lợi nhuận gộp lớn nhất là gì? Tỷ lệ đóng góp theo nguyên lý Pareto 80/20 như thế nào?* | Tối ưu hóa danh mục sản phẩm (Assortment Planning), ưu tiên nguồn vốn nhập các mặt hàng chủ lực. |
| **Q05** | **Head of Ops** | *Tỷ lệ hủy đơn hàng (Cancellation Rate) và tỷ lệ hoàn trả (Return Rate) là bao nhiêu %? Có sự khác biệt đáng kể giữa các hình thức thanh toán (COD vs Chuyển khoản vs Thẻ tín dụng) không?* | Đánh giá rủi ro vận hành logistics, xem xét chính sách thu cọc đơn hàng COD giá trị cao. |
| **Q06** | **CMO** | *Khi phân khúc khách hàng theo mô hình RFM (Recency, Frequency, Monetary) thành 5 nhóm, nhóm Khách hàng Tinh hoa (Champions) và Khách hàng Trung thành (Loyal) chiếm bao nhiêu % doanh thu?* | Tái cơ cấu ngân sách tiếp thị, xây dựng chương trình VIP Loyalty Program cho nhóm khách hàng giá trị cao. |
| **Q07** | **CMO** | *Tỷ lệ giữ chân khách hàng (Customer Retention Rate) theo từng nhóm tháng gia nhập (Monthly Cohorts) qua các mốc 30, 60, 90 ngày suy giảm như thế nào?* | Đánh giá chất lượng chuyển đổi của các chiến dịch quảng cáo thu hút khách hàng mới (Customer Acquisition). |
| **Q08** | **Head of Ops** | *Hiệu quả kinh doanh và mật độ đơn hàng phân bổ theo khu vực địa lý (Tỉnh/Thành phố) như thế nào? Đâu là 3 thị trường chiếm trên 60% thị phần?* | Định vị vị trí đặt thêm kho trung chuyển (Fulfillment Hub) để rút ngắn thời gian giao hàng. |
| **Q09** | **CMO** | *Những cặp sản phẩm nào thường xuyên được đặt cùng nhau trong một đơn hàng (Cross-selling / Market Basket)?* | Thiết kế các combo khuyến mãi theo cụm sản phẩm để tăng giá trị bình quân trên mỗi giỏ hàng. |
| **Q10** | **Ban Giám Đốc** | *Dựa trên toàn bộ dữ liệu, đề xuất 3 hành động chiến lược định lượng cụ thể cho Quý 1 năm tới để tăng trưởng doanh thu 15% và giảm tỷ lệ hoàn hủy xuống dưới 5%?* | Chuyển hóa dữ liệu phân tích thành kế hoạch hành động thực thi (Data-to-Action) tại cấp điều hành. |

---

## 3. LỘ TRÌNH 12 NHIỆM VỤ KỸ THUẬT (12 PRACTICAL TASKS)

Học viên phải hoàn thành tuần tự 12 nhiệm vụ từ tiền xử lý dữ liệu đến trực quan hóa điều hành:

### Giai đoạn I: Kiểm toán & Tiền Xử lý Dữ liệu (Tasks 01 — 03)
* **Nhiệm vụ 01: Khám phá & Đánh giá Dữ liệu Thô (Data Profiling)**:
  - Tải và đọc 4 tập dữ liệu: orders.csv (402 dòng), order_items.csv (997 dòng), customers.csv (100 dòng), products.csv (50 dòng).
  - Xác định các trường khóa chính (PK), khóa ngoại (FK), kiểm tra tính toàn vẹn tham chiếu.
  - Lập bảng phát hiện dị biệt: số lượng dòng trùng lặp khóa chính, số lượng ô giá trị khuyết thiếu (NULL), định dạng ngày tháng không đồng nhất.
* **Nhiệm vụ 02: Làm sạch & Chuẩn hóa Dữ liệu (Data Cleansing)**:
  - Khử triệt để 2 bản ghi trùng lặp khóa chính trong orders.csv (giữ lại bản ghi hợp lệ đầu tiên, quy về đúng 400 đơn hàng duy nhất).
  - Điền khuyết thiếu cho 5 đơn hàng có trạng thái rỗng bằng giá trị mặc định chuẩn completed.
  - Quy chuẩn hóa kiểu dữ liệu: chuyển đổi chuỗi ngày tháng sang định dạng chuẩn YYYY-MM-DD, ép kiểu số thực cho các cột tiền tệ và tỷ lệ chiết khấu.
* **Nhiệm vụ 03: Thiết lập Mô hình Thực thể Quan hệ (Dimensional Modeling)**:
  - Thiết kế mô hình hình sao (Star Schema) với 1 bảng Sự kiện (act_order_items) và 3 bảng Chiều (dim_orders, dim_customers, dim_products).
  - Đảm bảo quan hệ 1-Nhiều (1:N) liên kết chặt chẽ qua các khóa order_id, customer_id, product_id.

### Giai đoạn II: Phân tích Tài chính & Vận hành Cốt lõi (Tasks 04 — 08)
* **Nhiệm vụ 04: Tính toán Bộ Chỉ số Tài chính & Đơn hàng Cốt lõi**:
  - Viết truy vấn SQL / công thức Excel tính Doanh thu thực nhận Net Revenue (chỉ tính trên 338 đơn completed).
  - Tính Giá trị trung bình đơn hàng AOV = Net Revenue / Total Completed Orders.
  - Tính Lợi nhuận gộp (Gross Profit) và Biên lợi nhuận gộp (Gross Margin %) theo công thức:
    Net Revenue = SUM(total_amount) của các đơn completed.
    Gross Margin % = (Gross Profit / Net Revenue) * 100%.
* **Nhiệm vụ 05: Phân tích Xu hướng Doanh thu Chuỗi Thời gian (Time-Series Analysis)**:
  - Tổng hợp doanh thu theo tháng (Monthly Trend) và theo quý (Quarterly Trend).
  - Tính toán tỷ lệ tăng trưởng so với tháng trước (MoM Growth %) và đường trung bình động 3 tháng (3-Month Moving Average).
* **Nhiệm vụ 06: Phân tích Cơ cấu Danh mục & Định luật Pareto 80/20**:
  - Tính tổng doanh thu và lợi nhuận gộp theo từng Danh mục sản phẩm (category).
  - Xếp hạng Top 10 sản phẩm đóng góp doanh số cao nhất.
  - Kiểm chứng xem Top 20% sản phẩm có đóng góp xấp xỉ 80% lợi nhuận hay không.
* **Nhiệm vụ 07: Phân tích Thị trường & Hành vi Theo Khu vực Địa lý**:
  - Phân tích cơ cấu khách hàng và doanh thu theo Tỉnh/Thành phố (city).
  - Xác định 3 thị trường trọng điểm và phân tích mức chi tiêu bình quân của khách hàng tại từng khu vực.
* **Nhiệm vụ 08: Kiểm toán Rủi ro & Tỷ lệ Hủy / Hoàn đơn Hàng**:
  - Tính Tỷ lệ hủy đơn (Cancellation Rate %) và Tỷ lệ hoàn đơn (Return Rate %) trên tổng số 400 đơn sạch.
  - Phân tích chéo tỷ lệ hủy hoàn theo từng Phương thức thanh toán (payment_method: COD, Banking, Credit Card).

### Giai đoạn III: Phân khúc Khách hàng Chuyên sâu & BI Dashboard (Tasks 09 — 12)
* **Nhiệm vụ 09: Xây dựng Mô hình Phân khúc Khách hàng RFM (Extension)**:
  - Tính 3 chỉ số cho từng khách hàng:
    + Recency (R): Số ngày kể từ lần mua gần nhất đến ngày chốt sổ (Snapshot Date = 2024-12-31).
    + Frequency (F): Tổng số đơn hàng hoàn tất (completed).
    + Monetary (M): Tổng giá trị chi tiêu thực tế.
  - Phân vị thành 5 điểm số (Quintiles 1 - 5) sử dụng phương pháp xếp hạng không lỗi trùng phân vị (
ank(method='first')).
  - Gán nhãn 5 phân khúc khách hàng: Champions (Điểm >= 13), Loyal Customers (10 - 12), Potential Loyalists (8 - 9), At Risk (6 - 7), Hibernating / Lost (< 6).
* **Nhiệm vụ 10: Phân tích Giữ chân Khách hàng Theo Cohort (Extension)**:
  - Nhóm khách hàng theo tháng phát sinh đơn hàng đầu tiên (First Purchase Month).
  - Xây dựng ma trận tam giác giữ chân khách hàng (Cohort Retention Matrix) qua các tháng +1, +2, +3.
* **Nhiệm vụ 11: Thiết kế Bản Đặc tả & Khung Executive BI Dashboard**:
  - Thiết kế Dashboard gồm 4 màn hình chức năng:
    + Tab 1: Executive Overview (4 Thẻ KPI card chính, biểu đồ Monthly Revenue Trend, biểu đồ Category Breakdown).
    + Tab 2: Product & Inventory Intelligence (Bảng Top/Bottom Products, Phân tích Gross Margin vs Discount).
    + Tab 3: Customer Lifetime & RFM Insights (Biểu đồ Scatter Plot RFM, Cơ cấu doanh thu theo phân khúc khách hàng).
    + Tab 4: Operational Risk & Logistics (Tỷ lệ hủy hoàn theo kênh thanh toán và bản đồ nhiệt khu vực).
* **Nhiệm vụ 12: Soạn thảo Báo cáo Khuyến nghị Ban Lãnh đạo (Executive Memo)**:
  - Viết báo cáo tóm tắt điều hành dài 1.5 - 2 trang: Trình bày số liệu cốt lõi, diễn giải nguyên nhân gốc của các bất thường, và đưa ra 3 khuyến nghị hành động kèm chỉ số đo lường KPI kỳ vọng.

---

## 4. HỒ SƠ VÀ SẢN PHẨM PHẢI NỘP (DELIVERABLES & SUBMISSION)

Học viên phải nộp đầy đủ các tài liệu sau vào thư mục nộp bài cá nhân:
1. cybermart_analysis_solution.sql: Toàn bộ các câu lệnh SQL giải quyết từ Nhiệm vụ 01 đến Nhiệm vụ 10 (chạy được trên SQLite / MySQL / PostgreSQL).
2. cybermart_executive_model.xlsx: File bảng tính Excel chứa dữ liệu đã làm sạch, mô hình dữ liệu Data Model, các bảng Pivot Table và Dashboard tương tác.
3. EXECUTIVE_REPORT.md (hoặc .pdf): Báo cáo tóm tắt kết quả phân tích gửi Ban Giám đốc trả lời trọn vẹn 10 câu hỏi stakeholder.
4. submission_checklist.md: Bảng xác nhận tự kiểm tra đã tick đầy đủ các tiêu chí.

---

## 5. BAREM CHẤM ĐIỂM (RUBRIC OVERVIEW)

* **Tổng điểm toàn bài**: 100 điểm.
  - **Khối Nhiệm vụ Cốt lõi (Core Tasks - 70 điểm)**: Đảm bảo năng lực hành nghề tiêu chuẩn của Junior Data Analyst (Làm sạch dữ liệu, tính toán tài chính, truy vấn SQL, Dashboard cơ bản).
  - **Khối Nhiệm vụ Mở rộng (Extension Tasks - 30 điểm)**: Phân hóa năng lực nâng cao (Mô hình RFM, Phân tích Cohort Retention, Đề xuất chiến lược C-Level).
* **Quy chế liêm chính học thuật**: Bài nộp sẽ được quét tự động qua hệ thống **CyberSoft Zero-Leakage & Code Plagiarism Checker**. Điểm số được chấm tự động 60% qua Auto-Grader và 40% qua đánh giá bảo vệ của Giảng viên Mentor.
