# AI Work Log — Ngày 02: Thiết kế kiến trúc Learning & Contest Hub

**Người thực hiện:** Dương Chí Việt
**Ngày:** 2026-08-27
**Nhánh làm việc:** `feature/learning-hub-day2`

---

## 1. Công cụ đã dùng

| Hạng mục      | Chi tiết                                                                                                                                   |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Công cụ       | Claude Code (CLI)                                                                                                                           |
| Model           | Claude Sonnet 5                                                                                                                             |
| Phạm vi quyền | Đọc/ghi file trong`docs/`, chạy lệnh Git Bash cục bộ để kiểm chứng (grep, wc -l) — không có quyền mạng, không push/deploy |

---

## 2. Context đã nạp

- 4 file kết quả Ngày 01: `Persona_cards.md`, `User_Journey_Map.md`, `mvp_backlog.md`, `AI_WORKLOG.md` — để giữ nhất quán tech stack đã chốt (Next.js Monolith, Prisma, Postgres/SQLite, Piston/Judge0, sql.js, Gemini API), không cho đổi sang stack khác.
- Đề bài Ngày 02: 3 ràng buộc bắt buộc (submission không chạy code trên App Server, có audit log, phân biệt MVP/Production Hardening) và 3 bàn giao (architecture diagram, ADR-001, API/module map).
- Không có dữ liệu nhạy cảm trong context — toàn bộ là tài liệu thiết kế của dự án học tập, không chứa credential hay dữ liệu người dùng thật.

---

## 3. Prompt chính

- Yêu cầu đọc và tóm tắt lại 4 file kết quả Ngày 01 trước, chỉ ra những quyết định đã chốt (tech stack, persona, backlog) để không đề xuất lại từ đầu hay đổi hướng so với Ngày 01.
- Thiết kế kiến trúc phân tầng Client → App Server → Database/Queue → Sandbox Worker/AI Service; luồng Submission phải đi qua Message Queue, Sandbox Worker cô lập tài nguyên (CPU/RAM/Timeout), tuyệt đối không cho App Server thực thi code người dùng.
- Thiết kế Audit Log cụ thể (schema + danh sách action bắt buộc ghi log), không mô tả chung chung.
- ADR-001 theo đúng định dạng chuẩn (Status/Context/Decision/Consequences), có bảng phân biệt rõ MVP (30 ngày) và Production Hardening.
- API/module map: ranh giới 5 module (Auth, Course/Lesson, Submission/Judge, Contest/Leaderboard, AI Coach) và bảng endpoint kèm Role Access.
- Yêu cầu bổ sung sau bản nháp đầu: bỏ toàn bộ icon/emoji, văn phong chuyên nghiệp thuần Việt, loại các từ ngữ không phù hợp còn sót từ Ngày 01 (ví dụ "Clan/Bang hội").

---

## 4. File đã tạo

