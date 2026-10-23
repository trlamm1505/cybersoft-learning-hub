# ARCHITECTURE — CyberSoft Learning & Contest Hub v1.0

> Mô tả kiến trúc bản v1.0 đúng như mã nguồn hiện tại. Quyết định kiến trúc: [docs/decisions/](docs/decisions/).
> Chi tiết dữ liệu: [DATA.md](DATA.md) · API: [API.md](API.md) · Bảo mật: [SECURITY.md](SECURITY.md).

## 1. Sơ đồ tổng thể

```mermaid
flowchart LR
  subgraph Client["Trình duyệt (vùng không tin cậy)"]
    FE["React 19 + Vite SPA<br/>Kid Mode / Học viên / Teacher Studio / Admin Portal"]
  end

  subgraph Server["Máy chủ backend (vùng tin cậy)"]
    API["NestJS REST API /api<br/>Guards: JWT · Roles · CSRF · NoKidCode · Throttler · NoSQL-$ filter"]
    JQ["Judge Queue (in-process)<br/>giới hạn đồng thời + hàng đợi, phục hồi job kẹt"]
    AI["AI Service<br/>Coach · AI Tạo Đề · chấm Insight<br/>content safety · che PII"]
    SQL["SQLite in-memory<br/>(Data Lab)"]
  end

  subgraph Sandbox["Local Python Sandbox (vùng cô lập mức tiến trình)"]
    AST["AST Guard<br/>python -m ast"]
    PY["Subprocess python -I -B<br/>env tối giản · timeout · đo RAM · output ≤ 64 KB<br/>thư mục tạm ngoài repo"]
  end

  DB[("MongoDB 6+ / Atlas<br/>Mongoose")]
  GEM["Google Gemini API"]

  FE -- "HTTPS JSON + cookie httpOnly + x-csrf-token" --> API
  API --> DB
  API --> JQ --> AST --> PY
  API --> AI --> GEM
  API --> SQL
```

| Thành phần | Công nghệ                                           | Thư mục                                                                                                |
| ------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Frontend     | React 19, Vite, TanStack Query, CodeMirror 6, Blockly | `FE/src`                                                                                               |
| Backend      | NestJS, Mongoose                                      | `BE/src/modules-api/*`, `BE/src/common/*`                                                            |
| Máy chấm   | Judge queue + code runner local                       | `BE/src/modules-api/judge`, `BE/src/common/helper/code-runner.helper.ts`, `python-guard.helper.ts` |
| AI           | Gemini client, chế độ dự phòng khi thiếu key    | `BE/src/modules-api/coach`, `problem-generator`                                                      |
| Dữ liệu    | MongoDB (local hoặc Atlas)                           | `BE/src/modules-system/database/schemas`                                                               |
| Vận hành   | setup, seed, doctor, migrate, audit, E2E              | `scripts/`                                                                                             |

## 2. Luồng dữ liệu

### 2.1 Chấm code tuần tự trên `/playground`

```mermaid
sequenceDiagram
  autonumber
  actor HV as Học viên (K6-9 / K10-12)
  participant FE as FE /playground
  participant API as ExerciseController
  participant Q as JudgeQueue
  participant G as AST Guard
  participant P as Python subprocess
  participant DB as MongoDB

  HV->>FE: Mở /playground
  FE->>API: GET /api/exercises/playground
  API->>DB: lộ trình cố định (20 / 15 bài) + bài AC của học viên
  API-->>FE: danh sách #1..#N + trạng thái (đã xong / đang mở / khóa)
  HV->>FE: Nộp bài #k
  FE->>API: POST /api/exercises/:slug/submit
  API->>API: bài #k chưa mở khóa? → 403 E403_EXERCISE_LOCKED
  API->>DB: tạo submission QUEUED
  API->>Q: enqueue(submissionId)
  API-->>FE: submissionId
  Q->>DB: đọc bài + hiddenTestCases (bộ nhớ đệm theo updatedAt)
  Q->>G: kiểm tra AST (import/hàm/dunder nguy hiểm)
  alt Vi phạm
    G-->>Q: chặn trước khi chạy
  else Hợp lệ
    loop từng test case
      Q->>P: chạy với stdin = input (timeout, RAM)
      P-->>Q: stdout / stderr (đã che đường dẫn máy chủ)
      Q->>Q: so khớp với expectedOutput
    end
  end
  Q->>DB: status AC / WA / TLE / RE / CE, chỉ lưu kết quả test công khai cho học viên
  loop tối đa 120 giây
    FE->>API: GET /api/exercises/submissions/:id
  end
  API-->>FE: AC
  FE->>API: GET /api/exercises/playground
  API-->>FE: #k ✓ Đã hoàn thành, #(k+1) Đang mở
```

