# DEPLOYMENT — Triển khai CyberSoft Learning & Contest Hub v1.0

> v1.0 được triển khai dạng **máy chủ tự quản** (một máy chạy backend Node + Python, frontend tĩnh, MongoDB/Atlas). Chưa có CD tự động lên cloud — đó là Giai đoạn 1 của [Roadmap](docs/day30/ROADMAP_60D.md). Cài môi trường dev: [SETUP.md](SETUP.md). Vận hành: [docs/day30/OPERATIONS_RUNBOOK.md](docs/day30/OPERATIONS_RUNBOOK.md).

## 1. Môi trường & yêu cầu runtime

| Thành phần | Yêu cầu |
|---|---|
| Node.js | 20.12+ (khuyên dùng 22 LTS) |
| Python | 3.10+, cài trên **cùng máy** với backend (máy chấm gọi subprocess); đặt `PYTHON_BIN` cố định |
| MongoDB | 6+ hoặc MongoDB Atlas (bật Network Access cho IP máy chủ) |
| Reverse proxy | HTTPS bắt buộc ở production (cookie phiên có cờ `Secure` khi `NODE_ENV=production`) |
| Cấu hình | `BE/.env` riêng cho từng môi trường: `JWT_SECRET` và `CONFIG_ENCRYPTION_KEY` mới, `DEFAULT_SEED_PASSWORD` khác `123456`, `FRONTEND_URL`/`CORS_ORIGINS` đúng domain |

## 2. Build pipeline

```bash
git checkout <tag-hoặc-commit-phát-hành>
npm install && npm run setup            # cài root/BE/FE; giữ BE/.env nếu đã có

# Kiểm tra trước khi build (quality gates — xem TESTING.md)
cd learning-hub
npm --prefix BE test
npm --prefix FE test -- --run

# Build
npm --prefix BE run build               # nest build → BE/dist (kèm typecheck)
npm --prefix FE run build               # tsc -b && vite build → FE/dist (file tĩnh)
```

| Artefact | Nội dung | Cách chạy |
|---|---|---|
| `BE/dist` | API NestJS đã biên dịch | `NODE_ENV=production npm --prefix BE run start:prod` (`node dist/main`), nên chạy dưới trình quản lý tiến trình (pm2/systemd) để tự khởi động lại |
| `FE/dist` | SPA tĩnh | Phục vụ qua web server (nginx...) với fallback mọi đường dẫn về `index.html`; gọi API qua cùng domain hoặc domain được khai báo trong `CORS_ORIGINS` |

Không dùng `npm run dev` / `start:dev` (chế độ watch) cho production hay buổi thi.

## 3. Healthcheck & monitoring

| Endpoint | Quyền | Trả về | Dùng cho |
|---|---|---|---|
| `GET /api/health` | công khai | `{"status":"ok"\|"degraded","timestamp","mongo":"connected"\|...}` | Liveness/uptime check — `degraded` khi mất MongoDB |
| `GET /api/health/dependencies` | công khai | nguồn dữ liệu Lab (`dataService`), Postgres sandbox (`sandboxDb`, chỉ khi `SQL_ENGINE=postgres`), chế độ chạy code (`"pythonSandbox":"local"`) | Chẩn đoán phụ thuộc |
| `GET /api/admin/health-check` | ADMIN, 1 lần / 10 giây | 5 cụm: Auth & Database, SQLite, AI Gateway (Gemini), **Submissions & Classes** (số bài nộp, số lớp, lớp thiếu giảng viên / giảng viên không tồn tại hoặc bị khóa), Contests (cuộc thi đang diễn ra + bảng xếp hạng) | Kiểm tra sâu trước buổi thi; giao diện ở Admin → Trạng thái API |

Theo dõi tối thiểu: uptime của `/api/health` mỗi 1 phút; log backend (lỗi 5xx, cảnh báo Gemini 429, job chấm FAILED); dung lượng đĩa thư mục tạm. Mọi thao tác quản trị nằm ở Admin → Nhật ký (`audit_logs`).

## 4. Di chuyển schema & dữ liệu

MongoDB không có migration schema bắt buộc; thay đổi dữ liệu được làm bằng **script idempotent có `--dry-run`**:

```bash
cd learning-hub
# 1) Sao lưu trước (Runbook mục 3)
mongodump --uri="$DATABASE_URL" --gzip --archive="backups/pre-deploy-$(date +%Y%m%d-%H%M).gz"
# 2) Xem trước rồi áp dụng
node scripts/migrate-day29.js --dry-run && node scripts/migrate-day29.js   # ID ma ở lớp, ageGroup GV/Admin, phone/bio trẻ 3-5, TTL index
node scripts/migrate-day31.js --dry-run && node scripts/migrate-day31.js   # gắn cờ tiến độ Playground nhảy cóc (có --revert)
```

**Seed dữ liệu:**
- Môi trường demo/staging: `npm run seed:clean` (bước 0 dọn + 9 bước, idempotent, chỉ đụng bản ghi mang cờ dữ liệu mẫu).
- Production dùng thật: **không** chạy `npm run seed`; nếu đã lỡ nạp mẫu thì chạy `npm run seed:clean` một lần để dọn rồi không seed lại. Tài khoản Admin đầu tiên tạo theo quy trình nội bộ, đổi mật khẩu ngay.

## 5. Quy trình phát hành

1. Chốt commit, đánh tag (ví dụ `v1.0.0`).
2. Quality gates xanh (TESTING.md mục 3): Jest 1635, Vitest 431, node --test 31, 5 audit, E2E 107/107.
3. Sao lưu CSDL.
4. Build BE/FE (mục 2), chạy migration (mục 4).
5. Khởi động lại backend, triển khai `FE/dist`.
6. Smoke test: `curl /api/health` → `ok`; Admin → Trạng thái API 5 cụm xanh; đăng nhập 1 tài khoản mỗi vai trò.

## 6. Rollback

| Tình huống | Cách làm |
|---|---|
| Lỗi chỉ ở mã (dữ liệu chưa bị migration đổi) | `git checkout <tag-trước>` → `npm install` → build lại BE/FE → khởi động lại → smoke test |
| Migration đã chạy và gây lỗi dữ liệu | Dừng backend → `mongorestore --uri="$DATABASE_URL" --gzip --archive=<bản-sao-lưu-trước-deploy> --drop` → triển khai lại bản trước → smoke test. Với `migrate-day31.js` có thể dùng `--revert` thay vì restore |
| Chỉ cấu hình sai (`.env`) | Sửa `BE/.env`, khởi động lại backend. Gemini key có thể đổi ngay ở Admin → Cấu hình, không cần restart |

Quyết định rollback production thuộc cấp L3 theo Escalation Path ([Runbook mục 5](docs/day30/OPERATIONS_RUNBOOK.md#5-escalation-path--ma-trận-phân-cấp-sự-cố)).
