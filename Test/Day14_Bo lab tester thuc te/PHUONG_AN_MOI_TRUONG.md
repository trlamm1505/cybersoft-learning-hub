# Phương án môi trường Ngày 14

## Quyết định

Không thêm trang Day14 vào learning-hub và không duy trì web lab riêng. Bộ lab dùng hai lớp:

1. **Demo thật** `demo1..demo6` để học viên thực hành UI, API, data reconciliation và automation.
2. **Fixture cục bộ** trong `fixtures/` để có fault chủ đích, manifest và reset mà không sửa dữ liệu hệ thống dùng chung.

## Giới hạn của demo thật

- Demo có thể đổi giao diện, endpoint và dữ liệu.
- Không cài fault hoặc reset toàn bộ demo.
- Chỉ thao tác trên tài khoản/dữ liệu của chính học viên.
- Endpoint, body và header phải lấy từ Swagger hoặc Network tại thời điểm chạy.

## Cơ chế fault và reset

- Mỗi lab có một cặp `fixtures/buggy/LAB-xx.json` và `fixtures/clean/LAB-xx.json`.
- `node fixtures/reset.mjs --mode buggy --lab LAB-xx` tạo trạng thái có lỗi trong `fixtures/runtime/`.
- `node fixtures/reset.mjs --mode clean --lab LAB-xx` tạo trạng thái đúng để kiểm tra lỗi biến mất.
- `fixtures/manifest.json` là tài liệu instructor, không phát trước cho học viên.
- LAB-09 còn có SQLite riêng để thực hành SQL và reset bằng `data/create_snapshot.py --clean`.

## Nghiệm thu

Thiết kế và automated fixture checks chỉ chứng minh bộ học liệu nhất quán. Trạng thái lab vẫn là `NEEDS PILOT` cho đến khi người học tự chạy, lưu evidence, cleanup và chấm theo rubric.