### 2.2 Ngân hàng đề (`bankOnly: true`) → Giao bài theo Ngày

```mermaid
sequenceDiagram
  autonumber
  actor GV as Giảng viên K6-9 / K10-12
  participant FE as Teacher Studio
  participant API as Exercise / QuizBank / ClassAssignments
  participant DB as MongoDB
  actor HV as Học viên trong lớp

  GV->>FE: Soạn bài Code hoặc câu Trắc nghiệm
  FE->>API: POST /api/exercises  hoặc  POST /api/teacher/question-bank/questions
  API->>DB: lưu với bankOnly: true, bankBand, authorId (schema ép bankOnly khi có authorId)
  Note over DB: Truy vấn /playground và /quiz công khai luôn loại bankOnly
  GV->>FE: Lớp học → Bài tập & Giao bài → Ngày n → Thêm bài vào ngày
  FE->>API: GET /api/teacher/class-assignments/catalog/exercises | catalog/questions
  FE->>API: POST /api/teacher/class-assignments/:classId (type, slug | questionIds, dueAt, maxPoints)
  API->>API: kiểm tra giảng viên phụ trách lớp (403 nếu không)
  API->>DB: class_assignments
  HV->>API: GET /api/student/classes/:classId/overview
  API-->>HV: Ngày 1..N, bài + hạn nộp (không bị khóa tuần tự Playground)
  HV->>API: nộp bài kèm assignmentId → hạn chót do máy chủ kiểm tra
  GV->>API: DELETE /api/teacher/question-bank/:slug khi bài đang được giao
  API-->>GV: 409 E409_BANK_EXERCISE_IN_USE
```

### 2.3 Thi trắc nghiệm `/quiz` 20 câu → hết giờ tự nộp, chấm GRADED

```mermaid
sequenceDiagram
  autonumber
  actor HV as Học viên
  participant FE as QuizTakingPage + QuizTimer
  participant API as QuizController
  participant DB as MongoDB

  HV->>FE: Chọn bộ đề (Python / HTML5 / CSS3)
  FE->>API: POST /api/quiz/start { category }
  API->>DB: còn lượt dở và còn giờ? → tiếp tục với thời gian còn lại thật
  API->>DB: không thì tạo quizattempt IN_PROGRESS (20 câu công khai, loại bankOnly)
  API-->>FE: câu hỏi (không kèm đáp án), mốc kết thúc
  FE->>FE: đếm theo mốc kết thúc (tab bị làm chậm vẫn đúng giờ)
  alt Học viên bấm Nộp
    FE->>API: POST /api/quiz/:attemptId/submit { answers }
  else Đồng hồ về 00:00
    FE->>API: POST /api/quiz/:attemptId/submit (đáp án đã chọn, câu trống = Bỏ trống), gọi đúng một lần
  end
  API->>API: answers sai kiểu → 400, giữ IN_PROGRESS
  API->>API: luyện tập tự do: không bao giờ EXPIRED, còn bài lớp (assignmentId) quá hạn → 403
  API->>DB: status GRADED, score
  FE->>API: GET /api/quiz/:attemptId/review
  API-->>FE: Đúng / Sai / Bỏ trống + giải thích
```

## 3. Trust boundaries

| Biên                          | Bên trong tin gì                                                                                                                                                  | Kiểm soát tại biên                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trình duyệt → API** | Không tin bất kỳ dữ liệu nào từ client: vai trò, khối, trạng thái khóa tuần tự, hạn chót, số lần rời màn hình, điểm đều tính ở máy chủ | Cookie `httpOnly` `SameSite=Strict`, CSRF Double Submit (`x-csrf-token`), JWT đối chiếu DB mỗi request (`sessionsRevokedAt`, `revoked_tokens`, trạng thái khóa), `@Roles`, `NoKidCodeGuard`, chặn NoSQL `$`, rate limit, CORS allowlist, header bảo mật                                    |
| **API → Sandbox**       | Code học viên là không tin cậy                                                                                                                                 | AST guard trước khi chạy; `python -I -B`; env tối giản; thư mục tạm ngoài repo; timeout + giới hạn RAM; output ≤ 64 KB; che đường dẫn máy chủ ở stdout/stderr. **Không phải cô lập cấp hệ điều hành** (xem [ADR-001](docs/decisions/ADR-001-local-python-sandbox-over-docker.md)) |
| **API → Gemini**        | Nội dung gửi đi là dữ liệu của học viên                                                                                                                    | Che email/SĐT/CCCD trước khi gửi, không gửi `userId`, bộ lọc nội dung an toàn trẻ em, guard prompt injection, chế độ dự phòng khi lỗi                                                                                                                                                             |
| **API → MongoDB**       | Truy vấn do server dựng                                                                                                                                           | Mongoose schema, `select: false` cho `hiddenTestCases`/`officialSolution`, kiểm tra quyền sở hữu/lớp ở tầng service                                                                                                                                                                                     |

