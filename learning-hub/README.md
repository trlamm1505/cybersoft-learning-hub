# CyberSoft Learning & Contest Hub

Hệ thống học lập trình và chấm bài trực tuyến cho học sinh K3-5 / K6-9 / K10-12 (Monorepo: `FE` React + Vite, `BE` NestJS + MongoDB).
Chạy 100% trên máy: **Node.js + Python + MongoDB**, không cần Docker. Phiên bản hiện tại: **v1.0** ([Release Notes](docs/day30/RELEASE_NOTES_v1.0.md)).

Tài liệu đầy đủ: xem [Documentation Index](#documentation-index) ở cuối trang.

## Cần cài sẵn

| Phần mềm | Phiên bản | Ghi chú |
|---|---|---|
| [Node.js](https://nodejs.org) | 20.12+ (khuyên dùng 22) | |
| [Python](https://www.python.org/downloads/) | 3.10+ | chạy bài code của học viên; máy có nhiều bản thì đặt `PYTHON_BIN` trong `BE/.env` |
| [MongoDB Community](https://www.mongodb.com/try/download/community) | 6+ | hoặc dùng MongoDB Atlas: dán chuỗi kết nối vào `DATABASE_URL` trong `BE/.env` |

## Chạy dự án (3 bước, từ thư mục gốc của repo)

```bash
npm install && npm run setup   # 1. cài thư viện root/BE/FE, tạo BE/.env (tự sinh JWT_SECRET), kiểm tra Python và MongoDB
npm run seed                   # 2. nạp dữ liệu mẫu chuẩn (chạy lại bao nhiêu lần cũng không nhân bản)
npm run dev                    # 3. chạy backend http://localhost:3000/api + web http://localhost:5173
```

Mở **http://localhost:5173** và đăng nhập bằng một tài khoản bên dưới.

## Tài khoản mẫu

Mật khẩu mọi tài khoản = `DEFAULT_SEED_PASSWORD` trong `BE/.env` (mặc định `123456`, **chỉ dùng cho máy dev/test**).

| Email | Vai trò | Lớp |
|---|---|---|
| `admin@gmail.com` | Quản trị viên | |
| `teacher@gmail.com` | Giảng viên | đồng phụ trách các lớp mẫu |
| `teacher3-5@gmail.com` | Giảng viên Khối 3-5 | `CL-35KID01` |
| `teacher6-9@gmail.com` | Giảng viên Khối 6-9 | `CL-69PY01` |
| `teacher10-12@gmail.com` | Giảng viên Khối 10-12 | `CL-1012A1` |
| `lop3-5@gmail.com` | Học viên K3-5 | `CL-35KID01` |
| `lop6-9@gmail.com` | Học viên K6-9 | `CL-69PY01` |
| `lop10-12@gmail.com` | Học viên K10-12 | `CL-1012A1` |
| `duongchiviet2004@gmail.com` | Học viên K3-5 (14 sao Block Puzzle) | `CL-35KID01` |
| `student@gmail.com` | Học viên K10-12 | |

Code Playground (Khối 6-9: 20 bài, Khối 10-12: 15 bài) là lộ trình cố định #1..#N, mở khóa tuần tự: `lop6-9` đã xong #1-#2 (bài #3 đang mở), `lop10-12` đã xong #1.
Bài do Giảng viên/Admin tạo luôn nằm trong Ngân hàng đề, không bao giờ vào Playground.

Dữ liệu mẫu còn có: bài Playground có test case, Ngân hàng đề (bài code + câu trắc nghiệm) Khối 6-9 / 10-12, bài giao theo Ngày 1..5,
cuộc thi mẫu có học viên rời tab (out-tab). `npm run seed:clean` dọn sạch dữ liệu mẫu rồi nạp lại (không đụng dữ liệu thật).

## Cấu hình (`BE/.env`)

Một file duy nhất, tạo từ [BE/.env.example](BE/.env.example) (có chú thích từng nhóm: Server & CORS → Database → Auth/JWT → Gemini → Code Runner).
Không commit `BE/.env`. Để trống `GEMINI_API_KEY` thì AI Coach dùng chế độ dự phòng; lấy key miễn phí tại https://aistudio.google.com/app/apikey.

## Lệnh hay dùng

```bash
npm run doctor                 # (thư mục gốc) kiểm tra Node, Python, MongoDB, backend, web và chỉ cách sửa
npm run seed:clean             # (thư mục gốc) dọn dữ liệu mẫu và nạp lại

cd learning-hub
npm --prefix BE test           # test backend (Jest)
npm --prefix FE test           # test frontend (Vitest)
npm run test:scripts           # test các script dựng môi trường (node --test)
npm run e2e:browser            # E2E bằng Chrome thật: đăng nhập từng vai trò, click, bắt lỗi console/mạng (cần BE+FE đang chạy; xong chạy lại npm run seed:clean)
```

Gặp lỗi: chạy `npm run doctor` trước. Hay gặp nhất là MongoDB chưa bật (trong `learning-hub`: `npm run check:mongo`) hoặc không tìm thấy Python (đặt `PYTHON_BIN`). Các lỗi khác và cách xử lý: [Runbook mục 6](docs/day30/OPERATIONS_RUNBOOK.md#6-troubleshooting--7-lỗi-thực-tế).

---

## Ghi công mã nguồn mở

- **Mê Cung Blockly** (Block Puzzle) chuyển thể từ trò chơi "Maze" của [Blockly Games](https://github.com/blockly-games/blockly-games), Copyright 2012 Google LLC, giấy phép Apache-2.0. Hình nhân vật, mảnh bản đồ và âm thắng/thua là tệp gốc, đặt ở `FE/public/games/blockly-maze/` kèm `NOTICE.txt` và bản giấy phép. Khối lệnh dùng thư viện [Blockly](https://github.com/google/blockly) (npm `blockly`, Apache-2.0).
- **Rùa Vẽ Hình**, **Chim Tìm Tổ**, **Ghép Hình Con Vật** chuyển thể từ "Turtle", "Bird", "Puzzle" của Blockly Games (cùng giấy phép Apache-2.0). Tệp hình/âm thanh gốc đặt ở `FE/public/games/blockly-{turtle,bird,puzzle}/` kèm `NOTICE.txt`; hình con vật của Puzzle là biểu tượng vẽ SVG, không dùng ảnh gốc.

---

## Documentation Index

| Tài liệu | Nội dung |
|---|---|
| [SETUP.md](SETUP.md) | Phiên bản yêu cầu, cấu hình `BE/.env`, master seed, quick start, kiểm tra cài đặt, 5 lỗi setup thực tế |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Sơ đồ kiến trúc, 3 luồng dữ liệu (Mermaid), trust boundaries, schema cốt lõi, failure modes |
| [API.md](API.md) | Danh mục REST API theo vai trò, mã lỗi |
| [DATA.md](DATA.md) | Từ điển dữ liệu, toàn vẹn Lớp – Giảng viên – Học viên, lưu trữ và PII |
| [SECURITY.md](SECURITY.md) | Threat model, xác thực/phân quyền, phân lập theo tuổi, sandbox, AI safety |
| [TESTING.md](TESTING.md) | Test pyramid, số liệu, fixtures, quality gates |
| [EVALUATION.md](EVALUATION.md) | Đánh giá AI Tạo Đề, AI Coach (100 case), hiệu năng chấm bài |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Build, healthcheck, migration, phát hành, rollback |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 7 sự cố thực tế: nguyên nhân, bản sửa, phòng ngừa |
| [CHANGELOG.md](CHANGELOG.md) | Nhật ký thay đổi, bản 1.0.0 |
| [ADR-001](docs/decisions/ADR-001-local-python-sandbox-over-docker.md) · [ADR-002](docs/decisions/ADR-002-question-bank-isolation-and-sequential-playground.md) · [ADR-003](docs/decisions/ADR-003-httponly-cookie-auth-and-age-band-isolation.md) | Quyết định kiến trúc: Local Sandbox thay Docker · Ngân hàng đề & Playground tuần tự · Cookie httpOnly & phân tách theo tuổi |
| [Cẩm nang Admin & Giảng viên](docs/day30/ADMIN_TEACHER_HANDBOOK.md) | Hướng dẫn từng bước Admin Portal và Teacher Studio, kèm 33 ảnh màn hình thật |
| [Operations Runbook](docs/day30/OPERATIONS_RUNBOOK.md) | Vận hành: health, backup/restore, seed, escalation L1/L2/L3 |
| [Release Notes v1.0](docs/day30/RELEASE_NOTES_v1.0.md) | Tính năng bàn giao, chỉ số chất lượng, Known Issues |
| [Roadmap 60 ngày (Ngày 31–90)](docs/day30/ROADMAP_60D.md) | Kế hoạch v2.0 Enterprise theo từng ngày |
| [AI Work Log](AI_WORKLOG.md) | Prompt chỉ đạo, quyết định chấp nhận/bác bỏ, lỗi AI và cách phát hiện |
