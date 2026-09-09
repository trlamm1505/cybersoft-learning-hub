# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 07

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 07 — Dataset Nhân sự và Vận hành (`HR_ops_v1`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  

---

## 📂 1. CẤU TRÚC THƯ MỤC BÀN GIAO (DELIVERABLES)

```text
Data-AI-Resource/
└── BaoCao_Task07/
    ├── README.md                            # Hướng dẫn tổng quan & chỉ mục nghiệm thu Ngày 07
    ├── 07_hr_ops_dataset.md                 # Bản đặc tả kỹ thuật kiến trúc mô hình dữ liệu nhân sự & vận hành
    ├── Picture_07-Detail.png                # Sơ đồ quan hệ thực thể ERD Nhân sự & Vận hành (Dark Mode)
    ├── Picture_07-Detail.drawio             # Tệp thiết kế gốc mở trực tiếp bằng Draw.io (đường vuông góc 100%)
    ├── AI_WORKLOG.md                        # Nhật ký sử dụng AI minh bạch theo chuẩn 5 mục CyberSoft
    ├── data_dictionary/                     # Từ điển dữ liệu chi tiết
    │   ├── data_dictionary.md               # Bản từ điển dữ liệu định dạng Markdown
    │   └── data_dictionary.json             # Bản từ điển dữ liệu máy đọc (JSON Schema)
    ├── data/
    │   ├── clean/                           # 5 bảng dữ liệu sạch 100% (HR_ops_v1_clean - 6.481 bản ghi)
    │   │   ├── employees.csv                # 250 nhân viên (215 Active, 35 Resigned)
    │   │   ├── turnovers.csv                # 35 hồ sơ thôi việc (khớp 100% nhân sự Resigned)
    │   │   ├── attendance.csv               # 5.092 bản ghi quẹt thẻ chấm công
    │   │   ├── kpi_evaluations.csv          # 654 bản ghi đánh giá KPI định kỳ 3 quý
    │   │   └── training_records.csv         # 450 bản ghi tham gia khóa đào tạo
    │   └── dirty/                           # 5 bảng dữ liệu cài cắm 10 loại lỗi nghiệp vụ thực tế
    │       ├── employees.csv
    │       ├── turnovers.csv
    │       ├── attendance.csv
    │       ├── kpi_evaluations.csv
    │       └── training_records.csv
    ├── docs/
    │   ├── business_assumptions_and_kpi_formulas.md  # Giả định nghiệp vụ & ma trận đối soát chéo KPI
    │   ├── 30_analytical_exercises.md       # 30 bài tập phân tích kinh doanh kèm 100% SQL mẫu & DAX
    │   ├── 10_expected_business_insights.md # 10 business insights mở rộng tư duy phân tích
    │   ├── dirty_data_ground_truth.md       # Bảng đáp án đối chứng lỗi cài cắm (Markdown)
    │   └── dirty_data_ground_truth.json     # Bảng đáp án đối chứng (JSON Schema)
    ├── scripts/
    │   ├── __init__.py
    │   ├── generate_hr_dataset.py           # Engine sinh dữ liệu tự động, tất định (seed=42)
    │   └── validate_hr_data.py              # CLI kiểm định toàn vẹn dữ liệu & KPI cross-validation
    └── tests/
        ├── __init__.py
        └── test_hr_integrity.py             # Pytest suite tự động kiểm tra 8 tiêu chí nghiệm thu (100% PASS)
```

---

## 🚀 2. HƯỚNG DẪN THỰC THI (QUICK START)

> **Lưu ý đường dẫn**: Các lệnh dưới đây có thể chạy trực tiếp từ thư mục `cybersoft-learning-hub/`. Nếu đứng từ thư mục gốc `d:\Cybersoft\Kien`, chỉ cần thêm tiền tố `cybersoft-learning-hub/`.

### 2.1. Tái sinh toàn bộ bộ dữ liệu (Deterministic Data Generation)
```powershell
python Data-AI-Resource/BaoCao_Task07/scripts/generate_hr_dataset.py
```
* **Thời gian thực thi**: < 1.0 giây.
* **Kết quả**: Tự động tạo 10 tệp CSV (5 clean, 5 dirty) với **6.481 dòng sạch** và bảng đối chứng `dirty_data_ground_truth`.

### 2.2. Kiểm định tính toàn vẹn và đối soát chéo KPI qua CLI
* **Tự động kiểm tra cả 2 bộ (Clean & Dirty Benchmark)**:
```powershell
python Data-AI-Resource/BaoCao_Task07/scripts/validate_hr_data.py
```

* **Kiểm tra riêng bộ dữ liệu sạch (Kết quả: PASS 100%, Exit Code 0)**:
```powershell
python Data-AI-Resource/BaoCao_Task07/scripts/validate_hr_data.py -d Data-AI-Resource/BaoCao_Task07/data/clean
```

* **Kiểm tra riêng bộ dữ liệu bẩn (Kết quả: Bắt đúng 22 vi phạm thuộc 10 nhóm lỗi, Exit Code 1)**:
```powershell
python Data-AI-Resource/BaoCao_Task07/scripts/validate_hr_data.py -d Data-AI-Resource/BaoCao_Task07/data/dirty
```

### 2.3. Chạy toàn bộ Test Suite với Pytest
```powershell
pytest Data-AI-Resource/BaoCao_Task07/tests/ -v
```
* **Kết quả**: `8 passed in 0.71s (100% SUCCESS)`.

---

## 📋 3. BẢNG TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA CHECKLIST)

- [x] **Có tối thiểu 5 bảng và 5.000 bản ghi**: Thực tế đạt **5 bảng** và **6.481 bản ghi** (Vượt cam kết).
- [x] **Các KPI tính được và có kiểm tra chéo (Cross-Validation)**:
  - Tỷ lệ nghỉ việc (Turnover Rate): Khớp chính xác 100% giữa `employees.status = 'Resigned'` (35 người) và `turnovers.csv` (35 hồ sơ).
  - Tỷ lệ chuyên cần (Attendance Rate) & Đi trễ: Đối soát logic thời gian quẹt thẻ và không có chấm công ma sau ngày nghỉ việc.
  - KPI Performance: Phân bổ xếp loại khớp công thức hoàn thành; đối soát tương quan sụt giảm điểm KPI trước khi nộp đơn.
  - Training ROI: Tỷ lệ hoàn thành đào tạo và chi phí đầu tư bình quân trên mỗi nhân viên.
- [x] **Ghi rõ giả định nghiệp vụ**: Tài liệu `business_assumptions_and_kpi_formulas.md` đặc tả chi tiết lịch làm việc, quy chế thử việc, bậc lương và ma trận đối soát.
- [x] **30 bài tập chia 3 cấp độ**: Chia đều 10 Cơ bản, 10 Trung cấp, 10 Nâng cao & BI kèm 100% truy vấn mẫu chuẩn ANSI SQL và thước đo DAX.
- [x] **10 business insights kỳ vọng**: Mở rộng tư duy phát hiện cơ hội cải thiện quy trình vận hành và giữ chân nhân tài, không khóa cứng cách giải.
- [x] **Không chứa PII thật**: 100% họ tên, email `@example.com` và số liệu đều được tổng hợp tự động.
- [x] **Báo cáo chính thức Word**: Tệp `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_07.docx` chuẩn 8 mục theo quy định.
