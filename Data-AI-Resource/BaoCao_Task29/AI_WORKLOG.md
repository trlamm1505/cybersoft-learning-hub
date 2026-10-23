# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 29
## DỰ ÁN: CYBERSOFT DATA & AI LAB — PHÂN HỆ TỐI ƯU VÀ ĐÓNG GÓI TRIỂN KHAI (PERFORMANCE & DEPLOYMENT) v1.0

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 29 — Tối ưu hiệu năng, bộ nhớ đệm hai tầng, triển khai Docker và sao lưu phục hồi dữ liệu  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-11  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước vào giai đoạn sẵn sàng phát hành sản phẩm CyberSoft Data & AI Lab v1.0, hệ thống phải đáp ứng các tiêu chuẩn kỹ thuật vận hành khắt khe:
1. **Thiếu hồ sơ đo lường hiệu năng định lượng**: Cần xác định chính xác độ trễ phân vị P50, P75, P90, P95, P99 cho các luồng Tìm kiếm lai và Trợ giảng AI dưới tải trọng lớn để cam kết Service Level Agreement (SLA).
2. **Nghẽn cổ chai tính toán Vector trên CPU**: Các truy vấn tương tự hoặc lặp lại nếu luôn phải tính lại dot-product vector sẽ làm CPU quá tải, dẫn đến giảm sút thông lượng RPS của toàn bộ nền tảng.
3. **Đóng gói triển khai thiếu an toàn và nặng nề**: Image Docker thông thường chứa toàn bộ mã nguồn, công cụ biên dịch C++ nặng hàng GB và tiềm ẩn rủi ro an ninh khi chạy dưới tài khoản root.
4. **Nguy cơ mất mát dữ liệu do thiếu cơ chế cứu hộ**: Cần một tiến trình sao lưu toàn diện catalog và vector index, kèm mã băm mật mã SHA-256 để bảo đảm tính toàn vẹn 100% sau sự cố.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning & code generation).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * AI đóng vai trò trợ lý sinh khung cấu hình Dockerfile đa giai đoạn, thuật toán bộ nhớ đệm LRU và các script tiện ích.
  * Kỹ sư con người trực tiếp giám sát an toàn tài nguyên container, đo đạc số liệu P95 thực tế, kiểm chứng tính toàn vẹn SHA-256 và rà soát 100% lỗi hệ thống.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề xuất ban đầu của AI | Phân tích Rủi ro & Điểm bất hợp lý | Quyết định & Tinh chỉnh của Kỹ sư Con người |
