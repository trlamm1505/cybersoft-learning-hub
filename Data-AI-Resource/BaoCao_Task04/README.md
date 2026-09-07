# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 04

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 04 — Thiết kế schema Dataset Registry & Data Governance  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐIỀU KIỆN NGHIỆM THU (DOD)**  

---

## 📂 1. CẤU TRÚC THƯ MỤC BÀN GIAO (DELIVERABLES)

```text
Data-AI-Resource/
└── BaoCao_Task04/
    ├── README.md                            # Tổng quan nghiệm thu & hướng dẫn chạy kiểm thử
    ├── 04_dataset_registry_schema.md        # Bản đặc tả kỹ thuật chi tiết Schema & Data Governance
    ├── AI_WORKLOG.md                        # Nhật ký phối hợp AI, phát hiện lỗi & làm chủ kỹ thuật
    ├── schemas/                             # Khai báo schema chuẩn hóa Dual-Stack
    │   ├── dataset.schema.json              # JSON Schema chuẩn IETF Draft 2020-12
    │   └── models.py                        # Pydantic v2 Models với cross-field validators
    ├── metadata_samples/                    # 5 bộ metadata mẫu chuẩn nghiệp vụ đào tạo
    │   ├── 01_da_ecommerce_sales.json       # [DA] Bán hàng đa bảng (Star Schema: Customers, Products, Fact Orders)
    │   ├── 02_da_hr_operations.json        # [DA] Quản trị nhân sự & chấm công (Employees, Attendance Logs)
    │   ├── 03_da_customer_churn.json       # [DA/AIE] Dự báo khách hàng rời bỏ (Digital Banking Telemetry)
    │   ├── 04_aie_rag_qa_knowledge.json    # [AIE] Kho tri thức RAG Tutor (Documents, Embeddings 1536, Ground Truth)
    │   └── 05_aie_toxicity_detection.json  # [AIE] Phân loại kiểm duyệt bình luận tiếng Việt (Toxic Speech)
    ├── test_cases/                          # 4 test cases âm bản kiểm chứng bắt lỗi vi phạm
    │   ├── invalid_missing_license.json     # Bắt lỗi: thiếu trường giấy phép bản quyền
    │   ├── invalid_missing_pii.json         # Bắt lỗi: thiếu khối quản trị dữ liệu nhạy cảm PII
    │   ├── invalid_wrong_type.json          # Bắt lỗi: sai kiểu dữ liệu & số dòng âm
    │   └── invalid_bad_version.json         # Bắt lỗi: chuỗi version vi phạm định dạng SemVer 2.0
    └── scripts/                             # Công cụ kiểm thử tự động
        ├── validate_metadata.py             # CLI Validator kiểm tra JSON Schema & Pydantic
        └── validate_day04.py                # Harness tự động nghiệm thu độc lập tiêu chí DoD
```

---

## 📋 2. BẢNG ĐỐI SOÁT ĐIỀU KIỆN NGHIỆM THU (DOD CHECKLIST)

| STT | Tiêu chí nghiệm thu (DoD Ngày 04) | Bằng chứng kỹ thuật | Trạng thái |
| :---: | :--- | :--- | :--- |
| 1 | Cấu trúc thư mục chuẩn hóa | Đầy đủ `schemas/`, `metadata_samples/`, `test_cases/`, `scripts/` |  **ĐẠT** |
| 2 | Định nghĩa Schema đầy đủ các trường bắt buộc | `domain`, `level`, `learning_outcomes`, `columns`, `pii`, `license`, `difficulty`, `version` |  **ĐẠT** |
| 3 | Triển khai kép: JSON Schema & Pydantic v2 | `dataset.schema.json` và `schemas/models.py` (Pydantic v2) |  **ĐẠT** |
| 4 | Bắt lỗi thiếu trường và sai kiểu dữ liệu | 4/4 negative test cases trong `test_cases/` bị phát hiện và từ chối |  **ĐẠT** |
| 5 | Có Data Dictionary và Data Lineage | Khai báo chi tiết trong 5 bộ metadata mẫu (`columns` và `lineage`) |  **ĐẠT** |
| 6 | License và PII là trường bắt buộc | Model validator chặn License rỗng/none và kiểm tra tính nhất quán PII |  **ĐẠT** |
| 7 | Tối thiểu 5 metadata mẫu cho DA và AIE | 3 bộ cho Data Analyst (Sales, HR, Churn) + 2 bộ cho AI Engineer (RAG, NLP) |  **ĐẠT** |
| 8 | Mã băm toàn vẹn SHA-256 cho mỗi dataset | Trường `integrity.checksum` dạng Hex 64 ký tự và `file_size_bytes` |  **ĐẠT** |
| 9 | Tài liệu đặc tả và AI Work Log | `04_dataset_registry_schema.md`, `AI_WORKLOG.md` |  **ĐẠT** |
| 10 | Báo cáo Word tổng hợp Ngày 04 | File `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_04.docx` |  **ĐẠT** |

---

## ⚡ 3. HƯỚNG DẪN CHẠY KIỂM THỬ NGHIỆM THU ĐỘC LẬP

### 3.1. Kiểm thử Schema và Metadata Samples
Chạy validator mặc định để quét toàn bộ 5 mẫu chuẩn và 4 mẫu lỗi âm bản:

```powershell
python Data-AI-Resource/BaoCao_Task04/scripts/validate_metadata.py
```

### 3.2. Kiểm thử Toàn diện Bộ Tiêu chí DoD (Harness Execution)
Chạy script nghiệm thu độc lập kiểm tra 100% điều kiện hoàn thành Ngày 04:

```powershell
python Data-AI-Resource/BaoCao_Task04/scripts/validate_day04.py
```

---

## 📊 4. SỐ LIỆU ĐỊNH LƯỢNG (METRICS)
- **Số lượng Module Schema**: 1 Pydantic Model (`models.py`) + 1 IETF JSON Schema (`dataset.schema.json`).
- **Số lượng Metadata Samples**: 5 bộ dữ liệu hoàn chỉnh (100% Validated).
- **Số lượng Negative Test Cases**: 4 bộ dữ liệu lỗi (100% Caught & Rejected).
- **Tỷ lệ kiểm thử tự động DoD**: **10/10 Checks Passed (100%)**.
- **Thời gian thực thi Harness**: < 0.35 giây.
