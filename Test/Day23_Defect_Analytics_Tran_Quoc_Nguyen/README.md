# Ngày 23 — Defect analytics và root cause

**Người làm:** Trần Quốc Nguyên · **Kế hoạch:** QA AI Evaluation, Tuần 5 · **Kết quả chính:** biết lỗi nào lặp lại để cải tiến quy trình.

## Kết quả (cập nhật 07/10/2026 sau khi test lại web local, đếm từ `Defect_Log`)

| Chỉ số | Giá trị |
|---|---|
| Defect còn trong log | 36 (đã bỏ 25 lỗi đã hết, xem mục "Đã loại khỏi log") |
| Đang mở | 27 (6 lỗi mức High: DEF-018, 026, 033, 035, 050, 059) |
| Chờ kiểm lại / cần xác minh | 5 / 4 |
| Lỗi sản phẩm | 30 |
| Lỗi do môi trường, tài liệu, công cụ, hệ thống ngoài | 6 |
| Lỗi phát hiện ở Ngày 23 | 11 (7 từ test web 05/10, 4 từ test web 07/10) |

Ngày 07/10 đợt 2 (đăng nhập qua Chrome) tìm thêm 3 lỗi: bài do giáo viên soạn không thể đạt vì test ẩn chạy với input rỗng (DEF-059, High), check-syntax lộ đường dẫn máy chủ (DEF-060), trang kết quả quiz ghi câu chưa trả lời là "Sai" (DEF-061).

Kiểm lại ngày 07/10: lỗi lộ đường dẫn Windows trong stderr (RT-051), header ở tablet và viền focus đã cải thiện nên chuyển sang Retest; bot báo oan trên PR #99 đã sửa qua PR #101. Kiểm lại lỗi cũ ngày 05/10: BUG-02 (lượt quiz không gắn tài khoản) và RT-053 (code sai được Accepted khi bài không có test) **đã sửa**; lỗi thiếu label ở Login/Register và child safety của AI Coach **vẫn còn**.

## Top 5 nguyên nhân gốc (chi tiết ở sheet `RCA_Top5`)

1. **Component UI không theo chuẩn a11y/responsive** — 7 lỗi, 5 còn mở, 2 chờ kiểm lại.
2. **Học liệu đưa vào không qua gate tự động** — 6 lỗi, cả 6 còn mở (chạy lại validator ngày 07/10 vẫn báo).
3. **Không lọc thông tin nội bộ trước khi trả cho người dùng** — 6 lỗi, 3 còn mở.
4. **API không validate kiểu/định dạng input** — 4 lỗi, cả 4 còn mở.
5. **Guardrail AI chưa phủ child safety** — 1 defect gồm 10 case red-team.

Sau khi bỏ lỗi đã hết, nhóm thiếu test/gate (RC09, 5 lỗi) đứng thứ 4 theo số lượng nhưng toàn lỗi Medium/Low; lý do chọn top 5 ghi ở sheet `Pareto`.

## Bàn giao

| Yêu cầu kế hoạch | File |
|---|---|
| Defect dashboard | `Day23_Defect_Dashboard_Tran_Quoc_Nguyen.xlsx` — 8 sheet: README, Defect_Log, Taxonomy, Dashboard, Pareto, RCA_Top5, Prevention_Actions, AI_WORKLOG |
| RCA cho top 5 | sheet `RCA_Top5` |
| Prevention actions | sheet `Prevention_Actions` (14 action) |
| Bằng chứng test web | `evidence/live_test_2026-10-05.md`, `evidence/live_test_2026-10-07.md` |
| Bản Excel đã định dạng | `Day23_Defect_Dashboard_Tran_Quoc_Nguyen_formatted_v2.xlsx` (bản tester định dạng, đã cập nhật số liệu 07/10) |
| AI_WORKLOG | `AI_WORKLOG.md` và sheet `AI_WORKLOG` |
| Generator và kiểm chứng | `tools/defect_data.py`, `tools/build_defect_dashboard.py`, `tools/verify_defect_dashboard.py` |

## Chạy lại

```powershell
cd Test\Day23_Defect_Analytics_Tran_Quoc_Nguyen
py -m pip install openpyxl
py tools\build_defect_dashboard.py
py tools\verify_defect_dashboard.py
```

`verify` in 33 dòng PASS/FAIL và trả exit code 0 khi tất cả đạt. Muốn thêm/sửa defect: sửa `tools/defect_data.py` rồi chạy lại, không sửa tay trong Excel.

## Đối chiếu điều kiện nghiệm thu

