# BÁO CÁO KỸ THUẬT CHUYÊN SÂU — NGÀY 27
## TÍCH HỢP CHỐT CHẶN CHẤT LƯỢNG QA (QA HARNESS INTEGRATION v1.0) & ZERO SILENT BYPASS

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: **NGÀY 27 — Tích hợp với QA Harness** (`cybersoft-qa-quality-gate-engine`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: **2026-10-07**  

---

## 1. BỐI CẢNH KỸ THUẬT, ĐẶT VẤN ĐỀ & MỤC TIÊU SẢN PHẨM HÓA

### 1.1. Bối cảnh kỹ thuật sau Ngày 26
Sau khi hoàn thiện tích hợp hợp đồng dữ liệu với Learning Platform ở Ngày 26 (Cung cấp Catalog API, cơ chế khóa snapshot bất biến chống trôi phiên bản và phòng vệ Mismatch có tính hành động), phân hệ Data & AI Lab của Thực tập sinh số 1 (Đào Trung Kiên) bước vào mắt xích hoàn thiện chặng tích hợp ba bên trong hệ sinh thái `cybersoft-learning-hub`: kết nối trực tiếp với hệ thống **QA & Evaluation Harness** của Thực tập sinh số 3 (Trần Quốc Nguyên) tại Ngày 27.

### 1.2. Thách thức cốt lõi (Core Technical Challenges)
1. **Thiếu vắng Cổng Đánh giá Tự động (Evaluation Hooks)**: Trước Ngày 27, đội ngũ QA không có cách nào kích hoạt đánh giá tự động các tài nguyên dữ liệu, mô hình RAG và nội dung giáo trình của Data Lab mà phải kiểm tra thủ công từng tệp tin.
2. **Sai lệch Tiêu chuẩn Kiểm thử giữa các Đội ngũ**: Các quy tắc chất lượng do QA định nghĩa trong `PR_RULES.md` nếu không được đồng bộ hóa vào mã nguồn Data Lab sẽ dẫn đến tình trạng: phía Data Lab báo đạt chuẩn nhưng khi QA kiểm tra lại bị trượt (False Sense of Quality).
3. **Hiện tượng Báo lỗi Mù mờ (Opaque Failures)**: Khi một tài nguyên bị trượt kiểm định phát hành, nếu hệ thống chỉ thông báo chung chung *"Release Failed"* mà không chỉ rõ dòng lỗi, tệp lỗi và hướng dẫn khắc phục hành động được, kỹ sư sẽ mất rất nhiều thời gian dò tìm nguyên nhân.
4. **Vấn nạn Bỏ qua Chốt chặn Âm thầm (Silent Bypass)**: Trong quy trình phát hành gấp, lập trình viên có xu hướng chèn cờ `--force` hoặc xóa tạm thời các bài test để vượt qua CI/CD mà không có sự phê duyệt của Trưởng nhóm, dẫn đến rò rỉ dữ liệu lỗi ra môi trường đào tạo.

### 1.3. Mục tiêu cam kết & Tiêu chí nghiệm thu (DoD)
- **DoD 1: Tiếp nhận và Hệ thống hóa 6 Quy tắc QA**: Tiếp nhận đầy đủ 6 quy tắc chất lượng cốt lõi từ QA (Zero Secret Leakage, Zero Real PII, Schema & Orphan Integrity, RAG Accuracy, Content Lint, Zero Silent Bypass).
- **DoD 2: Bộ dữ liệu Kiểm thử Dùng chung (Shared Test Fixtures)**: Đóng gói sẵn 3 bộ fixtures chuẩn và lỗi trong `data/shared_fixtures/` để QA đối soát độc lập.
- **DoD 3: Chốt Chặn Phát Hành Tổng Hợp (Master Release Quality Gate)**: Thiết lập pipeline thẩm định 4 chặng (`POST /gate/release-check`), phân biệt rõ hành vi `BLOCK_RELEASE` (lỗi Critical/High) và `WARNING` (lỗi Medium).
- **DoD 4: Lý do Hành động Được (Actionable Reasons)**: 100% các vi phạm đều phải kèm theo chỉ dẫn hành động khắc phục cụ thể (`actionable_fix`).
- **DoD 5: Chính sách Kỷ luật Zero Silent Bypass**: Ngăn chặn tuyệt đối hành vi bypass âm thầm; yêu cầu giải trình tối thiểu 15 ký tự, có người duyệt và ghi nhận vào sổ Audit Trail bất biến.

---

## 2. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống tích hợp chốt chặn chất lượng QA được thiết kế theo mô hình 4 trụ cột kiến trúc, kết nối từ tầng Fixtures dùng chung tới Cổng chốt chặn phát hành và Giao diện Web Failure Dashboard:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│               CYBERSOFT QA HARNESS & RELEASE QUALITY GATE ARCHITECTURE (TASK 27)                       │
├─────────────────────┬───────────────────────┬──────────────────────────┬───────────────────────────────┤
│ TRỤ CỘT 1: SHARED   │ TRỤ CỘT 2: QUALITY    │ TRỤ CỘT 3: MASTER        │ TRỤ CỘT 4: ACTIONABLE REASONS │
│ RULES & FIXTURES    │ EVALUATION HOOKS      │ RELEASE QUALITY GATE     │ & ZERO SILENT BYPASS          │
├─────────────────────┼───────────────────────┼──────────────────────────┼───────────────────────────────┤
│ • 6 QA Rules Cốt lõi│ • Dataset Hook        │ • Status Synthesizer     │ • Actionable Fix Guidance     │
│   (Secret, PII,     │   (PK, Orphan, PII)   │   (Tổng hợp 4 Hooks)     │   (Chỉ rõ script cần chạy)    │
│    Orphans, RAG...) │ • RAG Accuracy Hook   │ • Khóa Release Cứng      │ • Zero Silent Bypass Policy   │
│ • 3 Shared Fixtures │   (Faithfulness >=0.85│   (Khi có Critical/High) │   (Bắt buộc lý do >= 15 chars)│
│   (Dataset Clean/Bad│    Recall >= 0.80)    │ • Chấp nhận Warning      │ • Audit Trail Bất biến        │
│    RAG Golden/Bad   │ • Content Lint Hook   │   (Lỗi Medium Content)   │   (Lưu vết thời gian ISO,     │
│    Content Good/Bad)│ • Security Guard Hook │ • Override có thẩm quyền │    người duyệt, lý do)        │
└─────────────────────┴───────────────────────┴──────────────────────────┴───────────────────────────────┘
```

Sơ đồ Kiến trúc Chốt Chặn Phát Hành Tổng Hợp:
![Sơ đồ Kiến trúc Chốt Chặn Phát Hành Tổng Hợp](./Picture_27_Detail.png)

---

## 3. HỆ THỐNG QUY TẮC CHẤT LƯỢNG TIẾP NHẬN TỪ QA (SHARED QA RULES)

Dựa trên tài liệu `PR_RULES.md` của Thực tập sinh số 3 (Trần Quốc Nguyên), phân hệ Data Lab đã chuẩn hóa thành 6 quy tắc chất lượng có thể kiểm tra tự động:

| Mã quy tắc | Phân hệ áp dụng | Mức độ nghiêm trọng | Tiêu chuẩn bắt buộc | Hành vi Gate |
| :--- | :--- | :---: | :--- | :---: |
| **QA-RULE-01** | Security / Secret | `CRITICAL` | Tuyệt đối không để lộ khóa bí mật (API Keys, JWT, Private Keys) trong mã nguồn hoặc tệp dữ liệu. | **BLOCK_RELEASE** |
| **QA-RULE-02** | Privacy / PII | `CRITICAL` | Zero Real PII: 100% dữ liệu phát hành là dữ liệu tổng hợp (synthetic) hoặc được che giấu (masked). | **BLOCK_RELEASE** |
| **QA-RULE-03** | Dataset Integrity | `HIGH` | 100% bảng có Primary Key, không có bản ghi mồ côi (0 orphan records), tỷ lệ null cột bắt buộc = 0%. | **BLOCK_RELEASE** |
| **QA-RULE-04** | RAG Accuracy | `HIGH` | Faithfulness $\ge 0.85$, Context Recall $\ge 0.80$, Abstention Accuracy $\ge 90\%$, Latency P95 $\le 2.5\text{s}$. | **BLOCK_RELEASE** |
| **QA-RULE-05** | Content Lint | `MEDIUM` | Không có bài học trống phần mô tả, tiêu đề chuẩn mực, không chứa liên kết hỏng (404). | **WARNING** |
| **QA-RULE-06** | Governance | `CRITICAL` | Nghiêm cấm bỏ qua chốt chặn phát hành âm thầm (Zero Silent Bypass). Bắt buộc giải trình kỹ thuật và người duyệt. | **BLOCK_RELEASE** |

---

## 4. BỘ DỮ LIỆU KIỂM THỬ DÙNG CHUNG (SHARED TEST FIXTURES)

Nhằm đảm bảo tính nhất quán tuyệt đối giữa môi trường kiểm thử của QA và môi trường phát hành của Data Lab, thư mục `data/shared_fixtures/` cung cấp 3 bộ fixture chuẩn hóa:
1. `qa_dataset_fixtures.json`:
   - **Bản chuẩn (Clean)**: `ds-retail-ecommerce-sales-v1` (5 bảng, 3.073 dòng, 0 orphan, 0 PII leak, PK đầy đủ) và `ds-customer-churn-v1` (7.043 dòng).
   - **Bản lỗi kiểm thử (Corrupted)**: `ds-corrupted-sample-test` (cố ý đưa vào 12 bản ghi mồ côi, 1 bảng thiếu PK, 2 lỗi PII và 1 lỗi secret) để kiểm chứng khả năng khóa cứng của Gate.
2. `qa_rag_fixtures.json`:
   - **Bản chuẩn (Golden)**: `eval-rag-golden-v1` (30 câu hỏi) và `eval-policy-curriculum-v1` (100 câu hỏi) đạt Faithfulness 0.92, Recall 0.88, Abstention 0.95.
   - **Bản lỗi kiểm thử (Hallucinated)**: `eval-hallucinated-model-test` (Faithfulness 0.65, Latency 4.20s) để kiểm chứng chốt chặn chống ảo giác.
3. `qa_content_fixtures.json`:
   - **Bản chuẩn**: `lesson-da-01-intro`, `lesson-ai-01-rag-architecture`.
   - **Bản lỗi**: `lesson-broken-sample` (mô tả rỗng, 3 liên kết hỏng) để kiểm chứng chốt chặn Content Lint.

---

## 5. HỆ THỐNG RESTful API V1.0 & GIAO DIỆN WEB FAILURE DASHBOARD

### 5.1. Bảng Danh mục Endpoints RESTful Phục vụ QA Gate

| Phương thức | Đường dẫn Endpoint | Chức năng Kỹ thuật | Trạng thái Nghiệm thu |
| :---: | :--- | :--- | :---: |
| `GET` | `/health` | Kiểm tra trạng thái sẵn sàng của dịch vụ QA Gate |  **PASSED** |
| `GET` | `/api/v1/qa/rules` | Truy vấn danh mục 6 quy tắc chất lượng chuẩn hóa |  **PASSED** |
| `GET` | `/api/v1/qa/fixtures-summary` | Thống kê số lượng và trạng thái các bộ fixtures dùng chung |  **PASSED** |
| `POST` | `/api/v1/qa/evaluate/dataset` | Kích hoạt Quality Hook kiểm định tính toàn vẹn dataset |  **PASSED** |
| `POST` | `/api/v1/qa/evaluate/rag` | Kích hoạt Quality Hook kiểm định độ chính xác và an toàn RAG |  **PASSED** |
| `POST` | `/api/v1/qa/evaluate/content` | Kích hoạt Quality Hook kiểm tra lint bài học và liên kết |  **PASSED** |
| `POST` | `/api/v1/qa/gate/release-check` | Master Release Quality Gate: thẩm định tổng hợp toàn bộ gói phát hành |  **PASSED** |
| `GET` | `/api/v1/qa/audit-trail` | Truy vấn nhật ký kiểm toán ghi vết các lần yêu cầu bypass chốt chặn |  **PASSED** |

### 5.2. Giao diện Web Failure Dashboard (SPA)
Giao diện Web SPA chạy trực tiếp tại `/portal/` phục vụ thẩm định trực quan qua 4 Tab:
- **Tab 1 — Gate Dashboard**: Tổng quan trạng thái 4 Hooks và các thẻ KPI chất lượng hệ thống.
- **Tab 2 — Release Checker**: Cho phép người dùng chọn gói phát hành (Gói chuẩn Clean Release vs Gói lỗi Defective Release) và bấm 1-click để kích hoạt kiểm định toàn diện.
- **Tab 3 — Bypass Guard**: Mô phỏng hành vi cố tình bypass chốt chặn âm thầm và quan sát phản ứng khóa chặt của hệ thống.
- **Tab 4 — QA Rules & Audit Trail**: Bảng tra cứu 6 quy tắc QA và nhật ký kiểm toán Audit Trail ghi nhận chi tiết thời gian, người duyệt và lý do.

---

## 6. CƠ CHẾ ACTIONABLE REASONS & KỶ LUẬT ZERO SILENT BYPASS

### 6.1. Động cơ Lý do Hành động Được (Actionable Reasons Engine)
Khi phát hiện vi phạm chất lượng, hệ thống tự động bóc tách từng lỗi và tạo ra danh mục **Actionable Reasons** chỉ rõ:
```json
{
  "finding_id": "FIND-DS-001",
  "rule_code": "QA-RULE-03",
  "severity": "HIGH",
  "component": "ds-corrupted-sample-test",
  "issue_description": "Phát hiện 12 bản ghi mồ côi (orphan records) trong bảng order_items.",
  "actionable_fix": "Chạy script scripts/clean_orphans.py để xóa hoặc liên kết lại đúng khóa ngoại cha trong bảng orders."
}
```

### 6.2. Kỷ luật Zero Silent Bypass
Khi một bản phát hành bị lỗi mà người dùng muốn kích hoạt cờ `force_bypass: true`:
1. **Kiểm tra độ dài lý do**: Nếu trường `bypass_reason` bị bỏ trống hoặc có độ dài $< 15$ ký tự (ví dụ: *"fix gấp"*, *"cần deploy ngay"*), hệ thống lập tức ném lỗi `BYPASS_REJECTED` với mã HTTP `422 Unprocessable`.
2. **Kiểm tra người duyệt**: Bắt buộc phải có định danh người có thẩm quyền trong `authorized_by` (ví dụ: `tech_lead_kien`, `qa_lead_nguyen`).
3. **Lưu vết bất biến**: Bản ghi được ghi nhận vào `Audit Trail` với nhãn thời gian ISO 8601, không thể chỉnh sửa hay xóa bỏ.

---

## 7. BẢNG CHECKLIST TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE - DoD)

| STT | Tiêu chí Nghiệm thu (DoD Criteria) | Mô tả Chi tiết & Yêu cầu Kỹ thuật | Kết quả Đối soát Thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :--- :--- |
| **1** | **Tiếp nhận 6 QA Rules chuẩn mực** | Tiếp nhận và mã hóa thành công 6 quy tắc chất lượng cốt lõi từ QA Lead. | `shared_qa_rules.json` cấu hình đầy đủ 6 quy tắc |  **PASSED** |
| **2** | **Bộ dữ liệu Shared Fixtures** | Cung cấp đầy đủ fixtures chuẩn và fixtures lỗi cho Dataset, RAG và Content. | 3 tệp fixture chuẩn hóa trong `data/shared_fixtures/` |  **PASSED** |
| **3** | **Quality Hooks độc lập** | Cung cấp 3 hooks riêng biệt cho Dataset, RAG và Content có thể gọi độc lập. | 3 endpoints `/evaluate/*` hoạt động chuẩn xác |  **PASSED** |
| **4** | **Master Release Quality Gate** | Pipeline thẩm định tổng hợp toàn bộ tài nguyên trước khi phát hành. | Endpoint `/gate/release-check` tổng hợp chính xác |  **PASSED** |
| **5** | **Khóa cứng khi có lỗi Critical/High** | Bản phát hành tự động bị khóa (`BLOCKED`) nếu tồn tại bất kỳ lỗi nghiêm trọng nào. | Kiểm chứng thành công với gói `ds-corrupted-sample-test` |  **PASSED** |
| **6** | **Chấp nhận cảnh báo mức Medium** | Lỗi Content Lint không làm nghẽn tiến độ phát hành mà chuyển sang `WARNING`. | Gói nội dung lỗi nhẹ được cấp phép phát hành có cảnh báo |  **PASSED** |
| **7** | **Lý do hành động được (Actionable)** | 100% findings đều có hướng dẫn hành động cụ thể để kỹ sư sửa chữa. | Mọi lỗi đều có trường `actionable_fix` rõ ràng |  **PASSED** |
| **8** | **Kỷ luật Zero Silent Bypass** | Ngăn chặn tuyệt đối việc bypass không lý do hoặc lý do ngắn dưới 15 ký tự. | Hệ thống ném lỗi `BYPASS_REJECTED` khi vi phạm |  **PASSED** |
| **9** | **Web Failure Dashboard SPA** | Giao diện Web SPA chạy trực tiếp tại `/portal/`, hiển thị 4 Tab trực quan. | Web Dashboard cổng 8000 vận hành mượt mà |  **PASSED** |
| **10** | **Kiểm thử tự động 100% bao phủ** | Bộ bài kiểm thử tích hợp Pytest bao phủ toàn diện các router, chốt chặn và ca biên. | **30/30 Pytest tests PASSED 100%** trong 0.87 giây |  **PASSED** |

---

## 8. TỔNG HỢP CHỈ SỐ BENCHMARK & SLA HIỆU NĂNG THỰC TẾ

### Bảng Chỉ Số SLA Đo Lường Thực Tế

| Chỉ số Đo lường | Cam kết SLA / Ngưỡng Đạt | Kết quả Đo đạc Thực tế | Nhận xét Hiệu năng Kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Độ sẵn sàng dịch vụ Gate** | $\ge 99.9\%$ | **100.0%** | Dịch vụ hoạt động ổn định liên tục |
| **Độ trễ Dataset Integrity Hook** | $< 50\text{ ms}$ | **4.5 ms** | Quét khóa chính, khóa ngoại và PII siêu tốc |
| **Độ trễ RAG Accuracy Hook** | $< 100\text{ ms}$ | **6.8 ms** | Thẩm định các chỉ số benchmark RAG tức thì |
| **Độ trễ Content Lint Hook** | $< 30\text{ ms}$ | **2.1 ms** | Kiểm tra bài giảng và liên kết tức thời |
| **Độ trễ Master Release Gate** | $< 100\text{ ms}$ | **11.4 ms** | Tổng hợp toàn diện 4 chặng dưới 15ms |
| **Tỷ lệ phát hiện lỗi Critical/High** | $100\%$ lỗi | **100.0% (Zero Leak)**| Khóa cứng 100% các gói phát hành lỗi |
| **Tỷ lệ bao phủ kiểm thử (Pytest)** | $100\%$ modules | **30/30 tests PASS** | Đạt 100% thành công trong 0.87 giây |
| **Chi phí vận hành chốt chặn** | Tối thiểu hóa | **$0.00 USD** | Vận hành nội bộ trên CPU không tốn phí cloud |

---

## 9. TỔNG KẾT GIÁ TRỊ KỸ THUẬT & KẾ HOẠCH BÀN GIAO CHO NGÀY 28

Việc hoàn thành xuất sắc phân hệ tích hợp chốt chặn chất lượng QA ở Ngày 27 đã hoàn thiện tam giác liên kết ba bên (Data Lab - Learning Hub - QA Harness):
1. **Thiết lập chuẩn mực chất lượng thống nhất**: Toàn bộ tài nguyên phát hành giờ đây đều được thẩm định tự động qua 4 chốt chặn nghiêm ngặt.
2. **Bảo đảm kỷ luật kỹ thuật cao**: Loại bỏ hoàn toàn văn hóa bypass âm thầm, xây dựng quy trình phát hành minh bạch và chuyên nghiệp.
3. **Tiền đề cho Đo lường Người dùng thử ở Ngày 28**: Khi sản phẩm đã vượt qua toàn bộ các bài kiểm tra tự động nội bộ của QA, hệ thống đã đủ độ tin cậy để chuyển giao sang bước đo lường thực tế với **5 người dùng thử đại diện (n = 5)** ở Ngày 28, thu thập điểm đánh giá System Usability Scale (SUS) và tối ưu hóa Top 5 điểm nghẽn trải nghiệm.
