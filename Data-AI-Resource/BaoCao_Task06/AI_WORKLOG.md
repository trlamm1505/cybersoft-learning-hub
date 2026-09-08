# AI WORK LOG — NGÀY 06: DATASET BÁN HÀNG ĐA BẢNG (`sales_v1`)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-08  
**Task ID**: `#DAY-06-SALES-MULTITABLE-DATASET`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Bước sang Tuần 2 với đầu việc "Tạo tài nguyên dữ liệu" (Data Resource Engineering), nhiệm vụ đặt ra là kiến tạo một bộ dữ liệu bán hàng đa bảng chuẩn nghiệp vụ doanh nghiệp Việt Nam gồm 5 bảng quan hệ (`customers`, `products`, `employees`, `orders`, `order_details`) theo mô hình Star Schema.
* **Yêu cầu kỹ thuật cốt lõi**:
  * Xây dựng 2 phiên bản độc lập đối chứng:
    * `sales_v1_clean`: Đạt chuẩn toàn vẹn thực thể và toàn vẹn tham chiếu 100% (PK-FK), tính toán dòng tiền không sai lệch, ngày tháng logic, sẵn sàng cho học viên thực hành SQL/BI.
    * `sales_v1_dirty`: Cài cắm có chủ ý 10 loại lỗi dữ liệu thực tế (ETL anomalies) đóng vai trò là "bãi thử nghiệm đối chứng" (testing benchmark) kiểm tra năng lực bắt lỗi của Data Quality Harness và làm bài tập Data Cleaning.
  * Dữ liệu phải mang tính xác định (deterministic & reproducible) bằng cách cố định `random.seed(42)`, đảm bảo tái lập chính xác qua mọi kỳ kiểm tra.
  * Tuyệt đối không rò rỉ dữ liệu cá nhân thật (Zero PII Leakage): Sử dụng thuật toán tổng hợp dữ liệu (Synthetic Data) có kiểm soát với domain ảo `@example.com` và đầu số viễn thông chuẩn.
  * Biên soạn Từ điển dữ liệu chuẩn (Data Dictionary) định dạng Markdown và JSON; thiết kế bộ 20 câu hỏi phân tích kinh doanh chia 3 cấp độ (Cơ bản, Trung cấp, Nâng cao & BI) kèm câu lệnh SQL mẫu và Expected Insights.
  * Xây dựng công cụ kiểm định tự động (`validate_sales_data.py`) và bộ test suite `pytest`.