| File                                           | Nội dung                                                                                                                                          |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture/architecture.md`          | Kiến trúc phân tầng (Mermaid graph), sequence diagram luồng Submission & Judge, thiết kế Audit Log, ánh xạ tầng kiến trúc với persona |
| `docs/adr/ADR-001-tech-stack-and-sandbox.md` | ADR chuẩn: lý do chọn stack, chiến lược Sandbox/Worker cô lập, bảng MVP vs Production Hardening                                           |
| `docs/architecture/api_module_map.md`        | Ranh giới 5 module (kèm graph), bảng API endpoint MVP với Role Access                                                                          |

---

## 5. Điểm AI làm chưa tối ưu và cách tôi kiểm thử

| Vấn đề                                                                                                                                                                                                                                                                                           | Cách phát hiện                                                                                                                                         | Cách xử lý                                                                                                                                                                                                           |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sơ đồ kiến trúc ban đầu vẽ bằng ASCII box-drawing, bị lệch cột khi hiển thị trên VS Code do ký tự tiếng Việt có dấu không cùng độ rộng với ký tự Latin trong font monospace                                                                                            | Mở file trực tiếp trong editor, quan sát bảng bị vỡ layout                                                                                         | Yêu cầu chuyển sang Mermaid graph — render đồ họa thật, không phụ thuộc font                                                                                                                                 |
| Một số bảng markdown bị dính chữ vào backtick/bold (`kiến trúc**Monolith**`, `theo`role``) do auto-format của editor phá cú pháp gốc                                                                                                                                              | Đọc lại toàn văn từng bảng sau khi file bị thay đổi trên đĩa                                                                                 | Viết lại cú pháp bảng chuẩn, bỏ padding khoảng trắng thủ công                                                                                                                                                |
| Câu mô tả BullMQ chứa ký tự tiếng Trung lẫn vào do lỗi sinh văn bản ("thư viện Node.js thành熟")                                                                                                                                                                                     | Đọc lại toàn văn ADR-001                                                                                                                             | Yêu cầu sửa lại; bản sửa lần 1 ("trưởng thành, ổn định") vẫn là dịch máy móc, không tự nhiên trong tiếng Việt — yêu cầu sửa lần 2 thành "phổ biến, đã được kiểm chứng rộng rãi" |
| Icon/emoji ở tiêu đề và một số từ ngữ mang tính game (Clan/Bang hội, Neon, Arena) còn sót lại từ văn phong Ngày 01, không phù hợp tài liệu kiến trúc kỹ thuật                                                                                                             | Đọc lại toàn bộ 3 file so với yêu cầu văn phong chuyên nghiệp                                                                                  | Loại bỏ icon; thay "quản lý Clan/Bang hội" bằng "quản lý nhóm học tập theo lớp/câu lạc bộ"                                                                                                               |
| Đoạn giải thích cơ chế Queue dùng ẩn dụ đời thường ("quầy lễ tân/bộ phận kỹ thuật") thay vì thuật ngữ kỹ thuật trực tiếp                                                                                                                                                 | Đọc lại bản nháp worklog                                                                                                                             | Viết lại bằng thuật ngữ chính xác: process riêng biệt, không chia sẻ event loop, Redis đóng vai trò buffer                                                                                                |
| Tên field/model giữa 3 file không khớp nhau tuyệt đối (ví dụ AI đặt`AuditLog.action` ở architecture.md nhưng liệt kê endpoint audit log ở api_module_map.md dùng tên khác) — rủi ro vì 3 file do AI sinh riêng lẻ theo từng lượt prompt, không tự đối chiếu chéo | `grep -n "AuditLog\|action" docs/architecture/architecture.md docs/architecture/api_module_map.md` rồi so tên field/route thủ công giữa 2 kết quả | Chuẩn hóa lại tên field/route thống nhất theo architecture.md — coi đây là single source of truth khi 2 file mâu thuẫn                                                                                      |

**Kiểm thử độc lập bằng lệnh Git Bash:**

```bash
grep -n "child_process\|exec(" docs/architecture/architecture.md docs/adr/ADR-001-tech-stack-and-sandbox.md
```

Kết quả: mọi lần `child_process`/`exec` xuất hiện đều gắn với Sandbox Worker hoặc nằm trong câu phủ định ("App Server không..."), không có đoạn nào cho App Server tự thực thi code — đạt ràng buộc bắt buộc #1.

```bash
grep -c "AuditLog" docs/architecture/architecture.md
```

Kết quả: AuditLog được ghi nhận xuyên suốt sequence diagram ở 3 điểm (tạo submission, chấm xong, gọi AI Coach) — đạt ràng buộc bắt buộc #2.

```bash
wc -l docs/architecture/architecture.md docs/adr/ADR-001-tech-stack-and-sandbox.md docs/architecture/api_module_map.md
```

Dùng để xác nhận cả 3 file có nội dung thực chất, không rỗng hay bị cắt ngang giữa chừng.

**Giới hạn còn lại, chưa kiểm chứng được ở Ngày 02:** các con số giới hạn tài nguyên Sandbox (CPU 2-5s, RAM 128-256MB) mới là đề xuất trên giấy, chưa có implementation thật để benchmark; throughput thực tế của Piston API khi Contest đông người cũng chưa được đo — sẽ kiểm chứng khi triển khai Sandbox Worker ở các ngày sau.

**Đánh giá độ tin cậy của AI:**

Những chỗ có đúng/sai rõ ràng (không cho App Server exec code, phải qua Queue, phải ghi Audit Log) thì Claude làm đúng ngay từ đầu, tôi chỉ grep lại cho chắc chứ không phải sửa. Nhưng những chỗ không có chuẩn đúng/sai — văn phong, ẩn dụ, từ ngữ — thì bản đầu gần như lần nào cũng phải sửa lại: dịch còn gượng, sót icon/từ ngữ cũ từ Ngày 01, đôi lúc lẫn cả ký tự lạ. Nên với phần kiến trúc/kỹ thuật tôi tin và chỉ verify lại, còn phần viết lách thì luôn phải đọc lại toàn bộ và tự sửa theo ý mình mới chốt được.
