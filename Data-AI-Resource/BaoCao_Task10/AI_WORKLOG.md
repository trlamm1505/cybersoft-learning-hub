# AI WORK LOG — NGÀY 10: CỔNG XUẤT BẢN DATASET REGISTRY

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-13  
**Task ID**: `#DAY-10-DATASET-REGISTRY-PORTAL`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu Kỹ thuật Ban đầu
* **Mục tiêu**: Xây dựng toàn diện **Dataset Registry v0.1 & Publishing Portal** làm trung tâm quản trị và xuất bản tài nguyên dữ liệu tập trung, phục vụ việc tích hợp đa phòng ban giữa Data & AI (TTS 01), LMS Platform (TTS 02) và QA Automation (TTS 03).
* **Tiêu chí nghiệm thu (Acceptance Criteria / DoD)**:
  1. **Registry Engine & SemVer**: Thiết lập cơ chế đăng ký và quản lý phiên bản chuẩn Semantic Versioning (`MAJOR.MINOR.PATCH`).
  2. **Automated Quality Gate Integration**: Tích hợp chặt chẽ với Schema Validator (Task 04) và Data Quality Harness (Task 05). Dữ liệu chỉ được chuyển sang trạng thái `PUBLISHED` khi điểm chất lượng $\ge 95.0\%$ và có $0$ lỗi chặn.
  3. **State Machine chặt chẽ**: Vòng đời `DRAFT` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `PUBLISHED` / `REJECTED`. Ngăn chặn dữ liệu bẩn rò rỉ và bảo đảm tính bất biến (Immutability) cho các phiên bản đã xuất bản.
  4. **Multi-channel Catalog**: Tự động sinh `CATALOG.md` (cho giảng viên), `catalog.json` (API cho nền tảng học tập TTS 02), và `index.html` (Web portal trực quan cho học viên và ban cố vấn).
  5. **Bàn giao tối thiểu 3 benchmark datasets**: Đăng ký và xuất bản thành công `sales_v1`, `HR_ops_v1`, `rag_corpus_qa_v1`.
  6. **Kiểm thử độc lập**: Pytest đạt 100% PASS và có kịch bản kiểm thử chặn lỗi (Negative Testing).

