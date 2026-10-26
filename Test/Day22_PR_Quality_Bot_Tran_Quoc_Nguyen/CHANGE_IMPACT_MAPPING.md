# Change-impact mapping

Nguồn duy nhất: `config/change-impact-map.json`. Bảng dưới chỉ để đọc nhanh.

## Thứ tự phân loại một file

1. Khớp `docs_only_patterns` (và không nằm trong `docs_only_exceptions`) → **docs-only**, không chạy gate test.
2. Khớp pattern của một hay nhiều gate → chạy tất cả gate đó.
3. Không khớp gì → **CHƯA MAP**: report cảnh báo (WARN), hoặc FAIL nếu bật `--strict-unmapped`.

Gate "Secret và workflow policy" luôn chạy trên mọi file thay đổi, kể cả docs-only.

So khớp phân biệt hoa/thường và giống nhau trên Windows lẫn Linux. Dấu `*` khớp cả dấu `/`.

## Gate

| File thay đổi | Gate | Loại | Kiểm cái gì |
|---|---|---|---|
| `learning-hub/FE/*` | Frontend unit test và build | blocking | `npm ci`, `vitest`, `tsc + vite build` |
| `learning-hub/BE/*` | Backend unit test và build | blocking | `npm ci`, `jest`, `nest build` |
| `learning-hub/BE/src/data/initial-quiz-questions.ts` | Quiz validator - câu hỏi thật | blocking | Trích lại câu hỏi từ file `.ts` vừa đổi rồi chạy quiz-validator, fail khi có ERROR |
| `learning-hub/BE/src/data/initial-exercises*.ts`, `seed-exercises.ts` | Coding problem validator - bài thật | blocking | Trích lại bài coding, chạy reference solution và validator |
| `learning-hub/BE/src/data/initial-data.ts`, `learning-hub/FE/src/data/mockLessons.ts` | Content lint - bài học thật | advisory | Trích lại bài học rồi chạy content-lint |
| `Test/Day06_API_Contract_Tests/*` | API contract test (mock) | blocking | pytest trong thư mục Day06 |
| `Test/Day07_Authentication_Tests_Tran Quoc Nguyen/*` | Auth/authorization test (mock) | blocking | pytest trong thư mục Day07 |
| `Test/Day11_.../*`, `Test/Day12_.../*`, `Test/Day13_.../*` | Test của từng công cụ | blocking | `node --test` của công cụ tương ứng |
| `.github/workflows/*`, `Test/Day22_.../*` | PR Quality Bot self-test | blocking | 38 unit test của bot |

File dữ liệu của BE kích hoạt đồng thời gate Backend và gate nội dung tương ứng; đây là chủ ý.

## Docs-only

`*.md`, `*.docx`, `*.xlsx`, `*.pptx`, `*.pdf`, ảnh, `Test/*/reports/*`, `learning-hub/docs/*`, `LICENSE`, `.gitignore`.

Ngoại lệ (vẫn coi là code vì là dữ liệu test): `Test/*/samples/*`, `Test/*/fixtures/*`, `Test/*/real-content/*`.

## Lưu ý cho người review (advisory)

Khi `*.controller.ts` hoặc `*.dto.ts` của BE đổi, report thêm mục nhắc người review đối chiếu contract Ngày 6 bằng tay, vì contract test chạy trên API mô phỏng.

## Thêm mapping mới

Thêm một object vào `gates` với `id`, `name`, `patterns`, `commands`, `remediation` (bắt buộc), tùy chọn `setup`, `cwd`, `blocking: false`. Dùng `{tmp}` trong lệnh cho file tạm. Test `test_every_gate_has_remediation_and_existing_entrypoints` sẽ fail nếu thiếu remediation hoặc đường dẫn lệnh không tồn tại.
