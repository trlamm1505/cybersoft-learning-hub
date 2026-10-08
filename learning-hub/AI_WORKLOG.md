# 📝 AI WORKLOG - CyberSoft Learning & Contest Hub

---

## 📌 NGÀY 27 - Integration với QA/Eval Harness
- **Giai đoạn**: Tuần 6 - Tích hợp và phát hành
- **Kết quả chính**: Release được kiểm tra tự động (Automated Release Engineering, Quality Gates, Cross-team QA).

---

### 1. 🎯 Bài toán trước khi sử dụng AI
- **Bối cảnh**: Hệ thống chuẩn bị đóng gói phát hành (Release) tích hợp với QA/Eval Harness của toàn dự án.
- **Thách thức**:
  1. Chưa có pipeline kiểm thử tự động tập trung (Release Pipeline) để chạy tự động E2E smoke tests, kiểm tra tính toàn vẹn của nội dung (Content checks) và kiểm tra sự sụt giảm chất lượng của AI Coach (AI Coach regression).
  2. Chưa có cơ chế cổng kiểm soát chất lượng (Quality Gate Enforcer) chặn release nếu các critical tests thất bại, hoặc chặn bỏ qua lỗi (bypass) nếu người vận hành không nhập lý do giải trình cụ thể (`bypassReason`).
  3. Chưa có báo cáo nghiệm thu tự động (Artifact Test Report) xuất ra dạng `docs/day27/test-report.json` và `reports/release-report.json`.

---

### 2. 🛠️ Công cụ AI đã sử dụng & Chỉ dẫn chính (Prompts)
- **Công cụ AI**: Antigravity Assistant (Google DeepMind - Gemini 3.6 Flash High).
- **Chỉ dẫn chính (System & User Directives)**:
  - *Chỉ dẫn 1*: Không được sửa đổi hoặc làm hỏng các logic chức năng cũ của dự án. Mọi thay đổi phải mang tính mở rộng phi phá vỡ (Non-breaking Extension).
  - *Chỉ dẫn 2*: Xây dựng Release Pipeline script (`scripts/release-pipeline.js`) và thêm lệnh `npm run release:check` vào `package.json`.
  - *Chỉ dẫn 3*: Tạo module `qa-harness` ở Backend (`QaHarnessService`, `QaHarnessController`, `QaHarnessModule`) kết nối với `GET /api/qa/dashboard` và `POST /api/qa/evaluate-gate`.
  - *Chỉ dẫn 4*: Áp dụng bộ quy tắc Quality Gate Bypass Guard: Bắt buộc `bypassReason` không được rỗng nếu muốn tạm thời bỏ qua testId không critical.
  - *Chỉ dẫn 5*: Tạo giao diện `QualityDashboard.tsx` cho FE và viết bộ unit test tự động nghiệm thu 100%.

---

### 3. 🔍 Code Diff & Quyết định thiết kế của Bản thân (Developer Decisions)

#### A. Quyết định kiến trúc & Quality Gate Rules:
- **Tạo Module QA Harness độc lập**: `BE/src/modules-api/qa-harness` quản lý các bộ kiểm thử smoke/content và cổng Quality Gate.
- **Quy tắc Bypass ngặt nghèo (Quality Gate Bypass Guard)**:
  - Với Critical Tests: BẮT BỘC PASS 100%, KHÔNG CHO PHÉP BYPASS dù có lý do hay không.
  - Với Non-critical Tests: Cho phép bypass nhưng bắt buộc field `bypassReason` phải có dữ liệu giải trình thực tế (non-empty string). Nếu không có lý do -> ném `BadRequestException` chặn release lập tức.

#### B. Thống kê Code Diff chính:
```diff
--- a/package.json
+++ b/package.json
+    "release:check": "node scripts/release-pipeline.js",

--- a/BE/src/app.module.ts
+++ b/BE/src/app.module.ts
+import { QaHarnessModule } from './modules-api/qa-harness/qa-harness.module';
+    QaHarnessModule,

--- a/BE/src/modules-api/qa-harness/qa-harness.service.ts
+++ b/BE/src/modules-api/qa-harness/qa-harness.service.ts
+    if (bypassReq && bypassReq.bypass) {
+      const reason = (bypassReq.bypassReason || '').trim();
+      if (!reason) {
+        throw new BadRequestException(`Quality Gate từ chối Bypass: Bắt buộc phải ghi rõ lý do (bypassReason)...`);
+      }
+    }
```

---

### 4. 🧪 Chạy Test & Checklist Kiểm Thử Độc Lập

Đã chạy kiểm thử tự động độc lập ở cả tầng Pipeline lẫn Suite Test Jest của Backend.

