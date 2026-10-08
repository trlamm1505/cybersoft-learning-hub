# 📝 AI WORKLOG - CyberSoft Learning & Contest Hub

---

## 📌 NGÀY 26 - Integration với Data & AI Lab
- **Giai đoạn**: Tuần 6 - Tích hợp và phát hành
- **Kết quả chính**: Bài học tham chiếu được dataset/project version (Versioned integration, Reproducible assignments).

---

### 1. 🎯 Bài toán trước khi sử dụng AI
- **Bối cảnh**: Hệ thống Learning Hub (TTS 02) cần giao các bài học/bài tập mẫu sử dụng tài nguyên (Dataset SQL / Evaluation Set AI Lab) từ Data & AI Resource (TTS 01).
- **Thách thức**: 
  1. Khi phía Data & AI Lab nâng cấp hoặc phát hành phiên bản mới của dataset (`v1.0` -> `v2.0` -> `v3.0`), các bài học/bài tập đã giao cho học viên trước đó có nguy cơ bị đè hoặc trỏ sang version mới, làm mất tính tái lập (Reproducibility) và thay đổi ngữ cảnh chấm điểm.
  2. Chưa có Catalog API để Giáo viên (Teacher) duyệt và lựa chọn tài nguyên + phiên bản (`resource_id` & `resource_version`) khi biên soạn/giao bài.
  3. Chưa có cơ chế xử lý lỗi chặt chẽ khi giáo viên hoặc hệ thống gọi đến một version không tồn tại hoặc đã bị gỡ (`unavailable version`).

---

### 2. 🛠️ Công cụ AI đã sử dụng & Chỉ dẫn chính (Prompts)
- **Công cụ AI**: Antigravity Assistant (Google DeepMind - Gemini 3.6 Flash High).
- **Chỉ dẫn chính (System & User Directives)**:
  - *Chỉ dẫn 1*: Không được sửa đổi hoặc làm hỏng các logic chức năng cũ của dự án. Mọi thay đổi phải mang tính mở rộng phi phá vỡ (Non-breaking Extension).
  - *Chỉ dẫn 2*: Thiết lập Hợp đồng dữ liệu (Data Contract), tích hợp API Catalog (`GET /api/authoring/lessons/catalog/resources`) trả danh sách resource và danh sách version khả dụng (`available_versions`).
  - *Chỉ dẫn 3*: Bổ sung cơ chế khóa phiên bản (`assignedResourceVersion`) vào `Lesson` và `Exercise` schema ngay tại thời điểm tạo/giao bài (Assignment time).
  - *Chỉ dẫn 4*: Xử lý ngoại lệ khi chọn version không tồn tại (ném `BadRequestException` kèm danh sách version hợp lệ).
  - *Chỉ dẫn 5*: Viết bộ kiểm thử Contract Tests & Unit Tests độc lập để nghiệm thu 100% việc khóa version và xử lý lỗi.

---

### 3. 🔍 Code Diff & Quyết định thiết kế của Bản thân (Developer Decisions)

#### A. Quyết định kiến trúc & Schema:
- **Tạo `CatalogResourceItem` Interface** trong `BE/src/integration/dataset-contract.types.ts` để định nghĩa hợp đồng giữa Catalog và Authoring Service.
- **Thêm `resource_version` và `assignedResourceVersion`** vào `Lesson` (`lesson.schema.ts`) và `Exercise` (`exercise.schema.ts`).
  - *Quyết định*: `assignedResourceVersion` là snapshot bất biến (immutable version locked). Khi dataset gốc cập nhật `current_version`, `assignedResourceVersion` trên bài đã giao giữ nguyên `v1.0`, đảm bảo bài tập học viên đã làm luôn tái lập đúng dữ liệu tại thời điểm giao.

#### B. Thống kê Code Diff chính:
```diff
--- a/BE/src/integration/dataset-contract.types.ts
+++ b/BE/src/integration/dataset-contract.types.ts
+export interface CatalogResourceItem {
+  resource_id: string;
+  name: string;
+  type: 'DATASET' | 'EVALUATION_SET';
+  current_version: string;
+  available_versions: string[];
+  description?: string;
+  domain?: string;
+}

--- a/BE/src/integration/dataset-integration.service.ts
+++ b/BE/src/integration/dataset-integration.service.ts
+  async fetchResourceCatalog(): Promise<CatalogResourceItem[]> { ... }
+  async fetchResourceVersionContract(resourceId: string, requestedVersion?: string) {
+    // Validate availability of requestedVersion
+    if (!availableVersions.includes(targetVersion)) {
+      throw new BadRequestException(`Version "${targetVersion}" không tồn tại hoặc không khả dụng...`);
+    }
+    return { resource_id: resourceId, version: targetVersion, assignedResourceVersion: targetVersion };
+  }

--- a/BE/src/modules-api/authoring/authoring.service.ts
+++ b/BE/src/modules-api/authoring/authoring.service.ts
+    if (dto.resource_id) {
+      const contractInfo = await this.datasetIntegrationService.fetchResourceVersionContract(
+        dto.resource_id, dto.resource_version
+      );
+      resourceVersionInfo = {
+        resource_id: contractInfo.resource_id,
+        resource_version: contractInfo.version,
+        assignedResourceVersion: contractInfo.assignedResourceVersion,
+      };
+    }
```

