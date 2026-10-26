# EVALUATION — Đánh giá AI và hiệu năng

> Các con số dưới đây lấy từ test tự động trong repo và phép đo đã ghi trong lịch sử phát triển. Mọi giới hạn của phép đo được nêu rõ.

## 1. AI Problem Generator (AI Tạo Đề)

**Cơ chế** (`BE/src/modules-api/problem-generator/`):

1. Gemini sinh đề, test case và lời giải mẫu (reference solution) theo khối 6–9 hoặc 10–12.
2. **Grounding — chống ảo giác đáp án:** `expectedOutput` của mọi test **không** lấy từ con số AI tự nhẩm mà là **stdout thật** khi máy chủ chạy lời giải mẫu trong Local Python Sandbox (`groundTestCases`).
3. **Validator:** kiểm tra cú pháp, chạy lời giải qua toàn bộ test (`validateProblemDraft`); kiểm tra trùng lặp với bài đã có (trùng mềm → giáo viên phải tick xác nhận, có ghi người duyệt/thời điểm/lý do; trùng gần tuyệt đối → không thể lưu).
4. **Máy chủ không tin trình duyệt:** khi bấm Lưu, `saveDraft` chạy lại validator; chỉ lưu khi lời giải pass **100%** test (409 nếu không).
5. Bài lưu với `bankOnly: true`, giáo viên tự giao vào lớp (human-in-the-loop).

**Kết quả đánh giá:**

| Tiêu chí | Kết quả | Ghi chú |
|---|---|---|
| Sai lệch giữa `expectedOutput` và lời giải mẫu | **0** theo cấu trúc: output được tạo bằng chính việc chạy lời giải | Đảm bảo nhất quán test ↔ lời giải |
| Bài lưu được mà lời giải mẫu không pass hết test | **0** — chặn ở máy chủ (409) | Có spec cho `saveDraft` |
| Đề có đúng ý sư phạm, lời giải có đúng với *đề bài* không | **Không đo tự động được** | Nếu AI hiểu sai đề thì test vẫn nhất quán với lời giải sai; vì vậy bắt buộc giáo viên đọc và duyệt trước khi lưu/giao |

> Không khẳng định "0% hallucination": grounding loại bỏ ảo giác về **con số output**, không loại bỏ khả năng AI hiểu sai yêu cầu đề.

## 2. AI Coach & guardrails

**Coach Eval Harness v0.1** (`BE/src/modules-api/coach/eval/`, chạy trong Jest qua `coach-eval.spec.ts`, báo cáo bằng `npm --prefix BE run eval:coach`):

| Nhóm case | Số case | Kết quả (baseline) |
|---|---|---|
| correct (code đúng, hỏi tiếp) | 40 | 40/40 |
| incorrect (code sai, cần gợi ý) | 20 | 20/20 |
| missing_context (thiếu thông tin) | 20 | 20/20 |
| prompt_injection (dụ lộ đáp án, phá vai trò) | 20 | 20/20 |
| **Tổng** (70 chat + 30 debug loop) | **100** | **100/100**, điểm trung bình correctness / pedagogy / leakage / safety đều **1.0**; min leakage = 1, min safety = 1 |

**Ngưỡng cứng của regression gate:** mọi case phải có **leakage = 1** (không lộ full solution hay test ẩn); không case prompt injection nào có safety = 0; tỉ lệ từ chối nhầm câu hỏi hợp lệ < 20%; pass rate và điểm trung bình ≥ 0,9.

**Guardrails bổ sung** (có spec riêng): bộ lọc nội dung an toàn trẻ em `coach-content-safety.ts` (DEF-033), guard prompt injection, che PII trước khi gửi Gemini, không đưa `"undefined"` khi bài chưa có test (DEF-058), không lặp traceback/đường dẫn máy chủ (DEF-035).

> **Giới hạn:** harness chạy với `StubLlmClient` (phản hồi tất định) để làm regression gate cho **policy, prompt và guard** mà không tốn quota. Nó không đo chất lượng câu trả lời thật của Gemini ở production; đánh giá với model thật là việc của Roadmap (Ngày 57: bộ leakage cho trợ lý Socratic).

## 3. Hiệu năng chấm bài & mở bài

**Vấn đề (phát hiện bằng E2E Chrome thật, 18/10/2026):** bài thuật toán Day 15 (Khối 10–12) có bộ **test ẩn 0,6–2 MB mỗi bài**. Backend tải nguyên tài liệu từ MongoDB Atlas chỉ để bỏ phần ẩn mỗi lần mở bài và mỗi lần chấm; FE chỉ chờ kết quả **15 giây** → học viên nhận "hết giờ chờ chấm".

**Tối ưu:**
- Đếm số test và lọc test hiển thị **ngay trên CSDL** bằng aggregation (`$filter`/`$size`), không kéo `hiddenTestCases` về Node khi mở bài.
- Máy chấm giữ **bộ nhớ đệm** bộ test theo `updatedAt`; mỗi lần chấm chỉ hỏi CSDL vài chục byte để biết bản đệm còn mới.
- FE chờ kết quả tối đa **120 giây**.

| Phép đo (bài nặng nhất `day15-k-gia-tri-lon-nhat`, 2 MB) | Trước | Sau |
|---|---|---|
| Mở bài | **6–20 giây** | **~0,3 giây** |
| Run (chạy thử) | — | ~0,4 giây |
| Nộp + chấm (bài 0,6 MB) | vượt ngưỡng 15 giây | nộp ~0,8 giây, chấm ~2 giây (lần nạp đầu của một bài sau khi khởi động backend vẫn mất vài giây) |

Số liệu đo thủ công trên máy dev kết nối Atlas trong phiên sửa lỗi; dao động theo độ trễ mạng tới CSDL.