#### Lệnh chạy 1 (Release Pipeline Full Automation Check):
```bash
npm run release:check
```
**Kết quả**:
```text
🚀 CyberSoft Learning Hub: Release Pipeline & Quality Gate Runner (Day 27)

1/4 Kiểm tra Môi trường & Hạ tầng
  ✔ Node.js v24.15.0
  ✔ Docker 29.4.3

2/4 Chạy E2E Smoke Tests & Content Integrity Checks
  ✔ Quality Gate Suite & QA Harness: 100% Passed

3/4 Chạy AI Coach Regression Suite
  ✔ AI Coach Regression Evaluation: Passed

4/4 Tạo Artifact Release Report & Xuất Checklist
  ✔ Đã xuất báo cáo tại: docs\day27\test-report.json
  ✔ Đã xuất báo cáo tại: reports\release-report.json

✔ RELEASE PIPELINE PASSED: Đủ điều kiện phát hành!
```

#### Lệnh chạy 2 (QA Harness Unit & Quality Gate Bypass Tests):
```bash
npm --prefix BE test -- qa-harness.service.spec.ts
```
**Kết quả**:
```text
PASS src/modules-api/qa-harness/qa-harness.service.spec.ts
  QaHarnessService (Day 27 - Quality Gate & Eval Harness)
    ✓ getQualityDashboard trả về báo cáo chất lượng hệ thống đầy đủ (7 ms)
    ✓ evaluateQualityGate vượt qua khi tất cả kiểm thử sẵn sàng (2 ms)
    ✓ từ chối Bypass nếu không ghi rõ lý do (bypassReason) cho testId không critical (1 ms)
    ✓ chấp nhận Bypass khi ghi đầy đủ lý do (bypassReason) (2 ms)
    ✓ từ chối Bypass và chặn Release nếu test bị thất bại là Critical Test (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

#### Lệnh chạy 3 (Toàn bộ Backend Test Suite Pass 100%):
```bash
npm --prefix BE test
```
**Kết quả**:
```text
Test Suites: 74 passed, 74 total
Tests:       2 skipped, 936 passed, 938 total
Snapshots:   0 total
Time:        6.787 s
```

---

### 5. 💡 Giải Thích Độc Lập Đoạn Code & Điều Chỉnh Thực Tế (Không Sao Chép Nguyên AI)

#### A. Giải thích thuật toán kiểm soát Quality Gate (`evaluateQualityGate`):
- Hệ thống duyệt qua tất cả các bài kiểm thử trong `QA_SHARED_FIXTURES`.
- Đối với bài test thất bại: nếu là `isCritical === true`, hệ thống ném `BadRequestException` từ chối phát hành ngay lập tức (không chấp nhận bypass).
- Nếu là bài test không critical, hệ thống kiểm tra yêu cầu bypass trong `dto.bypasses`. Nếu người dùng bật `bypass: true` nhưng để rỗng `bypassReason`, hệ thống chủ động ném `BadRequestException` từ chối bypass. Chỉ khi cung cấp lý do hợp lệ, bài test mới được đánh dấu trạng thái `BYPASSED` và thông qua Quality Gate.

#### B. Thay đổi nhỏ tự điều chỉnh thực tế:
- **Tự điều chỉnh**: Khi thiết kế script `scripts/release-pipeline.js`, AI ban đầu gọi thẳng lệnh `npm` bằng `spawnSync('npm', ...)`. Trên Windows, lệnh `npm` là script `.cmd` nên gặp lỗi không tìm thấy file thực thi. Tôi đã tự điều chỉnh hàm `runNpm` để phát hiện hệ điều hành Windows (`process.platform === 'win32'`) và gọi qua `cmd.exe /c npm.cmd`, giúp script chạy mượt mà 100% trên cả Windows và Linux/macOS.

---

### 🗣️ Trình bày 3 phút: AI đề xuất gì, điểm nào chưa đủ và cách kiểm chứng/chỉnh sửa

1. **AI Đề xuất gì?**
   - AI đề xuất tạo module `qa-harness` cơ bản và script pipeline chạy jest tests.
2. **Điểm nào chưa đủ / chưa tối ưu?**
   - AI chưa xử lý tính tương thích môi trường chạy script trên Windows (lỗi `spawnSync npm` không có đuôi `.cmd`).
   - AI chỉ lưu báo cáo vào bộ nhớ tạm mà chưa tự tạo thư mục và ghi file artifact nghiệm thu `docs/day27/test-report.json` và `reports/release-report.json`.
3. **Tôi đã kiểm chứng và chỉnh sửa ra sao?**
   - Bổ sung hàm `runNpm` tương thích đa nền tảng (Windows + Linux) cho script `release-pipeline.js`.
   - Bổ sung logic tự động tạo thư mục và xuất file báo cáo JSON nghiệm thu artifact.
   - Thêm bộ test case trong `qa-harness.service.spec.ts` kiểm thử trực tiếp hành vi ném `BadRequestException` khi bypass thiếu lý do giải trình.

---

### 📋 Checklist Điều Kiện Nghiệm Thu (Acceptance Criteria Status)
- [x] **Critical tests bắt buộc pass**: Enforced trong `evaluateQualityGate` & `release-pipeline.js`.
- [x] **Có artifact test report**: Đã xuất tự động tại `docs/day27/test-report.json` và `reports/release-report.json`.
- [x] **Không cho bypass không ghi lý do**: Kiểm tra `bypassReason.trim() === ''` và ném `BadRequestException`.
