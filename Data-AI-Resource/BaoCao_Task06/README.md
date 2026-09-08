# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 06

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 06 — Dataset bán hàng đa bảng (`sales_v1`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO DOD CYBERSOFT**  

---

## 📂 1. CẤU TRÚC THƯ MỤC BÀN GIAO (DELIVERABLES)

```text
Data-AI-Resource/
└── BaoCao_Task06/
    ├── README.md                            # Hướng dẫn tổng quan & chỉ mục nghiệm thu Ngày 06
    ├── 06_sales_multitable_dataset.md       # Bản đặc tả kỹ thuật kiến trúc mô hình Star Schema
    ├── Picture_06-Detail.png                # Sơ đồ quan hệ thực thể ERD bán hàng đa bảng
    ├── AI_WORKLOG.md                        # Nhật ký sử dụng AI minh bạch, thẩm định lỗi & làm chủ kỹ thuật
    ├── data_dictionary/                     # Từ điển dữ liệu chi tiết
    │   ├── data_dictionary.md               # Bản từ điển dữ liệu định dạng Markdown
    │   └── data_dictionary.json             # Bản từ điển dữ liệu máy đọc (JSON Schema)
    ├── data/
    │   ├── clean/                           # 5 bảng dữ liệu sạch 100% (sales_v1_clean)
    │   │   ├── customers.csv                # 200 khách hàng
    │   │   ├── products.csv                 # 50 sản phẩm
    │   │   ├── employees.csv                # 20 nhân viên kinh doanh
    │   │   ├── orders.csv                   # 1.000 đơn hàng
    │   │   └── order_details.csv            # 1.803 dòng chi tiết
    │   └── dirty/                           # 5 bảng dữ liệu cài cắm 10 loại lỗi (sales_v1_dirty)
    │       ├── customers.csv
    │       ├── products.csv
    │       ├── employees.csv
    │       ├── orders.csv
    │       └── order_details.csv
    ├── docs/
    │   ├── 20_analytical_questions.md       # 20 bài tập phân tích kinh doanh kèm truy vấn SQL mẫu
    │   ├── dirty_data_ground_truth.md       # Bảng đáp án đối chứng 10 loại lỗi (Markdown)
    │   └── dirty_data_ground_truth.json     # Bảng đáp án đối chứng (JSON)
    ├── scripts/
    │   ├── __init__.py
    │   ├── generate_sales_dataset.py        # Script sinh dữ liệu tự động, xác định (seed=42)
    │   └── validate_sales_data.py           # CLI kiểm định tính toàn vẹn 10 tiêu chí
    └── tests/
        ├── __init__.py
        └── test_sales_integrity.py          # Pytest suite tự động kiểm tra 6 tiêu chí nghiệm thu
```

---

## 🚀 2. HƯỚNG DẪN THỰC THI (QUICK START)

### 2.1. Tái sinh bộ dữ liệu (Deterministic Data Generation)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/scripts/generate_sales_dataset.py
```

### 2.2. Kiểm định tính toàn vẹn dữ liệu
* **Kiểm tra bộ dữ liệu sạch (Kết quả: PASS 100%, Exit Code 0)**:
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/scripts/validate_sales_data.py -d cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/data/clean
```

* **Kiểm tra bộ dữ liệu bẩn (Kết quả: Bắt 28 vi phạm thuộc 10 nhóm lỗi, Exit Code 1)**:
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/scripts/validate_sales_data.py -d cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/data/dirty
```

### 2.3. Chạy toàn bộ Test Suite với Pytest
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task06/tests/ -v
```

---

## 📋 3. BẢNG TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA CHECKLIST)

- [x] **Quan hệ khóa hợp lệ ở bản clean**: 100% quan hệ PK-FK giữa 5 bảng toàn vẹn, không có khóa ngoại mồ côi (Orphan Record).
- [x] **Bản dirty có danh mục lỗi và đáp án**: Cài cắm đủ 10 loại lỗi thực tế và lưu trữ đầy đủ trong `dirty_data_ground_truth.md` & `.json`.
- [x] **Không chứa PII thật**: Toàn bộ họ tên, SĐT và email được tổng hợp tự động, email dùng đuôi ảo `@example.com`.
- [x] **Data Dictionary chi tiết**: Tài liệu hóa 5 bảng, kiểu dữ liệu, ràng buộc và ý nghĩa nghiệp vụ.
- [x] **20 câu hỏi phân tích kinh doanh**: Chia 3 cấp độ (Cơ bản - Trung cấp - Nâng cao) kèm câu truy vấn SQL mẫu chuẩn.
- [x] **Báo cáo chính thức Word**: Tệp `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_06.docx` đầy đủ 8 mục theo chuẩn đào tạo thực tập sinh CyberSoft.
