# AI WORK LOG - NGÀY 05: XÂY DATA QUALITY HARNESS V0

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-05  
**Task ID**: `#DAY-05-DATA-QUALITY-HARNESS`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Xây dựng công cụ tự động kiểm tra chất lượng dữ liệu dạng bảng (**Data Quality Harness v0**) phục vụ kiểm định các tệp dữ liệu CSV trước khi đưa vào kho lưu trữ Dataset Registry hoặc phân phối cho học viên các khóa Data Analyst và AI Engineer tại CyberSoft.
* **Yêu cầu kỹ thuật cốt lõi**:
  * Triển khai tối thiểu **7 nhóm kiểm tra chất lượng độc lập**: `schema`, `null`, `duplicate`, `type`, `range`, `category`, `date`.
  * Phân định rạch ròi 2 mức độ nghiêm trọng: `CRITICAL` (chặn đứng pipeline) và `WARNING` (cảnh báo nhẹ, cho qua trừ khi bật chế độ nghiêm ngặt).
  * Hỗ trợ xuất báo cáo đa định dạng đồng thời: `JSON` (máy đọc cho CI/CD), `Markdown` (tài liệu hóa GitHub), và `HTML Dashboard` (giao diện tương tác cho giảng viên/phân tích viên).
  * CLI công cụ độc lập tuân thủ chuẩn mã thoát POSIX (Exit Code: 0 khi đạt chuẩn, 1 khi có lỗi nghiêm trọng, 2 khi lỗi hệ thống/tham số).
  * Tạo 2 bộ dữ liệu đối chứng: `clean_students.csv` (100% hợp lệ) và `dirty_students.csv` (chủ ý cài cắm đầy đủ 7 nhóm lỗi để chứng minh hệ thống bắt lỗi chính xác tuyệt đối).

### Rủi ro dự kiến & Bẫy AI thường gặp
* AI thường có xu hướng viết mã nguồn dạng thủ tục (procedural) dồn toàn bộ logic vào 1 file kịch bản dài 300 dòng, vi phạm nguyên tắc Đơn nhiệm (Single Responsibility Principle) và gây khó khăn khi mở rộng hoặc viết unit test độc lập.
* AI dễ mắc bẫy ép kiểu ngầm định (*silent type casting*) của thư viện Pandas: tự động chuyển số nguyên thành số thực (`float64`) khi cột có chứa ô trống, làm mất tính nguyên bản của chuỗi ký tự ban đầu.
* AI thường chỉ kiểm tra định dạng ngày tháng cơ bản mà bỏ qua các quy tắc nghiệp vụ thời gian thực tế: cấm ngày nhập học trong tương lai, và nghịch lý ngày nhập học diễn ra sau ngày tốt nghiệp.
* AI thường đưa các biểu tượng emoji trực tiếp vào các lệnh `print()` của CLI, gây sập tiến trình trên hệ điều hành Windows (`UnicodeEncodeError: 'charmap' codec...`) khi terminal chạy bảng mã `cp1252`.
* AI thường trả về Exit Code `0` trong mọi trường hợp, phá vỡ nguyên lý Fail-Fast trong quy trình tích hợp tự động CI/CD.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash / Claude 3.5 Sonnet).
* **Mục tiêu tương tác**: Thiết kế kiến trúc module hướng đối tượng `BaseCheck`, hiện thực hóa 7 tầng kiểm thử độc lập, xây dựng 3 bộ xuất báo cáo (JSON/Markdown/HTML), và viết bộ unit test tự động 18 test cases.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data Quality Engineer & Platform Architect tại CyberSoft Academy.
Bối cảnh: Kế thừa chuẩn repo Ngày 03 và schema metadata Ngày 04, hãy xây dựng công cụ Data Quality Harness v0 kiểm tra tệp CSV cho CyberSoft Data & AI Lab.
Ràng buộc: Đội ngũ 3 người, thời hạn 30 ngày, hệ thống chạy local-first trên máy cá nhân, tối ưu tốc độ (<0.1s/file), tương thích 100% Windows PowerShell.
Hãy thực hiện các yêu cầu sau theo chuẩn công nghiệp:
1. Thiết kế kiến trúc hướng đối tượng với lớp trừu tượng BaseCheck, phân tách thành 7 modules riêng biệt trong src/checks/: schema, null, duplicate, type, range, category, date.
2. Xây dựng DataQualityEngine điều phối kiểm thử tập trung, tổng hợp metrics, tính toán pass rate, và quyết định Exit Code chuẩn POSIX (0 khi Pass, 1 khi Fail).
3. Xây dựng 3 bộ reporters độc lập trong src/reporters/: JSON (máy đọc), Markdown (GitHub), HTML Dashboard (tự chứa CSS/JS độc lập).
4. Thiết kế bộ quy tắc mẫu course_students_rules.json cấu hình chi tiết cả 7 nhóm check cho bài toán quản lý học viên CyberSoft.
5. Tạo 2 bộ dữ liệu đối chứng: clean_students.csv (đạt chuẩn 100%) và dirty_students.csv (cài đặt đầy đủ 7 nhóm lỗi vi phạm).
6. Viết CLI scripts/validate_data.py đầy đủ tham số (-i, -r, -f, -o, --strict) an toàn encoding Windows UTF-8.
7. Xây dựng bộ test suites với 18 unit/integration tests và script nghiệm thu độc lập validate_day05.py.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Gom toàn bộ 7 hàm kiểm tra vào 1 file procedural duy nhất**. | Vi phạm kiến trúc module, khó mở rộng thêm các loại check mới cho Tuần 2 (kiểm tra quan hệ đa bảng Dim/Fact, RAG corpus) và không thể viết unit test riêng lẻ. | **TÁI CẤU TRÚC HƯỚNG ĐỐI TƯỢNG**: Xây dựng lớp trừu tượng `BaseCheck`, phân rã thành 7 class riêng biệt trong `src/checks/`. Sử dụng `DataQualityEngine` làm bộ điều phối tập trung. |
| **Dùng `pd.read_csv(file)` mặc định để nạp dữ liệu**. | Pandas tự động ép kiểu ngầm định (*silent type casting*): biến cột số nguyên có ô trống thành `float64` (`1001` $\rightarrow$ `1001.0`), làm sai lệch kết quả kiểm tra `TypeCheck`. | **BẢO TOÀN DỮ LIỆU GỐC**: Nạp file CSV với tham số `dtype=str` và `keep_default_na=False`, giữ nguyên 100% định dạng chuỗi thô của từng ô để các bộ kiểm tra hoạt động chính xác tuyệt đối. |
| **Chỉ kiểm tra ngày tháng bằng `pd.to_datetime` đơn thuần**. | Bỏ sót hoàn toàn nghịch lý thời gian: học viên có ngày nhập học sau ngày tốt nghiệp (`2024-06-01` > `2023-01-01`), hoặc ngày nhập học trong tương lai xa (`2099-01-01`). | **BỔ SUNG DATECHECK CHUYÊN SÂU**: Tích hợp kiểm tra strict format `strptime`, cờ cấm ngày tương lai `allow_future=False`, và kiểm tra chéo thứ tự thời gian `chronological_order` giữa các cặp cột ngày. |
| **Dùng icon emoji trực tiếp trong các lệnh `print()` của CLI**. | Gây sập tiến trình trên Windows PowerShell (`UnicodeEncodeError: 'charmap' codec...`) khi terminal chạy bảng mã mặc định `cp1252`. | **CHUẨN HÓA MÃ HÓA CONSOLE**: Bổ sung `sys.stdout.reconfigure(encoding='utf-8')` và chuyển đổi console output sang text tags ASCII chuẩn POSIX (`[INFO]`, `[PASS]`, `[FAIL]`, `[SUCCESS]`). |
| **Trả về Exit Code `0` trong mọi trường hợp sau khi in báo cáo**. | Phá vỡ nguyên lý kiểm soát của CI/CD (GitHub Actions / GitLab CI): pipeline không thể phân biệt dữ liệu lỗi để chặn tiến trình, dẫn đến lọt dữ liệu bẩn vào kho. | **CHUẨN HÓA EXIT CODE POSIX**: Thiết lập nghiêm ngặt: Exit Code `0` khi Pass, Exit Code `1` khi phát hiện lỗi `CRITICAL` (hoặc có `WARNING` ở chế độ `--strict`), Exit Code `2` khi lỗi hệ thống/tham số. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thực thi hệ thống kiểm thử tự động độc lập gồm 18 unit/integration tests và script nghiệm thu DoD `validate_day05.py`.

