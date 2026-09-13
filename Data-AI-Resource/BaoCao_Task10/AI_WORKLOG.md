# AI WORK LOG — NGÀY 10: CỔNG XUẤT BẢN DATASET REGISTRY & CATALOG PORTAL

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-13  
**Task ID**: `#DAY-10-DATASET-REGISTRY-PORTAL`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu Kỹ thuật Ban đầu
* **Mục tiêu**: Xây dựng toàn diện **Dataset Registry v0.1 & Publishing Portal** làm trung tâm quản trị vòng đời và xuất bản tài nguyên dữ liệu tập trung, chuyển dịch từ việc tạo dữ liệu rời rạc (Task 04 - 09) sang hệ sinh thái quản lý tài nguyên chuẩn mực, phục vụ tích hợp liên phòng ban với LMS Platform (TTS 02) và QA Automation (TTS 03).
* **Tiêu chí nghiệm thu (Acceptance Criteria / DoD)**:
  1. **Registry Engine & SemVer**: Thiết lập cơ chế đăng ký và quản lý phiên bản chuẩn Semantic Versioning (`MAJOR.MINOR.PATCH`).
  2. **Automated Quality Gate Integration**: Tích hợp chặt chẽ với Schema Validator (Task 04) và Data Quality Harness (Task 05). Dữ liệu chỉ được xuất bản (`PUBLISHED`) khi điểm chất lượng $\ge 95.0\%$ và có $0$ lỗi chặn.
  3. **State Machine Chặt chẽ**: Vòng đời `DRAFT` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `PUBLISHED` / `REJECTED`. Ngăn chặn dữ liệu bẩn rò rỉ và bảo đảm tính bất biến (Immutability) cho các phiên bản đã xuất bản.
  4. **Multi-channel Catalog**: Tự động sinh `CATALOG.md` (cho giảng viên), `catalog.json` (API cho nền tảng học tập TTS 02), và `index.html` (Web portal trực quan với Modal Schema Viewer cho học viên và ban cố vấn).
  5. **Bàn giao tối thiểu 3 benchmark datasets**: Đăng ký và xuất bản thành công `sales_v1`, `HR_ops_v1`, `rag_corpus_qa_v1`.
  6. **Kiểm thử độc lập**: Pytest đạt 100% PASS (11/11 tests) và có kịch bản kiểm thử chặn lỗi dữ liệu bẩn (Negative Testing).

