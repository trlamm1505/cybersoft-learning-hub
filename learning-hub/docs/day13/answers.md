# Đáp án — Bộ 15 bài Block Puzzle (lớp 3-5)

Đáp án chỉ là **thứ tự đặt khối lệnh** (không phải code) — mỗi bài chỉ cần đúng 1 cách xếp hợp lệ để Robot tới đích, không có nhiều bước giải thích như bộ bài viết code. Dấu `{ }` là khối con được kéo vào bên trong khối "Lặp lại"/"Nếu...thì" (không xếp riêng ra ngoài).

**Quy tắc lồng khối** (đã kiểm tra đúng theo code hiện tại của trang chơi): chỉ được lồng **tối đa 1 cấp**. "Lặp lại" và "Nếu...thì" đều được coi là khối chứa (container) — 1 khối chứa có thể chứa các khối đơn (Đi tới, Rẽ trái, Rẽ phải) HOẶC 1 khối chứa còn lại (ví dụ Lặp lại chứa Nếu...thì, hoặc Nếu...thì chứa Lặp lại), nhưng **không được lồng thêm 1 lớp nữa** (ví dụ không thể có Lặp lại chứa Lặp lại chứa Lặp lại, cũng không thể có Lặp lại chứa Nếu...thì chứa Lặp lại — quá 1 cấp là bị chặn ngay khi kéo thả, không thả được).

Xem thêm [block-puzzle-answer-rubric.md](./block-puzzle-answer-rubric.md) nếu cần biết số khối tối thiểu và tiêu chí chấm Đạt/Khá/Giỏi chi tiết hơn — file này chỉ liệt kê nhanh đáp án.

---

## Sequence (Bài 1-5) — chỉ xếp tuần tự, chưa dùng Lặp lại/Nếu...thì

| Bài | Đáp án |
|---|---|
| 1. Đường Thẳng | Đi tới, Đi tới, Đi tới |
| 2. Rẽ Một Lần | Đi tới, Đi tới, Rẽ phải, Đi tới, Đi tới |
| 3. Hình Chữ L | Đi tới, Đi tới, Đi tới, Rẽ phải, Đi tới, Đi tới, Đi tới |
| 4. Nhặt Táo | Đi tới, Rẽ trái, Đi tới, Rẽ phải, Đi tới, Đi tới, Đi tới |
| 5. Đường Zíc-Zắc | Rẽ phải, Đi tới, Đi tới, Rẽ trái, Đi tới, Đi tới, Đi tới, Đi tới, Rẽ phải, Đi tới, Đi tới |

---

## Loop (Bài 6-10) — dùng khối "Lặp lại N lần"

| Bài | Đáp án |
|---|---|
| 6. Lặp Lại Đơn Giản | Lặp lại 4 lần { Đi tới } |
| 7. Lặp Rồi Rẽ | Lặp lại 3 lần { Đi tới }, Rẽ phải, Lặp lại 2 lần { Đi tới } |
| 8. Hình Vuông | Lặp lại 4 lần { Đi tới, Rẽ phải } |
| 9. Vòng Lặp Đường Dài | Lặp lại 4 lần { Đi tới }, Rẽ phải, Lặp lại 3 lần { Đi tới } |
| 10. Hình Chữ Nhật | Lặp lại 2 lần { Đi tới, Đi tới, Đi tới, Đi tới, Rẽ phải, Đi tới, Đi tới, Rẽ phải } |

---

## Condition (Bài 11-15) — dùng khối "Nếu phía trước có chướng ngại vật"

| Bài | Đáp án |
|---|---|
| 11. Nhận Biết Chướng Ngại | Đi tới, Nếu phía trước có chướng ngại vật { Rẽ phải }, Đi tới, Rẽ trái, Đi tới, Đi tới |
| 12. Vòng Lặp Có Điều Kiện | Lặp lại 6 lần { Nếu phía trước có chướng ngại vật { Rẽ trái, Đi tới, Rẽ phải, Đi tới, Đi tới, Rẽ phải, Đi tới, Rẽ trái }, Đi tới } |
| 13. Con Đường Nhiều Khúc Gỗ | Lặp lại 8 lần { Nếu phía trước có chướng ngại vật { Rẽ trái, Đi tới, Rẽ phải, Đi tới, Đi tới, Rẽ phải, Đi tới, Rẽ trái }, Đi tới } |
| 14. Đường Vòng Xa | Đi tới, Rẽ phải, Lặp lại 7 lần { Nếu phía trước có chướng ngại vật { Rẽ trái, Đi tới, Rẽ phải, Đi tới, Đi tới, Rẽ phải, Đi tới, Rẽ trái }, Đi tới } |
| 15. Thử Thách Cuối Cùng | Lặp lại 10 lần { Nếu phía trước có chướng ngại vật { Rẽ trái, Đi tới, Rẽ phải, Đi tới, Đi tới, Rẽ phải, Đi tới, Rẽ trái }, Đi tới } |

**Ghi chú bài 12/13/14/15**: cả 4 bài dùng chung 1 "quy tắc né khúc gỗ" giống hệt nhau (Rẽ trái, Đi tới, Rẽ phải, Đi tới, Đi tới, Rẽ phải, Đi tới, Rẽ trái — đi vòng qua 2 ô để né rồi quay lại đúng hàng cũ), khối "Nếu...thì" chứa quy tắc này được lồng bên trong khối "Lặp lại" — đúng 1 cấp lồng, không sai luật của trang chơi. Chỉ khác nhau ở số lần lặp và bài 14 có thêm 1 bước rẽ hướng ban đầu trước khi vào vòng lặp.
