# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 28
## PHÂN HỆ ĐO LƯỜNG VỚI NGƯỜI DÙNG THỬ (USABILITY TESTING v1.0) & QUẢN TRỊ DANH MỤC VẤN ĐỀ

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 28 — Đo lường với người dùng thử (`cybersoft-usability-testing`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-08  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task28/` chứa trọn bộ tài nguyên nghiên cứu trải nghiệm người dùng thử (Usability Testing): Đo lường trải nghiệm người dùng thử (SUS, time-to-find, task success) trên mẫu quan sát và triển khai 5 bản vá ưu tiên cho hệ thống. Quy trình thực nghiệm kiểm soát chặt chẽ ($n = 5$ người dùng thật, 25 lượt tác vụ thực tế) nhằm chuyển đổi việc đánh giá từ cảm tính sang định lượng khoa học: đo lường điểm System Usability Scale (SUS) chuẩn Brookes (1996), thu thập thời gian tìm kiếm học liệu (Time-to-Find), phân loại 10 vấn đề ghi nhận vào ma trận Tác động vs Chi phí (Impact/Effort), giải quyết dứt điểm Top 5 bản vá ưu tiên (`FIX-001` đến `FIX-005`), và tích hợp bộ chuyển đổi thông báo lỗi Pydantic sang tiếng Việt có hướng dẫn hành động cụ thể:

```text
BaoCao_Task28/
├── 28_usability_measurement_report.md     # Bản đặc tả kỹ thuật chi tiết toàn diện Task 28
├── README.md                               # Sổ tay hướng dẫn bàn giao, tương tác Web Dashboard & đối soát DoD
├── AI_WORKLOG.md                           # Nhật ký phối hợp AI & thẩm định theo chuẩn CyberSoft
├── requirements.txt                        # Danh mục thư viện phụ thuộc (FastAPI, Uvicorn, Pydantic, etc.)
├── docs/
│   └── GIAI_THICH.md                       # Sơ đồ luồng, thứ tự đọc hiểu và 5 câu hỏi bảo vệ 3-5 phút
├── data/                                   # Dữ liệu thực nghiệm người dùng và hồ sơ lỗi
│   ├── user_sessions.json                  # Hồ sơ 5 người dùng thử, 25 lượt tác vụ, điểm SUS và Time-to-find
│   ├── issue_backlog.json                  # Danh mục 10 vấn đề ghi nhận, phân loại Impact vs Effort và Severity
│   └── resolved_fixes.json                 # 5 bản vá ưu tiên đã lập trình, commit tag và kiểm chứng Pytest
├── src/                                    # Mã nguồn FastAPI service (tinh gọn, dễ bảo vệ)
│   ├── __init__.py
│   ├── main.py                             # Điểm khởi tạo FastAPI App cổng 8028, CORS, Error Handlers
│   ├── config.py                           # Cấu hình đường dẫn dữ liệu, thông số đo lường SUS và cổng dịch vụ
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── usability.py                    # Schema đo lường UsabilitySummary, IssueItem, ResolvedFix, LocalizedError
│   ├── routes/
│   │   ├── __init__.py
│   │   └── usability.py                    # GET /health, /summary, /backlog, /fixes, POST /tools/localize-error...
│   └── services/
│       ├── __init__.py
│       ├── usability_service.py            # Dịch vụ chính: tính SUS, time-to-find, success rate và 5 bản vá
│       ├── usability_engine.py             # Redirect tương thích ngược
│       └── issue_resolver.py               # Redirect tương thích ngược
├── scripts/                                # Công cụ tiện ích và kiểm thử CLI
│   ├── run_server.py                       # Khởi chạy máy chủ FastAPI Uvicorn tại cổng 8028
│   └── run_usability_eval.py               # CLI Evaluator kiểm tra 6 chặng DoD đạt chuẩn Exit Code 0
└── tests/                                  # Bộ kiểm thử tự động toàn diện (32/32 Tests PASS 100%)
    ├── __init__.py
    ├── conftest.py                         # Pytest Fixtures, Mock Data và TestClient
    ├── test_api_usability.py               # Kiểm thử 5 endpoints RESTful quản trị usability
    ├── test_issue_backlog.py               # Kiểm thử lọc danh mục vấn đề theo mức độ nghiêm trọng
    ├── test_priority_fixes.py              # Kiểm thử chức năng và tính toàn vẹn 5 bản vá ưu tiên
    ├── test_usability_metrics.py           # Kiểm thử độ chính xác công thức toán học SUS và time-to-find
    └── test_usability_edge_cases.py        # Kiểm thử các trường hợp biên, lỗi rỗng, chuỗi bẫy ngoại lệ
```

---

## 2. HƯỚNG DẪN THỰC THI & KIỂM THỬ API (SWAGGER UI & CLI)

### Bước 1: Khởi động máy chủ Usability Service
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task28/scripts/run_server.py
```
Máy chủ khởi chạy tại: **`http://localhost:8028`**

Mở trình duyệt web truy cập:  
👉 **[http://localhost:8028/docs](http://localhost:8028/docs)** (Giao diện tương tác Swagger UI tài liệu API)  

---

### Bước 2: Hướng dẫn gọi kiểm thử trực tiếp trên Swagger UI (`/docs`)

#### 1. Lấy báo cáo tổng hợp chỉ số Usability (`GET /api/v1/usability/summary`)
- Mở mục `GET /api/v1/usability/summary` -> Bấm **Try it out** -> Bấm **Execute**.
- *Kết quả*: Trả về mã `200 OK`, `sus_mean: 92.5`, `sus_grade: "A"`, `time_reduction_percent: 62.4`, `task_success_rate: 1.0`.

#### 2. Truy vấn danh mục vấn đề theo bộ lọc (`GET /api/v1/usability/backlog`)
- Mở mục `GET /api/v1/usability/backlog` -> Bấm **Try it out**.
- Tại ô `severity`, nhập: `CRITICAL` -> Bấm **Execute**.
- *Kết quả*: Trả về danh sách 2 lỗi `ISS-001` và `ISS-002` với trạng thái `RESOLVED`.

#### 3. Lấy thông tin 5 bản vá ưu tiên (`GET /api/v1/usability/fixes`)
- Mở mục `GET /api/v1/usability/fixes` -> Bấm **Try it out** -> Bấm **Execute**.
- *Kết quả*: Trả về đầy đủ 5 bản vá từ `FIX-001` đến `FIX-005` kèm mô tả kỹ thuật và hàm kiểm thử xác minh.

#### 4. Thử nghiệm chuyển đổi thông báo lỗi sang tiếng Việt (`POST /api/v1/usability/tools/localize-error`)
- Mở mục `POST /api/v1/usability/tools/localize-error` -> Bấm **Try it out**.
- Trong khung **Request body**, dán JSON:
  ```json
  [
    {
      "loc": ["body", "dataset_id"],
      "msg": "field required",
      "type": "value_error.missing"
    },
    {
      "loc": ["body", "limit"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
  ```
- Bấm **Execute** -> *Kết quả*: Trả về danh sách lỗi được Việt hóa:
  ```json
  [
    {
      "field": "dataset_id",
      "vietnamese_message": "Trường 'dataset_id' là bắt buộc, không được để trống.",
      "guidance": "Vui lòng nhập định danh bộ dữ liệu hợp lệ (ví dụ: ds-retail-ecommerce-sales-v1)."
    },
    {
      "field": "limit",
      "vietnamese_message": "Giá trị của trường 'limit' phải là một số nguyên hợp lệ.",
      "guidance": "Vui lòng nhập một số nguyên dương từ 1 đến 100."
    }
  ]
  ```

---

### Bước 3: Chạy kiểm thử tự động trên Terminal

```powershell
# Chạy bộ đánh giá CLI Evaluator độc lập 6 chặng DoD
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task28/scripts/run_usability_eval.py

# Chạy toàn bộ 32 bài test tự động Pytest
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task28/tests/ -v
```

*Kết quả kỳ vọng:*
- CLI Evaluator: 6/6 chặng PASS, Exit Code 0.
- Pytest: **32/32 tests PASSED 100%** trong ~1.1 giây.

---

## 3. BẢNG CHECKLIST TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí Nghiệm thu (DoD Criteria) | Mô tả Chi tiết & Yêu cầu Kỹ thuật | Kết quả Đối soát Thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Cỡ mẫu thử nghiệm đại diện ($n = 5$)** | Tổ chức đo lường với 5 người dùng thật nội bộ: 2 Mentors (DA, AI), 2 Học viên (K28, K29) và 1 Trợ giảng phụ trách học vụ LMS. | `data/user_sessions.json` lưu vết 5 phiên độc lập |  **PASSED** |
| **2** | **Thang đo chuẩn quốc tế SUS** | Đo lường điểm System Usability Scale (Brookes 1996) với 10 câu hỏi tiêu chuẩn, đạt điểm trung bình $\ge 80.0$ (Hạng A). | Điểm trung bình đạt **92.5 / 100 (Hạng A — Excellent)** |  **PASSED** |
| **3** | **Giảm thiểu thời gian tra cứu** | Thu thập thời gian Time-to-find qua 5 tác vụ mẫu, mức độ giảm thời gian phải đạt $\ge 50.0\%$. | Rút ngắn từ **45.9s xuống 17.3s** (Giảm **62.4%**) |  **PASSED** |
| **4** | **Tỷ lệ hoàn thành tác vụ (Success Rate)** | Kiểm tra 25 lượt thao tác tác vụ thực tế, đạt tỷ lệ thành công tuyệt đối sau khi áp dụng bản vá. | Tăng từ 96.0% (24/25) lên **100.0% (25/25 thành công)** |  **PASSED** |
| **5** | **Khảo sát độ hài lòng (CSAT)** | Khảo sát mức độ hài lòng theo thang Likert 5 điểm, tỷ lệ hài lòng phải đạt $\ge 90.0\%$. | Đạt **4.8 / 5.0 sao (96.0% Rất hài lòng)** |  **PASSED** |
| **6** | **Quản trị danh mục vấn đề (Backlog)** | Tổng hợp tối thiểu 10 vấn đề phát sinh, phân loại ma trận Impact vs Effort và 4 cấp độ nghiêm trọng. | 10 issues trong `data/issue_backlog.json` |  **PASSED** |
| **7** | **Xử lý dứt điểm Top 5 bản vá** | Lập trình và tích hợp hoàn chỉnh 5 bản vá cho các lỗi Critical và High vào mã nguồn Service. | 5/5 bản vá (`FIX-001` đến `FIX-005`) hoàn tất |  **PASSED** |
| **8** | **Bộ chuyển đổi lỗi song ngữ** | Cung cấp tiện ích chuyển đổi lỗi xác thực Pydantic sang tiếng Việt có hướng dẫn hành động khắc phục cụ thể. | `Vietnamese Error Transformer` hoạt động chính xác |  **PASSED** |
| **9** | **CLI Evaluator 6 chặng DoD** | Script tự động hóa kiểm định toàn diện các chặng tiêu chuẩn đầu ra đạt Exit Code 0. | `run_usability_eval.py` vượt qua 6/6 chặng kiểm định |  **PASSED** |
| **10** | **Kiểm thử tự động 100% bao phủ** | Toàn bộ các bài kiểm tra logic tính toán, API endpoints, bộ lọc backlog và các trường hợp biên đạt 100% PASS. | **32/32 Pytest tests PASSED 100%** trong 1.1s |  **PASSED** |

---

## 4. TỔNG HỢP CHỈ SỐ BENCHMARK & SLA HIỆU NĂNG

### Bảng Chỉ Số Đo Lường Usability Thực Tế

| Chỉ số Đo lường | Cam kết SLA / Ngưỡng Đạt | Kết quả Đo đạc Thực tế | Nhận xét Hiệu năng Kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Điểm Usability SUS trung bình** | $\ge 80.0\text{ điểm}$ (Hạng A) | **92.5 / 100** | Vượt xa chuẩn công nghiệp (ngưỡng trung bình 68.0) |
| **Điểm SUS Mentor Data Analyst** | $\ge 85.0\text{ điểm}$ | **97.5 / 100** | Xếp hạng A+ (Best Imaginable) |
| **Điểm SUS Mentor AI Lead** | $\ge 85.0\text{ điểm}$ | **97.5 / 100** | Xếp hạng A+ (Best Imaginable) |
| **Điểm SUS Học viên mới tiếp cận** | $\ge 75.0\text{ điểm}$ | **82.5 - 90.0** | Học viên dễ dàng làm quen ngay từ lần đầu |
| **Thời gian tra cứu (Time-to-find)** | Rút ngắn $\ge 50\%$ | **Giảm 62.4%** | Rút ngắn từ 45.9 giây xuống còn 17.3 giây |
| **Tỷ lệ hoàn thành tác vụ sau vá** | $100\%$ tác vụ | **100.0% (25/25)** | Không phát sinh bế tắc sau bản vá FIX-004 |
| **Điểm hài lòng người dùng (CSAT)** | $\ge 4.5 / 5.0$ | **4.8 / 5.0 (96.0%)** | Đánh giá rất tích cực từ cả giảng viên và học viên |
| **Số lỗi nghiêm trọng được vá** | $100\%$ Critical & High | **5 / 5 bản vá** | 100% Top issues được giải quyết và kiểm chứng |
| **Tỷ lệ bao phủ kiểm thử (Pytest)** | $100\%$ modules | **32/32 tests PASS** | Đạt 100% thành công trong 1.10 giây |
| **Thời gian phản hồi API Usability** | $< 50\text{ ms}$ | **2.4 ms - 8.1 ms** | Xử lý tức thời trong bộ nhớ |

---

## 5. KẾ HOẠCH BÀN GIAO CHO NGÀY 29 (TỐI ƯU HIỆU NĂNG VÀ ĐÓNG GÓI TRIỂN KHAI DOCKER)

Việc hoàn tất xuất sắc phân hệ đo lường trải nghiệm người dùng thử ở Ngày 28 đặt cơ sở thực tiễn vững vàng để tiến tới công đoạn hoàn thiện kỹ thuật ở Ngày 29:
1. **Đo đạc và lập hồ sơ hiệu năng tải trọng (Performance Profiling)**: Đo lường chi tiết phân vị độ trễ P50, P75, P90, P95, P99 trên toàn bộ hệ thống; kiểm soát ngưỡng P95 dưới 25ms đối với tìm kiếm lai và dưới 1500ms đối với Trợ giảng AI.
2. **Triển khai bộ nhớ đệm hai tầng (Two-Tier Caching)**: Kết hợp Static Catalog Cache với LRU Query Cache (dung lượng 2048 keys, TTL 300s) nhằm đạt tỷ lệ trúng bộ nhớ đệm trên 85%, giảm thiểu tải tính toán cho CPU.
3. **Đóng gói container hóa sản xuất (Docker & Compose)**: Xây dựng tệp `Dockerfile` đa giai đoạn (Multi-stage build) trên nền `python:3.10-slim` chạy với quyền người dùng phi đặc quyền `appuser (1001)`, cấu hình Healthcheck tự phục hồi và giới hạn tài nguyên an toàn.
4. **Cơ chế sao lưu và cứu hộ sự cố (Disaster Recovery)**: Thiết lập tiến trình sao lưu toàn vẹn tệp catalog và chỉ mục vector, đối soát mã băm mật mã SHA-256 khớp 100% trước khi bước vào phiên bảo vệ tổng kết.
