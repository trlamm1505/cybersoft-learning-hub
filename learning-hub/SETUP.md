# SETUP — Cài đặt và chạy CyberSoft Learning & Contest Hub v1.0

> Mục tiêu: một người mới clone repo chạy được hệ thống trên máy local trong **dưới 20 phút**, không cần Docker.
> Vận hành sâu hơn (backup, escalation): [docs/day30/OPERATIONS_RUNBOOK.md](docs/day30/OPERATIONS_RUNBOOK.md).

## 1. Prerequisites & phiên bản chính xác

| Phần mềm | Phiên bản | Kiểm tra | Ghi chú |
|---|---|---|---|
| Node.js | **20.12+** (khuyên dùng 22) | `node -v` | `package.json` khai báo `"engines": { "node": ">=20.12.0" }` |
| npm | đi kèm Node | `npm -v` | |
| Python | **3.10+** | `python --version` (Windows) / `python3 --version` | Local Code Runner chạy bài của học viên bằng Python trên máy |
| MongoDB | **6+** (Community) hoặc MongoDB Atlas | `mongosh --eval "db.version()"` | |
| Chrome / Edge | bản hiện hành | | Chỉ cần cho E2E (`npm run e2e:browser`) |

## 2. Cấu hình môi trường (`BE/.env`)

Hệ thống chỉ có **một** file cấu hình: `learning-hub/BE/.env`. Frontend không cần `.env` (mặc định gọi `http://localhost:3000/api`).

```bash
npm install && npm run setup   # (thư mục gốc repo) tự tạo BE/.env từ BE/.env.example, sinh JWT_SECRET và CONFIG_ENCRYPTION_KEY
```

Hoặc tạo tay: sao chép `learning-hub/BE/.env.example` thành `learning-hub/BE/.env` rồi điền. **Không commit `BE/.env`.**

