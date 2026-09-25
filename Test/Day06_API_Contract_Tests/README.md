# NGÀY 06 - API CONTRACT TESTS

## Mục tiêu

Phát hiện API breaking change bằng contract tests cho 4 nhóm:

- auth
- resource
- exercise
- submission

Bộ này là **mock fallback** chạy độc lập khi chưa có API thật.

## Cấu trúc

```text
Day06_API_Contract_Tests/
├── app.py                         # Mock fallback FastAPI + OpenAPI
├── contracts/
│   └── required_contract.json     # Contract baseline bắt buộc
├── tests/
│   ├── conftest.py
│   ├── helpers.py
│   ├── test_auth_contract.py
│   ├── test_resource_contract.py
│   ├── test_exercise_contract.py
│   ├── test_submission_contract.py
│   └── test_openapi_contract.py
├── reports/
├── generate_contract_report.py
├── run_tests.ps1
├── run_mock_api.ps1
├── requirements.txt
└── pytest.ini
```

## 1. Cài thư viện

```powershell
python -m pip install -r requirements.txt
```

## 2. Chạy API mock để xem Swagger/OpenAPI

```powershell
python -m uvicorn app:app --reload
```

Mở trình duyệt:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/openapi.json
```

## 3. Chạy contract tests

```powershell
python -m pytest -v --junitxml=reports/junit.xml
```

Hoặc:

```powershell
.\run_tests.ps1
```

Sau khi PASS:

```powershell
python generate_contract_report.py
```

## 4. Cơ chế phát hiện breaking change

`contracts/required_contract.json` định nghĩa các path/method và response field bắt buộc.

Ví dụ `ResourceResponse` phải có:

```json
["id", "name", "type", "version"]
```

Nếu developer xóa `version` khỏi response model, test OpenAPI sẽ FAIL với thông báo dạng:

```text
Breaking change: ResourceResponse lost field version
```

Vì pytest trả exit code khác 0, CI cũng fail.

## 5. Positive / Negative / Boundary

- Positive: login đúng, tạo resource/exercise/submission hợp lệ.
- Negative: sai password, resource không tồn tại, invalid type, unknown user/exercise.
- Boundary: password 5/6 ký tự, resource name 50/51, max_score 0/101, answer 1/5000/5001.

## 6. Error schema chuẩn

Mọi lỗi do mock kiểm soát dùng cấu trúc:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request data is invalid",
    "details": {}
  }
}
```

Contract tests kiểm tra cả status code lẫn cấu trúc lỗi.

## 7. Khi có API thật

Giữ lại `tests/` và contract baseline, sau đó đổi `client` trong `conftest.py` thành HTTP client gọi `BASE_URL` của hệ thống thật. Mock FastAPI vẫn giữ làm fallback khi môi trường thật unavailable.

## 8. Bằng chứng cần chụp

1. Terminal `pytest` tất cả PASS.
2. Swagger `/docs` hiển thị các endpoint.
3. `reports/contract_report.md`.
4. Demo breaking change: tạm xóa field `version` khỏi `ResourceResponse`, chạy lại để thấy FAIL, sau đó hoàn tác.
