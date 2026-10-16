# Ngày 24: Integrity và chống gian lận cơ bản — Tóm tắt triển khai

## 1. Mục tiêu và nguyên tắc

Hệ thống chỉ thu thập **tín hiệu khách quan** để hỗ trợ giảng viên giám sát, không kết luận thay con người.

- **Không tự động kết tội:** không trừ điểm, không hủy bài, không tự kết luận gian lận. Gắn cờ chỉ có nghĩa là "giảng viên nên xem".
- **Thu thập tối thiểu, minh bạch:** học viên được thông báo rõ ngay đầu trang làm bài. Không ghi phím bấm, không ghi nội dung chỉnh sửa, không ghi trang nào mà học viên chuyển sang.
- **Giảng viên quyết định cuối cùng (human-in-the-loop):** mọi kết luận do giảng viên đặt, bắt buộc có lý do.

## 2. Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Backend | NestJS 11, TypeScript, Mongoose (MongoDB), Jest |
| Frontend | React + TypeScript, Vite, Tailwind (biến CSS của dự án), lucide-react, Vitest |
| Phân quyền | JwtAuthGuard + RolesGuard (`@Roles('TEACHER','ADMIN')`) có sẵn |

Phạm vi: bài code Python nộp qua judge backend (`POST /exercises/:slug/submit`, collection `submissions`).

## 3. Nguyên lý hoạt động

1. Học viên mở bài tập → FE bắt đầu một phiên ghi nhận (`IntegrityTracker`) và hiện thông báo minh bạch.
2. Trong lúc làm: tracker ghi mốc chỉnh sửa thưa (mỗi 30 giây một mốc, chỉ lưu thời điểm và độ dài mã) và thời điểm rời/quay lại tab (`visibilitychange`).
3. Khi nộp: FE gửi kèm payload tối thiểu. BE (`IntegrityService.evaluate`) làm sạch payload, so khớp mã với bài của học viên khác cùng bài tập, dựng `integrity` và lưu cùng bài nộp.
4. Bài vẫn vào hàng đợi chấm như bình thường; `integrity` không ảnh hưởng điểm hay trạng thái chấm.
5. Bài có cờ vào hàng chờ của giảng viên (`NEEDS_REVIEW`). Giảng viên xem chi tiết, đối chiếu mã và lưu kết luận (`REVIEWED`).

Nếu bước so khớp lỗi (ví dụ DB lỗi), việc nộp bài vẫn thành công với tín hiệu bình thường.

## 4. Cấu trúc dữ liệu (`submissions.integrity`)

```
integrity: {
  timeline: {
    startedAt, submittedAt,            // submittedAt luôn là giờ server
    editMarks: [{ at, charCount }],    // tối đa 50, không lưu nội dung
    totalSeconds, activeSeconds        // active = total - thời gian rời màn hình
  },
  focusEvents: [{ leftAt, returnedAt, awaySeconds }],   // tối đa 50
  focusSummary: { count, totalAwaySeconds },
  similarity: { score /*0-1*/, matchedSubmissionId?, matchedUserId?, flagged },
  flag: 'NONE' | 'REVIEW',
  reasons: string[],                   // viết cho người đọc, nêu rõ "chưa kết luận"
  reviewStatus: 'NORMAL' | 'NEEDS_REVIEW' | 'REVIEWED',
  decision?: 'CLEARED' | 'CONCERN' | 'FOLLOW_UP',
  reviewNote?, reviewedBy?, reviewedAt?
}
```

Chỉ mục: `{ 'integrity.reviewStatus': 1, createdAt: -1 }` (hàng chờ) và `{ exerciseId: 1, createdAt: -1 }` (so khớp).

Làm sạch payload từ client: ngày không hợp lệ bị bỏ; `startedAt` ở tương lai bị kéo về giờ nộp; sự kiện quay lại trước khi rời bị bỏ; một lần rời tối đa 6 giờ; tổng thời gian rời không vượt tổng thời lượng.

## 5. Thuật toán so khớp tương đồng

File: `BE/src/modules-api/integrity/code-similarity.ts`.