### Rủi ro dự kiến & Bẫy AI thường gặp
* **Bẫy Cho Phép Sửa Dữ Liệu Đã Xuất Bản (Mutation of Published Assets)**: AI thường thiết kế CRUD cơ bản cho phép ghi đè lên bản ghi đang có. Điều này phá vỡ tính tái lập của đề thi và bài tập học viên. *Khắc phục: Cài chốt chặn bất biến (WORM pattern - Write Once, Read Many) trong State Machine.*
* **Bẫy Bypass Quality Gate Âm Thầm**: AI có xu hướng bỏ qua kiểm tra khi tệp dữ liệu lớn hoặc thiếu cấu hình để "tiết kiệm thời gian". *Khắc phục: Ép kiểm tra bắt buộc, nếu thiếu Quality Gate Report thì State Machine kiên quyết từ chối chuyển sang `PUBLISHED`.*
* **Bẫy Đường dẫn Tuyệt đối Cố định (Hard-coded Absolute Paths)**: AI thường hard-code đường dẫn tuyệt đối dạng `D:\Cybersoft\...` hoặc `C:\...`, gây gãy toàn bộ đường dẫn khi chạy trên máy khác hoặc môi trường CI/CD. *Khắc phục: Chuẩn hóa 100% đường dẫn tương đối POSIX và cơ chế `resolve_path()` linh hoạt phát hiện gốc repo.*
* **Bẫy Popup Alert Thô Sơ (UI Shortcut Trap)**: Khi xây dựng Web Portal, AI thường lười tạo giao diện chi tiết mà dùng hàm `alert()` trình duyệt để hiển thị đường dẫn. *Khắc phục: Thiết kế Modal Dialog Dark Mode hoàn chỉnh 5 tab với bảng Schema, quản trị PII và mục tiêu học tập.*

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Mục tiêu tương tác**: Thiết kế Finite State Machine cho vòng đời dataset, xây dựng Quality Gate Checker tích hợp schema validation và phân tích CSV/JSON, triển khai Registry Manager, Catalog Generator, giao diện Web Portal tương tác và bộ kiểm thử tự động Pytest.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data Architect tại CyberSoft Academy.
Bối cảnh: Triển khai Task 10 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng Cổng xuất bản Dataset Registry v0.1 với State Machine (Draft -> Under Review -> Published/Rejected),
kết nối chặt chẽ với Data Quality Harness để chặn đứng dữ liệu bẩn, hỗ trợ SemVer và tự động sinh Catalog đa kênh (Markdown, JSON API, Web Portal).
Yêu cầu kỹ thuật chi tiết:
1. Thiết kế Core Models (DatasetState, QualityGateResult, DatasetEntry, VersionEntry) với Pydantic v2.
2. Xây dựng State Machine chặt chẽ: DRAFT -> UNDER_REVIEW -> PUBLISHED/REJECTED; nghiêm cấm sửa đổi version đã PUBLISHED.
3. Xây dựng QualityGateChecker: thẩm định schema JSON (DoD Schema Task 04), kiểm tra file vật lý, tỷ lệ null < 35%, tính duy nhất của Primary Key, kiểm tra PII và Checksum SHA-256. Điểm >= 95.0% mới được xuất bản.
4. Xây dựng RegistryManager: hỗ trợ register, validate, publish, list, search theo domain/level/query, lưu trữ vào registry_db.json. Đường dẫn phải là relative path an toàn cho mọi máy.
5. Xây dựng CatalogGenerator: tự động xuất CATALOG.md, catalog.json, và index.html (giao diện Dark Mode có Modal Dialog 5 tab xem chi tiết bảng và schema).
6. Viết bộ kiểm thử Pytest bao phủ toàn diện 100% tính năng và CLI script cho TTS 02/TTS 03.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động kiểm soát, phát hiện các sai lệch kỹ thuật và đưa ra quyết định chỉnh sửa dứt khoát:

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Cho phép lệnh `register` ghi đè lên version đã có nếu truyền cờ `--force`**. | **Phá vỡ tính bất biến của bài thi**: Học viên thi trên dataset v1.0.0 nhưng bị người khác ghi đè sửa cột, làm sai lệch kết quả chấm thi tự động của LMS. | **BÁC BỎ HOÀN TOÀN CỜ `--force` ĐỐI VỚI BẢN PUBLISHED**: Khóa WORM tuyệt đối cho version đã xuất bản. Bất kỳ chỉnh sửa nào đều bắt buộc tăng phiên bản theo quy chuẩn Semantic Versioning (`v1.1.0` hoặc `v2.0.0`). |
| **Chỉ cần schema hợp lệ là cho xuất bản; lỗi dữ liệu (null, trùng ID) chỉ cảnh báo (Warning)**. | **Dữ liệu bẩn tràn vào hệ thống học tập**: Khi đưa vào bài học SQL, dữ liệu trùng khóa chính sẽ gây lỗi duplicate khi `JOIN`, làm tính sai doanh thu và sai bài tập học viên. | **THIẾT LẬP CHỐT CHẶN CỨNG (HARD BLOCKING $\ge 95.0\%$ & $0$ VIOLATIONS)**: Nếu có bản ghi trùng khóa chính hoặc tỷ lệ null $> 35\%$, Quality Gate lập tức gán trạng thái `REJECTED` và chặn đứng lệnh `publish`. |
| **Lưu đường dẫn tuyệt đối dạng `D:\Cybersoft\Kien\...` vào `registry_db.json` và `CATALOG.md`**. | **Gãy liên kết khi chuyển máy hoặc chạy CI/CD**: Khi đồng đội TTS 02 hoặc TTS 03 clone repo về máy khác (ổ `C:\...` hoặc Linux), toàn bộ đường dẫn bị chết và không tìm thấy file dữ liệu. | **CHUẨN HÓA 100% ĐƯỜNG DẪN TƯƠNG ĐỐI POSIX**: Chuyển toàn bộ đường dẫn lưu trữ thành relative path (`BaoCao_Task06/data/...`), bổ sung hàm `resolve_path()` tự động định vị repository root trên mọi hệ điều hành. |
| **Gán `onclick="alert(...)"` thô sơ chỉ hiện đường dẫn khi nhấn nút "Xem Chi Tiết" trên Web**. | **Thiếu tính chuyên nghiệp và không hỗ trợ tra cứu trực quan**: Người dùng, Mentor và các bên liên quan không thể xem danh sách bảng, kiểu dữ liệu các cột hay chính sách PII trực tiếp trên Web. | **XÂY DỰNG MODAL DIALOG DARK MODE 5 TAB CHUYÊN NGHIỆP**: Tự thiết kế và lập trình giao diện Popup chi tiết hiển thị đầy đủ: Tổng quan, Cấu trúc Bảng & Cột (Schema Dictionary), Quản trị & PII, Mục tiêu Đào tạo và Raw JSON Manifest. |
| **Không khống chế chiều cao Modal, để bung nở tự do theo nội dung bảng dữ liệu**. | **Vỡ giao diện và trôi mất thanh điều khiển**: Bảng schema dài hàng nghìn pixel khiến cửa sổ modal bị đẩy vọt lên trên màn hình (`top: -1000px`), làm biến mất hoàn toàn Tiêu đề và Thanh chọn Tab. | **KHỐNG CHẾ VIEWPORT VÀ CÔ LẬP VÙNG CUỘN (SCROLL ISOLATION)**: Ghim cố định Header và Tabs (`flex-shrink: 0`), cố định chiều cao Modal `86vh`, thiết lập `min-height: 0` để chỉ vùng bảng cuộn nội dung độc lập, đồng bộ thẩm mỹ 100% giữa Card và Modal. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không tin tưởng mù quáng vào kết luận của AI mà thiết lập quy trình kiểm chứng thực nghiệm độc lập thông qua việc chạy trực tiếp CLI Tools, kịch bản Negative Testing và bộ 11 Pytest Unit Tests.

