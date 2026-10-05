# PR Quality Bot — đọc nhanh trong 2 phút

## Bot là gì

Mỗi khi bạn mở **Pull Request vào `main`**, bot tự chạy test cho đúng phần bạn vừa sửa rồi báo kết quả ngay trên PR.

- Bot **không** comment, **không** approve, **không** merge. Người review vẫn là người quyết định.
- Push thẳng lên `main` (không qua PR) thì bot không chạy.

## Xem kết quả ở đâu

Kéo xuống cuối trang PR → dòng `Changed-file quality gates` → bấm **Details** → **Summary**.

| Bạn thấy | Nghĩa là | Bạn cần làm |
|---|---|---|
| ✅ PASS | Phần bạn sửa đã qua test | Chờ người review |
| ✅ WARN | Không lỗi, nhưng có chỗ bot **không kiểm được** | Đọc phần cảnh báo, nói cho người review biết |
| ❌ FAIL | Có lỗi thật | Đọc dòng **"Cách khắc phục"** trong Summary, sửa, push lại. Bot tự chạy lại |

## Ba điều cấm với mọi nhóm (vi phạm là FAIL)

1. **Không để khóa bí mật trong code.**
   Ví dụ bị bắt: `OPENAI_API_KEY=sk-abc123...`, `JWT_SECRET=` kèm một chuỗi thật dài, token GitHub `ghp_...`, khóa Google `AIza...`, private key, hoặc link database có sẵn mật khẩu như `mongodb+srv://user:matkhau@...`.
   Không sao: giá trị mẫu như `changeme`, `your_key_here`, `<điền vào>`, `${TEN_BIEN}`.
2. **Không sửa workflow để bot tự approve, tự merge, tự comment liên tục, hoặc xin quyền ghi** (`write-all`, `pull_request_target`).
3. **Không làm hỏng test hoặc build.** Lệnh cài đặt, test hay build trả lỗi là FAIL.

Nếu file test của bạn cần chứa khóa **giả** để kiểm thử, báo QA để thêm file đó vào danh sách cho phép.

## Bạn sửa gì thì bot kiểm gì

### Nhóm Frontend — sửa trong `learning-hub/FE/`

Bot chạy: cài package → chạy test (vitest) → build.

FAIL khi: test fail, lỗi TypeScript, import sai đường dẫn, thiếu package, `package-lock.json` không khớp `package.json`, build lỗi.

> Lưu ý: bot chỉ chạy những test FE **đã có sẵn**. Chức năng nào chưa có test thì bot không biết nó hỏng.

### Nhóm Backend — sửa trong `learning-hub/BE/`

Bot chạy: cài package → chạy test (Jest) → build.

FAIL khi: test Jest fail, lỗi TypeScript, module/provider khai báo thiếu làm test không chạy được, build lỗi.

Sửa thêm các file dữ liệu sau thì bot kiểm luôn nội dung:

| File | Bot kiểm thêm | FAIL khi |
|---|---|---|
| `initial-quiz-questions.ts` | Câu hỏi trắc nghiệm | Câu hỏi trống, thiếu lựa chọn, không có đáp án đúng, nhiều đáp án đúng, hai đáp án trùng nhau |
| `initial-exercises*.ts`, `seed-exercises.ts` | Bài coding | Thiếu đề, thiếu test mẫu, không có test ẩn, lời giải mẫu chạy sai, code khởi đầu lộ sẵn lời giải |
| `initial-data.ts` (và `mockLessons.ts` bên FE) | Bài học | Chỉ **WARN**: thiếu tiêu đề, thiếu mục tiêu học, link sai định dạng... |

> Lưu ý 1: sửa **controller hoặc DTO** thì bot **không** tự kiểm được API có còn đúng hợp đồng với FE không. Bot chỉ nhắc người review kiểm tay. Đổi tên field hay bỏ field sẽ không làm đỏ PR.
>
> Lưu ý 2: thiếu giải thích đáp án, câu hỏi trùng nhau, đề thiếu ràng buộc... chỉ hiện trong log, không làm FAIL.

### Nhóm Data-AI — sửa trong `Data-AI-Resource/`

Bot **chưa có test riêng** cho thư mục này. Bot chỉ:

- quét khóa bí mật (có thì FAIL);
- báo WARN "file chưa có gate".

Vì vậy PR của nhóm Data xanh **không có nghĩa** là retriever, hybrid search hay AI Tutor đã được kiểm. Muốn bot chạy test của nhóm, báo QA để thêm vào cấu hình.

### Nhóm Test/QA — sửa trong `Test/` hoặc `.github/workflows/`

| Sửa | Bot chạy |
|---|---|
| Day06, Day07 | Bộ pytest của ngày đó |
| Day11, Day12, Day13 | Test của công cụ ngày đó |
| Day22 hoặc bất kỳ workflow nào | 36 test tự kiểm của bot |
| Các ngày khác (Day3, 5, 8, 14, 15...) | Chưa có test → WARN |

### Chỉ sửa tài liệu

File `.md`, `.docx`, `.xlsx`, ảnh, thư mục `reports/`: bot không chạy test nào, chỉ quét khóa bí mật. Kết quả PASS.

## Khi bị FAIL, làm theo thứ tự này

1. Mở **Summary**, xem bảng **Gate summary**: dòng nào ghi FAIL.
2. Kéo xuống phần của gate đó: đọc log (tên test fail, dòng báo lỗi).
3. Đọc dòng **"Cách khắc phục"** ngay bên dưới.
4. Sửa ở máy, chạy lại đúng lệnh ghi trong report cho tới khi hết lỗi.
5. Commit và push lên cùng nhánh. Bot tự chạy lại, không cần mở PR mới.

Nếu bạn cho rằng bot báo sai, **đừng** sửa workflow hay xóa test để cho qua. Nhắn QA (Trần Quốc Nguyên) kèm link lần chạy.

## Điều bot không làm được

- Không thay người review: PR xanh vẫn cần ít nhất một người đọc và approve.
- Không chạy giao diện thật, không gọi server thật, không cần database.
- Không chặn được nút Merge trừ khi admin repo bật "bắt buộc check phải xanh".
- Không kiểm phần chưa có test.

---

Chi tiết kỹ thuật (pattern, lệnh, cách thêm gate): xem `CHANGE_IMPACT_MAPPING.md` và `config/change-impact-map.json`.
