# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 13

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 13 — Tạo dự án Data Analyst số 2 (`DA-02_inventory_operations`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-09-17  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task13/` chứa trọn bộ tài nguyên và mã nguồn của bài tập lớn số 2 dành cho học viên chuyên ngành Dữ liệu tại CyberSoft Academy:

```text
BaoCao_Task13/
├── 13_data_analyst_capstone_02.md    # Bản đặc tả kỹ thuật chi tiết toàn diện Task 13
├── README.md                         # Báo cáo tổng quan bàn giao & hướng dẫn thực thi
├── AI_WORKLOG.md                     # Nhật ký phối hợp AI & thẩm định 3 cột theo chuẩn CyberSoft
├── Picture_13_Detail.png             # Sơ đồ kiến trúc Capstone DA-02 & đối soát 3 chiều (High-res)
├── projects/
│   └── DA-02_inventory_operations/
│       ├── student_edition/          # Miền tài nguyên phát cho học viên (Zero Answer Leakage)
│       │   ├── PROJECT_BRIEF.md      # Đề bài hoàn chỉnh: 10 câu hỏi C-Level & 12 nhiệm vụ
│       │   ├── rubric.json           # Barem định lượng 100 điểm (70 Core + 30 Extension)
│       │   ├── HINTS.md              # Giàn giáo gợi ý 3 tầng (Khái niệm, Cú pháp, Bẫy lỗi)
│       │   ├── data/
│       │   │   ├── clean/            # 6 bảng CSV chuẩn sạch: movements, products, warehouses...
│       │   │   └── dirty/            # 6 bảng CSV kiểm toán chứa 8 ngoại lệ nghiệp vụ thực tế
│       │   └── starter_kit/          # data_dictionary, starter SQL, starter Python, checklist
│       └── instructor_edition/       # Miền tài nguyên giảng viên & máy chấm tự động
│           ├── SOLUTION_MANUAL.md    # Đáp án 10 câu hỏi stakeholder & kế hoạch hành động 90 ngày
│           ├── expected_kpis.json    # Bộ chỉ số chuẩn Ground Truth ($867,636.11 tồn kho)
│           ├── common_pitfalls.md    # Cẩm nang 8 bẫy lỗi kinh điển của học viên trong kho vận
│           ├── solutions/            # Mã nguồn giải hoàn chỉnh (SQL, Python Pipeline, Excel specs)
│           └── grading/auto_grader.py# Máy chấm tự động đối soát 60 điểm định lượng
├── scripts/
│   ├── generate_capstone_datasets.py # Mã nguồn sinh bộ dữ liệu clean và dirty
│   ├── cross_verification_engine.py  # Động cơ đối soát số liệu 3 chiều (SQL vs Pandas vs Matrix)
│   ├── generate_task13_diagram.py    # Mã nguồn sinh sơ đồ kiến trúc Picture_13-Detail.png
│   └── demo_capstone_workflow.py     # Kịch bản demo kiểm định toàn diện 4 bước (Exit code 0)
└── tests/                            # Bộ 9 unit & integration tests (100% PASS in 0.89s)
    ├── conftest.py
    ├── test_capstone_integrity.py
    ├── test_data_validation.py
    ├── test_zero_leakage.py
    ├── test_cross_verification.py
    ├── test_rubric_schema.py
    ├── test_auto_grader.py
    └── test_edge_cases.py
```

---

## 2. HƯỚNG DẪN THỰC THI NHANH (QUICK START GUIDE)

### Bước 1: Chạy kiểm toán đối soát số liệu 3 chiều (Triangulation Audit)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task13/scripts/cross_verification_engine.py
```
*Kết quả kỳ vọng*: Cả 3 phương pháp (SQL, Pandas, Matrix math) trả về kết quả trùng khớp tuyệt đối (Delta = $0.00):
- Ending Physical Stock: `9,272 units`
- Ending Inventory Valuation: `USD 867,636.11`
- Total Cost of Goods Sold (COGS): `USD 814,742.22`

### Bước 2: Chạy kịch bản Demo Workflow toàn diện (4 bước kiểm định)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task13/scripts/demo_capstone_workflow.py
```
*Kết quả kỳ vọng*: Vượt qua toàn bộ 4 bước kiểm tra cấu trúc, quét Zero-Leakage 100% CLEAN, chạy đối soát chéo, và khởi chạy Auto-Grader đạt 60.0/60.0 điểm (Exit code: 0).

### Bước 3: Chạy bộ kiểm thử tự động Pytest suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task13/tests/ -v
```
*Kết quả kỳ vọng*: 9/9 test cases **PASSED** trong 0.89 giây.

---

## 3. BẢNG CHECKLIST TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí nghiệm thu (DoD Criteria) | Trạng thái | Bằng chứng kiểm chứng độc lập |
| :---: | :--- | :---: | :--- |
| **01** | Có bản mô tả dự án Capstone DA-02 và 10 câu hỏi stakeholder | **ĐẠT (PASS)** | `PROJECT_BRIEF.md` đủ 10 câu hỏi từ COO, CFO, Warehouse Director, Procurement, Sales. |
| **02** | Có 12 nhiệm vụ kỹ thuật cụ thể từ làm sạch đến Executive BI | **ĐẠT (PASS)** | Lộ trình 12 nhiệm vụ chi tiết trong brief và `solution_queries.sql`. |
| **03** | Có bộ dữ liệu clean và dirty tích hợp 8 ngoại lệ nghiệp vụ | **ĐẠT (PASS)** | `data/clean/` (6 CSVs) và `data/dirty/` (6 CSVs) kèm `test_edge_cases.py` PASS. |
| **04** | Có bộ giải pháp giảng viên và bộ chỉ số chuẩn Ground Truth | **ĐẠT (PASS)** | `expected_kpis.json` ($867,636.11) và `SOLUTION_MANUAL.md`. |
| **05** | Có ít nhất 3 phương pháp đối soát số liệu độc lập | **ĐẠT (PASS)** | `cross_verification_engine.py` (SQL vs Pandas vs Matrix, Delta = $0.00). |
| **06** | Có danh mục tối thiểu 8 lỗi sai kinh điển của học viên trong kho vận | **ĐẠT (PASS)** | `common_pitfalls.md` chi tiết 8 bẫy lỗi kèm nguyên nhân và cách sửa. |
| **07** | Barem Rubric 100 điểm định lượng (70đ Core + 30đ Extension) | **ĐẠT (PASS)** | `rubric.json` 100% tiêu chí có số học khách quan, không từ ngữ cảm tính. |
| **08** | Phân tách nghiêm ngặt bản học viên và bản giảng viên (Zero Leakage)| **ĐẠT (PASS)** | `test_zero_leakage.py` quét regex xác thực 100% CLEAN. |
| **09** | Công cụ tự động chấm điểm bài nộp học viên định lượng 60 điểm | **ĐẠT (PASS)** | `grading/auto_grader.py` đối soát SQL/Python và chấm tự động đạt 60.0/60.0 điểm. |
| **10** | Tệp báo cáo Word chính thức đúng quy chuẩn CyberSoft | **ĐẠT (PASS)** | `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_13.docx`. |

---

## 4. QUY TRÌNH TỰ ĐỘNG CHẤM ĐIỂM VÀ ĐÓNG GÓI (GRADING & AUTOMATION)

* **Bộ chấm tự động `auto_grader.py`**:
  - Tự động đánh giá 6 tiêu chí số học then chốt: Số lượng tồn kho cuối kỳ (10đ), Tổng định giá kho (10đ), Giá vốn hàng bán (10đ), Hệ số vòng quay tồn kho (10đ), Phân bổ tồn kho 3 kho (10đ), Cảnh báo ROP và Stockout (10đ).
  - Áp dụng ngưỡng dung sai số học khắt khe ($\pm 0$ units, $\pm 0.05$ USD, $\pm 0.02x$ turnover).
* **Cơ chế kiểm soát rò rỉ đáp án (Zero Answer Leakage)**:
  - Kiểm thử tự động `test_zero_leakage.py` quét toàn bộ thư mục `student_edition/` trước khi phát hành nhằm ngăn chặn triệt để mọi hành vi rò rỉ Ground Truth KPIs hay mã giải mẫu.
