# Quy chế xếp hạng (Contest Scoring Specification)

Áp dụng cho mọi cuộc thi (Contest) trong hệ thống. Các số liệu trong tài liệu này là **nguồn tham
chiếu**, khớp 1:1 với `LeaderboardService.getConfig()`
(`learning-hub/BE/src/modules-api/leaderboard/leaderboard.service.ts`) — nơi backend thực sự dùng
để tính leaderboard. Nếu thay đổi số liệu, phải sửa ở đó trước, tài liệu này chỉ mô tả lại.

Thí sinh cũng có thể xem quy chế này (được render động, không hardcode số) qua:
`GET /contests/:id/leaderboard/rules`.

## 1. Cách tính điểm mỗi bài

Mỗi bài (`ContestProblem`) có điểm tối đa `points`. Khi nộp bài:

- **Coding**: điểm = `round(passedCount / totalTestCases * points)`.
- **Quiz**: điểm = `round(correctCount / totalQuestions * points)`.

Việc chấm điểm diễn ra **hoàn toàn ở server** (`ContestSubmissionService.submit`), thí sinh không
bao giờ nhận được đáp án đúng hoặc nội dung test case ẩn trước khi nộp bài
(`GET /contests/:id/problems/:slug` chỉ trả nội dung đã được ẩn thông tin).

## 2. Nộp lại nhiều lần — lấy điểm cao nhất (best-of-N)

Với mỗi bài, nếu thí sinh nộp nhiều lần, hệ thống lấy **điểm cao nhất** trong các lần nộp hợp lệ
(không tính các lần nộp muộn) — không lấy lần nộp cuối cùng. Nếu có nhiều lần nộp cùng đạt điểm cao
nhất, thời điểm tính là lần nộp **sớm nhất** trong số đó.

## 3. Xếp hạng (Ranking) — kiểu ICPC

Sắp xếp theo thứ tự:

1. **Tổng điểm** (`totalScore`) — giảm dần.
2. Nếu bằng điểm: **(Thời gian + Phạt)** — tăng dần (ai nhỏ hơn xếp trên).
3. Nếu vẫn bằng: theo `studentId` tăng dần (đảm bảo kết quả xác định, không phụ thuộc thứ tự dữ liệu).

### Thời gian (`timeMinutes`)

Chỉ tính cho các bài thí sinh đã đạt **điểm tối đa** (full-solve): là số phút từ lúc contest bắt đầu
đến thời điểm nộp bài đạt điểm tối đa đó. Các bài chưa đạt điểm tối đa (partial/chưa làm) không cộng
vào thời gian — chỉ cộng vào tổng điểm.

### Phạt (`penaltyMinutes`)

**+20 phút** cho mỗi lần nộp **không đạt điểm tối đa** xảy ra **trước** lần nộp đạt điểm tối đa, trên
cùng một bài. Chỉ áp dụng cho các bài đã full-solve (giống thời gian, bài chưa full-solve không bị
phạt theo cách này — dù vẫn không được tính thời gian/phạt, điểm số của các lần nộp thấp hơn vẫn
không được cộng gộp, chỉ điểm cao nhất được dùng).

## 4. Nộp muộn (Late submit)

Bài nộp sau `contest.endTime` (theo **giờ máy chủ**, không tin giờ máy khách) bị:

- **Từ chối tính điểm/không đưa vào leaderboard** — hoàn toàn không ảnh hưởng đến rank.
- **Vẫn được ghi log** (`ContestSubmission.isLate = true`) để đối soát/audit khi cần kiểm tra sau này.

## 5. Đóng băng bảng xếp hạng (Freeze)

Trong **N phút cuối** trước khi contest kết thúc, bảng xếp hạng công khai (live) **tự động đóng
băng**: giữ nguyên kết quả tại thời điểm bắt đầu đóng băng (`freezeAt`), dù có thí sinh nộp bài mới
trong khoảng này thì hạng vẫn không thay đổi trên màn hình.

```
freezeMinutes = min(60, round(durationMinutes * 0.3))
```

(có thể override theo từng contest qua field `Contest.freezeMinutes` nếu giáo viên cấu hình riêng).

Ngay khi contest chuyển trạng thái **ENDED** (theo giờ máy chủ), bảng xếp hạng **tự động hiện đầy đủ
và chính xác** — không cần hành động thủ công để "mở khóa" kết quả cuối.

## 6. Tính tái lập được (Reproducibility)

Leaderboard **không lưu rank/điểm đã tính sẵn** ở bất kỳ đâu trong database. Mỗi lần gọi
`GET /contests/:id/leaderboard`, hệ thống luôn tính lại từ đầu, đọc trực tiếp từ log
`ContestSubmission` — vì vậy kết quả luôn có thể tái tính (replay) và kiểm chứng lại độc lập bất cứ
lúc nào từ chính log gốc.

## 7. Không lộ thông tin riêng tư (Private submission)

Endpoint leaderboard không bao giờ trả về: mã nguồn (`code`), câu trả lời quiz cụ thể
(`quizAnswers`), nội dung đáp án đúng, hay chi tiết bài làm của người khác — chỉ trả
`rank/studentId/studentName/totalScore/timeMinutes/penaltyMinutes/solvedCount`.
