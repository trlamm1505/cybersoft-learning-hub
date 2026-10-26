# AI WORK LOG - DAY 06

## Problem statement trước AI
Cần tạo API contract test cho auth/resource/exercise/submission, kiểm tra status code và error schema, có OpenAPI và mock fallback. Suite phải có ít nhất 25 test và CI phải fail khi contract/schema bị phá vỡ.

## AI hỗ trợ
- Đề xuất cấu trúc API suite.
- Sinh mock fallback FastAPI.
- Đề xuất contract baseline và nhóm test positive/negative/boundary.
- Đề xuất JUnit + contract report.

## Con người kiểm chứng
- Đọc các endpoint và schema.
- Chạy toàn bộ pytest độc lập.
- Xem OpenAPI `/docs` và `/openapi.json`.
- Chủ động tạo một breaking change nhỏ để xác nhận test/CI fail.
- Kiểm tra không có token/API key thật.

## Quyết định
- Chấp nhận error schema thống nhất để test dễ assert.
- Chấp nhận mock fallback vì hiện chưa có API thật được cung cấp.
- Khi có API thật sẽ chuyển fixture `client` sang BASE_URL thật nhưng giữ contract tests.
