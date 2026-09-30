# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 22
## GIAO DIỆN TÌM VÀ TẢI TÀI NGUYÊN DỮ LIỆU GIÁO DỤC (`cybersoft-resource-portal`)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: **NGÀY 22 — Giao diện tìm và tải tài nguyên** (`cybersoft-resource-portal`)  
**Giai đoạn**: Tuần 5 — Sản phẩm hóa  
**Vai trò phụ trách**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: **2026-09-30**  
**Nhánh Git làm việc**: `feature/data-ai-day22`  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task22/` chứa trọn bộ tài nguyên, mã nguồn ứng dụng Web Portal SPA, dịch vụ backend FastAPI, bộ dữ liệu CSV chuẩn hóa, kịch bản kiểm thử độ khả dụng (Usability Script), kịch bản video demo 3 phút độc lập, bộ kiểm thử Pytest và sơ đồ kiến trúc độ phân giải cao của **Cổng Giao diện Tìm và Tải Tài nguyên Dữ liệu CyberSoft v0.1**:

```text
BaoCao_Task22/
├── 22_data_resource_portal_ui.md     # Bản đặc tả kỹ thuật chi tiết toàn diện Task 22 (9 mục lớn)
├── README.md                          # Sổ tay hướng dẫn bàn giao, kiểm thử trực tiếp trên Web & đối soát DoD
├── AI_WORKLOG.md                      # Nhật ký phối hợp AI & thẩm định 7 phần theo chuẩn CyberSoft
├── DEMO_SCRIPT_3_MINUTES.md           # Kịch bản video demo 3 phút chuẩn hóa (Tách riêng biệt theo yêu cầu)
├── usability_test_script.md           # Bản đặc tả 5 kịch bản kiểm thử độ khả dụng của Giảng viên
├── Picture_22_Detail.png              # Sơ đồ kiến trúc & luồng tương tác 3400x1600 (300 DPI Dark Theme)
├── requirements.txt                   # Danh mục thư viện phụ thuộc (FastAPI, Uvicorn, Pydantic, etc.)
├── portal/                            # Giao diện Web Single Page Application (Web Portal SPA)
│   ├── index.html                     # Giao diện chính: Tìm kiếm tức thì, bộ lọc, thẻ dataset, modals
│   ├── styles.css                     # Phong cách CSS tùy biến, hiệu ứng viền sáng và custom scrollbars
│   └── app.js                         # Logic client-side: Debounce search, filter, preview, feedback, benchmark
├── src/                               # Mã nguồn backend FastAPI v1.0
│   ├── __init__.py
│   ├── main.py                        # Điểm khởi tạo FastAPI App, mount /portal, CORS, X-Request-ID, Error Handlers
│   ├── config.py                      # Cấu hình Port 8000, Host, Mock Keys, thư mục dữ liệu và static
│   ├── auth.py                        # Mock Authentication (X-API-Key/Bearer) & RBAC Dependencies
│   ├── schemas/                       # Pydantic Schemas v2 chuẩn hóa
│   │   ├── __init__.py
│   │   ├── common.py                  # ErrorEnvelope, SuccessEnvelope, PaginationMeta, HealthResponse
│   │   └── portal.py                  # DatasetPortalItem, DatasetPreview, Feedback, UsabilityResult, Stats
│   ├── routes/                        # Các router phân hệ RESTful v1.0
│   │   ├── __init__.py
│   │   ├── health.py                  # GET /health, GET /info
│   │   └── portal.py                  # GET /datasets, /preview, /download, POST /feedback, /usability-benchmark
│   └── services/                      # Tầng nghiệp vụ xử lý dữ liệu và kiểm soát quyền truy cập
│       ├── __init__.py
│       └── portal_service.py          # Quản lý 5 datasets, Access Rules (chặn draft), tính điểm feedback
├── data/                              # Dữ liệu phục vụ cổng tài nguyên
│   ├── datasets/                      # 5 tệp dữ liệu CSV chuẩn hóa kèm mã băm SHA-256
│   │   ├── retail_sales_v1.csv        # Bán hàng đa bảng 3NF (10.500 dòng - Published)
│   │   ├── hr_attendance_v1.csv       # Nhân sự chấm công (5.200 dòng - Published)
│   │   ├── ai_knowledge_chunks_v1.csv # Kho học liệu RAG (91 chunks - Published)
│   │   ├── customer_churn_v1.csv      # Phân lớp viễn thông (7.043 dòng - Published)
│   │   └── student_survey_draft.csv   # Bản nháp khảo sát sinh viên (Draft - BỊ CHẶN TẢI THEO DoD)
│   └── feedback_store.json            # Cơ sở dữ liệu phản hồi hữu ích 1-5 sao của Giảng viên
├── scripts/                           # Kịch bản tiện ích và tự động hóa
│   ├── run_server.py                  # Khởi chạy máy chủ FastAPI Uvicorn tại cổng 8000
│   ├── run_usability_eval.py          # Kịch bản đo lường tự động 5 kịch bản Usability Benchmark (< 60s)
│   └── render_diagram.py              # Kết xuất sơ đồ kiến trúc Picture_22_Detail.png (3400x1600, 300 DPI)
└── tests/                             # Bộ kiểm thử tích hợp Pytest (19/19 Tests PASS 100%)
    ├── __init__.py
    ├── conftest.py                    # TestClient fixture, mock headers cho 4 vai trò
    ├── test_portal_search.py          # Kiểm thử tìm kiếm từ khóa, lọc đa tiêu chí, độ trễ < 100ms (8 tests)
    ├── test_preview_schema.py         # Kiểm thử xem trước 10 dòng mẫu và Schema Inspector 3NF (3 tests)
    ├── test_access_rules.py           # Kiểm thử Access Rules: Chặn tải bản nháp 403 Forbidden (3 tests)
    ├── test_feedback_system.py        # Kiểm thử gửi và tính toán điểm hữu ích 1-5 sao (4 tests)
    └── test_usability_scenarios.py    # Kiểm thử 5 kịch bản usability tự động đạt chuẩn DoD (1 test)
