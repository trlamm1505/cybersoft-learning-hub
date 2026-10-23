# Retest DEF-056 và DEF-058 (15/10/2026, khoảng 14:50-14:53 UTC)

- **Người chạy:** Claude theo yêu cầu tester, thao tác trên Chrome của tester (Claude in Chrome), giao diện `http://127.0.0.1:4173` (FE preview), BE `localhost:3000`, repo HEAD `d804c49`.
- **Tài khoản:** `student@gmail.com` (đã đăng nhập sẵn trong Chrome).
- **Bài:** Code Playground → "Bài cũ (chưa phân lớp)" → "Tính tổng hai số nguyên" (đề: "A và B, mỗi số trên một dòng").
- Làm mới hoàn toàn, không dùng kết quả cũ.

## DEF-056 - bài tập không có test case

| Bước | Thao tác | Kết quả | Ảnh |
|---|---|---|---|
| 1 | Code `a, b = map(int, input().split())` / `print(a + b)`, STDIN `3 2`, bấm Run | "Chạy xong, không có lỗi", STDOUT `5` | `DEF-056-01-run-output-5.jpg` |
| 2 | Bấm Submit với code ở bước 1 | "Lỗi khi chạy (Runtime Error) (0/4 test)": **hệ thống chạy 4 test** (2 hiện, 2 ẩn), input mỗi số một dòng nên code đọc 1 dòng bị `ValueError` | `DEF-056-03-submit-code-doc-1-dong-RE-0-4.jpg` |
| 3 | Sửa code theo đề: `a = int(input())`, `b = int(input())`, `print(a + b)`, bấm Submit | **"Đạt (Accepted) (4/4 test)"**: Test 1 (3,5 → 8), Test 2 (100,250 → 350), Test 3 ẩn, Test 4 ẩn đều đạt | `DEF-056-02-submit-test-result.jpg` |

**Kết luận DEF-056: RETEST PASS → RESOLVED.** Có 4 test thật được chạy phía server (`GET /exercises/submissions/{id}`), không còn "0/0 test" hay "Bài tập thiếu Test Cases". Nguyên nhân cũ là DB local seed thiếu; DB nay đã seed lại.

Ghi chú cho kịch bản test: code mẫu trong yêu cầu retest đọc 2 số trên 1 dòng, trong khi đề yêu cầu mỗi số một dòng; kết quả RE 0/4 ở bước 2 là **đúng hành vi**, không phải lỗi sản phẩm.

## DEF-058 - debug loop trả "undefined"

| Bước | Thao tác | Kết quả | Ảnh |
|---|---|---|---|
| 1 | Sau bài nộp RE ở bước 2, mở tab AI Coach, bấm "Phân tích lỗi lần nộp gần nhất" (`POST /coach/debug-loop` 201) | Thẻ "Lỗi khi chạy (runtime)" giải thích đúng: ValueError, giá trị truyền vào không hợp lệ, gợi ý kiểm tra định dạng dữ liệu vào; **không còn "undefined"** | `DEF-058-01-ai-coach-after-submit.jpg` |

**Kết luận DEF-058: RETEST PASS → RESOLVED** (lỗi chỉ xảy ra khi bài không có test case; nay bài có test).

## Phát hiện khi retest: DEF-035 vẫn còn (đã tái hiện được)

Cùng thẻ AI Coach ở trên **trích nguyên traceback kèm đường dẫn nội bộ** `File "/sandbox/<uuid>.py", line 1`. Đây đúng là DEF-035 (RT-052): trước đây chưa kiểm được vì bài không có test, nay đã tái hiện. **DEF-035: vẫn OPEN, đã có evidence** (`DEF-058-01-ai-coach-after-submit.jpg`).

## Dữ liệu test tạo thêm (student@gmail.com)

2 bài nộp "Tính tổng hai số nguyên" (1 RE, 1 Accepted), 1 lượt debug-loop.