### Rủi ro dự kiến & Bẫy AI thường gặp
* **Orphan Key Cascading**: Khi AI tự sinh ngẫu nhiên các mã khóa ngoại (FK), nếu không quản lý chặt danh sách khóa chính (PK) đã sinh ra thì rất dễ vô tình tạo ra khóa ngoại mồ côi ngay trong bản clean, phá vỡ tính toàn vẹn tham chiếu.
* **Math Discrepancy trong dòng tiền**: Phép tính `line_total = quantity * unit_price * (1 - discount)` và `orders.total_amount = SUM(line_total)` nếu không được làm tròn (`round(..., 2)`) nhất quán sẽ sinh ra lỗi dấu phẩy động (floating point inaccuracy), khiến tổng tiền đơn bị lệch vài hào so với chi tiết dòng.
* **Format tiếng Việt lỗi thời trên Windows**: AI thường quên xử lý `sys.stdout.reconfigure(encoding='utf-8')` trên môi trường PowerShell/CMD của Windows, dẫn đến lỗi crash `UnicodeEncodeError: 'charmap' codec can't encode...`.
* **Cú pháp SQL đặc thù của một hệ quản trị duy nhất**: AI thường viết câu truy vấn SQL chứa các hàm riêng của MySQL (như `DATE_FORMAT`, `DATEDIFF`), khiến học viên không thể chạy được trên PostgreSQL hoặc DuckDB/SQLite của CyberSoft.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash / Claude 3.5 Sonnet).
* **Mục tiêu tương tác**: Thiết kế mô hình dữ liệu quan hệ Star Schema 5 thực thể, hiện thực hóa script sinh dữ liệu tổng hợp xác định (seed=42) không PII, cài cắm 10 lỗi dữ liệu thực tế có ground truth đối chứng, biên soạn Data Dictionary và 20 câu hỏi SQL chuẩn ANSI.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data Architect & Senior Data Modeler tại CyberSoft Academy.
Bối cảnh: Tiếp nối thành quả Tuần 1 (xây dựng xong Data Quality Harness v0), hãy thiết kế và xây dựng bộ dữ liệu bán hàng đa bảng (sales_v1) phục vụ học viên Data Analyst thực hành và kiểm thử chất lượng dữ liệu.
Ràng buộc kỹ thuật: Local-first, thuần Python (không phụ thuộc thư viện bên ngoài nặng), deterministic với random.seed(42), Zero PII, tương thích hoàn toàn môi trường Windows PowerShell.
Hãy thực hiện các yêu cầu sau theo chuẩn công nghiệp:
1. Thiết kế mô hình Star Schema gồm 5 bảng: customers (200), products (50), employees (20), orders (1.000), order_details (~1.800 dòng).
2. Xây dựng script scripts/generate_sales_dataset.py sinh đồng thời 2 bản: clean (toàn vẹn 100%) và dirty (cài cắm 10 loại lỗi nghiệp vụ thực tế).
3. Lưu trữ bảng đáp án đối chứng Ground Truth (dirty_data_ground_truth.json và .md) ghi rõ vị trí dòng, cột, giá trị sai, giá trị chuẩn và câu lệnh SQL khắc phục.
4. Viết Data Dictionary chi tiết cấu trúc 5 bảng dạng Markdown và JSON.
5. Biên soạn 20 câu hỏi phân tích kinh doanh chia 3 cấp độ (Cơ bản, Trung cấp, Nâng cao/BI) kèm câu truy vấn SQL mẫu chuẩn ANSI/PostgreSQL/SQLite và Expected Insights.
6. Xây dựng CLI validate_sales_data.py kiểm tra 10 khía cạnh chất lượng, tự động kiểm tra cả 2 bộ dữ liệu clean và dirty.
7. Xây dựng bộ test suite tests/test_sales_integrity.py bằng Pytest kiểm tra toàn diện 6 tiêu chí nghiệm thu.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Đề xuất cài thêm thư viện `faker` qua `pip install` để sinh dữ liệu**. | Phụ thuộc thư viện ngoài không cần thiết, làm chậm pipeline CI/CD và Faker mặc định sinh họ tên tiếng Anh hoặc cấu trúc SĐT nước ngoài không phản ánh thị trường bán lẻ Việt Nam. | **TỰ XÂY DỰNG SYNTHETIC GENERATOR**: Viết module sinh dữ liệu tổng hợp dựa trên từ điển 15 họ, 20 tên đệm và 28 tên Việt Nam thông dụng; kết hợp hàm `remove_accents` tạo email `ho.ten.xxx@example.com` và đầu số viễn thông chuẩn 10 chữ số, đảm bảo 100% Zero PII. |
| **Sửa đè (in-place modification) trực tiếp lên danh sách đối tượng gốc khi cài lỗi dirty**. | Do cơ chế tham chiếu bộ nhớ trong Python, sửa trực tiếp trên danh sách gốc sẽ làm bẩn cả bản clean, khiến bản clean mất tính toàn vẹn và vi phạm tiêu chí nghiệm thu. | **ÁP DỤNG DEEP COPY ĐỘC LẬP**: Sử dụng list comprehension `[dict(r) for r in rows]` để tách biệt hoàn toàn 2 vùng nhớ độc lập giữa `clean` và `dirty`, bảo toàn tính nguyên vẹn 100% cho bản clean. |
| **In trực tiếp thông báo tiếng Việt có dấu và emoji ra màn hình console**. | Gặp lỗi `UnicodeEncodeError: 'charmap'` trên Windows PowerShell khi terminal chạy bảng mã mặc định `cp1252`. | **CHUẨN HÓA MÃ HÓA CONSOLE**: Bổ sung `sys.stdout.reconfigure(encoding='utf-8')` ngay đầu mọi script Python và chuẩn hóa các thông báo sang dạng text tags ASCII (`[PASS]`, `[FAIL]`, `[SUCCESS]`). |
| **Viết 20 câu hỏi phân tích dùng cú pháp hàm ngày tháng riêng của MySQL (`DATE_FORMAT`, `DATEDIFF`)**. | Học viên CyberSoft học và thực hành trên PostgreSQL, DuckDB và SQLite; các hàm riêng của MySQL sẽ báo lỗi cú pháp (`SyntaxError`) ngay khi nạp vào DB. | **CHUẨN HÓA ANSI SQL & PORTABILITY**: Viết lại toàn bộ 20 truy vấn SQL theo chuẩn ANSI SQL kết hợp hàm tương thích cao (`SUBSTRING`, `JULIANDAY`, Window Functions `DENSE_RANK()`, `LAG()`, `NTILE()`), chạy mượt mà trên mọi hệ quản trị. |
| **Bắt buộc người dùng phải gõ tham số `--dataset-dir` hoặc `-d` khi chạy validator CLI**. | Khi người dùng chỉ gõ `python validate_sales_data.py`, CLI lập tức báo lỗi `error: the following arguments are required: --dataset-dir/-d`, gây khó khăn cho việc nghiệm thu nhanh. | **NÂNG CẤP AUTO-AUDIT THÔNG MINH**: Cho phép tham số `-d` là tùy chọn; nếu chạy không tham số, script tự động kiểm tra liên hoàn cả 2 bộ `data/clean` và `data/dirty` rồi in bảng tổng kết đối chứng. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thực thi hệ thống kiểm thử tự động độc lập gồm script sinh dữ liệu, CLI validator và bộ 6 Pytest unit tests.

