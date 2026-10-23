# Teacher Guide — Bộ 20 bài Python cho lớp 6-9 (Ngày 14)

## 1. Mục tiêu sư phạm

Bộ bài hướng tới học sinh lớp 6-9 đã biết cú pháp Python cơ bản (biến, `input()`, `print()`), luyện 5 nhóm kỹ năng nền tảng theo đúng thứ tự nên học:

| Nhóm | Kỹ năng | Số bài | Độ khó trong nhóm |
|---|---|---|---|
| 1. Input/Output | Đọc nhiều kiểu dữ liệu, định dạng output đúng yêu cầu | 4 | EASY → MEDIUM |
| 2. List | Duyệt, đếm, lọc trùng, hợp nhất danh sách | 4 | EASY → HARD |
| 3. Loop | `for`/`while`, mô phỏng theo bước, ma trận | 4 | EASY → HARD |
| 4. Function | Tách logic vào hàm, đệ quy, memoization | 4 | EASY → HARD |
| 5. Simulation | Mô phỏng luật chơi/game logic bằng if-else và state | 4 | EASY → HARD |

Mỗi bài tăng dần độ khó trong nhóm của mình; nhóm sau giả định đã nắm chắc kỹ năng nhóm trước (ví dụ nhóm Simulation dùng lại kỹ năng List và Function).

## 2. Cách truy cập

Học sinh vào mục "Code Playground" (Bài tập lập trình), chọn bài theo tên trong dropdown. Cả 20 bài có tiền tố slug `day14-...` để dễ tra trong hệ thống.

`prerequisiteSlug` của mỗi bài trỏ tới bài liền trước cần hoàn thành — dữ liệu này đã có sẵn trong hệ thống (field `prerequisiteSlug` trên mỗi bài) để phục vụ khóa tuần tự nếu FE triển khai UI khóa bài trong tương lai; ở phiên bản hiện tại, học sinh có thể truy cập tự do vào bất kỳ bài nào qua dropdown — giáo viên nên hướng dẫn học sinh đi đúng thứ tự 1→20 bằng lời, dựa theo `tags` của từng bài (`input-output`, `list`, `loop`, `function`, `simulation`).

## 3. Gợi ý thời lượng sử dụng trong lớp học

| Buổi học | Bài gợi ý | Thời lượng gợi ý |
|---|---|---|
| Buổi 1 | Nhóm 1: Input/Output (4 bài) | 30-35 phút |
| Buổi 2 | Nhóm 2: List (4 bài) | 40-45 phút |
| Buổi 3 | Nhóm 3: Loop, bài 1-3 | 35-40 phút |
| Buổi 4 | Nhóm 3: Loop, bài 4 (Xoắn ốc — HARD) | 25-30 phút riêng |
| Buổi 5 | Nhóm 4: Function (4 bài) | 45-50 phút |
| Buổi 6 | Nhóm 5: Simulation (4 bài) | 45-50 phút |

Bài ma trận đối xứng (`day14-ma-tran-doi-xung`) và bài trận đấu theo lượt (`day14-mo-phong-tran-dau`) là 2 bài HARD nhất, nên dành riêng thời gian không gộp chung buổi với bài khác.

## 4. Cách hỗ trợ học sinh khi gặp khó khăn

Mỗi bài trong hệ thống có sample test case hiển thị công khai (2 test đầu, `isHidden: false`) để học sinh tự đối chiếu code — nếu sample pass nhưng nộp bài vẫn sai, nghĩa là code chưa xử lý đúng 1 edge case nào đó trong hidden test. Giáo viên có thể tham khảo mục "Lỗi phổ biến" trong `editorials.md` để đoán nhanh học sinh đang mắc lỗi gì mà không cần đọc hết code.

## 5. Rubric chấm điểm gợi ý

| Mức | Tiêu chí | Điểm |
|---|---|---|
| Đạt (AC) | Pass toàn bộ test case (kể cả hidden) | 100% điểm bài |
| Gần đạt | Pass sample + một số hidden test, sai ở đúng 1 edge case đã liệt kê trong editorial | 60-80% điểm bài (tùy edge case bị sai có "hiểm" không) |
| Sai hướng | Không pass sample, logic tổng thể sai | 0-30% điểm bài, hướng dẫn đọc lại đề |
| Không nộp | — | 0 điểm |

## 6. Progression mapping (bản đồ tiến trình)

```
Nhóm 1 (Input/Output)          Nhóm 2 (List)                  Nhóm 3 (Loop)
chao-hoi-theo-ten          →   tong-trung-binh-danh-sach  →   bang-cuu-chuong
  → tinh-tien-co-thue            → dem-so-lan-xuat-hien         → dem-so-chu-so
    → doi-phut-thanh-gio-phut      → loai-bo-trung-lap            → so-hoan-thien
      → dinh-dang-hoa-don            → tron-hai-danh-sach-sap-xep   → ma-tran-doi-xung
                                                                        │
        ┌───────────────────────────────────────────────────────────┘
        ▼
Nhóm 4 (Function)               Nhóm 5 (Simulation)
ham-kiem-tra-nguyen-to     →    oan-tu-ti
  → ham-tinh-giai-thua           → mo-phong-thang-may
    → ham-quy-doi-diem-chu         → mo-phong-tui-do
      → ham-de-quy-dem-xuat-hien     → mo-phong-tran-dau (cuối chuỗi)
```

Mỗi mũi tên là 1 quan hệ `prerequisiteSlug` — toàn bộ 20 bài nối thành 1 chuỗi tiến trình duy nhất từ dễ đến khó.

## 7. Metadata phân loại (chuẩn bị cho các game/chủ đề tương lai)

Mỗi bài trong 20 bài này có 3 field metadata dùng để phân loại trong hệ thống, giúp mở rộng sau này (ví dụ lớp 6-9 có thêm nhiều "game/chủ đề" khác ngoài `python-fundamentals`, giống cách lớp 3-5 có thể có nhiều game ngoài "Block Puzzle"):

| Field | Giá trị hiện tại | Ý nghĩa |
|---|---|---|
| `gradeBand` | `'6-9'` | Khối lớp mục tiêu — dùng để lọc bài theo lớp trên UI |
| `topic` | `'python-fundamentals'` | Tên gói bài/chủ đề trong khối lớp đó — mỗi `gradeBand` có thể chứa nhiều `topic` khác nhau, mỗi `topic` tự có chuỗi tiến trình riêng |
| `orderInTopic` | `1` đến `20` | Thứ tự bài trong chính `topic` đó, độc lập với thứ tự chèn vào database |

Khi thêm 1 chủ đề/game mới cho lớp 6-9 (ví dụ "Xử lý chuỗi nâng cao"), chỉ cần đặt `topic` khác (ví dụ `'string-processing'`) và `orderInTopic` bắt đầu lại từ 1 — không cần đụng đến 20 bài `python-fundamentals` hiện có.
