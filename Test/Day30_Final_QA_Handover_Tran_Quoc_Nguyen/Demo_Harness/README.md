# Demo Harness – Kịch bản trình bày QA (Ngày 30)

Kịch bản này giúp **người mới** trình bày cho sếp/nhóm: cách chạy test, đọc PASS/FAIL, mở evidence, giải thích một lỗi còn mở, thêm/sửa một test nhỏ, và bảo vệ kết luận **NO-GO/HOLD**. Viết để tập nói theo từng bước.

> **Đọc kỹ trước khi demo**
> - Mọi lệnh dưới đây **đã được QA xác minh TỒN TẠI** trong repo (đọc `package.json` và các file script), **nhưng CHƯA chạy end-to-end** lúc soạn kịch bản. **Khi demo, chính bạn là người chạy thật và đọc kết quả thật** — đừng đọc sẵn kết quả PASS/FAIL ở đây vì kịch bản không ghi kết quả thật.
> - Mỗi lệnh ghi rõ: **thư mục chạy · mục đích · kết quả mong đợi**.
> - **Không** chạy seed/seed:clean/reset dữ liệu, Docker, đổi nhánh, commit hay push trong buổi demo. Không xóa/ghi đè evidence cũ.
> - Repo: `D:\thuctap\clone2\cybersoft-learning-hub` · nhánh V2: `feat/admin-portal-v2`.
> - Dùng PowerShell; gõ `npm.cmd` (không phải `npm`).

---

## 0. Chuẩn bị một lần trước khi demo (BẮT BUỘC kiểm trước)

Mục đích: tránh lỗi môi trường giữa buổi. Làm theo `QA_Handbook_Tran_Quoc_Nguyen_REVIEW.docx` (mục 1–2).

1. **Cài dependencies nếu chưa có** — thư mục `learning-hub\FE` (và `learning-hub\BE`):
   - Lệnh: `npm.cmd install`
   - Kết quả mong đợi: cài xong, không báo lỗi đỏ. Nếu `node_modules` đã có thì bỏ qua.
2. **MongoDB** (chỉ cần cho phần BE/app, KHÔNG cần cho unit test FE ở Phần 1): xem QA Handbook mục [BẢN V2] — `Get-Service *mongo*` để tìm tên dịch vụ, rồi `Start-Service -Name <TÊN_DỊCH_VỤ>` (PowerShell Run as administrator).
   - **Nếu không bật được MongoDB / thiếu tài khoản / thiếu dữ liệu:** ghi **BLOCKED** và demo phần đó bằng evidence có sẵn (Phần 3), **không** bịa kết quả.

> Gợi ý thời lượng: Phần 1–2 (~4 phút), Phần 3 (~3 phút), Phần 4 (~3 phút), Phần 5 (~4 phút), Phần 6 (~3 phút). Tổng ~15–17 phút.

---

## Phần 1 — Chạy một nhóm test

**Chọn nhóm nhanh và không cần DB: Unit test Frontend (vitest).**

- **Thư mục chạy:** `learning-hub\FE`
- **Lệnh:** `npm.cmd test`   *(script `test` = `vitest run`, chạy một lần rồi dừng)*
- **Mục đích:** chạy toàn bộ unit test FE để cho thấy bộ test tự động hoạt động.
- **Kết quả mong đợi (đọc ở cuối terminal):** các dòng dạng `Test Files  N passed` và `Tests  M passed`. Nếu có lỗi sẽ thấy `failed`.

Hai lựa chọn khác (nói miệng, không bắt buộc chạy):
- **Unit test Backend (jest):** thư mục `learning-hub\BE`, lệnh `npm.cmd test` — cần nhiều RAM, có thể cần biến môi trường; nếu FAIL vì môi trường thì ghi **BLOCKED**, không tính là lỗi sản phẩm.
- **Toàn bộ pipeline release:** thư mục `learning-hub`, lệnh `npm.cmd run release:check` — chạy lâu, cần môi trường đầy đủ. Đây chính là loại lệnh đã tạo evidence gate cũ (xem Phần 3).

> **Đã xác minh:** script `test` của FE = `vitest run`, của BE = `jest`; `release:check` có trong `learning-hub/package.json`. **Chưa chạy** trong lúc soạn kịch bản.

---

## Phần 2 — Nhận biết PASS/FAIL bằng summary và exit code