| :---: | :--- | :--- | :--- |
| **01** | Cài đặt máy chủ Redis container độc lập từ bên ngoài để làm bộ nhớ đệm. | Tăng phụ thuộc hạ tầng ngoài, tốn thêm 200MB RAM và phát sinh chi phí duy trì máy chủ trên môi trường On-premise. | **Bác bỏ & Tối ưu**: Xây dựng **In-Memory LRU Cache** tự chứa bằng Python `OrderedDict` với chính sách TTL, độ trễ trúng cache chỉ 3.3ms, chi phí **$0.00 USD**. |
| **02** | Chạy container Docker trực tiếp dưới quyền người dùng root mặc định. | Lỗ hổng nghiêm trọng cho phép kẻ tấn công leo thang đặc quyền (Privilege Escalation) ra máy chủ vật lý nếu có lỗ hổng RCE. | **Bác bỏ & Gia cố an ninh**: Tạo tài khoản phi đặc quyền `appuser` (UID: 1001) thuộc nhóm `appgroup` (GID: 1001) trong Dockerfile. |
| **03** | Chỉ đo thời gian phản hồi trung bình (Average Latency) cho báo cáo hiệu năng. | Giá trị trung bình che giấu các điểm nghẽn độ trễ đuôi (Tail Latency), gây hiểu nhầm về độ mượt mà khi chịu tải. | **Chuẩn hóa**: Bắt buộc đo lường đầy đủ 5 phân vị **P50, P75, P90, P95, P99**; khóa trần P95 Hybrid Search $\le 25$ms và AI Tutor $\le 1500$ms. |
| **04** | Sao lưu tệp dữ liệu thô dạng zip không kiểm tra tính toàn vẹn. | Không phát hiện được trường hợp dữ liệu bị hỏng từng byte (Silent Bit Rot) hoặc bị can thiệp trái phép. | **Nâng cấp**: Tạo tệp `manifest.json` ghi nhận kích thước và chuỗi băm **SHA-256** cho từng tệp; khôi phục bắt buộc phải đối soát khớp từng byte. |
| **05** | Lưu trữ kết quả cache vĩnh viễn không có thời gian sống (TTL). | Dữ liệu bài học và đồ án mới xuất bản sẽ không được cập nhật đến học viên (Stale Data Issue). | **Cải tiến**: Thiết lập chính sách TTL 300 giây và kiểm tra thời hạn hết hạn trực tiếp trong hàm `get()` của bộ nhớ đệm. |
| **06** | Yêu cầu khởi động lại máy chủ khi cần xóa dữ liệu đệm cũ. | Làm gián đoạn dịch vụ của người dùng đang truy cập, không đáp ứng yêu cầu vận hành liên tục 24/7. | **Bổ sung**: Cung cấp endpoint quản trị `POST /api/v1/ops/cache/clear` cho phép xóa bộ nhớ đệm chủ động tức thời không cần downtime. |
| **07** | Không giới hạn CPU và RAM trong cấu hình docker-compose.yml. | Khi bị tấn công từ chối dịch vụ hoặc tải đột biến, container sẽ ngốn toàn bộ RAM của máy chủ gây treo hệ thống. | **Kiểm soát**: Thiết lập `cpus: '2.0'`, `memory: 1024M` và dự phòng `256M` nghiêm ngặt trong `docker-compose.yml`. |
| **08** | Bỏ qua cơ chế tự động kiểm tra sức khỏe container (Docker Healthcheck). | Docker daemon không biết khi nào tiến trình FastAPI bị deadlock bên trong để tự khởi động lại. | **Bổ sung**: Cấu hình Healthcheck tự động gọi `GET /api/v1/health` mỗi 30s, tự phục hồi nếu thất bại 3 lần liên tiếp. |
| **09** | Sử dụng từ ngữ nhạy cảm trong tiến trình triển khai tự động. | Vi phạm quy chuẩn giao tiếp và kỷ luật tài liệu nghiêm ngặt của CyberSoft. | **Bác bỏ & Quét sạch**: Thay toàn bộ từ cấm bằng `tiến trình`, `chuỗi thao tác tự động`. |
| **10** | Viết test chỉ kiểm tra biến đếm cache tăng dần. | Không kiểm chứng được tính năng đuổi phần tử cũ (Eviction) khi bộ đệm đạt ngưỡng tối đa và tính năng hết hạn TTL. | **Nâng cấp**: Viết bộ test kiểm tra toàn diện: Cache Hit, Cache Miss, Eviction tại dung lượng trần, hết hạn TTL và đối soát SHA-256 khôi phục. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy "Ảo tưởng thời gian trung bình" (Average Latency Illusion)**: AI thường chỉ đo trung bình cộng mà bỏ qua P95/P99. *Cách phòng vệ*: Dùng hàm phân vị `np.percentile` kiểm tra nghiêm ngặt trần P95.
2. **Bẫy "Chạy Docker bằng Root"**: AI sinh Dockerfile không có lệnh `USER appuser`. *Cách phòng vệ*: Bắt buộc tạo non-root user và `chown -R` thư mục làm việc cho UID 1001.
3. **Bẫy "Windows Console Encoding Crash (cp1252)"**: AI in chuỗi tiếng Việt có dấu trực tiếp ra terminal Windows gây `UnicodeEncodeError`. *Cách phòng vệ*: Khởi tạo `sys.stdout.reconfigure(encoding='utf-8')` ở đầu tất cả các tệp thực thi.
4. **Bẫy "Cache Thrashing & Memory Leak"**: AI dùng dictionary thường không giới hạn dung lượng làm tràn RAM máy chủ. *Cách phòng vệ*: Sử dụng `OrderedDict` có giới hạn trần `maxsize=2048` và cơ chế `popitem(last=False)`.
5. **Bẫy "Lỗi Relative Import khi chạy CLI"**: AI viết import tương đối `from ..src.config import HOST, PORT` trong scripts. *Cách phòng vệ*: Đưa `TASK29_ROOT` vào `sys.path.insert(0, ...)` để script chạy độc lập hoàn hảo.
6. **Bẫy "Module Target chứa dấu gạch nối"**: AI cấu hình uvicorn gọi module path có gạch nối `cybersoft-learning-hub`. *Cách phòng vệ*: Chuẩn hóa uvicorn target `"src.main:app"` kết hợp chèn `sys.path`.
7. **Bẫy "Thiếu Root Redirect"**: AI chỉ mount portal tĩnh tại `/portal/` bỏ quên route đón root `/`. *Cách phòng vệ*: Bổ sung route `@app.get("/")` RedirectResponse 307 về `/portal/`.
8. **Bẫy "Image Docker phình to"**: AI gom cả build tools vào final image làm image nặng 800MB+. *Cách phòng vệ*: Triển khai Multi-stage build cắt giảm dung lượng image xuống còn 182MB.
9. **Bẫy "Lọt từ cấm trong tài liệu"**: AI tự động điền từ ngữ nhạy cảm trong hướng dẫn deploy. *Cách phòng vệ*: Quét kiểm tra tự động trước khi bàn giao.
10. **Bẫy "Phục hồi dữ liệu mù quáng"**: AI viết script khôi phục chỉ copy file mà không so sánh SHA-256. *Cách phòng vệ*: Tính toán và so sánh chuỗi băm từng file với `manifest.json`.

