# BÁO CÁO NGÀY 13 - Validator bài coding và test case

Người thực hiện: Tran_Quoc_Nguyen. Ngày: 19/09/2026. Kế hoạch: `03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`, Tuần 3, Ngày 13.
Vị trí: `cybersoft-learning-hub/Test/Day13_Coding_Problem_Validator_Tran_Quoc_Nguyen/`. Chi tiết kỹ thuật: `README.md`. Nhật ký AI: `AI_WORKLOG.md`. Số liệu chi tiết: `Day13_Quality_Report.xlsx`.

## 1. Tóm tắt

Đã xây `coding-problem-validator` (CLI Node thuần, 19 rule CP001-CP019, judge mini mô phỏng judge thật của BE, mutation testing, leak-guard) và chạy trên **30 bài coding thật**
của Code Playground. Bài chính làm mutation: **Kiểm tra số nguyên tố** (16 mutant); bài đối chiếu: **Sắp xếp tăng dần** (12 mutant).

Kết luận chính: reference solution **30/30 AC**, nhưng **bộ test gốc của bài số nguyên tố chỉ bắt 66.7% mutant (dưới ngưỡng 80%)** - có 4 nhóm lỗ hổng độ phủ thật. Với 6 test bổ sung đề xuất
(chưa áp vào BE) score lên 100%. Ngoài ra đọc code judge phát hiện 2 đường lộ dữ liệu cần mentor xác nhận (F-D13-04, F-D13-08).

## 2. Đối chiếu nghiệm thu

| Điều kiện (kế hoạch) | Kết quả | Ghi chú |
|---|---|---|
| Reference solution luôn AC | **Đạt** - 30/30 | Gate cứng: reference không AC thì mutation dừng (exit 3), có test |
| ≥80% mutant chủ đích bị bắt | **Đạt có điều kiện** | Test hardened: 100% (số nguyên tố), 100% (sắp xếp). **Test gốc: 66.7% (FAIL) và 90.9% (PASS)** |
| Không lộ hidden tests | **Đạt trong report/tool; BE có rủi ro** | 3 lớp bảo vệ + grep độc lập; F-D13-04 (stderr) cần tái hiện |
| Deliverable: coding_problem_validator, Mutation set, Coverage report | Có | `tools/coding-problem-validator/`, `mutants/`, `reports/mutation-*/coverage-report.md`, file Excel |
| Kiểm chứng độc lập, không chỉ dựa AI | Một phần | AI đã làm 8 bước kiểm độc lập; phần con người tự chạy trên Windows: xem `AI_WORKLOG.md` cuối file |

## 3. Kết quả mutation

| Bài | Bộ test | Test (hidden) | Killed / Valid | Score | Kết quả | Survivor |
|---|---|---|---|---|---|---|
| Số nguyên tố | Gốc (BE) | 4 (2) | 10 / 15 | **66.7%** | **FAIL** | MUT-02, 08, 10, 15, 16 |
| Số nguyên tố | Hardened (+6 hidden) | 10 (8) | 15 / 15 | 100% | PASS | - |
| Sắp xếp | Gốc (BE) | 4 (2) | 10 / 11 | 90.9% | PASS | SRT-10 |
| Sắp xếp | Hardened (+6 hidden) | 10 (8) | 11 / 11 | 100% | PASS | - |

Mỗi bài có thêm 1 mutant `EQUIVALENT` (thừa khoảng trắng ở cuối output - judge `trim()` nên không phân biệt được) loại khỏi mẫu số, kèm lý do. Trong lượt hardened, mutant chậm (O(n)/O(n²)) được bắt
bằng `TIMEOUT` (limit 2000ms). Kiểm chéo bằng script Python độc lập: **khớp 100% trên cả 4 lượt**.

Lỗ hổng độ phủ của bài số nguyên tố (mô tả theo nhóm, không nêu giá trị test): (1) không có test là bình phương của số nguyên tố; (2) không có test số lẻ hợp số; (3) không có test cho số nguyên tố chẵn duy nhất;
(4) không có test n rất lớn nên thuật toán O(n) vẫn AC.

## 4. Findings