| Nhóm | Biến | Ý nghĩa | Giá trị mẫu / cách lấy |
|---|---|---|---|
| 1. Server & CORS | `PORT` | Cổng backend | `3000` |
| | `FRONTEND_URL` | Địa chỉ web (CORS, link email) | `http://localhost:5173` |
| | `CORS_ORIGINS` | Origin FE bổ sung, phân cách dấu phẩy | để trống |
| 2. Database | `DATABASE_URL` | Chuỗi kết nối MongoDB | `mongodb://localhost:27017/cybersoft` hoặc chuỗi `mongodb+srv://...` của Atlas |
| 3. Auth & seed | `JWT_SECRET` | Khóa ký phiên, ≥ 32 byte, bắt buộc | `npm run setup` tự sinh |
| | `DEFAULT_SEED_PASSWORD` | Mật khẩu tài khoản mẫu | `123456` (chỉ máy dev/test) |
| | `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `DEV_MAIL_MOCK` | Gửi email đặt lại mật khẩu | để trống = tắt |
| 4. AI (Gemini) | `GEMINI_API_KEY` | AI Coach, AI Tạo Đề | https://aistudio.google.com/app/apikey; để trống = chế độ dự phòng |
| | `CONFIG_ENCRYPTION_KEY` | Mã hóa API key lưu trong Admin → Cấu hình (AES-256-GCM) | `npm run setup` tự sinh |
| 5. Code Runner | `PYTHON_BIN` | Đường dẫn Python dùng để chấm bài | để trống = tự tìm; ví dụ `C:/Python312/python.exe` |
| | `CODE_RUNNER_MAX_CONCURRENCY`, `CODE_RUNNER_MAX_QUEUE` | Số bài chạy đồng thời / số bài chờ tối đa | để trống = mặc định |
| 6. Nâng cao (Lab) | `SQL_ENGINE`, `DATA_SERVICE_BASE_URL`, `DATA_SERVICE_API_KEY`, `SANDBOX_DB_*`, `LAB_READER_PASSWORD` | Data Lab / AI Lab | để trống = chạy bằng dữ liệu tích hợp sẵn, SQLite trong backend |

> Giới hạn thời gian/bộ nhớ chấm bài **không** cấu hình bằng biến môi trường: mặc định 2000 ms / 128 MB và đặt riêng theo từng bài (`timeLimitMs`, `memoryLimitMb`).

## 3. Database & Master Seed

```bash
npm run seed         # nạp dữ liệu mẫu, chạy lại bao nhiêu lần cũng không nhân bản (idempotent)
npm run seed:clean   # bước 0: dọn mọi bản ghi mang cờ dữ liệu mẫu, rồi chạy lại 9 bước
```

| Bước | Nội dung |
|---|---|
| 0/9 (chỉ `--clean`) | Gỡ tài khoản, lớp, cuộc thi, bài nộp, Ngân hàng đề, bài giao mẫu; sửa toàn vẹn lớp (gỡ ID "ma"). **Không đụng dữ liệu thật** |
| 1/9 | Dữ liệu nền (bài Playground, 60 câu quiz công khai, cuộc thi gốc) nếu CSDL trống; 3 bộ đề `/quiz` đủ 20 câu cho Khối 6-9 và 10-12 |
| 2/9 | 10 tài khoản chuẩn (bảng dưới) |
| 3/9 | Lớp K3-5 / K6-9 / K10-12 / Tester QA / Data Lab / AI Lab, học viên, bài giao Ngày 1..5 |
| 4/9 | Bảng Vinh Danh K3-5, bé Dương Chí Việt 14 sao |
| 5/9 | 4 cuộc thi có bảng xếp hạng + 1 cuộc thi K6-9 có học viên out-tab |
| 6/9 | Người đi làm (cần backend đang chạy), hàng chờ Tester QA, dữ liệu của `teacher@gmail.com` |
| 7/9 | Giảng viên khối phụ trách lớp, Ngân hàng đề mỗi khối 3 bài code + 4 câu trắc nghiệm, tiến độ Playground mẫu |
| 8/9 | Lớp Lưu trữ mẫu `CL-ARCHIVED-69` |
| 9/9 | Phân loại khối bài Ngân hàng đề; chốt toàn vẹn (ID ma, `ageGroup` của GV/Admin, phone/bio của trẻ 3-5) |

**Tài khoản test chuẩn** (mật khẩu `123456`):

| Email | Vai trò | Lớp |
|---|---|---|
| `admin@gmail.com` | Quản trị viên | |
| `teacher@gmail.com` | Giảng viên tổng hợp | đồng phụ trách lớp mẫu, Tester QA, Data Lab, AI Lab |
| `teacher3-5@gmail.com` · `teacher6-9@gmail.com` · `teacher10-12@gmail.com` | Giảng viên theo khối | `CL-35KID01` · `CL-69PY01` · `CL-1012A1` |
| `lop3-5@gmail.com` · `lop6-9@gmail.com` · `lop10-12@gmail.com` | Học viên theo khối | `CL-35KID01` · `CL-69PY01` · `CL-1012A1` |
| `duongchiviet2004@gmail.com` | Học viên K3-5 (14 sao) | `CL-35KID01` |
| `student@gmail.com` | Học viên K10-12 | |

## 4. Quick start

```bash
# Cách 1 — một lệnh (thư mục gốc repo): chạy cả backend lẫn frontend
npm run dev

# Cách 2 — hai cửa sổ riêng
cd learning-hub/BE && npm run start:dev   # API  http://localhost:3000/api
cd learning-hub/FE && npm run dev         # Web  http://localhost:5173
```

Mở **http://localhost:5173** (dùng `localhost`, không dùng `127.0.0.1`, xem lỗi 4 bên dưới).

## 5. Verify installation

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"...","mongo":"connected"}

curl http://localhost:3000/api/health/dependencies
# {..., "pythonSandbox":"local"}

npm run doctor     # kiểm tra Node, Python, MongoDB, backend, web và chỉ cách sửa
```

Rồi đăng nhập `lop6-9@gmail.com` → `/playground` phải hiện **Tiến độ 2/20**, bài #3 đang mở.

## 6. Lỗi setup thực tế

