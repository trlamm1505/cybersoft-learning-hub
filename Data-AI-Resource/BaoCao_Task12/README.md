# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 12

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 12 — Tạo dự án Data Analyst số 1 (`DA-01_sales_performance`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-09-16  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task12/` chứa trọn bộ tài nguyên và mã nguồn của bài tập lớn số 1 dành cho học viên chuyên ngành Dữ liệu tại CyberSoft Academy:

```text
BaoCao_Task12/
├── 12_data_analyst_capstone_01.md    # Bản đặc tả kỹ thuật chi tiết toàn diện Task 12
├── README.md                         # Báo cáo tổng quan bàn giao & hướng dẫn thực thi
├── AI_WORKLOG.md                     # Nhật ký phối hợp AI & thẩm định 3 cột theo chuẩn CyberSoft
├── Picture_12_Detail.png             # Sơ đồ kiến trúc Capstone DA-01 & đối soát 3 chiều (High-res)
├── projects/
│   └── DA-01_sales_performance/
│       ├── student_edition/          # Miền tài nguyên phát cho học viên (Zero Answer Leakage)
│       │   ├── PROJECT_BRIEF.md      # Đề bài hoàn chỉnh: 10 câu hỏi C-Level & 12 nhiệm vụ
│       │   ├── rubric.json           # Barem định lượng 100 điểm (70 Core + 30 Extension)
│       │   ├── HINTS.md              # Giàn giáo gợi ý 3 tầng (Khái niệm, Cú pháp, Bẫy lỗi)
│       │   ├── data/                 # 4 bảng CSV thực tế: orders, order_items, customers, products
│       │   └── starter_kit/          # data_dictionary, starter SQL, starter Python, checklist
│       └── instructor_edition/       # Miền tài nguyên giảng viên & máy chấm tự động
│           ├── SOLUTION_MANUAL.md    # Đáp án 10 câu hỏi stakeholder & khuyến nghị điều hành
│           ├── expected_kpis.json    # Bộ chỉ số chuẩn Ground Truth ($388,850.28 net revenue)
│           ├── common_pitfalls.md    # Danh mục 8 bẫy lỗi kinh điển của học viên
│           ├── solutions/            # Mã nguồn giải hoàn chỉnh (SQL, Python Pipeline, Excel specs)
│           └── grading/auto_grader.py# Máy chấm tự động đối soát 60 điểm định lượng
├── scripts/
│   ├── cross_verification_engine.py  # Động cơ đối soát số liệu 3 chiều (SQL vs Pandas vs Matrix)
│   ├── generate_task12_diagram.py    # Mã nguồn sinh sơ đồ kiến trúc Picture_12_Detail.png
│   └── demo_capstone_workflow.py     # Kịch bản demo kiểm định toàn diện 4 bước (Exit code 0)
└── tests/                            # Bộ 11 unit & integration tests (100% PASS in 2.14s)
    ├── conftest.py
    ├── test_capstone_integrity.py
    ├── test_data_validation.py
    ├── test_zero_leakage.py
    ├── test_cross_verification.py
    ├── test_rubric_schema.py
    └── test_auto_grader.py
```

---

## 2. HƯỚNG DẪN THỰC THI NHANH (QUICK START GUIDE)

### Bước 1: Chạy kiểm toán đối soát số liệu 3 chiều (Triangulation Audit)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task12/scripts/cross_verification_engine.py
```
*Kết quả kỳ vọng*: Cả 3 phương pháp (SQL, Pandas, Matrix math) trả về kết quả trùng khớp tuyệt đối (Delta = $0.00):
- Net Revenue: `$388,850.28`
- Gross Profit: `$121,652.51`
- Gross Margin %: `31.43%`
- Average Order Value: `$1,150.44`
- Số đơn hoàn tất: `338 đơn` (trên `400 đơn sạch`)

### Bước 2: Chạy kịch bản Demo Workflow toàn diện (4 bước kiểm định)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task12/scripts/demo_capstone_workflow.py
```
*Kết quả kỳ vọng*: Vượt qua toàn bộ 4 bước kiểm tra cấu trúc (12 file student, 7 file instructor), quét Zero-Leakage 100% CLEAN, chạy đối soát chéo Delta = $0.00, và khởi chạy Auto-Grader đạt 60.0/60.0 điểm (Exit code: 0).

### Bước 3: Chạy bộ kiểm thử tự động Pytest suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task12/tests/ -v
```
*Kết quả kỳ vọng*: 11/11 test cases **PASSED** trong ~2.14 giây (100% SUCCESS).

---

## 3. BẢNG CHECKLIST TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí nghiệm thu (DoD Criteria) | Trạng thái | Bằng chứng kiểm chứng độc lập |
| :---: | :--- | :---: | :--- |
| **01** | Có bản mô tả dự án Capstone DA-01 và 10 câu hỏi stakeholder | **ĐẠT (PASS)** | `PROJECT_BRIEF.md` đủ 10 câu hỏi từ CEO, CFO, CCO, CMO, Ops. |
| **02** | Có 12 nhiệm vụ kỹ thuật cụ thể từ làm sạch đến Executive Dashboard | **ĐẠT (PASS)** | Lộ trình 12 nhiệm vụ chi tiết trong brief và `solution_queries.sql`. |
| **03** | Có bộ giải pháp giảng viên và bộ chỉ số chuẩn Ground Truth | **ĐẠT (PASS)** | `expected_kpis.json` ($388,850.28) và `SOLUTION_MANUAL.md`. |
| **04** | Có ít nhất 3 phương pháp đối soát số liệu độc lập | **ĐẠT (PASS)** | `cross_verification_engine.py` (SQL vs Pandas vs Matrix, Delta = $0.00). |
| **05** | Có danh mục tối thiểu 8 lỗi sai kinh điển của học viên | **ĐẠT (PASS)** | `common_pitfalls.md` chi tiết 8 bẫy lỗi kèm nguyên nhân và cách sửa. |
| **06** | Barem Rubric 100 điểm định lượng (70đ Core + 30đ Extension) | **ĐẠT (PASS)** | `rubric.json` 100% tiêu chí có số học, không có từ ngữ cảm tính. |
| **07** | Phân tách nghiêm ngặt bản học viên và bản giảng viên (Zero Leakage)| **ĐẠT (PASS)** | `test_zero_leakage.py` quét regex xác thực 100% CLEAN. |
| **08** | Công cụ tự động chấm điểm bài nộp học viên định lượng 60 điểm | **ĐẠT (PASS)** | `grading/auto_grader.py` đối soát SQL/Python và chấm điểm tự động. |
| **09** | Bộ kiểm thử tự động Pytest đạt 100% PASS | **ĐẠT (PASS)** | 11/11 test cases Passed trong 2.14s. |
| **10** | Tệp báo cáo Word chính thức đúng quy chuẩn CyberSoft | **ĐẠT (PASS)** | `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_12.docx`. |

---

## 4. QUY TRÌNH TỰ ĐỘNG CHẤM ĐIỂM VÀ ĐÓNG GÓI (GRADING & AUTOMATION)

* **Bộ chấm tự động `auto_grader.py`**:
  - Hỗ trợ nhập bài nộp của học viên dạng SQL script (`.sql`) hoặc Pandas script (`.py`), tự động trích xuất các KPI thực thi và đối soát với `expected_kpis.json`.
  - Chấm tự động 60 điểm trên thang điểm 100 với dung sai sai số tài chính chặt chẽ ($\pm 0.01$), xuất báo cáo chi tiết từng tiêu chí và điểm số đạt được.
* **Cơ chế kiểm soát rò rỉ đáp án (Zero Answer Leakage)**:
  - Kiểm thử `test_zero_leakage.py` tự động quét toàn bộ thư mục `student_edition/` trước khi phát hành cho học viên nhằm bảo đảm tuyệt đối không chứa số liệu Ground Truth, câu lệnh SQL giải mẫu hay gợi ý cấp độ 3.
