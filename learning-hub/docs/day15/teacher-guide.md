# Teacher Guide — Bộ 15 bài luyện thi thuật toán lớp 10-12 (Ngày 15)

## 1. Mục tiêu sư phạm

Bộ bài hướng tới học sinh lớp 10-12 đã nắm chắc Python cơ bản (biến, vòng lặp, hàm, cấu trúc dữ liệu `list`/`dict`), luyện 5 nhóm kỹ năng nền tảng của lập trình thi đấu (competitive programming), theo đúng thứ tự nên học:

| Nhóm | Kỹ năng | Số bài | Độ khó trong nhóm |
|---|---|---|---|
| 1. Complexity | Nhận diện và tránh bẫy O(N^2) khi N lớn; đếm cặp, đếm nghịch thế, đếm tần suất | 3 | EASY → HARD |
| 2. Sorting | Sắp xếp có điều kiện, custom comparator, heap top-K | 3 | MEDIUM → HARD |
| 3. Binary Search | Tìm kiếm trên mảng biến dạng, binary-search-on-answer, lower/upper bound | 3 | MEDIUM → HARD |
| 4. Greedy | Interval scheduling, jump game, và bẫy "greedy tưởng đúng nhưng sai" | 3 | MEDIUM → HARD |
| 5. Graph/DP cơ bản | BFS trên lưới, Union-Find, LIS O(N log N) | 3 | MEDIUM → HARD |

Mỗi nhóm có đúng 3 bài, độ khó tăng dần; nhóm sau giả định đã nắm chắc kỹ năng nhóm trước (ví dụ nhóm 4 Greedy và nhóm 5 Graph/DP đều dùng lại kỹ thuật sort/binary-search của nhóm 2-3).

## 2. Cách truy cập

Học sinh vào mục "Code Playground" (Bài tập lập trình), chọn bài theo tên trong dropdown. Cả 15 bài có tiền tố slug `day15-...` để dễ tra trong hệ thống, `gradeBand: '9-12'` (khớp giá trị FE `CodePlaygroundPage.tsx` đã dùng sẵn cho nhóm lớp lớn nhất — không dùng `'10-12'` vì UI chưa định nghĩa nhãn/icon cho giá trị đó) để lọc riêng biệt với bộ bài lớp 6-9 (`day14-...`).

`prerequisiteSlug` của mỗi bài trỏ tới bài liền trước cần hoàn thành, nối cả 15 bài thành 1 chuỗi tiến trình duy nhất (xem mục 6). Ở phiên bản hiện tại, học sinh có thể truy cập tự do vào bất kỳ bài nào qua dropdown — giáo viên nên hướng dẫn học sinh đi đúng thứ tự bằng lời, dựa theo `tags` của từng bài.

## 3. Gợi ý thời lượng sử dụng trong lớp học

| Buổi học | Bài gợi ý | Thời lượng gợi ý |
|---|---|---|
| Buổi 1 | Nhóm 1: Complexity (3 bài) | 60-70 phút (cần thời gian giải thích Big-O và cách đọc constraint) |
| Buổi 2 | Nhóm 2: Sorting (3 bài) | 50-60 phút |
| Buổi 3 | Nhóm 3: Binary Search, bài 7-8 | 50-60 phút |
| Buổi 4 | Nhóm 3: Binary Search, bài 9 + Nhóm 4: Greedy bài 10 | 45-50 phút |
| Buổi 5 | Nhóm 4: Greedy, bài 11-12 (đặc biệt bài 12 — bẫy greedy cần thảo luận kỹ) | 50-60 phút |
| Buổi 6 | Nhóm 5: Graph/DP cơ bản (3 bài) | 60-70 phút |

Bài "Chia sách tối thiểu hóa" (`day15-chia-sach-toi-thieu-hoa`), "Đổi tiền tối thiểu" (`day15-doi-tien-toi-thieu`), và "Dãy con tăng dài nhất" (`day15-day-con-tang-dai-nhat`) là 3 bài HARD đòi hỏi insight sâu nhất trong bộ — nên dành thời gian thảo luận riêng, khuyến khích học sinh trình bày hướng giải sai trước khi dẫn tới hướng đúng.

## 4. Cách hỗ trợ học sinh khi gặp khó khăn

Mỗi bài có 2 sample test case công khai (`isHidden: false`) và 2-3 hidden test case, trong đó **luôn có ít nhất 1 hidden test case với N/S ở biên constraint tối đa** — nếu học sinh pass sample nhưng bị Time Limit Exceeded (TLE) ở hidden test, gần như chắc chắn đang dùng đúng logic nhưng SAI độ phức tạp (xem [complexity-rubric.md](./complexity-rubric.md) để tra bảng ánh xạ "độ phức tạp bị chặn" cho từng bài). Nếu pass sample nhưng SAI kết quả (không phải TLE) ở hidden test, khả năng cao đang mắc bẫy LOGIC (xem mục "bẫy" trong [editorials.md](./editorials.md) — đặc biệt các bài 6, 12, 13 có bẫy logic thuần túy, không phải bẫy tốc độ).

## 5. Rubric chấm điểm gợi ý

| Mức | Tiêu chí | Điểm |
|---|---|---|
| Đạt (AC) | Pass toàn bộ test case (kể cả hidden, bao gồm test case N lớn) | 100% điểm bài |
| Đúng thuật toán, sai độ phức tạp | Pass sample + hidden nhỏ, nhưng TLE ở hidden test N lớn — logic đúng nhưng chọn sai thuật toán | 50-60% điểm bài (khuyến khích: cho điểm cao hơn "sai hướng" vì thể hiện hiểu đúng bài toán) |
| Gần đạt | Pass hầu hết test, sai ở đúng 1 edge case đã liệt kê trong editorial | 70-85% điểm bài |
| Sai hướng/mắc bẫy logic | Không pass sample, hoặc mắc đúng bẫy logic đã ghi trong editorial (ví dụ dùng greedy sai ở bài 12) | 0-30% điểm bài, hướng dẫn đọc lại phần "Hướng 1 (SAI)" trong editorial |
| Không nộp | — | 0 điểm |