### Lỗi 1 — Thiếu Python trên PATH
- **Symptom:** Run/Submit ở `/playground` báo lỗi hệ thống; `npm run doctor` báo "không tìm thấy Python 3"; trên Windows gõ `python` hiện "Python was not found; run without arguments to install from the Microsoft Store".
- **Cause:** Windows có *App execution alias* `python.exe` trỏ tới Microsoft Store, hoặc Python chưa vào PATH. Backend chạy code với biến môi trường tối giản nên không tự dò mọi vị trí.
- **Fix:** cài Python 3.10+ từ python.org (tick *Add python.exe to PATH*), tắt alias ở *Settings → Apps → Advanced app settings → App execution aliases*, hoặc đặt `PYTHON_BIN` trong `BE/.env`. Khởi động lại backend.
- **Prevention:** chạy `npm run doctor` sau khi cài; ghi `PYTHON_BIN` cố định trên máy có nhiều bản Python.

### Lỗi 2 — Backend tự restart liên tục (`File change detected`)
- **Symptom:** FE thỉnh thoảng văng `ERR_CONNECTION_REFUSED` khoảng 15 giây; log backend báo `File change detected` dù không ai sửa file.
- **Cause:** `nest start --watch` phản ứng với file bị chạm mà không đổi nội dung (IDE/antivirus trên Windows) hoặc file sinh ra khi test (`*.tsbuildinfo`, `dist`, `uploads`, `*.spec.ts`).
- **Fix:** `BE/tsconfig.build.json` đã có `watchOptions` dùng polling theo mtime và loại trừ `dist`, `uploads`, `docs`, `reports`, `*.tsbuildinfo`, `*.spec.ts`, `*.log`. Nếu vẫn gặp, kiểm tra khối này chưa bị sửa.
- **Prevention:** không ghi file tạm vào `BE/src`; buổi demo/thi chạy bản build: `npm --prefix learning-hub/BE run build && npm --prefix learning-hub/BE run start:prod`.

### Lỗi 3 — Cổng 3000 / 5173 bị chiếm
- **Symptom:** `EADDRINUSE: address already in use :::3000`, hoặc Vite tự chuyển sang `5174`.
- **Cause:** một tiến trình backend/frontend cũ chưa tắt, hoặc ứng dụng khác dùng cổng.
- **Fix:** Windows: `netstat -ano | findstr :3000` rồi `taskkill /PID <pid> /F`; macOS/Linux: `lsof -i :3000` rồi `kill <pid>`. Nếu buộc phải đổi cổng web, thêm địa chỉ mới vào `CORS_ORIGINS`.
- **Prevention:** tắt bằng Ctrl+C thay vì đóng cửa sổ terminal; chỉ chạy một `npm run dev`.

### Lỗi 4 — Lệch cookie phiên khi thử chéo địa chỉ local
- **Symptom:** đăng nhập thành công nhưng F5 lại về `/login`; hoặc lưu/nộp bài bị 403 trong khi xem vẫn được.
- **Cause:** phiên là cookie `httpOnly` `SameSite=Strict` kèm CSRF token. Mở web bằng `127.0.0.1:5173` trong khi API là `localhost:3000` là hai site khác nhau nên cookie không được gửi; cookie cũ còn sót sau khi đổi máy chủ làm lệch CSRF.
- **Fix:** dùng thống nhất `http://localhost:5173`; đăng xuất, xóa cookie của `localhost`, đăng nhập lại.
- **Prevention:** bookmark đúng địa chỉ; FE ở địa chỉ khác thì khai báo `CORS_ORIGINS`.

### Lỗi 5 — Dữ liệu mồ côi ("ID ma") sau khi sửa DB thủ công
- **Symptom:** Admin phân công giảng viên báo "Chỉ gán được tài khoản giảng viên đang hoạt động"; lớp hiện nhãn "Giảng viên không còn tồn tại"; thẻ *Submissions & Classes* ở Admin → Trạng thái API báo *Suy giảm*.
- **Cause:** xóa tài khoản trực tiếp trong MongoDB (Compass/mongosh) để lại `teacherId`/`teacherIds`/`studentIds` trỏ tới tài khoản không còn tồn tại.
- **Fix:** gỡ nhãn ma bằng nút × ở `/admin/classes`; hoặc chạy `cd learning-hub && node scripts/migrate-day29.js --dry-run` rồi chạy thật (dùng `scripts/lib/class-integrity.js`); với dữ liệu mẫu chỉ cần `npm run seed:clean`.
- **Prevention:** không xóa người dùng trực tiếp trong DB; dùng Admin Portal (khóa thay vì xóa).