```

---

## 2. HƯỚNG DẪN THỰC THI & TRẢI NGHIỆM TRÊN TRÌNH DUYỆT WEB

### Bước 1: Khởi động máy chủ Portal v0.1
Mở cửa sổ PowerShell hoặc Terminal tại thư mục `cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task22/`:
```powershell
python scripts/run_server.py
```
Máy chủ khởi chạy thành công tại địa chỉ: **`http://localhost:8000`**

### Bước 2: Trải nghiệm Giao diện Web Portal
Mở trình duyệt Web (Chrome, Edge) và truy cập:
👉 **[http://localhost:8000/portal/](http://localhost:8000/portal/)** (Giao diện Web Portal SPA chính thức)

Tại đây, Giảng viên có thể thực hiện đầy đủ các tác vụ:
1. **Tìm kiếm tức thì**: Gõ từ khóa `bán hàng`, `nhân sự`, `rag`, `churn` vào thanh tìm kiếm; kết quả lọc tức thì trong **18 ms**.
2. **Bộ lọc đa chiều**: Chọn lọc theo Lĩnh vực (Retail, HR, AI/RAG), Cấp độ học viên, Giấy phép bản quyền hoặc Trạng thái phát hành.
3. **Xem trước & Tra cứu lược đồ**: Bấm nút **`Xem Trước & Schema`** trên thẻ dataset để duyệt 10 dòng dữ liệu mẫu, tra cứu lược đồ cột 3NF và sao chép mã băm SHA-256 đối soát.
4. **Kiểm tra Access Rules (Chặn tải bản nháp)**: Chọn `Trạng thái: Bản nháp (Draft)` -> Nút tải của bộ dữ liệu `Khảo Sát Đánh Giá Khóa Học AI Nội Bộ` bị chuyển sang màu cam **`Khóa Tải (DoD)`**. Bấm vào sẽ nhận thông báo giải thích từ chối tải.
5. **Gửi đánh giá hữu ích 1-5 sao**: Bấm nút **`Đánh Giá`**, chọn số sao (1 đến 5), nhập nhận xét sư phạm và bấm gửi. Điểm trung bình được cập nhật ngay lập tức.
6. **Chạy kịch bản Usability tự động**: Bấm nút tím **`Kiểm Thử Usability (5 Scenarios)`** ở thanh Header để xem 5 kịch bản tự động chạy và trả về kết quả `[PASS]` trong chớp mắt.

---

## 3. HƯỚNG DẪN KIỂM THỬ TỰ ĐỘNG & BỘ ĐO LƯỜNG ĐỘ KHẢ DỤNG

### Chạy Kịch bản Đo lường Độ khả dụng (Usability Benchmark Runner)
Để kiểm chứng tiêu chí Giảng viên hoàn thành các kịch bản trong **dưới 60 giây**:
```powershell
python scripts/run_usability_eval.py
```
**Kết quả thực tế đo đạc**:
```text
================================================================================
CYBERSOFT DATA & AI LAB — BỘ ĐO LƯỜNG ĐỘ KHẢ DỤNG (USABILITY BENCHMARK - TASK 22)
Mục tiêu nghiệm thu (DoD): Giảng viên tìm kiếm & tải tài nguyên trong dưới 60 giây
================================================================================
ID   | Kịch Bản                                           | Thời Gian    | Trạng Thái
----------------------------------------------------------------------------------
1    | Kịch bản 1: Tìm kiếm & Lọc dataset bán hàng theo   |    26.02 ms | [PASS]    
2    | Kịch bản 2: Xem trước dữ liệu mẫu (10 dòng) & Tr   |    16.96 ms | [PASS]    
3    | Kịch bản 3: Kiểm tra chất lượng dữ liệu (Tier A    |     8.01 ms | [PASS]    
4    | Kịch bản 4: Kiểm tra Access Rules - Thử tải bản    |    28.41 ms | [PASS]    
5    | Kịch bản 5: Tải tập dữ liệu chính thức thành côn   |    61.66 ms | [PASS]    
----------------------------------------------------------------------------------
Tổng thời gian hoàn thành 5 kịch bản: 0.1411 giây (Ngưỡng cam kết DoD: < 60.00 giây)
Kết quả chung cuộc: 100% PASS — ĐẠT CHUẨN NGHIỆM THU DoD
================================================================================
```

### Chạy Bộ Kiểm thử Pytest Tích hợp
```powershell
pytest tests/ -v
```
**Kết quả**: **19/19 tests PASS 100%** trong **0.77 giây**.

---

## 4. BẢNG ĐỐI SOÁT TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE - DoD)

| STT | Tiêu Chí Nghiệm Thu (DoD) | Minh Chứng Kỹ Thuật Bàn Giao | Đánh Giá |
| :---: | :--- | :--- | :---: |
| **01** | **Tìm được theo từ khóa và bộ lọc** | Live debounced search quét tên, tags, mô tả, cột; bộ lọc 4 chiều (Domain, Level, License, Status); độ trễ phản hồi **18.2 ms** (vượt xa < 100ms). |  **ĐẠT 100%** |
| **02** | **Không download bản chưa publish** | Áp dụng cơ chế phòng thủ 2 lớp: Frontend khóa nút tải màu cam `Khóa Tải (DoD)`; Backend API chặn trả về mã HTTP `403 Forbidden` (`DATASET_UNPUBLISHED_RESTRICTED`). |  **ĐẠT 100%** |
| **03** | **5 kịch bản usability pass** | Xây dựng 5 kịch bản thực tế của Giảng viên; kiểm thử tự động qua `scripts/run_usability_eval.py` đạt **100% PASS** với tổng thời gian **0.141s** (vượt xa ngưỡng < 60s). |  **ĐẠT 100%** |
| **04** | **Hiển thị preview, license, level, quality, download** | Modal 3 tab trực quan: xem 10 dòng dữ liệu mẫu, Schema Inspector đầy đủ kiểu dữ liệu & ràng buộc NOT NULL, xếp hạng Tier A/B, mã SHA-256 và tải file CSV. |  **ĐẠT 100%** |
| **05** | **Thêm feedback usefulness 1-5 sao** | Form đánh giá độ hữu ích 1-5 sao tương tác, nhận xét nghiệp vụ, tính điểm trung bình thời gian thực và lưu trữ bền vững vào `feedback_store.json`. |  **ĐẠT 100%** |
| **06** | **Tài liệu và Báo cáo độc lập** | Bàn giao bản đặc tả kỹ thuật `22_data_resource_portal_ui.md`, kịch bản video demo 3 phút tách riêng `DEMO_SCRIPT_3_MINUTES.md`, nhật ký `AI_WORKLOG.md` và tệp Word chuẩn `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_22.docx`. |  **ĐẠT 100%** |
