# Answer Key & Rubric — Bộ 15 bài Block Puzzle

Mỗi bài dưới đây có **1 lời giải mẫu hợp lệ** (không phải lời giải duy nhất — nếu học sinh xếp khối theo cách khác nhưng vẫn tới đích đúng và không vượt quá `maxBlocks`, vẫn được coi là đúng). Từ khối "Lặp lại N lần" và "Nếu phía trước có chướng ngại vật" trở đi, các khối bên trong dấu `{ }` là khối con được kéo vào bên trong khối đó (không phải xếp riêng bên ngoài).

## Rubric chấm chung (áp dụng cho cả 15 bài)

| Mức | Tiêu chí |
|---|---|
| **Đạt** | Robot tới đích, có thể dùng nhiều hơn số khối tối thiểu, đã dùng gợi ý 3 |
| **Khá** | Robot tới đích, số khối gần với số khối tối thiểu (không quá 1.5 lần), dùng tối đa gợi ý 2 |
| **Giỏi** | Robot tới đích đúng bằng số khối tối thiểu hoặc gần nhất, không cần dùng gợi ý 3, thể hiện đã hiểu đúng khái niệm của bài (dùng vòng lặp ở bài loop, dùng điều kiện ở bài condition thay vì liệt kê thủ công) |

Số khối được đếm cả khối con bên trong "Lặp lại"/"Nếu..." (ví dụ "Lặp lại 4 lần { Đi tới, Rẽ phải }" tính là 3 khối: 1 Lặp lại + 2 khối con), khớp với cách đếm hiển thị trên màn hình chơi ("Xếp khối lệnh theo thứ tự — X/maxBlocks").

---

## Sequence (Bài 1-5)

| Bài | Lời giải mẫu | Số khối tối thiểu |
|---|---|---|
| 1. Đường Thẳng | Đi tới ×3 | 3 |
| 2. Rẽ Một Lần | Đi tới ×2, Rẽ phải, Đi tới ×2 | 5 |
| 3. Hình Chữ L | Đi tới ×3, Rẽ phải, Đi tới ×3 | 7 |
| 4. Nhặt Táo | Đi tới, Rẽ trái, Đi tới, Rẽ phải, Đi tới ×3 | 7 |
| 5. Đường Zíc-Zắc | Rẽ phải, Đi tới ×2, Rẽ trái, Đi tới ×4, Rẽ phải, Đi tới ×2 | 11 |

**Tiêu chí riêng cho Sequence**: học sinh Giỏi cần thể hiện xếp đúng thứ tự ngay từ lần thử đầu tiên hoặc thứ hai, không xếp ngẫu nhiên rồi sửa nhiều lần.

## Loop (Bài 6-10)

| Bài | Lời giải mẫu | Số khối tối thiểu (đã tính khối con) |
|---|---|---|
| 6. Lặp Lại Đơn Giản | Lặp lại 4 lần { Đi tới } | 2 khối (1 Lặp lại + 1 khối con), thay vì 4 khối Đi tới riêng lẻ |
| 7. Lặp Rồi Rẽ | Lặp lại 3 lần { Đi tới }, Rẽ phải, Lặp lại 2 lần { Đi tới } | 5 khối |
| 8. Hình Vuông | Lặp lại 4 lần { Đi tới, Rẽ phải } | 3 khối (1 Lặp lại + 2 khối con: Đi tới và Rẽ phải cùng nằm bên trong) |
| 9. Vòng Lặp Đường Dài | Lặp lại 4 lần { Đi tới }, Rẽ phải, Lặp lại 3 lần { Đi tới } | 5 khối |
| 10. Hình Chữ Nhật | Lặp lại 2 lần { Đi tới ×4, Rẽ phải, Đi tới ×2, Rẽ phải } | 9 khối (1 Lặp lại + 8 khối con — **chỉ lồng 1 cấp**, không lồng Lặp lại trong Lặp lại) |