### 4.1. Lệnh chạy và Kết quả Demo Tổng thể (End-to-End Workflow):
```powershell
python scripts/demo_publish_workflow.py
```

**Nhật ký thực tế (Console Output)**:
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

### 4.2. Kết quả Bộ Kiểm thử Tự động (Pytest Test Suite — 11/11 PASS):
```powershell
pytest tests/ -v
```

**Nhật ký thực tế (Console Output)**:
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

### 4.3. Bằng chứng Kiểm chứng Chặn Lỗi Dữ liệu Bẩn (Negative Testing Proof):
* Khi đưa tệp `dirty/orders.csv` vào kiểm định, hàm `_audit_csv()` lập tức bắt quả tang:
  - Khóa chính trùng lặp (`duplicate primary key 'ORD_00012'`).
  - Vi phạm tỷ lệ null vượt ngưỡng cho phép.
* Điểm chất lượng tự động tụt xuống $92.3\%$ ($< 95.0\%$).
* Lệnh `publish` kiên quyết chặn đứng quá trình xuất bản, bảo vệ hệ sinh thái học tập không bị nhiễm dữ liệu bẩn.

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Nắm vững bản chất kiến trúc của bài toán quản trị dữ liệu: Registry Pattern, Finite State Machine, Immutability (WORM) và Automated Quality Gate. Nhận thức rõ ràng rằng việc tạo dữ liệu (Task 06-09) chỉ có giá trị thực tiễn khi được đưa vào một cổng quản trị tập trung, có phiên bản và có chốt chặn chất lượng tự động trước khi cung cấp cho các bên tiêu thụ (LMS Platform & QA Automation).
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Principal Data Architect, điều phối trợ lý AI xây dựng đồng bộ 4 khối cấu phần kỹ thuật lớn: Core Models với Pydantic v2, State Machine quản trị vòng đời, Quality Gate Checker tích hợp thẩm định Schema & CSV/JSON, Registry Manager lưu trữ CSDL JSON, và Catalog Generator xuất bản đa kênh (Markdown, JSON API, Interactive Web Portal).
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Độc lập phát hiện và xử lý ngay 5 cạm bẫy kỹ thuật do AI đề xuất:
  1. Loại bỏ cờ `--force` để bảo vệ tính bất biến của bài thi học viên.
  2. Bác bỏ đề xuất "nới lỏng dung sai" để ép ngưỡng cứng $95.0\%$ kèm $0$ lỗi chặn.
  3. Triệt tiêu toàn bộ đường dẫn tuyệt đối cố định, thay bằng relative path và cơ chế `resolve_path()` đa nền tảng.
  4. Bác bỏ popup `alert()` sơ sài, tự thiết kế Modal Dialog chuyên nghiệp 5 tab.
  5. Xử lý triệt để lỗi CSS Flexbox Overflow để ghim cố định Header/Tabs, cô lập vùng cuộn bảng dữ liệu.