### Lệnh chạy kiểm thử:
```powershell
# 1. Chạy toàn bộ 18 Unit & Integration Tests:
python -m unittest discover -s Data-AI-Resource/BaoCao_Task05/tests

# 2. Chạy Harness tự động nghiệm thu độc lập 10 tiêu chí DoD:
python Data-AI-Resource/BaoCao_Task05/scripts/validate_day05.py
```

### Kết quả chạy thực tế:
```text
======================================================================
  CYBERSOFT DATA & AI LAB -- DAY 05 DoD INDEPENDENT HARNESS
======================================================================
  1 . Cấu trúc thư mục bàn giao chuẩn hóa                [PASS]
  2 . Triển khai tối thiểu 7 loại checks độc lập         [PASS]
  3 . Bộ quy tắc JSON cấu hình 7 nhóm ràng buộc          [PASS]
  4 . Dataset sạch đối chứng đạt 100% hợp lệ             [PASS]
  5 . Dataset lỗi bắt chính xác 100% các vi phạm         [PASS]
  6 . CLI validate_data đầy đủ tham số và trợ giúp       [PASS]
  7 . Exit code chuẩn POSIX (0 khi Pass, 1 khi Fail)     [PASS]
  8 . Xuất báo cáo đa định dạng (JSON, Markdown, HTML)   [PASS]
  9 . Bộ Unit Tests tự động đạt 100% PASS                [PASS]
  10. Tài liệu đặc tả, AI Worklog và Báo cáo Word        [PASS]
----------------------------------------------------------------------
[*] Kết quả nghiệm thu DoD: 10/10 tiêu chí đạt (100.0%)
======================================================================
>>> CHÚC MỪNG: HOÀN THÀNH 100% ĐIỀU KIỆN NGHIỆM THU NGÀY 05 (DoD PASS) <<<
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Tự phân tích bài toán Data Quality Gate, xác định 7 nhóm check cốt lõi, cơ chế phân cấp Severity và chuẩn exit code POSIX trước khi gọi AI.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Principal Data Quality Engineer, giao prompt có cấu trúc chi tiết, phân rã công việc thành từng module độc lập (Core Models, Check Classes, Engine, Reporters, CLI, Tests).
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Phát hiện và bác bỏ mã nguồn procedural của AI, phát hiện bẫy silent casting của Pandas, bổ sung ràng buộc nghịch lý thời gian, và sửa lỗi encoding Windows console.
* **Tầng 4 — Làm chủ (Technical Ownership)**: Xây dựng bộ dữ liệu âm bản `dirty_students.csv` kiểm chứng 100% lỗi cài cắm, thiết lập harness nghiệm thu 10 tiêu chí DoD tự động, làm chủ hoàn toàn mã nguồn không phụ thuộc AI.
