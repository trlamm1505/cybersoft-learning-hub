# Demo breaking change

Mục tiêu: chứng minh suite có thể phát hiện schema bị phá vỡ.

1. Mở `app.py`.
2. Trong `ResourceResponse`, tạm xóa dòng `version: int`.
3. Chạy:

```powershell
python -m pytest tests/test_openapi_contract.py -v
```

Kỳ vọng có test FAIL với thông báo gần giống:

```text
Breaking change: ResourceResponse lost field version
```

4. Hoàn tác thay đổi, chạy lại toàn bộ suite và chụp PASS.

Đây là bằng chứng trực tiếp cho điều kiện: **CI fail khi schema vỡ**.