* **Tầng 4 — Làm chủ (Technical Ownership)**: Tự tay hoàn thiện toàn bộ mã nguồn hệ thống, bộ công cụ CLI (`registry_cli.py`), kịch bản thực hành mẫu (`demo_practice`), bộ kiểm thử tự động 11 unit tests đạt $100\%$ PASS, và cổng thông tin Web Portal thẩm mỹ, đạt chuẩn doanh nghiệp phục vụ vận hành thực tế tại CyberSoft Academy.

---

## 6. Kịch bản Thuyết trình 3 phút Bảo vệ Kỹ thuật (3-Minute Defense Pitch)

> **Kính thưa Hội đồng Chuyên môn và Tech Lead CyberSoft:**  
> Hôm nay, em xin trình bày kết quả triển khai **Task 10: Cổng xuất bản Dataset Registry & Publishing Portal** với 3 luận điểm cốt lõi thể hiện rõ năng lực làm chủ kiến trúc dữ liệu và tư duy quản trị hệ thống:
>
> 1. **Vấn đề AI đề xuất chưa đạt**: Trong thiết kế ban đầu, AI có xu hướng xây dựng một hệ thống CRUD thông thường: cho phép ghi đè version đã xuất bản bằng cờ `--force`, nới lỏng cổng kiểm tra để dữ liệu lỗi vẫn được xuất bản với cảnh báo mềm, sử dụng đường dẫn tuyệt đối gắn chặt với máy dev (`D:\...`), và dùng popup `alert()` sơ sài trên giao diện Web.
> 2. **Phát hiện và Quyết định kỹ thuật của em**: 
>    - *Thứ nhất*, em thiết lập nguyên tắc bất biến (WORM): Một khi dataset đã `PUBLISHED`, nó bị đóng băng vĩnh viễn để bảo vệ tính tái lập của bài thi và bài tập học viên; mọi sửa đổi đều bắt buộc tạo phiên bản mới theo Semantic Versioning.
>    - *Thứ hai*, em cài đặt chốt chặn cứng tại Quality Gate: Ngưỡng điểm $\ge 95.0\%$ và $0$ lỗi chặn (Zero-Tolerance với trùng khóa chính và vi phạm schema), kiên quyết từ chối xuất bản dữ liệu bẩn.
>    - *Thứ ba*, em chuẩn hóa $100\%$ đường dẫn thành dạng tương đối POSIX, giúp hệ thống hoạt động trơn tru trên mọi máy tính và môi trường CI/CD.
>    - *Thứ tư*, em trực tiếp thiết kế và lập trình giao diện Web Portal với Modal Dialog 5 tab chuyên nghiệp, khắc phục triệt để lỗi cuộn giao diện flexbox để mang lại trải nghiệm tra cứu tối ưu.
> 3. **Kết quả kiểm chứng độc lập**: 
>    - Hệ thống đã đăng ký và xuất bản thành công 3 bộ benchmark chuẩn (`sales_v1`, `HR_ops_v1`, `rag_corpus_qa_v1`) đạt $100.0\%$ điểm chất lượng.
>    - Kịch bản Negative Testing đã chứng minh hệ thống chặn đứng thành công dataset bẩn `ds-dirty-test-quarantine`.
>    - Cổng xuất bản đa kênh phục vụ hiệu quả cho cả 3 đối tượng: Markdown cho Giảng viên, JSON API cho TTS 02, và Web Portal cho Học viên.
>    - Toàn bộ 11/11 tests Pytest đạt $100\%$ PASS trong 1.16 giây. Em xin hoàn thành và sẵn sàng trả lời các câu hỏi chuyên sâu từ Hội đồng.
