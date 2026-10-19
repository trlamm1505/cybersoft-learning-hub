# SỔ TAY HƯỚNG DẪN DÀNH CHO GIẢNG VIÊN & TRỢ GIẢNG (INSTRUCTOR QUICK GUIDE) — TASK 30
## HỆ THỐNG QUẢN TRỊ TÀI NGUYÊN CYBERSOFT DATA & AI LAB v1.0

**Sản phẩm:** CyberSoft Data & AI Lab v1.0  
**Đối tượng sử dụng:** Giảng viên đứng lớp, Trợ giảng kỹ thuật, Chuyên viên quản lý học vụ CyberSoft Academy  
**Mục tiêu tài liệu:** Tra cứu nhanh cấu trúc dữ liệu, tải tài nguyên thực hành (sạch/bẩn), giao bài tập và chấm thi đồ án Capstone theo rubric chuẩn hóa mà không cần can thiệp kỹ thuật chuyên sâu.  

---

## 1. QUY TRÌNH 3 PHÚT BẮT ĐẦU NHANH (3-MINUTE QUICKSTART)

Giảng viên hoặc Trợ giảng có thể chuẩn bị học liệu cho buổi học chỉ trong 3 bước:

```text
+-----------------------+     +-------------------------------+     +----------------------------+
| BƯỚC 1: TRA CỨU HỌC LIỆU| ──> | BƯỚC 2: TẢI DATASET SẠCH/BẨN   | ──> | BƯỚC 3: GIAO ĐỀ & CHẤM THI |
| Mở tài liệu / Cổng API|     | Chọn định dạng CSV / Parquet  |     | Lấy rubric 5 tiêu chí      |
+-----------------------+     +-------------------------------+     +----------------------------+
```

1. **Bước 1: Tra cứu học liệu và đề bài theo môn học**
   - Xác định chuyên đề giảng dạy: SQL nâng cao, Làm sạch dữ liệu (Data Cleaning), Trực quan hóa Power BI, hoặc Xây dựng ứng dụng AI RAG.
   - Đối chiếu danh mục 4 datasets và 2 đề án Capstone tại Mục 2 dưới đây để chọn mã tài nguyên tương ứng (`DS-001`, `DS-002`, `DS-003`, `DS-004`, `CAP-001`, `CAP-002`).

2. **Bước 2: Tải dữ liệu thực hành cho học viên**
   - **Buổi học làm sạch dữ liệu (Data Cleaning):** Tải file dữ liệu bẩn (`*_dirty.csv`). Bộ dữ liệu này đã được chèn có chủ đích các lỗi thực tế (giá trị thiếu, định dạng ngày tháng không chuẩn, đơn hàng trùng lặp) để học viên rèn luyện kỹ năng gỡ lỗi.
   - **Buổi học phân tích & trực quan hóa (Analytics & BI):** Tải file dữ liệu sạch (`*_clean.csv` hoặc `*.parquet`). Dữ liệu đã được chuẩn hóa 100% chuẩn 3NF, sẵn sàng import vào Power BI, Tableau hoặc Jupyter Notebook.

3. **Bước 3: Lấy đề bài Capstone và barem chấm điểm công bằng**
   - Tải file đề bài chi tiết kèm barem chấm điểm 5 tiêu chí (Rubric).
   - Công bố rubric cho học viên ngay từ đầu kỳ để định hướng chuẩn đầu ra rõ ràng.

---

## 2. DANH MỤC 4 BỘ DỮ LIỆU CHUẨN DOANH NGHIỆP (3NF ENTERPRISE DATASETS)

Tất cả 4 bộ dữ liệu đều được thiết kế dựa trên các bài toán vận hành thực tế tại doanh nghiệp, bao gồm đầy đủ Từ điển Dữ liệu (Data Dictionary):