**Tiêu chí riêng cho Loop**: mức Giỏi nên dùng khối "Lặp lại N lần" thay vì liệt kê thủ công nhiều khối "Đi tới" giống nhau, vì đây là mục tiêu học tập của nhóm bài này. Nếu học sinh vẫn giải bằng cách liệt kê thủ công (ra kết quả đúng nhưng chưa dùng vòng lặp), có thể xếp mức Đạt/Khá và ghi chú lại để ôn thêm khái niệm vòng lặp. Riêng bài 8 và 10, việc liệt kê thủ công thực chất **không thể tới đích** (vì chỉ có khối "Rẽ phải", không có "Rẽ trái" — muốn quay đủ 1 vòng vuông/chữ nhật để về đúng vị trí ban đầu buộc phải lặp lại nhóm hành động), nên đây là 2 bàiép buộc chặt nhất trong nhóm Loop.

## Condition (Bài 11-15)

| Bài | Lời giải mẫu | Số khối tối thiểu |
|---|---|---|
| 11. Nhận Biết Chướng Ngại | Đi tới, Nếu phía trước có chướng ngại vật { Rẽ phải }, Đi tới, Rẽ trái, Đi tới ×2 | 7 khối |
| 12. Vòng Lặp Có Điều Kiện | Lặp lại 6 lần { Nếu phía trước có chướng ngại vật { Rẽ trái, Đi tới, Rẽ phải, Đi tới ×2, Rẽ phải, Đi tới, Rẽ trái }, Đi tới } | 11 khối (so với 17 khối nếu liệt kê thủ công) |
| 13. Con Đường Nhiều Khúc Gỗ | Lặp lại 8 lần { Nếu phía trước có chướng ngại vật { Rẽ trái, Đi tới, Rẽ phải, Đi tới ×2, Rẽ phải, Đi tới, Rẽ trái }, Đi tới } | 11 khối (so với 23 khối nếu liệt kê thủ công) |
| 14. Đường Vòng Xa | Đi tới, Rẽ phải, rồi Lặp lại 7 lần { Nếu phía trước có chướng ngại vật {...} , Đi tới } (cùng nhóm điều kiện như bài 12-13) | 13 khối (so với 16 khối nếu liệt kê thủ công) |
| 15. Thử Thách Cuối Cùng | Lặp lại 10 lần { Nếu phía trước có chướng ngại vật {...} , Đi tới } | 11 khối (so với 29 khối nếu liệt kê thủ công) |

**Tiêu chí riêng cho Condition**:
- **Bài 11** là bài làm quen cú pháp khối điều kiện — không ép tối ưu số khối ở bài này, chấp nhận cả cách giải đúng nhưng chưa gọn.
- **Bài 12, 13, 15** dùng chung 1 "quy tắc né khúc gỗ" (Rẽ trái, Đi tới, Rẽ phải, Đi tới ×2, Rẽ phải, Đi tới, Rẽ trái — đi vòng qua đúng 2 ô để né khúc gỗ rồi quay lại đúng hàng cũ), chỉ khác số lần lặp theo độ dài con đường. Mức Giỏi ở 3 bài này bắt buộc phải dùng đúng kết hợp Lặp lại + Nếu...thì, vì cách liệt kê thủ công tốn gấp 1.5-2.6 lần số khối và vượt quá giới hạn `maxBlocks` cho phép.
- **Bài 14** thêm 1 bước rẽ hướng ban đầu (đi 1 bước, rẽ phải) trước khi áp dụng đúng quy tắc như bài 12-13 — kiểm tra học sinh có tự nhận ra cần đổi hướng trước khi vào vòng lặp không.

## Ghi chú tổng thể khi dùng rubric

- Rubric này ưu tiên **quá trình tư duy** hơn "đúng/sai nhị phân" — một học sinh dùng nhiều khối hơn số tối thiểu nhưng tự mình sửa lỗi qua nhiều lần thử vẫn đang thể hiện đúng kỹ năng debug, nên không nên chỉ chấm điểm theo số lần thử.
- Với các bài Condition (11-15), giáo viên nên hỏi lại học sinh "vì sao con đặt khối Nếu... ở đây?" để xác nhận học sinh hiểu bản chất điều kiện, chứ không chỉ ghép đúng bằng cách thử ngẫu nhiên.
- Toàn bộ lời giải mẫu trong tài liệu này đã được kiểm chứng chạy đúng bằng cách mô phỏng lại chính xác logic tính điểm của trang chơi (không chỉ tính bằng tay) — nếu học sinh nhập đúng các khối theo thứ tự ghi trên, Robot sẽ tới đích thành công.