**Lưu ý riêng cho bộ bài này**: nên phân biệt rõ giữa "sai độ phức tạp" (học sinh hiểu đúng bài toán, chỉ chưa tối ưu — đáng được điểm cao hơn) và "sai logic/mắc bẫy" (hiểu sai bản chất bài toán) khi chấm điểm, vì đây là 2 loại lỗi có ý nghĩa sư phạm khác nhau.

## 6. Progression mapping (bản đồ tiến trình)

```
Nhóm 1 (Complexity)                Nhóm 2 (Sorting)                 Nhóm 3 (Binary Search)
dem-cap-tong-bang-target       →   gop-khoang-thoi-gian         →   tim-kiem-mang-da-xoay
  → dem-nghich-the                   → k-gia-tri-lon-nhat            → chia-sach-toi-thieu-hoa
    → gia-tri-xuat-hien-nhieu-nhat     → ghep-so-lon-nhat                → dem-phan-tu-trong-khoang
                                                                             │
        ┌────────────────────────────────────────────────────────────────┘
        ▼
Nhóm 4 (Greedy)                     Nhóm 5 (Graph/DP cơ bản)
chon-hoat-dong-khong-giao-nhau  →   duong-di-ngan-nhat-luoi
  → so-buoc-nhay-it-nhat              → dem-thanh-phan-lien-thong
    → doi-tien-toi-thieu                 → day-con-tang-dai-nhat (cuối chuỗi)
```

Mỗi mũi tên là 1 quan hệ `prerequisiteSlug` — toàn bộ 15 bài nối thành 1 chuỗi tiến trình duy nhất từ dễ đến khó.

## 7. Mapping mục tiêu kỳ thi

Bộ bài được thiết kế ở mức độ phù hợp với 2 nhóm mục tiêu luyện thi phổ biến của học sinh lớp 10-12:

| Kỳ thi/chứng chỉ tham khảo | Nhóm bài liên quan trực tiếp | Ghi chú mức độ phù hợp |
|---|---|---|
| Học sinh giỏi Tin học cấp trường/quận (vòng loại) | Complexity (1-3), Sorting (4-6), Binary Search cơ bản (7, 9) | Độ khó tương đương vòng loại — đủ để làm quen dạng bài, chưa đạt độ khó vòng thi HSG cấp tỉnh/quốc gia |
| Vòng sơ loại các kỳ thi lập trình dành cho học sinh phổ thông (dạng bài tự luận có test case ẩn) | Toàn bộ 15 bài | Cấu trúc "input/output + hidden test case + time limit" mô phỏng đúng định dạng thi trực tuyến phổ biến |
| Ôn tập nền tảng trước khi luyện thi HSG cấp tỉnh/quốc gia hoặc các kỳ thi lập trình quốc tế dành cho học sinh phổ thông | Binary Search trên đáp án (8), Greedy có bẫy (12), Graph/DP cơ bản (13-15) | Đây là các bài "cầu nối" — nắm vững nhóm này là điều kiện cần (chưa đủ) để tiếp cận độ khó cao hơn của các kỳ thi cấp tỉnh/quốc gia, vốn đòi hỏi thêm DP nâng cao, đồ thị có trọng số, cấu trúc dữ liệu nâng cao (segment tree, DSU có union theo rank...) |
| Interview lập trình cơ bản (thực tập/junior developer) | Sorting (4-6), Binary Search (7, 9), Graph cơ bản (13-14) | Các dạng bài này (merge intervals, rotated array search, BFS trên lưới, connected components) là câu hỏi phổ biến trong vòng phỏng vấn kỹ thuật cơ bản |

**Giới hạn cần lưu ý (tránh đặt kỳ vọng sai)**: bộ 15 bài này là nền tảng "vòng 1" của competitive programming — chưa bao gồm các chủ đề nâng cao hơn thường gặp ở vòng thi cấp cao (segment tree, DP trên cây, đồ thị có trọng số/Dijkstra-Bellman-Ford, quy hoạch động trên bitmask...). Giáo viên nên trình bày rõ với học sinh đây là bước đệm, không phải bộ đề luyện thi HSG cấp tỉnh/quốc gia hoàn chỉnh.

## 8. Metadata phân loại

Mỗi bài trong 15 bài này có 3 field metadata dùng để phân loại trong hệ thống, nhất quán với cách tổ chức của bộ bài lớp 6-9 (ngày 14):

| Field | Giá trị hiện tại | Ý nghĩa |
|---|---|---|
| `gradeBand` | `'9-12'` | Khối lớp mục tiêu — dùng để lọc bài theo lớp trên UI (khớp giá trị FE đã dùng sẵn cho nhóm lớp lớn nhất, không phải `'10-12'`) |
| `topic` | `'algorithm-contest-prep'` | Tên gói bài/chủ đề trong khối lớp đó |
| `orderInTopic` | `1` đến `15` | Thứ tự bài trong chính `topic` đó, độc lập với thứ tự chèn vào database |

Khi thêm 1 chủ đề mới cho lớp 10-12 (ví dụ "Cấu trúc dữ liệu nâng cao: Segment Tree, DSU"), chỉ cần đặt `topic` khác và `orderInTopic` bắt đầu lại từ 1 — không cần đụng đến 15 bài `algorithm-contest-prep` hiện có.