---

## 5. BỐN TẦNG NĂNG LỰC ỨNG DỤNG AI (THE FOUR TIERS OF AI MASTERY)

- **Tầng 1 — Trợ lý cú pháp (Syntax Assistant)**: Dùng AI gợi ý cú pháp Dockerfile Multi-stage, Docker Compose YAML và thư viện `hashlib` tính toán SHA-256.
- **Tầng 2 — Tăng tốc sinh mã khung (Scaffolding Acceleration)**: Dùng AI sinh khung sườn giao diện Web Ops Dashboard SPA và bộ script đo lường tải trọng giả lập.
- **Tầng 3 — Thẩm định & Phản biện kỹ thuật (Critical Architecture Review)**: Bác bỏ việc dùng Redis cồng kềnh, chuyển sang In-memory LRU Cache tự chứa, ngăn chặn lỗ hổng root container và chuẩn hóa đo lường phân vị P95/P99.
- **Tầng 4 — Điều phối hệ sinh thái & Làm chủ giải pháp (Ecosystem Orchestration)**: Tích hợp trọn vẹn giải pháp đóng gói Docker, cơ chế tự phục hồi Healthcheck, đối soát toàn vẹn SHA-256 và đạt 30/30 tests PASS cùng 6/6 chặng DoD thành công 100%.

---

## 6. LỖI KỸ THUẬT PHÁT SINH, NGUYÊN NHÂN GỐC RỄ & CÁCH KHẮC PHỤC

### Sự cố 1: Lỗi UnicodeEncodeError trên Console Windows khi chạy `restore.py`
- **Hiện tượng**: Chạy `python scripts/restore.py` bị lỗi `UnicodeEncodeError: 'charmap' codec can't encode character '\u1ee5'` khi in thông báo tiếng Việt.
- **Nguyên nhân gốc rễ**: Console Windows cmd/powershell mặc định sử dụng bảng mã `cp1252` không hỗ trợ ký tự tiếng Việt có dấu.
- **Giải pháp xử lý**: Bổ sung `sys.stdout.reconfigure(encoding="utf-8")` ở đầu tệp `scripts/restore.py` và `scripts/backup.py`. Chạy lại đạt kết quả thành công 100%.

### Sự cố 2: Lỗi Import tương đối & Module Path trong `scripts/run_server.py`
- **Hiện tượng**: Không khởi động được máy chủ FastAPI từ dòng lệnh qua `run_server.py`.
- **Nguyên nhân gốc rễ**: Relative import vượt cấp và uvicorn target chứa dấu gạch nối trong thư mục `cybersoft-learning-hub`.
- **Giải pháp xử lý**: Chèn `TASK29_ROOT` vào `sys.path` và gọi trực tiếp target `"src.main:app"`.

### Sự cố 3: Lỗi 404 Not Found tại đường dẫn gốc `/`
- **Hiện tượng**: Truy cập `http://localhost:8029/` bị 404 Not Found.
- **Nguyên nhân gốc rễ**: Chưa có route xử lý chuyển hướng tại root path `/`.
- **Giải pháp xử lý**: Thêm route `@app.get("/")` RedirectResponse 307 về `/portal/`.

### Sự cố 4: Lỗi từ ngữ cấm xuất hiện trong tài liệu và tiến trình deploy
- **Hiện tượng**: Quét tự động phát hiện từ cấm trong `README.md` và mã tạo báo cáo Word.
- **Nguyên nhân gốc rễ**: Sử dụng từ ngữ thói quen khi mô tả tiến trình triển khai.
- **Giải pháp xử lý**: Rà soát và thay thế toàn bộ bằng `tiến trình triển khai`, kiểm tra lại với ripgrep đạt 0 vi phạm.

---

## 7. KẾT QUẢ KIỂM THỬ XÁC MINH ĐỘC LẬP

```bash
# Chạy bộ đánh giá chuẩn đầu ra DoD:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task29/scripts/run_benchmark_eval.py
# => 6/6 Chặng kiểm định ĐẠT CHUẨN (Exit Code 0)

# Chạy toàn bộ bài test tự động:
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task29/tests/ -v
# => 30 passed in 0.97s (100% SUCCESS)

# Chạy tiến trình kiểm chứng sao lưu & khôi phục SHA-256:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task29/scripts/restore.py
# => [SUCCESS] Phục hồi thành công 2 tệp tin với mã băm toàn vẹn.
```
