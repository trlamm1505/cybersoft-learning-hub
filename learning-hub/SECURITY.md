# SECURITY — Mô hình bảo mật CyberSoft Learning & Contest Hub v1.0

> Kiểm chứng bằng `audit-day29-security-privacy.js` (33/33), `audit-day30.js` (45/45), `audit-teacher-security.js` (40/40) và các spec Jest liên quan.
> Giới hạn đã biết: [docs/day30/RELEASE_NOTES_v1.0.md](docs/day30/RELEASE_NOTES_v1.0.md#3-known-issues--giới-hạn-kỹ-thuật-có-chủ-đích). Báo lỗ hổng: liên hệ owner Learning Hub qua kênh nội bộ, không mở issue công khai.

## 1. Assets & threat model

| Tài sản | Mối đe dọa | Kiểm soát chính |
|---|---|---|
| **Test ẩn, lời giải chính thức, đáp án trắc nghiệm** | Học viên đọc qua API để gian lận | `hiddenTestCases`, `officialSolution` là `select: false` trong schema; API học viên không trả đáp án/`authorId`; kết quả chấm chỉ nêu test công khai; AI Coach có eval chống rò rỉ lời giải |
| **Máy chủ chạy code** | Học viên gửi mã độc (đọc file, gọi lệnh hệ thống, mở mạng, fork bomb, in output khổng lồ) | Local Sandbox: AST guard + `python -I -B` + env tối giản + timeout + giới hạn RAM + output ≤ 64 KB + che đường dẫn (mục 4) |
| **Mã nguồn & bài nộp của học viên** | Học viên/giảng viên khác xem trộm (IDOR) | Kiểm tra quyền sở hữu và lớp ở **tầng service**; giảng viên chỉ thấy lớp được phân công (403); không nhận `userId` từ client ở API học viên |
| **Dữ liệu trẻ em** | Thu thập thừa, lộ PII cho AI/log | Không lưu `phone`/`bio` của Khối 3–5; che PII trước khi gửi AI và trong log; TTL lịch sử AI Coach 90 ngày (mục 3, 5) |
| **Tài khoản & phiên** | Đánh cắp token, CSRF, dò mật khẩu, leo thang đặc quyền | Cookie httpOnly + CSRF, JWT đối chiếu DB mỗi request, thu hồi token, rate limit, không ai tạo/nâng được Admin (mục 2) |
| **Điểm số & liêm chính thi** | Sửa điểm ở client, nộp sau hạn, nhảy cóc | Mọi luật (hạn chót, khóa tuần tự, bộ đếm rời màn hình, điểm) tính ở máy chủ |
| **Secrets** | Lộ `JWT_SECRET`, API key | Chỉ ở `BE/.env` (không commit); `JWT_SECRET` bắt buộc, không có khóa mặc định; Gemini key lưu DB được mã hóa AES-256-GCM |

## 2. Authentication & Authorization

- **Phiên:** sau đăng nhập, backend đặt cookie `access_token` **httpOnly**, `SameSite=Strict`, `Secure` khi production, cùng cookie `csrf_token`. JavaScript không đọc được token. Script/API vẫn có thể dùng `Authorization: Bearer`.
- **CSRF Guard (Double Submit Cookie):** mọi request đổi dữ liệu đi kèm cookie phiên phải gửi header `x-csrf-token` trùng cookie `csrf_token`.
- **JWT đối chiếu DB ở mọi request:** `JwtStrategy` đọc lại vai trò và trạng thái từ `users`; tài khoản `LOCKED` hoặc token phát hành trước `sessionsRevokedAt` (đặt khi đặt lại mật khẩu/thu hồi quyền) bị từ chối ngay.
- **Thu hồi token khi đăng xuất:** lưu `jti` vào collection `revoked_tokens` có **TTL index** trên `expiresAt` (MongoDB tự xóa khi token hết hạn); dùng chung được giữa nhiều instance. Token cũ dùng lại sau logout → 401.
- **RBAC:** 3 vai trò `ADMIN`, `TEACHER`, `STUDENT` qua `@Roles`. Không endpoint nào cho tạo hoặc gán quyền `ADMIN` (403); không khóa được Admin hoạt động cuối cùng; không tự khóa/đổi vai trò của chính mình.
- **Rate limit:** mặc định 600 request/phút; đăng nhập 5/phút/email; quên mật khẩu 5/phút; AI Coach 10/phút; chạy code 30/phút; nộp bài cuộc thi 15/phút.
- **Mật khẩu:** bcrypt; đăng ký/đặt lại yêu cầu 8–32 ký tự có hoa, thường, số, ký tự đặc biệt.
- **Khác:** header bảo mật trên mọi phản hồi (CSP, `X-Content-Type-Options: nosniff`, chống nhúng khung, không lộ `X-Powered-By`); CORS theo danh sách cho phép, không phản chiếu origin lạ kèm credentials; chặn toàn cục payload chứa toán tử NoSQL `$`; payload sai kiểu trả 400 thay vì 500 (DEF-050).

## 3. Phân lập dữ liệu theo độ tuổi

| Quy tắc | Cơ chế |
|---|---|
| Học sinh Khối 3–5 chỉ dùng Góc Học Tập Blockly | FE đưa mọi đường dẫn khác về `/block-puzzle`; BE `NoKidCodeGuard` trả **403 `E403_KID_NO_CODE_QUIZ`** khi gọi quiz, chạy/nộp code, kiểm tra cú pháp, AI Coach |
| Khối 3–5 không lưu `phone`/`bio` | Hồ sơ không ghi hai trường này; seed và `migrate-day29.js` xóa nếu còn |
| Học viên chỉ thấy bài đúng khối | Bộ lọc khối ở API bài tập và Playground; gọi thẳng slug bài khác khối bị chặn |
| Cuộc thi theo khối | `gradeBand` ALL / 6-9 / 10-12; học sinh khác khối xem được danh sách nhưng đăng ký/vào thi/nộp bài nhận 403 |
| Đồng ý của phụ huynh | Dữ liệu phiên usability của **mọi nhóm vị thành niên** (3-5, 6-9, 10-12) bị từ chối 400 nếu thiếu `parentalConsentVerified`. Đồng ý điều khoản khi đăng ký **chưa** lưu bằng chứng ở máy chủ (Known Issue K-04) |
| Đổi vai trò / đổi khối | Lên giảng viên: xóa `ageGroup` và rút khỏi `studentIds` mọi lớp; đổi khối: rút khỏi lớp khác khối |

Bảng Vinh Danh Kid Mode vẫn hiện họ tên đầy đủ cho học viên đã đăng nhập — chấp nhận cho môi trường nội bộ, phải xử lý trước khi public (K-06).

## 4. Code execution sandbox

Luồng: `JudgeQueue` → **AST Guard** → **subprocess Python** (`BE/src/common/helper/python-guard.helper.ts`, `code-runner.helper.ts`).

1. **AST Guard** dùng module `ast` chuẩn của Python phân tích cú pháp thật (không dùng regex) và chặn trước khi chạy:
   - import các module: `os`, `subprocess`, `socket`, `shutil`, `pathlib`, `importlib`, `ctypes`, `multiprocessing`, `threading`, `signal`, `resource`, `pty`, `platform`, `inspect`, `gc`, `urllib`, `http`, `ftplib`, `telnetlib`, `ssl`, `marshal`, `pickle`, `code`, `codeop`, `runpy`;
   - gọi hàm `eval`, `exec`, `compile`, `__import__`, `open`;
   - truy cập thuộc tính dunder để "leo" ra ngoài (`__subclasses__`, `__globals__`, `__builtins__`...).
   - `sys` **không** bị chặn có chủ đích: bài cần `sys.stdin` để đọc dữ liệu.
2. **Thực thi:** `python -I -B -X utf8` (chế độ isolated, không ghi `.pyc`), biến môi trường tối giản, file tạm trong `os.tmpdir()` ngoài repo, timeout theo bài (mặc định 2000 ms), giới hạn RAM theo bài (mặc định 128 MB), stdout/stderr cắt ở 64 KB.
3. **Che đường dẫn máy chủ:** `scrubServerPaths` áp cho **cả stderr lẫn stdout** — `print(__file__)` hay traceback không còn lộ `C:\Users\...\Temp\...` (**DEF-060**, DEF-034); AI Coach phân tích lỗi cũng nhận bản đã che (DEF-035).
4. **Giới hạn đồng thời:** `CODE_RUNNER_MAX_CONCURRENCY`, `CODE_RUNNER_MAX_QUEUE`.

> **Giới hạn (Known Issue K-01):** đây là cô lập ở mức tiến trình, **không phải** sandbox cấp hệ điều hành (namespace/cgroup/container). Lý do và lộ trình chuyển sang gVisor/MicroVM: [ADR-001](docs/decisions/ADR-001-local-python-sandbox-over-docker.md).

## 5. AI safety

| Kiểm soát | Mô tả |
|---|---|
| **Child Safety Guardrail (DEF-033)** | `coach-content-safety.ts` chặn nội dung nguy hiểm/không phù hợp trẻ em (tiếng Việt có dấu, không dấu, tiếng Anh); trả `policyBlocked: true` kèm câu từ chối thân thiện |
| **Chống prompt injection** | `coach-injection-guard.ts`; 20 case prompt injection trong Coach Eval Harness phải có safety > 0 |
| **Chống lộ lời giải** | `coach-policy.ts`; Coach Eval Harness 100 case yêu cầu leakage score = 1 cho mọi case |
| **PII scrubbing** | `maskPii` che **email, số điện thoại Việt Nam (0xx / +84 / 84), số CCCD 12 số / CMND 9 số** trong tin nhắn học sinh trước khi gửi Gemini (áp dụng ở `coach.service.ts` và `coach-gemini.client.ts`, cả lịch sử hội thoại gửi kèm). Ngoài AI, `PiiScrubInterceptor` loại các trường định danh nhạy cảm khỏi phản hồi trả cho vai trò giảng viên |
| **Không gửi định danh** | Ngữ cảnh gửi AI không chứa `userId`/email |
| **Lưu trữ có hạn** | `coach_messages` có TTL **90 ngày** |
| **AI Tạo Đề** | Output mong đợi lấy từ chạy thật lời giải mẫu; chỉ lưu khi pass 100% test; giáo viên duyệt (human-in-the-loop) |
| **Dự phòng** | Thiếu key/lỗi 429 thì dùng chế độ dự phòng, không làm hỏng luồng học |