---

### 4. 🧪 Chạy Test & Checklist Kiểm Thử Độc Lập

Đã chạy toàn bộ bộ kiểm thử tự động của Backend (`Jest Test Suite`).

#### Lệnh chạy 1 (Contract Tests cho Data & AI Lab Integration):
```bash
npm --prefix BE test -- dataset-integration.service.spec.ts
```
**Kết quả**:
```text
PASS src/integration/dataset-integration.service.spec.ts
  DatasetIntegrationService
    Day 26 - Integration với Data & AI Lab (Contract & Versioning)
      ✓ fetchResourceCatalog trả danh sách tài nguyên và các version hợp lệ
      ✓ fetchResourceVersionContract khóa đúng version khi version hợp lệ
      ✓ fetchResourceVersionContract mặc định lấy current_version khi không truyền version
      ✓ Xử lý unavailable version: báo lỗi BadRequestException khi truyền version không tồn tại (v9.9)
      ✓ Báo lỗi NotFoundException khi chọn resource không tồn tại trong Catalog

Test Suites: 1 passed, 1 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        0.839 s
```

#### Lệnh chạy 2 (Authoring Service Unit & Version Locking Tests):
```bash
npm --prefix BE test -- authoring.service.spec.ts
```
**Kết quả**:
```text
PASS src/modules-api/authoring/authoring.service.spec.ts
  AuthoringService
    Day 26 - Teacher chọn Resource & Version Locking
      ✓ createLesson lưu và khóa assignedResourceVersion từ Dataset Catalog
      ✓ createLesson ném BadRequestException nếu chọn version không tồn tại (v9.9)

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Time:        0.966 s
```

#### Lệnh chạy 3 (Toàn bộ Backend Suite Test Pass 100%):
```bash
npm --prefix BE test
```
**Kết quả**:
```text
Test Suites: 73 passed, 73 total
Tests:       2 skipped, 931 passed, 933 total
Snapshots:   0 total
Time:        6.345 s
```

---

### 5. 💡 Giải Thích Độc Lập Đoạn Code & Điều Chỉnh Thực Tế (Không Sao Chép Nguyên AI)

#### A. Giải thích thuật toán khóa phiên bản (`fetchResourceVersionContract`):
- Khi Giáo viên gọi `createLesson` hoặc `updateLesson` với `resource_id` (ví dụ `ds-retail-ecommerce-sales-v1`) và tùy chọn `resource_version` (ví dụ `v1.1`):
- Hàm `fetchResourceVersionContract` tra cứu danh sách `available_versions` trong Catalog.
- Nếu `requestedVersion` nằm trong mảng hợp lệ (`['v1.0', 'v1.1']`), hàm sẽ trả về `assignedResourceVersion = 'v1.1'`.
- Nếu `requestedVersion` không khả dụng (ví dụ `v9.9`), hệ thống sẽ ném ngay lỗi HTTP `400 Bad Request` với thông báo chi tiết danh sách phiên bản hỗ trợ.

#### B. Thay đổi nhỏ tự điều chỉnh thực tế:
- **Tự điều chỉnh**: Ban đầu AI chỉ truyền `resource_id` vào `Lesson` schema. Tôi đã chủ động cập nhật cả hàm `syncPublishedCodingLessonToExerciseBank` trong `AuthoringService` để khi bài học được xuất bản (Publish), thông tin `resource_id`, `resource_version` và `assignedResourceVersion` sẽ tự động được đồng bộ sang collection `exercises`. Giúp các module khác (như Playground, SQL Grader, AI Coach) đọc trực tiếp từ `Exercise` mà không bị thất thoát thông tin snapshot version.

---

### 📋 Checklist Điều Kiện Nghiệm Thu (Acceptance Criteria Status)
- [x] **Resource update không làm đổi bài đã giao**: `assignedResourceVersion` lưu cứng snapshot tại thời điểm assignment.
- [x] **Xử lý unavailable version**: Bật cờ kiểm tra version hợp lệ, ném `BadRequestException` khi chọn version không tồn tại (`v9.9`).
- [x] **Contract test pass**: 100% (73/73 test suites, 931 tests passed).