### 2.1. Dataset DS-001: Bán Hàng & Đơn Hàng Bán Lẻ (Retail Orders)
- **Quy mô:** 50,000 bản ghi giao dịch, liên kết qua 5 bảng quan hệ chuẩn 3NF:
  1. `customers` (Khách hàng: thông tin phân khúc, địa lý, ngày đăng ký).
  2. `stores` (Cửa hàng: chi nhánh, tỉnh/thành phố, diện tích).
  3. `products` (Sản phẩm: danh mục, giá niêm yết, giá vốn).
  4. `orders` (Đơn hàng: ngày đặt hàng, mã thanh toán, trạng thái).
  5. `order_items` (Chi tiết dòng hàng: số lượng, đơn giá, chiết khấu).
- **Ứng dụng giảng dạy:**
  - Viết truy vấn SQL phân tích doanh thu đa chiều, JOIN nhiều bảng, tính RFM (Recency, Frequency, Monetary).
  - Sử dụng Window Functions (RANK, DENSE_RANK, LEAD, LAG) để tính tỷ lệ tăng trưởng doanh số theo tháng (MoM Growth).
- **Phân loại tệp bàn giao:**
  - `DS-001_clean.csv`: Bản chuẩn hóa hoàn hảo cho phân tích.
  - `DS-001_dirty.csv`: Chứa 5% dòng lỗi format ngày và null category cho bài thực hành làm sạch.

### 2.2. Dataset DS-002: Quản Trị Nhân Sự & Đánh Giá Hiệu Suất (HR Performance)
- **Quy mô:** 12,000 bản ghi nhân sự, tổ chức theo 4 bảng quan hệ 3NF:
  1. `employees` (Hồ sơ nhân viên: họ tên, ngày sinh, chức danh, phòng ban).
  2. `departments` (Phòng ban: tên phòng, trưởng phòng, ngân sách).
  3. `salaries` (Lịch sử lương thưởng theo thời gian).
  4. `performance_reviews` (Điểm đánh giá hiệu suất KPI hàng quý).
- **Ứng dụng giảng dạy:**
  - Trực quan hóa dữ liệu nhân sự trên Power BI (biểu đồ cơ cấu lương, tỷ lệ thôi việc Turnover Rate).
  - Phân tích tương quan giữa mức độ đãi ngộ và hiệu suất làm việc của nhân viên.
- **Phân loại tệp bàn giao:** `DS-002_clean.csv` và `DS-002_dirty.csv`.

### 2.3. Dataset DS-003: Quy Chế Đào Tạo & Tri Thức RAG (Academic Regulations)
- **Quy mô:** 2,500 đoạn văn bản (chunks) được chuẩn hóa từ sổ tay đào tạo của CyberSoft, đi kèm vector embeddings 384 chiều.
- **Ứng dụng giảng dạy:**
  - Môn học Xây dựng Ứng dụng AI RAG (Retrieval-Augmented Generation) cho lớp AI Engineer.
  - Thực hành các kỹ thuật chia nhỏ văn bản (Recursive Text Chunking), đánh chỉ mục Vector, và đo lường độ chính xác tìm kiếm ngữ nghĩa.
- **Phân loại tệp bàn giao:** `DS-003_knowledge.json` và `DS-003_embeddings.parquet`.

### 2.4. Dataset DS-004: Luồng Sự Kiện Thương Mại Điện Tử (E-Commerce Clickstream)
- **Quy mô:** 150,000 sự kiện tương tác người dùng (view_item, add_to_cart, purchase), tổ chức theo mô hình hình sao (Star Schema).
- **Ứng dụng giảng dạy:**
  - Phân tích phễu chuyển đổi (Conversion Funnel Analysis) và tỷ lệ bỏ rơi giỏ hàng (Cart Abandonment Rate).
  - Xử lý dữ liệu lớn với định dạng Parquet và thư viện PySpark / DuckDB / Polars.
- **Phân loại tệp bàn giao:** `DS-004_clickstream.parquet`.

---

## 3. HƯỚNG DẪN 2 ĐỒ ÁN TỐT NGHIỆP CAPSTONE & RUBRIC CHẤM ĐIỂM

Hệ thống đã chuẩn hóa trọn bộ hồ sơ 2 đề tài tốt nghiệp, giúp giảng viên chấm thi nhanh chóng, minh bạch và thống nhất giữa các hội đồng:

### 3.1. Capstone 1 (CAP-001): Phân Tích Doanh Thu & Hành Vi Người Tiêu Dùng (Dành cho Data Analyst)
- **Mục tiêu học viên:** Xây dựng một báo cáo phân tích kinh doanh hoàn chỉnh từ dữ liệu thô, tìm ra nguyên nhân sụt giảm doanh số ở một số nhóm ngành hàng và đề xuất giải pháp cho Ban Giám đốc qua Dashboard tương tác.
- **Barem chấm điểm chi tiết 5 tiêu chí (Rubric):**

| Tiêu Chí Đánh Giá | Trọng Số | Mức Xuất Sắc (9 - 10đ) | Mức Khá (7 - 8đ) | Mức Trung Bình (5 - 6đ) |
| :--- | :---: | :--- | :--- | :--- |
| **1. Mô hình hóa dữ liệu (Data Modeling)** | **25%** | Thiết kế lược đồ hình sao hoặc 3NF chuẩn xác, khóa chính/ngoại liên kết đúng 100%, không dư thừa. | Mô hình hóa đúng cơ bản, còn 1 vài trường chưa tối ưu quan hệ. | Dữ liệu để dạng bảng phẳng (flat table), chưa chuẩn hóa quan hệ. |
| **2. Kỹ năng làm sạch (Data Cleaning)** | **20%** | Xử lý triệt để missing values, duplicates, outliers và chuẩn hóa định dạng thời gian có giải trình lý do. | Xử lý được missing và duplicate, nhưng chưa giải trình cách xử lý ngoại lai. | Bỏ qua nhiều dòng dữ liệu lỗi, làm mất mát thông tin quan trọng. |
| **3. Phân tích kinh doanh (Business Insights)** | **25%** | Đưa ra ít nhất 3 đề xuất hành động thực tế có số liệu chứng minh (Data-backed Actions) giúp tối ưu doanh thu. | Nhận định đúng xu hướng nhưng đề xuất còn chung chung, thiếu tính khả thi. | Chỉ mô tả lại số liệu trên biểu đồ, không có góc nhìn phân tích kinh doanh. |
| **4. Thẩm mỹ Dashboard (Visualization)** | **15%** | Bố cục trực quan, màu sắc đồng bộ, áp dụng chuẩn mực UX (người dùng xem hiểu ngay trong 5 giây), filter mượt mà. | Dashboard đầy đủ biểu đồ nhưng màu sắc lộn xộn, bố cục hơi rối. | Biểu đồ chọn sai loại dữ liệu (ví dụ: dùng Pie chart cho 20 nhóm). |
| **5. Thuyết trình & Phản biện (Presentation)** | **15%** | Trình bày mạch lạc, đúng thời lượng 15 phút, trả lời tự tin 100% câu hỏi phản biện của Hội đồng. | Thuyết trình lưu loát nhưng trả lời phản biện còn lúng túng ở một vài chi tiết. | Nói quá thời gian quy định, không nắm vững nguồn gốc số liệu. |

---

### 3.2. Capstone 2 (CAP-002): Trợ Giảng AI RAG Có Khả Năng Từ Chối Ảo Giác (Dành cho AI Engineer)
- **Mục tiêu học viên:** Xây dựng hệ thống Hỏi - Đáp quy chế đào tạo tích hợp mô hình ngôn ngữ lớn (LLM), kết hợp Hybrid Search (BM25 + Dense Retrieval), có trích dẫn nguồn xác thực và cam kết tỷ lệ ảo giác dưới 2%.
- **Barem chấm điểm chi tiết 5 tiêu chí (Rubric):**