| ID | Mức | Phát hiện | Mức chắc chắn | Đề xuất |
|---|---|---|---|---|
| F-D13-01 | Major | Test gốc bài số nguyên tố chỉ bắt 66.7% mutant (5 survivor, 4 nhóm lỗ hổng) | Đã chạy + kiểm chéo độc lập | Duyệt bộ test bổ sung `problems-hardened/overrides.json` |
| F-D13-02 | Medium | 24/30 bài không có ràng buộc số học (CP002); schema `Exercise` cũng chưa có trường constraints. Không có constraints thì không thể thêm test hiệu năng một cách công bằng | Đã chạy (rule) | Thêm `constraints` vào đề/schema |
| F-D13-03 | Minor | 3 bài quá ít test (CP013): `tim-so-lon-nhat` (3 test/1 hidden), `dao-nguoc-chuoi` (3/1), `day14-bang-cuu-chuong` (2/1) | Đã chạy (rule) | Bổ sung test biên |
| F-D13-04 | **High nếu tái hiện được** | `judge-queue.service.ts` lưu `stderr` (dòng ~138) và `errorMessage = stderr` (dòng ~147) cho **cả hidden test**, `judge.controller.ts` trả về cả hai, trong khi comment nói hidden data "never persisted". Traceback có thể chứa nguyên văn dòng input hidden. `python-guard` không chặn `raise`/`input()` | Đọc code + mô phỏng (`probe-leak`: 2/2 hidden test bị echo). **Chưa chạy trên server thật** | Xóa/che `stderr`/`errorMessage` cho test hidden; tái hiện trước khi báo |
| F-D13-05 | Medium | Judge cắt stdout ở 64KB (`MAX_OUTPUT_BYTES`): bài có output đúng >64KB không thể AC (bị chấm WA im lặng, không có trạng thái riêng). Phát hiện khi chính reference bị WA với test lớn | Đã chạy (STOP gate) | Tránh output lớn hoặc nâng giới hạn/thêm trạng thái OLE; rule CP019 đã bắt ở tầng test data |
| F-D13-06 | Info | Judge `trim()` hai đầu nên không thực thi "exact output" theo khoảng trắng cuối | Đọc code + chạy (MUT-13/SRT-12 sống sót) | Ghi rõ chính sách so sánh trong đề nếu cần exact |
| F-D13-07 | Low | Trạng thái tổng của submission = trạng thái của test fail **cuối cùng** (mỗi test fail ghi đè `status`), không phải test fail đầu. Ví dụ bài vừa WA vừa TLE sẽ hiện theo test sau cùng | Đọc code (tool mô phỏng cùng hành vi) | Xác nhận đây là chủ ý |
| F-D13-08 | **Medium-High nếu tái hiện được** | `hints.hint3` của **20/20** bài Ngày 14 trùng nguyên văn `solutionCode`; `ExerciseService.findBySlug` `.select(... hints)` trả nguyên object `hints` cho `GET /exercises/:slug`, trong khi `HintService` che nội dung theo unlock + cooldown | Đọc code + script `check-hint3-equals-solution.js` (20/20). **Chưa gọi API thật** | Loại `hints` khỏi `findBySlug` (dùng endpoint hint đã có cơ chế unlock) |

## 5. Bằng chứng (EVD)

| EVD | Nội dung | Vị trí |
|---|---|---|
| EVD-D13-01 | Reference solution AC 30/30 | `reports/validate-baseline/validator-report.json` (`referenceRuns`) |
| EVD-D13-02 | Validator output | `reports/validate-baseline/`, `reports/validate-hardened/` (JSON + CSV) |
| EVD-D13-03 | Mutation execution | `reports/mutation-*/mutation-report.json`, `.csv` |
| EVD-D13-04 | Mutation score + coverage report | `reports/mutation-*/coverage-report.md`, sheet `05_Coverage_Report` |
| EVD-D13-05 | Timeout test | MUT-10/SRT-10 `killedBy: TIMEOUT` (hardened); test `timeout: reference chạy vô hạn...` |
| EVD-D13-06 | Output format test | MUT-09/11/12, SRT-08/09 KILLED; MUT-13/SRT-12 EQUIVALENT (kèm lý do) |
| EVD-D13-07 | Không lộ hidden | Test `report ... KHÔNG chứa input/expected...`, `leak-guard` exit 4, grep độc lập; `reports/probe-leak/` cho F-D13-04 |
| EVD-D13-08 | Kiểm chứng độc lập | `verify-independent.py` (4 lượt khớp 100%) |
| EVD-D13-09 | Test tự động | `node --test tests/coding-problem-validator.test.js` - 45/45 pass |

**Ảnh chụp/console trên máy của bạn chưa có** - cần chụp khi tự chạy `node run-all.js` (xem `AI_WORKLOG.md`).

## 6. Giới hạn cần nói rõ khi báo cáo

- Mutation chỉ làm cho **2/30 bài** với bộ mutant viết tay (28 mutant); score phụ thuộc bộ mutant, không suy rộng ra cả hệ thống. Bộ mutant được viết sau khi đã phân tích điểm yếu của test gốc.
- Bộ test hardened **chưa được duyệt**, chưa áp vào BE; 6 hidden test mới cho mỗi bài chứa giá trị thật nên cần giữ kín.
- Tool chạy bằng judge mini viết lại theo BE (không gọi trực tiếp code Nest); đã liệt kê các điểm khớp, chưa đối chiếu đầu-cuối với judge chạy thật.
- F-D13-04 và F-D13-08 mới ở mức đọc code + mô phỏng; chưa tái hiện qua API/UI.
- Chưa chạy trên Windows và chưa đo memory.

## 7. Việc tiếp theo

Tái hiện F-D13-04/08 trên UI; hỏi mentor về việc áp `overrides.json` và thêm `constraints`; mở rộng mutation sang 3-5 bài tiếp theo (palindrome, fibonacci, GCD, tổng đường chéo);
Ngày 14 (bộ lab Tester thực tế) có thể dùng lại `fixtures/` và `mutants/` làm lab "test suite yếu".