| Điều kiện | Cách đáp ứng | Kiểm bằng |
|---|---|---|
| Phân biệt symptom/root cause | Hai cột riêng; root cause nêu lý do trong code/quy trình. Root cause còn là giả thuyết thì Status = Needs verification | `verify` mục B |
| Action có owner/deadline | 14 action có nhóm phụ trách đề xuất; chưa ai giao chính thức nên Owner xác nhận và Deadline ghi "Chưa xác nhận", Status = Proposed. 1 action đã xong (gate nội dung, PR #98) | `verify` mục E |
| Không dùng số liệu giả | Mỗi defect có file bằng chứng mở được; số trên Dashboard/Pareto là công thức đếm; ngày không có trong artefact ghi "Not recorded" | `verify` mục C, D |

## Đã loại khỏi log (07/10/2026)

Theo yêu cầu của tester, log chỉ giữ lỗi còn tồn tại hoặc chưa kết luận được. 25 lỗi đã bỏ (mã DEF không đánh số lại):

| Nhóm | Defect | Căn cứ |
|---|---|---|
| Fixed (21) | DEF-013, 016, 017, 025, 027, 028, 029, 030, 031, 038, 039, 040, 041, 042, 043, 044, 045, 046, 047, 048, 057 | Lỗi của công cụ/fixture/CI, đã sửa trong lúc làm bài, có bằng chứng sửa trong thư mục từng ngày và PR #98, #101 |
| Closed (2) | DEF-003, DEF-036 | Kiểm lại trên web local ngày 05/10 và 07/10 đều đạt |
| Không tái hiện (1) | DEF-001 | 07/10: chạy pytest Ngày 7 năm lần liên tiếp, đều 42/42 pass (chạy trên Linux, chưa chạy trên Windows) |
| Đã hết trên giao diện (1) | DEF-002 | 07/10: làm trọn đề HTML5, thẻ và đề khớp chủ đề và thời lượng; phần lệch số câu thuộc DEF-053 |

Lỗi cũ kiểm lại ngày 07/10 **vẫn còn** nên giữ: DEF-011 (#REF! trong xlsx Ngày 10), DEF-012 (2 lỗi CT004), DEF-014 và DEF-015 (QV017 55%, QV023/QV016), DEF-018 (bài số nguyên tố vẫn 4 test), DEF-019 (24 lần CP002), DEF-020 (3 lần CP013), DEF-022 (cắt stdout 64KB), DEF-023, DEF-049 (docx Ngày 22). Validator chạy trên commit `cb311b5`.

Chưa kiểm lại được, giữ nguyên: DEF-021, DEF-024, DEF-026 (hệ thống demo ngoài), DEF-032, DEF-035, DEF-037.

Hệ quả: Dashboard không còn số Fixed/Closed. Dữ liệu 25 lỗi đã bỏ vẫn nằm trong `tools/defect_data.py` (`REMOVED_1007`).

File phân tích: `Day23_Defect_Dashboard_Tran_Quoc_Nguyen_formatted.xlsx`. File bước tái hiện cho FE/BE: `Day23_Test_Cases_FAIL_Tran_Quoc_Nguyen.xlsx` (20 test case FAIL chạy trên web local ngày 07/10, mã DEF ở cột Notes). Script build ghi ra file riêng, không ghi đè file này.

## Giới hạn

- Owner và deadline **cần mentor/trưởng nhóm bổ sung**; hiện chỉ là đề xuất.
- Severity của nhiều lỗi do QA đề xuất (cột `Severity Source` = Proposed).
- Không tính được thời gian xử lý vì báo cáo gốc không ghi ngày sửa.
- Test web chạy trên DB local khác bộ seed trong repo. Ngày 07/10 đợt 2 test luồng Playground và Quiz qua Chrome bằng tài khoản học sinh; chưa có tài khoản giáo viên, chưa kiểm responsive ở 1024 px (DEF-010 chưa kết luận).
- Không đưa vào log: lỗi cố ý gài để thực hành (Ngày 6, 7, 14), finding trên file mẫu cố ý sai (Ngày 11, 12), mục CANDIDATE chưa kiểm (Ngày 14), và 3 lỗi của bản dashboard Ngày 21 vì không còn file bằng chứng.
- Test trực tiếp để lại dữ liệu trong DB local (2 tài khoản email sai định dạng, 4 lượt quiz 0 điểm, 2 bài nộp); xem mục C của 2 file evidence.

## Trình bày 3 phút

1. (30s) Mở `Dashboard`: 36 defect còn tồn tại, 27 đang mở, 6 lỗi High; 30 là lỗi sản phẩm.
2. (45s) Mở `Pareto`: giải thích vì sao top 5 không chọn thuần theo số lượng.
3. (60s) Mở `RCA_Top5`, đọc một nhóm (ví dụ API không validate input): symptom là 500, root cause là không bật ValidationPipe, action PA-01.
4. (30s) Mở `Defect_Log`, bấm "Mở" ở DEF-050 để tới file evidence.
5. (15s) AI sai ở đâu: định tính lỗi Ngày 21 dù không còn bằng chứng, định đếm 13 case red-team thành 13 defect; đã loại và gộp lại.
