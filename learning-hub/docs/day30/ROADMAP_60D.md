# KẾ HOẠCH PHÁT TRIỂN 60 NGÀY TIẾP THEO (NGÀY 31 - NGÀY 90) - CYBERSOFT LEARNING & CONTEST HUB V2.0

**CYBERSOFT ACADEMY**
**KẾ HOẠCH THỰC TẬP SINH 02 — GIAI ĐOẠN 2**
**AI-NATIVE LEARNING & CONTEST ENGINEER**
**LỘ TRÌNH 60 NGÀY - MỖI NGÀY CÓ SẢN PHẨM**

> **Sản phẩm đích:** CyberSoft Learning & Contest Hub **v2.0 Enterprise** — nền tảng học, luyện tập, chấm bài đa ngôn ngữ, lớp học trực tiếp, thi đấu có giám sát thông minh, đấu trường và dự báo học viên có nguy cơ bỏ cuộc, vận hành trên Cloud có CI/CD.

**KẾT QUẢ SAU 60 NGÀY**
- Hệ thống chạy trên Cloud, CI/CD tự động, Worker Judge tách riêng trong sandbox gVisor/MicroVM.
- Chấm bài Python, C++, JavaScript; gợi ý cá nhân hóa bằng Knowledge Tracing.
- Lớp học trực tiếp Thầy – Trò (Live Code, Collaboration) và giám sát thi có AI hỗ trợ, tôn trọng quyền riêng tư.
- Đấu trường 1v1 thời gian thực, Tournament Engine, dự báo at-risk và bản v2.0 Enterprise bàn giao được.

*Phiên bản 2.0 | Chu kỳ 60 ngày làm việc (Ngày 31 – Ngày 90, Tuần 7 – Tuần 18) | Kế thừa từ Release v1.0 (19/10/2026)*

---

## 1. Định hướng nhiệm vụ

**Sứ mệnh:** Đưa vòng lặp *học – làm – nhận phản hồi – thi đấu* từ bản v1.0 chạy cục bộ lên quy mô nhiều trường/tổ chức: an toàn hơn khi chạy code, cá nhân hóa hơn cho từng học viên, tương tác trực tiếp hơn giữa thầy và trò, và giúp giảng viên phát hiện sớm học viên cần hỗ trợ — luôn có bằng chứng đo lường được.

**Vai trò trong nhóm 3 người**
- Owner ứng dụng học tập, online judge, contest, teacher authoring và hạ tầng triển khai của Learning Hub.
- Tích hợp dữ liệu sự kiện học tập và mô hình với nhóm Data & AI (không sửa trực tiếp `Data-AI-Resource/` của thành viên khác; tích hợp qua API/hợp đồng dữ liệu version hóa).
- Cùng QA xây E2E, security, sandbox-escape suite, load test, AI regression và release gate cho v2.0.

**Sản phẩm đích sau 60 ngày**
- CyberSoft Learning & Contest Hub **v2.0 Enterprise** trên Cloud (staging + production), CI/CD và rollback một lệnh.
- Worker Judge độc lập, đa ngôn ngữ (Python, C++, JavaScript), sandbox cấp hệ điều hành.
- Knowledge Tracing + gợi ý bài cá nhân hóa; Live Code; Advanced Proctoring có đồng ý; Đấu trường 1v1 + Tournament; At-risk Prediction.
- Bộ tài liệu v2.0: Handbook, Runbook, migration v1→v2, đào tạo, roadmap tiếp theo.

**Đầu vào kế thừa từ v1.0** — mỗi giới hạn đã công bố trong [RELEASE_NOTES_v1.0.md](RELEASE_NOTES_v1.0.md) có ngày xử lý:

| Known Issue v1.0 | Ngày xử lý |
|---|---|
| K-01 Local Sandbox không cô lập cấp OS | Ngày 36–39 |
| K-02 Hàng chờ chấm một tiến trình | Ngày 36–37 |
| K-03/K-04 Mật khẩu yếu cũ, consent chưa lưu bằng chứng | Ngày 61, 86 |
| K-06/K-07 Họ tên trẻ trên Bảng Vinh Danh, `userId` công khai | Ngày 71, 79 |
| K-08/K-09 Chống gian lận Bảng Vinh Danh & out-tab mức "làm khó" | Ngày 62–69, 76 |
| K-15 Bảng xếp hạng tính toàn collection | Ngày 79 |
| Chưa có CI/CD, chỉ Python | Ngày 33–35, 41–45 |

**Năng lực thực tập sinh phải nhận lại**
- Cloud infrastructure, CI/CD, observability, secure sandboxing (gVisor/MicroVM), hàng đợi phân tán.
- Compiler/runtime đa ngôn ngữ, learning analytics, Knowledge Tracing, recommender system.
- Hệ thống thời gian thực (WebSocket, WebRTC, CRDT), hệ thống thi đấu và xếp hạng.
- AI có trách nhiệm: quyền riêng tư trẻ em, công bằng, giải thích được, human-in-the-loop; vận hành sản phẩm Enterprise.

## 2. Chuẩn vận hành chung

**Nguyên tắc:** Không tính một ngày là hoàn thành nếu chỉ học, đọc hoặc họp. Mỗi ngày phải có commit/PR, tài nguyên hoặc chức năng có thể kiểm tra và một báo cáo kèm bằng chứng. Nhánh làm việc theo ngày (`learning-hubdayNN`), **không merge vào `main` khi chưa qua release gate**.

| Mốc | Hoạt động | Bằng chứng bắt buộc |
|---|---|---|
| 09:00 | Chốt mục tiêu ngày | Issue có phạm vi, tiêu chí nghiệm thu và rủi ro. |
| 11:30 | Checkpoint kỹ thuật | Commit chạy được hoặc tài nguyên bản nháp. |
| 16:00 | Tích hợp và kiểm thử | PR, test, ảnh/video hoặc đường dẫn demo staging. |
| 17:00 | Báo cáo cuối ngày | Kết quả, bằng chứng, số liệu, bài học, kế hoạch ngày sau. |

**Definition of Done cho mọi đầu việc**
- Có mã nguồn/tài nguyên trong đúng thư mục, tên rõ ràng và không chứa dữ liệu nhạy cảm.
- Có README hoặc hướng dẫn sử dụng đủ để một người khác chạy/thực hiện lại.
- Có test hoặc checklist nghiệm thu; không xác nhận bằng cảm tính. Bộ test v1.0 (Jest, Vitest, 5 audit, E2E Chrome) **không được giảm** số test pass.
- Có dữ liệu mẫu tái lập (`npm run seed:clean` hoặc seed tương đương trên staging), ảnh chụp hoặc video demo.
- Có ghi rõ phần AI tạo ra, phần con người kiểm tra và giới hạn còn tồn tại.
- PR được tự review trước khi gửi; không để secret, API key, dữ liệu học viên thật hoặc file thừa trong repository.

**Chuẩn AI-native, Loop Engineering và Harness Engineering**
- **AI-native:** AI nằm trong quy trình tạo, kiểm tra và cải tiến sản phẩm; không chỉ là nút gọi chatbot.
- **Loop Engineering:** Mục tiêu → AI tạo/đề xuất → Công cụ thực thi → Test/đánh giá → Phản hồi → Sửa đến khi đạt ngưỡng.
- **Harness Engineering:** prompt, context, tool, schema đầu ra, test, log, guardrail và bộ đánh giá để AI làm việc ổn định.
- **Human-in-the-loop:** nội dung ảnh hưởng học viên, đáp án, điểm số, nhận xét, **kết luận liêm chính và cảnh báo at-risk** phải có bước duyệt của con người.

**Công cụ AI được phép và cách thẩm định năng lực thật**
- Khuyến khích Claude Code, Codex, Google Antigravity và trợ lý AI phù hợp. Điểm nằm ở khả năng hiểu bài toán, giao việc đúng, kiểm chứng, sửa sai và chịu trách nhiệm về sản phẩm.
- **Trước khi gọi AI:** viết problem statement, giả định, kế hoạch, tiêu chí nghiệm thu, rủi ro. Với việc rủi ro cao (bảo mật, dữ liệu trẻ em, điểm số): yêu cầu AI **chỉ đọc và báo cáo** trước, sửa ở vòng sau.
- **Trong khi dùng AI:** lưu AI Work Log (công cụ/model, mục tiêu, context, prompt chính, file thay đổi, lỗi phát sinh, quyết định chấp nhận/sửa/loại bỏ).
- **Sau khi AI tạo kết quả:** đọc diff, chạy test, kiểm tra bảo mật/dữ liệu, giải thích được luồng chính.
- Mỗi ngày 5–10 phút **defense**; mỗi tuần một **live change** trên nhánh mới.
- **Không chấp nhận:** commit nguyên đầu ra AI không đọc, không chạy test, giấu lỗi, dùng dữ liệu học viên thật trên công cụ AI công cộng, để AI tự xác nhận sản phẩm của chính nó là đúng, sửa thư mục thuộc thành viên khác.

**Bốn tầng năng lực AI cần đạt**

| Năng lực | Bằng chứng quan sát |
|---|---|
| **Tầng 1 - Hiểu việc** | Tự mô tả input, output, constraint, edge case và tiêu chí đúng trước khi dùng AI. |
| **Tầng 2 - Điều phối AI** | Chia việc, cung cấp context, yêu cầu kế hoạch/diff/test và quản lý nhiều vòng phản hồi. |
| **Tầng 3 - Thẩm định** | Đọc code, kiểm tra giả định, chạy test, đo metric, phát hiện hallucination và rủi ro. |
| **Tầng 4 - Làm chủ** | Sửa yêu cầu mới, debug lỗi lạ, giải thích trade-off và cải tiến harness để lần sau AI làm tốt hơn. |

## 3. Lộ trình theo tuần

| Tuần | Giai đoạn | Trọng tâm | Mốc sản phẩm | Demo bắt buộc |
|---|---|---|---|---|
| **Tuần 7** (Ngày 31–35) | GĐ1 — Hạ tầng Cloud | Cloud, đóng gói, CI, staging, observability | Staging tự triển khai từ PR, dashboard giám sát | PR xanh tự lên staging, alert khi `/api/health` lỗi. |
| **Tuần 8** (Ngày 36–40) | GĐ1 — Worker Judge | Hàng đợi phân tán, gVisor/MicroVM, CD production | Worker Judge độc lập, sandbox cấp OS, rollback | Nộp mã độc bị chặn trong sandbox; kill worker không mất bài. |
| **Tuần 9** (Ngày 41–45) | GĐ2 — Đa ngôn ngữ | C++, JavaScript, checker, content pack | Chấm 3 ngôn ngữ, AI Tạo Đề đa ngôn ngữ | Một bài nộp bằng Python/C++/JS đều AC. |
| **Tuần 10** (Ngày 46–50) | GĐ2 — Knowledge Tracing | Event log, KC tagging, BKT/DKT, gợi ý | Gợi ý bài kế tiếp cá nhân hóa | Hai học viên khác nhau nhận gợi ý khác nhau, có giải thích. |
| **Tuần 11** (Ngày 51–55) | GĐ3 — Live Code | WebSocket, CRDT, lớp học trực tiếp | Thầy – trò cùng sửa code thời gian thực | Giảng viên broadcast code, 30 học viên theo dõi. |
| **Tuần 12** (Ngày 56–60) | GĐ3 — Collaboration | WebRTC, code review trực tiếp, pair programming | Lớp học tương tác đầy đủ | Review inline + gọi thoại 1-1 có đồng ý. |
| **Tuần 13** (Ngày 61–65) | GĐ4 — Liêm chính hành vi | Pháp lý, tín hiệu hành vi, similarity | Bảng rủi ro liêm chính hợp nhất | Phát hiện cặp bài nộp sao chép, giảng viên quyết định. |
| **Tuần 14** (Ngày 66–70) | GĐ4 — Proctoring nâng cao | Webcam/audio/eye on-device, công bằng | Proctoring có đồng ý, không lưu media | Bật/tắt opt-in, FP rate trên bộ thử < 5%. |
| **Tuần 15** (Ngày 71–75) | GĐ5 — Gamification & 1v1 | XP, huy hiệu, Elo, matchmaking, đấu 1v1 | Đấu trường 1v1 thời gian thực | Hai học viên thi 1v1, rating cập nhật. |
| **Tuần 16** (Ngày 76–80) | GĐ5 — Tournament | Swiss/loại trực tiếp, bracket, leaderboard đa tầng | Tournament Engine | Giải thử 64 người chạy hết vòng. |
| **Tuần 17** (Ngày 81–85) | GĐ6 — At-risk | Nhãn, đặc trưng, mô hình, giải thích, can thiệp | Cảnh báo sớm cho giảng viên | Danh sách at-risk có lý do + đo hiệu quả can thiệp. |
| **Tuần 18** (Ngày 86–90) | GĐ6 — Enterprise | Multi-tenant, SSO, pentest, tài liệu, release | **Release v2.0 Enterprise** | Demo end-to-end v2.0, rollback, roadmap tiếp theo. |