Ngay **sau** khi lệnh test chạy xong, trong cùng cửa sổ PowerShell:

- **Lệnh:** `$LASTEXITCODE`
- **Mục đích:** lấy mã thoát của lệnh vừa chạy.
- **Kết quả mong đợi:** `0` = PASS (đạt); khác `0` = FAIL (có test hỏng hoặc lỗi chạy).

Cách đọc đúng (theo `QA_Handbook ... _REVIEW.docx` mục 7 "Đọc kết quả"):
- **PASS** = exit code 0 **và** summary ghi số test passed trong đúng phạm vi.
- **FAIL** = exit code khác 0 **hoặc** summary có test failed.
- **BLOCKED** = không chạy được vì thiếu service/account/data/quyền — **không** tính là PASS.
- Dòng chữ **đỏ (stderr)** không tự động là FAIL; phải đọc **summary + exit code**.

---

## Phần 3 — Mở và đọc report/evidence

Tất cả nằm trong thư mục Day30. Mở bằng Excel/VS Code, hoặc xem nhanh bằng PowerShell.

| Evidence | Đường dẫn | Ý nghĩa |
|---|---|---|
| Báo cáo tổng | `Final_Quality_Report_Tran_Quoc_Nguyen_REVIEW.docx` | Kết luận NO-GO/HOLD và lý do |
| Bảng lỗi/rủi ro | `Day30_Defect_Risk_Tracker_Tran_Quoc_Nguyen_REVIEW.xlsx` | 29 mục; bật bộ lọc cột "Nhóm phụ trách" |
| Gate bản cũ | `evidence\final_gate_lan2_2026-10-15\gate-timing.csv` và `...\logs\` | 13/13 PASS **của bản cũ 15/10** |
| Retest V2 (biên bản) | `evidence\retest_v2_2026-10-17_REVIEW.md` | Số 38 ca là **số tổng hợp**, không có bảng từng ca |
| Ảnh retest V2 | `evidence\retest_v2_2026-10-17\` (18 ảnh) | **Evidence chọn lọc**, không phải đủ 38 ca |
| Security | `evidence\security_retest_2026-10-15.md` | IDOR/upload, CORS, credential mặc định |

Xem nhanh bằng PowerShell (thư mục chạy = thư mục Day30):
- Biên bản V2: `Get-Content evidence\retest_v2_2026-10-17_REVIEW.md` → **mong đợi:** mở ra nội dung biên bản.
- Gate cũ: `Import-Csv evidence\final_gate_lan2_2026-10-15\gate-timing.csv | Format-Table` → **mong đợi:** bảng thời gian các gate.

> **Câu phải nói rõ:** kết quả **13/13 PASS là của BẢN CŨ ngày 15/10**, **không** chứng minh bản V2 hay bản hiện tại đã qua gate. Chưa chạy gate trên bản V2.

---

## Phần 4 — Giải thích một defect còn mở (ví dụ: DEF-050)

Nói đúng 4 ý: **Tái hiện → Mong đợi → Thực tế → Evidence** (lấy nguyên văn từ tracker, KHÔNG tự đổi trạng thái).

- **DEF-050 — API trả 500 khi field chuỗi nhận object** (Nhóm: BE · Severity: High · Trạng thái: OPEN).
- **Cách tái hiện:** gửi một object vào `coach/chat.message`, `quiz/start.category` hoặc `auth/login.email/password`.
- **Kết quả mong đợi:** HTTP **400** và thông báo schema rõ.
- **Kết quả thực tế (retest 17/10 V2):** cả login, quiz/start, coach/chat với object đều HTTP **500 E500_INTERNAL**.
- **Evidence:** `evidence\retest_v2_2026-10-17\TC_SEC_01_DEF-050_object_500.jpg` (và Day23 workbook: TC_COACH_03, TC_QUIZ_07, TC_AUTH_01).
- **Ảnh hưởng:** API không xử lý input sai an toàn → **chặn phát hành**.
- **Điều kiện đóng (retest PASS):** contract test từng endpoint trả 400, không lộ stack trace.

Ví dụ thứ hai nếu được hỏi thêm: **DEF-060 — check-syntax lộ đường dẫn máy chủ** (BE, High, OPEN); tái hiện `POST /exercises/check-syntax` với `code = print(`; thực tế lộ `C:\Users\...\Temp\...\<uuid>.py`; evidence `evidence\retest_v2_2026-10-17\TC_K69_07_DEF-060_check_syntax_lo_path.jpg`.

---

## Phần 5 — Thêm hoặc sửa một test nhỏ

Mục đích: cho thấy bộ test **mở rộng được**. Dùng test Frontend (vitest) cho nhanh.

**File ví dụ có thật:** `learning-hub\FE\src\common\authValidation.test.ts` (hoặc `classFormat.test.ts`, `kidMode.test.ts`).

1. **Chạy riêng đúng file đó** — thư mục `learning-hub\FE`:
   - `npm.cmd test -- src/common/authValidation.test.ts`
   - **Mục đích:** chỉ chạy một file để nhanh và dễ xem.
   - **Mong đợi:** summary chỉ liệt kê file này; exit code 0 nếu đạt.
2. **Thêm/sửa một test nhỏ:** mở file trên, thêm một khối `it('demo: ...', () => { expect(...).toBe(...) })` dùng **dữ liệu giả** (không dùng dữ liệu học viên thật). Hoặc tạo **file test tạm** `src/common/demo.test.ts` để trình bày rồi **xóa sau buổi demo**.
3. **Chạy lại file đó** (lệnh ở bước 1) để thấy test mới chạy.
4. **Chạy suite liên quan** — thư mục `learning-hub\FE`: `npm.cmd test` (toàn bộ unit test FE).

Backend tương tự (jest): file `*.spec.ts` trong `learning-hub\BE\src\...` (ví dụ `src\common\auth\jwt-secret.spec.ts`); chạy riêng: thư mục `learning-hub\BE` → `npm.cmd test -- jwt-secret`.

> **Nguyên tắc (QA Handbook mục 8):** viết expected trước; không sửa expected chỉ để biến FAIL thành PASS; dùng dữ liệu giả có dọn dẹp.
> **Lưu ý thật thà:** QA **chưa thêm** test nào vào source; đây là **hướng dẫn thao tác** cho người trình bày. Không commit/push file test tạm.

---

## Phần 6 — Bảo vệ kết luận NO-GO/HOLD

Nói theo bằng chứng, không cảm tính:

1. **Còn 8 lỗi/rủi ro mức High chưa đóng:** `DEF-033`, `DEF-035`, `DEF-050`, `DEF-018`, `DEF-060`, `RISK-06`, `RISK-07`, `RISK-08` — nguồn: tracker REVIEW (sheet Tổng quan: "High chưa đóng" = 8).
2. **Tracker:** 29 mục = **28 OPEN + 1 PENDING APPROVAL + 0 RESOLVED**. Mỗi High đều có evidence (ví dụ ảnh DEF-050, DEF-060 ở Phần 4).
3. **Gate 13/13 là của BẢN CŨ (15/10)** — không chứng minh bản V2 đã qua gate; **chưa chạy gate trên bản V2**.
4. **UAT chính thức: Chưa chạy.** Owner và Deadline nhiều mục: **"Chưa xác nhận"**. Dry-run người thứ hai: chưa có.
5. **Tiêu chí (trong tracker, sheet Tổng quan):** không phát hành khi còn High chưa đóng hoặc risk chưa được phê duyệt → **NO-GO/HOLD**.

**Khi sếp hỏi "khi nào GO được?"** → trả lời: khi (a) 8 High được sửa hoặc có phê duyệt chính thức + regression PASS, (b) chạy release gate **trên đúng bản V2** và lưu evidence cùng phiên bản, (c) hoàn tất UAT chính thức, (d) chốt Owner/Deadline. Trước khi đủ các điều kiện này, **giữ NO-GO/HOLD**.

---

## Nhắc an toàn khi demo

- Không chạy `seed`, `seed:clean`, reset dữ liệu, Docker, `git switch`, commit, push.
- Không xóa/ghi đè evidence cũ. File test tạm (nếu tạo) thì xóa sau, không commit.
- Thiếu MongoDB/tài khoản/dữ liệu/quyền → ghi **BLOCKED / Chưa xác nhận** và dùng evidence có sẵn, không bịa kết quả.
- Lab và rubric: theo `..\Tester_Resource_Pack\README.md`. Rubric chung (workbook) và cách chia điểm riêng của LAB-09 đang khác nhau; **người hướng dẫn tự chốt**, kịch bản này không quyết thay.