### Lệnh chạy kiểm thử:
```powershell
# 1. Sinh dữ liệu xác định sales_v1 (clean & dirty):
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/scripts/generate_sales_dataset.py

# 2. Tự động kiểm định chất lượng toàn vẹn cả 2 bộ dữ liệu:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/scripts/validate_sales_data.py

# 3. Chạy toàn bộ Pytest Suite tự động:
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/tests/ -v
```

### Kết quả chạy thực tế:
```text
======================================================================
TỔNG KẾT KIỂM ĐỊNH TOÀN BỘ DATASET TASK 06
======================================================================
  - Bản Clean: 0 lỗi vi phạm -> [PASS]
  - Bản Dirty: 28 lỗi vi phạm được phát hiện -> [PASS: ĐÃ BẮT TRÚNG LỖI]
======================================================================

============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien
collected 6 items

tests/test_sales_integrity.py::TestCleanDataset::test_file_existence PASSED [ 16%]
tests/test_sales_integrity.py::TestCleanDataset::test_primary_key_uniqueness PASSED [ 33%]
tests/test_sales_integrity.py::TestCleanDataset::test_foreign_key_referential_integrity PASSED [ 50%]
tests/test_sales_integrity.py::TestCleanDataset::test_financial_calculations PASSED [ 66%]
tests/test_sales_integrity.py::TestCleanDataset::test_clean_validation_pass_zero_errors PASSED [ 83%]
tests/test_sales_integrity.py::TestDirtyDataset::test_dirty_validation_detects_all_issues PASSED [100%]

============================== 6 passed in 0.46s ==============================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Phân tích bài toán thiết kế mô hình dữ liệu Star Schema 5 bảng, xác định quy luật quan hệ PK-FK, 10 loại lỗi nghiệp vụ ETL và mục tiêu phân tích kinh doanh trước khi gọi AI.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Principal Data Architect, giao prompt có cấu trúc rõ ràng, kiểm soát chặt chẽ từng module (Data Generator, Clean/Dirty Injection, Data Dictionary, Analytical SQL, Pytest Suite).
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Phát hiện và loại bỏ thư viện `faker` không cần thiết, ngăn chặn lỗi tham chiếu bộ nhớ khi cài lỗi bẩn, xử lý triệt để encoding UTF-8 console Windows, và chuẩn hóa cú pháp SQL sang ANSI.
* **Tầng 4 — Làm chủ (Technical Ownership)**: Tự viết thuật toán Synthetic Generator độc lập, thiết lập bảng đối chứng Ground Truth có câu lệnh SQL khắc phục, nâng cấp CLI tự động kiểm định 2 chiều, và làm chủ 100% tài nguyên kỹ thuật bàn giao.