1. **Chuẩn hóa** (`normalizeCode`): bỏ docstring `"""`/`'''`, chú thích `#` (không nhầm `#` trong chuỗi), dòng trống, khoảng trắng thừa; chuỗi ký tự thay bằng placeholder; số thay bằng `0`. Giữ nguyên tên biến.
2. **Loại mã khung** (`stripStarter`): bỏ các dòng trùng với `starterCode` của bài tập.
3. **So khớp** (`compareCode`): tách token, lập tập 3-gram token, tính **Jaccard** = |giao| / |hợp|. Mỗi bên dưới 20 token thì không so (`comparable=false`, điểm 0).
4. **Chọn bài giống nhất** (`findBestMatch`): chỉ so với bài của học viên khác, tối đa 200 bài gần nhất của cùng bài tập.
5. **Gắn cờ:** tương đồng từ 80% mới đặt cờ; điểm số không được dùng để đổi điểm bài.

Ngưỡng cấu hình trong `integrity.config.ts`:

| Tham số | Giá trị |
|---|---|
| similarityThreshold | 0.8 |
| minTokensForSimilarity | 20 |
| shingleSize | 3 |
| maxComparisons | 200 |
| focusLeaveCountThreshold | 5 lần |
| focusAwaySecondsThreshold | 180 giây |
| maxFocusEvents / maxEditMarks | 50 / 50 |

Cờ rời màn hình cần **cả hai** điều kiện (từ 5 lần **và** tổng từ 180 giây) để giảm gắn cờ nhầm.

## 6. API

| Method | Đường dẫn | Quyền | Chức năng |
|---|---|---|---|
| POST | `/exercises/:slug/submit` | đăng nhập | nhận `{ code, integrity? }`, lưu tín hiệu |
| GET | `/teacher/integrity/queue?status=` | TEACHER/ADMIN | hàng chờ (mặc định `NEEDS_REVIEW`; `REVIEWED`, `NORMAL`) |
| GET | `/teacher/integrity/:id` | TEACHER/ADMIN | chi tiết, mã bài và bài bị so khớp |
| PUT | `/teacher/integrity/:id/review` | TEACHER/ADMIN | lưu `{ decision, note }` |

Duyệt bài chỉ ghi vào các trường `integrity.*`, không đụng `status`, điểm hay mã. Học viên nhận 403 ở các route `/teacher/integrity`. API judge đọc bài của học viên không trả trường `integrity`.

## 7. Giao diện

- **Học viên** (`CodePlaygroundPage` + `IntegrityNotice`): thông báo ở đầu trang nói rõ ghi nhận gì, dùng để làm gì, và không tự trừ điểm/hủy bài/kết luận gian lận.
- **Giảng viên** (`/teacher/integrity`, mục "Xem xét trung thực"): bảng gồm học viên, bài tập, thao tác thực tế, số lần rời màn hình, tương đồng mã, trạng thái. Modal chi tiết có dòng thời gian, hai đoạn mã cạnh nhau và form kết luận (ba lựa chọn + nhận xét bắt buộc). Nhãn dùng ngôn từ trung lập ("Cần xem xét", không dùng "gian lận").

## 8. Kiểm thử

| | Test mới | Tổng | Kết quả |
|---|---|---|---|
| Backend (Jest) | 34 | 644 (58 suite) | xanh |
| Frontend (Vitest) | 12 | 28 (7 file) | xanh |

Typecheck (`tsc --noEmit`, `tsc -b`) sạch; `nest build` và `vite build` thành công; `oxlint` không có cảnh báo mới.

### Ca nhận diện nhầm (false-positive)

| Ca | Kỳ vọng | Test |
|---|---|---|
| Chuyển tab 2 lần, mỗi lần 20 giây (dưới ngưỡng) | không gắn cờ | `integrity-signals.spec.ts` |
| 8 lần chuyển tab nhưng mỗi lần 5 giây (tổng 40 giây) | không gắn cờ | `integrity-signals.spec.ts` |
| 1 lần rời 10 phút (họp, mất mạng) | không gắn cờ | `integrity-signals.spec.ts` |
| Nộp rất nhanh (8 giây) cho bài dễ | chỉ ghi mốc, không cờ, không lý do, không kết luận | `integrity-signals.spec.ts` |
| Tương đồng 79% (dưới ngưỡng) | không gắn cờ | `integrity-signals.spec.ts` |
| Hai bài chỉ giống nhau ở mã khung, phần tự viết ngắn | điểm 0, không bài so khớp | `code-similarity.spec.ts` |
| Khung dài giống hệt, phần tự viết khác nhau | điểm < 0.2 nhờ loại khung (khi không loại thì > 0.3) | `code-similarity.spec.ts` |
| Nộp lại nhiều lần của cùng học viên | không so với chính mình | `code-similarity.spec.ts` |
| Bài chép thật khác định dạng/chú thích | vẫn ≥ 0.8 và được phát hiện | `code-similarity.spec.ts` |

