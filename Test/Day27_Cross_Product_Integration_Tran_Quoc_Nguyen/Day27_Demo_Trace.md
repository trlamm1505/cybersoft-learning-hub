# Demo trace Ngày 27

## Trace chính

1. **Resource Registry** trả dataset/evaluation set có ID, version, schema và checksum.
2. **Learning Hub** map dữ liệu ngoài sang contract nội bộ; không trả `sandbox_db_url` cho trình duyệt.
3. **Assignment/Lab** khóa đúng resource/evaluation set để học viên làm cùng một phiên bản.
4. **Submission** lưu bài theo học viên và bài tập; lần nộp sau cập nhật đúng bản ghi thay vì tạo rác.
5. **Evaluation** chấm kết quả, lưu điểm/lịch sử và giữ thông tin đủ để tái lập.
6. **Teacher review** chỉ TEACHER/ADMIN được chấm; STUDENT nhận 403.

## Failure paths đã kiểm

- Resource ID có ký tự đường dẫn bị từ chối.
- Registry trả 404, 5xx hoặc mất kết nối được chuyển thành lỗi rõ ràng.
- Không âm thầm fallback nếu server có phản hồi 404.
- Evaluation set thiếu đáp án chuẩn bị từ chối, không chấm thiếu.
- Student gọi API review bị 403.
- Submission bị SQL guard từ chối không được lưu.
- Bài AI thiếu `solutionCode` không được publish.
- Chuỗi giống API key bị chặn trước khi chấm hoặc lưu.

## Cleanup và tính lặp lại

- Test dùng fixture/fake model in-memory; mỗi test dựng state mới.
- Không ghi dữ liệu vào Mongo/Postgres thật trong lần chạy mặc định.
- Jest kết thúc là fixture được giải phóng, không cần xóa tay.

## Kết quả demo hiện tại

Bản clone, có Registry thật (`http://127.0.0.1:8000`), 10/10/2026 21:23: `6 suites passed; 90 tests passed; 0 skipped; 0 failed; exit code 0.`

Hai case LIVE contract đã chạy thật và PASS (cấu trúc 3 endpoint; checksum CSV và số dòng). Lần chạy đầu trên repo cũ không có Registry thật cho 83 PASS, 2 SKIP.

Chuỗi nộp -> chấm -> giảng viên review đã chạy thật trên web local, 19/19 bước PASS (`evidence/day27-live-chain.md`), trong đó student gọi API review nhận 403 và kết quả AI Lab tái lập (cùng điểm, hash, seed). Còn lại `D27-GAP-003`: lần chạy đó BE dùng Registry tích hợp sẵn, chưa chạy với BE gọi Registry thật.