## 4. Kế hoạch chi tiết 60 ngày

**Cách sử dụng:** Quản lý tạo Issue theo đúng nội dung từng ngày. Thực tập sinh cập nhật bằng chứng trực tiếp vào Issue và liên kết PR. Nếu chưa đạt điều kiện nghiệm thu, trạng thái vẫn là "Chưa hoàn thành".

---

### GIAI ĐOẠN 1 — TUẦN 7–8: HẠ TẦNG CLOUD, CI/CD TỰ ĐỘNG & WORKER JUDGE ĐỘC LẬP

#### NGÀY 31 - Khảo sát hạ tầng và ADR triển khai Cloud
**Giai đoạn:** Tuần 7 - Hạ tầng Cloud | **Kết quả chính:** Có kiến trúc triển khai v2.0 được chốt bằng ADR.

**Việc phải làm**
- Đo tải thực của v1.0 (CPU/RAM khi chấm, số request/phút giờ cao điểm) từ log và load test cũ.
- So sánh 2–3 phương án Cloud (VM tự quản, container managed, PaaS) theo chi phí, độ phức tạp, khả năng chạy sandbox lồng nhau.
- Viết ADR-010: dev giữ chạy local không Docker (như v1.0), production dùng container; Worker Judge tách riêng.
- Lập sơ đồ mạng: API, Worker, MongoDB Atlas, Redis, CDN cho FE.

**Bàn giao cuối ngày**
- ADR-010 Kiến trúc triển khai
- Sơ đồ hạ tầng v2.0
- Bảng ước tính chi phí theo tháng

**Điều kiện nghiệm thu**
- ADR so sánh ít nhất 3 phương án với ≥ 5 tiêu chí có trọng số.
- Ước tính chi phí cho 3 mức tải (100 / 1.000 / 5.000 học viên hoạt động).
- Không phương án nào yêu cầu chạy code học viên trên cùng máy với API.

**Kiến thức nhận lại**
- Cloud architecture
- Capacity planning
- Architecture Decision Record

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI liệt kê phương án và chi phí; ghi rõ số nào đã kiểm lại trên trang giá chính thức.
- Kiểm chứng độc lập: tự đo tải v1.0 bằng `npm run e2e:browser` + log, không dùng số AI ước đoán.
- Câu hỏi defense: "Vì sao dev bỏ Docker ở v1.0 nhưng production v2.0 lại dùng container?"

#### NGÀY 32 - Đóng gói ứng dụng cho production
**Giai đoạn:** Tuần 7 - Hạ tầng Cloud | **Kết quả chính:** Build FE/BE tái lập, cấu hình theo 12-factor.

**Việc phải làm**
- Tách cấu hình theo môi trường (dev/staging/prod), đọc secret từ Secret Manager thay vì file.
- Viết Dockerfile production đa tầng cho API (không chứa Python chấm bài) và build tĩnh FE.
- Bật `Secure` cookie, HTTPS, `NODE_ENV=production`; kiểm tra header bảo mật trên bản build.
- Script `release:check` kiểm tra image không chứa `.env`, `node_modules` dev, source map công khai.

**Bàn giao cuối ngày**
- Image API + bundle FE
- Ma trận cấu hình 3 môi trường
- Báo cáo quét image

**Điều kiện nghiệm thu**
- Image API < 300 MB, build lại cho cùng digest khi không đổi mã.
- 0 secret trong image (quét bằng công cụ secret scanning).
- Toàn bộ 1635 Jest + 431 Vitest vẫn pass trên bản build.

**Kiến thức nhận lại**
- Twelve-factor app
- Container image hardening
- Secret management

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: Dockerfile do AI đề xuất; ghi các lớp đã bỏ (cache, devDependencies) và lý do.
- Kiểm chứng độc lập: quét image bằng công cụ secret scan độc lập, đính kèm output.
- Câu hỏi defense: "Cookie `SameSite=Strict` + `Secure` ảnh hưởng gì khi FE và API khác domain?"

#### NGÀY 33 - CI pipeline trên Pull Request
**Giai đoạn:** Tuần 7 - Hạ tầng Cloud | **Kết quả chính:** Mọi PR tự chạy lint, typecheck, test, audit.

**Việc phải làm**
- Viết workflow CI: cài đặt có cache, lint, `tsc`, Jest, Vitest, `test:scripts`.
- Job tích hợp có MongoDB service: `seed:clean` → 5 audit (day29/30/31, cross-role, teacher-security).
- Job E2E Chrome headless chạy luồng rút gọn trên PR, đầy đủ 5 luồng hằng đêm.
- Bảo vệ nhánh: bắt buộc CI xanh + 1 review; không auto-deploy `main`.

**Bàn giao cuối ngày**
- File workflow CI
- Quy tắc bảo vệ nhánh
- Báo cáo thời gian chạy CI

**Điều kiện nghiệm thu**
- CI PR hoàn tất < 15 phút.
- Một PR cố ý làm hỏng test bị chặn merge.
- Tỷ lệ flaky < 2% qua 20 lần chạy lặp.

**Kiến thức nhận lại**
- CI/CD basics
- Test pyramid
- Flaky test management

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: workflow AI viết; ghi bước AI bỏ sót (service MongoDB, cache Chrome) và cách phát hiện.
- Kiểm chứng độc lập: mở PR thử nghiệm làm đỏ 1 test, chụp màn hình bị chặn.
- Câu hỏi defense: "Vì sao E2E đầy đủ chạy hằng đêm chứ không chạy mỗi PR?"

#### NGÀY 34 - Staging và Continuous Delivery
**Giai đoạn:** Tuần 7 - Hạ tầng Cloud | **Kết quả chính:** PR merge vào nhánh tích hợp tự lên staging.

**Việc phải làm**
- Dựng môi trường staging (API, FE, MongoDB Atlas staging, Redis) bằng Infrastructure as Code.
- CD: merge vào nhánh tích hợp → build → deploy staging → smoke test `/api/health` + 1 luồng E2E.
- Seed dữ liệu mẫu tái lập trên staging, khóa không cho seed chạy ở production.
- Migration chạy tự động có `--dry-run` trước, dừng nếu lệch.

**Bàn giao cuối ngày**
- Mã IaC staging
- Pipeline CD staging
- URL staging + tài khoản mẫu

**Điều kiện nghiệm thu**
- Từ merge tới staging chạy được < 20 phút.
- Seed bị chặn khi `NODE_ENV=production` (có test).
- Smoke test fail thì deploy tự rollback.

**Kiến thức nhận lại**
- Infrastructure as Code
- Continuous delivery
- Database migration safety

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: mã IaC AI sinh; ghi tài nguyên AI tạo thừa/thiếu quyền và cách sửa theo least privilege.
- Kiểm chứng độc lập: cố ý deploy bản lỗi health, chứng minh rollback tự động.
- Câu hỏi defense: "Điều gì xảy ra nếu migration chạy dở khi deploy bị hủy?"

#### NGÀY 35 - Observability và cảnh báo
**Giai đoạn:** Tuần 7 - Hạ tầng Cloud | **Kết quả chính:** Nhìn thấy sức khỏe hệ thống theo thời gian thực.

**Việc phải làm**
- Log có cấu trúc (JSON, request id), che PII giữ nguyên chuẩn Day 29.
- Metrics: request rate/latency/error, độ dài hàng chờ chấm, thời gian chấm p95, lỗi Gemini 429.
- Dashboard + alert nối với Escalation Path L1/L2/L3 của Runbook.
- Demo Tuần 7: PR → staging → dashboard → alert.

**Bàn giao cuối ngày**
- Dashboard giám sát
- 5 quy tắc cảnh báo
- Runbook v2 mục Observability

**Điều kiện nghiệm thu**
- Alert khi `/api/health` lỗi tới kênh trực trong < 2 phút.
- 0 PII (email, tên trẻ) trong log mẫu 1.000 dòng.
- Dashboard có ít nhất 8 chỉ số, mỗi chỉ số có ngưỡng.

**Kiến thức nhận lại**
- Observability (logs, metrics, traces)
- SLO/SLI
- Incident alerting

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI đề xuất metric; ghi metric bị loại vì không hành động được.
- Kiểm chứng độc lập: tắt MongoDB staging, đo thời gian tới khi nhận alert.
- Câu hỏi defense: "Chỉ số nào báo trước được sự cố 'test ẩn lớn làm hết giờ chấm' của v1.0?"

#### NGÀY 36 - Thiết kế Worker Judge tách rời và hàng đợi phân tán
**Giai đoạn:** Tuần 8 - Worker Judge | **Kết quả chính:** Hợp đồng job chấm bài độc lập với API.

**Việc phải làm**
- Thiết kế hợp đồng job (submissionId, ngôn ngữ, giới hạn, checksum bộ test) và trạng thái QUEUED/RUNNING/DONE/FAILED.
- Chọn hàng đợi (Redis/BullMQ hoặc tương đương) với ack, retry, dead-letter, idempotency.
- Viết ADR-011: gVisor vs Firecracker MicroVM vs nsjail cho sandbox.
- Kế hoạch chuyển đổi từ hàng chờ in-process v1.0 không mất bài nộp.

**Bàn giao cuối ngày**
- Đặc tả hợp đồng job
- ADR-011 Sandbox
- Kế hoạch migration hàng chờ

**Điều kiện nghiệm thu**
- Mọi job idempotent: chấm lại cùng job không tạo 2 kết quả.
- ADR có bảng mối đe dọa (escape, DoS, exfiltration) cho từng phương án.
- Không còn đường nào API chạy code học viên trực tiếp.

**Kiến thức nhận lại**
- Distributed queue
- Idempotency
- Threat modeling

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI so sánh sandbox; ghi khẳng định nào của AI đã đối chiếu tài liệu chính thức.
- Kiểm chứng độc lập: tự viết test idempotency cho job trùng.
- Câu hỏi defense: "Vì sao AST guard của v1.0 không thay thế được sandbox cấp OS?"

#### NGÀY 37 - Worker Judge trên gVisor
**Giai đoạn:** Tuần 8 - Worker Judge | **Kết quả chính:** Chấm Python trong sandbox gVisor, cô lập mạng và file.

**Việc phải làm**
- Dựng worker chạy container runtime `runsc` (gVisor), rootfs chỉ đọc, `--network none`.
- Giới hạn cgroup CPU, RAM, số tiến trình (PIDs), dung lượng ghi tạm, thời gian.
- Giữ AST guard v1.0 làm lớp bảo vệ thứ hai (defense in depth).
- Nối worker với hàng đợi, API chỉ enqueue và đọc kết quả.

**Bàn giao cuối ngày**
- Worker image gVisor
- Cấu hình giới hạn tài nguyên
- Log chấm mẫu

**Điều kiện nghiệm thu**
- 100% bài Playground (20 + 15) chấm AC với lời giải chuẩn trong sandbox mới.
- Fork bomb, `while True`, cấp phát 2 GB đều bị dừng đúng TLE/MLE trong giới hạn.
- Kết nối mạng ra ngoài từ code học viên thất bại 100%.

**Kiến thức nhận lại**
- Container sandboxing
- cgroups/namespaces
- Defense in depth

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: cấu hình runtime AI đề xuất; ghi tham số đã thay vì không an toàn.
- Kiểm chứng độc lập: chạy bộ 35 bài chuẩn so sánh kết quả với judge v1.0.
- Câu hỏi defense: "gVisor chặn syscall như thế nào khác container thường?"

#### NGÀY 38 - MicroVM Firecracker PoC và benchmark
**Giai đoạn:** Tuần 8 - Worker Judge | **Kết quả chính:** Có số liệu chọn runtime sandbox cho production.

**Việc phải làm**
- PoC Firecracker MicroVM chạy cùng bộ bài chuẩn.
- Đo cold start, thời gian chấm p50/p95, chi phí RAM mỗi job trên gVisor vs Firecracker vs local v1.0.
- Thiết kế pool worker ấm (warm pool) để giảm cold start.
- Chốt runtime trong ADR-011 bằng số liệu.

**Bàn giao cuối ngày**
- PoC Firecracker
- Báo cáo benchmark
- ADR-011 cập nhật quyết định

**Điều kiện nghiệm thu**
- Benchmark ≥ 3 lần lặp mỗi cấu hình, báo cáo độ lệch.
- Thời gian chấm p95 của runtime chọn < 3 giây cho bài 10–12 nặng nhất (Day 15, 2 MB test).
- Quyết định có tiêu chí loại trừ rõ ràng.

**Kiến thức nhận lại**
- Virtualization
- Benchmarking methodology
- Warm pool design

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: script benchmark AI viết; ghi lỗi đo (đo cả thời gian build) và cách sửa.
- Kiểm chứng độc lập: chạy lại benchmark trên máy khác, so sai số.
- Câu hỏi defense: "Khi nào chọn MicroVM dù chậm hơn gVisor?"