### Các luồng khác được bao phủ
- Lưu tín hiệu đúng cấu trúc, chặn payload phình to, bỏ dữ liệu client sai.
- Nộp bài có cờ nhưng vẫn `QUEUED`, không điểm (`exercise.service.spec.ts`).
- Duyệt: từ chối kết luận lạ hoặc thiếu lý do; chỉ ghi `integrity.*`; 404 khi id sai hoặc bài không có tín hiệu.
- Hàng chờ: giá trị `status` lạ bị đưa về `NEEDS_REVIEW` (không cho truy vấn tùy ý).
- Phân quyền: hàng chờ chỉ TEACHER/ADMIN; học viên không xem bài người khác; API judge không lộ `integrity`.
- FE: tracker thu thập tối thiểu, giới hạn số lượng, đóng sự kiện khi nộp lúc đang rời tab; định dạng và sắp xếp hàng chờ.

## 9. Danh sách file

### Tạo mới
Backend (`BE/src/modules-api/integrity/`):
- `integrity.config.ts`, `code-similarity.ts`, `integrity-signals.ts`
- `integrity.service.ts`, `integrity.controller.ts`, `integrity.module.ts`
- `code-similarity.spec.ts`, `integrity-signals.spec.ts`, `integrity.service.spec.ts`

Frontend (`FE/src/`):
- `types/integrity.ts`
- `axios/integrityApi.ts`
- `common/integrityTracker.ts`, `common/integrityTracker.test.ts`
- `components/IntegrityNotice.tsx`
- `pages/TeacherIntegrityQueuePage.tsx`
- `pages/integrityFormat.ts`, `pages/integrityFormat.test.ts`

### Chỉnh sửa
- Backend: `app.module.ts`, `modules-system/database/schemas/submission.schema.ts`, `modules-api/exercise/exercise.module.ts`, `exercise.service.ts`, `exercise.service.spec.ts`, `dto/submit-code.dto.ts`
- Frontend: `App.tsx`, `components/Header.tsx`, `axios/exerciseApi.ts`, `pages/CodePlaygroundPage.tsx`

## 10. Giới hạn hiện tại
- Chỉ áp dụng cho bài code Python nộp qua judge backend; bài giảng viên soạn (chấm phía client) và bài DA/AI Lab chưa có tín hiệu.
- Bài nộp trước ngày 24 không có `integrity` nên không xuất hiện trong hàng chờ.
- Tương đồng dựa trên n-gram token: đổi tên biến hàng loạt có thể làm giảm điểm; việc đánh giá do giảng viên thực hiện.

## 11. Cách kiểm thử thủ công
1. Chạy MongoDB, `npm run dev:api` (cổng 3000) và `npm run dev:web` trong `learning-hub/`.
2. Đăng nhập học viên A, mở Code Playground, chọn một bài, thấy thông báo minh bạch, nộp một lời giải.
3. Đăng nhập học viên B, nộp lời giải gần giống hệt (đổi chú thích, khoảng trắng) cho cùng bài.
4. Để bài của B có thêm cờ rời màn hình: chuyển tab ít nhất 5 lần, tổng từ 3 phút, rồi nộp.
5. Đăng nhập giảng viên, vào "Xem xét trung thực": thấy bài của B, mở chi tiết, so mã, lưu kết luận, kiểm tra bài chuyển sang tab "Đã duyệt".
6. Kiểm tra false-positive: học viên C chỉ chuyển tab 1–2 lần và nộp bài khác biệt thì không xuất hiện trong hàng chờ.