## 4. Data stores & schemas cốt lõi

| Collection         | Vai trò                | Trường quan trọng                                                                                                                                                                                  |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`          | Tài khoản             | `email`, `password` (bcrypt), `role` (STUDENT/TEACHER/ADMIN), `ageGroup` (3-5/6-9/10-12/CAREER_ADULT, chỉ học viên), `status` (ACTIVE/LOCKED), `studentCode`, `sessionsRevokedAt`    |
| `classrooms`     | Lớp học               | `code` (CL-xxxxxx), `teacherId`, `teacherIds[]`, `studentIds[]`, `ageGroup`, `courseKey` (khóa người đi làm), `archived`                                                           |
| `exercises`      | Bài tập               | `slug`, `type`, `difficulty`, `testCases[]`, `hiddenTestCases[]` (select: false), `timeLimitMs`, `memoryLimitMb`, `bankOnly`, `bankBand`, `authorId`, `topic`, `orderInTopic` |
| `questions`      | Câu trắc nghiệm      | `content`, `codeSnippet`, `options[]`, `explanation`, `category`, `gradeBands[]`, `bankOnly`, `authorId`                                                                              |
| `submissions`    | Bài nộp code          | `exerciseId`, `userId`, `assignmentId`, `status` (QUEUED/RUNNING/AC/WA/TLE/RE/CE/FAILED), `results[]`, `attempts`, `outOfSequence`, `integrity`                                       |
| `contests`       | Cuộc thi               | `startTime`, `endTime`, `durationMinutes`, `problems[]`, `registrations[]`, `gradeBand`, `integrityEnabled`, `status`                                                                 |
| `revoked_tokens` | Token đã đăng xuất | `jti`, `expiresAt` (TTL tự xóa khi token hết hạn)                                                                                                                                             |

Đầy đủ: [DATA.md](DATA.md).

## 5. Failure modes & recovery

| Sự cố                                    | Hành vi hệ thống                                                                                                                                                            | Phục hồi                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Code học viên chạy quá giờ / quá RAM | Tiến trình bị dừng, trả **TLE** hoặc lỗi bộ nhớ; không làm treo API                                                                                           | Tự động; học viên sửa và nộp lại                                          |
| Bộ chạy code quá tải                   | Yêu cầu tương tác (Run, kiểm tra cú pháp) bị từ chối ngay khi hàng đợi vượt `CODE_RUNNER_MAX_QUEUE` (mặc định 50); bài Submit vẫn xếp hàng chờ chấm | Tăng `CODE_RUNNER_MAX_CONCURRENCY` / `CODE_RUNNER_MAX_QUEUE` theo số CPU     |
| Backend sập giữa lúc chấm              | Khi khởi động lại, `onModuleInit` quét job QUEUED/RUNNING bị kẹt và chấm lại; quá số lần thử thì **FAILED**                                             | Tự động (giả định một tiến trình)                                         |
| FE chờ chấm quá lâu                    | Poll tối đa 120 giây rồi báo hết thời gian chờ                                                                                                                         | Mở lại bài để xem kết quả cuối                                             |
| MongoDB mất kết nối                     | `GET /api/health` trả `"status":"degraded"`; các API trả lỗi                                                                                                           | Khôi phục Mongo; Mongoose tự kết nối lại                                     |
| Gemini rate limit (429) / không có key   | AI Coach và AI Tạo Đề chuyển chế độ dự phòng; Admin → Trạng thái API báo AI Gateway *Suy giảm*                                                                | Đợi quota hoặc cấu hình key mới ở Admin → Cấu hình (có hiệu lực ngay) |
| Dữ liệu lớp mồ côi                    | Thẻ *Submissions & Classes* báo *Suy giảm*                                                                                                                              | Gỡ nhãn ở `/admin/classes` hoặc `migrate-day29.js`                         |

Quy trình chi tiết: [docs/day30/OPERATIONS_RUNBOOK.md](docs/day30/OPERATIONS_RUNBOOK.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 6. Architecture Decision Records

| ADR                                                                                   | Quyết định                                                                  |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [ADR-001](docs/decisions/ADR-001-local-python-sandbox-over-docker.md)                  | Local Python Sandbox (subprocess + AST guard) thay cho Docker                  |
| [ADR-002](docs/decisions/ADR-002-question-bank-isolation-and-sequential-playground.md) | Cách ly Ngân hàng đề `bankOnly` và Code Playground mở khóa tuần tự |
| [ADR-003](docs/decisions/ADR-003-httponly-cookie-auth-and-age-band-isolation.md)       | Phiên cookie httpOnly + CSRF và phân tách theo nhóm tuổi                 |