### Rủi ro dự kiến & Bẫy AI thường gặp
* **Bẫy Cho Phép Sửa Dữ Liệu Đã Xuất Bản (Mutation of Published Assets)**: AI thường thiết kế CRUD đơn giản cho phép cập nhật đè lên bản ghi đang có. Điều này phá vỡ tính tái lập của đề thi và bài tập học viên. *Khắc phục: Cài chốt chặn bất biến (WORM pattern) trong State Machine.*
* **Bẫy Bypass Quality Gate Âm Thầm**: AI có thể tự động bỏ qua kiểm tra khi tệp dữ liệu lớn hoặc thiếu cấu hình. *Khắc phục: Ép kiểm tra bắt buộc, nếu thiếu Quality Gate Report thì State Machine từ chối chuyển sang `PUBLISHED`.*
* **Bẫy Đường dẫn Tuyệt đối Cố định (Hard-coded Paths)**: AI thường hard-code đường dẫn tuyệt đối dạng `C:\...` hoặc `D:\...`, gây lỗi khi chạy trên máy khác hoặc môi trường CI. *Khắc phục: Sử dụng `pathlib.Path` và cơ chế `resolve_path()` linh hoạt phát hiện thư mục gốc repository.*

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Mục tiêu tương tác**: Thiết kế Finite State Machine cho vòng đời dataset, xây dựng Quality Gate Checker tích hợp schema validation và phân tích CSV/JSON, triển khai Registry Manager, Catalog Generator và kiểm thử tự động Pytest.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data Architect tại CyberSoft Academy.
Bối cảnh: Triển khai Task 10 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng Cổng xuất bản Dataset Registry v0.1 với State Machine (Draft -> Under Review -> Published/Rejected),
kết nối chặt chẽ với Data Quality Harness để chặn đứng dữ liệu bẩn, hỗ trợ SemVer và tự động sinh Catalog đa kênh (Markdown, JSON API, Web Portal).
```

---

## 3. Quyết định Kỹ thuật của Thực tập sinh (Human Decisions & Overrides)

1. **Quyết định 1 — Thiết lập Ngưỡng Chặn Cứng (Hard Blocking Threshold = 95.0%)**:
   - *AI đề xuất ban đầu*: Chỉ cần schema hợp lệ là cho phép xuất bản, còn lỗi dữ liệu chỉ đưa ra cảnh báo (Warning).
   - *Quyết định của tôi*: Từ chối đề xuất của AI. Dữ liệu học tập và thi cử yêu cầu độ tin cậy tuyệt đối. Nếu tỷ lệ null vượt $35\%$ hoặc trùng lặp khóa chính thì bắt buộc gán trạng thái `REJECTED` và chặn xuất bản ngay lập tức.
2. **Quyết định 2 — Khóa Bất Biến (Immutability Enforcement)**:
   - *AI đề xuất*: Cho phép lệnh `register` ghi đè lên version đã có nếu truyền cờ `--force`.
   - *Quyết định của tôi*: Loại bỏ hoàn toàn cờ `--force` đối với phiên bản `PUBLISHED`. Bất kỳ thay đổi nào dù nhỏ cũng phải tạo phiên bản mới theo quy tắc Semantic Versioning để bảo vệ dữ liệu cho các khóa học đang chạy.
3. **Quyết định 3 — Chuẩn hóa Đường dẫn Di động Đa Môi Trường (Cross-Machine Path Safety)**:
   - *Lỗi phát sinh*: AI lưu trữ đường dẫn tuyệt đối chứa tên ổ đĩa máy dev, gây gãy liên kết khi clone sang máy khác hoặc môi trường CI.
   - *Quyết định của tôi*: Chuẩn hóa 100% đường dẫn lưu trong Registry DB thành đường dẫn tương đối POSIX (`BaoCao_Task06/data/...`), bổ sung cơ chế tự động tìm gốc repo để đảm bảo chạy xuyên suốt trên mọi hệ điều hành.
4. **Quyết định 4 — Nâng cấp Web Portal với Interactive Modal Dialog thay thế Popup alert()**:
   - *AI đề xuất ban đầu*: Gán `onclick="alert(...)"` thô sơ chỉ hiện đường dẫn tệp manifest khi nhấn nút "Xem Chi Tiết".
   - *Quyết định của tôi*: Từ chối giải pháp này vì không đáp ứng yêu cầu thẩm mỹ và tra cứu trực quan. Thiết kế cửa sổ Modal Dialog chuyên nghiệp với 5 tab (Tổng quan, Cấu trúc Schema & Bảng, Quản trị & PII, Mục tiêu Đào tạo, Manifest JSON).
5. **Quyết định 5 — Khống chế Viewport Modal và Xử lý Cuộn Chuyên Biệt (Scroll Isolation)**:
   - *Vấn đề phát sinh*: Bảng schema dài hàng nghìn pixel làm bung nở khung popup, khiến tiêu đề và thanh Tab bị đẩy trôi ra khỏi màn hình.
   - *Quyết định của tôi*: Ghim cố định Header và thanh Tab (`flex-shrink: 0`), khống chế chiều cao Modal chuẩn (`height: 86vh`), chỉ cho phép vùng thân bảng cuộn dữ liệu (`modal-body { overflow-y: auto; min-height: 0; }`), và đồng bộ phong cách thẩm mỹ giữa các thẻ Card và Modal.

---

## 4. Bằng chứng Kiểm chứng Thực tế (Verification Evidence)

### 1. Kết quả chạy Bộ Kiểm thử Tự động (Pytest)
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task10
collected 11 items

tests/test_catalog_generation.py::test_build_catalog_outputs PASSED      [  9%]
tests/test_quality_gate_enforcement.py::test_quality_gate_passes_clean_data PASSED [ 18%]
tests/test_quality_gate_enforcement.py::test_quality_gate_strictly_rejects_dirty_data PASSED [ 27%]
tests/test_quality_gate_enforcement.py::test_state_machine_blocks_publishing_without_quality_gate PASSED [ 36%]
tests/test_quality_gate_enforcement.py::test_state_machine_blocks_mutation_of_published_dataset PASSED [ 45%]
tests/test_registry_core.py::test_register_dataset_initial_state_is_draft PASSED [ 54%]
tests/test_registry_core.py::test_semver_validation PASSED               [ 63%]
tests/test_registry_core.py::test_search_by_domain_and_skills PASSED     [ 72%]
tests/test_registry_core.py::test_get_nonexistent_dataset_returns_none PASSED [ 81%]
tests/test_registry_core.py::test_search_by_text_query PASSED            [ 90%]
tests/test_registry_core.py::test_immutability_re_registering_published_version_fails PASSED [100%]

============================= 11 passed in 1.16s ==============================
```

### 2. Kết quả Chạy Demo & Thẩm định Bắt Lỗi Dữ Liệu Bẩn
```text
======================================================================
🚀 CYBERSOFT DATASET REGISTRY v0.1 — END-TO-END VERIFICATION DEMO
======================================================================
[PHASE 1] ĐĂNG KÝ VÀ KIỂM ĐỊNH 3 DATASET BENCHMARK CHÍNH...
▶ Xử lý: [ds-retail-ecommerce-sales-v1] (v1.0.0) -> PUBLISHED ✓ (Quality: 100.0%)
▶ Xử lý: [ds-hr-operations-attendance-v1] (v1.1.0) -> PUBLISHED ✓ (Quality: 100.0%)
▶ Xử lý: [ds-nlp-rag-tutor-knowledgebase-v1] (v1.0.0) -> PUBLISHED ✓ (Quality: 100.0%)

[PHASE 2] KIỂM THỬ AN TOÀN: THỬ XUẤT BẢN DỮ LIỆU BẨN (NEGATIVE TEST)
▶ Đã đăng ký dataset bẩn 'ds-dirty-test-quarantine' (DRAFT)
▶ Thử ép lệnh PUBLISH mà không khắc phục lỗi...
✅ CHẶN THÀNH CÔNG! Quality Gate từ chối xuất bản đúng theo tiêu chuẩn:
   -> Lý do: Quality Gate FAILED (Score: 92.3%). Blocking violations: Schema validation error at [root]: 'lineage' is a required property
   -> Xác nhận: Dataset bẩn KHÔNG có phiên bản nào được xuất bản ra Catalog.

[PHASE 3] BIÊN TẬP VÀ XUẤT BẢN MULTI-CHANNEL CATALOG...
✓ Đã tạo GitHub Markdown Catalog: CATALOG.md
✓ Đã tạo JSON API Manifest:       catalog.json
✓ Đã tạo Interactive HTML Portal:  index.html
======================================================================
```