#### NGÀY 39 - Sandbox-escape suite và load test zero-loss
**Giai đoạn:** Tuần 8 - Worker Judge | **Kết quả chính:** Chứng minh sandbox an toàn và không mất bài nộp.

**Việc phải làm**
- Bộ test tấn công: đọc `/etc/passwd`, ghi ngoài thư mục, mở socket, gọi `ctypes`, vượt thời gian, in output 100 MB.
- Load test 500 bài nộp đồng thời, đo throughput và hàng chờ.
- Chaos: kill worker giữa lúc chấm, mất kết nối Redis, khởi động lại API.
- Đối chiếu số bài nộp trước/sau sự cố.

**Bàn giao cuối ngày**
- Sandbox-escape test suite
- Báo cáo load test
- Báo cáo chaos

**Điều kiện nghiệm thu**
- 0/≥ 20 kịch bản tấn công thành công.
- 500 bài nộp đồng thời: 0 mất, 0 chấm trùng, p95 chờ < 30 giây.
- Kill worker: 100% job được chấm lại đúng một lần.

**Kiến thức nhận lại**
- Security testing
- Load testing
- Chaos engineering

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI sinh kịch bản tấn công; ghi kịch bản tự bổ sung mà AI không nghĩ tới.
- Kiểm chứng độc lập: QA chạy suite độc lập, không xem kết quả của dev trước.
- Câu hỏi defense: "Vì sao 'zero submission loss' của Day 29 v1.0 chỉ là mô phỏng, còn hôm nay là thật?"

#### NGÀY 40 - CD production, backup tự động và nghiệm thu Giai đoạn 1
**Giai đoạn:** Tuần 8 - Worker Judge | **Kết quả chính:** Production triển khai và rollback bằng một lệnh.

**Việc phải làm**
- CD production có phê duyệt thủ công, blue/green hoặc canary.
- Backup MongoDB tự động hằng ngày, thử restore vào môi trường tạm.
- Diễn tập DR: mất API production, khôi phục từ bản build trước.
- Live change Tuần 8 + demo giai đoạn 1.

**Bàn giao cuối ngày**
- Pipeline CD production
- Báo cáo DR drill
- Biên bản nghiệm thu GĐ1

**Điều kiện nghiệm thu**
- Rollback production < 5 phút, có video.
- Restore thử thành công, số bản ghi khớp 100%.
- RPO ≤ 24 giờ, RTO ≤ 1 giờ được đo thực tế.

**Kiến thức nhận lại**
- Release engineering
- Disaster recovery
- Change management

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: tổng hợp toàn GĐ1, liệt kê đề xuất AI bị bác bỏ.
- Kiểm chứng độc lập: người khác thực hiện rollback theo Runbook, không có trợ giúp.
- Câu hỏi defense: live change do quản lý đưa ra (vd đổi giới hạn bộ nhớ worker) trong 30 phút.

---

### GIAI ĐOẠN 2 — TUẦN 9–10: MỞ RỘNG NGÔN NGỮ (C++, JAVASCRIPT) & GỢI Ý CÁ NHÂN HÓA SÂU (KNOWLEDGE TRACING)

#### NGÀY 41 - Thiết kế chấm bài đa ngôn ngữ
**Giai đoạn:** Tuần 9 - Đa ngôn ngữ | **Kết quả chính:** Mô hình dữ liệu và hợp đồng runner cho nhiều ngôn ngữ.

**Việc phải làm**
- Language registry: tên, phiên bản compiler/runtime, lệnh compile/run, hệ số giới hạn thời gian.
- Mở rộng schema bài tập: `languages[]`, starter code và lời giải theo ngôn ngữ; giữ tương thích bài Python cũ.
- Thiết kế bước compile riêng (CE) tách khỏi bước chạy.
- ADR-012 chính sách hệ số thời gian giữa ngôn ngữ.

**Bàn giao cuối ngày**
- Language registry
- Migration schema bài tập
- ADR-012

**Điều kiện nghiệm thu**
- 100% bài cũ đọc được sau migration (có `--dry-run`, có `--revert`).
- Hợp đồng runner có test cho cả 3 ngôn ngữ.
- Không đổi API công khai cho client v1.0.

**Kiến thức nhận lại**
- Compiler/runtime pipeline
- Schema evolution
- Backward compatibility

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: migration AI viết; ghi trường hợp dữ liệu cũ AI bỏ sót.
- Kiểm chứng độc lập: chạy migration trên bản sao dữ liệu staging, so số bản ghi.
- Câu hỏi defense: "Vì sao không nhân thời gian giới hạn giống nhau cho C++ và Python?"

#### NGÀY 42 - Runner C++
**Giai đoạn:** Tuần 9 - Đa ngôn ngữ | **Kết quả chính:** Chấm C++ có compile, CE an toàn, cache biên dịch.

**Việc phải làm**
- Compile `g++` chuẩn C++17 trong sandbox, giới hạn thời gian compile và kích thước binary.
- Che đường dẫn máy chủ trong lỗi biên dịch (theo chuẩn DEF-060 của v1.0).
- Cache binary theo hash mã nguồn cho lần chạy nhiều test.
- Test AC/WA/TLE/RE/CE/MLE cho C++.

**Bàn giao cuối ngày**
- Runner C++
- Bộ test runner C++
- Ví dụ thông báo CE đã làm sạch

**Điều kiện nghiệm thu**
- 6 trạng thái chấm đúng trên ≥ 30 test case.
- Thông báo CE không chứa đường dẫn tuyệt đối (test tự động).
- Compile bomb (template đệ quy) bị dừng < 10 giây.

**Kiến thức nhận lại**
- Compilation sandboxing
- Error sanitization
- Build caching

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI đề xuất cờ compile; ghi cờ bị bỏ vì rủi ro.
- Kiểm chứng độc lập: lấy 10 bài thuật toán tự giải bằng C++ chạy qua runner.
- Câu hỏi defense: "Vì sao CE không bị trừ điểm còn WA thì có (luật chấm v1.0)?"

#### NGÀY 43 - Runner JavaScript
**Giai đoạn:** Tuần 9 - Đa ngôn ngữ | **Kết quả chính:** Chấm JavaScript (Node.js) an toàn.

**Việc phải làm**
- Runner Node.js trong sandbox: không mạng, không `child_process`, file system chỉ đọc.
- Chuẩn đọc input stdin cho học viên (template đọc dòng).
- Xử lý Promise chưa resolve, vòng lặp event vô hạn (TLE).
- Test 6 trạng thái chấm cho JS.

**Bàn giao cuối ngày**
- Runner JavaScript
- Template stdin JS
- Bộ test runner JS

**Điều kiện nghiệm thu**
- 6 trạng thái chấm đúng trên ≥ 30 test case.
- `require('child_process')`, `fetch` ra ngoài đều thất bại.
- Promise treo được báo TLE đúng giới hạn.

**Kiến thức nhận lại**
- Node.js runtime isolation
- Event loop
- Async error handling

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi lần AI đề xuất dùng `vm` module như sandbox và lý do bác bỏ.
- Kiểm chứng độc lập: chạy sandbox-escape suite Ngày 39 cho JS.
- Câu hỏi defense: "Vì sao `vm` của Node không phải ranh giới bảo mật?"

#### NGÀY 44 - Checker nâng cao và giao diện chọn ngôn ngữ
**Giai đoạn:** Tuần 9 - Đa ngôn ngữ | **Kết quả chính:** So sánh output linh hoạt, học viên chọn ngôn ngữ.

**Việc phải làm**
- Checker: so token, sai số số thực, bỏ khoảng trắng cuối, special judge (nhiều đáp án đúng).
- Editor chọn ngôn ngữ, giữ code riêng từng ngôn ngữ, starter code tương ứng.
- Teacher Studio: soạn bài nhiều ngôn ngữ, chọn checker.
- Cập nhật E2E luồng 2 với nộp C++/JS.

**Bàn giao cuối ngày**
- Checker library
- UI chọn ngôn ngữ (học viên + giảng viên)
- E2E đa ngôn ngữ

**Điều kiện nghiệm thu**
- Bài số thực chấp nhận sai số 1e-6 đúng, có test biên.
- Đổi ngôn ngữ không mất code đang viết (test UI).
- E2E thêm ≥ 6 bước, toàn bộ pass.

**Kiến thức nhận lại**
- Output checking
- Special judge
- Multi-language UX

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: checker AI viết; ghi edge case sai (âm 0, `1e-7`) và sửa.
- Kiểm chứng độc lập: bộ test checker do QA viết riêng.
- Câu hỏi defense: "Special judge khác so khớp output thế nào, rủi ro gì?"

#### NGÀY 45 - Content pack đa ngôn ngữ và AI Tạo Đề đa ngôn ngữ
**Giai đoạn:** Tuần 9 - Đa ngôn ngữ | **Kết quả chính:** Bài 10–12 có C++/JS; AI sinh lời giải đa ngôn ngữ đã chạy thật.

**Việc phải làm**
- Bổ sung lời giải C++/JS cho 15 bài lộ trình 10–12, chạy qua toàn bộ test.
- AI Tạo Đề: sinh lời giải nhiều ngôn ngữ, mỗi lời giải phải pass 100% test (giữ nguyên chống ảo giác v1.0).
- Kiểm tra chéo: output của lời giải các ngôn ngữ phải trùng nhau.
- Demo Tuần 9.

**Bàn giao cuối ngày**
- Content pack đa ngôn ngữ
- AI Tạo Đề v2
- Video demo Tuần 9

**Điều kiện nghiệm thu**
- 15/15 bài có ≥ 2 ngôn ngữ, mọi lời giải pass.
- Lời giải các ngôn ngữ cho cùng output trên 100% test.
- AI Tạo Đề từ chối lưu khi một ngôn ngữ fail.

**Kiến thức nhận lại**
- Content engineering
- Differential testing
- AI output grounding

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: thống kê tỉ lệ lời giải AI sinh bị fail theo ngôn ngữ.
- Kiểm chứng độc lập: differential testing tự động giữa 3 ngôn ngữ.
- Câu hỏi defense: "Vì sao expectedOutput phải lấy từ chạy thật chứ không từ AI?"

#### NGÀY 46 - Event log học tập
**Giai đoạn:** Tuần 10 - Knowledge Tracing | **Kết quả chính:** Dữ liệu hành vi học tập chuẩn hóa, ẩn danh.

**Việc phải làm**
- Thiết kế sự kiện (kiểu xAPI): mở bài, Run, Submit, kết quả, dùng gợi ý, AI Coach, thời gian.
- Ghi sự kiện bất đồng bộ, không làm chậm luồng chính.
- Ẩn danh hóa (pseudonymous id) khi xuất cho phân tích; TTL theo chính sách.
- Backfill từ `submissions`, `quizattempts`, `hint_usages` hiện có.

**Bàn giao cuối ngày**
- Schema sự kiện
- Pipeline ghi sự kiện
- Bộ dữ liệu ẩn danh mẫu

**Điều kiện nghiệm thu**
- Overhead ghi sự kiện < 5 ms p95.
- 0 email/họ tên trong bộ dữ liệu xuất (kiểm tra tự động).
- Backfill khớp số bài nộp gốc 100%.

**Kiến thức nhận lại**
- Learning analytics
- Event-driven design
- Data anonymization

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: schema AI đề xuất; ghi trường PII đã loại.
- Kiểm chứng độc lập: script quét PII độc lập trên dữ liệu xuất.
- Câu hỏi defense: "Pseudonymous khác anonymous thế nào về pháp lý?"

#### NGÀY 47 - Gắn kỹ năng (Knowledge Component) cho bài tập
**Giai đoạn:** Tuần 10 - Knowledge Tracing | **Kết quả chính:** Mỗi bài gắn với kỹ năng, được giảng viên duyệt.

**Việc phải làm**
- Xây cây kỹ năng Python/thuật toán cho 6–9 và 10–12 (vòng lặp, chuỗi, đệ quy, QHĐ...).
- AI đề xuất KC cho mỗi bài dựa trên đề + lời giải; giảng viên duyệt/sửa trong Teacher Studio.
- Lưu lịch sử duyệt (ai, khi nào, sửa gì).
- Đo độ đồng thuận AI – giảng viên.

**Bàn giao cuối ngày**
- Cây kỹ năng v1
- Giao diện duyệt KC
- Báo cáo đồng thuận