| Tiêu Chí Đánh Giá | Trọng Số | Mức Xuất Sắc (9 - 10đ) | Mức Khá (7 - 8đ) | Mức Trung Bình (5 - 6đ) |
| :--- | :---: | :--- | :--- | :--- |
| **1. Chiến lược Chunking & Indexing** | **20%** | Phân mảnh ngữ nghĩa giữ nguyên tiêu đề điều khoản, vector embeddings chất lượng cao, đánh chỉ mục tối ưu. | Chia đoạn theo kích thước cố định (fixed size), đôi khi cắt ngang điều khoản. | Phân mảnh sơ sài, làm đứt gãy thông tin ngữ cảnh. |
| **2. Tìm kiếm lai Hybrid Search RRF** | **25%** | Tích hợp thuật toán Reciprocal Rank Fusion kết hợp BM25 và Vector, P95 độ trễ $\le 25\text{ ms}$. | Chỉ sử dụng một phương pháp Vector Search đơn thuần, chưa có Rank Fusion. | Tìm kiếm chậm, độ trễ vượt quá 100ms. |
| **3. Trích nguồn chuẩn xác (Grounding)** | **25%** | 100% câu trả lời đều có trích dẫn mã điều khoản `[doc#sec]` chính xác, đối chiếu kiểm tra được ngay. | Trích nguồn được nhưng định dạng chưa thống nhất hoặc trích dẫn hơi rộng. | Trả lời không có trích dẫn nguồn, khó kiểm chứng tính xác thực. |
| **4. Cơ chế từ chối ảo giác (Refusal)** | **15%** | Lịch sự từ chối 100% các câu hỏi ngoài phạm vi học viện hoặc cố tình bẫy (Prompt Injection / OOD). | Từ chối được phần lớn câu hỏi lạ nhưng vẫn bị ảo giác nhẹ ở một số trường hợp. | Trả lời bịa đặt thông tin khi gặp câu hỏi không có trong cơ sở tri thức. |
| **5. Hiệu năng & Bộ nhớ đệm (Caching)** | **15%** | Tích hợp bộ nhớ đệm LRU cho các câu hỏi thường gặp, đạt P95 $\le 5\text{ ms}$, Throughput $\ge 300\text{ RPS}$. | Tích hợp đệm cơ bản nhưng chưa tối ưu kích thước hoặc thiếu cơ chế dọn dẹp. | Không có bộ nhớ đệm, mỗi câu hỏi đều phải gọi lại LLM tốn kém. |

---

## 4. CÁCH HƯỚNG DẪN HỌC VIÊN TRẢI NGHIỆM TRỢ GIẢNG AI (AI TUTOR)

Giảng viên có thể hướng dẫn học viên tự thực hành hỏi đáp với Trợ giảng AI:
1. **Câu hỏi mẫu về quy chế:**
   - *"Thời hạn bảo lưu khóa học tại CyberSoft là bao lâu?"*
   - *"Điều kiện điểm số để được cấp chứng chỉ tốt nghiệp loại Giỏi?"*
   - *"Quy trình nộp lại đồ án Capstone khi chưa đạt yêu cầu?"*
2. **Quan sát chuẩn phản hồi:**
   - Câu trả lời ngắn gọn, đúng trọng tâm.
   - Luôn kèm mã trích dẫn ở cuối đoạn (ví dụ: `[QC-DA-2026#Dieu-12]`).
3. **Thử nghiệm câu hỏi ngoài phạm vi (Out-of-Domain):**
   - Đặt câu hỏi không liên quan: *"Hướng dẫn nấu món phở bò?"*
   - Hệ thống phản hồi lịch sự: *"Xin lỗi, câu hỏi này nằm ngoài phạm vi quy chế và học liệu đào tạo của CyberSoft Data & AI Lab. Tôi chỉ có thể hỗ trợ các thắc mắc về khóa học và dữ liệu thực hành."*

---

## 5. KÊNH HỖ TRỢ VÀ BÁO LỖI HỌC VỤ (SUPPORT & ESCALATION)

Trong quá trình giảng dạy, nếu giảng viên hoặc trợ giảng gặp bất kỳ vướng mắc nào:
- **Kênh tiếp nhận chính:** Bộ phận Kỹ thuật Data & AI Resource Engineering.
- **Thời gian cam kết phản hồi (SLA):**
  - Trong giờ học thực hành của học viên: **Dưới 15 phút**.
  - Ngoài giờ học thực hành: **Dưới 2 giờ làm việc**.
- **Quy trình báo lỗi chuẩn:** Cung cấp (1) Tên khóa học & lớp, (2) Mã dataset / đồ án gặp sự cố, (3) Ảnh chụp màn hình thông báo lỗi (nếu có).