**Điều kiện nghiệm thu**
- 100% bài lộ trình + Ngân hàng đề có KC đã duyệt.
- Đồng thuận AI – giảng viên được đo (Cohen's kappa).
- Không KC nào được dùng khi chưa duyệt.

**Kiến thức nhận lại**
- Knowledge component modeling
- Human-in-the-loop labeling
- Inter-rater agreement

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: tỉ lệ đề xuất KC của AI bị giảng viên sửa.
- Kiểm chứng độc lập: hai giảng viên gắn độc lập 20 bài, so với AI.
- Câu hỏi defense: "Vì sao không để AI tự gắn KC rồi dùng luôn?"

#### NGÀY 48 - Baseline Bayesian Knowledge Tracing
**Giai đoạn:** Tuần 10 - Knowledge Tracing | **Kết quả chính:** Ước lượng mức thành thạo từng kỹ năng của học viên.

**Việc phải làm**
- Cài BKT theo KC (learn, guess, slip, prior), huấn luyện trên dữ liệu ẩn danh.
- Tách tập theo thời gian (train trên quá khứ, test trên tương lai).
- Đo AUC/RMSE dự đoán lần làm kế tiếp đúng/sai.
- So với baseline đơn giản (tỉ lệ đúng trung bình).

**Bàn giao cuối ngày**
- Mô hình BKT
- Notebook/báo cáo đánh giá
- API mức thành thạo (nội bộ)

**Điều kiện nghiệm thu**
- AUC BKT cao hơn baseline có ý nghĩa (báo cáo khoảng tin cậy).
- Không rò rỉ dữ liệu tương lai (test tự động tách tập).
- Mức thành thạo có giá trị trong [0, 1], có test.

**Kiến thức nhận lại**
- Bayesian Knowledge Tracing
- Temporal validation
- Model evaluation

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: công thức BKT AI viết; ghi lỗi cập nhật posterior phát hiện khi tự tính tay.
- Kiểm chứng độc lập: tính tay 1 chuỗi 5 lần làm và so với mô hình.
- Câu hỏi defense: "Guess và slip nghĩa là gì trong lớp học thật?"

#### NGÀY 49 - Mô hình nâng cao và lựa chọn mô hình
**Giai đoạn:** Tuần 10 - Knowledge Tracing | **Kết quả chính:** Chọn mô hình KT theo số liệu và khả năng giải thích.

**Việc phải làm**
- Thử PFA/logistic và DKT (mạng hồi quy) trên cùng tập.
- So sánh AUC, độ ổn định, chi phí suy luận, khả năng giải thích.
- Phân tích lỗi theo khối 6–9 / 10–12.
- Chốt mô hình trong ADR-013.

**Bàn giao cuối ngày**
- Bảng so sánh mô hình
- ADR-013
- Model card

**Điều kiện nghiệm thu**
- ≥ 3 mô hình đánh giá trên cùng split.
- Chênh lệch AUC giữa hai khối được báo cáo.
- Model card ghi dữ liệu, giới hạn, rủi ro sai lệch.

**Kiến thức nhận lại**
- Deep Knowledge Tracing
- Model selection
- Model cards

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: code DKT AI sinh; ghi siêu tham số đã tự kiểm lại.
- Kiểm chứng độc lập: chạy lại với 3 seed, báo cáo phương sai.
- Câu hỏi defense: "Vì sao có thể chọn mô hình AUC thấp hơn nhưng giải thích được?"

#### NGÀY 50 - Gợi ý cá nhân hóa và nghiệm thu Giai đoạn 2
**Giai đoạn:** Tuần 10 - Knowledge Tracing | **Kết quả chính:** Gợi ý bài kế tiếp theo mức thành thạo, có giải thích.

**Việc phải làm**
- Next-best-exercise: chọn bài luyện thêm (Ngân hàng đề/bài ôn) cho KC yếu, **không phá lộ trình tuần tự Playground**.
- Hiển thị lý do gợi ý ("Em cần luyện thêm: vòng lặp lồng nhau").
- Bảng thành thạo KC của lớp cho giảng viên.
- Đánh giá offline + demo + live change.

**Bàn giao cuối ngày**
- Engine gợi ý v2
- UI học viên + giảng viên
- Biên bản nghiệm thu GĐ2

**Điều kiện nghiệm thu**
- Gợi ý luôn nằm trong bài học viên được phép làm (audit tự động).
- 100% gợi ý có lý do bằng ngôn ngữ phù hợp lứa tuổi.
- Đánh giá offline: precision@3 cao hơn gợi ý hiện tại của v1.0.

**Kiến thức nhận lại**
- Recommender systems
- Explainable recommendation
- Offline evaluation

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: tổng hợp GĐ2, đề xuất AI bị bác bỏ.
- Kiểm chứng độc lập: audit gợi ý không vi phạm khóa tuần tự/khối.
- Câu hỏi defense: live change (vd gợi ý không quá 2 bài cùng KC liên tiếp).

---

### GIAI ĐOẠN 3 — TUẦN 11–12: LIVE CODE & COLLABORATION (WEBSOCKET / WEBRTC THẦY – TRÒ)

#### NGÀY 51 - Kiến trúc thời gian thực
**Giai đoạn:** Tuần 11 - Live Code | **Kết quả chính:** Chốt giao thức realtime và mô hình đồng bộ.

**Việc phải làm**
- So sánh WebSocket (NestJS Gateway), SSE, WebRTC DataChannel cho từng tính năng.
- Chọn CRDT (Yjs) cho soạn thảo cộng tác, so với OT.
- Xác thực realtime bằng cookie phiên + kiểm tra quyền theo lớp (không mở lỗ CSRF/IDOR mới).
- ADR-014 kiến trúc realtime.

**Bàn giao cuối ngày**
- ADR-014
- Sơ đồ luồng sự kiện
- Bảng mối đe dọa realtime

**Điều kiện nghiệm thu**
- Mỗi tính năng có giao thức được chọn kèm lý do.
- Bảng đe dọa có ≥ 8 mục (hijack, flood, IDOR phòng, replay...).
- Thiết kế mở rộng ngang được (adapter Redis).

**Kiến thức nhận lại**
- Realtime protocols
- CRDT vs OT
- WebSocket security

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi khẳng định của AI về CRDT đã kiểm chứng.
- Kiểm chứng độc lập: PoC 2 trình duyệt sửa cùng lúc không mất ký tự.
- Câu hỏi defense: "Vì sao cookie `SameSite=Strict` vẫn cần kiểm tra Origin ở handshake WebSocket?"

#### NGÀY 52 - Hạ tầng realtime: phòng, presence, mở rộng
**Giai đoạn:** Tuần 11 - Live Code | **Kết quả chính:** Gateway realtime theo lớp học, có presence.

**Việc phải làm**
- Gateway, phòng theo lớp/phiên, presence (ai đang online), heartbeat.
- Rate limit tin nhắn, giới hạn kích thước payload.
- Adapter Redis để chạy nhiều instance.
- Test kết nối lại sau mất mạng.

**Bàn giao cuối ngày**
- Realtime gateway
- Test tích hợp realtime
- Dashboard số kết nối

**Điều kiện nghiệm thu**
- Học viên không vào được phòng lớp khác (test IDOR realtime).
- Kết nối lại khôi phục trạng thái < 3 giây.
- 2 instance đồng bộ presence đúng.

**Kiến thức nhận lại**
- Pub/Sub
- Presence systems
- Horizontal scaling

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: code gateway AI sinh; ghi chỗ thiếu kiểm tra quyền.
- Kiểm chứng độc lập: audit IDOR realtime viết tay.
- Câu hỏi defense: "Điều gì xảy ra với tin nhắn khi instance chết?"

#### NGÀY 53 - Editor cộng tác Thầy – Trò
**Giai đoạn:** Tuần 11 - Live Code | **Kết quả chính:** Giảng viên và học viên cùng sửa một file code.

**Việc phải làm**
- Tích hợp CodeMirror + Yjs, con trỏ và vùng chọn của từng người.
- Quyền: học viên mời giảng viên vào bài của mình; giảng viên chỉ xem hoặc sửa khi được cho phép.
- Không áp dụng trong phòng thi (chặn ở máy chủ).
- Lưu snapshot khi kết thúc phiên.

**Bàn giao cuối ngày**
- Editor cộng tác
- Quy tắc quyền phiên
- Video demo 2 người

**Điều kiện nghiệm thu**
- 2 người gõ đồng thời 5 phút: 0 xung đột mất dữ liệu.
- Mở phiên cộng tác trong cuộc thi bị từ chối 403.
- Độ trễ hiển thị p95 < 200 ms trong cùng khu vực.

**Kiến thức nhận lại**
- Collaborative editing
- Access control for sessions
- Latency measurement

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI tích hợp Yjs; ghi lỗi đồng bộ con trỏ và cách sửa.
- Kiểm chứng độc lập: test tự động 2 client giả lập gõ ngẫu nhiên.
- Câu hỏi defense: "Vì sao phải chặn cộng tác trong thi ở máy chủ, không chỉ ẩn nút?"

#### NGÀY 54 - Lớp học trực tiếp
**Giai đoạn:** Tuần 11 - Live Code | **Kết quả chính:** Giảng viên trình chiếu code trực tiếp cho cả lớp.

**Việc phải làm**
- Chế độ broadcast: học viên xem code của giảng viên thời gian thực.
- Giơ tay, hỏi nhanh, giảng viên chọn học viên chia sẻ màn hình code.
- Bài tập nhanh trong buổi (mini-quiz) đẩy tới cả lớp.
- Tích hợp vào *Lớp học của tôi*.

**Bàn giao cuối ngày**
- Live class mode
- Mini-quiz realtime
- Hướng dẫn giảng viên

**Điều kiện nghiệm thu**
- 30 học viên theo dõi đồng thời, độ trễ p95 < 300 ms.
- Mini-quiz thu kết quả 30/30 học viên < 5 giây.
- Học viên chỉ thấy buổi của lớp mình.

**Kiến thức nhận lại**
- Broadcast architecture
- Classroom UX
- Realtime assessment

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi kịch bản UX AI đề xuất bị loại vì không hợp lứa tuổi.
- Kiểm chứng độc lập: buổi học thử với 5 người thật, ghi phản hồi.
- Câu hỏi defense: "Fan-out 30 người vs 300 người khác nhau thế nào?"

#### NGÀY 55 - Ghi lại phiên (replay) và quyền riêng tư
**Giai đoạn:** Tuần 11 - Live Code | **Kết quả chính:** Xem lại buổi học, tôn trọng đồng ý và thời hạn lưu.

**Việc phải làm**
- Ghi sự kiện editor (không ghi âm/hình), phát lại theo thời gian.
- Đồng ý trước khi ghi; trẻ dưới 16 cần consent phụ huynh; xóa sau N ngày.
- Giảng viên xuất bản replay cho lớp.
- Demo Tuần 11.

**Bàn giao cuối ngày**
- Replay player
- Chính sách lưu trữ
- Video demo Tuần 11

**Điều kiện nghiệm thu**
- Không có consent thì không ghi (test).
- Replay tự xóa đúng TTL (test với thời gian giả lập).
- Dung lượng replay 1 giờ < 5 MB.

**Kiến thức nhận lại**
- Event sourcing
- Data retention
- Consent management

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi chính sách AI đề xuất và chỉnh theo quy định dữ liệu cá nhân.
- Kiểm chứng độc lập: audit consent tự động.
- Câu hỏi defense: "Replay có phải dữ liệu cá nhân không, vì sao?"

#### NGÀY 56 - Gọi thoại/video 1-1 bằng WebRTC
**Giai đoạn:** Tuần 12 - Collaboration | **Kết quả chính:** Hỗ trợ 1-1 giữa giảng viên và học viên.

**Việc phải làm**
- WebRTC peer-to-peer, signaling qua gateway, STUN/TURN.
- Opt-in rõ ràng, không ghi âm/hình mặc định, nút tắt mic/cam.
- Chỉ giảng viên phụ trách lớp gọi được học viên lớp đó.
- Fallback khi mạng chặn UDP.

**Bàn giao cuối ngày**
- Tính năng gọi 1-1
- Cấu hình TURN
- Báo cáo kiểm thử mạng

**Điều kiện nghiệm thu**
- Kết nối thành công ≥ 95% trên 3 loại mạng thử nghiệm.
- 0 cuộc gọi chéo lớp (test quyền).
- Không có file media nào lưu trên máy chủ.

**Kiến thức nhận lại**
- WebRTC
- NAT traversal
- Privacy by design

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: cấu hình TURN AI đề xuất; ghi chỗ lộ credential đã sửa.
- Kiểm chứng độc lập: thử trên mạng 4G và mạng trường.
- Câu hỏi defense: "Vì sao cần TURN dù WebRTC là P2P?"

#### NGÀY 57 - Code review trực tiếp và AI gợi ý câu hỏi Socratic
**Giai đoạn:** Tuần 12 - Collaboration | **Kết quả chính:** Giảng viên nhận xét inline, AI hỗ trợ đặt câu hỏi gợi mở.

**Việc phải làm**
- Comment inline theo dòng trên bài nộp, thông báo cho học viên.
- AI gợi ý câu hỏi Socratic cho giảng viên (không đưa lời giải), giảng viên duyệt trước khi gửi.
- Harness đánh giá: không lộ đáp án, phù hợp lứa tuổi.
- Lịch sử review gắn với bài nộp.

**Bàn giao cuối ngày**
- Inline review
- AI Socratic assistant
- Bộ đánh giá leakage

**Điều kiện nghiệm thu**
- 0 gợi ý AI chứa lời giải hoàn chỉnh trên bộ 50 bài thử.
- 100% gợi ý phải qua giảng viên trước khi đến học viên.
- Học viên nhận thông báo < 5 giây.

**Kiến thức nhận lại**
- Code review pedagogy
- AI guardrails
- Evaluation harness

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: prompt và các vòng sửa để AI không lộ đáp án.
- Kiểm chứng độc lập: chạy bộ leakage regression của AI Coach v1.0.
- Câu hỏi defense: "Làm sao đo 'không lộ đáp án' một cách định lượng?"

#### NGÀY 58 - Pair programming học viên – học viên
**Giai đoạn:** Tuần 12 - Collaboration | **Kết quả chính:** Học viên cùng lớp lập trình đôi có kiểm soát.

**Việc phải làm**
- Giảng viên ghép cặp hoặc học viên mời bạn cùng lớp.
- Ghi đóng góp từng người (số ký tự, thời gian) để giảng viên đánh giá công bằng.
- Chặn trong cuộc thi và bài kiểm tra cá nhân.
- Kênh báo cáo hành vi không phù hợp.

**Bàn giao cuối ngày**
- Pair programming
- Thống kê đóng góp
- Quy tắc ứng xử

**Điều kiện nghiệm thu**
- Không ghép được học viên khác lớp/khác khối.
- Thống kê đóng góp chênh < 5% so với đo thủ công.
- Chặn đúng 100% trong ngữ cảnh thi.

**Kiến thức nhận lại**
- Collaborative learning
- Contribution analytics
- Safety features

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi luật ghép cặp AI đề xuất và chỉnh sửa.
- Kiểm chứng độc lập: E2E 2 học viên + 1 giảng viên.
- Câu hỏi defense: "Rủi ro an toàn trẻ em nào phát sinh khi cho học viên nhắn tin nhau?"

#### NGÀY 59 - Load test và chaos realtime
**Giai đoạn:** Tuần 12 - Collaboration | **Kết quả chính:** Realtime chịu tải buổi học thật.

**Việc phải làm**
- Load test 300 kết nối/lớp, 10 lớp đồng thời.
- Chaos: mất mạng client, restart instance, Redis chậm.
- Đo p95 độ trễ, tỉ lệ mất tin, thời gian kết nối lại.
- Tối ưu nút thắt.

**Bàn giao cuối ngày**
- Kịch bản load test realtime
- Báo cáo hiệu năng
- Danh sách tối ưu

**Điều kiện nghiệm thu**
- p95 < 150 ms ở 3.000 kết nối.
- Mất tin = 0 với tin cần đảm bảo.
- Kết nối lại < 3 giây sau restart instance.

**Kiến thức nhận lại**
- Realtime performance
- Backpressure
- Resilience testing

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: script load AI viết; ghi chỗ đo sai (đo tại client giả lập quá tải).
- Kiểm chứng độc lập: đo từ máy thứ hai độc lập.
- Câu hỏi defense: "Backpressure là gì, xử lý thế nào khi client chậm?"

#### NGÀY 60 - Nghiệm thu Giai đoạn 3
**Giai đoạn:** Tuần 12 - Collaboration | **Kết quả chính:** Lớp học trực tiếp hoàn chỉnh, an toàn.

**Việc phải làm**
- Demo buổi học trực tiếp: broadcast, cộng tác, review, gọi 1-1.
- Cập nhật Handbook (phần giảng viên) và Runbook (realtime).
- Live change Tuần 12.
- Retro giai đoạn.

**Bàn giao cuối ngày**
- Video demo GĐ3
- Handbook/Runbook cập nhật
- Biên bản nghiệm thu GĐ3

**Điều kiện nghiệm thu**
- Toàn bộ test cũ + mới pass, E2E thêm luồng realtime.
- Người khác chạy lại demo theo tài liệu không cần hỗ trợ.
- Mọi known issue GĐ3 được ghi.

**Kiến thức nhận lại**
- Technical enablement
- Release readiness
- Retrospective

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log tổng hợp GĐ3.
- Kiểm chứng độc lập: QA chạy E2E realtime.
- Câu hỏi defense: live change do quản lý đưa ra trong 30 phút.

---

### GIAI ĐOẠN 4 — TUẦN 13–14: ADVANCED PROCTORING & AI PHÂN TÍCH HÀNH VI GIAN LẬN

> **Nguyên tắc bất biến của giai đoạn:** AI chỉ tạo **tín hiệu**, không bao giờ tự kết luận gian lận, tự trừ điểm hay hủy bài (giữ nguyên nguyên tắc v1.0). Mọi tín hiệu xâm phạm (webcam, micro) là **opt-in**, xử lý **trên thiết bị**, **không lưu media**, và với người dưới 16 tuổi cần **đồng ý của phụ huynh**.

#### NGÀY 61 - Đánh giá pháp lý, đạo đức và DPIA
**Giai đoạn:** Tuần 13 - Liêm chính hành vi | **Kết quả chính:** Khung pháp lý và đạo đức cho proctoring.

**Việc phải làm**
- Rà soát Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, dữ liệu trẻ em, dữ liệu sinh trắc.
- Đánh giá tác động (DPIA) cho từng tín hiệu dự kiến.
- Thiết kế luồng consent có phiên bản, lưu bằng chứng (xử lý K-04 của v1.0).
- Quy trình kháng nghị cho học viên.

**Bàn giao cuối ngày**
- DPIA
- Chính sách proctoring
- Luồng consent có phiên bản

**Điều kiện nghiệm thu**
- Mỗi tín hiệu có mục đích, căn cứ, thời hạn lưu, người truy cập.
- Consent lưu được thời điểm + phiên bản điều khoản (test).
- Quy trình kháng nghị có SLA trả lời.

**Kiến thức nhận lại**
- Data protection law
- Privacy impact assessment
- Responsible AI

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI tóm tắt quy định; ghi điều khoản đã đối chiếu văn bản gốc.
- Kiểm chứng độc lập: mentor/pháp chế duyệt DPIA.
- Câu hỏi defense: "Vì sao dữ liệu khuôn mặt là dữ liệu nhạy cảm?"

#### NGÀY 62 - Tín hiệu hành vi nhẹ trên trình duyệt
**Giai đoạn:** Tuần 13 - Liêm chính hành vi | **Kết quả chính:** Thu tín hiệu gõ phím/dán/focus không xâm phạm.

**Việc phải làm**
- Thu: sự kiện dán (kích thước), nhịp gõ tổng hợp, thời gian không hoạt động, focus (mở rộng từ out-tab v1.0).
- Chỉ lưu đặc trưng tổng hợp, không lưu nội dung phím.
- Đẩy qua heartbeat có sẵn, máy chủ giữ bộ đếm chính thức.
- Hiển thị cho thí sinh biết đang được giám sát những gì.

**Bàn giao cuối ngày**
- Bộ thu tín hiệu v2
- Schema đặc trưng hành vi
- Thông báo minh bạch cho thí sinh

**Điều kiện nghiệm thu**
- 0 nội dung phím thô được lưu (kiểm tra payload).
- Overhead CPU trình duyệt < 2%.
- Tín hiệu dán 500 ký tự trong 1 giây được ghi nhận đúng.

**Kiến thức nhận lại**
- Behavioral telemetry
- Data minimization
- Transparency UX

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi tín hiệu AI đề xuất bị loại vì xâm phạm.
- Kiểm chứng độc lập: kiểm tra payload mạng bằng DevTools.
- Câu hỏi defense: "Vì sao tín hiệu dán không đồng nghĩa với gian lận?"

#### NGÀY 63 - So khớp mã nguồn nâng cao
**Giai đoạn:** Tuần 13 - Liêm chính hành vi | **Kết quả chính:** Phát hiện bài nộp sao chép kể cả khi đổi tên biến.

**Việc phải làm**
- Fingerprint AST + winnowing (kiểu MOSS) cho Python/C++/JS.
- So cặp trong cùng cuộc thi, chuẩn hóa tên biến/khoảng trắng.
- Ngưỡng có hiệu chuẩn bằng tập dữ liệu thật đã gán nhãn.
- Hiển thị đoạn trùng song song cho giảng viên.

**Bàn giao cuối ngày**
- Engine similarity v2
- Bộ dữ liệu hiệu chuẩn
- Giao diện so sánh

**Điều kiện nghiệm thu**
- Bắt được ≥ 95% cặp sao chép đổi tên biến trong tập thử.
- FP < 5% trên bài ngắn (dưới 10 dòng xử lý riêng).
- So 200 bài nộp < 30 giây.

**Kiến thức nhận lại**
- Plagiarism detection
- AST normalization
- Threshold calibration

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: thuật toán winnowing AI viết; ghi lỗi k-gram và sửa.
- Kiểm chứng độc lập: tập thử tự tạo các biến thể sao chép.
- Câu hỏi defense: "Vì sao bài 'Hello World' không được tính là sao chép?"

#### NGÀY 64 - Tín hiệu nội dung do AI sinh (yếu, chỉ cảnh báo)
**Giai đoạn:** Tuần 13 - Liêm chính hành vi | **Kết quả chính:** Đo được độ tin cậy của tín hiệu AI-generated.

**Việc phải làm**
- Thử nghiệm tín hiệu: phong cách mã, so với lời giải AI phổ biến, dán khối lớn.
- Đo FP/FN trên tập có nhãn; công bố giới hạn.
- Chỉ hiển thị như tín hiệu phụ, trọng số thấp.
- Quyết định có/không đưa vào production theo số liệu.

**Bàn giao cuối ngày**
- Báo cáo đánh giá tín hiệu
- Quyết định đưa vào/không
- Model card tín hiệu

**Điều kiện nghiệm thu**
- FP rate được báo cáo theo khối.
- Nếu FP > 10% thì không bật mặc định (ghi trong ADR).
- Tín hiệu không bao giờ một mình nâng mức rủi ro lên "cao".

**Kiến thức nhận lại**
- Detection limits
- Precision/recall trade-off
- Honest reporting

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi khẳng định "phát hiện AI chính xác cao" bị bác bỏ bằng số liệu.
- Kiểm chứng độc lập: tập thử có bài viết tay đã biết.
- Câu hỏi defense: "Vì sao detector AI-generated dễ gây oan cho học sinh giỏi?"

#### NGÀY 65 - Bảng rủi ro liêm chính hợp nhất
**Giai đoạn:** Tuần 13 - Liêm chính hành vi | **Kết quả chính:** Giảng viên xem rủi ro có giải thích, xếp ưu tiên.

**Việc phải làm**
- Điểm rủi ro tổng hợp từ out-tab, dán, similarity, heartbeat; mỗi điểm kèm lý do.
- Hàng ưu tiên "Cần xem xét" mở rộng từ v1.0, quyết định *Không công nhận / Khôi phục* có lý do + nhật ký.
- Học viên xem được tín hiệu về mình khi kháng nghị.
- Demo Tuần 13.

**Bàn giao cuối ngày**
- Integrity dashboard v2
- Quy trình kháng nghị trên UI
- Video demo Tuần 13

**Điều kiện nghiệm thu**
- 100% điểm rủi ro có danh sách lý do.
- Không có hành động tự động trừ điểm/hủy bài (audit).
- Kháng nghị ghi nhật ký đủ người, thời điểm, kết quả.

**Kiến thức nhận lại**
- Explainable scoring
- Due process design
- Audit trails

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: công thức điểm rủi ro AI đề xuất và chỉnh trọng số.
- Kiểm chứng độc lập: giảng viên thử xếp hạng mù so với hệ thống.
- Câu hỏi defense: "Vì sao không tự động hủy bài khi rủi ro rất cao?"

#### NGÀY 66 - Kiểm tra hiện diện bằng webcam (opt-in, on-device)
**Giai đoạn:** Tuần 14 - Proctoring nâng cao | **Kết quả chính:** Đếm khuôn mặt trên thiết bị, không gửi hình.

**Việc phải làm**
- Mô hình phát hiện khuôn mặt chạy trong trình duyệt (WebAssembly/WebGL), chỉ gửi số lượng mặt (0/1/≥2).
- Chỉ bật cho cuộc thi được cấu hình, người dùng ≥ 16 tuổi hoặc có consent phụ huynh.
- Đèn báo đang bật camera, tắt được (ghi nhận tắt như một tín hiệu, không phạt).
- Không lưu, không truyền khung hình.

**Bàn giao cuối ngày**
- Presence check on-device
- Cấu hình bật theo cuộc thi
- Báo cáo kiểm tra mạng (không có ảnh)

**Điều kiện nghiệm thu**
- 0 byte hình ảnh rời trình duyệt (kiểm tra network).
- Độ chính xác đếm mặt ≥ 95% trong điều kiện ánh sáng thường.
- Không bật được cho tài khoản Khối 3–5.

**Kiến thức nhận lại**
- On-device ML
- Privacy-preserving computing
- Consent-gated features

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi đề xuất AI gửi ảnh về máy chủ để "chính xác hơn" và lý do bác bỏ.
- Kiểm chứng độc lập: soi traffic bằng proxy.
- Câu hỏi defense: "Vì sao xử lý trên thiết bị giảm rủi ro pháp lý?"

#### NGÀY 67 - Hướng nhìn/tư thế đầu (nhẹ nhàng)
**Giai đoạn:** Tuần 14 - Proctoring nâng cao | **Kết quả chính:** Tín hiệu nhìn ra ngoài màn hình kéo dài.

**Việc phải làm**
- Ước lượng tư thế đầu trên thiết bị, chỉ tính khi nhìn ra ngoài > N giây liên tục.
- Hiệu chuẩn cá nhân 10 giây đầu phiên.
- Gộp thành số lần/tổng thời gian, không lưu chuỗi khung hình.
- Ngưỡng có thể điều chỉnh theo cuộc thi.

**Bàn giao cuối ngày**
- Look-away signal
- Bước hiệu chuẩn
- Báo cáo ngưỡng

**Điều kiện nghiệm thu**
- FP < 5% khi thí sinh nhìn bàn phím/giấy nháp trong tập thử.
- Tắt camera không làm hỏng bài thi.
- CPU trình duyệt < 15% trên máy tầm trung.

**Kiến thức nhận lại**
- Head pose estimation
- Calibration
- Performance budgeting

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi ngưỡng AI đề xuất và kết quả hiệu chuẩn thực tế.
- Kiểm chứng độc lập: 5 người thử với hành vi kịch bản.
- Câu hỏi defense: "Học sinh khiếm thị/đeo kính dày bị ảnh hưởng thế nào?"

#### NGÀY 68 - Phát hiện giọng nói (opt-in, không ghi âm)
**Giai đoạn:** Tuần 14 - Proctoring nâng cao | **Kết quả chính:** Tín hiệu có hội thoại trong phòng thi.

**Việc phải làm**
- Voice Activity Detection trên thiết bị, chỉ gửi thời lượng có giọng nói.
- Phân biệt tiếng ồn nền (quạt, xe) bằng ngưỡng năng lượng + VAD.
- Opt-in theo cuộc thi, thông báo rõ.
- Gộp vào điểm rủi ro với trọng số thấp.

**Bàn giao cuối ngày**
- VAD signal
- Cấu hình opt-in
- Báo cáo nhiễu

**Điều kiện nghiệm thu**
- 0 byte âm thanh rời thiết bị.
- FP do tiếng ồn nền < 5% trong tập thử.
- Có thể tắt trong 1 thao tác.

**Kiến thức nhận lại**
- Audio signal processing
- VAD
- Signal fusion

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi lựa chọn mô hình VAD và kiểm chứng.
- Kiểm chứng độc lập: bộ âm thanh thử ở 3 môi trường.
- Câu hỏi defense: "Vì sao không dùng speech-to-text để 'chắc chắn hơn'?"

#### NGÀY 69 - Đánh giá công bằng và tỉ lệ cảnh báo sai
**Giai đoạn:** Tuần 14 - Proctoring nâng cao | **Kết quả chính:** Proctoring được chứng minh công bằng ở mức chấp nhận.

**Việc phải làm**
- Thử nghiệm có đồng ý với nhóm đa dạng (thiết bị, ánh sáng, mạng).
- Đo FP theo nhóm; điều chỉnh ngưỡng.
- Diễn tập quy trình kháng nghị đầu-cuối.
- Cập nhật model card và DPIA.

**Bàn giao cuối ngày**
- Báo cáo công bằng
- Ngưỡng cuối
- DPIA cập nhật

**Điều kiện nghiệm thu**
- FP tổng < 5%, chênh FP giữa các nhóm < 2 điểm %.
- 100% kháng nghị thử được xử lý trong SLA.
- Không có tín hiệu nào một mình dẫn tới "rủi ro cao".

**Kiến thức nhận lại**
- Fairness evaluation
- Bias mitigation
- Governance

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: phân tích công bằng AI hỗ trợ; ghi chỗ AI hiểu sai chỉ số.
- Kiểm chứng độc lập: mentor duyệt báo cáo công bằng.
- Câu hỏi defense: "Khi FP thấp tổng thể nhưng cao ở một nhóm thì làm gì?"

#### NGÀY 70 - Nghiệm thu Giai đoạn 4
**Giai đoạn:** Tuần 14 - Proctoring nâng cao | **Kết quả chính:** Proctoring nâng cao bàn giao được, có kiểm soát.

**Việc phải làm**
- Demo cuộc thi có proctoring đầy đủ, bật/tắt từng tín hiệu.
- Cập nhật Handbook (giảng viên: cách đọc tín hiệu), chính sách công khai cho học viên/phụ huynh.
- Live change Tuần 14.
- Retro giai đoạn.

**Bàn giao cuối ngày**
- Video demo GĐ4
- Tài liệu chính sách
- Biên bản nghiệm thu GĐ4

**Điều kiện nghiệm thu**
- Audit: không có đường nào AI tự kết luận gian lận.
- Test consent/age gate pass 100%.
- Known issues GĐ4 được ghi đầy đủ.

**Kiến thức nhận lại**
- Responsible AI operations
- Policy communication
- Release ownership

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log tổng hợp GĐ4.
- Kiểm chứng độc lập: QA audit quyền riêng tư.
- Câu hỏi defense: live change (vd tắt toàn bộ tín hiệu media cho một cuộc thi) trong 30 phút.

---

### GIAI ĐOẠN 5 — TUẦN 15–16: GAMIFICATION, ĐẤU TRƯỜNG 1V1 THỜI GIAN THỰC & TOURNAMENT ENGINE

#### NGÀY 71 - Thiết kế gamification theo lứa tuổi
**Giai đoạn:** Tuần 15 - Gamification & 1v1 | **Kết quả chính:** Hệ thống động lực lành mạnh, không gây nghiện.

**Việc phải làm**
- Thiết kế XP, huy hiệu, chuỗi ngày học (streak) khác nhau cho 3–5, 6–9, 10–12, người đi làm.
- Rà dark pattern (FOMO, phạt mất streak gắt), giới hạn thông báo với trẻ em.
- Bảng Vinh Danh Kid dùng biệt danh/ẩn danh mặc định (xử lý K-06 v1.0).
- ADR-015 gamification.

**Bàn giao cuối ngày**
- Đặc tả gamification
- Checklist dark pattern
- ADR-015

**Điều kiện nghiệm thu**
- Mỗi cơ chế gắn với mục tiêu học tập đo được.
- 0 dark pattern trong checklist ≥ 10 mục.
- Kid Mode không hiện họ tên đầy đủ khi chưa có consent.

**Kiến thức nhận lại**
- Motivation design
- Ethical gamification
- Age-appropriate design

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ý tưởng AI bị loại vì gây nghiện.
- Kiểm chứng độc lập: usability với 3 nhóm tuổi.
- Câu hỏi defense: "Streak giúp hay hại việc học, đo thế nào?"

#### NGÀY 72 - XP, huy hiệu, streak và chống farm
**Giai đoạn:** Tuần 15 - Gamification & 1v1 | **Kết quả chính:** Điểm thưởng ghi nhận đúng, không bị khai thác.

**Việc phải làm**
- Ghi XP theo sự kiện học tập (AC lần đầu, độ khó, không dùng gợi ý).
- Chống farm: nộp lại bài đã AC, bài quá dễ lặp, nhiều tài khoản.
- Huy hiệu cấp theo luật khai báo, idempotent.
- UI hồ sơ và Bảng Vinh Danh.

**Bàn giao cuối ngày**
- Engine XP/huy hiệu
- Luật chống farm
- UI gamification

**Điều kiện nghiệm thu**
- Nộp lại bài đã AC không cộng XP (test).
- Cấp huy hiệu idempotent khi chạy lại sự kiện.
- XP khớp tính tay trên 20 học viên mẫu.

**Kiến thức nhận lại**
- Rules engine
- Abuse prevention
- Idempotent processing

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: luật AI sinh; ghi lỗ farm tự tìm ra.
- Kiểm chứng độc lập: QA cố tình farm XP.
- Câu hỏi defense: "Vì sao XP phải tính ở máy chủ?"

#### NGÀY 73 - Hệ thống rating Elo/Glicko-2
**Giai đoạn:** Tuần 15 - Gamification & 1v1 | **Kết quả chính:** Đánh giá năng lực thi đấu ổn định.

**Việc phải làm**
- Cài Glicko-2 (rating, độ lệch, biến động), rating riêng theo khối.
- Rating tạm cho người mới, hội tụ sau N trận.
- Mô phỏng 10.000 trận để kiểm tra hội tụ.
- Lịch sử rating trên hồ sơ.

**Bàn giao cuối ngày**
- Rating service
- Báo cáo mô phỏng
- UI lịch sử rating

**Điều kiện nghiệm thu**
- Mô phỏng: rating hội tụ về năng lực thật (sai số < 5%).
- Test so với ví dụ chuẩn của Glicko-2.
- Không tạo rating cho Khối 3–5.

**Kiến thức nhận lại**
- Rating systems
- Simulation
- Statistical convergence

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: công thức AI viết; ghi lỗi đơn vị (thang 173.7) phát hiện khi so ví dụ chuẩn.
- Kiểm chứng độc lập: tính tay 1 trận theo tài liệu gốc.
- Câu hỏi defense: "Glicko-2 khác Elo ở điểm nào quan trọng với người mới?"

#### NGÀY 74 - Matchmaking 1v1
**Giai đoạn:** Tuần 15 - Gamification & 1v1 | **Kết quả chính:** Ghép đối thủ cân bằng, nhanh.

**Việc phải làm**
- Hàng chờ realtime theo khối + rating, nới khoảng rating theo thời gian chờ.
- Chọn đề theo rating trung bình của cặp, tránh đề đã làm.
- Chống tự ghép (nhiều tài khoản cùng thiết bị/IP – tín hiệu, không chặn cứng).
- Hủy hàng chờ, timeout.

**Bàn giao cuối ngày**
- Matchmaking service
- Thuật toán chọn đề
- Báo cáo thời gian chờ

**Điều kiện nghiệm thu**
- Thời gian chờ p95 < 60 giây với 100 người online mô phỏng.
- Chênh rating trung bình cặp < 150.
- Không ghép khác khối.

**Kiến thức nhận lại**
- Matchmaking algorithms
- Queue fairness
- Realtime systems

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: thuật toán AI đề xuất và mô phỏng kiểm chứng.
- Kiểm chứng độc lập: mô phỏng tải với phân bố rating thật.
- Câu hỏi defense: "Đánh đổi giữa chờ lâu và trận lệch?"

#### NGÀY 75 - Đấu trường 1v1 thời gian thực
**Giai đoạn:** Tuần 15 - Gamification & 1v1 | **Kết quả chính:** Hai học viên thi cùng đề, thấy tiến độ đối thủ.

**Việc phải làm**
- Phòng đấu: đồng hồ chung, cùng đề, tiến độ đối thủ (số test đã qua, **không lộ mã**).
- Chấm qua Worker Judge v2, kết quả realtime, cập nhật rating.
- Xử lý mất kết nối (tạm dừng/forfeit có luật).
- Demo Tuần 15.

**Bàn giao cuối ngày**
- Arena 1v1
- Luật đấu
- Video demo Tuần 15

**Điều kiện nghiệm thu**
- 0 rò rỉ mã đối thủ qua WebSocket (kiểm tra payload).
- Kết quả và rating cập nhật < 3 giây sau AC.
- Mất kết nối 30 giây được xử lý đúng luật.

**Kiến thức nhận lại**
- Competitive systems
- State synchronization
- Fair play design

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi chỗ AI gửi nhầm dữ liệu thừa qua socket.
- Kiểm chứng độc lập: E2E 2 trình duyệt.
- Câu hỏi defense: "Vì sao chỉ gửi số test đã qua mà không gửi trạng thái chi tiết?"

#### NGÀY 76 - Liêm chính đấu trường
**Giai đoạn:** Tuần 16 - Tournament | **Kết quả chính:** Hạn chế smurf, thông đồng, gian lận trong đấu.

**Việc phải làm**
- Áp dụng tín hiệu GĐ4 (out-tab, dán, similarity) vào đấu trường.
- Phát hiện thông đồng (cặp thường xuyên đấu nhau, thua có chủ đích).
- Phát hiện smurf (tài khoản mới tăng rating bất thường) — chỉ cảnh báo.
- Quy trình xử lý: giảng viên/admin quyết định, hoàn rating.

**Bàn giao cuối ngày**
- Arena integrity rules
- Công cụ hoàn rating
- Báo cáo thử nghiệm

**Điều kiện nghiệm thu**
- Phát hiện ≥ 90% kịch bản thông đồng mô phỏng.
- Hoàn rating chính xác (test).
- Không có hình phạt tự động.

**Kiến thức nhận lại**
- Anomaly detection
- Collusion analysis
- Remediation workflows

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: luật phát hiện AI đề xuất và FP đo được.
- Kiểm chứng độc lập: QA đóng vai thông đồng.
- Câu hỏi defense: "Phân biệt bạn thân hay đấu nhau với thông đồng?"

#### NGÀY 77 - Tournament Engine: thể thức và bracket
**Giai đoạn:** Tuần 16 - Tournament | **Kết quả chính:** Tạo giải theo nhiều thể thức.

**Việc phải làm**
- Thể thức: loại trực tiếp, Swiss, vòng bảng → loại trực tiếp.
- Sinh bracket, xếp hạt giống theo rating.
- Mô hình dữ liệu giải, vòng, trận, kết quả.
- Test tính đúng của cặp đấu Swiss (không gặp lại).

**Bàn giao cuối ngày**
- Tournament engine core
- Bộ test thể thức
- Sơ đồ dữ liệu

**Điều kiện nghiệm thu**
- Swiss 64 người 6 vòng: 0 cặp gặp lại.
- Bracket loại trực tiếp xử lý số người không phải lũy thừa 2 (bye).
- Test cho cả 3 thể thức.

**Kiến thức nhận lại**
- Tournament design
- Pairing algorithms
- Domain modeling

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: thuật toán Swiss AI viết; ghi trường hợp lẻ người sai.
- Kiểm chứng độc lập: so với công cụ Swiss tham chiếu.
- Câu hỏi defense: "Tie-break Buchholz là gì?"

#### NGÀY 78 - Vận hành giải: lịch, đăng ký, tie-break, bỏ cuộc
**Giai đoạn:** Tuần 16 - Tournament | **Kết quả chính:** Giải chạy được từ đăng ký đến trao giải.

**Việc phải làm**
- Lịch giải, đăng ký theo khối, giới hạn số người.
- Tie-break, xử lý bỏ cuộc/vắng mặt/không kết nối.
- Giảng viên tổ chức giải trong Teacher Studio (không cần dev).
- Thông báo trước giờ đấu.

**Bàn giao cuối ngày**
- Tournament management UI
- Luật xử lý ngoại lệ
- Hướng dẫn tổ chức giải

**Điều kiện nghiệm thu**
- Giảng viên tạo giải 32 người không cần hỗ trợ (usability test).
- Bỏ cuộc giữa giải không làm hỏng bracket.
- Thông báo gửi đúng 100% người đăng ký.

**Kiến thức nhận lại**
- Event operations
- Exception handling
- Teacher enablement

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi luật ngoại lệ tự bổ sung.
- Kiểm chứng độc lập: giảng viên thật tổ chức giải thử.
- Câu hỏi defense: "Xử lý thế nào khi máy chấm chậm giữa giải?"

#### NGÀY 79 - Leaderboard đa tầng và mùa giải
**Giai đoạn:** Tuần 16 - Tournament | **Kết quả chính:** Xếp hạng lớp/trường/hệ thống hiệu năng cao.

**Việc phải làm**
- Leaderboard theo lớp, trường, toàn hệ thống, theo mùa.
- Tổng hợp sẵn/chỉ mục (xử lý K-15 v1.0), cache có kiểm soát.
- Ẩn danh hóa trẻ em, mã tạm thay `userId` (xử lý K-07 v1.0).
- Reset mùa và lưu lịch sử.

**Bàn giao cuối ngày**
- Leaderboard service v2
- Chiến lược tổng hợp
- Báo cáo hiệu năng

**Điều kiện nghiệm thu**
- Truy vấn leaderboard p95 < 100 ms với 100.000 học viên mô phỏng.
- 0 `userId` thật trong API công khai.
- Reset mùa không mất lịch sử.

**Kiến thức nhận lại**
- Data aggregation
- Caching strategy
- Privacy in rankings

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: pipeline tổng hợp AI đề xuất; ghi lỗi nhất quán phát hiện.
- Kiểm chứng độc lập: so leaderboard tổng hợp với tính trực tiếp.
- Câu hỏi defense: "Cache leaderboard bao lâu là chấp nhận được trong giờ thi?"

#### NGÀY 80 - Giải thử 64 người và nghiệm thu Giai đoạn 5
**Giai đoạn:** Tuần 16 - Tournament | **Kết quả chính:** Một giải thật chạy hết vòng.

**Việc phải làm**
- Tổ chức giải Swiss 64 người (người thật + bot mô phỏng) trên staging.
- Giám sát tải, liêm chính, rating trong suốt giải.
- Cập nhật Handbook (tổ chức giải), Runbook (sự cố giải).
- Live change Tuần 16 + retro.

**Bàn giao cuối ngày**
- Báo cáo giải thử
- Video demo GĐ5
- Biên bản nghiệm thu GĐ5

**Điều kiện nghiệm thu**
- Giải hoàn tất 100% vòng, 0 trận mất kết quả.
- p95 chấm < 3 giây trong giờ cao điểm giải.
- Mọi sự cố trong giải có ghi chép và xử lý theo Runbook.

**Kiến thức nhận lại**
- Live operations
- Incident handling
- Product validation

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log tổng hợp GĐ5.
- Kiểm chứng độc lập: QA giám sát giải độc lập.
- Câu hỏi defense: live change trong 30 phút.

---

### GIAI ĐOẠN 6 — TUẦN 17–18: DỰ BÁO HỌC VIÊN CÓ NGUY CƠ BỎ CUỘC (AT-RISK PREDICTION) & BÀN GIAO V2.0 ENTERPRISE

#### NGÀY 81 - Định nghĩa bài toán at-risk và đạo đức
**Giai đoạn:** Tuần 17 - At-risk | **Kết quả chính:** Nhãn "bỏ cuộc" rõ ràng, nguyên tắc sử dụng có trách nhiệm.

**Việc phải làm**
- Định nghĩa bỏ cuộc (vd không hoạt động 14 ngày + chưa xong 30% lộ trình) cùng giảng viên.
- Xây feature store từ event log GĐ2 (tần suất, AC rate, dùng gợi ý, mức thành thạo KC, chuyên cần lớp).
- Nguyên tắc: cảnh báo chỉ cho giảng viên, **không dán nhãn công khai**, không ảnh hưởng điểm.
- DPIA bổ sung.

**Bàn giao cuối ngày**
- Định nghĩa nhãn
- Feature store v1
- Nguyên tắc sử dụng at-risk

**Điều kiện nghiệm thu**
- Nhãn được ≥ 2 giảng viên đồng thuận.
- Đặc trưng tính được cho 100% học viên có dữ liệu.
- 0 đặc trưng dùng thuộc tính nhạy cảm (giới tính, nơi ở).

**Kiến thức nhận lại**
- Problem framing
- Feature engineering
- Ethical ML

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: đặc trưng AI đề xuất bị loại vì nhạy cảm.
- Kiểm chứng độc lập: giảng viên duyệt định nghĩa nhãn.
- Câu hỏi defense: "Vì sao dự báo sai có thể gây hại cho học viên?"

#### NGÀY 82 - Mô hình baseline và kiểm định theo thời gian
**Giai đoạn:** Tuần 17 - At-risk | **Kết quả chính:** Mô hình dự báo có số liệu đáng tin.

**Việc phải làm**
- Logistic regression và gradient boosting trên feature store.
- Kiểm định theo thời gian (rolling), tránh rò rỉ tương lai.
- Đo AUC, recall ở mức precision chấp nhận được, Brier score.
- Phân tích lỗi theo khối.

**Bàn giao cuối ngày**
- 2 mô hình baseline
- Báo cáo đánh giá
- Pipeline huấn luyện tái lập

**Điều kiện nghiệm thu**
- Recall ≥ 70% ở precision ≥ 50% trên tập kiểm định thời gian.
- Huấn luyện lại cho cùng kết quả với cùng seed.
- Test chống rò rỉ dữ liệu tự động.

**Kiến thức nhận lại**
- Classification modeling
- Time-based validation
- Reproducible ML

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: code mô hình AI sinh; ghi lỗi rò rỉ đặc trưng tương lai phát hiện được.
- Kiểm chứng độc lập: chạy lại pipeline từ đầu trên máy khác.
- Câu hỏi defense: "Vì sao không dùng random split cho bài toán này?"

#### NGÀY 83 - Giải thích, hiệu chuẩn và công bằng
**Giai đoạn:** Tuần 17 - At-risk | **Kết quả chính:** Dự báo giải thích được và công bằng.

**Việc phải làm**
- Giải thích từng dự báo (SHAP/hệ số) bằng ngôn ngữ giảng viên hiểu.
- Hiệu chuẩn xác suất (Platt/isotonic).
- Đánh giá công bằng theo khối, theo lớp.
- Model card at-risk.

**Bàn giao cuối ngày**
- Module giải thích
- Báo cáo hiệu chuẩn
- Model card

**Điều kiện nghiệm thu**
- 100% cảnh báo có ≥ 3 lý do chính.
- Sai số hiệu chuẩn (ECE) < 0,05.
- Chênh recall giữa khối < 10 điểm %.

**Kiến thức nhận lại**
- Explainable AI
- Probability calibration
- Fairness metrics

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi diễn giải SHAP sai của AI và cách sửa.
- Kiểm chứng độc lập: giảng viên đọc 10 giải thích, chấm độ dễ hiểu.
- Câu hỏi defense: "Xác suất 0,7 nghĩa là gì với giảng viên?"

#### NGÀY 84 - Cảnh báo sớm và gợi ý can thiệp cho giảng viên
**Giai đoạn:** Tuần 17 - At-risk | **Kết quả chính:** Giảng viên nhận danh sách học viên cần hỗ trợ kèm hành động gợi ý.

**Việc phải làm**
- Danh sách at-risk trong *Lớp học của tôi*, chỉ giảng viên phụ trách thấy.
- Gợi ý can thiệp (nhắn hỏi thăm, giao bài ôn KC yếu từ GĐ2, hẹn gọi 1-1 từ GĐ3).
- Ghi lại can thiệp đã làm và phản hồi.
- Cấu hình tần suất cảnh báo tránh quá tải.

**Bàn giao cuối ngày**
- At-risk dashboard
- Thư viện can thiệp
- Nhật ký can thiệp

**Điều kiện nghiệm thu**
- Học viên/giảng viên khác lớp không xem được (audit IDOR).
- Mỗi cảnh báo có ≥ 1 hành động gợi ý.
- Giảng viên hoàn thành 1 can thiệp < 1 phút (usability).

**Kiến thức nhận lại**
- Early warning systems
- Teacher workflow design
- Closed-loop feedback

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: nội dung tin nhắn AI soạn sẵn, bắt buộc giảng viên duyệt.
- Kiểm chứng độc lập: audit quyền truy cập dữ liệu at-risk.
- Câu hỏi defense: "Vì sao không gửi cảnh báo trực tiếp cho học viên?"

#### NGÀY 85 - Đo hiệu quả can thiệp
**Giai đoạn:** Tuần 17 - At-risk | **Kết quả chính:** Biết can thiệp có giúp học viên quay lại hay không.

**Việc phải làm**
- Thiết kế đánh giá (A/B có đạo đức hoặc quasi-experiment) với giảng viên đồng ý.
- Chỉ số: tỉ lệ quay lại học trong 7 ngày, tiến độ sau can thiệp.
- Phân tích và giới hạn kết luận (cỡ mẫu nhỏ).
- Demo Tuần 17.

**Bàn giao cuối ngày**
- Thiết kế thí nghiệm
- Báo cáo hiệu quả sơ bộ
- Video demo Tuần 17

**Điều kiện nghiệm thu**
- Thiết kế có nhóm so sánh và tính cỡ mẫu.
- Báo cáo có khoảng tin cậy, nêu rõ giới hạn.
- Không nhóm học viên nào bị từ chối hỗ trợ vì thí nghiệm.

**Kiến thức nhận lại**
- Experiment design
- Causal inference basics
- Research ethics

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi kết luận "AI nói hiệu quả" đã bị hạ mức vì cỡ mẫu.
- Kiểm chứng độc lập: mentor duyệt phân tích.
- Câu hỏi defense: "Tương quan khác nhân quả thế nào trong bài toán này?"

#### NGÀY 86 - Enterprise: multi-tenant, SSO và RBAC mở rộng
**Giai đoạn:** Tuần 18 - Enterprise | **Kết quả chính:** Nhiều trường/tổ chức dùng chung hệ thống tách biệt dữ liệu.

**Việc phải làm**
- Mô hình tenant (trường/tổ chức), cô lập dữ liệu ở tầng truy vấn (mọi query có `tenantId`).
- SSO OIDC/SAML cho tổ chức; giữ đăng nhập mật khẩu cho cá nhân.
- RBAC mở rộng: Admin tổ chức, Trưởng bộ môn, Giảng viên, Trợ giảng.
- Buộc đổi mật khẩu yếu cũ (xử lý K-03 v1.0).

**Bàn giao cuối ngày**
- Multi-tenant core
- SSO tích hợp
- Ma trận RBAC v2

**Điều kiện nghiệm thu**
- Audit cross-tenant: 0 truy cập chéo trên ≥ 30 kịch bản.
- SSO đăng nhập thành công với 1 IdP thử nghiệm.
- 5 audit v1.0 vẫn pass trong chế độ một tenant.

**Kiến thức nhận lại**
- Multi-tenancy
- Identity federation
- Authorization design

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: ghi truy vấn AI quên `tenantId` và cách phát hiện bằng audit.
- Kiểm chứng độc lập: audit cross-tenant viết tay.
- Câu hỏi defense: "Vì sao lọc tenant ở middleware vẫn chưa đủ?"

#### NGÀY 87 - Báo cáo tổ chức, SLA và tuân thủ
**Giai đoạn:** Tuần 18 - Enterprise | **Kết quả chính:** Tổ chức có báo cáo và cam kết dịch vụ.

**Việc phải làm**
- Báo cáo cho tổ chức: tiến độ, kết quả thi, liêm chính, at-risk tổng hợp; xuất CSV/PDF.
- Quyền xuất dữ liệu và xóa dữ liệu theo yêu cầu (quyền chủ thể dữ liệu).
- Định nghĩa SLA/SLO v2.0, nối dashboard GĐ1.
- Nhật ký audit tổ chức.

**Bàn giao cuối ngày**
- Bộ báo cáo tổ chức
- Quy trình xuất/xóa dữ liệu
- Tài liệu SLA

**Điều kiện nghiệm thu**
- Xuất dữ liệu một học viên đầy đủ < 1 phút.
- Xóa dữ liệu theo yêu cầu có xác nhận và nhật ký.
- SLO đo được trên dashboard (uptime, p95 chấm).

**Kiến thức nhận lại**
- Enterprise reporting
- Data subject rights
- Service level management

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: mẫu báo cáo AI tạo; ghi số liệu đã đối chiếu.
- Kiểm chứng độc lập: thử yêu cầu xóa dữ liệu đầu-cuối.
- Câu hỏi defense: "Xóa dữ liệu học viên nhưng giữ thống kê lớp thế nào?"

#### NGÀY 88 - Hardening, pentest và load test v2.0
**Giai đoạn:** Tuần 18 - Enterprise | **Kết quả chính:** v2.0 qua kiểm thử bảo mật và tải toàn diện.

**Việc phải làm**
- Pentest theo OWASP ASVS: auth, SSO, realtime, sandbox, multi-tenant, AI prompt injection.
- Load test tổng: chấm + realtime + giải đấu đồng thời.
- Sửa lỗi Critical/High, ghi Medium/Low vào known issues.
- Chạy lại toàn bộ test và audit.

**Bàn giao cuối ngày**
- Báo cáo pentest
- Báo cáo load test v2.0
- Danh sách lỗi đã sửa

**Điều kiện nghiệm thu**
- 0 lỗi Critical/High còn mở.
- Chịu tải mục tiêu (vd 5.000 học viên hoạt động) với p95 trong SLO.
- 100% test tự động pass.

**Kiến thức nhận lại**
- Penetration testing
- Capacity validation
- Risk-based remediation

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: AI hỗ trợ tìm lỗ hổng; ghi lỗi AI báo sai (false positive).
- Kiểm chứng độc lập: QA pentest độc lập.
- Câu hỏi defense: "Prompt injection vào AI Coach/AI Tạo Đề nguy hiểm thế nào?"

#### NGÀY 89 - Tài liệu v2.0, migration v1 → v2 và đào tạo
**Giai đoạn:** Tuần 18 - Enterprise | **Kết quả chính:** Người khác vận hành và nâng cấp được v2.0.

**Việc phải làm**
- Cập nhật Handbook Admin/Giảng viên v2.0 (ảnh chụp thật), Runbook v2.0, Release Notes v2.0.
- Hướng dẫn migration dữ liệu v1.0 → v2.0 có `--dry-run`, rollback.
- Buổi đào tạo giảng viên/admin, video hướng dẫn.
- Diễn tập nâng cấp trên bản sao dữ liệu v1.0.

**Bàn giao cuối ngày**
- Bộ tài liệu v2.0
- Hướng dẫn migration
- Video đào tạo

**Điều kiện nghiệm thu**
- Người chưa tham gia dự án nâng cấp v1→v2 theo tài liệu thành công.
- Tài liệu khớp release (kiểm tra chéo ảnh và luồng).
- Migration rollback được trong < 30 phút.

**Kiến thức nhận lại**
- Technical writing
- Upgrade engineering
- Training delivery

**Bằng chứng sử dụng và làm chủ AI**
- AI Work Log: phần tài liệu AI soạn; ghi chỗ AI mô tả sai giao diện thực tế.
- Kiểm chứng độc lập: người mới làm theo tài liệu, ghi chỗ vướng.
- Câu hỏi defense: "Tài liệu nào quan trọng nhất khi có sự cố lúc 2 giờ sáng?"

#### NGÀY 90 - Release v2.0 Enterprise, demo và retro
**Giai đoạn:** Tuần 18 - Enterprise | **Kết quả chính:** Bàn giao CyberSoft Learning & Contest Hub v2.0 Enterprise.

**Việc phải làm**
- Release gate v2.0: test, audit, pentest, load, tài liệu, known issues.
- Demo end-to-end 30 phút: học viên – giảng viên – giải đấu – proctoring – at-risk – admin tổ chức.
- Retro 60 ngày: metric, rủi ro, trade-off, bài học về AI.
- Roadmap tiếp theo (v2.x/v3.0).

**Bàn giao cuối ngày**
- Release v2.0
- Video demo + slide
- Retro + roadmap tiếp theo

**Điều kiện nghiệm thu**
- Mọi điều kiện cổng nghiệm thu cuối kỳ (mục 7) đạt.
- Demo không dùng thao tác bí mật, dữ liệu tái lập.
- Tất cả known issues v2.0 được ghi.

**Kiến thức nhận lại**
- Release ownership
- Product demo
- Continuous improvement

**Bằng chứng sử dụng và làm chủ AI**
- Cập nhật AI_WORKLOG tổng hợp 60 ngày: đề xuất AI chấp nhận/bác bỏ, lỗi AI và cách phát hiện, cải tiến harness.
- Chạy toàn bộ test/checklist độc lập với kết luận của AI; đính kèm lệnh chạy và kết quả.
- Bảo vệ sản phẩm: nhận một thay đổi hoặc lỗi bất ngờ, xử lý trực tiếp và bảo vệ quyết định kỹ thuật trong 20–30 phút.

---

## 5. Mẫu báo cáo cuối ngày

**Quy tắc:** Báo cáo tối đa 10 phút để đọc nhưng phải có liên kết bằng chứng. Không dùng các câu chung chung như "đã tìm hiểu", "đã nghiên cứu" nếu không có đầu ra.

| Mục | Nội dung bắt buộc |
|---|---|
| 1. Mục tiêu hôm nay | Issue/acceptance criteria đã cam kết. |
| 2. Kết quả đã hoàn thành | Commit/PR, link staging, ảnh/video. |
| 3. Số liệu | Test pass/fail, metric hiệu năng, chi phí, FP rate (nếu có). |
| 4. AI Work Log | Công cụ, prompt chính, phần chấp nhận/bác bỏ, lỗi AI. |
| 5. Rủi ro & blocker | Mức độ, người cần hỗ trợ. |
| 6. Kế hoạch ngày sau | Việc cụ thể, tiêu chí nghiệm thu. |

## 6. Bài thẩm định trực tiếp hằng tuần

| Mốc | Bài thẩm định |
|---|---|
| Cuối tuần 7 | Dựng lại staging từ IaC trên tài khoản cloud mới; quản lý hỏi ngẫu nhiên 5 quyết định hạ tầng. |
| Cuối tuần 8 | Quản lý gửi một đoạn mã độc mới; chứng minh sandbox chặn và giải thích lớp nào chặn. |
| Cuối tuần 9 | Thêm một ngôn ngữ thứ tư ở mức PoC trong 30 phút, tự viết test. |
| Cuối tuần 10 | So sánh hai mô hình KT, chỉ ra failure mode trên một học viên cụ thể. |
| Cuối tuần 11 | Sửa một lỗi đồng bộ realtime được cài sẵn; trình bày nguyên nhân gốc. |
| Cuối tuần 12 | Live change 30 phút trên tính năng cộng tác, commit + test + self-review. |
| Cuối tuần 13 | Giải thích một cảnh báo liêm chính cho "phụ huynh" (quản lý đóng vai). |
| Cuối tuần 14 | Chứng minh không có dữ liệu media nào rời thiết bị bằng công cụ soi mạng. |
| Cuối tuần 15 | Tìm và vá một lỗ farm XP do quản lý gợi ý. |
| Cuối tuần 16 | Xử lý sự cố giữa giải (máy chấm chậm) theo Runbook trong thời gian giới hạn. |
| Cuối tuần 17 | Bảo vệ mô hình at-risk trước câu hỏi về công bằng và tác hại. |
| Cuối tuần 18 | Bảo vệ sản phẩm v2.0: demo không kịch bản bí mật, trả lời câu hỏi, rollback và nêu giới hạn. |

**Mẫu AI Work Log tối thiểu** (giữ nguyên chuẩn giai đoạn 1)
- Task/Issue và điều tôi hiểu trước khi gọi AI.
- Công cụ/model; ngày giờ và phạm vi quyền đã cấp.
- Context, tài liệu, file và constraint đã cung cấp; xác nhận không có dữ liệu nhạy cảm.
- Chỉ dẫn chính và các vòng phản hồi quan trọng.
- File/diff do AI tạo; phần tôi giữ lại, chỉnh sửa hoặc loại bỏ và lý do.
- Test/metric/checklist dùng để kiểm chứng; lỗi AI mắc phải và cách tôi phát hiện.
- Điều học được, điều vẫn chưa chắc và thay đổi sẽ đưa vào harness/rule ở lần sau.

## 7. Cổng nghiệm thu cuối kỳ v2.0

- Hệ thống chạy trên Cloud với CI/CD, rollback < 5 phút, backup/restore đã diễn tập.
- Worker Judge chấm Python/C++/JavaScript trong sandbox cấp OS; sandbox-escape suite 0 lỗ hổng; 0 bài nộp mất khi worker sập.
- Gợi ý cá nhân hóa có giải thích, không vi phạm lộ trình/khối.
- Lớp học trực tiếp và cộng tác hoạt động với 30+ học viên/lớp, p95 trong SLO.
- Proctoring: opt-in, on-device, không lưu media, FP < 5%, AI không tự kết luận gian lận.
- Đấu trường 1v1 và giải 64 người chạy trọn vẹn; leaderboard không lộ danh tính trẻ em.
- At-risk: recall/precision đạt ngưỡng, giải thích được, công bằng giữa các khối, chỉ giảng viên thấy.
- Multi-tenant: 0 truy cập chéo; SSO hoạt động; pentest 0 Critical/High.
- Tài liệu v2.0, migration v1→v2, video demo, retro và roadmap tiếp theo.

## 8. Quy tắc phối hợp giữa ba thực tập sinh

- Dùng một monorepo; mỗi sản phẩm có thư mục, owner và README riêng. **Không sửa thư mục của thành viên khác** (vd `Data-AI-Resource/`), tích hợp qua API/hợp đồng dữ liệu.
- Mỗi tuần có ít nhất một integration PR giữa hai sản phẩm; không đợi cuối giai đoạn mới ghép.
- API, schema sự kiện học tập, đặc trưng mô hình và tiêu chuẩn metadata được thống nhất bằng tài liệu version hóa.
- Mỗi PR được ít nhất một bạn khác review theo checklist; release gate do QA giữ.
- Bộ dữ liệu, đáp án, đề thi, mô hình và đánh giá AI phải ghi nguồn, phiên bản, trạng thái duyệt.
- Không đưa dữ liệu thật của học viên (đặc biệt trẻ em) lên công cụ AI công cộng; dùng dữ liệu ẩn danh hoặc giả lập.

> **Kết quả kỳ vọng:** Sau 90 ngày, vòng lặp học tập có bằng chứng của v1.0 được mở rộng thành một nền tảng Enterprise: học viên học đa ngôn ngữ với gợi ý đúng điểm yếu, thầy trò tương tác trực tiếp, thi đấu công bằng và minh bạch, và giảng viên phát hiện sớm học viên cần hỗ trợ — mọi quyết định ảnh hưởng tới học viên đều có con người chịu trách nhiệm.
